package com.example.smartcity.modules.emergency.dto;

import com.example.smartcity.modules.emergency.entity.EmergencyAlert.AlertLevel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmergencyAlertRequest {

    @NotBlank(message = "Tiêu đề cảnh báo không được để trống")
    private String title;

    @NotBlank(message = "Nội dung cảnh báo không được để trống")
    private String content;

    @NotNull(message = "Mức độ cảnh báo không được để trống")
    private AlertLevel level;

    @NotBlank(message = "Quận/huyện không được để trống")
    private String district;

    private String ward;

    private String affectedArea;

    private LocalDateTime expiresAt;
}
