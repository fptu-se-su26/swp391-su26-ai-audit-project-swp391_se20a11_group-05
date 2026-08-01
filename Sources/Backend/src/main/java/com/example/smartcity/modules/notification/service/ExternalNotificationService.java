package com.example.smartcity.modules.notification.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import jakarta.mail.internet.MimeMessage;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class ExternalNotificationService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.host:}")
    private String mailHost;

    @Value("${spring.mail.username:}")
    private String mailFrom;

    /**
     * Gửi Email thông báo trạng thái cập nhật (Chạy bất đồng bộ)
     */
    @Async
    public void sendEmailNotification(String toEmail, String subject, String body) {
        log.info("============== [BACKGROUND TASK - EMAIL] ==============");
        log.info("Sending Email to: {}", toEmail);
        log.info("Subject: {}", subject);
        log.info("Body: {}", body);

        if (mailSender != null && mailHost != null && !mailHost.isBlank()) {
            try {
                MimeMessage mimeMessage = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "utf-8");
                helper.setFrom(mailFrom != null && !mailFrom.isBlank() ? mailFrom : "noreply@smartcity.gov.vn", "Đà Nẵng Kết Nối");
                helper.setTo(toEmail);
                helper.setSubject(subject);
                helper.setText(body, true); // true indicates HTML content

                mailSender.send(mimeMessage);
                log.info("Email sent successfully via SMTP!");
            } catch (Exception e) {
                log.error("Failed to send email via SMTP, falling back. Error: {}", e.getMessage());
            }
        } else {
            try {
                // Giả lập delay mạng khi gửi mail thực tế
                Thread.sleep(2000);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
            log.info("Email sent successfully (Fallback/Mock mode)!");
        }
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
