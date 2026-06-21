package com.example.smartcity.modules.feedback.service;

import com.example.smartcity.modules.feedback.dto.FeedbackRequest;
import com.example.smartcity.ai_orchestrator.guardrails.ContentGuardrailService;
import com.example.smartcity.modules.feedback.entity.Category;
import com.example.smartcity.rag.ingestion.EmbeddingClientFacade;
import org.springframework.jdbc.core.JdbcTemplate;
import com.example.smartcity.modules.feedback.entity.AiTask;
import com.example.smartcity.modules.feedback.repository.AiTaskRepository;
import org.springframework.scheduling.annotation.Scheduled;
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
    private final AiTaskRepository aiTaskRepository;

    @org.springframework.beans.factory.annotation.Autowired
    @org.springframework.context.annotation.Lazy
    private FeedbackService self;

    // State machine: map of valid transitions
    private static final Map<FeedbackStatus, Set<FeedbackStatus>> VALID_TRANSITIONS = Map.ofEntries(
        Map.entry(FeedbackStatus.SUBMITTED,      Set.of(FeedbackStatus.PENDING_RECEIVE, FeedbackStatus.IN_PROGRESS, FeedbackStatus.REJECTED)),
        Map.entry(FeedbackStatus.PENDING_RECEIVE,Set.of(FeedbackStatus.IN_PROGRESS, FeedbackStatus.REJECTED)),
        Map.entry(FeedbackStatus.PENDING,        Set.of(FeedbackStatus.IN_PROGRESS, FeedbackStatus.REJECTED)),
        Map.entry(FeedbackStatus.NEED_LOCATION_REVIEW, Set.of(FeedbackStatus.PENDING_RECEIVE, FeedbackStatus.REJECTED)),
        Map.entry(FeedbackStatus.IN_PROGRESS,    Set.of(FeedbackStatus.RESOLVED, FeedbackStatus.WAITING_INFO, FeedbackStatus.REJECTED)),
        Map.entry(FeedbackStatus.WAITING_INFO,   Set.of(FeedbackStatus.IN_PROGRESS, FeedbackStatus.RESOLVED, FeedbackStatus.REJECTED)),
        Map.entry(FeedbackStatus.RESOLVED,       Set.of()),
        Map.entry(FeedbackStatus.REJECTED,       Set.of()),
        Map.entry(FeedbackStatus.ASSIGNED,       Set.of(FeedbackStatus.IN_PROGRESS, FeedbackStatus.RESOLVED, FeedbackStatus.REJECTED)),
        Map.entry(FeedbackStatus.PRE_EMPTIVE,    Set.of())
    );

    @Override
    protected BaseRepository<Feedback, Long> getRepository() {
        return (BaseRepository<Feedback, Long>) feedbackRepository;
    }

    @Override
    protected String getResourceName() {
        return "Feedback";
    }

    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<Feedback> findAllPaged(org.springframework.data.domain.Pageable pageable) {
        return feedbackRepository.findAll(pageable);
    }

    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public Feedback createFeedback(FeedbackRequest request, String username) {
        // 1. GPS là bắt buộc để tránh phản ánh không có vị trí xử lý & tránh lỗi NPE unboxing khi gọi geocoding
        if (request.getLatitude() == null || request.getLongitude() == null) {
            throw new CustomException("Vui long cho phep GPS truoc khi gui phan anh", HttpStatus.BAD_REQUEST.value());
        }

        // 2. Kiểm tra danh mục hợp lệ trước
        Category category = resolveOfficialCategory(request.getCategoryCode());

        // 3. [PII Guard — Tầng 2] Kiểm tra nội dung có chứa SĐT / CCCD không (Thực hiện trước và ngoài Transaction)
        try {
            contentGuardrailService.validateFeedbackContent(
                request.getTitle(), 
                request.getDescription() + " " + (request.getAddressDetails() != null ? request.getAddressDetails() : "")
            );
        } catch (IllegalArgumentException ex) {
            throw new CustomException(ex.getMessage(), HttpStatus.BAD_REQUEST.value());
        }

        // Gọi geocoding API ngoài transaction để giải phóng DB connection pool
        Ward ward = null;
        try {
            ward = locationResolutionService.findAuthorityByLocation(request.getLatitude(), request.getLongitude());
        } catch (CustomException ex) {
            log.warn("[Feedback] Location requires manual review. lat={}, lng={}", request.getLatitude(), request.getLongitude());
        }

        // Gọi method transactional qua self-proxy để đảm bảo AOP hoạt động chính xác (fallback this khi self == null trong unit tests)
        FeedbackService service = (self != null) ? self : this;
        return service.saveFeedbackTransaction(request, username, ward, category);
    }

    @Transactional
    public Feedback saveFeedbackTransaction(FeedbackRequest request, String username, Ward ward, Category category) {
        User citizen = userRepository.findByUsername(username)
                .orElseThrow(() -> new com.example.smartcity.common.exception.ResourceNotFoundException("User: " + username));

        if (citizen.getRole() != Role.CITIZEN) {
            throw new CustomException("Chi cong dan moi duoc gui vi tri GPS khi tao phan anh", HttpStatus.FORBIDDEN.value());
        }

        // GPS là bắt buộc để tránh phản ánh không có vị trí xử lý.
        if (request.getLatitude() == null || request.getLongitude() == null) {
            throw new CustomException("Vui long cho phep GPS truoc khi gui phan anh", HttpStatus.BAD_REQUEST.value());
        }

        // AI Duplicate Detection: Kiểm tra phản ánh trùng lặp trong cùng Phường
        if (ward != null && ward.getId() != null) {
            checkDuplicateFeedback(request.getDescription(), ward.getId(), request.getLongitude(), request.getLatitude());
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
        saveDescriptionVector(saved.getId(), saved.getDescription());

        FeedbackLog submittedLog = new FeedbackLog(saved, citizen, null, saved.getStatus(), "Citizen submitted feedback");
        submittedLog.setAction("SUBMIT");
        feedbackLogRepository.save(submittedLog);
        log.info("[Feedback] Created feedback. feedbackId={}, currentUserId={}", saved.getId(), citizen.getId());
        notificationService.createFeedbackSubmittedNotification(saved);

        // Outbox Pattern: Tạo tác vụ PENDING trong ai_tasks
        try {
            AiTask aiTask = AiTask.builder()
                .feedback(saved)
                .status("PENDING")
                .taskPriority(mapTaskPriority(saved.getPriority()))
                .retryCount(0)
                .build();
            aiTaskRepository.save(aiTask);
            log.info("[Outbox] Đã tạo AiTask cho feedbackId={}", saved.getId());
        } catch (Exception e) {
            log.error("❌ [Outbox] Lỗi tạo AiTask cho feedbackId={}: {}", saved.getId(), e.getMessage());
        }

        return saved;
    }

    public void saveDescriptionVector(Long feedbackId, String description) {
        try {
            float[] descriptionVector = embeddingFacade.embed(description);
            String vectorString = java.util.Arrays.toString(descriptionVector);
            jdbcTemplate.update(
                "UPDATE feedbacks SET description_vector = ?::vector WHERE id = ?",
                vectorString, feedbackId
            );
            log.info("[Duplicate Detection] Đã lưu description_vector cho feedbackId={}", feedbackId);
        } catch (Exception e) {
            log.error("❌ [Duplicate Detection] Lỗi khi lưu description_vector: {}", e.getMessage());
        }
    }

    public void checkDuplicateFeedback(String description, Long wardId, Double longitude, Double latitude) {
        if (description == null || description.isBlank() || longitude == null || latitude == null) {
            return;
        }

        try {
            float[] descriptionVector = embeddingFacade.embed(description);
            String vectorString = java.util.Arrays.toString(descriptionVector);

            // [FIX] Khi wardId == null (phường chưa xác định), vẫn check trùng lặp
            // bằng cách bỏ điều kiện ward_id — so sánh chỉ theo tọa độ và vector ngữ nghĩa
            String sql;
            Object[] params;
            if (wardId != null) {
                // Tìm top 1 trong cùng Phường + tọa độ gần + vector gần (cosine < 0.20)
                sql = """
                    SELECT tracking_code
                    FROM feedbacks
                    WHERE ward_id = ?
                      AND description_vector <=> ?::vector < 0.20
                      AND ST_DWithin(location, ST_SetSRID(ST_Point(?, ?), 4326), 0.0009)
                      AND (
                          status IN ('PENDING', 'IN_PROGRESS', 'SUBMITTED', 'NEED_LOCATION_REVIEW', 'PENDING_RECEIVE', 'WAITING_INFO')
                          OR
                          (status = 'RESOLVED' AND resolved_at >= NOW() - INTERVAL '7 days')
                      )
                    ORDER BY description_vector <=> ?::vector ASC
                    LIMIT 1
                """;
                params = new Object[]{ wardId, vectorString, longitude, latitude, vectorString };

                // Debug log top 3
                jdbcTemplate.query(
                    "SELECT tracking_code, (description_vector <=> ?::vector) as distance FROM feedbacks WHERE ward_id = ? AND description_vector IS NOT NULL AND ST_DWithin(location, ST_SetSRID(ST_Point(?, ?), 4326), 0.0009) ORDER BY description_vector <=> ?::vector ASC LIMIT 3",
                    (rs, rowNum) -> { log.info("[DUPLICATE-DEBUG] Mã: {}, Distance: {}", rs.getString("tracking_code"), rs.getDouble("distance")); return null; },
                    vectorString, wardId, longitude, latitude, vectorString
                );
            } else {
                // [FIX] wardId null → chỉ dùng tọa độ (bán kính ~100m)
                log.warn("[Duplicate Detection] wardId null, fallback dùng tọa độ để check trùng lặp.");
                sql = """
                    SELECT tracking_code
                    FROM feedbacks
                    WHERE description_vector <=> ?::vector < 0.20
                      AND ST_DWithin(location, ST_SetSRID(ST_Point(?, ?), 4326), 0.0009)
                      AND (
                          status IN ('PENDING', 'IN_PROGRESS', 'SUBMITTED', 'NEED_LOCATION_REVIEW', 'PENDING_RECEIVE', 'WAITING_INFO')
                          OR
                          (status = 'RESOLVED' AND resolved_at >= NOW() - INTERVAL '7 days')
                      )
                    ORDER BY description_vector <=> ?::vector ASC
                    LIMIT 1
                """;
                params = new Object[]{ vectorString, longitude, latitude, vectorString };
            }

            List<String> results = jdbcTemplate.query(sql, (rs, rowNum) -> rs.getString("tracking_code"), params);

            if (!results.isEmpty()) {
                String duplicateTrackingCode = results.get(0);
                log.warn("[DUPLICATE-DETECTION] Phát hiện phản ánh trùng lặp. Mã trùng: {}", duplicateTrackingCode);
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
            if (user.getWard() == null) {
                return Page.empty(pageable);
            }
            return feedbackRepository.findByManagedByRoleAndWardId(CategoryRoutingService.ROLE_POLICE, user.getWard().getId(), pageable);
        } else {
            return feedbackRepository.findByCitizenId(user.getId(), pageable);
        }
    }

    @Transactional(readOnly = true)
    public Page<Feedback> getMyFeedbacks(
            String username,
            String keyword,
            String category,
            FeedbackStatus status,
            String priority,
            LocalDateTime fromDate,
            LocalDateTime toDate,
            Long wardId,
            Pageable pageable) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User: " + username));

        String normalizedKeyword = keyword == null ? null : keyword.trim();
        List<FeedbackStatus> statusFilter = resolveStatusFilter(status);
        boolean hasStatusFilter = !statusFilter.isEmpty();
        String normalizedPriority = normalizePriorityFilter(priority);
        LocalDateTime effectiveFromDate = fromDate == null
                ? LocalDate.of(1970, 1, 1).atStartOfDay()
                : fromDate;
        LocalDateTime effectiveToDate = toDate == null
                ? LocalDate.of(9999, 12, 31).atTime(LocalTime.MAX)
                : toDate;

        if (user.getRole() == Role.CITIZEN) {
            return feedbackRepository.searchMyFeedbacks(
                    user.getId(),
                    normalizedKeyword,
                    category,
                    statusFilter,
                    hasStatusFilter,
                    normalizedPriority,
                    effectiveFromDate,
                    effectiveToDate,
                    pageable);
        } else if (user.getRole() == Role.WARD_STAFF) {
            if (user.getWard() == null) {
                return Page.empty();
            }
            return feedbackRepository.searchWardFeedbacks(
                    user.getWard().getId(),
                    normalizedKeyword,
                    category,
                    statusFilter,
                    hasStatusFilter,
                    normalizedPriority,
                    effectiveFromDate,
                    effectiveToDate,
                    pageable);
        } else if (user.getRole() == Role.POLICE) {
            if (user.getWard() == null) {
                return Page.empty();
            }
            return feedbackRepository.searchPoliceFeedbacks(
                    CategoryRoutingService.ROLE_POLICE,
                    user.getWard().getId(),
                    normalizedKeyword,
                    category,
                    statusFilter,
                    hasStatusFilter,
                    normalizedPriority,
                    effectiveFromDate,
                    effectiveToDate,
                    pageable);
        } else if (user.getRole() == Role.SUPER_ADMIN) {
            List<String> emptyCategories = null;
            return feedbackRepository.searchPublicFeedbacks(
                    normalizedKeyword,
                    category,
                    statusFilter,
                    hasStatusFilter,
                    normalizedPriority,
                    effectiveFromDate,
                    effectiveToDate,
                    wardId,
                    emptyCategories,
                    false,
                    pageable);
        } else {
            return Page.empty();
        }
    }

    @Transactional(readOnly = true)
    public FeedbackLookupStatsResponse getMyFeedbackStats(
            String username,
            String keyword,
            String category,
            String priority,
            LocalDateTime fromDate,
            LocalDateTime toDate,
            Long wardId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User: " + username));

        String normalizedKeyword = keyword == null ? null : keyword.trim();
        String normalizedPriority = normalizePriorityFilter(priority);
        LocalDateTime effectiveFromDate = fromDate == null
                ? LocalDate.of(1970, 1, 1).atStartOfDay()
                : fromDate;
        LocalDateTime effectiveToDate = toDate == null
                ? LocalDate.of(9999, 12, 31).atTime(LocalTime.MAX)
                : toDate;

        List<Object[]> rawCounts;
        if (user.getRole() == Role.CITIZEN) {
            rawCounts = feedbackRepository.countMyFeedbacksByStatus(
                    user.getId(),
                    normalizedKeyword,
                    category,
                    normalizedPriority,
                    effectiveFromDate,
                    effectiveToDate);
        } else if (user.getRole() == Role.WARD_STAFF) {
            if (user.getWard() == null) {
                return FeedbackLookupStatsResponse.builder().build();
            }
            rawCounts = feedbackRepository.countWardFeedbacksByStatus(
                    user.getWard().getId(),
                    normalizedKeyword,
                    category,
                    normalizedPriority,
                    effectiveFromDate,
                    effectiveToDate);
        } else if (user.getRole() == Role.POLICE) {
            if (user.getWard() == null) {
                return FeedbackLookupStatsResponse.builder().build();
            }
            rawCounts = feedbackRepository.countPoliceFeedbacksByStatus(
                    CategoryRoutingService.ROLE_POLICE,
                    user.getWard().getId(),
                    normalizedKeyword,
                    category,
                    normalizedPriority,
                    effectiveFromDate,
                    effectiveToDate);
        } else if (user.getRole() == Role.SUPER_ADMIN) {
            List<String> emptyCategories = null;
            rawCounts = feedbackRepository.countPublicFeedbacksByStatus(
                    normalizedKeyword,
                    category,
                    List.of(),
                    false,
                    normalizedPriority,
                    effectiveFromDate,
                    effectiveToDate,
                    wardId,
                    emptyCategories,
                    false);
        } else {
            return FeedbackLookupStatsResponse.builder().build();
        }

        long total = 0;
        long pending = 0;
        long inProgress = 0;
        long resolved = 0;
        long rejected = 0;

        for (Object[] row : rawCounts) {
            FeedbackStatus statStatus = (FeedbackStatus) row[0];
            long count = ((Number) row[1]).longValue();
            total += count;
            if (statStatus == FeedbackStatus.SUBMITTED || 
                statStatus == FeedbackStatus.PENDING_RECEIVE || 
                statStatus == FeedbackStatus.PENDING) {
                pending += count;
            } else if (statStatus == FeedbackStatus.IN_PROGRESS || 
                       statStatus == FeedbackStatus.ASSIGNED || 
                       statStatus == FeedbackStatus.WAITING_INFO || 
                       statStatus == FeedbackStatus.NEED_LOCATION_REVIEW) {
                inProgress += count;
            } else if (statStatus == FeedbackStatus.RESOLVED) {
                resolved += count;
            } else if (statStatus == FeedbackStatus.REJECTED) {
                rejected += count;
            }
        }

        return FeedbackLookupStatsResponse.builder()
                .total(total)
                .pending(pending)
                .inProgress(inProgress)
                .resolved(resolved)
                .rejected(rejected)
                .build();
    }

    @Transactional(readOnly = true)
    public Page<Feedback> getPublicFeedbacks(
            String keyword,
            String category,
            FeedbackStatus status,
            LocalDateTime fromDate,
            LocalDateTime toDate,
            Long wardId,
            List<String> categories,
            String username,
            Pageable pageable) {
        String normalizedKeyword = keyword == null ? null : keyword.trim();
        String normalizedCategory = category == null ? null : category.trim();
        List<FeedbackStatus> statusFilter = resolveStatusFilter(status);
        boolean hasStatusFilter = !statusFilter.isEmpty();
        LocalDateTime effectiveFromDate = fromDate == null
                ? LocalDate.of(1970, 1, 1).atStartOfDay()
                : fromDate;
        LocalDateTime effectiveToDate = toDate == null
                ? LocalDate.of(9999, 12, 31).atTime(LocalTime.MAX)
                : toDate;

        Long effectiveWardId = wardId;
        List<String> effectiveCategories = categories;

        boolean hasCategories = (effectiveCategories != null && !effectiveCategories.isEmpty());

        return feedbackRepository.searchPublicFeedbacks(
                normalizedKeyword,
                normalizedCategory,
                statusFilter,
                hasStatusFilter,
                null, // priority is null for public listing
                effectiveFromDate,
                effectiveToDate,
                effectiveWardId,
                effectiveCategories,
                hasCategories,
                pageable);
    }

    @Transactional(readOnly = true)
    public FeedbackLookupStatsResponse getPublicFeedbackStats(
            String keyword,
            String category,
            FeedbackStatus status,
            LocalDateTime fromDate,
            LocalDateTime toDate,
            Long wardId,
            List<String> categories,
            String username) {
        String normalizedKeyword = keyword == null ? null : keyword.trim();
        String normalizedCategory = category == null ? null : category.trim();
        List<FeedbackStatus> statusFilter = resolveStatusFilter(status);
        boolean hasStatusFilter = !statusFilter.isEmpty();
        LocalDateTime effectiveFromDate = fromDate == null
                ? LocalDate.of(1970, 1, 1).atStartOfDay()
                : fromDate;
        LocalDateTime effectiveToDate = toDate == null
                ? LocalDate.of(9999, 12, 31).atTime(LocalTime.MAX)
                : toDate;

        Long effectiveWardId = wardId;
        List<String> effectiveCategories = categories;

        boolean hasCategories = (effectiveCategories != null && !effectiveCategories.isEmpty());

        List<Object[]> rawCounts = feedbackRepository.countPublicFeedbacksByStatus(
                normalizedKeyword,
                normalizedCategory,
                statusFilter,
                hasStatusFilter,
                null, // priority is null for public stats
                effectiveFromDate,
                effectiveToDate,
                effectiveWardId,
                effectiveCategories,
                hasCategories);

        long total = 0;
        long pending = 0;
        long inProgress = 0;
        long resolved = 0;
        long rejected = 0;

        for (Object[] row : rawCounts) {
            FeedbackStatus statStatus = (FeedbackStatus) row[0];
            long count = ((Number) row[1]).longValue();
            total += count;
            if (statStatus == FeedbackStatus.SUBMITTED || 
                statStatus == FeedbackStatus.PENDING_RECEIVE || 
                statStatus == FeedbackStatus.PENDING) {
                pending += count;
            } else if (statStatus == FeedbackStatus.IN_PROGRESS || 
                       statStatus == FeedbackStatus.ASSIGNED || 
                       statStatus == FeedbackStatus.WAITING_INFO || 
                       statStatus == FeedbackStatus.NEED_LOCATION_REVIEW) {
                inProgress += count;
            } else if (statStatus == FeedbackStatus.RESOLVED) {
                resolved += count;
            } else if (statStatus == FeedbackStatus.REJECTED) {
                rejected += count;
            }
        }

        return FeedbackLookupStatsResponse.builder()
                .total(total)
                .pending(pending)
                .inProgress(inProgress)
                .resolved(resolved)
                .rejected(rejected)
                .build();
    }

    private List<FeedbackStatus> resolveStatusFilter(FeedbackStatus status) {
        if (status == null) {
            return List.of();
        }
        return switch (status) {
            case SUBMITTED, PENDING_RECEIVE, PENDING, PRE_EMPTIVE ->
                    List.of(FeedbackStatus.SUBMITTED, FeedbackStatus.PENDING_RECEIVE, FeedbackStatus.PENDING, FeedbackStatus.PRE_EMPTIVE);
            case NEED_LOCATION_REVIEW, ASSIGNED, IN_PROGRESS, WAITING_INFO ->
                    List.of(FeedbackStatus.NEED_LOCATION_REVIEW, FeedbackStatus.ASSIGNED, FeedbackStatus.IN_PROGRESS, FeedbackStatus.WAITING_INFO);
            case RESOLVED -> List.of(FeedbackStatus.RESOLVED);
            case REJECTED -> List.of(FeedbackStatus.REJECTED);
        };
    }

    private String normalizePriorityFilter(String priority) {
        if (priority == null || priority.isBlank()) {
            return priority;
        }
        String normalized = priority.trim().toUpperCase();
        return "URGENT".equals(normalized) ? "CRITICAL" : normalized;
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

        if (actionBy.getRole() != Role.WARD_STAFF) {
            throw new CustomException("Chỉ cán bộ phường mới có quyền cập nhật trạng thái phản ánh", HttpStatus.FORBIDDEN.value());
        }

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
            case WARD_STAFF -> CategoryRoutingService.ROLE_WARD_STAFF.equals(feedback.getManagedByRole()) && user.getWard() != null && feedback.getWard() != null && user.getWard().getId().equals(feedback.getWard().getId());
            case POLICE -> CategoryRoutingService.ROLE_POLICE.equals(feedback.getManagedByRole()) && user.getWard() != null && feedback.getWard() != null && user.getWard().getId().equals(feedback.getWard().getId());
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
            if (!CategoryRoutingService.ROLE_WARD_STAFF.equals(feedback.getManagedByRole())) {
                throw new CustomException("Ward Staff can only process ward-managed feedback", HttpStatus.FORBIDDEN.value());
            }
            if (actionBy.getWard() == null || feedback.getWard() == null || !actionBy.getWard().getId().equals(feedback.getWard().getId())) {
                throw new CustomException("Cán bộ phường chỉ có quyền xử lý phản ánh thuộc phường quản lý", HttpStatus.FORBIDDEN.value());
            }
        }
        if (actionBy.getRole() == Role.POLICE) {
            if (!CategoryRoutingService.ROLE_POLICE.equals(feedback.getManagedByRole())) {
                throw new CustomException("Police can only process police-managed feedback", HttpStatus.FORBIDDEN.value());
            }
            if (actionBy.getWard() == null || feedback.getWard() == null || !actionBy.getWard().getId().equals(feedback.getWard().getId())) {
                throw new CustomException("Công an phường chỉ có quyền xử lý phản ánh thuộc phường quản lý", HttpStatus.FORBIDDEN.value());
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

    private int mapTaskPriority(String priority) {
        if (priority == null) return 1;
        switch (priority.toUpperCase()) {
            case "CRITICAL": return 3;
            case "HIGH": return 2;
            case "MEDIUM": return 1;
            case "LOW": return 0;
            default: return 1;
        }
    }

    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void purgeExpiredDescriptionVectors() {
        jdbcTemplate.execute("UPDATE feedbacks SET description_vector = NULL WHERE status IN ('RESOLVED', 'REJECTED') AND updated_at < NOW() - INTERVAL '30 days' AND description_vector IS NOT NULL");
        log.info("[Vector Purge] Đã dọn dẹp các description_vector hết hạn cho feedbacks.");
    }

}




