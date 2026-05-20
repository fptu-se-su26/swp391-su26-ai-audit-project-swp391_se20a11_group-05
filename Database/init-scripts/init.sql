-- ==============================================================================
-- DATABASE SCHEMA: SMART CITY
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS postgis;

-- ==============================================================================
-- SYSTEM CATEGORIES & ADMINISTRATIVE UNITS
-- ==============================================================================

CREATE TABLE districts (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE wards (
    id BIGSERIAL PRIMARY KEY,
    district_id BIGINT NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    UNIQUE (district_id, name)
);

CREATE TABLE categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- ==============================================================================
-- POLICE & EMERGENCY ALERTS
-- ==============================================================================

CREATE TABLE police_units (
    id BIGSERIAL PRIMARY KEY,
    ward_id BIGINT REFERENCES wards(id),
    name VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE emergency_alerts (
    id BIGSERIAL PRIMARY KEY,
    police_unit_id BIGINT REFERENCES police_units(id),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(50) NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    location GEOMETRY(Point, 4326),
    alert_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMP
);

-- ==============================================================================
-- AUTHENTICATION & USERS
-- ==============================================================================

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    full_name VARCHAR(100),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20) UNIQUE,
    avatar_url TEXT,
    password_hash VARCHAR(255),
    role VARCHAR(50) NOT NULL,
    ward_id BIGINT REFERENCES wards(id),
    firebase_uid VARCHAR(255) UNIQUE,
    is_mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret VARCHAR(255),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE sms_verifications (
    id BIGSERIAL PRIMARY KEY,
    phone_number VARCHAR(20) NOT NULL,
    otp_code VARCHAR(10) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    attempts INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'SYSTEM',
    reference_id BIGINT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- ==============================================================================
-- CITIZEN FEEDBACK
-- ==============================================================================

CREATE TABLE feedbacks (
    id BIGSERIAL PRIMARY KEY,
    citizen_id BIGINT NOT NULL REFERENCES users(id),
    category_id BIGINT NOT NULL REFERENCES categories(id),
    ward_id BIGINT NOT NULL REFERENCES wards(id),
    assigned_to BIGINT REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    location GEOMETRY(Point, 4326),
    address VARCHAR(255),
    priority VARCHAR(50) DEFAULT 'NORMAL',
    status VARCHAR(50) DEFAULT 'PENDING',
    resolution_note TEXT,
    resolved_at TIMESTAMP,
    content_vector vector(1536),
    search_vector tsvector,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE feedback_media (
    id BIGSERIAL PRIMARY KEY,
    feedback_id BIGINT NOT NULL REFERENCES feedbacks(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    media_type VARCHAR(50) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE evaluations (
    id BIGSERIAL PRIMARY KEY,
    feedback_id BIGINT NOT NULL UNIQUE REFERENCES feedbacks(id),
    citizen_id BIGINT NOT NULL REFERENCES users(id),
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- ==============================================================================
-- WARD PROCESSING
-- ==============================================================================

CREATE TABLE feedback_history (
    id BIGSERIAL PRIMARY KEY,
    feedback_id BIGINT NOT NULL REFERENCES feedbacks(id) ON DELETE CASCADE,
    staff_id BIGINT NOT NULL REFERENCES users(id),
    previous_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    note TEXT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- ==============================================================================
-- AUDIT LOGS & DASHBOARD
-- ==============================================================================

CREATE TABLE ai_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    task_type VARCHAR(100) NOT NULL,
    input_data TEXT,
    ai_output TEXT,
    confidence_score DOUBLE PRECISION,
    executed_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE dashboard_stats (
    id BIGSERIAL PRIMARY KEY,
    report_date DATE NOT NULL UNIQUE,
    total_feedbacks INT DEFAULT 0,
    resolved_feedbacks INT DEFAULT 0,
    pending_feedbacks INT DEFAULT 0,
    average_rating DOUBLE PRECISION DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- INDEXES & TRIGGERS
-- ==============================================================================

CREATE INDEX idx_feedbacks_search ON feedbacks USING GIN(search_vector);
CREATE INDEX idx_feedbacks_location ON feedbacks USING GIST(location);
CREATE INDEX idx_emergency_alerts_location ON emergency_alerts USING GIST(location);

CREATE OR REPLACE FUNCTION update_feedbacks_search_vector() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('pg_catalog.simple', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('pg_catalog.simple', coalesce(NEW.content, '')), 'B');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_feedbacks_search_vector
  BEFORE INSERT OR UPDATE
  ON feedbacks
  FOR EACH ROW
  EXECUTE FUNCTION update_feedbacks_search_vector();
