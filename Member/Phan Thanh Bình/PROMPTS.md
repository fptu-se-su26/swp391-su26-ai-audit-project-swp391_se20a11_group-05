# Prompt Log

## 1. Thông tin chung

| Thông tin | Nội dung |
|---|---|
| Môn học | Software Development Project |
| Mã môn học | SWP391 |
| Lớp | SE20A11 |
| Học kỳ | SU26 |
| Tên bài tập / Project | The Listening City Systems |
| Tên sinh viên / Nhóm | Phan Thanh Bình / Group05 |
| MSSV / Danh sách MSSV | DE190210 |
| Giảng viên hướng dẫn | Lê Thiện Nhật Quang |
| Ngày bắt đầu |  |
| Ngày cập nhật gần nhất |  |

---

## 2. Mục đích của file Prompt Log

File này dùng để ghi lại các prompt quan trọng đã sử dụng trong quá trình thực hiện bài tập, lab, assignment hoặc project.

Sinh viên/nhóm cần ghi lại:

- Đã hỏi AI điều gì.
- Mục đích sử dụng prompt.
- Công cụ AI đã sử dụng.
- AI đã trả lời hoặc gợi ý gì.
- Kết quả đó có được áp dụng vào bài hay không.
- Sinh viên/nhóm đã kiểm tra, chỉnh sửa hoặc cải tiến gì sau khi nhận kết quả từ AI.

---

## 3. Công cụ AI đã sử dụng

Đánh dấu các công cụ AI đã sử dụng.

- [ ] ChatGPT
- [ ] Gemini
- [ ] Claude
- [ ] GitHub Copilot
- [ ] Cursor
- [ ] Antigravity
- [ ] Microsoft Copilot
- [ ] Perplexity
- [ ] Công cụ khác: ....................................

---

## 4. Bảng tổng hợp prompt đã sử dụng

| STT | Ngày | Công cụ AI | Mục đích | Prompt tóm tắt | Kết quả chính | Có sử dụng vào bài không? | Minh chứng |
|---:|---|---|---|---|---|---|---|
| 1 |  |  |  |  |  | Có / Không |  |
| 2 | 28/05/2026 | ChatGPT | Hoàn thiện backend use case media và khớp frontend template | Yêu cầu AI chuẩn hóa API, bổ sung class thiếu và đảm bảo compile pass | Bổ sung service/controller/repository/DTO cho media + chuẩn endpoint /api/feedbacks/media + compile pass | Có | Commit: 37217fd, 99ad3b8, a0692cf |
| 3 | 02/06/2026 | ChatGPT | Phân tích kiến trúc và triển khai GPS integration | Định vị GPS bắt buộc, reverse geocoding tại backend | Tích hợp định vị chính xác và gán phường xử lý tự động từ tọa độ GPS | Có | |
| 4 | 06/07/2026 | Antigravity | Tích hợp xem tóm tắt lịch sử hoạt động của Tình nguyện viên | Thiết kế API lấy lịch sử và UI click-to-expand xem chi tiết vắng mặt | Thêm endpoint GET /user/{userId} và toggle hiển thị lịch sử ở frontend | Có | |
| 5 | 06/07/2026 | Antigravity | Tái cấu trúc logic điểm danh chiến dịch (Decouple Attendance) | Giữ status APPROVED của người vắng và dùng attended = false | Cập nhật logic điểm danh tay & tự động, viết query count tương thích ngược | Có | |
| 6 | 06/07/2026 | Antigravity | Sửa lỗi lệch trạng thái chiến dịch theo thời gian | Giải pháp khắc phục lệch trạng thái temporal do timezone | Đồng bộ so sánh thời gian dạng Date milliseconds ở cả 2 phía | Có | |
| 10 |  |  |  |  |  | Có / Không |  |

---

## 5. Prompt chi tiết

> Sinh viên/nhóm có thể nhân bản mẫu “Prompt số...” nhiều lần tùy số lượng prompt thực tế đã sử dụng.

---

