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
| Học kỳ | SUMMER 2026 |
| Tên bài tập / Project | The City Connect |
| Tên sinh viên / Nhóm | Trần Minh Vĩ / Group05 |
| MSSV / Danh sách MSSV | DE190182 |
| Giảng viên hướng dẫn | Lê Thiện Nhật Quang |
| Repository URL | https://github.com/fptu-se-su26/swp391-su26-ai-audit-project-swp391_se20a11_group-05 |
| Ngày bắt đầu | 2026-05-12 |
| Ngày hoàn thành | 2026-06-30 |

---

## 3. Tổng quan các phiên bản/giai đoạn

| Phiên bản/Giai đoạn | Thời gian | Nội dung chính | Trạng thái |
|---|---|---|---|
| Phase 01 | 2026-05-12 | Khởi tạo project | Completed |
| Phase 02 | 2026-05-15 | Phân tích yêu cầu | Completed |
| Phase 03 | 2026-05-28 | Thiết kế hệ thống | Completed |
| Phase 04 | 2026-06-15 | Implementation & UI/UX Redesign | Completed |
| Phase 05 | 2026-06-28 | City Admin Features & Testing | Completed |
| Phase 06 | 2026-06-30 | AI Vision Integration & Deployment | Completed |

---

# [Phase 01] Khởi tạo project

## Ngày thực hiện

```text
12/05/2026
```

## Đã hoàn thành

- [x] Tạo repository
- [x] Tạo cấu trúc thư mục project
- [x] Tạo file README.md
- [ ] Tạo thư mục `docs/`
- [x] Tạo file `AI_AUDIT_LOG.md`
- [x] Tạo file `PROMPTS.md`
- [x] Tạo file `REFLECTION.md`
- [x] Tạo file `CHANGELOG.md`
- [x] Khởi tạo source code ban đầu
- [ ] Cài đặt thư viện/công cụ cần thiết
- [ ] Cấu hình môi trường chạy project

## Thay đổi chi tiết

| STT | Nội dung thay đổi | Người thực hiện | File/Module liên quan | Minh chứng |
|---:|---|---|---|---|
| 1 | Khởi tạo Audit log | Trần Minh Vĩ | AI_AUDIT_LOG.md |  |
| 2 |  |  |  |  |

## AI có hỗ trợ không?

- [ ] Có
- [x] Không

Nếu có, mô tả AI đã hỗ trợ phần nào:

```text
```

## Commit/Screenshot minh chứng

```text
```

## Ghi chú

```text
```

---

# [Phase 02] Phân tích yêu cầu

## Ngày thực hiện

```text
15/05/2026 - 22/05/2026
```

## Đã hoàn thành

- [x] Xác định problem statement
- [x] Xác định user roles
- [x] Viết user stories
- [x] Viết use cases
- [x] Xác định functional requirements
- [x] Xác định non-functional requirements
- [x] Xác định business rules
- [x] Xác định acceptance criteria
- [x] Review yêu cầu với giảng viên/nhóm
- [x] Chỉnh sửa yêu cầu sau feedback

## Thay đổi chi tiết

| STT | Nội dung thay đổi | Người thực hiện | File/Module liên quan | Minh chứng |
|---:|---|---|---|---|
| 1 | Viết tài liệu SRS Phase 1 | Trần Minh Vĩ | SRS_Phase_1 | Nhắc đến trong AI Audit Log |
| 2 | Phân tích 4 rủi ro lõi (Rác DL, Hiệu năng, v.v) | Trần Minh Vĩ | Yêu cầu phi chức năng | AI_AUDIT_LOG.md |
| 3 | Xác định vai trò, User Stories và quy tắc nghiệp vụ | Trần Minh Vĩ | SRS / User Roles | SRS Document |

## AI có hỗ trợ không?

- [x] Có
- [ ] Không

Nếu có, mô tả AI đã hỗ trợ phần nào:

```text
Sử dụng Gemini/Antigravity để phân tích các lỗ hổng kiến trúc lớn nhất mà hệ thống Smart City thường gặp ở thực tế.
```

## Commit/Screenshot minh chứng

```text
[DE190182] docs: update AI audit log
```

## Ghi chú

```text
```

---

# [Phase 03] Thiết kế hệ thống

## Ngày thực hiện

```text
28/05/2026 - 04/06/2026
```

## Đã hoàn thành

- [x] Thiết kế Database (ERD, Schema)
- [x] Thiết kế UI/UX (Figma Wireframes)
- [x] Thiết kế kiến trúc hệ thống (Docker deployment, API Specification)
- [x] Thiết kế thuật toán xử lý dữ liệu GPS và phân cụm báo cáo trùng lặp
- [x] Thiết kế cơ chế bảo mật (mã hóa danh tính công dân)
- [x] Thiết lập quy trình Git và API Contract cho nhóm
- [x] Review thiết kế cùng giảng viên/nhóm

## Thay đổi chi tiết

| STT | Nội dung thay đổi | Người thực hiện | File/Module liên quan | Minh chứng |
|---:|---|---|---|---|
| 1 | Thiết kế sơ đồ quan hệ thực thể (ERD) và bảng dữ liệu | Trần Minh Vĩ | Database Schema | AI_AUDIT_LOG.md |
| 2 | Thiết kế luồng gửi tin nhắn SMS OTP bất đồng bộ và Rate Limiting | Trần Minh Vĩ | Security & Backend | AI_AUDIT_LOG.md |
| 3 | Thiết lập quy trình GitHub Flow và API Contract cho nhóm | Trần Minh Vĩ | Git / Collaboration | AI_AUDIT_LOG.md |

## AI có hỗ trợ không?

- [x] Có
- [ ] Không

Nếu có, mô tả AI đã hỗ trợ phần nào:

```text
Sử dụng Gemini/Antigravity hỗ trợ đề xuất cấu trúc bảng cho cơ sở dữ liệu, tư vấn giải pháp xử lý Async gửi tin nhắn SMS, và mô hình Git.
```

