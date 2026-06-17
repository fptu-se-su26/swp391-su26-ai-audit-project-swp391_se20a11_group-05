package com.example.smartcity.modules.campaign.repository;

import com.example.smartcity.modules.campaign.entity.Campaign;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface CampaignRepository extends JpaRepository<Campaign, Long> {

    Page<Campaign> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<Campaign> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);

    @Query("""
            SELECT c
            FROM Campaign c
            WHERE (:status IS NULL OR c.status = :status)
            ORDER BY c.createdAt DESC
            """)
    Page<Campaign> findByOptionalStatus(
            @Param("status") String status,
            Pageable pageable);

    @Query("""
            SELECT c
            FROM Campaign c
            WHERE (:status IS NULL OR c.status = :status)
              AND c.status <> 'PENDING_APPROVAL'
            ORDER BY c.createdAt DESC
            """)
    Page<Campaign> findPublicVisibleCampaigns(
            @Param("status") String status,
            Pageable pageable);

    @Query("""
            SELECT c
            FROM Campaign c
            WHERE (:status IS NULL OR c.status = :status)
              AND (
                   c.status <> 'PENDING_APPROVAL'
                   OR c.createdByUser.id = :userId
              )
            ORDER BY c.createdAt DESC
            """)
    Page<Campaign> findVisibleCampaignsForUser(
            @Param("status") String status,
            @Param("userId") Long userId,
            Pageable pageable);

    @Query("SELECT COUNT(p) FROM CampaignParticipant p WHERE p.campaign.id = :campaignId AND p.joinStatus = 'APPROVED'")
    long countActiveParticipants(@Param("campaignId") Long campaignId);
}
