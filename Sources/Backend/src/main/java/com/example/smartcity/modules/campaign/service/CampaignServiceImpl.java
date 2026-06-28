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
import com.example.smartcity.modules.campaign.dto.CampaignJoinRequest;
import com.example.smartcity.modules.campaign.dto.CampaignBatchApproveRequest;
import com.example.smartcity.modules.auth.service.EmailOtpService;
import com.example.smartcity.modules.notification.service.NotificationService;
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
    private static final String JOIN_WAITLIST = "WAITLIST";
    private static final String JOIN_PENDING_CONFIRM = "PENDING_CONFIRM";
    private static final String JOIN_NO_SHOW = "NO_SHOW";

    private final CampaignRepository campaignRepository;
    private final CampaignParticipantRepository participantRepository;
    private final CampaignCommentRepository commentRepository;
    private final CampaignChatMessageRepository chatMessageRepository;
    private final CampaignFeedbackRepository feedbackRepository;
    private final UserRepository userRepository;
    private final WardRepository wardRepository;
    private final CampaignIngestionService campaignIngestionService;
    private final EmailOtpService emailOtpService;
    private final NotificationService notificationService;

    @Override
    @Transactional(readOnly = true)
    public Page<CampaignResponse> getAll(String status, Pageable pageable, String username) {
        User currentUser = findUser(username).orElse(null);
        String normalizedStatus = normalizeStatus(status);
        LocalDateTime now = LocalDateTime.now();

        Page<Campaign> campaigns;
        if (currentUser == null) {
            campaigns = campaignRepository.findPublicVisibleCampaigns(normalizedStatus, now, pageable);
        } else if (currentUser.getRole() == Role.SUPER_ADMIN || currentUser.getRole() == Role.WARD_STAFF) {
            campaigns = campaignRepository.findByOptionalStatus(normalizedStatus, now, pageable);
        } else {
            campaigns = campaignRepository.findVisibleCampaignsForUser(normalizedStatus, currentUser.getId(), now, pageable);
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
                .status(STATUS_RECRUITING)
                .linkedFeedbackId(request.getLinkedFeedbackId())
                .boundaryGeojson(request.getBoundaryGeojson())
                .coverImageUrl(request.getCoverImageUrl())
                .imageUrls(joinImageUrls(request.getImageUrls()))
                .build();

        try {
            Campaign saved = campaignRepository.saveAndFlush(campaign);
            campaignIngestionService.ingestCampaignAsync(saved);
            return toResponse(saved, creator);
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
    public CampaignResponse join(Long campaignId, CampaignJoinRequest request, String username) {
        User citizen = requireUser(username);
        if (citizen.getRole() != Role.CITIZEN) {
            throw new CustomException("Only citizens can join campaigns", HttpStatus.FORBIDDEN.value());
        }
        if (citizen.getEmail() == null || citizen.getEmail().isBlank()) {
            throw new CustomException("Tài khoản chưa cấu hình email để nhận mã OTP.", HttpStatus.BAD_REQUEST.value());
        }

        // Verify OTP
        emailOtpService.verifyOtp(citizen.getEmail(), request.getOtpCode());

        Campaign campaign = getCampaign(campaignId);
        LocalDateTime now = LocalDateTime.now();
        boolean isEnded = "ENDED".equals(campaign.getStatus())
                || "COMPLETED".equals(campaign.getStatus())
                || (campaign.getEndTime() != null && now.isAfter(campaign.getEndTime()));
        if (isEnded || !STATUS_RECRUITING.equals(campaign.getStatus())) {
            throw new CustomException("Campaign is not open for registration", HttpStatus.CONFLICT.value());
        }

        long approvedCount = participantRepository.countByCampaign_IdAndJoinStatus(campaignId, JOIN_APPROVED);
        String targetStatus = JOIN_PENDING;
        if (campaign.getMaxParticipants() != null && approvedCount >= campaign.getMaxParticipants()) {
            targetStatus = JOIN_WAITLIST;
        }

        Optional<CampaignParticipant> existing = participantRepository
                .findByCampaign_IdAndCitizen_Id(campaignId, citizen.getId());
        if (existing.isPresent()) {
            CampaignParticipant participant = existing.get();
            if (JOIN_PENDING.equals(participant.getJoinStatus()) ||
                JOIN_APPROVED.equals(participant.getJoinStatus()) ||
                JOIN_WAITLIST.equals(participant.getJoinStatus()) ||
                JOIN_PENDING_CONFIRM.equals(participant.getJoinStatus())) {
                throw new CustomException("You have already registered for this campaign", HttpStatus.CONFLICT.value());
            }
            participant.setJoinStatus(targetStatus);
            participant.setVolunteerExperience(request.getVolunteerExperience());
            participant.setAvailabilityHours(request.getAvailabilityHours());
            participant.setApprovedBy(null);
            participant.setApprovedAt(null);
            participant.setRejectedAt(null);
            participant.setRejectionReason(null);
            participant.setCancelledAt(null);
            participant.setCancellationReason(null);
            participant.setConfirmationDeadline(null);
            participantRepository.save(participant);
        } else {
            CampaignParticipant participant = CampaignParticipant.builder()
                    .campaign(campaign)
                    .citizen(citizen)
                    .joinStatus(targetStatus)
                    .volunteerExperience(request.getVolunteerExperience())
                    .availabilityHours(request.getAvailabilityHours())
                    .build();
            participantRepository.save(participant);
        }

        return toResponse(campaignRepository.findById(campaignId).orElse(campaign), citizen);
    }

    @Override
    @Transactional
    public void leave(Long campaignId, CampaignActionRequest request, String username) {
        User citizen = requireUser(username);
        Campaign campaign = getCampaign(campaignId);

        if (campaign.getStartTime() != null && LocalDateTime.now().isAfter(campaign.getStartTime().minusHours(12))) {
            throw new CustomException("Chỉ có thể hủy tham gia tối thiểu 12 giờ trước khi chiến dịch bắt đầu.", HttpStatus.BAD_REQUEST.value());
        }

        CampaignParticipant participant = participantRepository.findByCampaign_IdAndCitizen_Id(campaignId, citizen.getId())
                .orElseThrow(() -> new CustomException("Không tìm thấy thông tin đăng ký của bạn cho chiến dịch này.", HttpStatus.NOT_FOUND.value()));

        if (!JOIN_PENDING.equals(participant.getJoinStatus()) &&
            !JOIN_APPROVED.equals(participant.getJoinStatus()) &&
            !JOIN_WAITLIST.equals(participant.getJoinStatus()) &&
            !JOIN_PENDING_CONFIRM.equals(participant.getJoinStatus())) {
            throw new CustomException("Trạng thái đăng ký hiện tại không thể thực hiện hủy.", HttpStatus.BAD_REQUEST.value());
        }

        if (participant.getCancelCount() != null && participant.getCancelCount() >= 1) {
            throw new CustomException("Không được phép hủy tham gia 2 lần liên tiếp cho cùng một chiến dịch.", HttpStatus.BAD_REQUEST.value());
        }

        boolean wasApproved = JOIN_APPROVED.equals(participant.getJoinStatus());

        participant.setJoinStatus(JOIN_CANCELLED);
        participant.setApprovedBy(null);
        participant.setApprovedAt(null);
        participant.setRejectedAt(null);
        participant.setRejectionReason(null);
        participant.setCancelledAt(LocalDateTime.now());
        participant.setCancellationReason(request != null ? request.getReason() : "Hủy bởi người dùng");
        participant.setCancelCount((participant.getCancelCount() == null ? 0 : participant.getCancelCount()) + 1);
        participant.setConfirmationDeadline(null);
        participantRepository.save(participant);

        if (wasApproved) {
            promoteNextWaitlist(campaignId);
        }
    }

    private void promoteNextWaitlist(Long campaignId) {
        participantRepository.findFirstByCampaign_IdAndJoinStatusOrderByCreatedAtAsc(campaignId, JOIN_WAITLIST)
                .ifPresent(nextParticipant -> {
                    nextParticipant.setJoinStatus(JOIN_PENDING_CONFIRM);
                    nextParticipant.setConfirmationDeadline(LocalDateTime.now().plusHours(2));
                    participantRepository.save(nextParticipant);

                    // Send notification to citizen
                    notificationService.createCampaignNotification(
                            nextParticipant.getCitizen(),
                            campaignId,
                            "🔔 Xác nhận tham gia chiến dịch",
                            "Bạn đã được chọn từ danh sách chờ cho chiến dịch '" + nextParticipant.getCampaign().getTitle() + "'. Vui lòng xác nhận tham gia trong vòng 2 giờ.",
                            "CAMPAIGN_WAITLIST_PROMOTE"
                    );
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
        LocalDateTime now = LocalDateTime.now();
        boolean isEnded = "ENDED".equals(campaign.getStatus())
                || "COMPLETED".equals(campaign.getStatus())
                || (campaign.getEndTime() != null && now.isAfter(campaign.getEndTime()));
        if (!isEnded) {
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
    @Transactional
    public CampaignChatMessageResponse pinMessage(Long campaignId, Long messageId, String username) {
        User manager = requireUser(username);
        Campaign campaign = getCampaign(campaignId);
        assertCanManage(campaign, manager);

        CampaignChatMessage message = chatMessageRepository.findById(messageId)
                .orElseThrow(() -> new CustomException("Message not found", HttpStatus.NOT_FOUND.value()));
        if (!message.getCampaign().getId().equals(campaignId)) {
            throw new CustomException("Message does not belong to this campaign", HttpStatus.BAD_REQUEST.value());
        }

        // Unpin all other messages for this campaign (only one pinned message at a time)
        chatMessageRepository.unpinAllForCampaign(campaignId);

        message.setPinned(true);
        return toChatResponse(chatMessageRepository.save(message));
    }

    @Override
    @Transactional
    public CampaignChatMessageResponse unpinMessage(Long campaignId, Long messageId, String username) {
        User manager = requireUser(username);
        Campaign campaign = getCampaign(campaignId);
        assertCanManage(campaign, manager);

        CampaignChatMessage message = chatMessageRepository.findById(messageId)
                .orElseThrow(() -> new CustomException("Message not found", HttpStatus.NOT_FOUND.value()));
        if (!message.getCampaign().getId().equals(campaignId)) {
            throw new CustomException("Message does not belong to this campaign", HttpStatus.BAD_REQUEST.value());
        }

        message.setPinned(false);
        return toChatResponse(chatMessageRepository.save(message));
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

    @Override
    @Transactional
    public CampaignResponse update(Long id, CampaignRequest request, String username) {
        User user = requireUser(username);
        Campaign campaign = getCampaign(id);
        assertCanManage(campaign, user);

        campaign.setTitle(request.getTitle());
        campaign.setDescription(request.getDescription());
        campaign.setCategory(blankToNull(request.getCategory()));
        campaign.setLocationText(request.getLocationText());
        campaign.setPrivateLocationText(request.getPrivateLocationText());
        campaign.setRequiredTools(request.getRequiredTools());
        campaign.setOrganizerContact(request.getOrganizerContact());
        campaign.setLatitude(request.getLatitude());
        campaign.setLongitude(request.getLongitude());
        campaign.setMaxParticipants(request.getMaxParticipants());
        campaign.setStartTime(request.getStartTime());
        campaign.setEndTime(request.getEndTime());
        campaign.setBoundaryGeojson(request.getBoundaryGeojson());
        campaign.setCoverImageUrl(request.getCoverImageUrl());
        campaign.setImageUrls(joinImageUrls(request.getImageUrls()));

        Campaign saved = campaignRepository.save(campaign);
        campaignIngestionService.ingestCampaignAsync(saved);
        return toResponse(saved, user);
    }

    @Override
    @Transactional
    public void delete(Long id, String username) {
        User user = requireUser(username);
        Campaign campaign = getCampaign(id);
        assertCanManage(campaign, user);

        feedbackRepository.deleteByCampaign_Id(id);
        commentRepository.deleteByCampaign_Id(id);
        chatMessageRepository.deleteByCampaign_Id(id);
        participantRepository.deleteByCampaign_Id(id);
        campaignRepository.delete(campaign);
    }

    @Override
    @Transactional
    public CampaignResponse endCampaign(Long id, String username) {
        User user = requireUser(username);
        Campaign campaign = getCampaign(id);
        assertCanManage(campaign, user);

        campaign.setStatus("ENDED");
        return toResponse(campaignRepository.save(campaign), user);
    }

    private CampaignResponse toResponse(Campaign campaign, User currentUser) {
        long participantCount = participantRepository.countByCampaign_IdAndJoinStatus(campaign.getId(), JOIN_APPROVED);
        Optional<CampaignParticipant> currentParticipant = currentUser == null
                ? Optional.empty()
                : participantRepository.findByCampaign_IdAndCitizen_Id(campaign.getId(), currentUser.getId());

        LocalDateTime now = LocalDateTime.now();
        boolean isEnded = "ENDED".equals(campaign.getStatus())
                || "COMPLETED".equals(campaign.getStatus())
                || (campaign.getEndTime() != null && now.isAfter(campaign.getEndTime()));

        boolean canManage = currentUser != null && canManage(campaign, currentUser);
        boolean privateDetailsVisible = currentUser != null && canViewPrivateDetails(campaign, currentUser);
        boolean canJoin = currentUser != null
                && currentUser.getRole() == Role.CITIZEN
                && !isEnded
                && STATUS_RECRUITING.equals(campaign.getStatus())
                && currentParticipant
                .map(p -> JOIN_REJECTED.equals(p.getJoinStatus()) ||
                          JOIN_CANCELLED.equals(p.getJoinStatus()) ||
                          JOIN_NO_SHOW.equals(p.getJoinStatus()))
                .orElse(true);

        boolean canLeave = false;
        if (currentUser != null && currentUser.getRole() == Role.CITIZEN && currentParticipant.isPresent()) {
            CampaignParticipant p = currentParticipant.get();
            boolean statusOk = JOIN_PENDING.equals(p.getJoinStatus()) || JOIN_APPROVED.equals(p.getJoinStatus()) || JOIN_WAITLIST.equals(p.getJoinStatus()) || JOIN_PENDING_CONFIRM.equals(p.getJoinStatus());
            boolean cancelCountOk = p.getCancelCount() == null || p.getCancelCount() < 1;
            boolean timeOk = campaign.getStartTime() == null || LocalDateTime.now().isBefore(campaign.getStartTime().minusHours(12));
            log.info("CAN_LEAVE_DEBUG: statusOk={}, cancelCountOk={}, timeOk={}, status={}, count={}, startTime={}", statusOk, cancelCountOk, timeOk, p.getJoinStatus(), p.getCancelCount(), campaign.getStartTime());
            canLeave = statusOk && cancelCountOk && timeOk;
        } else {
            log.info("CAN_LEAVE_DEBUG: currentUser={}, role={}, hasParticipant={}", currentUser != null ? currentUser.getUsername() : "null", currentUser != null ? currentUser.getRole() : "null", currentParticipant.isPresent());
        }

        boolean canComment = currentUser != null && canComment(campaign, currentUser);
        boolean canFeedback = currentParticipant
                .filter(p -> JOIN_APPROVED.equals(p.getJoinStatus()))
                .map(p -> isEnded
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
                .latitude(campaign.getLatitude())
                .longitude(campaign.getLongitude())
                .maxParticipants(campaign.getMaxParticipants())
                .startTime(campaign.getStartTime())
                .endTime(campaign.getEndTime())
                .status(isEnded ? "ENDED" : campaign.getStatus())
                .wardId(campaign.getWard() != null ? campaign.getWard().getId() : null)
                .wardName(campaign.getWard() != null ? campaign.getWard().getName() : null)
                .createdByUserId(campaign.getCreatedByUser().getId())
                .createdByName(campaign.getCreatedByUser().getFullName())
                .participantCount(participantCount)
                .currentUserJoinStatus(currentParticipant.map(CampaignParticipant::getJoinStatus).orElse(null))
                .privateDetailsVisible(privateDetailsVisible)
                .canJoin(canJoin)
                .canLeave(canLeave)
                .canManage(canManage)
                .canComment(canComment)
                .canFeedback(canFeedback)
                .createdAt(campaign.getCreatedAt())
                .updatedAt(campaign.getUpdatedAt())
                .linkedFeedbackId(campaign.getLinkedFeedbackId())
                .boundaryGeojson(campaign.getBoundaryGeojson())
                .coverImageUrl(campaign.getCoverImageUrl())
                .imageUrls(parseImageUrls(campaign.getImageUrls()))
                .build();
    }

    private CampaignParticipantResponse toParticipantResponse(CampaignParticipant participant) {
        long pastCampaignCount = participantRepository.countByCitizen_IdAndJoinStatus(participant.getCitizen().getId(), JOIN_APPROVED);
        long noShowCount = participantRepository.countByCitizen_IdAndJoinStatus(participant.getCitizen().getId(), JOIN_NO_SHOW);
        Double avg = feedbackRepository.getAverageRatingForCitizen(participant.getCitizen().getId());
        double averageRating = avg != null ? avg : 0.0;

        return CampaignParticipantResponse.builder()
                .id(participant.getId())
                .campaignId(participant.getCampaign().getId())
                .citizenId(participant.getCitizen().getId())
                .citizenName(participant.getCitizen().getFullName())
                .joinStatus(participant.getJoinStatus())
                .volunteerExperience(participant.getVolunteerExperience())
                .availabilityHours(participant.getAvailabilityHours())
                .cancellationReason(participant.getCancellationReason())
                .confirmationDeadline(participant.getConfirmationDeadline())
                .pastCampaignCount((int) pastCampaignCount)
                .averageRating(averageRating)
                .noShowCount((int) noShowCount)
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
                .pinned(message.isPinned())
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
        if (creator.getWard() == null) {
            throw new CustomException("Ward staff account is not assigned to a ward", HttpStatus.CONFLICT.value());
        }
        return creator.getWard();
    }

    private void assertCanViewCampaign(Campaign campaign, User user) {
        if (STATUS_PENDING_APPROVAL.equals(campaign.getStatus())
                && (user == null || (!canManage(campaign, user) && user.getRole() != Role.SUPER_ADMIN && user.getRole() != Role.WARD_STAFF))) {
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
                || (user.getRole() == Role.WARD_STAFF
                    && campaign.getWard() != null
                    && user.getWard() != null
                    && campaign.getWard().getId().equals(user.getWard().getId())));
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


    private List<String> parseImageUrls(String imageUrls) {
        if (imageUrls == null || imageUrls.isBlank()) {
            return List.of();
        }
        return List.of(imageUrls.split(","));
    }

    private String joinImageUrls(List<String> urls) {
        if (urls == null || urls.isEmpty()) {
            return null;
        }
        return String.join(",", urls.stream().filter(url -> url != null && !url.isBlank()).toList());
    }

    @Override
    @Transactional
    public void confirmWaitlist(Long campaignId, String username) {
        User citizen = requireUser(username);
        CampaignParticipant participant = participantRepository.findByCampaign_IdAndCitizen_Id(campaignId, citizen.getId())
                .orElseThrow(() -> new CustomException("Đăng ký không tồn tại.", HttpStatus.NOT_FOUND.value()));

        if (!JOIN_PENDING_CONFIRM.equals(participant.getJoinStatus())) {
            throw new CustomException("Bạn không ở trong danh sách chờ cần xác nhận.", HttpStatus.BAD_REQUEST.value());
        }

        if (participant.getConfirmationDeadline() != null && LocalDateTime.now().isAfter(participant.getConfirmationDeadline())) {
            participant.setJoinStatus(JOIN_CANCELLED);
            participant.setCancelledAt(LocalDateTime.now());
            participant.setCancellationReason("Hết hạn xác nhận chờ (2 giờ)");
            participantRepository.save(participant);

            promoteNextWaitlist(campaignId);
            throw new CustomException("Thời hạn xác nhận đã hết (quá 2 giờ). Hệ thống đã nhường chỗ cho người tiếp theo.", HttpStatus.BAD_REQUEST.value());
        }

        participant.setJoinStatus(JOIN_APPROVED);
        participant.setApprovedAt(LocalDateTime.now());
        participant.setConfirmationDeadline(null);
        participantRepository.save(participant);
    }

    @Override
    @Transactional
    public List<CampaignParticipantResponse> batchApproveParticipants(Long campaignId, CampaignBatchApproveRequest request, String username) {
        User manager = requireUser(username);
        Campaign campaign = getCampaign(campaignId);
        assertCanManage(campaign, manager);

        List<CampaignParticipant> updated = new ArrayList<>();
        long approvedCount = participantRepository.countByCampaign_IdAndJoinStatus(campaignId, JOIN_APPROVED);

        for (Long participantId : request.getParticipantIds()) {
            CampaignParticipant participant = getParticipant(participantId, campaignId);
            if (!JOIN_PENDING.equals(participant.getJoinStatus())) {
                continue;
            }

            if (campaign.getMaxParticipants() != null && approvedCount >= campaign.getMaxParticipants()) {
                throw new CustomException("Đã đạt giới hạn số lượng người tham gia tối đa của chiến dịch.", HttpStatus.CONFLICT.value());
            }

            participant.setJoinStatus(JOIN_APPROVED);
            participant.setApprovedBy(manager);
            participant.setApprovedAt(LocalDateTime.now());
            participant.setRejectedAt(null);
            participant.setRejectionReason(null);
            participant.setCancelledAt(null);
            participant.setConfirmationDeadline(null);
            updated.add(participantRepository.save(participant));
            approvedCount++;
        }

        return updated.stream().map(this::toParticipantResponse).toList();
    }

    @Override
    @Transactional
    public CampaignParticipantResponse markNoShow(Long campaignId, Long participantId, String username) {
        User manager = requireUser(username);
        Campaign campaign = getCampaign(campaignId);
        assertCanManage(campaign, manager);

        CampaignParticipant participant = getParticipant(participantId, campaignId);
        participant.setJoinStatus(JOIN_NO_SHOW);
        participant.setApprovedBy(null);
        participant.setApprovedAt(null);
        participant.setRejectedAt(null);
        participant.setRejectionReason("Cán bộ phường đánh giá vắng mặt không lý do");
        participant.setCancelledAt(LocalDateTime.now());
        
        return toParticipantResponse(participantRepository.save(participant));
    }

    @Override
    @Transactional
    public String sendEmailOtp(String username) {
        User user = requireUser(username);
        if (user.getEmail() == null || user.getEmail().isBlank()) {
            throw new CustomException("Tài khoản chưa được cấu hình email. Vui lòng cập nhật email trong hồ sơ.", HttpStatus.BAD_REQUEST.value());
        }
        return emailOtpService.generateAndSendOtp(user, user.getEmail());
    }

    @org.springframework.scheduling.annotation.Scheduled(fixedDelay = 60000)
    @Transactional
    public void processExpiredConfirmations() {
        List<CampaignParticipant> expired = participantRepository
                .findByJoinStatusAndConfirmationDeadlineBefore(JOIN_PENDING_CONFIRM, LocalDateTime.now());
        
        for (CampaignParticipant participant : expired) {
            log.info("[Waitlist] Participant {} expired waiting for confirmation on campaign {}", 
                    participant.getCitizen().getUsername(), participant.getCampaign().getId());
            participant.setJoinStatus(JOIN_CANCELLED);
            participant.setCancelledAt(LocalDateTime.now());
            participant.setCancellationReason("Hết hạn xác nhận chờ (quá 2 giờ)");
            participantRepository.save(participant);

            promoteNextWaitlist(participant.getCampaign().getId());
        }
    }
}

