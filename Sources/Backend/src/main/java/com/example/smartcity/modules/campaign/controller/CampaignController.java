package com.example.smartcity.modules.campaign.controller;

import com.example.smartcity.modules.campaign.dto.CampaignActionRequest;
import com.example.smartcity.modules.campaign.dto.CampaignChatMessageResponse;
import com.example.smartcity.modules.campaign.dto.CampaignCommentResponse;
import com.example.smartcity.modules.campaign.dto.CampaignFeedbackRequest;
import com.example.smartcity.modules.campaign.dto.CampaignFeedbackResponse;
import com.example.smartcity.modules.campaign.dto.CampaignMessageRequest;
import com.example.smartcity.modules.campaign.dto.CampaignParticipantResponse;
import com.example.smartcity.modules.campaign.dto.CampaignRequest;
import com.example.smartcity.modules.campaign.dto.CampaignResponse;
import com.example.smartcity.modules.campaign.service.CampaignService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/campaigns")
@RequiredArgsConstructor
public class CampaignController {

    private final CampaignService campaignService;
    private final SimpMessagingTemplate messagingTemplate;

    @GetMapping
    public ResponseEntity<Page<CampaignResponse>> getAll(
            @RequestParam(required = false) String status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            Authentication authentication) {
        return ResponseEntity.ok(campaignService.getAll(status, pageable, username(authentication)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CampaignResponse> getById(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(campaignService.getById(id, username(authentication)));
    }

    @GetMapping("/{id}/detail")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<CampaignResponse> getPrivateDetail(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(campaignService.getPrivateDetail(id, authentication.getName()));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('WARD_STAFF', 'POLICE', 'SUPER_ADMIN')")
    public ResponseEntity<CampaignResponse> create(
            @Valid @RequestBody CampaignRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(campaignService.create(request, authentication.getName()));
    }

    @PostMapping("/{id}/approve")
    @Deprecated
    public ResponseEntity<CampaignResponse> approveCampaign(
            @PathVariable Long id,
            Authentication authentication) {
        throw new UnsupportedOperationException("Approval flow is deprecated; campaigns are active upon creation.");
    }

    @PostMapping("/{id}/join")
    @PreAuthorize("hasRole('CITIZEN')")
    public ResponseEntity<CampaignResponse> join(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(campaignService.join(id, authentication.getName()));
    }

    @DeleteMapping("/{id}/leave")
    @PreAuthorize("hasRole('CITIZEN')")
    public ResponseEntity<Void> leave(@PathVariable Long id, Authentication authentication) {
        campaignService.leave(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/participants")
    @PreAuthorize("hasAnyRole('WARD_STAFF', 'POLICE', 'SUPER_ADMIN')")
    public ResponseEntity<List<CampaignParticipantResponse>> getParticipants(
            @PathVariable Long id,
            Authentication authentication) {
        return ResponseEntity.ok(campaignService.getParticipants(id, authentication.getName()));
    }

    @PostMapping("/{id}/participants/{participantId}/approve")
    @PreAuthorize("hasAnyRole('WARD_STAFF', 'POLICE', 'SUPER_ADMIN')")
    public ResponseEntity<CampaignParticipantResponse> approveParticipant(
            @PathVariable Long id,
            @PathVariable Long participantId,
            Authentication authentication) {
        return ResponseEntity.ok(campaignService.approveParticipant(id, participantId, authentication.getName()));
    }

    @PostMapping("/{id}/participants/{participantId}/reject")
    @PreAuthorize("hasAnyRole('WARD_STAFF', 'POLICE', 'SUPER_ADMIN')")
    public ResponseEntity<CampaignParticipantResponse> rejectParticipant(
            @PathVariable Long id,
            @PathVariable Long participantId,
            @RequestBody(required = false) CampaignActionRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(campaignService.rejectParticipant(id, participantId, request, authentication.getName()));
    }

    @GetMapping("/{id}/comments")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<CampaignCommentResponse>> getComments(
            @PathVariable Long id,
            Authentication authentication) {
        return ResponseEntity.ok(campaignService.getComments(id, authentication.getName()));
    }

    @PostMapping("/{id}/comments")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<CampaignCommentResponse> addComment(
            @PathVariable Long id,
            @Valid @RequestBody CampaignMessageRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(campaignService.addComment(id, request, authentication.getName()));
    }

    @GetMapping("/{id}/chat")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<CampaignChatMessageResponse>> getChatMessages(
            @PathVariable Long id,
            Authentication authentication) {
        return ResponseEntity.ok(campaignService.getChatMessages(id, authentication.getName()));
    }

    @PostMapping("/{id}/chat")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<CampaignChatMessageResponse> addChatMessage(
            @PathVariable Long id,
            @Valid @RequestBody CampaignMessageRequest request,
            Authentication authentication) {
        CampaignChatMessageResponse response = campaignService.addChatMessage(id, request, authentication.getName());
        messagingTemplate.convertAndSend("/topic/campaigns/" + id + "/chat", response);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/chat/{messageId}/pin")
    @PreAuthorize("hasAnyRole('WARD_STAFF', 'POLICE', 'SUPER_ADMIN')")
    public ResponseEntity<CampaignChatMessageResponse> pinMessage(
            @PathVariable Long id,
            @PathVariable Long messageId,
            Authentication authentication) {
        CampaignChatMessageResponse response = campaignService.pinMessage(id, messageId, authentication.getName());
        messagingTemplate.convertAndSend("/topic/campaigns/" + id + "/chat", response);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/chat/{messageId}/unpin")
    @PreAuthorize("hasAnyRole('WARD_STAFF', 'POLICE', 'SUPER_ADMIN')")
    public ResponseEntity<CampaignChatMessageResponse> unpinMessage(
            @PathVariable Long id,
            @PathVariable Long messageId,
            Authentication authentication) {
        CampaignChatMessageResponse response = campaignService.unpinMessage(id, messageId, authentication.getName());
        messagingTemplate.convertAndSend("/topic/campaigns/" + id + "/chat", response);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/feedback")
    @PreAuthorize("hasRole('CITIZEN')")
    public ResponseEntity<CampaignFeedbackResponse> addFeedback(
            @PathVariable Long id,
            @Valid @RequestBody CampaignFeedbackRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(campaignService.addFeedback(id, request, authentication.getName()));
    }

    @MessageMapping("/campaigns/{campaignId}/chat")
    public void sendChatMessage(
            @DestinationVariable Long campaignId,
            @Valid CampaignMessageRequest request,
            Principal principal) {
        CampaignChatMessageResponse response = campaignService.addChatMessage(
                campaignId,
                request,
                principal != null ? principal.getName() : null);
        messagingTemplate.convertAndSend("/topic/campaigns/" + campaignId + "/chat", response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('WARD_STAFF', 'POLICE', 'SUPER_ADMIN')")
    public ResponseEntity<CampaignResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody CampaignRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(campaignService.update(id, request, authentication.getName()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('WARD_STAFF', 'POLICE', 'SUPER_ADMIN')")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            Authentication authentication) {
        campaignService.delete(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/end")
    @PreAuthorize("hasAnyRole('WARD_STAFF', 'POLICE', 'SUPER_ADMIN')")
    public ResponseEntity<CampaignResponse> endCampaign(
            @PathVariable Long id,
            Authentication authentication) {
        return ResponseEntity.ok(campaignService.endCampaign(id, authentication.getName()));
    }

    private String username(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        String name = authentication.getName();
        return "anonymousUser".equals(name) ? null : name;
    }
}
