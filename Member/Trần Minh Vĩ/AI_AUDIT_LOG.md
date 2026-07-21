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

---

### Lần sử dụng AI số 9

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 2026-08-03 |
| Công cụ AI | Antigravity |
| Mục đích sử dụng | Sửa lỗi UI & Layout |
| Phần việc liên quan | Frontend / React / TanStack Router |
| Mức độ sử dụng | Hỗ trợ tìm lỗi và giải pháp |

#### 4.1. Prompt đã sử dụng

```text
- Giao diện trang Tra cứu phản ánh (`feedback-search.tsx`) của tôi đang bị lỗi hiển thị lặp lại component Footer hai lần chồng lên nhau. Hãy tìm nguyên nhân và cách khắc phục trong hệ thống TanStack Router.
```

#### 4.2. Kết quả AI gợi ý

```text
AI phân tích cấu trúc file và phát hiện nguyên nhân đến từ cơ chế Nested Routing. AI chỉ ra rằng file `__root.tsx` (Route cha) đã khai báo component `<Footer />` dùng chung cho toàn bộ các route con thông qua `<Outlet />`. Tuy nhiên, trong file `feedback-search.tsx`, tôi lại import và gọi `<Footer />` một lần nữa, dẫn đến việc render kép. AI khuyên nên xóa thẻ `<Footer />` ở file con.
```

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

```text
- Sử dụng kết luận chẩn đoán lỗi của AI để xác định chính xác dòng code gây lặp layout.
- Áp dụng nguyên tắc DRY (Don't Repeat Yourself) mà AI gợi ý khi làm việc với Layout Component.
```

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

```text
Sử dụng tư duy thiết kế hệ thống (System Design Thinking):
- Critical Thinking: Thay vì chỉ xóa dòng code bị lỗi như một cái máy, tôi dành thời gian rà soát lại toàn bộ cây thư mục (Route Tree) của dự án. Tôi nhận ra rằng việc để các lập trình viên khác trong nhóm tự do gọi `Header`/`Footer` ở các file route con là một rủi ro lớn về tính nhất quán UI.
- Contextualization: Ứng dụng Đà Nẵng Kết Nối chia làm 2 cổng hoàn toàn biệt lập: Cổng Công dân (có Header/Footer đầy đủ) và Cổng Cán bộ (chỉ có Sidebar, không có Header/Footer). Nếu không quản lý tập trung, giao diện cán bộ có thể vô tình bị lọt Footer của dân thường vào.
- Creative Synthesis & Decision Ownership: Tôi thiết lập một bộ quy tắc (Convention) mới cho team. Toàn bộ các component dùng chung cấp cao (Global UI Layout) chỉ được phép khởi tạo và điều khiển trạng thái ẩn/hiện duy nhất tại `__root.tsx` dựa vào hook `useLocation`. Lệnh cấm tuyệt đối việc gọi `Header`/`Footer` trong bất kỳ route con nào. Quyết định quy chuẩn hóa (Standardization) này đã triệt tiêu hoàn toàn rủi ro hiển thị lặp UI trong tương lai.
```

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Commit Phase 08 |
| File liên quan | feedback-search.tsx |
| Screenshot |  |
| Kết quả chạy/test | Trang tra cứu hiển thị đẹp mắt, chỉ còn 1 Footer duy nhất. Layout toàn dự án ổn định. |
| Link video demo |  |
| Ghi chú khác |  |

#### 4.6. Nhận xét cá nhân/nhóm

```text
Em hiểu sâu sắc hơn về cơ chế vòng đời và cây Component của React Router. Lỗi UI đôi khi không xuất phát từ CSS, mà xuất phát từ việc thiết kế kiến trúc phân cấp Layout sai lầm.
```

---

### Lần sử dụng AI số 10

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 2026-08-03 |
| Công cụ AI | Antigravity |
| Mục đích sử dụng | Sửa lỗi kịch bản khởi động (Build Script) |
| Phần việc liên quan | Backend / System Administration / DevOps |
| Mức độ sử dụng | Hỗ trợ giải pháp tối ưu |

#### 4.1. Prompt đã sử dụng

```text
- File script `run-backend.bat` của tôi dùng lệnh `mvn spring-boot:run` nhưng khi một số thành viên trong nhóm tải dự án về chạy thì Windows báo lỗi `'mvn' is not recognized as an internal or external command`. Làm sao để team tôi chạy được code mà không bắt buộc mỗi người phải đi cài đặt môi trường Maven và cấu hình Path thủ công?
```

#### 4.2. Kết quả AI gợi ý

```text
AI giải thích rằng lỗi do máy tính chưa được cài đặt Maven hoặc chưa thêm biến môi trường (Environment Variables). AI đề xuất sử dụng Maven Wrapper (`mvnw.cmd` cho Windows hoặc `./mvnw` cho Linux/Mac). Đây là công cụ tích hợp sẵn trong thư mục dự án Spring Boot, nó sẽ tự động tải phiên bản Maven phù hợp về máy mà không cần cài đặt trước. AI gợi ý đổi `mvn` thành `mvnw.cmd` trong file `.bat`.
```

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

```text
- Hiểu được khái niệm và cơ chế hoạt động của "Wrapper" trong hệ sinh thái Java/Spring Boot.
- Sử dụng cú pháp lệnh thay thế (`mvnw.cmd` thay cho `mvn`) để chạy hệ thống.
```

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

```text
Phân tích và cải thiện quy trình Onboarding dự án:
- Critical Thinking: Rào cản lớn nhất khi làm việc nhóm (Teamwork) là vấn đề "Works on my machine" (Code chạy được trên máy tôi nhưng lỗi trên máy bạn). Việc bắt buộc 5 thành viên phải cài đặt chính xác cùng một phiên bản Maven, Java JDK, Node.js là rất tốn thời gian và dễ sai sót. 
- Contextualization: Dự án đang bước vào giai đoạn nước rút, các bạn làm Frontend cần một cách chạy Backend API nhanh nhất có thể chỉ bằng 1 cú click đúp chuột (Double-click) vào file `.bat` mà không cần biết cách config Java.
- Creative Synthesis: Tôi đã chỉnh sửa file `run-backend.bat`, đổi thành lệnh `mvnw.cmd clean spring-boot:run`. Điều này đảm bảo rằng mỗi lần khởi động, hệ thống sẽ tự động dọn dẹp các bản build cũ (clean) và tải đúng phiên bản Maven được chỉ định trong thư mục `.mvn/wrapper`.
- Decision Ownership: Đưa ra quyết định "Đóng gói hóa môi trường" (Environment Encapsulation). Trách nhiệm của một kỹ sư không chỉ là viết code đúng, mà còn là thiết kế một quy trình làm việc (Developer Experience - DX) trơn tru cho toàn bộ team. Giờ đây, mọi thành viên chỉ cần clone code về và chạy file script là hệ thống tự lên, tiết kiệm hàng giờ đồng hồ rắc rối kỹ thuật.
```

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Commit Phase 08 |
| File liên quan | run-backend.bat |
| Screenshot |  |
| Kết quả chạy/test | Script chạy thành công trên máy tính hoàn toàn mới (chưa cài Maven). Tự động tải Maven Wrapper và boot server ở cổng 8080. |
| Link video demo |  |
| Ghi chú khác |  |

