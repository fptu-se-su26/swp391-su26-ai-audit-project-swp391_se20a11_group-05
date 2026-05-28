package com.example.smartcity.modules.weather.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

/**
 * TelegramNotificationService — Feature #2 (phần 1)
 *
 * Gửi cảnh báo tự động đến các cán bộ tuần tra qua Telegram Bot.
 *
 * Cấu hình trong application.properties:
 *   telegram.bot.token=YOUR_BOT_TOKEN
 *   telegram.chat.id=YOUR_CHAT_ID_OR_GROUP_ID
 *
 * Hướng dẫn lấy token:
 *   1. Nhắn @BotFather trên Telegram → /newbot → lấy token
 *   2. Thêm bot vào group cán bộ → lấy chat_id bằng cách gọi
 *      https://api.telegram.org/bot<TOKEN>/getUpdates
 */
@Slf4j
@Service
public class TelegramNotificationService {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${telegram.bot.token:DEMO_TOKEN_NOT_CONFIGURED}")
    private String botToken;

    @Value("${telegram.chat.id:DEMO_CHAT_ID}")
    private String chatId;

    private static final String TELEGRAM_API = "https://api.telegram.org/bot";

    /**
     * Gửi tin nhắn văn bản đơn giản đến group Telegram cán bộ.
     */
    public void sendMessage(String message) {
        if (botToken.equals("DEMO_TOKEN_NOT_CONFIGURED")) {
            log.warn("[Telegram] Bot token chưa được cấu hình. Bỏ qua gửi tin nhắn.");
            log.info("[Telegram-DEMO] Tin nhắn sẽ được gửi: {}", message);
            return;
        }

        try {
            String url = TELEGRAM_API + botToken + "/sendMessage";
            Map<String, String> body = new HashMap<>();
            body.put("chat_id", chatId);
            body.put("text", message);
            body.put("parse_mode", "HTML"); // Hỗ trợ <b>, <i>, <code> trong tin nhắn

            restTemplate.postForObject(url, body, String.class);
            log.info("[Telegram] Gửi cảnh báo thành công đến chat_id={}", chatId);

        } catch (Exception e) {
            log.error("[Telegram] Lỗi khi gửi tin nhắn: {}", e.getMessage());
        }
    }

    /**
     * Gửi cảnh báo thời tiết có cấu trúc với danh sách điểm nguy cơ.
     */
    public void sendWeatherAlert(String alertLevel, String alertMessage, java.util.List<String> hotspotSummaries) {
        String emoji = switch (alertLevel) {
            case "DANGER"  -> "🔴";
            case "WARNING" -> "🟠";
            case "WATCH"   -> "🟡";
            default        -> "🟢";
        };

        StringBuilder sb = new StringBuilder();
        sb.append(String.format("<b>%s CẢnh BÁO THỜI TIẾT ĐÔ THỊ</b>\n", emoji));
        sb.append("<b>Hệ thống Đà Nẵng Lắng Nghe — AI Weather Engine</b>\n\n");
        sb.append(alertMessage).append("\n\n");

        if (!hotspotSummaries.isEmpty()) {
            sb.append("<b>📍 Điểm nguy cơ dự đoán:</b>\n");
            for (int i = 0; i < hotspotSummaries.size(); i++) {
                sb.append(String.format("  %d. %s\n", i + 1, hotspotSummaries.get(i)));
            }
            sb.append("\n");
        }

        sb.append("<i>⏰ Thời gian: ").append(
                java.time.LocalDateTime.now()
                        .format(java.time.format.DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy"))
        ).append("</i>\n");
        sb.append("<i>🤖 Tự động bởi AI Weather Prediction Engine</i>");

        sendMessage(sb.toString());
    }
}
