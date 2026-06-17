# Requirements Document

## Introduction

Tính năng **AI Duplicate Detection** cho phép hệ thống "Đà Nẵng Lắng Nghe" tự động phát hiện các phản ánh đô thị có nội dung tương tự nhau **trước khi** người dân hoàn tất việc gửi phản ánh mới. Khi phát hiện độ tương đồng ngữ nghĩa vượt ngưỡng 92% (cosine distance < 0.08) trong cùng phường/xã, hệ thống sẽ thông báo cho người dân và đề xuất hai lựa chọn: theo dõi phản ánh đã tồn tại hoặc tiếp tục gửi phản ánh mới nếu thực sự khác biệt.

Tính năng này tái sử dụng toàn bộ hạ tầng PGVector và `EmbeddingClientFacade` đang vận hành cho Semantic Cache. Luồng kiểm tra là **pure read-only** và **không lưu bất kỳ dữ liệu nào** vào cơ sở dữ liệu. Khi dịch vụ embedding không khả dụng, hệ thống **gracefully fallback** để người dân vẫn có thể gửi phản ánh bình thường.

---

## Glossary

- **Duplicate_Detection_API**: Endpoint REST `POST /api/feedback/check-duplicate` — nhận nội dung phản ánh và trả về kết quả kiểm tra trùng lặp.
- **DuplicateCheckService**: Spring Service xử lý toàn bộ logic kiểm tra trùng lặp phía backend.
- **EmbeddingClientFacade**: Component hiện có tại `com.example.smartcity.rag.ingestion.EmbeddingClientFacade`, dùng Gemini `text-embedding-004` để chuyển văn bản thành vector 768 chiều.
- **PGVector**: PostgreSQL extension lưu trữ và truy vấn vector ngữ nghĩa bằng toán tử cosine distance `<=>`.
- **Cosine_Distance**: Khoảng cách giữa hai vector, giá trị trong [0, 2]. Ngưỡng 0.08 tương đương độ tương đồng 92%.
- **Similarity_Score**: Giá trị tương đồng = 1 − cosine_distance, trả về cho frontend trong phạm vi [0.0, 1.0].
- **Ward**: Đơn vị hành chính phường/xã. Kiểm tra trùng lặp chỉ thực hiện trong cùng `wardId`.
- **Active_Feedback**: Phản ánh có trạng thái `SUBMITTED`, `PENDING_RECEIVE`, `PENDING`, hoặc `IN_PROGRESS`, được tạo trong vòng 30 ngày gần nhất.
- **DuplicateCheckRequest**: DTO đầu vào gồm `title`, `description`, và `wardId`.
- **DuplicateCheckResponse**: DTO đầu ra gồm `isDuplicate`, `similarFeedbacks` (top 3), `highestSimilarity`, và `fallback`.
- **SimilarFeedbackItem**: Thông tin tóm tắt của một phản ánh tương tự: `trackingCode`, `title`, `status`, `submittedAt`, `similarityScore`.
- **Duplicate_Modal**: Component modal trên frontend hiển thị danh sách phản ánh tương tự kèm hai nút lựa chọn.
- **Description_Vector**: Cột `description_vector vector(768)` trong bảng `feedbacks` — đã tồn tại trong cơ sở dữ liệu.

---

## Requirements

### Requirement 1: Duplicate Check API Endpoint

**User Story:** Là người dân, tôi muốn được thông báo nếu phản ánh tôi sắp gửi đã tồn tại, để tôi có thể chọn theo dõi thay vì tạo mới.

#### Acceptance Criteria

1. THE `Duplicate_Detection_API` SHALL nhận request `POST /api/feedback/check-duplicate` với body JSON chứa `title` (chuỗi, tối đa 255 ký tự), `description` (chuỗi, tối đa 5000 ký tự), và `wardId` (số nguyên dương).
2. THE `Duplicate_Detection_API` SHALL cho phép truy cập không cần xác thực JWT vì đây là endpoint read-only phục vụ kiểm tra trước khi submit.
3. WHEN `title` hoặc `description` bị rỗng hoặc null, THE `Duplicate_Detection_API` SHALL trả về HTTP 400 ngay lập tức với message JSON mô tả trường vi phạm đầu tiên theo thứ tự xử lý (`title` trước `description` trước `wardId`), không chờ validate toàn bộ các trường còn lại.
4. WHEN `wardId` là null hoặc không phải số nguyên dương, THE `Duplicate_Detection_API` SHALL trả về HTTP 400 với message JSON rõ ràng.
5. THE `Duplicate_Detection_API` SHALL hoàn thành và trả về response trong vòng 2000 milliseconds kể từ khi nhận request.
6. THE `Duplicate_Detection_API` SHALL trả về HTTP 200 với body JSON theo cấu trúc: `{ "isDuplicate": boolean, "similarFeedbacks": [...], "highestSimilarity": number, "fallback": boolean }` khi input validation thành công, kể cả khi duplicate detection xử lý nội bộ thất bại.

---

### Requirement 2: Semantic Similarity Detection Logic

