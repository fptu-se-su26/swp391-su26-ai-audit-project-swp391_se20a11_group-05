package com.example.smartcity.modules.auth.service;

import com.example.smartcity.common.exception.CustomException;
import com.example.smartcity.modules.auth.entity.RefreshToken;
import com.example.smartcity.modules.auth.payload.TokenPairResponse;
import com.example.smartcity.modules.auth.repository.RefreshTokenRepository;
import com.example.smartcity.modules.user.entity.User;
import com.example.smartcity.modules.user.repository.UserRepository;
import com.example.smartcity.security.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Collections;
import java.util.HexFormat;

/**
 * Quản lý toàn bộ vòng đời Refresh Token:
 * - Tạo cặp token (access + refresh) sau khi login thành công
 * - Rotation: đổi refresh token cũ lấy cặp token mới
 * - Phát hiện tái sử dụng (reuse attack)
 * - Thu hồi token khi logout
 * - Cleanup định kỳ token hết hạn
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;

    @Value("${jwt.refresh-expiration-ms:604800000}") // 7 ngày mặc định
    private long refreshExpirationMs;

    @Value("${jwt.expiration-ms:900000}")
    private long accessExpirationMs;

    // ThreadLocal SHA-256 — tránh khởi tạo lại mỗi lần gọi
    private static final ThreadLocal<MessageDigest> SHA_256 = ThreadLocal.withInitial(() -> {
        try {
            return MessageDigest.getInstance("SHA-256");
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 không khả dụng", e);
        }
    });

    // ─── Public API ──────────────────────────────────────────────────────────

    /**
     * Tạo cặp Access Token + Refresh Token sau khi login thành công.
     */
    @Transactional
    public TokenPairResponse createTokenPair(User user) {
        String accessToken  = jwtTokenProvider.generateTokenFromUsername(user.getUsername());
        String refreshToken = generateSecureRefreshToken();

        // Lưu hash của refresh token vào DB
        RefreshToken entity = new RefreshToken();
        entity.setUserId(user.getId());
        entity.setTokenHash(hashToken(refreshToken));
        entity.setExpiresAt(Instant.now().plusMillis(refreshExpirationMs));
        refreshTokenRepository.save(entity);

        log.info("[RefreshToken] Tạo token pair cho user '{}'", user.getUsername());

        String orgName = "";
        if (user.getWard() != null) {
            if (user.getRole() == com.example.smartcity.modules.user.entity.Role.POLICE) {
                orgName = "Công an Phường " + user.getWard().getName();
            } else if (user.getRole() == com.example.smartcity.modules.user.entity.Role.WARD_STAFF) {
                orgName = "UBND Phường " + user.getWard().getName();
            } else {
                orgName = user.getWard().getName();
            }
        }

        return TokenPairResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .expiresIn(accessExpirationMs / 1000)
                .username(user.getUsername())
                .role("ROLE_" + user.getRole().name())
                .org(orgName)
                .build();
    }

    /**
     * Rotation: Xác minh refresh token → trả về cặp token mới → hủy token cũ.
     * Nếu phát hiện token đã bị dùng trước đó → thu hồi toàn bộ (reuse attack).
     */
    @Transactional
    public TokenPairResponse rotate(String refreshToken) {
        String tokenHash = hashToken(refreshToken);

        RefreshToken entity = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> {
                    log.warn("[RefreshToken] Token không tồn tại trong DB");
                    return new CustomException("Refresh token không hợp lệ hoặc đã hết hạn.", 401);
                });

        // Phát hiện tái sử dụng — dấu hiệu token bị đánh cắp
        if (entity.isUsed()) {
            log.error("[SECURITY ALERT] Refresh token bị tái sử dụng cho user_id={}. Thu hồi toàn bộ token!", entity.getUserId());
            refreshTokenRepository.deleteByUserId(entity.getUserId());
            throw new CustomException("Phiên làm việc không hợp lệ. Vui lòng đăng nhập lại.", 401);
        }

        // Kiểm tra hết hạn
        if (entity.getExpiresAt().isBefore(Instant.now())) {
            log.warn("[RefreshToken] Token hết hạn cho user_id={}", entity.getUserId());
            throw new CustomException("Refresh token đã hết hạn. Vui lòng đăng nhập lại.", 401);
        }

        // Đánh dấu token cũ đã dùng — ONE-TIME USE
        entity.setUsed(true);
        entity.setUsedAt(Instant.now());
        refreshTokenRepository.save(entity);

        // Lấy thông tin user và tạo cặp token mới
        User user = userRepository.findById(entity.getUserId())
                .orElseThrow(() -> new CustomException("Tài khoản không tồn tại.", 404));

        log.info("[RefreshToken] Rotation thành công cho user '{}'", user.getUsername());
        return createTokenPair(user);
    }

    /**
     * Thu hồi toàn bộ refresh token của user khi logout.
     */
    @Transactional
    public void revokeAll(Long userId) {
        int deleted = refreshTokenRepository.deleteByUserId(userId);
        log.info("[RefreshToken] Đã thu hồi {} refresh token của user_id={}", deleted, userId);
    }

    /**
     * Dọn dẹp token hết hạn — chạy hàng ngày lúc 2 giờ sáng.
     */
    @Scheduled(cron = "0 0 2 * * ?")
    @Transactional
    public void cleanupExpiredTokens() {
        int deleted = refreshTokenRepository.deleteExpiredTokens(Instant.now());
        if (deleted > 0) {
            log.info("[RefreshToken] Cleanup: đã xóa {} token hết hạn", deleted);
        }
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    /** Tạo refresh token ngẫu nhiên 256-bit (32 bytes) */
    private String generateSecureRefreshToken() {
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    /** Hash token bằng SHA-256 trước khi lưu DB */
    private String hashToken(String token) {
        MessageDigest digest = SHA_256.get();
        digest.reset();
        byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
        return HexFormat.of().formatHex(hash);
    }
}
