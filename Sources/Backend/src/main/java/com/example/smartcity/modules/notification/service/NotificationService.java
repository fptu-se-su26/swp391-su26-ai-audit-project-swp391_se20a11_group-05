package com.example.smartcity.modules.notification.service;

import com.example.smartcity.common.base.BaseRepository;
import com.example.smartcity.common.base.BaseServiceImpl;
import com.example.smartcity.common.exception.CustomException;
import com.example.smartcity.modules.notification.entity.Notification;
import com.example.smartcity.modules.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService extends BaseServiceImpl<Notification, Long> {

    private final NotificationRepository notificationRepository;

    @Override
    protected BaseRepository<Notification, Long> getRepository() {
        return notificationRepository;
    }

    @Override
    protected String getResourceName() {
        return "Notification";
    }

    public List<Notification> getNotificationsForUser(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional
    public Notification markAsRead(Long notificationId, String currentUsername) {
        Notification notification = findById(notificationId);

        // Bảo mật: chỉ người nhận thông báo mới có quyền đánh dấu đã đọc
        if (!notification.getUser().getUsername().equals(currentUsername)) {
            throw new CustomException("Bạn không có quyền thao tác trên thông báo này.", 403);
        }

        notification.setRead(true);
        return notificationRepository.save(notification);
    }
}
