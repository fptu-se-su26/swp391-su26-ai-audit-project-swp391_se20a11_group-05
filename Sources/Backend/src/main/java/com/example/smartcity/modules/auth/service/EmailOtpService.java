package com.example.smartcity.modules.auth.service;

import com.example.smartcity.common.exception.CustomException;
import com.example.smartcity.modules.auth.entity.EmailVerification;
import com.example.smartcity.modules.auth.repository.EmailVerificationRepository;
import com.example.smartcity.modules.notification.service.ExternalNotificationService;
import com.example.smartcity.modules.user.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Random;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailOtpService {

    private final EmailVerificationRepository emailVerificationRepository;
    private final ExternalNotificationService externalNotificationService;
    private final PasswordEncoder passwordEncoder;

    private static final int OTP_VALID_DURATION_MINUTES = 5;
    private static final int MAX_ATTEMPTS = 3;
    private static final String MOCK_OTP_CODE = "123456";

    @Transactional
    public String generateAndSendOtp(User user, String email) {
        // Invalidate old unused OTPs
        List<EmailVerification> oldTokens = emailVerificationRepository.findByEmailAndIsUsedFalse(email);
        if (!oldTokens.isEmpty()) {
            for (EmailVerification token : oldTokens) {
                token.setIsUsed(true);
            }
            emailVerificationRepository.saveAll(oldTokens);
        }

        // Generate a random 6-digit OTP code, or fallback to mock
        String otpCode;
        try {
            Random random = new Random();
            otpCode = String.format("%06d", random.nextInt(1000000));
        } catch (Exception e) {
            otpCode = MOCK_OTP_CODE;
        }

        // Save hashed OTP in database
        saveOtpRecord(user, email, passwordEncoder.encode(otpCode));

        // Send via background external notification service (mocked)
        String subject = "Mã xác thực đăng ký chiến dịch - Đà Nẵng Kết Nối";
        String body = "Xin chào " + user.getFullName() + ",\n\n" +
                "Mã xác thực OTP của bạn là: " + otpCode + "\n" +
                "Mã này có hiệu lực trong " + OTP_VALID_DURATION_MINUTES + " phút.\n" +
                "Vui lòng không chia sẻ mã này với bất kỳ ai.\n\n" +
                "Trân trọng,\nBan Tổ Chức Chiến Dịch Cộng Đồng";

        externalNotificationService.sendEmailNotification(email, subject, body);

        // Also log directly so developer can see it in terminal easily
        log.info("========== EMAIL OTP GENERATED ==========");
        log.info("To: {}", email);
        log.info("OTP Code: {}", otpCode);
        log.info("=========================================");

        return "Mã OTP (DEMO: " + otpCode + ") đã được gửi về địa chỉ email của bạn. Vui lòng sử dụng mã này để xác thực.";
    }

    private void saveOtpRecord(User user, String email, String hashedOtp) {
        EmailVerification verification = EmailVerification.builder()
                .user(user)
                .email(email)
                .otpCode(hashedOtp)
                .purpose("CAMPAIGN_JOIN")
                .expiresAt(LocalDateTime.now().plusMinutes(OTP_VALID_DURATION_MINUTES))
                .build();
        emailVerificationRepository.save(verification);
    }

    @Transactional
    public boolean verifyOtp(String email, String otpCode) {
        Optional<EmailVerification> optionalVerification = emailVerificationRepository
                .findTopByEmailAndIsUsedFalseOrderByCreatedAtDesc(email);

        if (optionalVerification.isEmpty()) {
            throw new CustomException("Không tìm thấy mã OTP hoặc mã đã được sử dụng.", 400);
        }

        EmailVerification verification = optionalVerification.get();

        if (verification.getExpiresAt().isBefore(LocalDateTime.now())) {
            verification.setIsUsed(true);
            emailVerificationRepository.save(verification);
            throw new CustomException("Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.", 400);
        }

        if (verification.getAttempts() >= MAX_ATTEMPTS) {
            verification.setIsUsed(true);
            emailVerificationRepository.save(verification);
            throw new CustomException("Bạn đã nhập sai quá " + MAX_ATTEMPTS + " lần. Vui lòng yêu cầu mã OTP mới.", 400);
        }

        if (!passwordEncoder.matches(otpCode, verification.getOtpCode())) {
            verification.setAttempts(verification.getAttempts() + 1);
            if (verification.getAttempts() >= MAX_ATTEMPTS) {
                verification.setIsUsed(true);
            }
            emailVerificationRepository.save(verification);
            int remaining = Math.max(0, MAX_ATTEMPTS - verification.getAttempts());
            throw new CustomException("Mã OTP không chính xác. Bạn còn " + remaining + " lần thử.", 400);
        }

        verification.setIsUsed(true);
        verification.setVerifiedAt(LocalDateTime.now());
        emailVerificationRepository.save(verification);

        return true;
    }
}
