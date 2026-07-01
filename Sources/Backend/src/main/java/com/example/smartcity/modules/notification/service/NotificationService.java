package com.example.smartcity.modules.notification.service;

import com.example.smartcity.common.base.BaseRepository;
import com.example.smartcity.common.base.BaseServiceImpl;
import com.example.smartcity.common.exception.CustomException;
import com.example.smartcity.modules.feedback.dto.PagedResponse;
import com.example.smartcity.modules.feedback.entity.Feedback;
import com.example.smartcity.modules.feedback.repository.FeedbackRepository;
import com.example.smartcity.modules.notification.dto.NotificationDTO;
import com.example.smartcity.modules.notification.entity.Notification;
import com.example.smartcity.modules.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.scheduling.annotation.Async;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import com.example.smartcity.modules.user.entity.User;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService extends BaseServiceImpl<Notification, Long> {

    private final NotificationRepository notificationRepository;
    private final FeedbackRepository feedbackRepository;
    private final com.example.smartcity.modules.user.repository.UserRepository userRepository;
    private final com.example.smartcity.modules.notification.WebSocketNotificationService webSocketNotificationService;

    @Override
    protected BaseRepository<Notification, Long> getRepository() {
        return notificationRepository;
    }

    @Override
    protected String getResourceName() {
        return "Notification";
    }

    public List<Notification> getNotificationsForUser(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional(readOnly = true)
    public PagedResponse<NotificationDTO> getNotificationPageForUser(Long userId, Pageable pageable) {
        Page<Notification> page = notificationRepository.findByUserId(userId, pageable);
        List<Long> feedbackIds = page.getContent().stream()
                .map(Notification::getReferenceId)
                .filter(id -> id != null)
                .distinct()
                .toList();
        Map<Long, Feedback> feedbackById = feedbackRepository.findAllById(feedbackIds).stream()
                .collect(Collectors.toMap(Feedback::getId, Function.identity()));

        List<NotificationDTO> content = page.getContent().stream()
                .map(notification -> toNotificationDto(notification, feedbackById.get(notification.getReferenceId())))
                .toList();

        return PagedResponse.<NotificationDTO>builder()
                .content(content)
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .hasNext(page.hasNext())
                .build();
    }

    @Transactional
    public Notification createFeedbackSubmittedNotification(Feedback savedFeedback) {
        Notification notification = Notification.builder()
                .user(savedFeedback.getCitizen())
                .referenceId(savedFeedback.getId())
                .feedbackId(savedFeedback.getId())
                .title("Gửi phản ánh thành công")
                .content("Phản ánh của bạn đã được ghi nhận và đang chờ tiếp nhận.")
                .type("FEEDBACK_SUBMITTED")
                .isRead(false)
                .build();

        LocalDateTime now = LocalDateTime.now();
        notification.setCreatedAt(now);
        notification.setUpdatedAt(now);

        Notification saved = notificationRepository.save(notification);
        log.info(
                "[Notification] Created feedback submitted notification. feedbackId={}, userId={}, notificationId={}",
                savedFeedback.getId(),
                savedFeedback.getCitizen().getId(),
                saved.getId());
        return saved;
    }

    @Transactional
    public void createCampaignNotification(User user, Long campaignId, String title, String content, String type) {
        Notification notification = Notification.builder()
                .user(user)
                .referenceId(campaignId)
                .title(title)
                .content(content)
                .type(type)
                .isRead(false)
                .build();
        LocalDateTime now = LocalDateTime.now();
        notification.setCreatedAt(now);
        notification.setUpdatedAt(now);
        notificationRepository.save(notification);
    }

    /**
     * Tạo thông báo từ chối phản ánh với nội dung thân thiện cho công dân.
     *
     * [FIX #1 - Detached Entity] Nhận feedbackId (primitive) thay vì Feedback entity
     * để tránh LazyInitializationException khi chạy trong thread mới (@Async).
     * Entity sẽ được reload trong transaction mới (REQUIRES_NEW).
     *
     * [FIX #4 - Thread Pool] Dùng "aiTaskExecutor" có giới hạn pool,
     * không dùng SimpleAsyncTaskExecutor mặc định (tạo thread mới không giới hạn).
     *
     * @param feedbackId  ID phản ánh bị từ chối
     * @param friendlyReason Lý do thân thiện (không phải thông điệp kỹ thuật)
     */
    @Async("aiTaskExecutor")
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void createFeedbackRejectedNotification(Long feedbackId, String friendlyReason) {
        Feedback feedback = feedbackRepository.findById(feedbackId).orElse(null);
        if (feedback == null || feedback.getCitizen() == null) {
            log.warn("[Notification] Không tìm thấy feedback hoặc citizen khi gửi thông báo từ chối. feedbackId={}", feedbackId);
            return;
        }
        Notification notification = Notification.builder()
                .user(feedback.getCitizen())
                .referenceId(feedback.getId())
                .feedbackId(feedback.getId())
                .title("❌ Phản ánh chưa được tiếp nhận")
                .content(friendlyReason)
                .type("FEEDBACK_REJECTED")
                .isRead(false)
                .build();

        LocalDateTime now = LocalDateTime.now();
        notification.setCreatedAt(now);
        notification.setUpdatedAt(now);

        Notification saved = notificationRepository.save(notification);
        log.info(
                "[Notification] Created feedback rejected notification. feedbackId={}, userId={}, reason='{}'",
                feedback.getId(),
                feedback.getCitizen().getId(),
                friendlyReason);
    }

    @Async("aiTaskExecutor")
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void createFeedbackWaitingInfoNotification(Long feedbackId, String requestMessage) {
        Feedback feedback = feedbackRepository.findById(feedbackId).orElse(null);
        if (feedback == null || feedback.getCitizen() == null) {
            log.warn("[Notification] Feedback or citizen not found when requesting more info. feedbackId={}", feedbackId);
            return;
        }

        Notification notification = Notification.builder()
                .user(feedback.getCitizen())
                .referenceId(feedback.getId())
                .feedbackId(feedback.getId())
                .title("Can bo phuong yeu cau bo sung thong tin")
                .content(requestMessage == null || requestMessage.isBlank()
                        ? "Vui long bo sung thong tin cho phan anh " + feedback.getTrackingCode() + "."
                        : requestMessage)
                .type("FEEDBACK_WAITING_INFO")
                .isRead(false)
                .build();

        LocalDateTime now = LocalDateTime.now();
        notification.setCreatedAt(now);
        notification.setUpdatedAt(now);
        notificationRepository.save(notification);
    }

    @Async("aiTaskExecutor")
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void createFeedbackInfoSupplementedNotification(Long feedbackId, String supplementContent) {
        Feedback feedback = feedbackRepository.findById(feedbackId).orElse(null);
        if (feedback == null || feedback.getWard() == null) {
            log.warn("[Notification] Feedback or ward not found. feedbackId={}", feedbackId);
            return;
        }

        String title = "Công dân đã bổ sung thông tin";
        String trackingCode = feedback.getTrackingCode();
        String summary = supplementContent.length() > 60 ? supplementContent.substring(0, 60) + "..." : supplementContent;
        String content = String.format("Phản ánh %s đã được người dân bổ sung thông tin: %s", 
                trackingCode, 
                summary);

        LocalDateTime now = LocalDateTime.now();

        // 1. Notify Assignee first if exists
        if (feedback.getAssignee() != null) {
            Notification notification = Notification.builder()
                    .user(feedback.getAssignee())
                    .referenceId(feedbackId)
                    .feedbackId(feedbackId)
                    .title(title)
                    .content(content)
                    .type("FEEDBACK_INFO_SUPPLEMENTED")
                    .isRead(false)
                    .build();
            notification.setCreatedAt(now);
            notification.setUpdatedAt(now);
            notificationRepository.save(notification);
            
            webSocketNotificationService.broadcastToStaff("FEEDBACK_INFO_SUPPLEMENTED", title, content);
            return;
        }

        // 2. Otherwise notify all staff managing it
        com.example.smartcity.modules.user.entity.Role role = 
                "POLICE".equals(feedback.getManagedByRole()) 
                ? com.example.smartcity.modules.user.entity.Role.POLICE 
                : com.example.smartcity.modules.user.entity.Role.WARD_STAFF;

        List<User> managers = userRepository.findByRoleAndWardId(role, feedback.getWard().getId());
        for (User manager : managers) {
            Notification notification = Notification.builder()
                    .user(manager)
                    .referenceId(feedbackId)
                    .feedbackId(feedbackId)
                    .title(title)
                    .content(content)
                    .type("FEEDBACK_INFO_SUPPLEMENTED")
                    .isRead(false)
                    .build();
            notification.setCreatedAt(now);
            notification.setUpdatedAt(now);
            notificationRepository.save(notification);
        }

        if (!managers.isEmpty()) {
            webSocketNotificationService.broadcastToStaff("FEEDBACK_INFO_SUPPLEMENTED", title, content);
        }
    }

    @Transactional
    public Notification markAsRead(Long notificationId, String currentUsername) {
        Notification notification = findById(notificationId);

        // Bảo mật: chỉ người nhận thông báo mới có quyền đánh dấu đã đọc
        if (!notification.getUser().getUsername().equals(currentUsername)) {
            throw new CustomException("Bạn không có quyền thao tác trên thông báo này.", 403);
        }

        notification.setRead(true);
        return notificationRepository.save(notification);
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        notificationRepository.markAllAsReadForUser(userId);
    }

    @Transactional(readOnly = true)
    public long countUnreadNotifications(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    private NotificationDTO toNotificationDto(Notification notification, Feedback feedback) {
        return NotificationDTO.builder()
                .id(notification.getId())
                .userId(notification.getUser().getId())
                .title(notification.getTitle())
                .content(notification.getContent())
                .type(notification.getType())
                .referenceId(notification.getReferenceId())
                .feedbackId(notification.getFeedbackId() != null ? notification.getFeedbackId() : notification.getReferenceId())
                .feedbackTrackingCode(feedback == null ? null : feedback.getTrackingCode())
                .feedbackTitle(feedback == null ? null : feedback.getTitle())
                .feedbackStatus(feedback == null || feedback.getStatus() == null ? null : feedback.getStatus().name())
                .isRead(notification.isRead())
                .createdAt(notification.getCreatedAt())
                .build();
    }

    @Async("aiTaskExecutor")
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void createFeedbackAssignedToWardNotification(Long feedbackId) {
        Feedback feedback = feedbackRepository.findById(feedbackId).orElse(null);
        if (feedback == null || feedback.getWard() == null || !"WARD_STAFF".equals(feedback.getManagedByRole())) {
            log.warn("[Notification] Feedback is null or does not have ward or is not assigned to WARD_STAFF. feedbackId={}", feedbackId);
            return;
        }

        // Fetch WARD_STAFF users belonging to feedback's ward
        List<User> wardStaffs = userRepository.findByRoleAndWardId(com.example.smartcity.modules.user.entity.Role.WARD_STAFF, feedback.getWard().getId());
        
        String title = "Có phản ánh mới cần xử lý";
        String trackingCode = feedback.getTrackingCode();
        String wardName = feedback.getWardName() != null ? feedback.getWardName() : feedback.getWard().getName();
        String content = String.format("Phản ánh %s đã được phân về %s. Vui lòng kiểm tra và tiếp nhận xử lý.", 
                trackingCode, 
                wardName);

        LocalDateTime now = LocalDateTime.now();

        for (User staff : wardStaffs) {
            boolean exists = notificationRepository.existsByUserIdAndFeedbackIdAndType(staff.getId(), feedbackId, "FEEDBACK_ASSIGNED_TO_WARD");
            if (exists) {
                continue;
            }

            Notification notification = Notification.builder()
                    .user(staff)
                    .referenceId(feedbackId)
                    .feedbackId(feedbackId)
                    .title(title)
                    .content(content)
                    .type("FEEDBACK_ASSIGNED_TO_WARD")
                    .isRead(false)
                    .build();
            notification.setCreatedAt(now);
            notification.setUpdatedAt(now);
            notificationRepository.save(notification);
            
            log.info("[Notification] Created FEEDBACK_ASSIGNED_TO_WARD notification for user={}, feedbackId={}", staff.getUsername(), feedbackId);
        }

        // Broadcast via WebSocket to staff so that they get it in real-time
        if (!wardStaffs.isEmpty()) {
            webSocketNotificationService.broadcastToStaff("FEEDBACK_ASSIGNED_TO_WARD", title, content);
        }
    }
}
