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
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.net.URL;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

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
    private final WebSocketNotificationService notificationService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Data
    public static class AiAnalysisResult {
        private boolean is_toxic;
        private String masked_description;
        private int trust_score;
        private String reason;
        private String priority;
        private String domain;
    }

    @Async("aiTaskExecutor")
    public void analyzeAndDispatch(Long feedbackId) {
        Feedback feedback = feedbackRepository.findById(feedbackId).orElse(null);
        if (feedback == null) return;

        log.info("🚀 [Auto-Dispatch] Bắt đầu phân tích AI Multimodal cho Feedback #{}", feedback.getTrackingCode());

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
        
        String aiRawResult;
        try {
            // [MULTIMODAL] Gọi API mới hỗ trợ Base64 Images
            aiRawResult = geminiAdapter.generateMultimodalResponseAsync(systemPrompt, userMessage, base64Images).get();
        } catch (Exception e) {
            log.warn("⚠️ [Auto-Dispatch] AI phân tích thất bại (Quá tải/Rate Limit). Lý do: {}", e.getMessage());
            
            // Ghi log báo cho Admin biết AI đã sập, cần duyệt bằng tay
            FeedbackLog logEntry = new FeedbackLog(feedback, feedback.getCitizen(), feedback.getStatus(), feedback.getStatus(), 
                "⚠️ [HỆ THỐNG] Hệ thống AI đang quá tải hoặc gặp sự cố. Báo cáo này đã tự động được chuyển sang luồng Duyệt Thủ Công (MANUAL_REVIEW).");
            feedbackLogRepository.save(logEntry);
            return;
        }

        log.info("🤖 [Auto-Dispatch] Raw AI Output: {}", aiRawResult);

        // Clean markdown if present
        String jsonStr = aiRawResult;
        if (jsonStr.contains("```json")) {
            jsonStr = jsonStr.substring(jsonStr.indexOf("```json") + 7, jsonStr.lastIndexOf("```"));
        } else if (jsonStr.contains("```")) {
            jsonStr = jsonStr.substring(jsonStr.indexOf("```") + 3, jsonStr.lastIndexOf("```"));
        }

        try {
            AiAnalysisResult result = objectMapper.readValue(jsonStr.trim(), AiAnalysisResult.class);
            processAiResult(feedbackId, result);
        } catch (Exception e) {
            log.warn("⚠️ [Auto-Dispatch] Parse JSON thất bại: {}", e.getMessage());
        }
    }

    @Transactional
    public void processAiResult(Long feedbackId, AiAnalysisResult aiResult) {
        Feedback feedback = feedbackRepository.findById(feedbackId).orElse(null);
        if (feedback == null) return;
        
        FeedbackStatus oldStatus = feedback.getStatus();
        if (oldStatus != FeedbackStatus.PENDING) {
            log.warn("⚠️ [Auto-Dispatch] Feedback {} đã đổi trạng thái ({}). Hủy xử lý.", feedback.getTrackingCode(), oldStatus);
            return;
        }

        String safePriority = sanitizePriority(aiResult.getPriority());
        String safeDomain = sanitizeDomain(aiResult.getDomain());

        // [MODERATION] 1. Kiểm tra ngôn từ độc hại (Toxicity Filter)
        if (aiResult.is_toxic()) {
            // LỖ HỔNG NGHIỆP VỤ FIX: Nếu ưu tiên là CRITICAL thì bỏ qua Toxicity Filter (Cứu người trước)
            if ("CRITICAL".equals(safePriority)) {
                log.warn("⚠️ [MODERATION] Phát hiện Toxic nhưng Priority=CRITICAL -> Bỏ qua chặn, ưu tiên cứu hộ!");
                FeedbackLog logEntry = new FeedbackLog(feedback, feedback.getCitizen(), oldStatus, oldStatus, 
                    "🔴 [AI WARNING] Người báo cáo văng tục/xúc phạm nhưng sự cố thuộc loại KHẨN CẤP (CRITICAL). Hệ thống tự động bỏ qua kiểm duyệt để ưu tiên cứu hộ.");
                feedbackLogRepository.save(logEntry);
            } else {
                feedback.setStatus(FeedbackStatus.REJECTED);
                feedback.setResolutionNote("Từ chối tự động bởi AI: Vi phạm tiêu chuẩn cộng đồng (ngôn từ xúc phạm/văng tục).");
                feedbackRepository.save(feedback);

                FeedbackLog logEntry = new FeedbackLog(feedback, feedback.getCitizen(), oldStatus, FeedbackStatus.REJECTED, 
                    "[AI MODERATION] Tự động khóa do phát hiện ngôn từ độc hại (Toxic=true).");
                feedbackLogRepository.save(logEntry);

                notificationService.notifyFeedbackStatusChange(feedbackId, FeedbackStatus.REJECTED.name(),
                    "🚫 Phản ánh " + feedback.getTrackingCode() + " đã bị từ chối do vi phạm chuẩn mực cộng đồng.");
                return; // Dừng luôn, không cần xét điểm uy tín nữa
            }
        }

        // [MODERATION] 2. Che mờ dữ liệu cá nhân (PII Redaction)
        if (aiResult.getMasked_description() != null && !aiResult.getMasked_description().isBlank()) {
            feedback.setDescription(aiResult.getMasked_description());
            feedbackRepository.save(feedback); 
        }

        log.info("📊 [Auto-Dispatch] Result parsed: Trust={}, Priority={}, Domain={}", aiResult.getTrust_score(), safePriority, safeDomain);

        // 3. TRUST SCORE < 40 -> SPAM/REJECT
        if (aiResult.getTrust_score() < 40) {
            feedback.setStatus(FeedbackStatus.REJECTED);
            feedback.setResolutionNote("Từ chối tự động bởi AI: " + aiResult.getReason());
            feedbackRepository.save(feedback);

            FeedbackLog logEntry = new FeedbackLog(feedback, feedback.getCitizen(), oldStatus, FeedbackStatus.REJECTED, 
                "[AI AUTO-REJECT] Trust Score: " + aiResult.getTrust_score() + "% - " + aiResult.getReason());
            feedbackLogRepository.save(logEntry);

            notificationService.notifyFeedbackStatusChange(feedbackId, FeedbackStatus.REJECTED.name(),
                "🚫 Phản ánh " + feedback.getTrackingCode() + " đã bị từ chối do hệ thống AI phát hiện nghi ngờ giả mạo/spam.");
            return;
        }

        // Xác định ReceiverType dựa trên Domain
        String receiverType = ("AN_NINH".equals(safeDomain) || "GIAO_THONG".equals(safeDomain)) ? "POLICE" : "WARD_STAFF";
        feedback.setPriority(safePriority);
        feedback.setReceiverType(receiverType);

        // 4. TRUST SCORE 40 - 70 -> PENDING (Cảnh báo nhưng VẪN LƯU GỢI Ý CỦA AI)
        if (aiResult.getTrust_score() >= 40 && aiResult.getTrust_score() <= 70) {
            feedbackRepository.save(feedback); // Lưu lại priority và receiverType để Admin tham khảo

            FeedbackLog logEntry = new FeedbackLog(feedback, feedback.getCitizen(), oldStatus, oldStatus, 
                "🟡 [AI WARNING] Trust Score trung bình (" + aiResult.getTrust_score() + "%). Yêu cầu duyệt kỹ. AI phân loại: " + safePriority + " - " + safeDomain + ". Lý do: " + aiResult.getReason());
            feedbackLogRepository.save(logEntry);
            return; // Giữ nguyên PENDING
        }

        // 5. TRUST SCORE > 70 -> Chấp nhận & Phân loại
        // Nếu CRITICAL -> Cố gắng Auto dispatch cho TẤT CẢ các Domain
        if ("CRITICAL".equals(safePriority)) {
            List<User> policeUnits = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.POLICE && u.isActive())
                .toList();
                
            if (!policeUnits.isEmpty()) {
                // [LOAD BALANCING FIX] Chọn ngẫu nhiên 1 Police thay vì luôn lấy người đầu tiên
                User assignedPolice = policeUnits.get(new java.util.Random().nextInt(policeUnits.size()));
                
                feedback.setStatus(FeedbackStatus.IN_PROGRESS);
                feedback.setReceiverType("POLICE"); // Ép chuyển về Police cho mọi ca Critical
                feedback.setAssignee(assignedPolice);
                feedbackRepository.save(feedback);

                FeedbackLog logEntry = new FeedbackLog(feedback, feedback.getCitizen(), oldStatus, FeedbackStatus.IN_PROGRESS, 
                    "🚨 [AI AUTO-DISPATCH] CRITICAL - " + safeDomain + ". Điều phối tới: " + assignedPolice.getFullName());
                feedbackLogRepository.save(logEntry);

                notificationService.notifyFeedbackStatusChange(feedbackId, FeedbackStatus.IN_PROGRESS.name(),
                    "🚨 [KHẨN CẤP] Sự cố " + feedback.getTrackingCode() + " đã được AI điều phối đến " + assignedPolice.getFullName());
                log.info("✅ [Auto-Dispatch] Hoàn tất. Lệnh điều động đã được bắn tới: {}", assignedPolice.getFullName());
                return;
            } else {
                log.warn("⚠️ [Auto-Dispatch] CRITICAL nhưng không tìm thấy POLICE để gán. Chuyển về PENDING.");
            }
        }
        
        // Priority HIGH, MEDIUM, LOW hoặc CRITICAL nhưng không tìm thấy Police -> giữ nguyên PENDING
        feedbackRepository.save(feedback);
        FeedbackLog logEntry = new FeedbackLog(feedback, feedback.getCitizen(), oldStatus, oldStatus, 
            "🟢 [AI CLASSIFIED] Mức độ: " + safePriority + ", Lĩnh vực: " + safeDomain + ", Uy tín: " + aiResult.getTrust_score() + "%.");
        feedbackLogRepository.save(logEntry);
    }

    // --- Helpers để tải hình ảnh Base64 cho Multimodal ---
    private List<String> fetchBase64Images(Long feedbackId) {
        List<Attachment> attachments = attachmentRepository.findByFeedbackId(feedbackId);
        List<String> base64Images = new ArrayList<>();
        int count = 0;
        for (Attachment att : attachments) {
            if (count >= 2) break; // Chỉ phân tích tối đa 2 ảnh để tiết kiệm thời gian
            if (att.getFileType() != null && att.getFileType().startsWith("IMAGE")) {
                try {
                    URL url = new URL(att.getFileUrl());
                    try (InputStream is = url.openStream()) {
                        byte[] bytes = is.readAllBytes();
                        base64Images.add(Base64.getEncoder().encodeToString(bytes));
                        count++;
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
