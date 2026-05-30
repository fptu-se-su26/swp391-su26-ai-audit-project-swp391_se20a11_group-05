package com.example.smartcity.modules.feedback.repository;

import com.example.smartcity.modules.feedback.entity.FeedbackLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FeedbackLogRepository extends JpaRepository<FeedbackLog, Long> {
    List<FeedbackLog> findByFeedback_IdOrderByCreatedAtDesc(Long feedbackId);
}
