# LỊCH SỬ PHÁT TRIỂN DỰ ÁN "ĐÀ NẴNG KẾT NỐI" (THE LISTENING CITY SYSTEM)

Tài liệu này ghi lại toàn bộ lịch sử hình thành, kiến trúc kỹ thuật và các cột mốc phát triển chính của dự án **Đà Nẵng Kết Nối** (Cổng thông tin phản ánh hiện trường thành phố) thực hiện bởi **Nhóm 05 - Lớp SE20A11** trong học kỳ **SU26** môn học **SWP391**.

---

## 1. THÔNG TIN CHUNG DỰ ÁN

*   **Tên dự án:** Đà Nẵng Kết Nối (The Listening City System)
*   **Mục tiêu:** Xây dựng cổng dịch vụ số hành chính công hiện đại, giúp người dân thành phố Đà Nẵng gửi phản ánh hiện trường (giao thông, môi trường, an ninh trật tự, hạ tầng đô thị...) và theo dõi tiến độ giải quyết của chính quyền một cách minh bạch, nhanh chóng.
*   **Học kỳ:** Summer 2026 (SU26)
*   **Môn học:** SWP391 - Xây dựng ứng dụng hướng đối tượng
*   **Lớp học:** SE20A11
*   **Nhóm thực hiện:** Nhóm 05
*   **Danh sách thành viên:**
    1.  Trần Minh Vĩ (MSSV: DE190182) — Trưởng nhóm / Lập trình viên Frontend chính
    2.  Nguyễn Hoàng Trọng (MSSV: DE190357) — Lập trình viên Backend
    3.  Phạm Tuấn Việt (MSSV: DE190714) — Lập trình viên Backend
    4.  Phan Thanh Bình (MSSV: DE190210) — Thiết kế Database & Kiểm thử
    5.  Phạm Bá Trí (MSSV: DE191029) — Phân tích yêu cầu (SRS) & Nghiên cứu Khoa học

---

## 2. KIẾN TRÚC KỸ THUẬT & CÔNG NGHỆ ÁP DỤNG

Dự án được xây dựng dựa trên mô hình Client-Server phân lớp bảo mật cao, tách biệt Frontend và Backend:

### Frontend (Sources/Frontend)
*   **Core:** React 19, TypeScript.
*   **Routing & SSR:** TanStack Start & TanStack Router (quản lý route dạng file-based cực kỳ chặt chẽ và an toàn kiểu dữ liệu).
*   **Styling:** Tailwind CSS (thiết kế theo phong cách giao diện hành chính công chuyên nghiệp - Civic Theme).
*   **Thư viện hỗ trợ:** Leaflet Maps (hiển thị bản đồ phản ánh trực quan), Lucide Icons (hệ thống biểu tượng phẳng), Sonner (thông báo Toast thời gian thực).

### Backend (Sources/Backend)
*   **Framework:** Spring Boot (Java), Maven.
*   **Database:** PostgreSQL (kết hợp lưu trữ vector cho tìm kiếm thông minh).
*   **Security:** JWT Authentication, OTP Passwordless Authentication, Authenticator MFA TOTP.

---

## 3. TIẾN TRÌNH & CÁC CỘT MỐC PHÁT TRIỂN CHÍNH (TIMELINE)

### Tuần 1: Khởi động & Định hình ý tưởng (11/05/2026 - 17/05/2026)
*   **Hoạt động:** Thành lập nhóm 05 (Lớp SE20A11), bầu trưởng nhóm Trần Minh Vĩ.
*   **Cột mốc:** Thống nhất lựa chọn đề tài nâng cấp hệ thống phản ánh 1022 Đà Nẵng hiện tại thành cổng thông tin thế hệ mới **"Đà Nẵng Kết Nối"** tích hợp AI và bản đồ số trực tuyến.
*   **Kết quả:** Tạo repository dự án trên GitHub Classroom và thiết lập quy trình làm việc (`Branch -> Pull Request -> Review -> Merge`).

### Tuần 2: Nghiên cứu Khoa học & Đặc tả SRS (18/05/2026 - 24/05/2026)
*   **Hoạt động:** Tìm kiếm và phân tích 10 bài báo khoa học liên quan từ cơ sở dữ liệu **Springer** về các chủ đề: Hybrid RAG phục vụ tra cứu thông tin hành chính công và Edge Intelligence/OCR ứng dụng phát hiện hiện trạng đô thị.
*   **Cột mốc:** Viết bản đặc tả yêu cầu phần mềm **SRS** chi tiết (Mục tiêu, phạm vi chức năng, so sánh điểm nghẽn của hệ thống cũ).
*   **Kết quả:**
    *   Hoàn thành tài liệu `Paper_Synthesis.md` tổng hợp nghiên cứu.
    *   Khởi tạo cấu trúc tài liệu đặc tả chức năng `SRS.md` và vẽ mockup UI Dashboard kiểm toán đô thị.

