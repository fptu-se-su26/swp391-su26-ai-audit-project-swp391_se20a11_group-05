# Workflow: AI Phân loại & Kiểm duyệt Feedback (Full Flow Hệ Thống)

> Tài liệu mô tả chi tiết toàn bộ luồng xử lý trùng lặp (Deduplication), kiểm duyệt (Moderation), phân loại (Classification), định tuyến (Routing) và bảo mật thông tin (PII Masking) trong hệ thống SmartCity.

---

## 1. SƠ ĐỒ LUỒNG TOÀN DIỆN (FULL SYSTEM FLOW)

```mermaid
flowchart TD
    %% Citizen Actions
    A([Citizen gửi Feedback]) --> B[1. Validate GPS & Rate Limit 5 bài/24h]
    B --> C[2. ContentGuardrailService: Lọc thô SĐT/CCCD bằng Regex]
    C --> D[3. Geocoding: Xác định Ward hành chính từ tọa độ]
    
    %% Vector Processing
    D --> E[4. Vectorization: EmbeddingClientFacade tạo vector 768 chiều]
    
    %% Database Vector Store
    subgraph DataStore ["🗄️ CƠ SỞ DỮ LIỆU VECTOR (Feedbacks Table)"]
        VStore[(Database Vector Store\nLưu description_vector)]
    end
    
    %% Duplicate Check
    E --> F[5. DB Vector Search: Quét vector trùng lặp]
    VStore -->|Cung cấp dữ liệu cũ| F
    
    F --> G{Tìm thấy ứng viên trùng?}
    G -->|Có| H[6. Gọi Gemini xác minh trùng lặp thực tế]
    G -->|Không| K[7. Lưu Feedback mới vào DB dạng SUBMITTED]
    
    H --> I{AI báo trùng is_duplicate = true?}
    I -->|Có| J[Hủy đơn - Trả về 409 Conflict\nKèm mã FB cũ để Citizen theo dõi]
    I -->|Không| K
    
    %% Saving & Queueing
    K --> L[8. Tạo AiTask PENDING & Trả về 201 cho Citizen]
    K --> M[9. Lưu description_vector của feedback mới]
    M -->|Ghi nhận vector mới| VStore
    
    %% Async Worker
    L --> N[10. Outbox Worker quét AiTask PENDING mỗi 5 giây]
    N --> O[11. Chuyển ảnh đính kèm thành Base64]
    O --> P[12. Gọi Gemini Multimodal phân tích]
    
    P --> Q{AI thành công?}
    Q -->|Không| R{Thử lại < 3 lần?}
    R -->|Có| S[Tăng retry_count & Set lại PENDING]
    R -->|Không| T[Fallback: Đặt PENDING_RECEIVE\nGiao Phường duyệt tay]
    
    Q -->|Có| U{13. Lọc Toxic: is_toxic = true?}
    U -->|Có| V{priority = CRITICAL?}
    V -->|Không| W[Từ chối - Status = REJECTED\nNotify ngôn từ vi phạm]
    V -->|Có| X[Bypass Toxic - Ưu tiên cứu nạn]
    U -->|Không| X
    
    X --> Y{14. Đánh giá Trust Score}
    Y -->|"< 40"| Z[Từ chối - Status = REJECTED\nNotify ảnh không khớp]
    Y -->|"41 - 70"| AA[Duyệt tay - Status = PENDING\nNotify cán bộ]
    Y -->|"> 70"| AB[15. PII Masking: Che SĐT/CCCD trong mô tả]
    
    AB --> AC{16. Định tuyến Domain}
    AC -->|AN_NINH / GIAO_THONG| AD[ASSIGNED - Chuyển Công an]
    AC -->|HA_TANG / MOI_TRUONG| AE[ASSIGNED - Chuyển Phường]
    
    %% Cron Clean (Nối vào DB Store)
    AF[17. Vector Purge Scheduler\nChạy 2h sáng hàng ngày] -->|Dọn dẹp/Xóa vector cũ > 30 ngày| VStore
```

---

## 2. PHA 1: KIỂM TRA TRÙNG LẶP SỰ CỐ (REAL-TIME DEDUPLICATION)

