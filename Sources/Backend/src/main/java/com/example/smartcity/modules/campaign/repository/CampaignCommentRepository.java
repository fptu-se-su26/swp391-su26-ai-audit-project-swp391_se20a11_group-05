package com.example.smartcity.modules.campaign.repository;

import com.example.smartcity.modules.campaign.entity.CampaignComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CampaignCommentRepository extends JpaRepository<CampaignComment, Long> {
    List<CampaignComment> findTop50ByCampaign_IdOrderByCreatedAtDesc(Long campaignId);

    void deleteByCampaign_Id(Long campaignId);
}
