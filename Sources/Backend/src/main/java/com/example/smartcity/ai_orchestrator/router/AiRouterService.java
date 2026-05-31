package com.example.smartcity.ai_orchestrator.router;

import com.example.smartcity.ai_orchestrator.adapter.AiProviderAdapter;
import com.example.smartcity.ai_orchestrator.cache.AiSessionManager;
import com.example.smartcity.ai_orchestrator.metrics.OrchestratorMetrics;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerConfig;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

/**
 * [Phase 1.3 + 3.1 + 4.1] AiRouterService — Đã nâng cấp lên Resilience4j
 */
@Service
@Slf4j
public class AiRouterService {

    private final List<AiProviderAdapter> providers;
    private final AiSessionManager sessionManager;
    private final OrchestratorMetrics metrics;
    private final CircuitBreakerRegistry circuitBreakerRegistry;
    private final com.example.smartcity.ai_orchestrator.validation.OutputValidator outputValidator;

    public AiRouterService(List<AiProviderAdapter> providers,
                           AiSessionManager sessionManager,
                           OrchestratorMetrics metrics,
                           com.example.smartcity.ai_orchestrator.validation.OutputValidator outputValidator) {
        this.providers      = providers;
        this.sessionManager = sessionManager;
        this.metrics        = metrics;
        this.outputValidator = outputValidator;

        // Cấu hình chuẩn cho Resilience4j Circuit Breaker
        CircuitBreakerConfig config = CircuitBreakerConfig.custom()
            .failureRateThreshold(50)
            .waitDurationInOpenState(Duration.ofSeconds(30))
            .permittedNumberOfCallsInHalfOpenState(2)
            .slidingWindowSize(10)
            .build();

        this.circuitBreakerRegistry = CircuitBreakerRegistry.of(config);
        
        // Đăng ký CB cho từng provider
        providers.forEach(p -> circuitBreakerRegistry.circuitBreaker(p.getProviderName()));
        log.info("✅ [Router] Đã khởi tạo Resilience4j CircuitBreaker cho: {}", 
                 providers.stream().map(AiProviderAdapter::getProviderName).toList());
    }

    // ──────────────────────────────────────────────────────────────
    //  ROUTING — Sticky Session + Complexity Score + CB check
    // ──────────────────────────────────────────────────────────────

    public AiProviderAdapter routeToBestProvider(String userId, String userMessage) {
        String prevProvider = sessionManager.getPreviousProvider(userId);
        if (prevProvider != null) {
            AiProviderAdapter prev = getProviderByName(prevProvider);
            if (prev != null && circuitAllows(prev.getProviderName())) {
                log.info("🔄 [Router] Sticky: User {} → {}", userId, prevProvider);
                return prev;
            }
            sessionManager.clearSession(userId);
            log.warn("⚠️  [Router] Sticky provider {} bị CB block → chọn lại", prevProvider);
        }

        int score = evaluateComplexity(userMessage);
        AiProviderAdapter selected;

        if (score < 4) {
            selected = getHealthyProvider("GEMINI");
            log.info("→ [Router] Score={} → GEMINI (nhanh, đơn giản)", score);
        } else if (score > 6) {
            selected = getHealthyProvider("GROQ");
            log.info("→ [Router] Score={} → GROQ (phức tạp, reasoning)", score);
        } else {
            selected = providers.stream()
                    .filter(p -> p.isHealthy() && circuitAllows(p.getProviderName()))
                    .findFirst()
                    .orElse(null);
            log.info("→ [Router] Score={} → Dynamic (provider healthy đầu tiên)", score);
        }

        if (selected == null) {
            log.warn("⚠️  [Router] Không có provider nào khỏe — dùng first provider");
            selected = providers.isEmpty() ? null : providers.get(0);
        }

        if (selected != null) {
            sessionManager.saveUserProvider(userId, selected.getProviderName());
        }
        return selected;
    }

    // ──────────────────────────────────────────────────────────────
    //  EXECUTE với Circuit Breaker + Auto-Fallback + Metrics
    // ──────────────────────────────────────────────────────────────

    public CompletableFuture<String> executeWithFallback(AiProviderAdapter primary,
                                                          String systemPrompt,
                                                          String userMessage) {
        if (primary == null) {
            return CompletableFuture.completedFuture("⏳ Hệ thống AI đang quá tải. Vui lòng thử lại sau.");
        }

        String providerName = primary.getProviderName();
        CircuitBreaker cb = circuitBreakerRegistry.circuitBreaker(providerName);

        // Kiểm tra CB (Fail-fast)
        if (!cb.tryAcquirePermission()) {
            log.warn("🔴 [Router] Resilience4j CB-{} OPEN → Fail-fast → Fallback", providerName);
            return fallback(primary, systemPrompt, userMessage);
        }

        long start = System.currentTimeMillis();

        return primary.generateResponseAsync(systemPrompt, userMessage)
                .whenComplete((result, error) -> {
                    long latency = System.currentTimeMillis() - start;
                    boolean ok = error == null;
                    metrics.recordCall(providerName, latency, ok);
                    
                    if (ok) {
                        cb.onSuccess(latency, java.util.concurrent.TimeUnit.MILLISECONDS);
                    } else {
                        cb.onError(latency, java.util.concurrent.TimeUnit.MILLISECONDS, error);
                    }
                })
                .exceptionally(ex -> {
                    log.warn("⚠️  [Router] {} lỗi → Auto-Fallback | {}", providerName, ex.getMessage());
                    return fallback(primary, systemPrompt, userMessage).join();
                });
    }

