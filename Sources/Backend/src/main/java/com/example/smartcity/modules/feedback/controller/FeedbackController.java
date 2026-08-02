package com.example.smartcity.modules.feedback.controller;

import com.example.smartcity.modules.feedback.dto.FeedbackRequest;
import com.example.smartcity.modules.feedback.dto.FeedbackResponse;
import com.example.smartcity.modules.feedback.dto.FeedbackAttachmentResponse;
import com.example.smartcity.modules.feedback.dto.PagedResponse;
import com.example.smartcity.modules.feedback.dto.StatusOptionResponse;
import com.example.smartcity.modules.feedback.service.FeedbackService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

import com.example.smartcity.common.base.BaseGenericController;
import com.example.smartcity.common.base.BaseMapper;
import com.example.smartcity.common.base.BaseService;
import com.example.smartcity.modules.feedback.entity.Feedback;
import com.example.smartcity.modules.feedback.entity.Attachment;
import com.example.smartcity.modules.feedback.entity.FeedbackStatus;
import com.example.smartcity.modules.feedback.mapper.FeedbackMapper;
import com.example.smartcity.modules.feedback.dto.StatusChangeRequest;
import com.example.smartcity.modules.feedback.dto.AssignRequest;
import com.example.smartcity.modules.feedback.dto.FeedbackLogResponse;
import com.example.smartcity.modules.feedback.dto.FeedbackLookupStatsResponse;
import com.example.smartcity.modules.feedback.dto.FeedbackSupplementRequest;

import java.util.List;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.security.access.prepost.PreAuthorize;
import com.example.smartcity.common.exception.CustomException;
@RestController
@RequestMapping({"/api/feedbacks", "/api/feedback"})
@RequiredArgsConstructor
public class FeedbackController extends BaseGenericController<Feedback, FeedbackResponse, Long> {

    private final FeedbackService feedbackService;
    private final FeedbackMapper feedbackMapper;

    @Override
    protected BaseService<Feedback, Long> getService() {
        return feedbackService;
    }

    @Override
    protected BaseMapper<Feedback, FeedbackResponse> getMapper() {
        return feedbackMapper;
    }

    // ═══ Security Fix: Override Base Endpoints to prevent IDOR ════

    @Override
    @GetMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<FeedbackResponse>> getAll() {
        return super.getAll();
    }

    @Override
    @GetMapping("/page")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Page<FeedbackResponse>> getAllPaged(Pageable pageable) {
        return super.getAllPaged(pageable);
    }

