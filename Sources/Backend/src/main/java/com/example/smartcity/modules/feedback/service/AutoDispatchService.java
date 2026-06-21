package com.example.smartcity.modules.feedback.service;

import com.example.smartcity.ai_orchestrator.adapter.GeminiAdapter;
import com.example.smartcity.modules.feedback.entity.Attachment;
import com.example.smartcity.modules.feedback.entity.Feedback;
import com.example.smartcity.modules.feedback.entity.FeedbackLog;
import com.example.smartcity.modules.feedback.entity.FeedbackStatus;
import com.example.smartcity.modules.feedback.repository.AttachmentRepository;
import com.example.smartcity.modules.feedback.repository.FeedbackLogRepository;
import com.example.smartcity.modules.feedback.repository.FeedbackRepository;
import com.example.smartcity.modules.notification.WebSocketNotificationService;
import com.example.smartcity.modules.user.entity.Role;
import com.example.smartcity.modules.user.entity.User;
import com.example.smartcity.modules.user.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.example.smartcity.modules.file.FileStorageService;
import org.springframework.core.io.Resource;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.concurrent.TimeUnit;

import java.io.InputStream;
import java.net.URL;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import com.example.smartcity.modules.feedback.entity.AiTask;
import com.example.smartcity.modules.feedback.repository.AiTaskRepository;
import com.example.smartcity.modules.feedback.entity.AiAnalysisLog;
import com.example.smartcity.modules.feedback.repository.AiAnalysisLogRepository;

