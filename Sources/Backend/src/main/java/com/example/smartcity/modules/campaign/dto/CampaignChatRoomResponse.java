package com.example.smartcity.modules.campaign.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CampaignChatRoomResponse {
    private Long campaignId;
    private String campaignTitle;
    private String coverImageUrl;
    private String status;
    private CampaignChatMessageResponse lastMessage;
}
