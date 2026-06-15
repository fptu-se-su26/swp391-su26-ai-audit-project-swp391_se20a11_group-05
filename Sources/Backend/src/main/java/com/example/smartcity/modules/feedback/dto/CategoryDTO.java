package com.example.smartcity.modules.feedback.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryDTO {
    private Long id;
    private String code;
    private String name;
    private String description;
    private String nameVi;
    private String nameEn;
    private String descriptionVi;
    private String descriptionEn;
    private String managedByRole;
    private boolean active;
}




