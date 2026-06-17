package com.example.smartcity.modules.campaign.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class CampaignResponse {

    private Long id;
    private String title;
    private String description;
    private String locationText;
    private Double latitude;
    private Double longitude;
    private Integer maxParticipants;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String status;

    private Long wardId;
    private String wardName;

    private Long createdByUserId;
    private String createdByName;

    private long participantCount;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
