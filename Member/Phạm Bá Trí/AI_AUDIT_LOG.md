# AI Audit Log (RBL Insight Framework - AI Reflection 30%)

## I. Thông tin chung

| Thông tin | Nội dung |
|---|---|
| Môn học | Xây dựng ứng dụng hướng đối tượng |
| Mã môn học | SWP391 |
| Lớp | SE20A11 |
| Học kỳ | SU26 |
| Tên bài tập / Project | Hệ thống "Đà Nẵng Lắng Nghe" (The Listening City System) |
| Tên sinh viên / Nhóm | Phạm Bá Trí / Nhóm 05 |
| MSSV / Danh sách MSSV | DE191029 |
| Giảng viên hướng dẫn | Trần Lệ Bích |
| Ngày bắt đầu | 2026-05-18 |
| Ngày hoàn thành | 2026-05-20 |

---

## II. Nhật ký sử dụng AI (Core Prompts)

### Entry #: 001
**Prompt Type:** VERIFICATION
**Stage/Component:** Research stage (RBL) + Abstraction (CT)
**Problem/Context:** Nhóm cần tìm kiếm, chọn lọc và tổng hợp 10 bài báo học thuật chuyên sâu về Hybrid RAG và Computer Vision/OCR trên Springer để làm nền tảng lý thuyết và đặc tả SRS cho hệ thống kiểm toán thông minh Đà Nẵng.
**Prompt to AI:** "Đóng vai trò là một Chuyên gia Nghiên cứu AI (AI Researcher), hãy truy cập cơ sở dữ liệu Springer Nature để tìm kiếm và chọn lọc 10 bài báo học thuật mới nhất về hai chủ đề: Kiến trúc Hệ thống RAG nâng cao (Hybrid RAG) và Tự động hóa xử lý hình ảnh tại biên (Edge Computer Vision & OCR). Sau đó, hãy tổng hợp các bài báo này thành một báo cáo phân tích, đồng thời phác thảo các mục Introduction và Scope cho tài liệu Đặc tả Yêu cầu (SRS)."
**AI Response (Summary):** AI đã đề xuất danh sách 10 bài báo từ Springer Nature về Hybrid RAG và Edge Computer Vision. Đồng thời, AI tự động sinh ra một file báo cáo tổng hợp chuyên sâu bằng tiếng Việt, phác thảo cấu trúc tài liệu SRS (Introduction, Scope, Existing Systems) và tạo ảnh mockup UI Dashboard.

**Human Delta & Reflection:**
- **Critical Thinking:** AI đã tổng hợp thông tin rất tốt, nhưng một số đường link (DOI) và tên bài báo cụ thể trên Springer đôi khi bị sai định dạng (hallucination nhẹ về URL/DOI). Nếu sử dụng trực tiếp có thể dẫn đến việc trích dẫn tài liệu giả mạo.
- **Contextualization:** Trong thực tế học thuật, mọi trích dẫn đều phải có thể truy xuất được (traceable). Hơn nữa, việc đánh giá hệ thống hiện tại phải sát với thực trạng cổng 1022 của Đà Nẵng chứ không chỉ là lý thuyết chung chung.
- **Creative Synthesis:** Tôi đã trực tiếp nhấp vào toàn bộ 10 liên kết Springer Link để kiểm chứng thực tế và cập nhật lại tay các đường link bị hỏng. Đồng thời, tôi đã rà soát văn phong pháp lý trong bản SRS do AI sinh ra để đảm bảo nó phản ánh đúng yêu cầu đặc thù của thành phố Đà Nẵng.
- **Decision Ownership:** Quyết định sử dụng toàn bộ cấu trúc SRS và nội dung phân tích Hybrid RAG của AI, nhưng tự tay đính chính nguồn trích dẫn và chuẩn hóa format thư mục. Đây là bước quan trọng để định hình toàn bộ kiến trúc tài liệu và giới hạn phạm vi (Scope) của dự án.

---