**User Story:** Là hệ thống, tôi muốn phát hiện chính xác phản ánh trùng lặp dựa trên ngữ nghĩa, để giảm tải cho admin và tránh xử lý thủ công.

#### Acceptance Criteria

1. WHEN `DuplicateCheckService` nhận `title` và `description`, THE `DuplicateCheckService` SHALL nối hai chuỗi thành dạng `"{title}. {description}"` trước khi gọi `EmbeddingClientFacade.embed()` để tạo vector 768 chiều.
2. THE `DuplicateCheckService` SHALL truy vấn bảng `feedbacks` bằng PGVector với điều kiện kết hợp: `description_vector <=> ?::vector < 0.08` VÀ `ward_id = ?` VÀ `status IN ('SUBMITTED', 'PENDING_RECEIVE', 'PENDING', 'IN_PROGRESS')` VÀ `submitted_at >= NOW() - INTERVAL '30 days'`.
3. THE `DuplicateCheckService` SHALL trả về tối đa 3 kết quả gần nhất, sắp xếp tăng dần theo cosine distance.
4. WHEN `DuplicateCheckService` tìm thấy ít nhất một kết quả, THE `DuplicateCheckService` SHALL set `isDuplicate = true` và tính `highestSimilarity = 1.0 - cosine_distance` của kết quả gần nhất, làm tròn đến 4 chữ số thập phân.
5. WHEN `DuplicateCheckService` không tìm thấy kết quả nào, THE `DuplicateCheckService` SHALL set `isDuplicate = false`, `similarFeedbacks = []`, và `highestSimilarity = 0.0`.
6. THE `DuplicateCheckService` SHALL là read-only: không thực hiện bất kỳ thao tác INSERT, UPDATE, hay DELETE nào vào cơ sở dữ liệu trong quá trình kiểm tra.
7. FOR ALL cặp phản ánh đầu vào có cùng ngữ nghĩa, THE `DuplicateCheckService` SHALL phát hiện trùng lặp khi cosine distance của vector tổng hợp nhỏ hơn 0.08.

---

### Requirement 3: Graceful Fallback khi Embedding Service gặp sự cố

**User Story:** Là người dân, tôi muốn vẫn có thể gửi phản ánh bình thường dù dịch vụ AI gặp sự cố, để trải nghiệm không bị gián đoạn.

#### Acceptance Criteria

1. IF `EmbeddingClientFacade.embed()` ném exception (timeout, lỗi mạng, quota vượt mức), THEN THE `DuplicateCheckService` SHALL trả về response `{ "isDuplicate": false, "similarFeedbacks": [], "highestSimilarity": 0.0, "fallback": true }` với HTTP 200 thay vì trả về lỗi.
2. IF lỗi xảy ra trong quá trình embed, THEN THE `DuplicateCheckService` SHALL ghi log cảnh báo ở mức `WARN` kèm message lỗi nguyên bản.
3. IF `wardId` không tìm thấy trong bảng `wards`, THEN THE `DuplicateCheckService` SHALL trả về `{ "isDuplicate": false, "similarFeedbacks": [], "highestSimilarity": 0.0, "fallback": false }` với HTTP 200.
4. WHILE `EmbeddingClientFacade` đang ở trạng thái mock (GeminiKeyPool chưa cấu hình, tức `keyPool.isConfigured()` trả về `false`), THE `DuplicateCheckService` SHALL vẫn thực thi bình thường sử dụng mock vector và không trả về lỗi. WHERE GeminiKeyPool đã được cấu hình đúng, THE `DuplicateCheckService` SHALL không sử dụng mock vector.

---

### Requirement 4: Dữ liệu trả về của Similar Feedbacks

**User Story:** Là người dân, tôi muốn thấy thông tin cụ thể về phản ánh tương tự, để quyết định có nên theo dõi thay vì tạo mới không.

#### Acceptance Criteria

1. THE `DuplicateCheckService` SHALL bao gồm trong mỗi `SimilarFeedbackItem` các trường: `trackingCode` (mã tra cứu), `title` (tiêu đề gốc), `status` (trạng thái hiện tại dạng enum string), `submittedAt` (thời gian gửi dạng ISO 8601), và `similarityScore` (số thực [0.0, 1.0]).
2. THE `DuplicateCheckService` SHALL không bao gồm thông tin cá nhân của người gửi phản ánh tương tự trong `SimilarFeedbackItem` (không có `citizenId`, `citizenName`, hay bất kỳ thông tin định danh nào).
3. WHEN `similarFeedbacks` chứa ít nhất một phần tử, THE `DuplicateCheckService` SHALL đảm bảo danh sách được sắp xếp theo `similarityScore` giảm dần (phản ánh giống nhất đứng đầu tiên).

---

### Requirement 5: Duplicate Modal trên Frontend

**User Story:** Là người dân, tôi muốn thấy modal thông báo rõ ràng trước khi tôi vô tình gửi phản ánh trùng lặp, để tiết kiệm thời gian xử lý của admin.

#### Acceptance Criteria

