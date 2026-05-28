-- ==============================================================================
-- HYBRID RAG (VECTOR + BM25) IMPLEMENTATION FOR LEGAL DOCUMENTS
-- Run this script in the Supabase SQL Editor
-- ==============================================================================

-- 1. Enable the pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create the Legal Document Chunks table
CREATE TABLE IF NOT EXISTS legal_documents (
    id BIGSERIAL PRIMARY KEY,
    document_title VARCHAR(255) NOT NULL,
    chapter_name VARCHAR(255),
    article_number VARCHAR(50), -- Example: "Điều 5"
    clause_number VARCHAR(50),  -- Example: "Khoản 2"
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    embedding VECTOR(768), -- Assumes using an embedding model with 768 dimensions (like some open-source models or Vertex AI). Adjust if using OpenAI (1536).
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Create a GIN index for faster Full-Text Search (BM25 Lexical Search)
-- Using the 'simple' dictionary or 'vietnamese' if available. 
-- For Vietnamese without a specific dictionary, 'simple' is safest.
CREATE INDEX idx_legal_docs_content_fts ON legal_documents 
USING GIN (to_tsvector('simple', content));

-- 4. Create an HNSW index for faster Vector Search (Semantic Search)
CREATE INDEX idx_legal_docs_embedding ON legal_documents 
USING hnsw (embedding vector_cosine_ops);

-- ==============================================================================
-- 5. HYBRID SEARCH STORED PROCEDURE WITH RECIPROCAL RANK FUSION (RRF)
-- ==============================================================================
-- This function runs entirely inside Postgres, saving CPU and bandwidth for Spring Boot!

CREATE OR REPLACE FUNCTION hybrid_search_legal(
    query_text TEXT,
    query_embedding VECTOR(768),
    match_count INT DEFAULT 5,
    full_text_weight FLOAT DEFAULT 1.0,
    semantic_weight FLOAT DEFAULT 1.0,
    rrf_k INT DEFAULT 60
)
RETURNS TABLE (
    id BIGINT,
    document_title VARCHAR,
    article_number VARCHAR,
    content TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH semantic_search AS (
        SELECT 
            legal_documents.id,
            RANK() OVER (ORDER BY legal_documents.embedding <=> query_embedding) AS rank
        FROM legal_documents
        ORDER BY legal_documents.embedding <=> query_embedding
        LIMIT match_count * 2
    ),
    keyword_search AS (
        SELECT 
            legal_documents.id,
            RANK() OVER (ORDER BY ts_rank_cd(to_tsvector('simple', legal_documents.content), plainto_tsquery('simple', query_text)) DESC) AS rank
        FROM legal_documents
        WHERE to_tsvector('simple', legal_documents.content) @@ plainto_tsquery('simple', query_text)
        ORDER BY ts_rank_cd(to_tsvector('simple', legal_documents.content), plainto_tsquery('simple', query_text)) DESC
        LIMIT match_count * 2
    )
    SELECT 
        ld.id,
        ld.document_title,
        ld.article_number,
        ld.content,
        (COALESCE(1.0 / (rrf_k + ss.rank), 0.0) * semantic_weight + 
         COALESCE(1.0 / (rrf_k + ks.rank), 0.0) * full_text_weight)::FLOAT AS similarity
    FROM legal_documents ld
    LEFT JOIN semantic_search ss ON ld.id = ss.id
    LEFT JOIN keyword_search ks ON ld.id = ks.id
    WHERE ss.id IS NOT NULL OR ks.id IS NOT NULL
    ORDER BY similarity DESC
    LIMIT match_count;
END;
$$;
