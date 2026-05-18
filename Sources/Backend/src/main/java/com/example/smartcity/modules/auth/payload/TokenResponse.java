package com.example.smartcity.modules.auth.payload;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class TokenResponse {
    private String token;
    private String tokenType = "Bearer";
    private String username;
    private String role;

    public TokenResponse(String token, String username, String role) {
        this.token = token;
        this.username = username;
        this.role = role;
    }
}


