package com.example.smartcity.modules.campaign.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CampaignFeedbackRequest {
    @Min(1)
    @Max(5)
    private Integer rating;

    @NotBlank(message = "Nội dung đánh giá không được để trống")
    @Size(max = 2000, message = "Nội dung đánh giá tối đa 2000 ký tự")
    private String content;
}
