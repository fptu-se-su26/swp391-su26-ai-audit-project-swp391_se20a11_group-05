# AI Audit Log

## 1. Thông tin chung

| Thông tin | Nội dung |
|---|---|
| Môn học | Software Development Project |
| Mã môn học | SWP391 |
| Lớp | SE20A11|
| Học kỳ | SU26 |
| Tên bài tập / Project | The Listening City Systems |
| Tên sinh viên / Nhóm | Phan Thanh Bình / Group05 |
| MSSV / Danh sách MSSV | DE190210 |
| Giảng viên hướng dẫn | Lê Thiện Nhật Quang |
| Ngày bắt đầu |  |
| Ngày hoàn thành |  |

---

## 2. Công cụ AI đã sử dụng

Đánh dấu các công cụ AI đã sử dụng trong quá trình thực hiện bài tập/project.

- [x] ChatGPT
- [x] Gemini
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

Ví dụ:

- Phân tích yêu cầu bài toán
- Gợi ý ý tưởng giải pháp
- Thiết kế database
- Thiết kế giao diện
- Viết code mẫu
- Debug lỗi
- Tối ưu code
- Viết test case
- Kiểm tra bảo mật
- Viết báo cáo
- Chuẩn bị slide thuyết trình
- Tìm hiểu công nghệ mới

### Mô tả mục tiêu sử dụng AI

```text
- Phân tích yêu cầu bài toán
- Gợi ý ý tưởng giải pháp
- Viết test case
- Viết báo cáo

Sử dụng AI để phân tích yêu cầu, gợi ý ý tưởng, viết test case, viết báo cáo, phân tích luồng nghiệp vụ, chia nhỏ bài toán để phân tích, tạo ra các use case, user story, các chức năng của hệ thống.

## 4. Nhật ký sử dụng AI chi tiết

> Mỗi lần sử dụng AI cho một phần quan trọng của bài tập/project, sinh viên cần ghi lại theo mẫu bên dưới.  
> Sinh viên/nhóm có thể nhân bản mẫu “Lần sử dụng AI” nhiều lần tùy theo số lần sử dụng AI thực tế.

---

### Lần sử dụng AI số 1

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 2026-05-16 |
| Công cụ AI | ChatGPT / Gemini / Claude |
| Mục đích sử dụng | Hỗ trợ ý tưởng |
| Phần việc liên quan | Requirement |
| Mức độ sử dụng | Hỗ trợ ý tưởng / Hỗ trợ một phần |

#### 4.1. Prompt đã sử dụng

```text
bạn là một BA có kinh nghiệm nhiều năm, hãy phân tích cho tôi về yêu cầu bài toán, luồng nghiệp vụ, các usecase cỏ bản phải có và liên quan về đề tài. đề tài của có tên là The Listening City Systems, người dân có thể phản ánh được các trường hợp xung quanh họ, chính quyền và công an có thể tiếp nhận phản ánh và xử lí yêu cầu cảu người dân, mục tiêu đề tài là có thể cải thiện đời sống cho người dân.
```

#### 4.2. Kết quả AI gợi ý

Tóm tắt nội dung AI đã trả lời hoặc gợi ý.

```text
- Mục tiêu: Xây dựng hệ thống để người dân phản ánh vấn đề đô thị và cơ quan chức năng tiếp nhận, xử lý minh bạch.
- Citizen: Người dân có thể đăng ký/đăng nhập, gửi phản ánh kèm mô tả, ảnh/video và vị trí, rồi theo dõi kết quả xử lý.
- Government Officer: Cán bộ chính quyền tiếp nhận, phân loại, phân công xử lý và cập nhật trạng thái phản ánh.
- Police Officer: Công an tiếp nhận và xử lý các phản ánh liên quan đến an ninh, trật tự hoặc tình huống khẩn cấp.
- Admin: Quản trị viên quản lý người dùng, vai trò hệ thống và danh mục loại phản ánh.
- Workflow thường: Người dân gửi phản ánh → hệ thống tiếp nhận → cơ quan xử lý → cập nhật trạng thái → người dân nhận kết quả.
- Workflow khẩn cấp: Người dân gửi phản ánh khẩn cấp → hệ thống chuyển ngay cho công an → xử lý ưu tiên → cập nhật kết quả.
- Use Cases cốt lõi: Đăng nhập, gửi phản ánh, xem trạng thái, tiếp nhận phản ánh, phân công xử lý, cập nhật tiến độ.
- Use Cases mở rộng: Chat/phản hồi, đánh giá chất lượng xử lý, thông báo tự động, dashboard thống kê.
- Trạng thái phản ánh: Submitted → Under Review → In Progress → Resolved → Closed.
- Dữ liệu chính: User, Role, Report, Category, Attachment, Notification, Status History.
- Scope khuyên dùng: Chỉ làm các chức năng cốt lõi để hệ thống hoàn chỉnh và dễ demo trong đồ án.
```

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

Mô tả rõ phần nào được sử dụng lại từ gợi ý của AI.

```text
- Workflow thường: Người dân gửi phản ánh → hệ thống tiếp nhận → cơ quan xử lý → cập nhật trạng thái → người dân nhận kết quả.
- Workflow khẩn cấp: Người dân gửi phản ánh khẩn cấp → hệ thống chuyển ngay cho công an → xử lý ưu tiên → cập nhật kết quả
- Use Cases mở rộng: Chat/phản hồi, đánh giá chất lượng xử lý, thông báo tự động, dashboard thống kê.
- Dữ liệu chính: User, Role, Report, Category, Attachment, Notification, Status History.
```

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

Mô tả sinh viên/nhóm đã thay đổi, kiểm tra, sửa lỗi hoặc cải tiến gì so với gợi ý ban đầu của AI.

```text
- Critical Thinking: AI xác định đúng actor, workflow và use case cốt lõi, nhưng một số đề xuất như AI detection hay analytics vượt quá scope thực tế của đồ án.

