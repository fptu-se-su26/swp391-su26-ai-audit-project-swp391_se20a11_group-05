package com.example.smartcity.modules.feedback.controller;

import com.example.smartcity.common.response.ApiResponse;
import com.example.smartcity.modules.feedback.dto.AiDashboardStatsResponse;
import com.example.smartcity.modules.feedback.entity.AiAnalysisLog;
import com.example.smartcity.modules.feedback.repository.AiAnalysisLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/ai/dashboard")
@RequiredArgsConstructor
public class AiDashboardController {

    private final AiAnalysisLogRepository aiAnalysisLogRepository;

    @GetMapping("/stats")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<AiDashboardStatsResponse>> getStats() {
        long count = aiAnalysisLogRepository.countTotalLogs();
        Double avgTrustScore = aiAnalysisLogRepository.getAverageTrustScore();
        Long sumInput = aiAnalysisLogRepository.sumInputTokens();
        Long sumOutput = aiAnalysisLogRepository.sumOutputTokens();

        if (avgTrustScore == null) avgTrustScore = 0.0;
        long input = sumInput != null ? sumInput : 0L;
        long output = sumOutput != null ? sumOutput : 0L;
        long totalTokens = input + output;
        
        // Assume $0.15 per 1M tokens for gemini-1.5-flash blended average.
        double costUsd = (totalTokens / 1_000_000.0) * 0.15;

        AiDashboardStatsResponse stats = AiDashboardStatsResponse.builder()
                .totalLogs(count)
                .averageTrustScore(Math.round(avgTrustScore * 100.0) / 100.0)
                .totalTokens(totalTokens)
                .estimatedCostUsd(Math.round(costUsd * 10000.0) / 10000.0)
                .build();

        return ResponseEntity.ok(ApiResponse.success("Success", stats));
    }

    @GetMapping("/logs")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<com.example.smartcity.modules.feedback.dto.AiDashboardLogDto>>> getRecentLogs() {
        List<AiAnalysisLog> logs = aiAnalysisLogRepository.findTop50ByOrderByCreatedAtDesc();
        List<com.example.smartcity.modules.feedback.dto.AiDashboardLogDto> dtos = logs.stream()
                .map(com.example.smartcity.modules.feedback.dto.AiDashboardLogDto::fromEntity)
                .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success("Success", dtos));
    }
}
