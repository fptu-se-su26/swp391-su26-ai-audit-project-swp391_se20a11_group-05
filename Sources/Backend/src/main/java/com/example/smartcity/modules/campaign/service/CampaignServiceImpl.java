package com.example.smartcity.modules.campaign.service;

import com.example.smartcity.common.exception.CustomException;
import com.example.smartcity.modules.campaign.dto.CampaignActionRequest;
import com.example.smartcity.modules.campaign.dto.CampaignChatMessageResponse;
import com.example.smartcity.modules.campaign.dto.CampaignCommentResponse;
import com.example.smartcity.modules.campaign.dto.CampaignFeedbackRequest;
import com.example.smartcity.modules.campaign.dto.CampaignFeedbackResponse;
import com.example.smartcity.modules.campaign.dto.CampaignMessageRequest;
import com.example.smartcity.modules.campaign.dto.CampaignParticipantResponse;
import com.example.smartcity.modules.campaign.dto.CampaignRequest;
import com.example.smartcity.modules.campaign.dto.CampaignResponse;
import com.example.smartcity.modules.campaign.entity.Campaign;
import com.example.smartcity.modules.campaign.entity.CampaignChatMessage;
import com.example.smartcity.modules.campaign.entity.CampaignComment;
import com.example.smartcity.modules.campaign.entity.CampaignFeedback;
import com.example.smartcity.modules.campaign.entity.CampaignParticipant;
import com.example.smartcity.modules.campaign.repository.CampaignChatMessageRepository;
import com.example.smartcity.modules.campaign.repository.CampaignCommentRepository;
import com.example.smartcity.modules.campaign.repository.CampaignFeedbackRepository;
import com.example.smartcity.modules.campaign.repository.CampaignParticipantRepository;
import com.example.smartcity.modules.campaign.repository.CampaignRepository;
import com.example.smartcity.modules.core.entity.Ward;
import com.example.smartcity.modules.core.repository.WardRepository;
import com.example.smartcity.modules.user.entity.Role;
import com.example.smartcity.modules.user.entity.User;
import com.example.smartcity.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class CampaignServiceImpl implements CampaignService {

    private static final String STATUS_PENDING_APPROVAL = "PENDING_APPROVAL";
    private static final String STATUS_RECRUITING = "RECRUITING";
    private static final String STATUS_COMPLETED = "COMPLETED";
    private static final String JOIN_PENDING = "PENDING";
    private static final String JOIN_APPROVED = "APPROVED";
    private static final String JOIN_REJECTED = "REJECTED";
    private static final String JOIN_CANCELLED = "CANCELLED";

    private final CampaignRepository campaignRepository;
    private final CampaignParticipantRepository participantRepository;
    private final CampaignCommentRepository commentRepository;
    private final CampaignChatMessageRepository chatMessageRepository;
    private final CampaignFeedbackRepository feedbackRepository;
    private final UserRepository userRepository;
    private final WardRepository wardRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<CampaignResponse> getAll(String status, Pageable pageable, String username) {
        User currentUser = findUser(username).orElse(null);
        String normalizedStatus = normalizeStatus(status);

        Page<Campaign> campaigns;
        if (currentUser == null) {
            campaigns = campaignRepository.findPublicVisibleCampaigns(normalizedStatus, pageable);
        } else if (currentUser.getRole() == Role.SUPER_ADMIN) {
            campaigns = campaignRepository.findByOptionalStatus(normalizedStatus, pageable);
        } else {
            campaigns = campaignRepository.findVisibleCampaignsForUser(normalizedStatus, currentUser.getId(), pageable);
        }

        return campaigns.map(campaign -> toResponse(campaign, currentUser));
    }

    @Override
    @Transactional(readOnly = true)
    public CampaignResponse getById(Long id, String username) {
        User currentUser = findUser(username).orElse(null);
        Campaign campaign = getCampaign(id);
        assertCanViewCampaign(campaign, currentUser);
        return toResponse(campaign, currentUser);
    }

    @Override
    @Transactional(readOnly = true)
    public CampaignResponse getPrivateDetail(Long id, String username) {
        User currentUser = requireUser(username);
        Campaign campaign = getCampaign(id);
        assertCanViewPrivateDetails(campaign, currentUser);
        return toResponse(campaign, currentUser);
    }

    @Override
    @Transactional
    public CampaignResponse create(CampaignRequest request, String username) {
        User creator = requireUser(username);
        if (creator.getRole() != Role.WARD_STAFF) {
            throw new CustomException("Only ward staff can create campaigns", HttpStatus.FORBIDDEN.value());
        }

        Ward ward = resolveWard(request, creator);
        Campaign campaign = Campaign.builder()
                .createdByUser(creator)
                .ward(ward)
                .title(request.getTitle())
                .description(request.getDescription())
                .category(blankToNull(request.getCategory()))
                .locationText(request.getLocationText())
                .privateLocationText(request.getPrivateLocationText())
                .requiredTools(request.getRequiredTools())
                .organizerContact(request.getOrganizerContact())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .maxParticipants(request.getMaxParticipants())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .status(STATUS_PENDING_APPROVAL)
                .build();

        try {
            return toResponse(campaignRepository.saveAndFlush(campaign), creator);
        } catch (DataIntegrityViolationException ex) {
            log.warn("Failed to create campaign due to database constraint: {}", ex.getMostSpecificCause().getMessage());
            throw new CustomException(
                    "Không thể tạo chiến dịch do dữ liệu chưa khớp ràng buộc hệ thống. Vui lòng khởi động lại backend để cập nhật schema rồi thử lại.",
                    HttpStatus.CONFLICT.value());
        }
    }

    @Override
    @Transactional
    public CampaignResponse approveCampaign(Long campaignId, String username) {
        User approver = requireUser(username);
        if (approver.getRole() != Role.SUPER_ADMIN) {
            throw new CustomException("Only city admin can approve campaigns", HttpStatus.FORBIDDEN.value());
        }

        Campaign campaign = getCampaign(campaignId);
        if (!STATUS_PENDING_APPROVAL.equals(campaign.getStatus())) {
            throw new CustomException("Campaign is not pending approval", HttpStatus.CONFLICT.value());
        }

        campaign.setStatus(STATUS_RECRUITING);
        return toResponse(campaignRepository.save(campaign), approver);
    }

    @Override
    @Transactional
    public CampaignResponse join(Long campaignId, String username) {
        User citizen = requireUser(username);
        if (citizen.getRole() != Role.CITIZEN) {
            throw new CustomException("Only citizens can join campaigns", HttpStatus.FORBIDDEN.value());
        }

        Campaign campaign = getCampaign(campaignId);
        if (!STATUS_RECRUITING.equals(campaign.getStatus())) {
            throw new CustomException("Campaign is not open for registration", HttpStatus.CONFLICT.value());
        }

        Optional<CampaignParticipant> existing = participantRepository
                .findByCampaign_IdAndCitizen_Id(campaignId, citizen.getId());
        if (existing.isPresent()) {
            CampaignParticipant participant = existing.get();
            if (JOIN_PENDING.equals(participant.getJoinStatus()) || JOIN_APPROVED.equals(participant.getJoinStatus())) {
                throw new CustomException("You have already registered for this campaign", HttpStatus.CONFLICT.value());
            }
            participant.setJoinStatus(JOIN_PENDING);
            participant.setApprovedBy(null);
            participant.setApprovedAt(null);
            participant.setRejectedAt(null);
            participant.setRejectionReason(null);
            participant.setCancelledAt(null);
            participantRepository.save(participant);
        } else {
            CampaignParticipant participant = CampaignParticipant.builder()
                    .campaign(campaign)
                    .citizen(citizen)
                    .joinStatus(JOIN_PENDING)
                    .build();
            participantRepository.save(participant);
        }

        return toResponse(campaignRepository.findById(campaignId).orElse(campaign), citizen);
    }

    @Override
    @Transactional
    public void leave(Long campaignId, String username) {
        User citizen = requireUser(username);
        participantRepository.findByCampaign_IdAndCitizen_Id(campaignId, citizen.getId())
                .ifPresent(participant -> {
                    participant.setJoinStatus(JOIN_CANCELLED);
                    participant.setApprovedBy(null);
                    participant.setApprovedAt(null);
                    participant.setRejectedAt(null);
                    participant.setRejectionReason(null);
                    participant.setCancelledAt(LocalDateTime.now());
                    participantRepository.save(participant);
                });
    }

    @Override
    public List<CampaignParticipantResponse> getParticipants(Long campaignId, String username) {
        User manager = requireUser(username);
        Campaign campaign = getCampaign(campaignId);
        assertCanManage(campaign, manager);
        return participantRepository.findByCampaign_IdOrderByCreatedAtDesc(campaignId).stream()
                .map(this::toParticipantResponse)
                .toList();
    }

    @Override
    @Transactional
    public CampaignParticipantResponse approveParticipant(Long campaignId, Long participantId, String username) {
        User manager = requireUser(username);
        Campaign campaign = getCampaign(campaignId);
        assertCanManage(campaign, manager);

        CampaignParticipant participant = getParticipant(participantId, campaignId);
        if (campaign.getMaxParticipants() != null) {
            long approvedCount = participantRepository.countByCampaign_IdAndJoinStatus(campaignId, JOIN_APPROVED);
            boolean alreadyApproved = JOIN_APPROVED.equals(participant.getJoinStatus());
            if (!alreadyApproved && approvedCount >= campaign.getMaxParticipants()) {
                throw new CustomException("Campaign has reached the participant limit", HttpStatus.CONFLICT.value());
            }
        }

        participant.setJoinStatus(JOIN_APPROVED);
        participant.setApprovedBy(manager);
        participant.setApprovedAt(LocalDateTime.now());
        participant.setRejectedAt(null);
        participant.setRejectionReason(null);
        participant.setCancelledAt(null);
        return toParticipantResponse(participantRepository.save(participant));
    }

    @Override
    @Transactional
    public CampaignParticipantResponse rejectParticipant(
            Long campaignId,
            Long participantId,
            CampaignActionRequest request,
            String username) {
        User manager = requireUser(username);
        Campaign campaign = getCampaign(campaignId);
        assertCanManage(campaign, manager);

        CampaignParticipant participant = getParticipant(participantId, campaignId);
        participant.setJoinStatus(JOIN_REJECTED);
        participant.setApprovedBy(null);
        participant.setApprovedAt(null);
        participant.setRejectedAt(LocalDateTime.now());
        participant.setRejectionReason(request != null ? blankToNull(request.getReason()) : null);
        participant.setCancelledAt(null);
        return toParticipantResponse(participantRepository.save(participant));
    }

    @Override
    public List<CampaignCommentResponse> getComments(Long campaignId, String username) {
        User currentUser = requireUser(username);
        Campaign campaign = getCampaign(campaignId);
        assertCanComment(campaign, currentUser);

        List<CampaignComment> comments = new ArrayList<>(commentRepository.findTop50ByCampaign_IdOrderByCreatedAtDesc(campaignId));
        java.util.Collections.reverse(comments);
        return comments.stream().map(this::toCommentResponse).toList();
    }

    @Override
    @Transactional
    public CampaignCommentResponse addComment(Long campaignId, CampaignMessageRequest request, String username) {
        User author = requireUser(username);
        Campaign campaign = getCampaign(campaignId);
        assertCanComment(campaign, author);

        CampaignComment comment = CampaignComment.builder()
                .campaign(campaign)
                .author(author)
                .content(request.getContent().trim())
                .build();
        return toCommentResponse(commentRepository.save(comment));
    }

    @Override
    public List<CampaignChatMessageResponse> getChatMessages(Long campaignId, String username) {
        User currentUser = requireUser(username);
        Campaign campaign = getCampaign(campaignId);
        assertCanViewPrivateDetails(campaign, currentUser);

        List<CampaignChatMessage> messages = new ArrayList<>(chatMessageRepository.findTop50ByCampaign_IdOrderByCreatedAtDesc(campaignId));
        java.util.Collections.reverse(messages);
        return messages.stream().map(this::toChatResponse).toList();
    }

    @Override
    @Transactional
    public CampaignChatMessageResponse addChatMessage(Long campaignId, CampaignMessageRequest request, String username) {
        User sender = requireUser(username);
        Campaign campaign = getCampaign(campaignId);
        assertCanViewPrivateDetails(campaign, sender);

        CampaignChatMessage message = CampaignChatMessage.builder()
                .campaign(campaign)
                .sender(sender)
                .message(request.getContent().trim())
                .build();
        return toChatResponse(chatMessageRepository.save(message));
    }

    @Override
    @Transactional
    public CampaignFeedbackResponse addFeedback(Long campaignId, CampaignFeedbackRequest request, String username) {
        User citizen = requireUser(username);
        Campaign campaign = getCampaign(campaignId);
        if (!STATUS_COMPLETED.equals(campaign.getStatus())) {
            throw new CustomException("Feedback is only available after campaign completion", HttpStatus.CONFLICT.value());
        }

        CampaignParticipant participant = participantRepository
                .findByCampaign_IdAndCitizen_Id(campaignId, citizen.getId())
                .filter(p -> JOIN_APPROVED.equals(p.getJoinStatus()))
                .orElseThrow(() -> new CustomException("Only approved participants can submit feedback", HttpStatus.FORBIDDEN.value()));

        if (feedbackRepository.existsByCampaign_IdAndParticipant_Id(campaignId, participant.getId())) {
            throw new CustomException("You have already submitted feedback for this campaign", HttpStatus.CONFLICT.value());
        }

        CampaignFeedback feedback = CampaignFeedback.builder()
                .campaign(campaign)
                .participant(participant)
                .rating(request.getRating())
                .content(request.getContent().trim())
                .build();
        return toFeedbackResponse(feedbackRepository.save(feedback));
    }

    @Override
    public boolean canAccessRealtimeChannel(Long campaignId, String username) {
        if (username == null || username.isBlank()) {
            return false;
        }
        return findUser(username)
                .map(user -> {
                    Campaign campaign = getCampaign(campaignId);
                    return canViewPrivateDetails(campaign, user);
                })
                .orElse(false);
    }

    private CampaignResponse toResponse(Campaign campaign, User currentUser) {
        long participantCount = participantRepository.countByCampaign_IdAndJoinStatus(campaign.getId(), JOIN_APPROVED);
        Optional<CampaignParticipant> currentParticipant = currentUser == null
                ? Optional.empty()
                : participantRepository.findByCampaign_IdAndCitizen_Id(campaign.getId(), currentUser.getId());

        boolean canManage = currentUser != null && canManage(campaign, currentUser);
        boolean privateDetailsVisible = currentUser != null && canViewPrivateDetails(campaign, currentUser);
        boolean canJoin = currentUser != null
                && currentUser.getRole() == Role.CITIZEN
                && STATUS_RECRUITING.equals(campaign.getStatus())
                && currentParticipant
                .map(p -> JOIN_REJECTED.equals(p.getJoinStatus()) || JOIN_CANCELLED.equals(p.getJoinStatus()))
                .orElse(true);
        boolean canComment = currentUser != null && canComment(campaign, currentUser);
        boolean canFeedback = currentParticipant
                .filter(p -> JOIN_APPROVED.equals(p.getJoinStatus()))
                .map(p -> STATUS_COMPLETED.equals(campaign.getStatus())
                        && !feedbackRepository.existsByCampaign_IdAndParticipant_Id(campaign.getId(), p.getId()))
                .orElse(false);

        return CampaignResponse.builder()
                .id(campaign.getId())
                .title(campaign.getTitle())
                .description(campaign.getDescription())
                .category(campaign.getCategory())
                .locationText(campaign.getLocationText())
                .privateLocationText(privateDetailsVisible ? campaign.getPrivateLocationText() : null)
                .requiredTools(privateDetailsVisible ? campaign.getRequiredTools() : null)
                .organizerContact(privateDetailsVisible ? campaign.getOrganizerContact() : null)
                .latitude(privateDetailsVisible ? campaign.getLatitude() : null)
                .longitude(privateDetailsVisible ? campaign.getLongitude() : null)
                .maxParticipants(campaign.getMaxParticipants())
                .startTime(campaign.getStartTime())
                .endTime(campaign.getEndTime())
                .status(campaign.getStatus())
                .wardId(campaign.getWard() != null ? campaign.getWard().getId() : null)
                .wardName(campaign.getWard() != null ? campaign.getWard().getName() : null)
                .createdByUserId(campaign.getCreatedByUser().getId())
                .createdByName(campaign.getCreatedByUser().getFullName())
                .participantCount(participantCount)
                .currentUserJoinStatus(currentParticipant.map(CampaignParticipant::getJoinStatus).orElse(null))
                .privateDetailsVisible(privateDetailsVisible)
                .canJoin(canJoin)
                .canManage(canManage)
                .canComment(canComment)
                .canFeedback(canFeedback)
                .createdAt(campaign.getCreatedAt())
                .updatedAt(campaign.getUpdatedAt())
                .build();
    }

    private CampaignParticipantResponse toParticipantResponse(CampaignParticipant participant) {
        return CampaignParticipantResponse.builder()
                .id(participant.getId())
                .campaignId(participant.getCampaign().getId())
                .citizenId(participant.getCitizen().getId())
                .citizenName(participant.getCitizen().getFullName())
                .joinStatus(participant.getJoinStatus())
                .createdAt(participant.getCreatedAt())
                .approvedAt(participant.getApprovedAt())
                .rejectedAt(participant.getRejectedAt())
                .rejectionReason(participant.getRejectionReason())
                .build();
    }

    private CampaignCommentResponse toCommentResponse(CampaignComment comment) {
        return CampaignCommentResponse.builder()
                .id(comment.getId())
                .authorId(comment.getAuthor().getId())
                .authorName(comment.getAuthor().getFullName())
                .authorRole(comment.getAuthor().getRole().name())
                .content(comment.getContent())
                .createdAt(comment.getCreatedAt())
                .build();
    }

    private CampaignChatMessageResponse toChatResponse(CampaignChatMessage message) {
        return CampaignChatMessageResponse.builder()
                .id(message.getId())
                .senderId(message.getSender().getId())
                .senderName(message.getSender().getFullName())
                .senderRole(message.getSender().getRole().name())
                .message(message.getMessage())
                .createdAt(message.getCreatedAt())
                .build();
    }

    private CampaignFeedbackResponse toFeedbackResponse(CampaignFeedback feedback) {
        return CampaignFeedbackResponse.builder()
                .id(feedback.getId())
                .campaignId(feedback.getCampaign().getId())
                .participantId(feedback.getParticipant().getId())
                .rating(feedback.getRating())
                .content(feedback.getContent())
                .createdAt(feedback.getCreatedAt())
                .build();
    }

    private Campaign getCampaign(Long id) {
        return campaignRepository.findById(id)
                .orElseThrow(() -> new CustomException("Campaign not found", HttpStatus.NOT_FOUND.value()));
    }

    private CampaignParticipant getParticipant(Long participantId, Long campaignId) {
        CampaignParticipant participant = participantRepository.findById(participantId)
                .orElseThrow(() -> new CustomException("Participant not found", HttpStatus.NOT_FOUND.value()));
        if (!participant.getCampaign().getId().equals(campaignId)) {
            throw new CustomException("Participant does not belong to this campaign", HttpStatus.BAD_REQUEST.value());
        }
        return participant;
    }

    private User requireUser(String username) {
        return findUser(username)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND.value()));
    }

    private Optional<User> findUser(String username) {
        if (username == null || username.isBlank() || "anonymousUser".equals(username)) {
            return Optional.empty();
        }
        return userRepository.findByUsername(username);
    }

    private Ward resolveWard(CampaignRequest request, User creator) {
        if (request.getWardId() != null) {
            Ward ward = wardRepository.findById(request.getWardId())
                    .orElseThrow(() -> new CustomException("Ward not found", HttpStatus.NOT_FOUND.value()));
            if (creator.getWard() != null && !creator.getWard().getId().equals(ward.getId())) {
                throw new CustomException("Ward staff can only create campaigns for their ward", HttpStatus.FORBIDDEN.value());
            }
            return ward;
        }
        if (creator.getWard() == null) {
            throw new CustomException("Ward staff account is not assigned to a ward", HttpStatus.CONFLICT.value());
        }
        return creator.getWard();
    }

    private void assertCanViewCampaign(Campaign campaign, User user) {
        if (STATUS_PENDING_APPROVAL.equals(campaign.getStatus())
                && (user == null || (!canManage(campaign, user) && user.getRole() != Role.SUPER_ADMIN))) {
            throw new CustomException("Campaign not found", HttpStatus.NOT_FOUND.value());
        }
    }

    private void assertCanManage(Campaign campaign, User user) {
        if (!canManage(campaign, user)) {
            throw new CustomException("You do not have permission to manage this campaign", HttpStatus.FORBIDDEN.value());
        }
    }

    private void assertCanViewPrivateDetails(Campaign campaign, User user) {
        if (!canViewPrivateDetails(campaign, user)) {
            throw new CustomException("Only campaign managers and approved participants can access these details", HttpStatus.FORBIDDEN.value());
        }
    }

    private void assertCanComment(Campaign campaign, User user) {
        if (!canComment(campaign, user)) {
            throw new CustomException("Only campaign managers and approved participants can comment", HttpStatus.FORBIDDEN.value());
        }
    }

    private boolean canManage(Campaign campaign, User user) {
        return user != null
                && (user.getRole() == Role.SUPER_ADMIN
                || (user.getRole() == Role.WARD_STAFF && campaign.getCreatedByUser().getId().equals(user.getId())));
    }

    private boolean canViewPrivateDetails(Campaign campaign, User user) {
        return canManage(campaign, user)
                || (user != null && participantRepository
                .findByCampaign_IdAndCitizen_Id(campaign.getId(), user.getId())
                .map(participant -> JOIN_APPROVED.equals(participant.getJoinStatus()))
                .orElse(false));
    }

    private boolean canComment(Campaign campaign, User user) {
        return canViewPrivateDetails(campaign, user);
    }

    private String normalizeStatus(String status) {
        if (status == null || status.isBlank() || "all".equalsIgnoreCase(status)) {
            return null;
        }
        return status.trim().toUpperCase();
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
