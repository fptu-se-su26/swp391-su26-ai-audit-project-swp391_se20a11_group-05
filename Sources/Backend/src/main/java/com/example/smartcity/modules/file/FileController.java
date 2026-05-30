package com.example.smartcity.modules.file;

import com.example.smartcity.modules.feedback.entity.Attachment;
import com.example.smartcity.modules.feedback.entity.Feedback;
import com.example.smartcity.modules.feedback.repository.AttachmentRepository;
import com.example.smartcity.modules.feedback.repository.FeedbackRepository;
import com.example.smartcity.modules.user.entity.User;
import com.example.smartcity.modules.user.repository.UserRepository;
import com.example.smartcity.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {

    private final FileStorageService fileStorageService;
    private final AttachmentRepository attachmentRepository;
    private final FeedbackRepository feedbackRepository;
    private final UserRepository userRepository;

    /**
     * Upload file (không gắn với feedback ngay)
     */
    @PostMapping("/upload")
    public ResponseEntity<UploadResponse> uploadFile(
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(new UploadResponse(null, "File không được để trống"));
        }

        String fileName = fileStorageService.storeFile(file);
        String fileUrl = "/api/files/" + fileName;
        log.info("[FileUpload] {} upload {}", authentication.getName(), fileName);
        return ResponseEntity.ok(new UploadResponse(fileUrl, null));
    }

    /**
     * Upload file và gắn vào feedback
     */
    @PostMapping("/upload/{feedbackId}")
    public ResponseEntity<UploadResponse> uploadAndAttach(
            @PathVariable Long feedbackId,
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(new UploadResponse(null, "File không được để trống"));
        }

        Feedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new ResourceNotFoundException("Feedback", feedbackId));

        User user = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User: " + authentication.getName()));

        String fileName = fileStorageService.storeFile(file);
        String fileUrl = "/api/files/" + fileName;

        Attachment attachment = new Attachment();
        attachment.setFeedback(feedback);
        attachment.setFileUrl(fileUrl);
        attachment.setFileType(file.getContentType());
        attachment.setUploadedBy(user);
        attachment.setUploadedAt(LocalDateTime.now());
        attachmentRepository.save(attachment);

        log.info("[FileUpload] {} gắn {} vào feedback #{}", authentication.getName(), fileName, feedbackId);
        return ResponseEntity.ok(new UploadResponse(fileUrl, null));
    }

    /**
     * Tải/xem file
     */
    @GetMapping("/{fileName:.+}")
    public ResponseEntity<Resource> serveFile(@PathVariable String fileName) {
        Resource resource = fileStorageService.loadFile(fileName);
        String contentType = determineContentType(fileName);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }

    /**
     * Lấy danh sách file của một feedback
     */
    @GetMapping("/feedback/{feedbackId}")
    public ResponseEntity<List<AttachmentDto>> getAttachments(@PathVariable Long feedbackId) {
        List<AttachmentDto> files = attachmentRepository.findByFeedbackId(feedbackId)
                .stream()
                .map(a -> new AttachmentDto(a.getId(), a.getFileUrl(), a.getFileType()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(files);
    }

    private String determineContentType(String fileName) {
        String ext = fileName.contains(".") ? fileName.substring(fileName.lastIndexOf(".")).toLowerCase() : "";
        return switch (ext) {
            case ".jpg", ".jpeg" -> "image/jpeg";
            case ".png" -> "image/png";
            case ".gif" -> "image/gif";
            case ".mp4" -> "video/mp4";
            case ".pdf" -> "application/pdf";
            default -> "application/octet-stream";
        };
    }

    // ─── DTOs ─────────────────────────────────────────────────────

    public record UploadResponse(String fileUrl, String error) {}
    public record AttachmentDto(Long id, String fileUrl, String fileType) {}
}
