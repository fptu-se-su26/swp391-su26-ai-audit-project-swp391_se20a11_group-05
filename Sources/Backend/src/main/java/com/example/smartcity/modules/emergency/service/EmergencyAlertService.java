package com.example.smartcity.modules.emergency.service;

import com.example.smartcity.modules.emergency.dto.EmergencyAlertRequest;
import com.example.smartcity.modules.emergency.dto.EmergencyAlertResponse;
import com.example.smartcity.modules.emergency.entity.EmergencyAlert;
import com.example.smartcity.modules.emergency.entity.EmergencyAlert.AlertStatus;
import com.example.smartcity.modules.emergency.repository.EmergencyAlertRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EmergencyAlertService {

    private final EmergencyAlertRepository emergencyAlertRepository;

    /**
     * Phát cảnh báo khẩn cấp mới
     */
    @Transactional
    public EmergencyAlertResponse createAlert(EmergencyAlertRequest request) {
        EmergencyAlert alert = EmergencyAlert.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .level(request.getLevel())
                .status(AlertStatus.ACTIVE)
                .district(request.getDistrict())
                .ward(request.getWard())
                .affectedArea(request.getAffectedArea())
                .expiresAt(request.getExpiresAt())
                .build();

        EmergencyAlert saved = emergencyAlertRepository.save(alert);
        return toResponse(saved);
    }

    /**
     * Lấy danh sách tất cả cảnh báo (mới nhất trước)
     */
    public List<EmergencyAlertResponse> getAllAlerts() {
        return emergencyAlertRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Lấy danh sách cảnh báo đang hiệu lực
     */
    public List<EmergencyAlertResponse> getActiveAlerts() {
        return emergencyAlertRepository.findActiveAlerts(LocalDateTime.now())
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Lấy danh sách cảnh báo đang hiệu lực theo quận/huyện
     */
    public List<EmergencyAlertResponse> getActiveAlertsByDistrict(String district) {
        return emergencyAlertRepository.findActiveAlertsByDistrict(district, LocalDateTime.now())
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Lấy chi tiết cảnh báo theo ID
     */
    public EmergencyAlertResponse getAlertById(Long id) {
        EmergencyAlert alert = emergencyAlertRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy cảnh báo với ID: " + id));
        return toResponse(alert);
    }

    /**
     * Thu hồi cảnh báo khẩn cấp
     */
    @Transactional
    public EmergencyAlertResponse revokeAlert(Long id, String reason, String revokedBy) {
        EmergencyAlert alert = emergencyAlertRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy cảnh báo với ID: " + id));

        if (alert.getStatus() == AlertStatus.REVOKED) {
            throw new RuntimeException("Cảnh báo này đã được thu hồi trước đó");
        }

        alert.setStatus(AlertStatus.REVOKED);
        alert.setRevokedAt(LocalDateTime.now());
        alert.setRevokedBy(revokedBy);
        alert.setRevokeReason(reason);

        EmergencyAlert saved = emergencyAlertRepository.save(alert);
        return toResponse(saved);
    }

    /**
     * Chuyển Entity sang DTO Response
     */
    private EmergencyAlertResponse toResponse(EmergencyAlert alert) {
        return EmergencyAlertResponse.builder()
                .id(alert.getId())
                .title(alert.getTitle())
                .content(alert.getContent())
                .level(alert.getLevel())
                .status(alert.getStatus())
                .district(alert.getDistrict())
                .ward(alert.getWard())
                .affectedArea(alert.getAffectedArea())
                .expiresAt(alert.getExpiresAt())
                .revokedAt(alert.getRevokedAt())
                .revokedBy(alert.getRevokedBy())
                .revokeReason(alert.getRevokeReason())
                .createdAt(alert.getCreatedAt())
                .updatedAt(alert.getUpdatedAt())
                .createdBy(alert.getCreatedBy())
                .build();
    }
}
