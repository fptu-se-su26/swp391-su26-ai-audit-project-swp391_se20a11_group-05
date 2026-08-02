package com.example.smartcity.modules.chatbot.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SearchPublicFeedbackAiDto {

    @NotNull(message = "Thiếu trường intent")
    private String intent; // Luôn là SEARCH_PUBLIC_FEEDBACKS

    private String location; // Ví dụ: "Ngũ Hành Sơn", "Hải Châu", có thể rỗng

    private String category; // Ví dụ: "rác thải", "môi trường", "kẹt xe", có thể rỗng

    private String emotion; // POSITIVE, NEGATIVE, NEUTRAL
}
