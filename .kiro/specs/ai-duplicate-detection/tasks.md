# Implementation Plan: AI Duplicate Detection

## Overview

Triển khai tính năng phát hiện phản ánh trùng lặp dựa trên ngữ nghĩa cho hệ thống "Đà Nẵng Lắng Nghe". Backend bổ sung `DuplicateCheckService` sử dụng `EmbeddingClientFacade` + PGVector, frontend tích hợp `DuplicateModal` vào `ReportPage` trước bước submit. Thiết kế pure read-only với graceful fallback.

## Tasks

- [ ] 1. Tạo Flyway Migration V7 cho IVFFlat Index
  - [ ] 1.1 Viết migration script `V7__add_ivfflat_index_for_duplicate_detection.sql`
    - Tạo file tại `Sources/Backend/src/main/resources/db/migration/`
    - Dùng `CREATE INDEX CONCURRENTLY IF NOT EXISTS feedbacks_description_vector_ivfflat_idx ON feedbacks USING ivfflat (description_vector vector_cosine_ops) WITH (lists = 100)`
    - Không block bảng `feedbacks` trong quá trình tạo index
    - _Requirements: 8.1, 8.2, 8.3_

- [ ] 2. Tạo Backend DTOs
  - [ ] 2.1 Tạo `DuplicateCheckRequest` record
    - File: `com.example.smartcity.modules.feedback.dto.DuplicateCheckRequest`
    - Bao gồm `@NotBlank @Size(max=255)` cho `title`, `@NotBlank @Size(max=5000)` cho `description`, `@NotNull @Positive` cho `wardId` (Long)
    - _Requirements: 1.1, 1.3, 1.4, 7.2_

  - [ ] 2.2 Tạo `SimilarFeedbackItem` record
    - File: `com.example.smartcity.modules.feedback.dto.SimilarFeedbackItem`
    - Bao gồm các fields: `trackingCode`, `title`, `status`, `submittedAt` (ISO 8601 string), `similarityScore` (double)
    - Không bao gồm bất kỳ thông tin PII nào (`citizenId`, `citizenName`, v.v.)
    - _Requirements: 4.1, 4.2_

  - [ ] 2.3 Tạo `DuplicateCheckResponse` record
    - File: `com.example.smartcity.modules.feedback.dto.DuplicateCheckResponse`
    - Bao gồm các fields: `isDuplicate` (boolean), `similarFeedbacks` (List), `highestSimilarity` (double), `fallback` (boolean)
    - Thêm static factory methods: `fallback()` và `noMatch()`
    - _Requirements: 1.6, 3.1_

