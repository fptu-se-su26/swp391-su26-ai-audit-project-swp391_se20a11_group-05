# AI Learning Reflection

## 1. Thông tin chung

| Thông tin | Nội dung |
|---|---|
| Môn học | Software Development Project |
| Mã môn học | SWP391 |
| Lớp | SE20A11 |
| Học kỳ | SU26 |
| Tên bài tập / Project | Hệ thống "Đà Nẵng Lắng Nghe" (The Listening City System) |
| Tên sinh viên / Nhóm | Nguyễn Hoàng Trọng / Nhóm 05 |
| MSSV / Danh sách MSSV | DE190357 |
| Giảng viên hướng dẫn | Lê Thiện Nhật Quang |
| Ngày hoàn thành reflection | 2026-07-15 |

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
Trong suốt quá trình phát triển phân hệ Police Dashboard (Bảng điều khiển của Công an), em đã sử dụng các công cụ AI (ChatGPT, Gemini, Claude, GitHub Copilot) hỗ trợ trong các giai đoạn thiết kế giao diện responsive với TailwindCSS, xây dựng khung API Spring Boot, thiết lập WebSockets cho thông báo thời gian thực và xử lý bản đồ nhiệt (Heatmap Map). AI giúp em viết nhanh các đoạn code giao diện thô và sửa các lỗi biên dịch TypeScript, tuy nhiên em luôn phải tự rà soát, tinh chỉnh CSS và cấu trúc logic để phù hợp với ngữ cảnh thực tế của dự án.
```

Gợi ý:

- Em/nhóm đã dùng AI ở giai đoạn nào?
- Dùng AI để hỗ trợ việc gì?
- Công cụ AI nào được sử dụng nhiều nhất?
- AI có giúp cải thiện chất lượng bài làm không?
- Có phần nào AI gợi ý nhưng em/nhóm không sử dụng không?

---

## 4. Công cụ AI đã sử dụng

Đánh dấu các công cụ AI đã sử dụng.

- [x] ChatGPT
- [x] Gemini
- [x] Claude
- [x] GitHub Copilot
- [ ] Cursor
- [x] Antigravity
- [ ] Microsoft Copilot
- [ ] Perplexity
- [ ] Công cụ khác: ....................................

### Công cụ được sử dụng nhiều nhất

```text
Gemini và ChatGPT là hai công cụ được sử dụng nhiều nhất trong dự án này.
```

### Lý do sử dụng công cụ đó

```text
ChatGPT hỗ trợ sinh các đoạn mã CSS/HTML thô nhanh chóng, trong khi Gemini có khả năng giải quyết các lỗi logic, hướng dẫn định tuyến Protected Routes và cấu hình WebSockets cho Spring Boot & React cực kỳ chính xác.
```

---

## 5. AI đã hỗ trợ em/nhóm ở điểm nào?

Đánh dấu các nội dung phù hợp.

- [x] Hiểu yêu cầu đề bài
- [x] Phân tích bài toán
- [x] Tìm ý tưởng giải pháp
- [ ] Thiết kế database
- [x] Thiết kế giao diện
- [x] Thiết kế kiến trúc hệ thống
- [x] Viết code mẫu
- [x] Debug lỗi
- [ ] Viết test case
- [x] Review code
- [x] Tối ưu code
- [ ] Kiểm tra bảo mật
- [ ] Viết báo cáo
- [ ] Chuẩn bị thuyết trình
- [x] Tìm hiểu công nghệ mới
- [ ] Khác: ....................................

### Mô tả chi tiết

```text
AI đã hỗ trợ đắc lực trong việc sinh các component React mẫu như Sidebar, HeaderProfile, các thẻ thống kê trực quan, cấu hình component bản đồ Leaflet Map, cung cấp khung kết nối WebSocket STOMP Client, và đề xuất các giải pháp lazy loading tối ưu hóa bundle size của Client.
```

---

## 6. AI có giúp em/nhóm học tốt hơn không?

### 6.1. Những điểm AI giúp em/nhóm học tốt hơn

```text
- Tăng tốc độ viết mã nguồn giao diện (TailwindCSS) và giảm thời gian thiết kế layout thô.
- Cung cấp các ví dụ cấu hình trực quan về WebSockets và API Call (Axios, React Query).
- Giúp giải nghĩa và sửa nhanh các mã lỗi biên dịch TypeScript/JavaScript.
- Học thêm được kỹ thuật tối ưu hóa hiệu năng tải trang thông qua React.lazy và Suspense.
```

### 6.2. Những điểm AI chưa giúp tốt hoặc gây khó khăn

```text
- AI đôi khi sinh mã nguồn sử dụng các thư viện bản đồ cũ, không tương thích với phiên bản React hiện tại.
- Gợi ý của AI về lưu lịch trực ban tự động khi blur chưa tối ưu và dễ gây lỗi lưu ghi đè dữ liệu ảo.
- Đôi khi gặp tình trạng sinh code trùng lặp thuộc tính hoặc định dạng kiểu TS không chuẩn gây lỗi build.
```

### 6.3. Em/nhóm có bị phụ thuộc vào AI không?

- [ ] Không phụ thuộc
- [x] Phụ thuộc ít
- [ ] Phụ thuộc trung bình
- [ ] Phụ thuộc nhiều

### Giải thích:

```text
Em chỉ dùng AI như một người trợ lý để tham khảo ý tưởng, cấu trúc code thô hoặc giải đáp lỗi. Toàn bộ logic nghiệp vụ thực tế, tối ưu hóa CSS, và đồng bộ dữ liệu API đều do em tự nghiên cứu và chịu trách nhiệm chính.
```

---

## 7. Em/nhóm đã kiểm tra kết quả AI như thế nào?

Đánh dấu các cách đã sử dụng.

- [x] Chạy thử chương trình
- [x] Kiểm tra output
- [ ] Viết test case
- [x] So sánh với yêu cầu đề bài
- [x] Đối chiếu với tài liệu môn học
- [x] Review code
- [ ] Hỏi lại giảng viên
- [x] Tra cứu tài liệu chính thống
- [x] Thảo luận với thành viên nhóm
- [ ] Kiểm tra bằng dữ liệu mẫu
- [x] So sánh trước và sau khi dùng AI
- [ ] Khác: ....................................

### Mô tả quá trình kiểm chứng

```text
Sau khi nhận code gợi ý từ AI, em chạy dev server cục bộ để xem hiển thị UI có đúng mong đợi hay không. Đồng thời sử dụng trình biên dịch TypeScript (npx tsc --noEmit) để kiểm tra tính đúng đắn của kiểu dữ liệu và rà soát thủ công các thẻ linter trước khi thực hiện commit mã nguồn.
```

### Ví dụ cụ thể về một lần kiểm chứng

| Nội dung | Mô tả |
|---|---|
| AI đã gợi ý gì? | Gợi ý sử dụng component `Map` từ Lucide-React để hiển thị bản đồ. |
| Em/nhóm đã kiểm tra bằng cách nào? | Chạy dev server và quan sát thấy lỗi xung đột tên `Map` với hàm khởi tạo `new google.maps.Map`. |
| Kết quả kiểm tra | Sai/Cần chỉnh sửa |
| Em/nhóm đã xử lý tiếp như thế nào? | Chuyển sang sử dụng alias import: `import { Map as MapIcon } from 'lucide-react'` để tách biệt hai định nghĩa này. |

---

## 8. Ví dụ AI gợi ý sai hoặc chưa phù hợp

Ghi lại ít nhất một ví dụ nếu có.

| Nội dung | Mô tả |
|---|---|
| AI đã gợi ý gì? | Gợi ý tự động lưu lịch trực ban ngay khi cán bộ nhấp chuột ra ngoài (blur). |
| Vì sao gợi ý đó sai/chưa phù hợp? | Cơ chế này dễ dẫn đến việc lưu các thay đổi nhầm lẫn ngoài ý muốn của cán bộ và làm tăng số lượng API request không cần thiết lên server. |
| Em/nhóm phát hiện bằng cách nào? | Kiểm thử thực tế trên giao diện, thấy thao tác nhập liệu lịch rất dễ bị kích hoạt lưu sai dữ liệu. |
| Em/nhóm đã sửa như thế nào? | Thiết kế nút "Save Changes" rõ ràng để yêu cầu cán bộ xác nhận lưu dữ liệu chủ động. |
| Bài học rút ra | Luôn đặt trải nghiệm người dùng thực tế và tính toàn vẹn dữ liệu lên hàng đầu thay vì áp dụng máy móc giải pháp tự động của AI. |

---

## 9. Phần đóng góp thật sự của sinh viên/nhóm

Mô tả rõ phần nào là đóng góp chính của sinh viên/nhóm, không phải chỉ copy từ AI.

```text
- Tự thiết kế và căn chỉnh toàn bộ giao diện Sidebar, Profile tối ưu trên thiết bị di động.
- Viết CSS tùy biến hiệu ứng lá cờ Việt Nam bay vẫy ở header.
- Tự thiết kế logic hiển thị inline của trang chi tiết phản ánh ngay trong bảng điều khiển thay vì chuyển hướng trang để giữ nguyên context cho cán bộ công an.
- Rà soát, dọn dẹp các cảnh báo TS và kiểu "any" thô để tăng độ tin cậy của code.
```

---

## 10. So sánh trước và sau khi dùng AI

| Nội dung | Trước khi dùng AI | Sau khi dùng AI | Cải thiện đạt được |
|---|---|---|---|
| Hiểu yêu cầu | Hiểu nghiệp vụ cơ bản nhưng chưa rõ cách triển khai kỹ thuật | Nắm bắt nhanh các module cần thiết thông qua cấu trúc gợi ý | Rõ ràng hóa các bước triển khai |
| Phân tích bài toán | Tốn nhiều thời gian phân tách các component | Chia nhỏ các component nhanh chóng | Tăng tốc độ phân tích |
| Thiết kế giải pháp | Khó khăn khi thiết kế bản đồ nhiệt và WebSockets | Có ngay khung sườn cấu trúc WebSockets STOMP | Giải pháp kỹ thuật hoàn thiện hơn |
| Code/Implementation | Viết code boilerplate thủ công rất chậm | Sinh code giao diện thô nhanh để tập trung vào logic nghiệp vụ | Tăng 50% năng suất viết code |
| Debug/Testing | Debug thủ công tốn thời gian với lỗi TS phức tạp | AI chỉ ra nguyên nhân lỗi biên dịch trong vài giây | Rút ngắn thời gian fix bug |
| Báo cáo/Thuyết trình | Tốn thời gian định dạng và chau chuốt câu từ | Báo cáo mạch lạc và có cấu trúc chuẩn hơn | Báo cáo chuyên nghiệp hơn |
| Làm việc nhóm | Đồng bộ code đôi khi gặp conflict | Xử lý merge nhánh mượt mà hơn | Làm việc nhóm trơn tru |

---

## 11. Bài học về môn học

Sau bài tập/project này, em/nhóm học được gì về kiến thức môn học?

```text
- Nắm vững kiến trúc phát triển ứng dụng web React với TypeScript và Spring Boot backend.
- Hiểu rõ cách hoạt động của giao thức WebSockets thời gian thực và cách tích hợp bản đồ số (Leaflet/Google Maps) vào ứng dụng đô thị thông minh.
- Ý thức rõ tầm quan trọng của việc quản lý lịch sử phát triển dự án (Changelog, Prompt Log, Audit Log).
```

---

## 12. Bài học về sử dụng AI có trách nhiệm

Sau bài tập/project này, em/nhóm học được gì về việc sử dụng AI một cách minh bạch, có trách nhiệm?

```text
- Tuyệt đối không copy-paste mù quáng code AI sinh ra mà không hiểu rõ bản chất.
- Phải luôn kiểm chứng hiệu năng, bảo mật và tính đúng đắn của code.
- Ghi nhận và khai báo trung thực mọi sự trợ giúp từ các công cụ AI để đảm bảo đạo đức học thuật.
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

