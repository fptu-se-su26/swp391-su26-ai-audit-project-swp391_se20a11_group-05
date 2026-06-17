package com.example.smartcity.modules.permission.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Permission Entity - Định nghĩa các quyền trong hệ thống
 * Mỗi permission đại diện cho một hành động cụ thể mà user có thể thực hiện
 */
@Entity
@Table(name = "permissions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Permission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Tên permission (unique) - VD: "VIEW_FEEDBACKS", "UPDATE_FEEDBACK_STATUS"
     */
    @Column(nullable = false, unique = true, length = 100)
    private String name;

    /**
     * Mô tả chi tiết về quyền này
     */
    @Column(nullable = false, length = 255)
    private String description;

    /**
     * Nhóm chức năng của permission
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PermissionCategory category;

    /**
     * Permission có đang hoạt động hay không
     */
    @Column(nullable = false)
    private Boolean isActive = true;

    /**
     * Mức độ ưu tiên (cao hơn = quan trọng hơn)
     */
    @Column(nullable = false)
    private Integer priority = 0;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    /**
     * Người tạo permission này (admin username)
     */
    @Column(length = 50)
    private String createdBy;

    /**
     * Người cập nhật gần nhất
     */
    @Column(length = 50)
    private String updatedBy;

    // Constructor với các field cơ bản
    public Permission(String name, String description, PermissionCategory category) {
        this.name = name;
        this.description = description;
        this.category = category;
        this.isActive = true;
        this.priority = 0;
    }

    public Permission(String name, String description, PermissionCategory category, Integer priority) {
        this(name, description, category);
        this.priority = priority;
    }
}