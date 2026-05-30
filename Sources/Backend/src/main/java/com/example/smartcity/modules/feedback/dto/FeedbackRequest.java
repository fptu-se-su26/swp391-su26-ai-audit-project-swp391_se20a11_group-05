package com.example.smartcity.modules.feedback.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackRequest {
    @NotBlank(message = "Tiêu đề không được để trống")
    @Size(max = 255, message = "Tiêu đề tối đa 255 ký tự")
    private String title;

    @NotBlank(message = "Mô tả không được để trống")
    @Size(max = 5000, message = "Mô tả tối đa 5000 ký tự")
    private String description;

    private Double latitude;
    private Double longitude;

    @Size(max = 255, message = "Địa chỉ tối đa 255 ký tự")
    private String addressDetails;

    @NotNull(message = "Category không được để trống")
    private Long categoryId;

    @NotNull(message = "Phường/Xã không được để trống")
    private Long wardId;
}




