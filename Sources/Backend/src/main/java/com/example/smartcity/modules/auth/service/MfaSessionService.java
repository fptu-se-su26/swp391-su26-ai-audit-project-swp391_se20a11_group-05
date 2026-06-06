package com.example.smartcity.modules.auth.service;

import com.example.smartcity.common.exception.CustomException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class MfaSessionService {

    // Map: mfaToken -> (userId)
    // Lưu ý: Trong môi trường thực tế, nên dùng Redis.
    private final Map<String, MfaSession> sessions = new ConcurrentHashMap<>();

    private static class MfaSession {
        Long userId;
        long expirationTimeMs;

        public MfaSession(Long userId, long expirationTimeMs) {
            this.userId = userId;
            this.expirationTimeMs = expirationTimeMs;
        }
    }

    public String createSession(Long userId) {
        String mfaToken = UUID.randomUUID().toString();
        // Thời gian sống của Token là 5 phút
        long expirationTimeMs = System.currentTimeMillis() + (5 * 60 * 1000);
        sessions.put(mfaToken, new MfaSession(userId, expirationTimeMs));
        log.info("Đã tạo MFA Session cho User ID: {}", userId);
        return mfaToken;
    }

    public Long validateSession(String mfaToken) {
        MfaSession session = sessions.get(mfaToken);
        if (session == null) {
            throw new CustomException("Phiên xác thực MFA không hợp lệ hoặc không tồn tại.", 401);
        }
        if (session.expirationTimeMs < System.currentTimeMillis()) {
            sessions.remove(mfaToken);
            throw new CustomException("Phiên xác thực MFA đã hết hạn.", 401);
        }
        return session.userId;
    }

    public void invalidateSession(String mfaToken) {
        sessions.remove(mfaToken);
    }

    @Scheduled(fixedRate = 300000) // Dọn dẹp mỗi 5 phút
    public void cleanupExpiredSessions() {
        long now = System.currentTimeMillis();
        int initialSize = sessions.size();
        sessions.entrySet().removeIf(entry -> entry.getValue().expirationTimeMs < now);
        int cleared = initialSize - sessions.size();
        if (cleared > 0) {
            log.info("Đã dọn dẹp {} phiên MFA hết hạn.", cleared);
        }
    }
}
