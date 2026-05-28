package com.example.smartcity.modules.feedback.dto;

import com.example.smartcity.modules.feedback.entity.FeedbackStatus;
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
public class StatusChangeRequest {
    @NotNull(message = "Trạng thái không được để trống")
    private FeedbackStatus status;

    @Size(max = 1000, message = "Ghi chú tối đa 1000 ký tự")
    private String note;
}
