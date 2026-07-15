package com.example.smartcity.modules.campaign.controller;

import com.example.smartcity.modules.campaign.dto.CampaignAppealRequest;
import com.example.smartcity.modules.campaign.dto.CampaignAppealReviewRequest;
import com.example.smartcity.modules.campaign.dto.CampaignAppealResponse;
import com.example.smartcity.modules.campaign.service.CampaignAppealService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/campaigns/appeals")
@RequiredArgsConstructor
public class CampaignAppealController {

    private final CampaignAppealService appealService;

    @PostMapping
    @PreAuthorize("hasRole('CITIZEN')")
    public ResponseEntity<CampaignAppealResponse> submitAppeal(
            @Valid @RequestBody CampaignAppealRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(appealService.submitAppeal(request, authentication.getName()));
    }

    @GetMapping("/my-appeal")
    @PreAuthorize("hasRole('CITIZEN')")
    public ResponseEntity<CampaignAppealResponse> getMyLastAppeal(Authentication authentication) {
        return ResponseEntity.ok(appealService.getMyLastAppeal(authentication.getName()));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('WARD_STAFF', 'SUPER_ADMIN')")
    public ResponseEntity<List<CampaignAppealResponse>> getPendingAppeals(Authentication authentication) {
        return ResponseEntity.ok(appealService.getPendingAppeals(authentication.getName()));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('WARD_STAFF', 'SUPER_ADMIN')")
    public ResponseEntity<CampaignAppealResponse> approveAppeal(
            @PathVariable Long id,
            @Valid @RequestBody(required = false) CampaignAppealReviewRequest request,
            Authentication authentication) {
        CampaignAppealReviewRequest reviewRequest = request != null ? request : new CampaignAppealReviewRequest();
        return ResponseEntity.ok(appealService.approveAppeal(id, reviewRequest, authentication.getName()));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('WARD_STAFF', 'SUPER_ADMIN')")
    public ResponseEntity<CampaignAppealResponse> rejectAppeal(
            @PathVariable Long id,
            @Valid @RequestBody(required = false) CampaignAppealReviewRequest request,
            Authentication authentication) {
        CampaignAppealReviewRequest reviewRequest = request != null ? request : new CampaignAppealReviewRequest();
        return ResponseEntity.ok(appealService.rejectAppeal(id, reviewRequest, authentication.getName()));
    }
}