### Tuần 3: Thiết kế Hệ thống & Cơ sở dữ liệu (25/05/2026 - 31/05/2026)
*   **Hoạt động:** Thiết kế thực thể cơ sở dữ liệu (Database Schema) trên PostgreSQL. Phác thảo kiến trúc luồng dữ liệu (Data Flow) và thiết kế hệ thống xác thực bảo mật nhiều lớp.
*   **Cột mốc:**
    *   Thiết kế luồng **Passwordless Login** qua mã OTP SMS dành cho người dân.
    *   Thiết kế xác thực 2 lớp **MFA (Multi-Factor Authentication - TOTP)** dùng Google Authenticator dành cho cấp quản lý.
*   **Kết quả:** Tạo cấu trúc thư mục Database, tạo các script SQL (`03_HYBRID_RAG_SUPABASE.sql`) và vẽ sơ đồ kiến trúc hệ thống (`ARCHITECTURE_SIMPLE_VIEW.puml`).

### Tuần 4: Phát triển Backend API & Logic lõi (01/06/2026 - 07/06/2026)
*   **Hoạt động:** Viết các service Spring Boot xử lý nghiệp vụ, tích hợp gửi mã OTP và cấu hình phân quyền truy cập nâng cao (Role-Based Access Control) cho 4 nhóm vai trò: Người dân (Citizen), Cán bộ Phường (Ward Staff), Cán bộ Công an (Police), và Quản trị viên Thành phố (City Admin).
*   **Cột mốc:** Hoàn thiện API tiếp nhận phản ánh kèm ảnh/video đính kèm và định vị GPS, tự động gửi thông báo thời gian thực về hòm thư người dùng.
*   **Kết quả:** Backend chạy ổn định trên cổng `8081`, tích hợp kết nối thành công với database.

### Tuần 5: Hoàn thiện Frontend, Cải tiến Responsive & Giao diện (08/06/2026 - Hiện tại: 13/06/2026)
*   **Hoạt động:** Ghép nối API Backend vào giao diện React, nâng cấp toàn diện visual của Trang chủ, Header và Footer.
*   **Cột mốc:**
    *   *Trang chủ:* Bổ sung khu vực Tin tức & Thông báo, Câu hỏi thường gặp FAQ Accordion, dải cam kết Trust Strip và Footer chuẩn quốc gia.
    *   *Thanh tiêu đề (Header):* Thiết kế lại thanh tiêu đề 1 dòng tối giản cực kỳ sang trọng. Thu gọn liên kết chính thành: `Trang chủ`, `Tra cứu` và `Hướng dẫn`.
    *   *Tính năng cuộn trang:* Nút **Hướng dẫn** liên kết đến `/#huong-dan`, hỗ trợ cuộn mượt xuống quy trình gửi phản ánh mà không bị thanh Header dính (sticky) che mất chữ nhờ lề cuộn thông minh (`scroll-mt-24`).
    *   *Dropdowns & Drawer di động:* Chuông thông báo hiển thị số đếm động từ API và menu Profile được thiết kế đáp ứng hoàn hảo trên màn hình di động (Top Bar di động luôn hiển thị các hành động nhanh này). Triển khai logic đóng/mở tự động loại trừ nhau để không bao giờ chồng chéo layout trên điện thoại.
*   **Kết quả:** Định dạng mã nguồn toàn diện bằng Prettier, vượt qua toàn bộ các kiểm tra nghiêm ngặt của ESLint, lệnh build frontend production thành công 100% không có lỗi.

---

## 4. KẾT LUẬN & ĐỊNH HƯỚNG TIẾP THEO

Hệ thống **Đà Nẵng Kết Nối** đã hoàn thành xuất sắc các phân hệ cốt lõi với giao diện trực quan sinh động, tương thích tốt trên mọi thiết bị và hệ thống bảo mật chặt chẽ. Định hướng tiếp theo của nhóm bao gồm:
1.  Tối ưu hóa thời gian tải bản đồ ngoại tuyến (Offline Map caching) cho ứng dụng di động.
2.  Tích hợp Trợ lý ảo AI Assistant hoàn chỉnh để tự động phân loại mức độ khẩn cấp của các phản ánh được gửi lên từ người dân.
