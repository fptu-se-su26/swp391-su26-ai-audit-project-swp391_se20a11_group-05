package com.example.smartcity.modules.chatbot.service;

import com.example.smartcity.ai_orchestrator.adapter.GroqAdapter;
import com.example.smartcity.modules.chatbot.entity.ChatHistory;
import com.example.smartcity.modules.chatbot.entity.ChatIntent;
import com.example.smartcity.modules.user.entity.User;
import com.example.smartcity.rag.generation.HybridRagOrchestrator;
import com.example.smartcity.rag.model.RagRequest;
import com.example.smartcity.rag.model.RagResponse;
import com.example.smartcity.rag.model.RetrievalOptions;
import com.example.smartcity.modules.chatbot.repository.ChatHistoryRepository;
import com.example.smartcity.modules.user.repository.UserRepository;
import com.example.smartcity.modules.feedback.repository.FeedbackRepository;
import com.example.smartcity.modules.feedback.entity.Feedback;
import com.example.smartcity.modules.feedback.service.FeedbackService;
import com.example.smartcity.modules.feedback.dto.FeedbackRequest;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatbotService {

    private final HybridRagOrchestrator ragOrchestrator;
    private final ChatHistoryRepository chatHistoryRepository;
    private final GroqAdapter groqAdapter;
    private final UserRepository userRepo;
    private final FeedbackRepository feedbackRepository;
    private final FeedbackService feedbackService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String DANANG_DOC_TYPE = "danang-policy";
    private static final String LANGUAGE = "vi";
    private static final Pattern FB_PATTERN = Pattern.compile("(?i)fb-[a-z0-9]+");

    private ChatIntent detectIntent(String message, List<Map<String, String>> historyContext) {
        String lower = message.toLowerCase();
        
        // Nhận diện câu hỏi cá nhân hoặc yêu cầu tổng hợp danh sách/phân tích báo cáo
        if (lower.contains("của tôi") || lower.contains("của mình") || lower.contains("tôi đã gửi")
            || lower.contains("danh sách") || lower.contains("liệt kê") || lower.contains("tóm tắt")
            || lower.contains("xem báo cáo") || lower.contains("vụ việc của") || lower.contains("phản ánh của tôi")) {
            return ChatIntent.REPORT_COPILOT;
        }

        if (FB_PATTERN.matcher(lower).find() 
            || lower.contains("tra cứu") 
            || lower.contains("kiểm tra mã")) {
            return ChatIntent.LOOKUP_FEEDBACK;
        }
        
        if (lower.contains("báo cáo") || lower.contains("phản ánh") 
            || lower.contains("sự cố") || lower.contains("hỏng")
            || lower.contains("ngập") || lower.contains("vỡ")
            || lower.contains("rác") || (lower.contains("đường") && lower.contains("hư"))) {
            return ChatIntent.CREATE_FEEDBACK;
        }
        
        if (lower.contains("bao nhiêu") || lower.contains("số lượng") || lower.contains("bn vụ")
            || lower.contains("tổng") || lower.contains("thống kê") || lower.contains("mấy vụ")) {
            return ChatIntent.STATISTICS;
        }
        
        if (historyContext != null && !historyContext.isEmpty()) {
            String lastUserMsg = "";
            for (int i = historyContext.size() - 1; i >= 0; i--) {
                if ("user".equals(historyContext.get(i).get("role"))) {
                    lastUserMsg = historyContext.get(i).get("content").toLowerCase();
                    break;
                }
            }
            if (lastUserMsg.contains("vụ") || lastUserMsg.contains("bao nhiêu") || lastUserMsg.contains("bn") || lastUserMsg.contains("báo cáo")) {
                if (lower.contains("môi trường") || lower.contains("giao thông") || lower.contains("trật tự")) {
                     return ChatIntent.STATISTICS;
                }
            }
        }
        
        if (lower.contains("luật") || lower.contains("quy định")
            || lower.contains("thủ tục") || lower.contains("pháp lý")) {
            return ChatIntent.QA_LEGAL;
        }
        
        return ChatIntent.GENERAL;
    }

    @Transactional
    public Map<String, Object> ask(Long userId, String sessionId, String question, List<Map<String, String>> historyContext) {
        long start = System.currentTimeMillis();
        log.info("📨 [Chatbot] userId={} | sessionId={} | question='{}'", userId, sessionId, question);

        User user = userRepo.findById(userId).orElseGet(() -> 
            userRepo.findAll().stream().findFirst()
                    .orElseThrow(() -> new EntityNotFoundException("DB không có user"))
        );

        ChatIntent intent = detectIntent(question, historyContext);
        log.info("🎯 [Intent] Phân tích nhanh intent: {}", intent);

        Map<String, Object> responseData;

        switch (intent) {
            case LOOKUP_FEEDBACK:
                responseData = handleLookupFeedback(question);
                break;
            case CREATE_FEEDBACK:
                responseData = handleCreateFeedback(question, user, historyContext);
                break;
            case QA_LEGAL:
                responseData = handleQALegal(question);
                break;
            case STATISTICS:
                responseData = handleStatistics(question, historyContext);
                break;
            case REPORT_COPILOT:
                responseData = handleReportCopilot(question, user, historyContext);
                break;
            case GENERAL:
            default:
                responseData = handleGeneral(question);
                break;
        }

        long latencyMs = System.currentTimeMillis() - start;
        responseData.put("latencyMs", latencyMs);
        responseData.put("provider", groqAdapter.isHealthy() ? "GROQ" : "MOCK");

        String feedbackCreated = (String) responseData.get("trackingCode");

        ChatHistory history = ChatHistory.builder()
                .user(user)
                .question(question)
                .answer((String) responseData.get("reply"))
                .intent(intent)
                .sessionId(sessionId)
                .feedbackTrackingCode(feedbackCreated != null && !feedbackCreated.isEmpty() ? feedbackCreated : null)
                .docType(DANANG_DOC_TYPE)
                .aiProvider(groqAdapter.isHealthy() ? "GROQ" : "MOCK")
                .latencyMs(latencyMs)
                .build();

        chatHistoryRepository.save(history);
        return responseData;
    }

    private Map<String, Object> handleLookupFeedback(String question) {
        Matcher matcher = FB_PATTERN.matcher(question);
        String trackingCode = matcher.find() ? matcher.group().toUpperCase() : null;

        if (trackingCode == null) {
            return Map.of(
                "intent", "LOOKUP",
                "emotion", "NEUTRAL",
                "reply", "Bạn muốn tra cứu phản ánh nào ạ? Vui lòng cung cấp mã bắt đầu bằng FB-..."
            );
        }

        Optional<Feedback> feedbackOpt = feedbackRepository.findByTrackingCode(trackingCode);
        if (feedbackOpt.isEmpty()) {
            return Map.of(
                "intent", "LOOKUP",
                "emotion", "NEGATIVE",
                "reply", "Dạ em không tìm thấy phản ánh nào có mã " + trackingCode + " trong hệ thống. Bạn kiểm tra lại mã giúp em nhé!"
            );
        }

        Feedback fb = feedbackOpt.get();
        String reply = String.format("Phản ánh **%s** của bạn hiện đang ở trạng thái **%s**. Lĩnh vực: %s. Địa điểm: %s. Cảm ơn bạn đã đóng góp ý kiến!", 
                                    fb.getTrackingCode(), fb.getStatus().name(), fb.getCategory().getName(), fb.getAddressDetails());
        return Map.of(
            "intent", "LOOKUP",
            "emotion", "POSITIVE",
            "reply", reply,
            "trackingCode", fb.getTrackingCode()
        );
    }

    private Map<String, Object> handleCreateFeedback(String question, User user, List<Map<String, String>> historyContext) {
        String systemPrompt = "Bạn là trợ lý ảo hỗ trợ tạo phản ánh sự cố. Hãy phân tích câu hỏi của người dùng và các câu trước đó để lấy 'location' và 'category' và 'description'. " +
        "Chỉ trả về JSON. Các trường: intent (CREATE_FEEDBACK), emotion (NEGATIVE/NEUTRAL), reply (trả lời người dùng), location (nếu có), category (BẮT BUỘC chọn 1 trong 6 mã: TRAFFIC, URBAN_INFRASTRUCTURE, ENVIRONMENT, PUBLIC_SECURITY, CONSTRUCTION, FIRE_SAFETY), description (nếu có), needsMoreInfo (mảng chứa 'LOCATION', 'DESCRIPTION' nếu thiếu).";

        StringBuilder context = new StringBuilder();
        if (historyContext != null) {
            for (Map<String, String> msg : historyContext) {
                context.append(msg.get("role")).append(": ").append(msg.get("content")).append("\n");
            }
        }
        context.append("user: ").append(question);

        String json = groqAdapter.generateStructuredResponseAsync(systemPrompt, context.toString()).join();
        json = json.replaceAll("(?s)^```json\\s*", "").replaceAll("(?s)\\s*```$", "").trim();
        
        try {
            Map<String, Object> parsed = objectMapper.readValue(json, Map.class);
            List<String> needsMoreInfo = (List<String>) parsed.getOrDefault("needsMoreInfo", new ArrayList<>());
            
            if (needsMoreInfo.isEmpty()) {
                // Đủ thông tin, gọi service tạo feedback
                FeedbackRequest req = new FeedbackRequest();
                req.setTitle("Phản ánh qua Chatbot");
                req.setDescription((String) parsed.get("description"));
                String address = (String) parsed.get("location");
                req.setAddressDetails(address);
                
                String categoryCode = (String) parsed.getOrDefault("category", "URBAN_INFRASTRUCTURE");
                req.setCategoryCode(categoryCode);
                
                // Mặc định tọa độ trung tâm Đà Nẵng
                double lat = 16.0544;
                double lon = 108.2022;
                
                // Gọi Nominatim Forward Geocoding
                try {
                    String url = "https://nominatim.openstreetmap.org/search?format=json&q=" + java.net.URLEncoder.encode(address + ", Da Nang, Vietnam", "UTF-8");
                    org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
                    org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
                    headers.set("User-Agent", "SmartCity/1.0");
                    org.springframework.http.ResponseEntity<java.util.List> response = restTemplate.exchange(url, org.springframework.http.HttpMethod.GET, new org.springframework.http.HttpEntity<>(headers), java.util.List.class);
                    java.util.List<Map> results = response.getBody();
                    if (results != null && !results.isEmpty()) {
                        Map<String, Object> firstMatch = results.get(0);
                        lat = Double.parseDouble(firstMatch.get("lat").toString());
                        lon = Double.parseDouble(firstMatch.get("lon").toString());
                    }
                } catch (Exception e) {
                    log.warn("Lỗi Geocoding cho địa chỉ {}: {}", address, e.getMessage());
                }
                
                req.setLatitude(lat);
                req.setLongitude(lon);
                
                try {
                    Feedback created = feedbackService.createFeedback(req, user.getUsername());
                    parsed.put("trackingCode", created.getTrackingCode());
                    parsed.put("reply", "✅ Phản ánh của bạn đã được ghi nhận thành công! Mã tra cứu của bạn là **" + created.getTrackingCode() + "**.");
                } catch (Exception e) {
                    parsed.put("reply", "Rất tiếc, đã có lỗi xảy ra khi tạo phản ánh: " + e.getMessage());
                }
            } else {
                if (!parsed.containsKey("reply") || parsed.get("reply") == null || ((String)parsed.get("reply")).isEmpty()) {
                    parsed.put("reply", "Em đã ghi nhận thông tin. Cô chú vui lòng cung cấp thêm: " + String.join(", ", needsMoreInfo));
                }
            }
            return parsed;
        } catch (Exception e) {
            log.error("Parse JSON CREATE_FEEDBACK failed", e);
            return Map.of("intent", "CREATE_FEEDBACK", "reply", "Dạ em đã ghi nhận sự cố, bạn có thể cho em thêm thông tin địa chỉ cụ thể không ạ?");
        }
    }

    private Map<String, Object> handleQALegal(String question) {
        RetrievalOptions options = RetrievalOptions.defaults(DANANG_DOC_TYPE, LANGUAGE);
        RagRequest request = new RagRequest(question, options);
        RagResponse ragResponse = ragOrchestrator.query(request);

        return new java.util.HashMap<>(Map.of(
            "intent", "QA_LEGAL",
            "emotion", "NEUTRAL",
            "reply", ragResponse.answer(),
            "citations", ragResponse.citations()
        ));
    }

    private Map<String, Object> handleStatistics(String question, List<Map<String, String>> historyContext) {
        long total = feedbackRepository.count();
        java.time.LocalDateTime startOfDay = java.time.LocalDate.now().atStartOfDay();
        java.time.LocalDateTime endOfDay = java.time.LocalDate.now().atTime(23, 59, 59);
        List<Feedback> todayFeedbacks = feedbackRepository.findByCreatedAtBetween(startOfDay, endOfDay);
        int todayCount = todayFeedbacks.size();

        Map<String, Long> categoryCounts = todayFeedbacks.stream()
            .collect(Collectors.groupingBy(
                f -> f.getCategoryName() != null ? f.getCategoryName() : "Khác", 
                Collectors.counting()
            ));

        StringBuilder statsText = new StringBuilder();
        statsText.append(String.format("- Tổng số phản ánh từ trước đến nay: %d\n", total));
        statsText.append(String.format("- Số phản ánh mới trong hôm nay: %d\n", todayCount));
        if (!categoryCounts.isEmpty()) {
            statsText.append("- Chi tiết theo lĩnh vực (hôm nay):\n");
            categoryCounts.forEach((cat, count) -> {
                statsText.append(String.format("  + %s: %d vụ\n", cat, count));
            });
        }

        String systemPrompt = """
            Bạn là Trợ lý AI Đà Nẵng Lắng Nghe.
            Nhiệm vụ: Trả lời câu hỏi thống kê của người dân dựa trên SỐ LIỆU THỰC TẾ dưới đây:
            
            %s
            
            Quy tắc: 
            - Nếu người dân hỏi chung, hãy báo cáo tóm tắt.
            - Nếu người dân hỏi cụ thể một lĩnh vực (ví dụ: môi trường, giao thông), hãy tìm trong chi tiết lĩnh vực để trả lời.
            - Trả lời ngắn gọn, thân thiện, súc tích (dưới 100 chữ).
            """.formatted(statsText.toString());

        StringBuilder context = new StringBuilder();
        if (historyContext != null) {
            for (Map<String, String> msg : historyContext) {
                context.append(msg.get("role")).append(": ").append(msg.get("content")).append("\n");
            }
        }
        context.append("user: ").append(question);

        String reply = "Dạ hiện tại em không thể lấy số liệu thống kê. Bạn vui lòng thử lại sau nhé!";
        try {
            reply = groqAdapter.generateResponseAsync(systemPrompt, context.toString()).join();
        } catch (Exception e) {
            log.error("Lỗi khi dùng LLM để sinh câu trả lời thống kê", e);
        }

        return new java.util.HashMap<>(Map.of(
            "intent", "STATISTICS",
            "emotion", "POSITIVE",
            "reply", reply
        ));
    }

    private Map<String, Object> handleReportCopilot(String question, User user, List<Map<String, String>> historyContext) {
        log.info("🤖 [AI Copilot] Handling report query for user: {}", user.getUsername());
        
        // 1. Lấy phản ánh của riêng user này trước
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(0, 10, org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt"));
        org.springframework.data.domain.Page<Feedback> myFeedbacksPage = feedbackRepository.searchMyFeedbacks(
            user.getId(), null, null, List.of(), false, null,
            java.time.LocalDateTime.now().minusYears(1), java.time.LocalDateTime.now().plusDays(1), 
            pageable
        );
        List<Feedback> myFeedbacks = myFeedbacksPage.getContent();

        // 2. Lấy thêm một số phản ánh công cộng gần đây đề phòng câu hỏi mang tính cộng đồng
        org.springframework.data.domain.Page<Feedback> publicFeedbacksPage = feedbackRepository.searchPublicFeedbacks(
            null, null, List.of(), false, null,
            java.time.LocalDateTime.now().minusMonths(3), java.time.LocalDateTime.now().plusDays(1),
            null, List.of(), false,
            pageable
        );
        List<Feedback> publicFeedbacks = publicFeedbacksPage.getContent();

        // 3. Xây dựng Context thông tin từ database
        StringBuilder feedbackContext = new StringBuilder();
        feedbackContext.append("DANH SÁCH PHẢN ÁNH CỦA NGƯỜI DÙNG HIỆN TẠI (Tên đăng nhập: ").append(user.getUsername()).append("):\n");
        if (myFeedbacks.isEmpty()) {
            feedbackContext.append("- Bạn chưa gửi phản ánh nào trong hệ thống.\n");
        } else {
            for (Feedback fb : myFeedbacks) {
                feedbackContext.append(String.format("- Mã: %s, Tiêu đề: %s, Trạng thái: %s, Lĩnh vực: %s, Địa điểm: %s, Ngày gửi: %s, Mô tả: %s\n",
                    fb.getTrackingCode(), fb.getTitle(), fb.getStatus().name(), 
                    fb.getCategory() != null ? fb.getCategory().getName() : fb.getCategoryName(),
                    fb.getAddressDetails(), fb.getCreatedAt(), fb.getDescription()));
            }
        }

        feedbackContext.append("\nDANH SÁCH PHẢN ÁNH CỘNG ĐỒNG KHÁC (GẦN ĐÂY):\n");
        for (Feedback fb : publicFeedbacks) {
            // Không lặp lại phản ánh của chính mình trong danh mục cộng đồng để tránh trùng lặp thông tin
            if (myFeedbacks.stream().anyMatch(my -> my.getId().equals(fb.getId()))) {
                continue;
            }
            feedbackContext.append(String.format("- Mã: %s, Tiêu đề: %s, Trạng thái: %s, Lĩnh vực: %s, Địa điểm: %s, Ngày gửi: %s, Mô tả: %s\n",
                fb.getTrackingCode(), fb.getTitle(), fb.getStatus().name(),
                fb.getCategory() != null ? fb.getCategory().getName() : fb.getCategoryName(),
                fb.getAddressDetails(), fb.getCreatedAt(), fb.getDescription()));
        }

        // 4. Nếu câu hỏi có liên quan đến pháp lý, luật lệ, quy chuẩn xử lý -> Gọi thêm RAG để lấy tài liệu
        String ragKnowledge = "";
        String lowerQ = question.toLowerCase();
        if (lowerQ.contains("quy định") || lowerQ.contains("luật") || lowerQ.contains("quy chuẩn") 
            || lowerQ.contains("bao lâu") || lowerQ.contains("thời hạn") || lowerQ.contains("trách nhiệm")) {
            try {
                RetrievalOptions options = RetrievalOptions.defaults(DANANG_DOC_TYPE, LANGUAGE);
                RagRequest request = new RagRequest(question, options);
                RagResponse ragResponse = ragOrchestrator.query(request);
                ragKnowledge = "TÀI LIỆU QUY ĐỊNH PHÁP LÝ (ĐÀ NẴNG):\n" + ragResponse.answer() + "\n";
            } catch (Exception e) {
                log.warn("Lỗi khi truy vấn RAG quy định pháp lý cho AI Copilot: {}", e.getMessage());
            }
        }

        // 5. Chuẩn bị System Prompt
        String systemPrompt = String.format("""
            Bạn là Trợ lý AI Quản lý Phản ánh Đô thị cá nhân (AI Copilot) của người dùng: %s.
            Nhiệm vụ: Trả lời tất cả thắc mắc của người dùng dựa trên thông tin thực tế từ cơ sở dữ liệu hệ thống đô thị và tài liệu quy định pháp lý được cung cấp dưới đây.
            
            %s
            
            %s
            
            Quy tắc trả lời:
            1. Trả lời trực tiếp, rõ ràng, chiết xuất đúng thông tin. Không giả định những điều không có trong dữ liệu.
            2. Sử dụng định dạng Markdown (đặc biệt là in đậm mã phản ánh như **FB-XXXX** để người dùng dễ quan sát).
            3. Nếu người dùng hỏi về thời hạn xử lý của một phản ánh, hãy đối chiếu trạng thái thực tế của phản ánh đó với tài liệu quy định pháp lý (nếu có).
            4. Tông giọng thân thiện, lễ phép ("Dạ", "Cô chú", "Sếp").
            """, user.getUsername(), feedbackContext.toString(), ragKnowledge);

        // 6. Xây dựng Context hội thoại
        StringBuilder conversationContext = new StringBuilder();
        if (historyContext != null) {
            for (Map<String, String> msg : historyContext) {
                conversationContext.append(msg.get("role")).append(": ").append(msg.get("content")).append("\n");
            }
        }
        conversationContext.append("user: ").append(question);

        String reply = "Dạ, em đang gặp chút sự cố kết nối dữ liệu. Xin vui lòng thử lại sau ít phút ạ!";
        try {
            reply = groqAdapter.generateResponseAsync(systemPrompt, conversationContext.toString()).join();
        } catch (Exception e) {
            log.error("Lỗi khi dùng LLM sinh câu trả lời AI Copilot", e);
        }

        return new java.util.HashMap<>(Map.of(
            "intent", "REPORT_COPILOT",
            "emotion", "POSITIVE",
            "reply", reply
        ));
    }

    private Map<String, Object> handleGeneral(String question) {
        RetrievalOptions options = RetrievalOptions.defaults(DANANG_DOC_TYPE, LANGUAGE);
        RagRequest request = new RagRequest(question, options);
        RagResponse ragResponse = ragOrchestrator.query(request);

        return new java.util.HashMap<>(Map.of(
            "intent", "SMALLTALK",
            "emotion", "POSITIVE",
            "reply", ragResponse.answer()
        ));
    }

    @Transactional(readOnly = true)
    public List<ChatHistory> getHistory(Long userId) {
        return chatHistoryRepository.findRecentByUserId(userId, 20);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getStats() {
        long totalChats = chatHistoryRepository.count();
        List<Object[]> byProvider = chatHistoryRepository.countByProvider();
        return Map.of("totalChats", totalChats, "byProvider", byProvider);
    }

    @Transactional
    public reactor.core.publisher.Flux<String> askStream(Long userId, String question) {
        return reactor.core.publisher.Flux.empty(); // Not prioritized in this update
    }
}
