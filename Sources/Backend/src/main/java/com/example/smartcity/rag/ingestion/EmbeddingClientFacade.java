package com.example.smartcity.rag.ingestion;

import com.example.smartcity.ai_orchestrator.pool.GeminiKeyPool;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.TimeUnit;

/**
 * [LAYER 1 + 9] EMBEDDING CLIENT FACADE
 *
 * Bọc lấy logic gọi Embedding API để:
 * - Dễ dàng swap provider (OpenAI / Gemini / Ollama)
 * - Cache kết quả (tránh gọi API lặp lại cho cùng văn bản)
 */
@Component
@Slf4j
public class EmbeddingClientFacade {

    // Gemini text-embedding-004 trả về vector 768 chiều
    private static final int VECTOR_DIM = 768;
    private static final String GEMINI_BASE_URL = "https://generativelanguage.googleapis.com";
    private static final String EMBEDDING_MODEL = "text-embedding-004";

    private final GeminiKeyPool keyPool;
    private final WebClient webClient;
    private final Cache<String, float[]> embeddingCache;

    public EmbeddingClientFacade(GeminiKeyPool keyPool, WebClient.Builder webClientBuilder) {
        this.keyPool = keyPool;
        this.webClient = webClientBuilder
                .baseUrl(GEMINI_BASE_URL)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
        this.embeddingCache = Caffeine.newBuilder()
                .maximumSize(5000)
                .expireAfterAccess(1, TimeUnit.HOURS)
                .build();
    }

    /**
     * Embed một đoạn văn bản đơn lẻ.
     *
     * @param text Văn bản cần embed
     * @return float[] vector
     */
    public float[] embed(String text) {
        if (text == null || text.isBlank()) {
            return new float[VECTOR_DIM];
        }

        // Kiểm tra bộ nhớ đệm Caffeine Cache
        float[] cached = embeddingCache.getIfPresent(text);
        if (cached != null) {
            log.debug("⚡ [EMBEDDING CACHE HIT] Trả về vector từ RAM cho text (Độ dài: {})", text.length());
            return cached;
        }

        log.debug("🔢 [EMBEDDING] Embed {} ký tự...", text.length());

        if (!keyPool.isConfigured()) {
            log.warn("⚠️  [Embedding] Pool chưa cấu hình → Fallback Mock.");
            float[] vector = mockEmbed(text);
            embeddingCache.put(text, vector);
            return vector;
        }

        String apiKey = keyPool.nextKey();
        if (apiKey == null) {
            float[] vector = mockEmbed(text);
            embeddingCache.put(text, vector);
            return vector;
        }

        try {
            Map<String, Object> body = Map.of(
                "model", "models/" + EMBEDDING_MODEL,
                "content", Map.of("parts", List.of(Map.of("text", text)))
            );

            Map response = webClient.post()
                    .uri("/v1beta/models/" + EMBEDDING_MODEL + ":embedContent?key=" + apiKey)
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block(); // Block vì luồng ingestion hiện tại chạy đồng bộ từng file

            if (response != null && response.containsKey("embedding")) {
                Map embeddingObj = (Map) response.get("embedding");
                List<Double> values = (List<Double>) embeddingObj.get("values");
                
                // Parse json array sang float array (Dimension: 768)
                float[] vector = new float[VECTOR_DIM];
                for (int i = 0; i < values.size() && i < VECTOR_DIM; i++) {
                    vector[i] = values.get(i).floatValue();
                }
                embeddingCache.put(text, vector);
                return vector;
            }
        } catch (Exception e) {
            log.error("❌ [Embedding] Lỗi gọi Gemini API: {}", e.getMessage());
        }

        float[] vector = mockEmbed(text);
        embeddingCache.put(text, vector);
        return vector;
    }

    /**
     * Batch embed — gọi API 1 lần cho N đoạn văn (tiết kiệm cost).
     */
    public List<float[]> embedBatch(List<String> texts) {
        log.debug("🔢 [EMBEDDING] Batch embed {} đoạn văn...", texts.size());
        // Hiện tại xử lý tuần tự từng đoạn văn.
        // Tương lai có thể dùng Task.whenAll / Flux để parallelize.
        return texts.stream().map(this::embed).toList();
    }

    // ──────────────────────────────────────────────────────────────
    //  MOCK IMPLEMENTATION (Dùng cho phát triển / test offline)
    // ──────────────────────────────────────────────────────────────

    private float[] mockEmbed(String text) {
        float[] vector = new float[VECTOR_DIM];
        Random seeded = new Random(text.hashCode());

        float norm = 0;
        for (int i = 0; i < VECTOR_DIM; i++) {
            vector[i] = seeded.nextFloat() * 2 - 1; // [-1, 1]
            norm += vector[i] * vector[i];
        }

        norm = (float) Math.sqrt(norm);
        for (int i = 0; i < VECTOR_DIM; i++) {
            vector[i] /= norm;
        }

        return vector;
    }
}



