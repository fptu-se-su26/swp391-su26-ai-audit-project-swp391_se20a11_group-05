package com.example.smartcity.modules.auth;

import com.example.smartcity.modules.user.entity.Role;
import com.example.smartcity.modules.user.entity.User;
import com.example.smartcity.modules.user.repository.UserRepository;
import com.example.smartcity.modules.core.repository.WardRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.test.annotation.Rollback;
import java.util.Optional;

@SpringBootTest
@ActiveProfiles("supabase")
public class SeedDataTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WardRepository wardRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    @Rollback(false)
    public void seedTestAccounts() {
        System.out.println("BẮT ĐẦU CẬP NHẬT TÀI KHOẢN TEST...");

        // 3. Ward Staff CÓ phường
        Optional<User> optStaffWithWard = userRepository.findByUsername("wardstaff_yesward");
        if (optStaffWithWard.isEmpty()) {
            User staff2 = new User();
            staff2.setUsername("wardstaff_yesward");
            staff2.setPassword(passwordEncoder.encode("Password123"));
            staff2.setFullName("Test Ward Staff YES Ward");
            staff2.setPhoneNumber("0966666666");
            staff2.setEmail("staffyes@test.local");
            staff2.setRole(Role.WARD_STAFF);
            staff2.setStatus("ACTIVE");
            staff2.setPhoneVerified(true);
            
            wardRepository.findById(1L).or(() -> wardRepository.findAll().stream().findFirst()).ifPresent(staff2::setWard);
            
            userRepository.save(staff2);
            System.out.println("=> Đã tạo thành công: wardstaff_yesward / Password123 (Có Phường)");
        } else {
            User staff2 = optStaffWithWard.get();
            staff2.setPassword(passwordEncoder.encode("Password123"));
            staff2.setStatus("ACTIVE");
            staff2.setPhoneVerified(true);
            
            if (staff2.getWard() == null) {
                wardRepository.findById(1L).or(() -> wardRepository.findAll().stream().findFirst()).ifPresent(staff2::setWard);
            }
            
            userRepository.save(staff2);
            System.out.println("=> Đã cập nhật lại mật khẩu cho: wardstaff_yesward thành Password123 (Đã Có Phường)");
        }
        
        System.out.println("HOÀN TẤT CẬP NHẬT!");
    }
}
