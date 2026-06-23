package com.example.smartcity.modules.feedback.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackLookupStatsResponse {
    private long total;
    private long pending;
    private long resolved;
    private long rejected;
    private Long inProgress;
}
