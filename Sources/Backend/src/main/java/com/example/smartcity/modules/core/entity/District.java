package com.example.smartcity.modules.core.entity;

import com.example.smartcity.common.base.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "districts")
@Getter
@Setter
public class District extends BaseEntity {

    @Column(nullable = false, unique = true, length = 255)
    private String name;

    public District() {}
    public District(String name) {
        this.name = name;
    }
}
