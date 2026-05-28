package com.example.smartcity.modules.feedback.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackAttachmentResponse {
    private Long id;
    private String fileUrl;
    private String fileType;
    private LocalDateTime uploadedAt;
}