Để tránh việc nhiều người dân cùng báo cáo một sự việc tại cùng một địa điểm gây quá tải cho cán bộ, hệ thống thực hiện kiểm tra trùng lặp thời gian thực trước khi lưu đơn:

### Bước 1: Tạo Vector nhúng
Mô tả sự cố (description) được gửi qua `EmbeddingClientFacade` gọi Gemini API (`text-embedding-004`) để sinh ra một vector nhúng **768 chiều** đại diện cho ngữ nghĩa.

### Bước 2: Truy vấn PostgreSQL + pgvector + PostGIS
Hệ thống tìm kiếm các ứng viên có khả năng trùng lặp cao bằng câu lệnh SQL:
```sql
SELECT tracking_code, description, latitude, longitude
FROM feedbacks
WHERE ward_id = :wardId  -- Cùng phường xử lý (hoặc check vị trí nếu ward null)
  AND description_vector <=> :queryVector::vector < 0.70 -- 1. Tương đồng ngữ nghĩa > 30% (Cosine distance < 0.7)
  AND ST_DWithin(location, ST_SetSRID(ST_Point(:longitude, :latitude), 4326), 0.005) -- 2. Khoảng cách địa lý ~500m
  AND (
      status IN ('PENDING', 'IN_PROGRESS', 'SUBMITTED', 'NEED_LOCATION_REVIEW', 'PENDING_RECEIVE', 'WAITING_INFO') -- 3. Đang thực hiện
      OR
      (status = 'RESOLVED' AND resolved_at >= NOW() - INTERVAL '7 days') -- 4. Hoặc đã hoàn thành nhưng chưa quá 7 ngày
  )
ORDER BY description_vector <=> :queryVector::vector ASC
LIMIT 3;
```

### Bước 3: Xác minh bằng AI (Gemini)
Nếu DB trả về từ 1 đến 3 ứng viên, hệ thống sẽ gửi nội dung của đơn mới cùng nội dung của các đơn cũ sang Gemini để đối chiếu chéo:
*   **Prompt kiểm tra:** *Hãy xác định xem sự cố mới có trùng lặp (cùng mô tả về một sự việc vật lý, cùng một đống rác, cùng một cái cây đổ...) với các sự cố cũ không.*
*   **Kết quả:** JSON `{ "is_duplicate": true/false, "tracking_code": "FB-OLD123", "reason": "..." }`.
*   **Xử lý:** Nếu trùng -> Ném lỗi `409 Conflict`, chặn không lưu đơn và hướng dẫn citizen theo dõi mã phản ánh cũ.

---

## 3. PHA 2: AI AUDIT & PHÂN LOẠI ĐỊNH TUYẾN (OUTBOX WORKER)

Sau khi đơn vượt qua vòng kiểm tra trùng lặp và được tạo thành công, một `AiTask` ở trạng thái `PENDING` được sinh ra. `AutoDispatchService` chạy ngầm mỗi 5 giây sẽ xử lý:

