package com.example.smartcity.security.ratelimit;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;

/**
 * Sliding Window Rate Limiter — dùng Caffeine in-memory cache.
 *
 * <p>Bảo vệ 3 endpoint:
 * <ul>
 *   <li><b>Login</b>: 5 lần / 15 phút theo IP (chống Brute-force password)</li>
 *   <li><b>SMS OTP Send</b>: 3 lần / 10 phút theo số điện thoại (chống spam SMS)</li>
 *   <li><b>Register</b>: 5 lần / 1 giờ theo IP (chống tạo tài khoản ảo hàng loạt)</li>
 * </ul>
 *
 * <p><b>Algorithm:</b> Sliding Window — chỉ đếm các request trong khoảng thời gian
 * [now - window, now], loại bỏ timestamp cũ liên tục thay vì reset cứng.
 */
@Component
@Slf4j
public class AuthRateLimiter {

    @Value("${rate-limit.login.max-attempts:5}")
    private int loginMaxAttempts;

    @Value("${rate-limit.login.window-minutes:15}")
    private int loginWindowMinutes;

    @Value("${rate-limit.sms.max-attempts:3}")
    private int smsMaxAttempts;

    @Value("${rate-limit.sms.window-minutes:10}")
    private int smsWindowMinutes;

    @Value("${rate-limit.register.max-attempts:5}")
    private int registerMaxAttempts;

    @Value("${rate-limit.register.window-minutes:60}")
    private int registerWindowMinutes;

    // Cache cho từng loại endpoint — key = IP hoặc phone number
    private final Cache<String, SlidingWindowBucket> loginBuckets = Caffeine.newBuilder()
            .maximumSize(10_000)
            .expireAfterWrite(Duration.ofMinutes(20))
            .build();

    private final Cache<String, SlidingWindowBucket> smsBuckets = Caffeine.newBuilder()
            .maximumSize(5_000)
            .expireAfterWrite(Duration.ofMinutes(15))
            .build();

    private final Cache<String, SlidingWindowBucket> registerBuckets = Caffeine.newBuilder()
            .maximumSize(10_000)
            .expireAfterWrite(Duration.ofMinutes(65))
            .build();

    // ─── Public API ──────────────────────────────────────────────────────────

    /**
     * Kiểm tra rate limit cho endpoint /login theo IP.
     * Ném RateLimitExceededException nếu vượt 5 lần / 15 phút.
     */
    public void checkLoginLimit(String ipAddress) {
        checkLimit(loginBuckets, "LOGIN:" + ipAddress,
                loginMaxAttempts, Duration.ofMinutes(loginWindowMinutes),
                "Đăng nhập");
    }

    /**
     * Kiểm tra rate limit cho endpoint /sms/send theo số điện thoại.
     * Ném RateLimitExceededException nếu vượt 3 lần / 10 phút.
     */
    public void checkSmsLimit(String phoneNumber) {
        checkLimit(smsBuckets, "SMS:" + phoneNumber,
                smsMaxAttempts, Duration.ofMinutes(smsWindowMinutes),
                "Gửi OTP");
    }

    /**
     * Kiểm tra rate limit cho endpoint /register theo IP.
     * Ném RateLimitExceededException nếu vượt 5 lần / 1 giờ.
     */
    public void checkRegisterLimit(String ipAddress) {
        checkLimit(registerBuckets, "REGISTER:" + ipAddress,
                registerMaxAttempts, Duration.ofMinutes(registerWindowMinutes),
                "Đăng ký");
    }

    // ─── Core Sliding Window Algorithm ──────────────────────────────────────

    private void checkLimit(Cache<String, SlidingWindowBucket> cache,
                            String key, int maxRequests,
                            Duration window, String actionName) {

        SlidingWindowBucket bucket = cache.get(key, k -> new SlidingWindowBucket());
        assert bucket != null;

        synchronized (bucket) {
            Instant now = Instant.now();
            Instant cutoff = now.minus(window);

            // Loại bỏ các timestamp nằm ngoài cửa sổ
            while (!bucket.timestamps.isEmpty()
                    && bucket.timestamps.peekFirst().isBefore(cutoff)) {
                bucket.timestamps.pollFirst();
            }

            // Kiểm tra giới hạn
            if (bucket.timestamps.size() >= maxRequests) {
                Instant oldest = bucket.timestamps.peekFirst();
                assert oldest != null;
                long retryAfter = Duration.between(now, oldest.plus(window)).getSeconds();

                log.warn("[RateLimit] {} bị chặn cho key '{}'. Thử lại sau {}s", actionName, key, retryAfter);

                throw new RateLimitExceededException(
                        "Quá nhiều yêu cầu " + actionName + ". Vui lòng thử lại sau "
                                + retryAfter + " giây.",
                        retryAfter
                );
            }

            // Ghi nhận request hiện tại
            bucket.timestamps.addLast(now);
        }
    }

    // ─── Internal bucket ─────────────────────────────────────────────────────

    private static class SlidingWindowBucket {
        final Deque<Instant> timestamps = new ArrayDeque<>();
    }
}