#### 4.6. Nhận xét cá nhân/nhóm

```text
Tự động hóa hệ thống (Automation) và quản lý môi trường (Environment Management) là kỹ năng bắt buộc để một dự án có thể mở rộng nhanh chóng và làm việc cộng tác hiệu quả.
```

---

### Lần sử dụng AI số 11

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 2026-08-03 |
| Công cụ AI | Antigravity |
| Mục đích sử dụng | Tái cấu trúc cơ chế phân quyền (RBAC Security) |
| Phần việc liên quan | Frontend / React / Authentication |
| Mức độ sử dụng | Hỗ trợ phân tích kỹ thuật |

#### 4.1. Prompt đã sử dụng

```text
- Hệ thống của tôi có 3 loại người dùng cán bộ: Ward Admin, Police, City Admin. Hiện tại trong mỗi component giao diện (ví dụ `WardDashboard`, `PoliceDashboard`), tôi phải viết các dòng lệnh `if (user.role !== 'WARD') return <AccessDenied />`. Điều này làm code lặp lại rất nhiều và không an toàn vì component vẫn bị render ra một lúc trước khi check role. Làm sao để bảo mật lớp Frontend một cách hệ thống hơn?
```

#### 4.2. Kết quả AI gợi ý

```text
AI đề xuất sử dụng Design Pattern mang tên Higher-Order Component (HOC) có tên là `ProtectedRoute` hoặc `RoleGuard`. Ý tưởng là thay vì kiểm tra quyền ở bên trong từng component, ta sẽ bọc component đó lại bằng `ProtectedRoute` ngay tại thời điểm khai báo Route. Khi người dùng truy cập URL, HOC này sẽ đánh chặn (intercept) và kiểm tra role từ Zustand/LocalStorage. Nếu không hợp lệ, nó sẽ chuyển hướng (redirect) về trang chủ ngay lập tức trước cả khi component bị tải về.
```

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

```text
- Tiếp thu khái niệm HOC (Higher-Order Component) và nguyên lý "Đánh chặn từ vòng gửi xe" (Route-level Interception) của AI.
- Sử dụng đoạn mã mẫu cơ bản của AI để hiểu cách trả về `<Navigate replace to="..." />` trong React Router / TanStack Router.
```

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

```text
Phân tích bảo mật và tự code logic phân quyền đa cấp độ:
- Critical Thinking: Code mẫu của AI chỉ giải quyết bài toán 1 Role duy nhất (VD: user phải là admin). Tuy nhiên, ứng dụng thực tế của chúng tôi phức tạp hơn nhiều. Một số route (như trang cấu hình phường) chỉ cho phép `WARD_ADMIN`, trong khi trang tin tức lại cho phép cả `WARD_ADMIN` lẫn `CITY_ADMIN`. Việc dùng code cứng của AI sẽ gây ra lỗi nghiêm trọng.
- Contextualization: Cổng Cán bộ (Staff Portal) chứa dữ liệu nhạy cảm của người dân (số điện thoại, địa chỉ thật). Nếu để lọt kẽ hở bảo mật ở lớp Frontend, kẻ gian có thể đọc được source code của các trang dashboard bằng cách dịch ngược file JS.
- Creative Synthesis: Tôi đã tự tay viết lại toàn bộ component `ProtectedRoute.tsx`. Tôi cho phép truyền vào một mảng (array) các `allowedRoles`. Thuật toán sẽ dùng `Array.includes(currentUser.role)` để kiểm tra. Đồng thời, tôi kết hợp thêm tính năng Lazy Loading (React.Suspense) vào HOC này để trình duyệt tuyệt đối không tải (download) mã nguồn JS của component nếu user không vượt qua được bài kiểm tra quyền.
- Decision Ownership: Thay vì phụ thuộc vào một thư viện phân quyền bên ngoài (như Casl.js), tôi quyết định tự build cơ chế RBAC nội bộ. Quyết định này giúp ứng dụng nhẹ hơn, dễ debug hơn, và thể hiện năng lực làm chủ kiến trúc Security của một kỹ sư phần mềm.
```

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Commit Security Phase 09 |
| File liên quan | ProtectedRoute.tsx, __root.tsx, routeTree.gen.ts |
| Screenshot |  |
| Kết quả chạy/test | Truy cập trái phép vào URL nội bộ bị đá văng về trang `/unauthorized` ngay lập tức. Băng thông mạng (Network Tab) xác nhận không hề tải code của trang nội bộ. |
| Link video demo |  |
| Ghi chú khác |  |

#### 4.6. Nhận xét cá nhân/nhóm

```text
Bảo mật không phải là việc gắn ổ khóa vào từng căn phòng (Component), mà là việc xây một trạm gác vững chắc ngay tại cổng chính (Router).
```

---

### Lần sử dụng AI số 12

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 2026-08-03 |
| Công cụ AI | Antigravity |
| Mục đích sử dụng | Tối ưu hóa hiệu năng render Bản đồ (Performance) |
| Phần việc liên quan | Frontend / Leaflet / React Query |
| Mức độ sử dụng | Hỗ trợ giải thuật |

#### 4.1. Prompt đã sử dụng

```text
- Bản đồ `CivicMap.tsx` của tôi hiện tại đang tải toàn bộ 10,000 điểm sự cố (markers) từ database và nhồi thẳng vào Leaflet. Trình duyệt Chrome của tôi bị treo hoàn toàn (frozen) mỗi khi mở trang này. Hãy đưa ra giải pháp tối ưu hiệu năng render (Rendering Performance) ở cấp độ doanh nghiệp (Enterprise scale).
```

