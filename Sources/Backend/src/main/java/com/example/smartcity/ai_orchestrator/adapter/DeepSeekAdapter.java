package com.example.smartcity.ai_orchestrator.adapter;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.core.publisher.Flux;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Component
@Slf4j
public class DeepSeekAdapter implements AiProviderAdapter {

    private static final String DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1";

    @Value("${deepseek.api.key:}")
    private String apiKey;

    @Value("${deepseek.model:deepseek-chat}")
    private String model;

    private final WebClient webClient;

    public DeepSeekAdapter(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder
                .baseUrl(DEEPSEEK_BASE_URL)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    @Override
    public String getProviderName() {
        return "DEEPSEEK";
    }

    @Override
    public CompletableFuture<String> generateResponseAsync(String systemPrompt, String userMessage) {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("⚠️ [DeepSeek] API Key chưa được cấu hình. Không dùng DeepSeek.");
            return CompletableFuture.completedFuture("DeepSeek API Key chưa được cấu hình ở backend.");
        }

        log.info("🔵 [DeepSeek] Gọi API | model={}", model);

        Map<String, Object> body = Map.of(
            "model", model,
            "messages", List.of(
                Map.of("role", "system", "content", systemPrompt),
                Map.of("role", "user",   "content", userMessage)
            ),
            "temperature", 0.3,
            "max_tokens", 2048
        );

        return webClient.post()
                .uri("/chat/completions")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(Map.class)
                .map(this::parseResponse)
                .timeout(Duration.ofSeconds(20))
                .doOnSuccess(r -> log.info("✅ [DeepSeek] OK ({} ký tự)", r.length()))
                .doOnError(e -> log.error("❌ [DeepSeek] Lỗi: {}", e.getMessage()))
                .toFuture();
    }

    @Override
    public boolean isHealthy() {
        return apiKey != null && !apiKey.isBlank();
    }

    @Override
    public Flux<String> generateStream(String systemPrompt, String userMessage) {
        if (apiKey == null || apiKey.isBlank()) {
            return Flux.just("DeepSeek API Key chưa được cấu hình.");
        }

        Map<String, Object> body = Map.of(
            "model", model,
            "messages", List.of(
                Map.of("role", "system", "content", systemPrompt),
                Map.of("role", "user",   "content", userMessage)
            ),
            "temperature", 0.3,
            "max_tokens", 2048,
            "stream", true
        );

        return webClient.post()
                .uri("/chat/completions")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .bodyValue(body)
                .retrieve()
                .bodyToFlux(String.class)
                .map(this::parseStreamChunk)
                .filter(chunk -> !chunk.isEmpty())
                .onErrorResume(e -> Flux.just("\n[Lỗi kết nối Stream: " + e.getMessage() + "]"));
    }

    private String parseResponse(Map<?, ?> response) {
        try {
            List<?> choices = (List<?>) response.get("choices");
            Map<?, ?> msg   = (Map<?, ?>) ((Map<?, ?>) choices.get(0)).get("message");
            return (String) msg.get("content");
        } catch (Exception e) {
            log.warn("⚠️ [DeepSeek] Parse response lỗi: {}", e.getMessage());
            return "DeepSeek phản hồi lỗi định dạng.";
        }
    }

    private String parseStreamChunk(String chunk) {
        if (chunk.equals("[DONE]") || chunk.startsWith("data: [DONE]")) {
            return "";
        }
        try {
            String clean = chunk.startsWith("data: ") ? chunk.substring(6).trim() : chunk.trim();
            if (clean.isEmpty()) return "";
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            Map<?, ?> map = mapper.readValue(clean, Map.class);
            List<?> choices = (List<?>) map.get("choices");
            if (choices == null || choices.isEmpty()) return "";
            Map<?, ?> delta = (Map<?, ?>) ((Map<?, ?>) choices.get(0)).get("delta");
            if (delta == null) return "";
            String content = (String) delta.get("content");
            return content != null ? content : "";
        } catch (Exception e) {
            return "";
        }
    }
}
