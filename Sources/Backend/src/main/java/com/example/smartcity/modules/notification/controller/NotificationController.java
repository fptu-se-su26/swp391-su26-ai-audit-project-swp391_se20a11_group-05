package com.example.smartcity.modules.notification.controller;

import com.example.smartcity.common.base.BaseGenericController;
import com.example.smartcity.common.base.BaseMapper;
import com.example.smartcity.common.base.BaseService;
import com.example.smartcity.common.response.ApiResponse;
import com.example.smartcity.modules.feedback.dto.PagedResponse;
import com.example.smartcity.modules.notification.dto.NotificationDTO;
import com.example.smartcity.modules.notification.entity.Notification;
import com.example.smartcity.modules.notification.mapper.NotificationMapper;
import com.example.smartcity.modules.notification.service.NotificationService;
import com.example.smartcity.modules.user.entity.User;
import com.example.smartcity.modules.user.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
@Slf4j
public class NotificationController extends BaseGenericController<Notification, NotificationDTO, Long> {

    private final NotificationService notificationService;
    private final NotificationMapper notificationMapper;
    private final UserService userService;

    @Override
    protected BaseService<Notification, Long> getService() {
        return notificationService;
    }

    @Override
    protected BaseMapper<Notification, NotificationDTO> getMapper() {
        return notificationMapper;
    }

    /**
     * Lấy toàn bộ thông báo của người dùng hiện tại đang đăng nhập.
     * Ghi đè phương thức getAll mặc định của BaseGenericController để đảm bảo tính riêng tư dữ liệu.
     */
    @Override
    @GetMapping
    public ResponseEntity<List<NotificationDTO>> getAll() {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userService.findByUsername(currentUsername);

        List<Notification> notifications = notificationService.getNotificationsForUser(user.getId());
        log.info(
                "[Notification] Returning notifications. userId={}, username={}, count={}",
                user.getId(),
                currentUsername,
                notifications.size());
        return ResponseEntity.ok(notificationMapper.toDtoList(notifications));
    }

    @GetMapping(params = {"page", "size"})
    public ResponseEntity<PagedResponse<NotificationDTO>> getPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userService.findByUsername(currentUsername);
        int safePage = Math.max(0, page);
        int safeSize = Math.min(Math.max(1, size), 20);

        PagedResponse<NotificationDTO> notifications = notificationService.getNotificationPageForUser(
                user.getId(),
                PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "createdAt")));
        log.info(
                "[Notification] Returning paged notifications. userId={}, username={}, page={}, size={}, count={}, hasNext={}",
                user.getId(),
                currentUsername,
                notifications.getPage(),
                notifications.getSize(),
                notifications.getContent().size(),
                notifications.isHasNext());
        return ResponseEntity.ok(notifications);
    }

    /**
     * Đánh dấu thông báo là đã đọc.
     */
    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<NotificationDTO>> markAsRead(@PathVariable Long id) {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        Notification updated = notificationService.markAsRead(id, currentUsername);
        return ResponseEntity.ok(ApiResponse.success("Đánh dấu đã đọc thông báo thành công", notificationMapper.toDto(updated)));
    }
}
