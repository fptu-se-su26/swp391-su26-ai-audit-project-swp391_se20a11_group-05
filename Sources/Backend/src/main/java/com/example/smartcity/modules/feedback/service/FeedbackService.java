package com.example.smartcity.modules.feedback.service;

import com.example.smartcity.modules.feedback.dto.FeedbackRequest;
import com.example.smartcity.ai_orchestrator.guardrails.ContentGuardrailService;
import com.example.smartcity.modules.feedback.entity.Category;
import com.example.smartcity.rag.ingestion.EmbeddingClientFacade;
import org.springframework.jdbc.core.JdbcTemplate;
import com.example.smartcity.modules.feedback.entity.Feedback;
import com.example.smartcity.modules.feedback.entity.FeedbackStatus;
import com.example.smartcity.modules.feedback.entity.FeedbackLog;
import com.example.smartcity.modules.feedback.dto.FeedbackLogResponse;
import com.example.smartcity.modules.feedback.dto.FeedbackLookupStatsResponse;
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
    private final CategoryRoutingService categoryRoutingService;
    private final ContentGuardrailService contentGuardrailService;
    private final JdbcTemplate jdbcTemplate;
    private final EmbeddingClientFacade embeddingFacade;

    // State machine: map of valid transitions
    private static final Map<FeedbackStatus, Set<FeedbackStatus>> VALID_TRANSITIONS = Map.of(
        FeedbackStatus.SUBMITTED,      Set.of(FeedbackStatus.PENDING_RECEIVE, FeedbackStatus.IN_PROGRESS, FeedbackStatus.REJECTED),
        FeedbackStatus.PENDING_RECEIVE,Set.of(FeedbackStatus.IN_PROGRESS, FeedbackStatus.REJECTED),
        FeedbackStatus.PENDING,        Set.of(FeedbackStatus.IN_PROGRESS, FeedbackStatus.REJECTED),
        FeedbackStatus.NEED_LOCATION_REVIEW, Set.of(FeedbackStatus.PENDING_RECEIVE, FeedbackStatus.REJECTED),
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
        Category category = resolveOfficialCategory(request.getCategoryCode());

        User citizen = userRepository.findByUsername(username)
                .orElseThrow(() -> new com.example.smartcity.common.exception.ResourceNotFoundException("User: " + username));

        if (citizen.getRole() != Role.CITIZEN) {
            throw new CustomException("Chi cong dan moi duoc gui vi tri GPS khi tao phan anh", HttpStatus.FORBIDDEN.value());
        }

        // GPS là bắt buộc để tránh phản ánh không có vị trí xử lý.
        if (request.getLatitude() == null || request.getLongitude() == null) {
            throw new CustomException("Vui long cho phep GPS truoc khi gui phan anh", HttpStatus.BAD_REQUEST.value());
        }

        // [PII Guard — Tầng 2] Kiểm tra nội dung có chứa SĐT / CCCD không
        try {
            contentGuardrailService.validateFeedbackContent(
                request.getTitle(), 
                request.getDescription() + " " + (request.getAddressDetails() != null ? request.getAddressDetails() : "")
            );
        } catch (IllegalArgumentException ex) {
            throw new CustomException(ex.getMessage(), HttpStatus.BAD_REQUEST.value());
        }

        Ward ward = null;
        try {
            ward = locationResolutionService.findAuthorityByLocation(request.getLatitude(), request.getLongitude());
        } catch (CustomException ex) {
            log.warn("[Feedback] Location requires manual review. lat={}, lng={}", request.getLatitude(), request.getLongitude());
        }

        // AI Duplicate Detection: Kiểm tra phản ánh trùng lặp trong cùng Phường
        if (ward != null && ward.getId() != null) {
            checkDuplicateFeedback(request.getDescription(), ward.getId());
        }

        LocalDateTime now = LocalDateTime.now();
        Feedback feedback = new Feedback();
        feedback.setTrackingCode("FB-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        feedback.setTitle(request.getTitle());
        feedback.setDescription(request.getDescription());
        feedback.setLatitude(request.getLatitude());
        feedback.setLongitude(request.getLongitude());
        feedback.setAddressDetails(request.getAddressDetails());
        feedback.setPriority("MEDIUM");
        feedback.setSource("CITIZEN_APP");
        feedback.setCategory(category);
        feedback.setCitizen(citizen);
        feedback.setCreatedAt(now);
        feedback.setUpdatedAt(now);
        categoryRoutingService.applyAssignment(feedback, category, ward, now);

        Feedback saved = feedbackRepository.save(feedback);

        // AI Duplicate Detection: Lưu vector mô tả vào Database
        try {
            float[] descriptionVector = embeddingFacade.embed(saved.getDescription());
            String vectorString = java.util.Arrays.toString(descriptionVector);
            jdbcTemplate.update(
                "UPDATE feedbacks SET description_vector = ?::vector WHERE id = ?",
                vectorString, saved.getId()
            );
            log.info("[Duplicate Detection] Đã lưu description_vector cho feedbackId={}", saved.getId());
        } catch (Exception e) {
            log.error("❌ [Duplicate Detection] Lỗi khi lưu description_vector: {}", e.getMessage());
        }

        FeedbackLog submittedLog = new FeedbackLog(saved, citizen, null, saved.getStatus(), "Citizen submitted feedback");
        submittedLog.setAction("SUBMIT");
        feedbackLogRepository.save(submittedLog);
        log.info("[Feedback] Created feedback. feedbackId={}, currentUserId={}", saved.getId(), citizen.getId());
        notificationService.createFeedbackSubmittedNotification(saved);

        // Kích hoạt AI Auto-Dispatch (Non-blocking)
        autoDispatchService.analyzeAndDispatch(saved.getId());

        return saved;
    }

    private void checkDuplicateFeedback(String description, Long wardId) {
        if (wardId == null || description == null || description.isBlank()) {
            return;
        }

        try {
            float[] descriptionVector = embeddingFacade.embed(description);
            String vectorString = java.util.Arrays.toString(descriptionVector);

            // Tìm top 1 có cosine distance < 0.08 (tương đồng > 92%) trong cùng Phường
            String sql = """
                SELECT tracking_code 
                FROM feedbacks 
                WHERE ward_id = ? 
                  AND description_vector <=> ?::vector < 0.08
                ORDER BY description_vector <=> ?::vector ASC 
                LIMIT 1
            """;

            List<String> results = jdbcTemplate.query(
                sql,
                (rs, rowNum) -> rs.getString("tracking_code"),
                wardId, vectorString, vectorString
            );

            if (!results.isEmpty()) {
                String duplicateTrackingCode = results.get(0);
                log.warn("[DUPLICATE-DETECTION] Phát hiện phản ánh trùng lặp trong cùng Phường. Mã trùng: {}", duplicateTrackingCode);
                throw new CustomException(
                    "Phản ánh tương tự đã được gửi bởi người dân khác. Vui lòng theo dõi mã phản ánh " + duplicateTrackingCode + " để cập nhật tiến độ.",
                    HttpStatus.CONFLICT.value()
                );
            }
        } catch (CustomException ex) {
            throw ex;
        } catch (Exception e) {
            log.error("❌ [Duplicate Detection] Lỗi khi kiểm tra trùng lặp: {}", e.getMessage());
        }
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
            return feedbackRepository.findByManagedByRole(CategoryRoutingService.ROLE_POLICE, pageable);
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
    public Page<Feedback> getPublicFeedbacks(
            String keyword,
            String category,
            FeedbackStatus status,
            LocalDateTime fromDate,
            LocalDateTime toDate,
            Pageable pageable) {
        String normalizedKeyword = keyword == null ? null : keyword.trim();
        String normalizedCategory = category == null ? null : category.trim();
        LocalDateTime effectiveFromDate = fromDate == null
                ? LocalDate.of(1970, 1, 1).atStartOfDay()
                : fromDate;
        LocalDateTime effectiveToDate = toDate == null
                ? LocalDate.of(9999, 12, 31).atTime(LocalTime.MAX)
                : toDate;

        return feedbackRepository.searchPublicFeedbacks(
                normalizedKeyword,
                normalizedCategory,
                status,
                effectiveFromDate,
                effectiveToDate,
                pageable);
    }

    @Transactional(readOnly = true)
    public FeedbackLookupStatsResponse getPublicFeedbackStats(
            String keyword,
            String category,
            FeedbackStatus status,
            LocalDateTime fromDate,
            LocalDateTime toDate) {
        String normalizedKeyword = keyword == null ? null : keyword.trim();
        String normalizedCategory = category == null ? null : category.trim();
        LocalDateTime effectiveFromDate = fromDate == null
                ? LocalDate.of(1970, 1, 1).atStartOfDay()
                : fromDate;
        LocalDateTime effectiveToDate = toDate == null
                ? LocalDate.of(9999, 12, 31).atTime(LocalTime.MAX)
                : toDate;

        List<Object[]> rawCounts = feedbackRepository.countPublicFeedbacksByStatus(
                normalizedKeyword,
                normalizedCategory,
                status,
                effectiveFromDate,
                effectiveToDate);

        long total = 0;
        long pending = 0;
        long resolved = 0;
        long rejected = 0;

        for (Object[] row : rawCounts) {
            FeedbackStatus statStatus = (FeedbackStatus) row[0];
            long count = ((Number) row[1]).longValue();
            total += count;
            if (statStatus != FeedbackStatus.RESOLVED && statStatus != FeedbackStatus.REJECTED) {
                pending += count;
            }
            if (statStatus == FeedbackStatus.RESOLVED) {
                resolved += count;
            }
            if (statStatus == FeedbackStatus.REJECTED) {
                rejected += count;
            }
        }

        return FeedbackLookupStatsResponse.builder()
                .total(total)
                .pending(pending)
                .resolved(resolved)
                .rejected(rejected)
                .build();
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
        return feedback == null ? null : feedback.getAssignedUnitName();
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
            case WARD_STAFF -> user.getWard() != null && feedback.getWard() != null && user.getWard().getId().equals(feedback.getWard().getId());
            case POLICE -> CategoryRoutingService.ROLE_POLICE.equals(feedback.getManagedByRole());
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
            if (actionBy.getWard() == null || feedback.getWard() == null || !actionBy.getWard().getId().equals(feedback.getWard().getId())) {
                throw new CustomException("Cán bộ phường chỉ có quyền xử lý phản ánh thuộc phường quản lý", HttpStatus.FORBIDDEN.value());
            }
        }
        if (actionBy.getRole() == Role.POLICE) {
            if (!CategoryRoutingService.ROLE_POLICE.equals(feedback.getManagedByRole())) {
                throw new CustomException("Police can only process police-managed feedback", HttpStatus.FORBIDDEN.value());
            }
        }
    }

    private Category resolveOfficialCategory(String categoryCode) {
        String normalizedCode = categoryCode == null ? "" : categoryCode.trim().toUpperCase();
        if (!categoryRoutingService.isOfficialCode(normalizedCode)) {
            throw new CustomException("Invalid feedback category.", HttpStatus.BAD_REQUEST.value());
        }
        return categoryRepository.findByCodeAndActiveTrue(normalizedCode)
                .orElseThrow(() -> new CustomException("Invalid feedback category.", HttpStatus.BAD_REQUEST.value()));
    }

}




