package com.example.smartcity.modules.campaign.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CampaignRequest {

    @NotBlank(message = "Tên chiến dịch không được để trống")
    @Size(max = 255, message = "Tên chiến dịch tối đa 255 ký tự")
    private String title;

    private String description;

    private String locationText;

    private Double latitude;

    private Double longitude;

    private Integer maxParticipants;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private Long wardId;
}
