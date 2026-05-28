-- Kích hoạt pgvector extension cho hệ thống RAG
-- Script này chạy tự động khi Docker container khởi tạo lần đầu.
CREATE EXTENSION IF NOT EXISTS vector;
