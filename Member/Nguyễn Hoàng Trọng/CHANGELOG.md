# Changelog

## 1. Quy định ghi Changelog

File này dùng để ghi lại các thay đổi quan trọng trong quá trình thực hiện bài tập, lab, assignment hoặc project.

Nguyên tắc ghi changelog:

- Chỉ ghi những gì đã hoàn thành thật sự.
- Không ghi kế hoạch nếu chưa thực hiện.
- Mỗi thay đổi nên có ngày, nội dung, người thực hiện và minh chứng.
- Nếu có AI hỗ trợ, cần ghi rõ AI đã hỗ trợ phần nào.
- Nếu có commit GitHub, cần ghi link commit.
- Nếu có lỗi đã sửa, cần ghi rõ lỗi, nguyên nhân và cách xử lý.

---

## 2. Thông tin project

| Thông tin | Nội dung |
|---|---|
| Môn học | Software Development Project |
| Mã môn học | SWP391 |
| Lớp | SE20A11 |
| Học kỳ | SU26 |
| Tên bài tập / Project | Hệ thống "Đà Nẵng Lắng Nghe" (The Listening City System) |
| Tên sinh viên / Nhóm | Nguyễn Hoàng Trọng / Nhóm 05 |
| MSSV / Danh sách MSSV | DE190357 |
| Giảng viên hướng dẫn | Lê Thiện Nhật Quang |
| Repository URL | https://github.com/fptu-se-su26/swp391-su26-ai-audit-project-swp391_se20a11_group-05 |
| Ngày bắt đầu | 2026-05-17 |
| Ngày hoàn thành | 2026-07-02 |

---

## 3. Tổng quan các phiên bản/giai đoạn

| Phiên bản/Giai đoạn | Thời gian | Nội dung chính | Trạng thái |
|---|---|---|---|
| Phase 01 | 2026-05-17 | Khởi tạo project & Cấu trúc thư mục | Completed |
| Phase 02 | 2026-05-20 | Phân tích yêu cầu phân hệ Police | Completed |
| Phase 03 | 2026-05-23 | Thiết kế kiến trúc Police Dashboard | Completed |
| Phase 04 | 2026-06-01 to 2026-06-17 | Triển khai giao diện, APIs, WebSockets & Bản đồ | Completed |
| Phase 05 | 2026-06-18 to 2026-06-25 | Testing, Fix bug TypeScript & Tối ưu hiệu năng | Completed |
| Phase 06 | 2026-07-02 | Hoàn thiện tài liệu, báo cáo & video demo | Completed |

---

# [Phase 01] Khởi tạo project

## Ngày thực hiện

```text
17/05/2026
```

## Đã hoàn thành

- [x] Tạo repository
- [x] Tạo cấu trúc thư mục project
- [x] Tạo file README.md
- [x] Tạo thư mục `docs/`
- [x] Tạo file `AI_AUDIT_LOG.md`
- [x] Tạo file `PROMPTS.md`
- [x] Tạo file `REFLECTION.md`
- [x] Tạo file `CHANGELOG.md`
- [x] Khởi tạo source code ban đầu
- [x] Cài đặt thư viện/công cụ cần thiết
- [x] Cấu hình môi trường chạy project

## Thay đổi chi tiết

| STT | Nội dung thay đổi | Người thực hiện | File/Module liên quan | Minh chứng |
|---:|---|---|---|---|
| 1 | Tạo cấu trúc thư mục phân hệ Police trong source code | Nguyễn Hoàng Trọng | `Sources/Frontend/src/features/police/` | Commit 5c4fa21 |
| 2 | Khởi tạo file log audit học thuật cá nhân | Nguyễn Hoàng Trọng | `Member/Nguyễn Hoàng Trọng/` | Commit f8e1201 |

## AI có hỗ trợ không?

- [ ] Có
- [x] Không

---

# [Phase 02] Phân tích yêu cầu

## Ngày thực hiện

```text
20/05/2026
```

## Đã hoàn thành

- [x] Xác định problem statement cho vai trò Công an (Police)
- [x] Xác định user roles
- [x] Viết user stories
- [x] Viết use cases
- [x] Xác định functional requirements
- [x] Xác định non-functional requirements
- [x] Xác định business rules
- [x] Xác định acceptance criteria
- [x] Review yêu cầu với giảng viên/nhóm

