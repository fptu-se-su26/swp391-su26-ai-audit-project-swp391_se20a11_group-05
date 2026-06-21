package com.example.smartcity.modules.feedback.service;

import com.example.smartcity.ai_orchestrator.adapter.GeminiAdapter;
import com.example.smartcity.modules.feedback.entity.Attachment;
import com.example.smartcity.modules.feedback.repository.AttachmentRepository;
import com.example.smartcity.modules.feedback.repository.FeedbackLogRepository;
import com.example.smartcity.modules.feedback.repository.FeedbackRepository;
import com.example.smartcity.modules.feedback.repository.AiTaskRepository;
import com.example.smartcity.modules.feedback.repository.AiAnalysisLogRepository;
import com.example.smartcity.modules.notification.WebSocketNotificationService;
import com.example.smartcity.modules.notification.service.NotificationService;
import com.example.smartcity.modules.user.repository.UserRepository;
import com.example.smartcity.modules.file.FileStorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;

import java.io.IOException;
import java.util.Base64;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AutoDispatchServiceTest {

    @Mock private GeminiAdapter geminiAdapter;
    @Mock private FeedbackRepository feedbackRepository;
    @Mock private FeedbackLogRepository feedbackLogRepository;
    @Mock private AttachmentRepository attachmentRepository;
    @Mock private UserRepository userRepository;
    @Mock private WebSocketNotificationService notificationService;
    @Mock private NotificationService citizenNotificationService;
    @Mock private FileStorageService fileStorageService;
    @Mock private AiTaskRepository aiTaskRepository;
    @Mock private AiAnalysisLogRepository aiAnalysisLogRepository;

    private AutoDispatchService autoDispatchService;

    @BeforeEach
    void setUp() {
        autoDispatchService = new AutoDispatchService(
                geminiAdapter,
                feedbackRepository,
                feedbackLogRepository,
                attachmentRepository,
                userRepository,
                fileStorageService,
                notificationService,
                citizenNotificationService,
                aiTaskRepository,
                aiAnalysisLogRepository
        );
    }

    @Test
    void testFetchBase64Images_LocalPath() throws IOException {
        Long feedbackId = 1L;
        Attachment localAttachment = new Attachment();
        localAttachment.setFileType("IMAGE");
        localAttachment.setFileUrl("/api/files/test-image.png");

        when(attachmentRepository.findByFeedbackId(feedbackId)).thenReturn(List.of(localAttachment));
        
        byte[] expectedBytes = "hello-world-image-data".getBytes();
        Resource mockResource = new ByteArrayResource(expectedBytes) {
            @Override
            public String getFilename() {
                return "test-image.png";
            }
        };
        
        when(fileStorageService.loadFile("test-image.png")).thenReturn(mockResource);

        List<String> result = autoDispatchService.fetchBase64Images(feedbackId);

        assertEquals(1, result.size());
        assertEquals(Base64.getEncoder().encodeToString(expectedBytes), result.get(0));
    }
}
