package com.example.smartcity;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Entry point chính của ứng dụng.
 *
 * @EnableAsync:      Xử lý bất đồng bộ (@Async) cho RAG pipeline
 * @EnableScheduling: Cho phép @Scheduled chạy (GroqKeyPool recovery mỗi 15s)
 */
@SpringBootApplication
@EnableAsync
@EnableScheduling
@EnableJpaAuditing
public class SmartCityApplication {

    public static void main(String[] args) {
        SpringApplication.run(SmartCityApplication.class, args);
    }

}