- [ ] 3. Triển khai DuplicateCheckService
  - [ ] 3.1 Tạo interface `DuplicateCheckService`
    - File: `com.example.smartcity.modules.feedback.service.DuplicateCheckService`
    - Khai báo method: `DuplicateCheckResponse checkDuplicate(DuplicateCheckRequest request)`
    - _Requirements: 2.1_

  - [ ] 3.2 Triển khai `DuplicateCheckServiceImpl`
    - File: `com.example.smartcity.modules.feedback.service.DuplicateCheckServiceImpl`
    - Inject `EmbeddingClientFacade` và `JdbcTemplate`
    - Implement `buildCombinedText()`: nối `"{title}. {description}"`, truncate tại 5255 ký tự
    - Implement fallback: bắt mọi exception từ `embeddingFacade.embed()`, log `WARN`, trả về `DuplicateCheckResponse.fallback()`
    - _Requirements: 2.1, 3.1, 3.2, 7.3_

  - [ ] 3.3 Triển khai `queryPgVector()` trong `DuplicateCheckServiceImpl`
    - Dùng `JdbcTemplate` trực tiếp (không dùng JPA)
    - SQL query với `description_vector <=> ?::vector < 0.08`, `ward_id = ?`, `status IN (...)`, `submitted_at >= NOW() - INTERVAL '30 days'`, `LIMIT 3`
    - Thêm `SET LOCAL ivfflat.probes = 10` trước query
    - Map ResultSet thành `SimilarFeedbackItem`: `similarityScore = 1.0 - cosine_distance`, làm tròn 4 chữ số thập phân
    - Sắp xếp kết quả theo `similarityScore` giảm dần (ORDER BY cosine distance ASC)
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6, 6.2_

  - [ ]* 3.4 Viết property test cho Property 3 (isDuplicate/highestSimilarity consistency)
    - **Property 3: Tính nhất quán giữa isDuplicate, highestSimilarity và similarFeedbacks**
    - Dùng jqwik: `@Property(tries=200)` với arbitrary `DuplicateCheckResponse` objects
    - Assert: `isDuplicate == !similarFeedbacks.isEmpty()` và `highestSimilarity == 0.0` khi rỗng, hoặc bằng `similarFeedbacks.get(0).similarityScore()` khi có kết quả
    - **Validates: Requirements 2.4, 2.5**

  - [ ]* 3.5 Viết property test cho Property 2 (kết quả đúng thứ tự và không vượt giới hạn)
    - **Property 2: Kết quả trả về luôn đúng thứ tự và không vượt giới hạn**
    - Dùng jqwik: `@Property(tries=200)` với mock JdbcTemplate trả về 0–5 rows
    - Assert: `similarFeedbacks.size() <= 3` và các phần tử sắp xếp `similarityScore` giảm dần
    - **Validates: Requirements 2.3, 4.3**

  - [ ]* 3.6 Viết property test cho Property 4 (fallback khi embedding ném exception bất kỳ)
    - **Property 4: Fallback khi embedding ném exception bất kỳ**
    - Dùng jqwik: `@Property(tries=100)` với arbitrary `RuntimeException` types
    - Mock `embeddingFacade.embed()` ném exception, assert `result.fallback() == true` và không propagate exception
    - **Validates: Requirements 3.1**

  - [ ]* 3.7 Viết property test cho Property 5 (combined text truncate đúng ngưỡng 5255 ký tự)
    - **Property 5: Combined text bị truncate đúng ngưỡng 5255 ký tự**
    - Dùng jqwik: `@Property(tries=200)` với `@StringLength(min=100, max=300)` title và `@StringLength(min=5000, max=6000)` description
    - Capture argument qua `ArgumentCaptor`, assert `captor.getValue().length() <= 5255`
    - **Validates: Requirements 7.3**

- [ ] 4. Checkpoint — Kiểm tra backend service
  - Ensure all unit tests và property tests cho DuplicateCheckService pass, ask the user if questions arise.

- [ ] 5. Tích hợp Controller và Security
  - [ ] 5.1 Thêm endpoint `POST /api/feedbacks/check-duplicate` vào `FeedbackController`
    - Inject `DuplicateCheckService` và `AuthRateLimiter` vào controller
    - Thêm method `checkDuplicate(@Valid @RequestBody DuplicateCheckRequest, HttpServletRequest)` trả về `ResponseEntity<DuplicateCheckResponse>`
    - Gọi `rateLimiter.checkDuplicateCheckLimit(getClientIp(httpRequest))` trước service call
    - _Requirements: 1.1, 1.2, 7.1_

  - [ ] 5.2 Cập nhật `SecurityConfig` để permit endpoint mới
    - Thêm `"/api/feedbacks/check-duplicate"` vào danh sách `permitAll()` bên cạnh `/api/feedbacks/public/**` và `/api/feedbacks/statuses`
    - _Requirements: 1.2_

  - [ ] 5.3 Thêm bucket `duplicateCheck` vào `AuthRateLimiter`
    - Tạo Caffeine cache `duplicateCheckBuckets` với `maximumSize=20_000`, `expireAfterWrite=2 minutes`
    - Implement `checkDuplicateCheckLimit(String ipAddress)`: gọi `checkLimit(...)` với 30 req/min
    - _Requirements: 7.1_

  - [ ]* 5.4 Viết property test cho Property 1 (input validation từ chối whitespace/blank)
    - **Property 1: Input validation từ chối mọi chuỗi chỉ toàn whitespace**
    - Dùng jqwik với MockMvc: `@Property(tries=100)` với blank/whitespace-only title hoặc description
    - Assert: POST request trả về HTTP 400, `DuplicateCheckService` không được gọi
    - **Validates: Requirements 1.3, 7.2**

  - [ ]* 5.5 Viết property test cho Property 7 (valid request luôn trả về HTTP 200)
    - **Property 7: Valid request luôn trả về HTTP 200 với cấu trúc đúng**
    - Dùng jqwik với MockMvc: `@Property(tries=100)` với valid requests (title/desc không blank, wardId dương)
    - Assert: HTTP 200, response JSON có đủ 4 fields đúng kiểu
    - **Validates: Requirements 1.6**

