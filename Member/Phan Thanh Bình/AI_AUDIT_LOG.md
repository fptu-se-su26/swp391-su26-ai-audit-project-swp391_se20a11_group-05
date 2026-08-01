# AI Audit Log

## 1. Thông tin chung

| Thông tin | Nội dung |
|---|---|
| Môn học | Software Development Project |
| Mã môn học | SWP391 |
| Lớp | SE20A11|
| Học kỳ | SU26 |
| Tên bài tập / Project | The City Connect |
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

### Lần sử dụng AI số 5

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 02/07/2026 |
| Công cụ AI | Antigravity / Claude |
| Mục đích sử dụng | Tham khảo ý kiến và nhờ sinh khung code mẫu để hiện thực hóa ý tưởng thiết kế "Chế độ thông báo" (Announcement Mode) và Menu tùy chọn chat |
| Phần việc liên quan | Backend / Frontend / UI Design |
| Mức độ sử dụng | Hỗ trợ một phần |

#### 4.1. Prompt đã sử dụng

```text
Tôi đang tự thiết kế tính năng hạn chế gửi tin nhắn cho người dân trong nhóm chat chiến dịch khi có thông báo quan trọng từ chính quyền (gọi là Announcement Mode).
Ý tưởng của tôi như sau:
1. Ban quản trị sẽ có một menu CampaignChatMenu (chứa Quản lý thông báo, Thư viện, Tin nhắn ghim) và một nút toggle bật/tắt chế độ thông báo này.
2. Khi bật, người dân thường sẽ bị ẩn ô nhập chat, thay vào đó hiển thị một banner thông báo màu sắc nổi bật giống kiểu của Zalo để họ biết họ đang bị chặn chat.
3. Trạng thái bật/tắt này phải được lưu trong DB backend để khi người dùng F5 hoặc vào lại nhóm chat vẫn không bị mất trạng thái.

Hãy gợi ý cho tôi cấu trúc code React hợp lý cho component CampaignChatMenu, và cách tổ chức luồng dữ liệu (data flow) từ thực thể Campaign (Backend) thông qua DTO để đồng bộ trực tiếp lên giao diện Frontend.
```

#### 4.2. Kết quả AI gợi ý

```text
AI đánh giá cao ý tưởng thiết kế trải nghiệm người dùng (UX) và đề xuất:
- Cung cấp khung code React (boilerplate) cho dropdown menu CampaignChatMenu.
- Gợi ý bổ sung thuộc tính boolean `announcementMode` vào Campaign Entity ở Backend, và truyền qua DTO CampaignResponse để Frontend dễ dàng bắt được trạng thái thực tế của phòng chat.
- Đưa ra đoạn code mẫu điều kiện render ở route `campaigns.$id.group-chat.tsx` để chuyển đổi giữa ô ChatInput và Banner thông báo.
```

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

```text
- Sử dụng khung cấu trúc code dropdown menu do AI sinh ra để tiết kiệm thời gian code giao diện thô.
- Áp dụng cấu trúc truyền dữ liệu thông qua DTO từ Backend lên Frontend để đồng bộ cờ `announcementMode`.
```

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

```text
Critical Thinking:
- AI gợi ý chỉ cần ẩn nút gửi tin nhắn hoặc hiển thị một đoạn text đơn giản. Tôi thấy thiết kế đó chưa đủ rõ ràng và có thể khiến người dân nghĩ ứng dụng bị lỗi. Do đó, tôi đã tự thiết kế một Banner thông báo bo góc, đổ bóng (style Premium) cùng với một nút "Tìm hiểu thêm". Khi bấm vào nút này sẽ kích hoạt Toast thông báo giải thích rõ ràng lý do phòng chat bị khóa.

Contextualization:
- Tránh việc cán bộ vô tình click nhầm nút toggle làm gián đoạn cuộc hội thoại của hàng ngàn người dân. Tôi đã tự viết thêm một Confirmation Dialog (hộp thoại xác nhận) ở Frontend trước khi gửi API yêu cầu bật/tắt chế độ thông báo lên Server.

Creative Synthesis & Decision Ownership:
- Tự thiết kế và viết CSS hoàn chỉnh cho component CampaignChatMenu và Banner thông báo để đồng bộ với ngôn ngữ thiết kế chung của dự án (màu sắc, khoảng cách, font chữ).
- Viết logic xử lý lỗi kết nối: nếu API toggle thất bại, giao diện Frontend sẽ tự động quay về trạng thái cũ và hiển thị thông báo lỗi cho cán bộ.
```

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | |
| File liên quan | Sources/Frontend/src/components/chat/CampaignChatMenu.tsx;<br>Sources/Frontend/src/routes/campaigns.$id.group-chat.tsx;<br>Sources/Backend/src/main/java/com/example/smartcity/modules/campaign/service/CampaignServiceImpl.java;<br>Sources/Backend/src/main/java/com/example/smartcity/modules/campaign/entity/Campaign.java |
| Screenshot | |
| Kết quả chạy/test | Đã chạy thử thực tế và build thành công. Khi tài khoản người dân vào nhóm chat đang bật Announcement Mode, thanh chat lập tức chuyển sang banner thông báo chặn gửi tin nhắn, bấm "Tìm hiểu thêm" hiển thị Toast chuẩn xác. |
| Link video demo | |
| Ghi chú khác | Hoàn toàn tự chủ động thiết kế luồng UI/UX và logic phân quyền. |

