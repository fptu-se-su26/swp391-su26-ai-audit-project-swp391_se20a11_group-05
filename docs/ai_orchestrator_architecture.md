# Kiến Trúc AI Orchestrator: Hướng Dẫn & Cơ Chế Hoạt Động Chi Tiết

> Tài liệu phân tích chuyên sâu các cột trụ kỹ thuật của AI Orchestrator (`AiRouterService`) và luồng phê duyệt phản ánh đô thị thực tế.

---

## 1. SƠ ĐỒ PHỐI HỢP TOÀN DIỆN (COORDINATION FLOW - CÁCH 3)

Dưới đây là sơ đồ luồng hoạt động tích hợp cơ chế **Duyệt tay (Human-in-the-loop)**: AI chỉ làm nhiệm vụ lọc thô (Toxicity) và phân loại lĩnh vực (Domain Routing), không tự ý hủy đơn bằng điểm tin cậy (`trust_score`). Tất cả đơn hợp lệ sẽ được chuyển sang trạng thái `PENDING_RECEIVE` chờ cán bộ nhấn nút tiếp nhận thủ công.

```mermaid
flowchart TD
    %% Khởi tạo request
    Start([Yêu cầu phân tích từ Client]) --> Guardrail[1. ContentGuardrailService\n- Lọc Regex thô SĐT, CCCD\n- Normalize Unicode & Leet-speak\n- Rate limit block spam]
    
    Guardrail -->|Vi phạm| Reject[Từ chối ngay lập tức\nNém SecurityException]
    Guardrail -->|An toàn| Router[2. AiRouterService\n- Định tuyến Complexity Score\n- Quản lý Sticky Session]

    %% Tách luồng: Streaming vs Blocking vs Speculative Racing
    Router --> ModeDecision{Lựa chọn chế độ?}
    
    %% Chế độ Speculative Racing (Đua song song)
    ModeDecision -->|Speculative Racing| RaceService[3. SpeculativeRacingService\nGọi song song Groq & Gemini]
    RaceService --> KeySelect1[Gọi Key Pool lấy key ACTIVE ít dùng nhất]
    KeySelect1 --> DB_Call1[Gửi request song song]
    DB_Call1 --> Winner{Ai trả về trước?}
    Winner -->|Groq thắng| CancelGemini[Cancel Gemini task ngay lập tức\nGiải phóng thread & token]
    Winner -->|Gemini thắng| CancelGroq[Cancel Groq task ngay lập tức\nGiải phóng thread & token]
    
    %% Chế độ Gọi đơn lẻ (executeWithFallback)
    ModeDecision -->|Gọi đơn lẻ| KeySelect2["4. Key Pool (Groq/Gemini KeyPool)\n- Chọn key ACTIVE theo Least-Used\n- Rate limit 429 → Đưa key vào COOLING 60s"]
    KeySelect2 --> CBCheck["5. Circuit Breaker (Resilience4j)"]
    
    CBCheck -->|OPEN| TriggerFallback[Kích hoạt Fallback sang AI dự phòng]
    CBCheck -->|CLOSED / HALF-OPEN| ExecRequest[Gửi request tới API]
    
    %% Xử lý kết quả & Self-Correction
    ExecRequest & CancelGemini & CancelGroq --> ValidateJSON["6. OutputValidator\nKhớp JSON Schema?"]
    ValidateJSON -->|Không khớp & < 3 lần| SelfCorrection["7. Self-Correction\nGửi kèm lỗi JSON bắt AI sửa lại"]
    SelfCorrection --> ExecRequest
    
    %% AI Phân loại & Chuyển luồng duyệt thủ công (Cách 3)
    ValidateJSON -->|Hợp lệ| ToxicCheck{"8. Lọc Toxic: is_toxic = true?"}
    ToxicCheck -->|Có & Không khẩn cấp| Reject_AI[9. Từ chối - Status = REJECTED\nNotify ngôn từ vi phạm]
    
    ToxicCheck -->|Không độc hại| PII_Mask[10. PII Masking: Che SĐT/CCCD trong mô tả]
    PII_Mask --> DomainRoute{"11. Phân loại lĩnh vực sự cố"}
    
    DomainRoute -->|AN_NINH / GIAO_THONG| PoliceInbox["12. Hòm thư Công an\nStatus = PENDING_RECEIVE\nmanagedByRole = POLICE"]
    DomainRoute -->|HA_TANG / MOI_TRUONG| WardInbox["12. Hòm thư UBND Phường\nStatus = PENDING_RECEIVE\nmanagedByRole = WARD_STAFF"]
    
    %% Cán bộ duyệt
    PoliceInbox & WardInbox --> OfficerAccept{"13. Cán bộ Phường/Công an duyệt tay"}
    OfficerAccept -->|Ấn 'Tiếp nhận'| InProgress[14. Status = IN_PROGRESS\nGiao việc xử lý thực tế]
    OfficerAccept -->|Ấn 'Từ chối'| Reject_Human[14. Status = REJECTED\nNhập lý do gửi Citizen]
    
    %% Backup Fallback cuối
    TriggerFallback --> FallbackSuccess([Trả kết quả dự phòng])
```

