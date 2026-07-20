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
import com.example.smartcity.modules.user.entity.Role;
import com.example.smartcity.modules.user.entity.User;
import com.example.smartcity.modules.user.repository.UserRepository;
import com.example.smartcity.modules.auth.service.SmsService;
import com.example.smartcity.modules.auth.service.RefreshTokenService;
import com.example.smartcity.modules.auth.payload.request.SmsSendRequest;
import com.example.smartcity.modules.auth.payload.request.SmsVerifyRequest;
import com.example.smartcity.modules.user.dto.UserDTO;
import com.example.smartcity.modules.user.mapper.UserMapper;
import com.example.smartcity.security.ratelimit.AuthRateLimiter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

import com.example.smartcity.modules.auth.service.AuthService;
import com.example.smartcity.modules.core.repository.WardRepository;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
// CORS handled globally by CorsConfig — no need for per-controller annotation
public class AuthController {

    private final AuthService authService;
    private final SmsService smsService;
    private final AuthRateLimiter rateLimiter;
    private final RefreshTokenService refreshTokenService;
    private final UserMapper userMapper;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final WardRepository wardRepository;

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

        // [SECURITY] Reset bucket sau khi xác thực thành công — user hợp lệ
        // không bị phạt vì các lần nhập sai trước đó trong cùng session.
        // MFA flow không reset ngay vì chưa hoàn thành xác thực đầy đủ.
        if (!result.isMfaRequired()) {
            rateLimiter.clearLoginLimit(getClientIp(httpRequest));
            return ResponseEntity.ok(ApiResponse.success("Đăng nhập thành công", result));
        }
        return ResponseEntity.ok(ApiResponse.success("Yêu cầu xác thực MFA", result));
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
    public ResponseEntity<ApiResponse<Object>> registerUser(
            @Valid @RequestBody RegisterRequest registerRequest,
            HttpServletRequest httpRequest) {
        // [SECURITY] Rate limit: 5 lần / 1 giờ theo IP
        rateLimiter.checkRegisterLimit(getClientIp(httpRequest));

        String authHeader = httpRequest.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            // [SECURITY] Rate limit: 5 lần / 1 giờ theo IP và số điện thoại cho Firebase OTP
            rateLimiter.checkFirebaseOtpLimit(getClientIp(httpRequest), registerRequest.getPhoneNumber());
            String firebaseToken = authHeader.substring(7);
            AuthResponse response = authService.registerWithFirebaseToken(registerRequest, firebaseToken);
            return ResponseEntity.ok(ApiResponse.success("Đăng ký và đăng nhập thành công", response));
        }

        User result = authService.registerUser(registerRequest);
        return ResponseEntity.ok(ApiResponse.success("Đăng ký nháp thành công. Vui lòng xác thực mã OTP gửi về điện thoại.", userMapper.toDto(result)));
    }

    @PostMapping("/register-confirm")
    public ResponseEntity<ApiResponse<String>> confirmRegistration(@Valid @RequestBody SmsVerifyRequest request) {
        authService.confirmRegistration(request.getPhoneNumber(), request.getOtpCode());
        return ResponseEntity.ok(ApiResponse.success("Xác thực OTP thành công. Tài khoản đã được kích hoạt!", null));
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
        authService.verifyLoginOtp(request.getPhoneNumber(), request.getOtpCode());
        return ResponseEntity.ok(ApiResponse.success("Xác minh số điện thoại thành công", request.getPhoneNumber()));
    }

    @PostMapping("/verify-sms")
    public ResponseEntity<ApiResponse<String>> verifySms(@Valid @RequestBody SmsVerifyRequest request) {
        authService.verifyLoginOtp(request.getPhoneNumber(), request.getOtpCode());
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

    /**
     * [DEV ONLY] Tạo tài khoản với role bất kỳ, không cần OTP.
     * Endpoint này chỉ dùng trong môi trường dev/local.
     * Body: { "username": "...", "password": "...", "fullName": "...", "role": "SUPER_ADMIN|WARD_STAFF|POLICE|CITIZEN" }
     */
    @PostMapping("/dev/seed-user")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<ApiResponse<Map<String, String>>> devSeedUser(@RequestBody Map<String, String> body) {
        String username = body.getOrDefault("username", "superadmin");
        String password = body.getOrDefault("password", "Admin1234");
        String fullName = body.getOrDefault("fullName", "Super Admin");
        String roleStr  = body.getOrDefault("role", "SUPER_ADMIN");
        String phone    = body.getOrDefault("phoneNumber", "0900000000");
        String email    = body.getOrDefault("email", username + "@dev.local");

        // Hard delete theo username/phone/email kể cả soft-deleted rows (bypass @SQLRestriction)
        userRepository.hardDeleteByUsername(username);
        userRepository.hardDeleteByPhoneNumber(phone);
        userRepository.hardDeleteByEmail(email);
        userRepository.flush();

        Role role;
        try {
            role = Role.valueOf(roleStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            role = Role.SUPER_ADMIN;
        }

        User user = new User(username, passwordEncoder.encode(password), fullName, phone, email, role);
        user.setStatus("ACTIVE");
        user.setPhoneVerified(true);
        if (role != Role.SUPER_ADMIN) {
            wardRepository.findById(1L).or(() -> wardRepository.findAll().stream().findFirst()).ifPresent(user::setWard);
        }
        userRepository.save(user);

        return ResponseEntity.ok(ApiResponse.success(
            "[DEV] Tạo tài khoản thành công",
            Map.of("username", username, "password", password, "role", role.name())
        ));
    }
}
