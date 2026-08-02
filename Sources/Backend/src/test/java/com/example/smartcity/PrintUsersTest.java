package com.example.smartcity;

import com.example.smartcity.modules.user.entity.User;
import com.example.smartcity.modules.user.repository.UserRepository;
import com.example.smartcity.modules.campaign.repository.CampaignParticipantRepository;
import com.example.smartcity.modules.campaign.entity.CampaignParticipant;
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

    @Autowired
    private CampaignParticipantRepository campaignParticipantRepository;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Test
    public void printAllUsers() {
        System.out.println("========== ALL USERS IN DB ==========");
        List<User> users = userRepository.findAll();
        for (User u : users) {
            if (u.getFullName().toLowerCase().contains("binh")) {
                System.out.println("FOUND BINH USER: " + u.getId() + " - Name: " + u.getFullName() + ", Role: " + u.getRole() + ", Phone: " + u.getPhoneNumber());
                List<CampaignParticipant> parts = campaignParticipantRepository.findByCitizen_IdOrderByCampaign_StartTimeDesc(u.getId());
                System.out.println("PARTICIPATIONS count: " + parts.size());
                for (CampaignParticipant p : parts) {
                    System.out.println("  Campaign: " + p.getCampaign().getTitle() + " (ID: " + p.getCampaign().getId() + ")");
                    System.out.println("    joinStatus: " + p.getJoinStatus());
                    System.out.println("    attended: " + p.getAttended());
                    System.out.println("    attendedAt: " + p.getAttendedAt());
                }
            }
        }
        System.out.println("=====================================");
    }

    @Test
    public void addViewCountColumn() {
        System.out.println("Running SQL to add view_count column...");
        jdbcTemplate.execute("ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS view_count INT NOT NULL DEFAULT 0");
        System.out.println("SQL executed successfully!");
    }
}
