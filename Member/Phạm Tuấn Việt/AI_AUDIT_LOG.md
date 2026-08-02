# AI Audit Log

## I. Thông tin chung

| Thông tin | Nội dung |
|---|---|
| Môn học | Software Project |
| Mã môn học | SWP391 |
| Lớp | SE20A11 |
| Học kỳ | 5 |
| Tên bài tập / Project | The City Connect |
| Tên sinh viên / Nhóm | Phạm Tuấn Việt / Nhóm 5 |
| MSSV / Danh sách MSSV | DE190714 |
| Giảng viên hướng dẫn | QuangLTN3 |
| Ngày bắt đầu | 13/5/2026 |
| Ngày hoàn thành | 06/06/2026 |

---

## II. Công cụ AI đã sử dụng

- [x] ChatGPT
- [x] Gemini
- [x] Claude
- [x] GitHub Copilot
- [x] Cursor
- [x] Antigravity
- [x] Perplexity
- [x] Microsoft Copilot
- [x] Công cụ khác: Lovable, StitchGoogle

---

## III. Core Prompt Entries (8 entries — đủ yêu cầu tối thiểu)

---

### Entry #001

**Prompt Type:** DECISION
**Stage/Component:** Decomposition (CT) + Requirement Stage (RBL)

**Problem/Context:** Nhóm cần xác định kiến trúc hệ thống tổng thể cho "City Connect System" — một nền tảng phản ánh đô thị thông minh cho Đà Nẵng. Chưa rõ nên tổ chức backend theo hướng nào để hỗ trợ nhiều vai trò người dùng khác nhau.

**Prompt to AI:**
> "Tôi đang làm một dự án hệ thống thông minh tên là 'City Connect System' (Thành phố lắng nghe) dành cho Đà Nẵng, giúp người dân báo cáo sự cố đô thị (ngập lụt, rác thải, hỏng hạ tầng) theo thời gian thực. Hãy gợi ý cho tôi cách làm thế nào để nền tảng web này khác biệt và nổi bật hơn so với các cổng thông tin dịch vụ công hiện có của chính phủ? Đồng thời, gợi ý một số nguồn dữ liệu công khai về đô thị Đà Nẵng để tôi làm data mẫu."

**AI Response (Summary):** AI đề xuất tích hợp Chatbot AI dùng Hybrid RAG cho tình huống khẩn cấp, hệ thống gửi báo cáo tự động với GPS + xác thực hình ảnh/video, và khai thác cổng Open Data Đà Nẵng. AI gợi ý luồng xử lý chung chung theo mô hình citizen → admin.

**Human Delta & Reflection:**

- **Critical Thinking:** AI đúng về hướng tích hợp AI (Chatbot RAG) nhưng gợi ý mô hình phân quyền quá đơn giản: chỉ "citizen" và "admin". Hệ thống thực tế của Đà Nẵng cần phân biệt 4 vai trò: Citizen, WARD_STAFF (ủy ban phường), POLICE (công an phường), SUPER_ADMIN. Đây là **Hallucination dạng Oversimplification** — AI bỏ qua cấu trúc hành chính thực tế của chính quyền địa phương Việt Nam.

- **Contextualization:** Hệ thống phản ánh đô thị tại Việt Nam hoạt động theo cấp hành chính rõ ràng: phường/xã → quận → thành phố. Mỗi phường có ủy ban nhân dân riêng (WARD_STAFF) và đồn công an riêng (POLICE). AI không có kiến thức về mô hình quản lý hành chính đặc thù của Việt Nam, đặc biệt là Đà Nẵng có tới 94 phường/xã.

- **Creative Synthesis:** Nhóm thiết kế lại mô hình phân quyền 4 tầng: (1) Citizen gửi phản ánh, (2) WARD_STAFF ủy ban phường xử lý, (3) POLICE công an phường xử lý loại "An ninh", (4) SUPER_ADMIN quản lý toàn thành phố. Mỗi role được gắn với một `ward_id` trong DB để tự động lọc dữ liệu theo phạm vi quản lý.

- **Decision Ownership:** Chọn kiến trúc module hóa theo role trong Spring Boot (`modules/user`, `modules/feedback`, `modules/core`) thay vì flat structure AI gợi ý. Quyết định này ảnh hưởng trực tiếp đến toàn bộ cấu trúc backend và logic phân quyền.

**Evidence:**
| Loại | Nội dung |
|---|---|
| File liên quan | `Sources/Backend/src/main/java/com/example/smartcity/modules/user/entity/Role.java` — enum 4 roles: CITIZEN, WARD_STAFF, POLICE, SUPER_ADMIN |
| File liên quan | `Sources/Backend/src/main/java/com/example/smartcity/modules/user/entity/User.java` — field `ward` (ManyToOne) gắn user với phường |
| Hallucination detected | Oversimplification: AI bỏ qua cấu trúc hành chính 4 tầng, chỉ gợi ý 2 role |

