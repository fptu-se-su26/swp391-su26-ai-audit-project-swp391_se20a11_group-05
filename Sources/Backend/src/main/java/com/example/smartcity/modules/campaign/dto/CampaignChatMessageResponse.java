package com.example.smartcity.modules.campaign.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class CampaignChatMessageResponse {
    private Long id;
    private Long senderId;
    private String senderName;
    private String senderRole;
    private String message;
    private List<String> imageUrls;
    private boolean pinned;

    private LocalDateTime createdAt;

    private String senderAvatar;
    private Integer pastCampaignCount;
}
