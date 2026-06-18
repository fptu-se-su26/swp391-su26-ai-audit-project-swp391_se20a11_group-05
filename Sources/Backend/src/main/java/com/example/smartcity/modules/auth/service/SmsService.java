package com.example.smartcity.modules.auth.service;

import com.example.smartcity.modules.auth.entity.SmsVerification;
import com.example.smartcity.modules.auth.repository.SmsVerificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import jakarta.annotation.PostConstruct;
import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;

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

    private String twilioAccountSid;
    private String twilioAuthToken;
    private String twilioPhoneNumber;

    @PostConstruct
    public void initTwilio() {
        twilioAccountSid = securityManager.getSecret("twilio.account-sid");
        twilioAuthToken = securityManager.getSecret("twilio.auth-token");
        twilioPhoneNumber = securityManager.getSecret("twilio.phone-number");

        if (twilioAccountSid != null && twilioAuthToken != null) {
            Twilio.init(twilioAccountSid, twilioAuthToken);
            log.info("Twilio initialized successfully!");
        } else {
            log.warn("Twilio secrets not found. SMS features will be disabled.");
        }
    }

    @Transactional
    public String generateAndSendOtp(String phoneNumber) {
        // [FIX] Hủy tất cả các mã OTP cũ chưa sử dụng của số điện thoại này để tránh lỗi "nhập đúng thành sai"
        java.util.List<SmsVerification> oldTokens = smsVerificationRepository.findByPhoneNumberAndIsUsedFalse(phoneNumber);
        if (!oldTokens.isEmpty()) {
            for (SmsVerification token : oldTokens) {
                token.setIsUsed(true);
            }
            smsVerificationRepository.saveAll(oldTokens);
        }
        
        // [TEMP MOCK] OTP API/SMS provider is not ready for the demo flow yet.
        // Keep the normal DB/hash/verify path, but make the accepted code deterministic.
        String otpCode = MOCK_OTP_CODE;

        // [UPGRADE] Băm (Hash) mã OTP trước khi lưu vào DB bằng BCrypt (Chống lộ lọt Database)
        saveOtpRecord(phoneNumber, passwordEncoder.encode(otpCode));

        // [FIX] Chạy Bất đồng bộ (Async) để không làm sập server khi có 10.000 người gửi SMS cùng lúc
        java.util.concurrent.CompletableFuture.runAsync(() -> {
            try {
                // EXTERNAL API CALL: Không bọc trong Transaction để tránh nghẽn Connection Pool
                Message message = Message.creator(
                        new PhoneNumber(phoneNumber),
                        new PhoneNumber(twilioPhoneNumber),
                        "Mã xác thực SmartCity của bạn là: " + otpCode + ". Mã có hiệu lực trong " + OTP_VALID_DURATION_MINUTES + " phút."
                ).create();

                log.info("========== TWILIO SMS GATEWAY ==========");
                log.info("Sending SMS to: {}", phoneNumber);
                log.info("Twilio Message SID: {}", message.getSid());
                log.info("========================================");
            } catch (Exception e) {
                log.error("Lỗi khi gửi tin nhắn Twilio cho số {}: {}", phoneNumber, e.getMessage());
            }
        });

        return "Mã OTP đã được gửi đến số điện thoại của bạn.";
    }

    @Transactional
    public void saveOtpRecord(String phoneNumber, String otpCode) {
        SmsVerification verification = SmsVerification.builder()
                .phoneNumber(phoneNumber)
                .otpCode(otpCode)
                .purpose("LOGIN")
                .expiresAt(LocalDateTime.now().plusMinutes(OTP_VALID_DURATION_MINUTES))
                .build();
        smsVerificationRepository.save(verification);
    }

    @Transactional
    public boolean verifyOtp(String phoneNumber, String otpCode) {
        Optional<SmsVerification> optionalVerification = smsVerificationRepository
                .findTopByPhoneNumberAndIsUsedFalseOrderByCreatedAtDesc(phoneNumber);

        if (optionalVerification.isEmpty()) {
            throw new RuntimeException("Không tìm thấy mã OTP hoặc mã đã được sử dụng.");
        }

        SmsVerification verification = optionalVerification.get();

        // BƯỚC 1: Kiểm tra hết hạn TRƯỚC TIÊN — không tăng attempts vì lỗi do hệ thống
        if (verification.getExpiresAt().isBefore(LocalDateTime.now())) {
            verification.setIsUsed(true); // Vô hiệu hóa mã hết hạn
            smsVerificationRepository.save(verification);
            throw new RuntimeException("Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.");
        }

        // BƯỚC 2: Kiểm tra xem đã quá số lần thử chưa (trước khi tăng)
        if (verification.getAttempts() >= MAX_ATTEMPTS) {
            verification.setIsUsed(true); // Vô hiệu hóa mã bị brute-force
            smsVerificationRepository.save(verification);
            throw new RuntimeException("Bạn đã nhập sai quá " + MAX_ATTEMPTS + " lần. Vui lòng yêu cầu mã OTP mới.");
        }

        // BƯỚC 3: Kiểm tra mã đúng/sai (Dùng thư viện BCrypt Matches thay vì Equal)
        if (!passwordEncoder.matches(otpCode, verification.getOtpCode())) {
            verification.setAttempts(verification.getAttempts() + 1); // Tăng attempts khi nhập sai
            
            // [UPGRADE] Nếu nhập sai 3 lần, khóa mã ngay lập tức
            if (verification.getAttempts() >= MAX_ATTEMPTS) {
                verification.setIsUsed(true);
            }
            
            smsVerificationRepository.save(verification);
            int remaining = Math.max(0, MAX_ATTEMPTS - verification.getAttempts());
            throw new RuntimeException("Mã OTP không chính xác. Bạn còn " + remaining + " lần thử.");
        }

        // BƯỚC 4: Thành công → Đánh dấu đã sử dụng, không thể dùng lại
        verification.setIsUsed(true);
        verification.setVerifiedAt(LocalDateTime.now());
        smsVerificationRepository.save(verification);

        return true;
    }
}
