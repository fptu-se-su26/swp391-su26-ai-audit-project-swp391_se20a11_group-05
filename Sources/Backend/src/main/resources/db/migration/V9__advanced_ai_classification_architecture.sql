CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS ai_tasks (
    id BIGSERIAL PRIMARY KEY,
    feedback_id BIGINT NOT NULL REFERENCES feedbacks(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    task_priority INT NOT NULL DEFAULT 0,
    retry_count INT NOT NULL DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_tasks_status_priority ON ai_tasks(status, task_priority DESC, created_at ASC);

CREATE TABLE IF NOT EXISTS ai_analysis_logs (
    id BIGSERIAL PRIMARY KEY,
    feedback_id BIGINT NOT NULL REFERENCES feedbacks(id) ON DELETE CASCADE,
    trust_score INT,
    is_toxic BOOLEAN,
    domain VARCHAR(50),
    priority VARCHAR(50),
    reason TEXT,
    raw_response TEXT,
    tokens_used_input INT,
    tokens_used_output INT,
    latency_ms BIGINT,
    model_name VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_logs_feedback_id ON ai_analysis_logs(feedback_id);

-- Add location geometry column to feedbacks if it doesn't exist
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS location GEOMETRY(Point, 4326);

-- Create trigger function to auto-sync location geometry
CREATE OR REPLACE FUNCTION update_feedback_location()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.location := ST_SetSRID(ST_Point(NEW.longitude, NEW.latitude), 4326);
    ELSE
        NEW.location := NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists to avoid errors on recreate
DROP TRIGGER IF EXISTS trigger_update_feedback_location ON feedbacks;

CREATE TRIGGER trigger_update_feedback_location
    BEFORE INSERT OR UPDATE OF latitude, longitude ON feedbacks
    FOR EACH ROW EXECUTE FUNCTION update_feedback_location();

-- Sync existing feedbacks coordinates
UPDATE feedbacks 
SET location = ST_SetSRID(ST_Point(longitude, latitude), 4326) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Create GiST index
CREATE INDEX IF NOT EXISTS idx_feedbacks_location_gist ON feedbacks USING GIST(location);

-- Add HNSW vector index
CREATE INDEX IF NOT EXISTS idx_feedbacks_description_vector_hnsw 
    ON feedbacks USING hnsw (description_vector vector_cosine_ops);

-- Add CHECK constraints
ALTER TABLE feedbacks DROP CONSTRAINT IF EXISTS chk_feedback_priority;
ALTER TABLE feedbacks ADD CONSTRAINT chk_feedback_priority CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'));

ALTER TABLE feedbacks DROP CONSTRAINT IF EXISTS chk_feedback_role;
ALTER TABLE feedbacks ADD CONSTRAINT chk_feedback_role CHECK (managed_by_role IN ('POLICE', 'WARD_STAFF'));
