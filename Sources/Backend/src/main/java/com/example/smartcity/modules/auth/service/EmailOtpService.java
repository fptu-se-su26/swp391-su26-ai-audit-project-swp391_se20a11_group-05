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
        return generateAndSendOtp(user, email, "CAMPAIGN_JOIN");
    }

    @Transactional
    public String generateAndSendOtp(User user, String email, String purpose) {
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
        saveOtpRecord(user, email, passwordEncoder.encode(otpCode), purpose);

        // Send via background external notification service (mocked)
        String subject;
        if ("PASSWORD_CHANGE".equalsIgnoreCase(purpose)) {
            subject = "Mã xác thực đổi mật khẩu - Đà Nẵng Kết Nối";
        } else if ("DELETE_ACCOUNT".equalsIgnoreCase(purpose)) {
            subject = "Mã xác thực xóa tài khoản - Đà Nẵng Kết Nối";
        } else {
            subject = "Mã xác thực đăng ký chiến dịch - Đà Nẵng Kết Nối";
        }
        String actionText = "PASSWORD_CHANGE".equalsIgnoreCase(purpose) ? "đổi mật khẩu" : 
                            ("DELETE_ACCOUNT".equalsIgnoreCase(purpose) ? "xóa tài khoản" : "đăng ký tham gia chiến dịch");

        String body = "<div style=\"font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);\">"
                + "<div style=\"text-align: center; padding-bottom: 20px; border-bottom: 2px solid #3b82f6;\">"
                + "<h1 style=\"color: #1e3a8a; margin: 0; font-size: 26px; font-weight: 700;\">Đà Nẵng Kết Nối</h1>"
                + "<p style=\"color: #6b7280; margin: 5px 0 0 0; font-size: 14px;\">Hệ Sinh Thái Tiện Ích Thông Minh</p>"
                + "</div>"
                + "<div style=\"padding: 30px 0; color: #374151; line-height: 1.6; font-size: 16px;\">"
                + "<p>Xin chào <strong>" + user.getFullName() + "</strong>,</p>"
                + "<p>Hệ thống vừa nhận được yêu cầu <strong>" + actionText + "</strong> từ tài khoản của bạn. Để tiếp tục, vui lòng sử dụng mã xác thực (OTP) dưới đây:</p>"
                + "<div style=\"text-align: center; margin: 35px 0;\">"
                + "<span style=\"display: inline-block; padding: 16px 32px; font-size: 34px; font-weight: 800; color: #1d4ed8; background-color: #eff6ff; border-radius: 8px; letter-spacing: 6px; border: 1px solid #bfdbfe;\">" + otpCode + "</span>"
                + "</div>"
                + "<p>Mã bảo mật này có hiệu lực trong vòng <strong>" + OTP_VALID_DURATION_MINUTES + " phút</strong>. Khuyến cáo KHÔNG chia sẻ mã này cho bất kỳ ai (kể cả nhân viên hỗ trợ) để tránh rủi ro mất tài khoản.</p>"
                + "<p style=\"font-size: 14px; color: #6b7280; margin-top: 30px;\">Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email hoặc liên hệ ngay với Ban Quản Trị để được hỗ trợ.</p>"
                + "</div>"
                + "<div style=\"padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 13px;\">"
                + "<p style=\"margin: 0 0 5px 0;\">Trân trọng,<br><strong style=\"color: #4b5563;\">Ban Quản Trị Đà Nẵng Kết Nối</strong></p>"
                + "<p style=\"margin: 0;\">&copy; " + java.time.Year.now().getValue() + " SmartCity Da Nang. All rights reserved.</p>"
                + "</div>"
                + "</div>";

        externalNotificationService.sendEmailNotification(email, subject, body);

        // Also log directly so developer can see it in terminal easily
        log.info("========== EMAIL OTP GENERATED ==========");
        log.info("Purpose: {}", purpose);
        log.info("To: {}", email);
        log.info("OTP Code: {}", otpCode);
        log.info("=========================================");

        return "Mã OTP (DEMO: " + otpCode + ") đã được gửi về địa chỉ email của bạn. Vui lòng sử dụng mã này để xác thực.";
    }

    private void saveOtpRecord(User user, String email, String hashedOtp) {
        saveOtpRecord(user, email, hashedOtp, "CAMPAIGN_JOIN");
    }

    private void saveOtpRecord(User user, String email, String hashedOtp, String purpose) {
        EmailVerification verification = EmailVerification.builder()
                .user(user)
                .email(email)
                .otpCode(hashedOtp)
                .purpose(purpose != null ? purpose : "CAMPAIGN_JOIN")
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
