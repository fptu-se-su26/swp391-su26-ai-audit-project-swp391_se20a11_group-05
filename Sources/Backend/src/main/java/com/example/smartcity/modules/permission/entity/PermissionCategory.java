package com.example.smartcity.modules.permission.entity;

/**
 * Enum định nghĩa các nhóm chức năng chính trong hệ thống
 * Mỗi permission sẽ thuộc về một category để dễ quản lý
 */
public enum PermissionCategory {
    /**
     * Quản lý phản ánh của người dân
     * VD: xem, cập nhật status, assign, comment
     */
    FEEDBACK("Quản lý phản ánh"),

    /**
     * Quản lý người dùng và tài khoản
     * VD: xem danh sách user, đổi role, khóa/mở tài khoản
     */
    USER("Quản lý người dùng"),

    /**
     * Báo cáo, thống kê, analytics
     * VD: xem dashboard, export báo cáo, view KPIs
     */
    ANALYTICS("Báo cáo & Thống kê"),

    /**
     * Quản trị hệ thống cấp cao
     * VD: cấu hình system, manage AI services, backup/restore
     */
    SYSTEM("Quản trị hệ thống");

    private final String displayName;

    PermissionCategory(String displayName) {
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