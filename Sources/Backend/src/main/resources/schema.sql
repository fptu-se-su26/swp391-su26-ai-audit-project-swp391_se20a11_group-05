-- ───────────────────────────────────────────────────────────────────────
-- DB Migration Fix for SmartCity Startup (NOT NULL column violations)
-- This script runs before Hibernate validates the schema to populate new
-- columns with default values, satisfying NOT NULL constraints.
-- ───────────────────────────────────────────────────────────────────────

-- 1. Feedbacks table - priority column
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS priority VARCHAR(20);
UPDATE feedbacks SET priority = 'MEDIUM' WHERE priority IS NULL;
ALTER TABLE feedbacks ALTER COLUMN priority SET DATA TYPE VARCHAR(20);
ALTER TABLE feedbacks ALTER COLUMN priority SET DEFAULT 'MEDIUM';
ALTER TABLE feedbacks ALTER COLUMN priority SET NOT NULL;

-- 2. Feedbacks table - receiver_type column
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS receiver_type VARCHAR(20);
UPDATE feedbacks SET receiver_type = 'WARD_STAFF' WHERE receiver_type IS NULL;
ALTER TABLE feedbacks ALTER COLUMN receiver_type SET DATA TYPE VARCHAR(20);
ALTER TABLE feedbacks ALTER COLUMN receiver_type SET DEFAULT 'WARD_STAFF';
ALTER TABLE feedbacks ALTER COLUMN receiver_type SET NOT NULL;

-- 3. Wards table - is_active column
ALTER TABLE wards ADD COLUMN IF NOT EXISTS is_active BOOLEAN;
UPDATE wards SET is_active = TRUE WHERE is_active IS NULL;
ALTER TABLE wards ALTER COLUMN is_active SET DEFAULT TRUE;
ALTER TABLE wards ALTER COLUMN is_active SET NOT NULL;

-- 4. Wards table - city_name column
ALTER TABLE wards ADD COLUMN IF NOT EXISTS city_name VARCHAR(100);
UPDATE wards SET city_name = 'Da Nang' WHERE city_name IS NULL;
ALTER TABLE wards ALTER COLUMN city_name SET DATA TYPE VARCHAR(100);
ALTER TABLE wards ALTER COLUMN city_name SET DEFAULT 'Da Nang';
ALTER TABLE wards ALTER COLUMN city_name SET NOT NULL;

-- 5. Wards table - type column
ALTER TABLE wards ADD COLUMN IF NOT EXISTS type VARCHAR(30);
UPDATE wards SET type = 'WARD' WHERE type IS NULL;
ALTER TABLE wards ALTER COLUMN type SET DATA TYPE VARCHAR(30);
ALTER TABLE wards ALTER COLUMN type SET DEFAULT 'WARD';
ALTER TABLE wards ALTER COLUMN type SET NOT NULL;

-- 6. Wards table - ward_code column
ALTER TABLE wards ADD COLUMN IF NOT EXISTS ward_code VARCHAR(50);
UPDATE wards SET ward_code = 'WARD_' || id WHERE ward_code IS NULL;
ALTER TABLE wards ALTER COLUMN ward_code SET DATA TYPE VARCHAR(50);
ALTER TABLE wards ALTER COLUMN ward_code SET NOT NULL;

-- 7. Add UNIQUE constraint to ward_code (wrapped in DO block to avoid duplicate key errors)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_ward_code'
    ) THEN
        ALTER TABLE wards ADD CONSTRAINT unique_ward_code UNIQUE (ward_code);
    END IF;
END $$;

-- 8. Feedback admin/dashboard columns used by the current Feedback entity
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS category_code VARCHAR(80);
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS category_name VARCHAR(255);
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS managed_by_role VARCHAR(30);
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS ward_name VARCHAR(255);
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS district_name VARCHAR(255);
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS city_name VARCHAR(255);
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS assigned_unit_id BIGINT;
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS assigned_unit_name VARCHAR(255);
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS assigned_to_role VARCHAR(30);
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS assigned_staff_id BIGINT;
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP;
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS received_at TIMESTAMP;
ALTER TABLE feedbacks ALTER COLUMN ward_id DROP NOT NULL;

-- 9. Attachment purpose is read by admin/citizen feedback DTO mapping
ALTER TABLE attachments ADD COLUMN IF NOT EXISTS attachment_purpose VARCHAR(50) NOT NULL DEFAULT 'SUBMISSION_EVIDENCE';
CREATE INDEX IF NOT EXISTS idx_attachments_feedback_purpose ON attachments(feedback_id, attachment_purpose);
