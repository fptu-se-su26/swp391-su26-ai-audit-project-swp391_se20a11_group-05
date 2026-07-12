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
| 7 | 07/07/2026 | Antigravity | Cải thiện bố cục giao diện khung chat nhóm | Nới rộng khung chat, thanh nhập liệu, tăng font header & dọn 'any' | Mở rộng container lên max-w-5xl, nâng input h-11, clean linter warnings | Có | |
| 8 | 09/07/2026 | Antigravity | Tích hợp logic tự động cấm khi vắng mặt 3 lần | Thiết kế logic và query tính vắng mặt cho scheduler | Cờ vật lý isCampaignBanned, warningCount trên User entity | Có | |
| 9 | 10/07/2026 | Antigravity | Triển khai luồng Appeal Submission & Review | Thiết kế API gửi/duyệt giải trình và Ward Dashboard UI | API duyệt giải trình, reset cảnh báo, UI duyệt đơn, check wardId (BOLA) | Có | |


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

### Prompt số 7

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 07/07/2026 |
| Công cụ AI | Antigravity / Gemini |
| Mục đích | Cải thiện bố cục giao diện khung chat nhóm chiến dịch |
| Phần việc liên quan | Coding / UI Design / Code Quality |
| Mức độ sử dụng | Hỏi ý tưởng / Hỏi tối ưu / Hỏi sửa lỗi |

#### 5.1. Prompt nguyên văn

```text
mình muốn cải thiện lại tại mình thấy hơi bị nhỏ ấy với lại 2 bên tin nhắn tháy còn dư ra nhièu
```

#### 5.2. Bối cảnh khi viết prompt

```text
Khung chat nhóm của cả người dân và cán bộ đang bị giới hạn bởi max-w-2xl và max-w-3xl, tạo ra nhiều khoảng trống dư thừa ở hai bên trên màn hình máy tính Desktop. Các nút, thanh input và chữ tiêu đề cũng bị nhỏ, gây khó chịu khi tương tác lâu.
```

#### 5.3. Kết quả AI trả về

```text
Gợi ý tăng chiều rộng tối đa lên max-w-5xl, nâng độ cao của thanh nhập liệu lên h-11 cùng font chữ text-sm để hài hòa với giao diện rộng.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Cập nhật thuộc tính Tailwind CSS tại WardChatDashboardPage.tsx và campaigns.$id.group-chat.tsx để giãn chiều ngang khung chat và nâng chiều cao của ô nhập tin nhắn cùng các nút đi kèm.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
- Nhóm chủ động mở rộng font chữ tiêu đề nhóm chat và mô tả thành viên tại header để tỷ lệ hiển thị được cân đối với khung tin nhắn mở rộng.
- Chủ động rà soát và khử toàn bộ cảnh báo ép kiểu TypeScript thô ('any') trong file chat để mã nguồn sạch và an toàn hơn, thay thế bằng kiểu dữ liệu an toàn (unknown và gán type block cụ thể).
- Thực hiện chạy npx tsc --noEmit và eslint để verify chất lượng code.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [ ] Prompt có đủ bối cảnh
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
| File liên quan | Sources/Frontend/src/features/ward/WardChatDashboardPage.tsx;<br>Sources/Frontend/src/routes/campaigns.$id.group-chat.tsx |
| Screenshot | |
| Kết quả chạy/test | npx tsc --noEmit: PASS; npx eslint: PASS |
| Link tài liệu/báo cáo | |
| Ghi chú khác | |

#### 5.8. Ghi chú thêm

```text
Prompt ngắn gọn nhưng phản ánh đúng nhu cầu thiết kế UX. Kết quả đạt được rất khả quan nhờ sự chủ động căn chỉnh tỷ lệ các phần tử liên quan thay vì chỉ copy-paste thuộc tính CSS.
```

---

### Prompt số 8

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 09/07/2026 |
| Công cụ AI | Antigravity / Gemini |
| Mục đích | Tích hợp logic tự động cấm khi vắng mặt 3 lần |
| Phần việc liên quan | Backend / Scheduler / Campaign Ban Logic |
| Mức độ sử dụng | Hỏi ý tưởng / Hỏi sinh code |

#### 5.1. Prompt nguyên văn

```text
Tôi muốn triển khai logic tự động cấm người dùng tham gia chiến dịch nếu họ vắng mặt đủ 3 lần. 
Mỗi khi CampaignScheduler quét vào cuối ngày (autoEndExpiredCampaigns), hãy đếm số lần vắng mặt của citizen. 
Nếu vắng mặt đủ 3 lần, gán thuộc tính cấm. 
Hãy gợi ý cách viết câu query động đếm số lần vắng mặt từ bảng CampaignParticipant và cách update.
```

#### 5.2. Bối cảnh khi viết prompt

```text
Cần thiết lập cơ chế tự động hóa việc phạt những tình nguyện viên vắng mặt nhiều lần để đảm bảo tính kỷ luật khi tham gia chiến dịch cộng đồng.
```

#### 5.3. Kết quả AI trả về

```text
- Gợi ý chạy một truy vấn COUNT động trên bảng campaign_participants liên kết với user tại thời điểm scheduler chạy hoặc kiểm tra đăng ký.
- Khuyên không nên dùng thuộc tính cờ vật lý trong bảng User để tránh dư thừa (redundancy).
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
- Áp dụng cấu trúc scheduler quét vào cuối ngày để kết thúc chiến dịch và cập nhật cảnh cáo.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
- Bác bỏ COUNT động của AI do lo ngại về hiệu năng (O(N) database reads trên bảng lớn khi lượng đăng ký tăng cao). Chuyển sang dùng thuộc tính vật lý isCampaignBanned, warningCount, lastCampaignUnbanAt trực tiếp trên Entity User để tối ưu O(1).
- So sánh thời gian Milliseconds chuẩn GMT+7 để tránh lệch múi giờ của máy chủ chạy scheduler.
- Thêm logic gửi thông báo/mail cảnh cáo khi noShowCount = 2 để người dùng chủ động sửa đổi trước khi bị ban chính thức.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [x] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [ ] Prompt tạo ra kết quả tốt
- [x] Prompt tạo ra kết quả chưa phù hợp
- [ ] Cần hỏi lại AI nhiều lần
- [x] Cần tự kiểm tra và chỉnh sửa nhiều
- [x] Kết quả AI có lỗi hoặc chưa chính xác (thiết kế kém hiệu năng)

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | |
| File liên quan | CampaignScheduler.java; CampaignServiceImpl.java |
| Screenshot | |
| Kết quả chạy/test | mvn compile: PASS |
| Link tài liệu/báo cáo | |
| Ghi chú khác | |

