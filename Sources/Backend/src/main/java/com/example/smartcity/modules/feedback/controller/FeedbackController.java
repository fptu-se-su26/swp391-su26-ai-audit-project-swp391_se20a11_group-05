package com.example.smartcity.modules.feedback.controller;

import com.example.smartcity.modules.feedback.dto.FeedbackRequest;
import com.example.smartcity.modules.feedback.dto.FeedbackResponse;
import com.example.smartcity.modules.feedback.service.FeedbackService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/feedbacks")
@RequiredArgsConstructor
public class FeedbackController {

    private final FeedbackService feedbackService;

    @GetMapping
    public ResponseEntity<List<FeedbackResponse>> getAllFeedbacks() {
        return ResponseEntity.ok(feedbackService.getAllFeedbacks());
    }

    @PostMapping
    public ResponseEntity<FeedbackResponse> createFeedback(@RequestBody FeedbackRequest request) {
        FeedbackResponse created = feedbackService.createFeedback(request);
        return ResponseEntity.ok(created);
    }
}




