package com.example.smartcity.rag.controller;

import com.example.smartcity.rag.generation.HybridRagOrchestrator;
import com.example.smartcity.rag.ingestion.DocumentIngestionPipeline;
import com.example.smartcity.rag.model.*;
import com.example.smartcity.rag.repository.DocumentChunkRepository;
import com.example.smartcity.modules.user.repository.UserRepository;
import com.example.smartcity.modules.user.entity.User;
import com.example.smartcity.modules.auth.service.MfaService;
import com.example.smartcity.common.exception.CustomException;
import com.example.smartcity.modules.chatbot.service.ChatbotService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

/**
 * [LAYER 8] REST CONTROLLER — Endpoints của Hybrid RAG module.
 *
 * Endpoints:
 * --------------------------------------------------------------
 * POST /api/rag/query    → Hỏi AI (Full RAG pipeline)
 * POST /api/rag/ingest   → Upload tài liệu mới để index (Async)
 * GET  /api/rag/stats    → Thống kê số chunk trong DB
 * --------------------------------------------------------------
 *
 * Thử nghiệm nhanh (cURL):
 * <pre>
 * # Query
 * curl -X POST http://localhost:8080/api/rag/query \
 *   -H "Content-Type: application/json" \
 *   -d '{"question":"Làm sao gửi phản ánh?","options":{"docType":"danang-policy","language":"vi","topK":10,"allowedPermissions":["PUBLIC"],"useHyDE":false,"useMultiQuery":false}}'
 *
 * # Upload
 * curl -X POST http://localhost:8080/api/rag/ingest \
 *   -F "file=@policy.txt" \
 *   -F "docType=danang-policy" \
 *   -F "language=vi"
 * </pre>
 */
@RestController
@RequestMapping("/api/rag")
@RequiredArgsConstructor
@Validated
@Slf4j
public class RagController {

    private final HybridRagOrchestrator orchestrator;
    private final DocumentIngestionPipeline ingestionPipeline;
    private final DocumentChunkRepository chunkRepository;
    private final ChatbotService chatbotService;
    private final UserRepository userRepository;
    private final MfaService mfaService;

    // --------------------------------------------------------------
    //  QUERY — RAG Pipeline chính
    // --------------------------------------------------------------

