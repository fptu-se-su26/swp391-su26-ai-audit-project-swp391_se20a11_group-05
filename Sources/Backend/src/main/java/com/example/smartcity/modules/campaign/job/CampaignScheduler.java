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
    private final com.example.smartcity.modules.user.service.UserService userService;
    private final com.example.smartcity.modules.notification.service.ExternalNotificationService externalNotificationService;

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

    // Tự động hủy chiến dịch khi đến giờ bắt đầu mà không đủ số người tối thiểu.
    // Nếu đủ người, hệ thống sẽ KHÔNG tự chốt — đợi cán bộ phường chốt thủ công.
    @Scheduled(fixedDelay = 60000)
    @Transactional
    public void autoFinalizeOrCancelCampaigns() {
        LocalDateTime now = LocalDateTime.now();
        List<Campaign> overdueCampaigns = campaignRepository.findAll().stream()
                .filter(c -> "RECRUITING".equals(c.getStatus()) && c.getStartTime() != null && now.isAfter(c.getStartTime()))
                .toList();

        if (!overdueCampaigns.isEmpty()) {
            log.info("[CampaignScheduler] Found {} overdue recruiting campaigns to check", overdueCampaigns.size());
        }

        for (Campaign campaign : overdueCampaigns) {
            // Chỉ xử lý khi có yêu cầu số người tối thiểu
            if (campaign.getMinParticipants() == null) {
                // Không có yêu cầu tối thiểu → bỏ qua, đợi cán bộ chốt thủ công
                log.info("[CampaignScheduler] Campaign ID={} ('{}') has no minParticipants, skipping auto-cancel",
                        campaign.getId(), campaign.getTitle());
                continue;
            }

            long attendingCount = participantRepository.countByCampaign_IdAndJoinStatusIn(
                    campaign.getId(),
                    List.of("CONFIRMED", "MAYBE", "APPROVED")
            );

            if (attendingCount >= campaign.getMinParticipants()) {
                // Đủ người → KHÔNG tự chốt, đợi cán bộ phường bấm "Chốt chiến dịch"
                log.info("[CampaignScheduler] Campaign ID={} ('{}') has enough participants ({}/{}), waiting for manual finalization",
                        campaign.getId(), campaign.getTitle(), attendingCount, campaign.getMinParticipants());
            } else {
                // Không đủ người → tự động hủy và thông báo
                campaign.setStatus("CANCELLED");
                campaign.setCancellationReason("Hủy do không đủ người");
                campaignRepository.save(campaign);
                log.info("[CampaignScheduler] Auto-cancelled campaign ID={} ('{}') due to insufficient participants ({}/{})",
                        campaign.getId(), campaign.getTitle(), attendingCount, campaign.getMinParticipants());

                String contactInfo = (campaign.getOrganizerContact() != null && !campaign.getOrganizerContact().isBlank())
                        ? " Liên hệ cán bộ tổ chức: " + campaign.getOrganizerContact()
                        : "";
                String msg = "Chiến dịch '" + campaign.getTitle() + "' đã bị hệ thống tự động hủy vì không đủ số người tối thiểu ("
                        + attendingCount + "/" + campaign.getMinParticipants() + " người) khi đến giờ bắt đầu." + contactInfo;

                participantRepository.findByCampaign_IdAndJoinStatusIn(
                        campaign.getId(),
                        List.of("CONFIRMED", "MAYBE", "APPROVED")
                ).forEach(p ->
                        notificationService.createCampaignNotification(
                                p.getCitizen(),
                                campaign.getId(),
                                "Chiến dịch bị hủy tự động",
                                msg,
                                "CAMPAIGN_CANCELLED_INSUFFICIENT"
                        )
                );

                notificationService.createCampaignNotification(
                        campaign.getCreatedByUser(),
                        campaign.getId(),
                        "Chiến dịch bị hủy tự động (Hệ thống)",
                        "Chiến dịch '" + campaign.getTitle() + "' đã bị hệ thống tự động hủy do không đủ số lượng người đăng ký tối thiểu.",
                        "CAMPAIGN_AUTO_CANCELLED"
                );
            }
        }
    }

    // Tự động kết thúc chiến dịch khi đã quá thời gian kết thúc (endTime)
    @Scheduled(fixedDelay = 60000)
    @Transactional
    public void autoEndExpiredCampaigns() {
        LocalDateTime now = LocalDateTime.now();
        List<Campaign> expiredCampaigns = campaignRepository.findAll().stream()
                .filter(c -> "IN_PROGRESS".equals(c.getStatus()) && c.getEndTime() != null && now.isAfter(c.getEndTime()))
                .toList();

        for (Campaign campaign : expiredCampaigns) {
            campaign.setStatus("ENDED");
            campaignRepository.save(campaign);
            log.info("[CampaignScheduler] Auto-ended campaign ID={} ('{}') as its endTime has passed", 
                    campaign.getId(), campaign.getTitle());

            // Tự động chốt điểm danh vắng mặt cho các thành viên chưa được điểm danh có mặt
            List<CampaignParticipant> remaining = participantRepository.findByCampaign_IdAndJoinStatusIn(
                    campaign.getId(), 
                    List.of("APPROVED")
            );
            for (CampaignParticipant participant : remaining) {
                if (participant.getAttendedAt() == null) {
                    participant.setAttended(false);
                    participant.setAttendedAt(now);
                    participant.setRejectionReason("Hệ thống tự động đánh dấu vắng mặt do không tham gia điểm danh (Chiến dịch kết thúc tự động)");
                    CampaignParticipant saved = participantRepository.save(participant);
                    verifyAndApplyCampaignBan(saved.getCitizen(), campaign);
                }
            }

            notificationService.createCampaignNotification(
                    campaign.getCreatedByUser(),
                    campaign.getId(),
                    "Chiến dịch tự động kết thúc",
                    "Chiến dịch '" + campaign.getTitle() + "' đã tự động kết thúc sau khi hết giờ. Vui lòng kiểm tra danh sách điểm danh.",
                    "CAMPAIGN_AUTO_ENDED"
            );

            // Gửi thông báo kết thúc chiến dịch tự động cho người dân đã đăng ký
            notificationService.notifyCampaignEndedAutomatically(campaign.getId(), campaign.getTitle());
        }
    }

    private void verifyAndApplyCampaignBan(com.example.smartcity.modules.user.entity.User citizen, Campaign campaign) {
        boolean banned = userService.checkAndBanFromCampaigns(citizen.getId(), campaign.getTitle());
        if (banned) {
            notificationService.createCampaignNotification(
                    citizen,
                    campaign.getId(),
                    "Bị cấm tham gia chiến dịch",
                    String.format("Tài khoản của bạn đã bị cấm đăng ký tham gia chiến dịch cộng đồng mới do vắng mặt lần thứ 3 tại chiến dịch '%s'. Bạn có thể gửi đơn xin mở khóa trong trang cá nhân.", campaign.getTitle()),
                    "CAMPAIGN_BANNED"
            );
            if (citizen.getEmail() != null && !citizen.getEmail().isBlank()) {
                String subject = "[SmartCity] Tài khoản bị cấm tham gia chiến dịch";
                String body = String.format("Chào %s,\n\nTài khoản của bạn đã bị cấm đăng ký tham gia chiến dịch cộng đồng mới do vắng mặt quá 3 lần (lần thứ 3 vắng mặt tại chiến dịch: \"%s\").\n\nBạn có thể gửi đơn giải trình trực tuyến trên ứng dụng để được Cán bộ phường phê duyệt mở khóa.\n\nTrân trọng,\nBan Quản Trị SmartCity",
                        citizen.getFullName(), campaign.getTitle());
                externalNotificationService.sendEmailNotification(citizen.getEmail(), subject, body);
            }
        }
    }
}
