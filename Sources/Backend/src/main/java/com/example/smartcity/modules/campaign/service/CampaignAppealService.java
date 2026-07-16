package com.example.smartcity.modules.campaign.service;

import com.example.smartcity.modules.campaign.dto.CampaignAppealRequest;
import com.example.smartcity.modules.campaign.dto.CampaignAppealReviewRequest;
import com.example.smartcity.modules.campaign.dto.CampaignAppealResponse;
import java.util.List;

public interface CampaignAppealService {

    CampaignAppealResponse submitAppeal(CampaignAppealRequest request, String username);

    CampaignAppealResponse getMyLastAppeal(String username);

    List<CampaignAppealResponse> getPendingAppeals(String username);

    CampaignAppealResponse approveAppeal(Long appealId, CampaignAppealReviewRequest request, String username);

    CampaignAppealResponse rejectAppeal(Long appealId, CampaignAppealReviewRequest request, String username);
}