**Liên hệ PBL/RBL:**
- CT: **Decomposition** — phân tách hệ thống thành các module theo vai trò hành chính thực tế
- RBL: Requirement milestone (tuần 1-2)
- AI Reflection: Phát hiện Hallucination — Oversimplification về mô hình phân quyền

---

### Entry #002

**Prompt Type:** DECISION
**Stage/Component:** Pattern Recognition (CT) + Design Stage (RBL)

**Problem/Context:** Khi thiết kế backend Spring Boot, cần quyết định cách tổ chức package structure để hỗ trợ nhiều domain (Auth, Feedback, Weather, RAG, Analytics) mà không bị coupling chặt.

**Prompt to AI:**
> "Xác định các Use Case chi tiết cho tính năng 'Gửi phản ánh sự cố đô thị' của người dân trong hệ thống City Connect System. Thiết kế giao diện (UI Components) trên ReactJS cần những thành phần nào để tối ưu trải nghiệm người dùng khi họ đang ở ngoài đường và muốn báo cáo nhanh trên điện thoại?"

**AI Response (Summary):** AI đề xuất luồng Use Case: Định vị → Upload media → Phân loại → Mô tả → Gửi. Về Frontend, AI gợi ý Mobile-first với Floating Action Button, bản đồ Leaflet/Google Maps tự bắt GPS, và Chips chọn nhanh loại sự cố.

**Human Delta & Reflection:**

- **Critical Thinking:** AI đúng về tư duy Mobile-first và các component cơ bản. Tuy nhiên, AI gợi ý bắt buộc đăng nhập trước khi gửi phản ánh — đây là quyết định sai về UX cho tình huống khẩn cấp. Trong thực tế, người dân cần báo cáo nhanh khi phát hiện sự cố nguy hiểm (ngập lụt, tai nạn), nếu bắt buộc đăng nhập sẽ làm giảm tỷ lệ báo cáo thực tế.

- **Contextualization:** Ứng dụng dịch vụ công tại Việt Nam thường có tỷ lệ sử dụng thấp do UI phức tạp và nhiều bước thao tác. Thực tế tại Đà Nẵng, nhiều sự cố cần được báo cáo khẩn cấp (thiên tai, tai nạn giao thông) — người dân không có thời gian đăng nhập.

- **Creative Synthesis:** Thiết kế luồng 3 bước đơn giản: (1) Chụp ảnh/video, (2) Xác định vị trí GPS, (3) Mô tả bằng giọng nói hoặc text. Không bắt buộc đăng nhập cho bước gửi phản ánh ban đầu. Thêm cơ chế theo dõi phản ánh bằng tracking code (FB-XXXXXXXX) để người dùng có thể tra cứu mà không cần tài khoản.

- **Decision Ownership:** Quyết định dùng stepper 3 bước (Step 1: Media, Step 2: Location, Step 3: Description) thay vì form dài một trang. Tracking code tự động tạo từ UUID để người dân không cần đăng nhập vẫn theo dõi được.

**Evidence:**
| Loại | Nội dung |
|---|---|
| File liên quan | `Sources/Frontend/src/routes/report.tsx` — stepper 3 bước, không bắt buộc đăng nhập |
| File liên quan | `Sources/Backend/src/main/java/com/example/smartcity/modules/feedback/entity/Feedback.java` — field `trackingCode` (UUID-based) |
| Kết quả | Tracking code format: `FB-XXXXXXXX`, tạo tự động khi submit |

**Liên hệ PBL/RBL:**
- CT: **Pattern Recognition** — nhận ra pattern "friction reduces adoption" trong UX dịch vụ công
- RBL: Design milestone (tuần 2-3)

---

### Entry #003

**Prompt Type:** PROBLEM-SOLVING
**Stage/Component:** Algorithms (CT) + Implementation Stage (RBL)

**Problem/Context:** `AutoDispatchService` cần tự động phân công feedback khẩn cấp cho đúng cán bộ công an. Đà Nẵng có 94 phường/xã và nhiều cán bộ, cần tìm cán bộ phù hợp nhanh chóng mà không scan toàn bộ database.

**Prompt to AI:**
> "web của tôi đang gặp vấn đề vì xử lý lượng thông tin quá nhiều vì thành phố đà nẵng mới có 94 phường xã có cách nào để tối ưu điều này không"

