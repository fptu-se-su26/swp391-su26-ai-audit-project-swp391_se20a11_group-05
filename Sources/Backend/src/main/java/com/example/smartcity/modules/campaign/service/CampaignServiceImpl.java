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
import com.example.smartcity.modules.campaign.dto.AttendanceBulkRequest;
import com.example.smartcity.modules.campaign.dto.CampaignChatRoomResponse;
import com.example.smartcity.modules.auth.service.EmailOtpService;
import com.example.smartcity.modules.notification.service.NotificationService;
import com.example.smartcity.modules.notification.service.ExternalNotificationService;
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
import com.example.smartcity.modules.core.service.LocationResolutionService;
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
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CampaignServiceImpl implements CampaignService {

    private static final String STATUS_RECRUITING = "RECRUITING";
    private static final String STATUS_IN_PROGRESS = "IN_PROGRESS";
    private static final String STATUS_COMPLETED = "COMPLETED";
    private static final String STATUS_CANCELLED_STR = "CANCELLED";
    private static final String JOIN_PENDING = "PENDING";
    private static final String JOIN_APPROVED = "APPROVED";
    private static final String JOIN_REJECTED = "REJECTED";
    private static final String JOIN_CANCELLED = "CANCELLED";
    private static final String JOIN_WAITLIST = "WAITLIST";
    private static final String JOIN_PENDING_CONFIRM = "PENDING_CONFIRM";
    private static final String JOIN_NO_SHOW = "NO_SHOW";
    private static final String JOIN_CONFIRMED = "CONFIRMED";
    private static final String JOIN_MAYBE = "MAYBE";
    private static final List<String> ATTENDING_STATUSES = List.of(JOIN_CONFIRMED, JOIN_MAYBE, JOIN_APPROVED);
    private static final List<String> ACTIVE_CHAT_STATUSES = List.of(JOIN_PENDING, JOIN_APPROVED, JOIN_CONFIRMED, JOIN_MAYBE);

    private final CampaignRepository campaignRepository;
    private final CampaignParticipantRepository participantRepository;
    private final CampaignCommentRepository commentRepository;
    private final CampaignChatMessageRepository chatMessageRepository;
    private final CampaignFeedbackRepository feedbackRepository;
    private final UserRepository userRepository;
    private final LocationResolutionService locationResolutionService;
    private final CampaignIngestionService campaignIngestionService;
    private final EmailOtpService emailOtpService;
    private final NotificationService notificationService;
    private final ExternalNotificationService externalNotificationService;
    private final com.example.smartcity.modules.user.service.UserService userService;

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

        List<Long> campaignIds = campaigns.stream().map(Campaign::getId).toList();
        Map<Long, Long> participantCounts = campaignIds.isEmpty()
                ? Map.of()
                : participantRepository.countByCampaignIdsAndJoinStatus(campaignIds, JOIN_APPROVED).stream()
                        .collect(Collectors.toMap(
                                CampaignParticipantRepository.CampaignParticipantCount::getCampaignId,
                                CampaignParticipantRepository.CampaignParticipantCount::getParticipantCount));

        return campaigns.map(campaign ->
                toResponse(campaign, currentUser, participantCounts.getOrDefault(campaign.getId(), 0L)));
    }

    @Override
    @Transactional(readOnly = true)
    public CampaignResponse getById(Long id, String username) {
        User currentUser = findUser(username).orElse(null);
        Campaign campaign = getCampaign(id);
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
        if (creator.getRole() != Role.WARD_STAFF && creator.getRole() != Role.POLICE && creator.getRole() != Role.SUPER_ADMIN) {
            throw new CustomException("Bạn không có quyền tạo chiến dịch", HttpStatus.FORBIDDEN.value());
        }

        Ward ward = resolveWard(creator);
        assertCampaignLocationWithinWard(request, ward);
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
                .minParticipants(request.getMinParticipants())
                .maxParticipants(request.getMaxParticipants())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .status(STATUS_RECRUITING)
                .linkedFeedbackId(request.getLinkedFeedbackId())
                .boundaryGeojson(request.getBoundaryGeojson())
                .coverImageUrl(request.getCoverImageUrl())
                .imageUrls(joinImageUrls(request.getImageUrls()))
                .build();

        validateMinMax(campaign.getMinParticipants(), campaign.getMaxParticipants());

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
    public CampaignResponse join(Long campaignId, CampaignJoinRequest request, String username) {
        User citizen = requireUser(username);
        if ("BANNED".equalsIgnoreCase(citizen.getStatus())) {
            throw new CustomException("Tài khoản của bạn đã bị khóa.", HttpStatus.FORBIDDEN.value());
        }
        if (citizen.isCampaignBanned()) {
            throw new CustomException("Tài khoản của bạn đã bị cấm đăng ký tham gia chiến dịch do vắng mặt quá 3 lần. Vui lòng gửi đơn xin mở khóa.", HttpStatus.FORBIDDEN.value());
        }
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
        String computedStatus = campaign.getStatus();
        if (!"CANCELLED".equals(computedStatus)) {
            if ("ENDED".equals(computedStatus)
                    || "COMPLETED".equals(computedStatus)
                    || (campaign.getEndTime() != null && now.isAfter(campaign.getEndTime()))) {
                computedStatus = "ENDED";
            } else if (campaign.getStartTime() != null && now.isAfter(campaign.getStartTime())) {
                computedStatus = "IN_PROGRESS";
            } else {
                computedStatus = "RECRUITING";
            }
        }
        if (!STATUS_RECRUITING.equals(computedStatus)) {
            throw new CustomException("Campaign is not open for registration", HttpStatus.CONFLICT.value());
        }

        long activeChatCount = participantRepository.countByCampaign_IdAndJoinStatusIn(campaignId, ACTIVE_CHAT_STATUSES);
        String targetStatus = JOIN_PENDING;
        if (campaign.getMaxParticipants() != null) {
            int cap = (campaign.getMaxParticipants() * 3 + 1) / 2;
            if (activeChatCount >= cap) {
                targetStatus = JOIN_WAITLIST;
            }
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
                    .approvedAt(null)
                    .build();
            participantRepository.save(participant);
        }

        notificationService.createCampaignNotification(
                campaign.getCreatedByUser(),
                campaignId,
                "Có tình nguyện viên đăng ký mới",
                String.format("Tình nguyện viên %s đã đăng ký tham gia chiến dịch '%s'.", citizen.getFullName(), campaign.getTitle()),
                "CAMPAIGN_JOINED"
        );

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

        boolean wasOccupyingSlot = List.of(JOIN_PENDING, JOIN_APPROVED, JOIN_CONFIRMED, JOIN_MAYBE, JOIN_PENDING_CONFIRM)
                .contains(participant.getJoinStatus());

        participant.setJoinStatus(JOIN_CANCELLED);
        participant.setApprovedBy(null);
        participant.setApprovedAt(null);
        participant.setRejectedAt(null);
        participant.setRejectionReason(null);
        participant.setCancelledAt(LocalDateTime.now());
        participant.setCancellationReason(request != null ? request.getReason() : "Hủy bởi người dùng");
        Integer currentCancelCount = participant.getCancelCount();
        participant.setCancelCount((currentCancelCount == null ? 0 : currentCancelCount.intValue()) + 1);
        participant.setConfirmationDeadline(null);
        participantRepository.save(participant);

        if (wasOccupyingSlot) {
            promoteNextWaitlist(campaignId);
        }

        notificationService.createCampaignNotification(
                campaign.getCreatedByUser(),
                campaignId,
                "Tình nguyện viên hủy tham gia",
                String.format("Tình nguyện viên %s đã hủy tham gia chiến dịch '%s'.", citizen.getFullName(), campaign.getTitle()),
                "CAMPAIGN_LEFT"
        );
    }

    private void promoteNextWaitlist(Long campaignId) {
        participantRepository.findFirstByCampaign_IdAndJoinStatusOrderByCreatedAtAsc(campaignId, JOIN_WAITLIST)
                .ifPresent(nextParticipant -> {
                    nextParticipant.setJoinStatus(JOIN_PENDING_CONFIRM);
                    nextParticipant.setConfirmationDeadline(LocalDateTime.now().plusMinutes(10));
                    participantRepository.save(nextParticipant);

                    // Send notification to citizen
                    notificationService.createCampaignNotification(
                            nextParticipant.getCitizen(),
                            campaignId,
                            "🔔 Xác nhận tham gia chiến dịch",
                            "Bạn đã được chọn từ danh sách chờ cho chiến dịch '" + nextParticipant.getCampaign().getTitle() + "'. Vui lòng xác nhận tham gia trong vòng 10 phút.",
                            "CAMPAIGN_WAITLIST_PROMOTE"
                    );
                });
    }

    @Override
    public List<CampaignParticipantResponse> getParticipants(Long campaignId, String username) {
        User user = requireUser(username);
        Campaign campaign = getCampaign(campaignId);
        if (!canViewPrivateDetails(campaign, user)) {
            throw new CustomException("You do not have permission to view participants of this campaign", HttpStatus.FORBIDDEN.value());
        }
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
        CampaignParticipantResponse response = toParticipantResponse(participantRepository.save(participant));

        notificationService.createCampaignNotification(
                participant.getCitizen(),
                campaignId,
                "Đăng ký chiến dịch được duyệt",
                String.format("Yêu cầu tham gia chiến dịch '%s' của bạn đã được duyệt.", campaign.getTitle()),
                "CAMPAIGN_APPROVED"
        );

        if (participant.getCitizen().getEmail() != null && !participant.getCitizen().getEmail().isBlank()) {
            String subject = "[SmartCity] Đăng ký tham gia chiến dịch được duyệt";
            String body = String.format("Chào %s,\n\nYêu cầu tham gia chiến dịch \"%s\" của bạn đã được duyệt thành công.\n\nTrân trọng,\nBan Quản Trị SmartCity",
                    participant.getCitizen().getFullName(), campaign.getTitle());
            externalNotificationService.sendEmailNotification(participant.getCitizen().getEmail(), subject, body);
        }

        return response;
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
        boolean wasOccupyingSlot = List.of(JOIN_PENDING, JOIN_APPROVED, JOIN_CONFIRMED, JOIN_MAYBE, JOIN_PENDING_CONFIRM)
                .contains(participant.getJoinStatus());

        participant.setJoinStatus(JOIN_REJECTED);
        participant.setApprovedBy(null);
        participant.setApprovedAt(null);
        participant.setRejectedAt(LocalDateTime.now());
        participant.setRejectionReason(request != null ? blankToNull(request.getReason()) : null);
        participant.setCancelledAt(null);
        
        CampaignParticipantResponse res = toParticipantResponse(participantRepository.save(participant));
        
        if (wasOccupyingSlot) {
            promoteNextWaitlist(campaignId);
        }

        String reason = request != null && request.getReason() != null && !request.getReason().isBlank()
                ? request.getReason() : "Không phù hợp với chiến dịch.";
        notificationService.createCampaignNotification(
                participant.getCitizen(),
                campaignId,
                "Đăng ký chiến dịch bị từ chối",
                String.format("Yêu cầu tham gia chiến dịch '%s' của bạn đã bị từ chối. Lý do: %s", campaign.getTitle(), reason),
                "CAMPAIGN_REJECTED"
        );

        if (participant.getCitizen().getEmail() != null && !participant.getCitizen().getEmail().isBlank()) {
            String subject = "[SmartCity] Đăng ký tham gia chiến dịch bị từ chối";
            String body = String.format("Chào %s,\n\nYêu cầu tham gia chiến dịch \"%s\" của bạn đã bị từ chối.\nLý do: %s\n\nTrân trọng,\nBan Quản Trị SmartCity",
                    participant.getCitizen().getFullName(), campaign.getTitle(), reason);
            externalNotificationService.sendEmailNotification(participant.getCitizen().getEmail(), subject, body);
        }

        return res;
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
    @Transactional(readOnly = true)
    public List<CampaignChatMessageResponse> getChatMessages(Long campaignId, Long beforeId, String username) {
        User currentUser = requireUser(username);
        Campaign campaign = getCampaign(campaignId);
        assertCanAccessCampaignChat(campaign, currentUser);

        List<CampaignChatMessage> messages;
        if (beforeId == null) {
            messages = new ArrayList<>(chatMessageRepository.findTop15ByCampaign_IdOrderByCreatedAtDesc(campaignId));

            // Luôn kèm tất cả tin nhắn đang ghim, kể cả những tin cũ ngoài top 15 vào trang đầu tiên
            List<CampaignChatMessage> pinnedMessages = chatMessageRepository.findByCampaign_IdAndPinnedTrue(campaignId);
            for (CampaignChatMessage pinned : pinnedMessages) {
                if (messages.stream().noneMatch(m -> m.getId().equals(pinned.getId()))) {
                    messages.add(pinned);
                }
            }
        } else {
            messages = new ArrayList<>(chatMessageRepository.findPageBefore(
                campaignId,
                beforeId,
                org.springframework.data.domain.PageRequest.of(0, 15)
            ));
        }

        // Sắp xếp lại theo thời gian tăng dần
        messages.sort(java.util.Comparator.comparing(CampaignChatMessage::getCreatedAt));
        return messages.stream().map(this::toChatResponse).toList();
    }

    @Override
    @Transactional
    public CampaignChatMessageResponse addChatMessage(Long campaignId, CampaignMessageRequest request, String username) {
        User sender = requireUser(username);
        Campaign campaign = getCampaign(campaignId);
        assertCanAccessCampaignChat(campaign, sender);

        if (campaign.isAnnouncementMode() && !canManage(campaign, sender)) {
            throw new CustomException("Chế độ thông báo đang bật. Chỉ cán bộ mới được nhắn tin.", HttpStatus.FORBIDDEN.value());
        }

        LocalDateTime now = LocalDateTime.now();
        String status = campaign.getStatus();
        boolean isEndedOrCancelled = "CANCELLED".equals(status)
                || "ENDED".equals(status)
                || "COMPLETED".equals(status)
                || (campaign.getEndTime() != null && now.isAfter(campaign.getEndTime()));

        if (isEndedOrCancelled && !canManage(campaign, sender)) {
            throw new CustomException("Chiến dịch đã kết thúc hoặc bị hủy. Chỉ cán bộ mới được nhắn tin.", HttpStatus.FORBIDDEN.value());
        }

        CampaignChatMessage message = CampaignChatMessage.builder()
                .campaign(campaign)
                .sender(sender)
                .message(request.getContent() != null ? request.getContent().trim() : "")
                .imageUrl(joinImageUrls(request.getImageUrls()))
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

        if (message.isPinned()) {
            return toChatResponse(message);
        }

        long pinnedCount = chatMessageRepository.countByCampaign_IdAndPinnedTrue(campaignId);
        if (pinnedCount >= 3) {
            throw new CustomException("Chiến dịch chỉ được ghim tối đa 3 tin nhắn. Vui lòng bỏ ghim bớt tin nhắn cũ trước.", HttpStatus.BAD_REQUEST.value());
        }

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
    @Transactional
    public void deleteChatMessage(Long campaignId, Long messageId, String username) {
        User manager = requireUser(username);
        Campaign campaign = getCampaign(campaignId);
        assertCanManage(campaign, manager);

        CampaignChatMessage message = chatMessageRepository.findById(messageId)
                .orElseThrow(() -> new CustomException("Message not found", HttpStatus.NOT_FOUND.value()));
        if (!message.getCampaign().getId().equals(campaignId)) {
            throw new CustomException("Message does not belong to this campaign", HttpStatus.BAD_REQUEST.value());
        }

        chatMessageRepository.delete(message);
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
        assertCampaignLocationWithinWard(request, campaign.getWard());

        boolean scheduleUpdated = !java.util.Objects.equals(campaign.getStartTime(), request.getStartTime()) 
                || !java.util.Objects.equals(campaign.getEndTime(), request.getEndTime())
                || !java.util.Objects.equals(campaign.getLocationText(), request.getLocationText());

        campaign.setTitle(request.getTitle());
        campaign.setDescription(request.getDescription());
        campaign.setCategory(blankToNull(request.getCategory()));
        campaign.setLocationText(request.getLocationText());
        campaign.setPrivateLocationText(request.getPrivateLocationText());
        campaign.setRequiredTools(request.getRequiredTools());
        campaign.setOrganizerContact(request.getOrganizerContact());
        campaign.setLatitude(request.getLatitude());
        campaign.setLongitude(request.getLongitude());
        campaign.setMinParticipants(request.getMinParticipants());
        campaign.setMaxParticipants(request.getMaxParticipants());
        campaign.setStartTime(request.getStartTime());
        campaign.setEndTime(request.getEndTime());
        campaign.setBoundaryGeojson(request.getBoundaryGeojson());
        campaign.setCoverImageUrl(request.getCoverImageUrl());
        campaign.setImageUrls(joinImageUrls(request.getImageUrls()));
        validateMinMax(campaign.getMinParticipants(), campaign.getMaxParticipants());

        // Nếu dời lịch khởi chạy sang tương lai, tự động reset trạng thái về RECRUITING
        if (campaign.getStartTime() != null && campaign.getStartTime().isAfter(LocalDateTime.now())) {
            campaign.setStatus("RECRUITING");
        }

        Campaign saved = campaignRepository.save(campaign);
        campaignIngestionService.ingestCampaignAsync(saved);

        if (scheduleUpdated) {
            notificationService.notifyCampaignRescheduled(id, campaign.getTitle(), campaign.getCreatedByUser());
        }

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
    public CampaignResponse endCampaign(Long id, String reason, String username) {
        User user = requireUser(username);
        Campaign campaign = getCampaign(id);
        assertCanManage(campaign, user);

        if ("RECRUITING".equals(campaign.getStatus())) {
            campaign.setStatus("CANCELLED");
            campaign.setCancellationReason(reason != null && !reason.isBlank() ? reason : "Cán bộ hủy chiến dịch.");
            notificationService.notifyCampaignCancelled(id, campaign.getTitle(), campaign.getCancellationReason(), campaign.getCreatedByUser());
        } else {
            campaign.setStatus("ENDED");
            
            // Tự động chốt điểm danh vắng mặt cho các thành viên chưa được điểm danh có mặt
            List<CampaignParticipant> remaining = participantRepository.findByCampaign_IdAndJoinStatusIn(id, List.of(JOIN_APPROVED));
            LocalDateTime now = LocalDateTime.now();
            for (CampaignParticipant participant : remaining) {
                if (participant.getAttendedAt() == null) {
                    participant.setAttended(false);
                    participant.setAttendedAt(now);
                    participant.setRejectionReason("Hệ thống tự động đánh dấu vắng mặt do không tham gia điểm danh");
                    CampaignParticipant saved = participantRepository.save(participant);
                    verifyAndApplyCampaignBan(saved.getCitizen(), campaign);
                }
            }

            // Thông báo kết thúc chiến dịch thủ công
            notificationService.notifyCampaignEndedManually(id, campaign.getTitle(), campaign.getCreatedByUser());
        }
        return toResponse(campaignRepository.save(campaign), user);
    }

    private CampaignResponse toResponse(Campaign campaign, User currentUser) {
        long participantCount = participantRepository.countByCampaign_IdAndJoinStatus(campaign.getId(), JOIN_APPROVED);
        return toResponse(campaign, currentUser, participantCount);
    }

    private CampaignResponse toResponse(Campaign campaign, User currentUser, long participantCount) {
        Optional<CampaignParticipant> currentParticipant =
                currentUser == null || currentUser.getRole() != Role.CITIZEN
                ? Optional.empty()
                : participantRepository.findByCampaign_IdAndCitizen_Id(campaign.getId(), currentUser.getId());

        LocalDateTime now = LocalDateTime.now();
        // DB status là source of truth. Chỉ override sang ENDED nếu đã quá endTime
        // (hoặc status DB đã là ENDED/COMPLETED).
        // KHÔNG tự suy diễn IN_PROGRESS từ startTime — cán bộ phải chốt thủ công.
        String displayStatus = campaign.getStatus();
        if (!"CANCELLED".equals(displayStatus)) {
            if ("ENDED".equals(displayStatus)
                    || "COMPLETED".equals(displayStatus)
                    || (campaign.getEndTime() != null && now.isAfter(campaign.getEndTime()))) {
                displayStatus = "ENDED";
            }
            // Nếu status là RECRUITING hoặc IN_PROGRESS → giữ nguyên giá trị từ DB
        }

        boolean isEnded = "ENDED".equals(displayStatus);

        boolean canManage = currentUser != null && canManage(campaign, currentUser);
        boolean privateDetailsVisible = currentUser != null && canViewPrivateDetails(campaign, currentUser);
        boolean canJoin = currentUser != null
                && currentUser.getRole() == Role.CITIZEN
                && !isEnded
                && "RECRUITING".equals(displayStatus)
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
                .minParticipants(campaign.getMinParticipants())
                .maxParticipants(campaign.getMaxParticipants())
                .startTime(campaign.getStartTime())
                .endTime(campaign.getEndTime())
                .status(displayStatus)
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
                .announcementMode(campaign.isAnnouncementMode())
                .cancellationReason(campaign.getCancellationReason())
                .createdAt(campaign.getCreatedAt())
                .updatedAt(campaign.getUpdatedAt())
                .linkedFeedbackId(campaign.getLinkedFeedbackId())
                .boundaryGeojson(campaign.getBoundaryGeojson())
                .coverImageUrl(campaign.getCoverImageUrl())
                .imageUrls(parseImageUrls(campaign.getImageUrls()))
                .build();
    }

    private String maskPhone(String phone) {
        if (phone == null || phone.length() < 7) return phone;
        return phone.substring(0, 4) + "***" + phone.substring(7);
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
                .confirmedAt(participant.getConfirmedAt())
                .attended(participant.getAttended())
                .attendedAt(participant.getAttendedAt())
                .citizenPhone(maskPhone(participant.getCitizen().getPhoneNumber()))
                .campaignTitle(participant.getCampaign().getTitle())
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
        String senderAvatar = null;
        Integer pastCampaignCount = null;
        if (message.getSender() != null) {
            senderAvatar = message.getSender().getAvatarUrl();
            if (message.getSender().getRole() == com.example.smartcity.modules.user.entity.Role.CITIZEN) {
                pastCampaignCount = (int) participantRepository.countByCitizen_IdAndJoinStatus(
                        message.getSender().getId(),
                        JOIN_APPROVED
                );
            }
        }
        return CampaignChatMessageResponse.builder()
                .id(message.getId())
                .senderId(message.getSender() != null ? message.getSender().getId() : null)
                .senderName(message.getSender() != null ? message.getSender().getFullName() : "")
                .senderRole(message.getSender() != null ? message.getSender().getRole().name() : "")
                .message(message.getMessage())
                .imageUrls(parseImageUrls(message.getImageUrl()))
                .pinned(message.isPinned())
                .createdAt(message.getCreatedAt())
                .senderAvatar(senderAvatar)
                .pastCampaignCount(pastCampaignCount)
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

    private Ward resolveWard(User creator) {
        if (creator.getWard() == null && creator.getRole() != Role.SUPER_ADMIN && creator.getRole() != Role.POLICE) {
            throw new CustomException("Tài khoản chưa được phân công quản lý phường/xã", HttpStatus.CONFLICT.value());
        }
        return creator.getWard();
    }

    private void assertCampaignLocationWithinWard(CampaignRequest request, Ward assignedWard) {
        if (assignedWard == null) {
            return;
        }
        if (request.getLatitude() == null || request.getLongitude() == null) {
            return;
        }

        Ward resolvedWard = locationResolutionService.resolveWard(request.getLatitude(), request.getLongitude());
        if (resolvedWard == null || resolvedWard.getId() == null || !resolvedWard.getId().equals(assignedWard.getId())) {
            String assignedWardName = assignedWard.getName() != null ? assignedWard.getName() : "ward được phân công";
            String resolvedWardName = resolvedWard != null && resolvedWard.getName() != null
                    ? resolvedWard.getName()
                    : "khu vực khác";
            throw new CustomException(
                    "Địa điểm chiến dịch nằm ngoài địa bàn " + assignedWardName
                            + " (hệ thống xác định là " + resolvedWardName + ").",
                    HttpStatus.FORBIDDEN.value());
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
        if (user != null && "BANNED".equalsIgnoreCase(user.getStatus())) {
            throw new CustomException("Tài khoản của bạn đã bị khóa.", HttpStatus.FORBIDDEN.value());
        }
        if (!canComment(campaign, user)) {
            throw new CustomException("Only campaign managers and approved participants can comment", HttpStatus.FORBIDDEN.value());
        }
    }

    private boolean canManage(Campaign campaign, User user) {
        return user != null
                && (user.getRole() == Role.SUPER_ADMIN
                || (user.getRole() == Role.POLICE && campaign.getCreatedByUser() != null && campaign.getCreatedByUser().getId().equals(user.getId()))
                || (user.getRole() == Role.WARD_STAFF
                    && campaign.getWard() != null
                    && user.getWard() != null
                    && campaign.getWard().getId().equals(user.getWard().getId())));
    }

    private boolean canViewPrivateDetails(Campaign campaign, User user) {
        return canManage(campaign, user)
                || (user != null && participantRepository
                .findByCampaign_IdAndCitizen_Id(campaign.getId(), user.getId())
                .map(participant -> JOIN_APPROVED.equals(participant.getJoinStatus())
                        || JOIN_CONFIRMED.equals(participant.getJoinStatus())
                        || JOIN_MAYBE.equals(participant.getJoinStatus()))
                .orElse(false));
    }

    private boolean canComment(Campaign campaign, User user) {
        return canViewPrivateDetails(campaign, user);
    }

    private boolean canAccessCampaignChat(Campaign campaign, User user) {
        if (user == null) return false;
        // Managers always have access
        if (canManage(campaign, user)) return true;
        
        return participantRepository.findByCampaign_IdAndCitizen_Id(campaign.getId(), user.getId())
                .map(participant -> ACTIVE_CHAT_STATUSES.contains(participant.getJoinStatus()))
                .orElse(false);
    }

    private void assertCanAccessCampaignChat(Campaign campaign, User user) {
        if (user != null && "BANNED".equalsIgnoreCase(user.getStatus())) {
            throw new CustomException("Tài khoản của bạn đã bị khóa.", HttpStatus.FORBIDDEN.value());
        }
        if (!canAccessCampaignChat(campaign, user)) {
            throw new CustomException("Bạn không có quyền truy cập kênh chat của chiến dịch này.", HttpStatus.FORBIDDEN.value());
        }
    }

    private void validateMinMax(Integer min, Integer max) {
        if (min != null && max != null && min > max) {
            throw new CustomException("Số người tối thiểu không được lớn hơn số người tối đa.", HttpStatus.BAD_REQUEST.value());
        }
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
            participant.setCancellationReason("Hết hạn xác nhận chờ (10 phút)");
            participantRepository.save(participant);

            promoteNextWaitlist(campaignId);
            throw new CustomException("Thời hạn xác nhận đã hết (quá 10 phút). Hệ thống đã nhường chỗ cho người tiếp theo.", HttpStatus.BAD_REQUEST.value());
        }

        participant.setJoinStatus(JOIN_PENDING);
        participant.setApprovedAt(null);
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
            if (!JOIN_CONFIRMED.equals(participant.getJoinStatus())) {
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

            notificationService.createCampaignNotification(
                    participant.getCitizen(),
                    campaignId,
                    "Đăng ký chiến dịch được duyệt",
                    String.format("Yêu cầu tham gia chiến dịch '%s' của bạn đã được duyệt.", campaign.getTitle()),
                    "CAMPAIGN_APPROVED"
            );

            if (participant.getCitizen().getEmail() != null && !participant.getCitizen().getEmail().isBlank()) {
                String subject = "[SmartCity] Đăng ký tham gia chiến dịch được duyệt";
                String body = String.format("Chào %s,\n\nYêu cầu tham gia chiến dịch \"%s\" của bạn đã được duyệt thành công.\n\nTrân trọng,\nBan Quản Trị SmartCity",
                        participant.getCitizen().getFullName(), campaign.getTitle());
                externalNotificationService.sendEmailNotification(participant.getCitizen().getEmail(), subject, body);
            }
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
        participant.setJoinStatus(JOIN_APPROVED);
        participant.setAttended(false);
        participant.setAttendedAt(LocalDateTime.now());
        participant.setRejectionReason("Cán bộ phường đánh giá vắng mặt không lý do");
        
        CampaignParticipant saved = participantRepository.save(participant);
        verifyAndApplyCampaignBan(saved.getCitizen(), campaign);
        return toParticipantResponse(saved);
    }

    @Override
    @Transactional
    public String sendEmailOtp(String username) {
        User user = requireUser(username);
        if ("BANNED".equalsIgnoreCase(user.getStatus())) {
            throw new CustomException("Tài khoản của bạn đã bị khóa.", HttpStatus.FORBIDDEN.value());
        }
        if (user.isCampaignBanned()) {
            throw new CustomException("Tài khoản của bạn đã bị cấm đăng ký tham gia chiến dịch do vắng mặt quá 3 lần. Vui lòng gửi đơn xin mở khóa.", HttpStatus.FORBIDDEN.value());
        }
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
            participant.setCancellationReason("Hết hạn xác nhận chờ (quá 10 phút)");
            participantRepository.save(participant);

            promoteNextWaitlist(participant.getCampaign().getId());
        }
    }

    @Override
    @Transactional
    public CampaignParticipantResponse signalAttendance(Long campaignId, String username, String signal) {
        if (!JOIN_CONFIRMED.equals(signal) && !JOIN_MAYBE.equals(signal)) {
            throw new CustomException("Tín hiệu xác nhận không hợp lệ. Chỉ chấp nhận CONFIRMED hoặc MAYBE.", HttpStatus.BAD_REQUEST.value());
        }
        User citizen = requireUser(username);
        if (citizen.getRole() != Role.CITIZEN) {
            throw new CustomException("Chỉ công dân mới có thể gửi tín hiệu xác nhận.", HttpStatus.FORBIDDEN.value());
        }
        Campaign campaign = getCampaign(campaignId);

        // Chỉ cho phép xác nhận khi DB status là RECRUITING
        if (!STATUS_RECRUITING.equals(campaign.getStatus())) {
            throw new CustomException("Chiến dịch không ở trạng thái tuyển quân.", HttpStatus.CONFLICT.value());
        }

        if (campaign.getStartTime() == null) {
            throw new CustomException("Chiến dịch chưa có thời gian bắt đầu.", HttpStatus.BAD_REQUEST.value());
        }
        LocalDateTime now = LocalDateTime.now();
        if (now.isAfter(campaign.getStartTime()) || now.isBefore(campaign.getStartTime().minusHours(24))) {
            throw new CustomException("Chỉ có thể xác nhận trong vòng 24 giờ trước khi chiến dịch bắt đầu.", HttpStatus.BAD_REQUEST.value());
        }

        CampaignParticipant participant = participantRepository
                .findByCampaign_IdAndCitizen_Id(campaignId, citizen.getId())
                .orElseThrow(() -> new CustomException("Bạn chưa đăng ký tham gia chiến dịch này.", HttpStatus.NOT_FOUND.value()));
        if (!JOIN_APPROVED.equals(participant.getJoinStatus()) && !JOIN_PENDING.equals(participant.getJoinStatus()) && !JOIN_CONFIRMED.equals(participant.getJoinStatus()) && !JOIN_MAYBE.equals(participant.getJoinStatus())) {
            throw new CustomException("Chỉ người tham gia đã đăng ký mới có thể gửi tín hiệu xác nhận.", HttpStatus.BAD_REQUEST.value());
        }
        participant.setJoinStatus(signal);
        if (JOIN_CONFIRMED.equals(signal)) {
            participant.setConfirmedAt(now);
            participant.setApprovedAt(null); // Bắt chờ Ward duyệt

            notificationService.createCampaignNotification(
                    campaign.getCreatedByUser(),
                    campaignId,
                    "Xác nhận tham gia chiến dịch",
                    String.format("Tình nguyện viên %s đã xác nhận tham gia chiến dịch '%s' và đang chờ duyệt.", citizen.getFullName(), campaign.getTitle()),
                    "CAMPAIGN_CONFIRMED"
            );
        } else if (JOIN_MAYBE.equals(signal)) {
            participant.setConfirmedAt(null);
            participant.setApprovedAt(null); // MAYBE không được duyệt (không điểm danh)
        }
        return toParticipantResponse(participantRepository.save(participant));
    }

    @Override
    @Transactional
    public CampaignResponse finalizeCampaign(Long campaignId, String username) {
        User manager = requireUser(username);
        Campaign campaign = getCampaign(campaignId);
        assertCanManage(campaign, manager);

        // Chỉ cho phép chốt khi DB status đang là RECRUITING
        if (!STATUS_RECRUITING.equals(campaign.getStatus())) {
            throw new CustomException("Chiến dịch phải ở trạng thái tuyển quân (RECRUITING) mới có thể chốt.", HttpStatus.CONFLICT.value());
        }

        // Bắt buộc phải đã đến giờ bắt đầu
        LocalDateTime now = LocalDateTime.now();
        if (campaign.getStartTime() != null && now.isBefore(campaign.getStartTime())) {
            throw new CustomException(
                    "Chưa đến giờ bắt đầu chiến dịch. Chỉ có thể chốt khi đã đến hoặc qua thời điểm bắt đầu.",
                    HttpStatus.BAD_REQUEST.value());
        }

        long attendingCount = participantRepository.countByCampaign_IdAndJoinStatusIn(campaignId, ATTENDING_STATUSES);

        // Nếu thiếu người tối thiểu → báo lỗi, không tự hủy (Scheduler sẽ xử lý hủy tự động)
        if (campaign.getMinParticipants() != null && attendingCount < campaign.getMinParticipants()) {
            throw new CustomException(
                    "Chiến dịch chưa đủ số người tối thiểu (" + attendingCount + "/" + campaign.getMinParticipants()
                            + " người). Hệ thống sẽ tự động hủy chiến dịch này.",
                    HttpStatus.CONFLICT.value());
        }

        // Đủ điều kiện → chốt chính thức sang IN_PROGRESS
        campaign.setStatus(STATUS_IN_PROGRESS);
        Campaign saved = campaignRepository.save(campaign);
        notificationService.notifyCampaignFinalized(campaignId, campaign.getTitle(), campaign.getCreatedByUser());
        return toResponse(saved, manager);
    }


    @Override
    @Transactional
    public CampaignResponse setAnnouncementMode(Long campaignId, boolean enabled, String username) {
        User manager = requireUser(username);
        Campaign campaign = getCampaign(campaignId);
        assertCanManage(campaign, manager);
        campaign.setAnnouncementMode(enabled);
        return toResponse(campaignRepository.save(campaign), manager);
    }

    @Override
    @Transactional(readOnly = true)
    public CampaignParticipantResponse lookupParticipantByPhone(Long campaignId, String phone, String username) {
        User manager = requireUser(username);
        Campaign campaign = getCampaign(campaignId);
        assertCanManage(campaign, manager);

        CampaignParticipant participant = participantRepository
                .findByCampaign_IdAndCitizen_PhoneNumberAndJoinStatus(campaignId, phone, JOIN_APPROVED)
                .orElseThrow(() -> new CustomException("Không tìm thấy tình nguyện viên nào đã được duyệt với số điện thoại này.", HttpStatus.NOT_FOUND.value()));

        return toParticipantResponse(participant);
    }

    @Override
    @Transactional
    public List<CampaignParticipantResponse> bulkSaveAttendance(Long campaignId, AttendanceBulkRequest request, String username) {
        User manager = requireUser(username);
        Campaign campaign = getCampaign(campaignId);
        assertCanManage(campaign, manager);

        if (!STATUS_IN_PROGRESS.equals(campaign.getStatus()) && !STATUS_COMPLETED.equals(campaign.getStatus()) && !"ENDED".equals(campaign.getStatus())) {
            throw new CustomException("Chỉ có thể điểm danh khi chiến dịch đang diễn ra hoặc đã kết thúc.", HttpStatus.BAD_REQUEST.value());
        }

        List<CampaignParticipantResponse> responses = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        for (AttendanceBulkRequest.AttendanceItem item : request.getAttendances()) {
            CampaignParticipant participant = getParticipant(item.getParticipantId(), campaignId);
            
            if (!JOIN_APPROVED.equals(participant.getJoinStatus()) && !JOIN_NO_SHOW.equals(participant.getJoinStatus())) {
                continue;
            }

            participant.setAttended(item.isAttended());
            participant.setAttendedAt(now);
            
            if (item.isAttended()) {
                participant.setJoinStatus(JOIN_APPROVED);
                participant.setRejectionReason(null);
            } else {
                participant.setJoinStatus(JOIN_APPROVED);
                participant.setRejectionReason("Cán bộ phường đánh giá vắng mặt không lý do");
            }

            CampaignParticipant saved = participantRepository.save(participant);
            if (!item.isAttended()) {
                verifyAndApplyCampaignBan(saved.getCitizen(), campaign);
            }
            responses.add(toParticipantResponse(saved));
        }

        return responses;
    }

    @Override
    @Transactional(readOnly = true)
    public List<CampaignParticipantResponse> getCitizenParticipationHistory(Long citizenId, String username) {
        User currentUser = requireUser(username);

        boolean isAuthorized = currentUser.getRole() == Role.SUPER_ADMIN
                || currentUser.getRole() == Role.WARD_STAFF
                || currentUser.getRole() == Role.POLICE
                || currentUser.getId().equals(citizenId);

        if (!isAuthorized) {
            throw new CustomException("Bạn không có quyền truy cập thông tin lịch sử tham gia của tài khoản này.", 403);
        }

        if (currentUser.getRole() == Role.WARD_STAFF || currentUser.getRole() == Role.POLICE) {
            if (currentUser.getWard() != null) {
                boolean hasPermission = participantRepository.existsByCitizenIdAndWardId(citizenId, currentUser.getWard().getId());
                if (!hasPermission) {
                    throw new CustomException("Bạn không có quyền truy cập thông tin lịch sử tham gia của tài khoản này.", 403);
                }
            } else {
                throw new CustomException("Tài khoản của bạn chưa được gán khu vực phường quản lý.", 403);
            }
        }

        List<CampaignParticipant> history = participantRepository.findByCitizen_IdOrderByCampaign_StartTimeDesc(citizenId);
        List<CampaignParticipantResponse> responses = new java.util.ArrayList<>();
        for (CampaignParticipant participant : history) {
            responses.add(toParticipantResponse(participant));
        }
        return responses;
    }

    @Override
    @Transactional(readOnly = true)
    public List<CampaignChatRoomResponse> getMyChatRooms(String username) {
        User user = requireUser(username);
        List<Campaign> campaigns = new ArrayList<>();

        if (user.getRole() == Role.SUPER_ADMIN) {
            campaigns = campaignRepository.findAll();
        } else if (user.getRole() == Role.WARD_STAFF) {
            if (user.getWard() != null) {
                campaigns = campaignRepository.findByWard_Id(user.getWard().getId());
            }
        } else {
            // Citizen, Police: get from participants table
            List<CampaignParticipant> participations = participantRepository.findByCitizen_IdOrderByCampaign_StartTimeDesc(user.getId());
            for (CampaignParticipant p : participations) {
                if (ACTIVE_CHAT_STATUSES.contains(p.getJoinStatus())) {
                    campaigns.add(p.getCampaign());
                }
            }
        }

        List<CampaignChatRoomResponse> responses = new ArrayList<>();
        for (Campaign campaign : campaigns) {
            List<CampaignChatMessage> messages = chatMessageRepository.findTop15ByCampaign_IdOrderByCreatedAtDesc(campaign.getId());
            CampaignChatMessageResponse lastMessageDto = null;
            if (messages != null && !messages.isEmpty()) {
                lastMessageDto = toChatResponse(messages.get(0));
            }

            responses.add(CampaignChatRoomResponse.builder()
                    .campaignId(campaign.getId())
                    .campaignTitle(campaign.getTitle())
                    .coverImageUrl(campaign.getCoverImageUrl())
                    .status(campaign.getStatus())
                    .lastMessage(lastMessageDto)
                    .build());
        }

        // Sort responses by last message createdAt or campaign start time, desc
        responses.sort((r1, r2) -> {
            java.time.LocalDateTime t1 = r1.getLastMessage() != null ? r1.getLastMessage().getCreatedAt() : java.time.LocalDateTime.MIN;
            java.time.LocalDateTime t2 = r2.getLastMessage() != null ? r2.getLastMessage().getCreatedAt() : java.time.LocalDateTime.MIN;
            return t2.compareTo(t1);
        });

        return responses;
    }

    @org.springframework.scheduling.annotation.Scheduled(fixedDelay = 300000)
    @Transactional
    public void autoTransitionPendingToMaybe() {
        LocalDateTime threshold = LocalDateTime.now().plusHours(2);
        List<CampaignParticipant> pendingParticipants = participantRepository
                .findByJoinStatusAndCampaign_StartTimeBefore(JOIN_PENDING, threshold);
        
        for (CampaignParticipant participant : pendingParticipants) {
            log.info("[Attendance] Auto transitioning pending participant {} to MAYBE for campaign {}", 
                    participant.getCitizen().getUsername(), participant.getCampaign().getId());
            participant.setJoinStatus(JOIN_MAYBE);
            participantRepository.save(participant);
        }
    }

    private void verifyAndApplyCampaignBan(User citizen, Campaign campaign) {
        long threshold = citizen.getLastCampaignUnbanAt() == null ? 3 : 1;
        long noShowCount = citizen.getLastCampaignUnbanAt() == null
                ? participantRepository.countNoShowCampaigns(citizen.getId())
                : participantRepository.countNoShowCampaignsAfter(citizen.getId(), citizen.getLastCampaignUnbanAt());

        if (noShowCount == 2 && citizen.getLastCampaignUnbanAt() == null) {
            notificationService.createCampaignNotification(
                    citizen,
                    campaign.getId(),
                    "Cảnh cáo vắng mặt chiến dịch",
                    String.format("Bạn đã vắng mặt 2 lần tại các chiến dịch cộng đồng (lần gần nhất tại '%s'). Nếu tiếp tục vắng mặt lần thứ 3, tài khoản của bạn sẽ bị cấm tham gia chiến dịch mới.", campaign.getTitle()),
                    "CAMPAIGN_WARNING"
            );
            if (citizen.getEmail() != null && !citizen.getEmail().isBlank()) {
                String subject = "[SmartCity] Cảnh báo vắng mặt tham gia chiến dịch";
                String body = String.format("Chào %s,\n\nBạn đã vắng mặt 2 lần tại các chiến dịch cộng đồng (lần gần nhất tại chiến dịch: \"%s\").\n\nNếu tiếp tục vắng mặt lần thứ 3, tài khoản của bạn sẽ bị cấm đăng ký tham gia mọi chiến dịch cộng đồng mới.\n\nVui lòng sắp xếp thời gian tham gia đầy đủ để tránh ảnh hưởng đến quyền lợi thành viên.\n\nTrân trọng,\nBan Quản Trị SmartCity",
                        citizen.getFullName(), campaign.getTitle());
                externalNotificationService.sendEmailNotification(citizen.getEmail(), subject, body);
            }
        }

        boolean banned = userService.checkAndBanFromCampaigns(citizen.getId(), campaign.getTitle());
        if (banned) {
            notificationService.createCampaignNotification(
                    citizen,
                    campaign.getId(),
                    "Bị cấm tham gia chiến dịch",
                    String.format("Tài khoản của bạn đã bị cấm đăng ký tham gia chiến dịch cộng đồng mới do vắng mặt lần thứ 3 tại chiến dịch '%s'. Bạn có thể gửi đơn xin mở khóa trong trang cá nhân.", campaign.getTitle()),
                    "CAMPAIGN_BANNED"
            );
            if (citizen.getEmail() != null && !citizen.getEmail().isBlank()) {
                String subject = "[SmartCity] Tài khoản bị cấm tham gia chiến dịch";
                String body = String.format("Chào %s,\n\nTài khoản của bạn đã bị cấm đăng ký tham gia chiến dịch cộng đồng mới do vắng mặt quá 3 lần (lần thứ 3 vắng mặt tại chiến dịch: \"%s\").\n\nBạn có thể gửi đơn giải trình trực tuyến trên ứng dụng để được Cán bộ phường phê duyệt mở khóa.\n\nTrân trọng,\nBan Quản Trị SmartCity",
                        citizen.getFullName(), campaign.getTitle());
                externalNotificationService.sendEmailNotification(citizen.getEmail(), subject, body);
            }
        }
    }
}

