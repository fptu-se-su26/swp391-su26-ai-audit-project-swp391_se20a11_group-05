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
    private String actorName;
    private String actorRole;
    private String authorityName;
    private String assignedToName;
    private String action;
    private String status;
    private String title;
    private String deadline;
    private FeedbackStatus oldStatus;
    private FeedbackStatus newStatus;
    private String note;
    private LocalDateTime createdAt;
}
