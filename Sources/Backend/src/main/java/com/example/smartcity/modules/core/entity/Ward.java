package com.example.smartcity.modules.core.entity;

import com.example.smartcity.common.base.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "wards", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"district_id", "name"})
})
@Getter
@Setter
public class Ward extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "district_id", nullable = false)
    private District district;

    @Column(nullable = false, length = 255)
    private String name;

    public Ward() {}
    
    public Ward(District district, String name) {
        this.district = district;
        this.name = name;
    }
}