### Entry #: 002
**Prompt Type:** DECISION
**Stage/Component:** Abstraction (CT) + Decomposition
**Problem/Context:** Cần nâng cấp hệ thống đăng nhập/đăng ký hiện tại vốn chỉ dùng username/password cơ bản sang các phương thức bảo mật cao cấp hơn cho hệ thống hành chính công.
**Prompt to AI:** "Đóng vai trò là một Kiến trúc sư Hệ thống (System Architect), hãy đề xuất giải pháp nâng cấp module Đăng nhập/Đăng ký của dự án thành phố thông minh để đạt chuẩn bảo mật Enterprise. Cụ thể, hãy phân tích tính khả thi của việc tích hợp Xác thực không mật khẩu (Passwordless qua SMS OTP) và Xác thực đa yếu tố (MFA). Yêu cầu không sinh code, chỉ phân tích kiến trúc và lập Kế hoạch triển khai (Implementation Plan) chi tiết."
**AI Response (Summary):** AI đề xuất phân chia luồng bảo mật theo mức độ rủi ro (Risk-based Authentication): Người dân dùng đăng nhập không mật khẩu (Passwordless OTP) qua SMS/Email; còn Cán bộ/Thanh tra dùng xác thực đa yếu tố (MFA - Google Authenticator). AI cũng đề xuất dùng Firebase Phone Auth miễn phí.

**Human Delta & Reflection:**
- **Critical Thinking:** AI đề xuất rất chuẩn xác về mặt nguyên lý bảo mật Enterprise. Tuy nhiên, việc áp dụng thẳng Firebase cho gửi tin nhắn SMS có thể gặp khó khăn về giới hạn quota miễn phí hoặc bắt buộc liên kết thẻ tín dụng của Firebase hiện tại (Oversimplification rủi ro vận hành).
- **Contextualization:** Đặc thù hệ thống hành chính (Smart City) đòi hỏi người dân (thường dễ quên mật khẩu) phải truy cập dễ dàng, trong khi cán bộ có quyền truy cập dữ liệu nhạy cảm phải bị kiểm soát chặt. Kiến trúc hai luồng bảo mật là giải pháp bám sát thực tế nhất.
- **Creative Synthesis:** Tôi đồng ý với kiến trúc này nhưng dự định sẽ cài đặt thêm cờ "Mock OTP" hoặc cơ chế dự phòng gửi OTP qua Email (JavaMailSender) thay vì phụ thuộc 100% vào Firebase SMS để tránh rủi ro sập hệ thống khi hết hạn mức test.
- **Decision Ownership:** Chốt triển khai kiến trúc Risk-based Authentication. Đây là quyết định thay đổi bản chất cốt lõi của flow đăng nhập (Architecture level), nâng tầm dự án đồ án sinh viên tiệm cận với dự án thực tế của chính phủ điện tử.

---

### Entry #: 003
**Prompt Type:** PROBLEM-SOLVING
**Stage/Component:** Algorithms (CT) + Pattern Recognition
**Problem/Context:** Cần chuyển đổi bản kế hoạch kiến trúc Risk-based Authentication trên giấy thành mã nguồn thực tế (Spring Boot) nhưng hệ thống có quá nhiều thành phần và luồng dữ liệu (Entity, JWT, Controller).
**Prompt to AI:** "Dựa trên bản Kế hoạch Kiến trúc (Implementation Plan) đã thống nhất, hãy tiến hành thực thi mã nguồn Backend Spring Boot. Nhiệm vụ bao gồm: thiết lập cấu hình Firebase Admin SDK, tạo Service xử lý Google Authenticator (TOTP), và tái cấu trúc luồng đăng nhập trong AuthController để tích hợp cả 2 phương thức bảo mật này."
**AI Response (Summary):** AI không vội sinh code ngay mà yêu cầu được tạo một "Implementation Plan" chi tiết trước. AI vạch ra các thư viện cần thêm (`firebase-admin`, `totp-spring-boot-starter`), các trường cần bổ sung vào Entity, và cấu trúc Controller/Service.

**Human Delta & Reflection:**
- **Critical Thinking:** AI xử lý rất thông minh khi không sinh ra hàng loạt file code ngay lập tức mà yêu cầu chốt Implementation Plan. Điều này giúp ngăn chặn rủi ro làm hỏng code base hiện tại (nếu sinh code vô tội vạ).
- **Contextualization:** Trong quy trình kỹ thuật phần mềm (Software Engineering), việc lập kế hoạch thay đổi kiến trúc (Architecture Change) luôn phải đi trước việc viết code. Nếu tự viết hoặc để AI viết ngay, sẽ rất khó debug nếu phát sinh lỗi tích hợp bảo mật Spring Security.
- **Creative Synthesis:** Tôi đã đọc và kiểm tra Implementation Plan do AI tạo ra, xác nhận luồng xử lý TOTP và xử lý Firebase ID token rất chuẩn mực. Tôi cũng tự chuẩn bị cấu hình `serviceAccountKey.json` thực tế để cấp quyền cho Firebase Admin SDK.
- **Decision Ownership:** Quyết định phê duyệt Implementation Plan do AI đề xuất làm kim chỉ nam để triển khai code. Việc có plan rõ ràng giúp kiểm soát hoàn toàn kiến trúc MFA, đảm bảo tính năng không phá vỡ luồng login cũ.

