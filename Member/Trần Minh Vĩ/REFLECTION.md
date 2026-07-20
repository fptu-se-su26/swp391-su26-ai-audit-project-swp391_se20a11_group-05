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

### Ví dụ 5: AI thiết kế giao diện Cổng Du khách tĩnh (Read-only UI)
- **AI đã gợi ý gì:** Thiết kế Cổng Du khách với các khối thông tin hiển thị danh bạ khẩn cấp dưới dạng text tĩnh để người dùng đọc.
- **Vì sao chưa phù hợp:** Khách du lịch sử dụng điện thoại khi đang di chuyển trên đường. Khi gặp nạn hoặc cần cứu hộ khẩn cấp, họ cần thao tác bấm để gọi ngay lập tức chứ không thể đọc số và ghi nhớ để gõ lại.
- **Phát hiện bằng cách nào:** Dùng Contextualization (bối cảnh hóa), đặt bản thân vào vị trí người bị nạn.
- **Cách sửa đổi:** Bổ sung ngay thẻ `href="tel:..."` để kích hoạt tính năng gọi điện trực tiếp, đồng thời tích hợp Mini Map vào tab thông tin để du khách định vị nhanh chóng.
- **Bài học rút ra:** Thiết kế UI không chỉ để cho đẹp (thẩm mỹ) mà phải nhắm tới khả năng tương tác (Actionable) và giải quyết nhu cầu tức thì của người dùng.

### Ví dụ 6: Gộp nhánh Git (Merge Conflict) bị lỗi do Tool Build tự động
- **AI đã gợi ý gì:** Khi tôi thắc mắc tại sao lệnh `git merge` bị lỗi đè file `routeTree.gen.ts`, AI giải thích do server Vite sinh tự động. AI gợi ý một số cách xóa file hoặc commit đè.
- **Vì sao chưa phù hợp:** Các công cụ build như Vite hoặc Webpack (ở chế độ watch/hot-reload) liên tục quét và sửa đổi hệ thống file ngầm. Việc cố gắng commit thủ công khi tiến trình vẫn đang chạy sẽ sinh ra lỗi liên hoàn (Merge Loop).
- **Phát hiện bằng cách nào:** Nhận thấy file `routeTree.gen.ts` cứ bị thay đổi trở lại sau mỗi vài giây ngay cả khi vừa dọn dẹp.
- **Cách sửa đổi:** Tắt triệt để nguyên nhân gốc: Sử dụng lệnh PowerShell `Stop-Process` để tắt mọi server Node/Vite đang chạy ẩn. Dùng `git filter-branch` xóa commit rác. Cuối cùng thực hiện gộp nhánh một cách an toàn.
- **Bài học rút ra:** Khi xử lý Git Conflict, phải đảm bảo toàn bộ các tiến trình build tự động đang chạy ngầm đã được tắt hoàn toàn để hệ thống file ở trạng thái tĩnh.

---

## 9. Phần đóng góp thật sự của sinh viên/nhóm

Mô tả rõ phần nào là đóng góp chính của sinh viên/nhóm, không phải chỉ copy từ AI.

```text
- Quyết định đưa cơ chế Spatial Clustering vào thiết kế hệ thống.
- Quyết định mã hóa danh tính công dân.
- Quyết định thiết lập GitHub Flow và quy trình phát triển API-First Development cho toàn bộ team.
- Quyết định cấu hình Thread Pool an toàn cho các tác vụ bất đồng bộ và tự triển khai thuật toán Rate Limiting chống DDoS cước phí SMS.
- Xây dựng tư duy Contextualization cho đặc thù TP Đà Nẵng.
- Quyết định tối biến Marker Leaflet động bằng CSS/HTML divIcon phân loại mức độ khẩn cấp (Đỏ, Cam, Xanh dương, Xanh lá) trên CivicMap.tsx.
- Xây dựng giải thuật trích xuất địa bàn từ dữ liệu thật để hiển thị các Tổ dân phố / Khu vực cần ưu tiên động.
- Cải biến giao diện tĩnh Cổng Du khách thành giao diện có tính tương tác cao (Actionable UI) với nút bấm gọi điện khẩn cấp.
- Đưa ra quyết định dừng hoàn toàn các tiến trình tự động (Vite server) trước khi xử lý xung đột Git để bảo vệ an toàn nhánh `main`.
```

---

## 10. So sánh trước và sau khi dùng AI

| Nội dung | Trước khi dùng AI | Sau khi dùng AI | Cải thiện đạt được |
|---|---|---|---|
| Hiểu yêu cầu | Tư duy làm app CRUD đơn giản | Nâng tầm thành hệ thống có kiến trúc chịu tải, bảo mật | Thay đổi toàn bộ tư duy thiết kế cốt lõi |
| Cộng tác nhóm | Phân chia việc mơ hồ, dễ xung đột code | Thống nhất API Contract, dùng GitHub Flow có review chéo | Triệt tiêu 90% lỗi git conflict, team làm việc song song mượt mà |
| Giao diện cán bộ | Giao diện cũ đơn giản, dùng chung Header/Footer của Citizen | Redesign độc lập, giao diện dashboard nghiệp vụ chuẩn chỉ, bản đồ trực quan | Trực quan hóa thông tin hiệu quả cho cán bộ ra quyết định |

---

## 11. Bài học về môn học

Sau bài tập/project này, em/nhóm học được gì về kiến thức môn học?

```text
Một đồ án sinh viên và phần mềm thực tế khác xa nhau nằm ở cách ta bảo vệ hệ thống trước dữ liệu lớn. Em hiểu sâu hơn về phần nghiệp vụ của trang web phản ánh đô thị.
```

---

## 12. Bài học về sử dụng AI có trách nhiệm

Sau bài tập/project này, em/nhóm học được gì về việc sử dụng AI một cách minh bạch, có trách nhiệm?

```text
Không phụ thuộc hoàn toàn vào giải pháp kỹ thuật AI đưa ra. Phải làm chủ quyết định (Decision Ownership), tự chịu trách nhiệm về tính khả thi của dự án và chọn lọc những gì phù hợp nhất.
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
