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
| Phạm Bá Trí | 2026-05-20 |
