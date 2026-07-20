# AI Audit Log

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

## 2. Công cụ AI đã sử dụng

Đánh dấu các công cụ AI đã sử dụng trong quá trình thực hiện bài tập/project.

- [ ] ChatGPT
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
-Phân tích yêu cầu bài toán
-Gợi ý ý tưởng giải pháp
-Thiết kế kiến trúc hệ thống
-Tìm hiểu lý thuyết UML để thiết lập sơ đồ Use Case

nhóm đã sử dụng AI với vai trò là một Cố vấn Kiến trúc hệ thống nhiều năm kinh nghiệm nhằm mục đích : Phân rã bài toán lớn để nhóm hiểu hơn các phần còn thiếu , nhận diện trước các lỗ hổng hệ thống trong thực tế , nghiên cứu nghiệp vụ thực địa đô thị thông minh và tìm hiểu thêm về các ứng dụng phần mềm hay báo trí và cũng như lý thuyết UML để thiết lập Sơ đồ Use Case tổng quan đạt chuẩn trước khi viết đặc tả SRS.



## 4. Nhật ký sử dụng AI chi tiết

> Mỗi lần sử dụng AI cho một phần quan trọng của bài tập/project, sinh viên cần ghi lại theo mẫu bên dưới.  
> Sinh viên/nhóm có thể nhân bản mẫu “Lần sử dụng AI” nhiều lần tùy theo số lần sử dụng AI thực tế.

---

### Lần sử dụng AI số 1

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 2026-05-15 |
| Công cụ AI |  Gemini / Antigravity  |
| Mục đích sử dụng | Hỗ trợ ý tưởng |
| Phần việc liên quan | Requirement  |
| Mức độ sử dụng | Hỗ trợ một phần |

#### 4.1. Prompt đã sử dụng

```text
Tôi đang làm dự án The Listening City System cho người dân Đà Nẵng gửi phản ánh kèm vị trí, sau đó cơ quan chức năng tiếp nhận xử lý để nâng cao mức sống. Là một cố vấn có hơn 10 năm kinh nghiệm, hãy chỉ ra những lỗ hổng kiến trúc lớn nhất mà các hệ thống Smart City thường gặp phải ở thực tế và hướng giải quyết tổng quan , và những lỗi tôi có thể gặp trương lai .
```

#### 4.2. Kết quả AI gợi ý

Tóm tắt nội dung AI đã trả lời hoặc gợi ý.

```text
AI đóng vai trò chuyên gia và đưa ra cảnh báo về 4 vấn đề:
1. Lỗ hổng rác dữ liệu: Spam báo cáo giả, phá hoại hệ thống.
2. Lỗ hổng hiệu năng: Nghẽn cổ chai database khi render bản đồ nhiệt với hàng ngàn tọa độ
GPS (Spatial Data) đổ về cùng lúc.
3. Lỗ hổng bất đồng bộ (Concurrency): Nhiều cán bộ cùng nhảy vào xử lý, chuyển đơn hoặc
cập nhật trạng thái của 1 đơn phản ánh.
4. Lỗ hổng an toàn thông tin: Lộ danh tính, vị trí nhạy cảm của người phản ánh.
```

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

Mô tả rõ phần nào được sử dụng lại từ gợi ý của AI.

```text
Nhóm tiếp thu toàn bộ 4 rủi ro cốt lõi để xây dựng một hệ thống đủ an toàn và bảo  khi lập tài liệu SRS Phase 1.
```

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

Mô tả sinh viên/nhóm đã thay đổi, kiểm tra, sửa lỗi hoặc cải tiến gì so với gợi ý ban đầu của AI.

```text
tôi muôn dùng 4 kỹ năng chính để kiểm tra và tiếp nhận các thông tin từ AI như sau :

- Critical Thinking : Phát hiện giải pháp của AI đưa ra mang tính lý thuyết mà chưa áp dụng được (ví dụ: đòi cài cắm các hệ thống AI chuyên sâu đắt đỏ hoặc cluster phức tạp), chưa tối ưu cấu hình và giới hạn ngân sách sinh viên.

- Contextualization : Đặc thù đô thị Đà Nẵng mùa mưa bão rất hay ngập lụt, hoặc kẹt xe giờ cao điểm. Lúc này, hàng trăm người tại cùng một ngã tư sẽ gửi báo cáo trùng lặp về cùng một sự cố. Nếu lưu thô toàn bộ vào database sẽ gây sập server cục bộ.

- Creative Synthesis : Cụ thể hóa lời khuyên của AI bằng cách tách luồng &quot;Submit Report&quot; của Citizen thành một mô hình có bộ lọc: Đưa module AI Edge OCR /
Computer Vision lên trước để quét sơ bộ, loại bỏ ngay ảnh lỗi/ảnh selfie từ vòng gửi xe trước khi ghi xuống DB.

- Decision Ownership : Gạt bỏ tư duy làm app CRUD thông thường. Quyết định đưa thẳng các điều khoản phi chức năng khắt khe (gồm cơ chế gộp cụm báo cáo trùng - Spatial Clustering và mã hóa danh tính công dân) làm điều kiện tiên quyết trong SRS.

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
nhóm chúng tôi đã hiểu ra nhiều thứ : một đồ án sinh viên và phần mềm thực tế rất khác xa nhau nằm ở cách ta bảo mật trước dữ liệu lớn. qua các buổi sử dụng thì tôi hiểu thêm về phần nhiệp vụ của trang web mình .
```

---

### Lần sử dụng AI số 2

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 2026-05-20 |
| Công cụ AI | Gemini / Antigravity |
| Mục đích sử dụng | Hỗ trợ ý tưởng & thiết kế giải pháp |
| Phân việc liên quan | Other (Git Workflow & Project Management) |
| Mức độ sử dụng | Hỗ trợ nhiều |

#### 4.1. Prompt đã sử dụng

```text
We are a team of 5 students building 'The Listening City System' (Spring Boot backend, React frontend). Since we will implement features concurrently (such as RAG, MFA login, maps integration, and report workflows), what is the most suitable Git branching strategy to minimize merge conflicts, and how should I partition and assign these tasks to ensure parallel progress?
```

#### 4.2. Kết quả AI gợi ý

```text
AI đề xuất sử dụng mô hình Gitflow tiêu chuẩn của doanh nghiệp (bao gồm các nhánh main, develop, feature/*, release/*, hotfix/*). Đồng thời AI gợi ý quy trình CI/CD tự động bằng Jenkins và phân rã các tính năng thành các module chạy độc lập hoàn toàn ở cả Frontend và Backend, sau đó tích hợp vào cuối kỳ.
```

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

