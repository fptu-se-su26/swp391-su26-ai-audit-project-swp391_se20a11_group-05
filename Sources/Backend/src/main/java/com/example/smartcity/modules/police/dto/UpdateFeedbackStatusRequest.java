package com.example.smartcity.modules.police.dto;

import com.example.smartcity.modules.feedback.entity.FeedbackStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateFeedbackStatusRequest {
    @NotNull(message = "Trạng thái không được để trống")
    private FeedbackStatus status;
    private String note;
}
