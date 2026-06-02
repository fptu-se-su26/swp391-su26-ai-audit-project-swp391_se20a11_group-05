package com.example.smartcity.security.jwt;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Service
@Slf4j
/**
 * JWT Token Blacklist — In-Memory implementation (Caffeine-backed ConcurrentHashMap).
 *
 * <p><b>Known Trade-off:</b> Khi server restart, danh sách token bị thu hồi (logout) sẽ bị mất.
 * Token đã logout vẫn có thể được dùng lại trong tối đa 15 phút (thời gian sống còn lại của Access Token).
 *
 * <p><b>Acceptable Risk:</b> Với Access Token 15 phút, cửa sổ tấn công rất nhỏ.
 * Để loại bỏ hoàn toàn: thay thế bằng {@code RedisTokenBlacklist} cho môi trường
 * phân tán nhiều instance.
 */
public class TokenBlacklistService {

    // Map chứa token bị cấm và thời gian hết hạn (Epoch Milliseconds) của nó
    private final Map<String, Long> blacklist = new ConcurrentHashMap<>();

    // [SECURITY FIX] Tối ưu CPU overhead khi tính SHA-256 bằng ThreadLocal
    private static final ThreadLocal<MessageDigest> SHA_256 = ThreadLocal.withInitial(() -> {
        try {
            return MessageDigest.getInstance("SHA-256");
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 không khả dụng", e);
        }
    });

    private String hashToken(String token) {
        MessageDigest digest = SHA_256.get();
        digest.reset();
        byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
        return Base64.getEncoder().encodeToString(hash);
    }

    /**
     * Đưa token vào danh sách đen.
     *
     * @param token           Mã token JWT
     * @param expirationMs    Thời gian hết hạn của token tính bằng mili giây
     */
    public void blacklistToken(String token, long expirationMs) {
        if (token == null || token.isEmpty()) {
            return;
        }
        String tokenHash = hashToken(token);
        blacklist.put(tokenHash, expirationMs);
        log.info("Token đã được đưa vào danh sách đen thành công. Sẽ hết hiệu lực hoàn toàn sau: {} ms", expirationMs - System.currentTimeMillis());
    }

    /**
     * Kiểm tra xem token có nằm trong danh sách đen hay không.
     *
     * @param token Mã token JWT
     * @return true nếu token bị khóa, ngược lại false
     */
    public boolean isBlacklisted(String token) {
        if (token == null || token.isEmpty()) {
            return false;
        }
        String tokenHash = hashToken(token);
        Long expiration = blacklist.get(tokenHash);
        if (expiration == null) {
            return false;
        }
        // Nếu token trong blacklist đã hết hạn thực tế, xóa khỏi map để giải phóng bộ nhớ
        if (expiration < System.currentTimeMillis()) {
            blacklist.remove(tokenHash);
            return false;
        }
        return true;
    }

    /**
     * Tự động dọn dẹp các token đã hết hạn trong Blacklist định kỳ mỗi giờ
     * để tránh rò rỉ bộ nhớ (Memory Leak) trong JVM.
     */
    @Scheduled(fixedRate = 3600000) // 1 giờ chạy một lần
    public void cleanExpiredTokens() {
        long now = System.currentTimeMillis();
        int initialSize = blacklist.size();
        blacklist.entrySet().removeIf(entry -> entry.getValue() < now);
        int clearedCount = initialSize - blacklist.size();
        if (clearedCount > 0) {
            log.info("Đã dọn dẹp tự động {} token hết hạn khỏi JWT Blacklist.", clearedCount);
        }
    }
}
