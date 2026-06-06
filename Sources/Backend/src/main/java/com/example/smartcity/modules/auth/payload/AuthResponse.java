package com.example.smartcity.modules.auth.payload;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    
    @Builder.Default
    private String tokenType = "Bearer";
    
    private String username;
    private String role;
    
    // MFA Flags
    private boolean mfaRequired;
    private boolean mfaSetupRequired;
    private String mfaToken; // Token dùng 1 lần (TTL 5 phút) để verify MFA mà không cần gửi lại password
}
