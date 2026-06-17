CREATE EXTENSION IF NOT EXISTS vector;

-- Thêm cột description_vector có kích thước 768 chiều vào bảng feedbacks
ALTER TABLE feedbacks 
    ADD COLUMN IF NOT EXISTS description_vector vector(768);

-- Tạo chỉ mục HNSW cho cột description_vector sử dụng khoảng cách cosine (vector_cosine_ops)
CREATE INDEX IF NOT EXISTS feedbacks_description_vector_hnsw_idx 
    ON feedbacks USING hnsw (description_vector vector_cosine_ops);
