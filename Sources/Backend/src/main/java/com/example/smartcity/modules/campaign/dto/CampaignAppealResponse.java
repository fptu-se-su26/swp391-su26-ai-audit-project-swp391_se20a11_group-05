package com.example.smartcity.modules.campaign.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CampaignAppealResponse {
    private Long id;
    private Long citizenId;
    private String citizenName;
    private String citizenPhone;
    private String reason;
    private String status;
    private Long reviewedById;
    private String reviewedByName;
    private String reviewNotes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
