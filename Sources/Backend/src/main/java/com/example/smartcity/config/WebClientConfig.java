package com.example.smartcity.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

/**
 * Cấu hình WebClient.Builder bean cho toàn bộ ứng dụng.
 * Cần thiết để GeminiAdapter (và các Adapter AI khác) có thể
 * inject WebClient.Builder qua constructor.
 */
@Configuration
public class WebClientConfig {

    @Bean
    public WebClient.Builder webClientBuilder() {
        return WebClient.builder();
    }
}
