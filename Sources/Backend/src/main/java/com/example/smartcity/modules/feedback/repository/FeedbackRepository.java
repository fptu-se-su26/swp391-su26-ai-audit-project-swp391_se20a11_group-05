package com.example.smartcity.modules.feedback.repository;

import com.example.smartcity.modules.feedback.entity.Feedback;
import com.example.smartcity.modules.feedback.entity.FeedbackStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
    Optional<Feedback> findByTrackingCode(String trackingCode);
    List<Feedback> findByStatus(FeedbackStatus status);
    List<Feedback> findByAssignee_Id(Long assigneeId);
}




