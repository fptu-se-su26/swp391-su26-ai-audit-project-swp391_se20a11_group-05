package com.example.smartcity.modules.weather.controller;

import com.example.smartcity.modules.weather.dto.WeatherForecastDto;
import com.example.smartcity.modules.weather.service.WeatherForecastService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * WeatherForecastController
 *
 * Endpoints dành cho Dashboard Cán bộ — Dự báo thời tiết & Điểm nguy cơ sự cố đô thị.
 *
 * GET /api/weather/forecast  →  Dự báo 24h + danh sách điểm nóng dự đoán (chỉ SUPER_ADMIN, WARD_STAFF)
 * GET /api/weather/forecast/public  →  Dự báo cơ bản dành cho người dân (không cần đăng nhập)
 */
@RestController
@RequestMapping("/api/weather")
@RequiredArgsConstructor
public class WeatherForecastController {

    private final WeatherForecastService weatherForecastService;

    /**
     * Dự báo đầy đủ (thời tiết + điểm nguy cơ) — chỉ dành cho cán bộ
     */
    @GetMapping("/forecast")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'WARD_STAFF', 'POLICE')")
    public ResponseEntity<WeatherForecastDto> getFullForecast() {
        WeatherForecastDto forecast = weatherForecastService.getForecastWithRiskAnalysis();
        return ResponseEntity.ok(forecast);
    }

    /**
     * Dự báo cơ bản (chỉ thời tiết + mức cảnh báo) — người dân xem được
     */
    @GetMapping("/forecast/public")
    public ResponseEntity<WeatherForecastDto> getPublicForecast() {
        WeatherForecastDto full = weatherForecastService.getForecastWithRiskAnalysis();
        // Ẩn danh sách điểm nguy cơ chi tiết khỏi API công khai (sensitive operational data)
        full.setPredictedHotspots(null);
        return ResponseEntity.ok(full);
    }
}
