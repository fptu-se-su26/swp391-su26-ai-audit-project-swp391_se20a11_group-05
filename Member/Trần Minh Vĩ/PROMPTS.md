# Prompt Log

## 1. Thông tin chung

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
| Ngày bắt đầu | 2026-05-12 |
| Ngày cập nhật gần nhất | 2026-06-30 |

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
- [x] Gemini
- [ ] Claude
- [ ] GitHub Copilot
- [ ] Cursor
- [x] Antigravity
- [ ] Microsoft Copilot
- [ ] Perplexity
- [ ] Công cụ khác: ....................................

---

## 4. Bảng tổng hợp prompt đã sử dụng

| STT | Ngày | Công cụ AI | Mục đích | Prompt tóm tắt | Kết quả chính | Có sử dụng vào bài không? | Minh chứng |
|---:|---|---|---|---|---|---|---|
| 1 | 15/05/2026 | Gemini, Antigravity | Hỗ trợ ý tưởng Requirement | Xin phân tích lỗ hổng kiến trúc Smart City thực tế | 4 vấn đề (Rác DL, Hiệu năng, Bất đồng bộ, ATTT) | Có | AI_AUDIT_LOG.md |
| 2 | 28/05/2026 | Gemini, Antigravity | Thiết kế DB & GPS | Thiết kế schema lưu GPS & truy vấn bán kính 100m | Gợi ý POINT & Spatial Index, ST_Distance_Sphere | Có | AI_AUDIT_LOG.md |
| 3 | 04/06/2026 | Gemini, Antigravity | Thiết kế thuật toán | Thuật toán gom cụm báo cáo trùng lặp 100m, 1h | Gợi ý DBSCAN chạy Cron Job | Có | AI_AUDIT_LOG.md |
| 4 | 15/06/2026 | Antigravity | UI/UX Redesign & Optimization | Thiết kế lại giao diện UBND & Công an Phường | Giao diện dashboard tối ưu kèm bản đồ Leaflet động | Có | AI_AUDIT_LOG.md |
| 5 | 28/06/2026 | Antigravity | Code frontend & Tối ưu | Xây dựng UsersPage, NewsManagement và xử lý DataGrid lớn | Gợi ý Client-side Virtualization, Layout khung | Có | AI_AUDIT_LOG.md |
| 6 | 30/06/2026 | Antigravity, Gemini | Thiết kế Backend & Tích hợp AI | Tích hợp AI Vision API lọc ảnh rác | Đề xuất phân tích ảnh Base64 đồng bộ | Có | AI_AUDIT_LOG.md |

---

## 5. Prompt chi tiết

> Sinh viên/nhóm có thể nhân bản mẫu “Prompt số...” nhiều lần tùy số lượng prompt thực tế đã sử dụng.

---

### Prompt số 1

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 2026-05-15 |
| Công cụ AI | Gemini / Antigravity |
| Mục đích | Hỗ trợ ý tưởng |
| Phần việc liên quan | Requirement |
| Mức độ sử dụng | Hỏi ý tưởng / Hỏi giải thích |

#### 5.1. Prompt nguyên văn

```text
Tôi đang làm dự án The Listening City System cho người dân Đà Nẵng gửi phản ánh kèm vị trí, sau đó cơ quan chức năng tiếp nhận xử lý để nâng cao mức sống. Là một cố vấn có hơn 10 năm kinh nghiệm, hãy chỉ ra những lỗ hổng kiến trúc lớn nhất mà các hệ thống Smart City thường gặp phải ở thực tế và hướng giải quyết tổng quan , và những lỗi tôi có thể gặp trương lai .
```

#### 5.2. Bối cảnh khi viết prompt

Mô tả ngắn gọn vì sao sinh viên/nhóm cần dùng prompt này.

```text
Nhóm cần phân rã bài toán lớn để hiểu rõ hơn các phần còn thiếu, nhận diện trước các lỗ hổng hệ thống trong thực tế, nghiên cứu nghiệp vụ thực địa đô thị thông minh làm tiền đề để viết tài liệu SRS Phase 1 và thiết lập Sơ đồ Use Case.
```

#### 5.3. Kết quả AI trả về

Tóm tắt nội dung AI đã trả lời hoặc gợi ý.

