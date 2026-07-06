# AI Learning Reflection

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
| Ngày hoàn thành reflection |  |

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
Trong lần cập nhật số 2, nhóm tập trung xử lý một chức năng lớn:
người dân gửi phản ánh kèm ảnh/video (yêu cầu video > 10 giây),
đồng thời đảm bảo backend khớp template frontend đang có.

AI được dùng chủ yếu để:
- rà soát độ tương thích API giữa backend và frontend,
- đề xuất các class còn thiếu cho use case media,
- hỗ trợ phát hiện rủi ro merge vào product branch.
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
- [ ] Claude
- [ ] GitHub Copilot
- [ ] Cursor
- [x] Antigravity
- [ ] Microsoft Copilot
- [ ] Perplexity
- [ ] Công cụ khác: ....................................

### Công cụ được sử dụng nhiều nhất

```text
Chat GPT
```

### Lý do sử dụng công cụ đó

```text
Viết tại đây...
```

---

## 5. AI đã hỗ trợ em/nhóm ở điểm nào?

Đánh dấu các nội dung phù hợp.

- [ ] Hiểu yêu cầu đề bài
- [ ] Phân tích bài toán
- [ ] Tìm ý tưởng giải pháp
- [ ] Thiết kế database
- [ ] Thiết kế giao diện
- [ ] Thiết kế kiến trúc hệ thống
- [ ] Viết code mẫu
- [ ] Debug lỗi
- [ ] Viết test case
- [ ] Review code
- [ ] Tối ưu code
- [ ] Kiểm tra bảo mật
- [ ] Viết báo cáo
- [ ] Chuẩn bị thuyết trình
- [ ] Tìm hiểu công nghệ mới
- [ ] Khác: ....................................

### Mô tả chi tiết

```text
AI hỗ trợ rõ nhất ở phần:
1) Chuẩn hóa luồng API feedback để không làm vỡ flow cũ.
2) Bổ sung phần media upload theo hướng tách lớp rõ ràng (controller/service/repository/dto).
3) Nhắc kiểm chứng bằng compile sau khi chỉnh sửa.
```

---

## 6. AI có giúp em/nhóm học tốt hơn không?

### 6.1. Những điểm AI giúp em/nhóm học tốt hơn

```text
Điểm cải thiện rõ:
- Tương thích backend/frontend tốt hơn do endpoint và payload đồng nhất.
- Có thêm cấu trúc class chuẩn cho use case media.
- Giảm rủi ro merge nhờ kiểm tra compile trước khi push.
```

Gợi ý:

- Hiểu bài nhanh hơn.
- Có thêm ví dụ minh họa.
- Biết cách debug lỗi.
- Biết thêm cách tổ chức code.
- Biết thêm cách thiết kế giải pháp.
- Biết cách viết test case.
- Biết cách cải thiện báo cáo hoặc slide.

### 6.2. Những điểm AI chưa giúp tốt hoặc gây khó khăn

```text
Khó khăn còn gặp:
- Frontend template hiện tại chưa gửi đầy đủ categoryId trong mọi trường hợp.
- Khi cập nhật endpoint có thể phát sinh sai lệch nhỏ ở helper frontend nếu patch chồng.
- Cần thời gian kiểm tra thủ công thêm cho luồng upload thực tế với Supabase.
```

Gợi ý:

- AI trả lời sai.
- AI sinh code không chạy.
- AI hiểu sai yêu cầu đề bài.
- AI đưa giải pháp quá phức tạp.
- AI thiếu ngữ cảnh môn học.
- AI trả lời chung chung.
- AI khiến em/nhóm dễ phụ thuộc.

### 6.3. Em/nhóm có bị phụ thuộc vào AI không?

- [ ] Không phụ thuộc
- [ ] Phụ thuộc ít
- [ ] Phụ thuộc trung bình
- [ ] Phụ thuộc nhiều

Giải thích:

```text
Mức phụ thuộc AI: trung bình.
Nhóm dùng AI để tăng tốc phân tích và kiểm tra compatibility,
nhưng phần quyết định kiến trúc, chỉnh sửa cuối cùng và kiểm chứng build vẫn do nhóm thực hiện.
```

---

## 7. Em/nhóm đã kiểm tra kết quả AI như thế nào?

Đánh dấu các cách đã sử dụng.

- [ ] Chạy thử chương trình
- [ ] Kiểm tra output
- [ ] Viết test case
- [ ] So sánh với yêu cầu đề bài
- [ ] Đối chiếu với tài liệu môn học
- [ ] Review code
- [ ] Hỏi lại giảng viên
- [ ] Tra cứu tài liệu chính thống
- [ ] Thảo luận với thành viên nhóm
- [ ] Kiểm tra bằng dữ liệu mẫu
- [ ] So sánh trước và sau khi dùng AI
- [ ] Khác: ....................................

