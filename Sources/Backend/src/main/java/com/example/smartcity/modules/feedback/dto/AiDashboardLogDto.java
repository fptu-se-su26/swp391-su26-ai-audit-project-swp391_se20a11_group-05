package com.example.smartcity.modules.feedback.dto;

import com.example.smartcity.modules.feedback.entity.AiAnalysisLog;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class AiDashboardLogDto {
    private Long id;
    private Long feedbackId;
    private int trustScore;
    private boolean isToxic;
    private String domain;
    private String priority;
    private int tokensUsedInput;
    private int tokensUsedOutput;
    private long latencyMs;
    private String modelName;
    private String reason;
    private LocalDateTime createdAt;
    
    // New field requested by user
    private String assignedDepartment;

    public static AiDashboardLogDto fromEntity(AiAnalysisLog log) {
        String assignedDept = "Chưa phân bổ";
        if (log.getFeedback() != null) {
            String role = log.getFeedback().getAssignedToRole();
            String ward = log.getFeedback().getWardName();
            
            if (role != null) {
                if (role.equals("POLICE")) {
                    assignedDept = "Công an" + (ward != null ? " " + ward : "");
                } else if (role.equals("WARD_STAFF")) {
                    assignedDept = "UBND" + (ward != null ? " " + ward : "");
                } else {
                    assignedDept = role + (ward != null ? " " + ward : "");
                }
            } else if (log.getFeedback().getAssignedUnitName() != null) {
                assignedDept = log.getFeedback().getAssignedUnitName();
            }
        }

        return AiDashboardLogDto.builder()
                .id(log.getId())
                .feedbackId(log.getFeedback() != null ? log.getFeedback().getId() : null)
                .trustScore(log.getTrustScore() != null ? log.getTrustScore() : 0)
                .isToxic(log.getIsToxic() != null ? log.getIsToxic() : false)
                .domain(log.getDomain())
                .priority(log.getPriority())
                .tokensUsedInput(log.getTokensUsedInput() != null ? log.getTokensUsedInput() : 0)
                .tokensUsedOutput(log.getTokensUsedOutput() != null ? log.getTokensUsedOutput() : 0)
                .latencyMs(log.getLatencyMs() != null ? log.getLatencyMs() : 0L)
                .modelName(log.getModelName())
                .reason(log.getReason())
                .createdAt(log.getCreatedAt())
                .assignedDepartment(assignedDept)
                .build();
    }
}
