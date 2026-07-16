package com.example.smartcity.modules.news.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NewsRequestDTO {

    @NotBlank(message = "Title is required")
    private String title;

    private String summary;
    
    private String content;

    @NotBlank(message = "Category is required")
    private String category;

    private String imageUrl;
}
