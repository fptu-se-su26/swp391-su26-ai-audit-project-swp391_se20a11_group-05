package com.example.smartcity.modules.campaign.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CampaignAppealRequest {
    @NotBlank(message = "Lý do xin mở khóa không được để trống")
    @Size(max = 1000, message = "Lý do không được dài quá 1000 ký tự")
    private String reason;
}
