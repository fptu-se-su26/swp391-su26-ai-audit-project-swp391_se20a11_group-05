# AI Audit Log

## I. Thông tin chung

| Thông tin | Nội dung |
|---|---|
| Môn học | Software Project |
| Mã môn học | SWP391 |
| Lớp | SE20A11 |
| Học kỳ | 5 |
| Tên bài tập / Project | Listening City System |
| Tên sinh viên / Nhóm | Phạm Tuấn Việt / Nhóm 5 |
| MSSV / Danh sách MSSV | DE190714 |
| Giảng viên hướng dẫn | QuangLTN3 |
| Ngày bắt đầu | 13/5/2026 |
| Ngày hoàn thành | Chưa hoàn thành |

---

## II. Công cụ AI đã sử dụng

Đánh dấu các công cụ AI đã sử dụng trong quá trình thực hiện bài tập/project.

- [x] ChatGPT
- [x] Gemini
- [x] Claude
- [x] GitHub Copilot
- [x] Cursor
- [x] Antigravity
- [x] Perplexity
- [x] Microsoft Copilot
- [x] Công cụ khác: Lovable, StitchGoogle

---

## III. Mục tiêu sử dụng AI

### Lần sử dụng AI số 1

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 13/05/2026 |
| Công cụ AI | Gemini |
| Mục đích sử dụng | Nghiên cứu giải pháp tạo sự khác biệt cho hệ thống và tìm kiếm nguồn dữ liệu mẫu về đô thị Đà Nẵng. |
| Phần việc liên quan | Requirement |
| Mức độ sử dụng | Hỗ trợ ý tưởng |

#### 4.1. Prompt đã sử dụng

Tôi đang làm một dự án hệ thống thông minh tên là "Listening City System" (Thành phố lắng nghe) dành cho Đà Nẵng, giúp người dân báo cáo sự cố đô thị (ngập lụt, rác thải, hỏng hạ tầng) theo thời gian thực. Hãy gợi ý cho tôi cách làm thế nào để nền tảng web này khác biệt và nổi bật hơn so với các cổng thông tin dịch vụ công hiện có của chính phủ? Đồng thời, gợi ý một số nguồn dữ liệu công khai về đô thị Đà Nẵng để tôi làm data mẫu.

#### 4.2. Kết quả AI gợi ý

AI đã đề xuất các giải pháp bao gồm:

- Tích hợp một Chatbot AI sử dụng công nghệ Hybrid RAG để hỗ trợ người dân xử lý các tình huống khẩn cấp (thiên tai, cứu hộ) theo thời gian thực thay vì chỉ tiếp nhận phản ánh một chiều.
- Xây dựng cơ chế gửi báo cáo tự động lấy vị trí qua GPS kèm xác thực hình ảnh/video trực quan.
- Gợi ý khai thác cổng dữ liệu mở của Đà Nẵng (Open Data Da Nang) kết hợp phương pháp giả lập (mock data) dữ liệu sự cố dựa trên hệ tọa độ bản đồ số của các quận huyện.

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

- Tiếp thu ý tưởng tích hợp Chatbot cứu hộ khẩn cấp bằng Hybrid RAG để làm điểm nhấn công nghệ cho dự án.
- Sử dụng các hướng dẫn khai thác cấu trúc dữ liệu hành chính Đà Nẵng để thiết kế cơ sở dữ liệu ban đầu.

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

Nhóm đã cụ thể hóa luồng tiếp nhận phản ánh theo mô hình phân quyền chặt chẽ trên Backend (Java Spring Boot) gồm 4 đối tượng: Người dân (Citizen), Cán bộ ủy ban, Công an và Admin (lãnh đạo) nhằm đảm bảo tính thực tế, thay vì luồng xử lý chung chung do AI gợi ý.

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | |
| File liên quan | |
| Screenshot | |
| Kết quả chạy/test | |
| Link video demo | |
| Ghi chú khác | |

#### 4.6. Nhận xét cá nhân/nhóm

