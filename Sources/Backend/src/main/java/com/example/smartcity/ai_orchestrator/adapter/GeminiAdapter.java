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

    @org.springframework.beans.factory.annotation.Autowired
    @org.springframework.context.annotation.Lazy
    private GroqAdapter groqAdapter;

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
    @io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker(name = "geminiLLM", fallbackMethod = "fallbackToGroq")
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
            "systemInstruction", Map.of("parts", List.of(Map.of("text", systemPrompt))),
            "contents", List.of(
                Map.of("role", "user", "parts", List.of(Map.of("text", userMessage)))
            ),
            "generationConfig", Map.of("temperature", 0.3, "maxOutputTokens", 8192)
        );

        String finalApiKey = apiKey;
        return webClient.post()
                .uri(java.net.URI.create(GEMINI_BASE_URL + "/v1beta/models/" + model + ":generateContent?key=" + apiKey))
                .bodyValue(body)
                .retrieve()
                .bodyToMono(Map.class)
                .map(this::parseGeminiResponse)
                .timeout(Duration.ofSeconds(30))
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

    @io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker(name = "geminiLLM", fallbackMethod = "fallbackToGroqStructured")
    public CompletableFuture<String> generateStructuredResponseAsync(String systemPrompt, String userMessage) {
        if (!keyPool.isConfigured()) {
            return CompletableFuture.completedFuture(buildMockStructuredFallback(userMessage));
        }

        String apiKey = keyPool.nextKey();
        if (apiKey == null) {
            return CompletableFuture.completedFuture(buildMockStructuredFallback(userMessage));
        }

        log.info("🔵 [Gemini] Gọi API Structured JSON | model={} | key={}...", model, apiKey.substring(0, Math.min(8, apiKey.length())));

        Map<String, Object> body = Map.of(
            "systemInstruction", Map.of("parts", List.of(Map.of("text", systemPrompt))),
            "contents", List.of(
                Map.of("role", "user", "parts", List.of(Map.of("text", userMessage)))
            ),
            "generationConfig", Map.of(
                "temperature", 0.1, 
                "maxOutputTokens", 8192,
                "responseMimeType", "application/json"
            )
        );

        String finalApiKey = apiKey;
        return webClient.post()
                .uri(java.net.URI.create(GEMINI_BASE_URL + "/v1beta/models/" + model + ":generateContent?key=" + apiKey))
                .bodyValue(body)
                .retrieve()
                .bodyToMono(Map.class)
                .map(this::parseGeminiResponse)
                .timeout(Duration.ofSeconds(30))
                .doOnSuccess(r -> log.info("✅ [Gemini Structured] OK ({} ký tự)", r.length()))
                .doOnError(e -> {
                    log.error("❌ [Gemini Structured] Lỗi: {}", e.getMessage());
                    if (e.getMessage() != null && e.getMessage().contains("429")) {
                        keyPool.markRateLimited(finalApiKey);
                    }
                })
                .onErrorReturn(buildMockStructuredFallback(userMessage))
                .toFuture();
    }

    public CompletableFuture<String> fallbackToMock(String systemPrompt, String userMessage, Throwable t) {
        log.warn("🚨 [CircuitBreaker] Gemini API sập. Kích hoạt Mock Fallback an toàn. Lỗi: {}", t.getMessage());
        return CompletableFuture.completedFuture(buildMockFallback(userMessage));
    }

    public CompletableFuture<String> fallbackToMockStructured(String systemPrompt, String userMessage, Throwable t) {
        log.warn("🚨 [CircuitBreaker] Gemini Structured API sập. Kích hoạt Mock Fallback. Lỗi: {}", t.getMessage());
        return CompletableFuture.completedFuture(buildMockStructuredFallback(userMessage));
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
            "systemInstruction", Map.of("parts", List.of(Map.of("text", systemPrompt))),
            "contents", List.of(
                Map.of("role", "user", "parts", List.of(Map.of("text", userMessage)))
            ),
            "generationConfig", Map.of("temperature", 0.3, "maxOutputTokens", 8192)
        );

        return webClient.post()
                .uri(java.net.URI.create(GEMINI_BASE_URL + "/v1beta/models/" + model + ":streamGenerateContent?alt=sse&key=" + apiKey))
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

    private String buildMockStructuredFallback(String userMessage) {
        String lowerMsg = userMessage.toLowerCase();
        String intent = "SMALLTALK";
        String emotion = "NEUTRAL";
        String reply = "Dạ, hiện tại em đang chạy ở chế độ MOCK (chưa có API Key). Bạn vừa nói: " + userMessage;
        
        if (lowerMsg.contains("bão") || lowerMsg.contains("cứu") || lowerMsg.contains("ngập")) {
            intent = "CREATE_FEEDBACK";
            emotion = "NEGATIVE";
            reply = "Trời ơi, em rất chia sẻ với thiệt hại của gia đình mình ạ. Cơn bão vừa qua đúng là căng thẳng quá. Cô/chú bình tĩnh nhé! Em đang ghi nhận sự cố ngập lụt đây ạ.";
        } else if (lowerMsg.contains("cảm ơn") || lowerMsg.contains("tuyệt vời")) {
            intent = "SMALLTALK";
            emotion = "POSITIVE";
            reply = "Dạ em cảm ơn cô/chú nhiều ạ! Cô/chú cần hỗ trợ gì thêm cứ nhắn em nhé.";
        } else if (lowerMsg.contains("thủ tục") || lowerMsg.contains("giấy phép") || lowerMsg.contains("luật")) {
            intent = "QA_LEGAL";
            emotion = "NEUTRAL";
            reply = "Dạ, để em tra cứu luật giúp cô/chú ạ...";
        } else if (lowerMsg.contains("fb-")) {
            intent = "LOOKUP";
            emotion = "NEUTRAL";
            reply = ""; // LOOKUP doesn't strictly need a reply as ChatRouter will query DB
        }
        
        return String.format(
            "{\"intent\": \"%s\", \"emotion\": \"%s\", \"reply\": \"%s\", \"confidence\": 0.99}",
            intent, emotion, reply.replace("\"", "\\\"").replace("\n", " ")
        );
    }

    private String buildMockAiAnalysisFallback(String userMessage) {
        String safeDesc = userMessage.replace("\"", "\\\"").replace("\n", " ");
        String priority = "MEDIUM";
        String domain = "KHAC";
        String reason = "Phân tích tự động (Mock Mode)";
        
        String lowerMsg = userMessage.toLowerCase();
        if (lowerMsg.contains("chửi") || lowerMsg.contains("đm") || lowerMsg.contains("ngu")) {
            return String.format(
                "{\"is_toxic\": true, \"masked_description\": \"%s\", \"trust_score\": 90, \"reason\": \"Phát hiện ngôn từ độc hại\", \"priority\": \"MEDIUM\", \"domain\": \"KHAC\"}",
                safeDesc
            );
        }
        if (lowerMsg.contains("giao thông") || lowerMsg.contains("tai nạn") || lowerMsg.contains("kẹt xe") || lowerMsg.contains("ổ gà") || lowerMsg.contains("đường")) {
            domain = "GIAO_THONG";
            if (lowerMsg.contains("tai nạn")) priority = "HIGH";
        } else if (lowerMsg.contains("cây") || lowerMsg.contains("cống") || lowerMsg.contains("hạ tầng") || lowerMsg.contains("ngập")) {
            domain = "HA_TANG";
            if (lowerMsg.contains("ngập")) priority = "HIGH";
        } else if (lowerMsg.contains("rác") || lowerMsg.contains("môi trường") || lowerMsg.contains("mùi") || lowerMsg.contains("ồn")) {
            domain = "MOI_TRUONG";
        } else if (lowerMsg.contains("an ninh") || lowerMsg.contains("trộm") || lowerMsg.contains("đánh nhau")) {
            domain = "AN_NINH";
            priority = "HIGH";
        }
        
        return String.format(
            "{\"is_toxic\": false, \"masked_description\": \"%s\", \"trust_score\": 90, \"reason\": \"%s\", \"priority\": \"%s\", \"domain\": \"%s\"}",
            safeDesc, reason, priority, domain
        );
    }

    public static class GeminiResponse {
        private final String text;
        private final int inputTokens;
        private final int outputTokens;

        public GeminiResponse(String text, int inputTokens, int outputTokens) {
            this.text = text;
            this.inputTokens = inputTokens;
            this.outputTokens = outputTokens;
        }

        public String getText() { return text; }
        public int getInputTokens() { return inputTokens; }
        public int getOutputTokens() { return outputTokens; }
    }

    /**
     * [TEXT-ONLY] Gọi Gemini với chỉ văn bản và trả về GeminiResponse có thống kê token.
     * Dùng cho AutoDispatchService sau khi bỏ chế độ Multimodal.
     * Timeout khuyến nghị: 15 giây (nhẹ hơn nhiều so với 30s của Multimodal).
     */
    @io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker(name = "geminiLLM", fallbackMethod = "fallbackToGroqStructuredWithUsage")
    public CompletableFuture<GeminiResponse> generateStructuredResponseWithUsageAsync(String systemPrompt, String userMessage) {
        if (!keyPool.isConfigured()) {
            log.warn("⚠️  [Gemini] Pool chưa cấu hình → Mock Structured.");
            return CompletableFuture.completedFuture(new GeminiResponse(buildMockStructuredFallback(userMessage), 0, 0));
        }

        String apiKey = keyPool.nextKey();
        if (apiKey == null) {
            log.warn("⚠️  [Gemini] Không có key ACTIVE → Mock Structured.");
            return CompletableFuture.completedFuture(new GeminiResponse(buildMockStructuredFallback(userMessage), 0, 0));
        }

        log.info("🔵 [Gemini Text-Only] Gọi API | model={} | key={}...", model, apiKey.substring(0, Math.min(8, apiKey.length())));

        Map<String, Object> body = Map.of(
            "systemInstruction", Map.of("parts", List.of(Map.of("text", systemPrompt))),
            "contents", List.of(
                Map.of("role", "user", "parts", List.of(Map.of("text", userMessage)))
            ),
            "generationConfig", Map.of(
                "temperature", 0.1,
                "maxOutputTokens", 512,
                "responseMimeType", "application/json"
            )
        );

        String finalApiKey = apiKey;
        return webClient.post()
                .uri(java.net.URI.create(GEMINI_BASE_URL + "/v1beta/models/" + model + ":generateContent?key=" + apiKey))
                .bodyValue(body)
                .retrieve()
                .bodyToMono(Map.class)
                .map(response -> {
                    String text = parseGeminiResponse(response);
                    int inputTokens = 0;
                    int outputTokens = 0;
                    try {
                        Map<?, ?> usageMetadata = (Map<?, ?>) response.get("usageMetadata");
                        if (usageMetadata != null) {
                            Number promptCount = (Number) usageMetadata.get("promptTokenCount");
                            Number candidateCount = (Number) usageMetadata.get("candidatesTokenCount");
                            if (promptCount != null) inputTokens = promptCount.intValue();
                            if (candidateCount != null) outputTokens = candidateCount.intValue();
                        }
                    } catch (Exception ignored) {}
                    return new GeminiResponse(text, inputTokens, outputTokens);
                })
                .timeout(Duration.ofSeconds(15))
                .doOnSuccess(r -> log.info("✅ [Gemini Text-Only] OK ({} chars, {}+{} tokens)",
                    r.getText().length(), r.getInputTokens(), r.getOutputTokens()))
                .doOnError(e -> {
                    log.error("❌ [Gemini Text-Only] Lỗi: {}", e.getMessage());
                    if (e.getMessage() != null && e.getMessage().contains("429")) {
                        keyPool.markRateLimited(finalApiKey);
                    }
                })
                .onErrorReturn(new GeminiResponse(buildMockAiAnalysisFallback(userMessage), 0, 0))
                .toFuture();
    }

    public CompletableFuture<String> fallbackToGroq(String systemPrompt, String userMessage, Throwable t) {
        log.warn("🚨 [CircuitBreaker] Gemini sập. Fallback sang Groq. Lỗi: {}", t.getMessage());
        try {
            return groqAdapter.generateResponseAsync(systemPrompt, userMessage)
                .exceptionally(ex -> buildMockFallback(userMessage));
        } catch (Exception e) {
            return CompletableFuture.completedFuture(buildMockFallback(userMessage));
        }
    }

    public CompletableFuture<String> fallbackToGroqStructured(String systemPrompt, String userMessage, Throwable t) {
        log.warn("🚨 [CircuitBreaker] Gemini (Structured) sập. Fallback sang Groq. Lỗi: {}", t.getMessage());
        try {
            return groqAdapter.generateStructuredResponseAsync(systemPrompt, userMessage)
                .exceptionally(ex -> buildMockStructuredFallback(userMessage));
        } catch (Exception e) {
            return CompletableFuture.completedFuture(buildMockStructuredFallback(userMessage));
        }
    }

    public CompletableFuture<GeminiResponse> fallbackToGroqStructuredWithUsage(String systemPrompt, String userMessage, Throwable t) {
        log.warn("🚨 [CircuitBreaker] Gemini Text-Only sập. Fallback sang Groq. Lỗi: {}", t.getMessage());
        try {
            return groqAdapter.generateStructuredResponseAsync(systemPrompt, userMessage)
                    .thenApply(text -> new GeminiResponse(text, 0, 0))
                    .exceptionally(ex -> new GeminiResponse(buildMockAiAnalysisFallback(userMessage), 0, 0));
        } catch (Exception e) {
            return CompletableFuture.completedFuture(new GeminiResponse(buildMockAiAnalysisFallback(userMessage), 0, 0));
        }
    }
}