```mermaid
sequenceDiagram
    participant Worker as Outbox AI Worker
    participant DB as PostgreSQL
    participant AI as Gemini Multimodal
    participant NS as Notification / WebSockets

    Worker ->> DB: Khóa task PENDING bằng SELECT FOR UPDATE
    Worker ->> DB: Tải ảnh đính kèm (tối đa 2 ảnh) & convert sang Base64
    
    Worker ->> AI: Gửi System Prompt + Nội dung chữ + Ảnh Base64
    AI -->> Worker: Trả về JSON { is_toxic, trust_score, masked_description, domain, priority, reason }

    alt Phân tích thất bại (Lỗi API / Rate Limit)
        alt retry_count < 3
            Worker ->> DB: retry_count++, set status = PENDING
        else retry_count >= 3 (Fallback hoàn toàn)
            Worker ->> DB: set AiTask = FAILED
            Worker ->> DB: set Feedback.status = PENDING_RECEIVE, managedByRole = WARD_STAFF
            Worker ->> NS: Gửi WebSocket & App Notif báo Phường duyệt thủ công (Ẩn lỗi AI với Citizen)
        end
    else Phân tích thành công
        alt is_toxic = true
            alt priority = CRITICAL (Tai nạn, Hỏa hoạn)
                Worker ->> DB: Bypass Toxic. Ghi FeedbackLog cảnh báo người dùng văng tục nhưng ưu tiên cứu hộ
            else priority != CRITICAL
                Worker ->> DB: set Feedback.status = REJECTED
                Worker ->> NS: Gửi thông báo Citizen: Bài viết chứa từ ngữ không phù hợp
            end
        end

        alt trust_score < 40 (Ảnh không liên quan nội dung)
            Worker ->> DB: set Feedback.status = REJECTED
            Worker ->> NS: Gửi thông báo Citizen: Ảnh sự cố không khớp mô tả
        else trust_score 41 - 70 (Nghi ngờ, cần kiểm chứng)
            Worker ->> DB: set Feedback.status = PENDING (Duyệt tay)
            Worker ->> NS: Báo Cán bộ xem xét thực tế
        else trust_score > 70 (Tin cậy cao)
            Note over Worker: Lưu masked_description (đã che SĐT/CCCD) thay thế mô tả gốc
            alt Domain = AN_NINH hoặc GIAO_THONG
                Worker ->> DB: set status = ASSIGNED, managedByRole = POLICE
                Worker ->> NS: Chuyển Công an phường xử lý
            else Domain = HA_TANG hoặc MOI_TRUONG
                Worker ->> DB: set status = ASSIGNED, managedByRole = WARD_STAFF
                Worker ->> NS: Chuyển Ủy ban nhân dân Phường xử lý
            end
        end
        Worker ->> DB: set AiTask = COMPLETED
    end
```

---

## 4. DỌN DẸP BỘ NHỚ VECTOR (VECTOR PURGE SCHEDULER)

Để tối ưu không gian lưu trữ của cơ sở dữ liệu Supabase/PostgreSQL (đặc biệt khi dung lượng RAM cho chỉ mục HNSW vector có giới hạn), hệ thống cài đặt bộ dọn dẹp tự động:

*   **Thời gian chạy:** 2:00 AM hàng ngày (`@Scheduled(cron = "0 0 2 * * *")`).
*   **Logic xử lý:** Tất cả các phản ánh đã giải quyết xong (`RESOLVED`) hoặc đã bị từ chối (`REJECTED`) mà thời gian cập nhật cuối cùng đã **quá 30 ngày** sẽ bị xóa sạch cột `description_vector` về `NULL`.
*   **Mục đích:** Chỉ lưu trữ vector của các phản ánh mới hoặc đang xử lý để phục vụ check trùng lặp, giải phóng tài nguyên cho các phản ánh quá cũ.

---

## 5. CÔNG CỤ DÀNH CHO CÁN BỘ: GOM NHÓM SỰ CỐ HÀNG LOẠT (BATCH DEDUPLICATION)

Ngoài việc kiểm tra trùng lặp thời gian thực lúc người dân gửi đơn, Cán bộ công an hoặc Phường có thể sử dụng tính năng **Phân tích trùng lặp hàng loạt** trên giao diện:

1.  **Endpoint:** `GET /api/police/feedbacks/analyze-duplicates` (định nghĩa tại `PoliceFeedbackService.java`).
2.  **Cách thức hoạt động:**
    *   Hệ thống quét tối đa 50 phản ánh đang hoạt động thuộc địa bàn Phường quản lý.
    *   Gộp toàn bộ thông tin (ID, tiêu đề, địa chỉ, mô tả) thành một văn bản gửi sang AI.
    *   AI tiến hành phân tích đa chiều và gom các bài viết phản ánh về cùng một sự việc vật lý vào các nhóm.
    *   AI trả về danh sách nhóm trùng lặp:
        ```json
        [
          {
            "groupId": "Nhóm sự cố rác thải Lê Duẩn",
            "feedbackIds": [102, 105, 108],
            "matchScore": 92,
            "reason": "Các phản ánh đều mô tả đống rác lớn bốc mùi trước số nhà 120 Lê Duẩn."
          }
        ]
        ```
3.  **Tác dụng:** Giúp cán bộ gộp nhanh các đơn trùng để xử lý một lần, gửi phản hồi hàng loạt cho tất cả người dân liên quan.
