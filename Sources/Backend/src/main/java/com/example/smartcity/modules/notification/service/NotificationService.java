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

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService extends BaseServiceImpl<Notification, Long> {

    private final NotificationRepository notificationRepository;
    private final FeedbackRepository feedbackRepository;

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
}
