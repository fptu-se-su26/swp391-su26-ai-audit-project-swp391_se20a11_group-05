package com.example.smartcity.modules.police.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RequestMoreInfoRequest {
    @NotBlank(message = "Lý do yêu cầu bổ sung không được để trống")
    private String reason;
}