- [ ] 6. Checkpoint — Kiểm tra backend tích hợp
  - Ensure endpoint hoạt động đúng (validation, security, rate limit), ask the user if questions arise.

- [ ] 7. Tạo Frontend Interfaces và Hook
  - [ ] 7.1 Định nghĩa TypeScript interfaces cho duplicate check
    - File: `src/hooks/index.ts` (thêm vào cuối)
    - Khai báo interfaces: `DuplicateCheckRequest`, `SimilarFeedbackItem`, `DuplicateCheckResponse`
    - _Requirements: 5.1_

  - [ ] 7.2 Triển khai `useDuplicateCheck` hook
    - File: `src/hooks/index.ts`
    - Dùng `useMutation` với `AbortController` timeout 3000ms
    - Gọi `request<DuplicateCheckResponse>("/api/feedbacks/check-duplicate", { method: "POST", body: req, signal })`
    - Clear timeout trong finally block
    - _Requirements: 5.1, 5.7, 5.8_

- [ ] 8. Tạo DuplicateModal Component
  - [ ] 8.1 Tạo `DuplicateModal` component
    - File: `src/components/DuplicateModal.tsx`
    - Props: `open`, `similarFeedbacks`, `onTrack(trackingCode)`, `onSubmitAnyway()`, `onClose()`
    - Hiển thị tiêu đề thông báo và danh sách tối đa 3 `SimilarFeedbackItem` (trackingCode, title, badge status, submittedAt)
    - Hai nút hành động: "Theo dõi phản ánh này" và "Vẫn gửi phản ánh mới"
    - _Requirements: 5.4, 5.5, 5.6_

  - [ ]* 8.2 Viết unit tests cho `DuplicateModal`
    - File: `src/components/DuplicateModal.test.tsx`
    - Snapshot test với mock data 3 items
    - Test "Theo dõi" button gọi `onTrack` với đúng `trackingCode`
    - Test "Vẫn gửi mới" button gọi `onSubmitAnyway`
    - _Requirements: 5.4, 5.5, 5.6_

