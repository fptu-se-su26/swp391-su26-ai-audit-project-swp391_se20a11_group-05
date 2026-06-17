package com.example.smartcity.modules.auth;

import com.example.smartcity.common.exception.CustomException;
import com.example.smartcity.modules.auth.payload.LoginRequest;
import com.example.smartcity.modules.auth.payload.RegisterRequest;
import com.example.smartcity.modules.auth.payload.TokenResponse;
import com.example.smartcity.modules.auth.payload.AuthResponse;
import com.example.smartcity.modules.auth.service.AuthService;
import com.example.smartcity.modules.auth.service.MfaService;
import com.example.smartcity.modules.auth.service.FirebaseService;
import com.example.smartcity.modules.auth.service.SmsService;
import com.example.smartcity.modules.auth.service.MfaSessionService;
import com.example.smartcity.security.jwt.TokenBlacklistService;
import com.example.smartcity.modules.user.entity.Role;
import com.example.smartcity.modules.user.entity.User;
import com.example.smartcity.modules.user.repository.UserRepository;
import com.example.smartcity.security.jwt.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private AuthenticationManager authenticationManager;
    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtTokenProvider tokenProvider;
    @Mock private MfaService mfaService;
    @Mock private FirebaseService firebaseService;
    @Mock private TokenBlacklistService blacklistService;
    @Mock private SmsService smsService;
    @Mock private MfaSessionService mfaSessionService;
    @Mock private com.example.smartcity.modules.auth.service.RefreshTokenService refreshTokenService;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(authenticationManager, userRepository, passwordEncoder,
                tokenProvider, mfaService, firebaseService, blacklistService, smsService, mfaSessionService, refreshTokenService);
    }

    @Test
    @DisplayName("Should register new citizen user successfully")
    void registerUser_success() {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("newuser");
        request.setPassword("password123");
        request.setFullName("Nguyễn Văn A");
        request.setEmail("vana@example.com");
        request.setPhoneNumber("0905123456");

        when(userRepository.findByUsername("newuser")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("vana@example.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("password123")).thenReturn("encoded-password");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        User result = authService.registerUser(request);

        assertNotNull(result);
        assertEquals("newuser", result.getUsername());
        assertEquals("Nguyễn Văn A", result.getFullName());
        assertEquals(Role.CITIZEN, result.getRole());
        assertFalse(result.isActive());

        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("Should reject duplicate username on registration")
    void registerUser_duplicateUsername() {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("existing");
        request.setPassword("password123");
        request.setFullName("Nguyễn Văn B");
        request.setEmail("vanb@example.com");

        when(userRepository.findByUsername("existing")).thenReturn(Optional.of(new User()));

        CustomException ex = assertThrows(CustomException.class,
                () -> authService.registerUser(request));
        assertEquals(400, ex.getStatus());
        assertTrue(ex.getMessage().contains("đã tồn tại"));
    }

    @Test
    @DisplayName("Should reject duplicate email on registration")
    void registerUser_duplicateEmail() {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("newuser");
        request.setPassword("password123");
        request.setFullName("Nguyễn Văn C");
        request.setEmail("dulicate@example.com");

        when(userRepository.findByUsername("newuser")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("dulicate@example.com")).thenReturn(Optional.of(new User()));

        CustomException ex = assertThrows(CustomException.class,
                () -> authService.registerUser(request));
        assertEquals(400, ex.getStatus());
        assertTrue(ex.getMessage().contains("đã được sử dụng"));
    }

    @Test
    @DisplayName("Should return token for citizen login without MFA")
    void authenticateUser_citizen_noMfa() {
        LoginRequest request = new LoginRequest();
        request.setUsername("citizen1");
        request.setPassword("pass123");

        User citizen = new User("citizen1", "encoded", "Công Dân", "0905123456",
                "citizen@example.com", Role.CITIZEN);

        Authentication auth = mock(Authentication.class);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(auth);
        when(userRepository.findByUsernameIgnoreCase("citizen1")).thenReturn(Optional.of(citizen));
        
        com.example.smartcity.modules.auth.payload.TokenPairResponse tokenPair = com.example.smartcity.modules.auth.payload.TokenPairResponse.builder()
                .accessToken("jwt-token")
                .refreshToken("refresh-token")
                .expiresIn(3600L)
                .username("citizen1")
                .role(Role.CITIZEN.name())
                .build();
        when(refreshTokenService.createTokenPair(any(User.class))).thenReturn(tokenPair);

        AuthResponse result = authService.authenticateUser(request);

        assertFalse(result.isMfaRequired());
        assertEquals("jwt-token", result.getToken());
        assertEquals("citizen1", result.getUsername());
    }

    @Test
    @DisplayName("Should require MFA for high-risk roles (WARD_STAFF)")
    void authenticateUser_wardStaff_requiresMfa() {
        LoginRequest request = new LoginRequest();
        request.setUsername("staff1");
        request.setPassword("pass123");

        User staff = new User("staff1", "encoded", "Cán Bộ", "0905123456",
                "staff@example.com", Role.WARD_STAFF);

        Authentication auth = mock(Authentication.class);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(auth);
        when(userRepository.findByUsernameIgnoreCase("staff1")).thenReturn(Optional.of(staff));

        com.example.smartcity.modules.auth.payload.TokenPairResponse tokenPair =
                com.example.smartcity.modules.auth.payload.TokenPairResponse.builder()
                        .accessToken("jwt-token")
                        .refreshToken("refresh-token")
                        .username("staff1")
                        .role(Role.WARD_STAFF.name())
                        .build();
        when(refreshTokenService.createTokenPair(any(User.class))).thenReturn(tokenPair);

        AuthResponse result = authService.authenticateUser(request);

        assertFalse(result.isMfaRequired());
        assertEquals("staff1", result.getUsername());
        assertEquals("jwt-token", result.getToken());
    }

    @Test
    @DisplayName("Should throw exception when user not found")
    void authenticateUser_userNotFound() {
        LoginRequest request = new LoginRequest();
        request.setUsername("ghost");
        request.setPassword("pass123");

        when(userRepository.findByUsernameIgnoreCase("ghost")).thenReturn(Optional.empty());

        assertThrows(CustomException.class, () -> authService.authenticateUser(request));
    }

    @Test
    @DisplayName("Should lock only the submitted account for 1 minute after 5 failed attempts")
    void authenticateUser_firstProgressiveLock_isPerAccount() {
        LoginRequest request = new LoginRequest();
        request.setUsername("citizen1");
        request.setPassword("wrong");

        User citizen = new User("citizen1", "encoded", "Citizen One", "0905000001",
                "citizen1@example.com", Role.CITIZEN);
        citizen.setLoginAttempts(4);

        when(userRepository.findByUsernameIgnoreCase("citizen1")).thenReturn(Optional.of(citizen));
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("bad"));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CustomException ex = assertThrows(CustomException.class, () -> authService.authenticateUser(request));

        assertEquals(429, ex.getStatus());
        assertTrue(ex.getMessage().contains("1 minute"));
        assertEquals(0, citizen.getLoginAttempts());
        assertEquals(1, citizen.getLoginLockStage());
        assertNotNull(citizen.getLockedUntil());
    }

    @Test
    @DisplayName("Should lock for 3 minutes after 3 more failures following first unlock")
    void authenticateUser_secondProgressiveLock_threeMinutes() {
        LoginRequest request = new LoginRequest();
        request.setUsername("citizen1");
        request.setPassword("wrong");

        User citizen = new User("citizen1", "encoded", "Citizen One", "0905000001",
                "citizen1@example.com", Role.CITIZEN);
        citizen.setLoginLockStage(1);
        citizen.setLoginAttempts(2);

        when(userRepository.findByUsernameIgnoreCase("citizen1")).thenReturn(Optional.of(citizen));
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("bad"));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CustomException ex = assertThrows(CustomException.class, () -> authService.authenticateUser(request));

        assertEquals(429, ex.getStatus());
        assertTrue(ex.getMessage().contains("3 minute"));
        assertEquals(2, citizen.getLoginLockStage());
    }

    @Test
    @DisplayName("Should require SMS OTP after stage 3 receives 3 more failures")
    void authenticateUser_stageFour_requiresSmsOtp() {
        LoginRequest request = new LoginRequest();
        request.setUsername("citizen1");
        request.setPassword("wrong");

        User citizen = new User("citizen1", "encoded", "Citizen One", "0905000001",
                "citizen1@example.com", Role.CITIZEN);
        citizen.setLoginLockStage(3);
        citizen.setLoginAttempts(2);

        when(userRepository.findByUsernameIgnoreCase("citizen1")).thenReturn(Optional.of(citizen));
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("bad"));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CustomException ex = assertThrows(CustomException.class, () -> authService.authenticateUser(request));

        assertEquals(423, ex.getStatus());
        assertTrue(citizen.isLoginOtpRequired());
        assertEquals(4, citizen.getLoginLockStage());
        verify(smsService).generateAndSendOtp("0905000001");
    }

    @Test
    @DisplayName("Should reset progressive lockout state after successful password login")
    void authenticateUser_success_resetsLockoutState() {
        LoginRequest request = new LoginRequest();
        request.setUsername("citizen1");
        request.setPassword("pass123");

        User citizen = new User("citizen1", "encoded", "Citizen One", "0905000001",
                "citizen1@example.com", Role.CITIZEN);
        citizen.setLoginAttempts(2);
        citizen.setLoginLockStage(2);
        citizen.setLockedUntil(java.time.LocalDateTime.now().minusMinutes(1));

        Authentication auth = mock(Authentication.class);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(auth);
        when(userRepository.findByUsernameIgnoreCase("citizen1")).thenReturn(Optional.of(citizen));
        when(refreshTokenService.createTokenPair(any(User.class))).thenReturn(
                com.example.smartcity.modules.auth.payload.TokenPairResponse.builder()
                        .accessToken("jwt-token")
                        .refreshToken("refresh-token")
                        .expiresIn(3600L)
                        .username("citizen1")
                        .role(Role.CITIZEN.name())
                        .build());

        AuthResponse result = authService.authenticateUser(request);

        assertEquals("jwt-token", result.getToken());
        assertEquals(0, citizen.getLoginAttempts());
        assertEquals(0, citizen.getLoginLockStage());
        assertFalse(citizen.isLoginOtpRequired());
        assertNull(citizen.getLockedUntil());
    }

    @Test
    @DisplayName("Should clear OTP-required login lock after valid SMS OTP verification")
    void verifyLoginOtp_resetsOtpRequiredLockout() {
        User citizen = new User("citizen1", "encoded", "Citizen One", "0905000001",
                "citizen1@example.com", Role.CITIZEN);
        citizen.setLoginAttempts(1);
        citizen.setLoginLockStage(4);
        citizen.setLoginOtpRequired(true);

        when(userRepository.findByPhoneNumber("0905000001")).thenReturn(Optional.of(citizen));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        authService.verifyLoginOtp("0905000001", "123456");

        verify(smsService).verifyOtp("0905000001", "123456");
        assertEquals(0, citizen.getLoginAttempts());
        assertEquals(0, citizen.getLoginLockStage());
        assertFalse(citizen.isLoginOtpRequired());
    }
}