    /**
     * POST /api/rag/query
     * Gửi câu hỏi và nhận câu trả lời từ Hybrid RAG pipeline.
     */
    @PostMapping("/query")
    public ResponseEntity<RagResponse> query(@Valid @RequestBody RagRequest request) {
        log.info("[API] POST /api/rag/query - '{}'", request.question());
        RagResponse response = orchestrator.query(request);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/rag/query-simple?q=...&docType=danang-policy&lang=vi
     * Phiên bản GET đơn giản để test nhanh trên browser.
     */
    @GetMapping("/query-simple")
    public ResponseEntity<RagResponse> querySimple(
            @RequestParam(defaultValue = "Xin chào") String q,
            @RequestParam(defaultValue = "danang-policy") String docType,
            @RequestParam(defaultValue = "vi") String lang) {

        RagRequest request = new RagRequest(q, RetrievalOptions.defaults(docType, lang));
        RagResponse response = orchestrator.query(request);
        return ResponseEntity.ok(response);
    }

    // --------------------------------------------------------------
    //  INGEST — Upload tài liệu mới
    // --------------------------------------------------------------

    /**
     * POST /api/rag/ingest
     * Upload file text và index ngầm (trả về ngay, không chờ).
     */
    @PostMapping("/ingest")
    public ResponseEntity<Map<String, String>> ingest(
            @RequestHeader(value = "X-MFA-Code", required = false) String mfaCode,
            @RequestParam MultipartFile file,
            @RequestParam(defaultValue = "danang-policy") String docType,
            @RequestParam(defaultValue = "vi") String language,
            @RequestParam(defaultValue = "PUBLIC") String permission,
            org.springframework.security.core.Authentication authentication) {

        log.info("[API] POST /api/rag/ingest - file='{}' docType={} lang={}",
            file.getOriginalFilename(), docType, language);

        // [SECURITY FIX] Yêu cầu Step-Up MFA để chống bơm dữ liệu độc hại vào Vector DB
        if (mfaCode == null || mfaCode.isBlank()) {
            throw new CustomException("Thao tác Ingest yêu cầu xác thực MFA. Vui lòng cung cấp header X-MFA-Code.", 403);
        }

        User user = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new CustomException("Không tìm thấy user", 404));

        if (!user.isMfaEnabled() || user.getMfaSecret() == null) {
            throw new CustomException("Tài khoản của bạn chưa thiết lập MFA. Không thể thực hiện Ingest.", 403);
        }

        if (!mfaService.verifyCode(user.getMfaSecret(), mfaCode)) {
            throw new CustomException("Mã MFA không hợp lệ hoặc đã hết hạn.", 401);
        }

        if (file.isEmpty()) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "File không được để trống"));
        }

        DocumentMetadata meta = new DocumentMetadata(
            file.getOriginalFilename(),
            docType, language, "1.0", permission
        );

        ingestionPipeline.ingestAsync(file, meta);

        return ResponseEntity.accepted()
            .body(Map.of(
                "status", "accepted",
                "message", "File đang được index ngầm. Có thể truy vấn sau vài giây.",
                "file", file.getOriginalFilename() != null ? file.getOriginalFilename() : "unknown"
            ));
    }

    // --------------------------------------------------------------
    //  STATS — Thống kê
    // --------------------------------------------------------------

    /**
     * GET /api/rag/stats
     * Hiển thị số chunk hiện có trong DB theo từng docType.
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> stats() {
        long totalChunks = chunkRepository.count();
        long trafficChunks    = chunkRepository.countByDocType("traffic");
        long environmentChunks = chunkRepository.countByDocType("environment");
        long governanceChunks = chunkRepository.countByDocType("governance");
        long danangPolicyChunks  = chunkRepository.countByDocType("danang-policy");

        return ResponseEntity.ok(Map.of(
            "totalChunks",   totalChunks,
            "byDocType", Map.of(
                "traffic",    trafficChunks,
                "environment", environmentChunks,
                "governance", governanceChunks,
                "danang-policy", danangPolicyChunks
            ),
            "status", totalChunks > 0 ? "ready" : "empty - upload tài liệu trước"
        ));
    }

    // --------------------------------------------------------------
    //  DANANG CHATBOT — UC14
    // --------------------------------------------------------------

    /**
     * GET /api/rag/chatbot?q=...&userId=1
     * Người dân hỏi chatbot (Mặc định JSON 1 lần).
     */
    @GetMapping("/chatbot")
    public ResponseEntity<Map<String, Object>> chat(
            @RequestParam String q,
            @RequestParam(defaultValue = "1") Long userId) {

        log.info("[API] GET /api/rag/chatbot - userId={} | q='{}'", userId, q);
        Map<String, Object> result = chatbotService.ask(userId, q);
        return ResponseEntity.ok(result);
    }

    /**
     * GET /api/rag/stream?q=...&userId=1
     * Người dân hỏi chatbot (SSE Streaming - Hiệu ứng gõ phím).
     */
    @GetMapping(value = "/stream", produces = org.springframework.http.MediaType.TEXT_EVENT_STREAM_VALUE)
    public reactor.core.publisher.Flux<String> streamChat(
            @RequestParam String q,
            @RequestParam(defaultValue = "1") Long userId) {

        log.info("💬 [API STREAM] GET /api/rag/stream — userId={} | q='{}'", userId, q);
        return chatbotService.askStream(userId, q);
    }

    /**
     * GET /api/rag/chat-history?userId=1
     * Xem lịch sử chat của người dùng (20 câu gần nhất).
     */
    @GetMapping("/chat-history")
    public ResponseEntity<List<?>> chatHistory(
            @RequestParam(defaultValue = "1") Long userId) {

        log.info("[API] GET /api/rag/chat-history - userId={}", userId);
        var history = chatbotService.getHistory(userId);
        return ResponseEntity.ok(history);
    }

    /**
     * GET /api/rag/chat-stats
     * Thống kê tổng số câu hỏi chatbot đã xử lý.
     */
    @GetMapping("/chat-stats")
    public ResponseEntity<Map<String, Object>> chatStats() {
        return ResponseEntity.ok(chatbotService.getStats());
    }
}



