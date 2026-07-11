-- ═══════════════════════════════════════════════════════════════════════
-- V17__ward_ranking_advanced.sql
-- Thêm cột population và cập nhật cấu trúc bảng ward_ranking_snapshots
-- ═══════════════════════════════════════════════════════════════════════

-- 1. Thêm cột population vào bảng wards
ALTER TABLE wards ADD COLUMN IF NOT EXISTS population INT;
UPDATE wards SET population = 20000 WHERE population IS NULL;
ALTER TABLE wards ALTER COLUMN population SET NOT NULL;

-- 2. Cập nhật bảng ward_ranking_snapshots
ALTER TABLE ward_ranking_snapshots
    ADD COLUMN IF NOT EXISTS low_incidence_score DECIMAL(5, 2) DEFAULT 0.0,
    ADD COLUMN IF NOT EXISTS satisfaction_score DECIMAL(5, 2) DEFAULT 0.0,
    ADD COLUMN IF NOT EXISTS trend_score DECIMAL(5, 2) DEFAULT 50.0,
    ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'RANKED';

-- Xoá các cột không còn sử dụng trong thiết kế mới (để đảm bảo không bị lẫn lộn)
ALTER TABLE ward_ranking_snapshots DROP COLUMN IF EXISTS consistency_score;
ALTER TABLE ward_ranking_snapshots DROP COLUMN IF EXISTS pending_rate;

-- Note: Giữ lại resolution_rate và avg_resolution_hours để debug/hiển thị chi tiết
