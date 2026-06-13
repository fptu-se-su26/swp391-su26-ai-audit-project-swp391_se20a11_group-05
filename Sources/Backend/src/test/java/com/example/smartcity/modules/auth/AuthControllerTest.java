package com.example.smartcity.modules.auth;

import com.example.smartcity.modules.auth.controller.AuthController;
import com.example.smartcity.modules.auth.payload.*;
import com.example.smartcity.modules.auth.payload.request.SmsSendRequest;
import com.example.smartcity.modules.auth.payload.request.SmsVerifyRequest;
import com.example.smartcity.modules.auth.service.AuthService;
import com.example.smartcity.modules.auth.service.RefreshTokenService;
import com.example.smartcity.modules.auth.service.SmsService;
import com.example.smartcity.modules.user.mapper.UserMapper;
import com.example.smartcity.common.exception.CustomException;
import com.example.smartcity.security.ratelimit.AuthRateLimiter;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import com.example.smartcity.common.exception.GlobalExceptionHandler;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Unit Tests cho AuthController — Standalone MockMvc (Spring Boot 4.x compatible).
 *
 * Spring Boot 4.x đã xóa @WebMvcTest. Dùng MockMvcBuilders.standaloneSetup()
 * để test Controller độc lập, không cần load full Application Context.
 * Đây là cách test nhanh nhất và không phụ thuộc vào cấu hình Security Filter.
 *
 * Phạm vi kiểm tra:
 *  - HTTP Status code trả về có đúng không?
 *  - JSON response body có đúng cấu trúc không?
 *  - Controller gọi đúng method của Service không?
 *  - Fallback khi Service ném Exception xử lý ra sao?
 */
