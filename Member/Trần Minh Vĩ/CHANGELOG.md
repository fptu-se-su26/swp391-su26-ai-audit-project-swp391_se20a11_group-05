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
| Tên bài tập / Project | The Listening City Systems |
| Tên sinh viên / Nhóm | Trần Minh Vĩ / Group05 |
| MSSV / Danh sách MSSV | DE190182 |
| Giảng viên hướng dẫn | Lê Thiện Nhật Quang |
| Repository URL | https://github.com/fptu-se-su26/swp391-su26-ai-audit-project-swp391_se20a11_group-05 |
| Ngày bắt đầu | 2026-05-12 |
| Ngày hoàn thành | 2026-05-19 |

---

## 3. Tổng quan các phiên bản/giai đoạn

| Phiên bản/Giai đoạn | Thời gian | Nội dung chính | Trạng thái |
|---|---|---|---|
| Phase 01 | 2026-05-12 | Khởi tạo project | Completed |
| Phase 02 | 2026-05-15 | Phân tích yêu cầu | Completed |
| Phase 03 | 2026-05-28 | Thiết kế hệ thống | Completed |
| Phase 04 |  | Implementation | Not Started |
| Phase 05 |  | Testing & Debug | Not Started |
| Phase 06 |  | Hoàn thiện báo cáo và demo | Not Started |

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

# [Phase 04] Implementation
*(Chưa bắt đầu)*

---

# [Phase 05] Testing & Debug
*(Chưa bắt đầu)*

---

# [Phase 06] Hoàn thiện báo cáo và demo
*(Chưa bắt đầu)*

---

# 4. Tổng kết thay đổi cuối project

## 4.1. Các chức năng đã hoàn thành

| STT | Chức năng | Trạng thái | Minh chứng | Ghi chú |
|---:|---|---|---|---|
| 1 |  | Completed / Partial / Not Completed |  |  |

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
| Design | Có / Không | Ít / Trung bình / Nhiều |  |
| Database | Có / Không | Ít / Trung bình / Nhiều |  |
| Coding | Có / Không | Ít / Trung bình / Nhiều |  |
| Debug | Có / Không | Ít / Trung bình / Nhiều |  |
| Testing | Có / Không | Ít / Trung bình / Nhiều |  |
| Report | Có / Không | Ít / Trung bình / Nhiều |  |
| Presentation | Có / Không | Ít / Trung bình / Nhiều |  |

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
| Trần Minh Vĩ | 19/05/2026 |
