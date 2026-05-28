package com.example.smartcity.modules.feedback;

import com.example.smartcity.modules.core.entity.Ward;
import com.example.smartcity.modules.core.repository.WardRepository;
import com.example.smartcity.modules.feedback.dto.FeedbackRequest;
import com.example.smartcity.modules.feedback.entity.Category;
import com.example.smartcity.modules.feedback.entity.Feedback;
import com.example.smartcity.modules.feedback.entity.FeedbackStatus;
import com.example.smartcity.modules.feedback.repository.CategoryRepository;
import com.example.smartcity.modules.feedback.repository.FeedbackRepository;
import com.example.smartcity.modules.feedback.service.FeedbackService;
import com.example.smartcity.modules.user.entity.Role;
import com.example.smartcity.modules.user.entity.User;
import com.example.smartcity.modules.user.repository.UserRepository;
import com.example.smartcity.modules.feedback.repository.FeedbackLogRepository;
import com.example.smartcity.modules.notification.NotificationService;
import com.example.smartcity.modules.feedback.service.AutoDispatchService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FeedbackServiceTest {

    @Mock private FeedbackRepository feedbackRepository;
    @Mock private CategoryRepository categoryRepository;
    @Mock private UserRepository userRepository;
    @Mock private WardRepository wardRepository;
    @Mock private FeedbackLogRepository feedbackLogRepository;
    @Mock private NotificationService notificationService;
    @Mock private AutoDispatchService autoDispatchService;

    private FeedbackService feedbackService;

    private User citizen;
    private User wardStaff;
    private User superAdmin;
    private Category category;
    private Ward ward;
    private FeedbackRequest validRequest;

    @BeforeEach
    void setUp() {
        feedbackService = new FeedbackService(feedbackRepository, feedbackLogRepository,
                notificationService, categoryRepository, userRepository, wardRepository, autoDispatchService);

        citizen = new User("citizen1", "encoded", "Người Dân", "0905123456",
                "citizen@example.com", Role.CITIZEN);
        citizen.setId(1L);

        ward = new Ward();
        ward.setId(1L);

        wardStaff = new User("staff1", "encoded", "Cán Bộ", "0905123456",
                "staff@example.com", Role.WARD_STAFF);
        wardStaff.setId(2L);
        wardStaff.setWard(ward);

        superAdmin = new User("admin", "encoded", "Admin", "0905123456",
                "admin@example.com", Role.SUPER_ADMIN);
        superAdmin.setId(3L);

        category = new Category();
        category.setId(1L);
        category.setName("Hạ tầng");

        validRequest = FeedbackRequest.builder()
                .title("Ổ gà trên đường Hùng Vương")
                .description("Có ổ gà lớn gây nguy hiểm")
                .latitude(16.0544)
                .longitude(108.2022)
                .addressDetails("123 Nguyễn Văn Linh")
                .categoryId(1L)
                .wardId(1L)
                .build();
    }

    @Test
    @DisplayName("Should create feedback successfully")
    void createFeedback_success() {
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(userRepository.findByUsername("citizen1")).thenReturn(Optional.of(citizen));
        when(wardRepository.findById(1L)).thenReturn(Optional.of(ward));
        when(feedbackRepository.save(any(Feedback.class))).thenAnswer(invocation -> {
            Feedback f = invocation.getArgument(0);
            f.setId(100L);
            return f;
        });

        Feedback result = feedbackService.createFeedback(validRequest, "citizen1");

        assertNotNull(result);
        assertTrue(result.getTrackingCode().startsWith("FB-"));
        assertEquals("Ổ gà trên đường Hùng Vương", result.getTitle());
        assertEquals(FeedbackStatus.PENDING, result.getStatus());
        assertEquals(category, result.getCategory());
        assertEquals(citizen, result.getCitizen());
    }

    @Test
    @DisplayName("Should throw when category not found")
    void createFeedback_categoryNotFound() {
        when(categoryRepository.findById(999L)).thenReturn(Optional.empty());

        FeedbackRequest invalid = FeedbackRequest.builder()
                .title("Test").description("Test desc")
                .categoryId(999L).wardId(1L)
                .build();

        assertThrows(com.example.smartcity.common.exception.ResourceNotFoundException.class,
                () -> feedbackService.createFeedback(invalid, "citizen1"));
    }

    @Test
    @DisplayName("Super admin can see all feedbacks")
    void getAllFeedbacks_superAdmin() {
        Pageable pageable = PageRequest.of(0, 20);
        Feedback feedback = createSampleFeedback();
        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(superAdmin));
        when(feedbackRepository.findAll(pageable)).thenReturn(new PageImpl<>(List.of(feedback)));

        Page<Feedback> result = feedbackService.getAllFeedbacks("admin", pageable);

        assertEquals(1, result.getTotalElements());
    }

    @Test
    @DisplayName("Citizen can only see their own feedbacks")
    void getAllFeedbacks_citizen() {
        Pageable pageable = PageRequest.of(0, 20);
        Feedback feedback = createSampleFeedback();
        when(userRepository.findByUsername("citizen1")).thenReturn(Optional.of(citizen));
        when(feedbackRepository.findByCitizenId(1L, pageable))
                .thenReturn(new PageImpl<>(List.of(feedback)));

        Page<Feedback> result = feedbackService.getAllFeedbacks("citizen1", pageable);

        assertEquals(1, result.getTotalElements());
        verify(feedbackRepository).findByCitizenId(1L, pageable);
    }

    @Test
    @DisplayName("Ward staff can only see their ward's feedbacks")
    void getAllFeedbacks_wardStaff() {
        Pageable pageable = PageRequest.of(0, 20);
        Feedback feedback = createSampleFeedback();
        when(userRepository.findByUsername("staff1")).thenReturn(Optional.of(wardStaff));
        when(feedbackRepository.findByWardId(1L, pageable))
                .thenReturn(new PageImpl<>(List.of(feedback)));

        Page<Feedback> result = feedbackService.getAllFeedbacks("staff1", pageable);

        assertEquals(1, result.getTotalElements());
        verify(feedbackRepository).findByWardId(1L, pageable);
    }

    @Test
    @DisplayName("Ward staff with no ward sees empty list")
    void getAllFeedbacks_wardStaffNoWard() {
        User staffNoWard = new User("staff2", "encoded", "Cán Bộ", "0905123456",
                "staff2@example.com", Role.WARD_STAFF);
        staffNoWard.setId(5L);

        Pageable pageable = PageRequest.of(0, 20);
        when(userRepository.findByUsername("staff2")).thenReturn(Optional.of(staffNoWard));

        Page<Feedback> result = feedbackService.getAllFeedbacks("staff2", pageable);

        assertTrue(result.isEmpty());
    }

    private Feedback createSampleFeedback() {
        Feedback f = new Feedback();
        f.setId(1L);
        f.setTrackingCode("FB-001");
        f.setTitle("Ổ gà trên đường Hùng Vương");
        f.setDescription("Có ổ gà lớn gây nguy hiểm");
        f.setStatus(FeedbackStatus.PENDING);
        f.setCategory(category);
        f.setWard(ward);
        f.setCitizen(citizen);
        return f;
    }
}