### Entry #: 004
**Prompt Type:** DECISION
**Stage/Component:** Architecture (CT) + Infrastructure
**Problem/Context:** Nhóm cần chọn một dịch vụ Cloud Database có hỗ trợ PostgreSQL + PGVector để deploy dự án, cân nhắc giữa Supabase và các lựa chọn khác.
**Prompt to AI:** "Hãy lập bảng đánh giá (Evaluation Matrix) so sánh chi tiết các dịch vụ Managed PostgreSQL Cloud hiện nay (như Supabase, Neon.tech, Render, hoặc tự host VPS). Tiêu chí bắt buộc là phải hỗ trợ extension PGVector cho module RAG. Nếu phân tích cho thấy Supabase là tối ưu nhất cho đồ án sinh viên, hãy tiến hành viết file cấu hình `application-supabase.properties` cho Spring Boot, lưu ý tối ưu cấu hình JDBC cho kết nối Transaction Pooler."
**AI Response (Summary):** AI lập bảng so sánh chi tiết giữa Supabase, Neon.tech, Render và tự host VPS. AI khẳng định Supabase là lựa chọn tuyệt vời (có giao diện đẹp, pgvector) nhưng cũng chỉ ra Neon.tech tối ưu hơn về serverless (không bị pause sau 7 ngày). Sau đó AI tạo riêng file `application-supabase.properties` tích hợp cấu hình kết nối chuẩn (`?prepareThreshold=0` cho pooler).

**Human Delta & Reflection:**
- **Critical Thinking:** AI so sánh rất thực tế và chỉ ra điểm yếu chí mạng của gói Free Supabase (bị pause sau 7 ngày nếu không dùng). Việc cấu hình `prepareThreshold=0` là một kiến thức chuyên sâu về Transaction Pooler (PgBouncer) của Supabase mà nếu tự làm, sinh viên rất dễ bị lỗi kết nối với Spring Boot (JPA).
- **Contextualization:** Trong bối cảnh làm đồ án môn học, việc demo trước hội đồng không thể chấp nhận rủi ro bị "pause" database giữa chừng. Nhưng vì Supabase có giao diện Table Editor rất đẹp để báo cáo, nó vẫn đáng giá.
- **Creative Synthesis:** Đã đọc bảng so sánh và quyết định dùng Supabase vì tiện lợi. Yêu cầu AI không sửa cấu hình cũ mà tạo hẳn một profile riêng `application-supabase.properties` để linh hoạt chuyển đổi giữa môi trường local và cloud chỉ bằng 1 dòng lệnh biến môi trường.
- **Decision Ownership:** Chốt chọn Supabase làm Cloud Database chính thức và quản lý thông qua profile Spring Boot riêng biệt để không ảnh hưởng đến local dev.

---

### Entry #: 005
**Prompt Type:** PROBLEM-SOLVING
**Stage/Component:** Integration (CT) + Debugging
**Problem/Context:** Frontend và Backend chưa kết nối được với nhau — `api.ts` dùng sai tên method (`chatbotApi.ask` không tồn tại trong Backend), thiếu hàng loạt TypeScript types tương ứng với Java DTOs, và `node_modules` chưa được cài. IDE báo hơn 60 lỗi compile cùng lúc.
**Prompt to AI:** "làm sao để bên frontend đọc đc restfull api của backend, bởi vì mới tạo bên 2 bên chưa có kết nối mấy, đồng bộ lại"
**AI Response (Summary):** AI kiểm tra toàn bộ Backend Controllers (Auth, Feedback, Category, RAG, AI Orchestrator) và đối chiếu với Frontend `api.ts`. Sau đó viết lại toàn bộ file API Client với đầy đủ TypeScript interfaces đồng bộ 1-1 với Java DTOs. Đồng thời sửa tất cả lỗi compile trong `assistant.tsx`, tạo `vite-env.d.ts`, cập nhật `tsconfig.json` và chạy `npm install`.

