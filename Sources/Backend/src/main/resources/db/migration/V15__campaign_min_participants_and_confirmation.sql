ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS min_participants INTEGER;
ALTER TABLE campaign_participants ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP;
