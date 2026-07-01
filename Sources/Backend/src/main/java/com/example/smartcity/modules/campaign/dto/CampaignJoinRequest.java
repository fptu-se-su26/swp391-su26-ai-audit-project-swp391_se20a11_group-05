package com.example.smartcity.modules.campaign.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CampaignJoinRequest {

    private String volunteerExperience;

    private String availabilityHours;

    @NotBlank(message = "Mã xác thực OTP là bắt buộc")
    private String otpCode;
}
