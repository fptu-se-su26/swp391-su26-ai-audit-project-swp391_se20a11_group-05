package com.example.smartcity.modules.campaign.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class CampaignBatchApproveRequest {

    @NotEmpty(message = "Danh sách ID phê duyệt không được trống")
    private List<Long> participantIds;
}
