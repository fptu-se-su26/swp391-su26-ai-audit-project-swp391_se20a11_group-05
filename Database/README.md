# Cấu trúc Hệ thống Cơ sở dữ liệu (Smart City)

Thư mục này chứa toàn bộ cấu trúc cơ sở dữ liệu độc lập của hệ thống Đà Nẵng Lắng Nghe. Việc tách rời Database ra khỏi Backend giúp hệ thống dễ dàng mở rộng và triển khai đa dịch vụ (Microservices).

## Cấu trúc thư mục
- `init-scripts/`: Chứa file `init.sql` khởi tạo dữ liệu ban đầu cho toàn bộ 5 module.
- `migrations/`: (Dự kiến) Chứa các file nâng cấp schema (như Flyway/Liquibase).
- `schema/`: (Dự kiến) Chứa sơ đồ thực thể liên kết ERD.

## Hướng dẫn sử dụng
1. File `init-scripts/init.sql` chứa toàn bộ 12 bảng (Tables) đã được chuẩn hóa và thiết lập khóa ngoại (Foreign Keys) liên kết chặt chẽ.
2. File có bật extension `pgvector` phục vụ cho RAG (Truy xuất tăng cường bằng AI).
3. Có thể dùng lệnh sau để chạy file SQL vào DB:
   ```bash
   psql -U postgres -d smartcity_db -f init-scripts/init.sql
   ```
