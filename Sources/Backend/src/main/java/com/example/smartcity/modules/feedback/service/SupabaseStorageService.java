package com.example.smartcity.modules.feedback.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriUtils;

import java.nio.charset.StandardCharsets;
import java.util.Set;
import java.util.UUID;

@Service
public class SupabaseStorageService {
    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp",
            "video/mp4",
            "video/webm",
            "video/quicktime"
    );

    private final WebClient webClient;
    private final String projectUrl;
    private final String serviceRoleKey;
    private final String bucketName;

    public SupabaseStorageService(
            @Value("${supabase.url:${SUPABASE_URL:}}") String projectUrl,
            @Value("${supabase.service-role-key:${SUPABASE_SERVICE_ROLE_KEY:}}") String serviceRoleKey,
            @Value("${supabase.storage.bucket:feedback-media}") String bucketName
    ) {
        this.webClient = WebClient.builder().build();
        this.projectUrl = trimTrailingSlash(projectUrl);
        this.serviceRoleKey = serviceRoleKey;
        this.bucketName = bucketName;
    }

    public String upload(MultipartFile file, Long feedbackId) {
        validateUploadConfig();
        validateFile(file);

        try {
            String objectPath = buildObjectPath(file, feedbackId);
            String uploadUrl = projectUrl + "/storage/v1/object/" + bucketName + "/" + objectPath;

            webClient.post()
                    .uri(uploadUrl)
                    .header("Authorization", "Bearer " + serviceRoleKey)
                    .header("apikey", serviceRoleKey)
                    .header("x-upsert", "false")
                    .contentType(MediaType.parseMediaType(file.getContentType()))
                    .body(BodyInserters.fromValue(file.getBytes()))
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            return projectUrl + "/storage/v1/object/public/" + bucketName + "/" + objectPath;
        } catch (Exception ex) {
            throw new IllegalStateException("Cannot upload file to Supabase Storage: " + ex.getMessage(), ex);
        }
    }

    private void validateUploadConfig() {
        if (!StringUtils.hasText(projectUrl) || !StringUtils.hasText(serviceRoleKey)) {
            throw new IllegalStateException("Missing Supabase Storage config: supabase.url and supabase.service-role-key");
        }
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }
        if (!ALLOWED_TYPES.contains(file.getContentType())) {
            throw new IllegalArgumentException("Unsupported file type: " + file.getContentType());
        }
    }

    private String buildObjectPath(MultipartFile file, Long feedbackId) {
        String original = StringUtils.cleanPath(file.getOriginalFilename() == null ? "upload" : file.getOriginalFilename());
        String extension = "";
        int dotIndex = original.lastIndexOf('.');
        if (dotIndex >= 0 && dotIndex < original.length() - 1) {
            extension = original.substring(dotIndex);
        }
        String fileName = UUID.randomUUID() + extension;
        String rawPath = "feedbacks/" + feedbackId + "/" + fileName;
        return UriUtils.encodePath(rawPath, StandardCharsets.UTF_8);
    }

    private String trimTrailingSlash(String value) {
        if (value == null) {
            return "";
        }
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }
}
