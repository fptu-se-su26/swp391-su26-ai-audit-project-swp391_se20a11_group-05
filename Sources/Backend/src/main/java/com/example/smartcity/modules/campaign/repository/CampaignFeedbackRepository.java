package com.example.smartcity.modules.campaign.repository;

import com.example.smartcity.modules.campaign.entity.CampaignFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CampaignFeedbackRepository extends JpaRepository<CampaignFeedback, Long> {
    boolean existsByCampaign_IdAndParticipant_Id(Long campaignId, Long participantId);

    void deleteByCampaign_Id(Long campaignId);
}
