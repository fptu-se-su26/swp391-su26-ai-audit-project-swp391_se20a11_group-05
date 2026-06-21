package com.example.smartcity.common.config;

import com.example.smartcity.modules.core.entity.Ward;
import com.example.smartcity.modules.core.repository.WardRepository;
import com.example.smartcity.modules.feedback.entity.Category;
import com.example.smartcity.modules.feedback.repository.CategoryRepository;
import com.example.smartcity.modules.user.entity.Role;
import com.example.smartcity.modules.user.entity.User;
import com.example.smartcity.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final WardRepository wardRepository;
    private final CategoryRepository categoryRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        // [FIX] Tự động mở rộng cột otp_code lên VARCHAR(255) để chứa BCrypt hash
        // (Flyway bị tắt trong profile Supabase nên phải dùng cách này)
        try {
            jdbcTemplate.execute("ALTER TABLE sms_verifications ALTER COLUMN otp_code TYPE VARCHAR(255)");
            log.info("Successfully altered sms_verifications.otp_code to VARCHAR(255)");
        } catch (Exception e) {
            log.warn("Could not ALTER sms_verifications.otp_code (may already be correct type): {}", e.getMessage());
        }

        try {
            // [FIX] Cleanup duplicate users before doing any findByUsername
            jdbcTemplate.execute("DELETE FROM users a USING users b WHERE a.id > b.id AND lower(a.username) = lower(b.username)");
            log.info("Successfully cleaned up duplicate users");
        } catch (Exception e) {
            log.warn("Could not cleanup duplicate users: {}", e.getMessage());
        }

        ensureLoginLockoutSchema();
        ensureOfficialFeedbackSchema();
        try {
            updateWardTypes();
        } catch (Exception e) {
            log.warn("Lỗi khi cập nhật type cho phường/xã: {}", e.getMessage());
        }
        ensureCampaignSchema();

        // [FIX] Bỏ constraint feedbacks_status_check để tránh lỗi khi cập nhật status ASSIGNED
        try {
            jdbcTemplate.execute("ALTER TABLE feedbacks DROP CONSTRAINT IF EXISTS feedbacks_status_check");
            jdbcTemplate.execute("ALTER TABLE feedback_logs DROP CONSTRAINT IF EXISTS feedback_logs_old_status_check");
            jdbcTemplate.execute("ALTER TABLE feedback_logs DROP CONSTRAINT IF EXISTS feedback_logs_new_status_check");
            log.info("Successfully dropped check constraint feedbacks_status_check");
        } catch (Exception e) {
            log.warn("Could not drop feedbacks_status_check: {}", e.getMessage());
        }

        // Seeding default user accounts if they don't exist
        if (userRepository.findByUsername("citizen1").isEmpty()) {
            User citizen = new User(
                    "citizen1",
                    passwordEncoder.encode("123456"),
                    "Người Dân Số 1",
                    "0900000001",
                    "citizen1@example.com",
                    Role.CITIZEN
            );
            userRepository.save(citizen);
            log.info("Seeded citizen account: citizen1 / 123456");
        }

        if (userRepository.findByUsername("ward_staff1").isEmpty()) {
            User wardStaff = new User(
                    "ward_staff1",
                    passwordEncoder.encode("123456"),
                    "Cán Bộ Phường 1",
                    "0900000002",
                    "ward1@example.com",
                    Role.WARD_STAFF
            );
            userRepository.save(wardStaff);
            log.info("Seeded ward staff account: ward_staff1 / 123456");
        }

        if (userRepository.findByUsername("police1").isEmpty()) {
            User police = new User(
                    "police1",
                    passwordEncoder.encode("123456"),
                    "Công An Phường 1",
                    "0900000003",
                    "police1@example.com",
                    Role.POLICE
            );
            userRepository.save(police);
            log.info("Seeded police account: police1 / 123456");
        }

        if (userRepository.findByUsername("admin").isEmpty()) {
            User admin = new User(
                    "admin",
                    passwordEncoder.encode("admin123"),
                    "Quản Trị Viên",
                    "0900000004",
                    "admin@example.com",
                    Role.SUPER_ADMIN
            );
            userRepository.save(admin);
            log.info("Seeded admin account: admin / admin123");
        }
        seedDefaultWards();
        ensureDefaultWardStaffHasWard();
        seedDefaultCategories();

        try {
            migratePlaintextPasswords();
        } catch (Exception e) {
            log.warn("Lỗi khi tự động băm mật khẩu: {}", e.getMessage());
        }
    }

    private void migratePlaintextPasswords() {
        log.info("Checking for plaintext passwords in the database...");
        java.util.List<User> users = userRepository.findAll();
        int migratedCount = 0;
        for (User user : users) {
            String password = user.getPassword();
            if (password != null && !password.startsWith("$2a$") && !password.startsWith("$2b$") && !password.startsWith("$2y$")) {
                log.info("Plaintext password detected for user '{}'. Hashing it with BCrypt...", user.getUsername());
                user.setPassword(passwordEncoder.encode(password));
                userRepository.save(user);
                migratedCount++;
            }
        }
        if (migratedCount > 0) {
            log.info("Successfully migrated {} plaintext passwords to BCrypt.", migratedCount);
        } else {
            log.info("No plaintext passwords found. All passwords are secure.");
        }
    }

    private void updateWardTypes() {
        log.info("Updating ward types based on the list of Wards (Phường)...");
        // Update all wards to COMMUNE first (so the rest will be Xã)
        jdbcTemplate.execute("UPDATE wards SET type = 'COMMUNE'");
        
        // List of wards provided by the user
        String[] wards = {
            "Hải Châu", "Hòa Cường", "Thanh Khê", "An Khê", "An Hải", "Sơn Trà",
            "Ngũ Hành Sơn", "Hòa Quý", "Hòa Khánh", "Liên Chiểu", "Hải Vân",
            "Cẩm Lệ", "Hòa Xuân", "Tam Kỳ", "Quảng Phú", "Hương Trà", "Bàn Thạch",
            "Điện Bàn", "Điện Bàn Đông", "An Thắng", "Điện Bàn Bắc", "Hội An",
            "Phường Hải Châu", "Phường Hòa Cường", "Phường Thanh Khê", "Phường An Khê", 
            "Phường An Hải", "Phường Sơn Trà", "Phường Ngũ Hành Sơn", "Phường Hòa Quý", 
            "Phường Hòa Khánh", "Phường Liên Chiểu", "Phường Hải Vân", "Phường Cẩm Lệ", 
            "Phường Hòa Xuân", "Phường Tam Kỳ", "Phường Quảng Phú", "Phường Hương Trà", 
            "Phường Bàn Thạch", "Phường Điện Bàn", "Phường Điện Bàn Đông", "Phường An Thắng", 
            "Phường Điện Bàn Bắc", "Phường Hội An"
        };
        
        // Set type to WARD for exactly these names
        for (String w : wards) {
            jdbcTemplate.update("UPDATE wards SET type = 'WARD' WHERE name = ?", w);
        }
        log.info("Updated ward types successfully.");
    }

    private void seedDefaultWards() {
        if (wardRepository.count() > 0) return;

        seedWard("DN-HC", "Hải Châu", "WARD");
        seedWard("DN-TK", "Thanh Khê", "WARD");
        seedWard("DN-ST", "Sơn Trà", "WARD");
        seedWard("DN-NHS", "Ngũ Hành Sơn", "WARD");
        seedWard("DN-LLC", "Liên Chiểu", "WARD");
        seedWard("DN-CL", "Cẩm Lệ", "WARD");
        seedWard("DN-HV", "Hòa Vang", "COMMUNE");
        log.info("Seeded default Da Nang wards.");
    }

    private void seedWard(String code, String name, String type) {
        Ward ward = new Ward(code, name);
        ward.setType(type);
        ward.setCityName("Da Nang");
        ward.setActive(true);
        wardRepository.save(ward);
    }

    private void ensureDefaultWardStaffHasWard() {
        userRepository.findByUsername("ward_staff1").ifPresent(wardStaff -> {
            if (wardStaff.getWard() != null) {
                return;
            }
            wardRepository.findAll().stream().findFirst().ifPresent(defaultWard -> {
                wardStaff.setWard(defaultWard);
                userRepository.save(wardStaff);
                log.info("Assigned default ward {} to ward_staff1.", defaultWard.getName());
            });
        });
    }

    private void seedDefaultCategories() {
        seedCategory("TRAFFIC", "Giao th\u00f4ng", "Traffic",
                "Duong hu hong, un tac, bien bao, an toan giao thong",
                "Road damage, congestion, traffic signs, and traffic safety",
                "POLICE");
        seedCategory("URBAN_INFRASTRUCTURE", "H\u1ea1 t\u1ea7ng \u0111\u00f4 th\u1ecb", "Urban Infrastructure",
                "Den chieu sang, cong thoat nuoc, via he va cong trinh cong cong",
                "Lighting, drainage, sidewalks, and public infrastructure",
                "WARD_STAFF");
        seedCategory("ENVIRONMENT", "M\u00f4i tr\u01b0\u1eddng", "Environment",
                "Rac thai, o nhiem, cay xanh va ve sinh do thi",
                "Waste, pollution, greenery, and urban sanitation",
                "WARD_STAFF");
        seedCategory("PUBLIC_SECURITY", "An ninh tr\u1eadt t\u1ef1", "Public Security",
                "Mat trat tu, gay roi, trom cap va nguy co an ninh",
                "Disorder, disturbance, theft, and public security risks",
                "POLICE");
        seedCategory("CONSTRUCTION", "X\u00e2y d\u1ef1ng", "Construction",
                "Xay dung trai phep, che chan cong trinh va an toan thi cong",
                "Illegal construction, site obstruction, and construction safety",
                "WARD_STAFF");
        seedCategory("FIRE_SAFETY", "Ph\u00f2ng ch\u00e1y ch\u1eefa ch\u00e1y", "Fire Safety",
                "Nguy co chay no, loi thoat hiem va thiet bi PCCC",
                "Fire hazards, emergency exits, and fire safety equipment",
                "POLICE");
        deactivateDemoCategory("Test Feedback");
        deactivateDemoCategory("Sample Feedback");
        deactivateDemoCategory("Demo Category");
        log.info("Seeded official feedback categories.");
    }

    private void ensureOfficialFeedbackSchema() {
        executeSchemaSql("ALTER TABLE IF EXISTS categories ADD COLUMN IF NOT EXISTS code VARCHAR(80)");
        executeSchemaSql("ALTER TABLE IF EXISTS categories ADD COLUMN IF NOT EXISTS name_vi VARCHAR(255)");
        executeSchemaSql("ALTER TABLE IF EXISTS categories ADD COLUMN IF NOT EXISTS name_en VARCHAR(255)");
        executeSchemaSql("ALTER TABLE IF EXISTS categories ADD COLUMN IF NOT EXISTS description_vi TEXT");
        executeSchemaSql("ALTER TABLE IF EXISTS categories ADD COLUMN IF NOT EXISTS description_en TEXT");
        executeSchemaSql("ALTER TABLE IF EXISTS categories ADD COLUMN IF NOT EXISTS managed_by_role VARCHAR(30)");
        executeSchemaSql("ALTER TABLE IF EXISTS categories ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE");
        executeSchemaSql("UPDATE categories SET code = COALESCE(code, 'LEGACY_' || id), name_vi = COALESCE(name_vi, name), name_en = COALESCE(name_en, name), description_vi = COALESCE(description_vi, description), description_en = COALESCE(description_en, description), managed_by_role = COALESCE(managed_by_role, 'WARD_STAFF') WHERE code IS NULL OR name_vi IS NULL OR name_en IS NULL OR managed_by_role IS NULL");
        executeSchemaSql("CREATE UNIQUE INDEX IF NOT EXISTS ux_categories_code ON categories(code)");

        executeSchemaSql("ALTER TABLE IF EXISTS wards ADD COLUMN IF NOT EXISTS ward_code VARCHAR(50)");
        executeSchemaSql("ALTER TABLE IF EXISTS wards ADD COLUMN IF NOT EXISTS type VARCHAR(30) NOT NULL DEFAULT 'WARD'");
        executeSchemaSql("ALTER TABLE IF EXISTS wards ADD COLUMN IF NOT EXISTS city_name VARCHAR(100) NOT NULL DEFAULT 'Da Nang'");
        executeSchemaSql("ALTER TABLE IF EXISTS wards ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE");

        executeSchemaSql("ALTER TABLE IF EXISTS feedbacks ADD COLUMN IF NOT EXISTS category_code VARCHAR(80)");
        executeSchemaSql("ALTER TABLE IF EXISTS feedbacks ADD COLUMN IF NOT EXISTS category_name VARCHAR(255)");
        executeSchemaSql("ALTER TABLE IF EXISTS feedbacks ADD COLUMN IF NOT EXISTS managed_by_role VARCHAR(30)");
        executeSchemaSql("ALTER TABLE IF EXISTS feedbacks ADD COLUMN IF NOT EXISTS ward_name VARCHAR(255)");
        executeSchemaSql("ALTER TABLE IF EXISTS feedbacks ADD COLUMN IF NOT EXISTS district_name VARCHAR(255)");
        executeSchemaSql("ALTER TABLE IF EXISTS feedbacks ADD COLUMN IF NOT EXISTS city_name VARCHAR(255)");
        executeSchemaSql("ALTER TABLE IF EXISTS feedbacks ADD COLUMN IF NOT EXISTS assigned_unit_id BIGINT");
        executeSchemaSql("ALTER TABLE IF EXISTS feedbacks ADD COLUMN IF NOT EXISTS assigned_unit_name VARCHAR(255)");
        executeSchemaSql("ALTER TABLE IF EXISTS feedbacks ADD COLUMN IF NOT EXISTS assigned_to_role VARCHAR(30)");
        executeSchemaSql("ALTER TABLE IF EXISTS feedbacks ADD COLUMN IF NOT EXISTS assigned_staff_id BIGINT");
        executeSchemaSql("ALTER TABLE IF EXISTS feedbacks ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP");
        executeSchemaSql("ALTER TABLE IF EXISTS feedbacks ADD COLUMN IF NOT EXISTS received_at TIMESTAMP");
        executeSchemaSql("ALTER TABLE IF EXISTS feedbacks ALTER COLUMN ward_id DROP NOT NULL");
        executeSchemaSql("ALTER TABLE IF EXISTS feedbacks DROP CONSTRAINT IF EXISTS feedbacks_status_check");
        executeSchemaSql("ALTER TABLE IF EXISTS feedbacks ADD CONSTRAINT feedbacks_status_check CHECK (status IN ('SUBMITTED', 'PENDING_RECEIVE', 'PENDING', 'NEED_LOCATION_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_INFO', 'RESOLVED', 'REJECTED', 'PRE_EMPTIVE'))");

        executeSchemaSql("ALTER TABLE IF EXISTS attachments ADD COLUMN IF NOT EXISTS attachment_purpose VARCHAR(50) NOT NULL DEFAULT 'SUBMISSION_EVIDENCE'");
        executeSchemaSql("CREATE INDEX IF NOT EXISTS idx_attachments_feedback_purpose ON attachments(feedback_id, attachment_purpose)");
    }

    private void ensureLoginLockoutSchema() {
        executeSchemaSql("ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS login_lock_stage INTEGER NOT NULL DEFAULT 0");
        executeSchemaSql("ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS login_otp_required BOOLEAN NOT NULL DEFAULT FALSE");
        executeSchemaSql("ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS last_failed_login_at TIMESTAMP");
    }

    private void ensureCampaignSchema() {
        executeSchemaSql("""
                CREATE TABLE IF NOT EXISTS campaigns (
                    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                    created_at TIMESTAMP,
                    updated_at TIMESTAMP,
                    created_by BIGINT,
                    ward_id BIGINT,
                    title VARCHAR(255),
                    description TEXT,
                    category VARCHAR(50),
                    location_text VARCHAR(255),
                    private_location_text VARCHAR(500),
                    required_tools TEXT,
                    organizer_contact VARCHAR(255),
                    latitude DOUBLE PRECISION,
                    longitude DOUBLE PRECISION,
                    max_participants INTEGER,
                    start_time TIMESTAMP,
                    end_time TIMESTAMP,
                    status VARCHAR(30) DEFAULT 'PENDING_APPROVAL'
                )
                """);
        executeSchemaSql("ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS created_at TIMESTAMP");
        executeSchemaSql("ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP");
        executeSchemaSql("ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS created_by BIGINT");
        executeSchemaSql("ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS ward_id BIGINT");
        executeSchemaSql("ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS title VARCHAR(255)");
        executeSchemaSql("ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS description TEXT");
        executeSchemaSql("ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS category VARCHAR(50)");
        executeSchemaSql("ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS location_text VARCHAR(255)");
        executeSchemaSql("ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS private_location_text VARCHAR(500)");
        executeSchemaSql("ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS required_tools TEXT");
        executeSchemaSql("ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS organizer_contact VARCHAR(255)");
        executeSchemaSql("ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION");
        executeSchemaSql("ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION");
        executeSchemaSql("ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS max_participants INTEGER");
        executeSchemaSql("ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS start_time TIMESTAMP");
        executeSchemaSql("ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS end_time TIMESTAMP");
        executeSchemaSql("ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'PENDING_APPROVAL'");
        executeSchemaSql("ALTER TABLE campaigns ALTER COLUMN status TYPE VARCHAR(30)");
        executeSchemaSql("ALTER TABLE campaigns ALTER COLUMN status SET DEFAULT 'PENDING_APPROVAL'");
        executeSchemaSql("UPDATE campaigns SET status = 'PENDING_APPROVAL' WHERE status IS NULL");
        dropLegacyCampaignCheckConstraints();
        alignLegacyCampaignColumns();

        executeSchemaSql("""
                CREATE TABLE IF NOT EXISTS campaign_participants (
                    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                    campaign_id BIGINT,
                    citizen_id BIGINT,
                    join_status VARCHAR(20) DEFAULT 'PENDING',
                    approved_by BIGINT,
                    approved_at TIMESTAMP,
                    rejected_at TIMESTAMP,
                    rejection_reason VARCHAR(500),
                    cancelled_at TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
                """);
        executeSchemaSql("ALTER TABLE campaign_participants ADD COLUMN IF NOT EXISTS campaign_id BIGINT");
        executeSchemaSql("ALTER TABLE campaign_participants ADD COLUMN IF NOT EXISTS citizen_id BIGINT");
        executeSchemaSql("ALTER TABLE campaign_participants ADD COLUMN IF NOT EXISTS join_status VARCHAR(20) DEFAULT 'PENDING'");
        executeSchemaSql("ALTER TABLE campaign_participants ADD COLUMN IF NOT EXISTS approved_by BIGINT");
        executeSchemaSql("ALTER TABLE campaign_participants ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP");
        executeSchemaSql("ALTER TABLE campaign_participants ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP");
        executeSchemaSql("ALTER TABLE campaign_participants ADD COLUMN IF NOT EXISTS rejection_reason VARCHAR(500)");
        executeSchemaSql("ALTER TABLE campaign_participants ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP");
        executeSchemaSql("ALTER TABLE campaign_participants ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
        executeSchemaSql("ALTER TABLE campaign_participants ALTER COLUMN join_status SET DEFAULT 'PENDING'");
        executeSchemaSql("UPDATE campaign_participants SET join_status = 'PENDING' WHERE join_status IS NULL OR join_status = 'SURE'");
        executeSchemaSql("ALTER TABLE campaign_participants DROP CONSTRAINT IF EXISTS campaign_participants_join_status_check");

        executeSchemaSql("""
                CREATE TABLE IF NOT EXISTS campaign_chat_messages (
                    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                    campaign_id BIGINT,
                    sender_id BIGINT,
                    message TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
                """);
        executeSchemaSql("""
                CREATE TABLE IF NOT EXISTS campaign_comments (
                    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                    campaign_id BIGINT,
                    author_id BIGINT,
                    content TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
                """);
        executeSchemaSql("""
                CREATE TABLE IF NOT EXISTS campaign_feedbacks (
                    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                    campaign_id BIGINT,
                    participant_id BIGINT,
                    rating INTEGER,
                    content TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
                """);
        executeSchemaSql("CREATE INDEX IF NOT EXISTS idx_campaigns_status_created ON campaigns(status, created_at DESC)");
        executeSchemaSql("CREATE INDEX IF NOT EXISTS idx_campaign_participants_campaign_status ON campaign_participants(campaign_id, join_status)");
        executeSchemaSql("CREATE INDEX IF NOT EXISTS idx_campaign_chat_campaign_created ON campaign_chat_messages(campaign_id, created_at DESC)");
        executeSchemaSql("CREATE INDEX IF NOT EXISTS idx_campaign_comments_campaign_created ON campaign_comments(campaign_id, created_at DESC)");
    }

    private void alignLegacyCampaignColumns() {
        // Older campaign prototypes had extra NOT NULL columns that are no longer part of the JPA entity.
        // If they still exist in Supabase, inserts fail even though the current workflow payload is valid.
        executeSchemaSql("ALTER TABLE campaigns ALTER COLUMN banner_url DROP NOT NULL");
        executeSchemaSql("ALTER TABLE campaigns ALTER COLUMN photo_urls DROP NOT NULL");
        executeSchemaSql("ALTER TABLE campaigns ALTER COLUMN location DROP NOT NULL");
        executeSchemaSql("ALTER TABLE campaigns ALTER COLUMN civic_problem_id DROP NOT NULL");
        executeSchemaSql("ALTER TABLE campaigns ALTER COLUMN organizer_type SET DEFAULT 'ORGANIZATION'");
        executeSchemaSql("UPDATE campaigns SET organizer_type = 'ORGANIZATION' WHERE organizer_type IS NULL");
        executeSchemaSql("ALTER TABLE campaigns ALTER COLUMN organizer_type DROP NOT NULL");
        executeSchemaSql("ALTER TABLE campaigns ALTER COLUMN cccd_verified SET DEFAULT false");
        executeSchemaSql("UPDATE campaigns SET cccd_verified = false WHERE cccd_verified IS NULL");
        executeSchemaSql("ALTER TABLE campaigns ALTER COLUMN cccd_verified DROP NOT NULL");
        executeSchemaSql("ALTER TABLE campaigns ALTER COLUMN contract_accepted_at DROP NOT NULL");
        executeSchemaSql("ALTER TABLE campaigns ALTER COLUMN contract_accepted_ip DROP NOT NULL");
        executeSchemaSql("""
                DO $$
                DECLARE
                    legacy_col record;
                BEGIN
                    FOR legacy_col IN
                        SELECT column_name
                        FROM information_schema.columns
                        WHERE table_name = 'campaigns'
                          AND is_nullable = 'NO'
                          AND column_name NOT IN (
                              'id',
                              'created_by',
                              'title',
                              'status'
                          )
                    LOOP
                        EXECUTE format('ALTER TABLE campaigns ALTER COLUMN %I DROP NOT NULL', legacy_col.column_name);
                    END LOOP;
                END $$;
                """);
    }

    private void dropLegacyCampaignCheckConstraints() {
        executeSchemaSql("""
                DO $$
                DECLARE
                    campaign_check record;
                BEGIN
                    FOR campaign_check IN
                        SELECT nsp.nspname AS schema_name,
                               rel.relname AS table_name,
                               con.conname AS constraint_name
                        FROM pg_constraint con
                        JOIN pg_class rel ON rel.oid = con.conrelid
                        JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
                        WHERE rel.relname = 'campaigns'
                          AND con.contype = 'c'
                    LOOP
                        EXECUTE format(
                            'ALTER TABLE %I.%I DROP CONSTRAINT IF EXISTS %I',
                            campaign_check.schema_name,
                            campaign_check.table_name,
                            campaign_check.constraint_name
                        );
                    END LOOP;
                END $$;
                """);
    }

    private void executeSchemaSql(String sql) {
        try {
            jdbcTemplate.execute(sql);
        } catch (Exception e) {
            log.warn("Could not apply schema alignment SQL [{}]: {}", sql, e.getMessage());
        }
    }

    private void seedCategory(String code, String nameVi, String nameEn, String descriptionVi, String descriptionEn, String managedByRole) {
        Category category = categoryRepository.findByCode(code).orElseGet(Category::new);
        category.setCode(code);
        category.setName(nameVi);
        category.setDescription(descriptionVi);
        category.setNameVi(nameVi);
        category.setNameEn(nameEn);
        category.setDescriptionVi(descriptionVi);
        category.setDescriptionEn(descriptionEn);
        category.setManagedByRole(managedByRole);
        category.setActive(true);
        categoryRepository.save(category);
    }

    private void deactivateDemoCategory(String name) {
        categoryRepository.findByName(name).ifPresent(category -> {
            category.setActive(false);
            categoryRepository.save(category);
        });
    }
}
