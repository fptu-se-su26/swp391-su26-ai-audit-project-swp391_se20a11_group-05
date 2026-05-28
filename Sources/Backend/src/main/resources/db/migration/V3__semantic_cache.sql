-- =====================================================
-- Flyway Migration: V3__semantic_cache.sql
-- Tạo bảng semantic_cache cho bộ nhớ đệm AI (PGVector)
-- =====================================================

CREATE TABLE IF NOT EXISTS semantic_cache (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    query_text    TEXT        NOT NULL,
    query_vector  VECTOR(1536), -- Khớp với model embedding (text-embedding-3-small)
    response_text TEXT        NOT NULL,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    last_hit_at   TIMESTAMPTZ DEFAULT NOW(),
    hit_count     INTEGER     DEFAULT 1
);

-- Index HNSW cho việc tra cứu Cosine Similarity nhanh chóng
CREATE INDEX IF NOT EXISTS idx_semantic_cache_embedding_hnsw
    ON semantic_cache
    USING hnsw (query_vector vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);