@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private AuthService authService;

    @Mock
    private SmsService smsService;

    @Mock
    private AuthRateLimiter rateLimiter;

    @Mock
    private RefreshTokenService refreshTokenService;

    @Mock
    private UserMapper userMapper;

    @InjectMocks
    private AuthController authController;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        // Standalone setup: không cần Spring Context, cực nhanh, cắm GlobalExceptionHandler để xử lý CustomException
        mockMvc = MockMvcBuilders.standaloneSetup(authController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    // ═══════════════════════════════════════════════════════
    // POST /api/auth/login
    // ═══════════════════════════════════════════════════════

    @Test
    @DisplayName("[LOGIN] Happy Path: Công dân đăng nhập thành công → 200 + token")
    void login_citizenSuccess_returns200WithToken() throws Exception {
        LoginRequest req = new LoginRequest();
        req.setUsername("citizen1");
        req.setPassword("password123");

        AuthResponse mockResponse = AuthResponse.builder()
                .token("jwt-token-abc")
                .username("citizen1")
                .role("ROLE_CITIZEN")
                .mfaRequired(false)
                .build();

        when(authService.authenticateUser(any(LoginRequest.class))).thenReturn(mockResponse);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.token").value("jwt-token-abc"))
                .andExpect(jsonPath("$.data.username").value("citizen1"))
                .andExpect(jsonPath("$.data.mfaRequired").value(false))
                .andExpect(jsonPath("$.message").value("Đăng nhập thành công"));
    }

    @Test
    @DisplayName("[LOGIN] Cán bộ đăng nhập → 200 + mfaRequired=true")
    void login_staffRequiresMfa_returns200WithMfaFlag() throws Exception {
        LoginRequest req = new LoginRequest();
        req.setUsername("staff1");
        req.setPassword("password123");

        AuthResponse mockResponse = AuthResponse.builder()
                .username("staff1")
                .mfaRequired(true)
                .mfaSetupRequired(false)
                .build();

        when(authService.authenticateUser(any(LoginRequest.class))).thenReturn(mockResponse);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.mfaRequired").value(true))
                .andExpect(jsonPath("$.message").value("Yêu cầu xác thực MFA"));
    }

    @Test
    @DisplayName("[LOGIN] Sad Path: Tài khoản không tồn tại → Service ném CustomException")
    void login_userNotFound_serviceThrowsException() throws Exception {
        LoginRequest req = new LoginRequest();
        req.setUsername("ghost");
        req.setPassword("password123");

        when(authService.authenticateUser(any())).thenThrow(
                new CustomException("Tài khoản không tồn tại", 404));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isNotFound());

        verify(authService).authenticateUser(any(LoginRequest.class));
    }

    @Test
    @DisplayName("[LOGIN] Sad Path: Tài khoản bị khóa → Service ném CustomException 403")
    void login_lockedAccount_serviceThrowsException() throws Exception {
        LoginRequest req = new LoginRequest();
        req.setUsername("locked_user");
        req.setPassword("password123");

        when(authService.authenticateUser(any())).thenThrow(
                new CustomException("Tài khoản đã bị khóa.", 403));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());

        verify(authService).authenticateUser(any(LoginRequest.class));
    }

    // ═══════════════════════════════════════════════════════
    // POST /api/auth/register
    // ═══════════════════════════════════════════════════════

    @Test
    @DisplayName("[REGISTER] Happy Path: Đăng ký thành công → 200 + user data")
    void register_success_returns200() throws Exception {
        RegisterRequest req = new RegisterRequest();
        req.setUsername("newuser");
        req.setPassword("Pass1234");
        req.setFullName("Nguyễn Văn A");
        req.setEmail("vana@example.com");
        req.setPhoneNumber("0905123456");

        com.example.smartcity.modules.user.entity.User mockUser =
                new com.example.smartcity.modules.user.entity.User(
                        "newuser", "encoded", "Nguyễn Văn A", "0905123456",
                        "vana@example.com",
                        com.example.smartcity.modules.user.entity.Role.CITIZEN);

        when(authService.registerUser(any(RegisterRequest.class))).thenReturn(mockUser);
        when(userMapper.toDto(mockUser)).thenReturn(
                com.example.smartcity.modules.user.dto.UserDTO.builder()
                        .username("newuser")
                        .fullName("Nguyễn Văn A")
                        .phoneNumber("0905123456")
                        .email("vana@example.com")
                        .role(com.example.smartcity.modules.user.entity.Role.CITIZEN)
                        .isActive(true)
                        .build());

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Đăng ký thành công"))
                .andExpect(jsonPath("$.data.username").value("newuser"));
    }

    @Test
    @DisplayName("[REGISTER] Sad Path: Username đã tồn tại → Service ném CustomException")
    void register_duplicateUsername_serviceThrows() throws Exception {
        RegisterRequest req = new RegisterRequest();
        req.setUsername("existing");
        req.setPassword("Pass1234");
        req.setFullName("Test User");
        req.setEmail("test@example.com");
        req.setPhoneNumber("0905111222");

        when(authService.registerUser(any())).thenThrow(
                new CustomException("Tên đăng nhập đã tồn tại!", 400));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());

        verify(authService).registerUser(any(RegisterRequest.class));
    }

    // ═══════════════════════════════════════════════════════
    // POST /api/auth/logout
    // ═══════════════════════════════════════════════════════

    @Test
    @DisplayName("[REGISTER] DB unique constraint violation -> 400")
    void register_dataIntegrityViolation_returns400() throws Exception {
        RegisterRequest req = new RegisterRequest();
        req.setUsername("existing");
        req.setPassword("Pass1234");
        req.setFullName("Test User");
        req.setEmail("test@example.com");
        req.setPhoneNumber("0905111222");

        when(authService.registerUser(any())).thenThrow(
                new org.springframework.dao.DataIntegrityViolationException(
                        "duplicate key value violates unique constraint \"users_phone_number_key\""));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());

        verify(authService).registerUser(any(RegisterRequest.class));
    }

    @Test
    @DisplayName("[LOGOUT] Happy Path: Logout with valid token -> 200")
    void logout_withValidToken_returns200() throws Exception {
        doNothing().when(authService).logout(any());

        mockMvc.perform(post("/api/auth/logout")
                        .header("Authorization", "Bearer valid-jwt-token-here"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Đăng xuất thành công"));
    }

    @Test
    @DisplayName("[LOGOUT] Edge Case: Logout không có token header vẫn trả về 200")
    void logout_withoutToken_stillReturns200() throws Exception {
        doNothing().when(authService).logout(null);

        mockMvc.perform(post("/api/auth/logout"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("[LOGOUT][SECURITY FIX] Bearer rỗng không crash Server → 200 an toàn")
    void logout_withEmptyBearer_doesNotCrash() throws Exception {
        // Đây chính là case đã được vá: "Bearer " (chỉ có dấu cách, không có token)
        doNothing().when(authService).logout(any());

        mockMvc.perform(post("/api/auth/logout")
                        .header("Authorization", "Bearer "))
                .andExpect(status().isOk());
    }

    // ═══════════════════════════════════════════════════════
    // POST /api/auth/sms/send
    // ═══════════════════════════════════════════════════════

    @Test
    @DisplayName("[SMS] Happy Path: Gửi OTP thành công → 200")
    void sendSmsOtp_success_returns200() throws Exception {
        SmsSendRequest req = new SmsSendRequest();
        req.setPhoneNumber("+84905123456");

        when(smsService.generateAndSendOtp("+84905123456")).thenReturn("OTP đã gửi thành công");

        mockMvc.perform(post("/api/auth/sms/send")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("[CODE SMELL] /sms/verify và /verify-sms là duplicate endpoint")
    void verifySms_duplicateEndpointsDetected() throws Exception {
        SmsVerifyRequest req = new SmsVerifyRequest();
        req.setPhoneNumber("+84905123456");
        req.setOtpCode("123456");

        when(smsService.verifyOtp(any(), any())).thenReturn(true);

        // Cả 2 endpoint đều gọi cùng 1 logic → nên gộp lại
        mockMvc.perform(post("/api/auth/sms/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/auth/verify-sms")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());

        // Service phải được gọi đúng 2 lần (1 cho mỗi endpoint duplicate)
        verify(smsService, times(2)).verifyOtp("+84905123456", "123456");
    }
}
