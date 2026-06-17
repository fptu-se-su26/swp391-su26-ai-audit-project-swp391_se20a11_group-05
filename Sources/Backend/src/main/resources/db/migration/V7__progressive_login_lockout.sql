ALTER TABLE IF EXISTS users
    ADD COLUMN IF NOT EXISTS login_lock_stage INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS login_otp_required BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS last_failed_login_at TIMESTAMP;

COMMENT ON COLUMN users.login_lock_stage IS 'Progressive login lockout stage: 0 default, 1 one-minute lock, 2 three-minute lock, 3 six-minute lock, 4 SMS OTP required.';
COMMENT ON COLUMN users.login_otp_required IS 'True when normal password login is blocked until SMS OTP verification succeeds.';
COMMENT ON COLUMN users.last_failed_login_at IS 'Timestamp of the last failed password login attempt.';
