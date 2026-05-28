package com.example.smartcity.modules.feedback.service;

import com.example.smartcity.modules.feedback.dto.CitizenFeedbackMediaRequest;
import com.example.smartcity.modules.feedback.dto.CitizenFeedbackMediaResponse;
import com.example.smartcity.modules.feedback.dto.FeedbackAttachmentResponse;
import com.example.smartcity.modules.feedback.entity.Attachment;
import com.example.smartcity.modules.feedback.entity.Category;
import com.example.smartcity.modules.feedback.entity.Feedback;
import com.example.smartcity.modules.feedback.entity.FeedbackStatus;
import com.example.smartcity.modules.feedback.repository.AttachmentRepository;
import com.example.smartcity.modules.feedback.repository.CategoryRepository;
import com.example.smartcity.modules.feedback.repository.FeedbackRepository;
import com.example.smartcity.modules.user.entity.User;
import com.example.smartcity.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CitizenFeedbackMediaService {
    private static final long MIN_VIDEO_SECONDS = 10L;

    private final FeedbackRepository feedbackRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final AttachmentRepository attachmentRepository;
    private final SupabaseStorageService supabaseStorageService;

    @Transactional
    public CitizenFeedbackMediaResponse submit(CitizenFeedbackMediaRequest request, List<MultipartFile> files) {
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new IllegalArgumentException("Category not found: " + request.getCategoryId()));
        User citizen = userRepository.findById(request.getCitizenId())
                .orElseThrow(() -> new IllegalArgumentException("Citizen not found: " + request.getCitizenId()));

        List<MultipartFile> safeFiles = files == null ? List.of() : files;
        validateMediaFiles(safeFiles, request.getVideoDurationsSeconds());

        LocalDateTime now = LocalDateTime.now();
        Feedback feedback = new Feedback();
        feedback.setTrackingCode("FB-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        feedback.setTitle(request.getTitle());
        feedback.setDescription(request.getDescription());
        feedback.setLatitude(request.getLatitude());
        feedback.setLongitude(request.getLongitude());
        feedback.setAddressDetails(request.getAddressDetails());
        feedback.setStatus(FeedbackStatus.PENDING);
        feedback.setCategory(category);
        feedback.setCitizen(citizen);
        feedback.setCreatedAt(now);
        feedback.setUpdatedAt(now);

        Feedback savedFeedback = feedbackRepository.save(feedback);
        List<Attachment> savedAttachments = saveAttachments(savedFeedback, citizen, safeFiles);

        return toResponse(savedFeedback, savedAttachments);
    }

    private void validateMediaFiles(List<MultipartFile> files, List<Long> videoDurationsSeconds) {
        if (files.isEmpty()) {
            throw new IllegalArgumentException("At least one image or video is required");
        }

        int videoIndex = 0;
        List<Long> durations = videoDurationsSeconds == null ? List.of() : videoDurationsSeconds;
        for (MultipartFile file : files) {
            String type = file.getContentType() == null ? "" : file.getContentType();
            if (!type.startsWith("image/") && !type.startsWith("video/")) {
                throw new IllegalArgumentException("Only image and video files are allowed");
            }

            if (type.startsWith("video/")) {
                if (videoIndex >= durations.size()) {
                    throw new IllegalArgumentException("Video duration is required");
                }
                Long duration = durations.get(videoIndex);
                if (duration == null || duration <= MIN_VIDEO_SECONDS) {
                    throw new IllegalArgumentException("Video duration must be greater than 10 seconds");
                }
                videoIndex++;
            }
        }
    }

    private List<Attachment> saveAttachments(Feedback feedback, User citizen, List<MultipartFile> files) {
        List<Attachment> savedAttachments = new ArrayList<>();
        for (MultipartFile file : files) {
            String fileUrl = supabaseStorageService.upload(file, feedback.getId());

            Attachment attachment = new Attachment();
            attachment.setFeedback(feedback);
            attachment.setFileUrl(fileUrl);
            attachment.setFileType(file.getContentType());
            attachment.setUploadedBy(citizen);
            attachment.setUploadedAt(LocalDateTime.now());

            savedAttachments.add(attachmentRepository.save(attachment));
        }
        return savedAttachments;
    }

    private CitizenFeedbackMediaResponse toResponse(Feedback feedback, List<Attachment> attachments) {
        return CitizenFeedbackMediaResponse.builder()
                .id(feedback.getId())
                .trackingCode(feedback.getTrackingCode())
                .title(feedback.getTitle())
                .description(feedback.getDescription())
                .latitude(feedback.getLatitude())
                .longitude(feedback.getLongitude())
                .addressDetails(feedback.getAddressDetails())
                .status(feedback.getStatus())
                .categoryName(feedback.getCategory() == null ? null : feedback.getCategory().getName())
                .citizenName(feedback.getCitizen() == null ? null : feedback.getCitizen().getFullName())
                .createdAt(feedback.getCreatedAt())
                .updatedAt(feedback.getUpdatedAt())
                .attachments(attachments.stream().map(this::toAttachmentResponse).toList())
                .build();
    }

    private FeedbackAttachmentResponse toAttachmentResponse(Attachment attachment) {
        return FeedbackAttachmentResponse.builder()
                .id(attachment.getId())
                .fileUrl(attachment.getFileUrl())
                .fileType(attachment.getFileType())
                .uploadedAt(attachment.getUploadedAt())
                .build();
    }
}