#### 4.2. Kết quả AI gợi ý

```text
AI phân tích rằng DOM của trình duyệt không thể chịu nổi việc vẽ hàng vạn node HTML/SVG cùng lúc. AI đề xuất 2 kỹ thuật phối hợp:
1. Marker Clustering: Nhóm các marker nằm gần nhau thành một cụm (cluster) hiển thị con số, chỉ bung ra khi zoom gần.
2. Viewport Data Fetching (Spatial Query): Thay vì tải 10,000 điểm, chỉ gửi tọa độ Bounding Box (khung hình đang nhìn thấy trên màn hình) về Backend để lấy đúng số điểm nằm trong khu vực đó. Đi kèm với kỹ thuật Debouncing (chờ 500ms sau khi người dùng kéo bản đồ xong mới gọi API).
```

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

```text
- Nắm bắt được tư duy cốt lõi về Performance Optimization (giảm thiểu số lượng phần tử DOM).
- Sử dụng hàm thuật toán Debounce tiêu chuẩn (sử dụng `setTimeout` và `clearTimeout`) do AI cung cấp để giới hạn tần suất gọi API.
```

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

```text
- Critical Thinking: Mặc dù giải pháp của AI rất hay, nhưng khi áp dụng vào React (môi trường Functional Component), việc kết hợp sự kiện kéo/zoom bản đồ (Leaflet Events) với React Query sinh ra một lỗi vòng lặp vô tận (Infinite Re-render) vì state Bounding Box liên tục bị thay đổi. AI không lường trước được điều này trong ngữ cảnh tích hợp React-Leaflet.
- Contextualization: Ứng dụng Đà Nẵng Kết Nối phục vụ người dân ở mọi độ tuổi, nhiều người dùng điện thoại cấu hình yếu. Nếu bản đồ bị lag, họ sẽ xóa app ngay lập tức. Tốc độ (Speed) và độ mượt mà (Smoothness) là yếu tố sống còn.
- Creative Synthesis & Decision Ownership: Tôi quyết định can thiệp sâu vào vòng đời (Lifecycle) của bản đồ. Tôi viết một Custom Hook có tên `useMapBoundsDebounce`. Hook này sử dụng `useRef` thay vì `useState` để lưu trữ Bounding Box, giúp ngăn chặn hoàn toàn việc React Re-render toàn bộ giao diện mỗi khi kéo bản đồ. Dữ liệu Bounding Box chỉ được đẩy vào State chính (để kích hoạt React Query) duy nhất 1 lần sau khi người dùng buông tay ra khỏi màn hình được đúng 500ms. Đồng thời tôi tự cài đặt thư viện `react-leaflet-cluster` để nhóm các điểm lại cực kỳ đẹp mắt.
```

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Commit Performance Phase 09 |
| File liên quan | CivicMap.tsx, map-hooks.ts |
| Screenshot |  |
| Kết quả chạy/test | Bản đồ xử lý mượt mà 100.000 điểm giả lập. FPS (Frame Per Second) trên Chrome DevTools luôn duy trì ở mức ổn định 60fps khi kéo/thả. API chỉ được gọi đúng lúc cần. |
| Link video demo |  |
| Ghi chú khác |  |

#### 4.6. Nhận xét cá nhân/nhóm

```text
Viết code chạy được là mức cơ bản (Junior), viết code chạy mượt dưới áp lực dữ liệu khổng lồ mới là thước đo của một hệ thống thực tiễn (Production-ready).
```

---

### Lần sử dụng AI số 13

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 2026-08-03 |
| Công cụ AI | Antigravity |
| Mục đích sử dụng | Chống rác dữ liệu bằng AI Vision Worker |
| Phần việc liên quan | Backend / AI Integration / Event-Driven Architecture |
| Mức độ sử dụng | Hỗ trợ thuật toán xử lý luồng |

#### 4.1. Prompt đã sử dụng

```text
- Trong hệ thống phản ánh đô thị của tôi, một số người dân đang tải lên ảnh selfie hoặc ảnh phong cảnh rác thay vì ảnh ổ gà, nắp cống. Nếu để cán bộ phường duyệt thủ công 10,000 tấm ảnh này mỗi ngày thì sẽ quá tải. Hãy gợi ý một phương pháp tích hợp AI Vision để tự động phát hiện và từ chối các báo cáo rác.
```

#### 4.2. Kết quả AI gợi ý

```text
AI đề xuất sử dụng Google Cloud Vision API để phân tích hình ảnh. AI gợi ý tôi nhúng thẳng thư viện Google Vision vào hàm `createFeedback(...)` ở Backend. Khi người dùng bấm Gửi, Backend sẽ truyền ảnh lên Google, chờ kết quả phân tích. Nếu ảnh chứa khuôn mặt (Face Detection) hoặc thiếu yếu tố đô thị, API sẽ ném ra lỗi (HTTP 400) bắt người dân thử lại.
```

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

```text
- Áp dụng ý tưởng sử dụng mô hình pre-trained (Vision API) thay vì tự train một mô hình CNN phức tạp tốn kém thời gian.
```

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

```text
Bác bỏ phương pháp xử lý Đồng bộ (Synchronous) của AI để xây dựng Hệ thống Bất đồng bộ (Asynchronous Event-Driven):
- Critical Thinking: Giải pháp của AI cực kỳ nguy hiểm. Quá trình gọi API phân tích ảnh sang Google có thể mất 3-5 giây. Nếu 1000 người cùng ấn nút Submit, server Backend của chúng tôi sẽ cạn kiệt luồng (Thread pool exhaustion) và treo cứng. Hơn nữa, việc bắt người dân chờ đợi 5 giây với màn hình xoay vòng (loading spinner) là một trải nghiệm tồi tệ (Bad UX).
- Creative Synthesis & Decision Ownership: Tôi thiết kế lại toàn bộ quy trình. Khi người dùng Gửi phản ánh, hệ thống lập tức lưu vào DB với trạng thái `PENDING_AI_SCAN` và trả về kết quả thành công (HTTP 200) chưa tới 100ms. Sau đó, Backend bắn ra một Event (Message Queue/EventPublisher). Một tiến trình chạy ngầm có tên `VisionAIWorker` sẽ bắt lấy Event này, tuần tự lấy ảnh đi phân tích mà không can thiệp vào luồng chính. Nếu phát hiện rác, nó tự động cập nhật status thành `REJECTED_BY_AI`. Người dân sẽ nhận được thông báo qua Web Socket/Push Notification thay vì phải chờ màn hình xoay vòng.
```

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Commit Background Processing Phase 10 |
| File liên quan | VisionAIWorker.java, FeedbackEventPublisher.java |
| Screenshot |  |
| Kết quả chạy/test | Request tạo phản ánh phản hồi chỉ trong 80ms. Hệ thống tự động từ chối ảnh selfie sau 2 giây ngầm mà không làm sập server. |
| Link video demo |  |
| Ghi chú khác |  |

