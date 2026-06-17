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
 * WardAssignment Entity - Quản lý phân công khu vực cho user
 * Mỗi record đại diện cho việc một user được phân công phụ trách một ward cụ thể
 */
@Entity
@Table(name = "ward_assignments",
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "ward_name"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WardAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * User được phân công
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /**
     * Tên phường/quận được phân công
     * VD: "Hải Châu", "Thanh Khê", "Liên Chiểu"
     */
    @Column(nullable = false, length = 100)
    private String wardName;

    /**
     * Loại phân công (chính/phụ)
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AssignmentType assignmentType = AssignmentType.PRIMARY;

    /**
     * Assignment có đang hoạt động không
     */
    @Column(nullable = false)
    private Boolean isActive = true;

    /**
     * Admin nào đã phân công
     */
    @Column(nullable = false, length = 50)
    private String assignedBy;

    /**
     * Lý do phân công
     */
    @Column(length = 500)
    private String reason;

    /**
     * Thời gian bắt đầu phụ trách
     */
    @Column(nullable = false)
    private LocalDateTime startDate;

    /**
     * Thời gian kết thúc phụ trách (null = vô thời hạn)
     */
    @Column
    private LocalDateTime endDate;

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
    public WardAssignment(User user, String wardName, String assignedBy) {
        this.user = user;
        this.wardName = wardName;
        this.assignedBy = assignedBy;
        this.assignmentType = AssignmentType.PRIMARY;
        this.isActive = true;
        this.startDate = LocalDateTime.now();
    }

    public WardAssignment(User user, String wardName, AssignmentType type, String assignedBy) {
        this(user, wardName, assignedBy);
        this.assignmentType = type;
    }

    /**
     * Kiểm tra assignment có còn hiệu lực không
     */
    public boolean isValid() {
        if (!isActive) return false;
        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(startDate)) return false;
        if (endDate != null && now.isAfter(endDate)) return false;
        return true;
    }

    /**
     * Enum loại phân công
     */
    public enum AssignmentType {
        /**
         * Phụ trách chính - có toàn quyền trong ward này
         */
        PRIMARY("Phụ trách chính"),

        /**
         * Hỗ trợ - chỉ có quyền hạn chế trong ward này
         */
        SUPPORT("Hỗ trợ"),

        /**
         * Tạm thời - phân công trong thời gian ngắn
         */
        TEMPORARY("Tạm thời");

        private final String displayName;

        AssignmentType(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }

        @Override
        public String toString() {
            return displayName;
        }
    }
}