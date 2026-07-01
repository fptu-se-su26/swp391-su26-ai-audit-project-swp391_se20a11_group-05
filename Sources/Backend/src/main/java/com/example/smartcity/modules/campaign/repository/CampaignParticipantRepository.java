package com.example.smartcity.modules.campaign.repository;

import com.example.smartcity.modules.campaign.entity.CampaignParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CampaignParticipantRepository extends JpaRepository<CampaignParticipant, Long> {

    Optional<CampaignParticipant> findByCampaign_IdAndCitizen_Id(Long campaignId, Long citizenId);

    boolean existsByCampaign_IdAndCitizen_IdAndJoinStatus(Long campaignId, Long citizenId, String joinStatus);

    long countByCampaign_IdAndJoinStatus(Long campaignId, String joinStatus);

    long countByCitizen_IdAndJoinStatus(Long citizenId, String joinStatus);

    java.util.Optional<CampaignParticipant> findFirstByCampaign_IdAndJoinStatusOrderByCreatedAtAsc(Long campaignId, String joinStatus);

    java.util.List<CampaignParticipant> findByJoinStatusAndConfirmationDeadlineBefore(String joinStatus, java.time.LocalDateTime now);

    List<CampaignParticipant> findByCampaign_IdOrderByCreatedAtDesc(Long campaignId);

    void deleteByCampaign_Id(Long campaignId);
}
