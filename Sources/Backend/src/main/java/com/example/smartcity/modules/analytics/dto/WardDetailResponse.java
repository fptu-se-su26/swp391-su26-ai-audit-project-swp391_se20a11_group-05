package com.example.smartcity.modules.analytics.dto;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTO for detailed ward scorecard page.
 */
public record WardDetailResponse(
        Long wardId,
        String wardName,
        BigDecimal currentScore,
        int currentRank,
        BigDecimal resolutionRate,
        BigDecimal avgResolutionHours,
        BigDecimal speedScore,
        BigDecimal lowIncidenceScore,
        BigDecimal satisfactionScore,
        BigDecimal trendScore,
        int totalFeedbacks,
        int resolvedCount,
        List<MonthlyScore> history,
        List<AchievementDto> achievements
) {
    public record MonthlyScore(int year, int month, BigDecimal score, int rank) {}
    public record AchievementDto(String badgeCode, String badgeLabel, String earnedAt) {}
}
