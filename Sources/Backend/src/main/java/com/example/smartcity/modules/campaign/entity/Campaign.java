package com.example.smartcity.modules.campaign.entity;

import com.example.smartcity.common.base.BaseEntity;
import com.example.smartcity.modules.core.entity.Ward;
import com.example.smartcity.modules.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "campaigns")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Campaign extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdByUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ward_id")
    private Ward ward;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 50)
    private String category;

    @Column(name = "location_text", length = 255)
    private String locationText;

    @Column(name = "private_location_text", length = 500)
    private String privateLocationText;

    @Column(name = "required_tools", columnDefinition = "TEXT")
    private String requiredTools;

    @Column(name = "organizer_contact", length = 255)
    private String organizerContact;

    private Double latitude;

    private Double longitude;

    @Column(name = "min_participants")
    private Integer minParticipants;

    @Column(name = "max_participants")
    private Integer maxParticipants;

    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "RECRUITING";

    @Column(name = "linked_feedback_id")
    private Long linkedFeedbackId;

    @Column(name = "boundary_geojson", columnDefinition = "TEXT")
    private String boundaryGeojson;

    @Column(name = "cover_image_url", length = 512)
    private String coverImageUrl;

    @Column(name = "image_urls", columnDefinition = "TEXT")
    private String imageUrls;

    @Column(name = "announcement_mode", nullable = false)
    @Builder.Default
    private boolean announcementMode = false;

    @Column(name = "cancellation_reason", length = 500)
    private String cancellationReason;
}
