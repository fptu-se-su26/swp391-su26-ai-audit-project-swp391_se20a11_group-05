package com.example.smartcity.modules.feedback.repository;

import com.example.smartcity.common.base.BaseRepository;
import com.example.smartcity.modules.feedback.entity.Feedback;
import com.example.smartcity.modules.feedback.entity.FeedbackStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface FeedbackRepository extends BaseRepository<Feedback, Long> {

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"category", "ward", "citizen", "assignee"})
    Page<Feedback> findAll(Pageable pageable);

    Optional<Feedback> findByTrackingCode(String trackingCode);
    
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"category", "ward", "citizen", "assignee"})
    Page<Feedback> findByStatus(FeedbackStatus status, Pageable pageable);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"category", "ward", "citizen", "assignee"})
    Page<Feedback> findByCitizenId(Long citizenId, Pageable pageable);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"category", "ward", "citizen", "assignee"})
    Page<Feedback> findByWardId(Long wardId, Pageable pageable);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"category", "ward", "citizen", "assignee"})
    Page<Feedback> findByCategoryName(String categoryName, Pageable pageable);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"category", "ward", "citizen", "assignee"})
    Page<Feedback> findByAssigneeId(Long assigneeId, Pageable pageable);
    Page<Feedback> findByStatusIn(List<FeedbackStatus> statuses, Pageable pageable);
    Page<Feedback> findByWardIdAndStatusIn(Long wardId, List<FeedbackStatus> statuses, Pageable pageable);
    long countByStatus(FeedbackStatus status);
    List<Feedback> findByCreatedAtBetween(java.time.LocalDateTime from, java.time.LocalDateTime to);

    @org.springframework.data.jpa.repository.Query("SELECT w.name, COUNT(f.id), SUM(CASE WHEN f.status = 'RESOLVED' THEN 1L ELSE 0L END) FROM Feedback f JOIN f.ward w GROUP BY w.name")
    List<Object[]> getWardPerformanceStats();
}




