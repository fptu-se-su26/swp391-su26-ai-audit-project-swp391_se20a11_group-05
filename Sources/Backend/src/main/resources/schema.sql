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

-- 10. Campaign chat messages table - pinned column
ALTER TABLE campaign_chat_messages ADD COLUMN IF NOT EXISTS pinned BOOLEAN;
UPDATE campaign_chat_messages SET pinned = FALSE WHERE pinned IS NULL;
ALTER TABLE campaign_chat_messages ALTER COLUMN pinned SET DEFAULT FALSE;
ALTER TABLE campaign_chat_messages ALTER COLUMN pinned SET NOT NULL;

-- 11. Feedbacks table - public_visible column
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS public_visible BOOLEAN;
UPDATE feedbacks SET public_visible = TRUE WHERE public_visible IS NULL;
ALTER TABLE feedbacks ALTER COLUMN public_visible SET DEFAULT TRUE;
ALTER TABLE feedbacks ALTER COLUMN public_visible SET NOT NULL;

-- 12. Campaign participants table updates
ALTER TABLE campaign_participants ADD COLUMN IF NOT EXISTS volunteer_experience VARCHAR(1000);
ALTER TABLE campaign_participants ADD COLUMN IF NOT EXISTS availability_hours VARCHAR(200);
ALTER TABLE campaign_participants ADD COLUMN IF NOT EXISTS cancellation_reason VARCHAR(500);
ALTER TABLE campaign_participants ADD COLUMN IF NOT EXISTS cancel_count INT;
UPDATE campaign_participants SET cancel_count = 0 WHERE cancel_count IS NULL;
ALTER TABLE campaign_participants ALTER COLUMN cancel_count SET DEFAULT 0;
ALTER TABLE campaign_participants ALTER COLUMN cancel_count SET NOT NULL;
ALTER TABLE campaign_participants ADD COLUMN IF NOT EXISTS confirmation_deadline TIMESTAMP;

-- 13. Email verifications table
CREATE TABLE IF NOT EXISTS email_verifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    email VARCHAR(100) NOT NULL,
    otp_code VARCHAR(255) NOT NULL,
    purpose VARCHAR(30) NOT NULL DEFAULT 'CAMPAIGN_JOIN',
    expires_at TIMESTAMP NOT NULL,
    verified_at TIMESTAMP,
    is_used BOOLEAN DEFAULT FALSE,
    attempts INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_email_is_used ON email_verifications(email, is_used);

-- 14. Optimize campaign chat message query with composite index
CREATE INDEX IF NOT EXISTS idx_campaign_chat_msg_campaign_created ON campaign_chat_messages(campaign_id, created_at DESC);

-- 15. Add image_url to campaign chat messages
ALTER TABLE campaign_chat_messages ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE campaign_chat_messages ALTER COLUMN image_url TYPE TEXT;


-- 16. User warnings table
CREATE TABLE IF NOT EXISTS user_warnings (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    warned_by_id BIGINT NOT NULL,
    reason VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    deleted_by VARCHAR(100)
);

-- 17. Add warning_count to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS warning_count INT NOT NULL DEFAULT 0;

-- 18. Campaigns table - announcement_mode column
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS announcement_mode BOOLEAN;
UPDATE campaigns SET announcement_mode = FALSE WHERE announcement_mode IS NULL;
ALTER TABLE campaigns ALTER COLUMN announcement_mode SET DEFAULT FALSE;
ALTER TABLE campaigns ALTER COLUMN announcement_mode SET NOT NULL;

-- 19. Add avatar_url to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(255);

-- 20. Add view_count to feedbacks table
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS view_count INT;
UPDATE feedbacks SET view_count = 0 WHERE view_count IS NULL;
ALTER TABLE feedbacks ALTER COLUMN view_count SET DEFAULT 0;
ALTER TABLE feedbacks ALTER COLUMN view_count SET NOT NULL;




