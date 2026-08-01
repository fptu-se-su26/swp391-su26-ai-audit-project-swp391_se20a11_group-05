package com.example.smartcity.modules.feedback.service;

import com.example.smartcity.modules.feedback.dto.CitizenFeedbackMediaRequest;
import com.example.smartcity.modules.feedback.dto.CitizenFeedbackMediaResponse;
import com.example.smartcity.modules.feedback.dto.FeedbackAttachmentResponse;
import com.example.smartcity.modules.feedback.entity.Attachment;
import com.example.smartcity.modules.feedback.entity.Category;
import com.example.smartcity.modules.feedback.entity.Feedback;
import com.example.smartcity.modules.feedback.entity.FeedbackLog;
import com.example.smartcity.modules.feedback.entity.FeedbackStatus;
import com.example.smartcity.modules.feedback.repository.AttachmentRepository;
import com.example.smartcity.modules.feedback.repository.CategoryRepository;
import com.example.smartcity.modules.feedback.repository.FeedbackLogRepository;
import com.example.smartcity.modules.feedback.repository.FeedbackRepository;
import com.example.smartcity.modules.notification.service.NotificationService;
import com.example.smartcity.modules.core.entity.Ward;
import com.example.smartcity.modules.core.service.LocationResolutionService;
import com.example.smartcity.modules.user.entity.User;
import com.example.smartcity.modules.user.entity.Role;
import com.example.smartcity.modules.user.repository.UserRepository;
import com.example.smartcity.common.exception.CustomException;
import com.example.smartcity.ai_orchestrator.guardrails.ContentGuardrailService;
import com.example.smartcity.modules.feedback.service.AutoDispatchService;
import lombok.RequiredArgsConstructor;
import com.example.smartcity.modules.feedback.entity.AiTask;
import com.example.smartcity.modules.feedback.repository.AiTaskRepository;
import com.example.smartcity.modules.file.CloudinaryStorageService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.OptionalDouble;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CitizenFeedbackMediaService {
    private final AiTaskRepository aiTaskRepository;
    private static final long MIN_VIDEO_SECONDS = 10L;
    private static final long MAX_VIDEO_SECONDS = 30L;
    private static final long MAX_IMAGE_BYTES = 10L * 1024L * 1024L;
    private static final long MAX_VIDEO_BYTES = 50L * 1024L * 1024L;
    private static final int MAX_IMAGE_COUNT = 5;
    private static final int MAX_VIDEO_COUNT = 1;
    private static final Set<String> ALLOWED_IMAGE_EXTENSIONS = Set.of("jpg", "jpeg", "png", "webp");
    private static final Set<String> ALLOWED_VIDEO_EXTENSIONS = Set.of("mp4", "mov", "webm");

    private final FeedbackRepository feedbackRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final AttachmentRepository attachmentRepository;
    private final FeedbackLogRepository feedbackLogRepository;
    private final CloudinaryStorageService cloudinaryStorageService;
    private final LocationResolutionService locationResolutionService;
    private final NotificationService notificationService;
    private final CategoryRoutingService categoryRoutingService;
    private final FeedbackService feedbackService;
    private final ContentGuardrailService contentGuardrailService;
    private final AutoDispatchService autoDispatchService;

    @Transactional
    public CitizenFeedbackMediaResponse submit(CitizenFeedbackMediaRequest request, List<MultipartFile> files, String username) {
        Category category = resolveOfficialCategory(request.getCategoryCode());
        User citizen = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Citizen not found: " + username));

        if (citizen.getRole() != Role.CITIZEN) {
            throw new CustomException("Chi cong dan moi duoc gui phan anh", HttpStatus.FORBIDDEN.value());
        }

        List<MultipartFile> safeFiles = files == null ? List.of() : files;
        validateMediaFiles(safeFiles, request.getVideoDurationsSeconds());

        // Content Guardrail: kiểm tra PII (SĐT, CCCD, Email) và nội dung vi phạm
        // [FIX] Bổ sung addressDetails vào kiểm tra PII (trước đây thiếu trường này)
        String fullContent = request.getDescription()
            + (request.getAddressDetails() != null ? " " + request.getAddressDetails() : "");
        contentGuardrailService.validateFeedbackContent(request.getTitle(), fullContent);

        if (request.getLatitude() == null || request.getLongitude() == null) {
            throw new IllegalArgumentException("Latitude and longitude are required");
        }
        Ward ward = null;
        try {
            ward = locationResolutionService.resolveWard(request.getLatitude(), request.getLongitude());
        } catch (CustomException ex) {
            // Keep the submitted feedback and route it to manual location review.
        }

        // AI Duplicate Detection: kiểm tra trùng lặp ngữ nghĩa TRƯỚC khi lưu
        // [FIX] chạy dù ward == null — khi phường không xác định được vẫn check theo
        //       toạ độ bằng wardId = 0 (fallback bỏ qua điều kiện ward) — tránh bỏ sót
        Long wardId = (ward != null && ward.getId() != null) ? ward.getId() : null;
        feedbackService.checkDuplicateFeedback(request.getDescription(), wardId, request.getLongitude(), request.getLatitude());

        LocalDateTime now = LocalDateTime.now();
        Feedback feedback = new Feedback();
        feedback.setTrackingCode("FB-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        feedback.setTitle(request.getTitle());
        feedback.setDescription(request.getDescription());
        feedback.setLatitude(request.getLatitude());
        feedback.setLongitude(request.getLongitude());
        feedback.setAddressDetails(request.getAddressDetails());
        feedback.setPriority("MEDIUM");
        feedback.setSource("CITIZEN_APP");
        feedback.setCategory(category);
        feedback.setCitizen(citizen);
        feedback.setPublicVisible(request.getPublicVisible() == null || request.getPublicVisible());
        feedback.setCreatedAt(now);
        feedback.setUpdatedAt(now);
        categoryRoutingService.applyAssignment(feedback, category, ward, now);


        Feedback savedFeedback = feedbackRepository.save(feedback);

        // AI Duplicate Detection: lưu vector mô tả để phát hiện trùng lặp sau này
        feedbackService.saveDescriptionVector(savedFeedback.getId(), savedFeedback.getDescription());

        FeedbackLog submittedLog = new FeedbackLog(savedFeedback, citizen, null, savedFeedback.getStatus(), "Citizen submitted feedback");
        submittedLog.setAction("SUBMIT");
        feedbackLogRepository.save(submittedLog);
        notificationService.createFeedbackSubmittedNotification(savedFeedback);
        List<Attachment> savedAttachments = saveAttachments(savedFeedback, citizen, safeFiles);

        // Outbox Pattern: Tạo tác vụ PENDING trong ai_tasks
        try {
            AiTask aiTask = AiTask.builder()
                .feedback(savedFeedback)
                .status("PENDING")
                .taskPriority(mapTaskPriority(savedFeedback.getPriority()))
                .retryCount(0)
                .build();
            aiTaskRepository.save(aiTask);
            log.info("[Outbox] Đã tạo AiTask cho media feedbackId={}", savedFeedback.getId());
        } catch (Exception e) {
            log.error("❌ [Outbox] Lỗi tạo AiTask cho media feedbackId={}: {}", savedFeedback.getId(), e.getMessage());
        }

        return toResponse(savedFeedback, savedAttachments);
    }

    private void validateMediaFiles(List<MultipartFile> files, List<Long> videoDurationsSeconds) {
        if (files.isEmpty()) {
            throw new IllegalArgumentException("At least one image or video is required");
        }

        int imageCount = 0;
        int videoCount = 0;
        int videoIndex = 0;
        List<Long> durations = videoDurationsSeconds == null ? List.of() : videoDurationsSeconds;
        for (MultipartFile file : files) {
            if (file == null || file.isEmpty()) {
                throw new IllegalArgumentException("File is empty");
            }

            String type = normalizeContentType(file.getContentType());
            String extension = getExtension(file.getOriginalFilename());
            if (!type.startsWith("image/") && !type.startsWith("video/")) {
                throw new IllegalArgumentException("Only image and video files are allowed");
            }

            if (isImage(type)) {
                imageCount++;
                if (imageCount > MAX_IMAGE_COUNT) {
                    throw new IllegalArgumentException("A maximum of 5 images is allowed");
                }
                if (!ALLOWED_IMAGE_EXTENSIONS.contains(extension) || !isAllowedImageContentType(type)) {
                    throw new IllegalArgumentException("Only jpg, jpeg, png, and webp images are allowed");
                }
                if (file.getSize() > MAX_IMAGE_BYTES) {
                    throw new IllegalArgumentException("Each image must be at most 10MB");
                }
                continue;
            }

            if (isVideo(type)) {
                videoCount++;
                if (videoCount > MAX_VIDEO_COUNT) {
                    throw new IllegalArgumentException("Only one video is allowed");
                }
                if (!ALLOWED_VIDEO_EXTENSIONS.contains(extension) || !isAllowedVideoContentType(type)) {
                    throw new IllegalArgumentException("Only mp4, mov, and webm videos are allowed");
                }
                if (file.getSize() > MAX_VIDEO_BYTES) {
                    throw new IllegalArgumentException("Video must be at most 50MB");
                }

                OptionalDouble metadataDuration = readVideoDurationSeconds(file);
                double duration = metadataDuration.isPresent()
                        ? metadataDuration.getAsDouble()
                        : fallbackDuration(durations, videoIndex);
                if (duration < MIN_VIDEO_SECONDS || duration > MAX_VIDEO_SECONDS) {
                    throw new IllegalArgumentException("Video duration must be from 10 to 30 seconds");
                }
                videoIndex++;
            }
        }

        if (imageCount < 1) {
            throw new IllegalArgumentException("At least one image is required");
        }
        if (videoCount < 1) {
            throw new IllegalArgumentException("At least one video is required");
        }
    }

    private List<Attachment> saveAttachments(Feedback feedback, User citizen, List<MultipartFile> files) {
        List<Attachment> savedAttachments = new ArrayList<>();
        for (MultipartFile file : files) {
            String fileUrl = cloudinaryStorageService.upload(file, feedback.getId());

            Attachment attachment = new Attachment();
            attachment.setFeedback(feedback);
            attachment.setFileUrl(fileUrl);
            attachment.setFileType(toDatabaseFileType(file.getContentType()));
            attachment.setFileName(file.getOriginalFilename());
            attachment.setFileSize(file.getSize());
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
                .categoryCode(feedback.getCategoryCode())
                .categoryName(feedback.getCategoryName())
                .managedByRole(feedback.getManagedByRole())
                .wardId(feedback.getWard() == null ? null : feedback.getWard().getId())
                .wardName(feedback.getWardName())
                .cityName(feedback.getCityName())
                .assignedUnitId(feedback.getAssignedUnitId())
                .assignedUnitName(feedback.getAssignedUnitName())
                .assignedToRole(feedback.getAssignedToRole())
                .citizenName(feedback.getCitizen() == null ? null : feedback.getCitizen().getFullName())
                .submittedAt(feedback.getSubmittedAt())
                .receivedAt(feedback.getReceivedAt())
                .resolvedAt(feedback.getResolvedAt())
                .createdAt(feedback.getCreatedAt())
                .updatedAt(feedback.getUpdatedAt())
                .attachments(attachments.stream().map(this::toAttachmentResponse).toList())
                .publicVisible(feedback.getPublicVisible())
                .build();
    }

    private FeedbackAttachmentResponse toAttachmentResponse(Attachment attachment) {
        return FeedbackAttachmentResponse.builder()
                .id(attachment.getId())
                .fileUrl(attachment.getFileUrl())
                .fileType(attachment.getFileType())
                .fileName(attachment.getFileName())
                .fileSize(attachment.getFileSize())
                .uploadedAt(attachment.getUploadedAt())
                .build();
    }

    private Category resolveOfficialCategory(String categoryCode) {
        String normalizedCode = categoryCode == null ? "" : categoryCode.trim().toUpperCase();
        if (!categoryRoutingService.isOfficialCode(normalizedCode)) {
            throw new CustomException("Invalid feedback category.", HttpStatus.BAD_REQUEST.value());
        }
        return categoryRepository.findByCodeAndActiveTrue(normalizedCode)
                .orElseThrow(() -> new CustomException("Invalid feedback category.", HttpStatus.BAD_REQUEST.value()));
    }

    private String toDatabaseFileType(String contentType) {
        String type = contentType == null ? "" : contentType.toLowerCase();
        if (type.startsWith("image/")) return "IMAGE";
        if (type.startsWith("video/")) return "VIDEO";
        throw new IllegalArgumentException("Only image and video files are allowed");
    }

    private String normalizeContentType(String contentType) {
        return contentType == null ? "" : contentType.toLowerCase(Locale.ROOT);
    }

    private boolean isImage(String contentType) {
        return contentType.startsWith("image/");
    }

    private boolean isVideo(String contentType) {
        return contentType.startsWith("video/");
    }

    private boolean isAllowedImageContentType(String contentType) {
        return "image/jpeg".equals(contentType) || "image/png".equals(contentType) || "image/webp".equals(contentType);
    }

    private boolean isAllowedVideoContentType(String contentType) {
        return "video/mp4".equals(contentType) || "video/quicktime".equals(contentType) || "video/webm".equals(contentType);
    }

    private String getExtension(String fileName) {
        if (fileName == null) {
            return "";
        }
        String cleanName = fileName.toLowerCase(Locale.ROOT);
        int dotIndex = cleanName.lastIndexOf('.');
        if (dotIndex < 0 || dotIndex == cleanName.length() - 1) {
            return "";
        }
        return cleanName.substring(dotIndex + 1);
    }

    private double fallbackDuration(List<Long> durations, int videoIndex) {
        if (videoIndex >= durations.size() || durations.get(videoIndex) == null) {
            throw new IllegalArgumentException("Video duration is required");
        }
        return durations.get(videoIndex);
    }

    private OptionalDouble readVideoDurationSeconds(MultipartFile file) {
        try {
            byte[] data = file.getBytes();
            String extension = getExtension(file.getOriginalFilename());
            if ("mp4".equals(extension) || "mov".equals(extension)) {
                return readMp4DurationSeconds(data);
            }
            if ("webm".equals(extension)) {
                return readWebmDurationSeconds(data);
            }
            return OptionalDouble.empty();
        } catch (IOException ex) {
            throw new IllegalArgumentException("Cannot read video metadata");
        }
    }

    private OptionalDouble readMp4DurationSeconds(byte[] data) {
        for (int i = 4; i < data.length - 40; i++) {
            if (data[i] == 'm' && data[i + 1] == 'v' && data[i + 2] == 'h' && data[i + 3] == 'd') {
                int version = data[i + 4] & 0xff;
                if (version == 0 && i + 24 < data.length) {
                    long timescale = readUInt32(data, i + 16);
                    long duration = readUInt32(data, i + 20);
                    return timescale > 0 ? OptionalDouble.of((double) duration / timescale) : OptionalDouble.empty();
                }
                if (version == 1 && i + 40 < data.length) {
                    long timescale = readUInt32(data, i + 28);
                    long duration = readUInt64(data, i + 32);
                    return timescale > 0 ? OptionalDouble.of((double) duration / timescale) : OptionalDouble.empty();
                }
            }
        }
        return OptionalDouble.empty();
    }

    private OptionalDouble readWebmDurationSeconds(byte[] data) {
        double timecodeScale = 1_000_000D;
        Double duration = null;
        for (int i = 0; i < data.length - 2; i++) {
            if ((data[i] & 0xff) == 0x2a && (data[i + 1] & 0xff) == 0xd7 && (data[i + 2] & 0xff) == 0xb1) {
                EbmlValue value = readEbmlValue(data, i + 3);
                if (value != null) {
                    timecodeScale = readUnsignedInteger(data, value.offset, value.size);
                }
            }
            if ((data[i] & 0xff) == 0x44 && (data[i + 1] & 0xff) == 0x89) {
                EbmlValue value = readEbmlValue(data, i + 2);
                if (value != null && (value.size == 4 || value.size == 8)) {
                    duration = value.size == 4
                            ? (double) Float.intBitsToFloat((int) readUnsignedInteger(data, value.offset, value.size))
                            : Double.longBitsToDouble(readUnsignedInteger(data, value.offset, value.size));
                }
            }
        }
        return duration == null ? OptionalDouble.empty() : OptionalDouble.of(duration * timecodeScale / 1_000_000_000D);
    }

    private EbmlValue readEbmlValue(byte[] data, int sizeOffset) {
        if (sizeOffset >= data.length) {
            return null;
        }
        int first = data[sizeOffset] & 0xff;
        int length = 1;
        int mask = 0x80;
        while (length <= 8 && (first & mask) == 0) {
            mask >>= 1;
            length++;
        }
        if (length > 8 || sizeOffset + length > data.length) {
            return null;
        }
        long size = first & (mask - 1);
        for (int i = 1; i < length; i++) {
            size = (size << 8) | (data[sizeOffset + i] & 0xff);
        }
        int valueOffset = sizeOffset + length;
        if (size < 0 || size > Integer.MAX_VALUE || valueOffset + size > data.length) {
            return null;
        }
        return new EbmlValue(valueOffset, (int) size);
    }

    private long readUInt32(byte[] data, int offset) {
        return ((long) data[offset] & 0xff) << 24
                | ((long) data[offset + 1] & 0xff) << 16
                | ((long) data[offset + 2] & 0xff) << 8
                | ((long) data[offset + 3] & 0xff);
    }

    private long readUInt64(byte[] data, int offset) {
        long value = 0;
        for (int i = 0; i < 8; i++) {
            value = (value << 8) | (data[offset + i] & 0xff);
        }
        return value;
    }

    private long readUnsignedInteger(byte[] data, int offset, int size) {
        long value = 0;
        for (int i = 0; i < size; i++) {
            value = (value << 8) | (data[offset + i] & 0xff);
        }
        return value;
    }

    private record EbmlValue(int offset, int size) {
    }

    private int mapTaskPriority(String priority) {
        if (priority == null) return 1;
        switch (priority.toUpperCase()) {
            case "CRITICAL": return 3;
            case "HIGH": return 2;
            case "MEDIUM": return 1;
            case "LOW": return 0;
            default: return 1;
        }
    }
}
