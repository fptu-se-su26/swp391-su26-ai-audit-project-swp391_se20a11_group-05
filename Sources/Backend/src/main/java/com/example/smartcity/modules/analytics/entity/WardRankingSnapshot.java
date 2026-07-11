package com.example.smartcity.modules.analytics.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "ward_ranking_snapshots",
       uniqueConstraints = @UniqueConstraint(columnNames = {"ward_id", "period_year", "period_month"}))
@Getter
@Setter
@NoArgsConstructor
public class WardRankingSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ward_id", nullable = false)
    private Long wardId;

    @Column(name = "period_year", nullable = false)
    private int periodYear;

    @Column(name = "period_month", nullable = false)
    private int periodMonth;

    @Column(name = "total_feedbacks", nullable = false)
    private int totalFeedbacks;

    @Column(name = "resolved_count", nullable = false)
    private int resolvedCount;

    @Column(name = "resolution_rate")
    private BigDecimal resolutionRate = BigDecimal.ZERO;

    @Column(name = "avg_resolution_hours")
    private BigDecimal avgResolutionHours = BigDecimal.ZERO;

    @Column(name = "speed_score")
    private BigDecimal speedScore = BigDecimal.ZERO;

    @Column(name = "low_incidence_score")
    private BigDecimal lowIncidenceScore = BigDecimal.ZERO;

    @Column(name = "satisfaction_score")
    private BigDecimal satisfactionScore = BigDecimal.ZERO;

    @Column(name = "trend_score")
    private BigDecimal trendScore = BigDecimal.valueOf(50.0);

    @Column(name = "status")
    private String status = "RANKED";

    @Column(name = "overall_score")
    private BigDecimal overallScore = BigDecimal.ZERO;

    @Column(name = "rank_position")
    private Integer rankPosition;

    @Column(name = "previous_rank")
    private Integer previousRank;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