- Contextualization: AI không biết giới hạn thời gian, năng lực nhóm và quy trình xử lý thực tế của cơ quan chức năng tại Việt Nam.

- Creative Synthesis: Tôi đã chọn lọc các đề xuất, giữ lại chức năng cốt lõi và loại bỏ các tính năng quá phức tạp để phù hợp với đồ án.

Decision Ownership: Tôi quyết định xây dựng hệ thống với 4 actor chính và các use case cơ bản vì đủ nghiệp vụ, khả thi và dễ hoàn thành đúng tiến độ.
```

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit |  |
| File liên quan |  |
| Screenshot |  |
| Kết quả chạy/test |  |
| Link video demo |  |
| Ghi chú khác |  |

#### 4.6. Nhận xét cá nhân/nhóm

Sinh viên/nhóm học được gì sau lần sử dụng AI này?

```text
Viết tại đây...
```

---

### Lần sử dụng AI số 2

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 28/05/2026 |
| Công cụ AI | ChatGPT |
| Mục đích sử dụng | Hoàn thiện luồng backend + API cho use case upload media, khớp với frontend template |
| Phần việc liên quan | Backend / Frontend / Testing / Debug |
| Mức độ sử dụng | Hỗ trợ nhiều |

#### 4.1. Prompt da su dung

```text
You must ensure that this backend code must be able to connect with the frontend and must match the frontend template.
If there is any missing class for the usecase to work, please complete it for me and ensure the logic is correct for other members.
Make sure the code is standard so that when I merge into the product branch there will be no errors, explain in Vietnamese.
```

#### 4.2. Kết quả AI gợi ý

```text
AI đề xuất bổ sung đầy đủ lớp cho use case media và chuẩn hóa API theo frontend template:
- Thêm repository/DTO/service/controller cho media.
- Chuẩn endpoint upload media trong module feedback.
- Giữ tương thích ngược với flow cũ.
- Kiểm tra build trước khi merge.
```

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

```text
Nhóm đã áp dụng trực tiếp:
- Bổ sung các class con thiếu cho use case phản ánh kèm ảnh/video.
- Thêm endpoint media để frontend gọi thông nhất.
- Cập nhật helper frontend gọi đúng endpoint.
- Rà soát và đảm bảo backend khớp data shape frontend đang dùng.
```

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

```text
Nhóm tự chỉnh sửa/cải tiến:
- Chỉnh FeedbackService để xử lý an toàn khi frontend chưa gửi categoryId.
- Sửa mismatch endpoint giữa backend và helper frontend.
- Sửa lỗi trùng dòng fetch trong helper frontend.
- Chạy compile lại để đảm bảo không lỗi trước khi push PR.
```

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | 37217fd, 99ad3b8, a0692cf, 54a802f |
| File liên quan | Sources/Backend/src/main/java/com/example/smartcity/modules/feedback/service/FeedbackService.java; Sources/Backend/src/main/java/com/example/smartcity/modules/feedback/controller/FeedbackController.java; Sources/Backend/src/main/java/com/example/smartcity/modules/feedback/service/CitizenFeedbackMediaService.java; Sources/Backend/src/main/java/com/example/smartcity/modules/feedback/service/SupabaseStorageService.java; Sources/Frontend/src/lib/citizenFeedbackMediaApi.ts |
| Screenshot |  |
| Kết quả chạy/test | mvn -q -DskipTests compile: PASS; CICD build re-trigger thanh cong |
| Link video demo |  |
| Ghi chu khac | Tap trung vao compatibility backend-frontend de merge Product an toan |

#### 4.6. Nhận xét cá nhân/nhóm

```text
Sau lần sử dụng AI số 2, nhóm rút ra:
1) Task lớn cần chốt API contract trước rồi mới mở rộng chức năng.
2) AI giúp tăng tốc phân tích và đề xuất cấu trúc, nhưng vẫn phải tự kiểm chứng build/test.
3) Với project nhóm, ưu tiên an toàn merge và không phá flow cũ quan trọng hơn việc thêm quá nhiều thay đổi một lúc.
```

---
### Lần sử dụng AI số 3

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 02/06/2026 |
| Công cụ AI | ChatGPT |
| Mục đích sử dụng |  Thiết kế và triển khai GPS integration cho feedback|
| Phần việc liên quan | Backend / Frontend / API Design / Security |
| Mức độ sử dụng | Hỗ trợ ý tưởng / Hỗ trợ một phần / Sinh chính nội dung |

#### 4.1. Prompt đã sử dụng

```text
First use CodeGraph to understand the current code architecture.
Follow CLAUDE.md / AGENTS.md rules.
Use grilled tamarind before making.
I want to add GPS integration...
Citizens must allow location access to submit feedback.
Store latitude/longitude.
Use reverse geocoding to authenticate communes/wards.
Authorities can view reported location on map.
That location will be sent to the commune/ward unit where it will be processed.
Ask necessary questions first, then provide affected files, database changes, API design, implementation plan, testing strategy and risk.
Wait for approval before editing files.
```

#### 4.2. Kết quả AI gợi ý

```text
AI đã dùng CodeGraph để đọc kiến trúc hiện tại và phát hiện hệ thống đã có sẵn một phần GPS:
- Entity Feedback đã có latitude/longitude.
- Database feedbacks đã có latitude, longitude và location geometry.
- Frontend report.tsx đã gọi browser geolocation nhưng đang fallback sai về tọa độ Đà Nẵng mặc định.
- CivicMap đã dùng Leaflet/OpenStreetMap.
- WardController có endpoint /api/wards/locate nhưng trước đó chỉ là stub trả 404.