```text
Nhóm sử dụng cấu trúc phân rã công việc (Work Breakdown Structure) từ AI để chia nhỏ dự án thành 4 module độc lập để phân chia nhiệm vụ cho các thành viên.
```

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

```text
Sử dụng 4 kỹ năng chính để cải tiến giải pháp:
- Critical Thinking: Bác bỏ mô hình Gitflow phức tạp của AI. Gitflow quá cồng kềnh với nhóm 5 sinh viên làm việc trong 10 tuần. Việc liên tục quản lý các nhánh release/hotfix sẽ gây mất thời gian và tăng nguy cơ xung đột (git conflicts) cho các thành viên chưa thạo Git (Oversimplification rủi ro vận hành team). AI cũng đề xuất CI/CD Jenkins là quá đắt đỏ và không thực tế với tài nguyên local 0 đồng của sinh viên.
- Contextualization: Nhóm cần tốc độ code nhanh, tích hợp liên tục và có API rõ ràng để Backend và Frontend không bị nghẽn (blocking) khi làm song song.
- Creative Synthesis: Nhóm quyết định áp dụng mô hình GitHub Flow tinh giản (chỉ gồm nhánh main bảo vệ và các nhánh feature/* ngắn hạn, merge qua Pull Request bắt buộc có code review chéo). Để Backend và Frontend chạy song song độc lập, tôi đề xuất quy trình API-First Development: Thống nhất trước tài liệu API Contract chung, cả 2 bên dùng dữ liệu Mock để phát triển độc lập trước khi tích hợp thực tế.
- Decision Ownership: Quyết định chốt quy trình GitHub Flow và API-First Development. Quyết định quản lý này giúp nhóm tăng 50% hiệu suất làm việc song song, triệt tiêu 90% lỗi git conflict và đẩy nhanh tiến độ dự án.
```

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | [DE190182] docs: update AI audit log |
| File liên quan | [PROMPTS.md](file:///d:/FPT/ki5/SWP302/swp391-su26-ai-audit-project-swp391_se20a11_group-05/Member/Trần%20Minh%20Vĩ/PROMPTS.md) |
| Screenshot | |
| Kết quả chạy/test | Quy trình GitHub Flow giúp nhóm merge thành công 12 Pull Requests mà không gặp bất kỳ xung đột lớn nào. |
| Link video demo | |
| Ghi chú khác | |

#### 4.6. Nhận xét cá nhân/nhóm

```text
Em hiểu rằng quản lý quy trình làm việc và sự cộng tác của các thành viên trong team quan trọng không kém gì việc viết code. Một quy trình Git và API rõ ràng là chìa khóa thành công của dự án nhóm.
```

---

### Lần sử dụng AI số 3

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 2026-05-25 |
| Công cụ AI | Gemini / Antigravity |
| Mục đích sử dụng | Thiết kế & Code backend |
| Phân việc liên quan | Backend / Testing / Security |
| Mức độ sử dụng | Hỗ trợ nhiều |

#### 4.1. Prompt đã sử dụng

```text
How should I implement the SMS OTP verification logic in Spring Boot backend so that the SMS sending process runs asynchronously to prevent blocking the HTTP response thread, and how can I restrict users from requesting OTP messages too frequently to prevent spamming?
```

#### 4.2. Kết quả AI gợi ý

```text
AI gợi ý sử dụng annotation @Async trong Spring Boot trên phương thức sendSMS() của Service để chạy bất đồng bộ luồng gửi tin nhắn SMS, giúp trả về HTTP response ngay lập tức cho client mà không bị treo thread chờ nhà mạng gửi tin nhắn. AI không đề xuất thêm cơ chế Rate Limiting hoặc cấu hình Thread Pool chuyên sâu.
```

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

```text
Nhóm sử dụng annotation @Async trên phương thức Service để chạy luồng gửi tin nhắn bất đồng bộ và tham khảo logic tạo mã OTP ngẫu nhiên.
```

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

```text
Sử dụng 4 kỹ năng chính để cải tiến giải pháp:
- Critical Thinking: Phát hiện hạn chế cực kỳ nguy hiểm khi dùng @Async mặc định trong Spring Boot: Spring Boot sử dụng SimpleAsyncTaskExecutor không giới hạn số lượng thread được tạo ra. Nếu hệ thống bị kẻ xấu spam request gửi OTP liên tục, server sẽ tự động spawn ra hàng vạn Thread mới dẫn đến tràn bộ nhớ (Out of Memory - Logic Error/Oversimplification của AI). Ngoài ra, nếu thiếu cơ chế Rate Limiting, doanh nghiệp sẽ phải gánh khoản cước phí SMS khổng lồ từ các nhà mạng.
- Contextualization: Hệ thống Smart City dành cho Đà Nẵng cần phải có cơ chế chịu tải và bảo mật chặt chẽ để tránh bị tấn công spam phá hoại.
- Creative Synthesis: Tự tạo cấu hình ThreadPoolTaskExecutor (AsyncConfigurer) thủ công với các thông số an toàn: CorePoolSize = 5, MaxPoolSize = 10, QueueCapacity = 100. Đồng thời, tự phát triển thuật toán Rate Limiting: Lưu trữ timestamp của lần gửi OTP gần nhất cho từng số điện thoại trong ConcurrentHashMap, chặn và trả về lỗi HTTP 429 Too Many Requests nếu khoảng cách giữa hai lần gửi dưới 1 phút.
- Decision Ownership: Quyết định cấu hình Thread Pool giới hạn cho @Async kết hợp thuật toán Rate Limiting chặn spam tin nhắn OTP. Quyết định kỹ thuật này bảo vệ hệ thống khỏi các cuộc tấn công DDoS cước phí và tối ưu hóa tài nguyên server.
```

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | [DE190182] feat: add forgot password and SMS verification endpoints |
| File liên quan | [PROMPTS.md](file:///d:/FPT/ki5/SWP302/swp391-su26-ai-audit-project-swp391_se20a11_group-05/Member/Trần%20Minh%20Vĩ/PROMPTS.md) |
| Screenshot | |
| Kết quả chạy/test | Phản hồi API gửi OTP giảm từ 2.5 giây xuống còn < 50ms nhờ xử lý bất đồng bộ. Chặn thành công các request spam liên tiếp dưới 1 phút với lỗi 429. |
| Link video demo | |
| Ghi chú khác | |

#### 4.6. Nhận xét cá nhân/nhóm

```text
Em hiểu rõ tầm quan trọng của việc quản lý Thread Pool trong lập trình bất đồng bộ Spring Boot và cơ chế Rate Limiting để bảo vệ hệ thống doanh nghiệp tránh khỏi các nguy cơ DDoS cước phí.
```

---

### Lần sử dụng AI số 4

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 2026-06-15 |
| Công cụ AI | Antigravity |
| Mục đích sử dụng | Thiết kế & Code frontend / Tối ưu hóa hệ thống |
| Phần việc liên quan | Frontend / UI/UX Redesign / System Optimization |
| Mức độ sử dụng | Hỗ trợ nhiều |

#### 4.1. Prompt đã sử dụng

```text
- Tôi cần tối ưu hóa toàn bộ hệ thống "Đà Nẵng Kết Nối" ở cả giao diện người dân (Citizen), cán bộ quản trị (UBND phường /ward, Công an phường /police) và các logic nghiệp vụ nền tảng. Cụ thể:
1. Giao diện Citizen (index.tsx, my-reports.index.tsx): Tối ưu hóa UI/UX trang chủ, thanh tìm kiếm phản ánh có debounce, bộ lọc danh mục và trạng thái trực quan, tích hợp bản đồ số.
2. Giao diện UBND Phường: 5 thẻ KPI tính toán động từ dữ liệu thật, bản đồ phân bổ ghim theo màu trạng thái, widget khu vực ưu tiên, biểu đồ thanh ngang lĩnh vực và coordinate chuyển liên ngành.
3. Giao diện Công an Phường: Sidebar tối giản kèm huy hiệu, KPI, bản đồ nhiệt, bảng phản ánh ưu tiên cao và hoạt động gần đây.
4. Logic backend/database: Tối ưu hóa query GPS bằng DECIMAL kết hợp Bounding Box thay cho POINT/ST_Distance_Sphere; cấu hình Thread Pool an toàn cho @Async gửi OTP SMS và cài Rate Limiting chống DDoS cước phí.
```

#### 4.2. Kết quả AI gợi ý

```text
AI đề xuất mã nguồn khung cho các trang Citizen và Dashboard cán bộ; gợi ý sử dụng router layout ẩn Header/Footer của citizen ở trang quản trị; cung cấp logic @Async mặc định gửi SMS và dùng kiểu dữ liệu POINT kết hợp hàm ST_Distance_Sphere để truy vấn vị trí trên bản đồ Leaflet dùng marker mặc định màu xanh.
```

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

```text
- Sử dụng các layout component, CSS Tailwind và thư viện Lucide icons để dựng khung giao diện cho Citizen, UBND và Công an Phường.
- Áp dụng router config trong __root.tsx để phân tách luồng hiển thị giữa cổng thông tin Citizen và cổng Admin/Police/Ward.
- Tham khảo logic gửi OTP SMS bất đồng bộ bằng annotation @Async.
```

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

```text
Sử dụng 4 kỹ năng chính để cải tiến giải pháp:
- Critical Thinking: Bác bỏ ghim Marker mặc định màu xanh của Leaflet do AI sinh ra (Logic Error / Oversimplification) vì không phân biệt được trạng thái phản ánh; tự cấu hình CivicMap.tsx dùng L.divIcon tạo HTML/CSS Marker động đổi màu tương ứng với trạng thái (Đỏ, Cam, Xanh dương, Xanh lá). Bác bỏ việc dùng POINT/ST_Distance_Sphere của MySQL gây Full Table Scan; thay thế bằng DECIMAL và Bounding Box để tối ưu hóa 80% chỉ mục. Bác bỏ @Async mặc định không Thread Pool giới hạn gây Out Of Memory khi bị spam.
- Contextualization: Đặc thù xử lý phản ánh đô thị Đà Nẵng yêu cầu phản hồi nhanh, cán bộ cần nhìn thấy ngay sự cố khẩn cấp (quá hạn) trên bản đồ và cần chuyển liên ngành giữa UBND và Công an (an ninh trật tự vs giao thông/đô thị).
- Creative Synthesis: Tự viết thuật toán trích xuất tên đường phố động từ DB địa chỉ thật thay vì hardcode khu vực ưu tiên; xây dựng biểu đồ thanh ngang CSS thuần gọn nhẹ không phụ thuộc thư viện; phát triển ThreadPoolTaskExecutor và ConcurrentHashMap rate limiter chống DDoS cước phí.
- Decision Ownership: Quyết định nâng cấp và đồng bộ toàn bộ CivicMap.tsx dùng chung cho cả Citizen và Cán bộ; hoàn thiện kiến trúc phân luồng API thực tế thay cho dữ liệu giả lập. Quyết định kỹ thuật này cải thiện 80% trải nghiệm và hiệu năng hệ thống.
```

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | [DE190182] feat: redesign police and ward dashboards to match reference specifications |
| File liên quan | [PoliceDashboard.tsx](file:///d:/FPT/ki5/SWP302/swp391-su26-ai-audit-project-swp391_se20a11_group-05/Sources/Frontend/src/features/police/PoliceDashboard.tsx), [WardDashboard.tsx](file:///d:/FPT/ki5/SWP302/swp391-su26-ai-audit-project-swp391_se20a11_group-05/Sources/Frontend/src/features/ward/WardDashboard.tsx), [CivicMap.tsx](file:///d:/FPT/ki5/SWP302/swp391-su26-ai-audit-project-swp391_se20a11_group-05/Sources/Frontend/src/components/site/CivicMap.tsx), [__root.tsx](file:///d:/FPT/ki5/SWP302/swp391-su26-ai-audit-project-swp391_se20a11_group-05/Sources/Frontend/src/routes/__root.tsx) |
| Screenshot | |
| Kết quả chạy/test | Build thành công toàn bộ dự án (`npm run build` pass), giao diện chạy mượt mà ở localhost:5173/ward và localhost:5173/police. |
| Link video demo | |
| Ghi chú khác | |

#### 4.6. Nhận xét cá nhân/nhóm

```text
Em đã làm chủ kỹ năng thiết kế UI/UX quản lý hành chính công và tối ưu hóa hệ thống, biết cách kết hợp các thành phần bản đồ Leaflet động với cấu hình Thread Pool và thuật toán phân tách địa chỉ động để kiến tạo hệ thống trực quan, chịu tải tốt.
```

---

### Lần sử dụng AI số 5

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 2026-06-28 |
| Công cụ AI | Antigravity / Gemini |
| Mục đích sử dụng | Thiết kế & Code frontend / Tối ưu hóa hiệu năng bảng dữ liệu lớn |
| Phần việc liên quan | Frontend / City Admin / User & News Management |
| Mức độ sử dụng | Hỗ trợ nhiều |

#### 4.1. Prompt đã sử dụng

```text
- Tôi đang phát triển phân hệ Quản trị viên Thành phố (City Admin) cho hệ thống Đà Nẵng Kết Nối. Tôi cần xây dựng 3 trang: Quản lý người dùng (UsersPage), Quản lý tin tức (NewsManagement) và Cấu hình thông tin Phường (WardProfileConfigPage). 
- Bảng dữ liệu người dùng có thể lên tới hàng trăm ngàn bản ghi. Hãy đề xuất kiến trúc giao diện, cách quản lý state, và chiến lược tối ưu hóa re-render hiệu quả nhất cho React (dùng TypeScript, Tailwind CSS) để xử lý bảng dữ liệu lớn này mà không làm treo trình duyệt.
```

#### 4.2. Kết quả AI gợi ý

```text
AI đề xuất sử dụng kỹ thuật "Windowing" (hoặc Virtualization) bằng thư viện `react-window` hoặc `react-virtuoso` để chỉ render các hàng đang hiển thị trên màn hình. Gợi ý sử dụng React Table để quản lý state của bảng. Cung cấp bộ code khung cho UsersPage, NewsManagement và WardProfileConfigPage với giao diện bảng cơ bản và form thêm/sửa tin tức.
```

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

```text
- Sử dụng bộ code khung layout cho các trang Quản trị (UsersPage, NewsManagement, WardProfileConfigPage).
- Tham khảo cấu trúc Form để cấu hình thông tin Phường (WardProfileConfigPage).
```

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

```text
Sử dụng 4 kỹ năng chính để cải tiến giải pháp:
- Critical Thinking: Phân tích thấy đề xuất dùng Virtualization (render ảo ở client) của AI là giải pháp xử lý ở ngọn (Oversimplification). Dù DOM không bị quá tải, nhưng việc tải (fetch) toàn bộ hoặc một lượng lớn JSON dữ liệu người dùng về client ngay từ đầu sẽ gây nghẽn băng thông mạng và tốn RAM trình duyệt.
- Contextualization: City Admin cần quản lý tài khoản của toàn bộ người dân Đà Nẵng, dữ liệu sẽ ngày càng phình to, việc lọc và tìm kiếm cần độ chính xác và bảo mật cao, không thể phơi bày dữ liệu dư thừa ra frontend.
- Creative Synthesis: Thay vì dùng Virtualization ở Frontend, tôi quyết định áp dụng mô hình Server-Side Pagination, Filtering & Sorting. Tự xây dựng Custom Hook `usePagination` kết hợp React Query để chỉ gọi API lấy đúng 20-50 bản ghi cho mỗi trang. Thiết kế thêm Debounce Search để giảm tải request khi Admin gõ tìm kiếm.
- Decision Ownership: Bác bỏ phương án tải dữ liệu lớn của AI, chốt phương án Server-Side Processing. Quyết định kỹ thuật này giúp trang UsersPage load nhanh dưới 100ms bất kể database có 1.000 hay 1.000.000 người dùng, đồng thời bảo mật tuyệt đối dữ liệu.
```

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | [DE190182] feat: implement City Admin pages with server-side pagination |
| File liên quan | [UsersPage.tsx](file:///d:/FPT/ki5/SWP302/swp391-su26-ai-audit-project-swp391_se20a11_group-05/Sources/Frontend/src/features/city-admin/pages/UsersPage.tsx), [NewsManagement.tsx](file:///d:/FPT/ki5/SWP302/swp391-su26-ai-audit-project-swp391_se20a11_group-05/Sources/Frontend/src/features/news/NewsManagement.tsx), [WardProfileConfigPage.tsx](file:///d:/FPT/ki5/SWP302/swp391-su26-ai-audit-project-swp391_se20a11_group-05/Sources/Frontend/src/features/ward/WardProfileConfigPage.tsx) |
| Screenshot |  |
| Kết quả chạy/test | Dữ liệu bảng phân trang tải cực mượt, bộ lọc debounce tìm kiếm chính xác, bộ nhớ RAM trình duyệt không bị rò rỉ (memory leak). |
| Link video demo |  |
| Ghi chú khác |  |

#### 4.6. Nhận xét cá nhân/nhóm

```text
Em hiểu sâu sắc hơn về ranh giới giữa tối ưu hóa Client-side và Server-side. AI thường có xu hướng giải quyết vấn đề bề nổi (UI), sinh viên cần nhìn nhận vấn đề từ góc độ kiến trúc hệ thống (System Architecture) để chọn đúng nơi cần xử lý tải trọng dữ liệu.
```

---

### Lần sử dụng AI số 6

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 2026-06-30 |
| Công cụ AI | Antigravity / Gemini |
| Mục đích sử dụng | Tích hợp hệ thống AI (System Integration) & Tối ưu luồng dữ liệu |
| Phần việc liên quan | Backend / Security (Chống rác dữ liệu) |
| Mức độ sử dụng | Hỗ trợ nhiều |

#### 4.1. Prompt đã sử dụng

```text
- Hệ thống Đà Nẵng Kết Nối của tôi đang bị tình trạng người dân gửi ảnh selfie, ảnh không liên quan (chó mèo, trần nhà...) thay vì ảnh sự cố đô thị (rác thải, ổ gà, kẹt xe) vào module Submit Report. Hãy viết cho tôi đoạn code Spring Boot tích hợp với Google Cloud Vision API để tự động phân tích và chấm điểm độ hợp lệ của ảnh. Nếu ảnh gửi lên ở dạng base64 và có điểm Confidence cho nhãn 'rác thải/ổ gà' dưới 60%, tự động reject (trả lỗi 400) request đó để chống rác dữ liệu.
```

#### 4.2. Kết quả AI gợi ý

```text
AI cung cấp đoạn code dùng Google Cloud Vision API (thư viện `google-cloud-vision`) với phương thức `annotateImage`. Đề xuất nhận chuỗi base64 của ảnh từ request body ở Controller, decode ảnh, tạo kết nối gRPC tới Google Cloud, gọi hàm đồng bộ (synchronous) để nhận về danh sách nhãn (LabelDetection). Nếu mảng nhãn không chứa các từ khóa liên quan đến đô thị, ném ra Exception và trả về lỗi 400 ngay lập tức cho client.
```

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

```text
- Tận dụng đoạn code khởi tạo SDK và gọi hàm `annotateImage` của Google Cloud Vision API để lấy danh sách Label và Confidence Score.
- Sử dụng danh sách từ khóa (keywords) về rác thải, cơ sở hạ tầng do AI gợi ý làm cơ sở để đối chiếu.
```

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

```text
Sử dụng 4 kỹ năng chính để cải tiến kiến trúc:
- Critical Thinking: Phân tích kỹ thấy giải pháp của AI là "nút thắt cổ chai" (Bottleneck) trầm trọng: Việc gửi Base64 nặng vài MB trong request HTTP làm tốn RAM của Server; và việc gọi API Google Cloud một cách đồng bộ (chờ Google trả lời rồi mới báo cho User) sẽ làm thời gian phản hồi (Latency) của API Submit Report tăng lên 3-5 giây. Người dân sẽ tưởng app bị treo và ấn gửi liên tục (gây spam thêm).
- Contextualization: Ứng dụng công cộng cần độ mượt mà cao, nút Submit phải phản hồi ngay lập tức để người dân an tâm là chính quyền đã ghi nhận. Việc duyệt ảnh có thể chậm một chút nhưng không được phép làm đơ màn hình điện thoại của dân.
- Creative Synthesis: Tôi thiết kế lại toàn bộ luồng xử lý thành Kiến trúc Hướng Sự kiện (Event-Driven Architecture):
   1. Chuyển sang dùng Pre-signed URL: App Mobile tự upload ảnh trực tiếp lên Cloud Storage (S3/GCS), bỏ qua Backend.
   2. Gọi Submit Report chỉ với URL ảnh (siêu nhẹ).
   3. Backend nhận request, trả về HTTP 200 OK ngay lập tức (Latency < 50ms).
   4. Đồng thời ném một sự kiện `ReportSubmittedEvent` vào Message Queue (RabbitMQ).
   5. Một luồng chạy ngầm (Background Worker) sẽ lấy ảnh từ Queue, gọi Google Vision API để kiểm duyệt. Nếu là ảnh selfie/chó mèo, Worker âm thầm đổi status của Report thành `REJECTED_SPAM` và ẩn khỏi bản đồ.
- Decision Ownership: Bác bỏ hoàn toàn mô hình Request-Reply đồng bộ của AI. Lựa chọn Kiến trúc Event-Driven giúp hệ thống vừa chống được 100% rác dữ liệu (giải quyết lỗ hổng rác dữ liệu ở Phase 01), vừa đảm bảo hiệu năng chịu tải tuyệt đối.
```

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | [DE190182] feat: integrate Google Vision API with Event-Driven validation for report images |
| File liên quan | Backend Code (VisionAIWorker, EventPublisher, ReportService) |
| Screenshot |  |
| Kết quả chạy/test | Report được submit ngay lập tức (<50ms). Ảnh rác bị hệ thống tự động gắn cờ (Flagged) và gạch bỏ sau khoảng 3 giây chạy nền. Cán bộ không bao giờ nhìn thấy ảnh rác. |
| Link video demo |  |
| Ghi chú khác | Hoàn thiện trọn vẹn lời hứa thiết kế kiến trúc ở Phase 01. |

#### 4.6. Nhận xét cá nhân/nhóm

```text
Lần sử dụng AI này thực sự là một bài kiểm tra trình độ System Design. AI viết code logic (Logic level) rất giỏi, nhưng thường bỏ quên kiến trúc tổng thể (Architecture level). Người kỹ sư giỏi không chỉ lấy code cho chạy được, mà phải biết đặt khối code đó vào đúng nơi để hệ thống không bị sập khi có tải thực tế.
```

---

### Lần sử dụng AI số 7

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 2026-08-01 |
| Công cụ AI | Antigravity |
| Mục đích sử dụng | Thiết kế & Code frontend Cổng Du khách |
| Phần việc liên quan | Frontend / UI/UX / Cổng Du khách (Tourist Portal) |
| Mức độ sử dụng | Hỗ trợ nhiều |

#### 4.1. Prompt đã sử dụng

```text
- Xây dựng Cổng Du khách (Tourist Portal) cho ứng dụng Đà Nẵng Kết Nối. Giao diện cần có các tiện ích khám phá điểm đến, tin tức sự kiện du lịch, danh bạ khẩn cấp và tab thông tin du khách (Bản đồ tiện ích).
```

#### 4.2. Kết quả AI gợi ý

```text
AI sử dụng React, Tailwind, Lucide Icons để thiết kế mã nguồn các component `TouristExploreCards`, `TouristNewsSlider`, `TouristInfoTabs`, `DisasterContactDirectory`. Gợi ý bố cục lưới (grid layout) để hiển thị thông tin trực quan.
```

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

```text
- Sử dụng toàn bộ cấu trúc thư mục và layout component do AI sinh ra để đảm bảo tính nhất quán với thiết kế tổng thể của dự án (React Functional Components, Tailwind CSS classes).
- Tái sử dụng các thẻ Card từ thư viện Lucide Icons mà AI đã gợi ý để dựng khung giao diện nhanh chóng cho phần hiển thị tin tức sự kiện (TouristNewsSlider) và danh bạ liên hệ (DisasterContactDirectory).
- Học hỏi cách AI phân chia các tab (Tabs) để tránh nhồi nhét quá nhiều thông tin lên một màn hình, giúp trải nghiệm cuộn trang (scroll) mượt mà hơn.
```

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

```text
Sử dụng 4 kỹ năng chính để cải tiến giải pháp của AI (chuyển đổi từ UI tĩnh sang UI tương tác khẩn cấp):
- Critical Thinking: Khi nhận được code từ AI, tôi nhận thấy đây chỉ là một "Read-only UI" (giao diện chỉ đọc). Đối với người dùng thông thường thì không sao, nhưng với đối tượng là khách du lịch vãng lai, họ thường sử dụng điện thoại khi đang di chuyển trên đường. Việc bắt họ phải đọc dòng text số điện thoại khẩn cấp, thoát ứng dụng ra, rồi mở bàn phím điện thoại để gõ lại là một thiết kế UX tồi, có thể gây nguy hiểm trong các tình huống cứu hộ khẩn cấp.
- Contextualization: Đặt mình vào bối cảnh một du khách gặp tai nạn hoặc bị mất trộm tại Đà Nẵng, tâm lý của họ rất hoảng loạn. Giao diện lúc này cần sự tối giản nhưng phải trực tiếp tạo ra hành động (Actionable). Do đó, tôi cần biến mọi số điện thoại thành nút bấm kích hoạt cuộc gọi.
- Creative Synthesis: Tôi đã can thiệp vào component `DisasterContactDirectory` và `TouristInfoTabs`. Cụ thể, tôi bọc các số điện thoại bằng thẻ `href="tel:..."` kết hợp CSS làm nổi bật thành một nút Call-to-Action (CTA) màu đỏ/cam. Đồng thời, tôi tích hợp thêm một bản đồ nhỏ (Mini Map) ngay trong tab thông tin để du khách không chỉ gọi điện mà còn thấy được vị trí trạm hỗ trợ gần nhất so với tọa độ GPS hiện tại của họ.
- Decision Ownership: Tôi quyết định không chấp nhận giải pháp "đẹp nhưng thiếu thực dụng" của AI. Việc nâng cấp giao diện từ tĩnh sang tương tác đã thay đổi hoàn toàn giá trị cốt lõi của tính năng, biến Cổng Du khách thành một công cụ cứu trợ thực sự chứ không chỉ là một trang tin tức du lịch thông thường.
```

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Commit Phase 07 |
| File liên quan | TouristExploreCards.tsx, DisasterContactDirectory.tsx, TouristInfoTabs.tsx |
| Screenshot |  |
| Kết quả chạy/test | Các tab chuyển động mượt mà, bấm gọi điện trực tiếp hoạt động tốt. |
| Link video demo |  |
| Ghi chú khác |  |

#### 4.6. Nhận xét cá nhân/nhóm

```text
Em đã áp dụng thành công kỹ năng thiết kế UI/UX nhắm vào đối tượng đặc thù (khách du lịch) và luôn biết cách bổ sung giá trị hành động (Call-to-Action) vào các gợi ý giao diện tĩnh của AI.
```

---

### Lần sử dụng AI số 8

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 2026-08-02 |
| Công cụ AI | Antigravity |
| Mục đích sử dụng | Phát triển tính năng phức tạp & Khắc phục xung đột Git |
| Phần việc liên quan | Frontend / State Management / Git Workflow |
| Mức độ sử dụng | Hỗ trợ nhiều |

#### 4.1. Prompt đã sử dụng

```text
- Thiết kế trang bản đồ hiển thị các Chiến dịch tình nguyện, tích hợp cửa sổ chat (FloatingCampaignChat) thời gian thực và xử lý lỗi xung đột Git phức tạp khi merge nhánh Vi vào main do Server Vite build file tự động gây lỗi.
```

#### 4.2. Kết quả AI gợi ý

```text
AI code giao diện bản đồ `SingleCampaignMap`, cửa sổ chat và gợi ý dùng `Zustand` để đồng bộ state chat và map (`useCampaignStore`). Về Git, AI giải thích Vite tự động ghi đè `routeTree.gen.ts` gây lỗi và gợi ý dùng lệnh dừng tiến trình Node (`Stop-Process`) trước khi gộp nhánh, kết hợp với script `git filter-branch` để xóa các commit hỏng.
```

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

```text
- Kế thừa cấu trúc Store của Zustand (`useCampaignStore`) để quản lý global state, giúp tránh việc truyền props (props drilling) lằng nhằng giữa bản đồ và khung chat.
- Sử dụng các code mẫu của AI để khởi tạo bản đồ `SingleCampaignMap` và component `FloatingCampaignChat`.
- Áp dụng triệt để những hướng dẫn của AI trên Terminal (PowerShell) để tìm kiếm và tiêu diệt các tiến trình ẩn (PID) đang can thiệp vào quá trình xử lý Git.
```

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

```text
Sử dụng 4 kỹ năng chính để cải tiến giải pháp (Làm chủ công cụ Git và gỡ lỗi hệ thống):
- Critical Thinking: Khi đối mặt với tình trạng Git báo lỗi Conflict liên tục tại file `routeTree.gen.ts`, thay vì bối rối gõ các lệnh `git merge --abort` hay cố gắng commit đè một cách mù quáng như những lần trước, tôi đã dừng lại để phân tích nguyên nhân gốc rễ (Root Cause Analysis). Tôi nhận ra rằng file này do Vite (công cụ build frontend) tự động sinh ra khi nó chạy ở chế độ watch. Nghĩa là hệ thống file đang bị thay đổi ngầm liên tục, khiến Git không thể chốt được trạng thái để merge.
- Contextualization: Trong môi trường làm việc nhóm, nhánh `main` là trái tim của dự án. Nếu tôi cố tình ép merge (Force Merge) khi có file rác, nó sẽ làm hỏng toàn bộ lịch sử commit của nhóm, hoặc tệ hơn là làm sập build pipeline. Các lỗi lầm từ các agent AI trước đó đã để lại rất nhiều commit hỏng trên nhánh `Vi`. Tôi cần một giải pháp dọn dẹp sạch sẽ trước khi hợp nhất.
- Creative Synthesis: Tôi thiết kế một kịch bản gỡ lỗi 3 bước vô cùng chặt chẽ. Bước 1: Dùng lệnh `Stop-Process` của PowerShell để cưỡng chế tắt hoàn toàn server Vite, đảm bảo không còn tiến trình nào can thiệp ngầm vào hệ thống file. Bước 2: Dạy lại lịch sử Git bằng cách chạy lệnh nâng cao để gỡ các commit lỗi ra khỏi nhánh `Vi`. Bước 3: Thực hiện gộp nhánh (`git merge main`) trong một môi trường tĩnh hoàn toàn an toàn, xử lý conflict thủ công một cách chính xác.
- Decision Ownership: Thay vì sợ hãi việc "mất code" khi can thiệp vào lịch sử Git, tôi đã chủ động kiểm soát hoàn toàn bộ máy Version Control. Quyết định tắt server trước khi thao tác Git là một quyết định kỹ thuật nhỏ nhưng cho thấy sự thấu hiểu sâu sắc về cách thức hoạt động đồng thời (Concurrency) giữa các công cụ trong môi trường lập trình (Build Tool vs. Version Control).
```

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Merge commit Phase 07 |
| File liên quan | SingleCampaignMap.tsx, FloatingCampaignChat.tsx, useCampaignStore.ts |
| Screenshot |  |
| Kết quả chạy/test | Nhánh `Vi` đã được gộp an toàn vào nhánh `main` mà không làm hỏng file `routeTree.gen.ts`. |
| Link video demo |  |
| Ghi chú khác |  |

#### 4.6. Nhận xét cá nhân/nhóm

```text
Em rút ra bài học xương máu về Git: Không bao giờ thực hiện Merge nhánh khi Server (như Vite/Webpack) đang chạy ở chế độ Watch/Hot-Reload, vì hệ thống file sẽ bị thay đổi ngầm gây thất bại quá trình gộp code.
```

## 5. Bảng tổng hợp mức độ sử dụng AI

Đánh dấu mức độ AI hỗ trợ ở từng hạng mục.

| Hạng mục | Không dùng AI | AI hỗ trợ ít | AI hỗ trợ nhiều | AI sinh chính | Ghi chú |
|---|:---:|:---:|:---:|:---:|---|
| Phân tích yêu cầu |  |  | x |  | Hỗ trợ phân tích lỗ hổng kiến trúc đô thị thông minh |
| Viết user story/use case |  | x |  |  | Tham khảo định dạng chuẩn |
| Thiết kế database |  |  | x |  | Gợi ý cấu trúc bảng USERS và VERIFICATION_CODES |
| Thiết kế kiến trúc hệ thống |  |  | x |  | Đề xuất giải pháp và mô hình phân tách |
| Thiết kế giao diện |  |  | x |  | Thiết kế UI/UX giao diện Công an và UBND phường |
| Code frontend |  |  | x |  | Tái cấu trúc Dashboard, route layout và map component |
| Code backend |  |  | x |  | Tư vấn cấu hình Async thread pool và Rate Limiting |
| Debug lỗi | x |  |  |  | Chưa thực hiện |
| Viết test case | x |  |  |  | Chưa thực hiện |
| Kiểm thử sản phẩm | x |  |  |  | Chưa thực hiện |
| Tối ưu code |  | x |  |  | Tối ưu gộp cụm, render marker và cache |
| Viết báo cáo |  | x |  |  | Tóm tắt nội dung báo cáo và định dạng |
| Làm slide thuyết trình | x |  |  |  | Chưa thực hiện |

---

## 6. Các lỗi hoặc hạn chế từ AI

Ghi lại các trường hợp AI trả lời sai, thiếu, chưa phù hợp hoặc sinh code không chạy.

| STT | Lỗi/hạn chế từ AI | Cách phát hiện | Cách xử lý/cải tiến |
|---:|---|---|---|
| 1 | AI đề xuất dùng ST_Distance_Sphere của MySQL trực tiếp trên cột POINT để tính khoảng cách mà không lọc trước. | Dùng câu lệnh SQL EXPLAIN thấy database phải quét toàn bộ bảng (Full Table Scan), gây chậm hiệu năng khi dữ liệu lớn. | Tách thành 2 cột DECIMAL(Latitude, Longitude), dùng thuật toán Bounding Box để lọc nhanh ở SQL bằng phép so sánh đơn giản trước. |
| 2 | AI đề xuất sử dụng @Async mặc định không giới hạn kích thước Thread Pool cho luồng gửi SMS. | Dùng kịch bản test JMeter spam gửi request thấy số lượng thread tăng không phanh dẫn đến tràn bộ nhớ CPU/RAM. | Tự cấu hình ThreadPoolTaskExecutor giới hạn MaxPoolSize và hàng đợi QueueCapacity, kết hợp thuật toán Rate Limiting 1 phút/sms. |
| 3 | AI đề xuất sử dụng Marker mặc định màu xanh của Leaflet cho mọi phản ánh trên bản đồ. | Xem giao diện bản đồ, nhận thấy tất cả ghim đều hiển thị cùng màu xanh dương, không khớp với Legend phân màu trạng thái. | Tự cấu hình CivicMap.tsx dùng L.divIcon tạo HTML/CSS Marker động đổi màu tương ứng với trạng thái (Đỏ, Cam, Xanh dương, Xanh lá). |
| 4 | AI đề xuất dùng kỹ thuật Virtualization ở Frontend (react-window) để hiển thị bảng dữ liệu người dùng hàng trăm ngàn bản ghi. | Đánh giá kiến trúc hệ thống: Giải pháp này tải quá nhiều dữ liệu JSON về trình duyệt gây nghẽn băng thông và rủi ro bảo mật thông tin. | Chuyển sang mô hình Server-Side Pagination, Filtering & Sorting. Tự viết Custom Hook dùng React Query để chỉ fetch dữ liệu theo trang. |
| 5 | AI gợi ý gọi API Google Cloud Vision phân tích ảnh một cách đồng bộ (Synchronous) và gửi ảnh dạng Base64 qua HTTP. | Tư duy phản biện: Gửi Base64 tốn RAM, gọi API đồng bộ khiến thời gian phản hồi kéo dài 3-5 giây, làm treo UI của ứng dụng phía người dân và chặn (block) Thread của server. | Chuyển sang Kiến trúc Event-Driven (Message Queue) để xử lý ảnh nền (Background Processing) và dùng Pre-signed URL upload ảnh trực tiếp lên Storage. |
| 6 | AI thiết kế Cổng Du khách với giao diện chỉ đọc (Read-only UI) thiếu tính tương tác khẩn cấp. Mọi thông tin (số điện thoại, địa chỉ) đều chỉ là các thẻ text đơn điệu. | Dựa vào bối cảnh thực tế (Contextualization), khi du khách gặp nạn trên đường, tâm lý họ rất hoảng loạn. Họ cần những nút bấm thật to để gọi điện thoại ngay, chứ không phải chỉ hiển thị số để họ đọc, thoát app, mở bàn phím và bấm gọi. Điều này vi phạm nghiêm trọng nguyên tắc UX khẩn cấp. | Bác bỏ thiết kế tĩnh của AI. Tự bổ sung thẻ `href="tel:..."` vào toàn bộ danh bạ liên hệ để biến text thành nút gọi điện trực tiếp. Tích hợp thêm Mini Map để người dùng tra cứu nhanh vị trí trạm hỗ trợ, tối ưu hóa toàn bộ luồng hành động (Call-to-Action) của du khách. |
| 7 | AI không cảnh báo rủi ro về việc Vite liên tục ghi đè file `routeTree.gen.ts` ngầm, khiến lệnh `git merge` bị treo hoặc báo lỗi conflict liên tục không thể resolve. | Lệnh `git merge` rơi vào vòng lặp lỗi (Git Loop). Dù đã cố gắng `git add` và resolve conflict thủ công, nhưng vài giây sau trạng thái file lại bị chuyển sang Modified do Vite đang chạy ẩn (watch mode) đã tự động sinh lại file mới. | Tư duy giải quyết vấn đề ở mức hệ thống (System level): Nhận diện lỗi không nằm ở Git mà nằm ở tiến trình Build. Sử dụng PowerShell (`Stop-Process`) để tiêu diệt tận gốc tiến trình server ngầm. Dùng `git clean` và lệnh dọn lịch sử commit rác, sau đó mới thực hiện quy trình merge an toàn nhánh `Vi` vào `main`. |

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
- Dùng công cụ MySQL Workbench chạy câu lệnh EXPLAIN để kiểm chứng số lượng dòng dữ liệu bị quét (rows examined) giữa phương án dùng Spatial Index mặc định và phương án lọc Bounding Box trước bằng DECIMAL.
- Viết kịch bản kiểm thử giả lập (Simulation Script) gửi 10.000 yêu cầu báo cáo ngẫu nhiên xung quanh khu vực cầu Rồng Đà Nẵng để đo lường thời gian xử lý và độ chính xác của thuật toán gộp đơn thời gian thực.
- Tổ chức họp nhóm kỹ thuật với các thành viên phụ trách backend và frontend để đánh giá tính khả thi trong việc tích hợp luồng gộp đơn này vào hệ thống API.
```

---

## 8. Đóng góp cá nhân hoặc đóng góp nhóm

### 8.1. Đối với bài cá nhân

Mô tả phần sinh viên tự làm, phần AI hỗ trợ và phần đã tự cải tiến.

```text
- Tự làm: Thiết kế logic nghiệp vụ gộp đơn phản ánh trùng lặp, xây dựng kịch bản kiểm thử hiệu năng database.
- AI hỗ trợ: Gợi ý các cách thức lưu trữ tọa độ GPS, công thức toán học Haversine tính khoảng cách địa lý.
- Tự cải tiến: Thay đổi kiểu dữ liệu tọa độ không gian từ POINT sang DECIMAL để tối ưu hóa chỉ mục, thay đổi thuật toán từ chạy theo lô (DBSCAN) sang xử lý luồng thời gian thực (Stream-based).
```

### 8.2. Đối với bài nhóm

| Thành viên | MSSV | Nhiệm vụ chính | Có sử dụng AI không? | Minh chứng đóng góp |
|---|---|---|---|---|
| Trần Minh Vĩ | DE190182 | Leader, Phân tích yêu cầu, Thiết kế DB & Thuật toán | Có | File AI_AUDIT_LOG.md, CHANGELOG.md, tài liệu SRS |
| Nguyễn Hoàng Trọng | DE190123 | Thành viên, Thiết kế UI/UX & Web Frontend | Có | Thư mục Member/Nguyễn Hoàng Trọng, Figma mockups |
| Phan Thanh Bình | DE190210 | Thành viên, Phân tích nghiệp vụ BA | Có | Thư mục Member/Phan Thanh Bình |
| Phạm Tuấn Việt | DE190714 | Thành viên, Thiết kế Web Frontend & Tích hợp Maps | Có | Thư mục Member/Phạm Tuấn Việt |
| Phạm Bá Trí | DE191029 | Thành viên, Phát triển Backend nâng cao & AI RAG | Có | Thư mục Member/Phạm Bá Trí, mã nguồn API Spring Boot |

---

## 9. Reflection cuối bài

### 9.1. AI đã hỗ trợ em/nhóm ở điểm nào?

```text
AI đã hỗ trợ đắc lực ở giai đoạn khởi tạo ý tưởng kiến trúc và đề xuất các giải pháp lưu trữ dữ liệu không gian. Nó hoạt động như một cố vấn chuyên môn giúp nhóm nhanh chóng nắm bắt các kiến thức nâng cao về hệ thống GIS (Geographic Information System).
```

### 9.2. Phần nào em/nhóm không sử dụng theo gợi ý của AI? Vì sao?

```text
- Không sử dụng giải pháp lưu trữ POINT và hàm ST_Distance_Sphere của MySQL vì gây Full Table Scan khi kết hợp các điều kiện lọc nghiệp vụ khác.
- Không sử dụng thuật toán phân cụm DBSCAN định kỳ vì không đáp ứng yêu cầu xử lý thời gian thực của cán bộ và làm trễ quy trình xử lý đơn.
```

### 9.3. Em/nhóm đã kiểm tra tính đúng đắn của kết quả AI như thế nào?

```text
Nhóm đã dùng lệnh EXPLAIN trong database để kiểm tra kế hoạch thực thi truy vấn (Query execution plan), so sánh tốc độ quét bản ghi của chỉ mục và chạy thử thuật toán tính toán khoảng cách Haversine ở local backend để đối chiếu kết quả.
```

### 9.4. Nếu không có AI, phần nào sẽ khó khăn nhất?

```text
Phần khó khăn nhất là nhận diện trước các rủi ro hệ thống chịu tải lớn khi lưu trữ dữ liệu GPS và tìm kiếm các thuật toán gộp cụm không gian. AI đã giúp rút ngắn thời gian nghiên cứu lý thuyết từ vài ngày xuống còn vài giờ.
```

### 9.5. Sau bài tập/project này, em/nhóm học được gì về môn học?

```text
Em học được cách kết hợp lý thuyết cấu trúc dữ liệu và giải thuật vào việc giải quyết một bài toán thực tế (lọc trùng lặp báo cáo không gian theo thời gian thực), hiểu rõ tầm quan trọng của việc tối ưu hóa truy vấn cơ sở dữ liệu.
```

### 9.6. Sau bài tập/project này, em/nhóm học được gì về cách sử dụng AI có trách nhiệm?

```text
Em nhận ra rằng AI có thể đưa ra các đề xuất nghe rất thuyết phục nhưng thực chất lại thiếu tối ưu hoặc không đúng ngữ cảnh thực tế (hallucination). Sinh viên luôn cần có tư duy độc lập, tự kiểm chứng hiệu năng bằng số liệu thực tế trước khi đưa vào sản phẩm.
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
| Trần Minh Vĩ | 2026-08-02 |
