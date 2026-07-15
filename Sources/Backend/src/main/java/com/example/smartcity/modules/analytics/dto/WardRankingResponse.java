package com.example.smartcity.modules.analytics.dto;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTO for leaderboard entries.
 */
public record WardRankingResponse(
        Long wardId,
        String wardName,
        BigDecimal overallScore,
        int rankPosition,
        Integer previousRank,
        int rankChange,
        BigDecimal resolutionRate,
        BigDecimal speedScore,
        int totalFeedbacks,
        int resolvedCount,
        BigDecimal avgResolutionHours,
        List<String> badges
) {}
