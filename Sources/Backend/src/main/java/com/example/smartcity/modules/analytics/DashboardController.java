package com.example.smartcity.modules.analytics;

import com.example.smartcity.modules.feedback.entity.FeedbackStatus;
import com.example.smartcity.modules.feedback.repository.FeedbackRepository;
import com.example.smartcity.modules.user.entity.User;
import com.example.smartcity.modules.user.entity.Role;
import com.example.smartcity.modules.user.repository.UserRepository;
import com.example.smartcity.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'WARD_STAFF')")
public class DashboardController {

    private final FeedbackRepository feedbackRepository;
    private final UserRepository userRepository;

    @GetMapping("/ward-staff/statistics")
    public ResponseEntity<WardStaffStatsResponse> getWardStaffStatistics(
            @RequestParam(value = "date", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User: " + username));

        Long wardId = null;
        if (user.getRole() == Role.WARD_STAFF && user.getWard() != null) {
            wardId = user.getWard().getId();
        }

        LocalDate targetDate = date != null ? date : LocalDate.now();
        LocalDateTime start = targetDate.atStartOfDay();
        LocalDateTime end = targetDate.plusDays(1).atStartOfDay();

        List<Object[]> rawCounts = feedbackRepository.countWardStaffFeedbackByStatusAndDateRange(start, end, wardId);

        long total = 0;
        long pending = 0;
        long inProgress = 0;
        long resolved = 0;
        long rejected = 0;

        for (Object[] row : rawCounts) {
            FeedbackStatus status = (FeedbackStatus) row[0];
            long count = ((Number) row[1]).longValue();
            total += count;
            
            String statusName = status.name();
            if (statusName.equals("SUBMITTED") || statusName.equals("PENDING_RECEIVE") || statusName.equals("PENDING") || statusName.equals("PRE_EMPTIVE")) {
                pending += count;
            } else if (statusName.equals("IN_PROGRESS") || statusName.equals("WAITING_INFO") || statusName.equals("NEED_MORE_INFO") || statusName.equals("ACCEPTED") || statusName.equals("TRANSFERRED") || statusName.equals("ASSIGNED")) {
                inProgress += count;
            } else if (statusName.equals("RESOLVED") || statusName.equals("COMPLETED")) {
                resolved += count;
            } else if (statusName.equals("REJECTED") || statusName.equals("DECLINED")) {
                rejected += count;
            }
        }

        WardStaffStatsResponse response = new WardStaffStatsResponse(total, pending, inProgress, resolved, rejected);
        return ResponseEntity.ok(response);
    }

    public record WardStaffStatsResponse(long total, long pending, long inProgress, long resolved, long rejected) {}
}