#### 4.6. Nhận xét cá nhân/nhóm

```text
1) Việc tự nghiên cứu và lên thiết kế chi tiết trước khi hỏi AI giúp tôi làm chủ được mã nguồn, AI chỉ đóng vai trò là một người trợ lý viết code mẫu giúp tăng tốc tiến độ.
2) Thiết kế giao diện hướng đến trải nghiệm người dùng (UX) tốt luôn đòi hỏi sự tỉ mỉ và tư duy thực tế của lập trình viên, điều mà AI khó tự động tối ưu hoàn hảo được.
```

---

### Lần sử dụng AI số 6

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 02/07/2026 |
| Công cụ AI | Antigravity / Gemini |
| Mục đích sử dụng | Tối ưu hóa hiệu năng gửi tin nhắn/ảnh bằng kỹ thuật Optimistic UI Updates và cơ chế upload nhiều ảnh song song (parallel multi-image upload) |
| Phần việc liên quan | Frontend / Hook Logic / API Integration |
| Mức độ sử dụng | Hỗ trợ nhiều |

#### 4.1. Prompt đã sử dụng

```text
Tôi đang viết tính năng gửi nhiều ảnh đính kèm (multi-image upload) trong chat chiến dịch. Để tối ưu trải nghiệm, tôi muốn tin nhắn và ảnh hiển thị ngay lập tức lên khung chat dưới trạng thái "đang gửi" (loading) mà không cần đợi API tải ảnh và API gửi tin nhắn hoàn tất (áp dụng Optimistic UI). 
Hãy hướng dẫn tôi cách thiết lập state trong hook useCampaigns.ts để:
1. Chèn ngay tin nhắn tạm thời kèm ảnh tạm (dùng local blob URL) vào danh sách tin nhắn hiện tại.
2. Thực hiện upload đồng thời nhiều file ảnh bằng Promise.all.
3. Khi API phản hồi thành công, thay thế tin nhắn tạm bằng dữ liệu thực tế từ database. Nếu thất bại, tự động rollback (xóa tin nhắn tạm) và báo lỗi cho người dùng.
```

#### 4.2. Kết quả AI gợi ý

```text
AI đề xuất giải pháp chi tiết:
- Sử dụng UUID tạm thời (Client-side generated ID) cho tin nhắn gửi đi để quản lý trạng thái hiển thị.
- Tạo danh sách URL ảnh tạm thời bằng `URL.createObjectURL(file)` để preview lập tức trên khung chat.
- Cách viết `Promise.all` gom các request upload ảnh song song để rút ngắn thời gian phản hồi từ server.
- Sử dụng cấu trúc `try-catch-finally` để nếu phát sinh bất kỳ lỗi upload nào, sẽ thực hiện cập nhật lại state của hook để loại bỏ tin nhắn tạm đó (Rollback state).
```

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

```text
- Sử dụng mô hình quản lý local state với UUID tạm thời để cập nhật tức thì (Optimistic UI) trong useCampaigns.ts.
- Sử dụng giải pháp `Promise.all` để tối ưu hóa việc upload file song song lên Supabase Storage/Server.
```

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

```text
Critical Thinking:
- AI đề xuất một giải pháp rollback đơn giản là xóa sạch tin nhắn tạm khi có lỗi. Tuy nhiên, trong thực tế, nếu người dùng gửi 3 ảnh mà chỉ lỗi 1 ảnh, việc xóa sạch cả tin nhắn và các ảnh còn lại rất gây ức chế. Tôi đã tự cải tiến cấu trúc tin nhắn tạm bằng cách theo dõi trạng thái của từng ảnh riêng biệt (`AttachmentStatus`). Ảnh nào lỗi sẽ hiển thị nút "Gửi lại" (Retry), ảnh nào thành công sẽ giữ nguyên.

Contextualization:
- Tránh rò rỉ bộ nhớ (Memory Leak) do các URL tạm thời (`URL.createObjectURL`). Tôi tự viết thêm hàm dọn dẹp (clean-up) bằng `URL.revokeObjectURL` trong hook useEffect/finally block ngay sau khi quá trình upload hoàn tất hoặc bị hủy.

Creative Synthesis & Decision Ownership:
- Tự thiết kế Responsive Grid Layout tại component ChatBubble để hiển thị ảnh đính kèm: tự động điều chỉnh bố cục đẹp mắt tùy thuộc vào số lượng ảnh gửi lên (1 ảnh chiếm toàn bộ, 2 ảnh chia đôi, 3-4 ảnh dạng grid 2x2).
- Tích hợp thêm AbortController để cho phép người dùng bấm hủy (Cancel) tiến trình upload ảnh nếu tệp quá nặng hoặc gửi nhầm.
```

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | |
| File liên quan | Sources/Frontend/src/hooks/useCampaigns.ts;<br>Sources/Frontend/src/routes/campaigns.$id.group-chat.tsx;<br>Sources/Backend/src/main/java/com/example/smartcity/modules/campaign/service/CampaignServiceImpl.java |
| Screenshot | |
| Kết quả chạy/test | Đã chạy kiểm thử gửi đồng thời 4 ảnh dung lượng lớn: ảnh hiển thị dạng mờ kèm icon loading ngay lập tức trên UI, sau khi server phản hồi thành công, ảnh chuyển sang trạng thái hiển thị rõ nét mà không làm giật khung chat. |
| Link video demo | |
| Ghi chú khác | Nâng cao trải nghiệm người dùng bằng xử lý bất đồng bộ phức tạp ở Client. |

