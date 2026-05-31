package com.example.smartcity.modules.auth.payload;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class FirebaseLoginRequest {
    @NotBlank(message = "Firebase token không được để trống")
    private String firebaseToken;
}
