package com.example.smartcity.modules.emergency.entity;

import com.example.smartcity.common.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "emergency_alerts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmergencyAlert extends BaseEntity {

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 2000)
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private AlertLevel level = AlertLevel.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private AlertStatus status = AlertStatus.ACTIVE;

    @Column(nullable = false)
    private String district;

    private String ward;

    private String affectedArea;

    private LocalDateTime expiresAt;

    private LocalDateTime revokedAt;

    private String revokedBy;

    private String revokeReason;

    /**
     * Mức độ cảnh báo khẩn cấp
     */
    public enum AlertLevel {
        LOW,        // Thấp
        MEDIUM,     // Trung bình
        HIGH,       // Cao
        CRITICAL    // Nghiêm trọng
    }

    /**
     * Trạng thái cảnh báo
     */
    public enum AlertStatus {
        ACTIVE,     // Đang hiệu lực
        EXPIRED,    // Đã hết hạn
        REVOKED     // Đã thu hồi
    }
}
