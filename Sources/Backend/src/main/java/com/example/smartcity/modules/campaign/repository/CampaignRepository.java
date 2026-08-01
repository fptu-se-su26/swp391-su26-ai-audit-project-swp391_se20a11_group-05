package com.example.smartcity.modules.campaign.repository;

import com.example.smartcity.modules.campaign.entity.Campaign;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface CampaignRepository extends JpaRepository<Campaign, Long> {

    @EntityGraph(attributePaths = {"createdByUser", "ward"})
    Page<Campaign> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @EntityGraph(attributePaths = {"createdByUser", "ward"})
    Page<Campaign> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);

    @EntityGraph(attributePaths = {"createdByUser", "ward"})
    @Query("""
            SELECT c
            FROM Campaign c
            WHERE (:status IS NULL 
               OR (:status = 'RECRUITING' AND c.status = 'RECRUITING' AND (c.startTime IS NULL OR c.startTime > :now) AND (c.endTime IS NULL OR c.endTime >= :now))
               OR (:status = 'IN_PROGRESS' AND c.status <> 'CANCELLED' AND (c.status = 'IN_PROGRESS' OR (c.status = 'RECRUITING' AND c.startTime IS NOT NULL AND c.startTime <= :now)) AND (c.endTime IS NULL OR c.endTime >= :now))
               OR (:status = 'ENDED' AND c.status <> 'CANCELLED' AND (c.status = 'ENDED' OR c.status = 'COMPLETED' OR (c.endTime IS NOT NULL AND c.endTime < :now)))
               OR (:status = 'CANCELLED' AND c.status = 'CANCELLED')
            )
            ORDER BY c.createdAt DESC
            """)
    Page<Campaign> findByOptionalStatus(
            @Param("status") String status,
            @Param("now") java.time.LocalDateTime now,
            Pageable pageable);

    @EntityGraph(attributePaths = {"createdByUser", "ward"})
    @Query("""
            SELECT c
            FROM Campaign c
            WHERE (:status IS NULL 
               OR (:status = 'RECRUITING' AND c.status = 'RECRUITING' AND (c.startTime IS NULL OR c.startTime > :now) AND (c.endTime IS NULL OR c.endTime >= :now))
               OR (:status = 'IN_PROGRESS' AND c.status <> 'CANCELLED' AND (c.status = 'IN_PROGRESS' OR (c.status = 'RECRUITING' AND c.startTime IS NOT NULL AND c.startTime <= :now)) AND (c.endTime IS NULL OR c.endTime >= :now))
               OR (:status = 'ENDED' AND c.status <> 'CANCELLED' AND (c.status = 'ENDED' OR c.status = 'COMPLETED' OR (c.endTime IS NOT NULL AND c.endTime < :now)))
               OR (:status = 'CANCELLED' AND c.status = 'CANCELLED')
            )
            ORDER BY c.createdAt DESC
            """)
    Page<Campaign> findPublicVisibleCampaigns(
            @Param("status") String status,
            @Param("now") java.time.LocalDateTime now,
            Pageable pageable);

    @EntityGraph(attributePaths = {"createdByUser", "ward"})
    @Query("""
            SELECT c
            FROM Campaign c
            WHERE (:status IS NULL 
               OR (:status = 'RECRUITING' AND c.status = 'RECRUITING' AND (c.startTime IS NULL OR c.startTime > :now) AND (c.endTime IS NULL OR c.endTime >= :now))
               OR (:status = 'IN_PROGRESS' AND c.status <> 'CANCELLED' AND (c.status = 'IN_PROGRESS' OR (c.status = 'RECRUITING' AND c.startTime IS NOT NULL AND c.startTime <= :now)) AND (c.endTime IS NULL OR c.endTime >= :now))
               OR (:status = 'ENDED' AND c.status <> 'CANCELLED' AND (c.status = 'ENDED' OR c.status = 'COMPLETED' OR (c.endTime IS NOT NULL AND c.endTime < :now)))
               OR (:status = 'CANCELLED' AND c.status = 'CANCELLED')
            )
            ORDER BY c.createdAt DESC
            """)
    Page<Campaign> findVisibleCampaignsForUser(
            @Param("status") String status,
            @Param("userId") Long userId,
            @Param("now") java.time.LocalDateTime now,
            Pageable pageable);

    @Query("SELECT COUNT(p) FROM CampaignParticipant p WHERE p.campaign.id = :campaignId AND p.joinStatus IN ('APPROVED', 'MAYBE')")
    long countActiveParticipants(@Param("campaignId") Long campaignId);

    java.util.List<Campaign> findByWard_Id(Long wardId);
}

