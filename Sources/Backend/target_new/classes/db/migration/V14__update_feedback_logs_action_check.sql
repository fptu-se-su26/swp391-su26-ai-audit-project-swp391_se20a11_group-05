ALTER TABLE feedback_logs DROP CONSTRAINT IF EXISTS feedback_logs_action_check;
ALTER TABLE feedback_logs ADD CONSTRAINT feedback_logs_action_check CHECK (action IN ('SUBMIT', 'ACCEPT', 'REQUEST_INFO', 'PROVIDE_INFO', 'REJECT', 'RESOLVE', 'UPDATE_STATUS', 'ASSIGN'));