### Prompt số 1

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 28/05/2026 |
| Công cụ AI | ChatGPT |
| Mục đích | Hoàn thiện backend use case media và đồng bộ với frontend template |
| Phần việc liên quan | Coding / Testing / Debug |
| Mức độ sử dụng | Hỏi review / Hỏi debug / Hỏi sinh code / Hỏi tối ưu |

#### 5.1. Prompt nguyên văn

```text
You must ensure that this backend code must be able to connect with the frontend and must match the frontend template.
If there is any missing class for the usecase to work, please complete it for me and ensure the logic is correct for other members.
Make sure the code is standard so that when I merge into the product branch there will be no errors, explain in Vietnamese.
```

#### 5.2. Bối cảnh khi viết prompt

Mô tả ngắn gọn vì sao sinh viên/nhóm cần dùng prompt này.

```text
Dự án nhóm có backend Spring Boot và frontend React.
Template frontend đã dùng sẵn feedbackApi với endpoint /api/feedbacks và payload cụ thể.
Cần thêm flow upload media nhưng vẫn không làm vỡ các flow đang chạy của thành viên khác.
```

#### 5.3. Kết quả AI trả về

Tóm tắt nội dung AI đã trả lời hoặc gợi ý.

```text
Bổ sung đầy đủ class cho use case media:
- AttachmentRepository
- CitizenFeedbackMediaRequest/Response
- FeedbackAttachmentResponse
- SupabaseStorageService
- CitizenFeedbackMediaService
- endpoint media trong module feedback

Đồng thời chỉnh logic FeedbackService để tương thích template frontend khi categoryId chưa gửi.
Kết quả compile backend pass.
```

#### 5.4. Kết quả đã áp dụng vào bài

Mô tả phần nào từ kết quả AI đã được sử dụng vào bài tập/project.

