package com.example.smartcity.modules.campaign.repository;

import com.example.smartcity.modules.campaign.entity.CampaignParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CampaignParticipantRepository extends JpaRepository<CampaignParticipant, Long> {

    interface CampaignParticipantCount {
        Long getCampaignId();
        Long getParticipantCount();
    }

    Optional<CampaignParticipant> findByCampaign_IdAndCitizen_Id(Long campaignId, Long citizenId);

    List<CampaignParticipant> findByCampaign_IdInAndCitizen_Id(List<Long> campaignIds, Long citizenId);

    boolean existsByCampaign_IdAndCitizen_IdAndJoinStatus(Long campaignId, Long citizenId, String joinStatus);

    long countByCampaign_IdAndJoinStatus(Long campaignId, String joinStatus);

    @Query("""
            SELECT p.campaign.id AS campaignId, COUNT(p) AS participantCount
            FROM CampaignParticipant p
            WHERE p.campaign.id IN :campaignIds
              AND p.joinStatus = :joinStatus
            GROUP BY p.campaign.id
            """)
    List<CampaignParticipantCount> countByCampaignIdsAndJoinStatus(
            @Param("campaignIds") List<Long> campaignIds,
            @Param("joinStatus") String joinStatus);

    long countByCitizen_IdAndJoinStatus(Long citizenId, String joinStatus);

    long countByCitizen_IdAndAttendedTrue(Long citizenId);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(p) FROM CampaignParticipant p WHERE p.citizen.id = :citizenId AND " +
            "((p.joinStatus = 'APPROVED' AND p.attended = false AND p.attendedAt IS NOT NULL) OR p.joinStatus = 'NO_SHOW')")
    long countNoShowCampaigns(@org.springframework.data.repository.query.Param("citizenId") Long citizenId);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(p) FROM CampaignParticipant p WHERE p.citizen.id = :citizenId AND " +
            "((p.joinStatus = 'APPROVED' AND p.attended = false AND p.attendedAt IS NOT NULL AND p.attendedAt > :since) OR " +
            " (p.joinStatus = 'NO_SHOW' AND p.createdAt > :since))")
    long countNoShowCampaignsAfter(@org.springframework.data.repository.query.Param("citizenId") Long citizenId, 
                                   @org.springframework.data.repository.query.Param("since") java.time.LocalDateTime since);

    java.util.Optional<CampaignParticipant> findFirstByCampaign_IdAndJoinStatusOrderByCreatedAtAsc(Long campaignId, String joinStatus);

    java.util.List<CampaignParticipant> findByJoinStatusAndConfirmationDeadlineBefore(String joinStatus, java.time.LocalDateTime now);

    List<CampaignParticipant> findByCampaign_IdOrderByCreatedAtDesc(Long campaignId);

    List<CampaignParticipant> findByCitizen_IdOrderByCampaign_StartTimeDesc(Long citizenId);

    void deleteByCampaign_Id(Long campaignId);

    long countByCampaign_IdAndJoinStatusIn(Long campaignId, java.util.List<String> statuses);

    java.util.List<CampaignParticipant> findByCampaign_IdAndJoinStatusIn(Long campaignId, java.util.List<String> statuses);

    long countByCampaign_Id(Long campaignId);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(p) > 0 FROM CampaignParticipant p " +
            "WHERE p.citizen.id = :citizenId AND p.campaign.ward.id = :wardId")
    boolean existsByCitizenIdAndWardId(
            @org.springframework.data.repository.query.Param("citizenId") Long citizenId,
            @org.springframework.data.repository.query.Param("wardId") Long wardId);

    Optional<CampaignParticipant> findByCampaign_IdAndCitizen_PhoneNumberAndJoinStatus(
            Long campaignId, String phoneNumber, String joinStatus);

    List<CampaignParticipant> findByJoinStatusAndCampaign_StartTimeBefore(
            String joinStatus, java.time.LocalDateTime dateTime);
}

