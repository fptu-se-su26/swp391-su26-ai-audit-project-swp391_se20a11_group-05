package com.example.smartcity.modules.police.controller;

import com.example.smartcity.common.response.ApiResponse;
import com.example.smartcity.modules.police.dto.PoliceScheduleRequest;
import com.example.smartcity.modules.police.entity.PoliceSchedule;
import com.example.smartcity.modules.police.service.PoliceScheduleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/police/schedule")
@RequiredArgsConstructor
public class PoliceScheduleController {

    private final PoliceScheduleService scheduleService;

    /**
     * GET /api/police/schedule?mondayKey=2026-06-29
     * Lấy lịch trực ban của tuần tương ứng
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PoliceSchedule>> getSchedule(
            @RequestParam String mondayKey,
            Authentication authentication) {
        
        return scheduleService.getSchedule(authentication.getName(), mondayKey)
                .map(schedule -> ResponseEntity.ok(ApiResponse.success("Lấy lịch trực ban thành công", schedule)))
                .orElseGet(() -> ResponseEntity.ok(ApiResponse.success("Chưa có lịch trực ban cho tuần này", null)));
    }

    /**
     * GET /api/police/schedule/public?wardId=1&mondayKey=2026-06-29
     * Lấy lịch trực ban công khai của phường tương ứng
     */
    @GetMapping("/public")
    public ResponseEntity<ApiResponse<PoliceSchedule>> getPublicSchedule(
            @RequestParam Long wardId,
            @RequestParam String mondayKey) {
        
        return scheduleService.getPublicSchedule(wardId, mondayKey)
                .map(schedule -> ResponseEntity.ok(ApiResponse.success("Lấy lịch trực ban công khai thành công", schedule)))
                .orElseGet(() -> ResponseEntity.ok(ApiResponse.success("Chưa có lịch trực ban cho tuần này", null)));
    }

    /**
     * POST /api/police/schedule
     * Lưu hoặc cập nhật lịch trực ban
     */
    @PostMapping
    public ResponseEntity<ApiResponse<PoliceSchedule>> saveSchedule(
            @Valid @RequestBody PoliceScheduleRequest request,
            Authentication authentication) {
        
        PoliceSchedule saved = scheduleService.saveSchedule(authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.success("Lưu lịch trực ban thành công", saved));
    }
}