```text
Áp dụng trực tiếp các thay đổi vào backend + helper frontend gọi endpoint media.
Sử dụng commit nhỏ để dễ review trong nhóm.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

Mô tả sinh viên/nhóm đã thay đổi, kiểm tra, sửa lỗi hoặc cải tiến gì so với kết quả AI trả về.

```text
Đã tự chỉnh các điểm sau để ổn định hơn:
- Sửa endpoint helper frontend về /api/feedbacks/media.
- Sửa lỗi trùng dòng fetch do merge patch.
- Bổ sung validate request trong FeedbackService để tránh lỗi runtime khi thiếu categoryId.
- Re-compile để xác nhận kết quả.
```

#### 5.6. Đánh giá chất lượng prompt

Đánh dấu các nhận xét phù hợp.

- [ ] Prompt rõ ràng
- [ ] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [ ] Prompt tạo ra kết quả tốt
- [ ] Prompt tạo ra kết quả chưa phù hợp
- [ ] Cần hỏi lại AI nhiều lần
- [ ] Cần tự kiểm tra và chỉnh sửa nhiều
- [ ] Kết quả AI có lỗi hoặc chưa chính xác

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | 37217fd, 99ad3b8, a0692cf |
| File liên quan | Sources/Backend/src/main/java/com/example/smartcity/modules/feedback/service/FeedbackService.java; Sources/Backend/src/main/java/com/example/smartcity/modules/feedback/controller/FeedbackController.java; Sources/Frontend/src/lib/citizenFeedbackMediaApi.ts |
| Screenshot |  |
| Kết quả chạy/test | mvn -q -DskipTests compile: PASS |
| Link tài liệu/báo cáo |  |
| Ghi chú khác | Đảm bảo code tương thích template frontend trước khi merge |

#### 5.8. Ghi chú thêm

```text
Prompt có hiệu quả cao vì:
1) Nêu rõ mục tiêu kỹ thuật (compatibility backend-frontend).
2) Nêu rõ ràng buộc project nhóm (không phá flow thành viên khác).
3) Yêu cầu tiêu chí hoàn tất rõ (compile ổn định, có thể merge product branch).
```

---

### Prompt số 2

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 06/07/2026 |
| Công cụ AI | Antigravity / Gemini |
| Mục đích | Tích hợp xem tóm tắt lịch sử hoạt động của Tình nguyện viên |
| Phần việc liên quan | Coding / UI Design / Security |
| Mức độ sử dụng | Hỏi ý tưởng / Hỏi thiết kế |

#### 5.1. Prompt nguyên văn

```text
Tôi muốn tích hợp thêm tính năng xem tóm tắt lịch sử hoạt động và số lần vắng mặt của Tình nguyện viên ngay trong Citizen Profile Modal dành cho Cán bộ.
1. Ở Backend, tôi nên bổ sung những API và Query Method nào để lấy được lịch sử tham gia sắp xếp theo thời gian mới nhất?
2. Ở Frontend, làm thế nào để hiển thị danh sách này trực quan, hỗ trợ click-to-expand để xem chi tiết lý do vắng mặt khi click vào thẻ thống kê?
```

#### 5.2. Bối cảnh khi viết prompt

```text
Cán bộ quản lý chiến dịch cần nhanh chóng đánh giá sự nhiệt tình và độ tin cậy của tình nguyện viên bằng cách xem lịch sử những chiến dịch họ đã từng tham gia hoặc vắng mặt trực tiếp trên modal hồ sơ công dân.
```

#### 5.3. Kết quả AI trả về

```text
- Gợi ý query JPA orderByCampaign_StartTimeDesc.
- Cấu trúc state và layout click-to-expand hiển thị danh sách chiến dịch tương ứng ở frontend.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
- Tạo API endpoint GET /participants/user/{userId} được phân quyền cho cán bộ.
- Xây dựng layout click-to-expand trong CitizenProfileModal.tsx.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
- Viết thêm hàm check existsByCitizenIdAndWardId ở Backend để cán bộ phường chỉ được xem lịch sử công dân của phường mình (tránh IDOR/BOLA).
- Tự tối ưu hóa hiển thị ngày giờ tiếng Việt không dùng thư viện ngoài.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [x] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [x] Prompt tạo ra kết quả tốt
- [ ] Prompt tạo ra kết quả chưa phù hợp
- [ ] Cần hỏi lại AI nhiều lần
- [x] Cần tự kiểm tra và chỉnh sửa nhiều
- [ ] Kết quả AI có lỗi hoặc chưa chính xác

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | |
| File liên quan | Sources/Backend/src/main/java/com/example/smartcity/modules/campaign/dto/CampaignParticipantResponse.java; Sources/Backend/src/main/java/com/example/smartcity/modules/campaign/repository/CampaignParticipantRepository.java; Sources/Backend/src/main/java/com/example/smartcity/modules/campaign/service/CampaignServiceImpl.java; Sources/Backend/src/main/java/com/example/smartcity/modules/campaign/controller/CampaignController.java; Sources/Frontend/src/lib/api.ts; Sources/Frontend/src/components/chat/CitizenProfileModal.tsx |
| Screenshot | |
| Kết quả chạy/test | mvn compile: PASS; npx tsc --noEmit: PASS |
| Link tài liệu/báo cáo | |
| Ghi chú khác | |

#### 5.8. Ghi chú thêm

```text
Prompt này hiệu quả vì đi thẳng vào kiến trúc dự án và yêu cầu layout cụ thể cho cả 2 phía backend/frontend, giúp sinh viên làm chủ luồng dữ liệu trước khi viết code.
```

---

### Prompt số 3

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 02/06/2026 |
| Công cụ AI | ChatGPT |
| Mục đích | Phân tích kiến trúc và triển khai GPS integration |
| Phần việc liên quan | Backend / Frontend / API / Securityr |
| Mức độ sử dụng | Hỏi phân tích / Hỏi thiết kế / Hỏi sinh code / Hỏi kiểm chứng |

#### 5.1. Prompt nguyên văn

