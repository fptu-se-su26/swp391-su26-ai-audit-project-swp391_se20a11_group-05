package com.example.smartcity.modules.feedback.repository;

import com.example.smartcity.modules.feedback.entity.AiAnalysisLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AiAnalysisLogRepository extends JpaRepository<AiAnalysisLog, Long> {
    List<AiAnalysisLog> findByFeedbackId(Long feedbackId);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(a) FROM AiAnalysisLog a")
    long countTotalLogs();

    @org.springframework.data.jpa.repository.Query("SELECT AVG(a.trustScore) FROM AiAnalysisLog a")
    Double getAverageTrustScore();

    @org.springframework.data.jpa.repository.Query("SELECT SUM(a.tokensUsedInput) FROM AiAnalysisLog a")
    Long sumInputTokens();

    @org.springframework.data.jpa.repository.Query("SELECT SUM(a.tokensUsedOutput) FROM AiAnalysisLog a")
    Long sumOutputTokens();

    // Lấy danh sách giới hạn số lượng (dùng cho list log gần nhất)
    java.util.List<AiAnalysisLog> findTop50ByOrderByCreatedAtDesc();
}
