package com.example.smartcity.modules.feedback.dto;

import com.example.smartcity.modules.feedback.entity.FeedbackStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CitizenFeedbackMediaResponse {
    private Long id;
    private String trackingCode;
    private String title;
    private String description;
    private Double latitude;
    private Double longitude;
    private String addressDetails;
    private FeedbackStatus status;
    private String categoryName;
    private String citizenName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<FeedbackAttachmentResponse> attachments;
}
