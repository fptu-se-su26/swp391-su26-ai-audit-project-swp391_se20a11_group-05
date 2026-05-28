package com.example.smartcity.modules.feedback.service;

import com.example.smartcity.modules.feedback.dto.FeedbackRequest;
import com.example.smartcity.modules.feedback.dto.FeedbackResponse;
import com.example.smartcity.modules.feedback.entity.Category;
import com.example.smartcity.modules.feedback.entity.Feedback;
import com.example.smartcity.modules.feedback.entity.FeedbackStatus;
import com.example.smartcity.modules.feedback.repository.CategoryRepository;
import com.example.smartcity.modules.feedback.repository.FeedbackRepository;
import com.example.smartcity.modules.user.entity.User;
import com.example.smartcity.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FeedbackService {

    private final FeedbackRepository feedbackRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    @Transactional
    public FeedbackResponse createFeedback(FeedbackRequest request) {
        validateRequest(request);

        User citizen = userRepository.findById(request.getCitizenId())
                .orElseThrow(() -> new RuntimeException("User khong ton tai"));

        // Frontend template hien tai co the chua gui categoryId.
        // Neu co thi validate; neu khong thi de null de khong lam vo flow submit.
        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Category khong ton tai"));
        }

        Feedback feedback = new Feedback();
        feedback.setTrackingCode("FB-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        feedback.setTitle(request.getTitle().trim());
        feedback.setDescription(request.getDescription().trim());
        feedback.setLatitude(request.getLatitude());
        feedback.setLongitude(request.getLongitude());
        feedback.setAddressDetails(trimToNull(request.getAddressDetails()));
        feedback.setStatus(FeedbackStatus.PENDING);
        feedback.setCategory(category);
        feedback.setCitizen(citizen);
        feedback.setCreatedAt(LocalDateTime.now());
        feedback.setUpdatedAt(LocalDateTime.now());

        feedbackRepository.save(feedback);
        return mapToDTO(feedback);
    }

    @Transactional(readOnly = true)
    public List<FeedbackResponse> getAllFeedbacks() {
        return feedbackRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    private FeedbackResponse mapToDTO(Feedback feedback) {
        return FeedbackResponse.builder()
                .id(feedback.getId())
                .trackingCode(feedback.getTrackingCode())
                .title(feedback.getTitle())
                .description(feedback.getDescription())
                .latitude(feedback.getLatitude())
                .longitude(feedback.getLongitude())
                .addressDetails(feedback.getAddressDetails())
                .status(feedback.getStatus())
                .categoryName(feedback.getCategory() != null ? feedback.getCategory().getName() : null)
                .citizenName(feedback.getCitizen() != null ? feedback.getCitizen().getFullName() : null)
                .assigneeName(feedback.getAssignee() != null ? feedback.getAssignee().getFullName() : null)
                .createdAt(feedback.getCreatedAt())
                .updatedAt(feedback.getUpdatedAt())
                .build();
    }

    private void validateRequest(FeedbackRequest request) {
        if (request == null) {
            throw new RuntimeException("Request khong hop le");
        }
        if (isBlank(request.getTitle())) {
            throw new RuntimeException("Title khong duoc de trong");
        }
        if (isBlank(request.getDescription())) {
            throw new RuntimeException("Description khong duoc de trong");
        }
        if (request.getCitizenId() == null) {
            throw new RuntimeException("CitizenId la bat buoc");
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private String trimToNull(String value) {
        if (value == null) return null;
        String normalized = value.trim();
        if (normalized.isEmpty()) return null;
        return normalized.toLowerCase(Locale.ROOT).equals("null") ? null : normalized;
    }
}
