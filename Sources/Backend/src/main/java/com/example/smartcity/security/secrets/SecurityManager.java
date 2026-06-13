package com.example.smartcity.security.secrets;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationStartedEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class SecurityManager implements ApplicationListener<ApplicationStartedEvent> {
    private final List<SecretsProvider> providers;
    private final Map<String, String> secretsCache = new ConcurrentHashMap<>();
    
    // Yêu cầu JWT_SECRET phải có mặt lúc khởi động
    private static final List<String> REQUIRED_SECRETS = List.of(
        "jwt.secret"
    );
    
    @Override
    public void onApplicationEvent(ApplicationStartedEvent event) {
        log.info("Starting security validation...");
        
        List<SecretsProvider> sortedProviders = providers.stream()
            .filter(SecretsProvider::isAvailable)
            .sorted(Comparator.comparingInt(SecretsProvider::getPriority).reversed())
            .toList();
            
        log.info("Available secrets providers: {}", 
            sortedProviders.stream()
                .map(p -> p.getClass().getSimpleName())
                .collect(Collectors.joining(", ")));
        
        for (String secretKey : REQUIRED_SECRETS) {
            String value = loadSecret(secretKey, sortedProviders);
            if (value == null || value.isBlank()) {
                throw new IllegalStateException(
                    "Required secret '" + secretKey + "' is missing or empty. " +
                    "Please configure it in one of: Kubernetes Secrets, " +
                    "Docker Secrets, or Environment Variables."
                );
            }
            validateSecret(secretKey, value);
            secretsCache.put(secretKey, value);
        }
        
        log.info("Security validation passed. All required secrets loaded.");
    }
    
    private String loadSecret(String key, List<SecretsProvider> providers) {
        for (SecretsProvider provider : providers) {
            String value = provider.getSecret(key);
            if (value != null && !value.isBlank()) {
                log.info("Loaded secret '{}' from {}", key, provider.getClass().getSimpleName());
                return value;
            }
        }
        return null;
    }
    
    private void validateSecret(String key, String value) {
        if ("jwt.secret".equals(key)) {
            if (value.length() < 32) {
                throw new IllegalStateException("jwt.secret must be at least 32 characters for HS256 security. Current length is " + value.length());
            }
        }
    }
    
    public String getSecret(String key) {
        // Lấy từ cache nếu đã được load lúc startup
        if (secretsCache.containsKey(key)) {
            return secretsCache.get(key);
        }
        // Fallback tìm lại từ các provider (cho các secret không bắt buộc)
        List<SecretsProvider> sortedProviders = providers.stream()
            .filter(SecretsProvider::isAvailable)
            .sorted(Comparator.comparingInt(SecretsProvider::getPriority).reversed())
            .toList();
        return loadSecret(key, sortedProviders);
    }
}
