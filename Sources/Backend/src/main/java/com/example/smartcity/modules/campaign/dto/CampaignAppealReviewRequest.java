package com.example.smartcity.modules.campaign.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CampaignAppealReviewRequest {
    @Size(max = 1000, message = "Ghi chú duyệt không được dài quá 1000 ký tự")
    private String notes;
}