### Giải thích thêm nếu có

```text
Sử dụng AI như một người bạn đồng hành hỗ trợ học tập, không coi AI là công cụ làm bài hộ.
```

---

## 14. Kế hoạch cải thiện lần sau

Lần sau em/nhóm sẽ sử dụng AI tốt hơn bằng cách nào?

```text
- Viết prompt đi kèm ngữ cảnh code chi tiết và các ràng buộc nghiệp vụ rõ ràng hơn.
- Nhờ AI phân tích sâu hơn về các lỗ hổng bảo mật (như IDOR/BOLA) trước khi code.
- Ghi nhận nhật ký sử dụng AI thường xuyên hơn ngay sau mỗi buổi làm việc thay vì ghi dồn vào cuối kỳ.
```

---

## 15. Tự đánh giá mức độ hoàn thành

Sinh viên/nhóm tự đánh giá theo thang 1-5.

| Tiêu chí | Điểm tự đánh giá 1-5 | Ghi chú |
|---|:---:|---|
| Ghi nhận việc dùng AI trung thực | 5 | Đạt yêu cầu |
| Prompt có mục tiêu rõ ràng | 5 | Đạt yêu cầu |
| Kiểm chứng kết quả AI | 5 | Đạt yêu cầu |
| Tự chỉnh sửa/cải tiến | 5 | Đạt yêu cầu |
| Hiểu nội dung đã nộp | 5 | Đạt yêu cầu |
| Reflection có chiều sâu | 5 | Đạt yêu cầu |
| Sử dụng AI có trách nhiệm | 5 | Đạt yêu cầu |

