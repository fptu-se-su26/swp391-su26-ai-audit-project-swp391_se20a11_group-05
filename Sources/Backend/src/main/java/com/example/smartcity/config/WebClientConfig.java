package com.example.smartcity.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.reactive.function.client.WebClient;

/**
 * Cấu hình WebClient.Builder và RestTemplate bean cho toàn bộ ứng dụng.
 */
@Configuration
public class WebClientConfig {

    @Bean
    public WebClient.Builder webClientBuilder() {
        return WebClient.builder();
    }

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
