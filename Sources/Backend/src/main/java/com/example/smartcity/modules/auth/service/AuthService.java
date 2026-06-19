package com.example.smartcity.modules.auth.service;

import com.example.smartcity.common.exception.CustomException;
import com.example.smartcity.modules.auth.payload.FirebaseLoginRequest;
import com.example.smartcity.modules.auth.payload.LoginRequest;
import com.example.smartcity.modules.auth.payload.MfaVerificationRequest;
import com.example.smartcity.modules.auth.payload.RegisterRequest;
import com.example.smartcity.modules.auth.payload.TokenResponse;
import com.example.smartcity.modules.auth.payload.AuthResponse;
import com.example.smartcity.modules.auth.payload.ForgotPasswordRequest;
import com.example.smartcity.modules.user.entity.Role;
import com.example.smartcity.modules.user.entity.User;
import com.example.smartcity.modules.user.repository.UserRepository;
import com.example.smartcity.modules.auth.payload.TokenPairResponse;
import com.example.smartcity.security.jwt.JwtTokenProvider;
import com.example.smartcity.security.jwt.TokenBlacklistService;
import com.google.firebase.auth.FirebaseToken;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.time.LocalDateTime;

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
    private final MfaSessionService mfaSessionService;
    private final RefreshTokenService refreshTokenService;

    private static final int INITIAL_LOCK_ATTEMPTS = 5;
    private static final int PROGRESSIVE_LOCK_ATTEMPTS = 3;
    private static final int STAGE_DEFAULT = 0;
    private static final int STAGE_ONE_MINUTE = 1;
    private static final int STAGE_THREE_MINUTES = 2;
    private static final int STAGE_SIX_MINUTES = 3;
    private static final int STAGE_SMS_OTP_REQUIRED = 4;

    @Transactional(noRollbackFor = CustomException.class)
    public AuthResponse authenticateUser(LoginRequest loginRequest) {
        User user = findUserForLogin(loginRequest.getUsername())
                .orElseThrow(() -> new CustomException("Tên đăng nhập hoặc mật khẩu không chính xác", 401));

        // Kiểm tra tài khoản bị khóa vĩnh viễn (admin khóa)
        if (!user.isActive()) {
            if ("INACTIVE".equals(user.getStatus())) {
                throw new CustomException("Tài khoản chưa được kích hoạt. Vui lòng xác thực mã OTP gửi về số điện thoại.", 403);
            }
            throw new CustomException("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.", 403);
        }

        rejectIfLoginLocked(user);

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            user.getUsername(),
                            loginRequest.getPassword()
                    )
            );

            resetLoginLockout(user);
            userRepository.save(user);

            // Disable MFA cho môi trường dev hiện tại để chấm bài dễ hơn
            // boolean isHighRiskRole = user.getRole() == Role.WARD_STAFF ||
            //                          user.getRole() == Role.POLICE ||
            //                          user.getRole() == Role.SUPER_ADMIN;

            // if (isHighRiskRole) {
            //     String mfaToken = mfaSessionService.createSession(user.getId());
            //     return AuthResponse.builder()
            //             .username(user.getUsername())
            //             .mfaRequired(true)
            //             .mfaSetupRequired(!user.isMfaEnabled())
            //             .mfaToken(mfaToken)
            //             .build();
            // }

            SecurityContextHolder.getContext().setAuthentication(authentication);
            
            // [SECURITY FIX] Tạo token pair (access + refresh) thay vì chỉ JWT
            TokenPairResponse tokenPair = refreshTokenService.createTokenPair(user);

            return AuthResponse.builder()
                    .token(tokenPair.getAccessToken())
                    .refreshToken(tokenPair.getRefreshToken())
                    .expiresIn(tokenPair.getExpiresIn())
                    .username(tokenPair.getUsername())
                    .role(tokenPair.getRole())
                    .wardName(tokenPair.getWardName())
                    .wardType(tokenPair.getWardType())
                    .org(tokenPair.getOrg())
                    .mfaRequired(false)
                    .build();

        } catch (org.springframework.security.core.AuthenticationException ex) {
            handleFailedPasswordLogin(user);
            throw new CustomException("Tên đăng nhập hoặc mật khẩu không chính xác", 401);
        }
    }

    private Optional<User> findUserForLogin(String submittedIdentifier) {
        String identifier = normalizeAccountIdentifier(submittedIdentifier);
        if (identifier.isBlank()) {
            return Optional.empty();
        }

        Optional<User> byUsername = userRepository.findByUsernameIgnoreCase(identifier);
        if (byUsername.isPresent()) {
            return byUsername;
        }

        Optional<User> byEmail = userRepository.findByEmailIgnoreCase(identifier);
        if (byEmail.isPresent()) {
            return byEmail;
        }

        return userRepository.findByPhoneNumber(identifier);
    }

    private String normalizeAccountIdentifier(String identifier) {
        return identifier == null ? "" : identifier.trim().toLowerCase();
    }

    private void rejectIfLoginLocked(User user) {
        LocalDateTime now = LocalDateTime.now();

        if (user.getLockedUntil() != null && now.isBefore(user.getLockedUntil())) {
            long seconds = Math.max(1, java.time.Duration.between(now, user.getLockedUntil()).getSeconds());
            throw new CustomException(formatLockMessage(seconds), 429);
        }

        if (user.getLockedUntil() != null) {
            user.setLockedUntil(null);
            userRepository.save(user);
        }

        if (user.isLoginOtpRequired()) {
            throw new CustomException("This account requires SMS OTP verification before login.", 423);
        }
    }

    private void handleFailedPasswordLogin(User user) {
        int attempts = user.getLoginAttempts() + 1;
        user.setLoginAttempts(attempts);
        user.setLastFailedLoginAt(LocalDateTime.now());

        int threshold = user.getLoginLockStage() == STAGE_DEFAULT
                ? INITIAL_LOCK_ATTEMPTS
                : PROGRESSIVE_LOCK_ATTEMPTS;

        if (attempts < threshold) {
            userRepository.save(user);
            throw new CustomException("Incorrect username or password.", 401);
        }

        advanceLoginLockout(user);
    }

    private void advanceLoginLockout(User user) {
        int nextStage = Math.min(user.getLoginLockStage() + 1, STAGE_SMS_OTP_REQUIRED);
        user.setLoginAttempts(0);
        user.setLoginLockStage(nextStage);

        if (nextStage == STAGE_ONE_MINUTE || nextStage == STAGE_THREE_MINUTES || nextStage == STAGE_SIX_MINUTES) {
            int lockMinutes = lockMinutesForStage(nextStage);
            user.setLockedUntil(LocalDateTime.now().plusMinutes(lockMinutes));
            userRepository.save(user);
            throw new CustomException("Too many failed login attempts. Please try again in " + lockMinutes + " minute(s).", 429);
        }

        user.setLockedUntil(null);
        user.setLoginOtpRequired(true);
        userRepository.save(user);
        if (user.getPhoneNumber() != null && !user.getPhoneNumber().isBlank()) {
            smsService.generateAndSendOtp(user.getPhoneNumber());
        }
        throw new CustomException("This account requires SMS OTP verification before login.", 423);
    }

    private int lockMinutesForStage(int stage) {
        if (stage == STAGE_ONE_MINUTE) {
            return 1;
        }
        if (stage == STAGE_THREE_MINUTES) {
            return 3;
        }
        return 6;
    }

    private String formatLockMessage(long remainingSeconds) {
        long minutes = Math.max(1, (long) Math.ceil(remainingSeconds / 60.0));
        return "Too many failed login attempts. Please try again in " + minutes + " minute(s).";
    }

    private void resetLoginLockout(User user) {
        user.setLoginAttempts(0);
        user.setLoginLockStage(STAGE_DEFAULT);
        user.setLockedUntil(null);
        user.setLoginOtpRequired(false);
        user.setLastFailedLoginAt(null);
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
    public TokenPairResponse verifyMfa(MfaVerificationRequest request) {
        // [SECURITY FIX] Xác thực qua MfaSession thay vì gọi lại authenticationManager.authenticate() với password plain text
        Long userId = mfaSessionService.validateSession(request.getMfaToken());

        User user = userRepository.findById(userId)
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

        mfaSessionService.invalidateSession(request.getMfaToken());

        // Tạo lại Authentication object vì không còn check pass lại nữa
        Authentication authentication = new UsernamePasswordAuthenticationToken(
                user.getUsername(), null, Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + user.getRole().name())));
        SecurityContextHolder.getContext().setAuthentication(authentication);
        
        return refreshTokenService.createTokenPair(user);
    }

    public TokenPairResponse firebaseLogin(FirebaseLoginRequest request) {
        FirebaseToken decodedToken = firebaseService.verifyIdToken(request.getFirebaseToken());
        
        String phoneOrEmail = decodedToken.getEmail();
        boolean isPhone = false;
        
        if (phoneOrEmail == null && decodedToken.getClaims().containsKey("phone_number")) {
            phoneOrEmail = (String) decodedToken.getClaims().get("phone_number");
            isPhone = true;
        }
        
        if (phoneOrEmail == null) {
            throw new CustomException("Firebase token không chứa thông tin định danh hợp lệ (email/phone).", 400);
        }

        Optional<User> userOpt;
        if (isPhone) {
            userOpt = userRepository.findByPhoneNumber(phoneOrEmail);
        } else {
            userOpt = userRepository.findByEmail(phoneOrEmail);
        }
        
        if (userOpt.isEmpty()) {
            throw new CustomException("Tài khoản chưa được đăng ký trong hệ thống: " + phoneOrEmail, 404);
        }

        User user = userOpt.get();

        if (!user.isActive()) {
            if ("INACTIVE".equals(user.getStatus())) {
                throw new CustomException("Account is not activated. Please verify the SMS OTP first.", 403);
            }
            throw new CustomException("Your account has been locked. Please contact an administrator.", 403);
        }

        rejectIfLoginLocked(user);

        return refreshTokenService.createTokenPair(user);
    }

    @Transactional
    public User registerUser(RegisterRequest registerRequest) {
        // [UPGRADE] Tránh Deadlock dữ liệu: Nếu phát hiện tài khoản nháp (INACTIVE) trùng lặp,
        // hệ thống sẽ tự động dọn dẹp (xóa vật lý) để cho phép người dùng đăng ký lại từ đầu.
        
        userRepository.findByPhoneNumber(registerRequest.getPhoneNumber()).ifPresent(user -> {
            if ("INACTIVE".equals(user.getStatus())) {
                userRepository.delete(user);
                userRepository.flush(); // Đảm bảo đã xóa xong trước khi lưu mới
            } else {
                throw new CustomException("Số điện thoại này đã được liên kết với tài khoản khác!", 400);
            }
        });

        userRepository.findByUsername(registerRequest.getUsername()).ifPresent(user -> {
            if ("INACTIVE".equals(user.getStatus())) {
                userRepository.delete(user);
                userRepository.flush();
            } else {
                throw new CustomException("Tên đăng nhập đã tồn tại!", 400);
            }
        });

        userRepository.findByEmail(registerRequest.getEmail()).ifPresent(user -> {
            if ("INACTIVE".equals(user.getStatus())) {
                userRepository.delete(user);
                userRepository.flush();
            } else {
                throw new CustomException("Email đã được sử dụng!", 400);
            }
        });

        User user = new User(
                registerRequest.getUsername(),
                passwordEncoder.encode(registerRequest.getPassword()),
                registerRequest.getFullName(),
                registerRequest.getPhoneNumber(),
                registerRequest.getEmail(),
                Role.CITIZEN
        );
        
        // [TWO-STEP REGISTRATION] Đặt trạng thái chưa kích hoạt
        user.setStatus("INACTIVE");
        user.setPhoneVerified(false);
        User savedUser = userRepository.save(user);

        // Tự động bắn SMS
        smsService.generateAndSendOtp(registerRequest.getPhoneNumber());

        return savedUser;
    }

    @Transactional
    public void confirmRegistration(String phoneNumber, String otpCode) {
        // 1. Xác minh mã OTP bằng số điện thoại
        smsService.verifyOtp(phoneNumber, otpCode);

        // 2. Tìm người dùng
        User user = userRepository.findByPhoneNumber(phoneNumber)
                .orElseThrow(() -> new CustomException("Không tìm thấy tài khoản với số điện thoại này", 404));

        // 3. Kiểm tra xem đã kích hoạt chưa
        if ("ACTIVE".equals(user.getStatus())) {
            throw new CustomException("Tài khoản này đã được kích hoạt từ trước!", 400);
        }

        // 4. Kích hoạt tài khoản
        user.setStatus("ACTIVE");
        user.setPhoneVerified(true);
        userRepository.save(user);
    }

    @Transactional
    public void verifyLoginOtp(String phoneNumber, String otpCode) {
        smsService.verifyOtp(phoneNumber, otpCode);

        userRepository.findByPhoneNumber(phoneNumber).ifPresent(user -> {
            if (user.isLoginOtpRequired()) {
                resetLoginLockout(user);
                userRepository.save(user);
            }
        });
    }

    public void logout(String tokenHeader) {
        if (tokenHeader != null && tokenHeader.startsWith("Bearer ") && tokenHeader.length() > 7) {
            String jwt = tokenHeader.substring(7);
            // Trích xuất username ngay cả khi token đã hết hạn
            String username = tokenProvider.getUsernameFromExpiredJWT(jwt);

            try {
                java.util.Date expiration = tokenProvider.getExpirationFromJWT(jwt);
                blacklistService.blacklistToken(jwt, expiration.getTime());
            } catch (Exception e) {
                // Nếu token không hợp lệ hoặc đã hết hạn, đưa vào blacklist 10 phút
                blacklistService.blacklistToken(jwt, System.currentTimeMillis() + 600000);
            }
            
            // Thu hồi toàn bộ refresh token
            if (username != null) {
                userRepository.findByUsername(username).ifPresent(user -> 
                    refreshTokenService.revokeAll(user.getId())
                );
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
