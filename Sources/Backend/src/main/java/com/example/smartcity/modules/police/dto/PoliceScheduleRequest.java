package com.example.smartcity.modules.police.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PoliceScheduleRequest {
    @NotBlank(message = "Monday key is required")
    private String mondayKey;

    @NotBlank(message = "Schedule data is required")
    private String scheduleData;
}
