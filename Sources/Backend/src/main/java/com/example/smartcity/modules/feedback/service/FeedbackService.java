package com.example.smartcity.modules.feedback.service;

import com.example.smartcity.modules.feedback.dto.FeedbackRequest;
import com.example.smartcity.modules.feedback.entity.Category;
import com.example.smartcity.modules.feedback.entity.Feedback;
import com.example.smartcity.modules.feedback.entity.FeedbackStatus;
import com.example.smartcity.modules.feedback.entity.FeedbackLog;
import com.example.smartcity.modules.feedback.dto.FeedbackLogResponse;
import com.example.smartcity.modules.feedback.repository.FeedbackLogRepository;
import com.example.smartcity.modules.user.entity.User;
import com.example.smartcity.modules.feedback.repository.CategoryRepository;
import com.example.smartcity.modules.feedback.repository.FeedbackRepository;
import com.example.smartcity.modules.feedback.repository.AttachmentRepository;
import com.example.smartcity.modules.feedback.entity.Attachment;
import com.example.smartcity.modules.user.repository.UserRepository;
import com.example.smartcity.modules.core.entity.Ward;
import com.example.smartcity.modules.core.service.LocationResolutionService;
import com.example.smartcity.modules.user.entity.Role;
import com.example.smartcity.common.exception.CustomException;
import com.example.smartcity.common.exception.ResourceNotFoundException;
import com.example.smartcity.modules.notification.WebSocketNotificationService;
import com.example.smartcity.modules.notification.service.NotificationService;
import org.springframework.http.HttpStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import com.example.smartcity.common.base.BaseRepository;
import com.example.smartcity.common.base.BaseServiceImpl;

@Service
@RequiredArgsConstructor
@Slf4j
public class FeedbackService extends BaseServiceImpl<Feedback, Long> {

    private final FeedbackRepository feedbackRepository;
    private final FeedbackLogRepository feedbackLogRepository;
    private final WebSocketNotificationService webSocketNotificationService;
    private final NotificationService notificationService;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final AttachmentRepository attachmentRepository;
    private final AutoDispatchService autoDispatchService;
    private final LocationResolutionService locationResolutionService;

    // State machine: map of valid transitions
    private static final Map<FeedbackStatus, Set<FeedbackStatus>> VALID_TRANSITIONS = Map.of(
        FeedbackStatus.PENDING,        Set.of(FeedbackStatus.IN_PROGRESS, FeedbackStatus.REJECTED),
        FeedbackStatus.IN_PROGRESS,    Set.of(FeedbackStatus.RESOLVED, FeedbackStatus.WAITING_INFO, FeedbackStatus.REJECTED),
        FeedbackStatus.WAITING_INFO,   Set.of(FeedbackStatus.IN_PROGRESS, FeedbackStatus.RESOLVED, FeedbackStatus.REJECTED),
        FeedbackStatus.RESOLVED,       Set.of(),
        FeedbackStatus.REJECTED,       Set.of()
    );

    @Override
    protected BaseRepository<Feedback, Long> getRepository() {
        return (BaseRepository<Feedback, Long>) feedbackRepository;
    }

    @Override
    protected String getResourceName() {
        return "Feedback";
    }

    @Transactional
    public Feedback createFeedback(FeedbackRequest request, String username) {
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new com.example.smartcity.common.exception.ResourceNotFoundException("Category", request.getCategoryId()));

        User citizen = userRepository.findByUsername(username)
                .orElseThrow(() -> new com.example.smartcity.common.exception.ResourceNotFoundException("User: " + username));

        if (citizen.getRole() != Role.CITIZEN) {
            throw new CustomException("Chi cong dan moi duoc gui vi tri GPS khi tao phan anh", HttpStatus.FORBIDDEN.value());
        }

        // GPS là bắt buộc để tránh phản ánh không có vị trí xử lý.
        if (request.getLatitude() == null || request.getLongitude() == null) {
            throw new CustomException("Vui long cho phep GPS truoc khi gui phan anh", HttpStatus.BAD_REQUEST.value());
        }