**AI Response (Summary):** AI phân tích và phát hiện 3 vấn đề: (1) `AutoDispatchService` đang dùng `userRepository.findAll()` rồi filter trong Java — O(N) full table scan; (2) POLICE xem feedback "An ninh" toàn thành phố thay vì chỉ phường mình; (3) Thiếu fallback cascade khi phường chưa có cán bộ. AI đề xuất cascade 3 tầng: phường → quận → toàn TP.

**Human Delta & Reflection:**

- **Critical Thinking:** AI phân tích đúng cả 3 vấn đề và giải pháp cascade 3 tầng là hợp lý về mặt kỹ thuật. Tuy nhiên, AI ban đầu hiểu sai bối cảnh — AI nghĩ vấn đề là về "dropdown chọn phường" trên Frontend, trong khi vấn đề thực sự là về **logic phân công và phân quyền backend** khi scale lên 94 phường.

- **Contextualization:** Tôi đã phải làm rõ cho AI: "mỗi công an hoặc ủy ban chỉ được quản lý mỗi phường họ đảm nhận thôi". Đây là quy tắc nghiệp vụ quan trọng mà AI không thể tự suy ra — AI cần được cung cấp thông tin này để thiết kế đúng. AI ban đầu đề xuất 1 user có thể quản lý nhiều phường, nhưng thực tế nghiệp vụ là 1 cán bộ = 1 phường.

- **Creative Synthesis:** Sau khi làm rõ nghiệp vụ, tôi yêu cầu AI lập kế hoạch (không implement ngay) để có thể review kỹ trước. Kế hoạch cuối cùng gồm 5 thay đổi file: thêm 3 query methods vào `UserRepository`, thêm 1 query vào `FeedbackRepository`, sửa logic POLICE trong `FeedbackService.getAllFeedbacks()`, implement cascade trong `AutoDispatchService`, và sửa `canAccessFeedback()` để bảo vệ endpoint GET `/feedbacks/{id}`.

- **Decision Ownership:** Quyết định chỉ lên kế hoạch trước, không để AI implement ngay. Khi AI vội vàng implement mà chưa được phép, tôi đã yêu cầu revert toàn bộ các thay đổi. Đây là biểu hiện của "Human in the loop" — không để AI tự quyết định thời điểm implement.

**Evidence:**
| Loại | Nội dung |
|---|---|
| File liên quan | `Sources/Backend/src/main/java/com/example/smartcity/modules/feedback/service/AutoDispatchService.java` — dòng 69: `userRepository.findAll()` là vấn đề hiện tại |
| File liên quan | `Sources/Backend/src/main/java/com/example/smartcity/modules/user/repository/UserRepository.java` — hiện chỉ có 3 method đơn giản |
| Kế hoạch | `Member/Phạm Tuấn Việt/` folder — `implementation_plan.md` ghi lại toàn bộ thiết kế |
| Hallucination | Context Misunderstanding: AI ban đầu hiểu sai vấn đề là Frontend dropdown, không phải Backend logic |

**Liên hệ PBL/RBL:**
- CT: **Algorithms** — thiết kế cascade 3-tier lookup thay vì O(N) scan
- RBL: Architecture milestone (tuần 4-5)
- AI Reflection: Phát hiện Context Misunderstanding — AI hiểu nhầm vấn đề là Frontend, thực ra là Backend

---

### Entry #004

**Prompt Type:** VERIFICATION
**Stage/Component:** Abstraction (CT) + Design Stage (RBL)

**Problem/Context:** Cần thiết kế State Machine cho vòng đời xử lý feedback (PENDING → ASSIGNED → IN_PROGRESS → RESOLVED/REJECTED). Cần kiểm chứng xem các trạng thái và transition có đủ bao phủ các trường hợp thực tế của nghiệp vụ hành chính không.

**Prompt to AI:**
> "Hệ thống của tôi có FeedbackStatus với các trạng thái: PENDING, ASSIGNED, IN_PROGRESS, WAITING_INFO, RESOLVED, REJECTED, PRE_EMPTIVE. Đây có phải là State Machine hợp lý cho một hệ thống phản ánh đô thị không? Các transition nào là valid?"

**AI Response (Summary):** AI xác nhận đây là State Machine hợp lý và đề xuất bảng transition đầy đủ. AI đặc biệt giải thích `PRE_EMPTIVE` là trạng thái cho feedback được AI tạo tự động từ dự báo thời tiết, và `WAITING_INFO` cho phép yêu cầu bổ sung thông tin từ người dân.

**Human Delta & Reflection:**

