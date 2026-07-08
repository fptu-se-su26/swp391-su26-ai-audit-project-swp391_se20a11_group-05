package com.example.smartcity.modules.user.controller;

import com.example.smartcity.common.exception.GlobalExceptionHandler;
import com.example.smartcity.modules.user.dto.UserDTO;
import com.example.smartcity.modules.user.entity.Role;
import com.example.smartcity.modules.user.entity.User;
import com.example.smartcity.modules.user.mapper.UserMapper;
import com.example.smartcity.modules.user.service.UserService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Collections;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {

    @Mock private UserService userService;
    @Mock private UserMapper userMapper;
    @Mock private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;
    @InjectMocks private UserController userController;

    private MockMvc mockMvc;
    private SecurityContext originalSecurityContext;

    @BeforeEach
    void setUp() {
        originalSecurityContext = SecurityContextHolder.getContext();
        mockMvc = MockMvcBuilders.standaloneSetup(userController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.setContext(originalSecurityContext);
    }

    private void mockSecurityContext(String username, String roleName) {
        Authentication authentication = mock(Authentication.class);
        when(authentication.getName()).thenReturn(username);
        lenient().doReturn(Collections.singletonList(new SimpleGrantedAuthority(roleName)))
                .when(authentication).getAuthorities();

        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
    }

    @Test
    @DisplayName("Should allow citizen to get their own profile details")
    void getById_citizenSelf_success() throws Exception {
        mockSecurityContext("citizen1", "ROLE_CITIZEN");

        User targetUser = new User("citizen1", "encoded", "Citizen One", "0905123456", "citizen@example.com", Role.CITIZEN);
        UserDTO targetDto = UserDTO.builder().username("citizen1").fullName("Citizen One").build();

        when(userService.findById(1L)).thenReturn(targetUser);
        when(userMapper.toDto(targetUser)).thenReturn(targetDto);

        mockMvc.perform(get("/api/users/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("citizen1"))
                .andExpect(jsonPath("$.fullName").value("Citizen One"));
    }

    @Test
    @DisplayName("Should deny citizen viewing another citizen profile details")
    void getById_citizenOther_forbidden() throws Exception {
        mockSecurityContext("citizen1", "ROLE_CITIZEN");

        User targetUser = new User("citizen2", "encoded", "Citizen Two", "0905123458", "citizen2@example.com", Role.CITIZEN);

        when(userService.findById(2L)).thenReturn(targetUser);

        mockMvc.perform(get("/api/users/2"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Should allow Super Admin to view any profile details")
    void getById_superAdmin_success() throws Exception {
        mockSecurityContext("admin1", "ROLE_SUPER_ADMIN");

        User targetUser = new User("citizen2", "encoded", "Citizen Two", "0905123458", "citizen2@example.com", Role.CITIZEN);
        UserDTO targetDto = UserDTO.builder().username("citizen2").fullName("Citizen Two").build();

        when(userService.findById(2L)).thenReturn(targetUser);
        when(userMapper.toDto(targetUser)).thenReturn(targetDto);

        mockMvc.perform(get("/api/users/2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("citizen2"));
    }

    @Test
    @DisplayName("Should allow Ward Staff to view profile if citizen is in their campaigns")
    void getById_wardStaffWithCampaignParticipation_success() throws Exception {
        mockSecurityContext("staff1", "ROLE_WARD_STAFF");

        User targetUser = new User("citizen1", "encoded", "Citizen One", "0905123456", "citizen@example.com", Role.CITIZEN);
        UserDTO targetDto = UserDTO.builder().username("citizen1").fullName("Citizen One").build();

        when(userService.findById(1L)).thenReturn(targetUser);
        when(userService.isParticipantInStaffCampaigns(1L, "staff1")).thenReturn(true);
        when(userMapper.toDto(targetUser)).thenReturn(targetDto);

        mockMvc.perform(get("/api/users/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("citizen1"));
    }

    @Test
    @DisplayName("Should deny Ward Staff from viewing profile if citizen has not joined their campaigns")
    void getById_wardStaffWithoutCampaignParticipation_forbidden() throws Exception {
        mockSecurityContext("staff1", "ROLE_WARD_STAFF");

        User targetUser = new User("citizen2", "encoded", "Citizen Two", "0905123458", "citizen2@example.com", Role.CITIZEN);

        when(userService.findById(2L)).thenReturn(targetUser);
        when(userService.isParticipantInStaffCampaigns(2L, "staff1")).thenReturn(false);

        mockMvc.perform(get("/api/users/2"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Should update profile successfully")
    void updateProfile_success() throws Exception {
        mockSecurityContext("citizen1", "ROLE_CITIZEN");

        User targetUser = new User("citizen1", "encoded", "Citizen One", "0905123456", "citizen@example.com", Role.CITIZEN);
        UserDTO targetDto = UserDTO.builder().username("citizen1").fullName("New Name").build();

        when(userService.findByUsername("citizen1")).thenReturn(targetUser);
        when(userService.save(any(User.class))).thenReturn(targetUser);
        when(userMapper.toDto(any(User.class))).thenReturn(targetDto);

        String requestBody = "{\"fullName\":\"New Name\",\"phoneNumber\":\"0336130405\",\"email\":\"citizen@example.com\"}";

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/api/users/profile")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andDo(org.springframework.test.web.servlet.result.MockMvcResultHandlers.print())
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Should change password successfully when current password matches and new password meets complexity rules")
    void changePassword_success() throws Exception {
        mockSecurityContext("citizen1", "ROLE_CITIZEN");
        User targetUser = new User("citizen1", "encoded_old", "Citizen One", "0905123456", "citizen@example.com", Role.CITIZEN);

        when(userService.findByUsername("citizen1")).thenReturn(targetUser);
        when(passwordEncoder.matches("OldPassword1", "encoded_old")).thenReturn(true);
        when(passwordEncoder.encode("NewPassword1")).thenReturn("encoded_new");

        String requestBody = "{\"currentPassword\":\"OldPassword1\",\"newPassword\":\"NewPassword1\",\"confirmPassword\":\"NewPassword1\"}";

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/api/users/profile/change-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andExpect(status().isOk());

        verify(userService, times(1)).save(targetUser);
    }

    @Test
    @DisplayName("Should fail changing password when current password is wrong")
    void changePassword_wrongCurrentPassword_badRequest() throws Exception {
        mockSecurityContext("citizen1", "ROLE_CITIZEN");
        User targetUser = new User("citizen1", "encoded_old", "Citizen One", "0905123456", "citizen@example.com", Role.CITIZEN);

        when(userService.findByUsername("citizen1")).thenReturn(targetUser);
        when(passwordEncoder.matches("WrongPassword1", "encoded_old")).thenReturn(false);

        String requestBody = "{\"currentPassword\":\"WrongPassword1\",\"newPassword\":\"NewPassword1\",\"confirmPassword\":\"NewPassword1\"}";

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/api/users/profile/change-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andExpect(status().isBadRequest());

        verify(userService, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Should fail changing password when new password and confirm password mismatch")
    void changePassword_mismatchedNewConfirm_badRequest() throws Exception {
        String requestBody = "{\"currentPassword\":\"OldPassword1\",\"newPassword\":\"NewPassword1\",\"confirmPassword\":\"MismatchPassword\"}";

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/api/users/profile/change-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andExpect(status().isBadRequest());
    }
}
