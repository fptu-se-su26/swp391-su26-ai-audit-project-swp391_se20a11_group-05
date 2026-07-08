package com.example.smartcity.modules.campaign.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;
import java.util.List;

@Data
public class CampaignMessageRequest {
    @Size(max = 2000, message = "Nội dung tối đa 2000 ký tự")
    private String content;

    private List<String> imageUrls;
}

