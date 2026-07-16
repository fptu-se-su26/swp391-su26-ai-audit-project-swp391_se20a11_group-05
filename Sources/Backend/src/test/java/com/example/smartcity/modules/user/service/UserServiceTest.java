package com.example.smartcity.modules.user.service;

import com.example.smartcity.modules.campaign.repository.CampaignParticipantRepository;
import com.example.smartcity.modules.core.entity.Ward;
import com.example.smartcity.modules.user.entity.Role;
import com.example.smartcity.modules.user.entity.User;
import com.example.smartcity.modules.user.entity.UserWarning;
import com.example.smartcity.modules.user.repository.UserRepository;
import com.example.smartcity.modules.user.repository.UserWarningRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private UserWarningRepository userWarningRepository;
    @Mock private CampaignParticipantRepository campaignParticipantRepository;

    private UserService userService;

    @BeforeEach
    void setUp() {
        userService = new UserService(userRepository, userWarningRepository, campaignParticipantRepository);
    }

    @Test
    @DisplayName("Should increment warning count and ban user if count >= 3")
    void warnUser_autoBan() {
        User citizen = new User("citizen1", "encoded", "Citizen One", "0905123456", "citizen@example.com", Role.CITIZEN);
        citizen.setWarningCount(2);

        User staff = new User("staff1", "encoded", "Staff One", "0905123457", "staff@example.com", Role.WARD_STAFF);

        when(userRepository.findById(1L)).thenReturn(Optional.of(citizen));
        when(userRepository.findByUsername("staff1")).thenReturn(Optional.of(staff));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        User result = userService.warnUser(1L, "Spam chat group", "staff1");

        assertNotNull(result);
        assertEquals(3, result.getWarningCount());
        assertEquals("BANNED", result.getStatus());
        assertFalse(result.isActive());

        verify(userWarningRepository).save(any(UserWarning.class));
        verify(userRepository).save(citizen);
    }

    @Test
    @DisplayName("Should lock account directly and set warning count to 3 on banUser")
    void banUser_success() {
        User citizen = new User("citizen1", "encoded", "Citizen One", "0905123456", "citizen@example.com", Role.CITIZEN);
        User staff = new User("staff1", "encoded", "Staff One", "0905123457", "staff@example.com", Role.WARD_STAFF);

        when(userRepository.findById(1L)).thenReturn(Optional.of(citizen));
        when(userRepository.findByUsername("staff1")).thenReturn(Optional.of(staff));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        User result = userService.banUser(1L, "Severe violation", "staff1");

        assertNotNull(result);
        assertEquals(3, result.getWarningCount());
        assertEquals("BANNED", result.getStatus());
        assertFalse(result.isActive());

        verify(userWarningRepository).save(any(UserWarning.class));
        verify(userRepository).save(citizen);
    }

    @Test
    @DisplayName("Should unlock account and reset warning count on unbanUser")
    void unbanUser_success() {
        User citizen = new User("citizen1", "encoded", "Citizen One", "0905123456", "citizen@example.com", Role.CITIZEN);
        citizen.setStatus("BANNED");
        citizen.setWarningCount(3);

        when(userRepository.findById(1L)).thenReturn(Optional.of(citizen));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        User result = userService.unbanUser(1L);

        assertNotNull(result);
        assertEquals(0, result.getWarningCount());
        assertEquals("ACTIVE", result.getStatus());
        assertTrue(result.isActive());

        verify(userRepository).save(citizen);
    }

    @Test
    @DisplayName("Should verify campaign participation in staff ward campaigns")
    void isParticipantInStaffCampaigns_success() {
        Ward ward = new Ward();
        ward.setId(10L);
        ward.setName("Hòa Xuân");

        User staff = new User("staff1", "encoded", "Staff One", "0905123457", "staff@example.com", Role.WARD_STAFF);
        staff.setWard(ward);

        when(userRepository.findByUsername("staff1")).thenReturn(Optional.of(staff));
        when(campaignParticipantRepository.existsByCitizenIdAndWardId(5L, 10L)).thenReturn(true);

        boolean result = userService.isParticipantInStaffCampaigns(5L, "staff1");

        assertTrue(result);
        verify(campaignParticipantRepository).existsByCitizenIdAndWardId(5L, 10L);
    }

    @Test
    @DisplayName("Should return false immediately if citizen is already campaign banned")
    void checkAndBanFromCampaigns_alreadyBanned() {
        User citizen = new User("citizen1", "encoded", "Citizen One", "0905123456", "citizen@example.com", Role.CITIZEN);
        citizen.setCampaignBanned(true);

        when(userRepository.findById(1L)).thenReturn(Optional.of(citizen));

        boolean result = userService.checkAndBanFromCampaigns(1L, "Clean Up");

        assertFalse(result);
        verify(campaignParticipantRepository, never()).countNoShowCampaignsAfter(any(), any());
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should return false if citizen has less than 3 no-shows since last unban")
    void checkAndBanFromCampaigns_lessThanThreeNoShows() {
        User citizen = new User("citizen1", "encoded", "Citizen One", "0905123456", "citizen@example.com", Role.CITIZEN);
        citizen.setCampaignBanned(false);

        when(userRepository.findById(1L)).thenReturn(Optional.of(citizen));
        when(campaignParticipantRepository.countNoShowCampaigns(1L)).thenReturn(2L);

        boolean result = userService.checkAndBanFromCampaigns(1L, "Clean Up");

        assertFalse(result);
        assertFalse(citizen.isCampaignBanned());
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should ban citizen and return true if citizen has 3 or more no-shows since last unban")
    void checkAndBanFromCampaigns_threeOrMoreNoShows() {
        User citizen = new User("citizen1", "encoded", "Citizen One", "0905123456", "citizen@example.com", Role.CITIZEN);
        citizen.setCampaignBanned(false);

        when(userRepository.findById(1L)).thenReturn(Optional.of(citizen));
        when(campaignParticipantRepository.countNoShowCampaigns(1L)).thenReturn(3L);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        boolean result = userService.checkAndBanFromCampaigns(1L, "Clean Up");

        assertTrue(result);
        assertTrue(citizen.isCampaignBanned());
        verify(userRepository).save(citizen);
    }

    @Test
    @DisplayName("Should ban citizen and return true if citizen has 1 or more no-shows after being unbanned")
    void checkAndBanFromCampaigns_oneOrMoreNoShowsAfterUnban() {
        User citizen = new User("citizen1", "encoded", "Citizen One", "0905123456", "citizen@example.com", Role.CITIZEN);
        citizen.setCampaignBanned(false);
        java.time.LocalDateTime unbanTime = java.time.LocalDateTime.now().minusDays(1);
        citizen.setLastCampaignUnbanAt(unbanTime);

        when(userRepository.findById(1L)).thenReturn(Optional.of(citizen));
        when(campaignParticipantRepository.countNoShowCampaignsAfter(1L, unbanTime)).thenReturn(1L);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        boolean result = userService.checkAndBanFromCampaigns(1L, "Clean Up");

        assertTrue(result);
        assertTrue(citizen.isCampaignBanned());
        verify(userRepository).save(citizen);
    }
}
