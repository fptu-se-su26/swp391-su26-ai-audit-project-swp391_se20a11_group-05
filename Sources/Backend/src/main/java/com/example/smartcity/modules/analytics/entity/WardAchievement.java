package com.example.smartcity.modules.analytics.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "ward_achievements",
       uniqueConstraints = @UniqueConstraint(columnNames = {"ward_id", "badge_code", "period_year", "period_month"}))
@Getter
@Setter
@NoArgsConstructor
public class WardAchievement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ward_id", nullable = false)
    private Long wardId;

    @Column(name = "badge_code", nullable = false, length = 50)
    private String badgeCode;

    @Column(name = "badge_label", nullable = false, length = 100)
    private String badgeLabel;

    @Column(name = "period_year", nullable = false)
    private int periodYear;

    @Column(name = "period_month", nullable = false)
    private int periodMonth;

    @Column(name = "earned_at", updatable = false)
    private LocalDateTime earnedAt = LocalDateTime.now();

    public WardAchievement(Long wardId, String badgeCode, String badgeLabel, int periodYear, int periodMonth) {
        this.wardId = wardId;
        this.badgeCode = badgeCode;
        this.badgeLabel = badgeLabel;
        this.periodYear = periodYear;
        this.periodMonth = periodMonth;
        this.earnedAt = LocalDateTime.now();
    }
}
