# TÀI LIỆU 4: TÍCH HỢP AI VÀ KIẾN TRÚC HYBRID RAG
**Người viết/Trình bày:** Phạm Bá Trí

## 1. Trí tuệ Nhân tạo (LLM - Groq/Gemini)
Thay vì bắt người dân phải tự chọn danh mục (rất hay chọn sai), hệ thống sử dụng Sức mạnh của Mô hình Ngôn ngữ Lớn (LLM) để phân tích ngôn ngữ tự nhiên.
- Dân viết: *"Cống trước nhà thúi quá chịu không nổi"*
- LLM phân tích và trả về định dạng JSON nghiêm ngặt (được kiểm tra bằng Validator của Spring Boot): `{"category": "Môi trường", "priority": "HIGH"}`.

## 2. Mô hình Hybrid RAG (Truy xuất tăng cường)
Hệ thống sở hữu Chatbot hỗ trợ thủ tục hành chính. Tuy nhiên, LLM thường bị "ảo giác" (Hallucination) hoặc không biết thông tin nội bộ của riêng Đà Nẵng.
- **Giải pháp:** Áp dụng Hybrid RAG (Kết hợp tìm kiếm Vector và Full-Text).
- **PostgreSQL Vector:** Tài liệu quy định pháp luật được băm nhỏ (chunking) và nhúng (embedding) thành các dãy số Vector(768).
- Thuật toán `HNSW` trong PostgreSQL sẽ tìm ra các tài liệu có độ tương đồng Cosine (Cosine Similarity) gần nhất với câu hỏi của người dân.

## 3. Database-Centric Architecture
- Việc đưa thuật toán AI Search (pgvector) và Không gian địa lý (PostGIS) vào chung PostgreSQL giúp hệ thống Đơn giản hóa về mặt hạ tầng (Infrastructure Simplicity).
- Không cần tốn tiền duy trì ElasticSearch hay Pinecone, giúp đồ án trở nên nhẹ nhàng để triển khai mà vẫn đạt tiêu chuẩn Enterprise của các tập đoàn lớn.

---
**TỔNG KẾT BẢO VỆ:** 
Hệ thống Smart City này không chỉ làm tốt phần "Bề nổi" (CRUD cơ bản) mà còn đi cực kỳ sâu vào "Phần chìm" của tảng băng: Bảo mật (MFA), Trí tuệ nhân tạo (RAG, LLM Routing), và Tối ưu Cơ sở dữ liệu (PostGIS, Indexes). Đây là nền tảng vững chắc đạt điểm tuyệt đối cho đồ án tốt nghiệp.
