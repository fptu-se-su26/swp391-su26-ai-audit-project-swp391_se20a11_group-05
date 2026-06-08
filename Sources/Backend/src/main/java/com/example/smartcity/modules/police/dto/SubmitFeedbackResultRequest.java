package com.example.smartcity.modules.police.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SubmitFeedbackResultRequest {
    @NotBlank(message = "Kết quả xử lý không được để trống")
    private String resultNote;
    
    // TODO: Add media file URLs/attachments integration with FeedbackMedia table later
}
