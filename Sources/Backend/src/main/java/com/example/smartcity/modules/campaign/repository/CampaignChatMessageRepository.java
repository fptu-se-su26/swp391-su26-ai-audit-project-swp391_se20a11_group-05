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

    List<CampaignChatMessage> findTop15ByCampaign_IdOrderByCreatedAtDesc(Long campaignId);

    @Query("SELECT m FROM CampaignChatMessage m WHERE m.campaign.id = :campaignId AND m.id < :beforeId ORDER BY m.createdAt DESC")
    List<CampaignChatMessage> findPageBefore(
        @Param("campaignId") Long campaignId,
        @Param("beforeId") Long beforeId,
        org.springframework.data.domain.Pageable pageable
    );

    void deleteByCampaign_Id(Long campaignId);

    @Modifying
    @Query("UPDATE CampaignChatMessage m SET m.pinned = false WHERE m.campaign.id = :campaignId")
    void unpinAllForCampaign(@Param("campaignId") Long campaignId);

    long countByCampaign_IdAndPinnedTrue(Long campaignId);

    List<CampaignChatMessage> findByCampaign_IdAndPinnedTrue(Long campaignId);
}
