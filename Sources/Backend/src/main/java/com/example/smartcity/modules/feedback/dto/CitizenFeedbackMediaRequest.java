package com.example.smartcity.modules.feedback.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CitizenFeedbackMediaRequest {
    @NotBlank(message = "Title is required")
    @Size(max = 255, message = "Title must be at most 255 characters")
    private String title;

    @NotBlank(message = "Description is required")
    @Size(max = 5000, message = "Description must be at most 5000 characters")
    private String description;

    private Double latitude;
    private Double longitude;

    @Size(max = 255, message = "Address details must be at most 255 characters")
    private String addressDetails;

    @NotNull(message = "Category id is required")
    private Long categoryId;

    @NotNull(message = "Citizen id is required")
    private Long citizenId;

    @Builder.Default
    private List<Long> videoDurationsSeconds = new ArrayList<>();
}