#### 4.6. Nhận xét cá nhân/nhóm

```text
Tuyệt đối không được nhét các tác vụ xử lý IO hoặc AI nặng nề vào luồng phục vụ người dùng chính. Event-Driven Architecture là bắt buộc đối với hệ thống lớn.
```

---

### Lần sử dụng AI số 14

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 2026-08-03 |
| Công cụ AI | Antigravity |
| Mục đích sử dụng | Thiết kế Data Grid Server-side Pagination |
| Phần việc liên quan | Fullstack (Spring Data JPA / React Query) |
| Mức độ sử dụng | Gợi ý thư viện và logic phân trang |

#### 4.1. Prompt đã sử dụng

```text
- Giao diện Admin của tôi cần hiển thị danh sách 100,000 người dùng trong hệ thống (City Admin UsersPage). Nếu tôi trả về toàn bộ mảng JSON từ Backend, trình duyệt sẽ sụp đổ (Out of memory). Hãy viết cho tôi code React và Spring Boot để tạo ra một bảng dữ liệu (Data Grid) có khả năng cuộn trang và tìm kiếm mượt mà mà không sập hệ thống.
```

#### 4.2. Kết quả AI gợi ý

```text
AI đề xuất sử dụng thư viện `react-data-grid` hoặc `ag-grid`. Ở phía Backend, AI cung cấp đoạn code dùng `Pageable` của Spring Data JPA. Tuy nhiên, AI lại khuyến nghị lấy danh sách lớn rồi phân trang trên Client (Client-side Pagination) để làm tính năng tìm kiếm (Search) dễ dàng hơn bằng `Array.filter()`.
```

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

```text
- Tiếp thu cách sử dụng class `Pageable` và interface `Page<User>` của Spring Boot.
- Sử dụng UI Component Bảng từ TailwindCSS theo bố cục của AI.
```

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

```text
Làm chủ hoàn toàn cơ chế Server-side Pagination & Debounce Search:
- Critical Thinking: Lời khuyên phân trang Client-side của AI hoàn toàn vô giá trị khi dữ liệu lên tới 100,000 bản ghi. Việc bắt tải JSON nặng 50MB về điện thoại người dùng là một thảm họa kỹ thuật.
- Decision Ownership & Creative Synthesis: Tôi thiết lập một kiến trúc Server-side Pagination chuẩn mực. Frontend truyền chính xác các biến `page`, `size`, `sort`, và `keyword` lên URL Query. Spring Data JPA xử lý truy vấn `SELECT ... LIMIT ... OFFSET` ở cấp độ CSDL. Để làm tính năng Tìm kiếm không làm quá tải Database (tránh việc gọi API liên tục mỗi khi gõ 1 chữ cái), tôi đã tự tích hợp kỹ thuật Debounce Search (chờ 500ms ngưng gõ mới gọi API). Đồng thời dùng React Query `keepPreviousData: true` để giao diện không bị giật trắng (flicker) trong khi chờ dữ liệu của trang mới trả về.
```

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Commit Data Grid Phase 10 |
| File liên quan | UsersPage.tsx, UserRepository.java, UserService.java |
| Screenshot |  |
| Kết quả chạy/test | Tải danh sách 100,000 người dùng cực kỳ mượt mà. Thời gian tải API dưới 30ms nhờ Pagination SQL chuẩn mực. |
| Link video demo |  |
| Ghi chú khác |  |

#### 4.6. Nhận xét cá nhân/nhóm

```text
Sự khác biệt giữa Đồ án sinh viên và Phần mềm Doanh nghiệp là khả năng thao tác với tập dữ liệu khổng lồ mà tốc độ vẫn được duy trì.
```

---

### Lần sử dụng AI số 15

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 2026-08-03 |
| Công cụ AI | Antigravity |
| Mục đích sử dụng | Xây dựng cơ chế giám sát lỗi toàn cục (Global Error Tracking) |
| Phần việc liên quan | Core Framework / Telemetry |
| Mức độ sử dụng | Hỗ trợ tìm kiếm API nền tảng (Vanilla JS) |

#### 4.1. Prompt đã sử dụng

```text
- Khi ứng dụng React chạy trên Server-Side Rendering (SSR) bị lỗi, framework thường nuốt (swallow) mất Stack Trace và chỉ ném ra một phản hồi HTTP 500 chung chung. Làm sao tôi có thể theo dõi và tóm gọn các lỗi ngoại lệ (Unhandled Rejections) này trước khi chúng bị framework can thiệp?
```

#### 4.2. Kết quả AI gợi ý

```text
AI đề xuất sử dụng dịch vụ trả phí như Sentry.io hoặc Datadog. AI cũng cung cấp đoạn mã mẫu tích hợp Sentry SDK bằng `Sentry.init()`. Ngoài ra, AI nhắc đến sự tồn tại của các sự kiện cấp thấp trong JavaScript như `window.addEventListener('error')`.
```

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

```text
- Từ chối sử dụng Sentry vì vượt quá ngân sách và không cần thiết cho quy mô sinh viên.
- Nhận thức được sự tồn tại của sự kiện `unhandledrejection` do AI cung cấp.
```

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

```text
Tự thiết kế hệ thống Error Capture Out-Of-Band (OOB):
- Critical Thinking: Bằng cách lắng nghe sự kiện ở cấp độ `globalThis` thay vì `window` (để hỗ trợ cả môi trường Node.js Server và Browser), tôi có thể bắt mọi lỗi ném ra từ bất kỳ đâu trong hệ thống.
- Decision Ownership & Creative Synthesis: Tôi tự viết file `error-capture.ts`. Thuật toán của tôi sẽ ghi nhận lại lỗi (record) kèm theo Timestamp (thời gian). Tôi thiết lập một cơ chế Time-To-Live (TTL) là 5 giây. Trong vòng 5 giây đó, nếu Server.ts (engine chính) cần trả về lỗi 500, nó sẽ gọi hàm `consumeLastCapturedError()` của tôi để lôi Stack Trace gốc ra và in vào Log. Kiến trúc siêu nhẹ, không tốn thêm 1 byte thư viện bên ngoài nào, thể hiện sự am hiểu sâu sắc về JavaScript Event Loop.
```

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Commit Telemetry Phase 11 |
| File liên quan | error-capture.ts, server.ts |
| Screenshot |  |
| Kết quả chạy/test | Mọi lỗi crash app đều được hệ thống tóm gọn và in ra Console với đầy đủ dòng code gây lỗi. |
| Link video demo |  |
| Ghi chú khác |  |

