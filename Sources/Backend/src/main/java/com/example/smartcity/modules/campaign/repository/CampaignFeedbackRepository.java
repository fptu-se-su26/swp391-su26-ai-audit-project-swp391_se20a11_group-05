package com.example.smartcity.modules.campaign.repository;

import com.example.smartcity.modules.campaign.entity.CampaignFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CampaignFeedbackRepository extends JpaRepository<CampaignFeedback, Long> {
    boolean existsByCampaign_IdAndParticipant_Id(Long campaignId, Long participantId);

    void deleteByCampaign_Id(Long campaignId);

    @org.springframework.data.jpa.repository.Query("SELECT AVG(f.rating) FROM CampaignFeedback f WHERE f.participant.citizen.id = :citizenId")
    Double getAverageRatingForCitizen(@org.springframework.data.repository.query.Param("citizenId") Long citizenId);
}
