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

        ensureLoginLockoutSchema();
        ensureOfficialFeedbackSchema();
        
        try {
            updateWardTypes();
        } catch (Exception e) {
            log.warn("Lỗi khi cập nhật type cho phường/xã: {}", e.getMessage());
        }

        if (userRepository.count() == 0) {
            log.info("Database is empty. Seeding default user accounts...");

            // 1. Citizen account
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

            // 2. Ward staff account
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

            // 3. Police account
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

            // 4. Super Admin account
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

            log.info("Default user accounts seeded successfully!");
        } else {
            log.info("Database already contains users. Skipping data seeding.");
        }
        seedDefaultWards();
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
        executeSchemaSql("ALTER TABLE IF EXISTS feedbacks ADD CONSTRAINT feedbacks_status_check CHECK (status IN ('SUBMITTED', 'PENDING_RECEIVE', 'PENDING', 'NEED_LOCATION_REVIEW', 'IN_PROGRESS', 'WAITING_INFO', 'RESOLVED', 'REJECTED'))");
    }

    private void ensureLoginLockoutSchema() {
        executeSchemaSql("ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS login_lock_stage INTEGER NOT NULL DEFAULT 0");
        executeSchemaSql("ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS login_otp_required BOOLEAN NOT NULL DEFAULT FALSE");
        executeSchemaSql("ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS last_failed_login_at TIMESTAMP");
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