- **Critical Thinking:** AI đúng về cấu trúc tổng thể. Tuy nhiên, AI gợi ý cho phép transition `RESOLVED → PENDING` (để "mở lại" nếu giải quyết chưa xong). Đây là **Logic Error** — trong thực tế hành chính Việt Nam, một phản ánh đã được đánh dấu RESOLVED không thể bị mở lại mà không có quy trình phê duyệt riêng. Nếu áp dụng gợi ý này, hệ thống có thể bị lạm dụng để "ảo hóa" số liệu giải quyết.

- **Contextualization:** Trong quy trình hành chính thực tế, `RESOLVED` là trạng thái cuối — cán bộ không thể tự chuyển ngược lại. Nếu cần mở lại, phải có công văn và quy trình riêng từ cấp trên. AI không biết quy trình hành chính nội bộ của cơ quan Nhà nước.

- **Creative Synthesis:** Thiết kế State Machine với `RESOLVED` và `REJECTED` là 2 terminal state (Set rỗng, không có transition đi ra). Trạng thái `PRE_EMPTIVE` được thêm để phân biệt feedback tự động từ AI weather prediction với feedback thủ công từ người dân.

- **Decision Ownership:** Giữ nguyên `RESOLVED` và `REJECTED` là terminal state, loại bỏ transition `RESOLVED → PENDING` mà AI gợi ý. Lý do: đảm bảo tính toàn vẹn dữ liệu thống kê và phù hợp với quy trình hành chính thực tế.

**Evidence:**
| Loại | Nội dung |
|---|---|
| File liên quan | `Sources/Backend/src/main/java/com/example/smartcity/modules/feedback/service/FeedbackService.java` — lines 50-57: `VALID_TRANSITIONS` Map, `RESOLVED` → `Set.of()` (terminal) |
| Kết quả kiểm tra | Code: `if (allowed == null \|\| !allowed.contains(newStatus)) throw new CustomException(...)` — enforce state machine cứng |
| Hallucination | Logic Error: AI gợi ý RESOLVED → PENDING là valid transition, thực tế không phù hợp quy trình hành chính |

**Liên hệ PBL/RBL:**
- CT: **Abstraction** — mô hình hóa vòng đời phản ánh thành State Machine với terminal states
- RBL: Design milestone (tuần 3-4)
- AI Reflection: Phát hiện Logic Error về terminal state

---

### Entry #005

**Prompt Type:** DECISION
**Stage/Component:** Pattern Recognition (CT) + Implementation Stage (RBL)

**Problem/Context:** Cần thiết kế một file TypeScript type tập trung (`types/api.ts`) cho toàn bộ API contract giữa Frontend React và Backend Spring Boot, đảm bảo type-safe ở compile time.

**Prompt to AI:**
> "Tôi đang xây dựng Frontend React + TypeScript cho hệ thống City Connect System. Backend Spring Boot có nhiều module (Auth, Feedback, RAG Chatbot, Weather/Prediction, Analytics, Ward). Hãy giúp tôi thiết kế một file types/api.ts tập trung chứa toàn bộ TypeScript interfaces và types cho tất cả API responses, đảm bảo: (1) Tách biệt hoàn toàn với HTTP client layer; (2) Hỗ trợ generic types cho pagination và API envelope; (3) Type đầy đủ cho các domain phức tạp như RAG response với citations và Weather prediction với hotspot map."

**AI Response (Summary):** AI đề xuất tạo `types/api.ts` phân vùng theo domain với Generic type `ApiResponse<T>` và `PageResponse<T>`. AI gợi ý tách type file khỏi HTTP client để UI components không phụ thuộc vào axios/fetch layer.

**Human Delta & Reflection:**

- **Critical Thinking:** AI đúng về kiến trúc phân vùng domain và Generic types. Tuy nhiên, AI generate `WardPerformance` interface chỉ có field `ward: string`, trong khi Backend thực tế trả về field `name: string` từ DB query. Đây là **Context Misunderstanding** — AI không biết có 2 nguồn data song song (real API và mock data legacy).

- **Contextualization:** Project đang trong giai đoạn chuyển đổi từ mock data sang real API. Mock data Frontend dùng field `ward`, nhưng real Backend trả về field `name`. AI không thể biết có technical debt này vì nó nằm trong lịch sử phát triển của project.

- **Creative Synthesis:** Chỉnh sửa `WardPerformance` thành optional union: `name?: string; ward?: string;` kèm comment giải thích lý do. Tương tự `avgHrs?: number` và `satisfactionPct?: number` — optional với comment "mock data uses..." để clean up sau khi API hoàn thiện.

- **Decision Ownership:** Chọn optional fields với comment documentation thay vì tạo 2 interface riêng biệt để tránh import nhầm trong giai đoạn chuyển đổi. Sau khi API hoàn thiện 100%, sẽ remove optional mock fields.

