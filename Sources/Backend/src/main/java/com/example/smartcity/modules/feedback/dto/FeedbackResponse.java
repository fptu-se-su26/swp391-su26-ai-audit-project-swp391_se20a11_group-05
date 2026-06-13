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
public class FeedbackResponse {
    private Long id;
    private String trackingCode;
    private String code;
    private String title;
    private String description;
    private String content;
    private Double latitude;
    private Double longitude;
    private String addressDetails;
    private String address;
    private FeedbackStatus status;
    private String categoryName;
    private String category;
    private String wardName;
    private String citizenName;
    private String assigneeName;
    private String assignedAuthorityName;
    private String rejectionReason;
    private String resultContent;
    private List<FeedbackAttachmentResponse> attachments;
    private List<String> mediaUrls;
    private List<FeedbackLogResponse> timeline;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}




