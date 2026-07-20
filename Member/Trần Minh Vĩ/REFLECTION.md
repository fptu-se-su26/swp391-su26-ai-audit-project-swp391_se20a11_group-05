# AI Learning Reflection

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
| Ngày hoàn thành reflection | 2026-08-02 |

---

## 2. Mục đích Reflection

File này dùng để sinh viên/nhóm tự đánh giá quá trình sử dụng AI trong học tập và thực hiện bài tập, lab, assignment hoặc project.

Reflection cần thể hiện:

- AI đã hỗ trợ gì trong quá trình học.
- Sinh viên/nhóm đã kiểm chứng kết quả AI như thế nào.
- Sinh viên/nhóm đã tự chỉnh sửa, cải tiến ra sao.
- Sinh viên/nhóm học được gì về môn học.
- Sinh viên/nhóm học được gì về cách sử dụng AI minh bạch và có trách nhiệm.

---

## 3. Tóm tắt quá trình sử dụng AI

Mô tả ngắn gọn quá trình sử dụng AI trong bài tập/project này.

```text
Em đã sử dụng AI ở các giai đoạn phân tích yêu cầu (Requirement) để phân rã bài toán lớn và nhận diện rủi ro thực tế; thiết kế kiến trúc hệ thống để xử lý các tác vụ bất đồng bộ; phát triển giao diện (Implementation) để tái thiết kế lại giao diện dashboard của UBND và Công an Phường, xây dựng Cổng Du khách (Tourist Portal); và cuối cùng là hỗ trợ phát triển tính năng chat thời gian thực cho Chiến dịch tình nguyện và gỡ lỗi xung đột Git (Git Conflict Resolution). Công cụ dùng nhiều nhất là Gemini và Antigravity. AI giúp nâng tầm thiết kế giao diện và code khung nhanh, nhưng em luôn trực tiếp cải tiến logic để phù hợp với nghiệp vụ hành chính công thực địa và bảo vệ an toàn cho hệ thống mã nguồn.
```

---

## 4. Công cụ AI đã sử dụng

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

### Công cụ được sử dụng nhiều nhất

```text
Gemini / Antigravity
```

### Lý do sử dụng công cụ đó

```text
Cung cấp khả năng phân tích ngữ cảnh rộng lớn, đóng vai trò chuyên gia phân tích nghiệp vụ và kiến trúc rất hiệu quả.
```

---

## 5. AI đã hỗ trợ em/nhóm ở điểm nào?

Đánh dấu các nội dung phù hợp.

- [x] Hiểu yêu cầu đề bài
- [x] Phân tích bài toán
- [x] Tìm ý tưởng giải pháp
- [x] Thiết kế database
- [x] Thiết kế giao diện
- [x] Thiết kế kiến trúc hệ thống
- [x] Viết code mẫu
- [ ] Debug lỗi
- [ ] Viết test case
- [ ] Review code
- [x] Tối ưu code
- [x] Kiểm tra bảo mật
- [x] Viết báo cáo
- [ ] Chuẩn bị thuyết trình
- [x] Tìm hiểu công nghệ mới
- [ ] Khác: ....................................

### Mô tả chi tiết

```text
AI giúp nhận diện 4 lỗ hổng nghiêm trọng của một hệ thống đô thị thông minh (Rác dữ liệu, Hiệu năng GPS, Bất đồng bộ, Bảo mật danh tính). Ngoài ra, AI hỗ trợ code khung giao diện React/Tailwind, cấu hình router ẩn Header/Footer của Citizen, và tư vấn cấu trúc các thẻ KPI, bản đồ Leaflet động cho UBND Phường và Công an Phường.
```

---

## 6. AI có giúp em/nhóm học tốt hơn không?

### 6.1. Những điểm AI giúp em/nhóm học tốt hơn

```text
- Giúp mở rộng tầm nhìn, thoát khỏi tư duy làm một ứng dụng CRUD thông thường.
- Hiểu được sự khác biệt giữa đồ án sinh viên và hệ thống phân tán thực tế.
- Biết cách thiết lập các yêu cầu phi chức năng khắt khe ngay từ bước viết SRS.
- Học cách tùy biến bản đồ Leaflet trong React, quản lý các layers, markers động (L.divIcon) và liên kết nghiệp vụ địa bàn.
```

