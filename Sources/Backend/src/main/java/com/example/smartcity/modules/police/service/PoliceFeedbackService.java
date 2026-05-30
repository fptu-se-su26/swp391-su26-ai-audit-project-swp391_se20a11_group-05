package com.example.smartcity.modules.police.service;

import com.example.smartcity.modules.feedback.entity.Feedback;
import com.example.smartcity.modules.feedback.entity.FeedbackLog;
import com.example.smartcity.modules.feedback.entity.FeedbackStatus;
import com.example.smartcity.modules.feedback.repository.FeedbackLogRepository;
import com.example.smartcity.modules.feedback.repository.FeedbackRepository;
import com.example.smartcity.modules.police.dto.PoliceFeedbackResponse;
import com.example.smartcity.modules.police.dto.SubmitFeedbackResultRequest;
import com.example.smartcity.modules.police.dto.UpdateFeedbackStatusRequest;
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

    /**
     * Lấy danh sách phản ánh được phân công cho cán bộ công an
     */
    public List<PoliceFeedbackResponse> getAssignedFeedbacks(Long policeUserId) {
        return feedbackRepository.findByAssignee_Id(policeUserId).stream()
                .map(this::mapToResponse)
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

        if (feedback.getStatus() != FeedbackStatus.ASSIGNED) {
            throw new RuntimeException("Chỉ có thể tiếp nhận phản ánh đang ở trạng thái ASSIGNED");
        }

        FeedbackStatus oldStatus = feedback.getStatus();
        feedback.setStatus(FeedbackStatus.IN_PROGRESS);
        feedback.setUpdatedAt(LocalDateTime.now());
        
        Feedback updated = feedbackRepository.save(feedback);
        
        // Lưu lịch sử
        saveFeedbackLog(updated, policeUserId, oldStatus, FeedbackStatus.IN_PROGRESS, "Cán bộ công an đã tiếp nhận phản ánh");
        
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
