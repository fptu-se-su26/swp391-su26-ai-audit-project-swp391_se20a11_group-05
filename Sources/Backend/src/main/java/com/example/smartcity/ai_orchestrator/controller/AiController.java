package com.example.smartcity.ai_orchestrator.controller;

import com.example.smartcity.ai_orchestrator.adapter.AiProviderAdapter;
import com.example.smartcity.ai_orchestrator.adapter.GeminiAdapter;
import com.example.smartcity.ai_orchestrator.adapter.GroqAdapter;
import com.example.smartcity.ai_orchestrator.cache.AiSessionManager;
import com.example.smartcity.ai_orchestrator.guardrails.ContentGuardrailService;
import com.example.smartcity.ai_orchestrator.metrics.OrchestratorMetrics;
import com.example.smartcity.ai_orchestrator.racing.RaceResult;
import com.example.smartcity.ai_orchestrator.racing.SpeculativeRacingService;
import com.example.smartcity.ai_orchestrator.router.AiRouterService;
import com.example.smartcity.ai_orchestrator.cache.SemanticCacheService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * [UPGRADED] AiController — Tích hợp đầy đủ 4 Phase nâng cấp.
 *
 * Endpoints:
 *   GET /api/ai/router      → Routing + Guardrails + Sticky Session + CB + Metrics
 *   GET /api/ai/racing      → Speculative Racing (cancel loser, update session)
 *   GET /api/ai/clear-session
 *   GET /api/ai/pool-stats  → Groq + Gemini pool status [PROTECTED]
 *   GET /api/ai/pool-reset  → Reset all pools [PROTECTED]
 *   GET /api/ai/metrics     → Performance metrics per provider [PROTECTED]
 *   GET /api/ai/cb-stats    → Circuit Breaker states [PROTECTED]
 */
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@Slf4j
public class AiController {

    private final AiRouterService          routerService;
    private final SpeculativeRacingService racingService;
    private final ContentGuardrailService  guardrailService;
    private final AiSessionManager         sessionManager;
    private final GroqAdapter              groqAdapter;
    private final GeminiAdapter            geminiAdapter;
    private final OrchestratorMetrics      metrics;
    private final SemanticCacheService     semanticCache;
    private final com.example.smartcity.ai_orchestrator.security.TokenManagerService tokenManager;

    // ──────────────────────────────────────────────────────────────
    //  ROUTER — Routing + CB + Guardrails + Sticky Session
    // ──────────────────────────────────────────────────────────────

    @GetMapping("/router")
    public String testRouter(
            @RequestParam(defaultValue = "User123") String userId,
            @RequestParam(defaultValue = "Xin chào") String message) {
        long start = System.currentTimeMillis();

        try {
            // 0. Token Management (Chống Spam / DDoS)
            if (!tokenManager.acquirePermission(userId)) {
                return "<h1 style='color:red'>🛑 Lỗi 429: Too Many Requests</h1><p>Bạn đã vượt quá số câu hỏi cho phép (20 câu / giờ). Hãy quay lại sau.</p>";
            }

            // 1. Guardrails (với userId để rate-limit per-user)
            guardrailService.validateMessage(message, userId);

            // 1.5. Semantic Cache (Bộ nhớ đệm ngữ nghĩa)
            String cachedResponse = semanticCache.findSimilar(message);
            if (cachedResponse != null) {
                long latency = System.currentTimeMillis() - start;
                return "<h1>🎛️ AI Router V5.0 — Production Ready</h1>" +
                       "<p><b>User:</b> " + userId + "</p>" +
                       "<p><b>Câu hỏi:</b> " + message + "</p>" +
                       "<p><b>Provider:</b> <span style='color:green'>[SEMANTIC-CACHE]</span></p>" +
                       "<p><b>Latency:</b> " + latency + "ms</p>" +
                       "<p><b>Kết quả:</b> " + cachedResponse + "</p>";
            }

            // 2. Routing (Sticky Session + Complexity Score + CB check)
            AiProviderAdapter provider = routerService.routeToBestProvider(userId, message);
            String providerName = provider != null ? provider.getProviderName() : "NONE";

            // 3. Execute với fallback + CB + metrics
            String result = routerService.executeWithFallback(provider, "Trả lời ngắn gọn bằng tiếng Việt.", message).join();
            
            // Lưu vào Semantic Cache cho các user tiếp theo
            semanticCache.save(message, result);

            long latency = System.currentTimeMillis() - start;

            return "<h1>🎛️ AI Router V5.0 — Production Ready</h1>" +
                   "<p><b>User:</b> " + userId + "</p>" +
                   "<p><b>Câu hỏi:</b> " + message + "</p>" +
                   "<p><b>Provider:</b> <span style='color:blue'>" + providerName + "</span></p>" +
                   "<p><b>Latency:</b> " + latency + "ms</p>" +
                   "<p><b>Kết quả:</b> " + result + "</p>";

        } catch (SecurityException e) {
            return "<h1 style='color:red'>🛡️ Guardrail kích hoạt!</h1><p>" + e.getMessage() + "</p>";
        } catch (Exception e) {
            log.error("Router error: {}", e.getMessage());
            return "<h1 style='color:orange'>⚠️ Lỗi hệ thống</h1><p>" + e.getMessage() + "</p>";
        }
    }

    // ──────────────────────────────────────────────────────────────
    //  STREAMING (SSE) — Hiệu ứng ChatGPT
    // ──────────────────────────────────────────────────────────────

