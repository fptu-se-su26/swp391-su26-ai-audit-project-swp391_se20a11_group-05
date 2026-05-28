package com.example.smartcity.modules.police.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PoliceUnitRequest {

    @NotBlank(message = "Tên đơn vị không được để trống")
    private String unitName;

    @NotBlank(message = "Mã đơn vị không được để trống")
    private String unitCode;

    private String address;

    private String phone;

    private String email;

    @NotBlank(message = "Quận/huyện không được để trống")
    private String district;

    private String ward;

    private String description;
}