### 6.2. Những điểm AI chưa giúp tốt hoặc gây khó khăn

```text
AI đôi khi đề xuất các giải pháp mang tính lý thuyết, đòi hỏi cài cắm các hệ thống chuyên sâu đắt đỏ hoặc cluster phức tạp, vượt quá giới hạn ngân sách và năng lực sinh viên hiện tại.
```

### 6.3. Em/nhóm có bị phụ thuộc vào AI không?

- [ ] Không phụ thuộc
- [x] Phụ thuộc ít
- [ ] Phụ thuộc trung bình
- [ ] Phụ thuộc nhiều

Giải thích:

```text
Em đã áp dụng Critical Thinking để bác bỏ những đề xuất chưa phù hợp của AI (như dùng marker Leaflet xanh mặc định cho tất cả trạng thái đơn, hay dùng dữ liệu mock hardcode cho tổ dân phố/địa bàn). Đồng thời, em làm chủ quá trình liên kết dữ liệu thật từ API và trích xuất địa danh đường phố động từ DB.
```

---

## 7. Em/nhóm đã kiểm tra kết quả AI như thế nào?

Đánh dấu các cách đã sử dụng.

- [x] Chạy thử chương trình
- [x] Kiểm tra output
- [ ] Viết test case
- [x] So sánh với yêu cầu đề bài
- [ ] Đối chiếu với tài liệu môn học
- [x] Review code
- [ ] Hỏi lại giảng viên
- [ ] Tra cứu tài liệu chính thống
- [x] Thảo luận với thành viên nhóm
- [ ] Kiểm tra bằng dữ liệu mẫu
- [x] So sánh trước và sau khi dùng AI
- [x] Khác: Đối chiếu với đặc thù bối cảnh thực tế (Đà Nẵng).

### Mô tả quá trình kiểm chứng

```text
- Nhóm chạy thử ứng dụng trên dev server local (`npm run dev`), kiểm tra trực quan giao diện cổng `/ward` và `/police` để đối chiếu với đặc tả thiết kế.
- Chạy lệnh `npm run build` để kiểm chứng mã nguồn biên dịch thành công, không có bất kỳ lỗi JavaScript/TypeScript nào.
- So sánh hiệu quả trực quan trước và sau khi đổi màu marker bản đồ Leaflet: Giúp cán bộ nhận diện sự cố khẩn cấp (quá hạn) ngay lập tức.
```

---

## 8. Ví dụ AI gợi ý sai hoặc chưa phù hợp

### Ví dụ 1: Gợi ý các giải pháp hệ thống đắt đỏ
- **AI đã gợi ý gì:** Cài đặt các hệ thống cluster phức tạp để xử lý lượng lớn dữ liệu.
- **Vì sao chưa phù hợp:** Vượt quá giới hạn ngân sách sinh viên và không cần thiết cho quy mô prototype đồ án.
- **Phát hiện bằng cách nào:** Dùng Critical Thinking đánh giá tính khả thi tài chính và kỹ thuật.
- **Cách sửa đổi:** Thay bằng phương pháp lọc sơ bộ tại nguồn sử dụng AI Edge OCR trước khi ghi vào Database.
- **Bài học rút ra:** Luôn cung cấp giới hạn nguồn lực cho AI, tránh áp dụng các giải pháp quá quy mô.

### Ví dụ 2: Quy trình cộng tác và quản lý code phức tạp
- **AI đã gợi ý gì:** Sử dụng mô hình phân nhánh Gitflow doanh nghiệp và cài đặt CI/CD Jenkins.
- **Vì sao chưa phù hợp:** Quá cồng kềnh đối với nhóm 5 sinh viên làm đồ án 10 tuần, việc quản lý nhánh release/hotfix phức tạp và tốn thời gian không cần thiết, dễ gây xung đột merge code (Oversimplification rủi ro vận hành).
- **Phát hiện bằng cách nào:** Đánh giá năng lực sử dụng Git của các thành viên và quỹ thời gian dự án.
- **Cách sửa đổi:** Chuyển sang mô hình GitHub Flow tinh giản, tích hợp Pull Request có review chéo, và áp dụng phát triển API-First để mock data làm việc độc lập.
- **Bài học rút ra:** Luôn chọn quy trình làm việc (Git workflow) phù hợp nhất với quy mô và năng lực thực tế của team, tránh áp dụng máy móc các quy trình lớn của doanh nghiệp.

