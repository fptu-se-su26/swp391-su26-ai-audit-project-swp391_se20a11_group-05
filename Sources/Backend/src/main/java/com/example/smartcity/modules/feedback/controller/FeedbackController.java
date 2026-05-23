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

    // Ghi đè hoặc thêm mới API đặc thù nghiệp vụ (VD: Lấy theo username)
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
}




