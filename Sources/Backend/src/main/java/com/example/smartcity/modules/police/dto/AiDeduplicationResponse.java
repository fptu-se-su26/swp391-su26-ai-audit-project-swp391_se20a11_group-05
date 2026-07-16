package com.example.smartcity.modules.police.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiDeduplicationResponse {
    private String groupId;
    private List<Long> feedbackIds;
    private Integer matchScore;
    private String reason;
}