AI đề xuất giải pháp:
- Bắt buộc citizen cấp quyền GPS trước khi submit feedback.
- Không dùng tọa độ fallback giả.
- Backend tự resolve ward từ GPS, không tin wardId hardcode từ frontend.
- Dùng OpenStreetMap/Nominatim reverse geocoding để suy ra phường/xã.
- Cán bộ phường có thể xem pin phản ánh trên bản đồ.
```

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

```text
- Bổ sung LocationResolutionService để reverse geocoding GPS sang phường/xã.
- Sửa FeedbackRequest để latitude/longitude bắt buộc và validate range.
- Sửa FeedbackService để chỉ CITIZEN được gửi GPS khi tạo phản ánh, đồng thời backend tự resolve ward.
- Sửa /api/wards/locate để frontend có thể preview phường/xã từ GPS.
- Sửa report.tsx để chặn submit nếu người dân chưa cấp GPS.
- Xóa wardId hardcode = 1 khỏi payload frontend.
- Thêm bản đồ pin GPS cho WardDashboard.
```

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

```text
Critical Thinking:
AI ban đầu có thể đề xuất dùng reverse geocoding trực tiếp, nhưng nếu tin hoàn toàn vào frontend wardId thì vẫn có rủi ro gửi sai đơn vị xử lý. Nhóm quyết định backend phải là nơi xác định ward cuối cùng.

