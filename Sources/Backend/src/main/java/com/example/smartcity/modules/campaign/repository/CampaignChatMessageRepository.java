package com.example.smartcity.modules.campaign.repository;

import com.example.smartcity.modules.campaign.entity.CampaignChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

@Repository
public interface CampaignChatMessageRepository extends JpaRepository<CampaignChatMessage, Long> {
    List<CampaignChatMessage> findTop50ByCampaign_IdOrderByCreatedAtDesc(Long campaignId);

    void deleteByCampaign_Id(Long campaignId);

    @Modifying
    @Query("UPDATE CampaignChatMessage m SET m.pinned = false WHERE m.campaign.id = :campaignId")
    void unpinAllForCampaign(@Param("campaignId") Long campaignId);
}
