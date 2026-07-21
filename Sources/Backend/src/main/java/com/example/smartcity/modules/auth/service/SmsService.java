package com.example.smartcity.modules.auth.service;

import com.example.smartcity.modules.auth.entity.SmsVerification;
import com.example.smartcity.modules.auth.repository.SmsVerificationRepository;
import com.example.smartcity.common.exception.CustomException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import jakarta.annotation.PostConstruct;

import com.vonage.client.VonageClient;
import com.vonage.client.verify.VerifyResponse;
import com.vonage.client.verify.VerifyStatus;
import com.vonage.client.verify.CheckResponse;

@Service
@RequiredArgsConstructor
@Slf4j
public class SmsService {

    private final SmsVerificationRepository smsVerificationRepository;
    private static final int OTP_VALID_DURATION_MINUTES = 5;
    private static final int MAX_ATTEMPTS = 3;
    private static final String MOCK_OTP_CODE = "123456";

    private final com.example.smartcity.security.secrets.SecurityManager securityManager;
    private final PasswordEncoder passwordEncoder;
    private final org.springframework.core.env.Environment environment;

    private VonageClient vonageClient;
    private String vonageApiKey;
    private String vonageApiSecret;
    private String vonageFromName;

    @PostConstruct
    public void initVonage() {
        vonageApiKey = securityManager.getSecret("VONAGE_API_KEY");
        vonageApiSecret = securityManager.getSecret("VONAGE_API_SECRET");
        vonageFromName = securityManager.getSecret("VONAGE_FROM_NAME");
        if (vonageFromName == null || vonageFromName.isBlank()) {
            vonageFromName = "SmartCity";
        }

        if (vonageApiKey != null && vonageApiSecret != null && !vonageApiKey.isBlank()) {
            vonageClient = VonageClient.builder()
                    .apiKey(vonageApiKey)
                    .apiSecret(vonageApiSecret)
                    .build();
            log.info("Vonage client initialized successfully with Verify API!");
        } else {
            log.warn("Vonage secrets not found. SMS features will be disabled.");
        }
    }

    @Transactional
    public String generateAndSendOtp(String phoneNumber) {
        // Hủy tất cả các yêu cầu cũ chưa sử dụng
        java.util.List<SmsVerification> oldTokens = smsVerificationRepository.findByPhoneNumberAndIsUsedFalse(phoneNumber);
        if (!oldTokens.isEmpty()) {
            for (SmsVerification token : oldTokens) {
                token.setIsUsed(true);
            }
            smsVerificationRepository.saveAll(oldTokens);
        }

        if (vonageClient == null) {
            if (isDevOrLocal()) {
                log.warn("Vonage client is not initialized. Using MOCK Verify.");
                saveOtpRecord(phoneNumber, "MOCK_REQUEST_ID_12345");
                return "Mã OTP đã được gửi đến số điện thoại của bạn (MOCK MODE).";
            }
            log.error("Vonage client is missing in production. Falling back to Firebase.");
            throw new CustomException("Dịch vụ SMS tạm thời không khả dụng", 503);
        }

        try {
            // Chuẩn hóa số điện thoại: 09... -> 849...
            String formattedPhone = phoneNumber.replaceAll("\\+", "");
            if (formattedPhone.startsWith("0")) {
                formattedPhone = "84" + formattedPhone.substring(1);
            }

            log.info("Calling Vonage Verify API for number: {}", formattedPhone);
            com.vonage.client.verify.VerifyRequest request = com.vonage.client.verify.VerifyRequest.builder(formattedPhone, vonageFromName)
                    .length(6) // Yêu cầu mã xác thực gồm 6 chữ số
                    .build();
            VerifyResponse response = vonageClient.getVerifyClient().verify(request);

            if (response.getStatus() == VerifyStatus.OK) {
                String requestId = response.getRequestId();
                log.info("Vonage Verify RequestID: {}", requestId);
                
                // Lưu RequestID vào cột otp_code để check sau này
                saveOtpRecord(phoneNumber, requestId);
                return "Mã xác thực đã được gửi đến điện thoại của bạn qua Vonage Verify.";
            } else {
                log.error("Lỗi từ Vonage: {} - {}", response.getStatus(), response.getErrorText());
                throw new CustomException("Không thể gửi mã xác thực: " + response.getErrorText(), 400);
            }
        } catch (Exception e) {
            if (e instanceof CustomException) throw (CustomException) e;
            log.error("Lỗi khi gọi Vonage Verify API cho số {}: {}", phoneNumber, e.getMessage());
            throw new CustomException("Lỗi hệ thống khi gửi tin nhắn SMS.", 500);
        }
    }

