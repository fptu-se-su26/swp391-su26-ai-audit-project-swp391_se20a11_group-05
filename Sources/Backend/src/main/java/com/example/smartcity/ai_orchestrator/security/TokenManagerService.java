package com.example.smartcity.ai_orchestrator.security;

import io.github.resilience4j.ratelimiter.RateLimiter;
import io.github.resilience4j.ratelimiter.RateLimiterConfig;
import io.github.resilience4j.ratelimiter.RateLimiterRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * [TÍNH NĂNG MỚI] Token Manager Service — Distributed Rate Limiting & Cost Tracking
 *
 * Nhiệm vụ:
 * 1. Chống Spam / DDoS API: Mỗi User chỉ được hỏi 20 câu / 1 giờ.
 * 2. Theo dõi (Cost Tracking): Đếm số lượng request của mỗi User để biết ai đang "đốt" token nhiều nhất.
 */
@Service
@Slf4j
public class TokenManagerService {

    // Giới hạn: 20 request mỗi 60 phút
    private static final int LIMIT_FOR_PERIOD = 20;
    private static final Duration LIMIT_REFRESH_PERIOD = Duration.ofMinutes(60);

    private final RateLimiterRegistry rateLimiterRegistry;
    
    // Lưu trữ tạm số lượng câu hỏi đã gọi của mỗi User (Dùng làm cơ sở Cost Tracking)
    private final Map<String, AtomicInteger> userUsageCount = new ConcurrentHashMap<>();

    public TokenManagerService() {
        // Cấu hình chuẩn cho RateLimiter
        RateLimiterConfig config = RateLimiterConfig.custom()
            .limitRefreshPeriod(LIMIT_REFRESH_PERIOD)
            .limitForPeriod(LIMIT_FOR_PERIOD)
            .timeoutDuration(Duration.ofMillis(100)) // Đợi tối đa 100ms lấy token, ko có thì reject ngay
            .build();

        this.rateLimiterRegistry = RateLimiterRegistry.of(config);
        log.info("✅ [Token Manager] Đã khởi tạo RateLimiter ({} req / {} min).", LIMIT_FOR_PERIOD, LIMIT_REFRESH_PERIOD.toMinutes());
    }

    /**
     * Kiểm tra xem user có được phép sử dụng AI không.
     * @param userId ID của người dùng
     * @return true nếu hợp lệ, false nếu vượt quá quota.
     */
    public boolean acquirePermission(String userId) {
        RateLimiter rateLimiter = rateLimiterRegistry.rateLimiter("user-" + userId);
        boolean isAllowed = rateLimiter.acquirePermission();

        if (isAllowed) {
            userUsageCount.computeIfAbsent(userId, k -> new AtomicInteger(0)).incrementAndGet();
            log.debug("🟢 [Token Manager] User {} được duyệt ({} request)", userId, userUsageCount.get(userId));
        } else {
            log.warn("🔴 [Token Manager] BLOCK! User {} đã vượt quá giới hạn AI ({} req / {} min)", 
                     userId, LIMIT_FOR_PERIOD, LIMIT_REFRESH_PERIOD.toMinutes());
        }

        return isAllowed;
    }

    /**
     * Lấy thông kê sử dụng của toàn bộ hệ thống
     */
    public Map<String, Integer> getUsageStats() {
        Map<String, Integer> stats = new java.util.HashMap<>();
        userUsageCount.forEach((user, count) -> stats.put(user, count.get()));
        return stats;
    }
}
