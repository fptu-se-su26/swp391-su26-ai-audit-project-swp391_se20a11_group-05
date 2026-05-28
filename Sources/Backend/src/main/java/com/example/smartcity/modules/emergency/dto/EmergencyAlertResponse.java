package com.example.smartcity.modules.emergency.dto;

import com.example.smartcity.modules.emergency.entity.EmergencyAlert.AlertLevel;
import com.example.smartcity.modules.emergency.entity.EmergencyAlert.AlertStatus;
import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmergencyAlertResponse {

    private Long id;
    private String title;
    private String content;
    private AlertLevel level;
    private AlertStatus status;
    private String district;
    private String ward;
    private String affectedArea;
    private LocalDateTime expiresAt;
    private LocalDateTime revokedAt;
    private String revokedBy;
    private String revokeReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
}
