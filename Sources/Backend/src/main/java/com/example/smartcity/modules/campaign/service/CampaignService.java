package com.example.smartcity.modules.campaign.service;

import com.example.smartcity.modules.campaign.dto.CampaignRequest;
import com.example.smartcity.modules.campaign.dto.CampaignResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface CampaignService {

    Page<CampaignResponse> getAll(String status, Pageable pageable);

    CampaignResponse getById(Long id);

    CampaignResponse create(CampaignRequest request, Long createdByUserId);

    CampaignResponse join(Long campaignId, Long citizenId);

    void leave(Long campaignId, Long citizenId);
}
