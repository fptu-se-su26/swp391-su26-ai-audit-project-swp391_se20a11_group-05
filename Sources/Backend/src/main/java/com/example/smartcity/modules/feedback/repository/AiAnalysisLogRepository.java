package com.example.smartcity.modules.feedback.repository;

import com.example.smartcity.modules.feedback.entity.AiAnalysisLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AiAnalysisLogRepository extends JpaRepository<AiAnalysisLog, Long> {
    List<AiAnalysisLog> findByFeedbackId(Long feedbackId);
}