        // Backend tự xác định phường/xã từ GPS, không tin wardId do frontend gửi lên.
        Ward ward = locationResolutionService.findAuthorityByLocation(request.getLatitude(), request.getLongitude());

        Feedback feedback = new Feedback();
        feedback.setTrackingCode("FB-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        feedback.setTitle(request.getTitle());
        feedback.setDescription(request.getDescription());
        feedback.setLatitude(request.getLatitude());
        feedback.setLongitude(request.getLongitude());
        feedback.setAddressDetails(request.getAddressDetails());
        feedback.setStatus(FeedbackStatus.PENDING);
        feedback.setReceiverType(resolveReceiverType(category));
        feedback.setPriority("MEDIUM");
        feedback.setSource("CITIZEN_APP");
        feedback.setCategory(category);
        feedback.setWard(ward);
        feedback.setCitizen(citizen);
        feedback.setCreatedAt(LocalDateTime.now());
        feedback.setUpdatedAt(LocalDateTime.now());

        Feedback saved = feedbackRepository.save(feedback);
        FeedbackLog submittedLog = new FeedbackLog(saved, citizen, null, FeedbackStatus.PENDING, "Công dân đã gửi phản ánh");
        submittedLog.setAction("SUBMIT");
        feedbackLogRepository.save(submittedLog);
        log.info("[Feedback] Created feedback. feedbackId={}, currentUserId={}", saved.getId(), citizen.getId());
        notificationService.createFeedbackSubmittedNotification(saved);

        // Kích hoạt AI Auto-Dispatch (Non-blocking)
        autoDispatchService.analyzeAndDispatch(saved.getId());

        return saved;
    }

