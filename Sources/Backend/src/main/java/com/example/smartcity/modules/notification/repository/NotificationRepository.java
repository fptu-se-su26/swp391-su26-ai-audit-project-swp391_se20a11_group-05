package com.example.smartcity.modules.notification.repository;

import com.example.smartcity.common.base.BaseRepository;
import com.example.smartcity.modules.notification.entity.Notification;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NotificationRepository extends BaseRepository<Notification, Long> {
    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);
}
