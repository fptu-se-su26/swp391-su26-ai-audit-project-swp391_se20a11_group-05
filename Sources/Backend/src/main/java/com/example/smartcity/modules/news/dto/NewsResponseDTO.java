package com.example.smartcity.modules.news.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NewsResponseDTO {
    private Long id;
    private String title;
    private String summary;
    private String content;
    private String category;
    private String imageUrl;
    private Long views;
    private Long authorId;
    private String authorName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
