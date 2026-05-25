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
@RequiredArgsConstructor
public class UserController extends BaseGenericController<User, UserDTO, Long> {

    private final UserService userService;
    private final UserMapper userMapper;

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
        boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"));

        if (!isAdmin && !user.getUsername().equals(currentUsername)) {
            throw new CustomException("Bạn không có quyền truy cập thông tin của tài khoản này.", 403);
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

        User updated = userService.save(user);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thông tin cá nhân thành công", userMapper.toDto(updated)));
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
}
