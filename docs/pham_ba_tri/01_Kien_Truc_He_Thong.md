# TÀI LIỆU 1: KIẾN TRÚC HỆ THỐNG SMART CITY (SINGLE PORTAL RBAC)
**Người viết/Trình bày:** Phạm Bá Trí

## 1. Vấn đề của mô hình cũ
Trong mô hình truyền thống, khi hệ thống có 4 đối tượng quản lý (Môi trường, Công an, Phường/Xã, IOC 1022), các sinh viên thường thiết kế 4 trang web độc lập. Điều này dẫn đến:
- Tăng gấp 4 lần chi phí phát triển và bảo trì.
- Khó đồng bộ giao diện (UI/UX) và các thay đổi logic.

## 2. Giải pháp Kiến trúc: Single Admin Portal với RBAC
Dự án áp dụng mô hình **Single Admin Portal** kết hợp **Role-Based Access Control (RBAC)**:
- **Một điểm truy cập duy nhất (Single Endpoint):** Toàn bộ cán bộ (từ Công an, Phường đến IOC) đều truy cập chung một đường dẫn quản trị (ví dụ: `admin.smartcity.danang.gov.vn`).
- **Dynamic UI Rendering:** Sau khi đăng nhập, Backend Spring Boot sẽ cấp phát một JWT Token chứa `ROLE` của người dùng. Frontend sẽ dựa vào `ROLE` này để ẩn/hiện các menu và dashboard tương ứng.

## 3. Bản đồ Role (Role Mapping)
1. **SUPER_ADMIN (IOC 1022):** Được thấy toàn bộ dữ liệu thành phố, có quyền cấu hình hệ thống và điều phối thủ công các phản ánh bị phân loại sai.
2. **POLICE (Công an Phường/Xã):** Giao diện tập trung vào An ninh trật tự, tai nạn. Tích hợp chuông cảnh báo và bắt buộc xác thực MFA (Mã OTP) khi vào ca trực.
3. **ENVIRONMENT_COMPANY (Môi trường Đô thị):** Giao diện tập trung vào rác thải, thoát nước quy mô lớn. 
4. **WARD_STAFF (Cán bộ UBND Phường):** Chỉ được xem dữ liệu có tọa độ/địa chỉ thuộc giới hạn hành chính của Phường mình quản lý (Bảo vệ dữ liệu chéo bằng Row-Level Security).

## 4. Lợi ích mang lại
- **Tái sử dụng code:** Tái sử dụng được 80% mã nguồn Frontend (bảng biểu, form, layout, CSS).
- **Dễ bảo trì:** Sửa một lỗi ở form Đăng nhập là cả 4 loại Admin đều được cập nhật.
- **Tiêu chuẩn Doanh nghiệp:** Đây là chuẩn kiến trúc của các hệ thống SaaS và ERP hiện đại.
