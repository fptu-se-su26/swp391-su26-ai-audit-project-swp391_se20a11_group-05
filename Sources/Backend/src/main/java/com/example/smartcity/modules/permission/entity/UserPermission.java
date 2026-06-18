package com.example.smartcity.modules.permission.entity;

import com.example.smartcity.modules.user.entity.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * UserPermission Entity - Liên kết giữa User và Permission
 * Bảng trung gian để quản lý quyền của từng user cụ thể
 */
@Entity
@Table(name = "user_permissions", 
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "permission_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserPermission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * User được cấp quyền
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /**
     * Quyền được cấp
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "permission_id", nullable = false)
    private Permission permission;

    /**
     * Quyền này có đang được kích hoạt cho user này không
     */
    @Column(nullable = false)
    private Boolean isActive = true;

    /**
     * Admin nào đã cấp quyền này
     */
    @Column(nullable = false, length = 50)
    private String assignedBy;

    /**
     * Lý do cấp quyền (optional)
     */
    @Column(length = 500)
    private String reason;

    /**
     * Thời gian hết hạn (null = vô thời hạn)
     */
    @Column
    private LocalDateTime expiresAt;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime assignedAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    /**
     * Admin nào cập nhật gần nhất
     */
    @Column(length = 50)
    private String updatedBy;

    // Constructor tiện lợi
    public UserPermission(User user, Permission permission, String assignedBy) {
        this.user = user;
        this.permission = permission;
        this.assignedBy = assignedBy;
        this.isActive = true;
    }

    public UserPermission(User user, Permission permission, String assignedBy, String reason) {
        this(user, permission, assignedBy);
        this.reason = reason;
    }

    public UserPermission(User user, Permission permission, String assignedBy, LocalDateTime expiresAt) {
        this(user, permission, assignedBy);
        this.expiresAt = expiresAt;
    }

    /**
     * Kiểm tra xem quyền này có còn hiệu lực không
     */
    public boolean isValid() {
        if (!isActive) return false;
        if (expiresAt != null && LocalDateTime.now().isAfter(expiresAt)) return false;
        return true;
    }
}