## Thay đổi chi tiết

| STT | Nội dung thay đổi | Người thực hiện | File/Module liên quan | Minh chứng |
|---:|---|---|---|---|
| 1 | Mô tả luồng xử lý và tiếp nhận phản ánh của Công an | Nguyễn Hoàng Trọng | `docs/REQUIREMENTS.md` | Commit a12f3b9 |

## AI có hỗ trợ không?

- [x] Có
- [ ] Không

Nếu có, mô tả AI đã hỗ trợ phần nào:

```text
AI gợi ý danh sách các trường hợp sử dụng (use case) tiêu biểu đối với vai trò Cán bộ Công an trong hệ thống đô thị thông minh.
```

---

# [Phase 03] Thiết kế hệ thống

## Ngày thực hiện

```text
23/05/2026
```

## Đã hoàn thành

- [x] Thiết kế kiến trúc tổng quan phân hệ Police
- [x] Thiết kế database/ERD (bảng phản ánh, tài khoản cán bộ)
- [x] Thiết kế API endpoints cho danh sách phản ánh của công an
- [x] Thiết kế giao diện/wireframe Police Dashboard
- [x] Thiết kế flow xử lý phản ánh
- [x] Thiết kế security/authorization flow

## Thay đổi chi tiết

| STT | Nội dung thay đổi | Người thực hiện | File/Module liên quan | Minh chứng |
|---:|---|---|---|---|
| 1 | Phác thảo sơ đồ lớp (Class Diagram) và sơ đồ tuần tự (Sequence Diagram) | Nguyễn Hoàng Trọng | `docs/architecture/` | Commit b4e9a8f |

## AI có hỗ trợ không?

- [x] Có
- [ ] Không

Nếu có, mô tả AI đã hỗ trợ phần nào:

```text
AI gợi ý định dạng đặc tả các endpoint API (JSON payload mẫu).
```

---

# [Phase 04] Implementation

## Ngày thực hiện

```text
01/06/2026 to 17/06/2026
```

## Đã hoàn thành

- [x] Tạo project structure cho frontend
- [x] Xây dựng UI Police Dashboard Layout
- [x] Xây dựng Sidebar và Profile dropdown
- [x] Xây dựng các thẻ hiển thị Statistics card
- [x] Tích hợp bản đồ Leaflet Map và Heatmap Layer
- [x] Xây dựng bảng quản lý phản ánh Feedback Table
- [x] Tích hợp WebSockets kết nối thông báo thời gian thực

## Thay đổi chi tiết

| STT | Nội dung thay đổi | Người thực hiện | File/Module liên quan | Minh chứng |
|---:|---|---|---|---|
| 1 | Thiết kế layout Grid responsive & Sidebar | Nguyễn Hoàng Trọng | `PoliceDashboardLayout.tsx`, `Sidebar.tsx` | Commit c3901a2 |
| 2 | Tích hợp Leaflet Map hiển thị danh sách các điểm nóng | Nguyễn Hoàng Trọng | `HeatmapMap.tsx`, `MapContainer` | Commit e920d3f |
| 3 | Tích hợp WebSocket Context lắng nghe thông báo real-time | Nguyễn Hoàng Trọng | `WebSocketContext.tsx`, `NotificationBadge` | Commit d839a04 |

## AI có hỗ trợ không?

- [x] Có
- [ ] Không

Nếu có, mô tả AI đã hỗ trợ phần nào:

```text
AI sinh code component sidebar mẫu, code cài đặt plugin leaflet.heat để vẽ bản đồ nhiệt và hook React Context WebSocket.
```

---

# [Phase 05] Testing & Debug

## Ngày thực hiện

```text
18/06/2026 to 25/06/2026
```

## Đã hoàn thành

- [x] Viết test case thủ công kiểm thử giao diện
- [x] Chạy test chức năng chính (tiếp nhận, đổi trạng thái phản ánh)
- [x] Kiểm tra hiển thị responsive trên các thiết bị di động
- [x] Fix các bug TypeScript biên dịch và xung đột đặt tên thư viện
- [x] Tối ưu hóa lazy loading cho các route bản đồ nặng
- [x] Sửa lỗi hiển thị z-index của control panel trên bản đồ

