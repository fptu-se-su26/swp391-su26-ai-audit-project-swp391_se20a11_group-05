ALTER TABLE IF EXISTS categories
    ADD COLUMN IF NOT EXISTS code VARCHAR(80),
    ADD COLUMN IF NOT EXISTS name_vi VARCHAR(255),
    ADD COLUMN IF NOT EXISTS name_en VARCHAR(255),
    ADD COLUMN IF NOT EXISTS description_vi TEXT,
    ADD COLUMN IF NOT EXISTS description_en TEXT,
    ADD COLUMN IF NOT EXISTS managed_by_role VARCHAR(30),
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE IF EXISTS wards
    ADD COLUMN IF NOT EXISTS ward_code VARCHAR(50),
    ADD COLUMN IF NOT EXISTS type VARCHAR(30) NOT NULL DEFAULT 'WARD',
    ADD COLUMN IF NOT EXISTS city_name VARCHAR(100) NOT NULL DEFAULT 'Da Nang',
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

UPDATE categories
SET code = COALESCE(code, 'LEGACY_' || id),
    name_vi = COALESCE(name_vi, name),
    name_en = COALESCE(name_en, name),
    description_vi = COALESCE(description_vi, description),
    description_en = COALESCE(description_en, description),
    managed_by_role = COALESCE(managed_by_role, 'WARD_STAFF')
WHERE code IS NULL
   OR name_vi IS NULL
   OR name_en IS NULL
   OR managed_by_role IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_categories_code ON categories(code);

INSERT INTO categories (code, name, description, name_vi, name_en, description_vi, description_en, managed_by_role, is_active, created_at, updated_at)
VALUES
('TRAFFIC', 'Giao thông', 'Duong hu hong, un tac, bien bao, an toan giao thong', 'Giao thông', 'Traffic', 'Duong hu hong, un tac, bien bao, an toan giao thong', 'Road damage, congestion, traffic signs, and traffic safety', 'POLICE', TRUE, NOW(), NOW()),
('URBAN_INFRASTRUCTURE', 'Hạ tầng đô thị', 'Den chieu sang, cong thoat nuoc, via he va cong trinh cong cong', 'Hạ tầng đô thị', 'Urban Infrastructure', 'Den chieu sang, cong thoat nuoc, via he va cong trinh cong cong', 'Lighting, drainage, sidewalks, and public infrastructure', 'WARD_STAFF', TRUE, NOW(), NOW()),
('ENVIRONMENT', 'Môi trường', 'Rac thai, o nhiem, cay xanh va ve sinh do thi', 'Môi trường', 'Environment', 'Rac thai, o nhiem, cay xanh va ve sinh do thi', 'Waste, pollution, greenery, and urban sanitation', 'WARD_STAFF', TRUE, NOW(), NOW()),
('PUBLIC_SECURITY', 'An ninh trật tự', 'Mat trat tu, gay roi, trom cap va nguy co an ninh', 'An ninh trật tự', 'Public Security', 'Mat trat tu, gay roi, trom cap va nguy co an ninh', 'Disorder, disturbance, theft, and public security risks', 'POLICE', TRUE, NOW(), NOW()),
('CONSTRUCTION', 'Xây dựng', 'Xay dung trai phep, che chan cong trinh va an toan thi cong', 'Xây dựng', 'Construction', 'Xay dung trai phep, che chan cong trinh va an toan thi cong', 'Illegal construction, site obstruction, and construction safety', 'WARD_STAFF', TRUE, NOW(), NOW()),
('FIRE_SAFETY', 'Phòng cháy chữa cháy', 'Nguy co chay no, loi thoat hiem va thiet bi PCCC', 'Phòng cháy chữa cháy', 'Fire Safety', 'Nguy co chay no, loi thoat hiem va thiet bi PCCC', 'Fire hazards, emergency exits, and fire safety equipment', 'POLICE', TRUE, NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    name_vi = EXCLUDED.name_vi,
    name_en = EXCLUDED.name_en,
    description_vi = EXCLUDED.description_vi,
    description_en = EXCLUDED.description_en,
    managed_by_role = EXCLUDED.managed_by_role,
    is_active = TRUE,
    updated_at = NOW();

UPDATE categories
SET is_active = FALSE, updated_at = NOW()
WHERE name IN ('Test Feedback', 'Sample Feedback', 'Demo Category')
   OR code IN ('TEST_FEEDBACK', 'SAMPLE_FEEDBACK', 'DEMO_CATEGORY');

ALTER TABLE IF EXISTS feedbacks
    ADD COLUMN IF NOT EXISTS category_code VARCHAR(80),
    ADD COLUMN IF NOT EXISTS category_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS managed_by_role VARCHAR(30),
    ADD COLUMN IF NOT EXISTS ward_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS district_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS city_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS assigned_unit_id BIGINT,
    ADD COLUMN IF NOT EXISTS assigned_unit_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS assigned_to_role VARCHAR(30),
    ADD COLUMN IF NOT EXISTS assigned_staff_id BIGINT,
    ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS received_at TIMESTAMP;

ALTER TABLE IF EXISTS feedbacks
    ALTER COLUMN ward_id DROP NOT NULL;

UPDATE feedbacks f
SET category_code = COALESCE(f.category_code, c.code),
    category_name = COALESCE(f.category_name, c.name_vi, c.name),
    managed_by_role = COALESCE(f.managed_by_role, c.managed_by_role),
    ward_name = COALESCE(f.ward_name, w.name),
    city_name = COALESCE(f.city_name, w.city_name),
    assigned_unit_id = COALESCE(f.assigned_unit_id, w.id),
    assigned_to_role = COALESCE(f.assigned_to_role, c.managed_by_role),
    assigned_unit_name = COALESCE(
        f.assigned_unit_name,
        CASE
            WHEN c.managed_by_role = 'POLICE' AND w.id IS NOT NULL THEN w.name || ' Ward Police'
            WHEN c.managed_by_role = 'WARD_STAFF' AND w.id IS NOT NULL THEN w.name || ' Ward People''s Committee'
            ELSE NULL
        END
    ),
    submitted_at = COALESCE(f.submitted_at, f.created_at)
FROM categories c
LEFT JOIN wards w ON w.id = f.ward_id
WHERE f.category_id = c.id;
