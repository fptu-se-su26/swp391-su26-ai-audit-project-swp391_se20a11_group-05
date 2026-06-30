package com.example.smartcity.modules.notification.repository;

import com.example.smartcity.common.base.BaseRepository;
import com.example.smartcity.modules.notification.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NotificationRepository extends BaseRepository<Notification, Long> {
    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);
    Page<Notification> findByUserId(Long userId, Pageable pageable);
    long countByUserIdAndIsReadFalse(Long userId);

    boolean existsByUserIdAndFeedbackIdAndType(Long userId, Long feedbackId, String type);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("UPDATE Notification n SET n.isRead = true WHERE n.user.id = :userId AND n.isRead = false")
    void markAllAsReadForUser(@org.springframework.data.repository.query.Param("userId") Long userId);
}