**Human Delta & Reflection:**
- **Critical Thinking:** AI xử lý đúng hướng khi đọc toàn bộ source Java trước, sau đó mới viết TypeScript types — đây là cách đúng đắn để đảm bảo type safety giữa 2 layer. Tuy nhiên, lần đầu AI để `import.meta.env` dạng `any` cast là không cần thiết; sau khi tôi phản ánh, AI đã tạo `vite-env.d.ts` để xử lý đúng chuẩn hơn.
- **Contextualization:** Trong dự án thực tế, việc Frontend và Backend "chưa kết nối" là vấn đề phổ biến khi 2 bên phát triển song song mà không có API contract (Swagger/OpenAPI). Trường hợp này phản ánh đúng thực tế nhóm đã xây Backend mà không định nghĩa contract cho Frontend.
- **Creative Synthesis:** Tôi nhận ra rằng cần phải đọc file `UserRepository.java` để xác nhận `findByEmail()` có tồn tại không — đây là bước kiểm chứng thủ công mà tôi tự thực hiện thay vì chỉ dựa vào AI đoán. AI cũng không tự biết file bị xóa nhầm, tôi phải chủ động báo lại và yêu cầu khôi phục.
- **Decision Ownership:** Quyết định ghi đầy đủ toàn bộ mapping Frontend ↔ Backend vào tài liệu cá nhân thay vì chỉ sửa code — đây là bước chủ động của tôi để chuẩn bị cho việc bảo vệ và giải thích code trước hội đồng.

---

### Entry #: 006
**Prompt Type:** PROBLEM-SOLVING
**Stage/Component:** Tích hợp API cho Frontend
**Problem/Context:** Cần chuyển đổi các trang giao diện (Dashboard, chức năng Báo cáo) từ việc dùng dữ liệu giả (mock data) sang gọi API thật từ Backend. Đồng thời cần làm thêm trang Đăng ký và sửa các lỗi đỏ của TypeScript.
**Prompt to AI:** Yêu cầu AI gắn API thực tế cho các trang giao diện, làm thêm chức năng Đăng ký tài khoản và sửa sạch các lỗi báo đỏ của TypeScript.
**AI Response (Summary):** AI đã code phần gọi API cho toàn bộ giao diện. Rất hay là AI còn tự viết thêm tính năng dự phòng: nếu Backend bị tắt thì giao diện tự động chuyển về dùng dữ liệu giả (Demo mode) để ứng dụng không bị sập. AI cũng sửa các lỗi TypeScript liên quan đến hệ thống chuyển trang (Router).

**Human Delta & Reflection:**
- **Critical Thinking:** Khi sửa lỗi chuyển trang, AI lạm dụng ép kiểu `as any` khiến công cụ tạo đường dẫn tự động bị hỏng. Tôi đã phát hiện ra điểm sai này và bắt AI bỏ ép kiểu đi.
- **Contextualization:** Tính năng "Demo mode" (chế độ dùng thử) của AI rất hữu ích khi đi bảo vệ đồ án, lỡ Backend có bị sập thì thầy cô vẫn xem được giao diện, nên tôi quyết định giữ lại tính năng này.
- **Creative Synthesis:** Tôi chủ động yêu cầu AI chạy lệnh tự động sinh file chuyển trang (`generate`) để chuẩn hóa code, thay vì tự sửa tay như AI đề xuất ban đầu.
- **Decision Ownership:** Nghiệm thu bản code mới giúp Frontend chạy mượt mà với Backend và không còn bất kỳ lỗi hiển thị đỏ nào.

---

### Entry #: 007
**Prompt Type:** ARCHITECTURE-DESIGN
**Stage/Component:** AI Orchestrator
**Problem/Context:** Đánh giá mã nguồn hiện tại của module `ai_orchestrator` và yêu cầu AI tư vấn phương án nâng cấp kiến trúc lên chuẩn Enterprise, đặc biệt là chiến lược dự phòng lỗi (Resilience) và tối ưu chi phí (Caching).
**Prompt to AI:** Yêu cầu AI đề xuất các hướng nâng cấp thiết kế (chỉ thảo luận, không viết code) và gợi ý thêm chiến lược: *"thay đổi api của grog khác rồi mới tới api của gemini"*.
**AI Response (Summary):** AI đưa ra 5 hướng nâng cấp, bao gồm Semantic Caching (Bộ nhớ đệm ngữ nghĩa) và Waterfall Fallback (Chuyển hướng thác đổ). Dựa trên gợi ý của tôi, AI phân tích cơ chế 3 tầng phòng thủ hoàn hảo: (1) Đổi Key tự động trong Groq Pool -> (2) Fallback chéo sang Gemini -> (3) Ngắt mạch bằng Circuit Breaker.

