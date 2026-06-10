package com.example.smartcity.modules.police.dto;

import com.example.smartcity.modules.feedback.entity.FeedbackStatus;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class PoliceFeedbackResponse {
    private Long id;
    private String trackingCode;
    private String title;
    private String description;
    private Double latitude;
    private Double longitude;
    private String addressDetails;
    private FeedbackStatus status;
    private String categoryName;
    private Long citizenId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
