INSERT INTO districts (id, name, created_at, updated_at)
VALUES (1, 'Hai Chau', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO wards (id, district_id, name, created_at, updated_at)
VALUES (1, 1, 'Hai Chau I', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO categories (id, name, description, created_at, updated_at)
VALUES (1, 'Ha tang do thi', 'Phan anh ha tang do thi', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
