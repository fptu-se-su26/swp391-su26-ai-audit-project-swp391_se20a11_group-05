package com.example.smartcity.modules.feedback.controller;

import com.example.smartcity.modules.feedback.dto.CitizenFeedbackMediaRequest;
import com.example.smartcity.modules.feedback.dto.CitizenFeedbackMediaResponse;
import com.example.smartcity.modules.feedback.dto.FeedbackRequest;
import com.example.smartcity.modules.feedback.dto.FeedbackResponse;
import com.example.smartcity.modules.feedback.service.CitizenFeedbackMediaService;
import com.example.smartcity.modules.feedback.service.FeedbackService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/feedbacks")
@RequiredArgsConstructor
public class FeedbackController {

    private final FeedbackService feedbackService;
    private final CitizenFeedbackMediaService citizenFeedbackMediaService;

    @GetMapping
    public ResponseEntity<List<FeedbackResponse>> getAllFeedbacks() {
        return ResponseEntity.ok(feedbackService.getAllFeedbacks());
    }

    @PostMapping
    public ResponseEntity<FeedbackResponse> createFeedback(@RequestBody FeedbackRequest request) {
        FeedbackResponse created = feedbackService.createFeedback(request);
        return ResponseEntity.ok(created);
    }

    @PostMapping(value = "/media", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<CitizenFeedbackMediaResponse> createFeedbackWithMedia(
            @RequestPart("data") CitizenFeedbackMediaRequest request,
            @RequestPart("files") List<MultipartFile> files
    ) {
        return ResponseEntity.ok(citizenFeedbackMediaService.submit(request, files));
    }
}




