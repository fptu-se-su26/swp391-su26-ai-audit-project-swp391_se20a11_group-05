package com.example.smartcity.ai_orchestrator.adapter;

import com.example.smartcity.ai_orchestrator.pool.GeminiKeyPool;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;


import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

/**
 * [REAL] Gemini Adapter — Reactive WebClient + GeminiKeyPool.
 *
 * Fix 1.2: Không còn .block() — toFuture() thuần reactive.
 * Fix 3.2: Inject GeminiKeyPool thay vì hardcode 1 key.
 *
 * Khi key bị 429 → markRateLimited(key) → thử key khác.
 * Khi tất cả key cooling → trả mock fallback thân thiện.
 */
@Component
@Slf4j
public class GeminiAdapter implements AiProviderAdapter {

    private static final String GEMINI_BASE_URL = "https://generativelanguage.googleapis.com";

    @Value("${gemini.model:gemini-1.5-flash}")
    private String model;

    private final GeminiKeyPool keyPool;
    private final WebClient     webClient;

    public GeminiAdapter(GeminiKeyPool keyPool, WebClient.Builder webClientBuilder) {
        this.keyPool   = keyPool;
        this.webClient = webClientBuilder
                .baseUrl(GEMINI_BASE_URL)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    @Override
    public String getProviderName() { return "GEMINI"; }

    @Override
    public CompletableFuture<String> generateResponseAsync(String systemPrompt, String userMessage) {
        if (!keyPool.isConfigured()) {
            log.warn("⚠️  [Gemini] Pool chưa cấu hình → Mock.");
            return CompletableFuture.completedFuture(buildMockFallback(userMessage));
        }

        String apiKey = keyPool.nextKey();
        if (apiKey == null) {
            log.warn("⚠️  [Gemini] Không có key ACTIVE → Mock.");
            return CompletableFuture.completedFuture(buildMockFallback(userMessage));
        }

        log.info("🔵 [Gemini] Gọi API | model={} | key={}...", model, apiKey.substring(0, Math.min(8, apiKey.length())));

        Map<String, Object> body = Map.of(
            "system_instruction", Map.of("parts", List.of(Map.of("text", systemPrompt))),
            "contents", List.of(
                Map.of("role", "user", "parts", List.of(Map.of("text", userMessage)))
            ),
            "generationConfig", Map.of("temperature", 0.3, "maxOutputTokens", 1024)
        );

        String finalApiKey = apiKey;
        return webClient.post()
                .uri("/v1beta/models/" + model + ":generateContent?key=" + apiKey)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(Map.class)
                .map(this::parseGeminiResponse)
                .timeout(Duration.ofSeconds(12))
                .doOnSuccess(r -> log.info("✅ [Gemini] OK ({} ký tự)", r.length()))
                .doOnError(e -> {
                    log.error("❌ [Gemini] Lỗi: {}", e.getMessage());
                    if (e.getMessage() != null && e.getMessage().contains("429")) {
                        keyPool.markRateLimited(finalApiKey);
                    }
                })
                .onErrorReturn(buildMockFallback(userMessage))
                .toFuture();
    }

    private String parseGeminiResponse(Map<?, ?> response) {
        try {
            List<?> candidates = (List<?>) response.get("candidates");
            Map<?, ?> content  = (Map<?, ?>) ((Map<?, ?>) candidates.get(0)).get("content");
            List<?> parts      = (List<?>) content.get("parts");
            return (String) ((Map<?, ?>) parts.get(0)).get("text");
        } catch (Exception e) {
            log.warn("⚠️  [Gemini] Parse lỗi: {}", e.getMessage());
            return "Gemini trả về response không hợp lệ.";
        }
    }

    @Override
    public boolean isHealthy() {
        return keyPool.isConfigured() && keyPool.isHealthy();
    }

    /** Lấy stats từng key trong Gemini Pool — để hiện ở /api/ai/pool-stats */
    public List<Map<String, Object>> getPoolStats() {
        return keyPool.getStats();
    }

    /** Reset tất cả Gemini key về ACTIVE (dùng khi sang giờ mới) */
    public void resetPool() {
        keyPool.resetAllToActive();
    }

    @Override
    public reactor.core.publisher.Flux<String> generateStream(String systemPrompt, String userMessage) {
        if (!keyPool.isConfigured()) {
            return reactor.core.publisher.Flux.just(buildMockFallback(userMessage));
        }

        String apiKey = keyPool.nextKey();
        if (apiKey == null) {
            return reactor.core.publisher.Flux.just(buildMockFallback(userMessage));
        }

        Map<String, Object> body = Map.of(
            "system_instruction", Map.of("parts", List.of(Map.of("text", systemPrompt))),
            "contents", List.of(
                Map.of("role", "user", "parts", List.of(Map.of("text", userMessage)))
            ),
            "generationConfig", Map.of("temperature", 0.3, "maxOutputTokens", 1024)
        );

        return webClient.post()
                .uri("/v1beta/models/" + model + ":streamGenerateContent?alt=sse&key=" + apiKey)
                .bodyValue(body)
                .retrieve()
                .bodyToFlux(String.class)
                .map(this::parseGeminiStreamChunk)
                .filter(chunk -> !chunk.isEmpty())
                .onErrorResume(e -> reactor.core.publisher.Flux.just("\n[Lỗi kết nối Stream Gemini: " + e.getMessage() + "]"));
    }

    /**
     * Parse chunks từ streamGenerateContent của Gemini
     */
    private String parseGeminiStreamChunk(String chunk) {
        if (chunk == null || chunk.isBlank()) return "";
        try {
            if (chunk.startsWith("data: ")) {
                chunk = chunk.substring(6).trim();
            }
            if (chunk.isBlank() || chunk.equals("[DONE]")) return "";

            // Tạm dùng Regex thay vì ObjectMapper để parse nhanh đoạn chữ
            int textIndex = chunk.indexOf("\"text\": \"");
            if (textIndex == -1) return "";
            
            int startIndex = textIndex + 9;
            int endIndex = chunk.indexOf("\"", startIndex);
            // Handle escaped quotes inside the text
            while (endIndex != -1 && chunk.charAt(endIndex - 1) == '\\') {
                endIndex = chunk.indexOf("\"", endIndex + 1);
            }
            
            if (endIndex == -1) return "";
            
            String content = chunk.substring(startIndex, endIndex);
            content = content.replace("\\n", "\n").replace("\\\"", "\"").replace("\\t", "\t");
            return content;
        } catch (Exception e) {
            return "";
        }
    }

    private String buildMockFallback(String userMessage) {
        return "⏳ Tất cả AI provider đang tạm thời quá tải. Vui lòng thử lại sau 1-2 phút. (Câu hỏi: "
                + userMessage.substring(0, Math.min(60, userMessage.length())) + "...)";
    }
}



