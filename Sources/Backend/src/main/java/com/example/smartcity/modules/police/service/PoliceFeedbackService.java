package com.example.smartcity.modules.police.service;

import com.example.smartcity.modules.feedback.entity.Feedback;
import com.example.smartcity.modules.feedback.entity.FeedbackLog;
import com.example.smartcity.modules.feedback.entity.FeedbackStatus;
import com.example.smartcity.modules.feedback.entity.Attachment;
import com.example.smartcity.modules.feedback.repository.AttachmentRepository;
import com.example.smartcity.modules.feedback.repository.FeedbackLogRepository;
import com.example.smartcity.modules.feedback.repository.FeedbackRepository;
import com.example.smartcity.modules.police.dto.PoliceFeedbackResponse;
import com.example.smartcity.modules.police.dto.RejectFeedbackRequest;
import com.example.smartcity.modules.police.dto.RequestMoreInfoRequest;
import com.example.smartcity.modules.police.dto.HotspotResponse;
import com.example.smartcity.modules.police.dto.SubmitFeedbackResultRequest;
import com.example.smartcity.modules.police.dto.UpdateFeedbackStatusRequest;
import com.example.smartcity.modules.notification.service.ExternalNotificationService;
import com.example.smartcity.modules.user.entity.User;
import com.example.smartcity.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PoliceFeedbackService {

    private final FeedbackRepository feedbackRepository;
    private final FeedbackLogRepository feedbackLogRepository;
    private final UserRepository userRepository;
    private final ExternalNotificationService externalNotificationService;
    private final AttachmentRepository attachmentRepository;
    private final com.example.smartcity.ai_orchestrator.router.AiRouterService aiRouterService;
    private final com.example.smartcity.modules.notification.service.NotificationService notificationService;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();

    /**
     * Lấy danh sách phản ánh được phân công cho cán bộ công an
     */
    public List<PoliceFeedbackResponse> getAssignedFeedbacks(String username) {
        User policeUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user công an: " + username));

        if (policeUser.getWard() == null) {
            return java.util.Collections.emptyList();
        }

        // Lấy tất cả phản ánh thuộc quyền quản lý của Công an (POLICE) VÀ thuộc phường của cán bộ
        return feedbackRepository.findByManagedByRoleAndWardId("POLICE", policeUser.getWard().getId(), org.springframework.data.domain.PageRequest.of(0, 500))
                .getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Lấy danh sách điểm nóng (Hotspots) cho Bản đồ Nhiệt (Heatmap)
     */
    public List<HotspotResponse> getHotspots(String username) {
        User policeUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user công an: " + username));

        if (policeUser.getWard() == null) {
            return java.util.Collections.emptyList();
        }

        // Lấy tất cả feedback thuộc quyền quản lý của POLICE và thuộc phường của cán bộ
        return feedbackRepository.findByManagedByRoleAndWardId("POLICE", policeUser.getWard().getId(), org.springframework.data.domain.PageRequest.of(0, 1000))
                .getContent().stream()
                .filter(f -> f.getLatitude() != null && f.getLongitude() != null)
                .map(f -> {
                    // Đánh trọng số: Việc khẩn cấp/chưa xử lý = 3, Đang xử lý = 2, Đã xong/Từ chối = 1
                    int weight = 1;
                    if (f.getStatus() == FeedbackStatus.PENDING) weight = 3;
                    else if (f.getStatus() == FeedbackStatus.IN_PROGRESS || f.getStatus() == FeedbackStatus.WAITING_INFO) weight = 2;
                    
                    return new HotspotResponse(
                            f.getLatitude(),
                            f.getLongitude(),
                            weight,
                            f.getStatus().name(),
                            f.getCategory() != null ? f.getCategory().getName() : "Khác"
                    );
                })
                .collect(Collectors.toList());
    }

    /**
     * Cán bộ tiếp nhận phản ánh (chuyển từ ASSIGNED -> IN_PROGRESS)
     */
    @Transactional
    public PoliceFeedbackResponse acceptFeedback(Long feedbackId, String username) {
        Feedback feedback = getFeedback(feedbackId);

        User policeUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user công an: " + username));
                
        validatePolicePermission(policeUser, feedback);

        FeedbackStatus oldStatus = feedback.getStatus();
        feedback.setAssignee(policeUser);
        feedback.setStatus(FeedbackStatus.ASSIGNED);
        feedback.setUpdatedAt(LocalDateTime.now());
        
        Feedback updated = feedbackRepository.save(feedback);
        
        // Lưu lịch sử
        saveFeedbackLog(updated, username, oldStatus, FeedbackStatus.ASSIGNED, "Cán bộ công an đã tiếp nhận phản ánh");
        
        // Tự động gửi Email thông báo trạng thái cho người dân (Chạy ngầm Async)
        if (updated.getCitizen() != null && updated.getCitizen().getEmail() != null) {
            String subject = "[Đà Nẵng Smart City] Phản ánh đang được xử lý";
            String body = "Xin chào " + updated.getCitizen().getFullName() + ",\n\n"
                    + "Phản ánh của bạn (Mã: " + updated.getTrackingCode() + ") đã được lực lượng chức năng tiếp nhận và đang trong quá trình xử lý.\n"
                    + "Cảm ơn bạn đã đóng góp bảo vệ an ninh trật tự thành phố!";
            externalNotificationService.sendEmailNotification(updated.getCitizen().getEmail(), subject, body);
        }
        
        return mapToResponse(updated);
    }

    /**
     * Cập nhật trạng thái xử lý (Ví dụ: WAITING_INFO, IN_PROGRESS)
     */
    @Transactional
    public PoliceFeedbackResponse updateStatus(Long feedbackId, String username, UpdateFeedbackStatusRequest request) {
        Feedback feedback = getFeedback(feedbackId);
        User policeUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user: " + username));
        validatePolicePermission(policeUser, feedback);

        FeedbackStatus oldStatus = feedback.getStatus();
        feedback.setStatus(request.getStatus());
        feedback.setUpdatedAt(LocalDateTime.now());
        
        Feedback updated = feedbackRepository.save(feedback);
        
        saveFeedbackLog(updated, username, oldStatus, request.getStatus(), request.getNote());
        
        return mapToResponse(updated);
    }

    /**
     * Báo cáo kết quả xử lý cuối cùng (RESOLVED)
     */
    @Transactional
    public PoliceFeedbackResponse submitResult(Long feedbackId, String username, SubmitFeedbackResultRequest request) {
        Feedback feedback = getFeedback(feedbackId);
        User policeUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user: " + username));
        validatePolicePermission(policeUser, feedback);

        FeedbackStatus oldStatus = feedback.getStatus();
        feedback.setStatus(FeedbackStatus.RESOLVED);
        // Tạm thời nối kết quả vào description, sau này kết nối bảng FeedbackMedia/FeedbackResult
        feedback.setDescription(feedback.getDescription() + "\n\n[KẾT QUẢ XỬ LÝ]: " + request.getResultNote());
        feedback.setUpdatedAt(LocalDateTime.now());
        
        Feedback updated = feedbackRepository.save(feedback);
        
        saveFeedbackLog(updated, username, oldStatus, FeedbackStatus.RESOLVED, request.getResultNote());
        
        // Gửi thông báo cho người dân
        notificationService.createFeedbackStatusChangedNotification(updated.getId(), "RESOLVED", request.getResultNote());
        if (updated.getCitizen() != null && updated.getCitizen().getEmail() != null) {
            String subject = "[Đà Nẵng Smart City] Phản ánh đã được xử lý hoàn tất";
            String body = "Xin chào " + updated.getCitizen().getFullName() + ",\n\n"
                    + "Phản ánh của bạn (Mã: " + updated.getTrackingCode() + ") đã được xử lý hoàn tất với kết quả như sau:\n\n"
                    + request.getResultNote() + "\n\n"
                    + "Cảm ơn bạn đã đóng góp bảo vệ an ninh trật tự thành phố!";
            externalNotificationService.sendEmailNotification(updated.getCitizen().getEmail(), subject, body);
        }
        
        return mapToResponse(updated);
    }

    /**
     * Từ chối hoặc yêu cầu chuyển tiếp phản ánh
     */
    @Transactional
    public PoliceFeedbackResponse rejectFeedback(Long feedbackId, String username, RejectFeedbackRequest request) {
        Feedback feedback = getFeedback(feedbackId);
        User policeUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user: " + username));
        validatePolicePermission(policeUser, feedback);

        FeedbackStatus oldStatus = feedback.getStatus();
        feedback.setStatus(FeedbackStatus.REJECTED);
        feedback.setUpdatedAt(LocalDateTime.now());
        
        Feedback updated = feedbackRepository.save(feedback);
        
        saveFeedbackLog(updated, username, oldStatus, FeedbackStatus.REJECTED, "Từ chối/Chuyển tiếp: " + request.getReason());
        
        // Gửi thông báo từ chối cho người dân
        notificationService.createFeedbackRejectedNotification(updated.getId(), request.getReason());
        if (updated.getCitizen() != null) {
            User citizen = userRepository.findById(updated.getCitizen().getId()).orElse(null);
            if (citizen != null && citizen.getEmail() != null) {
                String subject = "[Đà Nẵng Smart City] Phản ánh bị từ chối";
                String body = "Xin chào " + citizen.getFullName() + ",\n\n"
                        + "Rất tiếc, phản ánh của bạn (Mã: " + updated.getTrackingCode() + ") đã bị từ chối với lý do sau:\n\n"
                        + request.getReason() + "\n\n"
                        + "Vui lòng gửi lại phản ánh mới với thông tin chính xác hơn hoặc liên hệ tổng đài để được hỗ trợ.";
                externalNotificationService.sendEmailNotification(citizen.getEmail(), subject, body);
            }
        }
        
        return mapToResponse(updated);
    }

    /**
     * Yêu cầu bổ sung thông tin
     */
    @Transactional
    public PoliceFeedbackResponse requestMoreInfo(Long feedbackId, String username, RequestMoreInfoRequest request) {
        Feedback feedback = getFeedback(feedbackId);
        User policeUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user: " + username));
        validatePolicePermission(policeUser, feedback);

        FeedbackStatus oldStatus = feedback.getStatus();
        feedback.setStatus(FeedbackStatus.WAITING_INFO);
        feedback.setUpdatedAt(LocalDateTime.now());
        
        Feedback updated = feedbackRepository.save(feedback);
        
        saveFeedbackLog(updated, username, oldStatus, FeedbackStatus.WAITING_INFO, "Yêu cầu bổ sung thông tin: " + request.getReason());
        
        // Tự động gửi SMS cho người dân yêu cầu bổ sung thông tin (Chạy ngầm Async)
        if (updated.getCitizen() != null && updated.getCitizen().getPhoneNumber() != null) {
            String smsMessage = "SmartCity Da Nang: Phan anh [" + updated.getTrackingCode() + "] can bo sung thong tin: " + request.getReason() + ". Vui long mo app de cap nhat.";
            externalNotificationService.sendSmsNotification(updated.getCitizen().getPhoneNumber(), smsMessage);
        }
        
        return mapToResponse(updated);
    }

    private Feedback getFeedback(Long id) {
        return feedbackRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phản ánh"));
    }

    private void validatePolicePermission(User policeUser, Feedback feedback) {
        if (!"POLICE".equals(feedback.getManagedByRole())) {
            throw new com.example.smartcity.common.exception.CustomException("Phản ánh này không thuộc thẩm quyền xử lý của công an.", org.springframework.http.HttpStatus.FORBIDDEN.value());
        }
        if (policeUser.getWard() == null || feedback.getWard() == null || !policeUser.getWard().getId().equals(feedback.getWard().getId())) {
            throw new com.example.smartcity.common.exception.CustomException("Cán bộ công an chỉ có quyền xử lý phản ánh thuộc địa bàn phường quản lý.", org.springframework.http.HttpStatus.FORBIDDEN.value());
        }
    }

    /**
     * Phân tích và gom nhóm các phản ánh trùng lặp bằng AI
     */
    public List<com.example.smartcity.modules.police.dto.AiDeduplicationResponse> analyzeDuplicates(String username) {
        User policeUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user công an: " + username));

        if (policeUser.getWard() == null) {
            return java.util.Collections.emptyList();
        }

        // Lấy danh sách phản ánh đang chờ xử lý của phường
        List<Feedback> feedbacks = feedbackRepository.findByManagedByRoleAndWardId(
                "POLICE", policeUser.getWard().getId(), org.springframework.data.domain.PageRequest.of(0, 50))
                .getContent();

        if (feedbacks.size() < 2) {
            return java.util.Collections.emptyList(); // Không đủ để gom nhóm
        }

        // Chuẩn bị dữ liệu gửi cho AI
        StringBuilder dataBuilder = new StringBuilder();
        for (Feedback f : feedbacks) {
            dataBuilder.append(String.format("ID: %d | Tiêu đề: %s | Địa chỉ: %s | Mô tả: %s\n",
                    f.getId(), f.getTitle(), f.getAddressDetails(), f.getDescription()));
        }

        String systemPrompt = "Bạn là AI phân tích dữ liệu đô thị. Nhiệm vụ của bạn là tìm các phản ánh trùng lặp (miêu tả cùng một sự cố tại cùng một vị trí). " +
                "Chỉ trả về DUY NHẤT một mảng JSON (không có markdown, không giải thích). " +
                "Định dạng JSON yêu cầu: [{\"groupId\": \"Tên nhóm sự cố\", \"feedbackIds\": [danh sách các ID trùng lặp], \"matchScore\": điểm_tương_đồng_từ_0_đến_100, \"reason\": \"Lý do ngắn gọn\"}]";

        try {
            // Lấy provider tốt nhất (VD: userId = 1 để mock)
            com.example.smartcity.ai_orchestrator.adapter.AiProviderAdapter provider = aiRouterService.routeToBestProvider("1", dataBuilder.toString());
            
            // Gọi AI
            String jsonResult = aiRouterService.executeWithFallback(provider, systemPrompt, dataBuilder.toString()).join();
            
            // Làm sạch kết quả (loại bỏ markdown block nếu có)
            jsonResult = jsonResult.replaceAll("```json", "").replaceAll("```", "").trim();

            // Parse JSON thành List DTO
            return objectMapper.readValue(jsonResult, new com.fasterxml.jackson.core.type.TypeReference<List<com.example.smartcity.modules.police.dto.AiDeduplicationResponse>>() {});
        } catch (Exception e) {
            org.slf4j.LoggerFactory.getLogger(PoliceFeedbackService.class).error("Lỗi khi phân tích AI", e);
            // Fallback: Trả về danh sách rỗng nếu AI lỗi để không sập trang
            return java.util.Collections.emptyList();
        }
    }

    private void saveFeedbackLog(Feedback feedback, String username, FeedbackStatus oldStatus, FeedbackStatus newStatus, String note) {
        User actionBy = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user: " + username));
        FeedbackLog log = new FeedbackLog(feedback, actionBy, oldStatus, newStatus, note);
        feedbackLogRepository.save(log);
    }

    private PoliceFeedbackResponse mapToResponse(Feedback feedback) {
        PoliceFeedbackResponse res = new PoliceFeedbackResponse();
        res.setId(feedback.getId());
        res.setTrackingCode(feedback.getTrackingCode());
        res.setTitle(feedback.getTitle());
        res.setDescription(feedback.getDescription());
        res.setLatitude(feedback.getLatitude());
        res.setLongitude(feedback.getLongitude());
        res.setAddressDetails(feedback.getAddressDetails());
        res.setStatus(feedback.getStatus());
        if (feedback.getCategory() != null) {
            res.setCategoryName(feedback.getCategory().getName());
        }
        if (feedback.getCitizen() != null) {
            res.setCitizenId(feedback.getCitizen().getId());
        }
        java.util.List<Attachment> attachments = attachmentRepository.findByFeedbackId(feedback.getId());
        
        res.setMediaUrls(attachments.stream()
                .filter(att -> "IMAGE".equals(att.getFileType()))
                .map(Attachment::getFileUrl)
                .collect(Collectors.toList()));
                
        res.setVideoUrl(attachments.stream()
                .filter(att -> "VIDEO".equals(att.getFileType()))
                .map(Attachment::getFileUrl)
                .findFirst()
                .orElse(null));
                
        res.setCreatedAt(feedback.getCreatedAt());
        res.setUpdatedAt(feedback.getUpdatedAt());
        
        // Extract rejection reason or resolution note from latest logs if needed
        if (feedback.getStatus() == FeedbackStatus.REJECTED) {
            feedbackLogRepository.findByFeedbackIdOrderByCreatedAtDesc(feedback.getId())
                .stream()
                .filter(log -> log.getNewStatus() == FeedbackStatus.REJECTED)
                .findFirst()
                .ifPresent(log -> res.setRejectionReason(log.getNote() != null ? log.getNote().replace("Từ chối/Chuyển tiếp: ", "") : null));
        } else if (feedback.getStatus() == FeedbackStatus.RESOLVED) {
            feedbackLogRepository.findByFeedbackIdOrderByCreatedAtDesc(feedback.getId())
                .stream()
                .filter(log -> log.getNewStatus() == FeedbackStatus.RESOLVED)
                .findFirst()
                .ifPresent(log -> res.setResolutionNote(log.getNote()));
        }
        
        return res;
    }
}
