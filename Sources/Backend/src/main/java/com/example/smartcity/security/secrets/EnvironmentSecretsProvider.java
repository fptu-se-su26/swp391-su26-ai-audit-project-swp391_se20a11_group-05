package com.example.smartcity.security.secrets;

import lombok.RequiredArgsConstructor;
import org.springframework.core.annotation.Order;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

@Component
@Order(4)
@RequiredArgsConstructor
public class EnvironmentSecretsProvider implements SecretsProvider {
    private final Environment environment;

    @Override
    public String getSecret(String key) {
        // 1. Đọc trực tiếp từ OS environment variable (tránh Spring placeholder resolution gây circular ref)
        String envValue = System.getenv(key);
        if (envValue != null && !envValue.isBlank()) {
            return envValue;
        }
        // 2. Thử system property (java -Dkey=value)
        String sysProp = System.getProperty(key);
        if (sysProp != null && !sysProp.isBlank()) {
            return sysProp;
        }
        // 3. Fallback Spring environment nhưng chỉ khi key tồn tại rõ ràng (không resolve nested placeholder)
        try {
            return environment.getProperty(key, "");
        } catch (Exception e) {
            return "";
        }
    }

    @Override
    public boolean isAvailable() {
        return true;
    }

    @Override
    public int getPriority() { return 70; }
}