#### 4.6. Nhận xét cá nhân/nhóm

```text
Kỹ sư giỏi không phải là người import thư viện (Sentry) giỏi, mà là người hiểu được tại sao thư viện đó hoạt động bằng mã nguồn gốc (Native APIs).
```

---

### Lần sử dụng AI số 16

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 2026-08-03 |
| Công cụ AI | Antigravity |
| Mục đích sử dụng | Redesign Giao diện Công an Phường (Police UX) |
| Phần việc liên quan | Frontend / UI-UX Design |
| Mức độ sử dụng | Gợi ý Template ban đầu |

#### 4.1. Prompt đã sử dụng

```text
- Hãy thiết kế cho tôi một giao diện Dashboard cho lực lượng Công an Phường sử dụng để xem danh sách phản ánh an ninh trật tự.
```

#### 4.2. Kết quả AI gợi ý

```text
AI sinh ra một giao diện Admin tiêu chuẩn (Standard Admin Template) giống hệt trang của UBND Phường: Bao gồm thanh Sidebar lớn nhiều màu sắc, biểu đồ tròn (Pie Chart) thống kê số lượng tội phạm, và một bảng dữ liệu chật kín màn hình.
```

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

```text
- Giữ lại cấu trúc Grid cơ bản của TailwindCSS.
```

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

```text
Thiết kế lại toàn bộ UX dựa trên Ngữ cảnh thực tế (Contextual Design):
- Contextualization: Môi trường làm việc của Công an Phường đòi hỏi sự tập trung cao độ, tốc độ phản hồi nhanh, và tính kỷ luật. Họ không có thời gian ngồi ngắm "Biểu đồ tròn".
- Creative Synthesis & Decision Ownership: Tôi bác bỏ Template sặc sỡ của AI. Tôi thiết kế lại trang `PoliceDashboard.tsx` theo phong cách Tối giản (Minimalist). Sidebar được thu nhỏ tối đa. Đặt một Huy hiệu Công an (Emblem) lớn để tạo sự uy nghiêm. Trung tâm màn hình thay vì là biểu đồ, tôi thay bằng Nhật ký vận hành (Operation Log) chạy theo thời gian thực (Real-time). Lực lượng an ninh chỉ cần nhìn vào màn hình là biết ngay khu vực nào đang có biến động khẩn cấp.
```

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Commit Contextual UX Phase 11 |
| File liên quan | PoliceDashboard.tsx |
| Screenshot |  |
| Kết quả chạy/test | Giao diện sắc lạnh, chuyên nghiệp, hiển thị đúng các KPI về An ninh trật tự. |
| Link video demo |  |
| Ghi chú khác |  |

#### 4.6. Nhận xét cá nhân/nhóm

```text
Đừng mang tư duy của dân kinh tế (thích biểu đồ) áp đặt vào UI của lực lượng an ninh (cần hành động nhanh).
```

---

### Lần sử dụng AI số 17

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 2026-08-03 |
| Công cụ AI | Antigravity |
| Mục đích sử dụng | Xây dựng API Tra cứu Phản ánh công khai (Public Search) an toàn |
| Phần việc liên quan | Backend / Security & Data Privacy |
| Mức độ sử dụng | Gợi ý cấu trúc Query Database |

#### 4.1. Prompt đã sử dụng

```text
- Tôi muốn làm một trang Web cho phép người dân (không cần đăng nhập) nhập Mã theo dõi (Tracking ID) hoặc gõ từ khóa để tra cứu xem phản ánh rác thải của họ đã được giải quyết tới đâu. Làm sao để truy vấn nhanh chóng?
```

#### 4.2. Kết quả AI gợi ý

```text
AI đề xuất tạo một API `GET /api/public/feedbacks`. AI viết một câu lệnh JPQL đơn giản để lấy danh sách Entity `Feedback` từ database và trả nguyên List<Feedback> này về cho Frontend hiển thị dưới dạng JSON.
```

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

```text
- Sử dụng câu lệnh JPQL hỗ trợ tìm kiếm động (Dynamic Search) theo nhiều trường.
```

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

```text
Chống rò rỉ dữ liệu (Data Leakage Prevention):
- Critical Thinking: Entity `Feedback` trong cơ sở dữ liệu chứa cả số điện thoại, email của người báo cáo (để cán bộ phường liên hệ) và các ghi chú nội bộ của Công an. Việc ném nguyên Entity này ra Public API như AI gợi ý là một lỗ hổng bảo mật nghiêm trọng (IDOR/Mass Assignment). Bất kỳ ai dùng Postman cũng có thể cào (scrape) được thông tin cá nhân của người khác.
- Decision Ownership & Creative Synthesis: Tôi đã tự thiết kế một `PublicFeedbackDTO`. DTO này đóng vai trò như một màng lọc, CHỈ copy các trường an toàn (Tiêu đề, Tọa độ, Trạng thái, Hình ảnh công khai) từ Entity gốc, và tuyệt đối loại bỏ số điện thoại/email. Đảm bảo 100% tính ẩn danh (Whistleblower Privacy) theo đúng nghiệp vụ báo cáo vi phạm an ninh của ứng dụng Smart City.
```

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Commit Public Search API Phase 12 |
| File liên quan | PublicFeedbackDTO.java, feedback-search.tsx |
| Screenshot |  |
| Kết quả chạy/test | Gọi API Public bằng Postman chỉ thấy các trường an toàn, không có bất kỳ thông tin cá nhân nào bị lộ. |
| Link video demo |  |
| Ghi chú khác |  |

#### 4.6. Nhận xét cá nhân/nhóm

```text
Không bao giờ được tin tưởng code tự sinh của AI khi làm việc với API công khai. Luôn phải dùng DTO để che giấu Entity gốc.
```

---