### Mô tả quá trình kiểm chứng

```text
Quy trình kiểm chứng đã dùng:
- So khớp endpoint và response shape với frontend template.
- Review lại các file thay đổi trước khi commit.
- Chạy `mvn -q -DskipTests compile` để xác nhận backend build pass.
- Đối chiếu commit theo từng nhóm thay đổi để dễ trace khi review.
```

### Ví dụ cụ thể về một lần kiểm chứng

| Nội dung | Mô tả |
|---|---|
| AI đã gợi ý gì? | Đề xuất thêm endpoint media, class DTO/repository/service và chuẩn hóa compatibility với frontend template |
| Em/nhóm đã kiểm tra bằng cách nào? | So khớp API với file frontend + compile backend |
| Kết quả kiểm tra | Cần chỉnh sửa |
| Em/nhóm đã xử lý tiếp như thế nào? | Sửa endpoint helper frontend, xử lý categoryId optional, compile lại đến khi pass |

---

## 8. Ví dụ AI gợi ý sai hoặc chưa phù hợp

Ghi lại ít nhất một ví dụ nếu có.

| Nội dung | Mô tả |
|---|---|
| AI đã gợi ý gì? |  |
| Vì sao gợi ý đó sai/chưa phù hợp? |  |
| Em/nhóm phát hiện bằng cách nào? |  |
| Em/nhóm đã sửa như thế nào? |  |
| Bài học rút ra |  |

Nếu không có trường hợp AI gợi ý sai, hãy ghi rõ:

```text
Trong quá trình thực hiện, em/nhóm chưa ghi nhận trường hợp AI gợi ý sai nghiêm trọng. Tuy nhiên, em/nhóm vẫn kiểm tra lại kết quả AI trước khi sử dụng.
```

---

## 9. Phần đóng góp thật sự của sinh viên/nhóm

Mô tả rõ phần nào là đóng góp chính của sinh viên/nhóm, không phải chỉ copy từ AI.

```text
Phần đóng góp chính của nhóm:
- Xác định hướng tích hợp không phá vỡ flow cũ.
- Tự chuẩn hóa logic service theo payload thực tế frontend.
- Tự sửa mismatch endpoint và lỗi trùng lệnh fetch.
- Tự kiểm tra build và tổ chức commit nhỏ để dễ review nhóm.
```

Gợi ý:

- Tự phân tích yêu cầu.
- Tự chọn giải pháp.
- Tự chỉnh sửa code.
- Tự kiểm tra output.
- Tự thiết kế logic.
- Tự sửa lỗi.
- Tự viết báo cáo theo hiểu biết của mình.
- Tự đánh giá ưu/nhược điểm của sản phẩm.
- Tự thuyết trình và giải thích sản phẩm.

---

## 10. So sánh trước và sau khi dùng AI

| Nội dung | Trước khi dùng AI | Sau khi dùng AI | Cải thiện đạt được |
|---|---|---|---|
| Hiểu yêu cầu |  |  |  |
| Phân tích bài toán |  |  |  |
| Thiết kế giải pháp |  |  |  |
| Code/Implementation |  |  |  |
| Debug/Testing |  |  |  |
| Báo cáo/Thuyết trình |  |  |  |
| Làm việc nhóm |  |  |  |

---

## 11. Bài học về môn học

Sau bài tập/project này, em/nhóm học được gì về kiến thức môn học?

```text
Bài học chuyên môn:
- Khi làm fullstack nhóm, chuẩn API contract quan trọng hơn tối ưu sớm.
- Một chức năng lớn nên tách lớp rõ (controller/service/repository/dto) để dễ bảo trì.
- Validate dữ liệu nên bám payload thực tế frontend đang gửi.
```

Gợi ý:

- Kiến thức kỹ thuật đã hiểu rõ hơn.
- Kỹ năng lập trình đã cải thiện.
- Cách thiết kế hệ thống.
- Cách kiểm thử.
- Cách phân tích yêu cầu.
- Cách làm việc nhóm.
- Cách giải quyết lỗi.
- Cách trình bày sản phẩm.
- Cách đọc và hiểu tài liệu kỹ thuật.

---

## 12. Bài học về sử dụng AI có trách nhiệm

Sau bài tập/project này, em/nhóm học được gì về việc sử dụng AI một cách minh bạch, có trách nhiệm?

```text
Bài học về AI có trách nhiệm:
- AI chỉ nên là công cụ hỗ trợ phân tích và tăng tốc.
- Mọi gợi ý của AI phải được kiểm tra bằng build/test thực tế.
- Cần ghi nhận minh bạch phần nào dùng AI và phần nào nhóm tự quyết định/chỉnh sửa.
```

