package com.example.smartcity.modules.feedback.service;

import com.example.smartcity.ai_orchestrator.adapter.GeminiAdapter;
import com.example.smartcity.modules.feedback.entity.AiAnalysisLog;
import com.example.smartcity.modules.feedback.entity.AiTask;
import com.example.smartcity.modules.feedback.entity.Feedback;
import com.example.smartcity.modules.feedback.entity.FeedbackLog;
import com.example.smartcity.modules.feedback.entity.FeedbackStatus;
import com.example.smartcity.modules.feedback.repository.AiAnalysisLogRepository;
import com.example.smartcity.modules.feedback.repository.AiTaskRepository;
import com.example.smartcity.modules.feedback.repository.FeedbackLogRepository;
import com.example.smartcity.modules.feedback.repository.FeedbackRepository;
import com.example.smartcity.modules.notification.WebSocketNotificationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * [ENTERPRISE FEATURE] AUTO-DISPATCH & ROUTING (Text-Only AI & Advanced Business Logic)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AutoDispatchService {

    private final GeminiAdapter geminiAdapter;
    private final FeedbackRepository feedbackRepository;
    private final FeedbackLogRepository feedbackLogRepository;
    private final WebSocketNotificationService notificationService;
    private final com.example.smartcity.modules.notification.service.NotificationService citizenNotificationService;
    private final AiTaskRepository aiTaskRepository;
    private final AiAnalysisLogRepository aiAnalysisLogRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @org.springframework.beans.factory.annotation.Autowired
    @org.springframework.context.annotation.Lazy
    private AutoDispatchService self;

    public void setSelf(AutoDispatchService self) {
        this.self = self;
    }

    private AutoDispatchService getSelf() {
        return self != null ? self : this;
    }

    @Data
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties(ignoreUnknown = true)
    public static class AiAnalysisResult {
        @com.fasterxml.jackson.annotation.JsonProperty("is_toxic")
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

        log.info("🚀 [Auto-Dispatch Worker] Bắt đầu phân tích AI cho Feedback #{}", feedback.getTrackingCode());

        String systemPrompt = """
            Bạn là một Chuyên gia phân tích dữ liệu Đô thị Thông minh và Kiểm duyệt nội dung cho Chính quyền.
            Nhiệm vụ: Đánh giá độ tin cậy, kiểm duyệt ngôn từ, che giấu thông tin cá nhân và phân loại sự cố DỰA HOÀN TOÀN VÀO VĂN BẢN MÔ TẢ.
            
            QUY TẮC KIỂM DUYỆT (BẮT BUỘC):
            1. is_toxic: Đặt thành true nếu mô tả có từ ngữ chửi thề, thóa mạ. Nếu là khẩn cấp cứu hộ (cháy, tai nạn, đánh nhau), có thể bỏ qua.
            2. masked_description: Tìm và che Số điện thoại, CCCD bằng chuỗi "***".
            3. trust_score: Đánh giá dựa trên độ chi tiết của văn bản theo công thức (kết quả từ 0-100):
               - Điểm cơ sở: 50
               - +15 nếu có địa điểm chi tiết (số nhà, tên đường, ngã tư, phường/xã)
               - +10 nếu có mốc thời gian cụ thể (hôm nay lúc 14h, sáng nay, chiều qua)
               - +15 nếu mô tả hiện trạng rõ ràng (kích thước, màu sắc, số lượng, mức độ nguy hiểm)
               - +10 nếu mô tả dài, chi tiết (từ 50 từ trở lên, rõ ràng, mạch lạc)
               - -30 nếu mô tả dưới 5 từ hoặc chỉ là 1-2 từ đơn lẻ (quá ngắn để xác minh)
               - -20 nếu mô tả chung chung, không có địa điểm và không có thông tin cụ thể nào
               - -20 nếu nội dung lặp lại từ/câu vô nghĩa, hoặc rõ ràng là test/spam (ví dụ: "abc abc abc", "test 123", "aaaa")
               - -25 nếu nội dung hoàn toàn không liên quan đến sự cố đô thị (hỏi thủ tục hành chính, chào hỏi, quảng cáo)
            
            QUY TẮC PHÂN LOẠI DOMAIN (BẮT BUỘC):
            - AN_NINH: Đánh nhau, cờ bạc, ma túy, trộm cắp, đe dọa bằng hung khí (Giao cho CÔNG AN).
            - GIAO_THONG: Tai nạn giao thông, kẹt xe nghiêm trọng, hỏng đèn tín hiệu.
            - MOI_TRUONG: Xả rác trộm, ô nhiễm tiếng ồn (hát karaoke quá giờ), xả nước thải bốc mùi.
            - HA_TANG: Cây gãy đổ, nắp cống vỡ, sụp lún đường, đứt dây điện.
            
            QUY TẮC CHẤM ĐIỂM PRIORITY (BẮT BUỘC):
            - CRITICAL: Nguy hiểm trực tiếp đến tính mạng (Tai nạn máu me, đâm chém, hỏa hoạn, dây điện hở lõi).
            - HIGH: Ảnh hưởng diện rộng hoặc bạo lực (Cây đổ chắn ngang đường chính, đánh nhau đông người).
            - MEDIUM: Sự cố thông thường (Vứt rác bừa bãi, nắp cống vỡ, karaoke ồn ào).
            - LOW: Góp ý thẩm mỹ, không gấp gáp (Sơn lại tường, cỏ mọc dài).
            
            BẮT BUỘC trả về ĐÚNG định dạng JSON sau, không kèm bất kỳ giải thích nào khác. LƯU Ý QUAN TRỌNG: Chỉ trả về JSON thô hợp lệ. KHÔNG thêm bất kỳ văn bản nào, KHÔNG dùng emoji, KHÔNG dùng markdown ```json. Ký tự đầu tiên bắt buộc phải là '{':
            {
              "is_toxic": <true/false>,
              "masked_description": "<Đoạn text đã che PII>",
              "trust_score": <0-100>,
              "reason": "<Lý do phân loại domain và priority>",
              "priority": "<CRITICAL | HIGH | MEDIUM | LOW>",
              "domain": "<AN_NINH | GIAO_THONG | MOI_TRUONG | HA_TANG | Y_TE | KHAC>"
            }
            """;

        String userMessage = "Mô tả sự cố: \"" + feedback.getDescription() + "\"";
        
        long startTime = System.currentTimeMillis();
        GeminiAdapter.GeminiResponse geminiResponse;
        try {
            geminiResponse = geminiAdapter.generateStructuredResponseWithUsageAsync(systemPrompt, userMessage)
                    .get(15, TimeUnit.SECONDS);
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

        // Guard: Nếu response không chứa '{' thì là mock fallback (Gemini bị rate limit)
        // → không parse JSON, retry luôn để tránh lỗi confusing "Unexpected character"
        if (!aiRawResult.contains("{")) {
            log.warn("⚠️ [Auto-Dispatch Worker] AI trả về mock fallback (có thể do rate limit), kích hoạt retry. Response: {}",
                    aiRawResult.substring(0, Math.min(100, aiRawResult.length())));
            self.handleAiFallbackAndRetry(task.getId(), feedbackId, "AI mock fallback: " + aiRawResult.substring(0, Math.min(80, aiRawResult.length())));
            return;
        }

        // Clean markdown if present and extract only the JSON object
        String jsonStr = aiRawResult;
        jsonStr = jsonStr.replace("```json", "");
        jsonStr = jsonStr.replace("```", "");
        jsonStr = jsonStr.trim();

        int startIndex = jsonStr.indexOf("{");
        int endIndex = jsonStr.lastIndexOf("}");
        if (startIndex >= 0 && endIndex >= 0 && startIndex <= endIndex) {
            jsonStr = jsonStr.substring(startIndex, endIndex + 1);
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
                String friendlyMsg = "Nội dung mô tả trong phản ánh chưa đủ rõ ràng để xác minh. " +
                    "Vui lòng bổ sung địa điểm cụ thể (số nhà, tên đường, phường/xã), mốc thời gian và mô tả hiện trạng chi tiết hơn, sau đó gửi lại.";
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
                
                if (aiResult.getTrust_score() <= 70) {
                    feedback.setStatus(FeedbackStatus.PENDING);
                } else {
                    feedback.setStatus(FeedbackStatus.ASSIGNED);
                }
                feedbackRepository.save(feedback);

                if ("WARD_STAFF".equals(receiverType) && aiResult.getTrust_score() > 70) {
                    TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                        @Override
                        public void afterCommit() {
                            citizenNotificationService.createFeedbackAssignedToWardNotification(feedbackId);
                        }
                    });
                }

                if (aiResult.getTrust_score() <= 70) {
                    FeedbackLog logEntry = new FeedbackLog(feedback, feedback.getCitizen(), oldStatus, FeedbackStatus.PENDING, 
                        "🟡 [AI WARNING] Trust Score trung bình (" + aiResult.getTrust_score() + "%). Yêu cầu duyệt kỹ. AI phân loại: " + safePriority + " - " + safeDomain + ". Lý do: " + aiResult.getReason());
                    feedbackLogRepository.save(logEntry);
                    
                    final String trackingCode = feedback.getTrackingCode();
                    TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                        @Override
                        public void afterCommit() {
                            notificationService.notifyFeedbackStatusChange(feedbackId, "PENDING", 
                                "Phản ánh " + trackingCode + " đang được xem xét thêm chi tiết.");
                        }
                    });
                } else {
                    FeedbackLog logEntry = new FeedbackLog(feedback, feedback.getCitizen(), oldStatus, FeedbackStatus.ASSIGNED, 
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
                // [BUG FIX] Fallback: AI chưa kịp set managedByRole (vì fail trước khi phân loại xong)
                // → mặc định chuyển về WARD_STAFF để feedback không bị "mồ côi"
                if (feedback.getManagedByRole() == null || feedback.getManagedByRole().isBlank()) {
                    feedback.setManagedByRole("WARD_STAFF");
                    feedback.setReceiverType("WARD_STAFF");
                    feedback.setAssignedToRole("WARD_STAFF");
                    if (feedback.getWard() != null) {
                        feedback.setAssignedUnitName(feedback.getWard().getName() + " Ward People's Committee");
                    }
                    log.warn("⚠️ [Fallback] managedByRole chưa được set bởi AI → mặc định WARD_STAFF để tránh feedback mồ côi.");
                }

                // Luôn chuyển status về PENDING_RECEIVE để phường/cán bộ nhìn thấy và xét duyệt thủ công
                FeedbackStatus oldStatus = feedback.getStatus();
                feedback.setStatus(FeedbackStatus.PENDING_RECEIVE);
                feedbackRepository.save(feedback);

                String wardName = feedback.getWard() != null ? feedback.getWard().getName() : "địa phương";
                FeedbackLog logEntry = new FeedbackLog(feedback, feedback.getCitizen(), oldStatus, FeedbackStatus.PENDING_RECEIVE,
                    "⚠️ [Hệ thống] Hệ thống phân tích tự động hiện đang quá tải. Phản ánh đã được chuyển giao cho cán bộ Phường " + wardName + " để tiếp nhận và xử lý thủ công.");
                feedbackLogRepository.save(logEntry);

                // Notify phường (bất kể role là gì) nếu có ward → đảm bảo có người tiếp nhận
                if (feedback.getWard() != null) {
                    TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                        @Override
                        public void afterCommit() {
                            citizenNotificationService.createFeedbackAssignedToWardNotification(feedbackId);
                            // Message hướng đến citizen — không lộ thông tin nội bộ AI
                            notificationService.notifyFeedbackStatusChange(feedbackId, FeedbackStatus.PENDING_RECEIVE.name(),
                                "📋 Phản ánh " + feedback.getTrackingCode() + " của bạn đã được tiếp nhận và đang chờ xử lý.");
                        }
                    });
                }
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

    // --- Helpers để chống ảo giác (Hallucination) từ AI ---
    private String sanitizePriority(String rawPriority) {
        if (rawPriority == null) return "MEDIUM";
        String p = rawPriority.toUpperCase().trim();
        if (p.contains("CRITICAL")) return "CRITICAL";
        if (p.contains("HIGH")) return "HIGH";
        if (p.contains("LOW")) return "LOW";
        return "MEDIUM";
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