#### 4.6. Nhận xét cá nhân/nhóm

```text
1) Kỹ thuật Optimistic UI Updates giúp cảm giác ứng dụng phản hồi nhanh hơn gấp nhiều lần, rất quan trọng đối với các tính năng mang tính tương tác thời gian thực như Group Chat.
2) Việc tự xử lý rollback chi tiết tới từng tệp đính kèm thay vì toàn bộ tin nhắn giúp tăng độ tin cậy và sự hài lòng từ phía người dùng cuối.

---

### Lần sử dụng AI số 7

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 06/07/2026 |
| Công cụ AI | Antigravity / Gemini |
| Mục đích sử dụng | Tái cấu trúc logic điểm danh chiến dịch (Decouple Attendance from Status) |
| Phần việc liên quan | Backend / Frontend / API Design / Refactoring |
| Mức độ sử dụng | Hỗ trợ một phần |

#### 4.1. Prompt đã sử dụng

```text
Tôi đang tối ưu lại hệ thống điểm danh chiến dịch. Hiện tại, khi đánh dấu vắng mặt, hệ thống đang cập nhật joinStatus = 'NO_SHOW'. Điều này dẫn đến việc tình nguyện viên bị mất trạng thái APPROVED ban đầu (ảnh hưởng đến quyền tham gia chat nhóm hoặc xem chi tiết chiến dịch). 
Tôi muốn chuyển sang phương án: giữ nguyên joinStatus = 'APPROVED' nhưng dùng cờ attended = false và ghi nhận thời điểm attendedAt.
1. Hãy giúp tôi rà soát các hàm markNoShow, bulkSaveAttendance trong CampaignServiceImpl và autoEndExpiredCampaigns trong scheduler xem cần sửa đổi gì.
2. Để đếm số lần vắng mặt tương thích ngược với dữ liệu cũ (vẫn có bản ghi joinStatus = 'NO_SHOW'), tôi nên viết câu query JPA như thế nào để tối ưu hiệu năng?
```

#### 4.2. Kết quả AI gợi ý

- Gợi ý sửa đổi logic trong `CampaignServiceImpl` và `CampaignScheduler`: thay vì đổi `joinStatus` sang `NO_SHOW`, giữ nguyên `APPROVED`, chỉ gán `attended = false` và lưu thời gian `attendedAt`.
- Đề xuất câu truy vấn JPA sử dụng `@Query` lồng toán tử logic `OR` để đếm chính xác số lần vắng mặt của tình nguyện viên cho cả hai trường hợp (cũ và mới).
- Gợi ý điều chỉnh logic render tab ở React frontend để kiểm tra cả hai điều kiện trên.

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

- Áp dụng cấu trúc câu truy vấn JPA `@Query` lồng logic `OR` vào `CampaignParticipantRepository.java`.
- Sử dụng khung logic được đề xuất cho việc cập nhật logic ở `CampaignServiceImpl.java` và `CampaignScheduler.java`.

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

- **Critical Thinking & Decision Ownership:** Nhóm nhận định việc xóa thông tin người duyệt (`approvedBy`, `approvedAt`) khi tình nguyện viên vắng mặt (như AI ban đầu đề xuất) là không hợp lý, vì họ vẫn được duyệt tham gia trước đó. Nhóm quyết định giữ lại các thông tin này để phục vụ mục đích kiểm toán sau này.
- **Contextualization:** Chỉnh sửa thêm bộ lọc danh sách trong `CitizenProfileModal.tsx` và badge hiển thị trong `WardCampaignDetailPage.tsx` để đồng bộ hoàn chỉnh giao diện, tránh tình trạng giao diện hiển thị sai lệch thông tin điểm danh.

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | |
| File liên quan | Sources/Backend/src/main/java/com/example/smartcity/modules/campaign/repository/CampaignParticipantRepository.java;<br>Sources/Backend/src/main/java/com/example/smartcity/modules/user/mapper/UserMapper.java;<br>Sources/Backend/src/main/java/com/example/smartcity/modules/campaign/service/CampaignServiceImpl.java;<br>Sources/Backend/src/main/java/com/example/smartcity/modules/campaign/job/CampaignScheduler.java;<br>Sources/Frontend/src/components/chat/CitizenProfileModal.tsx;<br>Sources/Frontend/src/features/ward/WardCampaignDetailPage.tsx |
| Screenshot | |
| Kết quả chạy/test | mvn compile: PASS; npx tsc --noEmit: PASS |
| Link video demo | |
| Ghi chú khác | |

#### 4.6. Nhận xét cá nhân/nhóm

```text
Nhóm nhận thức rõ tầm quan trọng của việc tách biệt cấu trúc nghiệp vụ (trạng thái đăng ký và kết quả thực tế) để dữ liệu không bị xung đột, đồng thời luôn chủ động phản biện các đề xuất của AI để giữ lại các thông tin lưu trữ cần thiết cho hệ thống kiểm toán sau này.
```
---

### Lần sử dụng AI số 8

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 06/07/2026 |
| Công cụ AI | Antigravity / Gemini |
| Mục đích sử dụng | Chức năng Xem lịch sử hoạt động của Tình nguyện viên (Volunteer Activity Summary) |
| Phần việc liên quan | Frontend / Backend / UI Design / Security |
| Mức độ sử dụng | Hỗ trợ nhiều |

#### 4.1. Prompt đã sử dụng

```text
Tôi muốn tích hợp thêm tính năng xem tóm tắt lịch sử hoạt động và số lần vắng mặt của Tình nguyện viên ngay trong Citizen Profile Modal dành cho Cán bộ.
1. Ở Backend, tôi nên bổ sung những API và Query Method nào để lấy được lịch sử tham gia sắp xếp theo thời gian mới nhất?
2. Ở Frontend, làm thế nào để hiển thị danh sách này trực quan, hỗ trợ click-to-expand để xem chi tiết lý do vắng mặt khi click vào thẻ thống kê?
```

#### 4.2. Kết quả AI gợi ý

- Đề xuất tạo API GET `/api/participants/user/{userId}` được phân quyền cho cán bộ và query sắp xếp theo thời gian chiến dịch bắt đầu giảm dần (`orderByCampaign_StartTimeDesc`).
- Gợi ý cấu trúc React component hiển thị thống kê dạng thẻ (Cards) đi kèm danh sách chi tiết chiến dịch có phân chia tab "Tham gia" và "Vắng mặt".
- Đưa ra mẫu code kiểm tra trạng thái vắng mặt và hiển thị lý do nếu có.

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

- Áp dụng các DTO và endpoint API mới ở Backend.
- Sử dụng cấu trúc hiển thị danh sách hoạt động và toggle click-to-expand trong `CitizenProfileModal.tsx`.

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

- **Critical Thinking & Security:** Nhóm chủ động viết thêm tầng kiểm tra phân quyền dữ liệu (`existsByCitizenIdAndWardId`) ở Backend Service. Điều này đảm bảo cán bộ phường chỉ được phép xem thông tin lịch sử của công dân thuộc khu vực phường đó quản lý, ngăn chặn lỗ hổng IDOR/BOLA.
- **Contextualization:** Chỉnh sửa hiển thị định dạng ngày giờ bằng JS Date API tiếng Việt đơn giản không cần Moment.js hay Day.js để tối ưu hóa bundle size của Frontend.

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | |
| File liên quan | Sources/Backend/src/main/java/com/example/smartcity/modules/campaign/dto/CampaignParticipantResponse.java;<br>Sources/Backend/src/main/java/com/example/smartcity/modules/campaign/repository/CampaignParticipantRepository.java;<br>Sources/Backend/src/main/java/com/example/smartcity/modules/campaign/service/CampaignServiceImpl.java;<br>Sources/Backend/src/main/java/com/example/smartcity/modules/campaign/controller/CampaignController.java;<br>Sources/Frontend/src/lib/api.ts;<br>Sources/Frontend/src/components/chat/CitizenProfileModal.tsx |
| Screenshot | |
| Kết quả chạy/test | mvn compile: PASS; npx tsc --noEmit: PASS |
| Link video demo | |
| Ghi chú khác | |

#### 4.6. Nhận xét cá nhân/nhóm

```text
Việc thiết kế trải nghiệm người dùng drill-down kết hợp bảo mật dữ liệu ở cấp độ Service layer (Data-level authorization) giúp bảo vệ thông tin cá nhân của người dân một cách tuyệt đối, đồng thời cán bộ vẫn nắm bắt hồ sơ một cách khoa học.
```

---

### Lần sử dụng AI số 9

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 06/07/2026 |
| Công cụ AI | Antigravity / Gemini |
| Mục đích sử dụng | Khắc phục lỗi hiển thị sai lệch trạng thái chiến dịch theo thời gian (Campaign Status Mismatch Fix) |
| Phần việc liên quan | Backend / Frontend / Timezone Alignment / Bug Fix |
| Mức độ sử dụng | Hỗ trợ một phần |

#### 4.1. Prompt đã sử dụng

```text
Tôi nhận thấy trạng thái chiến dịch hiển thị không chính xác. Mặc dù chiến dịch chưa đến giờ bắt đầu trên thực tế, hệ thống vẫn hiển thị trạng thái là "Đang diễn ra" (IN_PROGRESS) thay vì "Chưa diễn ra". 
Hãy giúp tôi rà soát cơ chế tính toán trạng thái temporal của chiến dịch trên frontend (campaignStore.ts) và backend (CampaignServiceImpl.java), tìm nguyên nhân lệch múi giờ giữa UTC và giờ địa phương và đề xuất cách so sánh thời gian chuẩn xác nhất.
```

#### 4.2. Kết quả AI gợi ý

- Chỉ ra nguyên nhân do sự lệch múi giờ khi so sánh chuỗi ISO String ở client (sử dụng thời gian cục bộ của trình duyệt) và server (sử dụng thời gian hệ thống UTC/UTC+7).
- Đề xuất chuyển đổi thời gian về đối tượng `Date` chuẩn và thực hiện so sánh số miligiây (milliseconds) thay vì so sánh chuỗi thô.
- Cung cấp đoạn mã tối ưu hóa hàm kiểm tra trạng thái trong `campaignStore.ts`.

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

- Áp dụng phương thức so sánh thời gian qua việc đưa về cùng múi giờ cục bộ của Việt Nam ở frontend và backend.

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

- **Critical Thinking:** Nhóm tự nhận thấy nếu chỉ sửa ở Frontend thì API trả về từ Backend vẫn hiển thị trạng thái không nhất quán khi gọi API lấy danh sách. Vì thế nhóm chủ động đồng bộ hàm lấy trạng thái `status` tại lớp Entity/Service ở Backend để đảm bảo dữ liệu trả về luôn trùng khớp 100% với Frontend.
- **Contextualization:** Cập nhật lại các bộ lọc lọc chiến dịch theo trạng thái ở trang quản lý WardDashboard để đồng bộ tuyệt đối trạng thái temporal.

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | |
| File liên quan | Sources/Frontend/src/lib/campaignStore.ts;<br>Sources/Backend/src/main/java/com/example/smartcity/modules/campaign/service/CampaignServiceImpl.java;<br>Sources/Backend/src/main/java/com/example/smartcity/modules/campaign/entity/Campaign.java |
| Screenshot | |
| Kết quả chạy/test | mvn compile: PASS; npx tsc --noEmit: PASS |
| Link video demo | |
| Ghi chú khác | |

#### 4.6. Nhận xét cá nhân/nhóm

```text
Việc xử lý đồng bộ thời gian trên cả 2 phía Client và Server giúp loại bỏ hoàn toàn các lỗi hiển thị do lệch múi giờ của người dùng, mang lại trải nghiệm chính xác tuyệt đối về tiến độ chiến dịch.
```

---

### Lần sử dụng AI số 10

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 07/07/2026 |
| Công cụ AI | Antigravity / Gemini |
| Mục đích sử dụng | Cải thiện bố cục giao diện và tận dụng không gian hiển thị của khung chat nhóm chiến dịch |
| Phần việc liên quan | Frontend / UI Design / Code Quality |
| Mức độ sử dụng | Hỗ trợ một phần |

#### 4.1. Prompt đã sử dụng

```text
mình muốn cải thiện lại tại mình thấy hơi bị nhỏ ấy với lại 2 bên tin nhắn tháy còn dư ra nhièu
```

#### 4.2. Kết quả AI gợi ý

- Nhận diện các lớp giới hạn chiều ngang của khung chat là `max-w-2xl` và `max-w-3xl` đang thu hẹp giao diện và tạo khoảng trống thừa ở 2 bên.
- Đề xuất tăng giới hạn chiều ngang của khung chat và thanh nhập liệu lên `max-w-5xl`.
- Gợi ý nâng kích thước thanh chat input từ `h-9` lên `h-11` kèm kích thước font chữ và icon tương ứng để cân đối với giao diện rộng hơn.

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

- Áp dụng thay đổi từ `max-w-3xl` / `max-w-2xl` sang `max-w-5xl` cho khung tin nhắn và footer tại cả route của người dân (`campaigns.$id.group-chat.tsx`) và dashboard của cán bộ phường (`WardChatDashboardPage.tsx`).
- Áp dụng tăng chiều cao input từ `h-9` lên `h-11` và cỡ font chữ lên `text-sm`.

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

- **Critical Thinking & Refactoring:** Khi thay đổi kích thước khung chat, sinh viên nhận thấy tiêu đề nhóm chat và mô tả số lượng thành viên ở header cũng bị nhỏ bất đối xứng so với khung chat mới. Sinh viên đã chủ động tăng kích thước font chữ tiêu đề từ `text-xs` lên `text-sm`/`text-base` và thành viên từ `text-[10px]` lên `text-xs` để đồng bộ tỷ lệ.
- **Code Quality Guard:** Sinh viên chủ động rà soát toàn bộ các cảnh báo linter trong file `campaigns.$id.group-chat.tsx` liên quan đến ép kiểu `any` (quy tắc `@typescript-eslint/no-explicit-any`), tự viết lại kiểu dữ liệu chặt chẽ cho catch error block (`err: unknown`) và `chatError` state.
- **Verification:** Chạy linter (`eslint`) và typecheck (`tsc --noEmit`) thủ công để đảm bảo các thay đổi sạch 100% trước khi merge.

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | |
| File liên quan | Sources/Frontend/src/features/ward/WardChatDashboardPage.tsx;<br>Sources/Frontend/src/routes/campaigns.$id.group-chat.tsx |
| Screenshot | |
| Kết quả chạy/test | npx tsc --noEmit: PASS; npx eslint: PASS |
| Link video demo | |
| Ghi chú khác | |

#### 4.6. Nhận xét cá nhân/nhóm

```text
Việc căn chỉnh giao diện không chỉ đơn thuần là thay đổi một thuộc tính width mà cần rà soát lại sự cân đối của tất cả các phần tử xung quanh (như font-size, line-height, icon-size). Đồng thời, việc tận dụng cơ hội refactor để dọn dẹp cảnh báo ép kiểu 'any' giúp nâng cao độ tin cậy của mã nguồn TypeScript.
```

---

### Lần sử dụng AI số 11

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 09/07/2026 |
| Công cụ AI | Antigravity / Gemini |
| Mục đích sử dụng | Thiết kế và triển khai logic tự động cấm tham gia chiến dịch (3 lần vắng mặt) trong CampaignScheduler |
| Phần việc liên quan | Backend / Scheduler / Campaign Ban Logic |
| Mức độ sử dụng | Hỗ trợ ý tưởng / Hỗ trợ một phần |

#### 4.1. Prompt đã sử dụng

```text
Tôi muốn triển khai logic tự động cấm người dùng tham gia chiến dịch nếu họ vắng mặt đủ 3 lần. 
Mỗi khi CampaignScheduler quét vào cuối ngày (autoEndExpiredCampaigns), hãy đếm số lần vắng mặt của citizen. 
Nếu vắng mặt đủ 3 lần, gán thuộc tính cấm. 
Hãy gợi ý cách viết câu query động đếm số lần vắng mặt từ bảng CampaignParticipant và cách update.
```

#### 4.2. Kết quả AI gợi ý

- Đề xuất chạy truy vấn `COUNT` động qua tất cả các citizen đang tham gia chiến dịch mỗi khi scheduler quét kết thúc chiến dịch.
- Khuyên không nên lưu trữ cờ vật lý trong bảng User (ví dụ: `isCampaignBanned`) để tránh dư thừa dữ liệu (redundancy) mà nên tính toán động qua database query.

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

- Ý tưởng cấu trúc scheduler chạy vào cuối ngày để kết thúc chiến dịch và cập nhật thông báo cảnh cáo vắng mặt lần 2, thực hiện cấm khi đạt threshold lần 3.

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

- **Critical Thinking & Performance optimization:** Sinh viên phản biện và bác bỏ đề xuất dùng query `COUNT` động của AI trên diện rộng vì nó sẽ gây thắt nút cổ chai hiệu năng (O(N) database reads trên bảng lớn). Thay vào đó, sinh viên quyết định thiết kế cờ vật lý `isCampaignBanned`, `warningCount` và `lastCampaignUnbanAt` lưu trực tiếp trong entity `User`. Điều này giúp việc kiểm tra điều kiện cấm chỉ mất `O(1)` khi người dùng đăng ký chiến dịch mới.
- **Timezone Safety:** Tự viết logic milliseconds comparison sử dụng múi giờ Việt Nam (GMT+7) trong scheduler để so sánh thời gian chính xác, tránh việc scheduler chạy lệch múi giờ dẫn đến cấm nhầm.
- **Absence Warning Integration:** Tự bổ sung thêm logic kiểm tra nếu `noShowCount == 2` thì gửi email cảnh cáo người dùng trước khi bị ban chính thức.

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | |
| File liên quan | Sources/Backend/src/main/java/com/example/smartcity/modules/campaign/job/CampaignScheduler.java;<br>Sources/Backend/src/main/java/com/example/smartcity/modules/campaign/service/CampaignServiceImpl.java |
| Screenshot | |
| Kết quả chạy/test | mvn compile: PASS; scheduler chạy đúng chu kỳ và gửi mail/cảnh báo thành công |
| Link video demo | |
| Ghi chú khác | |

#### 4.6. Nhận xét cá nhân/nhóm

```text
Ý tưởng của AI thường đi theo hướng đơn giản và lý thuyết (tính toán động để tránh redundancy). Tuy nhiên, khi đối chiếu với hiệu năng thực tế của hệ thống production lớn, các thuộc tính cờ vật lý và warning count lưu trong DB giúp giảm tải truy vấn và tăng tốc độ xử lý hơn rất nhiều.
```

---

### Lần sử dụng AI số 12

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 10/07/2026 |
| Công cụ AI | Antigravity / Gemini |
| Mục đích sử dụng | Thiết kế cơ chế gửi đơn giải trình và duyệt đơn giải trình (Appeal Submission & Review Flow) |
| Phần việc liên quan | Backend / Frontend / Security (BOLA) |
| Mức độ sử dụng | Hỗ trợ một phần |

#### 4.1. Prompt đã sử dụng

```text
Tôi muốn thiết kế tính năng gửi đơn giải trình cho người dân khi bị cấm và giao diện duyệt đơn cho Cán bộ.
1. Khi được duyệt giải trình, reset trạng thái cấm của người dân và xóa lịch sử vắng mặt của họ trong DB để họ có thể đăng ký lại.
2. Hãy gợi ý code API duyệt đơn và giao diện hiển thị danh sách đơn giải trình đang chờ ở Ward Dashboard.
```

#### 4.2. Kết quả AI gợi ý

- Đề xuất xóa (delete) hoặc đổi trạng thái các bản ghi `CampaignParticipant` cũ liên quan đến vắng mặt của user để reset số lần vắng mặt về 0.
- Gợi ý phân quyền cơ bản bằng cách check vai trò `Role.WARD_STAFF` hoặc `Role.SUPER_ADMIN` tại API controller.

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

- Cấu trúc React UI hiển thị danh sách đơn giải trình và các modal/form duyệt/từ chối đơn tại Ward Blacklist page.

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

- **Critical Thinking & Audit Trail:** Sinh viên phản biện rằng việc xóa bản ghi tham gia chiến dịch cũ (hoặc đổi trạng thái vắng mặt thành có mặt) như AI đề xuất là phá hỏng tính toàn vẹn dữ liệu lịch sử (Audit Trail). Sinh viên quyết định giữ nguyên toàn bộ lịch sử vắng mặt, giải quyết bằng cách thêm trường `lastCampaignUnbanAt` trong `User` và đếm số lần vắng mặt *sau* thời điểm unban gần nhất (`countNoShowCampaignsAfter`), đảm bảo giữ nguyên lịch sử hoạt động để cán bộ tra cứu.
- **BOLA/IDOR Security Guard:** Gợi ý của AI chỉ check vai trò `Role.WARD_STAFF` chung chung ở Controller. Điều này dẫn đến lỗ hổng BOLA (Broken Object Level Authorization): cán bộ phường A có thể duyệt đơn của công dân thuộc phường B bằng cách gọi API trực tiếp với `appealId` của phường B. Sinh viên đã tự bổ sung check chéo ward ID: `appeal.getCitizen().getWard().getId().equals(reviewer.getWard().getId())` trực tiếp tại Service layer để bảo vệ dữ liệu.
- **Deep-linking & Navigation:** Tự thiết kế luồng deep-linking từ Notification ID đến tab giải trình trong Ward Dashboard để cán bộ click trực tiếp là mở ngay chi tiết đơn giải trình tương ứng.

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | |
| File liên quan | Sources/Backend/src/main/java/com/example/smartcity/modules/campaign/service/CampaignAppealServiceImpl.java;<br>Sources/Frontend/src/features/ward/WardBlacklistPage.tsx;<br>Sources/Frontend/src/features/ward/WardDashboard.tsx |
| Screenshot | |
| Kết quả chạy/test | mvn test -Dtest=CampaignAppealServiceImplTest: PASS; npx tsc --noEmit: PASS |
| Link video demo | |
| Ghi chú khác | |

#### 4.6. Nhận xét cá nhân/nhóm

```text
Luôn cần đặt tính toàn vẹn của dữ liệu (Audit Trail) và bảo mật tầng ứng dụng (BOLA/IDOR checking) lên hàng đầu. AI thường chỉ đưa ra các demo ngắn gọn, bỏ qua các kiểm soát phân quyền chéo địa bàn hành chính, lập trình viên cần tự chủ động thiết kế lớp bảo mật này.
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
| 4 | AI đề xuất tính toán số lần vắng mặt động bằng `COUNT` trong scheduler qua toàn bộ danh sách citizen. | Phân tích hiệu năng, thấy `O(N)` query trên bảng lớn gây thắt nút cổ chai. | Thêm cờ vật lý `isCampaignBanned`, `warningCount` và `lastCampaignUnbanAt` trong bảng `users` để kiểm tra `O(1)`. |
| 5 | AI đề xuất xóa hoặc sửa đổi trạng thái của các bản ghi vắng mặt cũ trong DB để reset số lần vắng mặt về 0 khi duyệt đơn. | Phản biện nghiệp vụ, nhận thấy việc này phá vỡ tính toàn vẹn dữ liệu lịch sử (Audit Trail). | Lưu giữ nguyên bản ghi lịch sử, thêm trường `lastCampaignUnbanAt` và chỉ đếm các lần vắng mặt phát sinh sau thời điểm unban đó. |
| 6 | AI đề xuất duyệt đơn giải trình chỉ check vai trò `Role.WARD_STAFF` chung chung ở controller. | Phân tích bảo mật BOLA/IDOR, nhận thấy cán bộ phường này có thể duyệt đơn của phường khác. | Kiểm tra so khớp `wardId` của công dân và cán bộ duyệt trực tiếp trong service layer. |

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
Quy trình kiểm chứng đã dùng:
1) Viết test case Mockito bao phủ 100% các scenario của CampaignAppealServiceImpl.
2) Kiểm thử bảo mật BOLA/IDOR bằng cách gọi API duyệt đơn chéo phường và xác minh backend trả về lỗi 403 Forbidden.
3) Kiểm tra hiển thị countdown và tab Blacklist ở frontend.
4) Build biên dịch thử backend/frontend thành công trước khi commit.
```

---

## 8. Đóng góp cá nhân hoặc đóng góp nhóm

### 8.1. Đối với bài cá nhân

Mô tả phần sinh viên tự làm, phần AI hỗ trợ và phần đã tự cải tiến.

```text
Tôi đã tự nghiên cứu, thiết kế, triển khai logic Campaign Ban & Appeal và tối ưu hóa hệ thống. AI chỉ hỗ trợ đưa ra một số mẫu khung code React UI cho dropdown và gợi ý cấu trúc scheduler ban đầu. Bản thân tôi tự phản biện các giải pháp kém hiệu năng của AI (như query COUNT động toàn hệ thống), tự thiết kế cấu trúc database tối ưu hơn (sử dụng cờ vật lý và warning count trên entity User) và tự bảo mật tầng Service chống lỗ hổng BOLA (kiểm tra chéo ward ID) cũng như bảo vệ Audit Trail (không xóa dữ liệu vắng mặt lịch sử khi unban).
```

### 8.2. Đối với bài nhóm

| Thành viên | MSSV | Nhiệm vụ chính | Có sử dụng AI không? | Minh chứng đóng góp |
|---|---|---|---|---|
| Phan Thanh Bình | DE190210 | Phát triển Campaign Ban, Appeal review, progressive lockout và Chat UI | Có | Đã tích hợp code sạch, test case đầy đủ và cập nhật tài liệu đầy đủ |

---

## 9. Reflection cuối bài

### 9.1. AI đã hỗ trợ em/nhóm ở điểm nào?

```text
AI đã hỗ trợ tốt trong việc gợi ý cấu trúc khung React UI cho các dropdown menu, modal và scheduler template thô sơ. Ngoài ra, AI hỗ trợ cung cấp các đoạn template Mockito test case và viết một số hàm format thời gian.
```

### 9.2. Phần nào em/nhóm không sử dụng theo gợi ý của AI? Vì sao?

```text
1) Không sử dụng giải pháp tính toán động COUNT số lần vắng mặt của AI vì rất kém hiệu năng khi số lượng bản ghi lớn; tôi tự thay thế bằng cờ vật lý và warning count trong entity User.
2) Không sử dụng giải pháp xóa/reset trạng thái bản ghi vắng mặt cũ trong DB của AI vì phá hỏng tính toàn vẹn dữ liệu (Audit Trail); tôi tự thay thế bằng giải pháp dùng trường lastCampaignUnbanAt.
3) Không tin tưởng giải pháp phân quyền cơ bản chỉ check Role chung chung ở Controller của AI vì nguy cơ hổng BOLA/IDOR; tôi tự bổ sung check chéo ward ID ở tầng Service.
```

### 9.3. Em/nhóm đã kiểm tra tính đúng đắn của kết quả AI như thế nào?

```text
- Viết unit test cho service (CampaignAppealServiceImplTest) để bao phủ 100% các case thành công và thất bại.
- Chạy biên dịch backend (mvn compile) và chạy kiểm tra kiểu tĩnh của React (npx tsc --noEmit) sau mỗi thay đổi.
- Chạy thử trực tiếp trên trình duyệt, kiểm tra routing khi click vào notification và kiểm tra phân quyền tài khoản Ward Staff của các phường khác nhau.
```

### 9.4. Nếu không có AI, phần nào sẽ khó khăn nhất?

```text
Phần viết các test case Mockito hoặc xây dựng giao diện thô React/Tailwind ban đầu sẽ tốn nhiều thời gian hơn vì phải viết từng dòng code boilerplate và style thủ công.
```

### 9.5. Sau bài tập/project này, em/nhóm học được gì về môn học?

```text
- Hiểu sâu về bảo mật phân quyền ở mức dữ liệu (Data-level Authorization / BOLA) trong thực tế.
- Tầm quan trọng của việc thiết kế Database tối ưu hiệu năng (O(1) vs O(N)) và bảo toàn dữ liệu lịch sử (Audit Trail).
- Cách đồng bộ hóa hệ thống bất đồng bộ phức tạp (Scheduler chạy ngầm, Notification, và Email gửi đi).
```

### 9.6. Sau bài tập/project này, em/nhóm học được gì về cách sử dụng AI có trách nhiệm?

```text
- AI chỉ là một trợ lý gợi ý giải pháp lý thuyết chung chung. Developer luôn phải giữ vai trò chủ động, phản biện các đề xuất của AI dưới lăng kính hiệu năng, bảo mật và nghiệp vụ thực tế của hệ thống.
- Ghi nhận trung thực và minh bạch mọi lần tham khảo AI.
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
| Phan Thanh Bình | 12/07/2026 |

