package com.example.smartcity.modules.campaign.repository;

import com.example.smartcity.modules.campaign.entity.CampaignAppeal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface CampaignAppealRepository extends JpaRepository<CampaignAppeal, Long> {

    boolean existsByCitizenIdAndStatus(Long citizenId, String status);

    Optional<CampaignAppeal> findFirstByCitizenIdOrderByCreatedAtDesc(Long citizenId);

    List<CampaignAppeal> findByStatusOrderByCreatedAtDesc(String status);

    List<CampaignAppeal> findByStatusAndCitizen_Ward_IdOrderByCreatedAtDesc(String status, Long wardId);

    @Query("SELECT a FROM CampaignAppeal a WHERE a.status = :status AND (a.citizen.ward.id = :wardId OR a.citizen.ward.id IS NULL) ORDER BY a.createdAt DESC")
    List<CampaignAppeal> findPendingAppealsForWard(@Param("status") String status, @Param("wardId") Long wardId);
}