    @Transactional
    public void saveOtpRecord(String phoneNumber, String requestId) {
        SmsVerification verification = SmsVerification.builder()
                .phoneNumber(phoneNumber)
                // Dùng cột otpCode để lưu requestID của Vonage Verify
                .otpCode(requestId)
                .purpose("LOGIN")
                .expiresAt(LocalDateTime.now().plusMinutes(OTP_VALID_DURATION_MINUTES))
                .build();
        smsVerificationRepository.save(verification);
    }

    @Transactional
    public boolean verifyOtp(String phoneNumber, String userCode) {
        Optional<SmsVerification> optionalVerification = smsVerificationRepository
                .findTopByPhoneNumberAndIsUsedFalseOrderByCreatedAtDesc(phoneNumber);

        if (optionalVerification.isEmpty()) {
            throw new CustomException("Không tìm thấy yêu cầu xác thực hoặc mã đã được sử dụng.", 400);
        }

        SmsVerification verification = optionalVerification.get();

        if (verification.getExpiresAt().isBefore(LocalDateTime.now())) {
            verification.setIsUsed(true);
            smsVerificationRepository.save(verification);
            throw new CustomException("Yêu cầu xác thực đã hết hạn. Vui lòng yêu cầu mã mới.", 400);
        }

        if (verification.getAttempts() >= MAX_ATTEMPTS) {
            verification.setIsUsed(true);
            smsVerificationRepository.save(verification);
            throw new CustomException("Bạn đã nhập sai quá " + MAX_ATTEMPTS + " lần. Vui lòng yêu cầu mã mới.", 400);
        }

        String requestId = verification.getOtpCode();

        // MOCK MODE fallback
        if ("MOCK_REQUEST_ID_12345".equals(requestId)) {
            if ("123456".equals(userCode)) {
                verification.setIsUsed(true);
                verification.setVerifiedAt(LocalDateTime.now());
                smsVerificationRepository.save(verification);
                return true;
            } else {
                throw new CustomException("Mã OTP không chính xác.", 400);
            }
        }

        if (vonageClient == null) {
            throw new CustomException("Hệ thống SMS Vonage chưa được khởi tạo.", 503);
        }

        try {
            log.info("Checking Vonage Verify Code for RequestID: {}", requestId);
            CheckResponse response = vonageClient.getVerifyClient().check(requestId, userCode);

            if (response.getStatus() == VerifyStatus.OK) {
                log.info("Verification Successful for RequestID: {}", requestId);
                verification.setIsUsed(true);
                verification.setVerifiedAt(LocalDateTime.now());
                smsVerificationRepository.save(verification);
                return true;
            } else {
                log.error("Verification failed: {}", response.getErrorText());
                verification.setAttempts(verification.getAttempts() + 1);
                if (verification.getAttempts() >= MAX_ATTEMPTS) {
                    verification.setIsUsed(true);
                }
                smsVerificationRepository.save(verification);
                
                int remaining = Math.max(0, MAX_ATTEMPTS - verification.getAttempts());
                throw new CustomException("Mã xác minh không chính xác (" + response.getErrorText() + "). Bạn còn " + remaining + " lần thử.", 400);
            }
        } catch (Exception e) {
            if (e instanceof CustomException) throw (CustomException) e;
            log.error("Lỗi khi verify Vonage OTP: {}", e.getMessage());
            throw new CustomException("Lỗi hệ thống khi xác minh SMS.", 500);
        }
    }

    private boolean isDevOrLocal() {
        String[] profiles = environment.getActiveProfiles();
        if (profiles.length == 0) return true;
        for (String profile : profiles) {
            if ("dev".equals(profile) || "local".equals(profile) || "test".equals(profile)) {
                return true;
            }
        }
        return false;
    }
}
