package com.example.smartcity.modules.feedback.service;

import com.example.smartcity.ai_orchestrator.adapter.GeminiAdapter;
import com.example.smartcity.modules.feedback.repository.FeedbackLogRepository;
import com.example.smartcity.modules.feedback.repository.FeedbackRepository;
import com.example.smartcity.modules.feedback.repository.AiTaskRepository;
import com.example.smartcity.modules.feedback.repository.AiAnalysisLogRepository;
import com.example.smartcity.modules.notification.WebSocketNotificationService;
import com.example.smartcity.modules.notification.service.NotificationService;
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

import com.example.smartcity.modules.feedback.entity.AiTask;
import com.example.smartcity.modules.feedback.entity.Feedback;
import org.junit.jupiter.api.DisplayName;

import java.util.Optional;
import java.util.concurrent.CompletableFuture;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AutoDispatchServiceTest {

    @Mock private GeminiAdapter geminiAdapter;
    @Mock private FeedbackRepository feedbackRepository;
    @Mock private FeedbackLogRepository feedbackLogRepository;
    @Mock private WebSocketNotificationService notificationService;
    @Mock private NotificationService citizenNotificationService;
    @Mock private AiTaskRepository aiTaskRepository;
    @Mock private AiAnalysisLogRepository aiAnalysisLogRepository;

    private AutoDispatchService autoDispatchService;

    @BeforeEach
    void setUp() {
        autoDispatchService = new AutoDispatchService(
                geminiAdapter,
                feedbackRepository,
                feedbackLogRepository,
                notificationService,
                citizenNotificationService,
                aiTaskRepository,
                aiAnalysisLogRepository
        );
        autoDispatchService.setSelf(autoDispatchService);
    }

    @Test
    @DisplayName("Text-Only: Không gọi fetchBase64Images khi xử lý task")
    void executeAiTask_shouldNotFetchImages_inTextOnlyMode() throws Exception {
        Long taskId = 100L;
        Long feedbackId = 200L;

        Feedback feedback = new Feedback();
        feedback.setId(feedbackId);
        feedback.setTrackingCode("FB-200");
        feedback.setDescription("Hỏng nắp cống tại ngã tư Lê Lợi lúc 14h chiều qua");

        AiTask task = new AiTask();
        task.setId(taskId);
        task.setFeedback(feedback);

        when(feedbackRepository.findById(feedbackId)).thenReturn(Optional.of(feedback));
        when(feedbackRepository.findByIdForUpdate(feedbackId)).thenReturn(Optional.of(feedback));
        when(aiTaskRepository.findById(taskId)).thenReturn(Optional.of(task));

        GeminiAdapter.GeminiResponse mockResponse = new GeminiAdapter.GeminiResponse(
            "{\"is_toxic\":false,\"masked_description\":\"Hỏng nắp cống tại ngã tư Lê Lợi lúc 14h chiều qua\",\"trust_score\":85," +
            "\"reason\":\"Địa điểm và thời gian cụ thể\",\"priority\":\"MEDIUM\",\"domain\":\"HA_TANG\"}",
            300, 50
        );
        
        when(geminiAdapter.generateStructuredResponseWithUsageAsync(any(), any()))
            .thenReturn(CompletableFuture.completedFuture(mockResponse));
        
        // WHEN
        autoDispatchService.executeAiTask(task);
        
        // THEN
        // Verify GỌI text-only method
        verify(geminiAdapter, times(1)).generateStructuredResponseWithUsageAsync(any(), any());
    }

    @Test
    @DisplayName("Toxic Test: Báo cáo chứa ngôn từ độc hại (Không phải CRITICAL) -> Tự động REJECTED")
    void executeAiTask_toxicNonCritical_shouldReject() throws Exception {
        Long taskId = 101L;
        Long feedbackId = 201L;

        Feedback feedback = new Feedback();
        feedback.setId(feedbackId);
        feedback.setTrackingCode("FB-201");
        feedback.setDescription("Nội dung xúc phạm chửi thề...");

        AiTask task = new AiTask();
        task.setId(taskId);
        task.setFeedback(feedback);

        when(feedbackRepository.findById(feedbackId)).thenReturn(Optional.of(feedback));
        when(feedbackRepository.findByIdForUpdate(feedbackId)).thenReturn(Optional.of(feedback));
        when(aiTaskRepository.findById(taskId)).thenReturn(Optional.of(task));

        GeminiAdapter.GeminiResponse mockResponse = new GeminiAdapter.GeminiResponse(
            "{\"is_toxic\":true,\"masked_description\":\"Nội dung xúc phạm...\",\"trust_score\":70," +
            "\"reason\":\"Ngôn từ độc hại\",\"priority\":\"MEDIUM\",\"domain\":\"HA_TANG\"}",
            300, 50
        );

        when(geminiAdapter.generateStructuredResponseWithUsageAsync(any(), any()))
            .thenReturn(CompletableFuture.completedFuture(mockResponse));

        autoDispatchService.executeAiTask(task);

        assertEquals(com.example.smartcity.modules.feedback.entity.FeedbackStatus.REJECTED, feedback.getStatus());
    }

    @Test
    @DisplayName("Toxic Test: Ca khẩn cấp CRITICAL chứa từ độc hại -> Bỏ qua REJECT để cứu hộ trước")
    void executeAiTask_toxicCritical_shouldBypassRejectForRescue() throws Exception {
        Long taskId = 102L;
        Long feedbackId = 202L;

        Feedback feedback = new Feedback();
        feedback.setId(feedbackId);
        feedback.setTrackingCode("FB-202");
        feedback.setDescription("Tai nạn nghiêm trọng lỡ chửi thề...");

        AiTask task = new AiTask();
        task.setId(taskId);
        task.setFeedback(feedback);

        when(feedbackRepository.findById(feedbackId)).thenReturn(Optional.of(feedback));
        when(feedbackRepository.findByIdForUpdate(feedbackId)).thenReturn(Optional.of(feedback));
        when(aiTaskRepository.findById(taskId)).thenReturn(Optional.of(task));

        GeminiAdapter.GeminiResponse mockResponse = new GeminiAdapter.GeminiResponse(
            "{\"is_toxic\":true,\"masked_description\":\"Tai nạn nghiêm trọng...\",\"trust_score\":90," +
            "\"reason\":\"Khẩn cấp\",\"priority\":\"CRITICAL\",\"domain\":\"GIAO_THONG\"}",
            300, 50
        );

        when(geminiAdapter.generateStructuredResponseWithUsageAsync(any(), any()))
            .thenReturn(CompletableFuture.completedFuture(mockResponse));

        autoDispatchService.executeAiTask(task);

        org.junit.jupiter.api.Assertions.assertNotEquals(
            com.example.smartcity.modules.feedback.entity.FeedbackStatus.REJECTED, 
            feedback.getStatus()
        );
        assertEquals("POLICE", feedback.getAssignedToRole());
    }

    @Test
    @DisplayName("Trust Score Test: Điểm tin cậy < 40 -> Tự động REJECTED do mô tả quá mơ hồ")
    void executeAiTask_lowTrustScore_shouldReject() throws Exception {
        Long taskId = 103L;
        Long feedbackId = 203L;

        Feedback feedback = new Feedback();
        feedback.setId(feedbackId);
        feedback.setTrackingCode("FB-203");
        feedback.setDescription("Hỏng rồi");

        AiTask task = new AiTask();
        task.setId(taskId);
        task.setFeedback(feedback);

        when(feedbackRepository.findById(feedbackId)).thenReturn(Optional.of(feedback));
        when(feedbackRepository.findByIdForUpdate(feedbackId)).thenReturn(Optional.of(feedback));
        when(aiTaskRepository.findById(taskId)).thenReturn(Optional.of(task));

        GeminiAdapter.GeminiResponse mockResponse = new GeminiAdapter.GeminiResponse(
            "{\"is_toxic\":false,\"masked_description\":\"Hỏng rồi\",\"trust_score\":25," +
            "\"reason\":\"Quá mơ hồ\",\"priority\":\"LOW\",\"domain\":\"HA_TANG\"}",
            300, 50
        );

        when(geminiAdapter.generateStructuredResponseWithUsageAsync(any(), any()))
            .thenReturn(CompletableFuture.completedFuture(mockResponse));

        autoDispatchService.executeAiTask(task);

        assertEquals(com.example.smartcity.modules.feedback.entity.FeedbackStatus.REJECTED, feedback.getStatus());
    }

    @Test
    @DisplayName("Police Domain Test: Domain AN_NINH -> Gán assignedToRole = POLICE và receiverType = POLICE")
    void executeAiTask_policeDomain_shouldAssignPoliceRole() throws Exception {
        Long taskId = 104L;
        Long feedbackId = 204L;

        Feedback feedback = new Feedback();
        feedback.setId(feedbackId);
        feedback.setTrackingCode("FB-204");
        feedback.setDescription("Đánh nhau gây mất an ninh trật tự");

        AiTask task = new AiTask();
        task.setId(taskId);
        task.setFeedback(feedback);

        when(feedbackRepository.findById(feedbackId)).thenReturn(Optional.of(feedback));
        when(feedbackRepository.findByIdForUpdate(feedbackId)).thenReturn(Optional.of(feedback));
        when(aiTaskRepository.findById(taskId)).thenReturn(Optional.of(task));

        GeminiAdapter.GeminiResponse mockResponse = new GeminiAdapter.GeminiResponse(
            "{\"is_toxic\":false,\"masked_description\":\"Đánh nhau gây mất an ninh trật tự\",\"trust_score\":85," +
            "\"reason\":\"An ninh trật tự\",\"priority\":\"HIGH\",\"domain\":\"AN_NINH\"}",
            300, 50
        );

        when(geminiAdapter.generateStructuredResponseWithUsageAsync(any(), any()))
            .thenReturn(CompletableFuture.completedFuture(mockResponse));

        autoDispatchService.executeAiTask(task);

        assertEquals("POLICE", feedback.getAssignedToRole());
        assertEquals("POLICE", feedback.getReceiverType());
    }
}