## Danh sách lỗi đã xử lý

| STT | Lỗi phát hiện | Nguyên nhân | Cách xử lý | Trạng thái |
|---:|---|---|---|---|
| 1 | Xung đột tên lớp `Map` | Trùng tên giữa Lucide Icon `Map` và JS class `Map` | Sử dụng import alias `Map as MapIcon` | Fixed |
| 2 | Build TypeScript lỗi kiểu dữ liệu | Một số thuộc tính API bị gộp sai kiểu sau khi merge nhánh | Chỉnh sửa lại interfaces TypeScript rõ ràng | Fixed |
| 3 | Toggle điều khiển bản đồ bị chìm xuống dưới | Thiết lập sai CSS z-index | Nâng z-index lên z-[1000] | Fixed |

## AI có hỗ trợ không?

- [x] Có
- [ ] Không

Nếu có, mô tả AI đã hỗ trợ phần nào:

```text
AI giúp phát hiện nguyên nhân lỗi xung đột đặt tên lớp Map và hướng dẫn cơ chế lazy loading.
```

---

# [Phase 06] Hoàn thiện báo cáo và demo

## Ngày thực hiện

```text
02/07/2026
```

## Đã hoàn thành

- [x] Hoàn thiện source code sạch lỗi linter
- [x] Hoàn thiện README.md
- [x] Kiểm tra lại `AI_AUDIT_LOG.md` cá nhân
- [x] Kiểm tra lại `PROMPTS.md` cá nhân
- [x] Hoàn thiện `REFLECTION.md`
- [x] Kiểm tra lại `CHANGELOG.md`

## AI có hỗ trợ không?

- [ ] Có
- [x] Không

---

# 4. Tổng kết thay đổi cuối project

## 4.1. Các chức năng đã hoàn thành

| STT | Chức năng | Trạng thái | Minh chứng | Ghi chú |
|---:|---|---|---|---|
| 1 | Bảng điều khiển Công an (Police Dashboard) | Completed | UI & Routing hoạt động mượt mà | Đầy đủ responsive |
| 2 | Bản đồ nhiệt điểm nóng (Heatmap Map) | Completed | Hiển thị chính xác tọa độ | Tối ưu hóa lazy loading |
| 3 | Nhận thông báo WebSocket thời gian thực | Completed | Pop-up hiển thị lập tức khi có phản ánh mới | Kết nối ổn định |

---

## 4.2. Các chức năng chưa hoàn thành

Không có.

---

## 4.3. Tổng hợp AI hỗ trợ trong project

| Hạng mục | AI có hỗ trợ không? | Mức độ hỗ trợ | Ghi chú |
|---|---|---|---|
| Requirement | Có | Ít | Phân loại use case |
| Design | Có | Ít | Layout wireframe thô |
| Database | Không | Không | |
| Coding | Có | Nhiều | Component UI & WebSockets |
| Debug | Có | Nhiều | Fix lỗi TypeScript & CSS z-index |
| Testing | Không | Không | |
| Report | Có | Ít | Hiệu chỉnh câu từ |
| Presentation | Không | Không | |

---

## 4.4. Bài học rút ra

```text
Học cách áp dụng các công cụ AI một cách chủ động và có chọn lọc. Luôn kiểm chứng mã nguồn AI sinh ra bằng các trình biên dịch nghiêm ngặt và kiểm thử thực tế trên giao diện để tránh rủi ro hệ thống.
```

---

## 4.5. Hướng cải thiện tiếp theo

```text
Cải tiến hiệu năng của bản đồ khi số lượng phản ánh vượt quá 10,000 bản ghi bằng cơ chế map clustering (nhóm cụm bản đồ).
```

---

# 5. Cam kết cập nhật Changelog

Sinh viên/nhóm cam kết rằng nội dung changelog phản ánh đúng các thay đổi đã thực hiện trong quá trình làm bài tập/project.

| Đại diện sinh viên/nhóm | Ngày xác nhận |
|---|---|
| Nguyễn Hoàng Trọng | 2026-07-15 |
