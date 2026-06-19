package com.example.smartcity.modules.campaign.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CampaignRequest {

    @NotBlank(message = "Tên chiến dịch không được để trống")
    @Size(max = 255, message = "Tên chiến dịch tối đa 255 ký tự")
    private String title;

    private String description;

    private String category;

    private String locationText;

    @NotBlank(message = "Địa điểm nội bộ không được để trống")
    @Size(max = 500, message = "Địa điểm nội bộ tối đa 500 ký tự")
    private String privateLocationText;

    @NotBlank(message = "Dụng cụ cần chuẩn bị không được để trống")
    private String requiredTools;

    @NotBlank(message = "Thông tin liên hệ ban tổ chức không được để trống")
    @Size(max = 255, message = "Thông tin liên hệ tối đa 255 ký tự")
    private String organizerContact;

    private Double latitude;

    private Double longitude;

    @Min(value = 1, message = "Số lượng tham gia tối thiểu là 1")
    private Integer maxParticipants;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private Long wardId;

    private Long linkedFeedbackId;
    private String boundaryGeojson;
    private String coverImageUrl;
}
