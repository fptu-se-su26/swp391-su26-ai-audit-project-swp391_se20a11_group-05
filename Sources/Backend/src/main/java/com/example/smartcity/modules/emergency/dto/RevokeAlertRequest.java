package com.example.smartcity.modules.emergency.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RevokeAlertRequest {

    @NotBlank(message = "Lý do thu hồi không được để trống")
    private String reason;
}
