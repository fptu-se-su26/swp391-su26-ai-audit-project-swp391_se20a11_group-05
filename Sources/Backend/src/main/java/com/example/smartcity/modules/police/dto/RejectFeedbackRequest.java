package com.example.smartcity.modules.police.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RejectFeedbackRequest {
    @NotBlank(message = "Lý do từ chối/chuyển tiếp không được để trống")
    private String reason;
}