Gợi ý:

- Không nên copy nguyên kết quả AI.
- Cần kiểm tra lại mọi kết quả AI.
- Cần hiểu nội dung trước khi nộp.
- Cần ghi nhận việc sử dụng AI.
- Cần biết AI có thể sai.
- Cần tự chịu trách nhiệm với sản phẩm cuối cùng.
- Cần dùng AI như công cụ hỗ trợ học tập, không thay thế hoàn toàn việc học.

---

## 13. Điều em/nhóm sẽ không làm khi sử dụng AI

Đánh dấu các cam kết phù hợp.

- [ ] Không dùng AI để làm toàn bộ bài mà không hiểu nội dung.
- [ ] Không nộp nguyên văn kết quả AI nếu chưa kiểm tra.
- [ ] Không che giấu việc sử dụng AI trong các phần quan trọng.
- [ ] Không dùng AI để tạo nội dung sai lệch hoặc gian lận.
- [ ] Không dùng AI thay thế hoàn toàn quá trình học.
- [ ] Không bỏ qua yêu cầu, rubric hoặc hướng dẫn của giảng viên.

### Giải thích thêm nếu có

```text
Lần sau nhóm sẽ:
- Chủ động chốt API contract sớm giữa frontend-backend.
- Viết checklist verify sau mỗi thay đổi lớn (endpoint, payload, compile, smoke test).
- Ghi log prompt/commit đồng bộ ngay trong ngày để dễ truy vết.
```

---

## 14. Kế hoạch cải thiện lần sau

Lần sau em/nhóm sẽ sử dụng AI tốt hơn bằng cách nào?

```text
Viết tại đây...
```

Gợi ý:

- Viết prompt rõ hơn.
- Cung cấp nhiều ngữ cảnh hơn cho AI.
- Không hỏi AI làm toàn bộ bài.
- Tập trung hỏi AI giải thích, gợi ý, review.
- Tự kiểm tra kỹ hơn.
- Ghi log thường xuyên hơn.
- Liên kết log với commit/screenshot rõ hơn.
- Thảo luận với nhóm trước khi áp dụng kết quả AI.
- Đối chiếu kết quả AI với tài liệu môn học.

---

## 15. Tự đánh giá mức độ hoàn thành

Sinh viên/nhóm tự đánh giá theo thang 1-5.

| Tiêu chí | Điểm tự đánh giá 1-5 | Ghi chú |
|---|:---:|---|
| Ghi nhận việc dùng AI trung thực |  |  |
| Prompt có mục tiêu rõ ràng |  |  |
| Kiểm chứng kết quả AI |  |  |
| Tự chỉnh sửa/cải tiến |  |  |
| Hiểu nội dung đã nộp |  |  |
| Reflection có chiều sâu |  |  |
| Sử dụng AI có trách nhiệm |  |  |

---

## 16. Câu hỏi tự vấn cuối bài

Trả lời ngắn gọn các câu hỏi sau.

### 16.1. Nếu giảng viên hỏi về phần AI đã hỗ trợ, em/nhóm có giải thích lại được không?

```text
Viết tại đây...
```

### 16.2. Nếu không có AI, em/nhóm có thể tự làm lại phần quan trọng nhất không?

```text
Viết tại đây...
```

### 16.3. Phần nào trong bài thể hiện rõ nhất năng lực thật sự của em/nhóm?

```text
Viết tại đây...
```

### 16.4. Em/nhóm muốn cải thiện kỹ năng nào sau bài này?

```text
Viết tại đây...
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
|  |  |

## Bổ sung reflection cho lần sử dụng AI số 4

```text
Ở lần sử dụng AI số 4, nhóm dùng AI theo hướng tự học và tự đối chiếu thiết kế, không yêu cầu AI làm thay toàn bộ chức năng.
Vấn đề cần giải quyết là cải thiện bảo mật đăng nhập bằng progressive login lockout và SMS OTP,
đồng thời tránh nhầm lẫn giữa cổng đăng nhập của người dân và cổng đăng nhập của cán bộ.

AI giúp nhóm nhìn rõ các phần cần phân tích:
- dữ liệu nào cần lưu thêm trong bảng users,
- AuthService nên kiểm tra lockout và OTP theo thứ tự nào,
- khi nào cần reset trạng thái đăng nhập sai,
- frontend nên hiển thị thời gian khóa như thế nào,
- role guard cần redirect về portal nào,
- test case nào cần có để chứng minh logic đúng.

