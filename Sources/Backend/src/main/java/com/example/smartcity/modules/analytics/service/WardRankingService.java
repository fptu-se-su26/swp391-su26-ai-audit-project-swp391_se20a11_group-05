package com.example.smartcity.modules.analytics.service;

import com.example.smartcity.modules.analytics.dto.WardDetailResponse;
import com.example.smartcity.modules.analytics.dto.WardRankingResponse;
import com.example.smartcity.modules.analytics.entity.WardAchievement;
import com.example.smartcity.modules.analytics.entity.WardRankingSnapshot;
import com.example.smartcity.modules.analytics.repository.WardAchievementRepository;
import com.example.smartcity.modules.analytics.repository.WardRankingSnapshotRepository;
import com.example.smartcity.modules.feedback.repository.FeedbackRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class WardRankingService {

    private final FeedbackRepository feedbackRepository;
    private final WardRankingSnapshotRepository snapshotRepository;
    private final WardAchievementRepository achievementRepository;

    // Trọng số điểm tổng hợp — PHẢI khớp với nhãn hiển thị trên trang xếp hạng
    // (frontend leaderboard.$wardId.tsx). Tổng = 1.00.
    private static final double W_SPEED = 0.35;         // Tốc độ xử lý
    private static final double W_RESOLUTION = 0.30;    // Tỷ lệ giải quyết
    private static final double W_SATISFACTION = 0.20;  // Hài lòng của người dân
    private static final double W_LOW_INCIDENCE = 0.10; // Mức phát sinh (môi trường)
    private static final double W_TREND = 0.05;         // Xu hướng cải thiện
    // Tổng trọng số 4 thành phần nền (không tính xu hướng) = 0.95
    private static final double W_BASE_TOTAL = W_SPEED + W_RESOLUTION + W_SATISFACTION + W_LOW_INCIDENCE;

    // Placeholder dân số: chưa có dữ liệu điều tra dân số theo phường nên dùng
    // hằng số chung. Vì mọi phường cùng giá trị, điểm "mức phát sinh" thực chất
    // được chuẩn hóa theo số lượng phản ánh (min-max) chứ không theo mật độ dân.
    private static final int DEFAULT_POPULATION = 15000;

    /**
     * Calculate and persist monthly ranking for a given period.
     * Intended to be called by the scheduled job or admin recalculate endpoint.
     */
    @Transactional
    public void calculateAndStoreMonthlyRanking(int year, int month) {
        log.info("Calculating ward ranking for {}-{}", year, month);

        LocalDate periodStart = LocalDate.of(year, month, 1);
        LocalDateTime fromDate = periodStart.atStartOfDay();
        LocalDateTime toDate = periodStart.plusMonths(1).atStartOfDay();

        snapshotRepository.deleteByPeriodYearAndPeriodMonth(year, month);
        achievementRepository.deleteByPeriodYearAndPeriodMonth(year, month);

        List<Object[]> rawStats = feedbackRepository.getWardRankingStats(fromDate, toDate);

        if (rawStats.isEmpty()) {
            log.info("No feedback data for {}-{}, skipping ranking", year, month);
            return;
        }

        int prevYear = month == 1 ? year - 1 : year;
        int prevMonth = month == 1 ? 12 : month - 1;
        Map<Long, WardRankingSnapshot> prevSnapshots = snapshotRepository
                .findByPeriodYearAndPeriodMonthOrderByRankPositionAsc(prevYear, prevMonth)
                .stream()
                .collect(Collectors.toMap(WardRankingSnapshot::getWardId, s -> s));

        // Pass 1: compute reportsPerCapita to find min/max for min-max normalization
        double maxRpc = 0;
        double minRpc = Double.MAX_VALUE;
        for (Object[] row : rawStats) {
            int total = ((Number) row[2]).intValue();
            if (total < 5) continue; // Exclude from normalization scale to avoid skew
            int pop = row[7] != null ? ((Number) row[7]).intValue() : DEFAULT_POPULATION;
            if (pop == 0) pop = DEFAULT_POPULATION;
            double rpc = (double) total / pop * 10000;
            if (rpc > maxRpc) maxRpc = rpc;
            if (rpc < minRpc) minRpc = rpc;
        }
        if (minRpc == Double.MAX_VALUE) minRpc = 0;
        if (maxRpc == minRpc) maxRpc = minRpc + 1; // prevent div by zero

        List<WardRankingSnapshot> snapshots = new ArrayList<>();
        for (Object[] row : rawStats) {
            Long wardId = ((Number) row[0]).longValue();
            int total = ((Number) row[2]).intValue();
            int resolved = ((Number) row[3]).intValue();
            Double avgHours = row[4] != null ? ((Number) row[4]).doubleValue() : null;
            int onTimeResolved = row[5] != null ? ((Number) row[5]).intValue() : 0;
            Double avgRating = row[6] != null ? ((Number) row[6]).doubleValue() : null;
            int pop = row[7] != null ? ((Number) row[7]).intValue() : DEFAULT_POPULATION;
            if (pop == 0) pop = DEFAULT_POPULATION;

            WardRankingSnapshot snapshot = new WardRankingSnapshot();
            snapshot.setWardId(wardId);
            snapshot.setPeriodYear(year);
            snapshot.setPeriodMonth(month);
            snapshot.setTotalFeedbacks(total);
            snapshot.setResolvedCount(resolved);
            snapshot.setResolutionRate(toBigDecimal(total > 0 ? (double) resolved / total * 100.0 : 0));
            snapshot.setAvgResolutionHours(toBigDecimal(avgHours != null ? avgHours : 0));

            if (total < 5) {
                snapshot.setStatus("INSUFFICIENT_DATA");
                snapshots.add(snapshot);
                continue; // Skip calculating scores
            }

            // 1. Điểm tốc độ xử lý (0-100): kết hợp tỷ lệ đúng hạn (≤48h) và thời gian TB
            double onTimeRate = resolved > 0 ? (double) onTimeResolved / resolved : 0;
            double hoursNorm = avgHours == null ? 1.0 : Math.max(0, 1.0 - (avgHours / 48.0));
            double speedScore = (onTimeRate * 100.0 * 0.70) + (hoursNorm * 100.0 * 0.30);

            // 2. Điểm tỷ lệ giải quyết (0-100): % phản ánh đã RESOLVED
            double resolutionScore = total > 0 ? (double) resolved / total * 100.0 : 0.0;

            // 3. Điểm mức phát sinh (0-100): ít phản ánh trên quy mô → điểm cao
            double rpc = (double) total / pop * 10000;
            double rpcNorm = (rpc - minRpc) / (maxRpc - minRpc); // 0 to 1
            double lowIncidenceScore = 100.0 - (rpcNorm * 100.0);

            // 4. Điểm hài lòng (0-100). Nếu CHƯA có đánh giá nào → không tính điểm này
            // (loại khỏi công thức và phân bổ lại trọng số) thay vì tặng điểm tối đa.
            boolean hasRating = avgRating != null;
            double satisfactionScore = hasRating ? (avgRating / 5.0) * 100.0 : 0.0;

            // Trọng số 4 thành phần nền; nếu thiếu điểm hài lòng thì chia đều phần
            // trọng số của nó cho 3 thành phần còn lại theo tỷ lệ.
            double wSpeed = W_SPEED, wRes = W_RESOLUTION, wLow = W_LOW_INCIDENCE, wSat = W_SATISFACTION;
            if (!hasRating) {
                double others = W_SPEED + W_RESOLUTION + W_LOW_INCIDENCE;
                wSpeed += W_SATISFACTION * (W_SPEED / others);
                wRes += W_SATISFACTION * (W_RESOLUTION / others);
                wLow += W_SATISFACTION * (W_LOW_INCIDENCE / others);
                wSat = 0.0;
            }

            // Điểm nền (tổng trọng số = W_BASE_TOTAL = 0.95)
            double baseScore = speedScore * wSpeed
                    + resolutionScore * wRes
                    + satisfactionScore * wSat
                    + lowIncidenceScore * wLow;
            double baseScoreScaled = baseScore / W_BASE_TOTAL; // quy về thang 0-100 để so sánh xu hướng

            // 5. Điểm xu hướng cải thiện (0-100): so với điểm tổng tháng trước
            double prevScore = prevSnapshots.containsKey(wardId) ? prevSnapshots.get(wardId).getOverallScore().doubleValue() : 50.0;
            double trendScore = 50.0 + (baseScoreScaled - prevScore) * 5.0;
            trendScore = Math.max(0.0, Math.min(100.0, trendScore));

            // Điểm tổng hợp cuối cùng (0-100)
            double overallScore = baseScore + trendScore * W_TREND;

            snapshot.setSpeedScore(toBigDecimal(speedScore));
            snapshot.setLowIncidenceScore(toBigDecimal(lowIncidenceScore));
            // Lưu null khi chưa có đánh giá để giao diện hiển thị "Chưa có đánh giá"
            snapshot.setSatisfactionScore(hasRating ? toBigDecimal(satisfactionScore) : null);
            snapshot.setTrendScore(toBigDecimal(trendScore));
            snapshot.setOverallScore(toBigDecimal(overallScore));
            snapshot.setStatus("RANKED");
            
            if (prevSnapshots.containsKey(wardId)) {
                snapshot.setPreviousRank(prevSnapshots.get(wardId).getRankPosition());
            }

            snapshots.add(snapshot);
        }

        // Sort ONLY the RANKED wards
        List<WardRankingSnapshot> rankedWards = snapshots.stream()
                .filter(s -> "RANKED".equals(s.getStatus()))
                .sorted(Comparator.comparing(WardRankingSnapshot::getOverallScore).reversed())
                .collect(Collectors.toList());

        for (int i = 0; i < rankedWards.size(); i++) {
            rankedWards.get(i).setRankPosition(i + 1);
        }

        snapshotRepository.saveAll(snapshots);

        // Detect and store badges
        detectAndStoreBadges(snapshots, prevSnapshots, year, month, rawStats);

        log.info("Ward ranking calculated for {}-{}: {} wards ranked", year, month, snapshots.size());
    }

    /**
     * Get leaderboard for a specific period. If year/month not provided, uses current month.
     */
    @Transactional(readOnly = true)
    public List<WardRankingResponse> getLeaderboard(Integer year, Integer month) {
        int y = year != null ? year : LocalDate.now().getYear();
        int m = month != null ? month : LocalDate.now().getMonthValue();

        List<WardRankingSnapshot> snapshots =
                snapshotRepository.findByPeriodYearAndPeriodMonthOrderByRankPositionAsc(y, m);

        // Load badges for this period
        Map<Long, List<String>> badgesByWard = achievementRepository
                .findByPeriodYearAndPeriodMonth(y, m)
                .stream()
                .collect(Collectors.groupingBy(
                        WardAchievement::getWardId,
                        Collectors.mapping(WardAchievement::getBadgeCode, Collectors.toList())));

        // We need ward names — load from the raw stats or join
        // Since snapshots don't store ward name, fetch from the feedback query
        Map<Long, String> wardNames = getWardNames(snapshots);

        return snapshots.stream().map(s -> {
            int rankChange = (s.getPreviousRank() != null && s.getRankPosition() != null)
                    ? s.getPreviousRank() - s.getRankPosition()
                    : 0;
            return new WardRankingResponse(
                    s.getWardId(),
                    wardNames.getOrDefault(s.getWardId(), "Phường #" + s.getWardId()),
                    s.getOverallScore(),
                    s.getRankPosition() != null ? s.getRankPosition() : 0,
                    s.getPreviousRank() != null ? s.getPreviousRank() : 0,
                    rankChange,
                    s.getResolutionRate(),
                    s.getSpeedScore(),
                    s.getTotalFeedbacks(),
                    s.getResolvedCount(),
                    s.getAvgResolutionHours(),
                    badgesByWard.getOrDefault(s.getWardId(), List.of())
            );
        }).toList();
    }

    /**
     * Get top N wards for the homepage widget.
     */
    @Transactional(readOnly = true)
    public List<WardRankingResponse> getTopWards(int limit) {
        List<WardRankingResponse> leaderboard = getLeaderboard(null, null);
        return leaderboard.stream().limit(limit).toList();
    }

    /**
     * Get detailed ward scorecard.
     */
    @Transactional(readOnly = true)
    public WardDetailResponse getWardDetail(Long wardId, Integer year, Integer month) {
        List<WardRankingSnapshot> history =
                snapshotRepository.findByWardIdOrderByPeriodYearDescPeriodMonthDesc(wardId);

        List<WardAchievement> achievements = achievementRepository.findByWardId(wardId);

        // Current = most recent snapshot OR specific month if year/month provided
        WardRankingSnapshot current = null;
        if (year != null && month != null) {
            current = history.stream()
                .filter(s -> s.getPeriodYear() == year && s.getPeriodMonth() == month)
                .findFirst()
                .orElse(null);
        }
        if (current == null) {
            current = history.isEmpty() ? null : history.get(0);
        }

        // Ward name from any snapshot or fallback
        Map<Long, String> wardNames = getWardNames(history);
        String wardName = wardNames.getOrDefault(wardId, "Phường #" + wardId);

        List<WardDetailResponse.MonthlyScore> historyDtos = history.stream()
                .map(s -> new WardDetailResponse.MonthlyScore(
                        s.getPeriodYear(), s.getPeriodMonth(),
                        s.getOverallScore(), s.getRankPosition() != null ? s.getRankPosition() : 0))
                .toList();

        List<WardDetailResponse.AchievementDto> achievementDtos = achievements.stream()
                .map(a -> new WardDetailResponse.AchievementDto(
                        a.getBadgeCode(), a.getBadgeLabel(),
                        a.getEarnedAt() != null ? a.getEarnedAt().toString() : null))
                .toList();

        return new WardDetailResponse(
                wardId,
                wardName,
                current != null && current.getOverallScore() != null ? current.getOverallScore() : BigDecimal.ZERO,
                current != null && current.getRankPosition() != null ? current.getRankPosition() : 0,
                current != null && current.getResolutionRate() != null ? current.getResolutionRate() : BigDecimal.ZERO,
                current != null && current.getAvgResolutionHours() != null ? current.getAvgResolutionHours() : BigDecimal.ZERO,
                current != null && current.getSpeedScore() != null ? current.getSpeedScore() : BigDecimal.ZERO,
                current != null && current.getLowIncidenceScore() != null ? current.getLowIncidenceScore() : BigDecimal.ZERO,
                current != null ? current.getSatisfactionScore() : null,
                current != null && current.getTrendScore() != null ? current.getTrendScore() : BigDecimal.ZERO,
                current != null ? current.getTotalFeedbacks() : 0,
                current != null ? current.getResolvedCount() : 0,
                historyDtos,
                achievementDtos
        );
    }

    // ─── Private helpers ────────────────────────────────────────

    private BigDecimal toBigDecimal(double value) {
        return BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP);
    }

    private void detectAndStoreBadges(List<WardRankingSnapshot> snapshots,
                                       Map<Long, WardRankingSnapshot> prevSnapshots,
                                       int year, int month,
                                       List<Object[]> rawStats) {
        List<WardAchievement> badges = new ArrayList<>();

        // Map raw stats for avg hours lookup
        Map<Long, Double> avgHoursMap = new HashMap<>();
        for (Object[] row : rawStats) {
            Long wardId = ((Number) row[0]).longValue();
            Double avgHours = row[4] != null ? ((Number) row[4]).doubleValue() : null;
            if (avgHours != null) avgHoursMap.put(wardId, avgHours);
        }

        // TOP_PERFORMER: rank 1-3
        for (WardRankingSnapshot s : snapshots) {
            if (s.getRankPosition() != null && s.getRankPosition() <= 3) {
                String label = switch (s.getRankPosition()) {
                    case 1 -> "Quán quân";
                    case 2 -> "Á quân";
                    case 3 -> "Hạng ba";
                    default -> "Top Performer";
                };
                badges.add(new WardAchievement(s.getWardId(), "TOP_PERFORMER", label, year, month));
            }
        }

        // FASTEST_RESPONDER: avg resolution < 12 hours
        for (WardRankingSnapshot s : snapshots) {
            Double avgHours = avgHoursMap.get(s.getWardId());
            if (avgHours != null && avgHours < 12.0) {
                badges.add(new WardAchievement(s.getWardId(), "FASTEST_RESPONDER",
                        "Phản hồi nhanh nhất", year, month));
            }
        }

        // RISING_STAR: climbed 3+ positions
        for (WardRankingSnapshot s : snapshots) {
            Integer prev = prevSnapshots.containsKey(s.getWardId()) ? prevSnapshots.get(s.getWardId()).getRankPosition() : null;
            if (prev != null && s.getRankPosition() != null && prev - s.getRankPosition() >= 3) {
                badges.add(new WardAchievement(s.getWardId(), "RISING_STAR",
                        "Ngôi sao đang lên", year, month));
            }
        }

        // MOST_IMPROVED: highest positive score improvement (find the ward with biggest rank jump)
        WardRankingSnapshot mostImproved = null;
        int bestJump = 0;
        for (WardRankingSnapshot s : snapshots) {
            Integer prev = prevSnapshots.containsKey(s.getWardId()) ? prevSnapshots.get(s.getWardId()).getRankPosition() : null;
            if (prev != null && s.getRankPosition() != null) {
                int jump = prev - s.getRankPosition();
                if (jump > bestJump) {
                    bestJump = jump;
                    mostImproved = s;
                }
            }
        }
        if (mostImproved != null && bestJump > 0) {
            badges.add(new WardAchievement(mostImproved.getWardId(), "MOST_IMPROVED",
                    "Tiến bộ nhất", year, month));
        }

        if (!badges.isEmpty()) {
            achievementRepository.saveAll(badges);
        }
    }

    /**
     * Resolve ward names from ward IDs. Uses a simple query to the wards table.
     */
    private Map<Long, String> getWardNames(List<WardRankingSnapshot> snapshots) {
        if (snapshots.isEmpty()) return Map.of();
        // Use a fresh aggregate query to get ward names (lightweight)
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime yearAgo = now.minusYears(1);
        List<Object[]> stats = feedbackRepository.getWardRankingStats(yearAgo, now);
        Map<Long, String> names = new HashMap<>();
        for (Object[] row : stats) {
            names.put(((Number) row[0]).longValue(), (String) row[1]);
        }
        return names;
    }

    /**
     * Generate PDF Report for Ward Scorecard.
     */
    @Transactional(readOnly = true)
    public byte[] generatePdfReport(Long wardId) {
        WardDetailResponse detail = getWardDetail(wardId, null, null);
        try (java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream()) {
            com.lowagie.text.Document document = new com.lowagie.text.Document();
            com.lowagie.text.pdf.PdfWriter.getInstance(document, baos);
            document.open();

            com.lowagie.text.Font titleFont = new com.lowagie.text.Font(com.lowagie.text.Font.HELVETICA, 18, com.lowagie.text.Font.BOLD);
            com.lowagie.text.Font normalFont = new com.lowagie.text.Font(com.lowagie.text.Font.HELVETICA, 12, com.lowagie.text.Font.NORMAL);

            document.add(new com.lowagie.text.Paragraph("Bao cao danh gia KPI - " + detail.wardName(), titleFont));
            document.add(new com.lowagie.text.Paragraph(" "));
            
            document.add(new com.lowagie.text.Paragraph("Diem tong hop: " + detail.currentScore() + " (Hang " + detail.currentRank() + ")", normalFont));
            document.add(new com.lowagie.text.Paragraph(" "));

            document.add(new com.lowagie.text.Paragraph("Chi tiet diem:", titleFont));
            document.add(new com.lowagie.text.Paragraph("- Toc do xu ly (Speed Score): " + detail.speedScore(), normalFont));
            document.add(new com.lowagie.text.Paragraph("- Muc do phat sinh (Low Incidence): " + detail.lowIncidenceScore(), normalFont));
            document.add(new com.lowagie.text.Paragraph("- Muc do hai long (Satisfaction): " + (detail.satisfactionScore() != null ? detail.satisfactionScore() : "Chua co danh gia"), normalFont));
            document.add(new com.lowagie.text.Paragraph("- Diem xu huong (Trend Score): " + detail.trendScore(), normalFont));
            document.add(new com.lowagie.text.Paragraph(" "));
            
            document.add(new com.lowagie.text.Paragraph("Thong ke phan anh:", titleFont));
            document.add(new com.lowagie.text.Paragraph("- Tong so phan anh: " + detail.totalFeedbacks(), normalFont));
            document.add(new com.lowagie.text.Paragraph("- Da xu ly: " + detail.resolvedCount(), normalFont));
            document.add(new com.lowagie.text.Paragraph("- Ty le xu ly: " + detail.resolutionRate() + "%", normalFont));
            document.add(new com.lowagie.text.Paragraph("- Thoi gian xu ly trung binh: " + detail.avgResolutionHours() + " gio", normalFont));

            document.close();
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("Error generating PDF for ward " + wardId, e);
            throw new RuntimeException("Could not generate PDF report");
        }
    }
}
