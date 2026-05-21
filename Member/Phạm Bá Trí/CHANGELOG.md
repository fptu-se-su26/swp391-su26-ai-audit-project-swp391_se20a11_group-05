# Changelog

## 1. Quy định ghi Changelog

File này dùng để ghi lại các thay đổi quan trọng trong quá trình thực hiện bài tập, lab, assignment hoặc project.

---

## 2. Thông tin project

| Thông tin | Nội dung |
|---|---|
| Môn học | Xây dựng ứng dụng hướng đối tượng |
| Mã môn học | SWP391 |
| Lớp | SE20A11 |
| Học kỳ | SU26 |
| Tên bài tập / Project | Hệ thống "Đà Nẵng Lắng Nghe" (The Listening City System) |
| Tên sinh viên / Nhóm | Phạm Bá Trí / Nhóm 05 |
| MSSV / Danh sách MSSV | DE191029 |
| Repository URL | https://github.com/swp391-su26-ai-audit-project-swp391_se20a11_group-05 |
| Ngày bắt đầu | 2026-05-18 |
| Ngày hoàn thành | 2026-05-20 |

---

## 3. Tổng quan các phiên bản/giai đoạn

| Phiên bản/Giai đoạn | Thời gian | Nội dung chính | Trạng thái |
|---|---|---|---|
| Phase 01 | 18/05 - 20/05 | Khởi tạo dự án và Phân tích tài liệu khoa học | Completed |
| Phase 02 | 20/05 - 22/05 | Phác thảo đặc tả yêu cầu phần mềm (SRS Phase 1) | Completed |

---

# [Phase 01] Khởi tạo dự án & Phân tích tài liệu (Week 2)

## Ngày thực hiện

```text
20/05/2026
```

## Đã hoàn thành

- [x] Tạo thư mục `docs/Paper/` trên Classroom Git
- [x] Tổng hợp và bóc tách thông tin 10 bài báo học thuật Springer
- [x] Phân tích, nhận định & đánh giá 10 bài báo qua tài liệu tổng hợp chuyên sâu
- [x] Soạn thảo đặc tả SRS Phần 1 (Introduction, Product Scope)
- [x] Soạn thảo SRS Phần 2.5 (Các hệ thống hiện tại - so sánh chi tiết với 1022 Đà Nẵng)
- [x] Tạo hình ảnh UI Mockup Dashboard cho phân hệ Kiểm toán Đô thị
- [x] Cập nhật đầy đủ `AI_AUDIT_LOG.md` và `CHANGELOG.md` cho cá nhân & nhóm

## Thay đổi chi tiết