```text
First use CodeGraph to understand the current code architecture...
I want to add GPS integration...
Citizens must allow location access to submit feedback.
Store latitude and longitude.
Use Reverse Geocoding to authenticate communes and wards.
Authorities can view the reported location on the map.
That location will be sent to the commune/ward unit where it will be processed.
Ask necessary questions first.
Wait for my approval before editing files.
```

#### 5.2. Bối cảnh khi viết prompt

```text
Hệ thống đã có chức năng gửi phản ánh nhưng vị trí GPS chưa được xử lý đúng nghiệp vụ.
Frontend có gọi geolocation nhưng nếu lỗi lại fallback về tọa độ mặc định, có thể tạo dữ liệu sai.
Backend có latitude/longitude nhưng chưa bắt buộc và wardId vẫn có nguy cơ bị frontend gửi sai/hardcode.
Cần bổ sung GPS theo hướng an toàn, có kiểm chứng và không phá vỡ kiến trúc hiện có.
```

#### 5.3. Kết quả AI trả về

```text
AI dùng CodeGraph để xác định các file liên quan:
- Feedback entity/request/response/service/controller.
- WardController và WardRepository.
- report.tsx, api.ts, types/api.ts.
- CivicMap và WardDashboard.

AI đề xuất và hỗ trợ triển khai:
- LocationResolutionService để reverse geocoding.
- Validation bắt buộc latitude/longitude.
- Backend tự resolve ward.
- Frontend chặn submit nếu chưa có GPS.
- Ward dashboard hiển thị vị trí phản ánh trên map.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Đã áp dụng vào code:
- Bắt buộc GPS khi citizen gửi phản ánh.
- Không dùng tọa độ fallback giả.
- Không gửi wardId hardcode từ frontend.
- Backend xác định phường/xã từ GPS.
- Cán bộ phường xem được pin phản ánh trên bản đồ.
- Backend compile pass và frontend build pass.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Nhóm không copy toàn bộ theo AI một cách máy móc.
Các điểm đã kiểm tra/chỉnh sửa:
- Kiểm tra CodeGraph trước để biết hệ thống đã có sẵn latitude/longitude và CivicMap.
- Giữ Leaflet/OpenStreetMap thay vì thêm Google Maps để tránh phụ thuộc API key.
- Thêm guard ở cả frontend và backend để GPS thật sự bắt buộc.
- Sửa lỗi compile do Spring Boot 4 không còn UriComponentsBuilder.fromHttpUrl.
- Chạy mvn compile và npm build để xác nhận không lỗi build.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [x] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [x] Prompt tạo ra kết quả tốt
- [ ] Prompt tạo ra kết quả chưa phù hợp
- [x] Cần hỏi lại AI nhiều lần
- [x] Cần tự kiểm tra và chỉnh sửa nhiều
- [ ] Kết quả AI có lỗi hoặc chưa chính xác

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| Link commit |  |
| File liên quan |  |
| Screenshot |  |
| Kết quả chạy/test |  |
| Link tài liệu/báo cáo |  |
| Ghi chú khác |  |

#### 5.8. Ghi chú thêm

```text
Viết tại đây...
```

### Prompt số 4

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 17/06/2026 |
| Công cụ AI | ChatGPT |
| Mục đích | Tìm hiểu và kiểm chứng thiết kế progressive login lockout + SMS OTP + phân luồng login theo role |
| Phần việc liên quan | Backend / Frontend / Security / Testing / Debug |
| Mức độ sử dụng | Hỏi phân tích / Hỏi giải thích / Hỏi review / Hỏi kiểm chứng |

#### 5.1. Prompt nguyên văn

```text
Mình đang tự tìm hiểu cách cải thiện bảo mật đăng nhập cho project Spring Boot + React.
Hiện hệ thống có hai nhóm người dùng: citizen dùng /login, còn cán bộ như ward, police, city admin dùng /authority-login.