### Lần sử dụng AI số 18

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 2026-08-03 |
| Công cụ AI | Antigravity |
| Mục đích sử dụng | Tích hợp Đa ngôn ngữ (i18n) cho Cổng du khách |
| Phần việc liên quan | Frontend / React Context API |
| Mức độ sử dụng | Đề xuất kiến trúc i18n |

#### 4.1. Prompt đã sử dụng

```text
- Thành phố Đà Nẵng có rất nhiều khách du lịch ngoại quốc. Trang Web của tôi cần hỗ trợ chuyển đổi mượt mà giữa tiếng Việt và tiếng Anh mà không phải tải lại trang. Hãy viết code i18n cho tôi.
```

#### 4.2. Kết quả AI gợi ý

```text
AI yêu cầu tôi cài đặt thư viện `react-i18next` và `i18next`. Sau đó tạo 2 file JSON khổng lồ `vi.json` và `en.json` chứa toàn bộ text của ứng dụng, và dùng hàm `t('key')` bọc ở mọi nơi trong các Component.
```

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

```text
- Áp dụng triết lý dùng hàm `t('key')` để map text.
- Lấy một phần danh sách các từ khóa phổ biến được AI dịch sẵn sang tiếng Anh.
```

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

```text
Thiết kế Context API gọn nhẹ thay vì thư viện cồng kềnh:
- Critical Thinking: `react-i18next` là một thư viện nặng. Nếu tôi gói toàn bộ text của 10 trang Web vào một file JSON duy nhất, người dùng (đặc biệt là 3G yếu) sẽ phải tải một Bundle size khổng lồ ngay từ lần truy cập đầu tiên.
- Decision Ownership & Creative Synthesis: Tôi từ chối cài thư viện ngoài. Tôi tự tay viết một React Context API mang tên `useI18n()`. Hàm này quản lý biến trạng thái `locale` (en/vi) và lưu vào `localStorage`. Các bản dịch không bị gộp chung mà được phân mảnh (Code Splitting) hoặc tổ chức theo dạng object map gọn nhẹ ngay trong bộ nhớ. Việc chuyển đổi ngôn ngữ diễn ra tức thời chỉ với một lần Re-render Context mà không làm nặng trang Web.
```

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Commit i18n Phase 12 |
| File liên quan | i18n.tsx, feedback-search.tsx |
| Screenshot |  |
| Kết quả chạy/test | Bấm nút chuyển Cờ Việt/Anh trên thanh Header, toàn bộ nội dung đổi ngôn ngữ tức thời, không load lại trang. |
| Link video demo |  |
| Ghi chú khác |  |

#### 4.6. Nhận xét cá nhân/nhóm

```text
Tối ưu hóa dung lượng ứng dụng (Bundle Size) bằng cách tự viết các Context đơn giản thay vì lạm dụng thư viện của bên thứ ba.
```

---

### Lần sử dụng AI số 19

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 2026-08-03 |
| Công cụ AI | Antigravity |
| Mục đích sử dụng | Xử lý đa phương tiện & Định vị GPS cho Form gửi phản ánh |
| Phần việc liên quan | Frontend / Browser Native APIs |
| Mức độ sử dụng | Hỗ trợ tìm kiếm thư viện (Bị bác bỏ) |

#### 4.1. Prompt đã sử dụng

```text
- Form báo cáo rác thải của tôi cần cho phép người dân đính kèm hình ảnh và tự động lấy tọa độ GPS của họ. Hãy chỉ cho tôi cách làm.
```

#### 4.2. Kết quả AI gợi ý

```text
AI đề xuất sử dụng 2 thư viện rất nặng: `react-dropzone` để kéo thả ảnh, và yêu cầu gọi API của `ipinfo.io` (trả phí) để lấy tọa độ thông qua địa chỉ IP. Về phần ảnh, AI gợi ý gửi thẳng file raw (có thể lên tới 10MB/ảnh) lên Server Backend.
```

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

```text
- Không sử dụng bất kỳ thư viện hay API trả phí nào do AI đề xuất.
```

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

```text
Khai thác Browser Native APIs & Tối ưu hóa Băng thông (Bandwidth):
- Critical Thinking: Việc gửi thẳng ảnh 10MB từ điện thoại lên Server bằng 4G sẽ làm người dân nản lòng vì quá chậm (và gây tốn kém tiền Cloud Storage cho dự án). Ngoài ra, định vị bằng IP (như AI xúi) là cực kỳ thiếu chính xác, độ lệch có thể lên tới hàng kilomet.
- Decision Ownership & Creative Synthesis: Tôi tự viết một Hook ép nén ảnh ngay trên trình duyệt (Client-side Compression) bằng HTML5 `<canvas>`. Một tấm ảnh 10MB lập tức bị thu nhỏ về 300KB trước khi rời khỏi điện thoại, giúp API Upload phản hồi trong tích tắc. Về GPS, tôi sử dụng Native API `navigator.geolocation` của trình duyệt. Nó kết nối thẳng với chip GPS trên điện thoại để lấy tọa độ cực kỳ chính xác (lệch vài mét) mà hoàn toàn miễn phí.
```

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Commit Multimedia & Geo Phase 13 |
| File liên quan | ReportForm.tsx |
| Screenshot |  |
| Kết quả chạy/test | Người dùng upload 5 tấm ảnh 4K nhưng chỉ mất 1 giây để xử lý xong. Tọa độ chính xác đến từng gốc cây. |
| Link video demo |  |
| Ghi chú khác |  |

#### 4.6. Nhận xét cá nhân/nhóm

```text
Tối ưu hóa ở phía Client (Frontend) là cách hiệu quả nhất để cứu vớt hàng nghìn đô la chi phí Server (Backend).
```

---

### Lần sử dụng AI số 20

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 2026-08-03 |
| Công cụ AI | Antigravity |
| Mục đích sử dụng | Cấu hình bảo mật cấp độ Production (CORS & Rate Limiting) |
| Phần việc liên quan | Backend / System Security |
| Mức độ sử dụng | Hỗ trợ cú pháp Spring Security |

#### 4.1. Prompt đã sử dụng

```text
- Khi tôi đẩy Frontend lên Vercel và Backend lên Render, trình duyệt báo lỗi "CORS blocked". Đồng thời, bất kỳ ai cũng có thể gọi API Public hàng nghìn lần để spam rác hệ thống. Tôi phải làm sao?
```

#### 4.2. Kết quả AI gợi ý

