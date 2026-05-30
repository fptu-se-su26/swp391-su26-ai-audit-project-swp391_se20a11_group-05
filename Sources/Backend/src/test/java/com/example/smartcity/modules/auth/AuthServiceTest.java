package com.example.smartcity.modules.auth;

import com.example.smartcity.common.exception.CustomException;
import com.example.smartcity.modules.auth.payload.LoginRequest;
import com.example.smartcity.modules.auth.payload.RegisterRequest;
import com.example.smartcity.modules.auth.payload.TokenResponse;
import com.example.smartcity.modules.auth.service.AuthService;
import com.example.smartcity.modules.auth.service.MfaService;
import com.example.smartcity.modules.auth.service.FirebaseService;
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

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(authenticationManager, userRepository, passwordEncoder,
                tokenProvider, mfaService, firebaseService);
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
        assertTrue(result.isActive());

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
        when(userRepository.findByUsername("citizen1")).thenReturn(Optional.of(citizen));
        when(tokenProvider.generateToken(auth)).thenReturn("jwt-token");
        when(auth.getAuthorities()).thenAnswer(inv -> java.util.List.of(
                new SimpleGrantedAuthority("ROLE_CITIZEN")
        ));

        Object result = authService.authenticateUser(request);

        assertTrue(result instanceof TokenResponse);
        TokenResponse tokenResponse = (TokenResponse) result;
        assertEquals("jwt-token", tokenResponse.getToken());
        assertEquals("citizen1", tokenResponse.getUsername());
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
        when(userRepository.findByUsername("staff1")).thenReturn(Optional.of(staff));

        Object result = authService.authenticateUser(request);

        assertTrue(result instanceof java.util.Map);
        @SuppressWarnings("unchecked")
        java.util.Map<String, Object> map = (java.util.Map<String, Object>) result;
        assertTrue((Boolean) map.get("mfaRequired"));
    }

    @Test
    @DisplayName("Should throw exception when user not found")
    void authenticateUser_userNotFound() {
        LoginRequest request = new LoginRequest();
        request.setUsername("ghost");
        request.setPassword("pass123");

        Authentication auth = mock(Authentication.class);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(auth);
        when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

        assertThrows(CustomException.class, () -> authService.authenticateUser(request));
    }
}
