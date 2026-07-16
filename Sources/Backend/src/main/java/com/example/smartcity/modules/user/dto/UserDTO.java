package com.example.smartcity.modules.user.dto;

import com.example.smartcity.modules.user.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    private Long id;
    private String username;
    private String fullName;
    private String phoneNumber;
    private String email;
    private String avatarUrl;
    private Role role;
    private Boolean isActive;
    private Boolean isMfaEnabled;
    private Long wardId;
    private String wardName;
    private String wardType;
    private Integer warningCount;
    private Integer completedCampaignCount;
    private Integer noShowCampaignCount;
    private String reputationBadge;
    private Boolean isCampaignBanned;
    private java.time.LocalDateTime lastCampaignUnbanAt;
    private String status;
}