Mình muốn hiểu cách thiết kế một cơ chế progressive login lockout hợp lý:
- sau 5 lần nhập sai thì khóa 1 phút,
- sau khi mở khóa mà tiếp tục sai 3 lần thì khóa 3 phút,
- tiếp tục sai 3 lần nữa thì khóa 6 phút,
- nếu vẫn tiếp tục sai thì yêu cầu xác minh SMS OTP trước khi cho đăng nhập lại.

Bạn hãy giúp mình phân tích hướng thiết kế trước, chỉ ra backend cần lưu thêm trạng thái gì trong bảng users,
service đăng nhập nên xử lý các bước nào, frontend nên hiển thị countdown ra sao,
và cần test những case nào để mình tự đối chiếu với code hiện tại.

```

#### 5.2. Bối cảnh khi viết prompt

```text
Project đang có luồng đăng nhập cho người dân và cán bộ nhưng cần tăng bảo mật khi người dùng nhập sai mật khẩu nhiều lần.
Ngoài ra, frontend có hai cổng đăng nhập riêng nên cần tránh trường hợp citizen vào authority dashboard hoặc cán bộ bị redirect về sai trang.
Nhóm cần một hướng thiết kế đủ rõ để tự triển khai, tự chỉnh code và tự viết test kiểm chứng.
```

#### 5.3. Kết quả AI trả về

```text
AI đề xuất:
- Dùng progressive lockout theo stage thay vì chỉ khóa cố định một lần.
- Lưu login_lock_stage, login_otp_required, last_failed_login_at trong bảng users.
- Tách logic kiểm tra lockedUntil, OTP required và reset lockout thành các hàm riêng trong AuthService.
- Khi đến stage cuối, gửi SMS OTP và chặn password login cho đến khi OTP được xác minh.
- Frontend xử lý lỗi 429 bằng countdown, đồng thời clear lỗi khi người dùng sửa input.
- Role guard cần đưa authority user về /authority-login và citizen user về /login.
- Test cần kiểm tra cả success path và failure path.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Đã áp dụng vào code:
- Backend AuthService có progressive lockout theo stage.
- User entity và migration database có thêm trường phục vụ lockout.
- AuthController gọi authService.verifyLoginOtp để reset trạng thái OTP required.
- Frontend có helper loginLockout.ts để format countdown.
- LoginPage và authority-login xử lý lỗi lockout và phân quyền theo portal.
- roles.ts và guardUtils.ts hỗ trợ redirect đúng dashboard/login theo role.
- AuthServiceTest và AuthControllerTest được bổ sung để kiểm chứng logic.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Nhóm không áp dụng nguyên xi mà tự chỉnh:
- Giữ thông báo lỗi đăng nhập ở mức chung để hạn chế lộ thông tin tài khoản.
- Bổ sung redirect helper theo role để tránh lặp logic ở nhiều component.
- Đảm bảo logout cũng quay về đúng cổng đăng nhập.
- Dùng test để kiểm tra từng stage thay vì chỉ kiểm tra thủ công.
- Bổ sung DataInitializer để môi trường dev không lỗi khi thiếu cột database.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [x] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [x] Prompt tạo ra kết quả tốt
- [ ] Prompt tạo ra kết quả chưa phù hợp
- [x] Cần hỏi lại AI nhiều lần
- [x] Cần tự kiểm tra và chỉnh sửa nhiều
- [ ] Kết quả AI có lỗi hoặc chưa chính xác

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Chưa commit |
| File liên quan | AuthService.java; AuthController.java; User.java; UserRepository.java; V7__progressive_login_lockout.sql; loginLockout.ts; roles.ts; guardUtils.ts; LoginPage.tsx; authority-login.tsx; AuthServiceTest.java; AuthControllerTest.java |
| Screenshot |  |
| Kết quả chạy/test | Cần bổ sung sau khi chạy test/build |
| Link tài liệu/báo cáo |  |
| Ghi chú khác | Prompt dùng theo hướng tự tìm hiểu, yêu cầu AI phân tích và chỉ rủi ro để nhóm tự triển khai |

#### 5.8. Ghi chú thêm

