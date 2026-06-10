package com.example.smartcity.modules.police.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HotspotResponse {
    private Double latitude;
    private Double longitude;
    private Integer weight;
    private String status;
    private String categoryName;
}
