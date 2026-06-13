package com.example.smartcity.modules.auth.payload;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class MfaVerificationRequest {
    @NotBlank(message = "MFA Token không được để trống")
    private String mfaToken;

    @NotBlank(message = "Mã MFA không được để trống")
    private String mfaCode;
}
