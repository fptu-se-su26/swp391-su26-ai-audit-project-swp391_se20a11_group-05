# TÀI LIỆU 3: BẢO MẬT VÀ QUẢN LÝ TÀI NGUYÊN HỆ THỐNG
**Người viết/Trình bày:** Phạm Bá Trí

## 1. Bài toán Tải trọng hệ thống (Performance vs Logic)
Hội đồng thường đặt câu hỏi: *"Việc chia 56 phường x 3 vai trò có làm hệ thống bị quá tải (Nặng) không?"*
- **Về mặt Máy chủ (Hardware):** Cực kỳ NHẸ. Với việc ứng dụng Database Indexing đúng chuẩn, câu lệnh lọc dữ liệu theo `ward_id` mất chưa tới 5ms để chạy trên PostgreSQL dù có hàng triệu bản ghi.
- **Về mặt Thiết kế Logic (Architecture):** Rất PHỨC TẠP & CHẶT CHẼ.

## 2. Bảo mật Dữ liệu chéo (IDOR / BOLA)
Một lỗi sơ đẳng của sinh viên là chỉ kiểm tra quyền đăng nhập (Authorization) mà quên kiểm tra quyền sở hữu dữ liệu (Row-Level Security).
- **Hệ thống khắc phục:** Cán bộ Phường A không thể cố tình sửa URL/API để xem hoặc can thiệp vào hồ sơ của Phường B.
- Cán bộ hạ tầng không thể xem được các vụ án đang điều tra của Công an.

## 3. Xác thực Nâng cao (Step-Up Authentication / MFA)
- Màn hình của Công an (POLICE) và IOC (SUPER_ADMIN) có chức năng gửi Cảnh báo khẩn cấp (Emergency Alerts) đến điện thoại toàn dân.
- Nếu tài khoản này bị hacker chiếm đoạt do lộ mật khẩu, hậu quả xã hội sẽ rất nghiêm trọng.
- **Giải pháp:** Hệ thống đã tích hợp Multi-Factor Authentication (MFA). Khi thực hiện các tác vụ nhạy cảm, cán bộ bắt buộc phải mở Google Authenticator trên điện thoại để nhập mã OTP 6 số.

## 4. Bảo mật Token Rotation
- Thay vì cấp 1 Access Token sống dai (dễ bị lấy trộm), hệ thống cấp Token 15 phút và 1 Refresh Token sống lâu hơn.
- Nếu Hacker trộm Refresh Token và đem đi đổi mới, hệ thống sẽ phát hiện ra **"Token đã được sử dụng lại"** (Reuse Attack Detection) và lập tức **thu hồi (Revoke)** toàn bộ phiên đăng nhập của cán bộ đó.
