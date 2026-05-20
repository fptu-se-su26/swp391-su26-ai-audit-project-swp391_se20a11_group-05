package com.example.smartcity.modules.auth.controller;

import com.example.smartcity.common.exception.CustomException;
import com.example.smartcity.common.response.ApiResponse;
import com.example.smartcity.modules.auth.payload.FirebaseLoginRequest;
import com.example.smartcity.modules.auth.payload.LoginRequest;
import com.example.smartcity.modules.auth.payload.MfaVerificationRequest;
import com.example.smartcity.modules.auth.payload.RegisterRequest;
import com.example.smartcity.modules.auth.payload.TokenResponse;
import com.example.smartcity.modules.auth.service.FirebaseService;
import com.example.smartcity.modules.auth.service.MfaService;
import com.example.smartcity.modules.user.entity.Role;
import com.example.smartcity.modules.user.entity.User;
import com.example.smartcity.modules.user.repository.UserRepository;
import com.example.smartcity.security.jwt.JwtTokenProvider;
import com.google.firebase.auth.FirebaseToken;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // Allow React to connect
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final MfaService mfaService;
    private final FirebaseService firebaseService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<?>> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getUsername(),
                        loginRequest.getPassword()
                )
        );

        User user = userRepository.findByUsername(loginRequest.getUsername())
                .orElseThrow(() -> new CustomException("Tài khoản không tồn tại", 404));

        boolean isHighRiskRole = user.getRole() == Role.WARD_STAFF || 
                                 user.getRole() == Role.POLICE || 
                                 user.getRole() == Role.SUPER_ADMIN;

        if (isHighRiskRole) {
            Map<String, Object> responseData = new HashMap<>();
            responseData.put("username", user.getUsername());
            responseData.put("mfaRequired", true);
            responseData.put("mfaSetupRequired", !user.isMfaEnabled());
            return ResponseEntity.ok(ApiResponse.success("Yêu cầu xác thực MFA", responseData));
        }

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);

        String role = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .findFirst()
                .orElse("ROLE_CITIZEN");

        TokenResponse tokenResponse = new TokenResponse(jwt, loginRequest.getUsername(), role);
        return ResponseEntity.ok(ApiResponse.success("Đăng nhập thành công", tokenResponse));
    }

    @PostMapping("/mfa/setup")
    public ResponseEntity<ApiResponse<String>> setupMfa(@Valid @RequestBody LoginRequest loginRequest) {
        // Xác minh password trước khi cho setup
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword())
        );

        User user = userRepository.findByUsername(loginRequest.getUsername())
                .orElseThrow(() -> new CustomException("Tài khoản không tồn tại", 404));

        if (user.isMfaEnabled()) {
            throw new CustomException("MFA đã được thiết lập cho tài khoản này.", 400);
        }

        String secret = mfaService.generateSecret();
        user.setMfaSecret(secret);
        userRepository.save(user);

        String qrCodeUri = mfaService.generateQrCodeImageUri(secret, user.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Quét mã QR sau bằng Google Authenticator", qrCodeUri));
    }

    @PostMapping("/mfa/verify")
    public ResponseEntity<ApiResponse<TokenResponse>> verifyMfa(@Valid @RequestBody MfaVerificationRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new CustomException("Tài khoản không tồn tại", 404));

        if (user.getMfaSecret() == null) {
            throw new CustomException("Vui lòng thiết lập MFA (setup) trước.", 400);
        }

        boolean isCodeValid = mfaService.verifyCode(user.getMfaSecret(), request.getMfaCode());
        if (!isCodeValid) {
            throw new CustomException("Mã xác thực MFA không hợp lệ.", 401);
        }

        if (!user.isMfaEnabled()) {
            user.setMfaEnabled(true);
            userRepository.save(user);
        }

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);

        String role = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .findFirst()
                .orElse("ROLE_CITIZEN");

        TokenResponse tokenResponse = new TokenResponse(jwt, user.getUsername(), role);
        return ResponseEntity.ok(ApiResponse.success("Xác thực MFA thành công", tokenResponse));
    }

    @PostMapping("/firebase-login")
    public ResponseEntity<ApiResponse<TokenResponse>> firebaseLogin(@Valid @RequestBody FirebaseLoginRequest request) {
        FirebaseToken decodedToken = firebaseService.verifyIdToken(request.getFirebaseToken());
        
        String phoneOrEmail = decodedToken.getEmail();
        if (phoneOrEmail == null && decodedToken.getClaims().containsKey("phone_number")) {
            phoneOrEmail = (String) decodedToken.getClaims().get("phone_number");
        }
        
        if (phoneOrEmail == null) {
            throw new CustomException("Firebase token không chứa thông tin định danh hợp lệ (email/phone).", 400);
        }

        // Ưu tiên tìm qua email trước (nếu người dân dùng email)
        // Nếu dự án có findByPhoneNumber thì sử dụng nó cho sdt
        Optional<User> userOpt = userRepository.findByEmail(phoneOrEmail);
        
        if (userOpt.isEmpty()) {
            throw new CustomException("Tài khoản chưa được đăng ký trong hệ thống: " + phoneOrEmail, 404);
        }

        User user = userOpt.get();
        String jwt = tokenProvider.generateTokenFromUsername(user.getUsername());

        TokenResponse tokenResponse = new TokenResponse(jwt, user.getUsername(), user.getRole().name());
        return ResponseEntity.ok(ApiResponse.success("Đăng nhập Firebase thành công", tokenResponse));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<User>> registerUser(@Valid @RequestBody RegisterRequest registerRequest) {
        if (userRepository.findByUsername(registerRequest.getUsername()).isPresent()) {
            throw new CustomException("Tên đăng nhập đã tồn tại!", 400);
        }
        if (userRepository.findByEmail(registerRequest.getEmail()).isPresent()) {
            throw new CustomException("Email đã được sử dụng!", 400);
        }

        User user = new User(
                registerRequest.getUsername(),
                passwordEncoder.encode(registerRequest.getPassword()),
                registerRequest.getFullName(),
                registerRequest.getPhoneNumber(),
                registerRequest.getEmail(),
                registerRequest.getRole()
        );

        User result = userRepository.save(user);
        return ResponseEntity.ok(ApiResponse.success("Đăng ký thành công", result));
    }
}