```text
Prompt lần này tốt hơn các prompt yêu cầu AI làm trực tiếp vì nó yêu cầu AI giải thích hướng thiết kế, dữ liệu cần lưu,
case cần test và rủi ro cần chú ý. Nhờ đó nhóm hiểu rõ hơn vì sao cần từng thay đổi, thay vì chỉ copy code.
```
---

### Prompt số 5

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 06/07/2026 |
| Công cụ AI | Antigravity / Gemini |
| Mục đích | Tái cấu trúc logic điểm danh chiến dịch (Decouple Attendance) |
| Phần việc liên quan | Coding / Refactoring / Database |
| Mức độ sử dụng | Hỏi ý tưởng / Hỏi sinh code |

#### 5.1. Prompt nguyên văn

```text
Tôi đang tối ưu lại hệ thống điểm danh chiến dịch. Hiện tại, khi đánh dấu vắng mặt, hệ thống đang cập nhật joinStatus = 'NO_SHOW'. Điều này dẫn đến việc tình nguyện viên bị mất trạng thái APPROVED ban đầu (ảnh hưởng đến quyền tham gia chat nhóm hoặc xem chi tiết chiến dịch). 
Tôi muốn chuyển sang phương án: giữ nguyên joinStatus = 'APPROVED' nhưng dùng cờ attended = false và ghi nhận thời điểm attendedAt.
1. Hãy giúp tôi rà soát các hàm markNoShow, bulkSaveAttendance trong CampaignServiceImpl và autoEndExpiredCampaigns trong scheduler xem cần sửa đổi gì.
2. Để đếm số lần vắng mặt tương thích ngược với dữ liệu cũ (vẫn có bản ghi joinStatus = 'NO_SHOW'), tôi nên viết câu query JPA như thế nào để tối ưu hiệu năng?
```

#### 5.2. Bối cảnh khi viết prompt

```text
Nhóm muốn chuẩn hóa nghiệp vụ điểm danh: một tình nguyện viên được duyệt (`APPROVED`) tham gia, kể cả khi họ vắng mặt thì trạng thái đã được duyệt của họ vẫn phải được giữ nguyên. Do đó, cần tách biệt trạng thái duyệt khỏi cờ ghi nhận có mặt/vắng mặt.
```

#### 5.3. Kết quả AI trả về

