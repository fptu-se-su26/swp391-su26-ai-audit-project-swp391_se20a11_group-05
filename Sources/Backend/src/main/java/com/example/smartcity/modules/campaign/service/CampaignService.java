package com.example.smartcity.modules.campaign.service;

import com.example.smartcity.modules.campaign.dto.CampaignActionRequest;
import com.example.smartcity.modules.campaign.dto.CampaignChatMessageResponse;
import com.example.smartcity.modules.campaign.dto.CampaignCommentResponse;
import com.example.smartcity.modules.campaign.dto.CampaignFeedbackRequest;
import com.example.smartcity.modules.campaign.dto.CampaignFeedbackResponse;
import com.example.smartcity.modules.campaign.dto.CampaignMessageRequest;
import com.example.smartcity.modules.campaign.dto.CampaignParticipantResponse;
import com.example.smartcity.modules.campaign.dto.CampaignRequest;
import com.example.smartcity.modules.campaign.dto.CampaignResponse;
import com.example.smartcity.modules.campaign.dto.CampaignJoinRequest;
import com.example.smartcity.modules.campaign.dto.CampaignBatchApproveRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface CampaignService {

    Page<CampaignResponse> getAll(String status, Pageable pageable, String username);

    CampaignResponse getById(Long id, String username);

    CampaignResponse getPrivateDetail(Long id, String username);

    CampaignResponse create(CampaignRequest request, String username);

    CampaignResponse approveCampaign(Long campaignId, String username);

    CampaignResponse join(Long campaignId, CampaignJoinRequest request, String username);

    void leave(Long campaignId, CampaignActionRequest request, String username);

    void confirmWaitlist(Long campaignId, String username);

    List<CampaignParticipantResponse> batchApproveParticipants(Long campaignId, CampaignBatchApproveRequest request, String username);

    CampaignParticipantResponse markNoShow(Long campaignId, Long participantId, String username);

    String sendEmailOtp(String username);

    List<CampaignParticipantResponse> getParticipants(Long campaignId, String username);

    CampaignParticipantResponse approveParticipant(Long campaignId, Long participantId, String username);

    CampaignParticipantResponse rejectParticipant(Long campaignId, Long participantId, CampaignActionRequest request, String username);

    List<CampaignCommentResponse> getComments(Long campaignId, String username);

    CampaignCommentResponse addComment(Long campaignId, CampaignMessageRequest request, String username);

    List<CampaignChatMessageResponse> getChatMessages(Long campaignId, String username);

    CampaignChatMessageResponse addChatMessage(Long campaignId, CampaignMessageRequest request, String username);

    CampaignChatMessageResponse pinMessage(Long campaignId, Long messageId, String username);

    CampaignChatMessageResponse unpinMessage(Long campaignId, Long messageId, String username);

    CampaignFeedbackResponse addFeedback(Long campaignId, CampaignFeedbackRequest request, String username);

    boolean canAccessRealtimeChannel(Long campaignId, String username);

    CampaignResponse update(Long id, CampaignRequest request, String username);

    void delete(Long id, String username);

    CampaignResponse endCampaign(Long id, String username);

    CampaignParticipantResponse signalAttendance(Long campaignId, String username, String signal);

    CampaignResponse finalizeCampaign(Long campaignId, String username);
}
