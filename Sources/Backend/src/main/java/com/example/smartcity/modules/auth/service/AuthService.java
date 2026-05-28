package com.example.smartcity.modules.auth.service;

import com.example.smartcity.common.exception.CustomException;
import com.example.smartcity.modules.auth.payload.FirebaseLoginRequest;
import com.example.smartcity.modules.auth.payload.LoginRequest;
import com.example.smartcity.modules.auth.payload.MfaVerificationRequest;
import com.example.smartcity.modules.auth.payload.RegisterRequest;
import com.example.smartcity.modules.auth.payload.TokenResponse;
import com.example.smartcity.modules.auth.payload.ForgotPasswordRequest;
import com.example.smartcity.modules.user.entity.Role;
import com.example.smartcity.modules.user.entity.User;
import com.example.smartcity.modules.user.repository.UserRepository;
import com.example.smartcity.security.jwt.JwtTokenProvider;
import com.example.smartcity.security.jwt.TokenBlacklistService;
import com.google.firebase.auth.FirebaseToken;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final MfaService mfaService;
    private final FirebaseService firebaseService;
    private final TokenBlacklistService blacklistService;
    private final SmsService smsService;

    public Object authenticateUser(LoginRequest loginRequest) {
        User user = userRepository.findByUsername(loginRequest.getUsername())
                .orElseThrow(() -> new CustomException("Tài khoản không tồn tại", 404));

        if (!user.isActive()) {
            throw new CustomException("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.", 403);
        }

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getUsername(),
                        loginRequest.getPassword()
                )
        );

        boolean isHighRiskRole = user.getRole() == Role.WARD_STAFF || 
                                 user.getRole() == Role.POLICE || 
                                 user.getRole() == Role.SUPER_ADMIN;

        if (isHighRiskRole) {
            Map<String, Object> responseData = new HashMap<>();
            responseData.put("username", user.getUsername());
            responseData.put("mfaRequired", true);
            responseData.put("mfaSetupRequired", !user.isMfaEnabled());
            return responseData; // Returns map indicating MFA required
        }

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);

        String role = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .findFirst()
                .orElse("ROLE_CITIZEN");

        return new TokenResponse(jwt, loginRequest.getUsername(), role);
    }

    @Transactional
    public String setupMfa(LoginRequest loginRequest) {
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

        return mfaService.generateQrCodeImageUri(secret, user.getUsername());
    }

    @Transactional
    public TokenResponse verifyMfa(MfaVerificationRequest request) {
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

        return new TokenResponse(jwt, user.getUsername(), role);
    }

    public TokenResponse firebaseLogin(FirebaseLoginRequest request) {
        FirebaseToken decodedToken = firebaseService.verifyIdToken(request.getFirebaseToken());
        
        String phoneOrEmail = decodedToken.getEmail();
        if (phoneOrEmail == null && decodedToken.getClaims().containsKey("phone_number")) {
            phoneOrEmail = (String) decodedToken.getClaims().get("phone_number");
        }
        
        if (phoneOrEmail == null) {
            throw new CustomException("Firebase token không chứa thông tin định danh hợp lệ (email/phone).", 400);
        }

        Optional<User> userOpt = userRepository.findByEmail(phoneOrEmail);
        
        if (userOpt.isEmpty()) {
            throw new CustomException("Tài khoản chưa được đăng ký trong hệ thống: " + phoneOrEmail, 404);
        }

        User user = userOpt.get();
        String jwt = tokenProvider.generateTokenFromUsername(user.getUsername());

        return new TokenResponse(jwt, user.getUsername(), user.getRole().name());
    }

    @Transactional
    public User registerUser(RegisterRequest registerRequest) {
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
                Role.CITIZEN
        );

        return userRepository.save(user);
    }

    public void logout(String tokenHeader) {
        if (tokenHeader != null && tokenHeader.startsWith("Bearer ")) {
            String jwt = tokenHeader.substring(7);
            try {
                java.util.Date expiration = tokenProvider.getExpirationFromJWT(jwt);
                blacklistService.blacklistToken(jwt, expiration.getTime());
            } catch (Exception e) {
                // Nếu token không hợp lệ hoặc đã hết hạn, đưa vào blacklist 10 phút
                blacklistService.blacklistToken(jwt, System.currentTimeMillis() + 600000);
            }
        }
    }

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        // 1. Xác minh mã OTP bằng số điện thoại
        smsService.verifyOtp(request.getPhoneNumber(), request.getOtpCode());

        // 2. Tìm người dùng bằng số điện thoại
        User user = userRepository.findByPhoneNumber(request.getPhoneNumber())
                .orElseThrow(() -> new CustomException("Không tìm thấy tài khoản kết hợp với số điện thoại này.", 404));

        // 3. Cập nhật mật khẩu đã mã hóa BCrypt
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }
}
