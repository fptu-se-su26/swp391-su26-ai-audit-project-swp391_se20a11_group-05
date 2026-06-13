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
    public Notification markAsRead(Long notificationId, String currentUsername) {
        Notification notification = findById(notificationId);

        // Bảo mật: chỉ người nhận thông báo mới có quyền đánh dấu đã đọc
        if (!notification.getUser().getUsername().equals(currentUsername)) {
            throw new CustomException("Bạn không có quyền thao tác trên thông báo này.", 403);
        }

        notification.setRead(true);
        return notificationRepository.save(notification);
    }

    private NotificationDTO toNotificationDto(Notification notification, Feedback feedback) {
        return NotificationDTO.builder()
                .id(notification.getId())
                .userId(notification.getUser().getId())
                .title(notification.getTitle())
                .content(notification.getContent())
                .type(notification.getType())
                .referenceId(notification.getReferenceId())
                .feedbackId(notification.getReferenceId())
                .feedbackTrackingCode(feedback == null ? null : feedback.getTrackingCode())
                .feedbackTitle(feedback == null ? null : feedback.getTitle())
                .feedbackStatus(feedback == null || feedback.getStatus() == null ? null : feedback.getStatus().name())
                .isRead(notification.isRead())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
