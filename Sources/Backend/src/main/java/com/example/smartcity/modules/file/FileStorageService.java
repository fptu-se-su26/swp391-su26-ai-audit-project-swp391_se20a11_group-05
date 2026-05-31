package com.example.smartcity.modules.file;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Slf4j
@Service
public class FileStorageService {

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

    private Path uploadPath;

    @PostConstruct
    public void init() {
        uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(uploadPath);
            log.info("[FileStorage] Thư mục upload: {}", uploadPath);
        } catch (IOException e) {
            throw new RuntimeException("Không thể tạo thư mục upload: " + uploadPath, e);
        }
    }

    /**
     * Lưu file và trả về tên file đã mã hóa (tránh xung đột tên)
     */
    public String storeFile(MultipartFile file) {
        String originalName = file.getOriginalFilename();
        String extension = "";
        if (originalName != null && originalName.contains(".")) {
            extension = originalName.substring(originalName.lastIndexOf("."));
        }
        String storedName = UUID.randomUUID().toString() + extension;

        try {
            Path target = uploadPath.resolve(storedName);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            log.info("[FileStorage] Đã lưu: {} (original: {})", storedName, originalName);
            return storedName;
        } catch (IOException e) {
            throw new RuntimeException("Không thể lưu file: " + originalName, e);
        }
    }

    /**
     * Đọc file từ disk
     */
    public Resource loadFile(String fileName) {
        try {
            Path file = uploadPath.resolve(fileName).normalize();
            Resource resource = new UrlResource(file.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            }
            throw new RuntimeException("Không thể đọc file: " + fileName);
        } catch (MalformedURLException e) {
            throw new RuntimeException("File không hợp lệ: " + fileName, e);
        }
    }
}
