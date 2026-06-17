package com.example.smartcity.modules.campaign.service;

import com.example.smartcity.common.exception.CustomException;
import com.example.smartcity.modules.campaign.dto.CampaignRequest;
import com.example.smartcity.modules.campaign.dto.CampaignResponse;
import com.example.smartcity.modules.campaign.entity.Campaign;
import com.example.smartcity.modules.campaign.entity.CampaignParticipant;
import com.example.smartcity.modules.campaign.repository.CampaignParticipantRepository;
import com.example.smartcity.modules.campaign.repository.CampaignRepository;
import com.example.smartcity.modules.core.entity.Ward;
import com.example.smartcity.modules.core.repository.WardRepository;
import com.example.smartcity.modules.user.entity.User;
import com.example.smartcity.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CampaignServiceImpl implements CampaignService {

    private final CampaignRepository campaignRepository;
    private final CampaignParticipantRepository participantRepository;
    private final UserRepository userRepository;
    private final WardRepository wardRepository;

    // ─── Helpers ──────────────────────────────────────────────

    private CampaignResponse toResponse(Campaign c) {
        long participantCount = participantRepository
                .countByCampaign_IdAndJoinStatus(c.getId(), "SURE");

        return CampaignResponse.builder()
                .id(c.getId())
                .title(c.getTitle())
                .description(c.getDescription())
                .locationText(c.getLocationText())
                .latitude(c.getLatitude())
                .longitude(c.getLongitude())
                .maxParticipants(c.getMaxParticipants())
                .startTime(c.getStartTime())
                .endTime(c.getEndTime())
                .status(c.getStatus())
                .wardId(c.getWard() != null ? c.getWard().getId() : null)
                .wardName(c.getWard() != null ? c.getWard().getName() : null)
                .createdByUserId(c.getCreatedByUser().getId())
                .createdByName(c.getCreatedByUser().getFullName())
                .participantCount(participantCount)
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }

    // ─── API ──────────────────────────────────────────────────

    @Override
    public Page<CampaignResponse> getAll(String status, Pageable pageable) {
        Page<Campaign> page = (status != null && !status.isBlank())
                ? campaignRepository.findByStatusOrderByCreatedAtDesc(status.toUpperCase(), pageable)
                : campaignRepository.findAllByOrderByCreatedAtDesc(pageable);
        return page.map(this::toResponse);
    }

    @Override
    public CampaignResponse getById(Long id) {
        Campaign campaign = campaignRepository.findById(id)
                .orElseThrow(() -> new CustomException("Không tìm thấy chiến dịch", HttpStatus.NOT_FOUND));
        return toResponse(campaign);
    }

    @Override
    @Transactional
    public CampaignResponse create(CampaignRequest request, Long createdByUserId) {
        User creator = userRepository.findById(createdByUserId)
                .orElseThrow(() -> new CustomException("Người dùng không tồn tại", HttpStatus.NOT_FOUND));

        Ward ward = null;
        if (request.getWardId() != null) {
            ward = wardRepository.findById(request.getWardId())
                    .orElse(null);
        }

        Campaign campaign = Campaign.builder()
                .createdByUser(creator)
                .ward(ward)
                .title(request.getTitle())
                .description(request.getDescription())
                .locationText(request.getLocationText())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .maxParticipants(request.getMaxParticipants())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .status("PENDING")
                .build();

        Campaign saved = campaignRepository.save(campaign);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public CampaignResponse join(Long campaignId, Long citizenId) {
        Campaign campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new CustomException("Không tìm thấy chiến dịch", HttpStatus.NOT_FOUND));

        User citizen = userRepository.findById(citizenId)
                .orElseThrow(() -> new CustomException("Người dùng không tồn tại", HttpStatus.NOT_FOUND));

        // Kiểm tra đã tham gia chưa
        boolean alreadyJoined = participantRepository.existsByCampaign_IdAndCitizen_IdAndJoinStatus(
                campaignId, citizenId, "SURE");
        if (alreadyJoined) {
            throw new CustomException("Bạn đã tham gia chiến dịch này rồi", HttpStatus.CONFLICT);
        }

        // Kiểm tra số lượng tham gia tối đa
        if (campaign.getMaxParticipants() != null) {
            long currentCount = participantRepository
                    .countByCampaign_IdAndJoinStatus(campaignId, "SURE");
            if (currentCount >= campaign.getMaxParticipants()) {
                throw new CustomException("Chiến dịch đã đủ số lượng tình nguyện viên", HttpStatus.CONFLICT);
            }
        }

        // Nếu đã có record với status khác → update lại
        participantRepository.findByCampaign_IdAndCitizen_Id(campaignId, citizenId)
                .ifPresentOrElse(
                        p -> {
                            p.setJoinStatus("SURE");
                            p.setCancelledAt(null);
                            participantRepository.save(p);
                        },
                        () -> {
                            CampaignParticipant participant = CampaignParticipant.builder()
                                    .campaign(campaign)
                                    .citizen(citizen)
                                    .joinStatus("SURE")
                                    .build();
                            participantRepository.save(participant);
                        }
                );

        return toResponse(campaignRepository.findById(campaignId).get());
    }

    @Override
    @Transactional
    public void leave(Long campaignId, Long citizenId) {
        participantRepository.findByCampaign_IdAndCitizen_Id(campaignId, citizenId)
                .ifPresent(p -> {
                    p.setJoinStatus("CANCELLED");
                    p.setCancelledAt(java.time.LocalDateTime.now());
                    participantRepository.save(p);
                });
    }
}
