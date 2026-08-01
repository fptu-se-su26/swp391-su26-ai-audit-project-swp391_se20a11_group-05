package com.example.smartcity.modules.feedback.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiDashboardStatsResponse {
    private long totalLogs;
    private double averageTrustScore;
    private long totalTokens;
    private double estimatedCostUsd;
}
