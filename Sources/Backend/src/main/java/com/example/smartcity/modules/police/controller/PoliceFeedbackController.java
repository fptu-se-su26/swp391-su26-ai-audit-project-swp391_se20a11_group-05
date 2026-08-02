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
import org.springframework.security.core.Authentication;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

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
    public ResponseEntity<ApiResponse<List<PoliceFeedbackResponse>>> getAssignedFeedbacks(Authentication authentication) { 
        List<PoliceFeedbackResponse> feedbacks = feedbackService.getAssignedFeedbacks(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách phản ánh thành công", feedbacks));
    }

    /**
     * GET /api/police/feedbacks/hotspots - Lấy dữ liệu điểm nóng cho bản đồ nhiệt
     */
    @GetMapping("/hotspots")
    public ResponseEntity<ApiResponse<List<HotspotResponse>>> getHotspots(
            Authentication authentication,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year) {
        List<HotspotResponse> hotspots = feedbackService.getHotspots(authentication.getName(), month, year);
        return ResponseEntity.ok(ApiResponse.success("Lấy dữ liệu điểm nóng thành công", hotspots));
    }

    /**
     * PATCH /api/police/feedbacks/{id}/accept - Tiếp nhận phản ánh
     */
    @PatchMapping("/{id}/accept")
    public ResponseEntity<ApiResponse<PoliceFeedbackResponse>> acceptFeedback(
            @PathVariable Long id,
            Authentication authentication) {
        PoliceFeedbackResponse res = feedbackService.acceptFeedback(id, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Đã tiếp nhận phản ánh", res));
    }

    /**
     * PATCH /api/police/feedbacks/{id}/status - Cập nhật trạng thái
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<PoliceFeedbackResponse>> updateStatus(
            @PathVariable Long id,
            Authentication authentication,
            @Valid @RequestBody UpdateFeedbackStatusRequest request) {
        PoliceFeedbackResponse res = feedbackService.updateStatus(id, authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái thành công", res));
    }

    /**
     * POST /api/police/feedbacks/{id}/result - Báo cáo kết quả xử lý
     */
    @PostMapping("/{id}/result")
    public ResponseEntity<ApiResponse<PoliceFeedbackResponse>> submitResult(
            @PathVariable Long id,
            Authentication authentication,
            @Valid @RequestBody SubmitFeedbackResultRequest request) {
        PoliceFeedbackResponse res = feedbackService.submitResult(id, authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.success("Báo cáo kết quả xử lý thành công", res));
    }

    /**
     * PATCH /api/police/feedbacks/{id}/reject - Từ chối / Chuyển tiếp phản ánh
     */
    @PatchMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<PoliceFeedbackResponse>> rejectFeedback(
            @PathVariable Long id,
            Authentication authentication,
            @Valid @RequestBody RejectFeedbackRequest request) {
        PoliceFeedbackResponse res = feedbackService.rejectFeedback(id, authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.success("Đã từ chối/yêu cầu chuyển tiếp phản ánh", res));
    }

    /**
     * PATCH /api/police/feedbacks/{id}/request-info - Yêu cầu bổ sung thông tin
     */
    @PatchMapping("/{id}/request-info")
    public ResponseEntity<ApiResponse<PoliceFeedbackResponse>> requestMoreInfo(
            @PathVariable Long id,
            Authentication authentication,
            @Valid @RequestBody RequestMoreInfoRequest request) {
        PoliceFeedbackResponse res = feedbackService.requestMoreInfo(id, authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.success("Đã yêu cầu người dân bổ sung thông tin", res));
    }
    /**
     * GET /api/police/feedbacks/analyze-duplicates - Sử dụng AI để phân tích và gom nhóm các phản ánh trùng lặp
     */
    @GetMapping("/analyze-duplicates")
    public ResponseEntity<ApiResponse<List<com.example.smartcity.modules.police.dto.AiDeduplicationResponse>>> analyzeDuplicates(
            Authentication authentication,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year) {
        
        // Mặc định là tháng hiện tại nếu không truyền
        int m = month != null ? month : java.time.LocalDate.now().getMonthValue();
        int y = year != null ? year : java.time.LocalDate.now().getYear();

        List<com.example.smartcity.modules.police.dto.AiDeduplicationResponse> res = feedbackService.analyzeDuplicates(authentication.getName(), m, y);
        return ResponseEntity.ok(ApiResponse.success("Phân tích trùng lặp bằng AI thành công", res));
    }
}