| STT | Nội dung thay đổi | Người thực hiện | File/Module liên quan | Minh chứng |
|---:|---|---|---|---|
| 1 | Tạo thư mục chứa 10 paper summaries | Phạm Bá Trí | `docs/Paper/` | [Paper_01.md đến Paper_10.md](file:///d:/swp391-su26-ai-audit-project-swp391_se20a11_group-05/docs/Paper/) |
| 2 | Viết báo cáo học thuật tổng hợp tuần 2 | Phạm Bá Trí | `docs/Paper/Paper_Synthesis.md` | [Paper_Synthesis.md](file:///d:/swp391-su26-ai-audit-project-swp391_se20a11_group-05/docs/Paper/Paper_Synthesis.md) |
| 3 | Tạo đặc tả yêu cầu SRS chính thức cho hệ thống | Phạm Bá Trí | `docs/SRS.md` | [SRS.md](file:///d:/swp391-su26-ai-audit-project-swp391_se20a11_group-05/docs/SRS.md) |
| 4 | Thiết kế Dashboard Mockup và nhúng vào SRS | Phạm Bá Trí | `docs/listening_city_dashboard.png` | [listening_city_dashboard.png](file:///d:/swp391-su26-ai-audit-project-swp391_se20a11_group-05/docs/listening_city_dashboard.png) |
| 5 | Hoàn thiện AI Audit Log theo quy định | Phạm Bá Trí | `docs/AI_AUDIT_LOG.md` | [AI_AUDIT_LOG.md](file:///d:/swp391-su26-ai-audit-project-swp391_se20a11_group-05/docs/AI_AUDIT_LOG.md) |
| 6 | Thiết kế kế hoạch nâng cấp bảo mật hệ thống (OTP & MFA) | Phạm Bá Trí | `docs/AI_AUDIT_LOG.md` | [AI_AUDIT_LOG.md](file:///d:/swp391-su26-ai-audit-project-swp391_se20a11_group-05/docs/AI_AUDIT_LOG.md) |


## AI có hỗ trợ không?

- [x] Có
- [ ] Không

Mô tả AI đã hỗ trợ phần nào:

```text
Antigravity hỗ trợ đề xuất tài liệu học thuật SpringerLink, viết báo cáo tổng hợp bằng tiếng Việt chuẩn quy cách nghiên cứu, cấu trúc file đặc tả yêu cầu SRS và sinh ảnh mockup UI chất lượng cao.
```

## Commit/Screenshot minh chứng

```text
Xem chi tiết ảnh giao diện tại docs/listening_city_dashboard.png.
```

---

# [Phase 03] Triển khai bảo mật nâng cao (Firebase Passwordless & MFA)

## Ngày thực hiện

```text
20/05/2026
```

## Đã hoàn thành

- [ ] Cập nhật `pom.xml` với các thư viện Firebase Admin và TOTP
- [ ] Thêm cấu hình MFA vào Entity `User.java`
- [ ] Xây dựng `FirebaseService` và `MfaService`
- [ ] Tích hợp API đăng nhập và xác thực đa lớp vào `AuthController`
- [x] Lập kế hoạch triển khai (Implementation Plan)

## Thay đổi chi tiết

| STT | Nội dung thay đổi | Người thực hiện | File/Module liên quan |
|---:|---|---|---|
| 1 | Cập nhật Audit Log cho quá trình Code MFA | Phạm Bá Trí | `Member/Phạm Bá Trí/AI_AUDIT_LOG.md` |
| 2 | Lên kế hoạch triển khai code backend | Phạm Bá Trí | `implementation_plan.md` |

## AI có hỗ trợ không?

- [x] Có
- [ ] Không

Mô tả AI đã hỗ trợ phần nào:

```text
AI lập Implementation Plan và hỗ trợ viết code tích hợp MFA và Firebase Auth cho Spring Boot.
```

---

## [Phase 04] - 2026-05-20 - Triển khai cấu hình Supabase Cloud DB

### Thêm mới (Added)
- Tạo profile Spring Boot riêng `application-supabase.properties` phục vụ deploy Supabase.
- Tích hợp kết nối Supabase PostgreSQL với tham số `?prepareThreshold=0` hỗ trợ Transaction Pooler.

### Thay đổi chi tiết

| STT | Nội dung thay đổi | Người thực hiện | File/Module liên quan |
|---:|---|---|---|
| 1 | Cấu hình Supabase Cloud | Phạm Bá Trí | `application-supabase.properties` |
| 2 | Cập nhật Audit Log cho quá trình cấu hình Cloud | Phạm Bá Trí | `Member/Phạm Bá Trí/AI_AUDIT_LOG.md` |

## AI có hỗ trợ không?

- [x] Có
- [ ] Không

Mô tả AI đã hỗ trợ phần nào:

```text
AI đánh giá so sánh Supabase với Neon.tech và hỗ trợ tạo file cấu hình profile cho Spring Boot kết nối với Supabase.
```

---

---

# [Phase 05] Đồng bộ hóa Frontend ↔ Backend REST API

## Ngày thực hiện

```text
21/05/2026
```

## Đã hoàn thành

- [x] Viết lại toàn bộ `api.ts` — đồng bộ 1-1 với tất cả Java Controllers (Auth, Feedback, Category, RAG, AI Orchestrator)
- [x] Bổ sung đầy đủ TypeScript types: `BackendRole`, `FeedbackStatus`, `CategoryResponse`, `RagQueryRequest`, `ChatbotResponse`, v.v.
- [x] Tách riêng `categoryApi`, `ragApi`, `aiApi` thay cho `chatbotApi` cũ bị sai tên
- [x] Sửa lỗi import sai trong `assistant.tsx` (`chatbotApi.ask` → `ragApi.chatbot`)
- [x] Fix toàn bộ lỗi `implicit any` trên các callback trong `assistant.tsx`
- [x] Tạo file `src/vite-env.d.ts` và cập nhật `tsconfig.json` để TypeScript resolve đúng module types
- [x] Cài đặt đủ dependencies bằng `npm install` (510 packages)
- [x] Bổ sung `findByEmail()` và `findByPhoneNumber()` vào `UserRepository.java`
- [x] Dọn dẹp warnings Backend: xóa import thừa, annotation không cần thiết, thay thế deprecated API

## Thay đổi chi tiết

| STT | Nội dung thay đổi | Người thực hiện | File/Module liên quan |
|---:|---|---|---|
| 1 | Viết lại toàn bộ API Client với đầy đủ types và endpoints | Phạm Bá Trí | `Sources/Frontend/src/lib/api.ts` |
| 2 | Sửa import và bổ sung type annotations trong trang Chatbot AI | Phạm Bá Trí | `Sources/Frontend/src/routes/assistant.tsx` |
| 3 | Tạo file khai báo Vite types, cập nhật cấu hình TypeScript | Phạm Bá Trí | `src/vite-env.d.ts`, `tsconfig.json` |
| 4 | Thêm query methods còn thiếu vào UserRepository | Phạm Bá Trí | `modules/user/repository/UserRepository.java` |
| 5 | Dọn sạch unused imports và deprecated API trong nhiều file Backend | Phạm Bá Trí | `GeminiAdapter.java`, `GroqAdapter.java`, `AiRouterService.java`, `RagExceptionHandler.java`, `JwtTokenProvider.java`, v.v. |

## AI có hỗ trợ không?

- [x] Có
- [ ] Không

Mô tả AI đã hỗ trợ phần nào:

```text
Antigravity phân tích toàn bộ Backend Controllers và Java DTOs, sau đó đồng bộ hóa Frontend TypeScript API Client để mapping chính xác từng endpoint, kiểu dữ liệu và enum. AI cũng phát hiện và sửa các lỗi compile, warning, deprecated API trong cả Frontend và Backend.
```

---

# [Phase 05 - Part 2] Hoàn thiện Tích hợp API Dashboards & Sửa lỗi TypeScript

## Ngày thực hiện

```text
21/05/2026
```

## Đã hoàn thành

- [x] **Nâng cấp Dashboard Cán bộ**: Kết nối API thực tế (`feedbackApi.getAll()`) cho các trang `ward.tsx`, `police.tsx` và `city-admin.tsx`. Bổ sung cơ chế fallback hiển thị dữ liệu demo khi Backend offline.
- [x] **Nâng cấp Trang Người Dân**: Kết nối API thực cho `my-reports.index.tsx` (danh sách phản ánh) và `my-reports.$id.tsx` (chi tiết phản ánh).
- [x] **Hoàn thiện luồng Gửi phản ánh**: Fetch danh mục (Category) động từ API thay vì hardcode trong `report.tsx`.
- [x] **Thêm tính năng Đăng ký**: Tạo mới file `register.tsx`, kết nối API `authApi.register()` và cấu hình Routing.
- [x] **Fix Type-check**: Khắc phục triệt để các lỗi TypeScript liên quan đến `navigate`, `Link`, biến trạng thái, và bộ sinh code `@tanstack/router-cli`.

## Thay đổi chi tiết

| STT | Nội dung thay đổi | Người thực hiện | File/Module liên quan |
|---:|---|---|---|
| 1 | Nâng cấp Dashboards (Ward, Police, City Admin) đọc API thay vì Mock data | Phạm Bá Trí | `ward.tsx`, `police.tsx`, `city-admin.tsx` |
| 2 | Nâng cấp Cổng Người Dân (Gửi đơn, Xem đơn) | Phạm Bá Trí | `report.tsx`, `my-reports.index.tsx`, `my-reports.$id.tsx` |
| 3 | Tạo luồng Register và kết nối API đăng ký | Phạm Bá Trí | `register.tsx`, `login.tsx` |
| 4 | Fix triệt để lỗi TypeScript TanStack Router | Phạm Bá Trí | `register.tsx`, `Header.tsx`, `RoleGuard.tsx` |

## AI có hỗ trợ không?

- [x] Có
- [ ] Không

Mô tả AI đã hỗ trợ phần nào:

```text
Antigravity hỗ trợ logic thay thế dữ liệu giả lập (mock data) bằng các lời gọi hàm fetch API thực tế. Triển khai cơ chế Fallback (Dự phòng) khi hệ thống backend offline. AI cũng hỗ trợ chạy trình biên dịch tsc và fix toàn bộ lỗi TypeScript Type-checking (các lỗi liên quan đến Tanstack Router `<Link>`, `navigate()`, payload request).
```

---

# 5. Cam kết cập nhật Changelog

Sinh viên/nhóm cam kết rằng nội dung changelog phản ánh đúng các thay đổi đã thực hiện trong quá trình làm bài tập/project.

| Đại diện sinh viên/nhóm | Ngày xác nhận |
|---|---|
| Phạm Bá Trí | 2026-05-21 |
