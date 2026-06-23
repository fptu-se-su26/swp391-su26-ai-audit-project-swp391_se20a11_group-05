package com.example.smartcity.security;

import com.example.smartcity.security.jwt.JwtAuthEntryPoint;
import com.example.smartcity.security.jwt.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.http.HttpMethod;
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthEntryPoint unauthorizedHandler;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CorsConfigurationSource corsConfigurationSource;

    @Bean
    public PasswordEncoder passwordEncoder() {
        // [SECURITY FIX] Tăng work factor từ 10 (mặc định) lên 13 để chống Brute Force / GPU cracking
        return new BCryptPasswordEncoder(13);
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .csrf(AbstractHttpConfigurer::disable)
                .exceptionHandling(exception -> exception.authenticationEntryPoint(unauthorizedHandler))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(authorize -> authorize
                        // Public: static assets, auth endpoints
                        .requestMatchers("/", "/favicon.ico", "/**/*.png", "/**/*.gif", "/**/*.svg", "/**/*.jpg", "/**/*.html", "/**/*.css", "/**/*.js").permitAll()
                        .requestMatchers("/api/auth/**").permitAll() // Login/Register/MFA are public
                        .requestMatchers("/api/rag/chatbot", "/api/rag/stream", "/api/chat/stream").permitAll() // Public Chatbot endpoints
                        .requestMatchers("/actuator/health").permitAll() // Health check only
                        .requestMatchers("/api/feedbacks/public/**", "/api/feedbacks/statuses").permitAll() // Public Feedback Lookups & Statuses
                        .requestMatchers(HttpMethod.GET, "/api/campaigns", "/api/campaigns/*").permitAll()
                        .requestMatchers("/ws", "/ws/**", "/ws-native", "/ws-native/**").permitAll()
                        // Authenticated: all business endpoints
                        .requestMatchers("/api/ai/**").authenticated()
                        .requestMatchers("/api/rag/**").authenticated()
                        .requestMatchers("/api/feedbacks/**").authenticated()
                        .requestMatchers("/api/categories/**").authenticated()
                        .requestMatchers("/actuator/**").authenticated()
                        .anyRequest().authenticated()
                );

        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}


