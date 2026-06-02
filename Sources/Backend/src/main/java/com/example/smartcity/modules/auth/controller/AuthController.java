package com.example.smartcity.modules.auth.controller;

import com.example.smartcity.common.response.ApiResponse;
import com.example.smartcity.modules.auth.payload.FirebaseLoginRequest;
import com.example.smartcity.modules.auth.payload.LoginRequest;
import com.example.smartcity.modules.auth.payload.MfaVerificationRequest;
import com.example.smartcity.modules.auth.payload.RegisterRequest;
import com.example.smartcity.modules.auth.payload.TokenPairResponse;
import com.example.smartcity.modules.auth.payload.request.RefreshTokenRequest;
import com.example.smartcity.modules.auth.payload.AuthResponse;
import com.example.smartcity.modules.auth.payload.ForgotPasswordRequest;
import com.example.smartcity.modules.user.entity.User;
import com.example.smartcity.modules.auth.service.SmsService;
import com.example.smartcity.modules.auth.service.RefreshTokenService;
import com.example.smartcity.modules.auth.payload.request.SmsSendRequest;
import com.example.smartcity.modules.auth.payload.request.SmsVerifyRequest;
import com.example.smartcity.security.ratelimit.AuthRateLimiter;
import jakarta.servlet.http.HttpServletRequest;
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
    private final AuthRateLimiter rateLimiter;
    private final RefreshTokenService refreshTokenService;

    /** Lấy IP thực của client, hỗ trợ reverse proxy (X-Forwarded-For) */
    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> authenticateUser(
            @Valid @RequestBody LoginRequest loginRequest,
            HttpServletRequest httpRequest) {
        // [SECURITY] Rate limit: 5 lần / 15 phút theo IP
        rateLimiter.checkLoginLimit(getClientIp(httpRequest));
        AuthResponse result = authService.authenticateUser(loginRequest);
        if (result.isMfaRequired()) {
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
    public ResponseEntity<ApiResponse<TokenPairResponse>> verifyMfa(@Valid @RequestBody MfaVerificationRequest request) {
        TokenPairResponse tokenResponse = authService.verifyMfa(request);
        return ResponseEntity.ok(ApiResponse.success("Xác thực MFA thành công", tokenResponse));
    }

    @PostMapping("/firebase-login")
    public ResponseEntity<ApiResponse<TokenPairResponse>> firebaseLogin(@Valid @RequestBody FirebaseLoginRequest request) {
        TokenPairResponse tokenResponse = authService.firebaseLogin(request);
        return ResponseEntity.ok(ApiResponse.success("Đăng nhập Firebase thành công", tokenResponse));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<TokenPairResponse>> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        TokenPairResponse tokenResponse = refreshTokenService.rotate(request.getRefreshToken());
        return ResponseEntity.ok(ApiResponse.success("Làm mới token thành công", tokenResponse));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<User>> registerUser(
            @Valid @RequestBody RegisterRequest registerRequest,
            HttpServletRequest httpRequest) {
        // [SECURITY] Rate limit: 5 lần / 1 giờ theo IP
        rateLimiter.checkRegisterLimit(getClientIp(httpRequest));
        User result = authService.registerUser(registerRequest);
        return ResponseEntity.ok(ApiResponse.success("Đăng ký thành công", result));
    }

    @PostMapping("/sms/send")
    public ResponseEntity<ApiResponse<String>> sendSmsOtp(
            @Valid @RequestBody SmsSendRequest request) {
        // [SECURITY] Rate limit: 3 lần / 10 phút theo số điện thoại
        rateLimiter.checkSmsLimit(request.getPhoneNumber());
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