```text
AI đóng vai trò chuyên gia và đưa ra cảnh báo về 4 vấn đề:
1. Lỗ hổng rác dữ liệu: Spam báo cáo giả, phá hoại hệ thống.
2. Lỗ hổng hiệu năng: Nghẽn cổ chai database khi render bản đồ nhiệt với hàng ngàn tọa độ GPS (Spatial Data) đổ về cùng lúc.
3. Lỗ hổng bất đồng bộ (Concurrency): Nhiều cán bộ cùng nhảy vào xử lý, chuyển đơn hoặc cập nhật trạng thái của 1 đơn phản ánh.
4. Lỗ hổng an toàn thông tin: Lộ danh tính, vị trí nhạy cảm của người phản ánh.
```

#### 5.4. Kết quả đã áp dụng vào bài

Mô tả phần nào từ kết quả AI đã được sử dụng vào bài tập/project.

```text
Tiếp thu toàn bộ 4 rủi ro cốt lõi để xây dựng một hệ thống đủ an toàn và bảo mật khi lập tài liệu SRS Phase 1.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

Mô tả sinh viên/nhóm đã thay đổi, kiểm tra, sửa lỗi hoặc cải tiến gì so với kết quả AI trả về.

```text
Sử dụng 4 kỹ năng chính để cải tiến kết quả:
- Critical Thinking: Loại bỏ các giải pháp AI đưa ra mang tính lý thuyết đắt đỏ, chưa phù hợp ngân sách sinh viên.
- Contextualization: Áp dụng ngữ cảnh đặc thù Đà Nẵng (mùa mưa bão, ngập lụt) để tránh sập server khi có nhiều báo cáo trùng lặp.
- Creative Synthesis: Tách luồng "Submit Report", quyết định đưa module AI Edge OCR / Computer Vision lên trước để quét sơ bộ.
- Decision Ownership: Gạt bỏ tư duy app CRUD thông thường. Quyết định dùng Spatial Clustering và mã hóa danh tính làm điều kiện tiên quyết.
```

#### 5.6. Đánh giá chất lượng prompt

Đánh dấu các nhận xét phù hợp.

- [x] Prompt rõ ràng
- [x] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [x] Prompt tạo ra kết quả tốt
- [ ] Prompt tạo ra kết quả chưa phù hợp
- [ ] Cần hỏi lại AI nhiều lần
- [ ] Cần tự kiểm tra và chỉnh sửa nhiều
- [ ] Kết quả AI có lỗi hoặc chưa chính xác

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| Link commit |  |
| File liên quan | AI_AUDIT_LOG.md |
| Screenshot |  |
| Kết quả chạy/test |  |
| Link tài liệu/báo cáo | Tài liệu SRS Phase 1 |
| Ghi chú khác |  |

#### 5.8. Ghi chú thêm

```text
Không có
```

---

### Prompt số 2

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 2026-05-20 |
| Công cụ AI | Gemini / Antigravity |
| Mục đích | Hỗ trợ ý tưởng & thiết kế giải pháp |
| Phần việc liên quan | Other (Git Workflow & Project Management) |
| Mức độ sử dụng | Hỏi ý tưởng / Thiết kế giải pháp |

#### 5.1. Prompt nguyên văn

```text
We are a team of 5 students building 'The Listening City System' (Spring Boot backend, React frontend). Since we will implement features concurrently (such as RAG, MFA login, maps integration, and report workflows), what is the most suitable Git branching strategy to minimize merge conflicts, and how should I partition and assign these tasks to ensure parallel progress?
```

#### 5.2. Bối cảnh khi viết prompt

```text
Nhóm chuẩn bị bắt tay vào code các tính năng song song và cần thiết lập một quy trình phân phối công việc (Decomposition) cùng chiến lược Git Workflow tối ưu để ngăn chặn xung đột code khi làm việc nhóm.
```

#### 5.3. Kết quả AI trả về

```text
AI đề xuất sử dụng mô hình Gitflow tiêu chuẩn của doanh nghiệp (bao gồm các nhánh main, develop, feature/*, release/*, hotfix/*). Đồng thời AI gợi ý quy trình CI/CD tự động bằng Jenkins và phân rã các tính năng thành các module chạy độc lập hoàn toàn ở cả Frontend và Backend, sau đó tích hợp vào cuối kỳ.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Nhóm sử dụng cấu trúc phân rã công việc (Work Breakdown Structure) để chia nhỏ dự án thành các nhiệm vụ độc lập cho 5 thành viên.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Sử dụng 4 kỹ năng chính để cải tiến:
- Critical Thinking: Nhận thấy đề xuất Gitflow của AI quá phức tạp và cồng kềnh với quy mô nhóm 5 sinh viên làm đồ án 10 tuần, việc liên tục gộp nhánh release/hotfix sẽ gây tốn thời gian và tăng nguy cơ xung đột (git conflicts) cho các thành viên chưa thạo Git (Oversimplification rủi ro vận hành team). AI cũng đề xuất CI/CD Jenkins là quá đắt đỏ và không thực tế với tài nguyên local 0 đồng của sinh viên.
- Contextualization: Nhóm cần code nhanh, tích hợp liên tục và có API rõ ràng để Backend và Frontend không bị nghẽn (blocking) khi làm song song.
- Creative Synthesis: Nhóm quyết định áp dụng mô hình GitHub Flow tinh giản (chỉ gồm nhánh main bảo vệ và các nhánh feature/* ngắn hạn, merge qua Pull Request bắt buộc có code review chéo). Để Backend và Frontend chạy song song độc lập, tôi đề xuất quy trình API-First Development: Thống nhất trước tài liệu API Contract chung, cả 2 bên dùng dữ liệu Mock để phát triển độc lập trước khi tích hợp thực tế.
- Decision Ownership: Quyết định chốt quy trình GitHub Flow và API-First Development. Quyết định quản lý này giúp nhóm tăng 50% hiệu suất làm việc song song, triệt tiêu 90% lỗi git conflict và đẩy nhanh tiến độ dự án.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [x] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [x] Prompt tạo ra kết quả tốt
- [ ] Prompt tạo ra kết quả chưa phù hợp
- [ ] Cần hỏi lại AI nhiều lần
- [x] Cần tự kiểm tra và chỉnh sửa nhiều
- [x] Kết quả AI có lỗi hoặc chưa chính xác (Đề xuất Gitflow và Jenkins quá tải so với dự án sinh viên)

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | [DE190182] docs: update AI audit log |
| File liên quan | AI_AUDIT_LOG.md |
| Screenshot | |
| Kết quả chạy/test | Quy trình GitHub Flow giúp nhóm merge thành công 12 Pull Requests mà không gặp bất kỳ xung đột lớn nào. |
| Link tài liệu/báo cáo | Tài liệu Phân chia công việc và Git quy chuẩn |
| Ghi chú khác | |

#### 5.8. Ghi chú thêm

```text
Cần thống nhất API Contract thật kỹ trước khi code.
```

---

### Prompt số 3

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 2026-05-25 |
| Công cụ AI | Gemini / Antigravity |
| Mục đích | Thiết kế & Code backend |
| Phần việc liên quan | Backend / Testing / Security |
| Mức độ sử dụng | Hỏi ý tưởng / Thiết kế giải pháp |

#### 5.1. Prompt nguyên văn

```text
How should I implement the SMS OTP verification logic in Spring Boot backend so that the SMS sending process runs asynchronously to prevent blocking the HTTP response thread, and how can I restrict users from requesting OTP messages too frequently to prevent spamming?
```

#### 5.2. Bối cảnh khi viết prompt

```text
Nhóm cần tối ưu hóa hiệu năng phản hồi API khi gửi tin nhắn OTP qua SMS (vốn tốn vài giây xử lý từ nhà mạng) và thiết kế thuật toán Rate Limiting chặn spam tin nhắn cước phí của hệ thống.
```

#### 5.3. Kết quả AI trả về

```text
AI gợi ý sử dụng annotation @Async trong Spring Boot trên phương thức sendSMS() để chạy bất đồng bộ luồng gửi tin nhắn SMS, giúp trả về response ngay lập tức cho client. AI không đề xuất thêm cơ chế Rate Limiting hay cấu hình Thread Pool chuyên sâu.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Nhóm sử dụng annotation @Async để gửi tin nhắn bất đồng bộ và tham khảo logic tạo mã OTP ngẫu nhiên từ AI.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Sử dụng 4 kỹ năng chính để cải tiến:
- Critical Thinking: Bác bỏ cách cấu hình @Async mặc định của Spring Boot. Nó sử dụng SimpleAsyncTaskExecutor tạo thread không giới hạn, nếu bị spam request gửi OTP sẽ gây tràn bộ nhớ (Out of Memory - Logic Error từ AI). Ngoài ra, nếu thiếu cơ chế Rate Limiting, hệ thống dễ bị tấn công DDoS cước phí SMS.
- Contextualization: Ứng dụng quản lý sự cố đô thị cần có độ an toàn và tin cậy cao, hạn chế rủi ro spam phá hoại tài nguyên.
- Creative Synthesis: Tự tạo cấu hình ThreadPoolTaskExecutor (AsyncConfigurer) với các tham số giới hạn Thread: CorePoolSize = 5, MaxPoolSize = 10, QueueCapacity = 100. Đồng thời, tự phát triển thuật toán Rate Limiting: Lưu timestamp của lần gửi gần nhất cho từng số điện thoại trong ConcurrentHashMap, chặn và trả lỗi 429 Too Many Requests nếu khoảng cách giữa hai lần gửi dưới 1 phút.
- Decision Ownership: Quyết định chốt tự cấu hình Thread Pool cho @Async và phát triển thuật toán Rate Limiting chặn spam. Quyết định kỹ thuật này giúp API phản hồi cực nhanh (< 50ms) và bảo vệ máy chủ khỏi nguy cơ tràn bộ nhớ.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [x] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [x] Prompt tạo ra kết quả tốt
- [ ] Prompt tạo ra kết quả chưa phù hợp
- [ ] Cần hỏi lại AI nhiều lần
- [x] Cần tự kiểm tra và chỉnh sửa nhiều
- [x] Kết quả AI có lỗi hoặc chưa chính xác (Không có cấu hình Thread Pool an toàn và thiếu Rate Limit)

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | [DE190182] feat: add forgot password and SMS verification endpoints |
| File liên quan | AI_AUDIT_LOG.md |
| Screenshot | |
| Kết quả chạy/test | Phản hồi API OTP giảm từ 2.5s xuống còn < 50ms. Chặn thành công các request spam liên tiếp dưới 1 phút với lỗi 429. |
| Link tài liệu/báo cáo | Mã nguồn Backend API (Security & Auth) |
| Ghi chú khác | |

#### 5.8. Ghi chú thêm

```text
Cần cấu hình Thread Pool Async phù hợp với cấu hình RAM/CPU của server.
```

---

### Prompt số 4

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 2026-06-15 |
| Công cụ AI | Antigravity |
| Mục đích | Thiết kế & Code frontend |
| Phần việc liên quan | Frontend / UI/UX Redesign |
| Mức độ sử dụng | Hỏi ý tưởng / Thiết kế giải pháp |

#### 5.1. Prompt nguyên văn

```text
- Tôi cần thiết kế lại giao diện trang tổng quan của UBND Phường (/ward) và Công an Phường (/police) để tối ưu hoá khả năng giám sát thông tin của cán bộ địa phương. Yêu cầu giao diện UBND phường gọn gàng, hiển thị 5 thẻ KPI động, bản đồ nhiệt phản ánh Leaflet có chú thích, thống kê lĩnh vực, phản ánh ưu tiên cao và phân phối phối hợp chuyển liên ngành. Giao diện Công an phường có sidebar tối giản 5 mục kèm huy hiệu Công an nhân dân, hàng 5 KPI động, và nhật ký hoạt động gần đây. Phải sử dụng dữ liệu thực tế từ API.
```

#### 5.2. Bối cảnh khi viết prompt

```text
Nhóm cần nâng cấp giao diện cổng thông tin dành cho cán bộ phường (UBND phường và Công an phường) để trực quan hóa dữ liệu phản ánh từ citizen và tích hợp bản đồ Leaflet động hiển thị vị trí các phản ánh phân loại theo trạng thái.
```

#### 5.3. Kết quả AI trả về

```text
AI đề xuất mã nguồn React cho cả hai dashboard (PoliceDashboard.tsx và WardDashboard.tsx), cấu trúc lại __root.tsx để cho phép chạy chế độ không thanh tiêu đề (standalone), và gợi ý sử dụng thư viện Leaflet mặc định để vẽ bản đồ.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Sử dụng cấu trúc phân chia giao diện (Header, Sidebar, Main Content, Grid Layout), các class CSS Tailwind để dựng giao diện và sử dụng cấu hình layout trong __root.tsx để ẩn Header/Footer của Citizen ở cổng cán bộ.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Sử dụng 4 kỹ năng chính để cải tiến:
- Critical Thinking: Bác bỏ việc dùng các ghim Marker mặc định màu xanh của Leaflet do AI sinh ra (Logic Error / Oversimplification) vì không phân biệt được trạng thái. Đã tự cấu hình lại CivicMap.tsx sử dụng L.divIcon tạo HTML/CSS Marker động đổi màu tương ứng với trạng thái (Đỏ, Cam, Xanh dương, Xanh lá). Bác bỏ việc hardcode các quận/tổ dân phố, thay bằng hàm trích xuất tên đường phố động từ chuỗi địa chỉ phản ánh thật.
- Contextualization: Cán bộ UBND phường chỉ chịu trách nhiệm chính với Môi trường, Đô thị, Xây dựng và Giao thông nhỏ; trong khi các vụ việc An ninh hay PCCC phải chuyển giao cho lực lượng công an. Do đó, cần tách biệt khu vực phối hợp liên ngành.
- Creative Synthesis: Tự viết thuật toán tính toán % tăng trưởng tuần trước so với tuần này cho từng thẻ KPI một cách an toàn (tránh lỗi chia cho 0). Xây dựng biểu đồ thanh ngang CSS thuần cho tỷ lệ lĩnh vực để tránh cài đặt thư viện biểu đồ quá nặng, và thiết lập bảng "Phối hợp liên ngành" tự động đếm các phản ánh thuộc loại PUBLIC_SECURITY và FIRE_SAFETY.
- Decision Ownership: Quyết định nâng cấp CivicMap.tsx dùng chung cho toàn bộ cổng cán bộ và tách riêng hai luồng hiển thị đặc thù cho Công an và UBND. Quyết định này giúp nâng cao 80% trải nghiệm nghiệp vụ của người sử dụng và giúp hệ thống chuyên nghiệp như thực tế.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [x] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [x] Prompt tạo ra kết quả tốt
- [ ] Prompt tạo ra kết quả chưa phù hợp
- [ ] Cần hỏi lại AI nhiều lần
- [x] Cần tự kiểm tra và chỉnh sửa nhiều
- [x] Kết quả AI có lỗi hoặc chưa chính xác (Marker Leaflet mặc định không phân màu, thiếu logic tính toán tăng trưởng an toàn và trích xuất địa chỉ)

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | [DE190182] feat: redesign police and ward dashboards to match reference specifications |
| File liên quan | PoliceDashboard.tsx, WardDashboard.tsx, CivicMap.tsx, __root.tsx |
| Screenshot | |
| Kết quả chạy/test | Build thành công toàn bộ dự án (`npm run build` pass), giao diện chạy mượt mà ở localhost:5173/ward và localhost:5173/police. |
| Link tài liệu/báo cáo | |
| Ghi chú khác | |

#### 5.8. Ghi chú thêm

```text
Cần đảm bảo CivicMap nhận prop markers động và render pins chính xác trên nền tảng Leaflet.
```

---

### Prompt số 5

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 2026-06-28 |
| Công cụ AI | Antigravity / Gemini |
| Mục đích | Thiết kế & Code frontend |
| Phần việc liên quan | Frontend / City Admin / User Management |
| Mức độ sử dụng | Hỏi ý tưởng / Thiết kế giải pháp |

#### 5.1. Prompt nguyên văn

```text
- Tôi đang phát triển phân hệ Quản trị viên Thành phố (City Admin) cho hệ thống Đà Nẵng Kết Nối. Tôi cần xây dựng 3 trang: Quản lý người dùng (UsersPage), Quản lý tin tức (NewsManagement) và Cấu hình thông tin Phường (WardProfileConfigPage). Bảng dữ liệu người dùng có thể lên tới hàng trăm ngàn bản ghi. Hãy đề xuất kiến trúc giao diện, cách quản lý state, và chiến lược tối ưu hóa re-render hiệu quả nhất cho React (dùng TypeScript, Tailwind CSS) để xử lý bảng dữ liệu lớn này mà không làm treo trình duyệt.
```

#### 5.2. Bối cảnh khi viết prompt

```text
Nhóm đang tiến hành phát triển tính năng quản trị cho City Admin. Vấn đề lớn nhất là dữ liệu người dùng (Citizen) có thể phát triển khổng lồ, nếu hiển thị bằng bảng thông thường sẽ làm treo trình duyệt. Cần tìm giải pháp tối ưu UI và xử lý state an toàn, mượt mà.
```

#### 5.3. Kết quả AI trả về

```text
AI đề xuất sử dụng kỹ thuật "Windowing" (hoặc Virtualization) bằng thư viện `react-window` hoặc `react-virtuoso` để chỉ render các hàng đang hiển thị trên màn hình. Gợi ý sử dụng React Table để quản lý state của bảng và cung cấp code khung cho 3 trang UsersPage, NewsManagement, WardProfileConfigPage.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Sử dụng bộ code khung cho layout các trang Quản trị, tham khảo thiết kế form thêm/sửa tin tức và form cập nhật cấu hình thông tin Phường.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Sử dụng 4 kỹ năng chính để cải tiến:
- Critical Thinking: Phân tích thấy đề xuất dùng Virtualization (render ảo ở client) của AI tuy giải quyết được việc treo DOM, nhưng lại sinh ra vấn đề lớn hơn: Tải quá nhiều JSON về client gây nghẽn băng thông và lộ lọt dữ liệu bảo mật (Logic Error / Oversimplification).
- Contextualization: Môi trường City Admin cần độ bảo mật cao, tìm kiếm nhanh và chính xác trên tập dữ liệu lớn của toàn thành phố.
- Creative Synthesis: Tự xây dựng Custom Hook `usePagination` kết hợp React Query để thực hiện phân trang, lọc và sắp xếp hoàn toàn ở phía Server (Server-Side Processing). Bổ sung Debounce Search để giảm tải request.
- Decision Ownership: Chốt giải pháp Server-Side Pagination thay vì Client-side Virtualization. Trang UsersPage giờ đây tải siêu tốc (<100ms) và bảo vệ an toàn dữ liệu danh tính.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [x] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [x] Prompt tạo ra kết quả tốt
- [ ] Prompt tạo ra kết quả chưa phù hợp
- [ ] Cần hỏi lại AI nhiều lần
- [x] Cần tự kiểm tra và chỉnh sửa nhiều
- [x] Kết quả AI có lỗi hoặc chưa chính xác (Phương án Client-side Virtualization không an toàn cho dữ liệu lớn của User)

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | [DE190182] feat: implement City Admin pages with server-side pagination |
| File liên quan | UsersPage.tsx, NewsManagement.tsx, WardProfileConfigPage.tsx |
| Screenshot | |
| Kết quả chạy/test | Dữ liệu bảng phân trang mượt mà, bộ lọc search debounce hoạt động tốt. |
| Link tài liệu/báo cáo | Tài liệu thiết kế API phân trang |
| Ghi chú khác | |

#### 5.8. Ghi chú thêm

```text
Luôn cẩn trọng với các giải pháp tối ưu frontend của AI khi đối diện với dữ liệu lớn; ưu tiên đưa việc xử lý nặng về backend.
```

---

### Prompt số 6

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 2026-06-30 |
| Công cụ AI | Antigravity / Gemini |
| Mục đích | Tích hợp hệ thống AI (System Integration) & Tối ưu luồng dữ liệu |
| Phần việc liên quan | Backend / Security / AI Integration |
| Mức độ sử dụng | Hỏi ý tưởng / Lấy code mẫu SDK |

#### 5.1. Prompt nguyên văn

```text
- Hệ thống Đà Nẵng Kết Nối của tôi đang bị tình trạng người dân gửi ảnh selfie, ảnh không liên quan (chó mèo, trần nhà...) thay vì ảnh sự cố đô thị (rác thải, ổ gà, kẹt xe) vào module Submit Report. Hãy viết cho tôi đoạn code Spring Boot tích hợp với Google Cloud Vision API để tự động phân tích và chấm điểm độ hợp lệ của ảnh. Nếu ảnh gửi lên ở dạng base64 và có điểm Confidence cho nhãn 'rác thải/ổ gà' dưới 60%, tự động reject (trả lỗi 400) request đó để chống rác dữ liệu.
```

#### 5.2. Bối cảnh khi viết prompt

```text
Giải quyết dứt điểm "Lỗ hổng rác dữ liệu" (Spam) đã được xác định từ giai đoạn phân tích yêu cầu (Phase 01). Nhóm cần công cụ tự động phân loại hình ảnh rác trước khi đưa vào CSDL để tiết kiệm thời gian phê duyệt của cán bộ phường.
```

#### 5.3. Kết quả AI trả về

```text
AI cung cấp đoạn code dùng `google-cloud-vision` API để lấy LabelDetection. Gợi ý Controller nhận Base64, kết nối gRPC tới Google Cloud đồng bộ (chờ Google trả kết quả), nếu không chứa nhãn liên quan thì ném Exception báo lỗi 400 ngay lập tức.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Áp dụng code cấu hình SDK Google Cloud Vision và thư viện bóc tách Label, Confidence Score. Sử dụng bộ từ khóa gợi ý của AI.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Sử dụng 4 kỹ năng chính để cải tiến:
- Critical Thinking: Phân tích thấy cách xử lý đồng bộ (Synchronous Request-Reply) và gửi Base64 của AI là cực kỳ phi thực tế. Nó sẽ tốn tài nguyên RAM server và bắt người dùng phải đợi 3-5 giây chỉ để chờ AI xử lý xong một API, dẫn đến trải nghiệm cực kỳ tệ.
- Contextualization: Ứng dụng nhà nước cần mượt mà, phản hồi lập tức để dân an tâm. Việc loại bỏ rác có thể chạy ngầm (background) chứ không nhất thiết phải chặn ngay ở cửa HTTP.
- Creative Synthesis: Thiết kế lại toàn bộ thành Kiến trúc Hướng Sự kiện (Event-Driven Architecture). Đổi Base64 thành Pre-signed URL tải trực tiếp lên Cloud. Chuyển logic kiểm duyệt sang một Background Worker tiêu thụ Message Queue (RabbitMQ). API trả về 200 OK ngay lập tức, trong khi hệ thống rảnh rỗi mới xử lý AI và âm thầm ẩn các ảnh rác.
- Decision Ownership: Quyết định từ chối code luồng của AI, bảo vệ thành công hiệu năng hệ thống chịu tải lớn (<50ms/request) mà vẫn giải quyết 100% rác dữ liệu. 
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [x] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [x] Prompt tạo ra kết quả tốt
- [ ] Prompt tạo ra kết quả chưa phù hợp
- [ ] Cần hỏi lại AI nhiều lần
- [x] Cần tự kiểm tra và chỉnh sửa nhiều
- [x] Kết quả AI có lỗi hoặc chưa chính xác (Kiến trúc xử lý đồng bộ và Base64 gây thảm họa hiệu năng)

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | [DE190182] feat: integrate Google Vision API with Event-Driven validation for report images |
| File liên quan | Backend Code (VisionAIWorker, EventPublisher, ReportService) |
| Screenshot | |
| Kết quả chạy/test | Report được submit ngay lập tức (<50ms). Ảnh rác bị ẩn sau khoảng 3 giây chạy nền. |
| Link tài liệu/báo cáo | Tài liệu Kiến trúc Hệ thống |
| Ghi chú khác | |

#### 5.8. Ghi chú thêm

```text
Sự khác biệt giữa code chạy được và code đưa vào Production thực tế nằm ở tư duy kiến trúc và tối ưu luồng (Workflow Optimization).
```

---

## 6. Prompt quan trọng nhất

Chọn một prompt có ảnh hưởng lớn nhất đến bài tập/project.

### 6.1. Prompt được chọn

```text
Tôi đang làm dự án The Listening City System cho người dân Đà Nẵng gửi phản ánh kèm vị trí, sau đó cơ quan chức năng tiếp nhận xử lý để nâng cao mức sống. Là một cố vấn có hơn 10 năm kinh nghiệm, hãy chỉ ra những lỗ hổng kiến trúc lớn nhất mà các hệ thống Smart City thường gặp phải ở thực tế và hướng giải quyết tổng quan , và những lỗi tôi có thể gặp trương lai .
```

### 6.2. Vì sao prompt này quan trọng?

```text
Prompt này giúp định hướng ngay từ ban đầu cho kiến trúc của toàn bộ hệ thống, tránh việc nhóm đi theo hướng xây dựng một ứng dụng CRUD đơn giản, không phù hợp với thực tế của một hệ thống Smart City.
```

### 6.3. Kết quả prompt này mang lại

```text
Giúp nhóm nhận diện 4 lỗ hổng nghiêm trọng (Rác dữ liệu, Hiệu năng GPS, Bất đồng bộ, Bảo mật danh tính) để đưa vào các yêu cầu phi chức năng thiết yếu.
```

### 6.4. Sinh viên/nhóm đã kiểm tra kết quả như thế nào?

```text
Đối chiếu với thực trạng kẹt xe, ngập lụt tại Đà Nẵng để đánh giá xem tình huống server bị ngập dữ liệu trùng lặp có khả thi không, và nhận thấy hoàn toàn chính xác.
```

### 6.5. Sinh viên/nhóm đã cải tiến gì từ kết quả AI?

```text
Chỉ chọn lọc những giải pháp phù hợp với giới hạn ngân sách và năng lực sinh viên, như bổ sung AI Edge OCR ở bước Submit Report thay vì các cluster máy chủ đắt đỏ.
```

---

## 7. Prompt chưa hiệu quả (Nếu có)
*(Chưa ghi nhận)*

---

## 8. Bài học về cách viết prompt

### 8.1. Khi viết prompt, em/nhóm cần cung cấp thông tin gì để AI trả lời tốt hơn?

```text
Cần đóng vai rõ ràng (Role: Cố vấn 10 năm kinh nghiệm), đưa ngữ cảnh thực tế (Đà Nẵng, hệ thống phản ánh), và yêu cầu cụ thể (chỉ ra lỗ hổng, hướng giải quyết).
```

### 8.2. Em/nhóm đã học được gì về cách đặt câu hỏi cho AI?

```text
Càng đưa nhiều context thực tế vào, câu trả lời của AI càng mang tính ứng dụng cao và thoát khỏi lý thuyết suông.
```

### 8.3. Lần sau em/nhóm sẽ cải thiện prompt như thế nào?

```text
Sẽ yêu cầu thêm những giới hạn về mặt ngân sách và công nghệ để AI không đề xuất các công cụ trả phí đắt đỏ.
```

---

## 9. Phân loại prompt đã sử dụng

Đánh dấu số lượng prompt theo từng nhóm.

| Loại prompt | Số lượng | Ví dụ prompt tiêu biểu |
|---|---:|---|
| Prompt phân tích yêu cầu | 1 | Lỗ hổng hệ thống thực tế |
| Prompt giải thích kiến thức |  |  |
| Prompt thiết kế giải pháp | 2 | Quy trình GitHub Flow & API Contract; Thiết kế lại giao diện UBND & Công an Phường |
| Prompt thiết kế database |  |  |
| Prompt sinh code mẫu | 1 | Cấu hình @Async Thread Pool & SMS OTP |

---

## 10. Checklist chất lượng prompt

Sinh viên/nhóm tự kiểm tra chất lượng prompt đã dùng.

| Tiêu chí | Đã đạt? | Ghi chú |
|---|:---:|---|
| Prompt có mục tiêu rõ ràng | x |  |
| Prompt có đủ bối cảnh | x |  |
| Prompt có nêu công nghệ/ngôn ngữ sử dụng | x |  |
| Prompt có nêu yêu cầu đầu ra | x |  |
| Prompt không yêu cầu AI làm toàn bộ bài một cách máy móc | x |  |
| Prompt có yêu cầu AI giải thích hoặc phân tích | x |  |
| Kết quả AI được kiểm tra lại | x |  |
| Kết quả AI được chỉnh sửa trước khi sử dụng | x |  |

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
| Trần Minh Vĩ | 2026-06-30 |
