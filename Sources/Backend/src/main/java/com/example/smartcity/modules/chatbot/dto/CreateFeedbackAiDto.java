package com.example.smartcity.modules.chatbot.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;

@Data
public class CreateFeedbackAiDto {
    @NotNull(message = "Thiếu trường intent")
    private String intent;
    
    private String emotion;
    private String reply;
    private String location;
    private String category;
    private String description;
    
    private List<String> needsMoreInfo;
    
    private String action;
}