Contextualization:
Trong hệ thống The Listening City Systems, phản ánh của người dân phải được chuyển đúng phường/xã xử lý. Vì vậy vị trí GPS không chỉ để hiển thị bản đồ mà còn ảnh hưởng trực tiếp đến routing nghiệp vụ.

Creative Synthesis:
Nhóm kết hợp browser GPS ở frontend, endpoint /api/wards/locate, backend validation và reverse geocoding. Đồng thời giữ lại Leaflet/OpenStreetMap sẵn có thay vì thêm Google Maps để tránh tăng phụ thuộc/API key.

Decision Ownership:
Quyết định cuối cùng là GPS bắt buộc cho citizen feedback, không dùng fallback giả, backend tự resolve ward từ tọa độ. Lý do là đảm bảo dữ liệu phản ánh có vị trí thật, giảm sai lệch khi điều phối cho phường/xã.
```

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit |  |
| File liên quan |  |
| Screenshot |  |
| Kết quả chạy/test |  |
| Link video demo |  |
| Ghi chú khác |  |

#### 4.6. Nhận xét cá nhân/nhóm

```text
Viết tại đây...
```

---

### Lần sử dụng AI số 4

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 12/06/2026 |
| Công cụ AI | ChatGPT |
| Mục đích sử dụng | Nghiên cứu giải pháp thiết kế máy trạng thái (State Machine) và phản biện cơ chế chuyển đổi các trạng thái của phản ánh (Feedback Statuses) |
| Phần việc liên quan | Backend / Frontend / API Design |
| Mức độ sử dụng | Hỏi phân tích / Hỏi review / Hỏi kiểm chứng |

#### 4.1. Prompt đã sử dụng

```text
Tôi đang tự thiết kế luồng xử lý và chuyển đổi trạng thái cho các phản ánh (Feedback). Giao diện và API ban đầu cho phép cập nhật trạng thái tự do (Ví dụ: từ Đang xử lý chuyển ngược về Đang chờ, hoặc từ Đang gửi nhảy thẳng sang Hoàn thành mà không qua bước Đang tiếp nhận hay Đang xử lý).
Tôi thấy thiết kế này rất lỏng lẻo và dễ dẫn đến sai lệch dữ liệu báo cáo.
1. Hãy đề xuất một mô hình Máy trạng thái (State Machine) với các bước chuyển trạng thái (State Transitions) nghiêm ngặt nhất có thể. Cụ thể: các trạng thái nào được phép đi tiếp đến đâu, và trạng thái nào là điểm kết thúc (không thể chuyển tiếp)?
2. Làm thế nào để tự động hóa trạng thái: Ví dụ khi Cán bộ yêu cầu bổ sung thông tin (WAITING_INFO), rồi Người dân bổ sung thông tin thành công thì hệ thống phải tự động đưa về Đang xử lý (IN_PROGRESS) thay vì bắt cán bộ tiếp nhận lại?
3. Tại backend, làm thế nào để validate chặt chẽ ở tầng Service trước khi cập nhật DB để chặn các request cố tình thay đổi trạng thái trái phép?
Tôi muốn thảo luận và phản biện xem sơ đồ chuyển đổi trạng thái nào là tối ưu nhất cho bài toán đô thị này.
```

#### 4.2. Kết quả AI gợi ý

```text
AI đồng tình với lập luận của tôi và đề xuất phương án xây dựng máy trạng thái chi tiết:
- Thiết lập bản đồ cấu hình VALID_TRANSITIONS dạng Map<FeedbackStatus, Set<FeedbackStatus>> để chỉ định rõ các bước đi hợp lệ.
  + Ví dụ: SUBMITTED chỉ được chuyển sang PENDING_RECEIVE, IN_PROGRESS hoặc REJECTED.
  + RESOLVED và REJECTED là các trạng thái cuối cùng (trạng thái kết thúc), tập hợp trạng thái kế tiếp sẽ để rỗng.
