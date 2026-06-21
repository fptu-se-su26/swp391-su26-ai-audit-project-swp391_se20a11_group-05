-- Add attachment_purpose column to attachments table with a default value for backward compatibility
ALTER TABLE attachments
ADD COLUMN IF NOT EXISTS attachment_purpose VARCHAR(50) NOT NULL DEFAULT 'SUBMISSION_EVIDENCE';

-- Create an index to optimize checking for the existence of resolution evidence
CREATE INDEX IF NOT EXISTS idx_attachments_feedback_purpose
ON attachments(feedback_id, attachment_purpose);
