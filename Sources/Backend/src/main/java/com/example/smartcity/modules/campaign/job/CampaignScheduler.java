package com.example.smartcity.modules.campaign.job;

import com.example.smartcity.modules.campaign.entity.Campaign;
import com.example.smartcity.modules.campaign.entity.CampaignParticipant;
import com.example.smartcity.modules.campaign.repository.CampaignParticipantRepository;
import com.example.smartcity.modules.campaign.repository.CampaignRepository;
import com.example.smartcity.modules.notification.service.NotificationService;
import com.example.smartcity.modules.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class CampaignScheduler {

    private final CampaignRepository campaignRepository;
    private final CampaignParticipantRepository participantRepository;
    private final NotificationService notificationService;
    private final NotificationRepository notificationRepository;

    // Chạy mỗi 15 phút một lần để kiểm tra và gửi thông báo nhắc nhở 24h
    @Scheduled(fixedDelay = 900000)
    @Transactional
    public void sendAttendanceReminders() {
        log.info("[CampaignScheduler] Starting attendance reminder scan...");
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime limit = now.plusHours(24);

        // Lấy tất cả chiến dịch
        List<Campaign> recruitingCampaigns = campaignRepository.findAll().stream()
                .filter(c -> "recruiting".equalsIgnoreCase(c.getStatus()) && c.getStartTime() != null)
                .filter(c -> c.getStartTime().isAfter(now) && c.getStartTime().isBefore(limit))
                .toList();

        for (Campaign campaign : recruitingCampaigns) {
            log.info("[CampaignScheduler] Found campaign requiring confirmation within 24h: ID={}, Title={}", campaign.getId(), campaign.getTitle());
            
            // Tìm tất cả các thành viên chưa xác nhận tham gia (APPROVED hoặc PENDING)
            List<CampaignParticipant> participants = participantRepository.findByCampaign_IdAndJoinStatusIn(
                    campaign.getId(),
                    List.of("APPROVED", "PENDING")
            );

            for (CampaignParticipant participant : participants) {
                // Kiểm tra xem đã gửi thông báo nhắc nhở 24h cho người dùng này đối với campaign này chưa
                boolean alreadyNotified = notificationRepository.existsByUserIdAndReferenceIdAndType(
                        participant.getCitizen().getId(),
                        campaign.getId(),
                        "CAMPAIGN_ATTENDANCE_REMINDER"
                );

                if (!alreadyNotified) {
                    String title = "Nhắc nhở xác nhận tham gia chiến dịch";
                    String content = String.format("Chiến dịch '%s' sẽ bắt đầu trong vòng 24 giờ tới. Vui lòng vào nhóm chat để xác nhận tham gia.", campaign.getTitle());
                    
                    notificationService.createCampaignNotification(
                            participant.getCitizen(),
                            campaign.getId(),
                            title,
                            content,
                            "CAMPAIGN_ATTENDANCE_REMINDER"
                    );

                    log.info("[CampaignScheduler] Sent attendance reminder notification to user={} for campaign={}", 
                            participant.getCitizen().getUsername(), campaign.getId());
                }
            }
        }
        log.info("[CampaignScheduler] Attendance reminder scan completed.");
    }
}
