alter table if exists categories
  add column if not exists code varchar(80),
  add column if not exists name_vi varchar(255),
  add column if not exists name_en varchar(255),
  add column if not exists description_vi text,
  add column if not exists description_en text,
  add column if not exists managed_by_role varchar(30),
  add column if not exists is_active boolean not null default true;

alter table if exists wards
  add column if not exists ward_code varchar(50),
  add column if not exists type varchar(30) not null default 'WARD',
  add column if not exists city_name varchar(100) not null default 'Da Nang',
  add column if not exists is_active boolean not null default true;

update categories
set code = coalesce(code, 'LEGACY_' || id),
    name_vi = coalesce(name_vi, name),
    name_en = coalesce(name_en, name),
    description_vi = coalesce(description_vi, description),
    description_en = coalesce(description_en, description),
    managed_by_role = coalesce(managed_by_role, 'WARD_STAFF')
where code is null
   or name_vi is null
   or name_en is null
   or managed_by_role is null;

create unique index if not exists ux_categories_code on categories(code);

insert into categories (code, name, description, name_vi, name_en, description_vi, description_en, managed_by_role, is_active, created_at, updated_at)
values
('TRAFFIC', 'Giao thông', 'Duong hu hong, un tac, bien bao, an toan giao thong', 'Giao thông', 'Traffic', 'Duong hu hong, un tac, bien bao, an toan giao thong', 'Road damage, congestion, traffic signs, and traffic safety', 'POLICE', true, now(), now()),
('URBAN_INFRASTRUCTURE', 'Hạ tầng đô thị', 'Den chieu sang, cong thoat nuoc, via he va cong trinh cong cong', 'Hạ tầng đô thị', 'Urban Infrastructure', 'Den chieu sang, cong thoat nuoc, via he va cong trinh cong cong', 'Lighting, drainage, sidewalks, and public infrastructure', 'WARD_STAFF', true, now(), now()),
('ENVIRONMENT', 'Môi trường', 'Rac thai, o nhiem, cay xanh va ve sinh do thi', 'Môi trường', 'Environment', 'Rac thai, o nhiem, cay xanh va ve sinh do thi', 'Waste, pollution, greenery, and urban sanitation', 'WARD_STAFF', true, now(), now()),
('PUBLIC_SECURITY', 'An ninh trật tự', 'Mat trat tu, gay roi, trom cap va nguy co an ninh', 'An ninh trật tự', 'Public Security', 'Mat trat tu, gay roi, trom cap va nguy co an ninh', 'Disorder, disturbance, theft, and public security risks', 'POLICE', true, now(), now()),
('CONSTRUCTION', 'Xây dựng', 'Xay dung trai phep, che chan cong trinh va an toan thi cong', 'Xây dựng', 'Construction', 'Xay dung trai phep, che chan cong trinh va an toan thi cong', 'Illegal construction, site obstruction, and construction safety', 'WARD_STAFF', true, now(), now()),
('FIRE_SAFETY', 'Phòng cháy chữa cháy', 'Nguy co chay no, loi thoat hiem va thiet bi PCCC', 'Phòng cháy chữa cháy', 'Fire Safety', 'Nguy co chay no, loi thoat hiem va thiet bi PCCC', 'Fire hazards, emergency exits, and fire safety equipment', 'POLICE', true, now(), now())
on conflict (code) do update set
    name = excluded.name,
    description = excluded.description,
    name_vi = excluded.name_vi,
    name_en = excluded.name_en,
    description_vi = excluded.description_vi,
    description_en = excluded.description_en,
    managed_by_role = excluded.managed_by_role,
    is_active = true,
    updated_at = now();

update categories
set is_active = false, updated_at = now()
where name in ('Test Feedback', 'Sample Feedback', 'Demo Category')
   or code in ('TEST_FEEDBACK', 'SAMPLE_FEEDBACK', 'DEMO_CATEGORY');

alter table if exists feedbacks
  add column if not exists category_code varchar(80),
  add column if not exists category_name varchar(255),
  add column if not exists managed_by_role varchar(30),
  add column if not exists ward_name varchar(255),
  add column if not exists district_name varchar(255),
  add column if not exists city_name varchar(255),
  add column if not exists assigned_unit_id bigint,
  add column if not exists assigned_unit_name varchar(255),
  add column if not exists assigned_to_role varchar(30),
  add column if not exists assigned_staff_id bigint,
  add column if not exists submitted_at timestamp,
  add column if not exists received_at timestamp;

alter table if exists feedbacks
  alter column ward_id drop not null;

alter table if exists feedbacks
  drop constraint if exists feedbacks_status_check;

alter table if exists feedbacks
  add constraint feedbacks_status_check
  check (status in (
    'SUBMITTED',
    'PENDING_RECEIVE',
    'PENDING',
    'NEED_LOCATION_REVIEW',
    'IN_PROGRESS',
    'WAITING_INFO',
    'RESOLVED',
    'REJECTED'
  ));

update feedbacks f
set category_code = coalesce(f.category_code, c.code),
    category_name = coalesce(f.category_name, c.name_vi, c.name),
    managed_by_role = coalesce(f.managed_by_role, c.managed_by_role),
    ward_name = coalesce(f.ward_name, w.name),
    city_name = coalesce(f.city_name, w.city_name),
    assigned_unit_id = coalesce(f.assigned_unit_id, w.id),
    assigned_to_role = coalesce(f.assigned_to_role, c.managed_by_role),
    assigned_unit_name = coalesce(
      f.assigned_unit_name,
      case
        when c.managed_by_role = 'POLICE' and w.id is not null then w.name || ' Ward Police'
        when c.managed_by_role = 'WARD_STAFF' and w.id is not null then w.name || ' Ward People''s Committee'
        else null
      end
    ),
    submitted_at = coalesce(f.submitted_at, f.created_at)
from categories c
left join wards w on w.id = f.ward_id
where f.category_id = c.id;
