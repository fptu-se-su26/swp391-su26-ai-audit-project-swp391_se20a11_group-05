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

    @NotBlank(message = "Tiêu đề không được để trống")
    private String title;

    @NotBlank(message = "Tóm tắt không được để trống")
    private String summary;
    
    @NotBlank(message = "Nội dung không được để trống")
    private String content;

    @NotBlank(message = "Chuyên mục không được để trống")
    private String category;

    private String imageUrl;
}