### Ví dụ 3: Lỗi bất đồng bộ (@Async) không giới hạn Thread Pool và thiếu Rate Limiting
- **AI đã gợi ý gì:** Sử dụng annotation @Async trên phương thức sendSMS() để gửi tin nhắn OTP bất đồng bộ, giúp trả về response ngay cho client.
- **Vì sao chưa phù hợp:** AI chỉ dùng annotation mặc định mà không cấu hình Thread Pool giới hạn (SimpleAsyncTaskExecutor). Khi bị tấn công spam tin nhắn, server tự động sinh vô số Thread mới gây cạn kiệt bộ nhớ RAM và CPU (Oversimplification). AI cũng bỏ qua cơ chế chống spam cước phí SMS của nhà mạng.
- **Phát hiện bằng cách nào:** Dùng công cụ kiểm thử tải (JMeter) để spam gửi yêu cầu OTP và theo dõi dung lượng RAM/số lượng thread của Java Virtual Machine.
- **Cách sửa đổi:** Cấu hình thủ công ThreadPoolTaskExecutor với CorePoolSize = 5, MaxPoolSize = 10, QueueCapacity = 100. Đồng thời phát triển thuật toán Rate Limiting (lọc và chặn yêu cầu gửi OTP dưới 1 phút/lần cho một số điện thoại).
- **Bài học rút ra:** Khi viết các tác vụ bất đồng bộ, luôn phải chủ động kiểm soát vòng đời và số lượng Thread được tạo ra, đồng thời thiết lập các rào cản bảo mật (Rate Limit) để tránh rủi ro chi phí dịch vụ bên thứ ba.

### Ví dụ 4: Marker Leaflet mặc định không đổi màu và dữ liệu địa bàn hardcode
- **AI đã gợi ý gì:** Đề xuất dùng Marker màu xanh dương mặc định của Leaflet cho tất cả ghim sự cố trên bản đồ, và hardcode danh sách tổ dân phố / khu vực ưu tiên dưới dạng text tĩnh.
- **Vì sao chưa phù hợp:** Vấn đề nghiệp vụ quản lý: Cán bộ không thể phân biệt nhanh sự cố quá hạn hay chưa tiếp nhận trên bản đồ nếu tất cả ghim cùng một màu. Hardcode địa bàn khiến hệ thống không hiển thị đúng dữ liệu thật khi có sự cố mới ở địa bàn khác.
- **Phát hiện bằng cách nào:** So sánh giao diện chạy thử bản đồ với bảng chú thích màu sắc trạng thái, nhận thấy sự bất đồng màu. Kiểm tra mã nguồn thấy mảng dữ liệu tổ dân phố tĩnh không liên kết với database.
- **Cách sửa đổi:** Tự thiết lập CivicMap.tsx để sử dụng L.divIcon tạo HTML/CSS Marker động tùy biến màu sắc dựa trên trạng thái (Đỏ, Cam, Xanh dương, Xanh lá). Tự viết hàm trích xuất tên đường phố động từ chuỗi địa chỉ đầy đủ của các phản ánh được fetch từ database và sắp xếp theo số lượng phản ánh giảm dần để xác định khu vực cần ưu tiên.
- **Bài học rút ra:** Luôn phân tích nghiệp vụ thực tế của người sử dụng (cán bộ) trước khi chấp nhận các giải pháp giao diện đơn giản từ AI. Cần động hóa các thành phần hiển thị dựa trên dữ liệu thật để hệ thống có tính thực tiễn cao.