AI giúp nhóm nhanh chóng thoát khỏi lối tư duy rập khuôn của các hệ thống cũ, định hình được hướng đi đột phá về mặt công nghệ và tiết kiệm được nhiều thời gian trong việc định vị nguồn dữ liệu thực tế tại Đà Nẵng.

---

### Lần sử dụng AI số 2

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 16/05/2026 |
| Công cụ AI | Gemini |
| Mục đích sử dụng | Xác định cấu trúc Use Case chi tiết và gợi ý các thành phần giao diện (UI Components) cho tính năng gửi báo cáo sự cố. |
| Phần việc liên quan | Design / Frontend |
| Mức độ sử dụng | Hỗ trợ một phần |

#### 4.1. Prompt đã sử dụng

Xác định các Use Case chi tiết cho tính năng "Gửi phản ánh sự cố đô thị" của người dân trong hệ thống Listening City System. Thiết kế giao diện (UI Components) trên ReactJS cần những thành phần nào để tối ưu trải nghiệm người dùng khi họ đang ở ngoài đường và muốn báo cáo nhanh trên điện thoại?

#### 4.2. Kết quả AI gợi ý

AI đề xuất cấu trúc Use Case chi tiết bao gồm các bước: Định vị -> Tải lên media -> Phân loại -> Mô tả ngắn -> Gửi. Về mặt Frontend (ReactJS), AI gợi ý thiết kế hướng Mobile-first:

