package com.example.smartcity.modules.campaign.service;

import com.example.smartcity.common.exception.CustomException;
import com.example.smartcity.modules.campaign.dto.CampaignAppealRequest;
import com.example.smartcity.modules.campaign.dto.CampaignAppealReviewRequest;
import com.example.smartcity.modules.campaign.dto.CampaignAppealResponse;
import com.example.smartcity.modules.campaign.entity.CampaignAppeal;
import com.example.smartcity.modules.campaign.repository.CampaignAppealRepository;
import com.example.smartcity.modules.user.entity.User;
import com.example.smartcity.modules.user.entity.Role;
import com.example.smartcity.modules.user.repository.UserRepository;
import com.example.smartcity.modules.notification.service.NotificationService;
import com.example.smartcity.modules.notification.service.ExternalNotificationService;
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
class CampaignAppealServiceImplTest {

    @Mock private CampaignAppealRepository appealRepository;
    @Mock private UserRepository userRepository;
    @Mock private NotificationService notificationService;
    @Mock private ExternalNotificationService externalNotificationService;

    private CampaignAppealServiceImpl appealService;

    @BeforeEach
    void setUp() {
        appealService = new CampaignAppealServiceImpl(appealRepository, userRepository, notificationService, externalNotificationService);
    }

    @Test
    @DisplayName("Should successfully submit appeal when citizen is banned and has no pending appeals")
    void submitAppeal_success() {
        User citizen = new User("citizen1", "encoded", "Citizen One", "0905123456", "citizen@example.com", Role.CITIZEN);
        citizen.setCampaignBanned(true);

        CampaignAppealRequest request = new CampaignAppealRequest("I had a family emergency.");

        when(userRepository.findByUsername("citizen1")).thenReturn(Optional.of(citizen));
        when(appealRepository.existsByCitizenIdAndStatus(citizen.getId(), "PENDING")).thenReturn(false);
        when(appealRepository.save(any(CampaignAppeal.class))).thenAnswer(invocation -> {
            CampaignAppeal appeal = invocation.getArgument(0);
            appeal.setId(100L);
            return appeal;
        });

        CampaignAppealResponse response = appealService.submitAppeal(request, "citizen1");

        assertNotNull(response);
        assertEquals(100L, response.getId());
        assertEquals("PENDING", response.getStatus());
        assertEquals("I had a family emergency.", response.getReason());
        verify(appealRepository).save(any(CampaignAppeal.class));
    }

    @Test
    @DisplayName("Should throw exception on submitAppeal when citizen is not campaign banned")
    void submitAppeal_notBanned() {
        User citizen = new User("citizen1", "encoded", "Citizen One", "0905123456", "citizen@example.com", Role.CITIZEN);
        citizen.setCampaignBanned(false);

        CampaignAppealRequest request = new CampaignAppealRequest("I want to join again.");

        when(userRepository.findByUsername("citizen1")).thenReturn(Optional.of(citizen));

        CustomException ex = assertThrows(CustomException.class, () -> appealService.submitAppeal(request, "citizen1"));
        assertEquals("Tài khoản của bạn không bị cấm tham gia chiến dịch.", ex.getMessage());
        verify(appealRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should approve appeal, unban citizen, set lastCampaignUnbanAt, and send notification")
    void approveAppeal_success() {
        User staff = new User("staff1", "encoded", "Staff One", "0905123457", "staff@example.com", Role.WARD_STAFF);
        User citizen = new User("citizen1", "encoded", "Citizen One", "0905123456", "citizen@example.com", Role.CITIZEN);
        citizen.setCampaignBanned(true);

        CampaignAppeal appeal = CampaignAppeal.builder()
                .citizen(citizen)
                .reason("Reason")
                .status("PENDING")
                .build();
        appeal.setId(100L);

        CampaignAppealReviewRequest reviewRequest = new CampaignAppealReviewRequest("Approved because of medical note.");

        when(userRepository.findByUsername("staff1")).thenReturn(Optional.of(staff));
        when(appealRepository.findById(100L)).thenReturn(Optional.of(appeal));
        when(appealRepository.save(any(CampaignAppeal.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CampaignAppealResponse response = appealService.approveAppeal(100L, reviewRequest, "staff1");

        assertNotNull(response);
        assertEquals("APPROVED", response.getStatus());
        assertEquals("Approved because of medical note.", response.getReviewNotes());
        assertFalse(citizen.isCampaignBanned());
        assertNotNull(citizen.getLastCampaignUnbanAt());

        verify(appealRepository).save(appeal);
        verify(userRepository).save(citizen);
        verify(notificationService).createCampaignNotification(eq(citizen), any(), any(), any(), eq("CAMPAIGN_APPEAL_APPROVED"));
        verify(externalNotificationService).sendEmailNotification(eq("citizen@example.com"), any(), any());
    }

    @Test
    @DisplayName("Should reject appeal, keep citizen banned, and send notification")
    void rejectAppeal_success() {
        User staff = new User("staff1", "encoded", "Staff One", "0905123457", "staff@example.com", Role.WARD_STAFF);
        User citizen = new User("citizen1", "encoded", "Citizen One", "0905123456", "citizen@example.com", Role.CITIZEN);
        citizen.setCampaignBanned(true);

        CampaignAppeal appeal = CampaignAppeal.builder()
                .citizen(citizen)
                .reason("Reason")
                .status("PENDING")
                .build();
        appeal.setId(100L);

        CampaignAppealReviewRequest reviewRequest = new CampaignAppealReviewRequest("Rejected: proof was not valid.");

        when(userRepository.findByUsername("staff1")).thenReturn(Optional.of(staff));
        when(appealRepository.findById(100L)).thenReturn(Optional.of(appeal));
        when(appealRepository.save(any(CampaignAppeal.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CampaignAppealResponse response = appealService.rejectAppeal(100L, reviewRequest, "staff1");

        assertNotNull(response);
        assertEquals("REJECTED", response.getStatus());
        assertEquals("Rejected: proof was not valid.", response.getReviewNotes());
        assertTrue(citizen.isCampaignBanned());

        verify(appealRepository).save(appeal);
        verify(userRepository, never()).save(citizen);
        verify(notificationService).createCampaignNotification(eq(citizen), any(), any(), any(), eq("CAMPAIGN_APPEAL_REJECTED"));
        verify(externalNotificationService).sendEmailNotification(eq("citizen@example.com"), any(), any());
    }
}
