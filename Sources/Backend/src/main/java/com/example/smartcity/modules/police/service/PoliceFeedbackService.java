package com.example.smartcity.modules.police.service;

import com.example.smartcity.modules.feedback.entity.Feedback;
import com.example.smartcity.modules.feedback.entity.FeedbackLog;
import com.example.smartcity.modules.feedback.entity.FeedbackStatus;
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

    /**
     * Lấy danh sách phản ánh được phân công cho cán bộ công an
     */
    public List<PoliceFeedbackResponse> getAssignedFeedbacks(Long policeUserId) {
        return feedbackRepository.findByAssignee_Id(policeUserId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Lấy danh sách điểm nóng (Hotspots) cho Bản đồ Nhiệt (Heatmap)
     */
    public List<HotspotResponse> getHotspots() {
        // Trong thực tế sẽ filter theo ngày tháng, khu vực. Ở đây lấy tất cả feedback có tọa độ
        return feedbackRepository.findAll().stream()
                .filter(f -> f.getLatitude() != null && f.getLongitude() != null)
                .map(f -> {
                    // Đánh trọng số: Việc khẩn cấp/chưa xử lý = 3, Đang xử lý = 2, Đã xong/Từ chối = 1
                    int weight = 1;
                    if (f.getStatus() == FeedbackStatus.PENDING || f.getStatus() == FeedbackStatus.ASSIGNED) weight = 3;
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
    public PoliceFeedbackResponse acceptFeedback(Long feedbackId, Long policeUserId) {
        Feedback feedback = getFeedback(feedbackId);
        
        // Kiểm tra quyền (chỉ người được phân công mới được tiếp nhận)
        if (feedback.getAssignee() == null || !feedback.getAssignee().getId().equals(policeUserId)) {
            throw new RuntimeException("Bạn không có quyền tiếp nhận phản ánh này");
        }

        if (feedback.getStatus() != FeedbackStatus.PENDING) {
            throw new RuntimeException("Chỉ có thể tiếp nhận phản ánh đang ở trạng thái ASSIGNED");
        }

        FeedbackStatus oldStatus = feedback.getStatus();
        feedback.setStatus(FeedbackStatus.IN_PROGRESS);
        feedback.setUpdatedAt(LocalDateTime.now());
        
        Feedback updated = feedbackRepository.save(feedback);
        
        // Lưu lịch sử
        saveFeedbackLog(updated, policeUserId, oldStatus, FeedbackStatus.IN_PROGRESS, "Cán bộ công an đã tiếp nhận phản ánh");
        
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
    public PoliceFeedbackResponse updateStatus(Long feedbackId, Long policeUserId, UpdateFeedbackStatusRequest request) {
        Feedback feedback = getFeedback(feedbackId);
        
        if (feedback.getAssignee() == null || !feedback.getAssignee().getId().equals(policeUserId)) {
            throw new RuntimeException("Bạn không có quyền cập nhật phản ánh này");
        }

        FeedbackStatus oldStatus = feedback.getStatus();
        feedback.setStatus(request.getStatus());
        feedback.setUpdatedAt(LocalDateTime.now());
        
        Feedback updated = feedbackRepository.save(feedback);
        
        saveFeedbackLog(updated, policeUserId, oldStatus, request.getStatus(), request.getNote());
        
        return mapToResponse(updated);
    }

    /**
     * Báo cáo kết quả xử lý cuối cùng (RESOLVED)
     */
    @Transactional
    public PoliceFeedbackResponse submitResult(Long feedbackId, Long policeUserId, SubmitFeedbackResultRequest request) {
        Feedback feedback = getFeedback(feedbackId);
        
        if (feedback.getAssignee() == null || !feedback.getAssignee().getId().equals(policeUserId)) {
            throw new RuntimeException("Bạn không có quyền xử lý phản ánh này");
        }

        FeedbackStatus oldStatus = feedback.getStatus();
        feedback.setStatus(FeedbackStatus.RESOLVED);
        // Tạm thời nối kết quả vào description, sau này kết nối bảng FeedbackMedia/FeedbackResult
        feedback.setDescription(feedback.getDescription() + "\n\n[KẾT QUẢ XỬ LÝ]: " + request.getResultNote());
        feedback.setUpdatedAt(LocalDateTime.now());
        
        Feedback updated = feedbackRepository.save(feedback);
        
        saveFeedbackLog(updated, policeUserId, oldStatus, FeedbackStatus.RESOLVED, request.getResultNote());
        
        return mapToResponse(updated);
    }

    /**
     * Từ chối hoặc yêu cầu chuyển tiếp phản ánh
     */
    @Transactional
    public PoliceFeedbackResponse rejectFeedback(Long feedbackId, Long policeUserId, RejectFeedbackRequest request) {
        Feedback feedback = getFeedback(feedbackId);
        
        if (feedback.getAssignee() == null || !feedback.getAssignee().getId().equals(policeUserId)) {
            throw new RuntimeException("Bạn không có quyền thực hiện trên phản ánh này");
        }

        FeedbackStatus oldStatus = feedback.getStatus();
        feedback.setStatus(FeedbackStatus.REJECTED);
        feedback.setUpdatedAt(LocalDateTime.now());
        
        Feedback updated = feedbackRepository.save(feedback);
        
        saveFeedbackLog(updated, policeUserId, oldStatus, FeedbackStatus.REJECTED, "Từ chối/Chuyển tiếp: " + request.getReason());
        
        return mapToResponse(updated);
    }

    /**
     * Yêu cầu bổ sung thông tin
     */
    @Transactional
    public PoliceFeedbackResponse requestMoreInfo(Long feedbackId, Long policeUserId, RequestMoreInfoRequest request) {
        Feedback feedback = getFeedback(feedbackId);
        
        if (feedback.getAssignee() == null || !feedback.getAssignee().getId().equals(policeUserId)) {
            throw new RuntimeException("Bạn không có quyền thực hiện trên phản ánh này");
        }

        FeedbackStatus oldStatus = feedback.getStatus();
        feedback.setStatus(FeedbackStatus.WAITING_INFO);
        feedback.setUpdatedAt(LocalDateTime.now());
        
        Feedback updated = feedbackRepository.save(feedback);
        
        saveFeedbackLog(updated, policeUserId, oldStatus, FeedbackStatus.WAITING_INFO, "Yêu cầu bổ sung thông tin: " + request.getReason());
        
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

    private void saveFeedbackLog(Feedback feedback, Long actionById, FeedbackStatus oldStatus, FeedbackStatus newStatus, String note) {
        User actionBy = userRepository.findById(actionById)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user"));
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
        res.setCreatedAt(feedback.getCreatedAt());
        res.setUpdatedAt(feedback.getUpdatedAt());
        return res;
    }
}