**Evidence:**
| Loại | Nội dung |
|---|---|
| File liên quan | `Sources/Frontend/src/types/api.ts` — WardPerformance interface với optional union fields |
| Kết quả | TypeScript compile thành công — không có lỗi `Property does not exist` |
| Hallucination | Context Misunderstanding: AI không biết có 2 nguồn data song song (real API vs mock) |

**Liên hệ PBL/RBL:**
- CT: **Pattern Recognition** — nhận ra pattern "API contract mismatch" giữa mock và real data
- RBL: Frontend integration milestone (tuần 6-7)
- AI Reflection: Phát hiện Context Misunderstanding — WardPerformance field mismatch

---

### Entry #006

**Prompt Type:** PROBLEM-SOLVING
**Stage/Component:** Algorithms (CT) + Implementation Stage (RBL)

**Problem/Context:** `AutoDispatchService` trong Backend cần tự động phân loại mức độ khẩn cấp của feedback và điều phối đến đúng cán bộ. Cần tích hợp AI (Gemini) để phân tích nội dung phản ánh.

**Prompt to AI:**
> "Hệ thống của tôi có AutoDispatchService sử dụng Gemini AI để phân loại feedback thành 'KHAN_CAP' hoặc 'BINH_THUONG'. Hiện tại code đang dùng userRepository.findAll() để tìm POLICE rồi filter trong Java. Với 94 phường x nhiều cán bộ, cách này không scale được. Hãy thiết kế giải pháp cascade lookup tối ưu."

**AI Response (Summary):** AI đề xuất cascade 3 tầng: (1) Query POLICE theo ward_id của feedback, (2) Fallback query POLICE theo district_id, (3) Fallback toàn TP. AI cũng gợi ý thêm 3 method vào `UserRepository` sử dụng Spring Data JPA query derivation để tận dụng index.

**Human Delta & Reflection:**

- **Critical Thinking:** AI đúng về cascade logic và Spring Data JPA query derivation. Tuy nhiên, AI generate query method `findByRoleAndWard_IdAndStatus` mà không giải thích tại sao cần underscore (`Ward_Id` thay vì `WardId`). Nếu áp dụng sai sẽ sinh ra JPQL sai và runtime error. **Đây là Oversimplification** — AI không giải thích rõ Spring naming convention cho nested property.

- **Contextualization:** Spring Data JPA dùng underscore `_` để disambiguate nested property vs field name. `Ward_Id` = `ward.id` (join với bảng ward, lấy column id). Nếu viết `WardId` (không underscore), Spring có thể hiểu là field `wardId` trực tiếp trên entity User — sẽ không có field này và gây lỗi.

- **Creative Synthesis:** Verify convention bằng cách đọc Spring Data JPA documentation và test với `findByRoleAndWard_IdAndStatus` vs `findByRoleAndWardIdAndStatus`. Confirm rằng `Ward_Id` là correct form khi property name là `ward` và nested property là `id`.

- **Decision Ownership:** Giữ naming convention `Ward_Id` với underscore và thêm `@Query` JPQL cho district-level query vì Spring Data JPA không hỗ trợ 3 cấp nested property natively (`ward.district.id` cần explicit JPQL).

**Evidence:**
| Loại | Nội dung |
|---|---|
| File liên quan | `Sources/Backend/src/main/java/com/example/smartcity/modules/user/repository/UserRepository.java` — hiện chỉ có 3 basic methods |
| Kế hoạch | `implementation_plan.md` — Section "UserRepository.java thêm 3 query method" |
| Hallucination | Oversimplification: AI không giải thích Spring Data JPA underscore convention cho nested property |

**Liên hệ PBL/RBL:**
- CT: **Algorithms** — cascade 3-tier lookup thay vì O(N) full scan
- RBL: Backend optimization milestone (tuần 6)

---

### Entry #007

**Prompt Type:** DECISION
**Stage/Component:** Abstraction (CT) + Design Stage (RBL)

**Problem/Context:** Cần thiết kế API Client layer cho Frontend — quyết định pattern nào để gọi API an toàn, có interceptor xử lý token expired, và cách expose functions ra cho React components.

**Prompt to AI:**
> "Tôi cần thiết kế một API client cho React + TypeScript gọi vào Spring Boot backend. Yêu cầu: (1) Interceptor pattern tự động attach JWT token; (2) Xử lý lỗi tập trung với custom ApiError class; (3) Auto-logout khi nhận 401; (4) Timeout handling. Hiện đang dùng raw fetch, có nên chuyển sang axios không?"

**AI Response (Summary):** AI gợi ý dùng axios với interceptors. AI đề xuất tạo axios instance với `baseURL`, `requestInterceptor` để attach token, `responseInterceptor` để xử lý 401. AI cũng gợi ý tạo `ApiError` class kế thừa từ `Error`.

