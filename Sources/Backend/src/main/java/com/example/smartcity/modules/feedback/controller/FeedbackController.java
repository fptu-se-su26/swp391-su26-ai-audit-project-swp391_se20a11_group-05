package com.example.smartcity.modules.feedback.controller;

import com.example.smartcity.modules.feedback.dto.FeedbackRequest;
import com.example.smartcity.modules.feedback.dto.FeedbackResponse;
import com.example.smartcity.modules.feedback.service.FeedbackService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.example.smartcity.common.base.BaseGenericController;
import com.example.smartcity.common.base.BaseMapper;
import com.example.smartcity.common.base.BaseService;
import com.example.smartcity.modules.feedback.entity.Feedback;
import com.example.smartcity.modules.feedback.mapper.FeedbackMapper;
import com.example.smartcity.modules.feedback.dto.StatusChangeRequest;
import com.example.smartcity.modules.feedback.dto.AssignRequest;
import com.example.smartcity.modules.feedback.dto.FeedbackLogResponse;

import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import com.example.smartcity.common.exception.CustomException;
@RestController
@RequestMapping("/api/feedbacks")
@RequiredArgsConstructor
public class FeedbackController extends BaseGenericController<Feedback, FeedbackResponse, Long> {

    private final FeedbackService feedbackService;
    private final FeedbackMapper feedbackMapper;

    @Override
    protected BaseService<Feedback, Long> getService() {
        return feedbackService;
    }

    @Override
    protected BaseMapper<Feedback, FeedbackResponse> getMapper() {
        return feedbackMapper;
    }

    // ═══ Security Fix: Override Base Endpoints to prevent IDOR ════

    @Override
    @GetMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<FeedbackResponse>> getAll() {
        return super.getAll();
    }

    @Override
    @GetMapping("/page")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Page<FeedbackResponse>> getAllPaged(Pageable pageable) {
        return super.getAllPaged(pageable);
    }

    @Override
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        return super.delete(id);
    }

    @Override
    @PostMapping
    public ResponseEntity<FeedbackResponse> create(@RequestBody FeedbackResponse dto) {
        throw new CustomException("Vui lòng sử dụng endpoint /submit để tạo phản ánh", 405);
    }

    @Override
    @PutMapping("/{id}")
    public ResponseEntity<FeedbackResponse> update(@PathVariable Long id, @RequestBody FeedbackResponse dto) {
        throw new CustomException("Không hỗ trợ cập nhật toàn bộ phản ánh", 405);
    }

    @Override
    @GetMapping("/{id}")
    public ResponseEntity<FeedbackResponse> getById(@PathVariable Long id) {
        Feedback feedback = feedbackService.findById(id);
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && !feedbackService.canAccessFeedback(feedback, auth.getName())) {
            throw new CustomException("Bạn không có quyền xem phản ánh này", 403);
        }
        return super.getById(id);
    }

    @GetMapping("/my-feedbacks")
    public ResponseEntity<Page<FeedbackResponse>> getAllFeedbacks(
            Authentication authentication,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        String username = authentication.getName();
        Page<Feedback> entities = feedbackService.getAllFeedbacks(username, pageable);
        return ResponseEntity.ok(entities.map(feedbackMapper::toDto));
    }

    @PostMapping("/submit")
    public ResponseEntity<FeedbackResponse> createFeedback(
            @Valid @RequestBody FeedbackRequest request,
            Authentication authentication) {
        String username = authentication.getName();
        Feedback saved = feedbackService.createFeedback(request, username);
        return ResponseEntity.ok(feedbackMapper.toDto(saved));
    }

    // ═══ State Machine Endpoints ═════════════════════════════════

    @PatchMapping("/{id}/status")
    public ResponseEntity<FeedbackResponse> changeStatus(
            @PathVariable Long id,
            @Valid @RequestBody StatusChangeRequest request,
            Authentication authentication) {
        Feedback updated = feedbackService.changeStatus(id, request.getStatus(), request.getNote(), authentication.getName());
        return ResponseEntity.ok(feedbackMapper.toDto(updated));
    }

    @PatchMapping("/{id}/assign")
    public ResponseEntity<FeedbackResponse> assignFeedback(
            @PathVariable Long id,
            @Valid @RequestBody AssignRequest request,
            Authentication authentication) {
        Feedback updated = feedbackService.assignFeedback(id, request.getAssigneeId(), authentication.getName());
        return ResponseEntity.ok(feedbackMapper.toDto(updated));
    }

    @GetMapping("/{id}/logs")
    public ResponseEntity<List<FeedbackLogResponse>> getLogs(@PathVariable Long id) {
        return ResponseEntity.ok(feedbackService.getFeedbackLogs(id));
    }
}
