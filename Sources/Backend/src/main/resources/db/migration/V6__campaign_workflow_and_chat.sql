CREATE TABLE IF NOT EXISTS campaigns (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    created_by BIGINT NOT NULL REFERENCES users(id),
    ward_id BIGINT REFERENCES wards(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    location_text VARCHAR(255),
    private_location_text VARCHAR(500),
    required_tools TEXT,
    organizer_contact VARCHAR(255),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    max_participants INTEGER,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING_APPROVAL'
);

ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS created_at TIMESTAMP;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS created_by BIGINT REFERENCES users(id);
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS ward_id BIGINT REFERENCES wards(id);
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS title VARCHAR(255);
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS category VARCHAR(50);
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS location_text VARCHAR(255);
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS private_location_text VARCHAR(500);
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS required_tools TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS organizer_contact VARCHAR(255);
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS max_participants INTEGER;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS start_time TIMESTAMP;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS end_time TIMESTAMP;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'PENDING_APPROVAL';
ALTER TABLE campaigns ALTER COLUMN status TYPE VARCHAR(30);
ALTER TABLE campaigns ALTER COLUMN status SET DEFAULT 'PENDING_APPROVAL';
UPDATE campaigns SET status = 'PENDING_APPROVAL' WHERE status IS NULL;

CREATE TABLE IF NOT EXISTS campaign_participants (
    id BIGSERIAL PRIMARY KEY,
    campaign_id BIGINT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    citizen_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    join_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    approved_by BIGINT REFERENCES users(id),
    approved_at TIMESTAMP,
    rejected_at TIMESTAMP,
    rejection_reason VARCHAR(500),
    cancelled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT uk_campaign_participant UNIQUE (campaign_id, citizen_id)
);

ALTER TABLE campaign_participants ADD COLUMN IF NOT EXISTS campaign_id BIGINT REFERENCES campaigns(id) ON DELETE CASCADE;
ALTER TABLE campaign_participants ADD COLUMN IF NOT EXISTS citizen_id BIGINT REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE campaign_participants ADD COLUMN IF NOT EXISTS join_status VARCHAR(20) DEFAULT 'PENDING';
ALTER TABLE campaign_participants ADD COLUMN IF NOT EXISTS approved_by BIGINT REFERENCES users(id);
ALTER TABLE campaign_participants ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
ALTER TABLE campaign_participants ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP;
ALTER TABLE campaign_participants ADD COLUMN IF NOT EXISTS rejection_reason VARCHAR(500);
ALTER TABLE campaign_participants ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP;
ALTER TABLE campaign_participants ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE campaign_participants ALTER COLUMN join_status SET DEFAULT 'PENDING';
UPDATE campaign_participants SET join_status = 'PENDING' WHERE join_status IS NULL OR join_status = 'SURE';

CREATE TABLE IF NOT EXISTS campaign_chat_messages (
    id BIGSERIAL PRIMARY KEY,
    campaign_id BIGINT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    sender_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaign_comments (
    id BIGSERIAL PRIMARY KEY,
    campaign_id BIGINT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    author_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaign_feedbacks (
    id BIGSERIAL PRIMARY KEY,
    campaign_id BIGINT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    participant_id BIGINT NOT NULL REFERENCES campaign_participants(id) ON DELETE CASCADE,
    rating INTEGER,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT uk_campaign_feedback_participant UNIQUE (campaign_id, participant_id),
    CONSTRAINT ck_campaign_feedback_rating CHECK (rating IS NULL OR rating BETWEEN 1 AND 5)
);

CREATE INDEX IF NOT EXISTS idx_campaigns_status_created ON campaigns(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaign_participants_campaign_status ON campaign_participants(campaign_id, join_status);
CREATE INDEX IF NOT EXISTS idx_campaign_chat_campaign_created ON campaign_chat_messages(campaign_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaign_comments_campaign_created ON campaign_comments(campaign_id, created_at DESC);