---

## 16. Câu hỏi tự vấn cuối bài

### 16.1. Nếu giảng viên hỏi về phần AI đã hỗ trợ, em/nhóm có giải thích lại được không?

```text
Hoàn toàn giải thích được, vì em đã rà soát, kiểm chứng và nắm rõ từng dòng code React/TypeScript được đưa vào hệ thống.
```

### 16.2. Nếu không có AI, em/nhóm có thể tự làm lại phần quan trọng nhất không?

```text
Có thể tự làm lại được, mặc dù sẽ tốn nhiều thời gian hơn để tra cứu cú pháp và cấu hình Leaflet/WebSockets thủ công.
```

### 16.3. Phần nào trong bài thể hiện rõ nhất năng lực thật sự của em/nhóm?

```text
Phần xử lý hiển thị inline chi tiết phản ánh giữ nguyên ngữ cảnh làm việc và thiết kế tối ưu hóa responsive layout của trang Police Dashboard.
```

### 16.4. Em/nhóm muốn cải thiện kỹ năng nào sau bài này?

```text
Muốn nâng cao kỹ năng tối ưu hóa hiệu năng ứng dụng (performance profiling) và viết các test cases kiểm thử tự động toàn diện.
```

---

## 17. Cam kết Reflection

Em/nhóm cam kết rằng nội dung reflection này phản ánh trung thực quá trình sử dụng AI và quá trình học tập trong bài tập/project.

Sinh viên/nhóm hiểu rằng:

- AI là công cụ hỗ trợ học tập, không thay thế hoàn toàn năng lực cá nhân.
- Mọi kết quả AI gợi ý cần được kiểm tra trước khi sử dụng.
- Sinh viên/nhóm chịu trách nhiệm với sản phẩm cuối cùng.
- Sinh viên/nhóm cần giải thích được các phần đã nộp.

| Đại diện sinh viên/nhóm | Ngày xác nhận |
|---|---|
| Nguyễn Hoàng Trọng | 2026-07-15 |
