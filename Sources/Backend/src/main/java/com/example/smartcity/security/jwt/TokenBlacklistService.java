package com.example.smartcity.security.jwt;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class TokenBlacklistService {

    // Map chứa token bị cấm và thời gian hết hạn (Epoch Milliseconds) của nó
    private final Map<String, Long> blacklist = new ConcurrentHashMap<>();

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
        blacklist.put(token, expirationMs);
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
        Long expiration = blacklist.get(token);
        if (expiration == null) {
            return false;
        }
        // Nếu token trong blacklist đã hết hạn thực tế, xóa khỏi map để giải phóng bộ nhớ
        if (expiration < System.currentTimeMillis()) {
            blacklist.remove(token);
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
