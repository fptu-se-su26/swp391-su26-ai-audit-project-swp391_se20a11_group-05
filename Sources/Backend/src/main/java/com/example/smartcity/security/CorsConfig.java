package com.example.smartcity.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Global CORS Configuration — cho phép Frontend (React) kết nối Backend.
 *
 * Cho phép:
 *   - Origin: localhost:5173 (Vite dev), localhost:3000, localhost:4173 (preview)
 *   - Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
 *   - Headers: Authorization (JWT), Content-Type, X-Admin-Token
 *   - Credentials: true (cho phép gửi cookie/JWT)
 */
@Configuration
public class CorsConfig {

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // Allowed origins — thêm domain production khi deploy
        config.setAllowedOrigins(List.of(
            "http://localhost:5173",   // Vite dev server
            "http://localhost:8080",   // Lovable sandbox port
            "http://localhost:3000",   // Alternative dev port
            "http://localhost:4173",   // Vite preview
            "http://127.0.0.1:5173",
            "http://127.0.0.1:8080",
            "http://127.0.0.1:3000"
        ));

        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setExposedHeaders(List.of("Authorization"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L); // Cache preflight 1 hour

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }
}
