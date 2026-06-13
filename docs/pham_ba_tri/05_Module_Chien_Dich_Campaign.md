# TÀI LIỆU 5: THIẾT KẾ MODULE CHIẾN DỊCH CỘNG ĐỒNG (CAMPAIGN)
**Người viết/Trình bày:** Phạm Bá Trí

---

## 1. Tổng quan & Mục tiêu

Module Chiến dịch Cộng đồng áp dụng mô hình **Nhà nước - Xã hội Đồng quản trị
(Co-governance)**: Cơ quan công khai bài toán cần giải, Công dân có năng lực
tự nguyện nhận giải và chịu trách nhiệm có xác minh pháp lý.

Hệ thống vận hành theo **2 chiều song song**:

```
CHIỀU 1 (Top-down): Cơ quan → Liệt kê vấn đề → Dân xung phong giải quyết
CHIỀU 2 (Bottom-up): Dân/Tổ chức → Tự phát hiện → Tạo chiến dịch → Cơ quan duyệt
```

Đây chính xác là định hướng Chính quyền số Việt Nam giai đoạn 2025-2030.

---

## 2. Bảng Vấn đề Công khai (Government Problem Board)

Cơ quan chức năng (WARD_STAFF, ENVIRONMENT_COMPANY) đăng công khai các vấn đề
dân sinh mà họ thiếu nhân lực xử lý, mời cộng đồng cùng tham gia giải quyết.

### 2.1 Luồng nghiệp vụ Chiều 1

```
WARD_STAFF tạo "Vấn đề Cần Giải quyết"
        ↓
Hiển thị công khai trên trang "Bảng Vấn đề"
        ↓
Người dân/Tổ chức xem và bấm "Tôi muốn giải quyết vấn đề này"
        ↓
Hệ thống tự động tạo Draft Chiến dịch liên kết với vấn đề đó
        ↓
Người dân bổ sung thông tin + Nộp CCCD xác minh
        ↓
WARD_STAFF xét duyệt và Chấp thuận → Chiến dịch ACTIVE
```

### 2.2 Cấu trúc 1 Vấn đề được Liệt kê

- **Tiêu đề**: Ví dụ "Bãi rác tự phát đường Hoàng Diệu tồn tại 3 tháng".
- **Mô tả + Ảnh thực địa**: Cơ quan đã chụp, đã biết nhưng thiếu nhân lực.
- **Mức độ ưu tiên**: Khẩn cấp / Bình thường / Dài hạn.
- **Tài nguyên hỗ trợ từ cơ quan**: Phường cam kết cấp dụng cụ, xe tải sau khi
  hoàn thành (Đây là "mồi nhử" để dân chịu tham gia).
- **Deadline**: Cần giải quyết trước ngày nào.
- **Trạng thái vấn đề**:
  - OPEN: Chưa có ai nhận.
  - CLAIMED: Đã có chiến dịch nhận xử lý.
  - RESOLVED: Đã giải quyết xong.

### 2.3 Xử lý Vấn đề không có ai nhận sau 30 ngày

Hệ thống tự động cảnh báo IOC (Super Admin). IOC quyết định:
- Giao bắt buộc cho ENVIRONMENT_COMPANY xử lý, HOẶC
- Tăng mức tài nguyên hỗ trợ để thu hút người dân tham gia hơn.

---

## 3. Xác minh CCCD — Ai được tạo Chiến dịch?

Mọi người muốn TẠO (không phải tham gia) chiến dịch đều phải xác minh danh tính.
Có 2 loại người tạo với quy trình khác nhau:

### Loại 1: Cá nhân (Người dân thường)

**Yêu cầu nộp:**
- Ảnh mặt trước + mặt sau CCCD.
- Ảnh selfie cầm CCCD bên cạnh mặt.

**Kết quả xác minh thành công:**
- Tài khoản gắn nhãn vĩnh viễn: "Đã xác minh danh tính ✅"
- Không cần nộp lại ở chiến dịch sau.
- Giới hạn tổ chức: Tối đa 200 người/chiến dịch.

