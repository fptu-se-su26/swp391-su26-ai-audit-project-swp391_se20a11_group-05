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
    Optional<Feedback> findByTrackingCode(String trackingCode);
    Page<Feedback> findByStatus(FeedbackStatus status, Pageable pageable);
    Page<Feedback> findByCitizenId(Long citizenId, Pageable pageable);
    Page<Feedback> findByWardId(Long wardId, Pageable pageable);
    Page<Feedback> findByCategoryName(String categoryName, Pageable pageable);
    Page<Feedback> findByAssigneeId(Long assigneeId, Pageable pageable);
    Page<Feedback> findByStatusIn(List<FeedbackStatus> statuses, Pageable pageable);
    Page<Feedback> findByWardIdAndStatusIn(Long wardId, List<FeedbackStatus> statuses, Pageable pageable);
    long countByStatus(FeedbackStatus status);
    List<Feedback> findByCreatedAtBetween(java.time.LocalDateTime from, java.time.LocalDateTime to);
}




