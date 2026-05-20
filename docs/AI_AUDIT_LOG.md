# AI Audit Log

## 1. Thông tin chung

| Thông tin | Nội dung |
|---|---|
| Môn học | Xây dựng ứng dụng hướng đối tượng |
| Mã môn học | SWP391 |
| Lớp | SE20A11 |
| Học kỳ | SU26 |
| Tên bài tập / Project | Hệ thống "Đà Nẵng Lắng Nghe" (The Listening City System) |
| Tên sinh viên / Nhóm | Phạm Bá Trí / Nhóm 05 |
| MSSV / Danh sách MSSV | DE191029 |
| Giảng viên hướng dẫn | Trần Lệ Bích |
| Ngày bắt đầu | 2026-05-18 |
| Ngày hoàn thành | 2026-05-20 |

---

## 2. Công cụ AI đã sử dụng

Đánh dấu các công cụ AI đã sử dụng trong quá trình thực hiện bài tập/project.

- [ ] ChatGPT
- [ ] Gemini
- [ ] Claude
- [ ] GitHub Copilot
- [ ] Cursor
- [x] Antigravity
- [ ] Perplexity
- [ ] Microsoft Copilot
- [ ] Công cụ khác: ....................................

---

## 3. Mục tiêu sử dụng AI

Mô tả ngắn gọn sinh viên/nhóm đã sử dụng AI để hỗ trợ những công việc nào.

- Phân tích yêu cầu bài toán
- Gợi ý ý tưởng giải pháp
- Thiết kế giao diện (Dashboard UI Mockup)
- Viết báo cáo nghiên cứu và tổng hợp bài báo khoa học từ Springer
- Viết đặc tả yêu cầu phần mềm (SRS)

### Mô tả mục tiêu sử dụng AI

```text
Sử dụng Antigravity để tìm kiếm thông tin về các bài báo khoa học trên Springer, thực hiện phân tích và tổng hợp các nghiên cứu học thuật liên quan đến Hybrid RAG và Computer Vision/OCR áp dụng trong Smart Cities. Đồng thời sử dụng AI để sinh tài liệu đặc tả SRS (Introduction, Scope, Existing Systems Analysis) và tạo hình ảnh mockup UI chất lượng cao cho dự án.
```

## 4. Nhật ký sử dụng AI chi tiết

---

### Lần sử dụng AI số 1

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 2026-05-20 |
| Công cụ AI | Antigravity |
| Mục đích sử dụng | Nghiên cứu và tổng hợp 10 bài báo Springer + Phác thảo SRS |
| Phần việc liên quan | Requirement / Report / Design |
| Mức độ sử dụng | Sinh chính nội dung |

#### 4.1. Prompt đã sử dụng

```text
Week 2:
- Tạo folder Paper trên Class room git : Download từ link https://link.springer.com/ 10 paper lieen quan đến nội dung mà nhóm đã chọn nghiên cứu
- Tổng hợp 10 paper để phân tích nhận định - đánh giá về nội dung đã đọc từ paper qua 1 file word
- Điền Phần Introduction + Scope + Các hệ thống hiện tại trong các mục liên quan từ SRS và commit lên Git (có thể làm nhanh nếu như đã có nền tảng về việc thiết kế UI)
Dự án này vượt ra khỏi khuôn khổ của một ứng dụng CRUD (quản lý thêm, sửa, xóa) thông thường bằng cách tập trung nghiên cứu sâu vào hai trụ cột công nghệ chính: **Kiến trúc Hệ thống Nâng cao (Hybrid RAG)** và **Tự động hóa Xử lý Dữ liệu Biên (Computer Vision & OCR)**.
```

#### 4.2. Kết quả AI gợi ý

Tóm tắt nội dung AI đã trả lời hoặc gợi ý.

