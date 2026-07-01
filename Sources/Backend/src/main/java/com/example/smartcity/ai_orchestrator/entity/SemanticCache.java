package com.example.smartcity.ai_orchestrator.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "semantic_cache")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SemanticCache {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "query_text", columnDefinition = "TEXT", nullable = false)
    private String queryText;

    @Column(name = "query_vector", columnDefinition = "vector(768)")
    private float[] queryVector;

    @Column(name = "response_text", columnDefinition = "TEXT", nullable = false)
    private String responseText;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "last_hit_at")
    @Builder.Default
    private LocalDateTime lastHitAt = LocalDateTime.now();

    @Column(name = "hit_count")
    @Builder.Default
    private Integer hitCount = 1;
}
