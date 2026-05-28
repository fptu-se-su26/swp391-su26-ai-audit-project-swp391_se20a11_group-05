package com.example.smartcity.modules.police.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PoliceUnitResponse {

    private Long id;
    private String unitName;
    private String unitCode;
    private String address;
    private String phone;
    private String email;
    private String district;
    private String ward;
    private String description;
    private Boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
