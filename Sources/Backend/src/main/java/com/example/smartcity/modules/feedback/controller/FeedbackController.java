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
    public ResponseEntity<FeedbackResponse> getById(@PathVariable Long id) {
        Feedback feedback = feedbackService.findById(id);
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && !feedbackService.canAccessFeedback(feedback, auth.getName())) {
            throw new CustomException("Bạn không có quyền xem phản ánh này", 403);
        }
        return ResponseEntity.ok(toDetailResponse(feedback));
    }

    @GetMapping("/my-reports/{feedbackId}")
    @PreAuthorize("hasRole('CITIZEN')")
    public ResponseEntity<FeedbackResponse> getMyReportById(
            @PathVariable Long feedbackId,
            Authentication authentication) {
        Feedback feedback = feedbackService.getMyFeedbackById(feedbackId, authentication.getName());
        return ResponseEntity.ok(toDetailResponse(feedback));
    }

    @GetMapping("/my-feedbacks")
    public ResponseEntity<PagedResponse<FeedbackResponse>> getAllFeedbacks(
            Authentication authentication,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) FeedbackStatus status,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate,
            @PageableDefault(size = 3, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return getMyFeedbacks(authentication, keyword, status, fromDate, toDate, pageable);
    }

    @GetMapping("/my")
    public ResponseEntity<PagedResponse<FeedbackResponse>> getMyFeedbacks(
            Authentication authentication,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) FeedbackStatus status,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate,
            @PageableDefault(size = 3, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        String username = authentication.getName();
        LocalDateTime fromDateTime = fromDate == null ? null : fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate == null ? null : toDate.atTime(LocalTime.MAX);
        Pageable newestFirstPage = PageRequest.of(
                pageable.getPageNumber(),
                3,
                Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Feedback> entities = feedbackService.getMyFeedbacks(
                username,
                keyword,
                status,
                fromDateTime,
                toDateTime,
                newestFirstPage);
        return ResponseEntity.ok(toPagedResponse(entities));
    }

    @GetMapping("/public")
    public ResponseEntity<PagedResponse<FeedbackResponse>> getPublicFeedbacks(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) FeedbackStatus status,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        LocalDateTime fromDateTime = fromDate == null ? null : fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate == null ? null : toDate.atTime(LocalTime.MAX);

        Page<Feedback> entities = feedbackService.getPublicFeedbacks(
                keyword,
                category,
                status,
                fromDateTime,
                toDateTime,
                pageable);
        return ResponseEntity.ok(toPagedResponse(entities));
    }

    @GetMapping("/public/stats")
    public ResponseEntity<FeedbackLookupStatsResponse> getPublicFeedbackStats(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) FeedbackStatus status,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate) {
        LocalDateTime fromDateTime = fromDate == null ? null : fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate == null ? null : toDate.atTime(LocalTime.MAX);

        FeedbackLookupStatsResponse stats = feedbackService.getPublicFeedbackStats(
                keyword,
                category,
                status,
                fromDateTime,
                toDateTime);
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/public/{id}")
    public ResponseEntity<FeedbackResponse> getPublicById(@PathVariable Long id) {
        Feedback feedback = feedbackService.findById(id);
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

    // ═══ State Machine Endpoints ═════════════════════════════════

    @PatchMapping("/{id}/status")
    public ResponseEntity<FeedbackResponse> changeStatus(
            @PathVariable Long id,
            @Valid @RequestBody StatusChangeRequest request,
            Authentication authentication) {
        Feedback updated = feedbackService.changeStatus(id, request.getStatus(), request.getNote(), authentication.getName());
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
                    
                    response.setMediaUrls(attachments.stream()
                            .filter(a -> "IMAGE".equalsIgnoreCase(a.getFileType()))
                            .map(FeedbackAttachmentResponse::getFileUrl)
                            .toList());
                            
                    response.setVideoUrl(attachments.stream()
                            .filter(a -> "VIDEO".equalsIgnoreCase(a.getFileType()))
                            .map(FeedbackAttachmentResponse::getFileUrl)
                            .findFirst()
                            .orElse(null));
                            
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
                .filter(a -> "IMAGE".equalsIgnoreCase(a.getFileType()))
                .map(FeedbackAttachmentResponse::getFileUrl)
                .toList());
                
        response.setVideoUrl(attachments.stream()
                .filter(a -> "VIDEO".equalsIgnoreCase(a.getFileType()))
                .map(FeedbackAttachmentResponse::getFileUrl)
                .findFirst()
                .orElse(null));
        response.setTimeline(timeline);

        String latestNote = timeline.stream()
                .filter(log -> log.getNote() != null && !log.getNote().isBlank())
                .findFirst()
                .map(FeedbackLogResponse::getNote)
                .orElse(feedback.getResolutionNote());
        if (feedback.getStatus() == FeedbackStatus.REJECTED) {
            response.setRejectionReason(latestNote);
        }
        if (feedback.getStatus() == FeedbackStatus.RESOLVED) {
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
            case IN_PROGRESS -> "Processing";
            case WAITING_INFO -> "Waiting for Information";
            case RESOLVED -> "Resolved";
            case REJECTED -> "Rejected";
        };
    }
}