---

## 2. 4 TRỤ CỘT KỸ THUẬT CHI TIẾT

### 2.1 ContentGuardrailService (Lá chắn bảo vệ Tầng 1)
*   **Unicode Normalization:** Chuyển đổi các ký tự unicode đặc biệt về chữ thường không dấu để chống lách luật.
*   **Leet-speak detection:** Tự động dịch các từ lách luật như `h4ck` -> `hack`, `@` -> `a`, `$` -> `s`, `!` -> `i` để so sánh với danh sách cấm.
*   **PII-Guard:** Tự động phát hiện SĐT (10 số liên tiếp bắt đầu bằng 0) hoặc CCCD (12 số liên tiếp) viết liền hoặc cách nhau bằng dấu `-` để từ chối lưu bài viết vi phạm thông tin cá nhân.
*   **Rate limiting:** Nếu một tài khoản bị cảnh báo quá 3 lần trong 60 giây $\rightarrow$ Tự động khóa chat 5 phút.

### 2.2 SpeculativeRacingService (Đua song song - Speculative Racing)
*   Để tối ưu hóa tốc độ phản hồi cực hạn cho người dùng, hệ thống bắn request đồng thời sang **Groq** và **Gemini**.
*   **anyOf Execution:** Provider nào trả về trước (thường là Groq trong ~0.8s) sẽ thắng cuộc.
*   **Loser Cancellation:** Hệ thống lập tức hủy tác vụ (cancel) của provider chậm hơn (Gemini) để tránh rò rỉ luồng và tiết kiệm token API.

### 2.3 Least-Used Key Rotation (Xoay vòng khóa tối ưu)
*   Quản lý pool API key. Thay vì xoay vòng kiểu Round-Robin đơn giản, hệ thống chọn key theo chiến lược **Least-Used** (Key nào có lượt dùng `useCount` thấp nhất thì dùng trước) để phân phối đều tải.
*   **Cooling Recovery:** Nếu một key bị lỗi 429, nó được chuyển trạng thái sang `COOLING` trong 60 giây để phục hồi tự động, các request sau sẽ tránh key này ra.

### 2.4 OutputValidator & Self-Correction (Tự sửa lỗi)
*   Khi AI trả về JSON bị lỗi, hệ thống sẽ tự động ghép lỗi đó vào câu hỏi ban đầu và gửi lại cho AI: *"JSON của bạn bị lỗi cú pháp XYZ, vui lòng sửa lại"*. Quá trình tự sửa này lặp lại tối đa 3 lần để đảm bảo đầu ra luôn là JSON hợp lệ trước khi đưa vào các service xử lý tiếp theo.

---

## 3. THAY ĐỔI THIẾT KẾ: LUỒNG DUYỆT TAY & PHÂN LOẠI CHỜ TIẾP NHẬN (CÁCH 3)

Để tăng độ chính xác nghiệp vụ và phù hợp với quy trình xử lý thực tế của cơ quan hành chính nhà nước, hệ thống chuyển giao toàn bộ quyền ra quyết định phê duyệt cuối cùng cho con người (**Human-in-the-loop**):

### 3.1 Bỏ cơ chế chấm điểm tin cậy tự động (Trust Score)
*   **Lý do:** Điểm số tin cậy do AI tự suy luận dễ dẫn đến sai số (False Positives) do góc chụp ảnh, ánh sáng hiện trường không tốt, khiến đơn của người dân bị tự động từ chối oan uổng.
*   **Giải pháp:** Loại bỏ hoàn toàn kiểm thử ngưỡng điểm 40-70. Tất cả các đơn phản ánh không chứa từ ngữ độc hại/phá hoại sẽ được giữ lại để cán bộ xác minh thủ công.

### 3.2 Cơ chế Chờ Tiếp Nhận (PENDING_RECEIVE) và Phân loại
*   **Nhiệm vụ của AI:** AI chỉ phân tích văn bản/hình ảnh để phân loại đơn về đúng Lĩnh vực chuyên môn và Vai trò quản lý (`managedByRole` là `WARD_STAFF` hoặc `POLICE`).
*   **Luồng xử lý mới:** Sau khi AI định tuyến xong, trạng thái phản ánh được đặt là **`PENDING_RECEIVE` (Chờ tiếp nhận)**.
*   **Quy trình duyệt tay trên UI:**
    *   Cán bộ đăng nhập vào hệ thống, truy cập hòm thư chung dành cho các đơn đang chờ duyệt của đơn vị mình.
    *   **Ấn 'Tiếp nhận':** Đơn được chuyển trạng thái sang `IN_PROGRESS` để giao việc xử lý thực tế.
    *   **Ấn 'Từ chối':** Đơn chuyển sang `REJECTED`, cán bộ bắt buộc phải nhập lý do từ chối để hệ thống gửi thông báo phản hồi về cho người dân.