### Ví dụ 7: Lỗi logic bảo mật (RBAC) do AI code cứng điều kiện
- **AI đã gợi ý gì:** Khi yêu cầu phân quyền cho giao diện Cán bộ, AI gợi ý tôi kiểm tra quyền `if (user.role !== 'WARD_ADMIN')` ở ngay trên cùng của mỗi component hiển thị.
- **Vì sao chưa phù hợp:** Phương pháp này quá thủ công (Manual) và không an toàn. Khi số lượng trang web tăng lên, việc copy-paste dòng `if` này đi khắp nơi sẽ gây ra trùng lặp code. Ngoài ra, việc check quyền bên trong Component đồng nghĩa với việc trình duyệt đã kịp tải toàn bộ mã nguồn của trang đó về máy (dù chưa hiển thị ra). Điều này dẫn đến nguy cơ lộ lọt dữ liệu nội bộ qua việc dịch ngược (Reverse Engineering).
- **Phát hiện bằng cách nào:** Thông qua việc theo dõi thẻ Network trên Chrome DevTools. Tôi thấy file JS của trang `PoliceDashboard` vẫn bị tải về dù tôi đang đăng nhập bằng tài khoản dân thường.
- **Cách sửa đổi:** Bác bỏ cách làm tủn mủn của AI. Tôi thiết kế lại toàn bộ bằng Higher-Order Component (HOC) `ProtectedRoute` kết hợp với React Suspense (Lazy Loading). HOC này hoạt động như một trạm gác ở lớp Router. Nó chặn toàn bộ người dùng trái phép và ngắt kết nối tải file JS trước cả khi component kịp khởi tạo. Đồng thời tôi mở rộng để HOC có thể nhận vào nhiều Role cùng lúc (Mảng `allowedRoles`).
- **Bài học rút ra:** Bảo mật (Security) không thể giải quyết bằng các dòng `if-else` cục bộ. Nó phải được quy hoạch thành một kiến trúc tổng thể (System Architecture) nằm ở tầng cao nhất của ứng dụng.

### Ví dụ 8: Hiệu năng bản đồ sụp đổ do lạm dụng React State
- **AI đã gợi ý gì:** Khi gặp lỗi treo trình duyệt do hiển thị 10.000 điểm sự kiện trên bản đồ, AI đã đề xuất sử dụng Bounding Box và cung cấp một thuật toán Debounce dùng `useState` để lưu tọa độ giới hạn của bản đồ mỗi khi người dùng kéo (drag).
- **Vì sao chưa phù hợp:** Mặc dù về lý thuyết là đúng, nhưng AI không hiểu rõ môi trường React-Leaflet. Việc dùng `useState` cho tọa độ khi người dùng đang vuốt bản đồ sẽ kích hoạt (trigger) cơ chế Re-render liên tục của React. Kết quả là bản đồ không những không nhanh hơn mà còn giật cục (lag) tồi tệ hơn, tạo ra vòng lặp vô tận (Infinite Re-render).
- **Phát hiện bằng cách nào:** Ứng dụng bị đơ cứng, quạt tản nhiệt của máy tính hú lên và console báo lỗi Maximum Update Depth Exceeded.
- **Cách sửa đổi:** Tự tay viết một Custom Hook `useMapBoundsDebounce`. Thay vì dùng `useState`, tôi dùng `useRef` để theo dõi tọa độ ngầm (không gây re-render). Dữ liệu chỉ được chuyển vào state chính sau khi người dùng buông tay 500ms. Kết hợp thêm kỹ thuật Clustering (gộp điểm). Bản đồ trở nên mượt mà hoàn toàn với 100.000 điểm giả lập.
- **Bài học rút ra:** AI rất giỏi các thuật toán nền tảng (Vanilla JS) nhưng thường thiếu cái nhìn sắc bén về Vòng đời Component (Lifecycle) trong React. Việc mù quáng tin vào code của AI khi làm việc với Dữ liệu lớn (Big Data) ở phía Client là một thảm họa.

---

## 9. Phần đóng góp thật sự của sinh viên/nhóm

Mô tả rõ phần nào là đóng góp chính của sinh viên/nhóm, không phải chỉ copy từ AI.

