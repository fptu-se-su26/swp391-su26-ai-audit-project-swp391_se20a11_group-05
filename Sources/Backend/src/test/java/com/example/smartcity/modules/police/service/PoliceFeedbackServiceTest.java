package com.example.smartcity.modules.police.service;

import com.example.smartcity.modules.core.entity.Ward;
import com.example.smartcity.modules.feedback.entity.Feedback;
import com.example.smartcity.modules.feedback.entity.FeedbackLog;
import com.example.smartcity.modules.feedback.entity.FeedbackStatus;
import com.example.smartcity.modules.feedback.repository.AttachmentRepository;
import com.example.smartcity.modules.feedback.repository.FeedbackLogRepository;
import com.example.smartcity.modules.feedback.repository.FeedbackRepository;
import com.example.smartcity.modules.police.dto.PoliceFeedbackResponse;
import com.example.smartcity.modules.police.dto.UpdateFeedbackStatusRequest;
import com.example.smartcity.modules.notification.service.ExternalNotificationService;
import com.example.smartcity.modules.notification.service.NotificationService;
import com.example.smartcity.modules.user.entity.Role;
import com.example.smartcity.modules.user.entity.User;
import com.example.smartcity.modules.user.repository.UserRepository;
import com.example.smartcity.ai_orchestrator.router.AiRouterService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class PoliceFeedbackServiceTest {

    @Mock private FeedbackRepository feedbackRepository;
    @Mock private FeedbackLogRepository feedbackLogRepository;
    @Mock private UserRepository userRepository;
    @Mock private ExternalNotificationService externalNotificationService;
    @Mock private AttachmentRepository attachmentRepository;
    @Mock private AiRouterService aiRouterService;
    @Mock private NotificationService notificationService;

    private PoliceFeedbackService policeFeedbackService;

    private User policeUser;
    private Ward ward;
    private Feedback feedback;

    @BeforeEach
    void setUp() {
        policeFeedbackService = new PoliceFeedbackService(
                feedbackRepository,
                feedbackLogRepository,
                userRepository,
                externalNotificationService,
                attachmentRepository,
                aiRouterService,
                notificationService
        );

        ward = new Ward();
        ward.setId(1L);
        ward.setName("Phường Hải Châu I");

        policeUser = new User("police1", "encoded", "Cán Bộ Hải Châu I", "0905111222",
                "police1@danang.gov.vn", Role.POLICE);
        policeUser.setId(10L);
        policeUser.setWard(ward);

        feedback = new Feedback();
        feedback.setId(100L);
        feedback.setTrackingCode("FB-POL-001");
        feedback.setTitle("Tụ tập đông người gây mất trật tự");
        feedback.setDescription("Có nhóm thanh niên tụ tập đua xe");
        feedback.setStatus(FeedbackStatus.ASSIGNED);
        feedback.setManagedByRole("POLICE");
        feedback.setWard(ward);
    }

    @Test
    @DisplayName("Should update feedback status successfully by Police Officer")
    void updateStatus_success() {
        UpdateFeedbackStatusRequest request = new UpdateFeedbackStatusRequest();
        request.setStatus(FeedbackStatus.IN_PROGRESS);
        request.setNote("Đang cử lực lượng xuống hiện trường xử lý.");

        when(feedbackRepository.findById(100L)).thenReturn(Optional.of(feedback));
        when(userRepository.findByUsername("police1")).thenReturn(Optional.of(policeUser));
        when(feedbackRepository.save(any(Feedback.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PoliceFeedbackResponse response = policeFeedbackService.updateStatus(100L, "police1", request);

        assertNotNull(response);
        assertEquals(FeedbackStatus.IN_PROGRESS, response.getStatus());
        verify(feedbackRepository).save(feedback);
        verify(feedbackLogRepository).save(any(FeedbackLog.class));
    }
}