- Luồng tự động khi bổ sung thông tin: Khi Citizen gửi bổ sung thông tin thành công qua endpoint /supplement, hệ thống sẽ tự động cập nhật trạng thái của Feedback từ WAITING_INFO thành IN_PROGRESS, đồng thời ghi log hành động PROVIDE_INFO.
- Backend Validation: Trong hàm changeStatus, thực hiện kiểm tra chéo:
  if (!VALID_TRANSITIONS.get(currentStatus).contains(newStatus)) {
      throw new CustomException("Không thể chuyển trạng thái...", 400);
  }
```

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

```text
Tôi đã tiếp thu và áp dụng các ý tưởng kỹ thuật cốt lõi sau vào mã nguồn:
- Cấu trúc cấu hình máy trạng thái VALID_TRANSITIONS ở backend để quản lý chặt chẽ trạng thái phản ánh.
- Logic tự động cập nhật trạng thái từ WAITING_INFO về IN_PROGRESS khi người dân thực hiện gửi thông tin bổ sung thành công.
- Ràng buộc kiểm tra trạng thái hợp lệ trước khi gọi lưu database tại phương thức changeStatus ở FeedbackService.
```

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

```text
Critical Thinking:
AI đề xuất một sơ đồ chuyển đổi trạng thái chung chung. Tuy nhiên, tôi phát hiện ra có một trường hợp đặc biệt: khi phản ánh thuộc diện khẩn cấp hoặc xử lý ưu tiên trước (PRE_EMPTIVE), hệ thống cần đi tắt qua một số bước nhưng sau đó sẽ kết thúc luôn. Tôi đã tinh chỉnh sơ đồ VALID_TRANSITIONS để đưa PRE_EMPTIVE vào trạng thái kết thúc (không chuyển tiếp) để bảo toàn tính toàn vẹn dữ liệu.

Contextualization:
Trong nghiệp vụ thực tế, khi chuyển đổi trạng thái sang REJECTED, cán bộ bắt buộc phải nhập lý do từ chối, và khi chuyển sang RESOLVED bắt buộc phải kiểm tra xem có tệp đính kèm nào mang mục đích RESOLUTION_EVIDENCE hay chưa. AI đề xuất chung chung, tôi đã tự viết thêm các đoạn mã kiểm tra điều kiện nghiệp vụ thực tế này tại changeStatus để ngăn chặn báo cáo ảo.

