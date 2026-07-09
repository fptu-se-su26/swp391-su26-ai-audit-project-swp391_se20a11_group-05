package com.example.smartcity.modules.user.controller;

import com.example.smartcity.common.base.BaseGenericController;
import com.example.smartcity.common.base.BaseMapper;
import com.example.smartcity.common.base.BaseService;
import com.example.smartcity.common.response.ApiResponse;
import com.example.smartcity.common.exception.CustomException;
import com.example.smartcity.modules.user.dto.UserDTO;
import com.example.smartcity.modules.user.entity.User;
import com.example.smartcity.modules.user.mapper.UserMapper;
import com.example.smartcity.modules.user.service.UserService;
import com.example.smartcity.modules.auth.service.EmailOtpService;
import org.springframework.security.crypto.password.PasswordEncoder;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController extends BaseGenericController<User, UserDTO, Long> {

    private final UserService userService;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final EmailOtpService emailOtpService;

    public UserController(UserService userService, UserMapper userMapper, PasswordEncoder passwordEncoder, EmailOtpService emailOtpService) {
        this.userService = userService;
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
        this.emailOtpService = emailOtpService;
    }

    @Override
    protected BaseService<User, Long> getService() {
        return userService;
    }

    @Override
    protected BaseMapper<User, UserDTO> getMapper() {
        return userMapper;
    }

    // ─── OVERRIDE BASE METHODS WITH ROBUST SECURITY ──────────────────────────

    @Override
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'WARD_STAFF', 'POLICE')")
    public ResponseEntity<List<UserDTO>> getAll() {
        return super.getAll();
    }

    @Override
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'WARD_STAFF', 'POLICE')")
    public ResponseEntity<Page<UserDTO>> getAllPaged(Pageable pageable) {
        return super.getAllPaged(pageable);
    }

    @Override
    public ResponseEntity<UserDTO> getById(@PathVariable Long id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String currentUsername = auth.getName();

        User user = userService.findById(id);
        boolean isSuperAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"));
        boolean isStaff = auth.getAuthorities().stream().anyMatch(a -> 
            a.getAuthority().equals("ROLE_WARD_STAFF") || 
            a.getAuthority().equals("ROLE_POLICE")
        );

        boolean isSelf = user.getUsername().equals(currentUsername);

        if (!isSelf && !isSuperAdmin) {
            if (isStaff) {
                boolean isParticipant = userService.isParticipantInStaffCampaigns(id, currentUsername);
                if (!isParticipant) {
                    throw new CustomException("Bạn không có quyền truy cập thông tin của tài khoản này.", 403);
                }
            } else {
                throw new CustomException("Bạn không có quyền truy cập thông tin của tài khoản này.", 403);
            }
        }
        return ResponseEntity.ok(userMapper.toDto(user));
    }


    @Override
    public ResponseEntity<UserDTO> update(@PathVariable Long id, @RequestBody UserDTO dto) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String currentUsername = auth.getName();

        User user = userService.findById(id);
        boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"));

        if (!isAdmin && !user.getUsername().equals(currentUsername)) {
            throw new CustomException("Bạn không có quyền chỉnh sửa thông tin của tài khoản này.", 403);
        }

        user.setFullName(dto.getFullName());
        user.setPhoneNumber(dto.getPhoneNumber());
        user.setEmail(dto.getEmail());
        user.setAvatarUrl(dto.getAvatarUrl());

        User updated = userService.save(user);
        return ResponseEntity.ok(userMapper.toDto(updated));
    }

    @Override
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        return super.delete(id);
    }

    // ─── PROFILE ENDPOINTS FOR AUTHENTICATED USERS ───────────────────────────

    @GetMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserDTO>> getProfile() {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userService.findByUsername(currentUsername);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin cá nhân thành công", userMapper.toDto(user)));
    }

    @PutMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserDTO>> updateProfile(@RequestBody UserDTO dto) {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userService.findByUsername(currentUsername);

        user.setFullName(dto.getFullName());
        user.setPhoneNumber(dto.getPhoneNumber());
        user.setEmail(dto.getEmail());
        user.setAvatarUrl(dto.getAvatarUrl());

        User updated = userService.save(user);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thông tin cá nhân thành công", userMapper.toDto(updated)));
    }

    @DeleteMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> deleteOwnProfile() {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userService.findByUsername(currentUsername);
        userService.deleteById(user.getId());
        return ResponseEntity.ok(ApiResponse.success("Xóa tài khoản thành công", null));
    }

    // ─── LOCK / UNLOCK USER STATUS ──────────────────────────────────────────

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<UserDTO>> changeStatus(
            @PathVariable Long id,
            @RequestParam(name = "active") boolean active) {
        User updated = userService.updateUserStatus(id, active);
        String message = active ? "Mở khóa tài khoản thành công" : "Khóa tài khoản thành công";
        return ResponseEntity.ok(ApiResponse.success(message, userMapper.toDto(updated)));
    }

    // ─── CHANGE ROLE ─────────────────────────────────────────────────────────

    @PatchMapping("/{id}/role")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<UserDTO>> changeRole(
            @PathVariable Long id,
            @RequestParam(name = "role") String role) {
        com.example.smartcity.modules.user.entity.Role newRole;
        try {
            newRole = com.example.smartcity.modules.user.entity.Role.valueOf(role.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new CustomException("Vai trò không hợp lệ: " + role, 400);
        }
        User user = userService.findById(id);
        user.setRole(newRole);
        User updated = userService.save(user);
        return ResponseEntity.ok(ApiResponse.success("Đổi vai trò thành công", userMapper.toDto(updated)));
    }

    @PostMapping("/{id}/warn")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'WARD_STAFF', 'POLICE')")
    public ResponseEntity<ApiResponse<UserDTO>> warnUser(
            @PathVariable Long id,
            @RequestParam(name = "reason") String reason) {
        String actorUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        User updated = userService.warnUser(id, reason, actorUsername);
        return ResponseEntity.ok(ApiResponse.success("Cảnh cáo thành viên thành công", userMapper.toDto(updated)));
    }

    @GetMapping("/blacklist")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'WARD_STAFF', 'POLICE')")
    public ResponseEntity<ApiResponse<List<UserDTO>>> getBlacklist() {
        List<User> banned = userService.getBannedUsers();
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách chặn thành công", userMapper.toDtoList(banned)));
    }

    @PostMapping("/{id}/ban")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'WARD_STAFF', 'POLICE')")
    public ResponseEntity<ApiResponse<UserDTO>> banUser(
            @PathVariable Long id,
            @RequestParam(name = "reason") String reason) {
        String actorUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        User updated = userService.banUser(id, reason, actorUsername);
        return ResponseEntity.ok(ApiResponse.success("Chặn tài khoản thành công", userMapper.toDto(updated)));
    }

    @PostMapping("/{id}/unban")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'WARD_STAFF', 'POLICE')")
    public ResponseEntity<ApiResponse<UserDTO>> unbanUser(@PathVariable Long id) {
        User updated = userService.unbanUser(id);
        return ResponseEntity.ok(ApiResponse.success("Mở khóa tài khoản thành công", userMapper.toDto(updated)));
    }

    @PostMapping("/profile/change-password/otp")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<String>> sendChangePasswordOtp() {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userService.findByUsername(currentUsername);
        if (user.getEmail() == null || user.getEmail().isBlank()) {
            throw new CustomException("Tài khoản chưa cấu hình email để nhận mã OTP.", 400);
        }
        String msg = emailOtpService.generateAndSendOtp(user, user.getEmail(), "PASSWORD_CHANGE");
        return ResponseEntity.ok(ApiResponse.success("Gửi mã OTP thành công", msg));
    }

    @PutMapping("/profile/change-password")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> changePassword(@RequestBody java.util.Map<String, String> request) {
        String currentPassword = request.get("currentPassword");
        String newPassword = request.get("newPassword");
        String confirmPassword = request.get("confirmPassword");
        String otpCode = request.get("otpCode");

        if (currentPassword == null || currentPassword.isBlank()) {
            throw new CustomException("Mật khẩu hiện tại không được để trống", 400);
        }
        if (newPassword == null || newPassword.isBlank()) {
            throw new CustomException("Mật khẩu mới không được để trống", 400);
        }
        if (newPassword.length() < 8) {
            throw new CustomException("Mật khẩu phải có ít nhất 8 ký tự", 400);
        }
        if (!newPassword.matches("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).*$")) {
            throw new CustomException("Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số", 400);
        }
        if (!newPassword.equals(confirmPassword)) {
            throw new CustomException("Mật khẩu xác nhận không khớp", 400);
        }
        if (otpCode == null || otpCode.isBlank()) {
            throw new CustomException("Mã xác thực OTP không được để trống", 400);
        }

        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userService.findByUsername(currentUsername);

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new CustomException("Mật khẩu hiện tại không chính xác", 400);
        }
        if (passwordEncoder.matches(newPassword, user.getPassword())) {
            throw new CustomException("Mật khẩu mới không được trùng với mật khẩu cũ", 400);
        }

        emailOtpService.verifyOtp(user.getEmail(), otpCode);

        user.setPassword(passwordEncoder.encode(newPassword));
        userService.save(user);

        return ResponseEntity.ok(ApiResponse.success("Đổi mật khẩu thành công", null));
    }
}
