package com.example.smartcity.modules.auth.controller;

import com.example.smartcity.common.response.ApiResponse;
import com.example.smartcity.modules.auth.payload.FirebaseLoginRequest;
import com.example.smartcity.modules.auth.payload.LoginRequest;
import com.example.smartcity.modules.auth.payload.MfaVerificationRequest;
import com.example.smartcity.modules.auth.payload.RegisterRequest;
import com.example.smartcity.modules.auth.payload.TokenResponse;
import com.example.smartcity.modules.auth.payload.ForgotPasswordRequest;
import com.example.smartcity.modules.user.entity.User;
import com.example.smartcity.modules.auth.service.SmsService;
import com.example.smartcity.modules.auth.payload.request.SmsSendRequest;
import com.example.smartcity.modules.auth.payload.request.SmsVerifyRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

import com.example.smartcity.modules.auth.service.AuthService;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
// CORS handled globally by CorsConfig — no need for per-controller annotation
public class AuthController {

    private final AuthService authService;
    private final SmsService smsService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<?>> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        Object result = authService.authenticateUser(loginRequest);
        if (result instanceof Map) {
            return ResponseEntity.ok(ApiResponse.success("Yêu cầu xác thực MFA", result));
        }
        return ResponseEntity.ok(ApiResponse.success("Đăng nhập thành công", result));
    }

    @PostMapping("/mfa/setup")
    public ResponseEntity<ApiResponse<String>> setupMfa(@Valid @RequestBody LoginRequest loginRequest) {
        String qrCodeUri = authService.setupMfa(loginRequest);
        return ResponseEntity.ok(ApiResponse.success("Quét mã QR sau bằng Google Authenticator", qrCodeUri));
    }

    @PostMapping("/mfa/verify")
    public ResponseEntity<ApiResponse<TokenResponse>> verifyMfa(@Valid @RequestBody MfaVerificationRequest request) {
        TokenResponse tokenResponse = authService.verifyMfa(request);
        return ResponseEntity.ok(ApiResponse.success("Xác thực MFA thành công", tokenResponse));
    }

    @PostMapping("/firebase-login")
    public ResponseEntity<ApiResponse<TokenResponse>> firebaseLogin(@Valid @RequestBody FirebaseLoginRequest request) {
        TokenResponse tokenResponse = authService.firebaseLogin(request);
        return ResponseEntity.ok(ApiResponse.success("Đăng nhập Firebase thành công", tokenResponse));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<User>> registerUser(@Valid @RequestBody RegisterRequest registerRequest) {
        User result = authService.registerUser(registerRequest);
        return ResponseEntity.ok(ApiResponse.success("Đăng ký thành công", result));
    }

    @PostMapping("/sms/send")
    public ResponseEntity<ApiResponse<String>> sendSmsOtp(@Valid @RequestBody SmsSendRequest request) {
        String message = smsService.generateAndSendOtp(request.getPhoneNumber());
        return ResponseEntity.ok(ApiResponse.success(message, null));
    }

    @PostMapping("/sms/verify")
    public ResponseEntity<ApiResponse<String>> verifySmsOtp(@Valid @RequestBody SmsVerifyRequest request) {
        smsService.verifyOtp(request.getPhoneNumber(), request.getOtpCode());
        return ResponseEntity.ok(ApiResponse.success("Xác minh số điện thoại thành công", request.getPhoneNumber()));
    }

    @PostMapping("/verify-sms")
    public ResponseEntity<ApiResponse<String>> verifySms(@Valid @RequestBody SmsVerifyRequest request) {
        smsService.verifyOtp(request.getPhoneNumber(), request.getOtpCode());
        return ResponseEntity.ok(ApiResponse.success("Xác minh số điện thoại thành công", request.getPhoneNumber()));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<String>> logout(@RequestHeader(value = "Authorization", required = false) String tokenHeader) {
        authService.logout(tokenHeader);
        return ResponseEntity.ok(ApiResponse.success("Đăng xuất thành công", null));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ResponseEntity.ok(ApiResponse.success("Đặt lại mật khẩu thành công", null));
    }
}