```text
Toàn bộ dự án The City Connect là một quá trình làm chủ kiến trúc và hệ thống. Đóng góp của cá nhân/nhóm nằm ở việc liên tục thiết kế lại và bác bỏ các giải pháp sơ sài từ AI:
- Quyết định đưa cơ chế Spatial Clustering và Bounding Box vào thiết kế hệ thống thay vì để Database Full-Table Scan.
- Quyết định mã hóa danh tính công dân để bảo vệ quyền riêng tư ngay từ khâu thiết kế.
- Quyết định thiết lập GitHub Flow và quy trình phát triển API-First Development cho toàn bộ team để làm việc song song mượt mà.
- Quyết định cấu hình Thread Pool an toàn cho các tác vụ bất đồng bộ và tự triển khai thuật toán Rate Limiting chống DDoS cước phí SMS.
- Xây dựng tư duy Contextualization cho đặc thù TP Đà Nẵng, thiết kế riêng các ứng dụng (Dashboard) cho Phường, Công an và Du khách.
- Cải biến giao diện tĩnh Cổng Du khách thành giao diện có tính tương tác cao (Actionable UI) với nút bấm gọi điện khẩn cấp.
- Đưa ra quyết định hệ thống: Dừng hoàn toàn các tiến trình tự động (Vite server) bằng PowerShell trước khi xử lý xung đột Git để bảo vệ an toàn nhánh `main`.
- Thiết kế hệ thống bảo mật Frontend với `ProtectedRoute` (RBAC) chặn quyền truy cập và rò rỉ mã nguồn từ lớp Routing.
- Can thiệp sâu vào Lifecycle của React: Tự viết Custom Hook dùng `useRef` để giải quyết lỗi Infinite Re-render của AI, tối ưu hóa bản đồ đạt mức 60FPS khi tải dữ liệu lớn.
```

---

## 10. So sánh trước và sau khi dùng AI

| Nội dung | Trước khi dùng AI | Sau khi dùng AI | Cải thiện đạt được |
|---|---|---|---|
| Hiểu yêu cầu (Requirement) | Tư duy làm app CRUD (Thêm, sửa, xóa) đơn giản, chỉ tập trung vào việc lưu dữ liệu thành công. | Nâng tầm thành hệ thống có kiến trúc chịu tải (Performance), bảo mật (Security), và Event-Driven. | Thay đổi toàn bộ tư duy thiết kế cốt lõi. Từ một đồ án sinh viên trở thành một sản phẩm có tính thực tiễn cao (Production-ready). |
| Cộng tác nhóm (Teamwork) | Phân chia việc mơ hồ, thường xuyên chờ nhau hoàn thành code, dễ sinh ra xung đột khi gộp nhánh. | Thống nhất API Contract (Mock API trước), dùng GitHub Flow có review chéo. | Triệt tiêu 90% lỗi git conflict, team làm việc song song mượt mà, Onboarding nhanh chóng thông qua Maven Wrapper. |
| Giao diện cán bộ (UI/UX) | Giao diện cũ đơn giản, dùng chung Header/Footer của Citizen gây rối loạn nghiệp vụ. | Redesign độc lập, giao diện dashboard nghiệp vụ chuẩn chỉ, bản đồ trực quan với Clustering và Marker động. | Trực quan hóa thông tin hiệu quả cho cán bộ ra quyết định, tuyệt đối không lặp lại layout nhờ Centralized Routing. |
| Hiệu năng và Tối ưu (Optimization) | Viết code chạy được là đủ, không quan tâm đến bộ nhớ RAM hay tốc độ CPU. | Nắm vững kỹ thuật Debouncing, Lazy Loading, Background Worker (Async). | Bản đồ không còn bị treo cứng. Server không bị quá tải khi xử lý ảnh hoặc gửi SMS hàng loạt. |

---

## 11. Bài học về môn học

Sau bài tập/project này, em/nhóm học được gì về kiến thức môn học?

```text
Một đồ án sinh viên và phần mềm thực tế khác xa nhau hoàn toàn. Qua môn học SWP391 và quá trình xây dựng The City Connect, em nhận ra rằng "Code chạy được" chỉ chiếm 20% thành công của dự án. 80% còn lại nằm ở Kiến trúc hệ thống (Architecture), Quy trình làm việc (Workflow), Bảo mật (Security) và Tối ưu hiệu năng (Performance).
- Em hiểu sâu hơn về tính chất nghiệp vụ phức tạp của một nền tảng phản ánh đô thị thông minh (Smart City), nơi mỗi quyết định thiết kế (như chặn spam SMS, che giấu danh tính người dùng) đều tác động trực tiếp đến an sinh xã hội.
- Em học được cách quản trị dự án, thiết lập môi trường (Environment Setup) để toàn bộ 5 thành viên có thể code độc lập, không vướng mắc rào cản kỹ thuật máy móc.
```

---

## 12. Bài học về sử dụng AI có trách nhiệm

Sau bài tập/project này, em/nhóm học được gì về việc sử dụng AI một cách minh bạch, có trách nhiệm?

