package com.example.smartcity.rag.selfrag;

import com.example.smartcity.ai_orchestrator.adapter.GroqAdapter;
import com.example.smartcity.rag.model.DocumentChunk;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Semaphore;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * [LAYER 9 — NÂNG CAO] SELF-RAG SERVICE
 *
 * Cho phép hệ thống RAG tự đánh giá chất lượng kết quả của mình:
 *
 * 1. Relevance Grading: Chunk có thực sự liên quan đến câu hỏi không? (0.0 - 1.0)
 * 2. Hallucination Check: Câu trả lời AI có "bịa" thêm thông tin không có trong context?
 *
 * Đã sửa: Sử dụng GroqAdapter (LLM) để đánh giá thực sự thay vì Mock heuristic.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class SelfRagService {

    private final GroqAdapter groqAdapter;
    private final ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();
    // Giới hạn 3 luồng gọi LLM song song để tránh Rate Limit (429)
    private final Semaphore rateLimiter = new Semaphore(3);

    // Ngưỡng chấp nhận (có thể cấu hình từ application.properties)

    /**
     * Chấm điểm mức độ liên quan của một chunk với câu hỏi.
     *
     * @param question Câu hỏi người dùng
     * @param chunk    Nội dung chunk cần đánh giá
     * @return Điểm relevance [0.0, 1.0] — cao hơn = liên quan hơn
     */
    public double gradeRelevance(String question, String chunk) {
        if (question == null || chunk == null) return 0.0;

        try {
            String systemPrompt = "Chấm điểm mức độ liên quan của đoạn văn với câu hỏi. " +
                                  "Chỉ trả về số từ 0.0 đến 1.0. KHÔNG giải thích thêm.";
            String userMessage = "Câu hỏi: " + question + "\n\nĐoạn văn: " + chunk;
            
            String verdict = groqAdapter.generateResponseAsync(systemPrompt, userMessage).get();
            Matcher m = Pattern.compile("0\\.\\d+|1\\.0").matcher(verdict);
            return m.find() ? Double.parseDouble(m.group()) : 0.0;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("⚠️ [Self-RAG] Thread bị ngắt", e);
            return computeKeywordOverlapScore(question, chunk);
        } catch (Exception e) {
            log.warn("⚠️ [Self-RAG] Lỗi gọi LLM chấm điểm relevance, dùng fallback: {}", e.getMessage());
            // Fallback: Tính điểm bằng keyword overlap (heuristic đơn giản)
            return computeKeywordOverlapScore(question, chunk);
        }
    }

    /**
     * Chấm điểm mức độ liên quan cho nhiều chunk cùng lúc (Batching).
     * Tránh lỗi N+1 Query.
     */
    public List<Double> batchGradeRelevance(String question, List<DocumentChunk> chunks) {
        if (question == null || chunks == null || chunks.isEmpty()) return Collections.emptyList();

        List<Double> scores = new ArrayList<>(Collections.nCopies(chunks.size(), 0.0));
        ObjectMapper mapper = new ObjectMapper();
        
        // Chia batch để tránh quá Context Window (ví dụ: tối đa 5 chunk/batch)
        List<List<DocumentChunk>> batches = new ArrayList<>();
        for (int i = 0; i < chunks.size(); i += 5) {
            batches.add(chunks.subList(i, Math.min(i + 5, chunks.size())));
        }

        List<CompletableFuture<Void>> futures = new ArrayList<>();
        int globalIndex = 0;
        
        for (List<DocumentChunk> batch : batches) {
            final int startIndex = globalIndex;
            CompletableFuture<Void> future = CompletableFuture.runAsync(() -> {
                try {
                    // Chờ cấp phép từ Semaphore
                    rateLimiter.acquire();
                    
                    StringBuilder promptBuilder = new StringBuilder("Chấm điểm mức độ liên quan của từng đoạn văn với câu hỏi.\n");
                    promptBuilder.append("Câu hỏi: ").append(question).append("\n\n");
                    
                    for (int i = 0; i < batch.size(); i++) {
                        promptBuilder.append("--- Đoạn văn ").append(i + 1).append(" ---\n");
                        promptBuilder.append(batch.get(i).getContent()).append("\n\n");
                    }
                    
                    promptBuilder.append("Trả về mảng JSON chứa các điểm số từ 0.0 đến 1.0, theo đúng thứ tự. ");
                    promptBuilder.append("BẮT BUỘC định dạng: {\"scores\": [0.9, 0.2]}. KHÔNG giải thích thêm.");
                    
                    String verdict = groqAdapter.generateResponseAsync("Bạn là chuyên gia phân loại tài liệu. Luôn trả về JSON.", promptBuilder.toString()).get();
                    
                    String cleanJson = cleanAndExtractJson(verdict);
                    JsonNode rootNode = mapper.readTree(cleanJson.trim());
                    JsonNode scoresArray = rootNode.path("scores");
                    
                    if (scoresArray.isArray() && scoresArray.size() == batch.size()) {
                        for (int i = 0; i < batch.size(); i++) {
                            scores.set(startIndex + i, scoresArray.get(i).asDouble());
                        }
                    } else {
                        throw new RuntimeException("LLM sinh JSON thiếu/dư mảng điểm số");
                    }
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    log.error("⚠️ [Self-RAG] Thread bị ngắt khi chấm batch", e);
                    for (int i = 0; i < batch.size(); i++) {
                        scores.set(startIndex + i, computeKeywordOverlapScore(question, batch.get(i).getContent()));
                    }
                } catch (Exception e) {
                    log.warn("⚠️ [Self-RAG] Lỗi gọi LLM chấm batch, dùng fallback: {}", e.getMessage());
                    for (int i = 0; i < batch.size(); i++) {
                        scores.set(startIndex + i, computeKeywordOverlapScore(question, batch.get(i).getContent()));
                    }
                } finally {
                    // Trả lại cấp phép
                    rateLimiter.release();
                }
            }, executor);
            
            futures.add(future);
            globalIndex += batch.size();
        }
        
        // Đợi tất cả batch hoàn thành
        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
        
        return scores;
    }

    /**
     * Kiểm tra hallucination: Câu trả lời AI có hoàn toàn dựa trên context không?
     *
     * @param answer  Câu trả lời do LLM sinh ra
     * @param context Context đã được cung cấp cho LLM
     * @return true nếu câu trả lời không bịa thêm thông tin
     */
    public boolean isGrounded(String answer, String context) {
        if (answer == null || context == null) return false;

        try {
            String systemPrompt = "Kiểm tra xem câu trả lời có hoàn toàn dựa trên ngữ cảnh không. " +
                                  "Trả về YES nếu không có thông tin bịa thêm, NO nếu có.";
            String userMessage = "Ngữ cảnh:\n" + context + "\n\nCâu trả lời:\n" + answer;
            
            String verdict = groqAdapter.generateResponseAsync(systemPrompt, userMessage).get();
            return verdict.trim().toUpperCase().contains("YES");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("⚠️ [Self-RAG] Thread bị ngắt", e);
            return false;
        } catch (Exception e) {
            log.warn("⚠️ [Self-RAG] Lỗi gọi LLM kiểm tra hallucination: {}", e.getMessage());
            return false; // Fast-fail fallback để tránh ảo giác
        }
    }

    // ──────────────────────────────────────────────────────────────
    //  FALLBACK MOCK HELPERS
    // ──────────────────────────────────────────────────────────────

    /**
     * Tính điểm relevance bằng tỉ lệ keyword overlap (Jaccard-inspired).
     * Đây là approximation đơn giản, không chính xác bằng LLM grading.
     */
    private double computeKeywordOverlapScore(String question, String chunk) {
        String[] qWords = tokenize(question);
        if (qWords.length == 0) return 0.0;

        java.util.Set<String> queryTokens = new java.util.HashSet<>(java.util.Arrays.asList(qWords));
        java.util.Set<String> chunkTokens = new java.util.HashSet<>(java.util.Arrays.asList(tokenize(chunk)));

        int originalSize = queryTokens.size();
        queryTokens.retainAll(chunkTokens);
        
        double score = (double) queryTokens.size() / originalSize;
        
        // Bonus nếu overlap cao
        if (score > 0.3) score = Math.min(1.0, score * 1.2);

        return score;
    }

    private String[] tokenize(String text) {
        return text.toLowerCase()
            .replaceAll("[^a-zA-Z0-9\\u3040-\\u30FF\\u4E00-\\u9FFF\\u0100-\\u024F ]", "")
            .split("\\s+");
    }

    private String cleanAndExtractJson(String rawResponse) {
        if (rawResponse == null) {
            return "";
        }
        String content = rawResponse.trim();
        int firstBrace = content.indexOf('{');
        int firstBracket = content.indexOf('[');
        int startIndex = -1;
        
        if (firstBrace != -1 && firstBracket != -1) {
            startIndex = Math.min(firstBrace, firstBracket);
        } else if (firstBrace != -1) {
            startIndex = firstBrace;
        } else if (firstBracket != -1) {
            startIndex = firstBracket;
        }
        
        int lastBrace = content.lastIndexOf('}');
        int lastBracket = content.lastIndexOf(']');
        int endIndex = -1;
        
        if (lastBrace != -1 && lastBracket != -1) {
            endIndex = Math.max(lastBrace, lastBracket);
        } else if (lastBrace != -1) {
            endIndex = lastBrace;
        } else if (lastBracket != -1) {
            endIndex = lastBracket;
        }
        
        if (startIndex != -1 && endIndex != -1 && startIndex < endIndex) {
            return content.substring(startIndex, endIndex + 1);
        }
        return content;
    }
}



