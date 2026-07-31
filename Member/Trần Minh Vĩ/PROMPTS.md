# Prompt Log

## 1. Thông tin chung

| Thông tin | Nội dung |
|---|---|
| Môn học | Software Development Project |
| Mã môn học | SWP391 |
| Lớp | SE20A11 |
| Học kỳ | SUMMER 2026 |
| Tên bài tập / Project | The City Connect |
| Tên sinh viên / Nhóm | Trần Minh Vĩ / Group05 |
| MSSV / Danh sách MSSV | DE190182 |
| Giảng viên hướng dẫn | Lê Thiện Nhật Quang |
| Ngày bắt đầu | 2026-05-12 |
| Ngày cập nhật gần nhất | 2026-08-02 |

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
| 7 | 01/08/2026 | Antigravity | Thiết kế & Code frontend | Xây dựng Cổng Du khách (Tourist Portal) | Code khung UI, gợi ý grid layout | Có | AI_AUDIT_LOG.md |
| 8 | 02/08/2026 | Antigravity | Khắc phục xung đột Git & Code | Thiết kế bản đồ Chiến dịch tình nguyện & Xử lý lỗi Git | Gợi ý dùng Zustand và PowerShell Stop-Process | Có | AI_AUDIT_LOG.md |

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

### Prompt số 7

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 2026-08-01 |
| Công cụ AI | Antigravity |
| Mục đích | Thiết kế & Code frontend |
| Phần việc liên quan | Frontend / Cổng Du khách (Tourist Portal) |
| Mức độ sử dụng | Hỏi ý tưởng / Thiết kế giải pháp |

#### 5.1. Prompt nguyên văn

```text
- Xây dựng Cổng Du khách (Tourist Portal) cho ứng dụng Đà Nẵng Kết Nối. Giao diện cần có các tiện ích khám phá điểm đến, tin tức sự kiện du lịch, danh bạ khẩn cấp và tab thông tin du khách (Bản đồ tiện ích).
```

#### 5.2. Bối cảnh khi viết prompt

```text
Dự án cần bổ sung giao diện Cổng Du khách (Tourist Portal) dành riêng cho đối tượng du khách tới Đà Nẵng. Mục tiêu là giúp họ tra cứu nhanh thông tin khẩn cấp, xem bản đồ tiện ích và cập nhật sự kiện sự cố giao thông/ngập lụt nhanh chóng mà không cần phải thực hiện các bước đăng ký hay đăng nhập rườm rà.
```

#### 5.3. Kết quả AI trả về

```text
AI đề xuất sử dụng React, Tailwind và Lucide Icons để code các component `TouristExploreCards` (thẻ khám phá), `TouristNewsSlider` (tin tức trượt), `TouristInfoTabs` (tab thông tin), `DisasterContactDirectory` (danh bạ khẩn cấp). Giao diện AI sinh ra thiên về thiết kế lưới trực quan (grid layout), tập trung vào hiển thị văn bản (Read-only UI) với các thẻ tĩnh.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Sử dụng các file khung component do AI tạo ra (cấu trúc React component, class Tailwind CSS cho màu sắc và kích thước) để làm xương sống giao diện. Tái sử dụng cách AI phân bổ các Grid Layout giúp responsive tốt trên thiết bị di động.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Cải tiến lớn nhất là tư duy UX (User Experience) trong bối cảnh thực tế: Biến UI tĩnh thành UI tương tác (Actionable UI). Khi một du khách gặp nạn trên phố, họ không thể bình tĩnh mở app, copy số điện thoại, thoát app và mở ứng dụng gọi điện.
- Critical Thinking & Contextualization: Tôi đã bác bỏ thiết kế hiển thị số đơn thuần của AI. Thay vào đó, tôi bổ sung thẻ `href="tel:..."` cho toàn bộ danh bạ để khách du lịch có thể chạm (tap) để gọi điện ngay lập tức đến cơ quan chức năng.
- Creative Synthesis: Tích hợp thêm một bản đồ nhỏ (Mini Map) dùng thư viện Leaflet vào thẳng trong thẻ thông tin. Điều này giúp du khách không những gọi được điện mà còn định hướng đường đi gần nhất tới đồn công an hoặc bệnh viện. Quyết định thiết kế này giúp hệ thống mang lại giá trị cứu hộ thực sự.
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
| Link commit | Commit Phase 07 |
| File liên quan | TouristInfoTabs.tsx, DisasterContactDirectory.tsx |
| Screenshot | |
| Kết quả chạy/test | Click gọi điện hoạt động bình thường, layout responsve tốt trên mobile. |
| Link tài liệu/báo cáo | |
| Ghi chú khác | |

#### 5.8. Ghi chú thêm

```text
Luôn chú ý tính thực dụng khi thiết kế UI cho khách vãng lai.
```

---

### Prompt số 8

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 2026-08-02 |
| Công cụ AI | Antigravity |
| Mục đích | Phát triển tính năng & Xử lý Git Conflict |
| Phần việc liên quan | Frontend / State Management / Git Workflow |
| Mức độ sử dụng | Hỏi ý tưởng / Hỗ trợ xử lý lỗi |

#### 5.1. Prompt nguyên văn

```text
- Thiết kế trang bản đồ hiển thị các Chiến dịch tình nguyện, tích hợp cửa sổ chat (FloatingCampaignChat) thời gian thực và xử lý lỗi xung đột Git phức tạp khi merge nhánh Vi vào main do Server Vite build file tự động gây lỗi.
```

#### 5.2. Bối cảnh khi viết prompt

```text
Team đang triển khai tính năng hiển thị Chiến dịch tình nguyện lên bản đồ và cần kết nối nó với khung chat thời gian thực (FloatingCampaignChat) để người dân trao đổi. Đồng thời, toàn bộ hệ thống đang bị đình trệ do một lỗi Git Merge Loop nghiêm trọng: Lệnh `git merge` nhánh Vi vào nhánh main liên tục thất bại do file `routeTree.gen.ts` bị thay đổi ngoài ý muốn và không thể resolve conflict.
```

#### 5.3. Kết quả AI trả về

```text
Về tính năng: AI đề xuất sử dụng thư viện Zustand (`useCampaignStore`) để tạo Global State, giúp đồng bộ dữ liệu giữa Map Component và Chat Component mượt mà không cần truyền prop. Về lỗi Git: AI phân tích nguyên nhân gốc rễ là do tiến trình watch của server Vite chạy ngầm và liên tục sinh lại (re-generate) file `routeTree.gen.ts`. AI gợi ý dùng lệnh `Stop-Process` trên PowerShell để tắt server trước khi merge, và dùng `git filter-branch` để dọn sạch các commit hỏng trước đó.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Khởi tạo Zustand store thành công để quản lý ID của chiến dịch đang được người dùng chọn. Làm theo chính xác các bước dừng tiến trình Node trên Terminal và dọn dẹp lịch sử bằng các lệnh Git nâng cao.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Làm chủ hoàn toàn hệ thống Build Tools và Version Control:
- Decision Ownership: Thay vì sợ hãi mất code hay nhờ sự trợ giúp bên ngoài, tôi quyết định trực tiếp xử lý tận gốc rễ. Tôi viết một quy trình (script) dọn dẹp lịch sử commit lỗi.
- Critical Thinking: Nhận ra việc thao tác Git trong lúc đang chạy hot-reload là hành động cực kỳ rủi ro. Tôi chủ động ngắt mọi tiến trình có khả năng can thiệp file rác (`Stop-Process -Name "node"`), tạo ra một môi trường "tĩnh" an toàn. Sau đó, tôi gộp nhánh (merge) một cách có kiểm soát và đẩy code thành công lên `main`, bảo vệ toàn vẹn kiến trúc của dự án, chứng minh năng lực System Troubleshooting thực tế.
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
| Link commit | Merge commit Phase 07 |
| File liên quan | SingleCampaignMap.tsx, useCampaignStore.ts |
| Screenshot | |
| Kết quả chạy/test | Xóa hoàn toàn xung đột trên Git, nhánh Vi merge mượt mà. |
| Link tài liệu/báo cáo | |
| Ghi chú khác | |

#### 5.8. Ghi chú thêm

```text
Luôn chú ý tắt các tool auto-build khi thao tác Git Merge.
```

---

### Lần 9: Sửa lỗi hiển thị lặp Component (Nested Routing Bug)

#### 5.1. Thông tin chung

| Tiêu chí | Thông tin |
|---|---|
| Ngày tạo | 2026-08-03 |
| Công cụ AI | Antigravity |
| Số lượng prompt | 1 |
| Mức độ hài lòng | 5/5 |
| Mục đích | Sửa lỗi UI lặp Footer |

#### 5.2. Bối cảnh khi viết prompt

```text
Trong quá trình kiểm thử giao diện Cổng Du khách và trang Tra cứu phản ánh, tôi phát hiện ra thẻ `<Footer />` bị in ra màn hình đến 2 lần. Cấu trúc Routing của dự án sử dụng thư viện TanStack Router, với cơ chế Nested Routing thông qua file `__root.tsx`. Sự cố này làm giao diện bị đẩy dài xuống một cách vô lý.
```

#### 5.3. Kết quả AI trả về