#### 5.8. Ghi chú thêm

```text
Prompt hỏi trực tiếp giải pháp thô nên kết quả nhận về mang tính lý thuyết, thiếu tính toán hiệu năng thực tế. Sinh viên cần chủ động phản biện.
```

---

### Prompt số 9

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 10/07/2026 |
| Công cụ AI | Antigravity / Gemini |
| Mục đích | Triển khai luồng Appeal Submission & Review |
| Phần việc liên quan | Backend / Frontend / Security (BOLA) |
| Mức độ sử dụng | Hỏi ý tưởng / Hỏi thiết kế / Hỏi sinh code |

#### 5.1. Prompt nguyên văn

```text
Tôi muốn thiết kế tính năng gửi đơn giải trình cho người dân khi bị cấm và giao diện duyệt đơn cho Cán bộ.
1. Khi được duyệt giải trình, reset trạng thái cấm của người dân và xóa lịch sử vắng mặt của họ trong DB để họ có thể đăng ký lại.
2. Hãy gợi ý code API duyệt đơn và giao diện hiển thị danh sách đơn giải trình đang chờ ở Ward Dashboard.
```

#### 5.2. Bối cảnh khi viết prompt

```text
Người dân sau khi bị cấm cần có kênh gửi đơn giải trình lý do chính đáng (ốm đau, tai nạn) lên để cán bộ phường xem xét mở khóa tài khoản, kèm theo notification và email xác nhận.
```

#### 5.3. Kết quả AI trả về

