package com.example.smartcity.modules.feedback.controller;

import com.example.smartcity.modules.feedback.dto.CitizenFeedbackMediaRequest;
import com.example.smartcity.modules.feedback.dto.CitizenFeedbackMediaResponse;
import com.example.smartcity.modules.feedback.service.CitizenFeedbackMediaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/citizen-feedback-media")
@RequiredArgsConstructor
public class CitizenFeedbackMediaController {
    private final CitizenFeedbackMediaService citizenFeedbackMediaService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<CitizenFeedbackMediaResponse> submit(
            @Valid @RequestPart("data") CitizenFeedbackMediaRequest request,
            @RequestPart("files") List<MultipartFile> files
    ) {
        return ResponseEntity.ok(citizenFeedbackMediaService.submit(request, files));
    }
}