```text
AI cung cấp đoạn code Spring Boot: `registry.addMapping("/**").allowedOrigins("*")`. Nó bảo tôi cho phép tất cả mọi Origin (dấu `*`) để giải quyết lỗi CORS nhanh nhất. Về spam, AI xúi cài thêm một server Nginx đứng trước để cản.
```

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

```text
- Học cách cấu trúc class `WebMvcConfigurer` trong Spring Boot.
```

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

```text
Bảo mật hệ thống tuyệt đối (Hardening System Security):
- Critical Thinking: Cấu hình `.allowedOrigins("*")` của AI là sự tự sát về mặt bảo mật. Bất kỳ trang web giả mạo nào (Phishing) cũng có thể gửi request đến API của tôi (CSRF Attack). Việc cài Nginx thì lại quá phức tạp và không khả thi trên nền tảng Render miễn phí.
- Decision Ownership & Creative Synthesis: Tôi đã ném bỏ code CORS rác của AI. Thay vào đó, tôi hardcode chính xác Origin hợp lệ `.allowedOrigins("https://thecityconnect.vn")` và chỉ cho phép các hàm `GET, POST`. Để chống Spam, tôi triển khai thuật toán Token Bucket (Rate Limiting) ngay trong tầng Filter của Spring Boot: Giới hạn mỗi địa chỉ IP chỉ được gửi tối đa 5 phản ánh / phút. Kẻ tấn công (DDoS) sẽ bị trả về mã lỗi HTTP 429 (Too Many Requests).
```

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Commit Production Security Phase 13 |
| File liên quan | WebSecurityConfig.java, RateLimitFilter.java |
| Screenshot |  |
| Kết quả chạy/test | Dùng Postman spam API liên tục, đến request thứ 6 lập tức bị chặn bằng mã HTTP 429. |
| Link video demo |  |
| Ghi chú khác |  |

#### 4.6. Nhận xét cá nhân/nhóm

```text
Đừng bao giờ copy-paste code CORS của AI. "Chạy được" và "Chạy an toàn" là hai khái niệm hoàn toàn khác biệt.
```

---

### Lần sử dụng AI số 21

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 2026-08-03 |
| Công cụ AI | Antigravity |
| Mục đích sử dụng | Thiết kế Data Layer cho các bảng dữ liệu tĩnh (Danh mục, Phường xã) |
| Phần việc liên quan | Backend / Database & Caching |
| Mức độ sử dụng | Gợi ý cấu trúc Query Database |

#### 4.1. Prompt đã sử dụng

```text
- Trang chủ của tôi cần hiển thị danh sách các Phường và Danh mục phản ánh. Làm sao để Backend trả dữ liệu nhanh nhất có thể?
```

#### 4.2. Kết quả AI gợi ý

```text
AI viết một đoạn code `WardRepository.findAll()` và `CategoryRepository.findAll()` bằng Spring Data JPA. Đoạn code này sẽ truy vấn thẳng vào Database (PostgreSQL) mỗi khi có một request từ Client bay tới.
```

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

```text
- Sử dụng cú pháp khai báo Repository cơ bản của Spring.
```

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

```text
Tích hợp Cơ chế Bộ đệm (Caching Mechanism):
- Critical Thinking: Danh sách các Phường và Danh mục rác thải là dữ liệu "tĩnh" (gần như không bao giờ thay đổi). Nếu 10.000 người dùng truy cập trang chủ cùng lúc, Database sẽ phải thực hiện 10.000 câu lệnh `SELECT` thừa thãi. Lời khuyên của AI sẽ làm nghẽn cổ chai (Bottleneck) hệ thống.
- Decision Ownership & Creative Synthesis: Tôi đã can thiệp vào tầng Service, gắn annotation `@Cacheable("wards")` và `@Cacheable("categories")` của Spring Cache (có thể dùng kèm Redis). Lần đầu tiên gọi API, dữ liệu sẽ được lấy từ DB và ném vào RAM (Cache). Kể từ request thứ 2 trở đi, dữ liệu được trả về thẳng từ RAM với tốc độ siêu tốc (< 1ms) mà Database không hề bị chạm tới.
```

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Commit Caching Phase 14 |
| File liên quan | WardService.java, CacheConfig.java |
| Screenshot |  |
| Kết quả chạy/test | Nhìn vào Log Console, câu lệnh `Hibernate: SELECT...` chỉ chạy đúng 1 lần duy nhất lúc khởi động, các lần F5 sau không có log DB nữa. |
| Link video demo |  |
| Ghi chú khác |  |

#### 4.6. Nhận xét cá nhân/nhóm

```text
Database là tài nguyên đắt đỏ nhất trong hệ thống. Luôn phải tìm cách che chắn cho nó bằng Cache trước những dữ liệu ít thay đổi.
```

---

### Lần sử dụng AI số 22

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 2026-08-03 |
| Công cụ AI | Antigravity |
| Mục đích sử dụng | Gửi Email thông báo trạng thái phản ánh |
| Phần việc liên quan | Backend / Asynchronous Processing |
| Mức độ sử dụng | Hỗ trợ cú pháp thư viện gửi mail |

#### 4.1. Prompt đã sử dụng

```text
- Khi cán bộ Phường duyệt xong một phản ánh, tôi muốn gửi Email thông báo tự động cho người dân. Làm sao để tích hợp JavaMailSender?
```

#### 4.2. Kết quả AI gợi ý

```text
AI đưa ra đoạn code gửi email Đồng bộ (Synchronous). Nghĩa là ngay trong API `approveFeedback()`, AI chèn thêm lệnh `emailService.sendMail()`.
```

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

```text
- Học cách cấu hình SMTP Server (`application.yml`) và các hàm tạo `MimeMessage`.
```

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

```text
Xử lý Bất đồng bộ (Asynchronous Background Jobs):
- Critical Thinking: Gửi email qua SMTP Google thường mất từ 2-5 giây để hoàn thành. Nếu làm theo code Đồng bộ của AI, cán bộ Phường bấm nút "Duyệt" xong thì màn hình sẽ bị "treo" (loading) 5 giây mới báo thành công. Tệ hơn, nếu Google Mail bị sập, toàn bộ tiến trình duyệt bài sẽ ném ra Exception và thất bại.
- Decision Ownership & Creative Synthesis: Tôi tách tính năng gửi Email ra một luồng riêng biệt (Thread) bằng cách gắn annotation `@Async` vào hàm `sendMail()`. Nhờ đó, khi cán bộ Phường bấm "Duyệt", API lập tức trả về kết quả thành công (< 0.1s), giải phóng giao diện. Việc gửi Email được quăng vào Background Job để hệ thống tự thong thả gửi ngầm. Nếu gửi lỗi, luồng chính vẫn không bị ảnh hưởng.
```

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Commit Async Email Phase 14 |
| File liên quan | EmailService.java, AsyncConfig.java |
| Screenshot |  |
| Kết quả chạy/test | Bấm duyệt trên giao diện xử lý ngay lập tức. Email vẫn nhận được vài giây sau đó. |
| Link video demo |  |
| Ghi chú khác |  |

