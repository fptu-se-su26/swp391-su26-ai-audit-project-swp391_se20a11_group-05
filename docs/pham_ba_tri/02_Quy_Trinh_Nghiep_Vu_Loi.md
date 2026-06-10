# TÀI LIỆU 2: QUY TRÌNH NGHIỆP VỤ LÕI (CORE BUSINESS WORKFLOW)
**Người viết/Trình bày:** Phạm Bá Trí

## 1. Mục tiêu
Xây dựng một đường dây chuyền xử lý phản ánh (Closed-loop Feedback Lifecycle) minh bạch, không để xảy ra tình trạng "đùn đẩy trách nhiệm" giữa các cơ quan ban ngành.

## 2. Kịch bản Vận hành Thực tế (State Machine)
### Bước 1: Tiếp nhận và Trí tuệ Nhân tạo (Citizen & AI)
1. Người dân (User) mở app, chụp ảnh đống rác hoặc vụ ẩu đả và miêu tả văn bản.
2. Hệ thống gửi dữ liệu cho AI (Gemini/Groq) để phân tích Ngữ nghĩa:
   - Trích xuất ra `Category` (Ví dụ: AN_NINH).
   - Trích xuất ra `Location` (Ví dụ: ward_id = Phường Nam Dương).
3. Hệ thống chuyển trạng thái thành `PENDING` và đẩy ticket thẳng về giao diện của Công an Phường Nam Dương.

### Bước 2: Rẽ nhánh Xử lý (Happy Path vs Edge Case)
- **Nhánh 1 - Chấp nhận (Happy Path):** Công an xác nhận đúng địa bàn, nhấn "Tiếp nhận" -> Trạng thái đổi thành `IN_PROGRESS`. Người dân nhận thông báo.
- **Nhánh 2 - Từ chối (Edge Case):** Công an phát hiện tọa độ nằm ở phường bên cạnh, nhấn "Từ chối" kèm lý do. Hệ thống tự động đẩy ticket về lại cho Trung tâm Điều hành 1022 (IOC) với trạng thái `REJECTED_BY_WARD`.

### Bước 3: Điều phối thủ công (Manual Dispatch)
- Các nhân viên tại IOC (Super Admin) sẽ đọc lý do từ chối, kiểm tra lại ranh giới GPS và bấm nút "Điều chuyển" (Re-assign) ticket sang cho đúng Phường chịu trách nhiệm.

### Bước 4: Hoàn thành và Chấm điểm KPI
- Lực lượng chức năng xuống hiện trường xử lý. Sau khi xong, chụp ảnh kết quả tải lên hệ thống và chuyển trạng thái thành `RESOLVED`.
- App của người dân rung lên, báo hoàn thành. Người dân xem ảnh và chấm điểm 1-5 sao.
- Số sao này sẽ tự động đổ về Dashboard của IOC để xếp hạng KPI thi đua cuối năm của từng xã phường.

## 3. Tại sao Workflow này lại tối ưu?
- **Giảm tải sức người:** Nhờ AI Auto-routing, IOC không cần phải ngồi đọc từng tin nhắn để chia việc.
- **Minh bạch hóa:** Mọi hành động Từ chối, Nhận việc, Xử lý đều có Audit Log ghi nhận chính xác Timestamp. Không ai có thể chối cãi.