```text
- Hướng dẫn điều chỉnh cờ logic `attended` thành `false` trong các phương thức kết thúc chiến dịch, scheduler và điểm danh tay.
- Mẫu câu truy vấn JPA `@Query` sử dụng logic `OR` để tương thích ngược khi tính tổng số lần vắng mặt.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
- Sửa đổi các hàm chốt vắng mặt trong `CampaignServiceImpl.java` và `CampaignScheduler.java`.
- Tạo query mới `countNoShowCampaigns` tại `CampaignParticipantRepository.java`.
- Cập nhật thống kê `UserMapper.java`.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
- Nhóm không xóa thông tin người duyệt và thời gian duyệt ban đầu để làm audit log cho hệ thống sau này.
- Cập nhật thủ công các bộ lọc trong UI của danh sách tình nguyện viên để tag "Vắng mặt" hiển thị chính xác cả hai cơ chế.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [x] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [x] Prompt tạo ra kết quả tốt
- [ ] Prompt tạo ra kết quả chưa phù hợp
- [ ] Cần hỏi lại AI nhiều lần
- [x] Cần tự kiểm tra và chỉnh sửa nhiều
- [ ] Kết quả AI có lỗi hoặc chưa chính xác

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | |
| File liên quan | CampaignParticipantRepository.java; UserMapper.java; CampaignServiceImpl.java; CampaignScheduler.java; CitizenProfileModal.tsx; WardCampaignDetailPage.tsx |
| Screenshot | |
| Kết quả chạy/test | mvn compile: PASS; npx tsc --noEmit: PASS |
| Link tài liệu/báo cáo | |
| Ghi chú khác | |

#### 5.8. Ghi chú thêm

```text
Prompt này giải quyết triệt để vấn đề tương thích dữ liệu cũ/mới nhờ cấu trúc truy vấn JPA lồng OR tối ưu, sinh viên tự chủ được thiết kế cấu trúc DB.
```

---

### Prompt số 6

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 06/07/2026 |
| Công cụ AI | Antigravity / Gemini |
| Mục đích | Sửa lỗi lệch trạng thái chiến dịch theo thời gian |
| Phần việc liên quan | Coding / Bug Fix / Timezone Alignment |
| Mức độ sử dụng | Hỏi ý tưởng / Hỏi review |

#### 5.1. Prompt nguyên văn

```text
Tôi nhận thấy trạng thái chiến dịch hiển thị không chính xác. Mặc dù chiến dịch chưa đến giờ bắt đầu trên thực tế, hệ thống vẫn hiển thị trạng thái là "Đang diễn ra" (IN_PROGRESS) thay vì "Chưa diễn ra". 
Hãy giúp tôi rà soát cơ chế tính toán trạng thái temporal của chiến dịch trên frontend (campaignStore.ts) và backend (CampaignServiceImpl.java), tìm nguyên nhân lệch múi giờ giữa UTC và giờ địa phương và đề xuất cách so sánh thời gian chuẩn xác nhất.
```

#### 5.2. Bối cảnh khi viết prompt

```text
Do khác biệt về timezone của môi trường trình duyệt client và máy chủ backend khi parse chuỗi ngày tháng ISO string, dẫn đến việc tính toán so sánh thời gian hiện tại bị sai lệch vài tiếng, làm chuyển đổi trạng thái chiến dịch sớm trước thời gian định trước.
```

#### 5.3. Kết quả AI trả về

```text
- Nhận diện lỗi so sánh chuỗi thô (string comparison).
- Đề xuất chuyển về `Date.getTime()` hoặc so sánh miliseconds số học.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
- Đồng bộ hàm kiểm tra thời gian tại `campaignStore.ts` ở frontend.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
- Tự đồng bộ hóa cả logic ở backend (`CampaignServiceImpl.java` và `Campaign.java`) để đảm bảo các API trả về của danh sách luôn khớp 100% với hiển thị của frontend.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [x] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [x] Prompt tạo ra kết quả tốt
- [ ] Prompt tạo ra kết quả chưa phù hợp
- [ ] Cần hỏi lại AI nhiều lần
- [x] Cần tự kiểm tra và chỉnh sửa nhiều
- [ ] Kết quả AI có lỗi hoặc chưa chính xác

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | |
| File liên quan | campaignStore.ts; CampaignServiceImpl.java; Campaign.java |
| Screenshot | |
| Kết quả chạy/test | mvn compile: PASS; npx tsc --noEmit: PASS |
| Link tài liệu/báo cáo | |
| Ghi chú khác | |

#### 5.8. Ghi chú thêm

```text
Nhóm chủ động sửa toàn diện từ database/entity cho đến store của client thay vì chỉ sửa phần hiển thị UI thô sơ theo gợi ý của AI.
```

---

## 6. Prompt quan trọng nhất

Chọn một prompt có ảnh hưởng lớn nhất đến bài tập/project.

### 6.1. Prompt được chọn

```text
Dán prompt quan trọng nhất tại đây.
```

### 6.2. Vì sao prompt này quan trọng?

```text
Viết tại đây...
```

### 6.3. Kết quả prompt này mang lại

```text
Viết tại đây...
```

### 6.4. Sinh viên/nhóm đã kiểm tra kết quả như thế nào?

```text
Viết tại đây...
```

### 6.5. Sinh viên/nhóm đã cải tiến gì từ kết quả AI?

```text
Viết tại đây...
```

---

## 7. Prompt chưa hiệu quả

Ghi lại ít nhất một prompt chưa tạo ra kết quả tốt hoặc chưa phù hợp.

### 7.1. Prompt chưa hiệu quả

```text
Dán prompt chưa hiệu quả tại đây.
```

