package com.example.smartcity.rag.generation;

import com.example.smartcity.ai_orchestrator.adapter.GeminiAdapter;
import com.example.smartcity.ai_orchestrator.adapter.GroqAdapter;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * [LAYER 6] QUERY TRANSFORMER — Biến đổi câu hỏi trước khi tìm kiếm.
 *
 * Hai chiến lược chính:
 *
 * 1️⃣  HyDE (Hypothetical Document Embedding):
 *     Thay vì tìm vector của CÂU HỎI (ngắn, ít thông tin),
 *     hãy tạo ra một "câu trả lời giả định" (dài hơn, nhiều ngữ cảnh hơn)
 *     và tìm vector của ĐÁP ÁN GIẢ ĐỊNH đó.
 *     → Kết quả gần với chunk chứa đáp án thật hơn.
 *
 * 2️⃣  Multi-Query:
 *     Viết lại câu hỏi thành 3 cách diễn đạt khác nhau,
 *     tìm kiếm song song tất cả, gộp kết quả → bắt được nhiều chunk hơn.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class QueryTransformer {

    private final GroqAdapter groqAdapter;
    private final GeminiAdapter geminiAdapter;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * HyDE: Tạo câu trả lời giả định cho câu hỏi.
     * Mục tiêu: Vector của câu trả lời giả định ≈ vector của chunk chứa đáp án thật.
     *
     * @param originalQuery Câu hỏi gốc từ người dùng
     * @return Câu trả lời giả định (chưa kiểm chứng thực tế)
     */
    public String applyHyDE(String originalQuery) {
        log.debug("🧪 [HyDE] Tạo hypothetical answer cho: '{}'", originalQuery);

        String systemPrompt = "Viết một đoạn văn ngắn 2-3 câu như thể đang trả lời câu hỏi sau. " +
                              "Viết theo phong cách tài liệu hướng dẫn kỹ thuật hoặc văn bản hành chính đô thị.";
        try {
            return callLLM(systemPrompt, originalQuery);
        } catch (Exception e) {
            log.warn("⚠️ [HyDE] Lỗi khi gọi LLM cho HyDE, dùng fallback: {}", e.getMessage());
            // Fallback: Trả về câu hỏi gốc kèm prefix tối giản
            return String.format(
                "Câu trả lời cho câu hỏi '%s' là: Dựa trên kiến thức về Đô thị thông minh (Smart City), " +
                "khái niệm này liên quan đến việc tối ưu hóa hạ tầng, kết nối IoT và nâng cao chất lượng cuộc sống người dân.",
                originalQuery
            );
        }
    }

    /**
     * Multi-Query: Viết lại câu hỏi thành nhiều biến thể để mở rộng tìm kiếm.
     *
     * @param query Câu hỏi gốc
     * @return Danh sách 3 biến thể khác nhau + câu hỏi gốc
     */
    public List<String> expandQuery(String query) {
        log.debug("🔀 [MULTI-QUERY] Mở rộng câu hỏi: '{}'", query);

        String systemPrompt = "Viết lại câu hỏi sau thành 3 biến thể ngắn gọn khác nhau. " +
                              "Mỗi biến thể dùng từ ngữ khác nhau nhưng cùng ý nghĩa. " +
                              "Trả về định dạng JSON duy nhất dưới dạng mảng chuỗi, ví dụ: [\"biến thể 1\", \"biến thể 2\", \"biến thể 3\"]. " +
                              "BẮT BUỘC KHÔNG giải thích gì thêm ngoài mảng JSON.";
        try {
            String response = callLLM(systemPrompt, query);
            String cleanJson = cleanAndExtractJson(response);
            JsonNode node = objectMapper.readTree(cleanJson);
            List<String> variants = new ArrayList<>();
            variants.add(query); // Luôn giữ câu hỏi gốc ở đầu
            if (node.isArray()) {
                for (JsonNode item : node) {
                    variants.add(item.asText());
                }
            }
            return variants;
        } catch (Exception e) {
            log.warn("⚠️ [MULTI-QUERY] Lỗi khi mở rộng câu hỏi, dùng fallback: {}", e.getMessage());
            return List.of(
                query,
                "Giải thích " + query,
                query + " trong smart city",
                "Cách sử dụng " + query + " như thế nào?"
            );
        }
    }

    /**
     * Query Decomposition: Phân rã câu hỏi phức tạp thành các câu hỏi con đơn giản.
     * Dùng cho câu hỏi multi-hop (cần nhiều bước suy luận).
     *
     * @param complexQuery Câu hỏi phức tạp
     * @return Danh sách câu hỏi con
     */
    public List<String> decompose(String complexQuery) {
        log.debug("🔬 [DECOMPOSE] Phân rã câu hỏi: '{}'", complexQuery);

        String systemPrompt = "Phân rã câu hỏi phức tạp sau thành tối đa 3 câu hỏi con đơn giản, độc lập và có thể trả lời riêng lẻ. " +
                              "Trả về định dạng JSON duy nhất dưới dạng mảng chuỗi, ví dụ: [\"câu hỏi con 1\", \"câu hỏi con 2\"]. " +
                              "BẮT BUỘC KHÔNG giải thích gì thêm ngoài mảng JSON.";
        try {
            String response = callLLM(systemPrompt, complexQuery);
            String cleanJson = cleanAndExtractJson(response);
            JsonNode node = objectMapper.readTree(cleanJson);
            List<String> subQueries = new ArrayList<>();
            if (node.isArray()) {
                for (JsonNode item : node) {
                    subQueries.add(item.asText());
                }
            }
            return subQueries.isEmpty() ? List.of(complexQuery) : subQueries;
        } catch (Exception e) {
            log.warn("⚠️ [DECOMPOSE] Lỗi khi phân rã câu hỏi, dùng fallback: {}", e.getMessage());
            return List.of(complexQuery);
        }
    }

    /**
     * Helper gọi LLM với fallback từ Groq sang Gemini.
     */
    private String callLLM(String systemPrompt, String userMessage) throws Exception {
        try {
            if (groqAdapter.isHealthy()) {
                return groqAdapter.generateResponseAsync(systemPrompt, userMessage).get();
            }
        } catch (Exception e) {
            log.warn("⚠️ [QueryTransformer] Groq error, falling back to Gemini: {}", e.getMessage());
        }
        return geminiAdapter.generateResponseAsync(systemPrompt, userMessage).get();
    }

    /**
     * Làm sạch và trích xuất chuỗi JSON từ phản hồi thô của LLM.
     */
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
