package com.example.smartcity.modules.campaign.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class CampaignFeedbackResponse {
    private Long id;
    private Long campaignId;
    private Long participantId;
    private Integer rating;
    private String content;
    private LocalDateTime createdAt;
}