1. WHEN người dùng nhấn nút Submit trên `ReportPage` và `validateBeforeSubmit()` trả về `true`, THE `ReportPage` SHALL gọi `Duplicate_Detection_API` TRƯỚC KHI gọi `createFeedback.mutateAsync()`.
2. WHEN `Duplicate_Detection_API` trả về `isDuplicate = true`, THE `ReportPage` SHALL hiển thị `Duplicate_Modal` và không gọi `createFeedback.mutateAsync()` tự động. IF `Duplicate_Modal` không thể hiển thị do lỗi UI, THEN THE `ReportPage` SHALL gọi `createFeedback.mutateAsync()` ngay lập tức như thể không có trùng lặp.
3. WHEN `Duplicate_Detection_API` trả về `isDuplicate = false` hoặc `fallback = true`, THE `ReportPage` SHALL tiến hành gọi `createFeedback.mutateAsync()` ngay lập tức mà không hiển thị modal.
4. THE `Duplicate_Modal` SHALL hiển thị tiêu đề thông báo, danh sách tối đa 3 `SimilarFeedbackItem` (mỗi item gồm `trackingCode`, `title`, `status`, `submittedAt`), và hai nút hành động.
5. WHEN người dùng nhấn nút "Theo dõi phản ánh này" trong `Duplicate_Modal`, THE `ReportPage` SHALL đóng modal và điều hướng đến trang tra cứu của phản ánh được chọn.
6. WHEN người dùng nhấn nút "Vẫn gửi phản ánh mới" trong `Duplicate_Modal`, THE `ReportPage` SHALL đóng modal và gọi `createFeedback.mutateAsync()` với dữ liệu đã nhập ban đầu.
7. WHILE `Duplicate_Detection_API` đang được gọi, THE `ReportPage` SHALL hiển thị trạng thái loading trên nút Submit để người dùng biết hệ thống đang xử lý.
8. IF `Duplicate_Detection_API` trả về HTTP lỗi (4xx, 5xx) hoặc request timeout sau 3000 milliseconds, THEN THE `ReportPage` SHALL bỏ qua bước kiểm tra trùng lặp và tiến hành submit bình thường.

---

### Requirement 6: Hiệu năng và Giới hạn Thời gian Phản hồi

**User Story:** Là kỹ sư backend, tôi muốn đảm bảo API kiểm tra trùng lặp có độ trễ thấp, để không làm chậm trải nghiệm người dùng khi gửi phản ánh.

#### Acceptance Criteria

1. WHILE số lượng bản ghi trong bảng `feedbacks` nhỏ hơn hoặc bằng 100,000, THE `Duplicate_Detection_API` SHALL trả về response trong vòng 2000 milliseconds ở percentile 95.
2. THE `DuplicateCheckService` SHALL sử dụng `JdbcTemplate` trực tiếp (tái sử dụng pattern từ `SemanticCacheService`) thay vì JPA/Hibernate để truy vấn vector, để tránh overhead ORM với cú pháp vector `<=>`.
3. THE `DuplicateCheckService` SHALL tận dụng cache Caffeine trong `EmbeddingClientFacade`: nếu cùng văn bản đã được embed trong vòng 1 giờ trước, THE `DuplicateCheckService` SHALL không gọi lại Gemini API. Cache chỉ dựa trên nội dung văn bản, không phân biệt phiên bản model hay tham số embedding.

---

### Requirement 7: Bảo mật và Rate Limiting

**User Story:** Là admin hệ thống, tôi muốn đảm bảo API kiểm tra trùng lặp không bị lạm dụng, để bảo vệ tài nguyên embedding và PGVector.

#### Acceptance Criteria

1. THE `Duplicate_Detection_API` SHALL áp dụng rate limiting: tối đa 30 request mỗi phút trên mỗi địa chỉ IP (sử dụng cơ chế rate limit hiện có của hệ thống).
2. THE `Duplicate_Detection_API` SHALL giới hạn độ dài `title` tối đa 255 ký tự và `description` tối đa 5000 ký tự ở tầng Bean Validation trước khi gọi embedding.
3. WHEN tổng độ dài `title + description` vượt quá 5255 ký tự, THE `DuplicateCheckService` SHALL truncate chuỗi tổng hợp tại ký tự thứ 5255 trước khi embed, và không trả về lỗi.

---

### Requirement 8: Database Index cho PGVector Query

**User Story:** Là kỹ sư backend, tôi muốn đảm bảo truy vấn PGVector trên bảng `feedbacks` đủ nhanh, để đáp ứng yêu cầu hiệu năng 2 giây.

#### Acceptance Criteria

1. THE hệ thống SHALL tạo IVFFlat index (kiểu `ivfflat`) trên cột `description_vector` của bảng `feedbacks` nếu chưa tồn tại, thông qua Flyway migration script.
2. THE migration script SHALL sử dụng `CREATE INDEX CONCURRENTLY IF NOT EXISTS` để không khóa bảng `feedbacks` trong quá trình tạo index trên production.
3. THE index SHALL được tạo với tham số `lists = 100` và truy vấn sử dụng `SET ivfflat.probes = 10` để cân bằng giữa tốc độ và độ chính xác tại quy mô dự kiến dưới 100,000 bản ghi.