/**
 * [ENTERPRISE FEATURE] AUTO-DISPATCH & ROUTING (Multimodal & Advanced Business Logic)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AutoDispatchService {

    private final GeminiAdapter geminiAdapter;
    private final FeedbackRepository feedbackRepository;
    private final FeedbackLogRepository feedbackLogRepository;
    private final AttachmentRepository attachmentRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final WebSocketNotificationService notificationService;
    private final com.example.smartcity.modules.notification.service.NotificationService citizenNotificationService;
    private final AiTaskRepository aiTaskRepository;
    private final AiAnalysisLogRepository aiAnalysisLogRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @org.springframework.beans.factory.annotation.Autowired
    @org.springframework.context.annotation.Lazy
    private AutoDispatchService self;

    @Data
    public static class AiAnalysisResult {
        private boolean is_toxic;
        private String masked_description;
        private int trust_score;
        private String reason;
        private String priority;
        private String domain;
    }

    @Transactional
    public List<AiTask> fetchAndLockTasks(int limit) {
        List<AiTask> tasks = aiTaskRepository.findPendingTasksForUpdate(limit);
        for (AiTask t : tasks) {
            t.setStatus("PROCESSING");
        }
        return aiTaskRepository.saveAll(tasks);
    }

    @Scheduled(fixedDelay = 5000)
    public void pollAndProcessTasks() {
        List<AiTask> tasks;
        try {
            tasks = self.fetchAndLockTasks(5);
        } catch (Exception e) {
            log.error("❌ [Outbox Worker] Lỗi quét và khóa tác vụ: {}", e.getMessage());
            return;
        }

        if (tasks.isEmpty()) {
            return;
        }

        log.info("[Outbox Worker] Phát hiện {} tác vụ AI cần xử lý.", tasks.size());
        for (AiTask task : tasks) {
            try {
                executeAiTask(task);
            } catch (Exception e) {
                log.error("❌ [Outbox Worker] Lỗi xử lý task id={}: {}", task.getId(), e.getMessage());
                self.handleAiFallbackAndRetry(task.getId(), task.getFeedback().getId(), e.getMessage());
            }
        }
    }

    public void executeAiTask(AiTask task) {
        Long feedbackId = task.getFeedback().getId();
        Feedback feedback = feedbackRepository.findById(feedbackId).orElse(null);
        if (feedback == null) {
            self.completeTaskWithStatus(task.getId(), "FAILED", "Không tìm thấy feedback");
            return;
        }

        log.info("🚀 [Auto-Dispatch Worker] Bắt đầu phân tích AI Multimodal cho Feedback #{}", feedback.getTrackingCode());

        // [MULTIMODAL] Lấy hình ảnh chuyển sang Base64
        List<String> base64Images = fetchBase64Images(feedbackId);

        String systemPrompt = """
            Bạn là một Chuyên gia phân tích dữ liệu Đô thị Thông minh và Kiểm duyệt nội dung.
            Nhiệm vụ: Đánh giá độ tin cậy, kiểm duyệt ngôn từ, che giấu thông tin cá nhân và phân loại sự cố dựa trên mô tả và HÌNH ẢNH đính kèm (nếu có).
            
            QUY TẮC KIỂM DUYỆT (BẮT BUỘC):
            1. is_toxic: Đặt thành true nếu mô tả có từ ngữ chửi thề, văng tục, xúc phạm. Tuy nhiên, nếu là trường hợp khẩn cấp cấp bách (đe dọa tính mạng), có thể linh động.
            2. masked_description: Tìm và che toàn bộ Số điện thoại, Số thẻ CCCD/CMND, hoặc tên riêng cá nhân bằng chuỗi "***". Nếu không có thì trả lại nguyên văn.
            3. trust_score: Phải đối chiếu hình ảnh. Nếu nội dung kêu cháy nhà nhưng ảnh là bãi rác, chấm điểm cực thấp (<30). Nếu hình ảnh khớp nội dung, chấm điểm cao (>80).
            
            BẮT BUỘC trả về ĐÚNG định dạng JSON sau, không kèm bất kỳ giải thích nào khác:
            {
              "is_toxic": <true/false>,
              "masked_description": "<Đoạn text đã được che SĐT, CCCD bằng dấu ***, nếu không có thì giữ nguyên>",
              "trust_score": <số từ 0 đến 100 đánh giá độ tin cậy/nghiêm túc của báo cáo, <40 là spam/ảo, >70 là đáng tin>,
              "reason": "<Lý do ngắn gọn giải thích tại sao chấm điểm trust_score và phân loại như vậy>",
              "priority": "<CRITICAL | HIGH | MEDIUM | LOW>",
              "domain": "<AN_NINH | GIAO_THONG | MOI_TRUONG | HA_TANG | Y_TE | KHAC>"
            }
            """;

        String userMessage = "Mô tả sự cố: \"" + feedback.getDescription() + "\"";
        
        long startTime = System.currentTimeMillis();
        GeminiAdapter.GeminiResponse geminiResponse;
        try {
            geminiResponse = geminiAdapter.generateMultimodalResponseWithUsageAsync(systemPrompt, userMessage, base64Images)
                    .get(30, TimeUnit.SECONDS);
        } catch (Exception e) {
            log.warn("⚠️ [Auto-Dispatch Worker] AI phân tích thất bại cho Feedback {}. Lý do: {}", feedback.getTrackingCode(), e.getMessage());
            self.handleAiFallbackAndRetry(task.getId(), feedbackId, e.getMessage());
            return;
        }

        long latency = System.currentTimeMillis() - startTime;
        String aiRawResult = geminiResponse.getText();
        int inputTokens = geminiResponse.getInputTokens();
        int outputTokens = geminiResponse.getOutputTokens();

        log.info("🤖 [Auto-Dispatch Worker] Raw AI Output: {}", aiRawResult);

        // Clean markdown if present
        String jsonStr = aiRawResult;
        if (jsonStr.contains("```json")) {
            jsonStr = jsonStr.substring(jsonStr.indexOf("```json") + 7, jsonStr.lastIndexOf("```"));
        } else if (jsonStr.contains("```")) {
            jsonStr = jsonStr.substring(jsonStr.indexOf("```") + 3, jsonStr.lastIndexOf("```"));
        }

        try {
            AiAnalysisResult result = objectMapper.readValue(jsonStr.trim(), AiAnalysisResult.class);
            self.processAiResultAndCompleteTask(task.getId(), feedbackId, result, inputTokens, outputTokens, latency, aiRawResult);
        } catch (Exception e) {
            log.warn("⚠️ [Auto-Dispatch Worker] Parse JSON thất bại: {}", e.getMessage());
            self.handleAiFallbackAndRetry(task.getId(), feedbackId, "Parse JSON thất bại: " + e.getMessage());
        }
    }

    @Transactional
    public void processAiResultAndCompleteTask(Long taskId, Long feedbackId, AiAnalysisResult aiResult, 
                                                int inputTokens, int outputTokens, long latency, String rawResponse) {
        Feedback feedback = feedbackRepository.findByIdForUpdate(feedbackId).orElse(null);
        if (feedback == null) return;

        AiTask aiTask = aiTaskRepository.findById(taskId).orElse(null);
        if (aiTask == null) return;

        FeedbackStatus oldStatus = feedback.getStatus();
        
        String safePriority = sanitizePriority(aiResult.getPriority());
        String safeDomain = sanitizeDomain(aiResult.getDomain());

        // [MODERATION] 1. Kiểm tra ngôn từ độc hại (Toxicity Filter)
        boolean isToxicReported = aiResult.is_toxic();
        boolean toxicityApplied = false;
        
        if (isToxicReported) {
            if ("CRITICAL".equals(safePriority)) {
                log.warn("⚠️ [MODERATION] Phát hiện Toxic nhưng Priority=CRITICAL -> Bỏ qua chặn, ưu tiên cứu hộ!");
                FeedbackLog logEntry = new FeedbackLog(feedback, feedback.getCitizen(), oldStatus, oldStatus, 
                    "🔴 [AI WARNING] Người báo cáo văng tục/xúc phạm nhưng sự cố thuộc loại KHẨN CẤP (CRITICAL). Hệ thống tự động bỏ qua kiểm duyệt để ưu tiên cứu hộ.");
                feedbackLogRepository.save(logEntry);
            } else {
                toxicityApplied = true;
                String friendlyMsg = "Phản ánh của bạn chứa ngôn từ chưa phù hợp với tiêu chuẩn cộng đồng. " +
                    "Vui lòng điều chỉnh nội dung và gửi lại. Chúng tôi luôn sẵn sàng lắng nghe!";
                feedback.setStatus(FeedbackStatus.REJECTED);
                feedback.setResolutionNote(friendlyMsg);
                feedbackRepository.save(feedback);

                FeedbackLog logEntry = new FeedbackLog(feedback, feedback.getCitizen(), oldStatus, FeedbackStatus.REJECTED, 
                    "[AI MODERATION] Tự động khóa do phát hiện ngôn từ độc hại (Toxic=true).");
                feedbackLogRepository.save(logEntry);

                final String trackingCode = feedback.getTrackingCode();
                TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                    @Override
                    public void afterCommit() {
                        citizenNotificationService.createFeedbackRejectedNotification(feedbackId, friendlyMsg);
                        notificationService.notifyFeedbackStatusChange(feedbackId, FeedbackStatus.REJECTED.name(),
                            "🚫 Phản ánh " + trackingCode + " chưa được tiếp nhận do nội dung chưa phù hợp.");
                    }
                });
            }
        }

        if (!toxicityApplied) {
            // [MODERATION] 2. Che mờ dữ liệu cá nhân (PII Redaction)
            if (aiResult.getMasked_description() != null && !aiResult.getMasked_description().isBlank()) {
                feedback.setDescription(aiResult.getMasked_description());
            }

            log.info("📊 [Auto-Dispatch] Result parsed: Trust={}, Priority={}, Domain={}", aiResult.getTrust_score(), safePriority, safeDomain);

            // 3. TRUST SCORE < 40 -> SPAM/REJECT
            if (aiResult.getTrust_score() < 40) {
                String friendlyMsg = "Hình ảnh hoặc nội dung mô tả trong phản ánh chưa đủ rõ ràng để xác minh. " +
                    "Vui lòng bổ sung ảnh/video thực tế, góc chụp rõ và mô tả chi tiết hơn, sau đó gửi lại.";
                feedback.setStatus(FeedbackStatus.REJECTED);
                feedback.setResolutionNote(friendlyMsg);
                feedbackRepository.save(feedback);

                FeedbackLog logEntry = new FeedbackLog(feedback, feedback.getCitizen(), oldStatus, FeedbackStatus.REJECTED, 
                    "[AI AUTO-REJECT] Trust Score: " + aiResult.getTrust_score() + "% - " + aiResult.getReason());
                feedbackLogRepository.save(logEntry);

                final String trackingCode = feedback.getTrackingCode();
                TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                    @Override
                    public void afterCommit() {
                        citizenNotificationService.createFeedbackRejectedNotification(feedbackId, friendlyMsg);
                        notificationService.notifyFeedbackStatusChange(feedbackId, FeedbackStatus.REJECTED.name(),
                            "🚫 Phản ánh " + trackingCode + " chưa được tiếp nhận do thiếu bằng chứng xác thực.");
                    }
                });
            } else {
                String receiverType = ("AN_NINH".equals(safeDomain) || "GIAO_THONG".equals(safeDomain)) ? "POLICE" : "WARD_STAFF";
                feedback.setPriority(safePriority);
                feedback.setReceiverType(receiverType);
                feedback.setManagedByRole(receiverType);
                feedback.setAssignedToRole(receiverType);
                if (feedback.getWard() != null) {
                    if ("POLICE".equals(receiverType)) {
                        feedback.setAssignedUnitName(feedback.getWard().getName() + " Ward Police");
                    } else {
                        feedback.setAssignedUnitName(feedback.getWard().getName() + " Ward People's Committee");
                    }
                }
                
                feedbackRepository.save(feedback);

                if (aiResult.getTrust_score() <= 70) {
                    FeedbackLog logEntry = new FeedbackLog(feedback, feedback.getCitizen(), oldStatus, oldStatus, 
                        "🟡 [AI WARNING] Trust Score trung bình (" + aiResult.getTrust_score() + "%). Yêu cầu duyệt kỹ. AI phân loại: " + safePriority + " - " + safeDomain + ". Lý do: " + aiResult.getReason());
                    feedbackLogRepository.save(logEntry);
                } else {
                    FeedbackLog logEntry = new FeedbackLog(feedback, feedback.getCitizen(), oldStatus, oldStatus, 
                        "🟢 [AI CLASSIFIED] Mức độ: " + safePriority + ", Lĩnh vực: " + safeDomain + ", Uy tín: " + aiResult.getTrust_score() + "%.");
                    feedbackLogRepository.save(logEntry);
                }
            }
        }

        // Tạo log phân tích AI có cấu trúc
        AiAnalysisLog analysisLog = AiAnalysisLog.builder()
            .feedback(feedback)
            .trustScore(aiResult.getTrust_score())
            .isToxic(isToxicReported)
            .domain(safeDomain)
            .priority(safePriority)
            .reason(aiResult.getReason())
            .rawResponse(rawResponse)
            .tokensUsedInput(inputTokens)
            .tokensUsedOutput(outputTokens)
            .latencyMs(latency)
            .modelName(geminiAdapter.getProviderName())
            .build();
        aiAnalysisLogRepository.save(analysisLog);

        // Cập nhật AiTask thành COMPLETED
        aiTask.setStatus("COMPLETED");
        aiTask.setErrorMessage(null);
        aiTaskRepository.save(aiTask);
        log.info("[Outbox Worker] Đã hoàn thành AiTask id={}, feedbackId={}", taskId, feedbackId);
    }

    @Transactional
    public void handleAiFallbackAndRetry(Long taskId, Long feedbackId, String errorMessage) {
        Feedback feedback = feedbackRepository.findById(feedbackId).orElse(null);
        AiTask aiTask = aiTaskRepository.findById(taskId).orElse(null);
        if (aiTask == null) return;

        int retry = aiTask.getRetryCount() + 1;
        aiTask.setRetryCount(retry);
        aiTask.setErrorMessage(errorMessage);

        if (retry >= 3) {
            aiTask.setStatus("FAILED");
            log.error("❌ [Outbox Worker] Tác vụ AI cho Feedback #{} thất bại hoàn toàn sau 3 lần thử.", feedback != null ? feedback.getTrackingCode() : feedbackId);
            
            if (feedback != null) {
                FeedbackLog logEntry = new FeedbackLog(feedback, feedback.getCitizen(), feedback.getStatus(), feedback.getStatus(), 
                    "⚠️ [HỆ THỐNG] Phân tích AI thất bại hoàn toàn sau 3 lần thử (" + errorMessage + "). Báo cáo chuyển sang luồng Duyệt Thủ Công.");
                feedbackLogRepository.save(logEntry);
            }
        } else {
            aiTask.setStatus("PENDING");
            log.warn("⚠️ [Outbox Worker] Đang lên lịch thử lại tác vụ AI cho Feedback #{} (lần thử thứ {}).", feedback != null ? feedback.getTrackingCode() : feedbackId, retry);
        }
        aiTaskRepository.save(aiTask);
    }

    @Transactional
    public void completeTaskWithStatus(Long taskId, String status, String errorMessage) {
        AiTask aiTask = aiTaskRepository.findById(taskId).orElse(null);
        if (aiTask != null) {
            aiTask.setStatus(status);
            aiTask.setErrorMessage(errorMessage);
            aiTaskRepository.save(aiTask);
        }
    }

    // --- Helpers để tải hình ảnh Base64 cho Multimodal ---
    List<String> fetchBase64Images(Long feedbackId) {
        List<Attachment> attachments = attachmentRepository.findByFeedbackId(feedbackId);
        List<String> base64Images = new ArrayList<>();
        int count = 0;
        for (Attachment att : attachments) {
            if (count >= 2) break; // Chỉ phân tích tối đa 2 ảnh để tiết kiệm thời gian
            if (att.getFileType() != null && att.getFileType().startsWith("IMAGE")) {
                try {
                    String fileUrl = att.getFileUrl();
                    String fileName = null;
                    if (fileUrl != null) {
                        if (fileUrl.contains("/api/files/")) {
                            fileName = fileUrl.substring(fileUrl.indexOf("/api/files/") + "/api/files/".length());
                        } else if (!fileUrl.startsWith("http://") && !fileUrl.startsWith("https://")) {
                            if (fileUrl.contains("/")) {
                                fileName = fileUrl.substring(fileUrl.lastIndexOf("/") + 1);
                            } else {
                                fileName = fileUrl;
                            }
                        }
                    }

                    if (fileName != null) {
                        log.info("ℹ️ Tải ảnh từ thư mục cục bộ thông qua FileStorageService, fileName: {}", fileName);
                        Resource resource = fileStorageService.loadFile(fileName);
                        try (InputStream is = resource.getInputStream()) {
                            byte[] bytes = is.readAllBytes();
                            base64Images.add(Base64.getEncoder().encodeToString(bytes));
                            count++;
                        }
                    } else {
                        log.info("ℹ️ Tải ảnh từ URL: {}", fileUrl);
                        URL url = new URL(fileUrl);
                        try (InputStream is = url.openStream()) {
                            byte[] bytes = is.readAllBytes();
                            base64Images.add(Base64.getEncoder().encodeToString(bytes));
                            count++;
                        }
                    }
                } catch (Exception e) {
                    log.warn("⚠️ Lỗi tải ảnh {}: {}", att.getFileUrl(), e.getMessage());
                }
            }
        }
        return base64Images;
    }

    // --- Helpers để chống ảo giác (Hallucination) từ AI ---
    private String sanitizePriority(String rawPriority) {
        if (rawPriority == null) return "MEDIUM";
        String p = rawPriority.toUpperCase().trim();
        return (p.contains("CRITICAL") || p.contains("HIGH") || p.contains("LOW")) ? p : "MEDIUM";
    }

    private String sanitizeDomain(String rawDomain) {
        if (rawDomain == null) return "KHAC";
        String d = rawDomain.toUpperCase().trim();
        if (d.contains("AN_NINH")) return "AN_NINH";
        if (d.contains("GIAO_THONG")) return "GIAO_THONG";
        if (d.contains("MOI_TRUONG")) return "MOI_TRUONG";
        if (d.contains("HA_TANG")) return "HA_TANG";
        if (d.contains("Y_TE")) return "Y_TE";
        return "KHAC";
    }


}