    // ──────────────────────────────────────────────────────────────
    //  EXECUTE VỚI AUTO-RETRY ZOD-LIKE VALIDATION
    // ──────────────────────────────────────────────────────────────

    /**
     * Gọi LLM và ép kiểu JSON. Nếu lỗi, tự động feedback cho LLM để nó tự sửa lỗi (Self-Correction).
     */
    public <T> CompletableFuture<T> executeWithValidation(AiProviderAdapter primary,
                                                          String systemPrompt,
                                                          String userMessage,
                                                          Class<T> responseType,
                                                          int maxRetries) {
        return executeWithValidationInternal(primary, systemPrompt, userMessage, responseType, null, maxRetries, 0);
    }

    /**
     * Gọi LLM và ép kiểu JSON (Hỗ trợ Nested Generics qua TypeReference)
     */
    public <T> CompletableFuture<T> executeWithValidation(AiProviderAdapter primary,
                                                          String systemPrompt,
                                                          String userMessage,
                                                          com.fasterxml.jackson.core.type.TypeReference<T> responseType,
                                                          int maxRetries) {
        return executeWithValidationInternal(primary, systemPrompt, userMessage, null, responseType, maxRetries, 0);
    }

    private <T> CompletableFuture<T> executeWithValidationInternal(AiProviderAdapter primary,
                                                                   String systemPrompt,
                                                                   String userMessage,
                                                                   Class<T> classType,
                                                                   com.fasterxml.jackson.core.type.TypeReference<T> typeRef,
                                                                   int maxRetries,
                                                                   int currentAttempt) {
        return executeWithFallback(primary, systemPrompt, userMessage)
                .thenCompose(responseJson -> {
                    try {
                        T parsedResult = classType != null 
                            ? outputValidator.validateAndParse(responseJson, classType)
                            : outputValidator.validateAndParse(responseJson, typeRef);
                            
                        return CompletableFuture.completedFuture(parsedResult);
                    } catch (com.example.smartcity.ai_orchestrator.validation.AiValidationException ex) {
                        if (currentAttempt < maxRetries) {
                            log.warn("⚠️ [Validation] Retry {}/{} do lỗi JSON: {}", currentAttempt + 1, maxRetries, ex.getMessage());
                            // Sửa lại user message để feedback lỗi cho LLM
                            String correctiveMessage = userMessage + "\n\n⚠️ LỖI: Lần sinh JSON trước của bạn bị lỗi sau:\n" + ex.getMessage() + "\nHãy sửa lại và trả về JSON chuẩn xác.";
                            return executeWithValidationInternal(primary, systemPrompt, correctiveMessage, classType, typeRef, maxRetries, currentAttempt + 1);
                        } else {
                            log.error("❌ [Validation] Đã hết lượt Retry. LLM vẫn sinh sai JSON.");
                            CompletableFuture<T> failed = new CompletableFuture<>();
                            failed.completeExceptionally(ex);
                            return failed;
                        }
                    }
                });
    }

    // ──────────────────────────────────────────────────────────────
    //  EXECUTE STREAM (SSE) với Circuit Breaker + Auto-Fallback
    // ──────────────────────────────────────────────────────────────
    
    public reactor.core.publisher.Flux<String> executeStreamWithFallback(AiProviderAdapter primary,
                                                                         String systemPrompt,
                                                                         String userMessage) {
        if (primary == null) {
            return reactor.core.publisher.Flux.just("⏳ Hệ thống AI đang quá tải. Vui lòng thử lại sau.");
        }

        String providerName = primary.getProviderName();
        CircuitBreaker cb = circuitBreakerRegistry.circuitBreaker(providerName);

        // Kiểm tra CB (Fail-fast)
        if (!cb.tryAcquirePermission()) {
            log.warn("🔴 [Router] Resilience4j CB-{} OPEN → Fail-fast → Fallback Stream", providerName);
            return fallbackStream(primary, systemPrompt, userMessage);
        }

        long start = System.currentTimeMillis();

        return primary.generateStream(systemPrompt, userMessage)
                // Cập nhật Metrics khi stream kết thúc (hoặc lỗi)
                .doOnComplete(() -> {
                    long latency = System.currentTimeMillis() - start;
                    metrics.recordCall(providerName, latency, true);
                    cb.onSuccess(latency, java.util.concurrent.TimeUnit.MILLISECONDS);
                })
                .doOnError(error -> {
                    long latency = System.currentTimeMillis() - start;
                    metrics.recordCall(providerName, latency, false);
                    cb.onError(latency, java.util.concurrent.TimeUnit.MILLISECONDS, error);
                    log.warn("⚠️  [Router] {} Stream lỗi → {}", providerName, error.getMessage());
                })
                // Fallback nếu stream ném lỗi giữa chừng
                .onErrorResume(ex -> fallbackStream(primary, systemPrompt, userMessage));
    }

