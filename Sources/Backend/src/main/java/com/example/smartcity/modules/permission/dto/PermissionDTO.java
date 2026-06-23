package com.example.smartcity.modules.permission.dto;

import com.example.smartcity.modules.permission.entity.PermissionCategory;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PermissionDTO {
    private Long id;
    private String name;
    private String description;
    private PermissionCategory category;
    private Boolean isActive;
    private Integer priority;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
    private String updatedBy;
}