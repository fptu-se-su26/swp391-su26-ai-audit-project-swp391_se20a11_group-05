package com.example.smartcity.modules.feedback.entity;

import com.example.smartcity.modules.core.entity.Ward;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "ai_analysis")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "feedback_id", nullable = false, unique = true)
    private Feedback feedback;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "suggested_ward_id")
    private Ward suggestedWard;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "suggested_category_id")
    private Category suggestedCategory;

    @Column(name = "suggested_priority", length = 20)
    private String suggestedPriority;

    @Column(name = "suggested_receiver_type", length = 20)
    private String suggestedReceiverType;

    @Column(name = "confidence_score")
    private Double confidenceScore;

    @Column(name = "location_reason", columnDefinition = "TEXT")
    private String locationReason;

    @Column(name = "category_reason", columnDefinition = "TEXT")
    private String categoryReason;

    @Column(name = "raw_result", columnDefinition = "TEXT")
    private String rawResult;

    @Column(name = "is_applied", nullable = false)
    @Builder.Default
    private boolean applied = false;

    @Column(name = "created_at", updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
