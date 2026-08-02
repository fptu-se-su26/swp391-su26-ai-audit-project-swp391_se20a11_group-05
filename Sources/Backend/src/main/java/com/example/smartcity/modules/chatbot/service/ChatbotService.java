package com.example.smartcity.modules.chatbot.service;

import com.example.smartcity.ai_orchestrator.adapter.GroqAdapter;
import com.example.smartcity.ai_orchestrator.adapter.AiProviderAdapter;
import com.example.smartcity.ai_orchestrator.adapter.GeminiAdapter;
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
    private final com.example.smartcity.ai_orchestrator.router.AiRouterService aiRouterService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String DANANG_DOC_TYPE = "danang-policy";
    private static final String LANGUAGE = "vi";
    private static final Pattern FB_PATTERN = Pattern.compile("(?i)(fb|dn)-[a-z0-9]+");

    private ChatIntent detectIntent(String message, List<Map<String, String>> historyContext) {
        String lower = message.toLowerCase();

        // ── NAVIGATION_GUIDE: hỏi về cách dùng app, điều hướng ──
        if (lower.contains("làm thế nào") || lower.contains("làm sao") || lower.contains("hướng dẫn")
            || lower.contains("ở đâu") || lower.contains("trang nào") || lower.contains("menu")
            || lower.contains("chức năng") || lower.contains("tính năng") || lower.contains("cách dùng")
            || lower.contains("có thể làm gì") || lower.contains("bạn có thể") || lower.contains("bot có thể")
            || lower.contains("hỗ trợ gì") || lower.contains("giúp gì") || lower.contains("app có gì")) {
            return ChatIntent.NAVIGATION_GUIDE;
        }
        
        // ── REPORT_COPILOT: câu hỏi cá nhân về phản ánh ──
        if (lower.contains("của tôi") || lower.contains("của mình") || lower.contains("tôi đã gửi")
            || lower.contains("danh sách") || lower.contains("liệt kê") || lower.contains("tóm tắt")
            || lower.contains("xem báo cáo") || lower.contains("vụ việc của") || lower.contains("phản ánh của tôi")
            || (lower.contains("tôi") && (lower.contains("báo cáo") || lower.contains("phản ánh")) && (lower.contains("mấy") || lower.contains("có") || lower.contains("xem")))) {
            return ChatIntent.REPORT_COPILOT;
        }

        // ── LOOKUP_FEEDBACK: tra cứu theo mã ──
        if (FB_PATTERN.matcher(lower).find() 
            || lower.contains("tra cứu") 
            || lower.contains("kiểm tra mã")
            || lower.contains("dn-")) {
            return ChatIntent.LOOKUP_FEEDBACK;
        }
        
        // ── CREATE_FEEDBACK: báo cáo sự cố mới ──
        if (lower.contains("báo cáo") || lower.contains("phản ánh") 
            || lower.contains("sự cố") || lower.contains("hỏng")
            || lower.contains("ngập") || lower.contains("vỡ")
            || lower.contains("rác") || (lower.contains("đường") && lower.contains("hư"))) {
            return ChatIntent.CREATE_FEEDBACK;
        }
        
        // ── STATISTICS: thống kê ──
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
        
        // ── TOXIC: Nhận diện chửi bậy, văng tục ──
        if (lower.contains("đm") || lower.contains("địt") || lower.contains("vcl") || lower.contains("ngu") || lower.contains("óc chó") || lower.contains("cặc") || lower.contains("lồn") || lower.matches(".*\\bfuck\\b.*") || lower.matches(".*\\bshit\\b.*")) {
            return ChatIntent.TOXIC;
        }

        // ── QA_LEGAL: pháp lý, quy định ──
        if (lower.contains("luật") || lower.contains("quy định")
            || lower.contains("thủ tục") || lower.contains("pháp lý")) {
            return ChatIntent.QA_LEGAL;
        }

        // ── SEARCH_PUBLIC_FEEDBACKS: tra cứu cộng đồng ──
        if ((lower.contains("phản ánh") || lower.contains("phản án") || lower.contains("vấn đề") || lower.contains("sự cố") || lower.contains("tình trạng") || lower.contains("có ai") || lower.contains("có vụ"))
            && (lower.contains("ở") || lower.contains("tại") || lower.contains("khu vực") || lower.contains("quận") || lower.contains("phường") || lower.contains("bên") || lower.contains("địa bàn"))) {
            return ChatIntent.SEARCH_PUBLIC_FEEDBACKS;
        }

        // ── DISCOVER_CAMPAIGN: chiến dịch tình nguyện ──
        if (lower.contains("chiến dịch") || lower.contains("sự kiện")
            || lower.contains("tình nguyện") || lower.contains("lễ hội")
            || lower.contains("hiến máu") || lower.contains("dọn rác")) {
            return ChatIntent.DISCOVER_CAMPAIGN;
        }
        
        return ChatIntent.GENERAL;
    }

    /**
     * Tạo danh sách câu hỏi gợi ý tiếp theo dựa theo intent.
     */
    private List<String> buildSuggestedFollowUps(ChatIntent intent) {
        return switch (intent) {
            case LOOKUP_FEEDBACK -> List.of(
                "Phản ánh của tôi được xử lý trong bao lâu?",
                "Tôi muốn gửi phản ánh mới",
                "Xem thống kê sự cố hôm nay"
            );
            case CREATE_FEEDBACK -> List.of(
                "Tôi có thể theo dõi phản ánh bằng mã không?",
                "Khu vực nào được hỗ trợ?",
                "Quy trình xử lý mất bao lâu?"
            );
            case STATISTICS -> List.of(
                "Lĩnh vực nào có nhiều sự cố nhất?",
                "Phản ánh của tôi có trong đó không?",
                "Khám phá chiến dịch tình nguyện"
            );
            case QA_LEGAL -> List.of(
                "Thời hạn xử lý phản ánh là bao lâu?",
                "Ai chịu trách nhiệm xử lý?",
                "Tôi muốn gửi phản ánh mới"
            );
            case REPORT_COPILOT -> List.of(
                "Cập nhật mới nhất về phản ánh của tôi?",
                "Phản ánh nào đang chờ xử lý?",
                "Liên hệ đơn vị xử lý thế nào?"
            );
            case DISCOVER_CAMPAIGN -> List.of(
                "Làm sao để đăng ký tham gia?",
                "Chiến dịch nào gần khu vực tôi?",
                "Tôi đã đăng ký những chiến dịch nào?"
            );
            case NAVIGATION_GUIDE -> List.of(
                "Làm sao để gửi phản ánh sự cố?",
                "Tra cứu phản ánh của tôi",
                "Xem thống kê cộng đồng"
            );
            default -> List.of(
                "Hướng dẫn sử dụng ứng dụng",
                "Gửi phản ánh sự cố",
                "Đường dây nóng hỗ trợ"
            );
        };
    }

    public java.util.Optional<User> getUserByUsername(String username) {
        return userRepo.findByUsername(username);
    }

    public Map<String, Object> ask(Long userId, String sessionId, String question, List<Map<String, String>> historyContext) {
        long start = System.currentTimeMillis();
        log.info("📨 [Chatbot] userId={} | sessionId={} | question='{}'", userId, sessionId, question);

        User user = userRepo.findById(userId).orElseGet(() -> 
            userRepo.findAll().stream().findFirst()
                    .orElseThrow(() -> new EntityNotFoundException("DB không có user"))
        );

        ChatIntent intent = detectIntent(question, historyContext);
        log.info("🎯 [Intent] Phân tích nhanh intent: {}", intent);

        // [CỐ ĐỊNH GROQ] Ép toàn bộ Chatbot dùng Groq để giảm tải và tránh xung đột với Gemini API
        AiProviderAdapter bestProvider = groqAdapter;
        String activeProviderName = "GROQ_LLAMA3";
        log.info("🔌 [Router] Chatbot cố định câu hỏi sang Provider: {}", activeProviderName);

        Map<String, Object> responseData;

        if (userId == null && intent == ChatIntent.REPORT_COPILOT) {
            responseData = new java.util.HashMap<>();
            responseData.put("intent", intent.name());
            responseData.put("emotion", "NEUTRAL");
            responseData.put("reply", "Dạ, cô chú cần đăng nhập tài khoản để tra cứu các phản ánh cá nhân ạ. Cô chú có muốn đăng nhập ngay bây giờ không? 😊");
            responseData.put("action", "NAVIGATE");
            responseData.put("navigateTo", "/login");
        } else {
            switch (intent) {
                case LOOKUP_FEEDBACK:
                    responseData = handleLookupFeedback(question);
                    break;
                case CREATE_FEEDBACK:
                    responseData = handleCreateFeedback(bestProvider, question, user, historyContext);
                    break;
                case QA_LEGAL:
                    responseData = handleQALegal(question);
                    break;
                case STATISTICS:
                    responseData = handleStatistics(bestProvider, question, historyContext);
                    break;
                case REPORT_COPILOT:
                    responseData = handleReportCopilot(bestProvider, question, user, historyContext);
                    break;
                case DISCOVER_CAMPAIGN:
                    responseData = handleDiscoverCampaign(question);
                    break;
                case NAVIGATION_GUIDE:
                    responseData = handleNavigationGuide(question);
                    break;
                case SEARCH_PUBLIC_FEEDBACKS:
                    responseData = handleSearchPublicFeedbacks(bestProvider, question, historyContext);
                    break;
                case TOXIC:
                    responseData = new java.util.HashMap<>();
                    responseData.put("intent", "TOXIC");
                    responseData.put("emotion", "NEGATIVE");
                    responseData.put("reply", "Dạ, Đà Nẵng là thành phố văn minh đáng sống, sếp vui lòng giữ bình tĩnh và dùng từ ngữ chuẩn mực giúp em nhé! 🥺 Em chỉ là Bot thôi ạ.");
                    break;
                case GENERAL:
                default:
                    responseData = handleGeneral(question);
                    break;
            }
        }

        // Thêm suggested follow-up questions vào mọi response
        if (!responseData.containsKey("suggestedFollowUps")) {
            responseData.put("suggestedFollowUps", buildSuggestedFollowUps(intent));
        }

        long latencyMs = System.currentTimeMillis() - start;
        responseData.put("latencyMs", latencyMs);
        responseData.put("provider", activeProviderName);

        String feedbackCreated = (String) responseData.get("trackingCode");

        // Tìm xem session này đã có tin nhắn nào trước đó chưa để giữ nguyên tên session gốc
        String sessionTitle = "Phiên hội thoại";
        if (sessionId != null) {
            java.util.Optional<ChatHistory> firstMsg = chatHistoryRepository.findFirstBySessionIdOrderByCreatedAtAsc(sessionId);
            if (firstMsg.isPresent()) {
                sessionTitle = firstMsg.get().getSessionName();
            } else {
                sessionTitle = question != null && question.length() > 0
                    ? (question.length() > 50 ? question.substring(0, 50) + "..." : question)
                    : "Phiên hội thoại";
            }
        }

        ChatHistory history = ChatHistory.builder()
                .user(user)
                .question(question)
                .answer((String) responseData.get("reply"))
                .intent(intent)
                .sessionId(sessionId)
                .sessionName(sessionTitle)
                .feedbackTrackingCode(feedbackCreated != null && !feedbackCreated.isEmpty() ? feedbackCreated : null)
                .docType(DANANG_DOC_TYPE)
                .aiProvider(activeProviderName)
                .latencyMs(latencyMs)
                .build();

        ChatHistory saved = chatHistoryRepository.save(history);
        responseData.put("messageId", saved.getId().toString()); // Trả về ID để Frontend dùng cho rating
        return responseData;
    }

    /**
     * Lấy danh sách sessions của user (Feature 4: Session History).
     * Trả về tối đa 20 session gần nhất.
     */
    public List<Map<String, Object>> getSessionsByUserId(Long userId) {
        return chatHistoryRepository.findSessionsByUserId(userId).stream()
            .map(row -> {
                Map<String, Object> session = new java.util.HashMap<>();
                session.put("sessionId",   row[0]);
                session.put("sessionName", row[1] != null ? row[1] : "Phiên hội thoại");
                session.put("lastMessage", row[2]);
                session.put("messageCount", row[3]);
                return session;
            })
            .collect(Collectors.toList());
    }

    /**
     * Lấy toàn bộ tin nhắn trong một session cụ thể.
     */
    public List<Map<String, Object>> getSessionMessages(Long userId, String sessionId) {
        return chatHistoryRepository.findByUserIdAndSessionId(userId, sessionId).stream()
            .map(h -> {
                Map<String, Object> msg = new java.util.HashMap<>();
                msg.put("messageId",  h.getId().toString());
                msg.put("question",   h.getQuestion());
                msg.put("answer",     h.getAnswer());
                msg.put("intent",     h.getIntent() != null ? h.getIntent().name() : "GENERAL");
                msg.put("createdAt",  h.getCreatedAt().toString());
                msg.put("latencyMs",  h.getLatencyMs());
                msg.put("provider",   h.getAiProvider());
                msg.put("userRating", h.getUserRating());
                return msg;
            })
            .collect(Collectors.toList());
    }

    private Map<String, Object> handleLookupFeedback(String question) {
        Matcher matcher = FB_PATTERN.matcher(question);
        String trackingCode = matcher.find() ? matcher.group().toUpperCase() : null;

        String systemPrompt = "Bạn là Trợ lý AI Đà Nẵng Lắng Nghe. Người dùng muốn tra cứu mã phản ánh. Dưới đây là thông tin tra cứu từ hệ thống:\n";
        
        Optional<Feedback> feedbackOpt = trackingCode != null ? feedbackRepository.findByTrackingCode(trackingCode) : Optional.empty();

        if (trackingCode == null) {
            systemPrompt += "Lỗi: Không tìm thấy mã hợp lệ trong câu hỏi của người dùng.\n";
        } else if (feedbackOpt.isEmpty()) {
            systemPrompt += "Lỗi: Mã " + trackingCode + " không tồn tại trong hệ thống.\n";
        } else {
            Feedback fb = feedbackOpt.get();
            systemPrompt += String.format("- Mã: %s\n- Trạng thái: %s\n- Lĩnh vực: %s\n- Địa điểm: %s\n- Ngày gửi: %s\n- Mô tả: %s\n",
                fb.getTrackingCode(), fb.getStatus().name(), fb.getCategory() != null ? fb.getCategory().getName() : "Khác",
                fb.getAddressDetails(), fb.getCreatedAt(), fb.getDescription());
        }
        
        systemPrompt += "\nHãy trả lời tự nhiên, thân thiện và ngắn gọn báo cho người dùng biết kết quả tra cứu. Nếu có mã thì in đậm mã. Giữ nguyên tông giọng lễ phép 'Dạ', 'cô chú'.";
        
        String reply = "Dạ, hệ thống đang bận, bạn vui lòng thử lại sau nhé!";
        try {
            reply = aiRouterService.executeWithFallback(groqAdapter, systemPrompt, question).join();
        } catch (Exception e) {
            log.error("Lỗi khi sinh câu trả lời LOOKUP", e);
        }

        java.util.Map<String, Object> res = new java.util.HashMap<>();
        res.put("intent", "LOOKUP");
        res.put("emotion", trackingCode != null && feedbackOpt.isPresent() ? "POSITIVE" : "NEGATIVE");
        res.put("reply", reply);
        if (trackingCode != null && feedbackOpt.isPresent()) {
            Feedback fb = feedbackOpt.get();
            res.put("trackingCode", fb.getTrackingCode());
            res.put("feedbackStatus", fb.getStatus().name());
            res.put("feedbackCategory", fb.getCategory() != null ? fb.getCategory().getName() : "Khác");
            res.put("feedbackAddress", fb.getAddressDetails() != null ? fb.getAddressDetails() : "Không xác định");
            res.put("feedbackDescription", fb.getDescription() != null ? fb.getDescription() : "");
            res.put("feedbackCreatedAt", fb.getCreatedAt() != null ? fb.getCreatedAt().toString() : "");
            res.put("feedbackUpdatedAt", fb.getUpdatedAt() != null ? fb.getUpdatedAt().toString() : "");
        }
        return res;
    }

    private Map<String, Object> handleSearchPublicFeedbacks(AiProviderAdapter activeProvider, String question, List<Map<String, String>> historyContext) {
        log.info("🤖 [Search Public] Bóc tách location/category từ câu hỏi: {}", question);
        String systemPrompt = "Bạn là trợ lý AI. Hãy trích xuất địa điểm và lĩnh vực từ câu hỏi. " +
            "Trả về JSON với các field: intent='SEARCH_PUBLIC_FEEDBACKS', location (VD: 'Ngũ Hành Sơn', 'Hải Châu'), category (VD: 'rác thải', 'môi trường'). " +
            "Nếu không có, để rỗng chuỗi.";

        try {
            com.example.smartcity.modules.chatbot.dto.SearchPublicFeedbackAiDto parsed = aiRouterService.executeWithValidation(
                activeProvider, systemPrompt, question, 
                com.example.smartcity.modules.chatbot.dto.SearchPublicFeedbackAiDto.class, 2).join();

            String keyword = (parsed.getLocation() != null) ? parsed.getLocation() : "";
            String category = (parsed.getCategory() != null) ? parsed.getCategory() : "";

            // Gọi repository để tìm kiếm public feedbacks
            org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(0, 5, org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt"));
            org.springframework.data.domain.Page<Feedback> results = feedbackRepository.searchPublicFeedbacks(
                keyword, category, null, false, null, 
                java.time.LocalDateTime.now().minusMonths(6), java.time.LocalDateTime.now(), 
                null, null, false, pageable);

            StringBuilder resultText = new StringBuilder();
            if (results.isEmpty()) {
                resultText.append("Hiện tại không có phản ánh nào");
                if (!keyword.isEmpty()) resultText.append(" ở ").append(keyword);
                if (!category.isEmpty()) resultText.append(" liên quan đến '").append(category).append("'");
                resultText.append(" trên hệ thống cộng đồng.");
            } else {
                resultText.append("Tìm thấy ").append(results.getTotalElements()).append(" phản ánh. Đây là một số phản ánh mới nhất:\n");
                for (Feedback fb : results.getContent()) {
                    resultText.append(String.format("- **%s** (%s): %s. Vị trí: %s. Trạng thái: %s.\n",
                        fb.getTrackingCode(), fb.getCategoryName(), fb.getTitle(), fb.getAddressDetails(), fb.getStatus().name()));
                }
            }

            // Dùng AI để sinh câu trả lời mượt mà hơn
            String conversationalPrompt = "Bạn là AI Đà Nẵng. Hãy trả lời câu hỏi: '" + question + "' dựa trên thông tin sau:\n" + resultText.toString();
            String aiReply = aiRouterService.executeWithFallback(activeProvider, conversationalPrompt, question).join();

            return new java.util.HashMap<>(Map.of(
                "intent", "SEARCH_PUBLIC_FEEDBACKS",
                "emotion", "NEUTRAL",
                "reply", aiReply
            ));
        } catch (Exception e) {
            log.error("Lỗi khi xử lý Search Public Feedbacks", e);
            return new java.util.HashMap<>(Map.of(
                "intent", "SEARCH_PUBLIC_FEEDBACKS",
                "emotion", "NEUTRAL",
                "reply", "Dạ em đang gặp sự cố mạng, không thể tra cứu phản ánh công cộng lúc này. Cố chú thử lại sau nhé!"
            ));
        }
    }

    private Map<String, Object> handleCreateFeedback(AiProviderAdapter activeProvider, String question, User user, List<Map<String, String>> historyContext) {
        String systemPrompt = "Bạn là trợ lý ảo hỗ trợ tạo phản ánh sự cố. Hãy phân tích câu hỏi của người dùng và các câu trước đó để lấy 'location' và 'category' và 'description'. " +
        "Chỉ trả về JSON. Các trường: intent (CREATE_FEEDBACK), emotion (NEGATIVE/NEUTRAL), reply (trả lời người dùng), location (nếu có), category (BẮT BUỘC chọn 1 trong 6 mã: TRAFFIC, URBAN_INFRASTRUCTURE, ENVIRONMENT, PUBLIC_SECURITY, CONSTRUCTION, FIRE_SAFETY), description (nếu có), needsMoreInfo (mảng chứa 'LOCATION', 'DESCRIPTION' nếu thiếu).";

        StringBuilder context = new StringBuilder();
        if (historyContext != null) {
            for (Map<String, String> msg : historyContext) {
                context.append(msg.get("role")).append(": ").append(msg.get("content")).append("\n");
            }
        }
        context.append("user: ").append(question);

        String json = "";
        try {
            // SỬ DỤNG ZOD VALIDATION ĐỂ AUTO-RETRY NẾU JSON SAI CÚ PHÁP HOẶC THIẾU TRƯỜNG
            com.example.smartcity.modules.chatbot.dto.CreateFeedbackAiDto parsedObj = 
                aiRouterService.executeWithValidation(activeProvider, systemPrompt, context.toString(), 
                com.example.smartcity.modules.chatbot.dto.CreateFeedbackAiDto.class, 2).join();
            
            json = objectMapper.writeValueAsString(parsedObj);
        } catch (Exception ex) {
            log.warn("⚠️ [ChatbotService] Provider chính ({}) bị lỗi JSON/Zod: {}. Đang gọi fallback (Groq)...", 
                     activeProvider != null ? activeProvider.getProviderName() : "NULL", ex.getMessage());
            try {
                com.example.smartcity.modules.chatbot.dto.CreateFeedbackAiDto parsedObj = 
                    aiRouterService.executeWithValidation(groqAdapter, systemPrompt, context.toString(), 
                    com.example.smartcity.modules.chatbot.dto.CreateFeedbackAiDto.class, 1).join();
                json = objectMapper.writeValueAsString(parsedObj);
            } catch (Exception fallbackEx) {
                log.error("❌ [ChatbotService] Cả Fallback cũng bị lỗi JSON/Zod: {}", fallbackEx.getMessage());
                json = "{\"intent\":\"CREATE_FEEDBACK\",\"reply\":\"Dạ em đang gặp sự cố mạng, cô chú có thể cung cấp thêm thông tin địa chỉ cụ thể không ạ?\"}";
            }
        }

        try {
            Map<String, Object> parsed = objectMapper.readValue(json, Map.class);
            List<String> needsMoreInfo = (List<String>) parsed.getOrDefault("needsMoreInfo", new ArrayList<>());
            
            if (needsMoreInfo == null || needsMoreInfo.isEmpty()) {
                // Đã thu thập đủ thông tin text (category, location, description)
                parsed.put("reply", "✅ Em đã ghi nhận thông tin sơ bộ của cô chú.\n\n⚠️ Tuy nhiên, hệ thống Đô thị Thông minh yêu cầu **vị trí bản đồ chính xác** và **hình ảnh hiện trường** để xử lý sự cố hiệu quả nhất.\n\n👉 Cô chú vui lòng bấm vào nút **Tạo Phản Ánh** (hoặc để ứng dụng tự động mở) để đính kèm thêm ảnh và hoàn tất gửi đơn nhé!");
                parsed.put("action", "OPEN_FEEDBACK_FORM"); // Signal cho Frontend để trigger màn hình Tạo Phản Ánh
            } else {
                if (!parsed.containsKey("reply") || parsed.get("reply") == null || ((String)parsed.get("reply")).isEmpty()) {
                    parsed.put("reply", "Em đã ghi nhận thông tin. Cô chú vui lòng cung cấp thêm: " + String.join(", ", needsMoreInfo));
                }
            }
            return parsed;
        } catch (Exception e) {
            log.error("Parse JSON CREATE_FEEDBACK failed", e);
            return new java.util.HashMap<>(Map.of("intent", "CREATE_FEEDBACK", "reply", "Dạ em đã ghi nhận sự cố, bạn có thể cho em thêm thông tin địa chỉ cụ thể không ạ?"));
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

    private Map<String, Object> handleDiscoverCampaign(String question) {
        RetrievalOptions options = RetrievalOptions.defaults("danang-campaign", LANGUAGE);
        String customPrompt = "Bạn là người điều phối sự kiện tình nguyện tại Đà Nẵng. Hãy đọc các chiến dịch ở CONTEXT và trả lời câu hỏi của người dân.\n" +
            "Nếu không có chiến dịch nào trong CONTEXT phù hợp, hãy bảo là hiện chưa có chiến dịch nào tương ứng, khuyên họ quay lại sau.\n" +
            "Hãy trả về định dạng rõ ràng, nêu tên chiến dịch, thời gian, địa điểm và tóm tắt mục đích một cách hào hứng.";
        RagRequest request = new RagRequest(question, options);
        RagResponse ragResponse = ragOrchestrator.query(request, customPrompt);

        return new java.util.HashMap<>(Map.of(
            "intent", "DISCOVER_CAMPAIGN",
            "emotion", "POSITIVE",
            "reply", ragResponse.answer(),
            "citations", ragResponse.citations()
        ));
    }

    private Map<String, Object> handleStatistics(AiProviderAdapter activeProvider, String question, List<Map<String, String>> historyContext) {
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
            reply = aiRouterService.executeWithFallback(activeProvider, systemPrompt, context.toString()).join();
        } catch (Exception e) {
            log.error("Lỗi khi dùng LLM để sinh câu trả lời thống kê", e);
        }

        return new java.util.HashMap<>(Map.of(
            "intent", "STATISTICS",
            "emotion", "POSITIVE",
            "reply", reply
        ));
    }

    private Map<String, Object> handleReportCopilot(AiProviderAdapter activeProvider, String question, User user, List<Map<String, String>> historyContext) {
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
            2. Nếu người dùng hỏi "tôi có phản ánh gì", hãy TRỰC TIẾP LIỆT KÊ TÓM TẮT các phản ánh của họ (gồm mã số, trạng thái, tiêu đề).
            3. TUYỆT ĐỐI KHÔNG trả lời kiểu "Để kiểm tra, em cần biết mã phản ánh" nếu danh sách phản ánh của họ đã được cung cấp ở trên! Bạn đã có đủ toàn bộ danh sách, cứ liệt kê ra luôn!
            4. Sử dụng định dạng Markdown (đặc biệt là in đậm mã phản ánh như **FB-XXXX** để người dùng dễ quan sát).
            5. Nếu danh sách phản ánh trống, hãy báo cho họ biết là "Cô chú chưa có phản ánh nào được ghi nhận trên hệ thống".
            6. Tông giọng thân thiện, lễ phép ("Dạ", "Cô chú", "Sếp").
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
            reply = aiRouterService.executeWithFallback(activeProvider, systemPrompt, conversationContext.toString()).join();
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
        String systemPrompt = """
            Bạn là Bé Rồng 🐉, trợ lý AI thông minh và thân thiện của TP. Đà Nẵng Kết Nối.
            Hãy trả lời câu hỏi thông thường, chào hỏi hoặc tán gẫu một cách vui vẻ, lễ phép, tự nhiên và ngắn gọn (dưới 100 chữ).
            Nếu câu hỏi liên quan đến sự cố đô thị, hãy gợi ý người dùng dùng chức năng phản ánh.
            Tông giọng: thân thiện, dùng emojis vừa phải, ngắn gọn xúc tích.
            """;
        
        String reply = "Dạ Bé Rồng em nghe đây ạ! 🐉 Em có thể hỗ trợ cô chú tra cứu phản ánh sự cố đô thị, hướng dẫn thủ tục hành chính hoặc tiếp nhận báo cáo nhanh tại Đà Nẵng ạ.";
        try {
            reply = aiRouterService.executeWithFallback(groqAdapter, systemPrompt, question).join();
        } catch (Exception e) {
            log.error("Lỗi khi dùng LLM để sinh câu trả lời chat thông thường", e);
        }

        return new java.util.HashMap<>(Map.of(
            "intent", "GENERAL",
            "emotion", "POSITIVE",
            "reply", reply
        ));
    }

    /**
     * Xử lý intent NAVIGATION_GUIDE — hướng dẫn người dùng sử dụng app.
     */
    private Map<String, Object> handleNavigationGuide(String question) {
        String lower = question.toLowerCase();
        
        // Map câu hỏi → trang đích và hướng dẫn tương ứng
        String navigateTo = null;
        String reply;

        if (lower.contains("phản ánh") || lower.contains("báo cáo") || lower.contains("sự cố")) {
            navigateTo = "/feedback/create";
            reply = "📋 Để gửi phản ánh sự cố, cô chú vào **Menu → Phản Ánh → Gửi Phản Ánh Mới**.\n" +
                    "Cần cung cấp: mô tả, vị trí bản đồ và ảnh hiện trường.\n" +
                    "Bé Rồng sẽ mở trang này cho cô chú ngay nhé! 🗺️";
        } else if (lower.contains("chiến dịch") || lower.contains("tình nguyện")) {
            navigateTo = "/campaigns";
            reply = "🎯 Trang **Chiến Dịch Tình Nguyện** có tại menu chính.\n" +
                    "Cô chú có thể xem, đăng ký tham gia và theo dõi các sự kiện tại Đà Nẵng!";
        } else if (lower.contains("thống kê") || lower.contains("dashboard")) {
            navigateTo = "/";
            reply = "📊 **Trang Chủ** hiển thị thống kê tổng quan: số phản ánh, tình trạng xử lý và bản đồ nóng.";
        } else if (lower.contains("tra cứu") || lower.contains("trạng thái")) {
            reply = "🔍 Để tra cứu phản ánh, cô chú hỏi Bé Rồng: **'tra cứu FB-XXXXX'** hoặc **'trạng thái DN-XXXXX'** nhé!";
        } else {
            // Tổng quan về app
            reply = "🐉 **Bé Rồng** có thể giúp cô chú:\n\n" +
                    "📋 **Gửi phản ánh** sự cố đường phố, vỉa hè, môi trường\n" +
                    "🔍 **Tra cứu trạng thái** phản ánh bằng mã FB-...\n" +
                    "⚖️ **Hỏi quy định** pháp luật đô thị Đà Nẵng\n" +
                    "📊 **Xem thống kê** sự cố cộng đồng\n" +
                    "🎯 **Khám phá chiến dịch** tình nguyện\n\n" +
                    "Cô chú muốn bắt đầu từ đâu ạ?";
        }

        java.util.Map<String, Object> res = new java.util.HashMap<>();
        res.put("intent", "NAVIGATION_GUIDE");
        res.put("emotion", "POSITIVE");
        res.put("reply", reply);
        res.put("suggestedFollowUps", buildSuggestedFollowUps(ChatIntent.NAVIGATION_GUIDE));
        if (navigateTo != null) {
            res.put("action", "NAVIGATE");
            res.put("navigateTo", navigateTo);
        }
        return res;
    }

    /**
     * Lưu đánh giá chất lượng câu trả lời từ người dùng.
     */
    @Transactional
    public boolean rateMessage(String historyId, int rating) {
        try {
            java.util.UUID uuid = java.util.UUID.fromString(historyId);
            int updated = chatHistoryRepository.updateUserRating(uuid, rating);
            log.info("✅ [Rating] historyId={} rated={}", historyId, rating);
            return updated > 0;
        } catch (Exception e) {
            log.error("Lỗi khi lưu rating", e);
            return false;
        }
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