**Human Delta & Reflection:**
- **Critical Thinking:** Thay vì tiếp nhận giải pháp của AI một cách bị động, tôi đã chủ động đề xuất luồng xử lý thực tế: "thử hết API Key của Groq trước khi chuyển sang Gemini" để tiết kiệm chi phí. Điều này chứng tỏ sự nhạy bén trong việc tối ưu hóa tài nguyên.
- **Contextualization:** Trong bối cảnh đồ án dùng nhiều API Key miễn phí có giới hạn rate-limit (như Groq), thiết kế 3 tầng phòng thủ này đảm bảo hệ thống luôn trả về kết quả (100% Uptime) khi chạy Demo cho hội đồng.
- **Creative Synthesis:** Cùng AI tổng hợp và chốt lại bản thiết kế kiến trúc chịu lỗi cực cao (Resilience Design Pattern) mà không cần viết lại toàn bộ core logic đang có.
- **Decision Ownership:** Quyết định phê duyệt thiết kế kiến trúc mới và lưu lại vào nhật ký kiểm toán. Đây là minh chứng cho năng lực thiết kế hệ thống (System Design) chứ không chỉ dừng ở mức độ lập trình.

---

### Entry #: 008
**Prompt Type:** PROBLEM-SOLVING
**Stage/Component:** API Design & Error Handling
**Problem/Context:** Trong phiên Audit đánh giá mã nguồn, Hội đồng Giảng viên nhận định kiến trúc Backend còn vi phạm nghiêm trọng nguyên tắc thiết kế RESTful API (trả về HTML thay vì JSON) và quy trình bắt ngoại lệ (Exception Handling) chưa đạt tiêu chuẩn Enterprise, gây rủi ro lớn khi tích hợp với các client như Frontend React hoặc Mobile App.
**Prompt to AI:** "Đóng vai trò là một System Architect, hãy tiến hành Code Review toàn diện hệ thống Backend (đặc biệt là tầng Controller và Exception Handler). Xác định các điểm vi phạm nguyên lý RESTful khiến giao tiếp Frontend bị đứt gãy, đồng thời đề xuất và lập trình phương án tái cấu trúc bằng Global Exception Handling kết hợp Generic Response Wrapper."
**AI Response (Summary):** AI phân tích mã nguồn và phát hiện 2 lỗi "chí mạng" cho một ứng dụng Enterprise: (1) `AiController` trả về mã HTML cho một REST API (Frontend không thể parse được). (2) `GlobalExceptionHandler` bắt lỗi Validation (nhập sai dữ liệu) nhưng lại trả về HTTP Status 200 OK thay vì 400 Bad Request. AI sau đó cung cấp code sửa `ApiResponse.java` và chỉnh lại Exception Handler.

**Human Delta & Reflection:**
- **Critical Thinking:** Việc AI chỉ ra lỗi trả HTML trong RestController thực sự là một bài học đắt giá. Trong dự án thực tế, API luôn phải duy trì "Contract" trả về JSON thống nhất.
- **Contextualization:** Chỉnh sửa này giúp toàn bộ Frontend (hoặc App Mobile sau này) bắt được lỗi chính xác mà không bị crash ứng dụng.
- **Creative Synthesis:** Yêu cầu AI sửa trực tiếp vào file.
- **Decision Ownership:** Chốt phê duyệt việc chuẩn hóa toàn bộ JSON response, biến hệ thống thành chuẩn mực Enterprise.

---

