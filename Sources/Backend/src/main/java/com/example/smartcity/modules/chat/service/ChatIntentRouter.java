package com.example.smartcity.modules.chat.service;

import com.example.smartcity.ai_orchestrator.adapter.GroqAdapter;
import com.example.smartcity.modules.chat.dto.ChatRequestDto;
import com.example.smartcity.modules.feedback.repository.FeedbackRepository;
import com.example.smartcity.modules.feedback.entity.Feedback;
import com.example.smartcity.rag.generation.HybridRagOrchestrator;
import com.example.smartcity.rag.model.RagRequest;
import com.example.smartcity.rag.model.RetrievalOptions;
import com.example.smartcity.rag.model.RagResponse;
import com.example.smartcity.rag.model.Citation;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatIntentRouter {

    private final GroqAdapter groqAdapter;
    private final HybridRagOrchestrator ragOrchestrator;
    private final FeedbackRepository feedbackRepository;
    
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String SYSTEM_PROMPT = """
        Bạn là "Bé Sông Hàn" 🌊 - Trợ lý AI Đô thị Thông minh của thành phố Đà Nẵng. 
        Nhiệm vụ của bạn là đọc tin nhắn của người dùng, phân tích và TRẢ VỀ JSON theo ĐÚNG cấu trúc sau (không có text nào khác ngoài JSON):
        
        {
          "intent": "LOOKUP" | "QA_LEGAL" | "CREATE_FEEDBACK" | "SMALLTALK",
          // Nếu intent = LOOKUP
          "trackingCode": "mã dạng FB-1234 (nếu có)",
          
          // Nếu intent = QA_LEGAL
          "query": "câu hỏi pháp lý để tra cứu RAG",
          
          // Nếu intent = CREATE_FEEDBACK
          "location": "địa điểm sự cố (nếu có)",
          "description": "mô tả sự cố",
          "category": "ENVIRONMENT" | "TRAFFIC" | "INFRASTRUCTURE" | "SECURITY" | "OTHER",
          "needsMoreInfo": ["IMAGE", "LOCATION"], // danh sách thông tin còn thiếu. Ví dụ nếu chưa rõ địa điểm thì có "LOCATION", nếu chưa có ảnh thì có "IMAGE".
          "confidence": 0.9, // mức độ tự tin (0.0 đến 1.0)
          
          // Dành cho CREATE_FEEDBACK và SMALLTALK
          "emotion": "NEGATIVE" | "NEUTRAL" | "POSITIVE", // Cảm xúc của người dùng
          
          // Nếu intent = SMALLTALK hoặc trả lời thiếu thông tin ở CREATE_FEEDBACK
          "reply": "câu trả lời giao tiếp thông thường"
        }
        
        Lưu ý Nhân văn (Empathetic AI):
        - Xưng hô: "Em" - "Cô/Chú/Anh/Chị". Luôn thể hiện sự lễ phép, thân thiện.
        - Nếu emotion là NEGATIVE (người dân đang buồn, đau khổ, thất vọng, tức giận): BẮT BUỘC phải viết câu trả lời (trong trường reply) bằng giọng điệu an ủi, xoa dịu, thể hiện sự đồng cảm sâu sắc. VD: "Trời ơi, em rất chia sẻ với thiệt hại của gia đình mình ạ. Cơn bão vừa qua đúng là căng thẳng quá. Cô/chú bình tĩnh nhé..."
        - Nếu câu nói thô tục, intent = SMALLTALK và reply = "Xin lỗi, em mong mình có thể dùng từ ngữ nhẹ nhàng hơn để em dễ hỗ trợ ạ."
        - Nếu intent = CREATE_FEEDBACK, hãy luôn thêm "IMAGE" vào needsMoreInfo nếu người dùng chưa nhắc tới hình ảnh.
        """;

    public String processChat(ChatRequestDto request) {
        try {
            // 1. Tạo chuỗi lịch sử hội thoại cho Gemini
            String userContext = request.getHistory().stream()
                    .map(msg -> msg.getRole() + ": " + msg.getContent())
                    .collect(Collectors.joining("\n"));
            userContext += "\nuser: " + request.getMessage();

            // 2. Gọi AI trong 1 pass duy nhất (Single-Pass)
            String rawJsonResponse = groqAdapter.generateStructuredResponseAsync(SYSTEM_PROMPT, userContext).join();
            
            // Xóa markdown json block nếu có (ví dụ: ```json ... ```)
            rawJsonResponse = rawJsonResponse.replaceAll("(?s)^```json\\s*", "").replaceAll("(?s)\\s*```$", "").trim();

            JsonNode rootNode = objectMapper.readTree(rawJsonResponse);
            String intent = rootNode.path("intent").asText("");

            ObjectNode modifiedNode = (ObjectNode) rootNode;

            // 3. Xử lý logic động (Dynamic Router)
            if ("QA_LEGAL".equals(intent)) {
                String query = rootNode.path("query").asText();
                RetrievalOptions options = RetrievalOptions.defaults("policy", "vi");
                RagResponse ragResp = ragOrchestrator.query(new RagRequest(query, options));
                
                modifiedNode.put("answer", ragResp.answer());
                
                // Add citations
                ArrayNode citationsArray = modifiedNode.putArray("citations");
                for (Citation c : ragResp.citations()) {
                    ObjectNode citeNode = citationsArray.addObject();
                    citeNode.put("doc", c.docType());
                    citeNode.put("article", c.chunkId().toString());
                    citeNode.put("url", c.sourceUrl() != null ? c.sourceUrl() : "#");
                }
            } else if ("LOOKUP".equals(intent)) {
                String trackingCode = rootNode.path("trackingCode").asText();
                Feedback feedback = feedbackRepository.findByTrackingCode(trackingCode).orElse(null);
                
                if (feedback != null) {
                    modifiedNode.put("answer", "Phản ánh " + trackingCode + " đang ở trạng thái: " + feedback.getStatus());
                } else {
                    modifiedNode.put("answer", "Không tìm thấy phản ánh nào với mã " + trackingCode);
                }
            }

            return objectMapper.writeValueAsString(modifiedNode);

        } catch (Exception e) {
            log.error("Lỗi trong ChatIntentRouter: ", e);
            ObjectNode errorNode = objectMapper.createObjectNode();
            errorNode.put("intent", "SMALLTALK");
            errorNode.put("emotion", "NEGATIVE");
            errorNode.put("reply", "Hệ thống AI đang bảo trì hoặc chưa cấu hình API Key. (Lỗi: " + e.getMessage() + ")");
            try {
                return objectMapper.writeValueAsString(errorNode);
            } catch (Exception ex) {
                return "{\"intent\": \"SMALLTALK\", \"reply\": \"Lỗi hệ thống nghiêm trọng\"}";
            }
        }
    }
}
