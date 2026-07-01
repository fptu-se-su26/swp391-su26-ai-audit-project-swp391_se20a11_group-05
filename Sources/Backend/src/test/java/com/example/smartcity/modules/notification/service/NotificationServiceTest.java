package com.example.smartcity.modules.notification.service;

import com.example.smartcity.modules.feedback.repository.FeedbackRepository;
import com.example.smartcity.modules.notification.entity.Notification;
import com.example.smartcity.modules.notification.repository.NotificationRepository;
import com.example.smartcity.modules.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private FeedbackRepository feedbackRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private com.example.smartcity.modules.notification.WebSocketNotificationService webSocketNotificationService;

    private NotificationService notificationService;

    @BeforeEach
    void setUp() {
        notificationService = new NotificationService(
                notificationRepository,
                feedbackRepository,
                userRepository,
                webSocketNotificationService
        );
    }

    @Test
    @DisplayName("Should return correct count of unread notifications")
    void countUnreadNotifications_success() {
        Long userId = 1L;
        long expectedCount = 5L;

        when(notificationRepository.countByUserIdAndIsReadFalse(userId)).thenReturn(expectedCount);

        long actualCount = notificationService.countUnreadNotifications(userId);

        assertEquals(expectedCount, actualCount);
        verify(notificationRepository).countByUserIdAndIsReadFalse(userId);
    }
}
