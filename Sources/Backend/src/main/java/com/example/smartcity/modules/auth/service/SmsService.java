package com.example.smartcity.modules.auth.service;

import com.example.smartcity.modules.auth.entity.SmsVerification;
import com.example.smartcity.modules.auth.repository.SmsVerificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;

@Service
@RequiredArgsConstructor
@Slf4j
public class SmsService {

    private final SmsVerificationRepository smsVerificationRepository;
    private static final int OTP_VALID_DURATION_MINUTES = 5;
    private static final int MAX_ATTEMPTS = 3;

    @Transactional
    public String generateAndSendOtp(String phoneNumber) {
        // Hủy các mã OTP cũ chưa sử dụng (Tùy chọn: có thể query và set isUsed = true, ở đây ta dùng logic lấy mã mới nhất)
        
        // Sinh mã OTP 6 số
        String otpCode = String.format("%06d", new Random().nextInt(999999));

        SmsVerification verification = SmsVerification.builder()
                .phoneNumber(phoneNumber)
                .otpCode(otpCode)
                .expiresAt(LocalDateTime.now().plusMinutes(OTP_VALID_DURATION_MINUTES))
                .build();

        smsVerificationRepository.save(verification);

        // TODO: Tích hợp API Twilio/SpeedSMS tại đây. 
        // Tạm thời log ra màn hình console (Mock SMS Gateway)
        log.info("========== MOCK SMS GATEWAY ==========");
        log.info("Sending SMS to: {}", phoneNumber);
        log.info("OTP Code: {}", otpCode);
        log.info("Expires in: {} minutes", OTP_VALID_DURATION_MINUTES);
        log.info("======================================");

        return "Mã OTP đã được gửi đến số điện thoại của bạn.";
    }

    @Transactional
    public boolean verifyOtp(String phoneNumber, String otpCode) {
        Optional<SmsVerification> optionalVerification = smsVerificationRepository
                .findTopByPhoneNumberAndIsUsedFalseOrderByCreatedAtDesc(phoneNumber);

        if (optionalVerification.isEmpty()) {
            throw new RuntimeException("Không tìm thấy mã OTP hoặc mã đã được sử dụng.");
        }

        SmsVerification verification = optionalVerification.get();

        // Kiểm tra quá số lần thử
        if (verification.getAttempts() >= MAX_ATTEMPTS) {
            verification.setIsUsed(true);
            smsVerificationRepository.save(verification);
            throw new RuntimeException("Bạn đã nhập sai quá " + MAX_ATTEMPTS + " lần. Vui lòng yêu cầu mã OTP mới.");
        }

        // Tăng số lần thử
        verification.setAttempts(verification.getAttempts() + 1);

        // Kiểm tra hết hạn
        if (verification.getExpiresAt().isBefore(LocalDateTime.now())) {
            smsVerificationRepository.save(verification);
            throw new RuntimeException("Mã OTP đã hết hạn.");
        }

        // Kiểm tra mã OTP
        if (!verification.getOtpCode().equals(otpCode)) {
            smsVerificationRepository.save(verification);
            throw new RuntimeException("Mã OTP không chính xác.");
        }

        // Thành công -> Đánh dấu đã sử dụng
        verification.setIsUsed(true);
        smsVerificationRepository.save(verification);

        return true;
    }
}
