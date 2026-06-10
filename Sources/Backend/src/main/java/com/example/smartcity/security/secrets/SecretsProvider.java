package com.example.smartcity.security.secrets;

public interface SecretsProvider {
    String getSecret(String key);
    boolean isAvailable();
    int getPriority(); // Higher = preferred
}
