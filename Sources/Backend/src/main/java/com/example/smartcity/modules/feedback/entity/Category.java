package com.example.smartcity.modules.feedback.entity;

import jakarta.persistence.*;

import com.example.smartcity.common.base.BaseEntity;

@Entity
@Table(name = "categories")
public class Category extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String name; 

    @Column(columnDefinition = "TEXT")
    private String description;

    public Category() {}
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}





