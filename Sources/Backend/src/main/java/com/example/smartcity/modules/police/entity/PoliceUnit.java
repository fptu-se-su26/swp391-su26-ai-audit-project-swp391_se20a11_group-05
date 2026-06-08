package com.example.smartcity.modules.police.entity;

import com.example.smartcity.common.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "police_units")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PoliceUnit extends BaseEntity {

    @Column(nullable = false)
    private String unitName;

    @Column(nullable = false)
    private String unitCode;

    private String address;

    private String phone;

    private String email;

    @Column(nullable = false)
    private String district;

    private String ward;

    @Column(length = 500)
    private String description;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;
}
