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

    @Override
    public void run(String... args) throws Exception {
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
        if (categoryRepository.count() > 0) return;

        seedCategory("Môi trường", "Rác thải, ô nhiễm, vệ sinh đô thị");
        seedCategory("Giao thông", "Đường hư hỏng, ùn tắc, biển báo");
        seedCategory("An ninh", "Sự cố cần công an hoặc lực lượng an ninh");
        seedCategory("Cây xanh", "Cây đổ, cành nguy hiểm, chăm sóc cây xanh");
        log.info("Seeded default feedback categories.");
    }

    private void seedCategory(String name, String description) {
        Category category = new Category();
        category.setName(name);
        category.setDescription(description);
        categoryRepository.save(category);
    }
}
