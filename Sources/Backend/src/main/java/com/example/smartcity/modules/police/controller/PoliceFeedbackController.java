package com.example.smartcity.modules.police.controller;

import com.example.smartcity.common.response.ApiResponse;
import com.example.smartcity.modules.police.dto.PoliceFeedbackResponse;
import com.example.smartcity.modules.police.dto.RejectFeedbackRequest;
import com.example.smartcity.modules.police.dto.RequestMoreInfoRequest;
import com.example.smartcity.modules.police.dto.SubmitFeedbackResultRequest;
import com.example.smartcity.modules.police.dto.HotspotResponse;
import com.example.smartcity.modules.police.dto.UpdateFeedbackStatusRequest;
import com.example.smartcity.modules.police.service.PoliceFeedbackService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/police/feedbacks")
@RequiredArgsConstructor
public class PoliceFeedbackController {

    private final PoliceFeedbackService feedbackService;

    // TODO: Khi có module Auth (Người 1), thay thế việc lấy userId từ @RequestParam sang lấy từ SecurityContext
    
    /**
     * GET /api/police/feedbacks - Xem danh sách phản ánh được phân công
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PoliceFeedbackResponse>>> getAssignedFeedbacks(
            @RequestParam(defaultValue = "2") Long policeUserId) { 
        List<PoliceFeedbackResponse> feedbacks = feedbackService.getAssignedFeedbacks(policeUserId);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách phản ánh thành công", feedbacks));
    }

    /**
     * GET /api/police/feedbacks/hotspots - Lấy dữ liệu điểm nóng cho bản đồ nhiệt
     */
    @GetMapping("/hotspots")
    public ResponseEntity<ApiResponse<List<HotspotResponse>>> getHotspots() {
        List<HotspotResponse> hotspots = feedbackService.getHotspots();
        return ResponseEntity.ok(ApiResponse.success("Lấy dữ liệu điểm nóng thành công", hotspots));
    }

    /**
     * PATCH /api/police/feedbacks/{id}/accept - Tiếp nhận phản ánh
     */
    @PatchMapping("/{id}/accept")
    public ResponseEntity<ApiResponse<PoliceFeedbackResponse>> acceptFeedback(
            @PathVariable Long id,
            @RequestParam(defaultValue = "2") Long policeUserId) {
        PoliceFeedbackResponse res = feedbackService.acceptFeedback(id, policeUserId);
        return ResponseEntity.ok(ApiResponse.success("Đã tiếp nhận phản ánh", res));
    }

    /**
     * PATCH /api/police/feedbacks/{id}/status - Cập nhật trạng thái
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<PoliceFeedbackResponse>> updateStatus(
            @PathVariable Long id,
            @RequestParam(defaultValue = "2") Long policeUserId,
            @Valid @RequestBody UpdateFeedbackStatusRequest request) {
        PoliceFeedbackResponse res = feedbackService.updateStatus(id, policeUserId, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái thành công", res));
    }

    /**
     * POST /api/police/feedbacks/{id}/result - Báo cáo kết quả xử lý
     */
    @PostMapping("/{id}/result")
    public ResponseEntity<ApiResponse<PoliceFeedbackResponse>> submitResult(
            @PathVariable Long id,
            @RequestParam(defaultValue = "2") Long policeUserId,
            @Valid @RequestBody SubmitFeedbackResultRequest request) {
        PoliceFeedbackResponse res = feedbackService.submitResult(id, policeUserId, request);
        return ResponseEntity.ok(ApiResponse.success("Báo cáo kết quả xử lý thành công", res));
    }

    /**
     * PATCH /api/police/feedbacks/{id}/reject - Từ chối / Chuyển tiếp phản ánh
     */
    @PatchMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<PoliceFeedbackResponse>> rejectFeedback(
            @PathVariable Long id,
            @RequestParam(defaultValue = "2") Long policeUserId,
            @Valid @RequestBody RejectFeedbackRequest request) {
        PoliceFeedbackResponse res = feedbackService.rejectFeedback(id, policeUserId, request);
        return ResponseEntity.ok(ApiResponse.success("Đã từ chối/yêu cầu chuyển tiếp phản ánh", res));
    }

    /**
     * PATCH /api/police/feedbacks/{id}/request-info - Yêu cầu bổ sung thông tin
     */
    @PatchMapping("/{id}/request-info")
    public ResponseEntity<ApiResponse<PoliceFeedbackResponse>> requestMoreInfo(
            @PathVariable Long id,
            @RequestParam(defaultValue = "2") Long policeUserId,
            @Valid @RequestBody RequestMoreInfoRequest request) {
        PoliceFeedbackResponse res = feedbackService.requestMoreInfo(id, policeUserId, request);
        return ResponseEntity.ok(ApiResponse.success("Đã yêu cầu người dân bổ sung thông tin", res));
    }
}
