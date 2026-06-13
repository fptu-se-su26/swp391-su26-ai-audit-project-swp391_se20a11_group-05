-- ═══════════════════════════════════════════════════════════════════════
-- V1__init_all.sql  —  SmartCity FULL Schema (Consolidated + Flyway)
-- Gộp toàn bộ init.sql + V2→V7 + brute-force login protection
-- Reset DB: DROP SCHEMA public CASCADE; CREATE SCHEMA public; rồi chạy lại app
-- ═══════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────
-- BƯỚC 0: Extensions
-- ───────────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS postgis;

-- ───────────────────────────────────────────────────────────────────────
-- BƯỚC 1: Đơn vị hành chính (Districts, Wards, Categories)
-- ───────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS districts (
    id         BIGSERIAL    PRIMARY KEY,
    name       VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wards (
    id          BIGSERIAL    PRIMARY KEY,
    district_id BIGINT       NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
    name        VARCHAR(255) NOT NULL,
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    deleted_at  TIMESTAMP,
    UNIQUE (district_id, name)
);

CREATE TABLE IF NOT EXISTS categories (
    id          BIGSERIAL    PRIMARY KEY,
    name        VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    deleted_at  TIMESTAMP
);

-- ───────────────────────────────────────────────────────────────────────
-- BƯỚC 2: USERS & AUTH
-- ───────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id               BIGSERIAL    PRIMARY KEY,
    username         VARCHAR(100) NOT NULL UNIQUE,
    password         VARCHAR(255),                    -- password_hash
    full_name        VARCHAR(100),
    phone_number     VARCHAR(20)  UNIQUE,
    email            VARCHAR(100) UNIQUE,
    avatar_url       TEXT,
    role             VARCHAR(50)  NOT NULL DEFAULT 'CITIZEN',
    status           VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    ward_id          BIGINT       REFERENCES wards(id) ON DELETE SET NULL,
    firebase_uid     VARCHAR(255) UNIQUE,
    mfa_secret       TEXT,                            -- AES-256/GCM encrypted
    is_mfa_enabled   BOOLEAN      NOT NULL DEFAULT FALSE,
    login_attempts   INTEGER      NOT NULL DEFAULT 0, -- [SECURITY] brute-force counter
    locked_until     TIMESTAMP    NULL,               -- [SECURITY] tạm khóa login
    deleted_at       TIMESTAMP    NULL,
    deleted_by       VARCHAR(100) NULL,
    created_at       TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_user_contact_required CHECK (email IS NOT NULL OR phone_number IS NOT NULL)
);

COMMENT ON COLUMN users.mfa_secret     IS 'AES-256/GCM encrypted TOTP secret.';
COMMENT ON COLUMN users.login_attempts IS 'Số lần đăng nhập sai liên tiếp, reset khi đăng nhập thành công.';
COMMENT ON COLUMN users.locked_until   IS 'NULL hoặc thời điểm hết khóa tạm do brute-force.';
COMMENT ON COLUMN users.deleted_at     IS 'Soft delete timestamp. NULL = active user.';

-- Partial unique indexes (chỉ áp dụng cho user chưa bị soft-delete)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_active
    ON users(username) WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_active
    ON users(email) WHERE deleted_at IS NULL AND email IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone_active
    ON users(phone_number) WHERE deleted_at IS NULL AND phone_number IS NOT NULL;

