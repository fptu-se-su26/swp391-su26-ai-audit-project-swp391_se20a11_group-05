package com.example.smartcity;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

@SpringBootTest
class SmartCityApplicationTests {

    @Test
    void contextLoads() {
    }

    @Configuration
    static class TestConfig {
        @Bean
        @Primary
        public ObjectMapper objectMapper() {
            return new ObjectMapper();
        }

        @Bean
        @Primary
        public Validator validator() {
            return jakarta.validation.Validation.buildDefaultValidatorFactory().getValidator();
        }
    }
}

