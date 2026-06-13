package com.example.smartcity.modules.warning.entity;

import com.example.smartcity.common.base.BaseEntity;
import com.example.smartcity.modules.core.entity.Ward;
import com.example.smartcity.modules.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "regional_warnings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegionalWarning extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "issued_by", nullable = false)
    private User issuedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ward_id")
    private Ward ward;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(name = "warning_level", nullable = false, length = 20)
    @Builder.Default
    private String warningLevel = "NORMAL";
}
