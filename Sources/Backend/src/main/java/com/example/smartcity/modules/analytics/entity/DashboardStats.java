package com.example.smartcity.modules.analytics.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "dashboard_stats")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardStats {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "report_date", nullable = false, unique = true)
    private LocalDate reportDate;

    @Column(name = "total_feedbacks")
    @Builder.Default
    private Integer totalFeedbacks = 0;

    @Column(name = "resolved_feedbacks")
    @Builder.Default
    private Integer resolvedFeedbacks = 0;

    @Column(name = "pending_feedbacks")
    @Builder.Default
    private Integer pendingFeedbacks = 0;

    @Column(name = "average_rating")
    @Builder.Default
    private Double averageRating = 0.0;

    @Column(name = "created_at", updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