    private reactor.core.publisher.Flux<String> fallbackStream(AiProviderAdapter failed,
                                                               String systemPrompt,
                                                               String userMessage) {
        AiProviderAdapter backup = providers.stream()
                .filter(p -> !p.getProviderName().equals(failed.getProviderName())
                        && p.isHealthy()
                        && circuitAllows(p.getProviderName()))
                .findFirst()
                .orElse(null);

        if (backup == null) {
            return reactor.core.publisher.Flux.just("⏳ Tất cả AI provider đang quá tải. Vui lòng thử lại sau 1-2 phút.");
        }

        log.info("🔄 [Router] Fallback Stream: {} → {}", failed.getProviderName(), backup.getProviderName());
        return reactor.core.publisher.Flux.just("\n[Đang chuyển sang " + backup.getProviderName() + "...]\n")
                .concatWith(backup.generateStream(systemPrompt, userMessage));
    }

    // ──────────────────────────────────────────────────────────────
    //  HELPERS
    // ──────────────────────────────────────────────────────────────

    public AiProviderAdapter getProviderByName(String name) {
        return providers.stream()
                .filter(p -> p.getProviderName().equalsIgnoreCase(name) && p.isHealthy())
                .findFirst()
                .orElse(null);
    }

    private AiProviderAdapter getHealthyProvider(String preferredName) {
        AiProviderAdapter preferred = getProviderByName(preferredName);
        if (preferred != null && circuitAllows(preferredName)) return preferred;

        return providers.stream()
                .filter(p -> p.isHealthy() && circuitAllows(p.getProviderName()))
                .findFirst()
                .orElse(null);
    }

    private boolean circuitAllows(String providerName) {
        CircuitBreaker cb = circuitBreakerRegistry.circuitBreaker(providerName);
        return cb.getState() == CircuitBreaker.State.CLOSED || cb.getState() == CircuitBreaker.State.HALF_OPEN;
    }

    private CompletableFuture<String> fallback(AiProviderAdapter failed,
                                                String systemPrompt,
                                                String userMessage) {
        AiProviderAdapter backup = providers.stream()
                .filter(p -> !p.getProviderName().equals(failed.getProviderName())
                        && p.isHealthy()
                        && circuitAllows(p.getProviderName()))
                .findFirst()
                .orElse(null);

        if (backup == null) {
            return CompletableFuture.completedFuture(
                "⏳ Tất cả AI provider đang quá tải. Vui lòng thử lại sau 1-2 phút."
            );
        }

        log.info("🔄 [Router] Fallback: {} → {}", failed.getProviderName(), backup.getProviderName());
        return backup.generateResponseAsync(systemPrompt, userMessage)
                .thenApply(r -> r + " [via " + backup.getProviderName() + " fallback]");
    }

    private int evaluateComplexity(String message) {
        if (message == null || message.isBlank()) return 1;

        int score = 0;
        String lower = message.toLowerCase();

        if (message.length() > 100) score += 2;
        else if (message.length() > 50) score += 1;

        long questionMarks = message.chars().filter(c -> c == '?').count();
        if (questionMarks > 1) score += 1;

        List<String> complexWords = List.of(
            "tại sao", "phân tích", "so sánh", "explain", "why", "analyze",
            "compare", "giải thích", "chứng minh", "evaluate", "design", "architect"
        );
        if (complexWords.stream().anyMatch(lower::contains)) score += 3;

        if (lower.contains("`") || lower.contains("{") || lower.contains("}") || lower.contains("=>")) score += 2;

        if (message.matches(".*\\d+.*")) score += 1;

        long latinCount = message.chars().filter(c -> c >= 'a' && c <= 'z').count();
        if (latinCount > message.length() * 0.6) score += 1;

        log.debug("📊 [Router] Complexity score={} for: '{}'...",
                score, message.substring(0, Math.min(40, message.length())));
        return Math.min(score, 10);
    }

    public List<Map<String, Object>> getCircuitBreakerStats() {
        return circuitBreakerRegistry.getAllCircuitBreakers().stream().map(cb -> {
            Map<String, Object> stats = new HashMap<>();
            stats.put("provider", cb.getName());
            stats.put("state", cb.getState().name());
            stats.put("failures", cb.getMetrics().getNumberOfFailedCalls());
            stats.put("successes", cb.getMetrics().getNumberOfSuccessfulCalls());
            return stats;
        }).toList();
    }
}



