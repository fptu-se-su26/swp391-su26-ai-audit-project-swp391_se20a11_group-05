package com.example.smartcity.modules.permission.repository;

import com.example.smartcity.modules.permission.entity.Permission;
import com.example.smartcity.modules.permission.entity.PermissionCategory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PermissionRepository extends JpaRepository<Permission, Long> {

    /**
     * Tìm permission theo tên (unique)
     */
    Optional<Permission> findByName(String name);

    /**
     * Kiểm tra permission có tồn tại theo tên
     */
    boolean existsByName(String name);

    /**
     * Lấy tất cả permissions đang hoạt động
     */
    List<Permission> findByIsActiveTrue();

    /**
     * Lấy permissions theo category
     */
    List<Permission> findByCategoryAndIsActiveTrue(PermissionCategory category);

    /**
     * Lấy permissions theo category (bao gồm cả inactive)
     */
    List<Permission> findByCategory(PermissionCategory category);

    /**
     * Search permissions theo tên hoặc description
     */
    @Query("SELECT p FROM Permission p WHERE " +
           "(LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(p.description) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
           "p.isActive = :isActive")
    Page<Permission> searchPermissions(@Param("keyword") String keyword, 
                                     @Param("isActive") Boolean isActive, 
                                     Pageable pageable);

    /**
     * Lấy permissions theo danh sách categories
     */
    @Query("SELECT p FROM Permission p WHERE p.category IN :categories AND p.isActive = true")
    List<Permission> findByCategoriesAndIsActiveTrue(@Param("categories") List<PermissionCategory> categories);

    /**
     * Đếm số permission theo category
     */
    @Query("SELECT p.category, COUNT(p) FROM Permission p WHERE p.isActive = true GROUP BY p.category")
    List<Object[]> countPermissionsByCategory();

    /**
     * Lấy permissions có priority cao nhất (admin permissions)
     */
    @Query("SELECT p FROM Permission p WHERE p.priority >= :minPriority AND p.isActive = true ORDER BY p.priority DESC")
    List<Permission> findHighPriorityPermissions(@Param("minPriority") Integer minPriority);

    /**
     * Tìm permissions được tạo bởi admin cụ thể
     */
    List<Permission> findByCreatedByAndIsActiveTrue(String createdBy);

    /**
     * Lấy permissions theo tên (case insensitive)
     */
    @Query("SELECT p FROM Permission p WHERE LOWER(p.name) LIKE LOWER(CONCAT('%', :partialName, '%')) AND p.isActive = true")
    List<Permission> findByNameContainingIgnoreCase(@Param("partialName") String partialName);
}