Điểm nhóm học được là một chức năng bảo mật nhỏ thường liên quan nhiều lớp của hệ thống:
database, entity, service, controller, frontend state, routing, logout flow và unit test.
Nếu chỉ sửa một nơi thì rất dễ tạo lỗi phụ, ví dụ tài khoản cán bộ bị chuyển về /login,
hoặc user đã xác minh OTP nhưng trạng thái loginOtpRequired không được reset.

Nhóm vẫn phải tự quyết định cách triển khai cuối cùng:
dùng lockout theo từng tài khoản, thêm helper redirect theo role, giữ thông báo lỗi ở mức chung để giảm lộ thông tin,
và viết test kiểm chứng từng stage. Vì vậy AI đóng vai trò như công cụ gợi ý và phản biện,
còn trách nhiệm hiểu code, chỉnh sửa và kiểm chứng vẫn thuộc về nhóm.
```

### Cập nhật mục kiểm chứng kết quả AI

```text
Nhóm kiểm chứng kết quả AI bằng cách:
- đọc lại diff của các file backend/frontend liên quan đến auth,
- đối chiếu schema mới với User entity và migration,
- viết test cho từng stage khóa đăng nhập,
- kiểm tra luồng verify SMS OTP có reset trạng thái lockout,
- kiểm tra redirect giữa /login và /authority-login theo role,
- chuẩn bị chạy build/test trước khi merge.
```

### Cập nhật mục hạn chế/rủi ro

```text
Rủi ro còn lại:
- Cần kiểm tra thực tế SMS OTP với số điện thoại thật hoặc môi trường giả lập.
- Cần chạy lại full backend test để đảm bảo thay đổi AuthService không ảnh hưởng các flow đăng nhập khác.
- Cần kiểm tra thủ công frontend countdown để đảm bảo message backend được parse đúng.
- Cần đảm bảo migration V7 chạy ổn trên database đã có dữ liệu cũ.
```

## Bổ sung reflection cho lần sử dụng AI số 7 và số 8

```text
Tại các lần sử dụng AI số 7 và số 8, nhóm tập trung giải quyết các cải tiến nghiệp vụ quan trọng liên quan đến Hệ thống Điểm danh (Tách biệt trạng thái duyệt và kết quả điểm danh) và Hồ sơ tham gia của Tình nguyện viên.

AI đóng vai trò gợi ý và phản biện đắc lực:
- Đề xuất câu truy vấn JPA có toán tử OR để tự động gom nhóm cả dữ liệu vắng mặt lịch sử (trạng thái NO_SHOW) và dữ liệu mới (APPROVED + attended = false).
- Đề xuất cấu trúc hiển thị dạng drill-down, click-to-expand để xem chi tiết lý do vắng mặt mà không làm giao diện bị rối.

Nhóm đã chủ động phản biện và thực hiện cải tiến bảo mật sâu sắc:
- Giữ lại thông tin lịch sử cán bộ duyệt (approvedBy, approvedAt) của các chiến dịch đã vắng mặt thay vì xóa trắng, đảm bảo tính năng kiểm toán hệ thống (Audit) hoạt động chính xác.
- Triển khai phân quyền truy cập dữ liệu ở tầng Service (existsByCitizenIdAndWardId), đảm bảo cán bộ phường chỉ xem được hồ sơ hoạt động của công dân thuộc phạm vi địa bàn quản lý, chặn đứng hoàn toàn rủi ro IDOR/BOLA.
- Tối ưu hóa UI React: tự code logic so sánh định dạng ngày giờ chuẩn tiếng Việt, bỏ qua các thư viện trung gian để giảm dung lượng bundle size.
```

### Cập nhật mục kiểm chứng kết quả AI (Lần 7 & 8)

```text
Kiểm chứng tính đúng đắn qua các bước:
- Chạy biên dịch toàn bộ backend (mvn compile), xác nhận các Mapper và Repository JPA không gặp lỗi cú pháp.
- Chạy type-check frontend (npx tsc --noEmit) xác nhận các kiểu dữ liệu DTO/API mới được đồng bộ 100%.
- Kiểm tra tính tương thích ngược của tab lọc tại màn hình chi tiết chiến dịch trên frontend đối với cả hai trạng thái vắng mặt cũ và mới.
```

### Cập nhật mục hạn chế/rủi ro (Lần 7 & 8)

```text
Hạn chế & Rủi ro:
- Dữ liệu lịch sử cũ (trước khi decouple) thiếu trường attended = false và attendedAt nên việc thống kê đếm số lần vắng mặt phải phụ thuộc hoàn toàn vào query tương thích ngược. Cần đảm bảo không có bản ghi nào bị tính lặp hoặc sót.
- Việc kiểm tra bảo mật ở lớp service cần được bổ sung Integration Test để tự động phát hiện nếu có sự thay đổi phân quyền ở tương lai.
```
