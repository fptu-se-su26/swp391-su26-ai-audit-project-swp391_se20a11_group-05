package com.example.smartcity.modules.weather.service;

import com.example.smartcity.modules.core.entity.Ward;
import com.example.smartcity.modules.core.repository.WardRepository;
import com.example.smartcity.modules.feedback.entity.Category;
import com.example.smartcity.modules.feedback.entity.Feedback;
import com.example.smartcity.modules.feedback.entity.FeedbackStatus;
import com.example.smartcity.modules.feedback.repository.CategoryRepository;
import com.example.smartcity.modules.feedback.repository.FeedbackRepository;
import com.example.smartcity.modules.user.entity.Role;
import com.example.smartcity.modules.user.entity.User;
import com.example.smartcity.modules.user.repository.UserRepository;
import com.example.smartcity.modules.weather.dto.WeatherForecastDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * PreEmptiveTicketScheduler — Feature #2 (phần 2)
 *
 * Chạy ngầm định kỳ (VD: mỗi 6 tiếng) để kiểm tra dự báo thời tiết.
 * Nếu phát hiện nguy cơ cao, hệ thống tự động:
 *   1. Tạo Phiếu công việc dự phòng (Pre-emptive Ticket) giao cho phường.
 *   2. Gửi cảnh báo qua Telegram cho cán bộ.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PreEmptiveTicketScheduler {

    private final WeatherForecastService weatherForecastService;
    private final TelegramNotificationService telegramService;
    private final FeedbackRepository feedbackRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final WardRepository wardRepository;

    // Chạy mỗi 6 tiếng: 0h, 6h, 12h, 18h
    // Dùng cron cho production: @Scheduled(cron = "0 0 0,6,12,18 * * *")
    // Dùng fixedDelay cho mục đích demo: chạy 5 phút 1 lần
    @Scheduled(fixedDelay = 300000)
    @Transactional
    public void runPredictiveEngine() {
        log.info("[PredictiveEngine] Bắt đầu quét dữ liệu thời tiết và đánh giá rủi ro...");

        WeatherForecastDto forecast = weatherForecastService.getForecastWithRiskAnalysis();

        // Chỉ tạo phiếu khi thời tiết ở mức WARNING hoặc DANGER
        if (!"WARNING".equals(forecast.getAlertLevel()) && !"DANGER".equals(forecast.getAlertLevel())) {
            log.info("[PredictiveEngine] Thời tiết bình thường, không cần tạo phiếu dự phòng.");
            return;
        }

        List<WeatherForecastDto.PredictedHotspot> hotspots = forecast.getPredictedHotspots();
        if (hotspots == null || hotspots.isEmpty()) {
            return;
        }

        User systemUser = getOrCreateSystemUser();
        List<String> hotspotSummaries = new ArrayList<>();
        int createdTickets = 0;

        for (WeatherForecastDto.PredictedHotspot hotspot : hotspots) {
            // Chỉ tạo phiếu cho các điểm có nguy cơ HIGH hoặc CRITICAL (điểm > 70)
            if (hotspot.getRiskScore() < 70) continue;

            String summary = String.format("%s (Phường %s) - %s (Risk: %d/100)",
                    hotspot.getIncidentLabel(), hotspot.getWardName(), hotspot.getReason(), hotspot.getRiskScore());
            hotspotSummaries.add(summary);

            createPreEmptiveTicket(hotspot, systemUser);
            createdTickets++;
        }

        if (createdTickets > 0) {
            log.info("[PredictiveEngine] Đã tự động tạo {} phiếu dự phòng.", createdTickets);
            telegramService.sendWeatherAlert(forecast.getAlertLevel(), forecast.getAlertMessage(), hotspotSummaries);
        }
    }

    private void createPreEmptiveTicket(WeatherForecastDto.PredictedHotspot hotspot, User systemUser) {
        Category category = getCategoryForIncidentType(hotspot.getIncidentType());
        Ward ward = wardRepository.findByName(hotspot.getWardName())
                .orElse(null); // Bỏ qua nếu DB chưa có phường này

        if (category == null || ward == null) return;

        Feedback ticket = new Feedback();
        ticket.setTrackingCode("PW-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        ticket.setTitle("[CẢNH BÁO AI] " + hotspot.getIncidentLabel());
        ticket.setDescription("ĐÂY LÀ PHIẾU CÔNG VIỆC TỰ ĐỘNG. " + hotspot.getReason() + 
                "\nĐề nghị Đội tuần tra kiểm tra khu vực Phường " + hotspot.getWardName() + " trước khi sự cố xảy ra.");
        ticket.setLatitude(hotspot.getLatitude());
        ticket.setLongitude(hotspot.getLongitude());
        ticket.setAddressDetails("Khu vực trọng điểm Phường " + hotspot.getWardName());
        ticket.setStatus(FeedbackStatus.PRE_EMPTIVE); // Trạng thái đặc biệt
        ticket.setCategory(category);
        ticket.setWard(ward);
        ticket.setCitizen(systemUser); // Gắn user hệ thống
        ticket.setCreatedAt(LocalDateTime.now());
        ticket.setUpdatedAt(LocalDateTime.now());

        feedbackRepository.save(ticket);
    }

    private User getOrCreateSystemUser() {
        return userRepository.findByUsername("system_ai")
                .orElseGet(() -> {
                    User aiUser = new User();
                    aiUser.setUsername("system_ai");
                    aiUser.setPassword("no_password_for_system"); // Không ai login được
                    aiUser.setFullName("AI Weather Engine");
                    aiUser.setEmail("ai@danang.gov.vn");
                    aiUser.setRole(Role.CITIZEN);
                    aiUser.setCreatedAt(LocalDateTime.now());
                    aiUser.setUpdatedAt(LocalDateTime.now());
                    return userRepository.save(aiUser);
                });
    }

    private Category getCategoryForIncidentType(String incidentType) {
        String categoryName = switch (incidentType) {
            case "FLOOD" -> "Thoát nước";
            case "FALLEN_TREE" -> "Cây xanh";
            case "ROAD_DAMAGE" -> "Giao thông";
            case "POWER_OUTAGE" -> "Điện";
            default -> "Đô thị";
        };

        return categoryRepository.findByName(categoryName)
                .orElseGet(() -> {
                    // Tự động tạo danh mục nếu chưa có (rất tiện cho demo)
                    Category cat = new Category();
                    cat.setName(categoryName);
                    cat.setDescription("Danh mục tạo tự động bởi AI");
                    return categoryRepository.save(cat);
                });
    }
}
