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
        return environment.getProperty(key);
    }
    
    @Override
    public boolean isAvailable() {
        return true;
    }
    
    @Override
    public int getPriority() { return 70; }
}
