package com.example.smartcity.modules.campaign.repository;

import com.example.smartcity.modules.campaign.entity.CampaignChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CampaignChatMessageRepository extends JpaRepository<CampaignChatMessage, Long> {
    List<CampaignChatMessage> findTop50ByCampaign_IdOrderByCreatedAtDesc(Long campaignId);
}