```text
- Cung cấp khung React UI danh sách đơn giải trình và modal duyệt đơn ở frontend.
- Gợi ý câu lệnh xóa (delete) hoặc đổi trạng thái các bản ghi vắng mặt cũ trong DB để reset warning về 0.
- Gợi ý phân quyền cơ bản check Role.WARD_STAFF tại API controller.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
- Áp dụng khung React UI hiển thị danh sách đơn giải trình và modal phê duyệt đơn tại WardBlacklistPage.tsx.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
- Bác bỏ đề xuất xóa/đổi trạng thái bản ghi vắng mặt cũ vì phá hỏng tính toàn vẹn dữ liệu (Audit Trail). Thay vào đó, giữ nguyên lịch sử vắng mặt, thêm trường lastCampaignUnbanAt và chỉ đếm các lần vắng mặt phát sinh sau thời điểm unban.
- Bổ sung check chéo wardId của cán bộ duyệt đơn và công dân tại service layer để phòng chống lỗ hổng bảo mật nghiêm trọng BOLA/IDOR (ngăn cán bộ phường A duyệt đơn của người dân phường B).
- Thiết kế luồng deep-linking từ Notification ID trực tiếp đến chi tiết đơn giải trình đang chờ xử lý trên Ward Dashboard.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [x] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [x] Prompt tạo ra kết quả tốt
- [ ] Prompt tạo ra kết quả chưa phù hợp
- [ ] Cần hỏi lại AI nhiều lần
- [x] Cần tự kiểm tra và chỉnh sửa nhiều
- [x] Kết quả AI có lỗi hoặc chưa chính xác (bỏ qua bảo mật chéo và phá dữ liệu lịch sử)

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | |
| File liên quan | CampaignAppealServiceImpl.java; WardBlacklistPage.tsx; WardDashboard.tsx |
| Screenshot | |
| Kết quả chạy/test | mvn test -Dtest=CampaignAppealServiceImplTest: PASS |
| Link tài liệu/báo cáo | |
| Ghi chú khác | |

#### 5.8. Ghi chú thêm

```text
Gợi ý của AI đã bỏ qua hoàn toàn yêu cầu bảo mật phân quyền ở tầng dữ liệu và toàn vẹn dữ liệu lịch sử, nhấn mạnh tầm quan trọng của việc lập trình viên phải chủ động rà soát code.
```

---

## 6. Prompt quan trọng nhất

Chọn một prompt có ảnh hưởng lớn nhất đến bài tập/project.

### 6.1. Prompt được chọn

```text
Prompt số 9 - Triển khai luồng Appeal Submission & Review kèm phân quyền
```

### 6.2. Vì sao prompt này quan trọng?

```text
Prompt này quyết định cấu trúc của tính năng mở khóa tài khoản - một nghiệp vụ nhạy cảm liên quan đến quyền lợi của công dân và phân cấp hành chính (phường/xã). Nếu đi theo hướng gợi ý của AI (xóa dữ liệu lịch sử và chỉ check role cơ bản ở controller), hệ thống sẽ vừa mất kiểm soát dữ liệu lịch sử (audit trail) vừa dễ bị khai thác tấn công BOLA/IDOR để duyệt chéo địa bàn.
```

### 6.3. Kết quả prompt này mang lại

```text
Giúp nhóm nhanh chóng dựng được khung sườn giao diện React và luồng API duyệt đơn, tiết kiệm thời gian code boilerplate UI.
```

### 6.4. Sinh viên/nhóm đã kiểm tra kết quả như thế nào?

```text
- Viết unit test Mockito kiểm chứng các trạng thái duyệt/từ chối đơn giải trình.
- Viết test case giả lập gọi API duyệt đơn của phường khác để xác nhận hệ thống trả về lỗi 403 Forbidden.
- Chạy biên dịch và typecheck toàn hệ thống.
```

### 6.5. Sinh viên/nhóm đã cải tiến gì từ kết quả AI?

```text
- Thêm check chéo wardId tại service layer để phòng chống IDOR/BOLA.
- Giữ nguyên lịch sử vắng mặt cũ và dùng mốc thời gian unban để tính warning count mới.
- Thiết kế luồng deep-linking điều hướng mượt mà cho Cán bộ từ thông báo đến giao diện duyệt đơn.
```

---

## 7. Prompt chưa hiệu quả

Ghi lại ít nhất một prompt chưa tạo ra kết quả tốt hoặc chưa phù hợp.

### 7.1. Prompt chưa hiệu quả

```text
Prompt số 8 - Tự động cấm khi vắng mặt 3 lần
```

### 7.2. Vì sao prompt này chưa hiệu quả?

```text
Prompt hỏi trực tiếp giải pháp đếm và cập nhật mà không đưa ra các ràng buộc phi chức năng (non-functional requirements) như hiệu năng hệ thống lớn, khiến AI đề xuất giải pháp tính toán động COUNT O(N) gây thắt nút cổ chai và khuyên không lưu cờ vật lý.
```

### 7.3. Cách cải thiện prompt

```text
Nêu rõ ràng buộc về hiệu năng (yêu cầu kiểm tra với độ phức tạp O(1)) và yêu cầu thiết kế tối ưu cho cơ sở dữ liệu lớn ngay từ đầu.
```

### 7.4. Prompt sau khi cải tiến

```text
Hãy thiết kế giải pháp theo dõi và cấm người dùng vắng mặt 3 lần sao cho việc kiểm tra quyền đăng ký chiến dịch mới đạt O(1) hiệu năng, không thực hiện các truy vấn quét toàn bảng (full table scans) và giữ lại lịch sử để đối chiếu.
```

### 7.5. Kết quả sau khi cải tiến prompt

```text
AI sẽ đề xuất thiết kế thêm các cờ vật lý (isCampaignBanned, warningCount) và thời điểm mở khóa (lastCampaignUnbanAt) trực tiếp trong entity User để tránh truy vấn quét bảng phức tạp.
```

---

## 8. Bài học về cách viết prompt

### 8.1. Khi viết prompt, em/nhóm cần cung cấp thông tin gì để AI trả lời tốt hơn?

```text
- Mục tiêu chức năng chi tiết và bối cảnh nghiệp vụ.
- Ràng buộc phi chức năng (Hiệu năng O(1), bảo mật BOLA/IDOR, toàn vẹn dữ liệu Audit Trail).
- Công nghệ cụ thể và cấu trúc DB hiện có.
- Yêu cầu AI đưa ra hướng thiết kế và phân tích rủi ro trước khi viết code.
```

### 8.2. Em/nhóm đã học được gì về cách đặt câu hỏi cho AI?

```text
Không nên hỏi AI viết hộ toàn bộ code một cách thụ động. Thay vào đó, hãy hỏi dưới dạng tham khảo ý kiến chuyên gia, yêu cầu phân tích các phương án thiết kế khác nhau, rồi tự chọn lọc và cải tiến.
```

### 8.3. Lần sau em/nhóm sẽ cải thiện prompt như thế nào?

```text
- Đưa thêm các quy chuẩn thiết kế bảo mật và tối ưu DB vào bối cảnh prompt.
- Chia nhỏ các yêu cầu phức tạp thành các prompt tuần tự thay vì dồn tất cả vào một prompt lớn.
```

---

## 9. Phân loại prompt đã sử dụng

Đánh dấu số lượng prompt theo từng nhóm.

| Loại prompt | Số lượng | Ví dụ prompt tiêu biểu |
|---|---:|---|
| Prompt phân tích yêu cầu | 1 | Prompt số 1 |
| Prompt giải thích kiến thức | 1 | Prompt số 4 |
| Prompt thiết kế giải pháp | 3 | Prompt số 2, Prompt số 8, Prompt số 9 |
| Prompt thiết kế database | 0 | |
| Prompt sinh code mẫu | 2 | Prompt số 3, Prompt số 5 |
| Prompt debug lỗi | 1 | Prompt số 6 |
| Prompt viết test case | 0 | |
| Prompt review code | 0 | |
| Prompt tối ưu code | 1 | Prompt số 7 |
| Prompt viết báo cáo | 0 | |
| Prompt chuẩn bị thuyết trình | 0 | |
| Prompt khác | 0 | |

---

## 10. Checklist chất lượng prompt

Sinh viên/nhóm tự kiểm tra chất lượng prompt đã dùng.

| Tiêu chí | Đã đạt? | Ghi chú |
|---|:---:|---|
| Prompt có mục tiêu rõ ràng | ✔ | Đều ghi rõ mục đích cụ thể |
| Prompt có đủ bối cảnh | ✔ | Nêu rõ cấu trúc hiện tại của dự án |
| Prompt có nêu công nghệ/ngôn ngữ sử dụng | ✔ | Spring Boot, React, JPA, Tailwind |
| Prompt có nêu yêu cầu đầu ra | ✔ | API compile pass, UI responsive |
| Prompt không yêu cầu AI làm toàn bộ bài một cách máy móc | ✔ | Chỉ tham khảo cấu trúc và giải thuật |
| Prompt có yêu cầu AI giải thích hoặc phân tích | ✔ | Hỏi cách thiết kế và truy vấn tối ưu |
| Kết quả AI được kiểm tra lại | ✔ | Chạy thử unit test và build |
| Kết quả AI được chỉnh sửa trước khi sử dụng | ✔ | Chỉnh sửa check wardId và cờ vật lý |
| Prompt quan trọng được ghi lại đầy đủ | ✔ | Log đầy đủ prompt 8 và 9 |
| Prompt sai/chưa hiệu quả được rút kinh nghiệm | ✔ | Phân tích rõ hạn chế của prompt số 8 |

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
| Phan Thanh Bình | 12/07/2026 |
