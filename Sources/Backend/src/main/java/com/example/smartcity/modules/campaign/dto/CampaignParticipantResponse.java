package com.example.smartcity.modules.campaign.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class CampaignParticipantResponse {
    private Long id;
    private Long campaignId;
    private Long citizenId;
    private String citizenName;
    private String joinStatus;
    private String volunteerExperience;
    private String availabilityHours;
    private String cancellationReason;
    private LocalDateTime confirmationDeadline;
    private int pastCampaignCount;
    private double averageRating;
    private int noShowCount;
    private LocalDateTime createdAt;
    private LocalDateTime approvedAt;
    private LocalDateTime rejectedAt;
    private String rejectionReason;
    private LocalDateTime confirmedAt;
}
