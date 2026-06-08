package com.example.smartcity.modules.notification.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class ExternalNotificationService {

    /**
     * Giả lập gửi Email thông báo trạng thái cập nhật (Chạy bất đồng bộ)
     */
    @Async
    public void sendEmailNotification(String toEmail, String subject, String body) {
        log.info("============== [BACKGROUND TASK - EMAIL] ==============");
        log.info("Sending Email to: {}", toEmail);
        log.info("Subject: {}", subject);
        log.info("Body: {}", body);
        
        try {
            // Giả lập delay mạng khi gửi mail thực tế
            Thread.sleep(2000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        log.info("Email sent successfully!");
        log.info("======================================================");
    }

    /**
     * Giả lập gửi tin nhắn SMS khẩn cấp (Chạy bất đồng bộ)
     */
    @Async
    public void sendSmsNotification(String phoneNumber, String message) {
        log.info("============== [BACKGROUND TASK - SMS] ==============");
        log.info("Sending SMS to: {}", phoneNumber);
        log.info("Message: {}", message);
        
        try {
            // Giả lập delay mạng của SMS Gateway
            Thread.sleep(1000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        log.info("SMS delivered successfully!");
        log.info("======================================================");
    }
}
