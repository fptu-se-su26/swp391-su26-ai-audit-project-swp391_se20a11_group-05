package com.example.smartcity.modules.analytics;

import com.example.smartcity.modules.feedback.entity.Feedback;
import com.example.smartcity.modules.feedback.entity.FeedbackStatus;
import com.example.smartcity.modules.feedback.repository.FeedbackRepository;
import com.example.smartcity.modules.core.repository.WardRepository;
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
    private final WardRepository wardRepository;

    @GetMapping("/kpi")
    public ResponseEntity<KpiResponse> getKpi() {
        long total = feedbackRepository.count();
        long resolved = feedbackRepository.countByStatus(FeedbackStatus.RESOLVED);
        long pending = total - resolved;
        return ResponseEntity.ok(new KpiResponse(total, resolved, pending, "Đang tính..."));
    }

    @GetMapping("/ward-performance")
    public ResponseEntity<List<WardPerformance>> getWardPerformance() {
        List<Feedback> all = feedbackRepository.findAll();
        Map<String, Long> resolvedMap = all.stream()
                .filter(f -> f.getStatus() == FeedbackStatus.RESOLVED && f.getWard() != null)
                .collect(Collectors.groupingBy(
                        f -> f.getWard().getName(),
                        Collectors.counting()
                ));
        Map<String, Long> totalMap = all.stream()
                .filter(f -> f.getWard() != null)
                .collect(Collectors.groupingBy(
                        f -> f.getWard().getName(),
                        Collectors.counting()
                ));

        List<WardPerformance> result = new ArrayList<>();
        Set<String> wardNames = new LinkedHashSet<>(totalMap.keySet());
        wardNames.addAll(resolvedMap.keySet());
        for (String name : wardNames) {
            long t = totalMap.getOrDefault(name, 0L);
            long r = resolvedMap.getOrDefault(name, 0L);
            result.add(new WardPerformance(name, (int) r, t > 0 ? (int) (r * 100 / t) : 0));
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/monthly-trend")
    public ResponseEntity<List<MonthlyTrend>> getMonthlyTrend(@RequestParam(defaultValue = "12") int months) {
        LocalDateTime from = LocalDateTime.now().minusMonths(months);
        List<Feedback> feedbacks = feedbackRepository.findByCreatedAtBetween(from, LocalDateTime.now());

        Map<String, int[]> trend = new LinkedHashMap<>();
        for (int i = months - 1; i >= 0; i--) {
            LocalDateTime m = LocalDateTime.now().minusMonths(i);
            String key = "T" + m.getMonthValue();
            trend.put(key, new int[]{0, 0});
        }

        for (Feedback f : feedbacks) {
            String key = "T" + f.getCreatedAt().getMonthValue();
            int[] val = trend.get(key);
            if (val != null) {
                val[0]++;
                if (f.getStatus() == FeedbackStatus.RESOLVED) val[1]++;
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

    public record KpiResponse(long total, long resolved, long pending, String satisfactionRate) {}
    public record WardPerformance(String name, int resolved, int satisfactionPct) {}
    public record MonthlyTrend(String month, int total, int resolved) {}
    public record DispatchAgency(String name, int pendingCount, String status) {}
}
