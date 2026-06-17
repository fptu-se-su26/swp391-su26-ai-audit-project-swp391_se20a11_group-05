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

    @Query("SELECT COUNT(p) FROM CampaignParticipant p WHERE p.campaign.id = :campaignId AND p.joinStatus = 'SURE'")
    long countActiveParticipants(@Param("campaignId") Long campaignId);
}
