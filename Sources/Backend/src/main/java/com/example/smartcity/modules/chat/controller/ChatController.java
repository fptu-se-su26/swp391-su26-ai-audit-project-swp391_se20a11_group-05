package com.example.smartcity.modules.chat.controller;

import com.example.smartcity.modules.chat.dto.ChatRequestDto;
import com.example.smartcity.modules.chatbot.service.ChatbotService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatbotService chatbotService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @PostMapping("/process")
    public ResponseEntity<String> processChat(@RequestBody ChatRequestDto request) {
        try {
            Long userId = 1L; // Fake User ID for public UI testing
            java.util.List<java.util.Map<String, String>> mappedHistory = new java.util.ArrayList<>();
            if (request.getHistory() != null) {
                for (var msg : request.getHistory()) {
                    mappedHistory.add(java.util.Map.of("role", msg.getRole(), "content", msg.getContent()));
                }
            }
            java.util.Map<String, Object> result = chatbotService.ask(userId, request.getSessionId(), request.getMessage(), mappedHistory);
            String jsonResponse = objectMapper.writeValueAsString(result);
            return ResponseEntity.ok()
                    .header("Content-Type", "application/json; charset=UTF-8")
                    .body(jsonResponse);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("{\"intent\":\"GENERAL\",\"emotion\":\"NEGATIVE\",\"reply\":\"Lỗi hệ thống Chatbot\"}");
        }
    }

    @PostMapping(value = "/stream", produces = org.springframework.http.MediaType.TEXT_EVENT_STREAM_VALUE)
    public reactor.core.publisher.Flux<String> streamChat(@RequestBody ChatRequestDto request) {
        Long userId = 1L; // Fake User ID
        java.util.List<java.util.Map<String, String>> mappedHistory = new java.util.ArrayList<>();
        if (request.getHistory() != null) {
            for (var msg : request.getHistory()) {
                mappedHistory.add(java.util.Map.of("role", msg.getRole(), "content", msg.getContent()));
            }
        }
        
        return reactor.core.publisher.Mono.fromCallable(() -> {
            return chatbotService.ask(userId, request.getSessionId(), request.getMessage(), mappedHistory);
        }).subscribeOn(reactor.core.scheduler.Schedulers.boundedElastic())
        .flatMapMany(result -> {
            try {
                String fullReply = (String) result.remove("reply");
                if (fullReply == null) fullReply = "";
                
                result.put("status", "START");
                String startJson = objectMapper.writeValueAsString(result);
                
                // Split by word but keep delimiter using regex lookbehind
                String[] words = fullReply.split("(?<=\\s)|(?=[\\.,!?])");
                reactor.core.publisher.Flux<String> wordFlux = reactor.core.publisher.Flux.fromArray(words)
                    .filter(w -> !w.isEmpty())
                    .delayElements(java.time.Duration.ofMillis(30))
                    .map(word -> {
                        try {
                            return objectMapper.writeValueAsString(java.util.Map.of("chunk", word));
                        } catch(Exception e) { return "{}"; }
                    });
                
                reactor.core.publisher.Flux<String> startFlux = reactor.core.publisher.Flux.just(startJson);
                reactor.core.publisher.Flux<String> endFlux = reactor.core.publisher.Flux.just("{\"status\":\"DONE\"}");
                
                return reactor.core.publisher.Flux.concat(startFlux, wordFlux, endFlux);
            } catch (Exception e) {
                return reactor.core.publisher.Flux.just("{\"status\":\"ERROR\"}");
            }
        });
    }
}