- [ ] 9. Tích hợp Duplicate Check vào ReportPage
  - [ ] 9.1 Cập nhật `handleSubmit` trong `ReportPage` / `report.tsx`
    - Gọi `useDuplicateCheck` hook
    - Thêm state: `duplicateResult` (DuplicateCheckResponse | null), `showDuplicateModal` (boolean)
    - Trước khi gọi `createFeedback.mutateAsync()`, gọi `duplicateCheck.mutateAsync(...)` nếu `resolvedWardId` có giá trị
    - Nếu `result.isDuplicate && !result.fallback`: set state để mở modal, return sớm
    - Trong catch block: bỏ qua lỗi, tiến hành `doSubmit()` bình thường
    - _Requirements: 5.1, 5.2, 5.3, 5.8_

  - [ ] 9.2 Cập nhật trạng thái loading của nút Submit trong `ReportPage`
    - `disabled` khi `!canSubmit || duplicateCheck.isPending`
    - Label: `duplicateCheck.isPending ? "Đang kiểm tra..." : "Gửi phản ánh"`
    - _Requirements: 5.7_

  - [ ] 9.3 Render `DuplicateModal` trong `ReportPage` và xử lý callbacks
    - Truyền `open={showDuplicateModal}`, `similarFeedbacks={duplicateResult?.similarFeedbacks ?? []}`
    - `onTrack`: đóng modal và navigate đến trang tra cứu của phản ánh được chọn
    - `onSubmitAnyway`: đóng modal và gọi `doSubmit()`
    - `onClose`: đóng modal, trong Error Boundary gọi `doSubmit()` ngay
    - _Requirements: 5.2, 5.5, 5.6_

  - [ ]* 9.4 Viết property test cho Property 6 (frontend modal logic)
    - **Property 6: Frontend chỉ hiển thị modal khi isDuplicate = true và fallback = false**
    - Dùng fast-check: `fc.property(...)` với arbitrary `DuplicateCheckResponse` objects
    - Assert: `computeShowModal(response) === (response.isDuplicate && !response.fallback)`
    - **Validates: Requirements 5.2, 5.3**

  - [ ]* 9.5 Viết property test cho Property 7 phía frontend (`useDuplicateCheck` hook)
    - **Property 7: Valid request luôn trả về HTTP 200 với cấu trúc đúng**
    - Dùng fast-check: `fc.asyncProperty(...)` với MSW mock server
    - Assert: response luôn có đủ 4 fields với kiểu dữ liệu đúng
    - **Validates: Requirements 1.6**

  - [ ]* 9.6 Viết unit tests cho `ReportPage` submit flow
    - Test happy path: isDuplicate=false → submit ngay, không mở modal
    - Test duplicate path: isDuplicate=true, fallback=false → mở modal
    - Test fallback path: fallback=true → submit ngay, không mở modal
    - Test error path: API lỗi / timeout → submit ngay bình thường
    - _Requirements: 5.1, 5.2, 5.3, 5.8_

- [ ] 10. Checkpoint — Đảm bảo tất cả tests pass
  - Ensure all tests pass (backend JUnit/jqwik + frontend Vitest/fast-check), ask the user if questions arise.

- [ ] 11. Thêm dependency jqwik vào pom.xml
  - [ ] 11.1 Thêm jqwik dependency vào `Sources/Backend/pom.xml`
    - Thêm `net.jqwik:jqwik:1.8.4` với scope `test`
    - Verify không conflict với JUnit 5 hiện có
    - _Requirements: (testing infrastructure)_

## Notes

- Tasks đánh dấu `*` là optional và có thể bỏ qua để phát triển MVP nhanh hơn
- Mỗi task tham chiếu requirements cụ thể để đảm bảo traceability
- Checkpoints đảm bảo validation theo từng giai đoạn
- Property tests xác nhận các invariants phổ quát (PBT với jqwik và fast-check)
- Unit tests xác nhận các examples và edge cases cụ thể
- Task 11 (thêm jqwik dependency) cần thực hiện trước các property test tasks backend
- Lưu ý: `CREATE INDEX CONCURRENTLY` không thể chạy trong transaction block — Flyway cần cấu hình `outOfOrder=true` hoặc script chạy ngoài transaction

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "11.1"] },
    { "id": 1, "tasks": ["2.1", "2.2", "2.3", "3.1"] },
    { "id": 2, "tasks": ["3.2", "3.3"] },
    { "id": 3, "tasks": ["3.4", "3.5", "3.6", "3.7", "5.1"] },
    { "id": 4, "tasks": ["5.2", "5.3", "5.4", "5.5"] },
    { "id": 5, "tasks": ["7.1"] },
    { "id": 6, "tasks": ["7.2", "8.1"] },
    { "id": 7, "tasks": ["8.2", "9.1"] },
    { "id": 8, "tasks": ["9.2", "9.3"] },
    { "id": 9, "tasks": ["9.4", "9.5", "9.6"] }
  ]
}
```