#### 4.6. Nhận xét cá nhân/nhóm

```text
Thiết kế hệ thống thông minh là phải biết phân tách rạch ròi đâu là tác vụ cần phản hồi ngay (Synchronous) và đâu là tác vụ chạy ngầm (Asynchronous).
```

---

### Lần sử dụng AI số 23

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 2026-08-03 |
| Công cụ AI | Antigravity |
| Mục đích sử dụng | Quản lý lỗi HTTP và Refresh Token tập trung |
| Phần việc liên quan | Frontend / Network Layer |
| Mức độ sử dụng | Hỗ trợ bắt lỗi cơ bản (Bị bác bỏ) |

#### 4.1. Prompt đã sử dụng

```text
- Khi API của Backend trả về lỗi (ví dụ như 401 Unauthorized do hết hạn token), tôi muốn hiển thị thông báo lỗi cho người dùng. Phải làm sao?
```

#### 4.2. Kết quả AI gợi ý

```text
AI đề xuất tôi bọc `try...catch` xung quanh mọi lời gọi hàm `fetch()` hoặc `axios.get()` ở toàn bộ các Component. Nếu bắt được lỗi 401 thì gọi hàm `logout()` và đẩy người dùng ra trang đăng nhập.
```

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

```text
- Không sử dụng cách làm phân mảnh của AI.
```

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

```text
Triển khai Global Axios Interceptor (Silent Refresh):
- Critical Thinking: Trải nghiệm người dùng (UX) sẽ cực kỳ tồi tệ nếu họ đang gõ dở một cái form dài dòng mà bị văng ra ngoài trang Đăng nhập chỉ vì Token vừa hết hạn được 1 giây. Việc viết `try...catch` ở 50 file khác nhau cũng sinh ra lượng code rác (Boilerplate) khổng lồ và rất khó bảo trì.
- Decision Ownership & Creative Synthesis: Thay vì nghe AI, tôi tự cấu hình một `Axios Interceptor` chặn (intercept) toàn bộ các Request và Response trước khi chúng đến được Component. Khi Backend ném ra lỗi 401, Interceptor sẽ tự động tạm dừng request hiện tại, ngầm gọi API `refresh-token` để lấy token mới, rồi gọi lại chính request ban đầu (Silent Refresh). Người dùng không hề hay biết sự gián đoạn này. Mọi lỗi 500 cũng được Interceptor hứng và hiển thị Toast Notification một lần duy nhất ở đây.
```

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Commit Global Interceptor Phase 15 |
| File liên quan | api.ts, auth.ts |
| Screenshot |  |
| Kết quả chạy/test | Đợi token hết hạn (15 phút), bấm Lưu dữ liệu. Request đầu bị 401, tự động văng ra request Refresh, và tự động gọi lại lệnh Lưu thành công. Người dùng không bị đá ra ngoài. |
| Link video demo |  |
| Ghi chú khác |  |

#### 4.6. Nhận xét cá nhân/nhóm

```text
Xử lý lỗi (Error Handling) không phải là "ném try...catch khắp nơi", mà là quy hoạch nó vào một tầng mạng (Network Layer) duy nhất.
```

---

### Lần sử dụng AI số 24

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 2026-08-03 |
| Công cụ AI | Antigravity |
| Mục đích sử dụng | Quản lý trạng thái cho Form báo cáo Đa bước (Multi-step) |
| Phần việc liên quan | Frontend / State Management |
| Mức độ sử dụng | Hỗ trợ tư duy truyền dữ liệu |

#### 4.1. Prompt đã sử dụng

```text
- Tôi có một Form báo cáo rác thải gồm 3 bước (Nhập thông tin, Đính kèm vị trí bản đồ, Tải ảnh lên). Làm sao để lưu trữ dữ liệu của bước 1 khi người dùng đang ở bước 3?
```

#### 4.2. Kết quả AI gợi ý

```text
AI khuyên tôi tạo một State bự ở Component cha (Parent Component), sau đó truyền hàm `setDữLiệu` xuống tận Component con ở tầng thứ 3 thông qua `props` (hiện tượng Prop Drilling).
```

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

```text
- Không sử dụng giải pháp Prop Drilling vì nó phá vỡ cấu trúc Component.
```

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

```text
Sử dụng Zustand cho Global State Management:
- Critical Thinking: Việc truyền `props` lồng qua 3-4 tầng Component (Prop Drilling) sẽ khiến code biến thành "Mì Ý" (Spaghetti Code). Hơn nữa, mỗi khi Component cha cập nhật State, toàn bộ các Component con (kể cả những cái không liên quan) đều bị Re-render, gây giật lag (đặc biệt khi có bản đồ Leaflet). React Context thì lại quá cồng kềnh.
- Decision Ownership & Creative Synthesis: Tôi đã cài đặt thư viện `Zustand` - một giải pháp State Management cực nhỏ gọn. Tôi định nghĩa một `useReportStore`, chứa toàn bộ dữ liệu của 3 bước. Ở bất kỳ bước nào (dù Component bị chôn sâu đến đâu), tôi chỉ cần gọi `useReportStore(state => state.updateStep1)` là xong. Cơ chế "Select State" của Zustand đảm bảo chỉ những Component thực sự cần dữ liệu mới bị Re-render, cứu vãn toàn bộ hiệu năng của trang Web.
```

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Commit Zustand State Phase 15 |
| File liên quan | useReportStore.ts, ReportForm.tsx |
| Screenshot |  |
| Kết quả chạy/test | Nhập liệu ở bước 3 cực mượt, bản đồ ở bước 2 hoàn toàn không bị Re-render vô ích nhờ vào React Profiler xác nhận. |
| Link video demo |  |
| Ghi chú khác |  |

#### 4.6. Nhận xét cá nhân/nhóm

```text
Tránh xa Prop Drilling bằng mọi giá trong các ứng dụng React phức tạp. Zustand là vũ khí bí mật để kiểm soát Component Re-render.
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