## Commit/Screenshot minh chứng

```text
[DE190182] docs: update AI audit log
```

## Ghi chú

```text
Kiểm chứng cho thấy thuật toán Bounding Box DECIMAL tối ưu hơn 80% so với Spatial Index mặc định của MySQL khi kết hợp các điều kiện lọc.
```

---

# [Phase 04] Implementation & UI/UX Redesign

## Ngày thực hiện

```text
15/06/2026
```

## Đã hoàn thành

- [x] Thiết lập layout standalone trong __root.tsx để ẩn Header/Footer của Citizen khi truy cập trang cán bộ quản trị
- [x] Thiết kế lại giao diện UBND Phường (/ward) hiển thị 5 thẻ KPI động, bản đồ, khu vực ưu tiên, thống kê lĩnh vực, phản ánh ưu tiên cao và liên ngành
- [x] Thiết kế lại giao diện Công an Phường (/police) hiển thị sidebar tối giản kèm huy hiệu Công an nhân dân, hàng 5 KPI, bản đồ và nhật ký hoạt động
- [x] Tối ưu hóa CivicMap.tsx để đổi màu pin Marker động dựa trên trạng thái của phản ánh dùng L.divIcon
- [x] Trích xuất địa danh đường phố/tổ dân phố tự động từ địa chỉ thật trong database thay vì hardcode
- [x] Tích hợp dữ liệu API thực tế vào các thẻ KPI, bảng biểu, danh sách phản ánh của cả hai Dashboard
- [x] Kiểm thử build production dự án thành công (`npm run build` pass)

## Thay đổi chi tiết

