package com.example.smartcity;

import com.example.smartcity.modules.user.entity.User;
import com.example.smartcity.modules.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;

@SpringBootTest
@ActiveProfiles("supabase")
public class PrintUsersTest {

    @Autowired
    private UserRepository userRepository;

    @Test
    public void printAllUsers() {
        System.out.println("========== ALL USERS IN DB ==========");
        List<User> users = userRepository.findAll();
        for (User u : users) {
            System.out.println("User: " + u.getUsername() + ", Role: " + u.getRole() + ", Phone: " + u.getPhoneNumber());
        }
        System.out.println("=====================================");
    }
}