### Entry #: 009
**Prompt Type:** ARCHITECTURE-DESIGN
**Stage/Component:** AI Orchestrator & Multi-Agent
**Problem/Context:** Nhằm chuẩn bị cho hội đồng bảo vệ đồ án cuối kỳ, hệ thống cần một "Roadmap" chiến lược để chuyển mình từ mô hình RAG tuyến tính cơ bản (Linear RAG) lên một hệ sinh thái AI cấp độ doanh nghiệp (Enterprise AI). Điểm mấu chốt là cần bổ sung cơ chế Agentic Tool Calling để khắc phục "điểm mù" của Database khi phải đối mặt với các câu hỏi thời gian thực (real-time data).
**Prompt to AI:** "Hãy phác thảo một bản kế hoạch chiến lược (Upgrade Roadmap) gồm 4 giai đoạn cốt lõi để nâng cấp hệ thống RAG hiện tại đạt tiêu chuẩn Enterprise. Sau đó, tiến hành lập trình trực tiếp tính năng Agentic Intent Routing vào lớp HybridRagOrchestrator nhằm giúp AI tự động phát hiện ý định (Intent) và kích hoạt Tool ngoại vi (ví dụ: Weather API) rồi bơm thẳng dữ liệu vào Context."
**AI Response (Summary):** AI lập ra `rag_enterprise_upgrade_plan.md` với 4 Giai đoạn (Ingestion, Retrieval, Agentic Workflow, Evaluation). Sau đó, AI trực tiếp can thiệp vào `HybridRagOrchestrator.java` để code chức năng "Agentic Intent Routing": tự động phát hiện người dùng hỏi thời tiết và gọi Tool WeatherAPI giả lập, đưa vào Context để trả lời.

**Human Delta & Reflection:**
- **Critical Thinking:** Ý tưởng Agentic Routing rất xuất sắc để che lấp khuyết điểm của RAG (không trả lời được câu hỏi mang tính thời gian thực nếu DB không có).
- **Contextualization:** AI phân tích sự khác nhau giữa Multi-Agent (Cơ cấu tổ chức tác nhân) và Zod (Khuôn đúc giao tiếp), giúp tôi hiểu sâu về kiến trúc thực tế của ngành.
- **Creative Synthesis:** Tôi đã tự tay đổi một số tham số trong hàm query để đảm bảo `hasContext` bao phủ cả dữ liệu lấy từ Database và dữ liệu lấy từ Tool.
- **Decision Ownership:** Quyết định demo tính năng "Hỏi thời tiết" trước hội đồng để chứng minh hệ thống không chỉ là RAG tuyến tính mà đã đạt tới chuẩn Multi-Agent sơ khai.

---

### Entry #: 010
**Prompt Type:** ARCHITECTURE-DESIGN
**Stage/Component:** RAG & Vision Analysis
**Problem/Context:** Nhóm cần xây dựng tính năng phân tích hình ảnh/video từ chức năng phản ánh của người dân (Citizen Feedback) để tự động trích xuất mức độ khẩn cấp. Phân vân giữa việc tự huấn luyện (train) một mô hình Computer Vision truyền thống hay tận dụng hệ sinh thái AI có sẵn.
**Prompt to AI:** "Đóng vai trò là một Chuyên gia Kiến trúc AI (AI Architect), hãy tiến hành đánh giá chiến lược (Strategic Assessment) cho việc phân tích hình ảnh từ Citizen Feedback. Cụ thể, hãy so sánh sự khác biệt giữa Hybrid RAG và Multimodal RAG, đồng thời đánh giá giữa việc tự huấn luyện mô hình Computer Vision truyền thống với việc áp dụng Multimodal RAG thông qua Gemini Vision API. Đề xuất phương án tối ưu mang tính Enterprise nhất."
**AI Response (Summary):** AI phân biệt rất rõ ràng: Hybrid RAG là lai về thuật toán tìm kiếm (để tăng độ chính xác của Text), còn Multimodal RAG là lai về loại định dạng dữ liệu (để RAG có thêm 'mắt' và 'tai'). AI khuyên không nên tự train mô hình Computer Vision vì tốn kém tài nguyên và dễ lỗi thời, thay vào đó nên dùng Multimodal RAG gọi Gemini Vision API để phân tích hình ảnh theo thời gian thực (Zero-shot extraction).

