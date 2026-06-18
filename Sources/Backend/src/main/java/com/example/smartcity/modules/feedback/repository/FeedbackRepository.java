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
    Page<Feedback> findByManagedByRole(String managedByRole, Pageable pageable);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"category", "ward", "citizen"})
    Page<Feedback> findByManagedByRoleAndWardId(String managedByRole, Long wardId, Pageable pageable);

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

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"category", "ward", "citizen"})
    @org.springframework.data.jpa.repository.Query("""
            SELECT f
            FROM Feedback f
            LEFT JOIN f.ward w
            LEFT JOIN f.category c
            WHERE (:status IS NULL OR f.status = :status)
              AND f.createdAt >= :fromDate
              AND f.createdAt <= :toDate
              AND (:wardId IS NULL OR w.id = :wardId)
              AND (:hasCategories = false OR c.code IN :categories)
              AND (:category IS NULL OR :category = '' OR LOWER(c.name) LIKE LOWER(CONCAT('%', :category, '%')) OR LOWER(c.code) = LOWER(:category))
              AND (
                :keyword IS NULL OR :keyword = '' OR
                LOWER(function('unaccent', COALESCE(f.trackingCode, ''))) LIKE LOWER(function('unaccent', CONCAT('%', :keyword, '%'))) OR
                LOWER(function('unaccent', COALESCE(f.title, ''))) LIKE LOWER(function('unaccent', CONCAT('%', :keyword, '%'))) OR
                LOWER(function('unaccent', COALESCE(f.description, ''))) LIKE LOWER(function('unaccent', CONCAT('%', :keyword, '%'))) OR
                LOWER(function('unaccent', COALESCE(f.addressDetails, ''))) LIKE LOWER(function('unaccent', CONCAT('%', :keyword, '%'))) OR
                LOWER(function('unaccent', COALESCE(w.name, ''))) LIKE LOWER(function('unaccent', CONCAT('%', :keyword, '%')))
              )
            """)
    Page<Feedback> searchPublicFeedbacks(
            @Param("keyword") String keyword,
            @Param("category") String category,
            @Param("status") FeedbackStatus status,
            @Param("fromDate") java.time.LocalDateTime fromDate,
            @Param("toDate") java.time.LocalDateTime toDate,
            @Param("wardId") Long wardId,
            @Param("categories") List<String> categories,
            @Param("hasCategories") boolean hasCategories,
            Pageable pageable);

    @org.springframework.data.jpa.repository.Query("""
            SELECT f.status, COUNT(f.id)
            FROM Feedback f
            LEFT JOIN f.ward w
            LEFT JOIN f.category c
            WHERE (:status IS NULL OR f.status = :status)
              AND f.createdAt >= :fromDate
              AND f.createdAt <= :toDate
              AND (:wardId IS NULL OR f.ward.id = :wardId)
              AND (:hasCategories = false OR c.code IN :categories)
              AND (:category IS NULL OR :category = '' OR LOWER(c.name) LIKE LOWER(CONCAT('%', :category, '%')) OR LOWER(c.code) = LOWER(:category))
              AND (
                :keyword IS NULL OR :keyword = '' OR
                LOWER(function('unaccent', COALESCE(f.trackingCode, ''))) LIKE LOWER(function('unaccent', CONCAT('%', :keyword, '%'))) OR
                LOWER(function('unaccent', COALESCE(f.title, ''))) LIKE LOWER(function('unaccent', CONCAT('%', :keyword, '%'))) OR
                LOWER(function('unaccent', COALESCE(f.description, ''))) LIKE LOWER(function('unaccent', CONCAT('%', :keyword, '%'))) OR
                LOWER(function('unaccent', COALESCE(f.addressDetails, ''))) LIKE LOWER(function('unaccent', CONCAT('%', :keyword, '%'))) OR
                LOWER(function('unaccent', COALESCE(w.name, ''))) LIKE LOWER(function('unaccent', CONCAT('%', :keyword, '%')))
              )
            GROUP BY f.status
            """)
    List<Object[]> countPublicFeedbacksByStatus(
            @Param("keyword") String keyword,
            @Param("category") String category,
            @Param("status") FeedbackStatus status,
            @Param("fromDate") java.time.LocalDateTime fromDate,
            @Param("toDate") java.time.LocalDateTime toDate,
            @Param("wardId") Long wardId,
            @Param("categories") List<String> categories,
            @Param("hasCategories") boolean hasCategories);

    @org.springframework.data.jpa.repository.Query("SELECT w.name, COUNT(f.id), SUM(CASE WHEN f.status = 'RESOLVED' THEN 1L ELSE 0L END) FROM Feedback f JOIN f.ward w GROUP BY w.name")
    List<Object[]> getWardPerformanceStats();

    @org.springframework.data.jpa.repository.Query("""
            SELECT f.status, COUNT(f.id)
            FROM Feedback f
            WHERE f.createdAt >= :fromDate
              AND f.createdAt < :toDate
              AND (:wardId IS NULL OR f.ward.id = :wardId)
              AND f.categoryCode IN ('URBAN_INFRASTRUCTURE', 'ENVIRONMENT', 'CONSTRUCTION')
            GROUP BY f.status
            """)
    List<Object[]> countWardStaffFeedbackByStatusAndDateRange(
            @Param("fromDate") java.time.LocalDateTime fromDate,
            @Param("toDate") java.time.LocalDateTime toDate,
            @Param("wardId") Long wardId);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"category", "ward", "citizen"})
    @org.springframework.data.jpa.repository.Query("""
            SELECT f
            FROM Feedback f
            LEFT JOIN f.ward w
            WHERE f.ward.id = :wardId
              AND f.categoryCode IN ('URBAN_INFRASTRUCTURE', 'ENVIRONMENT', 'CONSTRUCTION')
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
    Page<Feedback> searchWardFeedbacks(
            @Param("wardId") Long wardId,
            @Param("keyword") String keyword,
            @Param("status") FeedbackStatus status,
            @Param("fromDate") java.time.LocalDateTime fromDate,
            @Param("toDate") java.time.LocalDateTime toDate,
            Pageable pageable);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"category", "ward", "citizen"})
    @org.springframework.data.jpa.repository.Query("""
            SELECT f
            FROM Feedback f
            LEFT JOIN f.ward w
            WHERE f.managedByRole = :managedByRole
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
    Page<Feedback> searchPoliceFeedbacks(
            @Param("managedByRole") String managedByRole,
            @Param("keyword") String keyword,
            @Param("status") FeedbackStatus status,
            @Param("fromDate") java.time.LocalDateTime fromDate,
            @Param("toDate") java.time.LocalDateTime toDate,
            Pageable pageable);
    // ─── Aggregate queries cho Analytics (tránh load toàn bộ entity vào memory) ───

    /**
     * KPI nhanh: đếm theo từng status trong 1 query duy nhất.
     * Trả về List<Object[]> với [status_string, count]
     */
    @org.springframework.data.jpa.repository.Query("SELECT f.status, COUNT(f.id) FROM Feedback f GROUP BY f.status")
    List<Object[]> countByStatusGrouped();

    /**
     * Monthly trend dùng DB aggregate — GROUP BY year/month thay vì load entity.
     * Trả về [year, month, total_count, resolved_count]
     */
    @org.springframework.data.jpa.repository.Query("""
            SELECT FUNCTION('YEAR', f.createdAt), FUNCTION('MONTH', f.createdAt),
                   COUNT(f.id),
                   SUM(CASE WHEN f.status = 'RESOLVED' THEN 1L ELSE 0L END)
            FROM Feedback f
            WHERE f.createdAt >= :from AND f.createdAt <= :to
            GROUP BY FUNCTION('YEAR', f.createdAt), FUNCTION('MONTH', f.createdAt)
            ORDER BY FUNCTION('YEAR', f.createdAt), FUNCTION('MONTH', f.createdAt)
            """)
    List<Object[]> getMonthlyTrendStats(
            @org.springframework.data.repository.query.Param("from") java.time.LocalDateTime from,
            @org.springframework.data.repository.query.Param("to") java.time.LocalDateTime to);
}
