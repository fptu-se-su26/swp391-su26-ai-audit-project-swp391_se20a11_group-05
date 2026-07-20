package com.example.smartcity.rag.generation;

import com.example.smartcity.ai_orchestrator.adapter.GeminiAdapter;
import com.example.smartcity.ai_orchestrator.adapter.GroqAdapter;
import com.example.smartcity.ai_orchestrator.pool.GroqKeyPool;
import com.example.smartcity.rag.model.*;
import com.example.smartcity.rag.retrieval.ContextCompressor;
import com.example.smartcity.rag.retrieval.HybridRetriever;
import com.example.smartcity.rag.retrieval.RrfFusionService;
import com.example.smartcity.rag.selfrag.SelfRagService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.DisposableBean;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import org.slf4j.MDC;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * [LAYER 7] HYBRID RAG ORCHESTRATOR — Pipeline chính từ đầu đến cuối.
 *
 * Luồng xử lý đầy đủ:
 * ─────────────────────────────────────────────────────────────────
 * 1. QueryTransformer → HyDE / Multi-Query (tùy option)
 * 2. HybridRetriever → Song song: Vector + BM25
 * 3. RrfFusionService → Trộn kết quả bằng RRF algorithm
 * 4. SelfRagService → Lọc chunk kém liên quan (Grading)
 * 5. ContextCompressor → Nén context vừa vặn với context window
 * 6. LLM Call → Gọi AI sinh câu trả lời có trích dẫn
 * 7. SelfRagService → Kiểm tra hallucination trước khi trả về
 * 8. CitationExtractor → Tạo danh sách nguồn trích dẫn
 * ─────────────────────────────────────────────────────────────────
 *
 * ⚠️ LLM Call hiện tại là MOCK. Thay bằng Spring AI ChatClient khi tích hợp.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class HybridRagOrchestrator implements DisposableBean {

    private final HybridRetriever hybridRetriever;
    private final RrfFusionService rrfFusionService;
    private final ContextCompressor contextCompressor;
    private final QueryTransformer queryTransformer;
    private final CitationExtractor citationExtractor;
    private final SelfRagService selfRagService;
    private final LlmExecutionService llmExecutionService;
    private final com.example.smartcity.rag.metrics.RagMetrics metrics;
    private final GroqAdapter groqAdapter;
    private final GeminiAdapter geminiAdapter;

    private final ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();

    @Value("${rag.grading.threshold:0.4}")
    private double gradingThreshold;



    /**
     * Xử lý một câu hỏi RAG hoàn chỉnh.
     *
     * @param request Câu hỏi và cấu hình tìm kiếm
     * @return Câu trả lời + nguồn trích dẫn + metadata kỹ thuật
     */
    public RagResponse query(RagRequest request) {
        return query(request, null);
    }

    public RagResponse query(RagRequest request, String systemPromptOverride) {
        MDC.put("traceId", UUID.randomUUID().toString());
        metrics.recordQuery();
        long pipelineStart = System.currentTimeMillis();
        log.info("═══════════════════════════════════════════════════════");
        log.info("📨 [RAG] Câu hỏi mới: '{}'", request.question());

        try {
            // ──────────────────────────────────────────────────────────
        // BƯỚC 0: Agentic Intent Routing & Tool Calling (Giai đoạn 3.1)
        // ──────────────────────────────────────────────────────────
        String toolContext = "";

        // ──────────────────────────────────────────────────────────
        // BƯỚC 1: Query Transformation & BƯỚC 2: Tìm kiếm kép Song Song (Vector + BM25)
        // ──────────────────────────────────────────────────────────
        long retrievalStart = System.currentTimeMillis();
        List<DocumentChunk> allVectorChunks = new ArrayList<>();
        List<DocumentChunk> allBm25Chunks = new ArrayList<>();
        int rawVectorCount = 0;
        int rawBm25Count = 0;
        String effectiveQuery = request.question();

        if (request.options().useMultiQuery()) {
            List<String> queries = queryTransformer.expandQuery(request.question());
            log.info("   [Multi-Query] Mở rộng câu hỏi thành {} biến thể: {}", queries.size(), queries);

            List<CompletableFuture<HybridRetrievalResult>> futures = queries.stream()
                .map(q -> CompletableFuture.supplyAsync(() -> hybridRetriever.retrieve(q, request.options()), executor))
                .toList();

            CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();

            for (var future : futures) {
                try {
                    HybridRetrievalResult res = future.join();
                    allVectorChunks.addAll(res.vectorChunks());
                    allBm25Chunks.addAll(res.bm25Chunks());
                } catch (Exception e) {
                    log.error("⚠️ [Multi-Query] Lỗi khi retrieve song song: {}", e.getMessage());
                }
            }
            rawVectorCount = allVectorChunks.size();
            rawBm25Count = allBm25Chunks.size();
        } else {
            if (request.options().useHyDE()) {
                effectiveQuery = queryTransformer.applyHyDE(request.question());
                if (log.isDebugEnabled()) {
                    log.debug("   [HyDE] Query biến đổi thành: '{}'...",
                            effectiveQuery.substring(0, Math.min(80, effectiveQuery.length())));
                }
            }
            HybridRetrievalResult rawResults = hybridRetriever.retrieve(effectiveQuery, request.options());
            allVectorChunks.addAll(rawResults.vectorChunks());
            allBm25Chunks.addAll(rawResults.bm25Chunks());
            rawVectorCount = rawResults.vectorChunks().size();
            rawBm25Count = rawResults.bm25Chunks().size();
        }

        long retrievalLatency = System.currentTimeMillis() - retrievalStart;
        metrics.recordRetrievalLatency(retrievalLatency);

        log.info("   [Retrieval] Tổng Vector: {} | Tổng BM25: {} | Latency: {} ms",
                rawVectorCount, rawBm25Count, retrievalLatency);

        // ──────────────────────────────────────────────────────────
        // BƯỚC 3: RRF Fusion — Trộn kết quả
        // ──────────────────────────────────────────────────────────
        List<DocumentChunk> fusedChunks = rrfFusionService.fuse(
                allVectorChunks,
                allBm25Chunks,
                request.options().topK());
        log.info("   [RRF Fusion] {} chunk sau khi trộn", fusedChunks.size());

        // ──────────────────────────────────────────────────────────
        // BƯỚC 4: Self-RAG Grading — Lọc chunk kém liên quan (Batch)
        // ──────────────────────────────────────────────────────────
        java.util.List<Double> chunkScores = selfRagService.batchGradeRelevance(request.question(), fusedChunks);
        List<DocumentChunk> gradedChunks = new java.util.ArrayList<>();
        for (int i = 0; i < fusedChunks.size(); i++) {
            DocumentChunk chunk = fusedChunks.get(i);
            double score = chunkScores.get(i);
            if (score >= gradingThreshold) {
                gradedChunks.add(chunk);
            } else {
                if (log.isDebugEnabled()) {
                    log.debug("   [Self-RAG] Loại chunk (score={}): '{}'...",
                            score, chunk.getContent().substring(0, Math.min(40, chunk.getContent().length())));
                }
            }
        }
        log.info("   [Self-RAG] {} / {} chunk vượt qua grading", gradedChunks.size(), fusedChunks.size());

        // Fallback: Nếu tất cả bị loại -> Báo lỗi ngay lập tức (Fast-Fail) chống ảo giác
        if (gradedChunks.isEmpty() && !fusedChunks.isEmpty() && toolContext.isEmpty()) {
            log.warn("   ⚠️ [Self-RAG] Toàn bộ chunk bị loại. Fast-fail để tránh ảo giác!");
            metrics.recordChunkCount(0);
            metrics.recordTotalLatency(System.currentTimeMillis() - pipelineStart);
            metrics.recordQueryComplete();
            RetrievalMeta fastFailMeta = new RetrievalMeta(
                    System.currentTimeMillis() - pipelineStart,
                    retrievalLatency,
                    rawVectorCount,
                    rawBm25Count,
                    0,
                    "NONE",
                    effectiveQuery,
                    true
            );
            return new RagResponse("Xin lỗi, tôi không tìm thấy tài liệu phù hợp trong cơ sở dữ liệu để trả lời chính xác câu hỏi này.", List.of(), fastFailMeta);
        }
        
        List<DocumentChunk> finalChunks = gradedChunks;
        metrics.recordChunkCount(finalChunks.size());

        // ──────────────────────────────────────────────────────────
        // BƯỚC 5: Context Compression
        // ──────────────────────────────────────────────────────────
        boolean hasContext = !finalChunks.isEmpty() || !toolContext.isEmpty();
        String compressedContext = !finalChunks.isEmpty()
                ? toolContext + contextCompressor.compress(finalChunks, request.question())
                : toolContext;
        if (log.isDebugEnabled()) {
            log.debug("   [Compressor] Mode={} | Context: {} ký tự",
                    hasContext ? "RAG_OR_TOOL" : "GENERAL", compressedContext.length());
        }

        // ──────────────────────────────────────────────────────────
        // BƯỚC 6: LLM Call — Sinh câu trả lời
        // ──────────────────────────────────────────────────────────
        long llmStart = System.currentTimeMillis();
        LlmExecutionService.LlmCallResult llmResult;
        if (hasContext) {
            if (systemPromptOverride != null) {
                llmResult = llmExecutionService.callLLM(systemPromptOverride, request.question(), compressedContext);
            } else {
                llmResult = llmExecutionService.callLLM(request.question(), compressedContext);
            }
        } else {
            llmResult = llmExecutionService.callGeneralLLM(request.question());
        }
        metrics.recordLLMLatency(System.currentTimeMillis() - llmStart);
        
        String answer = llmResult.answer();
        String currentProvider = llmResult.provider();
        
        log.info("   [LLM] Mode={} | Đã sinh câu trả lời ({} ký tự)",
                hasContext ? "RAG_OR_TOOL" : "GENERAL", answer.length());

        // ──────────────────────────────────────────────────────────
        // BƯỚC 7: Hallucination Check
        // ──────────────────────────────────────────────────────────
        // Hallucination check chỉ áp dụng khi ở RAG mode (có DB chunks)
        boolean isGrounded = !finalChunks.isEmpty()
                ? selfRagService.isGrounded(answer, compressedContext)
                : true; // General AI / Tool mode — không check hallucination
        if (!finalChunks.isEmpty() && !isGrounded) {
            log.warn("   ⚠️  [Self-RAG] Phát hiện khả năng hallucination!");
        }

        // ──────────────────────────────────────────────────────────
        // BƯỚC 8: Xây dựng Response
        // ──────────────────────────────────────────────────────────
        long totalLatency = System.currentTimeMillis() - pipelineStart;
        List<Citation> citations = citationExtractor.extract(finalChunks);

        RetrievalMeta meta = new RetrievalMeta(
                totalLatency,
                retrievalLatency,
                rawVectorCount,
                rawBm25Count,
                finalChunks.size(),
                currentProvider,
                effectiveQuery,
                isGrounded);

        log.info("✅ [{}] Hoàn tất pipeline trong {} ms | Grounded: {}",
                hasContext ? "RAG" : "GENERAL", totalLatency, isGrounded);
        log.info("═══════════════════════════════════════════════════════");

        metrics.recordTotalLatency(totalLatency);
        metrics.recordQueryComplete();

        return new RagResponse(answer, citations, meta);
        } catch (Exception e) {
            metrics.recordError(e.getClass().getSimpleName());
            throw e;
        } finally {
            MDC.clear();
        }
    }



    // ──────────────────────────────────────────────────────────────
    // STREAMING RAG
    // ──────────────────────────────────────────────────────────────

    public reactor.core.publisher.Flux<String> streamQuery(RagRequest request) {
        log.info("═══════════════════════════════════════════════════════");
        log.info("📨 [RAG STREAM] Câu hỏi mới: '{}'", request.question());

        // 1. Tìm kiếm ngữ cảnh (Nhanh gọn lẹ)
        HybridRetrievalResult rawResults = hybridRetriever.retrieve(request.question(), request.options());
        List<DocumentChunk> fusedChunks = rrfFusionService.fuse(
                rawResults.vectorChunks(),
                rawResults.bm25Chunks(),
                request.options().topK());

        // Cắt bớt phần Grading để stream nhanh nhất có thể
        String compressedContext = contextCompressor.compress(fusedChunks, request.question());

        String systemPrompt = """
                Bạn là Trợ lý AI Đà Nẵng Lắng Nghe — hỗ trợ người dân giải đáp các thắc mắc và thủ tục hành chính.
                Nhiệm vụ: Trả lời câu hỏi dựa HOÀN TOÀN vào thông tin trong CONTEXT bên dưới.
                1. Trả lời bằng tiếng Việt, thân thiện.
                2. Nếu không có thông tin trong CONTEXT, hãy trả lời: "Tôi chưa có thông tin về vấn đề này. Vui lòng liên hệ 1022."
                """;

        String userMessage = """
                CONTEXT:
                %s

                CÂU HỎI: %s
                """.formatted(compressedContext, request.question());

        log.info("   [RAG STREAM] Đang bắt đầu luồng dữ liệu từ GROQ...");
        return groqAdapter.generateStream(systemPrompt, userMessage)
                .onErrorResume(e -> {
                    log.warn("⚠️  [RAG STREAM] Groq lỗi → Fallback Gemini: {}", e.getMessage());
                    return geminiAdapter.generateStream(systemPrompt, userMessage);
                });
    }

    @Override
    public void destroy() {
        if (executor != null) {
            log.info("🛑 [RAG ORCHESTRATOR] Đóng Virtual Thread Executor...");
            executor.shutdown();
        }
    }
}
