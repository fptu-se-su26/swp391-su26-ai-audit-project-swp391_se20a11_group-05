package com.example.smartcity.modules.file;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class CloudinaryStorageService {

    private final Cloudinary cloudinary;

    public String upload(MultipartFile file, Long feedbackId) {
        try {
            String contentType = file.getContentType();
            String resourceType = (contentType != null && contentType.startsWith("video/")) ? "video" : "image";
            
            // Tổ chức file theo thư mục feedback/<id> để dễ quản lý trên dashboard Cloudinary
            String folder = "feedback/" + feedbackId;

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
