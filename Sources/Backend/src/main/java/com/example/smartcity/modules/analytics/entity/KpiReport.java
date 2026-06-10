package com.example.smartcity.modules.analytics.entity;

import com.example.smartcity.modules.core.entity.Ward;
import com.example.smartcity.modules.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "kpi_reports")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KpiReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdByUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ward_id")
    private Ward ward;

    @Column(name = "report_type", length = 100)
    private String reportType;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(name = "file_url", length = 500)
    private String fileUrl;

    @Column(name = "created_at", updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
