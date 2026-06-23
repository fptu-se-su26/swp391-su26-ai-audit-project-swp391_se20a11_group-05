package com.example.smartcity.modules.feedback.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import org.springframework.web.util.UriUtils;

import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.UUID;

@Service
public class SupabaseStorageService {
    private final WebClient webClient;
    private final String projectUrl;
    private final String apiKey;
    private final String bucketName;

    public SupabaseStorageService(
            @Value("${supabase.url:${SUPABASE_URL:}}") String projectUrl,
            @Value("${supabase.key:${SUPABASE_ANON_KEY:${supabase.service-role-key:${SUPABASE_SERVICE_ROLE_KEY:}}}}") String apiKey,
            @Value("${supabase.bucket:${supabase.storage.bucket:feedback-media}}") String bucketName
    ) {
        this.webClient = WebClient.builder().build();
        this.projectUrl = trimTrailingSlash(projectUrl);
        this.apiKey = apiKey;
        this.bucketName = bucketName;
    }

    public String upload(MultipartFile file, Long feedbackId) {
        validateUploadConfig();

        try {
            String objectPath = buildObjectPath(file, feedbackId);
            String uploadUrl = projectUrl + "/storage/v1/object/" + bucketName + "/" + objectPath;

            webClient.post()
                    .uri(uploadUrl)
                    .header("Authorization", "Bearer " + apiKey)
                    .header("apikey", apiKey)
                    .header("x-upsert", "false")
                    .contentType(MediaType.parseMediaType(file.getContentType()))
                    .body(BodyInserters.fromValue(file.getBytes()))
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, response -> response.bodyToMono(String.class)
                            .defaultIfEmpty("")
                            .map(body -> new IllegalStateException("Supabase upload failed with status "
                                    + response.statusCode().value() + ": " + body)))
                    .bodyToMono(String.class)
                    .block();

            return projectUrl + "/storage/v1/object/public/" + bucketName + "/" + objectPath;
        } catch (WebClientResponseException ex) {
            throw new IllegalStateException("Cannot upload file to Supabase Storage: " + ex.getResponseBodyAsString(), ex);
        } catch (Exception ex) {
            throw new IllegalStateException("Cannot upload file to Supabase Storage: " + ex.getMessage(), ex);
        }
    }

    private void validateUploadConfig() {
        if (!StringUtils.hasText(projectUrl) || !StringUtils.hasText(apiKey)) {
            throw new IllegalStateException("Missing Supabase Storage config: supabase.url and supabase.key");
        }
    }

    private String buildObjectPath(MultipartFile file, Long feedbackId) {
        String original = StringUtils.cleanPath(file.getOriginalFilename() == null ? "upload" : file.getOriginalFilename());
        String extension = "";
        int dotIndex = original.lastIndexOf('.');
        if (dotIndex >= 0 && dotIndex < original.length() - 1) {
            extension = original.substring(dotIndex).toLowerCase(Locale.ROOT);
        }
        String fileName = UUID.randomUUID() + extension;
        String mediaFolder = isVideo(file.getContentType()) ? "videos" : "images";
        String rawPath = "feedback/" + feedbackId + "/" + mediaFolder + "/" + fileName;
        return UriUtils.encodePath(rawPath, StandardCharsets.UTF_8);
    }

    private boolean isVideo(String contentType) {
        return contentType != null && contentType.toLowerCase(Locale.ROOT).startsWith("video/");
    }

    private String trimTrailingSlash(String value) {
        if (value == null) {
            return "";
        }
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }
}