- Sử dụng nút hành động nổi (Floating Action Button) để mở nhanh form báo cáo.
- Tích hợp bản đồ số (Google Maps / Leaflet API) tự động bắt tọa độ GPS hiện tại.
- Thiết kế các nút chọn nhanh (Chips/Tags) loại sự cố (#NgậpLụt, #RácThải, #HỏngĐènĐường) để hạn chế việc người dùng phải nhập liệu bằng chữ khi đang di chuyển.

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

- Áp dụng toàn bộ tư duy thiết kế Mobile-first và các thành phần giao diện tiện ích (Map Component, Image Uploader, Quick Tags Selection) vào giao diện ReactJS của dự án.
- Sử dụng danh sách Use Case để làm khung sườn chuẩn hóa sơ đồ Use Case Diagram.

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

Cải tiến cốt lõi: Nhóm nhận thấy nếu bắt buộc đăng nhập sẽ làm giảm tỷ lệ báo cáo khi có sự cố khẩn cấp. Do đó, nhóm đã chỉnh sửa logic để cho phép người dân gửi báo cáo ẩn danh nhưng bổ sung cơ chế kiểm tra mã OTP qua SMS hoặc xác thực thiết bị để tránh spam dữ liệu rác.

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | |
| File liên quan | |
| Screenshot | |
| Kết quả chạy/test | |
| Link video demo | |
| Ghi chú khác | |

#### 4.6. Nhận xét cá nhân/nhóm

Nhóm học được các nguyên tắc quan trọng trong thiết kế trải nghiệm người dùng (UX) trên di động. Việc kết hợp gợi ý cấu trúc của AI giúp mã nguồn Frontend được chia tách thành các component khoa học, gọn gàng và dễ bảo trì hơn.

---

### Lần sử dụng AI số 3

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | |
| Công cụ AI | ChatGPT / Gemini / Claude / GitHub Copilot / Cursor / Antigravity / Khác |
| Mục đích sử dụng | |
| Phần việc liên quan | Requirement / Design / Database / Frontend / Backend / Testing / Debug / Report / Presentation / Other |
| Mức độ sử dụng | Hỗ trợ ý tưởng / Hỗ trợ một phần / Hỗ trợ nhiều / Sinh chính nội dung |

#### 4.1. Prompt đã sử dụng

Dán nguyên văn prompt đã hỏi AI tại đây.

#### 4.2. Kết quả AI gợi ý

Viết tại đây...

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

Viết tại đây...

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

Viết tại đây...

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | |
| File liên quan | |
| Screenshot | |
| Kết quả chạy/test | |
| Link video demo | |
| Ghi chú khác | |

#### 4.6. Nhận xét cá nhân/nhóm

Viết tại đây...

---

## IV. Bảng tổng hợp mức độ sử dụng AI

Đánh dấu mức độ AI hỗ trợ ở từng hạng mục.

| Hạng mục | Không dùng AI | AI hỗ trợ ít | AI hỗ trợ nhiều | AI sinh chính | Ghi chú |
|---|---|---|---|---|---|
| Phân tích yêu cầu | | | | | |
| Viết user story/use case | | | | | |
| Thiết kế database | | | | | |
| Thiết kế kiến trúc hệ thống | | | | | |
| Thiết kế giao diện | | | | | |
| Code frontend | | | | | |
| Code backend | | | | | |
| Debug lỗi | | | | | |
| Viết test case | | | | | |
| Kiểm thử sản phẩm | | | | | |
| Tối ưu code | | | | | |
| Viết báo cáo | | | | | |
| Làm slide thuyết trình | | | | | |

---

## V. Các lỗi hoặc hạn chế từ AI

Ghi lại các trường hợp AI trả lời sai, thiếu, chưa phù hợp hoặc sinh code không chạy.

| STT | Lỗi/hạn chế từ AI | Cách phát hiện | Cách xử lý/cải tiến |
|---|---|---|---|
| 1 | | | |
| 2 | | | |
| 3 | | | |

---

## VI. Kiểm chứng kết quả AI

Mô tả cách sinh viên/nhóm kiểm tra lại kết quả do AI gợi ý.

Có thể bao gồm:

- Chạy thử chương trình
- Viết test case
- So sánh với yêu cầu đề bài
- Kiểm tra output
- Đối chiếu tài liệu môn học
- Hỏi lại giảng viên
- Review cùng thành viên nhóm
- Kiểm tra lỗi bảo mật
- Kiểm tra bằng dữ liệu mẫu
- So sánh trước và sau khi dùng AI

**Nội dung kiểm chứng:** Viết tại đây...

---

## VII. Đóng góp cá nhân hoặc đóng góp nhóm

### 8.1. Đối với bài cá nhân

Mô tả phần sinh viên tự làm, phần AI hỗ trợ và phần đã tự cải tiến.

Viết tại đây...

### 8.2. Đối với bài nhóm

| Thành viên | MSSV | Nhiệm vụ chính | Có sử dụng AI không? | Minh chứng đóng góp |
|---|---|---|---|---|
| | | | Có / Không | |
| | | | Có / Không | |
| | | | Có / Không | |
| | | | Có / Không | |

---

## VIII. Reflection cuối bài

### 9.1. AI đã hỗ trợ em/nhóm ở điểm nào?

Viết tại đây...

### 9.2. Phần nào em/nhóm không sử dụng theo gợi ý của AI? Vì sao?

Viết tại đây...

### 9.3. Em/nhóm đã kiểm tra tính đúng đắn của kết quả AI như thế nào?

Viết tại đây...

### 9.4. Nếu không có AI, phần nào sẽ khó khăn nhất?

Viết tại đây...

### 9.5. Sau bài tập/project này, em/nhóm học được gì về môn học?

Viết tại đây...

### 9.6. Sau bài tập/project này, em/nhóm học được gì về cách sử dụng AI có trách nhiệm?

Viết tại đây...

---

## IX. Cam kết học thuật

Sinh viên/nhóm cam kết rằng:

- Nội dung AI hỗ trợ đã được ghi nhận trung thực.
- Không nộp nguyên văn kết quả AI mà không kiểm tra.
- Có khả năng giải thích các phần đã nộp.
- Chịu trách nhiệm về tính đúng đắn của sản phẩm cuối cùng.
- Hiểu rằng việc sử dụng AI không khai báo có thể ảnh hưởng đến kết quả đánh giá.

| Đại diện sinh viên/nhóm | Ngày xác nhận |
|---|---|
| Phạm Tuấn Việt | |
