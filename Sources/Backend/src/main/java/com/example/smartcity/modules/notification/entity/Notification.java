package com.example.smartcity.modules.notification.entity;

import com.example.smartcity.common.base.BaseEntity;
import com.example.smartcity.modules.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "notifications", indexes = {
    @Index(name = "idx_notification_user", columnList = "user_id"),
    @Index(name = "idx_notification_read", columnList = "is_read")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Builder.Default
    @Column(name = "type", length = 50)
    private String type = "SYSTEM";

    @Column(name = "reference_id")
    private Long referenceId;

    @Column(name = "feedback_id")
    private Long feedbackId;

    @Builder.Default
    @Column(name = "is_read", nullable = false)
    private boolean isRead = false;
}
