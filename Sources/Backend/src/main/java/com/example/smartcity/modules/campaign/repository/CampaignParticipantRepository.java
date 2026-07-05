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

    long countByCampaign_IdAndJoinStatusIn(Long campaignId, java.util.List<String> statuses);

    java.util.List<CampaignParticipant> findByCampaign_IdAndJoinStatusIn(Long campaignId, java.util.List<String> statuses);

    long countByCampaign_Id(Long campaignId);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(p) > 0 FROM CampaignParticipant p " +
            "WHERE p.citizen.id = :citizenId AND p.campaign.ward.id = :wardId")
    boolean existsByCitizenIdAndWardId(
            @org.springframework.data.repository.query.Param("citizenId") Long citizenId,
            @org.springframework.data.repository.query.Param("wardId") Long wardId);
}

