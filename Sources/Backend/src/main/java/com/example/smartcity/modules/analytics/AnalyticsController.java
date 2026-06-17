package com.example.smartcity.modules.analytics;

import com.example.smartcity.modules.feedback.entity.FeedbackStatus;
import com.example.smartcity.modules.feedback.repository.FeedbackRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'WARD_STAFF', 'POLICE')")
public class AnalyticsController {

    private final FeedbackRepository feedbackRepository;

    /**
     * KPI endpoint — dùng 1 aggregate query GROUP BY status thay vì 2 COUNT riêng lẻ.
     */
    @GetMapping("/kpi")
    public ResponseEntity<KpiResponse> getKpi() {
        List<Object[]> rows = feedbackRepository.countByStatusGrouped();
        long total = 0, resolved = 0, inProgress = 0, pending = 0, overdue = 0;
        for (Object[] row : rows) {
            FeedbackStatus status = (FeedbackStatus) row[0];
            long count = ((Number) row[1]).longValue();
            total += count;
            switch (status) {
                case RESOLVED -> resolved += count;
                case IN_PROGRESS, WAITING_INFO -> inProgress += count;
                case PENDING, SUBMITTED, PENDING_RECEIVE, NEED_LOCATION_REVIEW -> pending += count;
                default -> {}
            }
        }
        long unresolvedTotal = total - resolved;
        return ResponseEntity.ok(new KpiResponse(total, resolved, unresolvedTotal, inProgress, pending));
    }

    @GetMapping("/ward-performance")
    public ResponseEntity<List<WardPerformance>> getWardPerformance() {
        List<Object[]> stats = feedbackRepository.getWardPerformanceStats();
        List<WardPerformance> result = stats.stream().map(row -> {
            String name = (String) row[0];
            long total = ((Number) row[1]).longValue();
            long resolvedCount = ((Number) row[2]).longValue();
            return new WardPerformance(name, (int) resolvedCount, total > 0 ? (int) (resolvedCount * 100 / total) : 0);
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    /**
     * Monthly trend — dùng DB aggregate GROUP BY year/month thay vì load toàn bộ Feedback vào memory.
     */
    @GetMapping("/monthly-trend")
    public ResponseEntity<List<MonthlyTrend>> getMonthlyTrend(@RequestParam(defaultValue = "12") int months) {
        LocalDateTime from = LocalDateTime.now().minusMonths(months);
        LocalDateTime to = LocalDateTime.now();

        List<Object[]> dbRows = feedbackRepository.getMonthlyTrendStats(from, to);

        // Tạo map skeleton với tất cả tháng trong khoảng (kể cả tháng 0 record)
        Map<String, int[]> trend = new LinkedHashMap<>();
        for (int i = months - 1; i >= 0; i--) {
            LocalDateTime m = LocalDateTime.now().minusMonths(i);
            String key = "T" + m.getMonthValue() + "/" + m.getYear() % 100;
            trend.put(key, new int[]{0, 0});
        }

        for (Object[] row : dbRows) {
            int year = ((Number) row[0]).intValue();
            int month = ((Number) row[1]).intValue();
            long totalCount = ((Number) row[2]).longValue();
            long resolvedCount = ((Number) row[3]).longValue();
            String key = "T" + month + "/" + year % 100;
            if (trend.containsKey(key)) {
                trend.get(key)[0] = (int) totalCount;
                trend.get(key)[1] = (int) resolvedCount;
            }
        }

        List<MonthlyTrend> result = trend.entrySet().stream()
                .map(e -> new MonthlyTrend(e.getKey(), e.getValue()[0], e.getValue()[1]))
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/dispatch")
    public ResponseEntity<List<DispatchAgency>> getDispatchAgencies() {
        return ResponseEntity.ok(Arrays.asList(
                new DispatchAgency("Điện lực EVN", 23, "ok"),
                new DispatchAgency("Viễn thông VNPT", 8, "ok"),
                new DispatchAgency("Cấp thoát nước DAWACO", 14, "warn")
        ));
    }

    // ─── DTOs ─────────────────────────────────────────────────

    public record KpiResponse(long total, long resolved, long unresolved, long inProgress, long pending) {}
    public record WardPerformance(String name, int resolved, int satisfactionPct) {}
    public record MonthlyTrend(String month, int total, int resolved) {}
    public record DispatchAgency(String name, int pendingCount, String status) {}
}