Creative Synthesis:
Tôi đã tự thiết kế thêm hệ thống ghi nhận lịch sử xử lý (Audit Logs) thông qua đối tượng FeedbackLog. Mọi hành động chuyển trạng thái (như SUBMIT, ACCEPT, REQUEST_INFO, PROVIDE_INFO, RESOLVE, REJECT) đều được lưu chi tiết kèm người thực hiện, lý do và deadline phản hồi (nếu có), giúp hiển thị một timeline cực kỳ trực quan ở frontend cho cả người dân và quản lý theo dõi.
```

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | 8fb2e7d, 29013ef |
| File liên quan | Sources/Backend/src/main/java/com/example/smartcity/modules/feedback/service/FeedbackService.java;<br>Sources/Backend/src/main/java/com/example/smartcity/modules/feedback/entity/FeedbackStatus.java;<br>Sources/Frontend/src/features/ward/WardFeedbackManagementPage.tsx |
| Screenshot | |
| Kết quả chạy/test | Đã chạy unit test FeedbackServiceTest và các case chuyển đổi trạng thái (chuyển đổi sai trả về lỗi BadRequest, tự động chuyển về IN_PROGRESS khi bổ sung thành công) đều vượt qua. |
| Link video demo | |
| Ghi chú khác | Tập trung hoàn toàn vào việc tự thiết kế, kiểm chứng luồng đi của trạng thái và bảo vệ tính toàn vẹn của dữ liệu nghiệp vụ. |

#### 4.6. Nhận xét cá nhân/nhóm

```text
Qua quá trình tự tìm tòi và phản biện giải pháp này:
1) Tôi nhận ra việc xây dựng một máy trạng thái (State Machine) chặt chẽ từ phía backend là cực kỳ quan trọng, nó ngăn chặn mọi hành vi thao túng dữ liệu thông qua việc bypass API thô.
2) Phản biện đề xuất của AI giúp tôi phát hiện ra các trường hợp đặc biệt (edge cases) như trạng thái ưu tiên PRE_EMPTIVE hay việc thiếu điều kiện bắt buộc kèm ảnh bằng chứng trước khi hoàn thành xử lý.
3) Lịch sử thay đổi trạng thái (Audit Log) là tính năng tối quan trọng để tăng tính minh bạch trong các hệ thống dịch vụ hành chính công.
```

---

## 5. Bảng tổng hợp mức độ sử dụng AI

Đánh dấu mức độ AI hỗ trợ ở từng hạng mục.

| Hạng mục | Không dùng AI | AI hỗ trợ ít | AI hỗ trợ nhiều | AI sinh chính | Ghi chú |
|---|:---:|:---:|:---:|:---:|---|
| Phân tích yêu cầu |  | ✔ |  |  | AI gợi ý khung chức năng đô thị thông minh ban đầu |
| Viết user story/use case |  | ✔ |  |  | Tham khảo cấu trúc mô tả của AI để viết chi tiết |
| Thiết kế database | ✔ |  |  |  | Nhóm tự thiết kế schema để phù hợp với PostgreSQL và pgvector |
| Thiết kế kiến trúc hệ thống | ✔ |  |  |  | Tuân thủ kiến trúc Spring Boot (Controller-Service-Repository) và React |
| Thiết kế giao diện |  | ✔ |  |  | Tự thiết kế UI bằng Tailwind CSS/Vanilla CSS, AI hỗ trợ chỉnh sửa bố cục nhỏ |
| Code frontend |  |  | ✔ |  | Tự code logic và UI, AI hỗ trợ code các component nhỏ |
| Code backend |  |  | ✔ |  | Tự code logic nghiệp vụ chính, AI gợi ý các hàm tiện ích và thuật toán tìm kiếm |
| Debug lỗi |  |  | ✔ |  | Dùng AI để tra cứu các mã lỗi Exception, lỗi cấu hình Spring Security |
| Viết test case |  | ✔ |  |  | AI gợi ý cấu trúc Mockito test case, nhóm tự viết logic test |
| Kiểm thử sản phẩm | ✔ |  |  |  | Kiểm thử thủ công trên trình duyệt và Postman |
| Tối ưu code |  | ✔ |  |  | AI gợi ý tối ưu hiệu năng SQL và xử lý bất đồng bộ |
| Viết báo cáo |  |  | ✔ |  | Hỗ trợ định dạng tài liệu, chau chuốt câu từ tiếng Việt/Anh |
| Làm slide thuyết trình |  | ✔ |  |  | AI gợi ý bố cục slide, nhóm tự thiết kế slide trên Canva |

---

## 6. Các lỗi hoặc hạn chế từ AI

Ghi lại các trường hợp AI trả lời sai, thiếu, chưa phù hợp hoặc sinh code không chạy.

| STT | Lỗi/hạn chế từ AI | Cách phát hiện | Cách xử lý/cải tiến |
|---:|---|---|---|
| 1 | AI đề xuất bảo mật phân quyền (BOLA/IDOR) bằng cách lọc/ẩn các nút ở Frontend thay vì kiểm tra ở Backend. | Tự phản biện thấy người dùng có thể dùng Postman gửi request trực tiếp để bypass UI. | Bổ sung hàm kiểm tra chéo `validateActionPermission` trực tiếp tại Backend Service Layer. |
| 2 | Đề xuất dùng thư viện bản đồ Google Maps và API Geocoding có phí, đồng thời không xử lý tốt trường hợp GPS bị nhiễu/null. | Khi chạy thử hệ thống báo lỗi thiếu API Key và không định vị được khi mất tín hiệu GPS. | Thay thế bằng OpenStreetMap (Nominatim) miễn phí và thêm fallback tự động nhận diện Phường dựa trên chuỗi địa chỉ người dùng nhập. |
| 3 | Khi hướng dẫn viết tính năng tìm trùng lặp phản ánh, AI sinh câu truy vấn SQL/JPQL tính khoảng cách cosine thông thường, không dùng được cho `pgvector`. | Khi chạy compile backend báo lỗi cú pháp truy vấn cơ sở dữ liệu PostgreSQL. | Nhóm tự tìm hiểu tài liệu của extension `pgvector` và sửa lại câu truy vấn Native Query sử dụng toán tử `<=>` và hàm địa lý `ST_DWithin`. |

---

## 7. Kiểm chứng kết quả AI

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

### Nội dung kiểm chứng

```text
Viết tại đây...
```

---

## 8. Đóng góp cá nhân hoặc đóng góp nhóm

### 8.1. Đối với bài cá nhân

Mô tả phần sinh viên tự làm, phần AI hỗ trợ và phần đã tự cải tiến.

```text
Viết tại đây...
```

### 8.2. Đối với bài nhóm

| Thành viên | MSSV | Nhiệm vụ chính | Có sử dụng AI không? | Minh chứng đóng góp |
|---|---|---|---|---|
|  |  |  | Có / Không |  |
|  |  |  | Có / Không |  |
|  |  |  | Có / Không |  |
|  |  |  | Có / Không |  |

---

## 9. Reflection cuối bài

### 9.1. AI đã hỗ trợ em/nhóm ở điểm nào?

```text
Viết tại đây...
```

### 9.2. Phần nào em/nhóm không sử dụng theo gợi ý của AI? Vì sao?

```text
Viết tại đây...
```

### 9.3. Em/nhóm đã kiểm tra tính đúng đắn của kết quả AI như thế nào?

```text
Viết tại đây...
```

### 9.4. Nếu không có AI, phần nào sẽ khó khăn nhất?

```text
Viết tại đây...
```

### 9.5. Sau bài tập/project này, em/nhóm học được gì về môn học?

```text
Viết tại đây...
```

### 9.6. Sau bài tập/project này, em/nhóm học được gì về cách sử dụng AI có trách nhiệm?

```text
Viết tại đây...
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
|  |  |
