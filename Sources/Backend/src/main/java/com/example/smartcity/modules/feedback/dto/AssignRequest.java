package com.example.smartcity.modules.feedback.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignRequest {
    @NotNull(message = "assigneeId không được để trống")
    private Long assigneeId;
}
