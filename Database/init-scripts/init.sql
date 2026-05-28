-- ==============================================================================
-- DATABASE SCHEMA: SMART CITY — FULL INIT
-- Idempotent: safe to run multiple times on any state of the database
-- Bao gồm: Core schema + RAG document_chunks
-- ==============================================================================

-- ── Extensions ────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS postgis;

-- ==============================================================================
-- 1. ADMINISTRATIVE UNITS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS districts (
    id         BIGSERIAL PRIMARY KEY,
    name       VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wards (
    id          BIGSERIAL PRIMARY KEY,
    district_id BIGINT NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
    name        VARCHAR(255) NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at  TIMESTAMP,
    UNIQUE (district_id, name)
);

CREATE TABLE IF NOT EXISTS categories (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at  TIMESTAMP
);

-- ==============================================================================
-- 2. POLICE & EMERGENCY ALERTS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS police_units (
    id            BIGSERIAL PRIMARY KEY,
    ward_id       BIGINT REFERENCES wards(id),
    name          VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(20),
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at    TIMESTAMP
);

CREATE TABLE IF NOT EXISTS emergency_alerts (
    id             BIGSERIAL PRIMARY KEY,
    police_unit_id BIGINT REFERENCES police_units(id),
    title          VARCHAR(255) NOT NULL,
    message        TEXT NOT NULL,
    severity       VARCHAR(50) NOT NULL,
    latitude       DOUBLE PRECISION,
    longitude      DOUBLE PRECISION,
    location       GEOMETRY(Point, 4326),
    alert_time     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active      BOOLEAN DEFAULT TRUE,
    deleted_at     TIMESTAMP
);

-- ==============================================================================
-- 3. USERS & AUTH
-- ==============================================================================

CREATE TABLE IF NOT EXISTS users (
    id             BIGSERIAL PRIMARY KEY,
    full_name      VARCHAR(100),
    username       VARCHAR(100) UNIQUE NOT NULL,
    email          VARCHAR(100) UNIQUE,
    phone          VARCHAR(20) UNIQUE,
    avatar_url     TEXT,
    password_hash  VARCHAR(255),
    role           VARCHAR(50) NOT NULL,
    ward_id        BIGINT REFERENCES wards(id),
    firebase_uid   VARCHAR(255) UNIQUE,
    is_mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret     VARCHAR(255),
    status         VARCHAR(20) DEFAULT 'ACTIVE',
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at     TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sms_verifications (
    id           BIGSERIAL PRIMARY KEY,
    phone_number VARCHAR(20) NOT NULL,
    otp_code     VARCHAR(10) NOT NULL,
    expires_at   TIMESTAMP NOT NULL,
    is_used      BOOLEAN DEFAULT FALSE,
    attempts     INT DEFAULT 0,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title        VARCHAR(255) NOT NULL,
    content      TEXT NOT NULL,
    type         VARCHAR(50) DEFAULT 'SYSTEM',
    reference_id BIGINT,
    is_read      BOOLEAN DEFAULT FALSE,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at   TIMESTAMP
);

-- ==============================================================================
-- 4. CITIZEN FEEDBACK
-- ==============================================================================

CREATE TABLE IF NOT EXISTS feedbacks (
    id              BIGSERIAL PRIMARY KEY,
    citizen_id      BIGINT NOT NULL REFERENCES users(id),
    category_id     BIGINT NOT NULL REFERENCES categories(id),
    ward_id         BIGINT NOT NULL REFERENCES wards(id),
    assigned_to     BIGINT REFERENCES users(id),
    title           VARCHAR(255) NOT NULL,
    content         TEXT NOT NULL,
    latitude        DOUBLE PRECISION,
    longitude       DOUBLE PRECISION,
    location        GEOMETRY(Point, 4326),
    address         VARCHAR(255),
    priority        VARCHAR(50) DEFAULT 'NORMAL',
    status          VARCHAR(50) DEFAULT 'PENDING',
    resolution_note TEXT,
    resolved_at     TIMESTAMP,
    content_vector  vector(1536),
    search_vector   tsvector,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at      TIMESTAMP
);

CREATE TABLE IF NOT EXISTS feedback_media (
    id          BIGSERIAL PRIMARY KEY,
    feedback_id BIGINT NOT NULL REFERENCES feedbacks(id) ON DELETE CASCADE,
    media_url   TEXT NOT NULL,
    media_type  VARCHAR(50) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at  TIMESTAMP
);

CREATE TABLE IF NOT EXISTS evaluations (
    id          BIGSERIAL PRIMARY KEY,
    feedback_id BIGINT NOT NULL UNIQUE REFERENCES feedbacks(id),
    citizen_id  BIGINT NOT NULL REFERENCES users(id),
    rating      INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment     TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at  TIMESTAMP
);

CREATE TABLE IF NOT EXISTS feedback_history (
    id              BIGSERIAL PRIMARY KEY,
    feedback_id     BIGINT NOT NULL REFERENCES feedbacks(id) ON DELETE CASCADE,
    staff_id        BIGINT NOT NULL REFERENCES users(id),
    previous_status VARCHAR(50),
    new_status      VARCHAR(50) NOT NULL,
    note            TEXT,
    changed_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at      TIMESTAMP
);

-- ==============================================================================
-- 5. AUDIT LOGS & DASHBOARD
-- ==============================================================================

CREATE TABLE IF NOT EXISTS ai_audit_logs (
    id               BIGSERIAL PRIMARY KEY,
    task_type        VARCHAR(100) NOT NULL,
    input_data       TEXT,
    ai_output        TEXT,
    confidence_score DOUBLE PRECISION,
    executed_by      BIGINT REFERENCES users(id),
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dashboard_stats (
    id                  BIGSERIAL PRIMARY KEY,
    report_date         DATE NOT NULL UNIQUE,
    total_feedbacks     INT DEFAULT 0,
    resolved_feedbacks  INT DEFAULT 0,
    pending_feedbacks   INT DEFAULT 0,
    average_rating      DOUBLE PRECISION DEFAULT 0.0,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 6. RAG — DOCUMENT CHUNKS (từ V2__init_rag.sql)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS document_chunks (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    content          TEXT        NOT NULL,
    embedding        VECTOR(1536),
    source_url       VARCHAR(1000),
    doc_type         VARCHAR(100),
    language         VARCHAR(10),
    page_number      INTEGER     DEFAULT 0,
    version          VARCHAR(50) DEFAULT '1.0',
    permission_level VARCHAR(20) DEFAULT 'PUBLIC',
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS document_chunk_tags (
    chunk_id UUID         NOT NULL REFERENCES document_chunks(id) ON DELETE CASCADE,
    tag      VARCHAR(100) NOT NULL
);

-- ==============================================================================
-- 7. PATCH — Bổ sung cột pgvector/PostGIS nếu Hibernate tạo thiếu
-- ==============================================================================

ALTER TABLE feedbacks
    ADD COLUMN IF NOT EXISTS content_vector vector(1536),
    ADD COLUMN IF NOT EXISTS search_vector  tsvector,
    ADD COLUMN IF NOT EXISTS location       GEOMETRY(Point, 4326);

ALTER TABLE emergency_alerts
    ADD COLUMN IF NOT EXISTS location GEOMETRY(Point, 4326);

-- ==============================================================================
-- 8. INDEXES
-- ==============================================================================

-- feedbacks
CREATE INDEX IF NOT EXISTS idx_feedbacks_search   ON feedbacks USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_feedbacks_location  ON feedbacks USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_feedbacks_vector    ON feedbacks USING hnsw(content_vector vector_cosine_ops);

-- emergency_alerts
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_location ON emergency_alerts USING GIST(location);

-- document_chunks (RAG)
CREATE INDEX IF NOT EXISTS idx_chunks_embedding_hnsw
    ON document_chunks
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS idx_chunks_doctype ON document_chunks(doc_type);
CREATE INDEX IF NOT EXISTS idx_chunks_lang    ON document_chunks(language);
CREATE INDEX IF NOT EXISTS idx_chunks_perm    ON document_chunks(permission_level);
CREATE INDEX IF NOT EXISTS idx_chunks_source  ON document_chunks(source_url);
CREATE INDEX IF NOT EXISTS idx_chunk_tags_id  ON document_chunk_tags(chunk_id);

-- ==============================================================================
-- 9. FUNCTIONS & TRIGGERS
-- ==============================================================================

-- Auto full-text search vector cho feedbacks
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

-- Auto update timestamp cho document_chunks
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

-- ==============================================================================
-- 10. SEED DATA (document_chunks mẫu để test RAG pipeline)
-- ==============================================================================

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