    @Transactional(readOnly = true)
    public Page<Feedback> getAllFeedbacks(String username, Pageable pageable) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new com.example.smartcity.common.exception.ResourceNotFoundException("User: " + username));

        if (user.getRole() == Role.SUPER_ADMIN) {
            return feedbackRepository.findAll(pageable);
        } else if (user.getRole() == Role.WARD_STAFF) {
            if (user.getWard() == null) return Page.empty();
            return feedbackRepository.findByWardId(user.getWard().getId(), pageable);
        } else if (user.getRole() == Role.POLICE) {
            // Enterprise Fix: Should use Category ID or dynamic config instead of hardcoded name, but we keep it query-based for now
            return feedbackRepository.findByCategoryName("An ninh", pageable);
        } else {
            return feedbackRepository.findByCitizenId(user.getId(), pageable);
        }
    }

    @Transactional(readOnly = true)
    public Page<Feedback> getMyFeedbacks(
            String username,
            String keyword,
            FeedbackStatus status,
            LocalDateTime fromDate,
            LocalDateTime toDate,
            Pageable pageable) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User: " + username));

        if (user.getRole() != Role.CITIZEN) {
            throw new CustomException("Chi cong dan moi duoc xem danh sach phan anh ca nhan", HttpStatus.FORBIDDEN.value());
        }

        String normalizedKeyword = keyword == null ? null : keyword.trim();
        LocalDateTime effectiveFromDate = fromDate == null
                ? LocalDate.of(1970, 1, 1).atStartOfDay()
                : fromDate;
        LocalDateTime effectiveToDate = toDate == null
                ? LocalDate.of(9999, 12, 31).atTime(LocalTime.MAX)
                : toDate;

        return feedbackRepository.searchMyFeedbacks(
                user.getId(),
                normalizedKeyword,
                status,
                effectiveFromDate,
                effectiveToDate,
                pageable);
    }

    @Transactional(readOnly = true)
    public List<Attachment> getAttachmentsForFeedbacks(List<Long> feedbackIds) {
        if (feedbackIds == null || feedbackIds.isEmpty()) {
            return List.of();
        }
        return attachmentRepository.findByFeedbackIdIn(feedbackIds);
    }

    @Transactional(readOnly = true)
    public Feedback getMyFeedbackById(Long feedbackId, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User: " + username));

        if (user.getRole() != Role.CITIZEN) {
            throw new CustomException("Chi cong dan moi duoc xem chi tiet phan anh ca nhan", HttpStatus.FORBIDDEN.value());
        }

        Feedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new ResourceNotFoundException("Feedback", feedbackId));

        if (!feedback.getCitizen().getId().equals(user.getId())) {
            throw new CustomException("Ban khong co quyen xem phan anh nay", HttpStatus.FORBIDDEN.value());
        }

        return feedback;
    }

    // ─── State Machine ────────────────────────────────────────────────

    @Transactional
    public Feedback changeStatus(Long feedbackId, FeedbackStatus newStatus, String note, String username) {
        Feedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new ResourceNotFoundException("Feedback", feedbackId));

        FeedbackStatus current = feedback.getStatus();
        Set<FeedbackStatus> allowed = VALID_TRANSITIONS.get(current);
        if (allowed == null || !allowed.contains(newStatus)) {
            throw new CustomException(String.format("Không thể chuyển từ %s sang %s", current, newStatus),
                    HttpStatus.BAD_REQUEST.value());
        }

        User actionBy = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User: " + username));

        // Fix BOLA/IDOR: Validate permission before action
        validateActionPermission(actionBy, feedback);

        feedback.setStatus(newStatus);
        feedback.setUpdatedAt(LocalDateTime.now());
        Feedback saved = feedbackRepository.save(feedback);

        FeedbackLog log = new FeedbackLog(feedback, actionBy, current, newStatus, note);
        if (current == FeedbackStatus.PENDING && newStatus == FeedbackStatus.IN_PROGRESS) {
            log.setAction("ACCEPT");
        }
        feedbackLogRepository.save(log);

        // Gửi WebSocket notification
        webSocketNotificationService.notifyFeedbackStatusChange(
                feedbackId, newStatus.name(),
                "Feedback #" + feedback.getTrackingCode() + " → " + newStatus);

        return saved;
    }

    @Transactional
    public Feedback assignFeedback(Long feedbackId, Long assigneeId, String username) {
        Feedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new ResourceNotFoundException("Feedback", feedbackId));

        User assignee = userRepository.findById(assigneeId)
                .orElseThrow(() -> new ResourceNotFoundException("User", assigneeId));

        User actionBy = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User: " + username));

        // Fix BOLA/IDOR: Validate permission before action
        validateActionPermission(actionBy, feedback);

        FeedbackStatus oldStatus = feedback.getStatus();
        feedback.setAssignee(assignee);
        if (oldStatus == FeedbackStatus.PENDING) {
            feedback.setStatus(FeedbackStatus.IN_PROGRESS);
        }
        feedback.setUpdatedAt(LocalDateTime.now());
        Feedback saved = feedbackRepository.save(feedback);

        FeedbackLog log = new FeedbackLog(feedback, actionBy, oldStatus, feedback.getStatus(),
                "Đã chuyển đến " + resolveAuthorityName(feedback));
        log.setAction("ASSIGN");
        feedbackLogRepository.save(log);

        return saved;
    }

    @Transactional(readOnly = true)
    public List<FeedbackLogResponse> getFeedbackLogs(Long feedbackId) {
        return feedbackLogRepository.findByFeedbackIdOrderByCreatedAtAsc(feedbackId)
                .stream()
                .map(this::toFeedbackLogResponse)
                .collect(Collectors.toList());
    }

    private FeedbackLogResponse toFeedbackLogResponse(FeedbackLog log) {
        String actorName = log.getActionBy() == null ? null : log.getActionBy().getFullName();
        String actorRole = log.getActionBy() == null || log.getActionBy().getRole() == null
                ? null
                : log.getActionBy().getRole().name();
        String authorityName = resolveAuthorityName(log.getFeedback());
        FeedbackStatus status = log.getNewStatus() != null ? log.getNewStatus() : log.getOldStatus();

        return FeedbackLogResponse.builder()
                .id(log.getId())
                .actionByName(actorName)
                .actorName(actorName)
                .actorRole(actorRole)
                .authorityName(authorityName)
                .assignedToName(resolveAssignedToName(log, authorityName))
                .action(log.getAction())
                .status(status == null ? null : status.name())
                .title(resolveTimelineTitle(log))
                .deadline(null)
                .oldStatus(log.getOldStatus())
                .newStatus(log.getNewStatus())
                .note(log.getNote())
                .createdAt(log.getCreatedAt())
                .build();
    }

    private String resolveTimelineTitle(FeedbackLog log) {
        if ("SUBMIT".equals(log.getAction())) {
            return "Đã gửi phản ánh";
        }
        if ("ASSIGN".equals(log.getAction())) {
            return "Đã chuyển đơn vị xử lý";
        }
        if ("ACCEPT".equals(log.getAction())) {
            return "Đã tiếp nhận phản ánh";
        }
        if (log.getNewStatus() == FeedbackStatus.REJECTED) {
            return "Phản ánh bị từ chối";
        }
        if (log.getNewStatus() == FeedbackStatus.WAITING_INFO) {
            return "Cần bổ sung thông tin";
        }
        if (log.getNewStatus() == FeedbackStatus.RESOLVED) {
            return "Đã hoàn thành xử lý";
        }
        if (log.getNewStatus() == FeedbackStatus.IN_PROGRESS) {
            String note = log.getNote() == null ? "" : log.getNote().toLowerCase();
            if (note.contains("tiếp nhận")) {
                return "Đã tiếp nhận phản ánh";
            }
            return "Đang xử lý";
        }
        return "Đã cập nhật phản ánh";
    }

    private String resolveAuthorityName(Feedback feedback) {
        if (feedback == null || feedback.getWard() == null) {
            return null;
        }
        return "UBND Phường " + feedback.getWard().getName();
    }

    // ─── Role-based access helpers ────────────────────────────────────

    private String resolveAssignedToName(FeedbackLog log, String authorityName) {
        if ("ASSIGN".equals(log.getAction())) {
            return authorityName;
        }
        if (log.getFeedback() != null && log.getFeedback().getAssignee() != null) {
            return log.getFeedback().getAssignee().getFullName();
        }
        return null;
    }

    public boolean canAccessFeedback(Feedback feedback, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User: " + username));
        return switch (user.getRole()) {
            case SUPER_ADMIN -> true;
            case WARD_STAFF -> user.getWard() != null && user.getWard().getId().equals(feedback.getWard().getId());
            case POLICE -> feedback.getCategory() != null && "An ninh".equals(feedback.getCategory().getName());
            case CITIZEN -> feedback.getCitizen().getId().equals(user.getId());
        };
    }

    /**
     * [SECURITY FIX] Kiểm tra quyền thực thi (Đổi trạng thái, Gán người xử lý).
     * Ngăn chặn tình trạng IDOR/BOLA khi user tự ý chỉnh sửa feedback.
     */
    private void validateActionPermission(User actionBy, Feedback feedback) {
        if (actionBy.getRole() == Role.CITIZEN) {
            throw new CustomException("Công dân không có quyền thay đổi trạng thái phản ánh", HttpStatus.FORBIDDEN.value());
        }
        if (actionBy.getRole() == Role.WARD_STAFF) {
            if (actionBy.getWard() == null || !actionBy.getWard().getId().equals(feedback.getWard().getId())) {
                throw new CustomException("Cán bộ phường chỉ có quyền xử lý phản ánh thuộc phường quản lý", HttpStatus.FORBIDDEN.value());
            }
        }
        if (actionBy.getRole() == Role.POLICE) {
            if (feedback.getCategory() == null || !"An ninh".equals(feedback.getCategory().getName())) {
                throw new CustomException("Công an chỉ có quyền xử lý phản ánh thuộc danh mục An ninh", HttpStatus.FORBIDDEN.value());
            }
        }
    }

    private String resolveReceiverType(Category category) {
        return category != null && "An ninh".equalsIgnoreCase(category.getName()) ? "POLICE" : "WARD_STAFF";
    }

}