### 7.2. Vì sao prompt này chưa hiệu quả?

```text
Viết tại đây...
```

Gợi ý nguyên nhân:

- Prompt quá ngắn.
- Thiếu bối cảnh bài toán.
- Không nêu rõ yêu cầu đầu ra.
- Không cung cấp ngôn ngữ lập trình/công nghệ đang dùng.
- Không đưa lỗi cụ thể.
- Không đưa ví dụ input/output.
- Không yêu cầu AI giải thích.
- Hỏi AI làm toàn bộ thay vì hỏi từng phần.

### 7.3. Cách cải thiện prompt

```text
Viết tại đây...
```

### 7.4. Prompt sau khi cải tiến

```text
Dán prompt đã được cải tiến tại đây.
```

### 7.5. Kết quả sau khi cải tiến prompt

```text
Viết tại đây...
```

---

## 8. Bài học về cách viết prompt

### 8.1. Khi viết prompt, em/nhóm cần cung cấp thông tin gì để AI trả lời tốt hơn?

```text
Viết tại đây...
```

Gợi ý:

- Mục tiêu cần đạt.
- Bối cảnh bài toán.
- Công nghệ/ngôn ngữ lập trình đang dùng.
- Input/output mong muốn.
- Ràng buộc của đề bài.
- Lỗi đang gặp.
- Format kết quả mong muốn.
- Yêu cầu AI giải thích từng bước.

### 8.2. Em/nhóm đã học được gì về cách đặt câu hỏi cho AI?

```text
Viết tại đây...
```

### 8.3. Lần sau em/nhóm sẽ cải thiện prompt như thế nào?

```text
Viết tại đây...
```

---

## 9. Phân loại prompt đã sử dụng

Đánh dấu số lượng prompt theo từng nhóm.

| Loại prompt | Số lượng | Ví dụ prompt tiêu biểu |
|---|---:|---|
| Prompt phân tích yêu cầu |  |  |
| Prompt giải thích kiến thức |  |  |
| Prompt thiết kế giải pháp |  |  |
| Prompt thiết kế database |  |  |
| Prompt sinh code mẫu |  |  |
| Prompt debug lỗi |  |  |
| Prompt viết test case |  |  |
| Prompt review code |  |  |
| Prompt tối ưu code |  |  |
| Prompt viết báo cáo |  |  |
| Prompt chuẩn bị thuyết trình |  |  |
| Prompt khác |  |  |

---

## 10. Checklist chất lượng prompt

Sinh viên/nhóm tự kiểm tra chất lượng prompt đã dùng.

| Tiêu chí | Đã đạt? | Ghi chú |
|---|:---:|---|
| Prompt có mục tiêu rõ ràng |  |  |
| Prompt có đủ bối cảnh |  |  |
| Prompt có nêu công nghệ/ngôn ngữ sử dụng |  |  |
| Prompt có nêu yêu cầu đầu ra |  |  |
| Prompt không yêu cầu AI làm toàn bộ bài một cách máy móc |  |  |
| Prompt có yêu cầu AI giải thích hoặc phân tích |  |  |
| Kết quả AI được kiểm tra lại |  |  |
| Kết quả AI được chỉnh sửa trước khi sử dụng |  |  |
| Prompt quan trọng được ghi lại đầy đủ |  |  |
| Prompt sai/chưa hiệu quả được rút kinh nghiệm |  |  |

---

## 11. Cam kết sử dụng prompt minh bạch

Sinh viên/nhóm cam kết rằng:

- Các prompt quan trọng đã được ghi lại trung thực.
- Không che giấu việc sử dụng AI trong các phần quan trọng của bài.
- Không nộp nguyên văn kết quả AI nếu chưa kiểm tra và chỉnh sửa.
- Có khả năng giải thích các phần đã sử dụng từ AI.
- Chịu trách nhiệm với sản phẩm cuối cùng.

| Đại diện sinh viên/nhóm | Ngày xác nhận |
|---|---|
|  |  |
