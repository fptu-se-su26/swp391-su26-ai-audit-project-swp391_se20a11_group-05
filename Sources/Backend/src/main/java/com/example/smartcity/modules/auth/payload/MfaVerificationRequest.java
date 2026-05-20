package com.example.smartcity.modules.auth.payload;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class MfaVerificationRequest {
    @NotBlank(message = "Username không được để trống")
    private String username;

    @NotBlank(message = "Password không được để trống")
    private String password;

    @NotBlank(message = "Mã MFA không được để trống")
    private String mfaCode;
}
