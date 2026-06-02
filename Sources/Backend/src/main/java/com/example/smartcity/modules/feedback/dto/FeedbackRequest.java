package com.example.smartcity.modules.feedback.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
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
    @NotBlank(message = "Tieu de khong duoc de trong")
    @Size(max = 255, message = "Tieu de toi da 255 ky tu")
    private String title;

    @NotBlank(message = "Mo ta khong duoc de trong")
    @Size(max = 5000, message = "Mo ta toi da 5000 ky tu")
    private String description;

    @NotNull(message = "Vui long cho phep truy cap vi tri GPS de gui phan anh")
    @DecimalMin(value = "-90.0", message = "Vi do khong hop le")
    @DecimalMax(value = "90.0", message = "Vi do khong hop le")
    private Double latitude;

    @NotNull(message = "Vui long cho phep truy cap vi tri GPS de gui phan anh")
    @DecimalMin(value = "-180.0", message = "Kinh do khong hop le")
    @DecimalMax(value = "180.0", message = "Kinh do khong hop le")
    private Double longitude;

    @Size(max = 255, message = "Dia chi toi da 255 ky tu")
    private String addressDetails;

    @NotNull(message = "Category khong duoc de trong")
    private Long categoryId;

    private Long wardId;
}
