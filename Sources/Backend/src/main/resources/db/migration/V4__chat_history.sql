-- =====================================================
-- Flyway Migration: V4__chat_history.sql
-- Tạo bảng chat_history cho Chatbot Assistant module
-- =====================================================

CREATE TABLE IF NOT EXISTS chat_history (
    id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     BIGINT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question    TEXT          NOT NULL,
    answer      TEXT,
    doc_type    VARCHAR(50)   DEFAULT 'danang-policy',
    ai_provider VARCHAR(30)   DEFAULT 'GROQ',
    latency_ms  BIGINT        DEFAULT 0,
    created_at  TIMESTAMPTZ   DEFAULT NOW()
);

-- Index cho hiệu năng truy vấn lịch sử
CREATE INDEX IF NOT EXISTS idx_chat_user_id ON chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_created_at ON chat_history(created_at);