```text
- AI đã tìm kiếm thông tin, đề xuất 10 bài báo học thuật chuẩn từ Springer Nature về hai trụ cột công nghệ: Hybrid RAG và Edge Computer Vision & OCR.
- AI sinh ra báo cáo tổng hợp cực kỳ chuyên sâu (Paper_Synthesis.md) bằng tiếng Việt phân tích sâu sắc các hạn chế của Naive RAG và kiến trúc Edge Intelligence.
- AI sinh ra file SRS.md chứa đầy đủ các phân hệ giới thiệu, phạm vi chức năng, so sánh điểm nghẽn kỹ thuật giữa hệ thống 1022 Đà Nẵng hiện tại với hệ thống mới.
- AI sinh ra hình ảnh mockup UI Dashboard chất lượng cao cho phân hệ kiểm toán đô thị.
```

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

Mô tả rõ phần nào được sử dụng lại từ gợi ý của AI.

```text
- Sử dụng toàn bộ 10 bài báo và thông tin trích dẫn phục vụ học tập/nghiên cứu.
- Sử dụng toàn bộ nội dung của báo cáo tổng hợp Paper_Synthesis.md.
- Sử dụng toàn bộ cấu trúc và nội dung chi tiết của docs/SRS.md.
- Sử dụng ảnh mockup UI do AI tạo ra để nhúng trực tiếp vào SRS.
```

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

Mô tả sinh viên/nhóm đã thay đổi, kiểm tra, sửa lỗi hoặc cải tiến gì so với gợi ý ban đầu của AI.

```text
- Kiểm tra tính đúng đắn của các link bài báo trên Springer.
- Đồng bộ hóa định dạng markdown và cấu trúc thư mục của Classroom Git.
```

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Sẽ được cập nhật sau khi push lên Git |
| File liên quan | Paper_Synthesis.md, SRS.md, listening_city_dashboard.png |
| Screenshot | Có trong docs/listening_city_dashboard.png |
| Kết quả chạy/test | Đã kiểm tra liên kết hoạt động tốt |

#### 4.6. Nhận xét cá nhân/nhóm

Sinh viên/nhóm học được gì sau lần sử dụng AI này?

```text
Hiểu sâu sắc hơn về kiến trúc RAG nâng cao (GraphRAG, Hybrid Search) và cách thức tối ưu hóa mô hình Computer Vision khi chạy trên thiết bị biên (Edge Processing) nhằm cắt giảm băng thông mạng trong kiến trúc đô thị thông minh.
```

---

## 5. Bảng tổng hợp mức độ sử dụng AI

Đánh dấu mức độ AI hỗ trợ ở từng hạng mục.

| Hạng mục | Không dùng AI | AI hỗ trợ ít | AI hỗ trợ nhiều | AI sinh chính | Ghi chú |
|---|:---:|:---:|:---:|:---:|---|
| Phân tích yêu cầu |  |  |  |  x |  |
| Viết user story/use case |  |  |  |  x |  |
| Thiết kế database |  |  |  |  | Chưa triển khai |
| Thiết kế kiến trúc hệ thống |  |  |  |  x |  |
| Thiết kế giao diện |  |  |  |  x | Ảnh Mockup UI |
| Code frontend |  |  |  |  | Chưa triển khai |
| Code backend |  |  |  |  | Chưa triển khai |
| Debug lỗi |  |  |  |  | Chưa triển khai |
| Viết test case |  |  |  |  | Chưa triển khai |
| Kiểm thử sản phẩm |  |  |  |  | Chưa triển khai |
| Tối ưu code |  |  |  |  | Chưa triển khai |
| Viết báo cáo |  |  |  |  x | Báo cáo nghiên cứu tuần 2 |
| Làm slide thuyết trình |  |  |  |  | Chưa triển khai |

---

## 6. Các lỗi hoặc hạn chế từ AI

Ghi lại các trường hợp AI trả lời sai, thiếu, chưa phù hợp hoặc sinh code không chạy.

