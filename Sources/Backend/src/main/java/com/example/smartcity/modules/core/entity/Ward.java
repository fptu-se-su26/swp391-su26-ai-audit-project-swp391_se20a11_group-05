package com.example.smartcity.modules.core.entity;

import com.example.smartcity.common.base.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "wards", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"ward_code"}),
    @UniqueConstraint(columnNames = {"name"})
})
@Getter
@Setter
public class Ward extends BaseEntity {

    @Column(name = "ward_code", nullable = false, unique = true, length = 50)
    private String wardCode;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(nullable = false, length = 30)
    private String type = "WARD";

    @Column(name = "city_name", nullable = false, length = 100)
    private String cityName = "Da Nang";

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    public Ward() {}
    
    public Ward(String wardCode, String name) {
        this.wardCode = wardCode;
        this.name = name;
    }
}
