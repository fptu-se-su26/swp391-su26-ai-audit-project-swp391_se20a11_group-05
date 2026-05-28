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
import com.example.smartcity.modules.user.repository.UserRepository;
import com.example.smartcity.modules.core.repository.WardRepository;
import com.example.smartcity.modules.core.entity.Ward;
import com.example.smartcity.modules.user.entity.Role;
import com.example.smartcity.common.exception.CustomException;
import com.example.smartcity.common.exception.ResourceNotFoundException;
import com.example.smartcity.modules.notification.NotificationService;
import org.springframework.http.HttpStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import com.example.smartcity.common.base.BaseRepository;
import com.example.smartcity.common.base.BaseServiceImpl;

@Service
@RequiredArgsConstructor
public class FeedbackService extends BaseServiceImpl<Feedback, Long> {

    private final FeedbackRepository feedbackRepository;
    private final FeedbackLogRepository feedbackLogRepository;
    private final NotificationService notificationService;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final WardRepository wardRepository;
    private final AutoDispatchService autoDispatchService;

    // State machine: map of valid transitions
    private static final Map<FeedbackStatus, Set<FeedbackStatus>> VALID_TRANSITIONS = Map.of(
        FeedbackStatus.PENDING,        Set.of(FeedbackStatus.ASSIGNED, FeedbackStatus.REJECTED),
        FeedbackStatus.ASSIGNED,       Set.of(FeedbackStatus.IN_PROGRESS, FeedbackStatus.REJECTED, FeedbackStatus.PENDING),
        FeedbackStatus.IN_PROGRESS,    Set.of(FeedbackStatus.RESOLVED, FeedbackStatus.WAITING_INFO, FeedbackStatus.REJECTED),
        FeedbackStatus.WAITING_INFO,   Set.of(FeedbackStatus.IN_PROGRESS, FeedbackStatus.RESOLVED, FeedbackStatus.REJECTED),
        FeedbackStatus.RESOLVED,       Set.of(),
        FeedbackStatus.REJECTED,       Set.of(),
        FeedbackStatus.PRE_EMPTIVE,    Set.of(FeedbackStatus.ASSIGNED, FeedbackStatus.REJECTED)
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
                
        Ward ward = wardRepository.findById(request.getWardId())
                .orElseThrow(() -> new com.example.smartcity.common.exception.ResourceNotFoundException("Ward", request.getWardId()));

        Feedback feedback = new Feedback();
        feedback.setTrackingCode("FB-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        feedback.setTitle(request.getTitle());
        feedback.setDescription(request.getDescription());
        feedback.setLatitude(request.getLatitude());
        feedback.setLongitude(request.getLongitude());
        feedback.setAddressDetails(request.getAddressDetails());
        feedback.setStatus(FeedbackStatus.PENDING);
        feedback.setCategory(category);
        feedback.setWard(ward);
        feedback.setCitizen(citizen);
        feedback.setCreatedAt(LocalDateTime.now());
        feedback.setUpdatedAt(LocalDateTime.now());

        Feedback saved = feedbackRepository.save(feedback);

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

        feedback.setStatus(newStatus);
        feedback.setUpdatedAt(LocalDateTime.now());
        Feedback saved = feedbackRepository.save(feedback);

        FeedbackLog log = new FeedbackLog(feedback, actionBy, current, newStatus, note);
        feedbackLogRepository.save(log);

        // Gửi WebSocket notification
        notificationService.notifyFeedbackStatusChange(
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

        FeedbackStatus oldStatus = feedback.getStatus();
        feedback.setAssignee(assignee);
        if (oldStatus == FeedbackStatus.PENDING || oldStatus == FeedbackStatus.PRE_EMPTIVE) {
            feedback.setStatus(FeedbackStatus.ASSIGNED);
        }
        feedback.setUpdatedAt(LocalDateTime.now());
        Feedback saved = feedbackRepository.save(feedback);

        FeedbackLog log = new FeedbackLog(feedback, actionBy, oldStatus, feedback.getStatus(),
                "Giao cho " + assignee.getFullName());
        feedbackLogRepository.save(log);

        return saved;
    }

    @Transactional(readOnly = true)
    public List<FeedbackLogResponse> getFeedbackLogs(Long feedbackId) {
        return feedbackLogRepository.findByFeedbackIdOrderByCreatedAtDesc(feedbackId)
                .stream()
                .map(log -> FeedbackLogResponse.builder()
                        .id(log.getId())
                        .actionByName(log.getActionBy().getFullName())
                        .oldStatus(log.getOldStatus())
                        .newStatus(log.getNewStatus())
                        .note(log.getNote())
                        .createdAt(log.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    // ─── Role-based access helpers ────────────────────────────────────

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
}




