package com.example.smartcity.modules.permission.repository;

import com.example.smartcity.modules.permission.entity.WardAssignment;
import com.example.smartcity.modules.user.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface WardAssignmentRepository extends JpaRepository<WardAssignment, Long> {

    /**
     * Lấy tất cả ward assignments của user đang active
     */
    @Query("SELECT wa FROM WardAssignment wa WHERE wa.user = :user AND wa.isActive = true AND " +
           "wa.startDate <= :now AND (wa.endDate IS NULL OR wa.endDate > :now)")
    List<WardAssignment> findActiveAssignmentsByUser(@Param("user") User user, @Param("now") LocalDateTime now);

    /**
     * Lấy tất cả assignments của user (bao gồm inactive)
     */
    List<WardAssignment> findByUser(User user);

    /**
     * Lấy users được assign ward cụ thể
     */
    @Query("SELECT wa FROM WardAssignment wa WHERE wa.wardName = :wardName AND wa.isActive = true AND " +
           "wa.startDate <= :now AND (wa.endDate IS NULL OR wa.endDate > :now)")
    List<WardAssignment> findActiveAssignmentsByWard(@Param("wardName") String wardName, @Param("now") LocalDateTime now);

    /**
     * Tìm assignment cụ thể
     */
    Optional<WardAssignment> findByUserAndWardNameAndIsActiveTrue(User user, String wardName);

    /**
     * Kiểm tra user có được assign ward này không
     */
    @Query("SELECT COUNT(wa) > 0 FROM WardAssignment wa WHERE " +
           "wa.user = :user AND wa.wardName = :wardName AND wa.isActive = true AND " +
           "wa.startDate <= :now AND (wa.endDate IS NULL OR wa.endDate > :now)")
    boolean isUserAssignedToWard(@Param("user") User user, 
                                @Param("wardName") String wardName, 
                                @Param("now") LocalDateTime now);

    /**
     * Lấy assignments theo loại phân công
     */
    @Query("SELECT wa FROM WardAssignment wa WHERE wa.assignmentType = :type AND wa.isActive = true")
    List<WardAssignment> findByAssignmentTypeAndIsActiveTrue(@Param("type") WardAssignment.AssignmentType type);

    /**
     * Search assignments với pagination
     */
    @Query("SELECT wa FROM WardAssignment wa WHERE " +
           "(LOWER(wa.user.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(wa.user.username) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(wa.wardName) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
           "(:wardName IS NULL OR wa.wardName = :wardName) AND " +
           "wa.isActive = :isActive")
    Page<WardAssignment> searchWardAssignments(@Param("keyword") String keyword,
                                             @Param("wardName") String wardName,
                                             @Param("isActive") Boolean isActive,
                                             Pageable pageable);

    /**
     * Lấy assignments sắp hết hạn
     */
    @Query("SELECT wa FROM WardAssignment wa WHERE " +
           "wa.isActive = true AND wa.endDate IS NOT NULL AND " +
           "wa.endDate BETWEEN :now AND :warningTime")
    List<WardAssignment> findExpiringAssignments(@Param("now") LocalDateTime now,
                                               @Param("warningTime") LocalDateTime warningTime);

    /**
     * Đếm số assignments theo ward
     */
    @Query("SELECT wa.wardName, COUNT(wa) FROM WardAssignment wa WHERE wa.isActive = true GROUP BY wa.wardName")
    List<Object[]> countAssignmentsByWard();

    /**
     * Lấy tất cả ward names đang có assignments
     */
    @Query("SELECT DISTINCT wa.wardName FROM WardAssignment wa WHERE wa.isActive = true")
    List<String> findAllActiveWardNames();

    /**
     * Lấy assignments được tạo bởi admin cụ thể
     */
    List<WardAssignment> findByAssignedByAndIsActiveTrue(String assignedBy);

    /**
     * Deactivate tất cả assignments của user
     */
    @Query("UPDATE WardAssignment wa SET wa.isActive = false, wa.updatedBy = :updatedBy WHERE wa.user = :user")
    void deactivateAllUserAssignments(@Param("user") User user, @Param("updatedBy") String updatedBy);

    /**
     * Lấy assignments theo role của user
     */
    @Query("SELECT wa FROM WardAssignment wa WHERE wa.user.role = :role AND wa.isActive = true")
    List<WardAssignment> findByUserRole(@Param("role") com.example.smartcity.modules.user.entity.Role role);

    /**
     * Lấy users phụ trách chính của ward
     */
    @Query("SELECT wa FROM WardAssignment wa WHERE wa.wardName = :wardName AND " +
           "wa.assignmentType = :type AND wa.isActive = true AND " +
           "wa.startDate <= :now AND (wa.endDate IS NULL OR wa.endDate > :now)")
    List<WardAssignment> findPrimaryAssignmentsByWard(@Param("wardName") String wardName, 
                                                    @Param("type") WardAssignment.AssignmentType type,
                                                    @Param("now") LocalDateTime now);

    /**
     * Kiểm tra có conflict assignment không (cùng user, cùng ward, cùng thời gian)
     */
    @Query("SELECT COUNT(wa) FROM WardAssignment wa WHERE " +
           "wa.user = :user AND wa.wardName = :wardName AND wa.isActive = true AND " +
           "wa.id != :excludeId AND " +
           "((:startDate BETWEEN wa.startDate AND COALESCE(wa.endDate, :maxDate)) OR " +
           "(:endDate BETWEEN wa.startDate AND COALESCE(wa.endDate, :maxDate)) OR " +
           "(wa.startDate BETWEEN :startDate AND :endDate))")
    long countConflictingAssignments(@Param("user") User user,
                                   @Param("wardName") String wardName,
                                   @Param("startDate") LocalDateTime startDate,
                                   @Param("endDate") LocalDateTime endDate,
                                   @Param("excludeId") Long excludeId,
                                   @Param("maxDate") LocalDateTime maxDate);
}