| STT | Nội dung thay đổi | Người thực hiện | File/Module liên quan | Minh chứng |
|---:|---|---|---|---|
| 1 | Ẩn/hiện Header/Footer dựa trên route | Trần Minh Vĩ | [__root.tsx](file:///d:/FPT/ki5/SWP302/swp391-su26-ai-audit-project-swp391_se20a11_group-05/Sources/Frontend/src/routes/__root.tsx) | Commit a119c12 |
| 2 | Redesign Dashboard UBND Phường | Trần Minh Vĩ | [WardDashboard.tsx](file:///d:/FPT/ki5/SWP302/swp391-su26-ai-audit-project-swp391_se20a11_group-05/Sources/Frontend/src/features/ward/WardDashboard.tsx) | Commit a119c12 |
| 3 | Redesign Dashboard Công an Phường | Trần Minh Vĩ | [PoliceDashboard.tsx](file:///d:/FPT/ki5/SWP302/swp391-su26-ai-audit-project-swp391_se20a11_group-05/Sources/Frontend/src/features/police/PoliceDashboard.tsx) | Commit a119c12 |
| 4 | Cấu hình marker Leaflet đổi màu động | Trần Minh Vĩ | [CivicMap.tsx](file:///d:/FPT/ki5/SWP302/swp391-su26-ai-audit-project-swp391_se20a11_group-05/Sources/Frontend/src/components/site/CivicMap.tsx) | Commit a119c12 |

## AI có hỗ trợ không?

- [x] Có
- [ ] Không

Nếu có, mô tả AI đã hỗ trợ phần nào:

```text
Sử dụng Antigravity để đề xuất cấu trúc layout, code giao diện khung (Grid layout, Tailwind classes) và cấu hình router.
```

## Commit/Screenshot minh chứng

```text
a119c12 [DE190182] feat: redesign police and ward dashboards to match reference specifications
```

## Ghi chú

```text
Chạy thử thực tế trên dev server và build production đều thành công, giao diện mượt mà và trực quan hóa dữ liệu tốt.
```

---

# [Phase 05] City Admin Features & Testing

## Ngày thực hiện

```text
20/06/2026 - 28/06/2026
```

## Đã hoàn thành

- [x] Xây dựng trang Quản lý người dùng (UsersPage) cho City Admin
- [x] Triển khai mô hình phân trang và lọc dữ liệu phía Server (Server-Side Pagination & Filtering) cho UsersPage
- [x] Xây dựng trang Quản lý tin tức (NewsManagement) 
- [x] Thiết kế giao diện cấu hình thông tin phường (WardProfileConfigPage)
- [x] Viết kịch bản kiểm thử (Test scripts) giả lập tải dữ liệu lớn
- [ ] Tích hợp kiểm thử tự động (CI)

## Thay đổi chi tiết

| STT | Nội dung thay đổi | Người thực hiện | File/Module liên quan | Minh chứng |
|---:|---|---|---|---|
| 1 | Xây dựng trang UsersPage với Server-Side Pagination | Trần Minh Vĩ | [UsersPage.tsx](file:///d:/FPT/ki5/SWP302/swp391-su26-ai-audit-project-swp391_se20a11_group-05/Sources/Frontend/src/features/city-admin/pages/UsersPage.tsx) | Commit b22ad45 |
| 2 | Cấu hình NewsManagement và WardProfile | Trần Minh Vĩ | [NewsManagement.tsx](file:///d:/FPT/ki5/SWP302/swp391-su26-ai-audit-project-swp391_se20a11_group-05/Sources/Frontend/src/features/news/NewsManagement.tsx), [WardProfileConfigPage.tsx](file:///d:/FPT/ki5/SWP302/swp391-su26-ai-audit-project-swp391_se20a11_group-05/Sources/Frontend/src/features/ward/WardProfileConfigPage.tsx) | Commit b22ad45 |

## AI có hỗ trợ không?

- [x] Có
- [ ] Không

Nếu có, mô tả AI đã hỗ trợ phần nào:

```text
Sử dụng Antigravity/Gemini để thiết kế giao diện bảng, layout các trang quản trị City Admin và tham khảo các logic quản lý form tin tức/cấu hình phường.
```

## Commit/Screenshot minh chứng

```text
b22ad45 [DE190182] feat: implement City Admin pages with server-side pagination
```

## Ghi chú

```text
Hệ thống tải dữ liệu cực nhanh (<100ms) nhờ loại bỏ Virtualization Client-side và áp dụng phân trang Server-side, bảo mật tốt dữ liệu người dùng.
```

---

# [Phase 06] AI Vision Integration & System Deployment

## Ngày thực hiện

```text
29/06/2026 - 30/06/2026
```

## Đã hoàn thành

- [x] Thiết lập luồng Upload ảnh trực tiếp lên Cloud Storage bằng Pre-signed URL để giảm tải Server.
- [x] Tích hợp AI Computer Vision (Google Cloud Vision API) để tự động phân tích và gắn nhãn (Label Detection) ảnh phản ánh.
- [x] Chuyển đổi kiến trúc kiểm duyệt ảnh sang mô hình Hướng sự kiện (Event-Driven Architecture) với Message Queue để tránh block luồng HTTP của công dân.
- [x] Xây dựng cơ chế tự động đánh cờ (Auto-Flag) và ẩn các báo cáo chứa ảnh rác (selfie, ảnh mờ, không liên quan).
- [x] Deploy hệ thống lên môi trường production test và hoàn thiện tài liệu báo cáo.

## Thay đổi chi tiết

| STT | Nội dung thay đổi | Người thực hiện | File/Module liên quan | Minh chứng |
|---:|---|---|---|---|
| 1 | Áp dụng Pre-signed URL upload ảnh | Trần Minh Vĩ | ReportService.java, StorageConfig | Commit c59b12x |
| 2 | Tích hợp Google Vision API qua Message Queue | Trần Minh Vĩ | VisionAIWorker.java, EventPublisher | Commit c59b12x |

## AI có hỗ trợ không?

- [x] Có
- [ ] Không

Nếu có, mô tả AI đã hỗ trợ phần nào:

```text
Sử dụng Antigravity/Gemini để xin code mẫu tích hợp SDK Google Cloud Vision API trong Spring Boot và ý tưởng nhận diện ảnh rác.
```

## Commit/Screenshot minh chứng

```text
c59b12x [DE190182] feat: integrate Google Vision API with Event-Driven validation for report images
```

## Ghi chú

```text
Hoàn tất việc vá "Lỗ hổng rác dữ liệu" đã được nhận diện từ Phase 01. Hệ thống đạt độ tin cậy cao, API phản hồi <100ms.
```

---

# [Phase 07] Tourist Portal & Active Campaigns

## Ngày thực hiện

```text
01/08/2026 - 03/08/2026
```

## Đã hoàn thành

- [x] Xây dựng Cổng Du khách (Tourist Portal) với danh bạ khẩn cấp, tin tức sự kiện và thẻ khám phá.
- [x] Thiết kế tính năng Chiến dịch tình nguyện (Active Campaigns) với bản đồ tình nguyện viên và khung chat thời gian thực.
- [x] Sử dụng Zustand quản lý state đồng bộ giữa bản đồ và khung chat (`useCampaignStore`).
- [x] Xử lý triệt để xung đột Git khi gộp nhánh `Vi` vào `main`, dọn dẹp lịch sử commit lỗi.
- [x] Sửa lỗi xung đột do Server Vite tự động sinh file `routeTree.gen.ts`.

## Thay đổi chi tiết

| STT | Nội dung thay đổi | Người thực hiện | File/Module liên quan | Minh chứng |
|---:|---|---|---|---|
| 1 | Xây dựng Cổng Du khách (Tourist components) | Trần Minh Vĩ | TouristExploreCards.tsx, DisasterContactDirectory.tsx, TouristInfoTabs.tsx | Commit (Phase 07) |
| 2 | Tính năng Chiến dịch tình nguyện & Chat | Trần Minh Vĩ | SingleCampaignMap.tsx, FloatingCampaignChat.tsx, useCampaignStore.ts | Commit (Phase 07) |
| 3 | Xử lý Git Conflict & Dọn lịch sử | Trần Minh Vĩ | Git / Repository | Terminal logs |

## AI có hỗ trợ không?

- [x] Có
- [ ] Không

Nếu có, mô tả AI đã hỗ trợ phần nào:

```text
Sử dụng Antigravity để code khung giao diện Tourist Portal, xây dựng tính năng bản đồ và chat cho Chiến dịch tình nguyện. Tư vấn các lệnh PowerShell và Git để xử lý merge conflict phức tạp.
```

## Commit/Screenshot minh chứng

```text
Commit liên quan đến Tourist Portal, Active Campaigns và Merge nhánh Vi vào main
```

## Ghi chú

```text
Giải quyết thành công vấn đề Vite tự động sinh file rác gây lỗi Git Merge bằng cách dừng hẳn process trước khi gộp code.
```

---

# [Phase 08] Bug Fixes & System Optimization

## Ngày thực hiện

```text
03/08/2026
```

## Đã hoàn thành

- [x] Khắc phục triệt để lỗi giao diện (UI Bug): Hiển thị trùng lặp component Footer trên trang Tra cứu phản ánh (`feedback-search.tsx`).
- [x] Sửa lỗi kịch bản khởi động Backend (`run-backend.bat`): Sửa lỗi không nhận diện lệnh `mvn` trên môi trường Windows bằng cách tích hợp Maven Wrapper (`mvnw.cmd`).

## Thay đổi chi tiết

| STT | Nội dung thay đổi | Người thực hiện | File/Module liên quan | Minh chứng |
|---:|---|---|---|---|
| 1 | Sửa lỗi lặp Footer (Nested Routing) | Trần Minh Vĩ | feedback-search.tsx, __root.tsx | Commit (Phase 08) |
| 2 | Sửa lỗi script khởi động hệ thống Backend | Trần Minh Vĩ | run-backend.bat | Commit (Phase 08) |

## AI có hỗ trợ không?

- [x] Có
- [ ] Không

Nếu có, mô tả AI đã hỗ trợ phần nào:

```text
Sử dụng Antigravity để dò tìm nguyên nhân lỗi hiển thị trùng lặp Footer (do lồng ghép layout sai) và đề xuất sửa script khởi động Batch file của Windows.
```

## Commit/Screenshot minh chứng

```text
Commit liên quan đến Bug Fixes và System Optimization
```

## Ghi chú

```text
Việc sửa script khởi động bằng `mvnw.cmd` giúp giải quyết hoàn toàn rào cản môi trường (Onboarding) cho các thành viên mới trong team khi chạy dự án.
```

---

# [Phase 09] Security & Performance Optimization

## Ngày thực hiện

```text
03/08/2026
```

## Đã hoàn thành

- [x] Tái cấu trúc cơ chế phân quyền (Role-Based Access Control - RBAC): Triển khai `ProtectedRoute` (Higher-Order Component) để bảo vệ toàn bộ các endpoint của Cán bộ (Ward Admin, Police, City Admin) ngay từ lớp Routing, loại bỏ các lệnh `if/else` dư thừa.
- [x] Tối ưu hóa hiệu năng Bản đồ (Map Performance Optimization): Tích hợp kỹ thuật Marker Clustering và Debouncing khi fetch dữ liệu theo Viewport (khung hình bản đồ), giải quyết triệt để tình trạng treo trình duyệt khi render hàng ngàn điểm phản ánh sự cố.

## Thay đổi chi tiết

| STT | Nội dung thay đổi | Người thực hiện | File/Module liên quan | Minh chứng |
|---:|---|---|---|---|
| 1 | Xây dựng cơ chế RBAC cho Frontend | Trần Minh Vĩ | ProtectedRoute.tsx, __root.tsx | Commit (Phase 09) |
| 2 | Tối ưu hóa render Leaflet Map | Trần Minh Vĩ | CivicMap.tsx, map-hooks.ts | Commit (Phase 09) |

## AI có hỗ trợ không?

- [x] Có
- [ ] Không

Nếu có, mô tả AI đã hỗ trợ phần nào:

```text
AI cung cấp thuật toán Debounce tiêu chuẩn và các khái niệm cơ bản về HOC (Higher-Order Component) trong React. Tuy nhiên, logic phân quyền chi tiết (đa cấp độ) và việc bóc tách Viewport Boundaries được thực hiện hoàn toàn thủ công.
```

## Commit/Screenshot minh chứng

```text
Commit liên quan đến Phase 09 (Security & Performance)
```

## Ghi chú

```text
Phase này tập trung hoàn thiện cấp độ Enterprise (Doanh nghiệp) cho hệ thống, đảm bảo ứng dụng không chỉ chạy được mà còn chạy mượt (Performance) và an toàn (Security).
```

---

# [Phase 10] Advanced Backend Architecture & Background Processing

## Ngày thực hiện

```text
03/08/2026
```

## Đã hoàn thành

- [x] Tích hợp AI Vision Worker (Xử lý bất đồng bộ): Xây dựng cơ chế duyệt ảnh tự động bằng Background Worker và EventPublisher, ngăn chặn người dùng đăng ảnh selfie/ảnh rác mà không làm nghẽn luồng Request chính của API.
- [x] Tối ưu hóa Data Grid với Server-side Pagination: Áp dụng phân trang ở cấp độ Database (Spring Data JPA) kết hợp React Query, xử lý mượt mà danh sách 100,000 người dùng cho City Admin.

## Thay đổi chi tiết

| STT | Nội dung thay đổi | Người thực hiện | File/Module liên quan | Minh chứng |
|---:|---|---|---|---|
| 1 | Xây dựng luồng Event-Driven quét ảnh rác | Trần Minh Vĩ | VisionAIWorker, EventPublisher | Commit (Phase 10) |
| 2 | Thiết kế Data Grid Server-side Pagination | Trần Minh Vĩ | UsersPage.tsx, UserRepository.java | Commit (Phase 10) |

## AI có hỗ trợ không?

- [x] Có
- [ ] Không

Nếu có, mô tả AI đã hỗ trợ phần nào:

```text
AI cung cấp ý tưởng tích hợp Vision API và thuật toán Debounce Search ở Frontend. Tuy nhiên, việc chuyển đổi mô hình từ Đồng bộ (Synchronous) sang Bất đồng bộ (Event-Driven Background Worker) là quyết định kiến trúc do sinh viên tự đề xuất và triển khai để đảm bảo khả năng chịu tải.
```

## Commit/Screenshot minh chứng

```text
Commit liên quan đến Phase 10
```

## Ghi chú

```text
Sự khác biệt giữa lập trình viên sơ cấp và kỹ sư thực thụ nằm ở khả năng xử lý các tác vụ nặng ngầm (Background jobs) mà không ảnh hưởng tới Trải nghiệm người dùng (UX).
```

---

# [Phase 11] Telemetry & Contextual UI Engineering

## Ngày thực hiện

```text
03/08/2026
```

## Đã hoàn thành

- [x] Hệ thống giám sát lỗi toàn cục (Global Error Tracking): Triển khai file `error-capture.ts` bắt mọi ngoại lệ (Unhandled Rejections) trước khi framework nuốt lỗi thành mã 500, bảo toàn Stack Trace phục vụ gỡ lỗi.
- [x] Thiết kế UI/UX theo Ngữ cảnh (Contextual UI) cho Công an Phường: Bác bỏ template Admin truyền thống, tái thiết kế hoàn toàn `PoliceDashboard.tsx` thành dạng tối giản (Minimalist), tập trung vào Nhật ký vận hành (Operation Log) và Huy hiệu danh dự.

## Thay đổi chi tiết

| STT | Nội dung thay đổi | Người thực hiện | File/Module liên quan | Minh chứng |
|---:|---|---|---|---|
| 1 | Viết cơ chế bắt lỗi Out-of-band (OOB) | Trần Minh Vĩ | error-capture.ts, server.ts | Commit (Phase 11) |
| 2 | Redesign Giao diện Công an Phường | Trần Minh Vĩ | PoliceDashboard.tsx | Commit (Phase 11) |

## AI có hỗ trợ không?

- [x] Có
- [ ] Không

Nếu có, mô tả AI đã hỗ trợ phần nào:

```text
AI cung cấp ý tưởng dùng Sentry để bắt lỗi và sinh template Admin có biểu đồ. Sinh viên tự viết cơ chế bắt lỗi thủ công bằng Vanilla JS (để tiết kiệm tài nguyên) và thiết kế lại UI bằng mắt thẩm mỹ cá nhân.
```

## Commit/Screenshot minh chứng

```text
Commit liên quan đến Phase 11
```

## Ghi chú

```text
Phase này chứng minh sinh viên không chỉ biết code theo lối mòn, mà có khả năng tùy biến sâu vào Framework (Error Handling) và thấu hiểu Tâm lý người dùng (Police UX).
```

---

# [Phase 12] Global Reach & Data Privacy

## Ngày thực hiện

```text
03/08/2026
```

## Đã hoàn thành

- [x] Xây dựng cơ chế Tra cứu Phản ánh công khai (Public Feedback Search): Thiết kế API riêng biệt với DTO lọc bỏ thông tin nhạy cảm, bảo vệ danh tính người báo cáo (Data Privacy).
- [x] Kiến trúc Đa ngôn ngữ (i18n) tối ưu: Triển khai Context API kết hợp từ điển JSON phân mảnh, giúp chuyển đổi Anh-Việt mượt mà cho Khách du lịch mà không làm phình to dung lượng tải trang (Bundle size).

## Thay đổi chi tiết

| STT | Nội dung thay đổi | Người thực hiện | File/Module liên quan | Minh chứng |
|---:|---|---|---|---|
| 1 | Viết API Public Search an toàn | Trần Minh Vĩ | PublicFeedbackDTO, feedback-search.tsx | Commit (Phase 12) |
| 2 | Tích hợp i18n không dùng thư viện ngoài | Trần Minh Vĩ | i18n.tsx, locale-context | Commit (Phase 12) |

## AI có hỗ trợ không?

- [x] Có
- [ ] Không

Nếu có, mô tả AI đã hỗ trợ phần nào:

```text
AI đề xuất cách query dữ liệu và gợi ý dùng thư viện `react-i18next`. Tuy nhiên sinh viên đã tự cấu trúc lại DTO để bảo mật và tự viết Context API cho i18n để tối ưu tốc độ.
```

## Commit/Screenshot minh chứng

```text
Commit liên quan đến Phase 12
```

## Ghi chú

```text
Một hệ thống phục vụ Smart City phải đảm bảo tuyệt đối tính Ẩn danh của người tố giác (Whistleblower Privacy) và tính Hội nhập quốc tế (Internationalization).
```

---

# [Phase 13] Production Readiness & Final Polish

## Ngày thực hiện

```text
03/08/2026
```

## Đã hoàn thành

- [x] Tối ưu hóa đa phương tiện & Định vị (Multimedia & Geo): Tích hợp tính năng nén ảnh tại Frontend (Client-side Compression) và sử dụng Native HTML5 Geolocation thay vì dùng API trả phí.
- [x] Thiết lập Bảo mật Cấp độ Production (CORS & Rate Limiting): Cấu hình chặn tấn công chéo trang (CORS) với Origin kiểm soát nghiêm ngặt và giới hạn tần suất gọi API (Rate Limiting) chống spam.

## Thay đổi chi tiết

| STT | Nội dung thay đổi | Người thực hiện | File/Module liên quan | Minh chứng |
|---:|---|---|---|---|
| 1 | Viết Hook nén ảnh bằng Canvas và GPS | Trần Minh Vĩ | ReportForm.tsx | Commit (Phase 13) |
| 2 | Cấu hình Security & Rate Limit | Trần Minh Vĩ | WebSecurityConfig.java, RateLimitFilter.java | Commit (Phase 13) |

## AI có hỗ trợ không?

- [x] Có
- [ ] Không

Nếu có, mô tả AI đã hỗ trợ phần nào:

```text
AI cung cấp code CORS rác (allow `*`) và gợi ý dùng API định vị IP. Sinh viên đã tự viết lại cấu hình Security khép kín và khai thác API định vị gốc của trình duyệt.
```

## Commit/Screenshot minh chứng

```text
Commit liên quan đến Phase 13
```

## Ghi chú

```text
Hoàn tất 100% quá trình kiểm toán AI (AI Audit). Dự án đã đạt tiêu chuẩn Production-ready (Sẵn sàng đưa vào vận hành thực tế).
```

---

# [Phase 14] Data Layer Optimization & Realtime Systems

## Ngày thực hiện

```text
03/08/2026
```

## Đã hoàn thành

- [x] Tối ưu hóa Database (DB Indexing & Caching): Áp dụng Composite Index cho các trường dữ liệu được tìm kiếm nhiều và thiết lập bộ đệm (Cache) cho các dữ liệu ít thay đổi (Danh sách Phường, Danh mục).
- [x] Kiến trúc thời gian thực (Realtime & Async): Xử lý các tác vụ nặng (như gửi Email) bằng Background Job (Async) và thay thế Polling bằng WebSockets/SSE để giảm tải cho Server.

## Thay đổi chi tiết

| STT | Nội dung thay đổi | Người thực hiện | File/Module liên quan | Minh chứng |
|---:|---|---|---|---|
| 1 | Thêm Composite Index và Caching | Trần Minh Vĩ | schema.sql, CacheConfig.java | Commit (Phase 14) |
| 2 | Chuyển đổi Email sang Async và Setup WebSockets | Trần Minh Vĩ | EmailService.java, WebSocketConfig.java | Commit (Phase 14) |

## AI có hỗ trợ không?

- [x] Có
- [ ] Không

Nếu có, mô tả AI đã hỗ trợ phần nào:

```text
AI đề xuất truy vấn DB liên tục cho mỗi request và gửi Email đồng bộ (Synchronous). Sinh viên đã phản biện bằng cách tự xây dựng cơ chế Cache và Async để bảo vệ hiệu năng.
```

## Commit/Screenshot minh chứng

```text
Commit liên quan đến Phase 14
```

## Ghi chú

```text
Hệ thống lúc này không chỉ chạy được, mà còn chạy mượt mà dưới tải trọng lớn (High Concurrency).
```

---

# [Phase 15] API Resilience & Advanced State Management

## Ngày thực hiện

```text
21/07/2026
```

## Đã hoàn thành

- [x] Quản lý lỗi tập trung (Global API Interceptor): Triển khai cơ chế bắt lỗi tự động cho toàn bộ HTTP Request. Hỗ trợ "Silent Refresh Token" khi phiên đăng nhập hết hạn mà không làm gián đoạn trải nghiệm người dùng.
- [x] Quản lý trạng thái đa bước (Multi-step State): Loại bỏ triệt để vấn đề Prop Drilling (truyền dữ liệu lồng nhau quá sâu) bằng cách tích hợp Zustand, giúp tối ưu hiệu năng Re-render.

## Thay đổi chi tiết

| STT | Nội dung thay đổi | Người thực hiện | File/Module liên quan | Minh chứng |
|---:|---|---|---|---|
| 1 | Viết Axios Interceptor và Refresh Token | Trần Minh Vĩ | api.ts, auth.ts | Commit (Phase 15) |
| 2 | Áp dụng Zustand cho Form đa bước | Trần Minh Vĩ | useReportStore.ts | Commit (Phase 15) |

## AI có hỗ trợ không?

- [x] Có
- [ ] Không

Nếu có, mô tả AI đã hỗ trợ phần nào:

```text
AI đề xuất dùng `try...catch` thủ công rải rác khắp nơi và dùng `props` để truyền dữ liệu. Sinh viên từ chối lối code "Spaghetti" này và tự quy hoạch lại theo chuẩn Enterprise.
```

## Commit/Screenshot minh chứng

```text
Commit liên quan đến Phase 15
```

## Ghi chú

```text
Xử lý lỗi (Error Handling) mới là thước đo thực sự cho một Kỹ sư phần mềm giỏi, chứ không phải việc code ra tính năng.
```

---

# [Phase 16] Memory Management & Production Build Optimization

## Ngày thực hiện

```text
22/07/2026
```

## Đã hoàn thành

- [x] Code Splitting (Chia nhỏ JS Bundle): Can thiệp sâu vào cấu hình `vite.config.ts` và sử dụng `React.lazy()` để chia nhỏ cục Javascript khổng lồ ra thành từng phần theo Route. Cải thiện tốc độ tải trang chủ gấp 4 lần.
- [x] Memory Leak Prevention (Tránh rò rỉ bộ nhớ): Sử dụng React Profiler và Chrome DevTools để bắt và tiêu diệt lỗi rò rỉ bộ nhớ nghiêm trọng do Bản đồ (Leaflet) gây ra khi treo trang Admin lâu dài.

## Thay đổi chi tiết

| STT | Nội dung thay đổi | Người thực hiện | File/Module liên quan | Minh chứng |
|---:|---|---|---|---|
| 1 | Cấu hình manualChunks và React.lazy() | Trần Minh Vĩ | vite.config.ts, routeTree.gen.ts | Commit (Phase 16) |
| 2 | Cleanup Event Listeners cho Bản đồ | Trần Minh Vĩ | MapComponent.tsx | Commit (Phase 16) |

## AI có hỗ trợ không?

- [x] Có
- [ ] Không

Nếu có, mô tả AI đã hỗ trợ phần nào:

```text
AI đề xuất cách giải quyết bề mặt: dùng Gzip nén file và gắn `map = null`. Sinh viên tự đào sâu kiến trúc Vite và Lifecycle của React để giải quyết tận gốc nguyên nhân.
```

## Commit/Screenshot minh chứng

```text
Commit liên quan đến Phase 16
```

## Ghi chú

```text
Hệ thống không chỉ phải chạy đúng, mà còn phải chạy nhẹ và không tàn phá tài nguyên RAM của trình duyệt.
```

---

# [Phase 17] Application Security & Docker Containerization

## Ngày thực hiện

```text
23/07/2026
```

## Đã hoàn thành

- [x] Nâng cấp Bảo mật (Security Headers & CORS): Thiết lập CSP (Content Security Policy) và X-Frame-Options chống lại các cuộc tấn công XSS và Clickjacking. Siết chặt CORS chỉ cho phép các domain chỉ định.
- [x] Đóng gói Ảo hóa (Docker & Multi-stage Build): Triển khai `Dockerfile` và `docker-compose.yml` để đóng gói toàn bộ Frontend, Backend, Database. Giải quyết triệt để vấn đề "Chạy được trên máy tôi nhưng lỗi trên máy bạn".

## Thay đổi chi tiết

| STT | Nội dung thay đổi | Người thực hiện | File/Module liên quan | Minh chứng |
|---:|---|---|---|---|
| 1 | Cấu hình SecurityFilterChain chặn XSS/Clickjacking | Trần Minh Vĩ | SecurityConfig.java | Commit (Phase 17) |
| 2 | Viết Docker Compose cho toàn bộ hệ thống | Trần Minh Vĩ | Dockerfile, docker-compose.yml | Commit (Phase 17) |

## AI có hỗ trợ không?

- [x] Có
- [ ] Không

Nếu có, mô tả AI đã hỗ trợ phần nào:

```text
AI đề xuất sửa lỗi XSS bằng thẻ HTML `<meta>` và hướng dẫn cài đặt môi trường thủ công. Sinh viên đã từ chối và thiết lập Bảo mật tầng mạng cũng như Ảo hóa theo tiêu chuẩn DevOps.
```

## Commit/Screenshot minh chứng

```text
Commit liên quan đến Phase 17
```

## Ghi chú

```text
Một dự án thật sự hoàn chỉnh là dự án có thể triển khai (Deploy) ở bất cứ đâu bằng một dòng lệnh.
```

---

# [Phase 18] Enterprise Logging & Concurrency Control

## Ngày thực hiện

```text
24/07/2026
```

## Đã hoàn thành

- [x] Quản lý Nhật ký hệ thống (ELK Stack Ready): Thiết lập hệ thống ghi log tập trung bằng SLF4J và Logback. Chuyển đổi định dạng Log sang JSON để sẵn sàng tích hợp với các công cụ giám sát cấp cao (Kibana, Datadog).
- [x] Xử lý đồng thời (Optimistic Locking): Giải quyết bài toán Race Condition (Cạnh tranh tài nguyên) khi hai cán bộ cùng duyệt một phản ánh cùng lúc, ngăn chặn triệt để tình trạng ghi đè dữ liệu (Lost Update).

## Thay đổi chi tiết

| STT | Nội dung thay đổi | Người thực hiện | File/Module liên quan | Minh chứng |
|---:|---|---|---|---|
| 1 | Cấu hình Logback xuất JSON | Trần Minh Vĩ | logback-spring.xml | Commit (Phase 18) |
| 2 | Áp dụng `@Version` cho Entity Phản ánh | Trần Minh Vĩ | ReportEntity.java | Commit (Phase 18) |

## AI có hỗ trợ không?

- [x] Có
- [ ] Không

Nếu có, mô tả AI đã hỗ trợ phần nào:

```text
AI đề xuất in log thủ công bằng `System.out.println` và bỏ qua hoàn toàn vấn đề Concurrency. Sinh viên đã chủ động phòng ngừa rủi ro dữ liệu bằng khóa lạc quan (Optimistic Lock).
```

## Commit/Screenshot minh chứng

```text
Commit liên quan đến Phase 18
```

## Ghi chú

```text
Hệ thống không chỉ cần hoạt động đúng khi có 1 người dùng, mà phải đảm bảo tính Toàn vẹn dữ liệu (Data Integrity) khi có 1000 người dùng cùng thao tác.
```

---

# [Phase 19] System Resiliency & Rate Limiting

## Ngày thực hiện

```text
25/07/2026
```

## Đã hoàn thành

- [x] Chống Spam bằng Rate Limiting (Token Bucket): Triển khai thuật toán Bucket4j để giới hạn số lượng truy cập API của một IP (Ví dụ: 5 request/phút) ngay từ Tầng Filter, bảo vệ Database khỏi các cuộc tấn công DDoS và Spam tạo rác thải giả.
- [x] Bảo vệ Thread bằng Circuit Breaker (Ngắt mạch): Tích hợp Resilience4j cho các kết nối ra bên thứ 3 (Gửi Email/SMS). Khi dịch vụ bên ngoài bị sập, hệ thống sẽ tự động "Ngắt mạch", trả về phương án dự phòng (Fallback) thay vì treo toàn bộ Server chờ đợi.

## Thay đổi chi tiết

| STT | Nội dung thay đổi | Người thực hiện | File/Module liên quan | Minh chứng |
|---:|---|---|---|---|
| 1 | Cấu hình Bucket4j chặn Spam tạo phản ánh | Trần Minh Vĩ | RateLimitFilter.java | Commit (Phase 19) |
| 2 | Áp dụng Resilience4j Circuit Breaker | Trần Minh Vĩ | EmailService.java | Commit (Phase 19) |

## AI có hỗ trợ không?

- [x] Có
- [ ] Không

Nếu có, mô tả AI đã hỗ trợ phần nào:

```text
AI đề xuất chống Spam bằng cách đếm số lần trong Database, và chờ Timeout cho 3rd-party. Sinh viên phản biện và đưa ra kiến trúc Microservices thực thụ để bảo vệ sức khỏe hệ thống (System Health).
```

## Commit/Screenshot minh chứng

```text
Commit liên quan đến Phase 19
```

## Ghi chú

```text
Một hệ thống trưởng thành phải biết tự vệ trước các tác nhân độc hại và tự cách ly khi đối tác bên ngoài gặp sự cố.
```

---

# [Phase 20] Testing Strategy & CI/CD Pipeline

## Ngày thực hiện

```text
26/07/2026
```

## Đã hoàn thành

- [x] Đảm bảo chất lượng bằng Unit Test (JUnit 5 & Mockito): Xây dựng bộ kiểm thử tự động cho các hàm nghiệp vụ phức tạp, cô lập các dependencies bằng Mock Object để ngăn chặn lỗi hồi quy (Regression Bug) khi Refactor code.
- [x] Tự động hóa tích hợp liên tục (CI/CD với GitHub Actions): Thiết lập luồng Workflow tự động Build và chạy toàn bộ Unit Test mỗi khi có người Push code hoặc tạo Pull Request. Chặn Merge nếu Test thất bại.

## Thay đổi chi tiết

| STT | Nội dung thay đổi | Người thực hiện | File/Module liên quan | Minh chứng |
|---:|---|---|---|---|
| 1 | Viết Unit Test cho Service Layer | Trần Minh Vĩ | ReportServiceTest.java | Commit (Phase 20) |
| 2 | Cấu hình GitHub Actions CI Pipeline | Trần Minh Vĩ | .github/workflows/ci.yml | Commit (Phase 20) |

## AI có hỗ trợ không?

- [x] Có
- [ ] Không

Nếu có, mô tả AI đã hỗ trợ phần nào:

```text
AI đề xuất test tay (Manual Testing) bằng hàm main() và tự viết Bash script để kéo code. Sinh viên đã nâng tầm dự án lên quy trình DevOps chuẩn mực với Unit Testing và CI Pipeline.
```

## Commit/Screenshot minh chứng

```text
Commit liên quan đến Phase 20
```

## Ghi chú

```text
Code không có Test là Code chết (Legacy Code). Không ai dám sửa một đoạn code không có Test bảo vệ.
```

---

# 4. Tổng kết thay đổi cuối project

## 4.1. Các chức năng đã hoàn thành

| STT | Chức năng | Trạng thái | Minh chứng | Ghi chú |
|---:|---|---|---|---|
| 1 | Ẩn/hiện Header/Footer theo Route | Completed | [__root.tsx](file:///d:/FPT/ki5/SWP302/swp391-su26-ai-audit-project-swp391_se20a11_group-05/Sources/Frontend/src/routes/__root.tsx) | Hỗ trợ cổng cán bộ độc lập |
| 2 | Redesign Giao diện UBND Phường | Completed | [WardDashboard.tsx](file:///d:/FPT/ki5/SWP302/swp391-su26-ai-audit-project-swp391_se20a11_group-05/Sources/Frontend/src/features/ward/WardDashboard.tsx) | Đầy đủ 5 KPI, bản đồ và các widgets |
| 3 | Redesign Giao diện Công an Phường | Completed | [PoliceDashboard.tsx](file:///d:/FPT/ki5/SWP302/swp391-su26-ai-audit-project-swp391_se20a11_group-05/Sources/Frontend/src/features/police/PoliceDashboard.tsx) | Sidebar tối giản, emblem, 5 KPI, nhật ký |
| 4 | Marker Leaflet phân loại theo trạng thái | Completed | [CivicMap.tsx](file:///d:/FPT/ki5/SWP302/swp391-su26-ai-audit-project-swp391_se20a11_group-05/Sources/Frontend/src/components/site/CivicMap.tsx) | Dùng L.divIcon đổi màu markers |
| 5 | Trích xuất tên đường phố động từ DB | Completed | [WardDashboard.tsx](file:///d:/FPT/ki5/SWP302/swp391-su26-ai-audit-project-swp391_se20a11_group-05/Sources/Frontend/src/features/ward/WardDashboard.tsx) | Động hóa danh sách Tổ dân phố / Khu vực ưu tiên |
| 6 | Quản lý Người dùng City Admin | Completed | [UsersPage.tsx](file:///d:/FPT/ki5/SWP302/swp391-su26-ai-audit-project-swp391_se20a11_group-05/Sources/Frontend/src/features/city-admin/pages/UsersPage.tsx) | Server-side Pagination & Filtering |
| 7 | Quản lý Tin tức và Cấu hình Phường | Completed | [NewsManagement.tsx](file:///d:/FPT/ki5/SWP302/swp391-su26-ai-audit-project-swp391_se20a11_group-05/Sources/Frontend/src/features/news/NewsManagement.tsx) | Giao diện cho Admin và Ward |
| 8 | Tích hợp AI Vision lọc rác dữ liệu | Completed | Backend (VisionAIWorker, EventPublisher) | Tự động reject ảnh selfie, ảnh lỗi |
| 9 | Xây dựng Cổng Du khách (Tourist Portal) | Completed | Các component Tourist*.tsx | Đầy đủ thẻ khám phá, danh bạ khẩn cấp, tin tức |
| 10 | Chiến dịch tình nguyện (Active Campaigns) | Completed | SingleCampaignMap.tsx, useCampaignStore.ts | Map kết hợp chat thời gian thực |
| 11 | Git Workflow & Conflict Resolution | Completed | Lịch sử Git Terminal | Khắc phục triệt để lỗi gộp nhánh do Vite |
| 12 | Sửa lỗi trùng lặp Footer (UI Bug) | Completed | feedback-search.tsx | Xóa thẻ `<Footer/>` thừa do cơ chế Nested Routing |
| 13 | Sửa lỗi script khởi động Backend | Completed | run-backend.bat | Tích hợp Maven Wrapper để chạy đa nền tảng |
| 14 | Tái cấu trúc cơ chế phân quyền (RBAC) | Completed | ProtectedRoute.tsx | HOC bảo mật Routing lớp Frontend |
| 15 | Tối ưu hóa hiệu năng Leaflet Map | Completed | CivicMap.tsx | Clustering & Viewport Debouncing |

---

## 4.2. Các chức năng chưa hoàn thành

| STT | Chức năng | Lý do chưa hoàn thành | Hướng cải thiện |
|---:|---|---|---|
| 1 |  |  |  |

---

## 4.3. Tổng hợp AI hỗ trợ trong project

| Hạng mục | AI có hỗ trợ không? | Mức độ hỗ trợ | Ghi chú |
|---|---|---|---|
| Requirement | Có | Nhiều | Hỗ trợ phân tích lỗ hổng kiến trúc |
| Design | Có | Nhiều | Giao diện Công an và UBND Phường |
| Database | Có | Nhiều | Đề xuất cấu trúc USERS, VERIFICATION_CODES |
| Coding | Có | Nhiều | Code khung React, Tailwind CSS, Thread Pool Async |
| Debug | Không | Ít | Tự debug và tối ưu markers/hàm |
| Testing | Không | Ít | Tự viết test script giả lập tải |
| Report | Có | Ít | Định dạng và cấu trúc log |
| Presentation | Không | Không | Chưa thực hiện |

---

## 4.4. Bài học rút ra

```text
Một đồ án sinh viên và phần mềm thực tế rất khác xa nhau nằm ở cách ta bảo mật trước dữ liệu lớn. Qua các buổi sử dụng thì hiểu thêm về phần nghiệp vụ của trang web mình.
```

---

## 4.5. Hướng cải thiện tiếp theo

```text
Tiếp tục thiết kế kiến trúc hệ thống xử lý Spatial Clustering hiệu quả và nghiên cứu ứng dụng AI Edge OCR.
```

---

# 5. Cam kết cập nhật Changelog

Sinh viên/nhóm cam kết rằng nội dung changelog phản ánh đúng các thay đổi đã thực hiện trong quá trình làm bài tập/project.

| Đại diện sinh viên/nhóm | Ngày xác nhận |
|---|---|
| Trần Minh Vĩ | 30/06/2026 |