### Loại 2: Đại diện Tổ chức / Đoàn thể

**Yêu cầu nộp thêm:**
- CCCD của người đại diện (Như Loại 1).
- Quyết định thành lập tổ chức / Giấy phép hoạt động.
- Văn bản bổ nhiệm làm người đại diện (Ví dụ: Quyết định của UBND Phường
  bổ nhiệm làm Chủ tịch Hội Phụ nữ).

**Kết quả xác minh thành công:**
- Tài khoản gắn nhãn: "Tổ chức được chứng nhận 🏅"
- Chiến dịch được ưu tiên hiển thị nổi bật trên bảng tin.
- Không bị giới hạn 200 người — phù hợp các sự kiện quy mô lớn.

### Bảo mật dữ liệu CCCD (Bắt buộc)

- Ảnh CCCD KHÔNG lưu vào Database chung với các dữ liệu khác.
- Lưu riêng ở Encrypted Storage, chỉ Admin IOC có quyền giải mã xem.
- Sau khi xác minh xong → Gắn trạng thái verified = TRUE vào tài khoản
  và XÓA ảnh CCCD khỏi hệ thống để tuân thủ Luật Bảo vệ Dữ liệu cá nhân.
- Nếu DB bị hack, hacker cũng không lấy được ảnh CCCD của ai.

---

## 4. Tính năng Chi tiết Module Chiến dịch

### 4.1 Vòng đời 7 Trạng thái (Campaign Lifecycle)

```
DRAFT (Nháp — người tạo đang điền form)
   ↓ Bấm "Gửi duyệt"
PENDING_REVIEW (Chờ Admin xét duyệt CCCD + nội dung)
   ↓ Duyệt         ↘ Từ chối → REJECTED (Kèm lý do cụ thể)
SCHEDULED (Đã duyệt, chưa đến ngày — Mở đăng ký, chưa mở chat)
   ↓ Đến ngày giờ (Tự động)
ACTIVE (Đang diễn ra — Mở chat, nhận Check-in GPS)
   ↓ Hết giờ (Tự động)
ENDED (Kết thúc — Chờ người tạo nộp báo cáo 7 ngày)
   ↓ Nộp báo cáo + ảnh thực địa
COMPLETED (Hoàn thành — Tính Impact Score, cộng điểm VP)
```

### 4.2 Form Tạo Chiến dịch

- **Tên chiến dịch**: Tối đa 100 ký tự.
- **Liên kết vấn đề**: Tùy chọn liên kết với 1 vấn đề trong Bảng Vấn đề của cơ quan.
- **Mô tả chi tiết**: Rich Text (Đậm, In nghiêng, Gạch đầu dòng).
- **Ảnh bìa (Banner)**: 1 ảnh đại diện chính + Tối đa 5 ảnh phụ minh họa.
- **Địa điểm tập hợp**: Bắt buộc thả ghim trên bản đồ.
- **Thời gian**: Ngày/giờ bắt đầu và kết thúc.
- **Số lượng tham gia tối đa**: Cá nhân tối đa 200, Tổ chức không giới hạn.
- **Danh mục**: Môi trường / Hạ tầng / Nhân đạo / Giám sát đô thị.
- **Điều khoản Trách nhiệm**: Checkbox bắt buộc tích chọn (xem Mục 5).

### 4.3 Chat Real-time trong Chiến dịch

Mỗi chiến dịch có 1 phòng chat riêng biệt, chỉ mở khi trạng thái = ACTIVE.

**Quy tắc phòng chat:**
- Chỉ người đã nhấn "Đăng ký tham gia" mới vào được phòng chat.
- Người tạo chiến dịch = Admin phòng (Xóa tin nhắn, Kick người vi phạm).
- **Ẩn danh 2 lớp (Pseudonymous):** Hiển thị biệt danh theo cấu trúc
  "[Tính từ] + [Địa danh Đà Nẵng] + [Emoji]"
  Ví dụ: "Nhiệt Huyết Sơn Trà 🦅", "Kiên Trì Hội An 🏮".
  Hệ thống lưu danh tính thật phía sau. Chỉ Admin mới xem được tên thật.
  Biệt danh nhất quán trong 1 chiến dịch, reset khi sang chiến dịch mới.
