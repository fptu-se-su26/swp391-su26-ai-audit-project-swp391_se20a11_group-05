package com.example.smartcity.modules.file;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class CloudinaryStorageService {

    private final Cloudinary cloudinary;

    @Value("${cloudinary.cloud-name:}")
    private String cloudName;

    public String upload(MultipartFile file, Long feedbackId) {
        return uploadToFolder(file, "feedback/" + feedbackId);
    }

    public String uploadNews(MultipartFile file) {
        return uploadToFolder(file, "news");
    }

    private String uploadToFolder(MultipartFile file, String folder) {
        // Fallback for local development when Cloudinary is not configured
        if (cloudName == null || cloudName.trim().isEmpty()) {
            log.warn("[Cloudinary] Credentials not configured. Using dummy image URL for local development.");
            return "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg";
        }

        try {
            String contentType = file.getContentType();
            String resourceType = (contentType != null && contentType.startsWith("video/")) ? "video" : "image";

            Map<?, ?> params = ObjectUtils.asMap(
                    "folder", folder,
                    "resource_type", resourceType
            );

            Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(), params);
            String secureUrl = (String) uploadResult.get("secure_url");
            
            log.info("[Cloudinary] Upload thành công file lên Cloudinary: {}", secureUrl);
            return secureUrl;
        } catch (IOException e) {
            log.error("[Cloudinary] Lỗi khi upload file", e);
            throw new RuntimeException("Không thể upload file lên Cloudinary", e);
        }
    }
}
