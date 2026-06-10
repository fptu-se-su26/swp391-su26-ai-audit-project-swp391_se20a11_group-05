package com.example.smartcity.modules.auth.job;

import com.example.smartcity.modules.auth.repository.SmsVerificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class OtpCleanupScheduler {

    private final SmsVerificationRepository smsVerificationRepository;

    // Chạy lúc 2 giờ sáng mỗi ngày (Cron expression: Giây Phút Giờ Ngày Tháng NgàyTrongTuần)
    @Scheduled(cron = "0 0 2 * * ?")
    public void cleanupOldOtps() {
        log.info("========== BẮT ĐẦU CRON JOB: DỌN DẸP MÃ OTP CŨ ==========");
        
        // Chỉ giữ lại OTP trong vòng 24 giờ qua. Các OTP cũ hơn sẽ bị xóa vật lý (Hard Delete)
        LocalDateTime thresholdDate = LocalDateTime.now().minusHours(24);
        int deletedCount = smsVerificationRepository.deleteOtpsOlderThan(thresholdDate);
        
        log.info("Đã dọn dẹp và xóa vĩnh viễn {} mã OTP rác khỏi Database.", deletedCount);
        log.info("========== KẾT THÚC CRON JOB ==========");
    }
}