**Human Delta & Reflection:**

- **Critical Thinking:** AI gợi ý axios nhưng không phân tích trade-off. Axios thêm khoảng 13KB vào bundle size và là external dependency — với một project đã dùng TanStack Query (vốn dùng raw fetch/promise), việc thêm axios có thể gây confusion về "single source of truth" cho API calls. **Đây là Oversimplification** — AI mặc định axios tốt hơn mà không phân tích context.

- **Contextualization:** Project dùng TanStack Query cho data fetching — Query đã handle caching, retry, và lifecycle. Axios sẽ chồng chéo với tầng này. Hơn nữa, project deploy trên edge/server side rendering (TanStack Start), nơi axios cần polyfill phức tạp hơn native fetch.

- **Creative Synthesis:** Giữ raw `fetch` nhưng wrap trong custom `request<T>()` function với: AbortController timeout, auto-attach JWT, custom ApiError class, và auto-unwrap API envelope (`{ status, message, data }`). Pattern này không cần dependency mới và hoạt động tốt cả browser lẫn SSR.

- **Decision Ownership:** Không dùng axios, giữ native fetch với wrapper pattern. Lý do: bundle size nhỏ hơn, không thêm dependency, tương thích tốt với TanStack Query và SSR environment.

**Evidence:**
| Loại | Nội dung |
|---|---|
| File liên quan | `Sources/Frontend/src/lib/api.ts` — `request<T>()` function với AbortController timeout, không dùng axios |
| Kết quả | API client tự handle: JWT attach, 401 auto-logout, timeout 30s, ApiError class |
| Quyết định | Không thêm axios dependency — giữ native fetch với wrapper |

**Liên hệ PBL/RBL:**
- CT: **Abstraction** — trừu tượng hóa HTTP layer thành reusable `request<T>()` function
- RBL: Frontend architecture milestone (tuần 5-6)

---

### Entry #008

**Prompt Type:** VERIFICATION
**Stage/Component:** Pattern Recognition (CT) + Research Stage (RBL)

**Problem/Context:** Cần kiểm chứng thiết kế phân quyền 4 role khi scale lên 94 phường — mỗi WARD_STAFF và POLICE chỉ quản lý đúng 1 phường. Cần đảm bảo logic `getAllFeedbacks()` đúng nghiệp vụ và không có security hole.

**Prompt to AI:**
> "mỗi công an hoặc ủy ban chỉ được quản lý mỗi phường họ đảm nhận thôi, thì hệ thống xử lý như thế nào để tối ưu nhất"

**AI Response (Summary):** AI xác nhận thiết kế 1 cán bộ = 1 phường và đề xuất bảng phân quyền rõ ràng: WARD_STAFF xem tất cả feedback phường mình (`ward_id = user.ward_id`), POLICE chỉ xem "An ninh" phường mình (`ward_id = user.ward_id AND category = 'An ninh'`). AI cũng phát hiện security hole trong `canAccessFeedback()` hiện tại.

**Human Delta & Reflection:**

- **Critical Thinking:** AI phân tích đúng và phát hiện 2 vấn đề nghiêm trọng: (1) `getAllFeedbacks()` cho POLICE đang xem toàn TP thay vì chỉ phường; (2) `canAccessFeedback()` không check ward của POLICE. Tuy nhiên, AI không tự phát hiện được security hole ở bước đầu mà cần tôi mô tả chính xác constraint "1 cán bộ = 1 phường" trước.

- **Contextualization:** Constraint "1 cán bộ = 1 phường" là quy tắc nghiệp vụ mà AI không thể suy luận từ code structure một mình — cần được cung cấp rõ ràng. Đây là điển hình của "Human Knowledge Transfer to AI": kiến thức về tổ chức hành chính địa phương phải do con người cung cấp.

- **Creative Synthesis:** Sau khi AI phân tích và tôi xem xét kỹ, tôi yêu cầu AI lưu kế hoạch vào file `implementation_plan.md` trước khi implement. Khi AI vội vàng implement mà chưa có lệnh, tôi đã dừng lại và yêu cầu revert — minh chứng cho tư duy "review before execute".

- **Decision Ownership:** Quyết định giữ kế hoạch để review kỹ trước khi implement — không để AI thực thi ngay. Đặc biệt, security-related changes cần được xem xét cẩn thận hơn. Kế hoạch hiện đang chờ review và approval trước khi triển khai.

