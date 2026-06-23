package com.example.smartcity.modules.feedback.entity;

import jakarta.persistence.*;

import com.example.smartcity.common.base.BaseEntity;

@Entity
@Table(name = "categories")
public class Category extends BaseEntity {

    @Column(nullable = false, unique = true, length = 80)
    private String code;

    @Column(nullable = false, unique = true)
    private String name; 

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "name_vi", nullable = false)
    private String nameVi;

    @Column(name = "name_en", nullable = false)
    private String nameEn;

    @Column(name = "description_vi", columnDefinition = "TEXT")
    private String descriptionVi;

    @Column(name = "description_en", columnDefinition = "TEXT")
    private String descriptionEn;

    @Column(name = "managed_by_role", nullable = false, length = 30)
    private String managedByRole;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    public Category() {}
    
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getNameVi() { return nameVi; }
    public void setNameVi(String nameVi) { this.nameVi = nameVi; }
    public String getNameEn() { return nameEn; }
    public void setNameEn(String nameEn) { this.nameEn = nameEn; }
    public String getDescriptionVi() { return descriptionVi; }
    public void setDescriptionVi(String descriptionVi) { this.descriptionVi = descriptionVi; }
    public String getDescriptionEn() { return descriptionEn; }
    public void setDescriptionEn(String descriptionEn) { this.descriptionEn = descriptionEn; }
    public String getManagedByRole() { return managedByRole; }
    public void setManagedByRole(String managedByRole) { this.managedByRole = managedByRole; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}