-- ───────────────────────────────────────────────────────────────────────
-- BƯỚC 3: SMS & MFA
-- ───────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sms_verifications (
    id           BIGSERIAL   PRIMARY KEY,
    phone_number VARCHAR(20) NOT NULL,
    otp_code     VARCHAR(10) NOT NULL,
    expires_at   TIMESTAMP   NOT NULL,
    is_used      BOOLEAN     NOT NULL DEFAULT FALSE,
    attempts     INT         NOT NULL DEFAULT 0,
    created_at   TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_phone_used ON sms_verifications(phone_number, is_used);

CREATE TABLE IF NOT EXISTS mfa_sessions (
    id         BIGSERIAL    PRIMARY KEY,
    user_id    BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mfa_token  VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP    NOT NULL,
    created_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mfa_sessions_token ON mfa_sessions(mfa_token);

-- ───────────────────────────────────────────────────────────────────────
-- BƯỚC 4: POLICE & EMERGENCY ALERTS
-- ───────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS police_units (
    id            BIGSERIAL    PRIMARY KEY,
    ward_id       BIGINT       REFERENCES wards(id),
    name          VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(20),
    created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    deleted_at    TIMESTAMP
);

CREATE TABLE IF NOT EXISTS emergency_alerts (
    id             BIGSERIAL    PRIMARY KEY,
    police_unit_id BIGINT       REFERENCES police_units(id),
    title          VARCHAR(255) NOT NULL,
    message        TEXT         NOT NULL,
    severity       VARCHAR(50)  NOT NULL,
    latitude       DECIMAL(9, 6),
    longitude      DECIMAL(9, 6),
    location       GEOMETRY(Point, 4326),
    alert_time     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    is_active      BOOLEAN      DEFAULT TRUE,
    deleted_at     TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_emergency_alerts_location
    ON emergency_alerts USING GIST(location);

-- ───────────────────────────────────────────────────────────────────────
-- BƯỚC 5: CITIZEN FEEDBACKS
-- ───────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feedbacks (
    id              BIGSERIAL    PRIMARY KEY,
    citizen_id      BIGINT       NOT NULL REFERENCES users(id),
    category_id     BIGINT       REFERENCES categories(id),
    ward_id         BIGINT       NOT NULL REFERENCES wards(id),
    assignee_id     BIGINT       REFERENCES users(id),
    title           VARCHAR(255) NOT NULL,
    description     TEXT         NOT NULL,
    priority        VARCHAR(50)  DEFAULT 'NORMAL',
    status          VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    tracking_code   VARCHAR(20)  UNIQUE,
    resolution_note TEXT,
    resolved_at     TIMESTAMP,
    latitude        DOUBLE PRECISION,
    longitude       DOUBLE PRECISION,
    location        GEOMETRY(Point, 4326),
    address_details VARCHAR(255),
    content_vector  VECTOR(768),
    search_vector   TSVECTOR,
    deleted_at      TIMESTAMP    NULL,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN feedbacks.deleted_at IS 'Soft delete timestamp. NULL = visible feedback.';

-- Indexes cho feedbacks
CREATE INDEX IF NOT EXISTS idx_feedbacks_ward_status_created
    ON feedbacks(ward_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_feedbacks_citizen_created
    ON feedbacks(citizen_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_feedbacks_assignee_status
    ON feedbacks(assignee_id, status) WHERE assignee_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_feedbacks_tracking_code
    ON feedbacks(tracking_code);

CREATE INDEX IF NOT EXISTS idx_feedbacks_active
    ON feedbacks(id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_feedbacks_search
    ON feedbacks USING GIN(search_vector);

CREATE INDEX IF NOT EXISTS idx_feedbacks_location
    ON feedbacks USING GIST(location);

CREATE INDEX IF NOT EXISTS idx_feedbacks_vector
    ON feedbacks USING hnsw(content_vector vector_cosine_ops);

-- Bảng phụ feedbacks
CREATE TABLE IF NOT EXISTS feedback_media (
    id          BIGSERIAL   PRIMARY KEY,
    feedback_id BIGINT      NOT NULL REFERENCES feedbacks(id) ON DELETE CASCADE,
    media_url   TEXT        NOT NULL,
    media_type  VARCHAR(50) NOT NULL,
    uploaded_at TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    deleted_at  TIMESTAMP
);

-- feedback_logs: Lịch sử thay đổi trạng thái phản ánh (khớp FeedbackLog.java)
CREATE TABLE IF NOT EXISTS feedback_logs (
    id              BIGSERIAL   PRIMARY KEY,
    feedback_id     BIGINT      NOT NULL REFERENCES feedbacks(id) ON DELETE CASCADE,
    action_by_id    BIGINT      NOT NULL REFERENCES users(id),
    old_status      VARCHAR(20),
    new_status      VARCHAR(20) NOT NULL,
    note            TEXT,
    created_at      TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- attachments: File/ảnh đính kèm theo phản ánh (khớp Attachment.java + FileController)
CREATE TABLE IF NOT EXISTS attachments (
    id          BIGSERIAL    PRIMARY KEY,
    feedback_id BIGINT       NOT NULL REFERENCES feedbacks(id) ON DELETE CASCADE,
    file_url    VARCHAR(500) NOT NULL,
    file_type   VARCHAR(50),
    uploaded_by BIGINT       REFERENCES users(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_logs_feedback_created
    ON feedback_logs(feedback_id, created_at DESC);

CREATE TABLE IF NOT EXISTS evaluations (
    id          BIGSERIAL PRIMARY KEY,
    feedback_id BIGINT    NOT NULL UNIQUE REFERENCES feedbacks(id),
    citizen_id  BIGINT    NOT NULL REFERENCES users(id),
    rating      INT       NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment     TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at  TIMESTAMP
);

-- ───────────────────────────────────────────────────────────────────────
-- BƯỚC 6: NOTIFICATIONS
-- ───────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
    id           BIGSERIAL    PRIMARY KEY,
    user_id      BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title        VARCHAR(255) NOT NULL,
    content      TEXT         NOT NULL,
    type         VARCHAR(50)  DEFAULT 'SYSTEM',
    reference_id BIGINT,
    is_read      BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
    deleted_at   TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created
    ON notifications(user_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
    ON notifications(user_id, created_at DESC) WHERE is_read = false;

-- ───────────────────────────────────────────────────────────────────────
-- BƯỚC 7: AUDIT LOGS & DASHBOARD STATS
-- ───────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_audit_logs (
    id               BIGSERIAL         PRIMARY KEY,
    task_type        VARCHAR(100)      NOT NULL,
    input_data       TEXT,
    ai_output        TEXT,
    confidence_score DOUBLE PRECISION,
    executed_by      BIGINT            REFERENCES users(id),
    created_at       TIMESTAMP         DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dashboard_stats (
    id                 BIGSERIAL        PRIMARY KEY,
    report_date        DATE             NOT NULL UNIQUE,
    total_feedbacks    INT              DEFAULT 0,
    resolved_feedbacks INT              DEFAULT 0,
    pending_feedbacks  INT              DEFAULT 0,
    average_rating     DOUBLE PRECISION DEFAULT 0.0,
    created_at         TIMESTAMP        DEFAULT CURRENT_TIMESTAMP
);

-- ───────────────────────────────────────────────────────────────────────
-- BƯỚC 8: Hybrid RAG — DOCUMENT_CHUNKS & SEMANTIC_CACHE
-- ───────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS document_chunks (
    id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    content          TEXT         NOT NULL,
    embedding        VECTOR(768),              -- Gemini embedding dimension
    source_url       VARCHAR(1000),
    doc_type         VARCHAR(100),
    language         VARCHAR(10),
    page_number      INTEGER      DEFAULT 0,
    version          VARCHAR(50)  DEFAULT '1.0',
    permission_level VARCHAR(20)  DEFAULT 'PUBLIC',
    created_at       TIMESTAMPTZ  DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS document_chunk_tags (
    chunk_id UUID         NOT NULL REFERENCES document_chunks(id) ON DELETE CASCADE,
    tag      VARCHAR(100) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_chunks_embedding_hnsw
    ON document_chunks USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS idx_chunks_doctype            ON document_chunks(doc_type);
CREATE INDEX IF NOT EXISTS idx_chunks_lang               ON document_chunks(language);
CREATE INDEX IF NOT EXISTS idx_chunks_perm               ON document_chunks(permission_level);
CREATE INDEX IF NOT EXISTS idx_chunks_source             ON document_chunks(source_url);
CREATE INDEX IF NOT EXISTS idx_chunk_tags_id             ON document_chunk_tags(chunk_id);
CREATE INDEX IF NOT EXISTS idx_chunks_metadata_composite ON document_chunks(doc_type, language, permission_level);

CREATE TABLE IF NOT EXISTS semantic_cache (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    query_text    TEXT        NOT NULL,
    query_vector  VECTOR(768),
    response_text TEXT        NOT NULL,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    last_hit_at   TIMESTAMPTZ DEFAULT NOW(),
    hit_count     INTEGER     DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_semantic_cache_embedding_hnsw
    ON semantic_cache USING hnsw (query_vector vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- ───────────────────────────────────────────────────────────────────────
-- BƯỚC 9: CHAT_HISTORY (Lịch sử chatbot)
-- ───────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_history (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question    TEXT        NOT NULL,
    answer      TEXT,
    doc_type    VARCHAR(50) DEFAULT 'danang-policy',
    ai_provider VARCHAR(30) DEFAULT 'GROQ',
    latency_ms  BIGINT      DEFAULT 0,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_user_id    ON chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_created_at ON chat_history(created_at);

-- ───────────────────────────────────────────────────────────────────────
-- BƯỚC 10: FUNCTIONS & TRIGGERS
-- ───────────────────────────────────────────────────────────────────────

-- Auto full-text search cho feedbacks
CREATE OR REPLACE FUNCTION update_feedbacks_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('pg_catalog.simple', coalesce(NEW.title,   '')), 'A') ||
        setweight(to_tsvector('pg_catalog.simple', coalesce(NEW.content, '')), 'B');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_update_feedbacks_search_vector
    BEFORE INSERT OR UPDATE ON feedbacks
    FOR EACH ROW EXECUTE FUNCTION update_feedbacks_search_vector();

-- Auto-update updated_at cho document_chunks
CREATE OR REPLACE FUNCTION update_chunk_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_update_chunk_timestamp
    BEFORE UPDATE ON document_chunks
    FOR EACH ROW EXECUTE FUNCTION update_chunk_timestamp();

-- ───────────────────────────────────────────────────────────────────────
-- BƯỚC 11: SEED DATA (có thể xóa sau khi test)
-- ───────────────────────────────────────────────────────────────────────
INSERT INTO document_chunks (content, doc_type, language, source_url, version, permission_level)
VALUES
(
    'Hệ thống cảm biến giao thông thông minh tại Đô thị thông minh (Smart City) tự động thu thập dữ liệu lưu lượng xe, tốc độ trung bình và mật độ giao thông theo thời gian thực để tối ưu hóa chu kỳ đèn tín hiệu giao thông, giảm thiểu tắc nghẽn giao thông đô thị.',
    'traffic', 'vi', 'smartcity://traffic-sensor-system', '1.0', 'PUBLIC'
),
(
    'Hệ thống chiếu sáng tự động trong Smart City sử dụng các cảm biến ánh sáng và hiện diện để điều chỉnh cường độ đèn đường, tự động giảm độ sáng vào ban đêm khi không có người qua lại giúp tiết kiệm tới 40% lượng điện năng tiêu thụ.',
    'energy', 'vi', 'smartcity://smart-lighting-system', '1.0', 'PUBLIC'
),
(
    'Cổng thanh toán dịch vụ công tích hợp công nghệ ví điện tử trong hệ thống dịch vụ thông minh của thành phố cho phép người dân thanh toán hóa đơn điện, nước, thuế trực tuyến nhanh chóng, minh bạch và an toàn tuyệt đối.',
    'governance', 'vi', 'smartcity://public-payment-portal', '1.0', 'PUBLIC'
)
ON CONFLICT DO NOTHING;

ANALYZE document_chunks;

-- ───────────────────────────────────────────────────────────────────────
-- BƯỚC 12: REFRESH TOKENS (Token Rotation)
-- ───────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     BIGINT       NOT NULL,
    token_hash  VARCHAR(64)  NOT NULL UNIQUE,   -- SHA-256(refreshToken)
    expires_at  TIMESTAMP    NOT NULL,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    used        BOOLEAN      NOT NULL DEFAULT FALSE,
    used_at     TIMESTAMP,

    CONSTRAINT fk_refresh_tokens_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id   ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires   ON refresh_tokens(expires_at);

COMMENT ON TABLE refresh_tokens IS
    'Lưu refresh token (dạng hash) để hỗ trợ Token Rotation và phát hiện tái sử dụng trái phép';