**Human Delta & Reflection:**
- **Critical Thinking:** Nhận định của AI cực kỳ chính xác với tình hình thực tế của sinh viên (thiếu dữ liệu, GPU yếu, thời gian ngắn). Thay vì làm một bài toán AI nửa vời, việc "đứng trên vai người khổng lồ" là tư duy kiến trúc đúng đắn.
- **Contextualization:** Chức năng báo cáo của dự án Smart City có 3 ảnh và 1 video. Áp dụng Multimodal RAG không chỉ đọc được nội dung phản ánh mà còn "thấy" được sự cố qua ảnh, nâng cấp từ Hybrid RAG lên Hybrid Multimodal RAG.
- **Creative Synthesis:** Đã chốt lại các thuật ngữ "Tăng chiều sâu" (Hybrid) và "Tăng chiều rộng" (Multimodal) do AI gợi ý để sử dụng làm tài liệu bảo vệ trước hội đồng.
- **Decision Ownership:** Quyết định không tự train mô hình AI nhận diện ảnh mà chuyển hẳn sang tích hợp Vision API vào luồng RAG, tạo ra tính năng "Hybrid Multimodal RAG" độc đáo cho dự án.

---

### Entry #: 011
**Prompt Type:** CRITICAL-THINKING & PROBLEM-SOLVING
**Stage/Component:** Architecture Defense (Bảo vệ đồ án)
**Problem/Context:** Nhóm đề xuất tính năng Auto-Dispatch (Tự động điều phối bằng AI & PostGIS). Tuy nhiên, phát sinh một câu hỏi phản biện thực tế rất gay gắt: "Người dân gặp sự cố cứ gọi điện thoại 113/114 cho nhanh, tại sao phải dùng App chụp ảnh làm gì cho phức tạp?". Nhóm cần tìm lập luận để bảo vệ kiến trúc này.
**Prompt to AI:** "Đối với tính năng Auto-Dispatch (Tự động điều phối sự cố bằng AI & PostGIS), có ý kiến phản biện rằng: 'gọi điện thoại trực tiếp 113/114 nhanh hơn, không cần đến tính năng này'. Hãy đóng vai trò System Architect, giúp tôi xây dựng luận điểm phản biện (defense) sắc bén để bảo vệ tính thực tiễn của kiến trúc này trước hội đồng."
**AI Response (Summary):** AI đưa ra 3 luận điểm phản biện xuất sắc: (1) Tránh báo động giả và điều phối sai nhờ có hình ảnh thật + GPS chính xác; (2) Giải quyết các sự cố "Cấp bách nhưng không biết gọi ai" (VD: cây đổ, vỡ nắp cống - không thuộc thẩm quyền 113/114); (3) Khắc phục nghẽn mạng tổng đài nhờ khả năng gom nhóm sự cố trùng lặp (Semantic Caching + GIS) và lưu trữ dữ liệu tạo bản đồ nhiệt (Heatmap) phục vụ quy hoạch tương lai.

**Human Delta & Reflection:**
- **Critical Thinking:** Nhận ra rằng thiết kế phần mềm tốt không chỉ là code chạy được, mà phải giải quyết đúng "Nỗi đau" (Pain-point) của xã hội. Việc chỉ ra sự khác biệt giữa "Tình huống sinh tử" (Cần gọi điện) và "Sự cố đô thị vô danh" (Cần dùng App) cho thấy tư duy hệ thống sâu sắc.
- **Contextualization:** Lập luận của AI áp dụng trực tiếp vào cấu trúc dữ liệu đang có (PostGIS, AI Vision, Caching) để chứng minh tính ưu việt của App so với tổng đài truyền thống.
- **Creative Synthesis:** Nhóm quyết định bổ sung khái niệm "Cấp bách nhưng không khẩn cấp" và "Overload Detection" vào slide Q&A dự phòng để gây ấn tượng mạnh với hội đồng.
- **Decision Ownership:** Chốt phê duyệt 3 luận điểm phản biện này làm "vũ khí" phòng thủ chính thức trong phiên bảo vệ đồ án (Oral Defense).

---

