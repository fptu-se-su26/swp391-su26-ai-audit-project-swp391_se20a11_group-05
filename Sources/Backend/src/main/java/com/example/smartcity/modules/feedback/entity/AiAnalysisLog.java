package com.example.smartcity.modules.feedback.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ai_analysis_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiAnalysisLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "feedback_id", nullable = false)
    private Feedback feedback;

    @Column(name = "trust_score")
    private Integer trustScore;

    @Column(name = "is_toxic")
    private Boolean isToxic;

    @Column(length = 50)
    private String domain;

    @Column(length = 50)
    private String priority;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(name = "raw_response", columnDefinition = "TEXT")
    private String rawResponse;

    @Column(name = "tokens_used_input")
    private Integer tokensUsedInput;

    @Column(name = "tokens_used_output")
    private Integer tokensUsedOutput;

    @Column(name = "latency_ms")
    private Long latencyMs;

    @Column(name = "model_name", length = 100)
    private String modelName;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
