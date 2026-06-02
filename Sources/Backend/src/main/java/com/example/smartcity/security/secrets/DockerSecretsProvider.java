package com.example.smartcity.security.secrets;

import lombok.extern.slf4j.Slf4j;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Component
@Order(3)
@Slf4j
public class DockerSecretsProvider implements SecretsProvider {
    private static final String SECRETS_PATH = "/run/secrets";
    
    @Override
    public String getSecret(String key) {
        Path secretFile = Paths.get(SECRETS_PATH, key.toLowerCase());
        if (Files.exists(secretFile)) {
            try {
                return Files.readString(secretFile).trim();
            } catch (IOException e) {
                log.warn("Failed to read Docker secret {}: {}", key, e.getMessage());
            }
        }
        return null;
    }
    
    @Override
    public boolean isAvailable() {
        return Files.isDirectory(Paths.get(SECRETS_PATH));
    }
    
    @Override
    public int getPriority() { return 80; }
}