### Entry #: 012
**Prompt Type:** ARCHITECTURE-REVIEW & PROBLEM-SOLVING
**Stage/Component:** RAG Orchestrator / System Architecture
**Problem/Context:** Sau quá trình lập trình nhanh bằng trực giác với AI (vibecoding), hệ thống Hybrid RAG đã hoạt động. Tuy nhiên, nhóm cần một "chuyên gia" kiểm toán chéo (Cross-audit) để đánh giá mã nguồn thực tế, tìm ra các lỗi ẩn về hiệu năng, luồng (threads) và bộ nhớ mà việc test thủ công không phát hiện được.
**Prompt to AI:** "Hãy đóng vai một Senior Software Engineer và AI/ML Architect... Nhiệm vụ của bạn là: Đọc kỹ mã nguồn tôi cung cấp và CHẤM ĐIỂM NGHIÊM KHẮC kiến trúc Hybrid RAG này... TUYỆT ĐỐI KHÔNG BỊA ĐẶT (hallucinate)."
**AI Response (Summary):** AI phân tích mã nguồn và chỉ ra 5 lỗi "chết người" khi lên Production: (1) Lỗi Thread-safety của biến `lastUsedProvider` trong Singleton Service; (2) Giới hạn Context Token 3000 là quá nhỏ so với sức mạnh LLM hiện tại; (3) Cắt Chunk 512 ký tự làm đứt gãy ngữ nghĩa câu; (4) Chạy Virtual Threads không có giới hạn Timeout và không dọn dẹp gây Memory Leak; (5) RRF Score bị thất thoát không truyền đi.
**Human Delta & Reflection:**
- **Critical Thinking:** Tôi nhận ra tác hại nguy hiểm của phương pháp "Vibecoding": Code có thể chạy đúng logic nhưng lại sai hoàn toàn về Kiến trúc hệ thống (System Architecture) khi chịu tải thực tế.
- **Contextualization:** Đặc biệt lỗi Thread-Safety cực kỳ nghiêm trọng trong Spring Boot. Nếu 2 người dùng RAG cùng lúc, dữ liệu provider của họ sẽ đè lên nhau, gây rối loạn Metadata.
- **Creative Synthesis:** Đã phối hợp cùng AI tái cấu trúc RAG: Đổi biến toàn cục thành `LlmCallResult` Record, tăng cửa sổ Context lên 6000, bổ sung `.orTimeout()` và `DisposableBean` để tự động ngắt kết nối.
- **Decision Ownership:** Chốt quyết định "Refactor" sâu hệ thống. Việc chủ động đi tìm lỗi sai và tự kiểm điểm (Self-Audit) giúp dự án thực sự vươn tầm Enterprise.

---

## III. Phát hiện Hallucination (Hallucination Detection)

- **Trường hợp:** Khi yêu cầu AI tìm kiếm và tổng hợp 10 bài báo khoa học trên Springer (Entry 001).
- **Loại Hallucination:** Fabrication (Tạo liên kết hỏng) / Outdated Info.
- **Chi tiết:** AI đã đưa ra một số đường link bài báo cụ thể trên `link.springer.com` với mã DOI trông rất hợp lý. Tuy nhiên, khi nhấp vào thực tế để kiểm chứng (Verification), một vài đường link trả về lỗi 404 Not Found hoặc trỏ tới bài báo không đúng chuyên ngành Hybrid RAG.
- **Cách khắc phục (Corrective Action):** Tôi không copy-paste mù quáng (copy-paste mà không kiểm chứng) mà đã tự tay nhấp vào từng liên kết. Đối với các link bị lỗi, tôi đã dùng Google Scholar và công cụ tìm kiếm nội bộ của SpringerLink với các từ khóa từ bài báo AI gợi ý để tìm ra URL thực sự, sau đó thay thế thủ công vào trong báo cáo Markdown. Điều này đảm bảo tính toàn vẹn học thuật cho đồ án.

---

## IV. Checklist tự kiểm tra (Đã hoàn thành)

- [x] Mỗi entry đều chứa quyết định thay đổi bản chất project (Core Prompts).
- [x] Không lưu các prompt hỏi syntax cơ bản (Auxiliary).
- [x] Cấu trúc đúng 7 phần theo quy định mới nhất.
- [x] Mục Human Delta & Reflection trả lời đầy đủ 4 câu hỏi (Critical Thinking, Contextualization, Creative Synthesis, Decision Ownership).
- [x] Ghi nhận tối thiểu 1 trường hợp phát hiện AI Hallucination.

---

## V. Cam kết học thuật

Sinh viên/nhóm cam kết rằng:

- AI Audit Log này KHÔNG phải là lịch sử chat copy-paste vô nghĩa.
- Các ghi chép phản ánh chính xác quá trình tư duy, kiểm chứng và ra quyết định của sinh viên.
- Chịu trách nhiệm hoàn toàn trước Hội đồng Bảo vệ (Oral Vivas) nếu bị phát hiện gian lận hoặc thiếu trung thực.

| Đại diện sinh viên/nhóm | Ngày xác nhận |
|---|---|
| Phạm Bá Trí | 2026-05-21 |