| STT | Lỗi/hạn chế từ AI | Cách phát hiện | Cách xử lý/cải tiến |
|---:|---|---|---|
| 1 | Các đường dẫn cụ thể từ Springer đôi khi có thể bị thay đổi định dạng | Nhấp trực tiếp vào link kiểm tra | Đã sửa tay lại các DOI và link bài báo chuẩn xác |

---

## 7. Kiểm chứng kết quả AI

Mô tả cách sinh viên/nhóm kiểm tra lại kết quả do AI gợi ý.

### Nội dung kiểm chứng

```text
- Nhấp thử toàn bộ 10 liên kết Springer Link để kiểm chứng thực tế các bài báo.
- Đọc và rà soát lại văn phong pháp lý và các phân tích học thuật trong báo cáo và đặc tả SRS xem có khớp với yêu cầu đặc thù của thành phố Đà Nẵng hay không.
```

---

## 8. Đóng góp cá nhân hoặc đóng góp nhóm

### 8.2. Đối với bài nhóm

| Thành viên | MSSV | Nhiệm vụ chính | Có sử dụng AI không? | Minh chứng đóng góp |
|---|---|---|---|---|
| Phạm Bá Trí | DE191029 | Nghiên cứu tài liệu học thuật (Springer), viết báo cáo tổng hợp tuần 2, phác thảo SRS và thiết kế UI Mockup | Có | Commit các tệp tin trong thư mục Paper/ và docs/ |

---

## 9. Reflection cuối bài

### 9.1. AI đã hỗ trợ em/nhóm ở điểm nào?

```text
AI hỗ trợ đắc lực trong việc tìm kiếm các bài báo khoa học liên quan, dịch nghĩa học thuật phức tạp, phác thảo giao diện trực quan và cấu trúc tài liệu SRS theo chuẩn IEEE.
```

### 9.2. Phần nào em/nhóm không sử dụng theo gợi ý của AI? Vì sao?

```text
Không có. Do AI đã giải quyết vô cùng sâu sắc và chuẩn chỉ các phần việc học tập này.
```

### 9.3. Em/nhóm đã kiểm tra tính đúng đắn của kết quả AI như thế nào?

```text
Đối chiếu trực tiếp với các bài báo khoa học gốc trên cơ sở dữ liệu SpringerLink.
```

### 9.4. Nếu không có AI, phần nào sẽ khó khăn nhất?

```text
Phần tìm kiếm, đọc hiểu và tổng hợp 10 bài báo tiếng Anh chuyên ngành sâu về AI (RAG, Computer Vision) sẽ cực kỳ tốn thời gian (có thể mất cả tuần).
```

### 9.5. Sau bài tập/project này, em/nhóm học được gì về môn học?

```text
Hiểu rõ cách viết một bản đặc tả yêu cầu phần mềm chuyên nghiệp (SRS) và tầm quan trọng của việc lập kế hoạch trước khi bắt tay vào code.
```

### 9.6. Sau bài tập/project này, em/nhóm học được gì về cách sử dụng AI có trách nhiệm?

```text
Luôn luôn rà soát, kiểm chứng thông tin thực tế từ các nguồn chính thống thay vì tin tưởng 100% vào dữ liệu AI tạo ra.
```

---

## 10. Cam kết học thuật

Sinh viên/nhóm cam kết rằng:

- Nội dung AI hỗ trợ đã được ghi nhận trung thực.
- Không nộp nguyên văn kết quả AI mà không kiểm tra.
- Có khả năng giải thích các phần đã nộp.
- Chịu trách nhiệm về tính đúng đắn của sản phẩm cuối cùng.
- Hiểu rằng việc sử dụng AI không khai báo có thể ảnh hưởng đến kết quả đánh giá.

| Đại diện sinh viên/nhóm | Ngày xác nhận |
|---|---|
| Phạm Bá Trí | 2026-05-20 |
