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
        log.info("[FileStorage] Legacy local file path: {}", uploadPath);
    }

    /**
     * Legacy local storage path. New feedback uploads use SupabaseStorageService.
     */
    public String storeFile(MultipartFile file) {
        String originalName = file.getOriginalFilename();
        String extension = "";
        if (originalName != null && originalName.contains(".")) {
            extension = originalName.substring(originalName.lastIndexOf("."));
        }
        String storedName = UUID.randomUUID() + extension;

        try {
            Files.createDirectories(uploadPath);
            Path target = uploadPath.resolve(storedName);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            log.info("[FileStorage] Stored legacy local file: {} (original: {})", storedName, originalName);
            return storedName;
        } catch (IOException e) {
            throw new RuntimeException("Cannot store local file: " + originalName, e);
        }
    }

    /**
     * Read legacy local files for existing /api/files/{fileName} URLs.
     */
    public Resource loadFile(String fileName) {
        try {
            Path file = uploadPath.resolve(fileName).normalize();
            Resource resource = new UrlResource(file.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            }
            throw new RuntimeException("Cannot read local file: " + fileName);
        } catch (MalformedURLException e) {
            throw new RuntimeException("Invalid local file: " + fileName, e);
        }
    }
}
