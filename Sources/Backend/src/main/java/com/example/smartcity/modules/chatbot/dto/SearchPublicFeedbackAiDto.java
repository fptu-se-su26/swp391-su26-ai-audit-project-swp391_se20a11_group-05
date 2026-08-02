package com.example.smartcity.modules.chatbot.dto;

import jakarta.validation.constraints.NotNull;
import java.util.List;

public class SearchPublicFeedbackAiDto {

    @NotNull
    private String intent; // Luôn là SEARCH_PUBLIC_FEEDBACKS

    private String location; // Ví dụ: "Ngũ Hành Sơn", "Hải Châu", có thể rỗng

    private String category; // Ví dụ: "rác thải", "môi trường", "kẹt xe", có thể rỗng

    private String emotion; // POSITIVE, NEGATIVE, NEUTRAL

    public SearchPublicFeedbackAiDto() {}

    public String getIntent() {
        return intent;
    }

    public void setIntent(String intent) {
        this.intent = intent;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getEmotion() {
        return emotion;
    }

    public void setEmotion(String emotion) {
        this.emotion = emotion;
    }
}
