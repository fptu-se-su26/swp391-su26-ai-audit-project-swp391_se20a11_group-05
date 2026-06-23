-- Update campaigns status default to RECRUITING
ALTER TABLE campaigns ALTER COLUMN status SET DEFAULT 'RECRUITING';

-- Update existing PENDING_APPROVAL campaigns to RECRUITING for instant activation
UPDATE campaigns SET status = 'RECRUITING' WHERE status = 'PENDING_APPROVAL';