```text
Sử dụng AI không phải là "nhờ AI làm bài hộ", mà là biến AI thành một "Bậc thầy phản biện" (Sparring Partner).
- Em học được nguyên tắc Decision Ownership (Làm chủ quyết định): AI có thể tạo ra hàng ngàn dòng code trong vài giây, nhưng người chịu trách nhiệm cuối cùng nếu hệ thống sập, dữ liệu bị rò rỉ hay trình duyệt bị treo chính là người Kỹ sư.
- Không phụ thuộc mù quáng: Đã rất nhiều lần giải pháp của AI (như dùng ST_Distance_Sphere, hay dùng react-window, hay dùng useState trên Map) trông có vẻ hoàn hảo nhưng lại tiềm ẩn thảm họa hiệu năng. Việc luôn giữ tư duy hoài nghi, tự mình đọc tài liệu chính thống và thử nghiệm thực tế là cách duy nhất để sử dụng AI một cách an toàn và có trách nhiệm.
```

---

## 13. Điều em/nhóm sẽ không làm khi sử dụng AI

Đánh dấu các cam kết phù hợp.

- [x] Không dùng AI để làm toàn bộ bài mà không hiểu nội dung.
- [x] Không nộp nguyên văn kết quả AI nếu chưa kiểm tra.
- [x] Không che giấu việc sử dụng AI trong các phần quan trọng.
- [x] Không dùng AI để tạo nội dung sai lệch hoặc gian lận.
- [x] Không dùng AI thay thế hoàn toàn quá trình học.
- [x] Không bỏ qua yêu cầu, rubric hoặc hướng dẫn của giảng viên.

---

## 14. Kế hoạch cải thiện lần sau

Lần sau em/nhóm sẽ sử dụng AI tốt hơn bằng cách nào?

```text
Sẽ yêu cầu AI thiết kế hệ thống với ràng buộc ngân sách 0 đồng (dùng đồ open-source), để AI không đưa ra các giải pháp lý thuyết quá xa vời thực tế sinh viên.
```

---

## 15. Tự đánh giá mức độ hoàn thành

Sinh viên/nhóm tự đánh giá theo thang 1-5.

| Tiêu chí | Điểm tự đánh giá 1-5 | Ghi chú |
|---|:---:|---|
| Ghi nhận việc dùng AI trung thực | 5 | Khai báo chi tiết trong AI_AUDIT_LOG |
| Prompt có mục tiêu rõ ràng | 4 | |
| Kiểm chứng kết quả AI | 5 | Dùng 4 tiêu chí đánh giá |
| Tự chỉnh sửa/cải tiến | 5 | |
| Hiểu nội dung đã nộp | 5 | |
| Reflection có chiều sâu | 5 | |
| Sử dụng AI có trách nhiệm | 5 | |

---

## 16. Câu hỏi tự vấn cuối bài

### 16.1. Nếu giảng viên hỏi về phần AI đã hỗ trợ, em/nhóm có giải thích lại được không?

```text
Có, nhóm hoàn toàn giải thích được 4 lỗ hổng kiến trúc và vì sao lại quyết định chọn Edge OCR hay Spatial Clustering.
```

### 16.2. Nếu không có AI, em/nhóm có thể tự làm lại phần quan trọng nhất không?

```text
Rất khó, vì đây là kinh nghiệm thực chiến từ các hệ thống lớn, sinh viên chưa thể tự nhận diện hết được nếu thiếu cố vấn chuyên gia (AI).
```

### 16.3. Phần nào trong bài thể hiện rõ nhất năng lực thật sự của em/nhóm?

```text
Việc phân tích tính khả thi và loại bỏ các gợi ý không phù hợp của AI, sau đó đề xuất phương án thay thế.
```

### 16.4. Em/nhóm muốn cải thiện kỹ năng nào sau bài này?

```text
Kỹ năng thiết kế Data Model cho Spatial Data và xử lý Concurrency (bất đồng bộ).
```

---

## 17. Cam kết Reflection

Em/nhóm cam kết rằng nội dung reflection này phản ánh trung thực quá trình sử dụng AI và quá trình học tập trong bài tập/project.

| Đại diện sinh viên/nhóm | Ngày xác nhận |
|---|---|
| Trần Minh Vĩ | 2026-08-02 |
