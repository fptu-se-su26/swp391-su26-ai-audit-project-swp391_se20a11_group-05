package com.example.smartcity.modules.emergency.controller;

import com.example.smartcity.common.response.ApiResponse;
import com.example.smartcity.modules.emergency.dto.EmergencyAlertRequest;
import com.example.smartcity.modules.emergency.dto.EmergencyAlertResponse;
import com.example.smartcity.modules.emergency.dto.RevokeAlertRequest;
import com.example.smartcity.modules.emergency.service.EmergencyAlertService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/emergency/alerts")
@RequiredArgsConstructor
public class EmergencyAlertController {

    private final EmergencyAlertService emergencyAlertService;

    /**
     * POST /api/emergency/alerts - Phát cảnh báo khẩn cấp mới
     */
    @PostMapping
    public ResponseEntity<ApiResponse<EmergencyAlertResponse>> createAlert(
            @Valid @RequestBody EmergencyAlertRequest request) {
        EmergencyAlertResponse created = emergencyAlertService.createAlert(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Phát cảnh báo khẩn cấp thành công", created));
    }

    /**
     * GET /api/emergency/alerts - Lấy danh sách tất cả cảnh báo
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<EmergencyAlertResponse>>> getAllAlerts() {
        List<EmergencyAlertResponse> alerts = emergencyAlertService.getAllAlerts();
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách cảnh báo thành công", alerts));
    }

    /**
     * GET /api/emergency/alerts/active - Lấy danh sách cảnh báo đang hiệu lực
     */
    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<EmergencyAlertResponse>>> getActiveAlerts() {
        List<EmergencyAlertResponse> alerts = emergencyAlertService.getActiveAlerts();
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách cảnh báo đang hiệu lực thành công", alerts));
    }

    /**
     * GET /api/emergency/alerts/district/{district} - Lấy cảnh báo theo quận/huyện
     */
    @GetMapping("/district/{district}")
    public ResponseEntity<ApiResponse<List<EmergencyAlertResponse>>> getActiveAlertsByDistrict(
            @PathVariable String district) {
        List<EmergencyAlertResponse> alerts = emergencyAlertService.getActiveAlertsByDistrict(district);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách cảnh báo theo quận/huyện thành công", alerts));
    }

    /**
     * GET /api/emergency/alerts/{id} - Lấy chi tiết cảnh báo
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<EmergencyAlertResponse>> getAlertById(@PathVariable Long id) {
        EmergencyAlertResponse alert = emergencyAlertService.getAlertById(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin cảnh báo thành công", alert));
    }

    /**
     * PATCH /api/emergency/alerts/{id}/revoke - Thu hồi cảnh báo khẩn cấp
     */
    @PatchMapping("/{id}/revoke")
    public ResponseEntity<ApiResponse<EmergencyAlertResponse>> revokeAlert(
            @PathVariable Long id,
            @Valid @RequestBody RevokeAlertRequest request) {
        // TODO: Lấy username từ SecurityContext khi module Auth (Người 1) hoàn thành
        String currentUser = "system";
        EmergencyAlertResponse revoked = emergencyAlertService.revokeAlert(id, request.getReason(), currentUser);
        return ResponseEntity.ok(ApiResponse.success("Thu hồi cảnh báo thành công", revoked));
    }
}