**Evidence:**
| Loại | Nội dung |
|---|---|
| File liên quan | `Sources/Backend/src/main/java/com/example/smartcity/modules/feedback/service/FeedbackService.java` — dòng 116-118: bug POLICE xem toàn TP |
| Kế hoạch | `Member/Phạm Tuấn Việt/implementation_plan.md` — kế hoạch 5 thay đổi đã được lưu |
| Human Delta | Yêu cầu revert khi AI implement vội — minh chứng cho Human in the Loop |

**Liên hệ PBL/RBL:**
- CT: **Pattern Recognition** — nhận ra pattern "scope leak" trong role-based access control
- RBL: Security review milestone (tuần 7)
- AI Reflection: AI cần human-provided business constraint để phân tích đúng

---

## IV. Bảng tổng hợp mức độ sử dụng AI

| Hạng mục | Không dùng AI | AI hỗ trợ ít | AI hỗ trợ nhiều | AI sinh chính | Ghi chú |
|---|:---:|:---:|:---:|:---:|---|
| Phân tích yêu cầu | | ✓ | | | AI gợi ý, nhóm điều chỉnh theo nghiệp vụ thực tế VN |
| Viết user story/use case | | ✓ | | | AI làm khung, nhóm thêm business rules |
| Thiết kế database | | ✓ | | | Schema tự thiết kế, AI review |
| Thiết kế kiến trúc hệ thống | | ✓ | | | Module structure do nhóm quyết định |
| Thiết kế giao diện | | | ✓ | | AI đề xuất component, nhóm điều chỉnh UX |
| Code frontend | | | ✓ | | AI sinh boilerplate, nhóm fix types và logic |
| Code backend | | ✓ | | | Logic phân quyền và state machine do nhóm viết |
| Debug lỗi | | | ✓ | | AI hỗ trợ phân tích lỗi |
| Viết test case | ✓ | | | | Chưa sử dụng AI cho testing |
| Kiểm thử sản phẩm | ✓ | | | | Manual testing |
| Tối ưu code | | ✓ | | | AI gợi ý cascade query, nhóm verify naming convention |
| Viết báo cáo | | ✓ | | | AI hỗ trợ cấu trúc |
| Làm slide thuyết trình | | ✓ | | | AI gợi ý outline |

---

## V. Bảng tổng hợp Hallucination đã phát hiện

| STT | Loại Hallucination | Mô tả | Cách phát hiện | Cách xử lý |
|---|---|---|---|---|
| 1 | Oversimplification | AI chỉ gợi ý 2 role (citizen/admin), bỏ qua cấu trúc hành chính 4 tầng của VN | So sánh với thực tế hành chính Đà Nẵng | Thiết kế lại 4 roles: CITIZEN, WARD_STAFF, POLICE, SUPER_ADMIN |
| 2 | Logic Error | AI gợi ý RESOLVED → PENDING là valid transition | Đối chiếu quy trình hành chính thực tế | Giữ RESOLVED và REJECTED là terminal state |
| 3 | Context Misunderstanding | AI không biết có 2 nguồn data song song (real API vs mock) | Compile error khi tích hợp WardPerformance type | Dùng optional union fields với documentation comment |
| 4 | Context Misunderstanding | AI hiểu nhầm vấn đề 94 phường là về Frontend dropdown, không phải Backend logic | Đọc kỹ AI response và so sánh với vấn đề thực tế | Làm rõ context cho AI, reframe question |
| 5 | Oversimplification | AI không giải thích Spring Data JPA underscore convention cho nested property | Research Spring Data JPA docs, test cả hai variant | Dùng Ward_Id (underscore) và verify naming convention |

---

## VI. Kiểm chứng kết quả AI

Cách nhóm kiểm tra lại kết quả AI:

**Kỹ thuật:**
- Chạy thử TypeScript compiler để check type errors (Entry #005)
- Đọc Spring Data JPA documentation để verify naming convention (Entry #006)
- Review State Machine logic bằng cách vẽ sơ đồ transition và check terminal states (Entry #004)
- Test API endpoints bằng Postman với các token role khác nhau

**Nghiệp vụ:**
- Đối chiếu gợi ý AI với quy trình hành chính thực tế của UBND phường/công an phường
- Verify "1 cán bộ = 1 phường" với giảng viên và teammate
- Review plan trước khi implement (yêu cầu AI lưu kế hoạch, review kỹ, mới approve)

**Quy trình:**
- Human in the Loop: khi AI implement vội, yêu cầu revert và làm theo quy trình review → approve → implement
- Không cho phép AI tự quyết định thời điểm implement security-related changes

---

## VII. Đóng góp cá nhân

### 8.1. Phần tự làm

| Nội dung | Chi tiết |
|---|---|
| Thiết kế nghiệp vụ | Quy tắc phân quyền 1 cán bộ = 1 phường, State Machine terminal states |
| Backend core logic | `FeedbackService.getAllFeedbacks()` role-based scoping, `canAccessFeedback()` |
| Frontend API client | `api.ts` — native fetch wrapper với interceptor pattern, không dùng axios |
| Phát hiện lỗi AI | Phát hiện 5 trường hợp hallucination trong suốt quá trình phát triển |

### 8.2. Phần AI hỗ trợ và đã điều chỉnh

| Nội dung AI làm | Điều chỉnh thực hiện |
|---|---|
| Boilerplate TypeScript types | Fix WardPerformance optional union fields |
| Gợi ý cascade 3-tier query | Verify Spring Data JPA naming convention, thêm explicit JPQL cho district-level |
| Đề xuất Component React cho report form | Đổi từ "bắt buộc đăng nhập" thành "báo cáo không cần đăng nhập + tracking code" |
| Gợi ý axios cho API client | Giữ native fetch + wrapper, không thêm dependency |

---

## VIII. Reflection cuối bài

### 9.1. AI đã hỗ trợ em/nhóm ở điểm nào?

AI đặc biệt hiệu quả trong việc: (1) Tạo boilerplate code nhanh (TypeScript interfaces, Spring JPA queries); (2) Phân tích vấn đề kỹ thuật phức tạp như performance bottleneck của `findAll()` với 94 phường; (3) Đề xuất các pattern chuẩn như cascade lookup, generic types, interceptor pattern. AI giúp nhóm tiết kiệm nhiều giờ tìm kiếm documentation và viết boilerplate.

### 9.2. Phần nào em/nhóm không sử dụng theo gợi ý của AI? Vì sao?

- **Không dùng axios**: AI mặc định gợi ý axios, nhưng nhóm đánh giá native fetch đủ dùng, tránh thêm dependency không cần thiết trong môi trường SSR.
- **Không cho RESOLVED → PENDING**: AI gợi ý transition này để "mở lại" phản ánh, nhưng không phù hợp quy trình hành chính Việt Nam.
- **Không dùng 2-role system**: AI ban đầu chỉ gợi ý citizen/admin, nhóm thiết kế lại 4 roles theo cấu trúc hành chính thực tế.
- **Không để AI implement ngay**: Khi AI vội vàng implement security-related changes, nhóm dừng lại và yêu cầu review plan trước.

### 9.3. Em/nhóm đã kiểm tra tính đúng đắn của kết quả AI như thế nào?

Nhóm áp dụng quy trình: (1) AI đề xuất → (2) Đọc documentation gốc để verify → (3) Đối chiếu với nghiệp vụ thực tế → (4) Chạy thử/compile để xác nhận → (5) Mới áp dụng vào production code. Với security-related changes, thêm bước review plan trước khi approve implement.

### 9.4. Nếu không có AI, phần nào sẽ khó khăn nhất?

Thiết kế hệ thống TypeScript types tập trung (`types/api.ts`) với 10+ domain interfaces sẽ mất nhiều giờ nếu làm thủ công. Phân tích performance bottleneck của `AutoDispatchService` với 94 phường cũng cần nhiều thời gian nếu không có AI hỗ trợ identify vấn đề.

### 9.5. Sau bài tập/project này, em/nhóm học được gì về môn học?

Học được tầm quan trọng của việc hiểu **nghiệp vụ thực tế** trước khi thiết kế hệ thống. Cấu trúc hành chính Đà Nẵng (94 phường, phân cấp quận, vai trò từng cơ quan) là kiến thức domain mà không AI nào có sẵn — cần tự nghiên cứu và cung cấp cho AI.

### 9.6. Sau bài tập/project này, em/nhóm học được gì về cách sử dụng AI có trách nhiệm?

Bài học quan trọng nhất: **AI là công cụ, không phải người ra quyết định**. Nhóm học được kỹ năng "Human in the Loop" — luôn review output của AI trước khi áp dụng, đặc biệt với security và business logic. Phát hiện hallucination đòi hỏi hiểu biết domain sâu, không thể lazy-accept mọi gợi ý của AI.

---

## IX. Cam kết học thuật

Sinh viên/nhóm cam kết rằng:

- Nội dung AI hỗ trợ đã được ghi nhận trung thực.
- Không nộp nguyên văn kết quả AI mà không kiểm tra.
- Có khả năng giải thích các phần đã nộp.
- Chịu trách nhiệm về tính đúng đắn của sản phẩm cuối cùng.
- Hiểu rằng việc sử dụng AI không khai báo có thể ảnh hưởng đến kết quả đánh giá.

| Đại diện sinh viên/nhóm | Ngày xác nhận |
|---|---|
| Phạm Tuấn Việt | 06/06/2026 |
