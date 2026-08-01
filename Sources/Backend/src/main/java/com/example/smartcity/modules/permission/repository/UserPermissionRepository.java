package com.example.smartcity.modules.permission.repository;

import com.example.smartcity.modules.permission.entity.Permission;
import com.example.smartcity.modules.permission.entity.PermissionCategory;
import com.example.smartcity.modules.permission.entity.UserPermission;
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
public interface UserPermissionRepository extends JpaRepository<UserPermission, Long> {

    /**
     * Tìm user permission cụ thể
     */
    Optional<UserPermission> findByUserAndPermission(User user, Permission permission);

    /**
     * Lấy tất cả permissions của một user
     */
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"permission"})
    List<UserPermission> findByUserAndIsActiveTrue(User user);

    /**
     * Lấy tất cả permissions của user (bao gồm inactive)
     */
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"permission"})
    List<UserPermission> findByUser(User user);

    /**
     * Lấy users có permission cụ thể
     */
    @Query("SELECT up FROM UserPermission up WHERE up.permission = :permission AND up.isActive = true")
    List<UserPermission> findByPermissionAndIsActiveTrue(@Param("permission") Permission permission);

    /**
     * Kiểm tra user có permission cụ thể không (active và chưa hết hạn)
     */
    @Query("SELECT COUNT(up) > 0 FROM UserPermission up WHERE " +
           "up.user = :user AND up.permission = :permission AND up.isActive = true AND " +
           "(up.expiresAt IS NULL OR up.expiresAt > :now)")
    boolean hasValidPermission(@Param("user") User user, 
                              @Param("permission") Permission permission, 
                              @Param("now") LocalDateTime now);

    /**
     * Lấy permissions của user theo category
     */
    @Query("SELECT up FROM UserPermission up WHERE up.user = :user AND " +
           "up.permission.category = :category AND up.isActive = true AND " +
           "(up.expiresAt IS NULL OR up.expiresAt > :now)")
    List<UserPermission> findUserPermissionsByCategory(@Param("user") User user, 
                                                      @Param("category") PermissionCategory category,
                                                      @Param("now") LocalDateTime now);

    /**
     * Lấy tất cả user permissions với pagination và search
     */
    @Query("SELECT up FROM UserPermission up WHERE " +
           "(LOWER(up.user.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(up.user.username) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(up.user.email) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
           "(:category IS NULL OR up.permission.category = :category) AND " +
           "up.isActive = :isActive")
    Page<UserPermission> searchUserPermissions(@Param("keyword") String keyword,
                                             @Param("category") PermissionCategory category,
                                             @Param("isActive") Boolean isActive,
                                             Pageable pageable);

    /**
     * Lấy permissions sắp hết hạn
     */
    @Query("SELECT up FROM UserPermission up WHERE " +
           "up.isActive = true AND up.expiresAt IS NOT NULL AND " +
           "up.expiresAt BETWEEN :now AND :warningTime")
    List<UserPermission> findExpiringPermissions(@Param("now") LocalDateTime now,
                                                @Param("warningTime") LocalDateTime warningTime);

    /**
     * Đếm số permissions theo từng user
     */
    @Query("SELECT up.user, COUNT(up) FROM UserPermission up WHERE up.isActive = true GROUP BY up.user")
    List<Object[]> countPermissionsByUser();

    /**
     * Lấy permissions được assign bởi admin cụ thể
     */
    List<UserPermission> findByAssignedByAndIsActiveTrue(String assignedBy);

    /**
     * Xóa tất cả permissions của user (soft delete)
     */
    @Query("UPDATE UserPermission up SET up.isActive = false, up.updatedBy = :updatedBy WHERE up.user = :user")
    void deactivateAllUserPermissions(@Param("user") User user, @Param("updatedBy") String updatedBy);

    /**
     * Lấy permissions theo role của user
     */
    @Query("SELECT up FROM UserPermission up WHERE up.user.role = :role AND up.isActive = true")
    List<UserPermission> findByUserRole(@Param("role") com.example.smartcity.modules.user.entity.Role role);

    /**
     * Kiểm tra user có bất kỳ permission nào trong category không
     */
    @Query("SELECT COUNT(up) > 0 FROM UserPermission up WHERE " +
           "up.user = :user AND up.permission.category = :category AND up.isActive = true AND " +
           "(up.expiresAt IS NULL OR up.expiresAt > :now)")
    boolean hasAnyPermissionInCategory(@Param("user") User user, 
                                     @Param("category") PermissionCategory category,
                                     @Param("now") LocalDateTime now);
}