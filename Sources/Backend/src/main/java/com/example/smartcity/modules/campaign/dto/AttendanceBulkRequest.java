package com.example.smartcity.modules.campaign.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class AttendanceBulkRequest {
    @NotNull
    private List<AttendanceItem> attendances;

    @Data
    public static class AttendanceItem {
        private Long participantId;
        private boolean attended;
    }
}
