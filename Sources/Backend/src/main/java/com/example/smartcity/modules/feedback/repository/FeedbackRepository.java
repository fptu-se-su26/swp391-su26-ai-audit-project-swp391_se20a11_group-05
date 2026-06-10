package com.example.smartcity.modules.feedback.repository;

import com.example.smartcity.common.base.BaseRepository;
import com.example.smartcity.modules.feedback.entity.Feedback;
import com.example.smartcity.modules.feedback.entity.FeedbackStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface FeedbackRepository extends BaseRepository<Feedback, Long> {

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"category", "ward", "citizen"})
    Page<Feedback> findAll(Pageable pageable);

    Optional<Feedback> findByTrackingCode(String trackingCode);
    List<Feedback> findByStatus(FeedbackStatus status);
    List<Feedback> findByAssignee_Id(Long assigneeId);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"category", "ward", "citizen"})
    Page<Feedback> findByStatus(FeedbackStatus status, Pageable pageable);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"category", "ward", "citizen"})
    Page<Feedback> findByCitizenId(Long citizenId, Pageable pageable);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"category", "ward", "citizen"})
    Page<Feedback> findByWardId(Long wardId, Pageable pageable);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"category", "ward", "citizen"})
    Page<Feedback> findByCategoryName(String categoryName, Pageable pageable);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"category", "ward", "citizen"})
    Page<Feedback> findByAssigneeId(Long assigneeId, Pageable pageable);
    Page<Feedback> findByStatusIn(List<FeedbackStatus> statuses, Pageable pageable);
    Page<Feedback> findByWardIdAndStatusIn(Long wardId, List<FeedbackStatus> statuses, Pageable pageable);
    long countByStatus(FeedbackStatus status);
    List<Feedback> findByCreatedAtBetween(java.time.LocalDateTime from, java.time.LocalDateTime to);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"category", "ward", "citizen"})
    @org.springframework.data.jpa.repository.Query("""
            SELECT f
            FROM Feedback f
            LEFT JOIN f.ward w
            WHERE f.citizen.id = :citizenId
              AND (:status IS NULL OR f.status = :status)
              AND f.createdAt >= :fromDate
              AND f.createdAt <= :toDate
              AND (
                :keyword IS NULL OR :keyword = '' OR
                LOWER(function('unaccent', COALESCE(f.trackingCode, ''))) LIKE LOWER(function('unaccent', CONCAT('%', :keyword, '%'))) OR
                LOWER(function('unaccent', COALESCE(f.title, ''))) LIKE LOWER(function('unaccent', CONCAT('%', :keyword, '%'))) OR
                LOWER(function('unaccent', COALESCE(f.description, ''))) LIKE LOWER(function('unaccent', CONCAT('%', :keyword, '%'))) OR
                LOWER(function('unaccent', COALESCE(f.addressDetails, ''))) LIKE LOWER(function('unaccent', CONCAT('%', :keyword, '%'))) OR
                LOWER(function('unaccent', COALESCE(w.name, ''))) LIKE LOWER(function('unaccent', CONCAT('%', :keyword, '%')))
              )
            """)
    Page<Feedback> searchMyFeedbacks(
            @Param("citizenId") Long citizenId,
            @Param("keyword") String keyword,
            @Param("status") FeedbackStatus status,
            @Param("fromDate") java.time.LocalDateTime fromDate,
            @Param("toDate") java.time.LocalDateTime toDate,
            Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT w.name, COUNT(f.id), SUM(CASE WHEN f.status = 'RESOLVED' THEN 1L ELSE 0L END) FROM Feedback f JOIN f.ward w GROUP BY w.name")
    List<Object[]> getWardPerformanceStats();
}




