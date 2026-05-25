package com.example.smartcity.modules.feedback.dto;

import com.example.smartcity.modules.feedback.entity.FeedbackStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackLogResponse {
    private Long id;
    private String actionByName;
    private FeedbackStatus oldStatus;
    private FeedbackStatus newStatus;
    private String note;
    private LocalDateTime createdAt;
}