- Lưu lịch sử chat vào Database (Người vào muộn đọc được lịch sử).

**Phân tầng trực quan trong phòng chat:**
- 👑 Huy hiệu vàng: Người tạo chiến dịch (Admin phòng).
- 🛡️ Huy hiệu xanh: Cán bộ phường đang giám sát.
- 🏅 Huy hiệu bạc: Đại diện Tổ chức được chứng nhận.
- 💬 Biệt danh thường: Tình nguyện viên bình thường.

**Tính năng nâng cao trong phòng chat:**
- Ghim tin nhắn quan trọng (Pinned Message — Tối đa 3 tin).
- Báo cáo nhanh từ thực địa (Ảnh + GPS tự động gắn vào tin nhắn dạng thẻ card).
- Bình chọn nhanh (Live Poll — Kết quả hiện theo thời gian thực).
- Tin nhắn hệ thống tự động (Ví dụ: "🎉 Cư dân Hội An 🏮 vừa Check-in thành công").
- Rate Limiting: Tối đa 5 tin/phút/người để chống spam.

**Đánh giá kỹ thuật (10 chiến dịch đồng thời):**
- 10 phòng = 10 Topic WebSocket độc lập.
- Mỗi phòng dưới 200 người → Tổng tối đa 2.000 kết nối đồng thời.
- In-Memory Broker của Spring Boot xử lý được 10.000+ kết nối đồng thời.
- KẾT LUẬN: Hoàn toàn ổn về mặt kỹ thuật với quy mô hiện tại.

### 4.4 Quản lý Người tham gia

- Danh sách người đăng ký (Xuất Excel để điểm danh thực tế).
- Check-in GPS: Phải đứng trong bán kính 500m mới xác nhận có mặt.
- Sau kết thúc: Hiện "Người đã thực sự tham gia" vs "Đăng ký nhưng vắng mặt".

### 4.5 Kết quả Chiến dịch (Impact Report)

Người tạo upload sau khi kết thúc (Deadline 7 ngày):
- Ảnh Before/After thực địa.
- Số liệu thực tế: Số người, khối lượng rác, km đường dọn sạch.
- Hệ thống tính "Impact Score" và cộng điểm Volunteer Points (VP).
- Nếu quá 7 ngày không nộp → COMPLETED tự động nhưng Impact Score = 0.

---

## 5. Trách nhiệm Pháp lý & Điều khoản

Khi gửi chiến dịch chờ duyệt, người tạo BẮT BUỘC tích chọn:

> "Tôi, [Tên thật từ CCCD], xác nhận chịu trách nhiệm tổ chức hoạt động này
> theo đúng quy định pháp luật hiện hành. Mọi tai nạn, rủi ro xảy ra trong
> quá trình hoạt động là trách nhiệm của người tổ chức."

Checkbox này được lưu kèm Timestamp và IP vào Database như một
**Hợp đồng điện tử (Digital Contract)** không thể phủ nhận.

---

## 6. Gamification — Hệ thống Điểm Tình nguyện (VP)

| Hành động | Điểm VP |
|---|---|
| Đăng ký tham gia chiến dịch | +5 VP |
| Check-in GPS tại thực địa | +20 VP |
| Gửi ảnh báo cáo thực địa | +10 VP/ảnh (tối đa 3) |
| Hoàn thành chiến dịch | +50 VP |
| Tổ chức chiến dịch được hoàn thành | +100 VP |
| Giải quyết vấn đề được cơ quan ủy thác | +200 VP (Bonus x2) |

