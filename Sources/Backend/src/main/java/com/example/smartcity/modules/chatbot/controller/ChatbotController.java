package com.example.smartcity.modules.chatbot.controller;

import com.example.smartcity.modules.chatbot.service.ChatbotService;
import com.example.smartcity.modules.chatbot.dto.ChatRequestDto;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * [CONTROLLER] ChatbotController
 * Expose các REST API liên quan đến Trợ lý ảo AI (Bé Rồng), tuân thủ đúng kiến trúc Modular Monolith.
 */
@RestController
@RequestMapping("/api/chatbot")
@RequiredArgsConstructor
@Slf4j
public class ChatbotController {

    private final ChatbotService chatbotService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * GET /api/chatbot/query?q=...&userId=1&sessionId=xxx
     * Trả lời câu hỏi đồng bộ (JSON).
     */
    @GetMapping("/query")
    public ResponseEntity<Map<String, Object>> chat(
            @RequestParam String q,
            @RequestParam(defaultValue = "1") Long userId,
            @RequestParam(required = false) String sessionId) {

        log.info("[API] GET /api/chatbot/query - userId={} | sessionId={} | q='{}'", userId, sessionId, q);
        Map<String, Object> result = chatbotService.ask(userId, sessionId, q, null);
        return ResponseEntity.ok(result);
    }

    /**
     * POST /api/chatbot/stream
     * Trả lời câu hỏi dạng SSE Stream (hiệu ứng gõ phím).
     */
    @PostMapping(value = "/stream", produces = org.springframework.http.MediaType.TEXT_EVENT_STREAM_VALUE)
    public reactor.core.publisher.Flux<String> streamChat(@RequestBody ChatRequestDto request) {
        log.info("💬 [API STREAM] POST /api/chatbot/stream — sessionId={} | message='{}'", request.getSessionId(), request.getMessage());
        Long userId = 1L; // Fake User ID for public UI testing
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

    /**
     * GET /api/chatbot/chat-history?userId=1
     * Lấy lịch sử chat của người dùng.
     */
    @GetMapping("/chat-history")
    public ResponseEntity<List<?>> chatHistory(
            @RequestParam(defaultValue = "1") Long userId) {

        log.info("[API] GET /api/chatbot/chat-history - userId={}", userId);
        var history = chatbotService.getHistory(userId);
        return ResponseEntity.ok(history);
    }

    /**
     * GET /api/chatbot/chat-stats
     * Thống kê tổng số câu hỏi chatbot đã xử lý.
     */
    @GetMapping("/chat-stats")
    public ResponseEntity<Map<String, Object>> chatStats() {
        return ResponseEntity.ok(chatbotService.getStats());
    }

    /**
     * GET /api/chatbot/chat-sessions?userId=1
     * Lấy danh sách sessions của người dùng.
     */
    @GetMapping("/chat-sessions")
    public ResponseEntity<List<Map<String, Object>>> chatSessions(
            @RequestParam(defaultValue = "1") Long userId) {

        log.info("[API] GET /api/chatbot/chat-sessions - userId={}", userId);
        return ResponseEntity.ok(chatbotService.getSessionsByUserId(userId));
    }

    /**
     * GET /api/chatbot/chat-sessions/{sessionId}?userId=1
     * Lấy toàn bộ tin nhắn trong session cụ thể.
     */
    @GetMapping("/chat-sessions/{sessionId}")
    public ResponseEntity<List<Map<String, Object>>> chatSessionMessages(
            @PathVariable String sessionId,
            @RequestParam(defaultValue = "1") Long userId) {

        log.info("[API] GET /api/chatbot/chat-sessions/{} - userId={}", sessionId, userId);
        return ResponseEntity.ok(chatbotService.getSessionMessages(userId, sessionId));
    }

    /**
     * POST /api/chatbot/rate?messageId=xxx&rating=1
     * Đánh giá câu trả lời của bot.
     */
    @PostMapping("/rate")
    public ResponseEntity<Map<String, Object>> rateMessage(
            @RequestParam String messageId,
            @RequestParam int rating) {

        log.info("[API] POST /api/chatbot/rate - messageId={} rating={}", messageId, rating);

        if (rating != 1 && rating != -1) {
            return ResponseEntity.badRequest()
                .body(Map.of("success", false, "message", "Rating phải là 1 hoặc -1"));
        }

        boolean success = chatbotService.rateMessage(messageId, rating);
        return ResponseEntity.ok(Map.of(
            "success", success,
            "message", success ? "Cảm ơn phản hồi của bạn!" : "Không tìm thấy tin nhắn"
        ));
    }
}
