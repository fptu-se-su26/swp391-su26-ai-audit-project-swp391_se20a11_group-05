package com.example.smartcity.modules.chatbot.dto;

import lombok.Data;
import java.util.List;

@Data
public class ChatRequestDto {
    private String message;
    private String sessionId;
    private List<ChatMessage> history;

    @Data
    public static class ChatMessage {
        private String role;
        private String content;
    }
}