    /**
     * [TÍNH NĂNG MỚI] Giao tiếp với AI dưới dạng luồng (Stream)
     * Trả về text/event-stream giúp Frontend hiển thị chữ nhỏ giọt.
     */
    @GetMapping(value = "/stream", produces = org.springframework.http.MediaType.TEXT_EVENT_STREAM_VALUE)
    public reactor.core.publisher.Flux<String> testStream(
            @RequestParam(defaultValue = "User123") String userId,
            @RequestParam(defaultValue = "Xin chào, hãy kể một câu chuyện ngắn.") String message) {

        // 0. Token Management (Chống Spam / DDoS)
        if (!tokenManager.acquirePermission(userId)) {
            return reactor.core.publisher.Flux.just("\n[Hệ thống] 🛑 Lỗi 429: Bạn đã vượt quá giới hạn 20 câu / giờ. Hãy quay lại sau.\n");
        }

        try {
            // 1. Guardrails
            guardrailService.validateMessage(message, userId);
            
            // 2. Semantic Cache (Streaming nhanh một lần)
            String cachedResponse = semanticCache.findSimilar(message);
            if (cachedResponse != null) {
                // Tách từng từ ra để tạo hiệu ứng gõ phím giả lập từ cache
                return reactor.core.publisher.Flux.fromArray(cachedResponse.split("(?<=\\s)"))
                        .delayElements(java.time.Duration.ofMillis(20));
            }

            // 3. Routing (Sticky Session + Complexity Score + CB check)
            AiProviderAdapter provider = routerService.routeToBestProvider(userId, message);

            // 4. Stream với Fallback & Metric
            return routerService.executeStreamWithFallback(provider, "Trả lời ngắn gọn, chuyên nghiệp bằng tiếng Việt.", message)
                    .doOnComplete(() -> log.info("✅ Hoàn tất Stream cho User {}", userId));

        } catch (SecurityException e) {
            return reactor.core.publisher.Flux.just("\n[Hệ thống] 🛡️ Guardrail kích hoạt: " + e.getMessage() + "\n");
        } catch (Exception e) {
            log.error("Stream error: {}", e.getMessage());
            return reactor.core.publisher.Flux.just("\n[Hệ thống] ⚠️ Lỗi hệ thống: " + e.getMessage() + "\n");
        }
    }

    // ──────────────────────────────────────────────────────────────
    //  RACING — Speculative Racing với cancel loser + update session
    // ──────────────────────────────────────────────────────────────

    /**
     * Fix 1.1 + 4.2: Racing trả RaceResult, cancel loser, update sticky session.
     * URL: http://localhost:8080/api/ai/racing?message=hello&userId=User123
     */
    @GetMapping("/racing")
    public String testRacing(
            @RequestParam(defaultValue = "Hãy phân tích câu này") String message,
            @RequestParam(defaultValue = "User123") String userId) {

        RaceResult result = racingService.raceProviders(groqAdapter, geminiAdapter, message);

        // Fix 4.2: Cập nhật sticky session với winner
        if (!"NONE".equals(result.winnerProvider())) {
            sessionManager.saveUserProvider(userId, result.winnerProvider());
        }

        // Ghi metrics
        metrics.recordRacingWin(result.winnerProvider());

        return "<h1>🏁 Speculative Racing — Fixed (Cancel Loser)</h1>" +
               "<p><b>Câu hỏi:</b> " + message + "</p>" +
               "<p><b>🏆 Winner:</b> <span style='color:green'>" + result.winnerProvider() + "</span></p>" +
               "<p><b>⏱️ Latency:</b> " + result.latencyMs() + "ms</p>" +
               "<p><b>🚫 Loser Cancelled:</b> " + (result.loserCancelled() ? "✅ Đã cancel (tiết kiệm token)" : "⚠️ Đã xong trước") + "</p>" +
               "<p><b>Kết quả:</b> " + result.answer() + "</p>" +
               "<p><small>Session của User " + userId + " đã được cập nhật → " + result.winnerProvider() + "</small></p>";
    }

    // ──────────────────────────────────────────────────────────────
    //  SESSION MANAGEMENT
    // ──────────────────────────────────────────────────────────────

    @GetMapping("/clear-session")
    public String clearSession(@RequestParam(defaultValue = "User123") String userId) {
        sessionManager.clearSession(userId);
        return "<h1>✅ Đã xóa session của User: " + userId + "</h1>";
    }

    // ──────────────────────────────────────────────────────────────
    //  ADMIN ENDPOINTS (Bảo vệ bởi AdminApiKeyFilter: X-Admin-Token)
    // ──────────────────────────────────────────────────────────────

    /** GET /api/ai/pool-stats — Groq + Gemini key status chi tiết */
    @GetMapping("/pool-stats")
    public Map<String, Object> poolStats() {
        return Map.of(
            "groq",   groqAdapter.getPoolStats(),
            "gemini", geminiAdapter.getPoolStats(),
            "usage", tokenManager.getUsageStats() // [TÍNH NĂNG MỚI] Admin xem Usage
        );
    }

    /** GET /api/ai/pool-reset — Reset cả Groq + Gemini key Pool về ACTIVE */
    @GetMapping("/pool-reset")
    public String poolReset() {
        groqAdapter.resetPool();
        geminiAdapter.resetPool();
        return "<h1>✅ Đã reset toàn bộ Groq + Gemini Key Pool về ACTIVE</h1>" +
               "<p>Tất cả key sẵn sàng nhận request mới.</p>";
    }

    /** GET /api/ai/metrics — Performance metrics */
    @GetMapping("/metrics")
    public Map<String, Map<String, Object>> metricsEndpoint() {
        return metrics.getSummary();
    }

    /** GET /api/ai/cb-stats — Circuit Breaker states */
    @GetMapping("/cb-stats")
    public List<Map<String, Object>> circuitBreakerStats() {
        return routerService.getCircuitBreakerStats();
    }
}



