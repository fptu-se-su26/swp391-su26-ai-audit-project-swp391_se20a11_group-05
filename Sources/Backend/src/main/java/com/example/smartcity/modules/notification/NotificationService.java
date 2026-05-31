package com.example.smartcity.modules.notification;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

/**
 * WebSocket Notification Service
 * Gửi real-time notification tới frontend qua STOMP.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Gửi notification khi feedback thay đổi trạng thái
     */
    public void notifyFeedbackStatusChange(Long feedbackId, String newStatus, String message) {
        NotificationPayload payload = new NotificationPayload(
                "FEEDBACK_STATUS",
                feedbackId,
                newStatus,
                message
        );
        messagingTemplate.convertAndSend("/topic/feedback/" + feedbackId, payload);
        log.info("[WS] Sent status update for feedback #{}: {}", feedbackId, newStatus);
    }

    /**
     * Gửi broadcast tới tất cả cán bộ
     */
    public void broadcastToStaff(String type, String title, String message) {
        NotificationPayload payload = new NotificationPayload(type, null, title, message);
        messagingTemplate.convertAndSend("/topic/staff", payload);
        log.info("[WS] Broadcast to staff: {} - {}", title, message);
    }

    public record NotificationPayload(
            String type,
            Long feedbackId,
            String title,
            String message
    ) {}
}