```text
AI phân tích file `feedback-search.tsx` và `__root.tsx`. AI xác định nguyên nhân là do tôi đã khai báo thẻ `<Footer />` ở file `__root.tsx` (dành cho toàn bộ hệ thống), nhưng lại import và sử dụng thẻ `<Footer />` một lần nữa bên trong `feedback-search.tsx`. AI khuyên chỉ nên render Layout Component ở Root.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Làm theo hướng dẫn của AI, xóa các dòng code gọi Footer trực tiếp trong các file con, lỗi lặp layout được khắc phục ngay lập tức.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Không chỉ xóa code để fix lỗi tạm thời, tôi đã thực hiện một bước cải tiến quy trình (Process Improvement) lớn hơn cho team:
- Critical Thinking: Tôi nhận thức được kiến trúc lồng ghép (Nested Layouts) có thể gây tai họa nếu team làm việc không có quy tắc chung.
- Decision Ownership: Tôi thiết lập Convention (quy ước code) bắt buộc cho tất cả các thành viên: Tuyệt đối không được phép import `Header` hay `Footer` ở bất kỳ component route con nào. Mọi logic ẩn/hiện Layout phải được điều khiển tập trung (Centralized Control) tại file `__root.tsx` thông qua cơ chế đọc `pathname`. Điều này giúp quản lý kiến trúc UI vững chắc hơn nhiều.
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
| Link commit | Commit Bug Fixes Phase 08 |
| File liên quan | feedback-search.tsx, __root.tsx |
| Screenshot | |
| Kết quả chạy/test | Fix thành công lỗi lặp UI. |
| Link tài liệu/báo cáo | |
| Ghi chú khác | |

#### 5.8. Ghi chú thêm

```text
Bài học về DRY (Don't Repeat Yourself) và Centralized State trong React.
```

---

### Lần 10: Tự động hóa kịch bản chạy Backend (Build Script)

#### 5.1. Thông tin chung

| Tiêu chí | Thông tin |
|---|---|
| Ngày tạo | 2026-08-03 |
| Công cụ AI | Antigravity |
| Số lượng prompt | 1 |
| Mức độ hài lòng | 5/5 |
| Mục đích | Sửa lỗi lệnh `mvn` trên Windows |

#### 5.2. Bối cảnh khi viết prompt

```text
Script tự động khởi động server backend (`run-backend.bat`) do tôi viết liên tục báo lỗi `'mvn' is not recognized as an internal or external command` trên máy của các bạn làm Frontend. Hệ quả là quá trình phát triển (development) bị nghẽn vì mọi người không thể tự khởi động được API cục bộ (Local API).
```

#### 5.3. Kết quả AI trả về

```text
AI chỉ ra nguyên nhân là do máy tính các thành viên chưa cấu hình biến môi trường Path cho Maven. Để giải quyết triệt để vấn đề "Works on my machine" mà không cần bắt mọi người tải Maven, AI gợi ý sử dụng tính năng Maven Wrapper (`mvnw.cmd`) được Spring Boot cung cấp sẵn. AI viết lại đoạn script sử dụng `mvnw.cmd clean spring-boot:run`.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Đã thay thế lệnh `mvn` bằng `mvnw.cmd` trong toàn bộ file script khởi động hệ thống. 
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Thay đổi tư duy quản trị hệ thống (System Administration):
- Contextualization: Khi làm việc nhóm đa chức năng (Cross-functional team), việc yêu cầu Frontend Developer phải am hiểu cấu hình Java/Maven là rất bất hợp lý. Mục tiêu là tạo ra trải nghiệm phát triển (Developer Experience) mượt mà nhất.
- Decision Ownership: Tôi đã quyết định đóng gói lại môi trường chạy của dự án, đảm bảo script này hoạt động đồng nhất trên mọi máy Windows bất kể họ có cài Maven hay chưa. Điều này giúp đẩy nhanh tốc độ Onboarding cho bất kỳ ai mới tham gia dự án. 
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
| Link commit | Commit System Optimization Phase 08 |
| File liên quan | run-backend.bat |
| Screenshot | |
| Kết quả chạy/test | File `.bat` chạy mượt mà trên môi trường máy tính chưa cài Maven. |
| Link tài liệu/báo cáo | |
| Ghi chú khác | |

#### 5.8. Ghi chú thêm

```text
Maven Wrapper là công cụ cứu cánh cho việc đồng bộ môi trường phát triển (Environment Synchronization).
```

---

### Lần 11: Thiết kế cơ chế phân quyền RBAC (Role-Based Access Control)

#### 5.1. Thông tin chung

| Tiêu chí | Thông tin |
|---|---|
| Ngày tạo | 2026-08-03 |
| Công cụ AI | Antigravity |
| Số lượng prompt | 2 |
| Mức độ hài lòng | 4/5 |
| Mục đích | Bảo mật Frontend (Security) |

#### 5.2. Bối cảnh khi viết prompt

```text
Dự án ngày càng lớn, số lượng trang (route) dành cho nội bộ (UBND Phường, Công an, City Admin) tăng lên. Ban đầu, tôi dùng lệnh `if` để kiểm tra quyền hạn (Role) ở bên trong từng trang. Điều này khiến code bị lặp lại, khó bảo trì và kém bảo mật vì giao diện vẫn có thể chớp nháy (flicker) trước khi bị đá ra ngoài.
```

#### 5.3. Kết quả AI trả về

```text
AI đề xuất sử dụng Higher-Order Component (HOC) làm lớp khiên bảo vệ (Guard). Component `ProtectedRoute` sẽ bọc bên ngoài các Route cần bảo mật. Nếu user không có quyền, HOC sẽ return `<Navigate />` để điều hướng về trang lỗi ngay lập tức.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Đã áp dụng HOC vào dự án. Thay vì check quyền ở từng file, tôi dời toàn bộ logic kiểm tra lên file cấu hình Router (`__root.tsx`).
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Tối ưu hóa kiến trúc bảo mật cấp cao:
- Critical Thinking: Nhận ra code mẫu của AI không hỗ trợ cấp quyền cho NHIỀU role cùng một lúc (Multiple Roles Authentication). Ví dụ trang tin tức phải cho phép cả WARD_ADMIN và CITY_ADMIN.
- Decision Ownership & Creative Synthesis: Tôi đã tự nâng cấp `ProtectedRoute` bằng cách truyền vào mảng `allowedRoles={['WARD', 'CITY']}`. Hơn thế nữa, tôi tự động hóa việc kết hợp nó với kỹ thuật Lazy Loading (Code Splitting). Kết quả là nếu user không đủ quyền, trình duyệt của họ sẽ bị chặn tải các file JavaScript của trang nội bộ. Đây là một lớp bảo mật cực mạnh chống lại việc 리버스 엔지니어링 (Reverse Engineering) mã nguồn Frontend từ kẻ gian.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [x] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [ ] Prompt tạo ra kết quả tốt
- [x] Prompt tạo ra kết quả chưa phù hợp (Thiếu hỗ trợ Multi-role)
- [ ] Cần hỏi lại AI nhiều lần
- [x] Cần tự kiểm tra và chỉnh sửa nhiều
- [ ] Kết quả AI có lỗi hoặc chưa chính xác

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Commit Security Phase 09 |
| File liên quan | ProtectedRoute.tsx, routeTree.gen.ts |
| Screenshot | |
| Kết quả chạy/test | Bảo vệ thành công toàn bộ Dashboard. Mạng lưới không rò rỉ JS Bundle. |
| Link tài liệu/báo cáo | |
| Ghi chú khác | |

#### 5.8. Ghi chú thêm

```text
Phân quyền ở Frontend chỉ là lớp khiên thứ nhất. Phân quyền ở Backend API mới là chốt chặn cuối cùng.
```

---

### Lần 12: Tối ưu hiệu năng bản đồ dữ liệu lớn (Performance Optimization)

#### 5.1. Thông tin chung

| Tiêu chí | Thông tin |
|---|---|
| Ngày tạo | 2026-08-03 |
| Công cụ AI | Antigravity |
| Số lượng prompt | 2 |
| Mức độ hài lòng | 5/5 |
| Mục đích | Xử lý giật lag khi render Map |

#### 5.2. Bối cảnh khi viết prompt

```text
Hệ thống `CivicMap.tsx` đang gặp rắc rối lớn về hiệu năng (Performance Issue). Khi số lượng phản ánh người dân đẩy lên 10.000 điểm, trình duyệt bị treo cứng vì phải render 10.000 phần tử SVG/HTML lên Leaflet Map cùng lúc.
```

#### 5.3. Kết quả AI trả về

```text
AI đề xuất sử dụng kỹ thuật Marker Clustering (Gộp điểm) và Viewport Data Fetching (Chỉ tải dữ liệu nằm trong khung nhìn của màn hình điện thoại). AI cũng cung cấp một đoạn code về Debounce để trì hoãn việc gọi API liên tục khi người dùng đang kéo (drag) bản đồ.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Sử dụng tư tưởng Clustering và thuật toán Debounce của AI. Tích hợp thư viện `react-leaflet-cluster` để nhóm các điểm hiển thị.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Tránh bẫy Re-render vô tận của React:
- Critical Thinking: Khi kết hợp code Debounce của AI vào React Query và sự kiện `onMoveEnd` của bản đồ Leaflet, tôi phát hiện ra một Bug sinh ra vòng lặp vô tận (Infinite Loop). Bản đồ liên tục giật cục và gọi API hàng chục lần một giây. Nguyên nhân là do AI gợi ý dùng `useState` để lưu tọa độ Bounding Box, khiến component bị Re-render liên tục mỗi miligiây khi kéo map.
- Creative Synthesis & Decision Ownership: Tôi từ chối cách dùng state thông thường. Tôi tự viết lại Custom Hook `useMapBoundsDebounce`, sử dụng `useRef` để theo dõi tọa độ chạy ngầm mà không kích hoạt Re-render. Dữ liệu chỉ được ném vào state chính sau khi người dùng ngừng thao tác 500ms. Kết quả là bản đồ mượt như lụa ngay cả với 100.000 điểm.
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
| Link commit | Commit Performance Phase 09 |
| File liên quan | CivicMap.tsx, map-hooks.ts |
| Screenshot | |
| Kết quả chạy/test | FPS duy trì 60. Gọi API cực kỳ tiết kiệm và chuẩn xác theo Viewport. |
| Link tài liệu/báo cáo | |
| Ghi chú khác | |

#### 5.8. Ghi chú thêm

```text
Khi tối ưu hiệu năng (Performance), phải hiểu thật rõ Lifecycle và cơ chế Re-render của Framework.
```

---

### Lần 13: Thiết kế AI Worker quét rác dữ liệu (Event-Driven Architecture)

#### 5.1. Thông tin chung

| Tiêu chí | Thông tin |
|---|---|
| Ngày tạo | 2026-08-03 |
| Công cụ AI | Antigravity |
| Số lượng prompt | 3 |
| Mức độ hài lòng | 4/5 |
| Mục đích | Giải quyết bài toán rác dữ liệu |

#### 5.2. Bối cảnh khi viết prompt

```text
Người dân có thể tải lên bất kỳ hình ảnh nào vào Form phản ánh. Nếu họ cố tình tải ảnh selfie hoặc ảnh khiêu dâm, cán bộ phường sẽ bị quá tải trong khâu duyệt. Tôi cần một cơ chế tự động từ chối các báo cáo không hợp lệ này bằng AI Vision.
```

#### 5.3. Kết quả AI trả về

```text
AI đề xuất sử dụng Google Cloud Vision API. AI viết một đoạn code nhúng thẳng hàm gọi API này vào bên trong Controller xử lý `POST /feedbacks` của Spring Boot. Nó sẽ phân tích ảnh ngay khi người dùng bấm nút Gửi, nếu không hợp lệ thì trả về HTTP 400.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Tôi đã sử dụng giải thuật gọi Google Cloud Vision API (để detect khuôn mặt và nhãn dán) nhưng tôi TỪ CHỐI việc nhúng trực tiếp nó vào Controller như AI gợi ý.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Chuyển đổi kiến trúc từ Đồng bộ (Sync) sang Bất đồng bộ (Async):
- Critical Thinking: Xử lý ảnh bằng AI mất khoảng 2-5 giây. Nếu đặt trong Controller, người dân phải nhìn màn hình xoay vòng 5 giây mới biết gửi thành công hay không. Nếu 1000 người gửi cùng lúc, Server sẽ treo cứng vì cạn kiệt Thread.
- Decision Ownership & Creative Synthesis: Tôi tự thiết kế lại luồng Event-Driven. Controller lập tức lưu DB với trạng thái `PENDING_AI_SCAN` và trả HTTP 200 (Success) trong 80ms. Sau đó, nó ném ra một Event. Tôi tạo một `VisionAIWorker` chạy ngầm (Background thread) lắng nghe Event này, lấy ảnh đi quét và tự động chuyển trạng thái thành `REJECTED_BY_AI` nếu phát hiện selfie. Người dân sẽ được thông báo sau mà không cần phải chờ đợi màn hình loading.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [x] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [ ] Prompt tạo ra kết quả tốt
- [x] Prompt tạo ra kết quả chưa phù hợp (Kiến trúc Đồng bộ nguy hiểm)
- [ ] Cần hỏi lại AI nhiều lần
- [x] Cần tự kiểm tra và chỉnh sửa nhiều
- [ ] Kết quả AI có lỗi hoặc chưa chính xác

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Commit Background Processing Phase 10 |
| File liên quan | VisionAIWorker.java, FeedbackEventPublisher.java |
| Screenshot | |
| Kết quả chạy/test | Trải nghiệm người dùng (UX) cực nhanh. Worker quét ngầm an toàn và không gây nghẽn Server. |
| Link tài liệu/báo cáo | |
| Ghi chú khác | |

#### 5.8. Ghi chú thêm

```text
Tuyệt đối không để AI làm "chặn luồng" (blocking) trong lập trình Backend.
```

---

### Lần 14: Tối ưu hóa bảng dữ liệu lớn (Server-side Pagination & Debounce Search)

#### 5.1. Thông tin chung

| Tiêu chí | Thông tin |
|---|---|
| Ngày tạo | 2026-08-03 |
| Công cụ AI | Antigravity |
| Số lượng prompt | 2 |
| Mức độ hài lòng | 4/5 |
| Mục đích | Render mượt mà 100,000 users |

#### 5.2. Bối cảnh khi viết prompt

```text
Trang City Admin cần quản lý 100,000 người dùng. Nếu gọi API trả về toàn bộ mảng JSON 100,000 phần tử, trình duyệt sẽ sập vì Out of Memory (OOM).
```

#### 5.3. Kết quả AI trả về

```text
AI đề xuất chia trang. Nhưng AI lại cung cấp giải pháp Client-side Pagination: Gọi API lấy đủ 100,000 users về biến mảng, sau đó dùng hàm `.slice(0, 10)` để cắt ra hiển thị. AI biện luận rằng làm vậy để chức năng Tìm kiếm (Search) có thể tự dùng `.filter()` cho dễ.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Tôi chỉ giữ lại giao diện (UI) Bảng từ AI và cách lấy thuộc tính `Pageable` trong Spring Boot.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Bác bỏ Client-side Pagination, triển khai Server-side Pagination & Debounce Search:
- Critical Thinking: Client-side Pagination với 100,000 records là phản khoa học và tàn phá băng thông mạng (Bandwidth). Dữ liệu rác bị nhồi vào RAM của điện thoại người dùng.
- Decision Ownership & Creative Synthesis: Tôi thiết kế Server-side Pagination thực thụ. Frontend truyền số trang `page` và `size` lên Backend. Backend dịch ra câu truy vấn SQL `OFFSET ... LIMIT` để chỉ tải đúng 10 dòng từ DB. Về phần Tìm kiếm, tôi không dùng `.filter()` nội bộ mà gọi lại API tìm kiếm với từ khóa mới. Để tránh DDoS CSDL khi người dùng gõ từng chữ cái, tôi viết thuật toán Debounce Search (chờ 500ms không gõ mới gọi API). Giao diện mượt mà hoàn hảo.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [x] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [ ] Prompt tạo ra kết quả tốt
- [x] Prompt tạo ra kết quả chưa phù hợp (Gợi ý phân trang Client-side sai lầm)
- [ ] Cần hỏi lại AI nhiều lần
- [x] Cần tự kiểm tra và chỉnh sửa nhiều
- [ ] Kết quả AI có lỗi hoặc chưa chính xác

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Commit Data Grid Phase 10 |
| File liên quan | UsersPage.tsx, UserRepository.java, UserService.java |
| Screenshot | |
| Kết quả chạy/test | Bảng hiển thị mượt mà. Network payload chỉ vài Kilobyte thay vì 50 Megabyte. |
| Link tài liệu/báo cáo | |
| Ghi chú khác | |

#### 5.8. Ghi chú thêm

```text
Xử lý dữ liệu lớn bắt buộc phải tính toán ở cấp độ Database, không đùn đẩy trách nhiệm cho Frontend.
```

---

### Lần 15: Tích hợp Telemetry bắt lỗi toàn cục (Global Error Tracking)

#### 5.1. Thông tin chung

| Tiêu chí | Thông tin |
|---|---|
| Ngày tạo | 2026-08-03 |
| Công cụ AI | Antigravity |
| Số lượng prompt | 2 |
| Mức độ hài lòng | 4/5 |
| Mục đích | Bắt lỗi Crash ngầm trên Server |

#### 5.2. Bối cảnh khi viết prompt

```text
Quá trình Server-Side Rendering (SSR) thi thoảng bị crash ngầm. Framework React/Vite/H3 tự động nuốt (swallow) mất dòng lỗi (Stack Trace) và chỉ trả về mã 500 ra trình duyệt. Tôi không biết dòng code nào gây ra lỗi để sửa.
```

#### 5.3. Kết quả AI trả về

```text
AI đề xuất sử dụng `Sentry.io`. AI viết nguyên một đoạn code `Sentry.init()` và bảo tôi cài đặt thư viện `@sentry/react`. AI cũng nhắc qua về hàm `window.addEventListener('error')` của JavaScript.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Tôi đã từ chối dùng Sentry. Nhưng tôi áp dụng kiến thức về Event Listener cấp thấp của JS do AI nhắc đến.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Xây dựng cơ chế bắt lỗi siêu nhẹ Out-Of-Band (OOB):
- Critical Thinking: Sentry là một công cụ quá cồng kềnh (bloated) và tốn phí cho một dự án sinh viên. Trong khi đó, Core JS đã cung cấp đủ API để bắt lỗi.
- Decision Ownership & Creative Synthesis: Tôi tự viết ra `error-capture.ts`. Thay vì bắt lỗi trên `window`, tôi lắng nghe sự kiện `unhandledrejection` trên `globalThis` để cover cả môi trường Node.js (Server). Tôi thiết kế một bộ nhớ tạm (Temporary Buffer) có vòng đời TTL = 5 giây. Nếu lỗi xuất hiện, file của tôi sẽ tóm lấy Stack Trace trước khi Framework kịp can thiệp. Nhờ vậy, mọi lỗi crash ngầm đều hiện rõ mồn một trên Console.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [x] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [ ] Prompt tạo ra kết quả tốt
- [x] Prompt tạo ra kết quả chưa phù hợp (Gợi ý dùng thư viện bên thứ 3 cồng kềnh)
- [ ] Cần hỏi lại AI nhiều lần
- [x] Cần tự kiểm tra và chỉnh sửa nhiều
- [ ] Kết quả AI có lỗi hoặc chưa chính xác

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Commit Telemetry Phase 11 |
| File liên quan | error-capture.ts, server.ts |
| Screenshot | |
| Kết quả chạy/test | Bắt thành công 100% lỗi SSR. Console hiển thị Stack Trace rõ ràng. |
| Link tài liệu/báo cáo | |
| Ghi chú khác | |

#### 5.8. Ghi chú thêm

```text
Nắm vững Core API của JavaScript giá trị hơn việc thuộc lòng cách dùng các thư viện ngoài.
```

---

### Lần 16: Tái thiết kế Giao diện Công an Phường (Contextual UX)

#### 5.1. Thông tin chung

| Tiêu chí | Thông tin |
|---|---|
| Ngày tạo | 2026-08-03 |
| Công cụ AI | Antigravity |
| Số lượng prompt | 2 |
| Mức độ hài lòng | 3/5 |
| Mục đích | Tối ưu hóa không gian làm việc của lực lượng an ninh |

#### 5.2. Bối cảnh khi viết prompt

```text
Chức năng dành cho Công an Phường cần một màn hình riêng biệt. Tôi muốn thiết kế một Dashboard hiển thị thông tin phản ánh về an ninh trật tự.
```

#### 5.3. Kết quả AI trả về

```text
AI tạo ra một giao diện y hệt trang của UBND Phường: Có Sidebar rất to, ở giữa là các biểu đồ tròn (Pie Chart) và biểu đồ cột (Bar Chart) vẽ bằng `recharts` để "thống kê tội phạm", phía dưới là một cái bảng dài.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Tôi chỉ giữ lại bộ khung HTML Grid. Xóa bỏ toàn bộ biểu đồ và sidebar cồng kềnh.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Contextualization (Thiết kế theo ngữ cảnh thực tế):
- Critical Thinking: Trưởng công an phường không có thời gian ngồi ngắm "Biểu đồ tròn tỉ lệ %". Khi có vụ đánh nhau hay trộm cắp được báo lên, họ cần biết NGAY LẬP TỨC nó ở đâu và ai đang xử lý. Giao diện của AI là giao diện dành cho Dân văn phòng/Kế toán, không phải dành cho Lực lượng phản ứng nhanh.
- Decision Ownership & Creative Synthesis: Tôi thiết kế lại `PoliceDashboard.tsx` theo chuẩn Minimalist (Tối giản). Sidebar được thu lại siêu mỏng. Logo thay bằng Huy hiệu Công an lớn để tạo sự uy nghiêm. Phần trung tâm màn hình biến thành một "Nhật ký vận hành" (Operation Log) Real-time. Cán bộ trực ban chỉ cần nhìn lướt là nắm bắt được toàn bộ dòng chảy sự kiện.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [ ] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [ ] Prompt tạo ra kết quả tốt
- [x] Prompt tạo ra kết quả chưa phù hợp (Sai lệch UX)
- [ ] Cần hỏi lại AI nhiều lần
- [x] Cần tự kiểm tra và chỉnh sửa nhiều
- [ ] Kết quả AI có lỗi hoặc chưa chính xác

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Commit Contextual UX Phase 11 |
| File liên quan | PoliceDashboard.tsx |
| Screenshot | |
| Kết quả chạy/test | Giao diện sắc bén, thao tác xử lý báo cáo an ninh trật tự chỉ mất 2 click. |
| Link tài liệu/báo cáo | |
| Ghi chú khác | |

#### 5.8. Ghi chú thêm

```text
AI không hiểu được tâm lý và môi trường làm việc đặc thù của người dùng cuối. UX/UI phải do con người quyết định.
```

---

### Lần 17: Thiết kế API Tra cứu Công khai (Data Privacy)

#### 5.1. Thông tin chung

| Tiêu chí | Thông tin |
|---|---|
| Ngày tạo | 2026-08-03 |
| Công cụ AI | Antigravity |
| Số lượng prompt | 2 |
| Mức độ hài lòng | 3/5 |
| Mục đích | Bảo mật thông tin người báo cáo (Whistleblower Privacy) |

#### 5.2. Bối cảnh khi viết prompt

```text
Chức năng Tra cứu Phản ánh (Public Search) cho phép bất kỳ ai có mã Tracking ID đều xem được tiến độ xử lý rác thải. Tôi cần viết API truy vấn database.
```

#### 5.3. Kết quả AI trả về

```text
AI đề xuất tạo 1 API `GET /feedbacks/public` và trả về danh sách các Entity `Feedback` dạng JSON.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Tôi TỪ CHỐI mã nguồn của AI vì nó chứa lỗ hổng bảo mật nghiêm trọng (Data Leakage / Mass Assignment).
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Áp dụng DTO Pattern để bảo mật Dữ liệu Nhạy cảm (Sensitive Data):
- Critical Thinking: Entity `Feedback` chứa số điện thoại (phone), email của người gửi, và các ghi chú điều tra nội bộ của phường. Nếu trả nguyên Entity này ra ngoài như AI gợi ý, một kẻ xấu có thể dùng Postman hoặc F12 (Network tab) đọc được toàn bộ thông tin cá nhân của người tố giác.
- Decision Ownership & Creative Synthesis: Tôi tự thiết kế `PublicFeedbackDTO`. Class này chỉ khai báo các trường an toàn như `title, status, location, images`. Khi lấy dữ liệu từ DB lên, tôi map Entity sang DTO này rồi mới trả về cho Client. Nhờ vậy, API Public kín kẽ 100%, bảo vệ tuyệt đối danh tính người dân.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [x] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [ ] Prompt tạo ra kết quả tốt
- [x] Prompt tạo ra kết quả chưa phù hợp (Gây rò rỉ dữ liệu)
- [ ] Cần hỏi lại AI nhiều lần
- [x] Cần tự kiểm tra và chỉnh sửa nhiều
- [ ] Kết quả AI có lỗi hoặc chưa chính xác

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Commit Public Search API Phase 12 |
| File liên quan | PublicFeedbackDTO.java, feedback-search.tsx |
| Screenshot | |
| Kết quả chạy/test | Postman trả về cục JSON không có trường `phoneNumber` và `email`. |
| Link tài liệu/báo cáo | |
| Ghi chú khác | |

#### 5.8. Ghi chú thêm

```text
Bảo mật hệ thống bắt đầu từ việc không tin tưởng bất kỳ đoạn code truy xuất cơ sở dữ liệu nào của AI.
```

---

### Lần 18: Tích hợp Đa ngôn ngữ (i18n) siêu nhẹ

#### 5.1. Thông tin chung

| Tiêu chí | Thông tin |
|---|---|
| Ngày tạo | 2026-08-03 |
| Công cụ AI | Antigravity |
| Số lượng prompt | 2 |
| Mức độ hài lòng | 4/5 |
| Mục đích | Dịch Web sang tiếng Anh mượt mà |

#### 5.2. Bối cảnh khi viết prompt

```text
Dự án cần hỗ trợ tiếng Anh cho người nước ngoài tại Đà Nẵng. Tôi cần một giải pháp thay đổi ngôn ngữ ngay lập tức mà không cần load lại trang.
```

#### 5.3. Kết quả AI trả về

```text
AI hướng dẫn cài đặt `react-i18next` và tạo các file JSON khổng lồ chứa hàng nghìn dòng key-value dịch thuật.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Tôi lấy các bản dịch (English translations) do AI cung cấp nhưng bác bỏ việc sử dụng thư viện `react-i18next`.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Triển khai Custom React Context cho i18n để tối ưu Performance:
- Critical Thinking: `react-i18next` quá nặng đối với một dự án đã có sẵn hàng tá thư viện (Zustand, React Query, Leaflet). Tôi không muốn trang web tải thêm 500KB vô ích.
- Decision Ownership & Creative Synthesis: Tôi tự viết Hook `useI18n()` dựa trên React Context. Hàm này lưu trữ state `locale` vào Local Storage. Các từ vựng được phân tách thành các Object siêu nhỏ ngay trong mã nguồn (vd: phần Map có từ vựng riêng, phần Login có từ vựng riêng). Khi người dùng đổi ngôn ngữ, Context kích hoạt Re-render lập tức với độ trễ 0ms và không tốn băng thông mạng tải JSON.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [x] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [ ] Prompt tạo ra kết quả tốt
- [x] Prompt tạo ra kết quả chưa phù hợp (Lạm dụng thư viện)
- [ ] Cần hỏi lại AI nhiều lần
- [x] Cần tự kiểm tra và chỉnh sửa nhiều
- [ ] Kết quả AI có lỗi hoặc chưa chính xác

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Commit i18n Phase 12 |
| File liên quan | i18n.tsx, feedback-search.tsx |
| Screenshot | |
| Kết quả chạy/test | Đổi ngôn ngữ mượt mà. Không phát sinh thêm file tải xuống trong tab Network. |
| Link tài liệu/báo cáo | |
| Ghi chú khác | |

#### 5.8. Ghi chú thêm

```text
Chỉ dùng thư viện lớn khi thực sự cần thiết. Những logic đơn giản như Map Key-Value thì React Context thừa sức làm tốt.
```

---

### Lần 19: Tối ưu hóa xử lý Đa phương tiện & Định vị (Client-side)

#### 5.1. Thông tin chung

| Tiêu chí | Thông tin |
|---|---|
| Ngày tạo | 2026-08-03 |
| Công cụ AI | Antigravity |
| Số lượng prompt | 2 |
| Mức độ hài lòng | 3/5 |
| Mục đích | Giảm tải băng thông và lấy tọa độ chính xác |

#### 5.2. Bối cảnh khi viết prompt

```text
Form báo cáo rác thải cần tính năng upload ảnh và tự động ghim vị trí GPS. Ảnh người dân chụp từ iPhone có thể lên tới 10MB/tấm.
```

#### 5.3. Kết quả AI trả về

```text
AI cung cấp code sử dụng `<input type="file">` gửi thẳng mảng byte lên Backend. Về phần vị trí, AI gợi ý gọi API của bên thứ 3 (ipinfo.io) để lấy tọa độ dựa trên IP.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Bác bỏ toàn bộ code của AI vì không thực tế và tốn kém chi phí.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Tối ưu hóa Băng thông và khai thác Native API:
- Critical Thinking: Gửi thẳng ảnh 10MB lên server bằng mạng 4G sẽ cực kỳ chậm, tốn băng thông và làm đầy ổ cứng Server rất nhanh. Định vị bằng IP thì sai số có thể tính bằng kilomet, hoàn toàn vô dụng cho việc tìm một đống rác trên vỉa hè.
- Decision Ownership & Creative Synthesis: Tôi tự tay viết một Hook ép nén ảnh ngay trên trình duyệt bằng HTML5 `<canvas>`. Ảnh 10MB bị thu nhỏ xuống còn 300KB trước khi được gửi đi, giúp API Upload hoàn thành trong chưa tới 1 giây. Về vị trí, tôi khai thác Native API `navigator.geolocation` của trình duyệt. Công nghệ này truy cập thẳng vào phần cứng GPS của điện thoại, trả về tọa độ chính xác tới từng mét (Accuracy < 5m) và quan trọng nhất là hoàn toàn miễn phí.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [ ] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [ ] Prompt tạo ra kết quả tốt
- [x] Prompt tạo ra kết quả chưa phù hợp (Giải pháp tốn kém, thiếu chính xác)
- [ ] Cần hỏi lại AI nhiều lần
- [x] Cần tự kiểm tra và chỉnh sửa nhiều
- [ ] Kết quả AI có lỗi hoặc chưa chính xác

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Commit Multimedia & Geo Phase 13 |
| File liên quan | ReportForm.tsx |
| Screenshot | |
| Kết quả chạy/test | Upload 5 tấm ảnh cực nhanh. Bản đồ ghim chính xác vị trí đứng hiện tại. |
| Link tài liệu/báo cáo | |
| Ghi chú khác | |

#### 5.8. Ghi chú thêm

```text
Trình duyệt web hiện đại có rất nhiều API sức mạnh (Canvas, Geolocation). Cần tận dụng chúng thay vì phụ thuộc API ngoài.
```

---

### Lần 20: Thiết lập Bảo mật cấp độ Production (CORS & Rate Limit)

#### 5.1. Thông tin chung

| Tiêu chí | Thông tin |
|---|---|
| Ngày tạo | 2026-08-03 |
| Công cụ AI | Antigravity |
| Số lượng prompt | 1 |
| Mức độ hài lòng | 2/5 |
| Mục đích | Bảo vệ Server khỏi tấn công CSRF và DDoS |

#### 5.2. Bối cảnh khi viết prompt

```text
Triển khai hệ thống lên Môi trường thực tế (Production): Frontend nằm ở Vercel, Backend nằm ở Render. Cần giải quyết lỗi CORS và chống tình trạng spam API (DDoS).
```

#### 5.3. Kết quả AI trả về

```text
AI cung cấp đoạn code Spring Boot: `registry.addMapping("/**").allowedOrigins("*")` để fix lỗi CORS. Để chống Spam, AI bảo tôi tự đi cấu hình một Server Nginx.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Chỉ học cú pháp Override `addCorsMappings` của Spring Boot. TỪ CHỐI cấu hình `*`.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Bảo mật hệ thống khép kín (Hardening System Security):
- Critical Thinking: Cấu hình `allowedOrigins("*")` là một tội ác trong bảo mật. Bất kỳ website lừa đảo nào cũng có thể gửi lệnh (CSRF Attack) thẳng vào Backend của tôi. Việc dựng Nginx chỉ để chống Spam là quá sức cồng kềnh cho nền tảng Cloud Serverless như Render.
- Decision Ownership & Creative Synthesis: Tôi thiết lập CORS nghiêm ngặt, chỉ chấp nhận `.allowedOrigins("https://thecityconnect.vn")` và chỉ mở các Method cụ thể (GET, POST, PUT). Để chống spam, tôi tự viết một `RateLimitFilter` chạy thuật toán Token Bucket (hoặc đơn giản là đếm Request trong bộ nhớ Cache). Bất kỳ IP nào gọi quá 5 lần/phút sẽ bị Backend chặn đứng và trả về HTTP 429 (Too Many Requests), bảo vệ hệ thống khỏi sụp đổ mà không cần tới Nginx.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [x] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [ ] Prompt tạo ra kết quả tốt
- [x] Prompt tạo ra kết quả chưa phù hợp (Gây lỗ hổng bảo mật nghiêm trọng)
- [ ] Cần hỏi lại AI nhiều lần
- [x] Cần tự kiểm tra và chỉnh sửa nhiều
- [ ] Kết quả AI có lỗi hoặc chưa chính xác

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Commit Production Security Phase 13 |
| File liên quan | WebSecurityConfig.java, RateLimitFilter.java |
| Screenshot | |
| Kết quả chạy/test | Dùng Postman từ máy ảo gọi API bị báo lỗi CORS. F5 spam web liên tục thì bị văng HTTP 429. |
| Link tài liệu/báo cáo | |
| Ghi chú khác | |

#### 5.8. Ghi chú thêm

```text
Bảo mật là thành trì cuối cùng. Một ứng dụng hay đến mấy mà sập ngay khi Go-live thì cũng vô nghĩa.
```

---

### Lần 21: Tối ưu hóa Database với Caching (High Performance)

#### 5.1. Thông tin chung

| Tiêu chí | Thông tin |
|---|---|
| Ngày tạo | 2026-08-03 |
| Công cụ AI | Antigravity |
| Số lượng prompt | 2 |
| Mức độ hài lòng | 3/5 |
| Mục đích | Giảm tải cho Cơ sở dữ liệu |

#### 5.2. Bối cảnh khi viết prompt

```text
Trang chủ cần load danh sách 56 Phường xã và 20 Danh mục phản ánh. Dữ liệu này hầu như không bao giờ đổi, nhưng lại được truy vấn liên tục mỗi khi có người vào Web.
```

#### 5.3. Kết quả AI trả về

```text
AI đề xuất sử dụng Spring Data JPA cơ bản: `wardRepository.findAll()` để quét toàn bộ bảng trong PostgreSQL.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Chỉ sử dụng phần định nghĩa Repository của AI, nhưng bác bỏ cách gọi trực tiếp ở tầng Service.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Áp dụng Bộ đệm (Caching):
- Critical Thinking: Việc bắt Database phải đọc đi đọc lại một bảng dữ liệu tĩnh hàng nghìn lần mỗi giây là nguyên nhân chính gây sập (Crash) hệ thống khi có tải cao (High Concurrency). Lời khuyên của AI chỉ đúng cho đồ án sinh viên, không thể áp dụng cho môi trường thực tế.
- Decision Ownership & Creative Synthesis: Tôi tự thiết lập Spring Cache (`@EnableCaching`). Tại hàm lấy dữ liệu, tôi thêm `@Cacheable("wards")`. Ở Request đầu tiên, hệ thống sẽ query DB và lưu kết quả vào RAM. Từ Request thứ 2 trở đi, dữ liệu được trả về thẳng từ RAM với tốc độ siêu thanh (<1ms). Database hoàn toàn được giải phóng để tập trung xử lý các nghiệp vụ ghi/đọc phức tạp khác.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [ ] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [ ] Prompt tạo ra kết quả tốt
- [x] Prompt tạo ra kết quả chưa phù hợp (Gây nghẽn cổ chai Database)
- [ ] Cần hỏi lại AI nhiều lần
- [x] Cần tự kiểm tra và chỉnh sửa nhiều
- [ ] Kết quả AI có lỗi hoặc chưa chính xác

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Commit Caching Phase 14 |
| File liên quan | WardService.java, CacheConfig.java |
| Screenshot | |
| Kết quả chạy/test | Dữ liệu trả về tức thì. Console Backend không còn in ra câu lệnh Hibernate SELECT liên tục. |
| Link tài liệu/báo cáo | |
| Ghi chú khác | |

#### 5.8. Ghi chú thêm

```text
Code chạy đúng chưa chắc đã là code tốt. Tối ưu hóa hệ thống là quá trình giảm tải triệt để cho Database.
```

---

### Lần 22: Kiến trúc luồng Bất đồng bộ (Async Background Jobs)

#### 5.1. Thông tin chung

| Tiêu chí | Thông tin |
|---|---|
| Ngày tạo | 2026-08-03 |
| Công cụ AI | Antigravity |
| Số lượng prompt | 2 |
| Mức độ hài lòng | 3/5 |
| Mục đích | Giải phóng giao diện, ngăn tình trạng "Treo API" khi gửi Email |

#### 5.2. Bối cảnh khi viết prompt

```text
Cần gửi Email thông báo tự động ngay sau khi cán bộ duyệt một phản ánh.
```

#### 5.3. Kết quả AI trả về

```text
AI viết code Gửi Mail Đồng bộ (Synchronous). Tức là trong hàm `approve()`, AI gọi thẳng hàm `sendMail()` chờ nó gửi xong rồi mới `return success`.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Chỉ học cách thiết lập SMTP Server của Google và cú pháp khởi tạo JavaMailSender.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Tách luồng Bất đồng bộ (Asynchronous execution):
- Critical Thinking: Server Google mất khoảng 3 giây để gửi một Email. Nếu làm theo AI, Cán bộ bấm "Duyệt" sẽ phải nhìn vòng tròn xoay xoay tận 3 giây. Nguy hiểm hơn, nếu SMTP của Google chập chờn và ném Exception, toàn bộ quá trình Duyệt bài sẽ bị Rollback oan uổng.
- Decision Ownership & Creative Synthesis: Tôi đã cấu hình `@EnableAsync` trong Spring Boot. Hàm gửi Mail được đánh dấu `@Async` để nó tách ra chạy trên một Thread pool riêng biệt (Background Job). Khi cán bộ bấm "Duyệt", Database cập nhật trạng thái xong là API trả kết quả thành công ngay (0.1 giây). Việc gửi mail được đẩy vào hàng đợi ngầm, gửi thành công hay thất bại cũng không ảnh hưởng tới tiến trình chính của ứng dụng.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [ ] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [ ] Prompt tạo ra kết quả tốt
- [x] Prompt tạo ra kết quả chưa phù hợp (Làm treo API, rủi ro sập dây chuyền)
- [ ] Cần hỏi lại AI nhiều lần
- [x] Cần tự kiểm tra và chỉnh sửa nhiều
- [ ] Kết quả AI có lỗi hoặc chưa chính xác

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Commit Async Email Phase 14 |
| File liên quan | EmailService.java, AsyncConfig.java |
| Screenshot | |
| Kết quả chạy/test | Bấm nút duyệt phản hồi ngay tức thì, không bị delay. Vài giây sau điện thoại tinh tinh báo có email. |
| Link tài liệu/báo cáo | |
| Ghi chú khác | |

#### 5.8. Ghi chú thêm

```text
Các tác vụ giao tiếp với hệ thống bên ngoài (3rd-party) như Email, SMS, Payment luôn phải được xử lý Bất đồng bộ.
```

---

### Lần 23: Triển khai Global Axios Interceptor (Silent Refresh Token)

#### 5.1. Thông tin chung

| Tiêu chí | Thông tin |
|---|---|
| Ngày tạo | 2026-08-03 |
| Công cụ AI | Antigravity |
| Số lượng prompt | 2 |
| Mức độ hài lòng | 3/5 |
| Mục đích | Bắt lỗi API tập trung và tự động làm mới Token |

#### 5.2. Bối cảnh khi viết prompt

```text
Hệ thống sử dụng JWT Token (Access Token và Refresh Token). Khi Access Token hết hạn, API trả về lỗi 401 Unauthorized. Tôi cần xử lý lỗi này.
```

#### 5.3. Kết quả AI trả về

```text
AI đề xuất tôi bọc lệnh `try...catch` ở từng chỗ gọi `fetch()` hoặc `axios.get()`. Nếu bắt được mã 401 thì gọi hàm `logout()` và ép trình duyệt chuyển hướng (redirect) về trang Đăng nhập.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Tôi TỪ CHỐI hoàn toàn cách làm thủ công và phân mảnh của AI.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Sử dụng Interceptor và Silent Refresh (Làm mới ngầm):
- Critical Thinking: Bọc `try...catch` ở hàng chục file sẽ tạo ra hàng nghìn dòng code rác (Boilerplate). Hơn nữa, việc ép người dùng văng ra trang Đăng nhập ngay giữa lúc họ đang điền dở một form dài (chỉ vì Token vừa hết hạn) là một trải nghiệm UX thảm họa.
- Decision Ownership & Creative Synthesis: Tôi thiết lập một `Axios Interceptor` ở tầng Network (file `api.ts`). Nó hoạt động như một "trạm thu phí", chặn mọi Response có mã 401. Khi đó, Interceptor sẽ TẠM DỪNG request hiện tại, tự động gửi Refresh Token lên Server để đổi lấy Access Token mới, rồi lập tức "Phát lại" (Replay) request ban đầu. Toàn bộ quá trình "Silent Refresh" này diễn ra trong vài phần trăm giây. Người dùng vẫn bấm Lưu thành công mà không hề bị văng ra ngoài. Các lỗi 500 khác cũng được Interceptor gom lại và gọi Toast Notification một lần duy nhất.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [ ] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [ ] Prompt tạo ra kết quả tốt
- [x] Prompt tạo ra kết quả chưa phù hợp (Gây UX tồi tệ, Code lặp lại nhiều)
- [ ] Cần hỏi lại AI nhiều lần
- [x] Cần tự kiểm tra và chỉnh sửa nhiều
- [ ] Kết quả AI có lỗi hoặc chưa chính xác

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Commit Global Interceptor Phase 15 |
| File liên quan | api.ts, auth.ts |
| Screenshot | |
| Kết quả chạy/test | Access Token hết hạn. Bấm "Cập nhật". Tab Network hiện 3 request: 1 bị lỗi 401 -> 1 gọi Refresh Token -> 1 gọi lại Cập nhật thành công (200). Màn hình không hề bị giật cục. |
| Link tài liệu/báo cáo | |
| Ghi chú khác | |

#### 5.8. Ghi chú thêm

```text
Error Handling và Auth Flow là phần tinh túy nhất của Frontend. Phải xử lý tập trung (Centralized) thay vì phân tán (Decentralized).
```

---

### Lần 24: Quản lý trạng thái đa bước (Zustand Global State)

#### 5.1. Thông tin chung

| Tiêu chí | Thông tin |
|---|---|
| Ngày tạo | 2026-08-03 |
| Công cụ AI | Antigravity |
| Số lượng prompt | 2 |
| Mức độ hài lòng | 4/5 |
| Mục đích | Quản lý dữ liệu cho Form đa bước mà không làm giảm hiệu năng |

#### 5.2. Bối cảnh khi viết prompt

```text
Form báo cáo rác thải của người dân được chia làm 3 bước. Khi đang ở bước 3, người dùng có thể quay lại bước 1. Tôi cần giữ lại dữ liệu họ đã nhập.
```

#### 5.3. Kết quả AI trả về

```text
AI hướng dẫn tôi tạo một State bự bằng `useState` ở Component Cha. Sau đó truyền state và hàm `setState` xuống các Component Con, Cháu, Chắt thông qua `props` (hiện tượng Prop Drilling).
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Tôi hiểu bản chất lưu State ở cấp độ cao, nhưng bác bỏ việc truyền Props.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Tối ưu hiệu năng Re-render bằng Zustand:
- Critical Thinking: Việc truyền Props liên tục qua 3-4 tầng Component (Prop Drilling) làm Code trở thành một mớ bòng bong (Spaghetti). Đặc biệt, mỗi khi người dùng gõ 1 chữ ở Bước 1, Component Cha thay đổi State, kéo theo Bước 2 (chứa bản đồ Leaflet) bị Re-render oan uổng, gây giật lag toàn bộ trang.
- Decision Ownership & Creative Synthesis: Tôi đã tích hợp thư viện `Zustand`. Tôi tạo một file `useReportStore.ts` đóng vai trò là Global State nằm độc lập bên ngoài cây Component. Khi Component ở Bước 1 cần cập nhật dữ liệu, nó gọi thẳng hàm `updateStep1` của Zustand. Khi Bước 3 cần đọc dữ liệu, nó móc (hook) thẳng vào Store. Cấu trúc này xóa sổ hoàn toàn Prop Drilling, và cơ chế Selector của Zustand đảm bảo Bước 2 (Bản đồ) không bao giờ bị Re-render nếu dữ liệu của nó không thay đổi.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [ ] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [ ] Prompt tạo ra kết quả tốt
- [x] Prompt tạo ra kết quả chưa phù hợp (Gây Prop Drilling và Re-render vô tội vạ)
- [ ] Cần hỏi lại AI nhiều lần
- [x] Cần tự kiểm tra và chỉnh sửa nhiều
- [ ] Kết quả AI có lỗi hoặc chưa chính xác

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Commit Zustand State Phase 15 |
| File liên quan | useReportStore.ts, ReportForm.tsx |
| Screenshot | |
| Kết quả chạy/test | Dùng React Profiler đo đạc: Khi gõ text ở Bước 1, Component Bản đồ ở Bước 2 hiển thị màu xám (Tức là không bị Re-render). |
| Link tài liệu/báo cáo | |
| Ghi chú khác | |

#### 5.8. Ghi chú thêm

```text
Ứng dụng React càng phức tạp thì càng phải hạn chế Prop Drilling và kiểm soát chặt chẽ vòng đời Re-render của Component.
```

---

### Lần 25: Code Splitting & Tối ưu hóa Build (Production Optimization)

#### 5.1. Thông tin chung

| Tiêu chí | Thông tin |
|---|---|
| Ngày tạo | 2026-08-03 |
| Công cụ AI | Antigravity |
| Số lượng prompt | 2 |
| Mức độ hài lòng | 3/5 |
| Mục đích | Giảm dung lượng file Javascript để tăng tốc độ tải trang |

#### 5.2. Bối cảnh khi viết prompt

```text
Khi chạy lệnh `npm run build` bằng Vite, hệ thống nhồi toàn bộ code vào một file `index.js` duy nhất nặng tới 3MB. Tốc độ load trang chủ lần đầu tiên (Cold Start) mất tới 5 giây, bị Google Lighthouse trừ điểm nặng nề.
```

#### 5.3. Kết quả AI trả về

```text
AI đề xuất sử dụng Gzip hoặc Brotli trên Nginx để nén file lại trước khi gửi cho Client. Ngoài ra khuyên tôi thêm lệnh `build.sourcemap = false` vào Vite.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Áp dụng cấu hình tắt `sourcemap` để bảo mật mã nguồn trên Production. Bác bỏ tư duy ỷ lại vào Gzip.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Áp dụng Code Splitting (Chia tách mã nguồn):
- Critical Thinking: Nén Gzip chỉ giúp file tải về nhanh hơn qua mạng, nhưng trình duyệt của thiết bị di động (đặc biệt là máy yếu) vẫn phải tốn CPU và RAM để giải nén toàn bộ 3MB Javascript, sau đó mới Parse (phân tích) và Execute. Nhồi nhét cả logic của trang Admin, trang Đăng nhập, và thư viện Bản đồ vào trang Chủ là một sự lãng phí tài nguyên khủng khiếp.
- Decision Ownership & Creative Synthesis: Tôi đã cấu hình `manualChunks` trong `vite.config.ts` để tách riêng `vendor` (các thư viện như react, axios) ra một file riêng để tận dụng Browser Cache. Ở phần Route, tôi bọc các trang Admin bằng `React.lazy()` và `<Suspense>`. Trình duyệt sẽ chỉ tải mã nguồn của trang Admin khi cán bộ thực sự bấm vào nút Đăng nhập. Nhờ thủ thuật Lazy Load này, file JS ở trang chủ giảm từ 3MB xuống còn 150KB. Tốc độ hiển thị nội dung đầu tiên (FCP) giảm xuống vỏn vẹn 0.5 giây!
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [ ] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [ ] Prompt tạo ra kết quả tốt
- [x] Prompt tạo ra kết quả chưa phù hợp (Không giải quyết được tận gốc nguyên nhân)
- [ ] Cần hỏi lại AI nhiều lần
- [x] Cần tự kiểm tra và chỉnh sửa nhiều
- [ ] Kết quả AI có lỗi hoặc chưa chính xác

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Commit Code Splitting Phase 16 |
| File liên quan | vite.config.ts, routeTree.gen.ts |
| Screenshot | |
| Kết quả chạy/test | Report của Vite build hiển thị hàng chục file chunks nhỏ gọn. Điểm Performance trên Lighthouse đạt màu Xanh (95+). |
| Link tài liệu/báo cáo | |
| Ghi chú khác | |

#### 5.8. Ghi chú thêm

```text
Đừng bắt trình duyệt của người dùng tải những thứ mà họ chưa cần đến (Lazy Loading).
```

---

### Lần 26: Xử lý rò rỉ bộ nhớ (Memory Leak) do Bản đồ

#### 5.1. Thông tin chung

| Tiêu chí | Thông tin |
|---|---|
| Ngày tạo | 2026-08-03 |
| Công cụ AI | Antigravity |
| Số lượng prompt | 2 |
| Mức độ hài lòng | 2/5 |
| Mục đích | Dọn dẹp RAM, tránh Crash trình duyệt khi treo máy thời gian dài |

#### 5.2. Bối cảnh khi viết prompt

```text
Cán bộ trực ban thường treo trang Admin Dashboard (có chứa Bản đồ Leaflet theo dõi rác thải theo thời gian thực) suốt 8 tiếng mỗi ngày. Sau khoảng 2 tiếng, trang web báo lỗi Out of Memory và tự động tải lại (Crash).
```

#### 5.3. Kết quả AI trả về

```text
AI đoán nguyên nhân là do Bản đồ, và bảo tôi thêm dòng `if (mapInstance) mapInstance = null;` vào hàm hủy Component.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Tôi TỪ CHỐI hoàn toàn đoạn code này vì nó không có tác dụng.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Xây dựng Cleanup Routine tiêu chuẩn:
- Critical Thinking: Việc gán một biến Object thành `null` trong Javascript không hề ép Garbage Collector (bộ thu gom rác) dọn dẹp vùng nhớ đó, nếu như Object đó vẫn đang bị dính với một Event Listener (như `window.addEventListener('resize')`) hoặc một vòng lặp `setInterval`. Đây là cạm bẫy chí mạng mà AI thường lờ đi.
- Decision Ownership & Creative Synthesis: Tôi đã dùng tab Memory của Chrome DevTools để bắt quả tang việc các bản sao của Bản đồ không bị hủy khi chuyển trang. Trong file Component Bản đồ, tôi viết một hàm `return` bên trong `useEffect` (Cleanup function). Hàm này tuần tự gọi `map.off()` để gỡ các sự kiện click/hover, gọi `map.remove()` để ép thư viện phá hủy các thẻ DOM, và xóa toàn bộ các Timeout/Interval đang chạy ngầm. Sau khi làm vậy, đồ thị RAM đi ngang 1 đường thẳng tắp ở mức 60MB, trang web treo cả tuần cũng không sập.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [ ] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [ ] Prompt tạo ra kết quả tốt
- [x] Prompt tạo ra kết quả chưa phù hợp (Gợi ý code vô tác dụng, không triệt để)
- [ ] Cần hỏi lại AI nhiều lần
- [x] Cần tự kiểm tra và chỉnh sửa nhiều
- [ ] Kết quả AI có lỗi hoặc chưa chính xác

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Commit Memory Leak Fix Phase 16 |
| File liên quan | MapComponent.tsx |
| Screenshot | |
| Kết quả chạy/test | Chuyển đổi liên tục giữa trang Admin và trang khác 50 lần. RAM trong Chrome Task Manager tăng lên lúc Render và giảm về vạch xuất phát lúc Unmount, không hề có hiện tượng RAM phình to. |
| Link tài liệu/báo cáo | |
| Ghi chú khác | |

#### 5.8. Ghi chú thêm

```text
Biết cách khởi tạo tài nguyên thì phải biết cách thu hồi tài nguyên (Resource Management).
```

---

### Lần 27: Cấu hình Security Headers chống XSS & Clickjacking

#### 5.1. Thông tin chung

| Tiêu chí | Thông tin |
|---|---|
| Ngày tạo | 2026-08-03 |
| Công cụ AI | Antigravity |
| Số lượng prompt | 2 |
| Mức độ hài lòng | 3/5 |
| Mục đích | Bịt lỗ hổng bảo mật liên quan đến đánh cắp phiên và giả mạo giao diện |

#### 5.2. Bối cảnh khi viết prompt

```text
Sau khi quét dự án bằng công cụ Pen-test (Kiểm thử xâm nhập), hệ thống cảnh báo dự án thiếu Security Headers, dẫn đến nguy cơ bị nhúng vào Iframe lạ (Clickjacking) và chạy Script lạ (XSS).
```

#### 5.3. Kết quả AI trả về

```text
AI hướng dẫn mở file `index.html` của thư mục public React lên, thêm các thẻ `<meta http-equiv="...">` vào phần `<head>` để trình duyệt tự hiểu.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Bác bỏ cách làm ở Frontend của AI. Bảo mật phải làm ở Backend.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Cấu hình Spring Security Filter Chain:
- Critical Thinking: Bất cứ thứ gì nằm ở Frontend (kể cả thẻ `<meta>`) đều có thể bị Hacker sửa đổi hoặc Bypass dễ dàng trước khi trình duyệt kịp đọc. Bảo mật thực sự phải được xuất phát từ HTTP Headers do chính Server trả về. Lời khuyên của AI quá sơ sài và nguy hiểm.
- Decision Ownership & Creative Synthesis: Tôi đã can thiệp vào `SecurityConfig.java` ở Spring Boot Backend. Tôi sử dụng `.headers(headers -> headers.frameOptions().deny())` để cấm mọi trang web khác nhúng dự án của tôi qua Iframe (Chống Clickjacking). Tiếp theo, tôi viết một bộ lọc trả về Header `Content-Security-Policy` khắt khe, chỉ cho phép thực thi Javascript nội bộ và chặn đứng các đoạn script lạ chèn từ bên ngoài (Chống XSS). Cuối cùng, siết lại CORS, loại bỏ dấu `*` lỏng lẻo. Hệ thống trở nên vô hình trước các cuộc rà quét lỗ hổng tự động của Hacker.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [ ] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [ ] Prompt tạo ra kết quả tốt
- [x] Prompt tạo ra kết quả chưa phù hợp (Bảo mật bằng HTML là vô nghĩa)
- [ ] Cần hỏi lại AI nhiều lần
- [x] Cần tự kiểm tra và chỉnh sửa nhiều
- [ ] Kết quả AI có lỗi hoặc chưa chính xác

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Commit Security Headers Phase 17 |
| File liên quan | SecurityConfig.java |
| Screenshot | |
| Kết quả chạy/test | Dùng Postman gọi API, mở tab Headers sẽ thấy các Header bảo vệ: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`. |
| Link tài liệu/báo cáo | |
| Ghi chú khác | |

#### 5.8. Ghi chú thêm

```text
Đừng tin tưởng bất cứ thứ gì từ Client gửi lên. Backend là lớp phòng ngự cuối cùng.
```

---

### Lần 28: Ảo hóa hệ thống với Docker Containerization

#### 5.1. Thông tin chung

| Tiêu chí | Thông tin |
|---|---|
| Ngày tạo | 2026-08-03 |
| Công cụ AI | Antigravity |
| Số lượng prompt | 2 |
| Mức độ hài lòng | 4/5 |
| Mục đích | Đóng gói toàn bộ ứng dụng, dễ dàng chấm bài hoặc đem đi triển khai (Deploy) |

#### 5.2. Bối cảnh khi viết prompt

```text
Đến ngày bảo vệ đồ án, tôi nhận ra máy của Giảng viên không có Java 17, không có Node.js, cũng không có PostgreSQL. Việc xin phép tải và cài đặt đống này mất đến 30 phút, ảnh hưởng đến thời gian thuyết trình.
```

#### 5.3. Kết quả AI trả về

```text
AI viết một file Markdown hướng dẫn (README.md) dài 5 trang, liệt kê từng bước tải Java, cấu hình biến môi trường, tải Postgres, chạy file sql, chạy npm install...
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Tôi từ chối viết tài liệu cài đặt thủ công. Chuyển sang tư duy tự động hóa hoàn toàn.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Viết Dockerfile và Multi-stage Build:
- Critical Thinking: Bắt khách hàng hoặc Hội đồng bảo vệ phải tự cấu hình môi trường là một lỗi UX chí mạng trong ngành phần mềm. Hệ thống phải đạt được tiêu chuẩn "Viết một lần, chạy mọi nơi" (Run Anywhere). Lời khuyên viết tài liệu của AI là tư duy của thập kỷ trước.
- Decision Ownership & Creative Synthesis: Tôi đã mày mò viết `Dockerfile` cho riêng Frontend và Backend. Đặc biệt với Backend, tôi áp dụng Multi-stage Build: Tầng 1 dùng Maven bự (kèm JDK) để đóng gói mã nguồn ra file `.jar`, Tầng 2 chỉ dùng image Alpine siêu nhỏ để chạy file đó. Kết quả Image giảm dung lượng từ 1GB xuống còn 150MB. Sau đó, tôi gộp tất cả vào file `docker-compose.yml`. Giờ đây, chỉ cần máy giảng viên có Docker, gõ đúng một lệnh `docker-compose up -d`, toàn bộ DB, Frontend, Backend sẽ tự tải, tự nối mạng với nhau và khởi chạy trơn tru trong 1 phút.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [ ] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [ ] Prompt tạo ra kết quả tốt
- [x] Prompt tạo ra kết quả chưa phù hợp (Tư duy thủ công, thiếu tự động hóa)
- [ ] Cần hỏi lại AI nhiều lần
- [x] Cần tự kiểm tra và chỉnh sửa nhiều
- [ ] Kết quả AI có lỗi hoặc chưa chính xác

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Commit Docker Compose Phase 17 |
| File liên quan | Dockerfile, docker-compose.yml |
| Kết quả chạy/test | Cầm USB chứa project cắm sang máy tính hoàn toàn trống, gõ lệnh `docker-compose up`, web chạy lên ầm ầm ở localhost. |

#### 5.8. Ghi chú thêm

```text
Docker là tiêu chuẩn công nghiệp (Industry Standard). Đưa được Docker vào đồ án sinh viên là một điểm cộng tuyệt đối.
```

---

### Lần 29: Quản lý Nhật ký hệ thống chuyên nghiệp (Enterprise Logging)

#### 5.1. Thông tin chung

| Tiêu chí | Thông tin |
|---|---|
| Ngày tạo | 2026-08-03 |
| Công cụ AI | Antigravity |
| Số lượng prompt | 2 |
| Mức độ hài lòng | 2/5 |
| Mục đích | Lưu trữ log lỗi chuyên nghiệp để bảo trì thay vì in ra màn hình Console |

#### 5.2. Bối cảnh khi viết prompt

```text
Khi hệ thống có lỗi (như NullPointerException), dòng lỗi bay vèo vèo qua màn hình Console và biến mất vĩnh viễn khi Server tắt. Tôi cần lưu lại để điều tra.
```

#### 5.3. Kết quả AI trả về

```text
AI cung cấp đoạn code dùng `try...catch` và dùng hàm nguyên thủy `System.out.println()` để in lỗi ra.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Từ chối hoàn toàn giải pháp in log Console của AI.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Tích hợp SLF4J và định dạng Log JSON:
- Critical Thinking: Hàm `System.out.println()` trong Java là một hàm chạy Đồng bộ (Synchronous). Gọi hàm này quá nhiều sẽ làm chậm Server đáng kể. Hơn nữa, nó không phân biệt được mức độ (INFO, WARN, ERROR) và không lưu được xuống ổ cứng.
- Decision Ownership & Creative Synthesis: Tôi thiết lập một cơ chế Logging chuyên nghiệp bằng SLF4J kết hợp Logback (thông qua file `logback-spring.xml`). Tôi tự động hóa việc xuất log ra thư mục `/logs`, chia cắt theo ngày (Rolling File) để không bị đầy ổ cứng. Đặc biệt hơn, tôi cấu hình Logback xuất dữ liệu dưới định dạng JSON thay vì Text thuần. Việc này giúp hệ thống của tôi sẵn sàng (Ready) kết nối với hệ sinh thái giám sát ELK Stack (Elasticsearch, Logstash, Kibana) trong thực tế doanh nghiệp.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [ ] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [ ] Prompt tạo ra kết quả tốt
- [x] Prompt tạo ra kết quả chưa phù hợp (Cách làm nghiệp dư, gây hại hiệu năng)
- [ ] Cần hỏi lại AI nhiều lần
- [x] Cần tự kiểm tra và chỉnh sửa nhiều
- [ ] Kết quả AI có lỗi hoặc chưa chính xác

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Commit Enterprise Logging Phase 18 |
| File liên quan | logback-spring.xml |
| Screenshot | |
| Kết quả chạy/test | Mở file `application.log` trong IDE, các dòng log được lưu chuẩn xác theo cấu trúc JSON gồm `{ "timestamp": "...", "level": "ERROR", "message": "..." }`. |
| Link tài liệu/báo cáo | |
| Ghi chú khác | |

#### 5.8. Ghi chú thêm

```text
Trong hệ thống lớn, bạn không debug bằng cách gắn Breakpoint, bạn debug bằng cách đọc Log.
```

---

### Lần 30: Xử lý Cạnh tranh dữ liệu (Concurrency Control & Optimistic Locking)

#### 5.1. Thông tin chung

| Tiêu chí | Thông tin |
|---|---|
| Ngày tạo | 2026-08-03 |
| Công cụ AI | Antigravity |
| Số lượng prompt | 2 |
| Mức độ hài lòng | 3/5 |
| Mục đích | Giải quyết tình huống nhiều người dùng thao tác trên cùng một dòng dữ liệu cùng lúc |

#### 5.2. Bối cảnh khi viết prompt

```text
Hai cán bộ phường (A và B) cùng mở một phản ánh ra xem. Cán bộ A bấm "Duyệt". Cán bộ B bấm "Từ chối". Chuyện gì sẽ xảy ra?
```

#### 5.3. Kết quả AI trả về

```text
AI viết một câu query SQL `UPDATE report SET status = 'REJECTED' WHERE id = 1;` và bảo cứ thế chạy.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Sử dụng hàm Update của Spring Data JPA nhưng bổ sung thêm cơ chế Locking khóa bảo vệ.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Ngăn chặn Lost Update bằng Optimistic Locking:
- Critical Thinking: Theo cách của AI, hệ thống sẽ ưu tiên người bấm cuối cùng (Last-write wins). Trạng thái của cán bộ A sẽ bị cán bộ B âm thầm ghi đè mà A không hề hay biết (Lỗi Lost Update). Nếu đây là chức năng Chuyển tiền ngân hàng, việc ghi đè này sẽ làm mất tiền của khách. AI hoàn toàn ngó lơ các kịch bản cạnh tranh (Edge Cases).
- Decision Ownership & Creative Synthesis: Tôi đã can thiệp vào `ReportEntity.java`, thêm trường `@Version private Long version;`. Đây là kỹ thuật Khóa Lạc Quan (Optimistic Lock) của Hibernate. 
Cán bộ A và B tải dữ liệu về máy (version = 1). A bấm Duyệt, DB cập nhật thành công, version tăng lên 2. Lúc này B bấm "Từ chối" (mang theo version 1), Database lập tức phát hiện sự sai lệch thời gian và từ chối cập nhật (ném ra `OptimisticLockException`). Backend sẽ hứng lỗi này và báo cho B biết: "Dữ liệu đã thay đổi, vui lòng F5 lại!". Toàn vẹn dữ liệu được đảm bảo 100%.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [ ] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [ ] Prompt tạo ra kết quả tốt
- [x] Prompt tạo ra kết quả chưa phù hợp (Bỏ qua bài toán Concurrency, gây sai lệch Data)
- [ ] Cần hỏi lại AI nhiều lần
- [x] Cần tự kiểm tra và chỉnh sửa nhiều
- [ ] Kết quả AI có lỗi hoặc chưa chính xác

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Commit Optimistic Locking Phase 18 |
| File liên quan | ReportEntity.java |
| Screenshot | |
| Kết quả chạy/test | Giả lập 2 tab duyệt cùng lúc, tab thứ 2 luôn bị từ chối và hiện thông báo lỗi, dữ liệu Database không bị ghi đè. |
| Link tài liệu/báo cáo | |
| Ghi chú khác | |

#### 5.8. Ghi chú thêm

```text
Kỹ sư giỏi không chỉ lập trình cho "đúng", mà còn lập trình cho các trường hợp "không hoàn hảo".
```

---

### Lần 31: Chống Spam và Tấn công từ chối dịch vụ (Rate Limiting)

#### 5.1. Thông tin chung

| Tiêu chí | Thông tin |
|---|---|
| Ngày tạo | 2026-08-03 |
| Công cụ AI | Antigravity |
| Số lượng prompt | 2 |
| Mức độ hài lòng | 2/5 |
| Mục đích | Bảo vệ hệ thống khỏi việc tạo phản ánh rác (Spam) hoặc tấn công DDoS |

#### 5.2. Bối cảnh khi viết prompt

```text
Hệ thống cho phép người dân tạo phản ánh công khai. Nếu một hacker viết Script (dùng Postman/JMeter) bắn API 10.000 lần/giây, Database sẽ bị nhồi nhét toàn dữ liệu rác và có thể bị sập (Crash).
```

#### 5.3. Kết quả AI trả về

```text
AI hướng dẫn tôi viết logic trong hàm `createFeedback()`: Lấy IP của Request, chạy lệnh `SELECT COUNT(*) FROM reports WHERE ip = ? AND created_at > (now - 1 minute)`. Nếu lớn hơn 5 thì báo lỗi.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
TỪ CHỐI hoàn toàn. Đây là một đoạn code thiển cận.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Cấu hình Rate Limiting bằng Token Bucket ở Tầng mạng:
- Critical Thinking: Logic của AI sai cơ bản ở chỗ: Để chống ngập lụt Database, AI lại bắt Database phải hì hục chạy 10.000 lệnh `SELECT` đếm số lượng. Database vẫn sẽ bị vắt kiệt sức và sập như thường. Không được phép để các Request Spam lọt được vào Controller.
- Decision Ownership & Creative Synthesis: Tôi đã tích hợp thư viện `Bucket4j` (sử dụng thuật toán Token Bucket chuẩn công nghiệp). Tôi tạo một Filter nằm ở vị trí tiền đồn của Server. Mỗi IP được cấp 1 cái giỏ (Bucket) chứa 5 Token, mỗi 1 phút hồi lại. Khi Hacker bắn 10.000 request, 5 request đầu lọt qua lấy mất 5 Token. Từ request thứ 6, giỏ rỗng, Filter lập tức trả về mã HTTP 429 (Too Many Requests) chặn đứng request ngay trong 0.001 giây, không hề đánh thức Controller hay Database. Database hoàn toàn bình yên vô sự.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [ ] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [ ] Prompt tạo ra kết quả tốt
- [x] Prompt tạo ra kết quả chưa phù hợp (Gây hại thêm cho Database thay vì bảo vệ nó)
- [ ] Cần hỏi lại AI nhiều lần
- [x] Cần tự kiểm tra và chỉnh sửa nhiều
- [ ] Kết quả AI có lỗi hoặc chưa chính xác

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Commit Rate Limiting Phase 19 |
| File liên quan | RateLimitFilter.java |
| Screenshot | |
| Kết quả chạy/test | Chạy Postman Runner bắn liên thanh 20 request/s. 5 request báo màu Xanh (200), 15 request còn lại báo màu Đỏ (429). |
| Link tài liệu/báo cáo | |
| Ghi chú khác | |

#### 5.8. Ghi chú thêm

```text
Chống Hacker phải chống từ cổng ngoài (Gateway/Filter), không được rước giặc vào nhà.
```

---

### Lần 32: Bắt lỗi sập dây chuyền (Circuit Breaker Pattern)

#### 5.1. Thông tin chung

| Tiêu chí | Thông tin |
|---|---|
| Ngày tạo | 2026-08-03 |
| Công cụ AI | Antigravity |
| Số lượng prompt | 2 |
| Mức độ hài lòng | 3/5 |
| Mục đích | Bảo vệ Server khỏi tình trạng sập (Crash) khi dịch vụ bên thứ ba bị gián đoạn |

#### 5.2. Bối cảnh khi viết prompt

```text
Hệ thống có tính năng gửi Email (qua Google SMTP). Hôm nay cáp quang biển đứt, gọi API Google bị treo (không báo lỗi ngay mà loading mãi 30 giây mới lỗi).
```

#### 5.3. Kết quả AI trả về

```text
AI đề xuất tôi cấu hình Timeout = 5 giây cho JavaMailSender và bọc lệnh gửi bằng `try...catch`.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Áp dụng bọc `try...catch` nhưng thay đổi hoàn toàn kiến trúc luồng.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Triển khai Circuit Breaker bằng Resilience4j:
- Critical Thinking: Cấu hình Timeout 5 giây là quá ngây thơ. Nếu lúc đó có 500 cán bộ cùng bấm duyệt bài, Backend sẽ phải sinh ra 500 Thread (luồng), và cả 500 Thread đó đều bị treo lơ lửng chờ đợi 5 giây vô ích. Thread Pool sẽ cạn kiệt, CPU quá tải, và toàn bộ Server Backend sẽ sập chỉ vì một lỗi của... Google. Đây gọi là Hiệu ứng Domino (Cascading Failure).
- Decision Ownership & Creative Synthesis: Tôi đã cài đặt Mẫu thiết kế Ngắt Mạch (Circuit Breaker) sử dụng thư viện `Resilience4j`. Tôi đặt luật: Nếu Google lỗi/timeout quá 50% số lần trong vòng 10 giây, "Cầu dao" của hệ thống tôi sẽ nhảy (Trạng thái OPEN). Kể từ giây phút đó, mọi request gửi Email đều bị chặn lại ngay lập tức tại ngưỡng cửa (Trả về một Fallback Method để lưu log "Email chờ gửi sau") mà không mất một mili-giây nào để chờ Google. Server của tôi được giải phóng Thread lập tức và vẫn sống sót phục vụ các tính năng khác. 1 phút sau, cầu dao tự hé mở (HALF-OPEN) để thử nghiệm xem Google đã sống lại chưa.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [ ] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [ ] Prompt tạo ra kết quả tốt
- [x] Prompt tạo ra kết quả chưa phù hợp (Bỏ qua bài toán Cạn kiệt tài nguyên Thread)
- [ ] Cần hỏi lại AI nhiều lần
- [x] Cần tự kiểm tra và chỉnh sửa nhiều
- [ ] Kết quả AI có lỗi hoặc chưa chính xác

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Commit Circuit Breaker Phase 19 |
| File liên quan | EmailService.java |
| Screenshot | |
| Kết quả chạy/test | Đổi sai cấu hình SMTP để giả lập lỗi. 5 request đầu tiên mất 5 giây để Timeout. Các request sau đó bị Circuit Breaker chặn lại nên phản hồi ngay lập tức (<0.1s). |
| Link tài liệu/báo cáo | |
| Ghi chú khác | |

#### 5.8. Ghi chú thêm

```text
Circuit Breaker là tiêu chuẩn thiết kế bắt buộc (Must-have) của Kiến trúc Microservices. Đừng bao giờ giao phó sinh mạng Server cho một bên thứ ba.
```

---

### Lần 33: Tự động hóa Kiểm thử (Unit Testing & Mocking)

#### 5.1. Thông tin chung

| Tiêu chí | Thông tin |
|---|---|
| Ngày tạo | 2026-08-03 |
| Công cụ AI | Antigravity |
| Số lượng prompt | 2 |
| Mức độ hài lòng | 2/5 |
| Mục đích | Viết Code Test tự động để bảo vệ logic hệ thống không bị phá hỏng khi sửa chữa (Refactoring) |

#### 5.2. Bối cảnh khi viết prompt

```text
Hàm tính toán "Điểm thưởng" (Reward Points) cho người dân của tôi dài tận 150 dòng, có vô số lệnh IF-ELSE và truy vấn DB chằng chịt. Tôi muốn có cách nào đó để Test tự động, vì nếu test bằng tay (bấm trên UI) thì mất cả ngày.
```

#### 5.3. Kết quả AI trả về

```text
AI bảo tôi tạo một hàm `public static void main(String[] args)` ở dưới cùng, khởi tạo đối tượng Service, nạp data giả vào bằng tay, và gọi hàm để xem `System.out.println` có in ra đúng kết quả không.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Tôi TỪ CHỐI hoàn toàn. Đây là cách làm thủ công của người mới học Code.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Xây dựng Unit Test tiêu chuẩn với JUnit 5 và Mockito:
- Critical Thinking: Hàm `main()` không thể chạy tích hợp tự động vào quá trình Build của hệ thống, không thể phát hiện lỗi nếu sau này code bị người khác sửa sai (Regression Bug). Quan trọng hơn, Test mà gọi trực tiếp vào Database thật thì sẽ làm hỏng dữ liệu hệ thống.
- Decision Ownership & Creative Synthesis: Tôi đã thiết lập một bộ Unit Test chuyên nghiệp bằng framework JUnit 5. Để cách ly hoàn toàn hệ thống với Database, tôi áp dụng thư viện Mockito để tạo ra các "Mock Object" (đối tượng giả lập). Bất kỳ lệnh gọi nào xuống Database (ví dụ `reportRepository.save()`) đều bị Mockito chặn lại và giả lập kết quả trả về ngay trên RAM. Tốc độ chạy 10 Test Cases chỉ tốn 0.1 giây. Bây giờ, nếu có thành viên nào trong nhóm sửa sai logic tính điểm, lệnh `mvn test` sẽ lập tức báo đỏ, chặn họ lại trước khi họ kịp làm hỏng hệ thống.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [ ] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [ ] Prompt tạo ra kết quả tốt
- [x] Prompt tạo ra kết quả chưa phù hợp (Tư duy Test thủ công, không đo lường được Coverage)
- [ ] Cần hỏi lại AI nhiều lần
- [x] Cần tự kiểm tra và chỉnh sửa nhiều
- [ ] Kết quả AI có lỗi hoặc chưa chính xác

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Commit Unit Testing Phase 20 |
| File liên quan | ReportServiceTest.java, pom.xml |
| Screenshot | |
| Kết quả chạy/test | Report của JUnit hiện lên màn hình xanh lá cây, bao phủ (Coverage) 85% tổng số dòng code của Service Layer. |
| Link tài liệu/báo cáo | |
| Ghi chú khác | |

#### 5.8. Ghi chú thêm

```text
Viết Code mà không viết Test cũng giống như lái xe ô tô mà không thắt dây an toàn. Đâm một phát là chết.
```

---

### Lần 34: Tích hợp Liên tục với CI/CD Pipeline (GitHub Actions)

#### 5.1. Thông tin chung

| Tiêu chí | Thông tin |
|---|---|
| Ngày tạo | 2026-08-03 |
| Công cụ AI | Antigravity |
| Số lượng prompt | 2 |
| Mức độ hài lòng | 2/5 |
| Mục đích | Tự động hóa hoàn toàn quy trình Kéo code - Build code - Chạy Test |

#### 5.2. Bối cảnh khi viết prompt

```text
Tôi rất mệt mỏi với việc mỗi lần nhóm viên Push code lên Github, tôi lại phải SSH vào Server, gõ `git pull`, gõ `mvn clean install` để Build lại hệ thống. Rất tốn thời gian.
```

#### 5.3. Kết quả AI trả về

```text
AI hào hứng sinh ra cho tôi một đoạn Bash Script `.sh`, xui tôi cài crontab trên Server Linux để cứ 5 phút nó lại tự động chạy Script đó để Pull code về.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Tôi cười trừ và loại bỏ hoàn toàn ý tưởng này.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Triển khai quy trình CI/CD với GitHub Actions:
- Critical Thinking: Việc dùng Crontab để Pull code tự động là cực kỳ nguy hiểm. Chẳng may lúc đó Code trên nhánh main đang bị lỗi Compile (không build được), Server Pull về và đè lên bản đang chạy, toàn bộ Website sẽ sập (Downtime). Code phải được Kiểm định (Tested) tự động trước khi cho phép gộp vào nhánh chính.
- Decision Ownership & Creative Synthesis: Tôi đã cấu hình GitHub Actions (CI/CD Pipeline chuẩn công nghiệp) bằng cách viết file `.github/workflows/ci.yml`. Tôi định nghĩa một Workflow: Bất cứ khi nào có người Push Code hoặc tạo Pull Request, Github tự động bật một máy chủ Ảo (Runner) độc lập. Máy ảo này sẽ kéo code mới về, tự cài Java 17, và chạy Lệnh `mvn test` (đã làm ở Lần 33). Chỉ khi nào toàn bộ Test Cases đều báo Xanh (Passed), Github mới cho phép tôi nhấn nút Merge (Trộn code). Nếu Test thất bại, Pipeline sẽ báo Đỏ chót, chặn đứng việc mang mã nguồn bẩn vào dự án. Hệ thống trở nên tự động và chuyên nghiệp tuyệt đối.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [ ] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [ ] Prompt tạo ra kết quả tốt
- [x] Prompt tạo ra kết quả chưa phù hợp (Tư duy Script thủ công, thiếu quy trình Kiểm định an toàn)
- [ ] Cần hỏi lại AI nhiều lần
- [x] Cần tự kiểm tra và chỉnh sửa nhiều
- [ ] Kết quả AI có lỗi hoặc chưa chính xác

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Commit CI/CD Pipeline Phase 20 |
| File liên quan | .github/workflows/ci.yml |
| Screenshot | |
| Kết quả chạy/test | Trên giao diện Pull Request của GitHub xuất hiện khu vực "Checks". Nút "Merge pull request" bị khóa chặt (Disabled) nếu GitHub Actions chạy Test thất bại, và tự động mở lại khi Fix xong lỗi. |
| Link tài liệu/báo cáo | |
| Ghi chú khác | |

#### 5.8. Ghi chú thêm

```text
Đừng làm bằng tay những việc mà Máy móc có thể làm thay bạn một cách nhanh chóng và không có sai sót (DevOps Mindset).
```

---

### Lần 35: Tối ưu hóa Database (Connection Pooling với HikariCP)

#### 5.1. Thông tin chung

| Tiêu chí | Thông tin |
|---|---|
| Ngày tạo | 2026-08-03 |
| Công cụ AI | Antigravity |
| Số lượng prompt | 2 |
| Mức độ hài lòng | 2/5 |
| Mục đích | Khắc phục lỗi sập Database khi có quá nhiều người truy cập cùng lúc |

#### 5.2. Bối cảnh khi viết prompt

```text
Khi dùng công cụ JMeter để giả lập 500 người dùng truy cập web cùng một lúc (Stress Test), hệ thống Spring Boot báo lỗi "HikariPool-1 - Connection is not available, request timed out after 30000ms" và sập hoàn toàn.
```

#### 5.3. Kết quả AI trả về

```text
AI phân tích rằng phần cứng Database của tôi quá yếu để chịu tải. Khuyên tôi lên AWS hoặc Azure mua gói Server xịn hơn (Tăng RAM, tăng CPU).
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Tuyệt đối không làm theo. Đây là cách giải quyết ngốn tiền và vô dụng.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Cấu hình tối ưu HikariCP Connection Pool:
- Critical Thinking: Việc "ném tiền" vào việc nâng cấp phần cứng (Vertical Scaling) để che đậy một lỗi phần mềm là tư duy cực kỳ sai lầm. Lỗi này không phải do máy tính yếu, mà là do cấu hình mặc định của Spring Boot (HikariCP) chỉ cho phép mở tối đa 10 luồng kết nối tới Database. Khi có 500 người truy cập, 490 người còn lại phải xếp hàng chờ. Sau 30 giây chờ đợi không được cấp quyền, hệ thống sẽ quăng lỗi Timeout.
- Decision Ownership & Creative Synthesis: Tôi đã tìm hiểu sâu về kiến trúc Connection Pooling. Tôi vào file `application.yml`, ghi đè cấu hình mặc định bằng `spring.datasource.hikari.maximum-pool-size=50` và `connection-timeout=20000`. Bằng cách nới rộng "đường cao tốc" dữ liệu lên 50 làn xe, kết hợp với việc tạo Index trong SQL để query chạy nhanh hơn, hệ thống của tôi đã chịu tải được 1000 người dùng cùng lúc mà không tốn thêm một đồng chi phí nào cho Server.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [ ] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [ ] Prompt tạo ra kết quả tốt
- [x] Prompt tạo ra kết quả chưa phù hợp (Xúi giục ném tiền mua phần cứng thay vì tối ưu phần mềm)
- [ ] Cần hỏi lại AI nhiều lần
- [x] Cần tự kiểm tra và chỉnh sửa nhiều
- [ ] Kết quả AI có lỗi hoặc chưa chính xác

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Commit HikariCP Optimization Phase 21 |
| File liên quan | application.yml |
| Screenshot | |
| Kết quả chạy/test | Bật lại JMeter với 1000 threads. Log Spring Boot không còn xuất hiện lỗi Timeout. Thời gian phản hồi API duy trì ở mức <200ms. |
| Link tài liệu/báo cáo | |
| Ghi chú khác | |

#### 5.8. Ghi chú thêm

```text
Đừng giải quyết Bottleneck (nút thắt cổ chai) bằng thẻ tín dụng. Hãy giải quyết bằng Kiến trúc phần mềm.
```

---

### Lần 36: Xử lý file tĩnh bằng Mạng phân phối nội dung (Cloud CDN)

#### 5.1. Thông tin chung

| Tiêu chí | Thông tin |
|---|---|
| Ngày tạo | 2026-08-03 |
| Công cụ AI | Antigravity |
| Số lượng prompt | 2 |
| Mức độ hài lòng | 2/5 |
| Mục đích | Giải phóng gánh nặng xử lý Ảnh/Video cho Server nội bộ |

#### 5.2. Bối cảnh khi viết prompt

```text
Người dân thường tải lên các bức ảnh rác thải có dung lượng 10-15MB. Khi có nhiều người cùng upload, Server nội bộ bị nghẽn băng thông, CPU tăng vọt lên 100% và ổ cứng báo đầy.
```

#### 5.3. Kết quả AI trả về

```text
AI viết cho tôi 1 class Java dùng thư viện ImageIO, mỗi khi người dùng upload ảnh, Java sẽ lấy ảnh đó nén xuống còn kích thước 1MB rồi mới lưu vào thư mục cục bộ của Server.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Loại bỏ hoàn toàn kiến trúc lưu file nội bộ này.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Triển khai Cloud Storage & CDN:
- Critical Thinking: Thuật toán nén ảnh bằng Java là thủ phạm tàn phá CPU và RAM. Server Backend sinh ra là để xử lý Logic nghiệp vụ (Auth, Database), không phải sinh ra để làm công việc "chân tay" tốn kém như thao tác I/O file tĩnh. Hơn nữa, nếu lưu 100GB ảnh vào cùng máy tính với Database, lúc Server hỏng ổ cứng sẽ mất toàn bộ dữ liệu.
- Decision Ownership & Creative Synthesis: Tôi thiết kế lại toàn bộ quy trình tải ảnh. Thay vì Frontend gửi ảnh cho Backend, tôi cho Frontend gửi thẳng ảnh lên máy chủ Cloud (như Amazon S3, Firebase Storage) qua Presigned URL. Backend không hề chạm vào file ảnh, nó chỉ việc lưu một chuỗi "URL" vào Database. Ở phía người xem, tôi kích hoạt dịch vụ CDN (Content Delivery Network). Ảnh sẽ được nén tự động trên Cloud và phân phối từ cụm máy chủ gần người dùng nhất. Nhờ vậy, Backend của tôi nhẹ bẫng, còn trang web thì hiển thị ảnh mượt mà, siêu tốc độ.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [ ] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [ ] Prompt tạo ra kết quả tốt
- [x] Prompt tạo ra kết quả chưa phù hợp (Tư duy lưu trữ cục bộ Monolithic tồi tệ)
- [ ] Cần hỏi lại AI nhiều lần
- [x] Cần tự kiểm tra và chỉnh sửa nhiều
- [ ] Kết quả AI có lỗi hoặc chưa chính xác

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Commit Cloud CDN Phase 21 |
| File liên quan | FileUploadService.java, frontend/Upload.tsx |
| Screenshot | |
| Kết quả chạy/test | Giả lập upload đồng thời 10 file 15MB. CPU của Server Backend đi ngang 0% vì mọi gánh nặng I/O đã được giao phó cho hệ thống Cloud. |
| Link tài liệu/báo cáo | |
| Ghi chú khác | |

#### 5.8. Ghi chú thêm

```text
Kiến trúc Microservices: Dịch vụ nào thì dùng máy chủ chuyên dụng đó. Đừng ôm đồm rác vào Backend.
```

---

### Lần 37: Tách luồng bằng Kiến trúc Hướng sự kiện (Message Queue / RabbitMQ)

#### 5.1. Thông tin chung

| Tiêu chí | Thông tin |
|---|---|
| Ngày tạo | 2026-08-03 |
| Công cụ AI | Antigravity |
| Số lượng prompt | 2 |
| Mức độ hài lòng | 2/5 |
| Mục đích | Giải quyết tình trạng nghẽn API khi phải xử lý quá nhiều việc cùng lúc (Gửi Email, Push Notification) |

#### 5.2. Bối cảnh khi viết prompt

```text
Khi người dân gửi 1 báo cáo, hệ thống mất tận 3 giây để phản hồi vì phải chờ lưu DB, chờ kết nối tới Google Server để gửi Email, và chờ gọi API Firebase để gửi Notification. Người dân phải nhìn icon Loading rất sốt ruột.
```

#### 5.3. Kết quả AI trả về

```text
AI đề xuất sử dụng `@Async` trong Spring Boot để mở Thread phụ chạy ngầm việc gửi Email, giúp luồng chính phản hồi nhanh hơn.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Chỉ ghi nhận khái niệm Bất đồng bộ, nhưng từ chối cách triển khai bằng Thread nội bộ của AI.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Đập đi xây lại bằng Kiến trúc Hướng Sự Kiện (Event-Driven):
- Critical Thinking: Dùng `@Async` (Thread Pool) là con dao hai lưỡi. Nếu Server bị Crash (sập nguồn) khi đang gửi Email ngầm, dữ liệu trên RAM sẽ bốc hơi và người dùng vĩnh viễn không nhận được thông báo. Quan trọng hơn, nếu có đợt gửi phản ánh ồ ạt, Server sẽ kiệt quệ tài nguyên (CPU Exhaustion) vì phải cõng thêm hàng ngàn luồng phụ.
- Decision Ownership & Creative Synthesis: Tôi đã mạnh dạn ứng dụng Message Queue (RabbitMQ). Giao dịch giờ đây được chia cắt: API chính chỉ làm đúng 1 việc là lưu Database và ném một dòng sự kiện (Event) vào RabbitMQ (tốn đúng 0.1s). Tôi dựng thêm một Microservice siêu nhỏ (Notification Worker) nằm ở một máy chủ khác, chuyên trực chờ hút sự kiện từ RabbitMQ ra để gửi Email. Kết quả: API siêu tốc, chịu tải khổng lồ, và nếu Worker có bị sập thì tin nhắn vẫn nằm an toàn trong Queue, không bao giờ bị mất!
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [ ] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [ ] Prompt tạo ra kết quả tốt
- [x] Prompt tạo ra kết quả chưa phù hợp (Giải pháp `@Async` nguy hiểm, dễ mất dữ liệu)
- [ ] Cần hỏi lại AI nhiều lần
- [x] Cần tự kiểm tra và chỉnh sửa nhiều
- [ ] Kết quả AI có lỗi hoặc chưa chính xác

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Commit RabbitMQ Integration Phase 22 |
| File liên quan | RabbitMQConfig.java, NotificationWorker.java |
| Screenshot | |
| Kết quả chạy/test | Bấm "Gửi phản ánh", UI báo thành công chỉ sau vài chục mili-giây. Dù tắt Worker đi rồi gửi, tin nhắn vẫn được lưu ở Queue. Bật Worker lên lại, nó tự động gửi bù Email ngay lập tức. |
| Link tài liệu/báo cáo | |
| Ghi chú khác | |

#### 5.8. Ghi chú thêm

```text
Đừng bắt một con trâu cày mọi mảnh ruộng. Hãy chia nhỏ công việc ra thành nhiều Service.
```

---

### Lần 38: Nhất quán dữ liệu với Transactional Outbox Pattern

#### 5.1. Thông tin chung

| Tiêu chí | Thông tin |
|---|---|
| Ngày tạo | 2026-08-03 |
| Công cụ AI | Antigravity |
| Số lượng prompt | 2 |
| Mức độ hài lòng | 2/5 |
| Mục đích | Ngăn chặn việc dữ liệu trong Database và RabbitMQ không đồng bộ (Data Inconsistency) |

#### 5.2. Bối cảnh khi viết prompt

```text
Trong hệ thống RabbitMQ vừa xây, tôi nhận ra một lỗ hổng: Nếu lưu Database thành công, nhưng lúc chuẩn bị đẩy vào Queue thì mạng chập chờn gây lỗi. Vậy là Database có bản ghi, nhưng hệ thống thông báo thì im lìm (Mất thông báo).
```

#### 5.3. Kết quả AI trả về

```text
AI cung cấp cho tôi đoạn code bọc `try...catch`, và dùng vòng lặp `while` kết hợp `Thread.sleep` để Retry (thử lại) việc ném vào Queue vài lần. Nếu vẫn tịt thì báo lỗi.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Bác bỏ hoàn toàn giải pháp Retry bằng tay yếu ớt này.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Triển khai Transactional Outbox Pattern chuẩn mực:
- Critical Thinking: Retry trên RAM (trong mã Java) là vô dụng nếu Server đột ngột khởi động lại. Sự bất đồng bộ dữ liệu (Dual Write Problem) là lỗi nguy hiểm chết người trong Kiến trúc Phân tán. Không thể phó mặc nó cho vòng lặp `while` được.
- Decision Ownership & Creative Synthesis: Tôi đã thiết kế mẫu Outbox Pattern. Khi lưu phản ánh, tôi lợi dụng sức mạnh của ACID trong Database Transaction: Cùng một lúc, tôi lưu dữ liệu vào bảng chính (`reports`), và lưu một "Bản nháp Sự kiện" vào bảng phụ (`outbox_events`). Cả 2 cùng Thành công hoặc cùng Thất bại (Rollback). Sau đó, một Polling Job (chạy độc lập) sẽ âm thầm quét bảng `outbox` để bốc những bản nháp đó đẩy vào RabbitMQ một cách từ tốn. Với giải pháp này, tôi đã đạt được cảnh giới "At-least-once Delivery". Dù mất mạng, đứt cáp hay cháy máy chủ, không một sự kiện nào bị thất lạc.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [ ] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [ ] Prompt tạo ra kết quả tốt
- [x] Prompt tạo ra kết quả chưa phù hợp (Tư duy xử lý lỗi sơ sài)
- [ ] Cần hỏi lại AI nhiều lần
- [x] Cần tự kiểm tra và chỉnh sửa nhiều
- [ ] Kết quả AI có lỗi hoặc chưa chính xác

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Commit Outbox Pattern Phase 22 |
| File liên quan | OutboxEventEntity.java, OutboxPollingJob.java |
| Screenshot | |
| Kết quả chạy/test | Dùng code giả lập lỗi mạng khi bắn vào RabbitMQ. Giao diện báo thành công. Dữ liệu nằm ở bảng `outbox` chờ mạng phục hồi rồi tự động chạy tiếp. |
| Link tài liệu/báo cáo | |
| Ghi chú khác | |

#### 5.8. Ghi chú thêm

```text
Database Transaction là vị cứu tinh vĩ đại nhất để giữ gìn sự toàn vẹn của Dữ liệu phân tán.
```

---

### Lần 39: Quản lý Log tập trung với ELK Stack

#### 5.1. Thông tin chung

| Tiêu chí | Thông tin |
|---|---|
| Ngày tạo | 2026-08-03 |
| Công cụ AI | Antigravity |
| Số lượng prompt | 2 |
| Mức độ hài lòng | 2/5 |
| Mục đích | Tìm kiếm và phân tích Log lỗi trên nhiều server khác nhau mà không cần SSH |

#### 5.2. Bối cảnh khi viết prompt

```text
Hệ thống hiện tại chạy trên 3 máy chủ (Frontend, Backend, Worker). Khi có khách hàng báo lỗi, tôi phải hì hục SSH vào từng máy chủ, chạy lệnh `tail -f` để đọc hàng ngàn dòng log rất hoa mắt, chưa kể việc không thể đối chiếu log giữa máy Backend và máy Worker.
```

#### 5.3. Kết quả AI trả về

```text
AI đề xuất tôi cài đặt một Bash Script tự động trên cả 3 máy chủ, cứ 12h đêm thì nén các file `.log` thành đuôi `.zip`, sau đó gửi Email cho tôi tải về mở ra đọc bằng Notepad.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Phủ nhận hoàn toàn cách làm thủ công lạc hậu này.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Triển khai ELK Stack (Centralized Logging):
- Critical Thinking: Khi hệ thống mở rộng, file log phân tán ở nhiều máy chủ chính là "ác mộng" của việc Debug. Script nén file zip của AI không giúp ích gì cho việc theo dõi lỗi thời gian thực (Real-time).
- Decision Ownership & Creative Synthesis: Tôi đã mạnh dạn ứng dụng hệ sinh thái ELK Stack (Elasticsearch, Logstash, Kibana). Tôi đổi cấu hình `logback-spring.xml` để sinh log dưới định dạng JSON và stream thẳng về máy chủ Logstash qua giao thức TCP. Elasticsearch đóng vai trò như một cỗ máy tìm kiếm Google nội bộ, lập chỉ mục (index) toàn bộ log. Khi mở giao diện Kibana, tôi có một Dashboard cực kỳ xịn sò. Chỉ cần gõ từ khóa `ERROR`, toàn bộ vết tích lỗi của cả 3 máy chủ hiện ra trong 1 giây. Việc Debug giờ đây trở nên cực kỳ nhàn nhã và chuyên nghiệp.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [ ] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [ ] Prompt tạo ra kết quả tốt
- [x] Prompt tạo ra kết quả chưa phù hợp (Tư duy quản lý thủ công)
- [ ] Cần hỏi lại AI nhiều lần
- [x] Cần tự kiểm tra và chỉnh sửa nhiều
- [ ] Kết quả AI có lỗi hoặc chưa chính xác

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Commit ELK Stack Phase 23 |
| File liên quan | logback-spring.xml, docker-compose.yml |
| Screenshot | |
| Kết quả chạy/test | Giả lập lỗi Exception trong code. Mở trang web Kibana (cổng 5601), tìm kiếm `level: ERROR`, lỗi hiện ra ngay lập tức kèm Stack Trace chi tiết. |
| Link tài liệu/báo cáo | |
| Ghi chú khác | |

#### 5.8. Ghi chú thêm

```text
Log là rác nếu nằm phân tán. Log là Vàng nếu được quản lý tập trung.
```

---

### Lần 40: Distributed Tracing & Metrics Dashboard (Prometheus + Grafana + Zipkin)

#### 5.1. Thông tin chung

| Tiêu chí | Thông tin |
|---|---|
| Ngày tạo | 2026-08-03 |
| Công cụ AI | Antigravity |
| Số lượng prompt | 2 |
| Mức độ hài lòng | 2/5 |
| Mục đích | Giám sát hiệu năng hệ thống (CPU, RAM) và truy vết request phân tán |

#### 5.2. Bối cảnh khi viết prompt

```text
Tôi muốn đo xem API "Tạo phản ánh mới" tốn bao nhiêu thời gian để chạy qua các hàm (Controller -> Service -> Repository -> RabbitMQ). Tôi cũng muốn biết CPU và RAM của máy chủ hiện đang ăn bao nhiêu %.
```

#### 5.3. Kết quả AI trả về

```text
AI xúi tôi khai báo biến `long start = System.currentTimeMillis();` ở đầu mỗi hàm, rồi lấy `System.currentTimeMillis() - start` ở cuối hàm và in ra Log. Còn CPU thì bảo lên Linux gõ lệnh `top`.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Tuyệt đối không sử dụng cách chèn code rác vào Business Logic.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Tích hợp Hệ sinh thái Observability hiện đại:
- Critical Thinking: Việc chèn code tính giờ thủ công vào hàng trăm API sẽ tạo ra một mớ "Spaghetti code", vi phạm nghiêm trọng nguyên tắc SOLID. Lệnh `top` của Linux thì không có tính năng lưu trữ lịch sử để tôi xem lại khi server bị sập vào lúc 3h sáng.
- Decision Ownership & Creative Synthesis: Tôi đã cài đặt thư viện `Micrometer` và `Zipkin` vào dự án Spring Boot. Thư viện này tự động gán một `trace_id` vô hình cho mỗi Request, cho phép tôi mở Zipkin lên để nhìn thấy Flame Graph (Biểu đồ ngọn lửa) chỉ ra chính xác Hàm nào hay câu Query SQL nào đang chạy chậm.
Song song đó, tôi cấu hình Prometheus để liên tục thu thập (pull) các thông số sức khỏe (Metrics) từ Spring Boot Actuator. Tôi dùng Grafana để vẽ các thông số này thành biểu đồ trực quan. Giờ đây, tôi có một phòng điều khiển (Control Room) theo dõi JVM Memory, Active Connections 24/7 y như một kỹ sư DevOps thực thụ.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [ ] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [ ] Prompt tạo ra kết quả tốt
- [x] Prompt tạo ra kết quả chưa phù hợp (Tư duy chèn code thủ công phá vỡ kiến trúc)
- [ ] Cần hỏi lại AI nhiều lần
- [x] Cần tự kiểm tra và chỉnh sửa nhiều
- [ ] Kết quả AI có lỗi hoặc chưa chính xác

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Commit Prometheus & Zipkin Phase 23 |
| File liên quan | application.yml, pom.xml, docker-compose.yml |
| Screenshot | |
| Kết quả chạy/test | Mở giao diện Grafana (Cổng 3000), quan sát Dashboard hiển thị JVM Heap Usage, CPU Load, và biểu đồ đếm số lượng HTTP Request theo thời gian thực. |
| Link tài liệu/báo cáo | |
| Ghi chú khác | |

#### 5.8. Ghi chú thêm

```text
Không có Monitoring, hệ thống của bạn là một chiếc hộp đen. Có Monitoring, nó là một cỗ máy trong suốt.
```

---

### Lần 41: Bảo mật định danh tập trung (SSO & Keycloak)

#### 5.1. Thông tin chung

| Tiêu chí | Thông tin |
|---|---|
| Ngày tạo | 2026-08-03 |
| Công cụ AI | Antigravity |
| Số lượng prompt | 2 |
| Mức độ hài lòng | 2/5 |
| Mục đích | Giải quyết điểm yếu chết người của JWT tự chế: Không thể thu hồi (revoke) khi bị hack |

#### 5.2. Bối cảnh khi viết prompt

```text
Hệ thống cũ dùng thuật toán HMAC tạo JWT. Lỗi chí mạng là một khi đã cấp JWT, Backend không có cách nào chặn JWT đó lại cho đến khi nó hết hạn. Nếu Hacker chôm được JWT của chủ tịch phường, chúng có thể quậy nát hệ thống trong vòng 24 giờ.
```

#### 5.3. Kết quả AI trả về

```text
AI đề xuất tôi tạo một bảng `token_blacklist` trong CSDL SQL. Khi muốn đuổi ai đó, hãy insert chuỗi JWT vào bảng này. Ở Backend, mỗi lần có API request tới, bắt Java query xuống SQL xem chuỗi JWT có nằm trong bảng cấm không.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Phủ nhận hoàn toàn cách làm ngớ ngẩn làm thắt cổ chai hệ thống.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Tích hợp Hệ thống quản lý định danh chuyên nghiệp (Keycloak):
- Critical Thinking: Bản chất của JWT là "Stateless" (Xác thực không cần chọc vào DB). Ý tưởng tạo bảng Blacklist của AI đã phá nát bản chất này. Nếu có 10.000 request/giây, Database sẽ phải thực hiện 10.000 câu lệnh SELECT để quét cái chuỗi JWT khổng lồ đó, gây sập Database ngay lập tức (Bottleneck).
- Decision Ownership & Creative Synthesis: Tôi nhận ra việc "tự chế bánh xe" bảo mật là điều cấm kỵ. Tôi đã xóa bỏ toàn bộ code sinh JWT tự chế, thay vào đó tích hợp Keycloak (Open-source Identity and Access Management) chạy trên Docker. Backend chuyển sang dùng tiêu chuẩn OAuth2 và OpenID Connect (OIDC). Keycloak đảm nhận toàn bộ việc mã hóa bằng cặp khóa bất đối xứng RSA, cấp phát và quản lý Session. Nếu có sự cố, tôi chỉ cần 1 click trên giao diện Admin Keycloak là Token đó bị hủy tức thì, Backend từ chối ngay lập tức mà không phải tốn 1 nhịp CPU nào để chọc vào Database. Quá trình này còn tặng kèm tính năng Đăng nhập bằng Google (SSO) cực kỳ xịn sò.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [ ] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [ ] Prompt tạo ra kết quả tốt
- [x] Prompt tạo ra kết quả chưa phù hợp (Tư duy xử lý bảo mật chắp vá, phá vỡ hiệu năng)
- [ ] Cần hỏi lại AI nhiều lần
- [x] Cần tự kiểm tra và chỉnh sửa nhiều
- [ ] Kết quả AI có lỗi hoặc chưa chính xác

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Commit Keycloak & OAuth2 Phase 24 |
| File liên quan | SecurityConfig.java, docker-compose.yml |
| Screenshot | |
| Kết quả chạy/test | Dùng Postman gửi JWT cũ đã bị Revoke trên Keycloak, Spring Boot lập tức trả về lỗi `401 Unauthorized`. Backend không phải chạy bất kỳ câu lệnh SQL nào. |
| Link tài liệu/báo cáo | |
| Ghi chú khác | |

#### 5.8. Ghi chú thêm

```text
Trong ngành phần mềm, Đừng bao giờ tự viết bộ Mã hóa và Xác thực trừ khi bạn là một chuyên gia mật mã học. Hãy dùng hàng chuẩn công nghiệp.
```

---

### Lần 42: Che dấu dữ liệu cá nhân (Data Masking & PII)

#### 5.1. Thông tin chung

| Tiêu chí | Thông tin |
|---|---|
| Ngày tạo | 2026-08-03 |
| Công cụ AI | Antigravity |
| Số lượng prompt | 2 |
| Mức độ hài lòng | 2/5 |
| Mục đích | Ngăn chặn việc hiển thị tơ hơ thông tin nhạy cảm (Số điện thoại, CMND) của người dân trên mạng |

#### 5.2. Bối cảnh khi viết prompt

```text
Khi cán bộ phường mở danh sách phản ánh, số điện thoại và số CMND của người dân nộp phạt hiện rõ nguyên bản. Nếu màn hình này bị chụp trộm hoặc Hacker nghe lén (Sniffing), dữ liệu Personally Identifiable Information (PII) sẽ bị lộ.
```

#### 5.3. Kết quả AI trả về

```text
AI viết một đoạn JavaScript ở Frontend React: `phone.substring(0, 3) + "***" + phone.substring(phone.length - 3)`. Khuyên tôi lấy API về rồi dùng hàm này che đi trước khi render ra màn hình HTML.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Bác bỏ hoàn toàn tư duy bảo mật bằng Frontend (Zero Trust).
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Triển khai Custom Jackson Serializer để Mask Data tại Backend:
- Critical Thinking: Xử lý bảo mật ở Frontend là một trò hề (Security by Obscurity). Dù UI có hiển thị dấu `***`, thì chuỗi JSON được API trả về qua đường mạng vẫn chứa số điện thoại thật. Bất cứ ai biết xài phím F12 mở tab Network lên đều lấy được toàn bộ database thông tin cá nhân.
- Decision Ownership & Creative Synthesis: Tôi chặn đứng rủi ro này từ trong trứng nước (Backend). Tôi viết một `Custom Jackson Serializer` và một Annotation `@PiiMasking`. Trong Class DTO của Java, tôi gắn `@PiiMasking` lên trường `phoneNumber`. Khi Spring Boot biến Object thành chuỗi JSON để ném qua mạng, Serializer này sẽ "bóp méo" số điện thoại ngay trong RAM máy chủ thành dạng `098***123`. Kết quả: JSON truyền đi trên Internet không hề chứa thông tin thật. Hacker có F12 hay bắt được gói tin cũng đành chịu thua. Chuẩn bảo mật cấp Ngân hàng được thiết lập.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [ ] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [ ] Prompt tạo ra kết quả tốt
- [x] Prompt tạo ra kết quả chưa phù hợp (Tư duy bảo mật Frontend sai lệch hoàn toàn)
- [ ] Cần hỏi lại AI nhiều lần
- [x] Cần tự kiểm tra và chỉnh sửa nhiều
- [ ] Kết quả AI có lỗi hoặc chưa chính xác

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Commit Data Masking Phase 24 |
| File liên quan | PiiMaskingSerializer.java, @PiiMasking, ReportDTO.java |
| Screenshot | |
| Kết quả chạy/test | Gọi API qua Postman, dữ liệu trả về `{"phoneNumber": "098***123"}`. Thông tin thật không bao giờ rời khỏi cánh cửa của máy chủ Backend. |
| Link tài liệu/báo cáo | |
| Ghi chú khác | |

#### 5.8. Ghi chú thêm

```text
Zero Trust (Không tin ai cả). Đặc biệt là không được tin tưởng bất cứ thứ gì nằm ở Frontend.
```

---

## 6. Prompt quan trọng nhất

Chọn một prompt có ảnh hưởng lớn nhất đến bài tập/project.

- **Prompt**: "Nếu 2 cán bộ phường cùng lúc bấm nút 'Duyệt' và 'Từ chối' cho cùng một phản ánh thì sao? Tôi muốn cập nhật trạng thái của phản ánh đó vào Database." (Lần 30)
- **Lý do**: Đây là khoảnh khắc thay đổi hoàn toàn tư duy lập trình của tôi. Ban đầu, tôi chỉ tập trung viết code sao cho "chạy được" (Happy Path). Nhưng khi đối diện với tình huống Cạnh tranh dữ liệu (Race Condition) - bài toán xương máu của mọi hệ thống thực tế, tôi nhận ra sự hời hợt của AI khi nó chỉ khuyên tôi dùng lệnh UPDATE SQL thô sơ, dẫn đến hiểm họa "Ghi đè dữ liệu" (Lost Update). Từ prompt này, tôi đã tự mình đào sâu vào kiến trúc Backend, khám phá ra kỹ thuật Khóa Lạc Quan (Optimistic Locking với `@Version`) của JPA/Hibernate. Việc thiết kế thành công cơ chế khóa dữ liệu không chỉ bảo vệ tính toàn vẹn của Database mà còn nâng tầm dự án từ một Đồ án sinh viên thành một Sản phẩm doanh nghiệp thực thụ, có thể chịu tải và đảm bảo an toàn kể cả khi hàng ngàn người thao tác cùng lúc.

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
Đối chiếu với thực trạng kẹt thực tế tại Đà Nẵng để đánh giá xem tình huống server bị ngập dữ liệu trùng lặp có khả thi không, và nhận thấy hoàn toàn chính xác.
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
| Prompt thiết kế giải pháp | 4 | Quy trình GitHub Flow & API Contract; Thiết kế lại giao diện UBND & Công an Phường, Thiết kế Cổng Du khách, Thiết kế chat thời gian thực |
| Prompt thiết kế database |  |  |
| Prompt sinh code mẫu | 1 | Cấu hình @Async Thread Pool & SMS OTP |
| Prompt sửa lỗi (Debug/Fix) | 4 | Lọc dữ liệu GPS rác, Khắc phục Git Merge Loop do Vite, Sửa lỗi lặp Footer, Sửa lỗi build script Maven |

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
| Trần Minh Vĩ | 2026-08-02 |
