ALTER TABLE notifications
    ADD COLUMN IF NOT EXISTS feedback_id BIGINT REFERENCES feedbacks(id) ON DELETE CASCADE;

UPDATE notifications n
SET feedback_id = n.reference_id
WHERE n.feedback_id IS NULL
  AND n.reference_id IS NOT NULL
  AND EXISTS (
      SELECT 1
      FROM feedbacks f
      WHERE f.id = n.reference_id
  );

CREATE INDEX IF NOT EXISTS idx_notifications_feedback_id
    ON notifications(feedback_id);

CREATE INDEX IF NOT EXISTS idx_feedbacks_ward_id
    ON feedbacks(ward_id);

CREATE INDEX IF NOT EXISTS idx_feedbacks_created_at
    ON feedbacks(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_campaigns_linked_feedback_id
    ON campaigns(linked_feedback_id);