    @Override
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        return super.delete(id);
    }

    @Override
    @PostMapping
    public ResponseEntity<FeedbackResponse> create(@RequestBody FeedbackResponse dto) {
        throw new CustomException("Vui lòng sử dụng endpoint /submit để tạo phản ánh", 405);
    }

    @Override
    @PutMapping("/{id}")
    public ResponseEntity<FeedbackResponse> update(@PathVariable Long id, @RequestBody FeedbackResponse dto) {
        throw new CustomException("Không hỗ trợ cập nhật toàn bộ phản ánh", 405);
    }

    @Override
    @GetMapping("/{id}")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ResponseEntity<FeedbackResponse> getById(@PathVariable Long id) {
        Feedback feedback = feedbackService.findById(id);
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && !feedbackService.canAccessFeedback(feedback, auth.getName())) {
            throw new CustomException("Bạn không có quyền xem phản ánh này", 403);
        }
        feedbackService.incrementViewCount(id);
        feedback.setViewCount(feedback.getViewCount() + 1);
        return ResponseEntity.ok(toDetailResponse(feedback));
    }

    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<PagedResponse<FeedbackResponse>> getAllFeedbacksForAdmin(
            @PageableDefault(size = 500, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<Feedback> entities = feedbackService.findAllPaged(pageable);
        return ResponseEntity.ok(toPagedResponse(entities));
    }

    @GetMapping("/my-reports/{feedbackId}")
    @PreAuthorize("hasRole('CITIZEN')")
    public ResponseEntity<FeedbackResponse> getMyReportById(
            @PathVariable Long feedbackId,
            Authentication authentication) {
        Feedback feedback = feedbackService.getMyFeedbackById(feedbackId, authentication.getName());
        feedbackService.incrementViewCount(feedbackId);
        feedback.setViewCount(feedback.getViewCount() + 1);
        return ResponseEntity.ok(toDetailResponse(feedback));
    }

    @GetMapping("/my-feedbacks")
    public ResponseEntity<PagedResponse<FeedbackResponse>> getAllFeedbacks(
            Authentication authentication,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) FeedbackStatus status,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate,
            @RequestParam(required = false) Long wardId,
            @PageableDefault(size = 3, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return getMyFeedbacks(authentication, keyword, category, status, priority, fromDate, toDate, wardId, pageable);
    }

    @GetMapping("/my")
    public ResponseEntity<PagedResponse<FeedbackResponse>> getMyFeedbacks(
            Authentication authentication,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) FeedbackStatus status,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate,
            @RequestParam(required = false) Long wardId,
            @PageableDefault(size = 3, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        String username = authentication.getName();
        LocalDateTime fromDateTime = fromDate == null ? null : fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate == null ? null : toDate.atTime(LocalTime.MAX);
        Pageable newestFirstPage = PageRequest.of(
                pageable.getPageNumber(),
                pageable.getPageSize(),
                Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Feedback> entities = feedbackService.getMyFeedbacks(
                username,
                keyword,
                category,
                status,
                priority,
                fromDateTime,
                toDateTime,
                wardId,
                newestFirstPage);
        return ResponseEntity.ok(toPagedResponse(entities));
    }

    @GetMapping("/my/stats")
    public ResponseEntity<FeedbackLookupStatsResponse> getMyFeedbackStats(
            Authentication authentication,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate,
            @RequestParam(required = false) Long wardId) {
        String username = authentication.getName();
        LocalDateTime fromDateTime = fromDate == null ? null : fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate == null ? null : toDate.atTime(LocalTime.MAX);

        FeedbackLookupStatsResponse stats = feedbackService.getMyFeedbackStats(
                username,
                keyword,
                category,
                priority,
                fromDateTime,
                toDateTime,
                wardId);
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/public")
    public ResponseEntity<PagedResponse<FeedbackResponse>> getPublicFeedbacks(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) FeedbackStatus status,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate,
            @RequestParam(required = false) Long wardId,
            @RequestParam(required = false) List<String> categories,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            Authentication authentication) {
        LocalDateTime fromDateTime = fromDate == null ? null : fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate == null ? null : toDate.atTime(LocalTime.MAX);
        String username = (authentication != null && authentication.isAuthenticated() 
                && !"anonymousUser".equals(authentication.getName())) 
                ? authentication.getName() : null;

        Page<Feedback> entities = feedbackService.getPublicFeedbacks(
                keyword,
                category,
                status,
                fromDateTime,
                toDateTime,
                wardId,
                categories,
                username,
                pageable);
        return ResponseEntity.ok(toPagedResponse(entities));
    }

    @GetMapping("/public/stats")
    public ResponseEntity<FeedbackLookupStatsResponse> getPublicFeedbackStats(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) FeedbackStatus status,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate,
            @RequestParam(required = false) Long wardId,
            @RequestParam(required = false) List<String> categories,
            Authentication authentication) {
        LocalDateTime fromDateTime = fromDate == null ? null : fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate == null ? null : toDate.atTime(LocalTime.MAX);
        String username = (authentication != null && authentication.isAuthenticated() 
                && !"anonymousUser".equals(authentication.getName())) 
                ? authentication.getName() : null;

        FeedbackLookupStatsResponse stats = feedbackService.getPublicFeedbackStats(
                keyword,
                category,
                status,
                fromDateTime,
                toDateTime,
                wardId,
                categories,
                username);
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/public/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<FeedbackResponse> getPublicById(@PathVariable Long id) {
        Feedback feedback = feedbackService.findById(id);
        if (Boolean.FALSE.equals(feedback.getPublicVisible())) {
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated() || 
                auth instanceof org.springframework.security.authentication.AnonymousAuthenticationToken ||
                !feedbackService.canAccessFeedback(feedback, auth.getName())) {
                throw new com.example.smartcity.common.exception.ResourceNotFoundException("Feedback", id);
            }
        }
        feedbackService.incrementViewCount(id);
        feedback.setViewCount(feedback.getViewCount() + 1);
        return ResponseEntity.ok(toDetailResponse(feedback));
    }

    @GetMapping("/statuses")
    public ResponseEntity<List<StatusOptionResponse>> getStatuses() {
        List<StatusOptionResponse> statuses = Arrays.stream(FeedbackStatus.values())
                .map(status -> StatusOptionResponse.builder()
                        .value(status.name())
                        .label(toStatusLabel(status))
                        .build())
                .toList();
        return ResponseEntity.ok(statuses);
    }

    @PostMapping("/submit")
    public ResponseEntity<FeedbackResponse> createFeedback(
            @Valid @RequestBody FeedbackRequest request,
            Authentication authentication) {
        String username = authentication.getName();
        Feedback saved = feedbackService.createFeedback(request, username);
        return ResponseEntity.ok(feedbackMapper.toDto(saved));
    }

    @PostMapping("/{id}/supplement")
    @PreAuthorize("hasRole('CITIZEN')")
    public ResponseEntity<FeedbackResponse> supplementInfo(
            @PathVariable Long id,
            @Valid @RequestBody FeedbackSupplementRequest request,
            Authentication authentication) {
        if ((request.getContent() == null || request.getContent().trim().isEmpty()) &&
                (request.getImageUrls() == null || request.getImageUrls().isEmpty())) {
            throw new com.example.smartcity.common.exception.CustomException(
                    "Vui lòng cung cấp nội dung mô tả hoặc ít nhất một hình ảnh.",
                    org.springframework.http.HttpStatus.BAD_REQUEST.value()
            );
        }
        Feedback updated = feedbackService.supplementInfo(
                id,
                request.getContent(),
                request.getImageUrls(),
                authentication.getName()
        );
        return ResponseEntity.ok(toDetailResponse(updated));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasRole('CITIZEN')")
    public ResponseEntity<FeedbackResponse> cancelFeedback(
            @PathVariable Long id,
            Authentication authentication) {
        Feedback updated = feedbackService.cancelFeedback(id, authentication.getName());
        return ResponseEntity.ok(toDetailResponse(updated));
    }

    // ═══ State Machine Endpoints ═════════════════════════════════

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('WARD_STAFF', 'POLICE', 'SUPER_ADMIN')")
    public ResponseEntity<FeedbackResponse> changeStatus(
            @PathVariable Long id,
            @Valid @RequestBody StatusChangeRequest request,
            Authentication authentication) {
        Feedback updated = feedbackService.changeStatus(
                id,
                request.getStatus(),
                request.getNote(),
                request.getRequestMessage(),
                request.getResponseDeadline(),
                Boolean.TRUE.equals(request.getSendNotification()),
                authentication.getName());
        return ResponseEntity.ok(feedbackMapper.toDto(updated));
    }

    @PatchMapping("/{id}/assign")
    public ResponseEntity<FeedbackResponse> assignFeedback(
            @PathVariable Long id,
            @Valid @RequestBody AssignRequest request,
            Authentication authentication) {
        Feedback updated = feedbackService.assignFeedback(id, request.getAssigneeId(), authentication.getName());
        return ResponseEntity.ok(feedbackMapper.toDto(updated));
    }

    @GetMapping("/{id}/logs")
    public ResponseEntity<List<FeedbackLogResponse>> getLogs(@PathVariable Long id) {
        return ResponseEntity.ok(feedbackService.getFeedbackLogs(id));
    }

    private PagedResponse<FeedbackResponse> toPagedResponse(Page<Feedback> page) {
        List<Long> feedbackIds = page.getContent().stream()
                .map(Feedback::getId)
                .toList();
        Map<Long, List<FeedbackAttachmentResponse>> attachmentsByFeedbackId =
                feedbackService.getAttachmentsForFeedbacks(feedbackIds).stream()
                        .collect(Collectors.groupingBy(
                                attachment -> attachment.getFeedback().getId(),
                                Collectors.mapping(this::toAttachmentResponse, Collectors.toList())));

        List<FeedbackResponse> content = page.getContent().stream()
                .map(feedback -> {
                    FeedbackResponse response = feedbackMapper.toDto(feedback);
                    List<FeedbackAttachmentResponse> attachments = attachmentsByFeedbackId.getOrDefault(feedback.getId(), List.of());
                    response.setAttachments(attachments);
                    response.setMediaUrls(attachments.stream().map(FeedbackAttachmentResponse::getFileUrl).toList());
                    return response;
                })
                .toList();

        return PagedResponse.<FeedbackResponse>builder()
                .content(content)
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .hasNext(page.hasNext())
                .build();
    }

    private FeedbackAttachmentResponse toAttachmentResponse(Attachment attachment) {
        return FeedbackAttachmentResponse.builder()
                .id(attachment.getId())
                .fileUrl(attachment.getFileUrl())
                .fileType(attachment.getFileType())
                .fileName(attachment.getFileName())
                .fileSize(attachment.getFileSize())
                .uploadedAt(attachment.getUploadedAt())
                .attachmentPurpose(attachment.getAttachmentPurpose())
                .build();
    }

    private FeedbackResponse toDetailResponse(Feedback feedback) {
        FeedbackResponse response = feedbackMapper.toDto(feedback);
        List<FeedbackAttachmentResponse> attachments = feedbackService
                .getAttachmentsForFeedbacks(List.of(feedback.getId()))
                .stream()
                .map(this::toAttachmentResponse)
                .toList();
        List<FeedbackLogResponse> timeline = feedbackService.getFeedbackLogs(feedback.getId());

        response.setCode(response.getTrackingCode());
        response.setContent(response.getDescription());
        response.setAddress(response.getAddressDetails());
        response.setCategory(response.getCategoryName());
        response.setAssignedAuthorityName(response.getAssignedUnitName());
        response.setAttachments(attachments);
        response.setMediaUrls(attachments.stream()
                .filter(a -> !"RESOLUTION_EVIDENCE".equals(a.getAttachmentPurpose()))
                .filter(a -> "IMAGE".equalsIgnoreCase(a.getFileType()))
                .map(FeedbackAttachmentResponse::getFileUrl)
                .toList());
                
        response.setVideoUrl(attachments.stream()
                .filter(a -> !"RESOLUTION_EVIDENCE".equals(a.getAttachmentPurpose()))
                .filter(a -> "VIDEO".equalsIgnoreCase(a.getFileType()))
                .map(FeedbackAttachmentResponse::getFileUrl)
                .findFirst()
                .orElse(null));
        response.setTimeline(timeline);

        // Ưu tiên resolutionNote (message thân thiện do AI/cán bộ set).
        // Chỉ fallback sang FeedbackLog note nếu resolutionNote không có.
        String friendlyNote = (feedback.getResolutionNote() != null && !feedback.getResolutionNote().isBlank())
                ? feedback.getResolutionNote()
                : timeline.stream()
                    .filter(log -> log.getNote() != null && !log.getNote().isBlank()
                            && !log.getNote().startsWith("[AI") && !log.getNote().startsWith("🔄")
                            && !log.getNote().startsWith("🟢") && !log.getNote().startsWith("🟡")
                            && !log.getNote().startsWith("🔴"))
                    .findFirst()
                    .map(FeedbackLogResponse::getNote)
                    .orElse(null);
        if (feedback.getStatus() == FeedbackStatus.REJECTED) {
            response.setRejectionReason(friendlyNote);
        }
        if (feedback.getStatus() == FeedbackStatus.RESOLVED) {
            String latestNote = timeline.stream()
                    .filter(log -> log.getNote() != null && !log.getNote().isBlank())
                    .findFirst()
                    .map(FeedbackLogResponse::getNote)
                    .orElse(feedback.getResolutionNote());
            response.setResultContent(latestNote);
        }

        return response;
    }

    private String toStatusLabel(FeedbackStatus status) {
        return switch (status) {
            case PENDING -> "Pending Review";
            case SUBMITTED -> "Submitted";
            case PENDING_RECEIVE -> "Pending Receive";
            case NEED_LOCATION_REVIEW -> "Needs Location Review";
            case ASSIGNED -> "Assigned";
            case IN_PROGRESS -> "Processing";
            case WAITING_INFO -> "Waiting for Information";
            case RESOLVED -> "Resolved";
            case REJECTED -> "Rejected";
            case PRE_EMPTIVE -> "Pre-emptive";
        };
    }
}