**Danh hiệu tích lũy:**
- 🌱 Mầm xanh: Tham gia chiến dịch đầu tiên.
- 🌿 Người Bảo vệ Môi trường: Hoàn thành 5 chiến dịch Môi trường.
- 🦸 Anh hùng Cộng đồng: Tổ chức 3 chiến dịch được hoàn thành.
- ⭐ Đại sứ Phường: Top 3 điểm VP trong phường trong 1 tháng.

---

## 7. Tích hợp AI

- **Kiểm duyệt nội dung tự động**: AI quét nội dung trước khi chuyển sang
  hàng chờ duyệt của cán bộ. Lọc từ ngữ kích động, nội dung nhạy cảm.
  Cán bộ chỉ duyệt những chiến dịch đã qua lọc AI → Giảm 70% workload.
- **Gợi ý Chiến dịch liên quan**: Collaborative Filtering theo Category và Ward.
- **Tóm tắt Kết quả**: AI đọc chat + ảnh và tạo Biên bản tóm tắt tự động cho
  cán bộ phường lưu hồ sơ.

---

## 8. So sánh với Nền tảng Thương mại

| Tính năng | SmartCity Campaign | Meetup.com | Facebook Events |
|---|---|---|---|
| Kiểm duyệt CCCD | ✅ Có | ❌ Không | ❌ Không |
| Hợp đồng điện tử | ✅ Có | ❌ Không | ❌ Không |
| Cơ quan ủy thác vấn đề | ✅ Có | ❌ Không | ❌ Không |
| Chat Real-time | ✅ Có | ❌ Không | ⚠️ Hạn chế |
| Ẩn danh 2 lớp | ✅ Có | ❌ Không | ❌ Không |
| Check-in GPS | ✅ Có | ❌ Không | ❌ Không |
| Gamification VP | ✅ Có | ❌ Không | ❌ Không |
| Tích hợp Phản ánh | ✅ Có (Độc quyền) | ❌ Không | ❌ Không |

---

## 9. Nhược điểm & Rủi ro

| Rủi ro | Giải pháp |
|---|---|
| Nội dung xấu lọt vào | AI kiểm duyệt + Cán bộ duyệt 2 lớp |
| Đăng ký nhưng vắng mặt | Push Notification 24h + 1h trước + Check-in GPS |
| Chat bị spam | Rate Limit 5 tin/phút + Keyword Filter |
| Server restart mất kết nối chat | Frontend tự reconnect sau 3 giây |
| Lộ thông tin CCCD | Encrypted Storage + Xóa sau xác minh |
| Chiến dịch gây tai nạn | Hợp đồng điện tử + Điều khoản trách nhiệm |
| Không scale nhiều server | Nâng cấp RabbitMQ/Redis Pub/Sub trong tương lai |

---

## 10. Cấu trúc Database Cần Bổ sung

**Bảng civic_problems (Bảng Vấn đề Cơ quan):**
id, title, description, photo_urls, priority (URGENT/NORMAL/LONG_TERM),
support_resources, deadline, status (OPEN/CLAIMED/RESOLVED),
created_by (FK → users), ward_id (FK → wards), created_at.

**Bảng campaigns:**
id, title, description, banner_url, photo_urls, location (GEOMETRY Point),
start_time, end_time, max_participants, category, status (7 trạng thái),
civic_problem_id (FK → civic_problems, NULLABLE), organizer_type (INDIVIDUAL/ORGANIZATION),
cccd_verified (BOOLEAN), contract_accepted_at, contract_accepted_ip,
created_by (FK → users), ward_id (FK → wards), created_at.

**Bảng campaign_participants:**
id, campaign_id, user_id, registered_at, checked_in (BOOLEAN), checked_in_at,
pseudonym (Biệt danh được gắn cố định trong chiến dịch này).

**Bảng campaign_messages:**
id, campaign_id, sender_id (FK → users), pseudonym_display, content,
message_type (TEXT/FIELD_REPORT/SYSTEM/POLL), sent_at.

**Bảng identity_verifications (Lưu trạng thái xác minh — KHÔNG lưu ảnh CCCD):**
id, user_id, verified_at, verified_by (Admin), organizer_type, organization_name.
