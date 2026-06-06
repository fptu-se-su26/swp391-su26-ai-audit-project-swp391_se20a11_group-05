package com.example.smartcity.rag.generation;

import com.example.smartcity.ai_orchestrator.adapter.GeminiAdapter;
import com.example.smartcity.ai_orchestrator.adapter.GroqAdapter;
import com.example.smartcity.ai_orchestrator.pool.GroqKeyPool;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.ratelimiter.annotation.RateLimiter;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Service độc lập để thực thi các LLM calls.
 * Đưa ra lớp riêng để Spring AOP (Resilience4j annotations) có thể hoạt động chính xác.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class LlmExecutionService {

    private final GroqAdapter groqAdapter;
    private final GeminiAdapter geminiAdapter;

    public record LlmCallResult(String answer, String provider) {}

    // ──────────────────────────────────────────────────────────────
    // LLM CALL — Groq (Primary) → Gemini (Fallback)
    // ──────────────────────────────────────────────────────────────

    @CircuitBreaker(name = "groq", fallbackMethod = "callGeminiFallback")
    @Retry(name = "llm")
    @RateLimiter(name = "llm")
    public LlmCallResult callLLM(String question, String context) {
        String systemPrompt = """
                Bạn là Trợ lý AI Đà Nẵng Lắng Nghe — hỗ trợ người dân giải đáp các thắc mắc và thủ tục hành chính.
                Nhiệm vụ: Trả lời câu hỏi của người dân dựa HOÀN TOÀN vào thông tin trong CONTEXT bên dưới.

                Quy tắc:
                1. Chỉ dùng thông tin từ CONTEXT, không bịa thêm.
                2. Nếu CONTEXT không đủ thông tin → trả lời: "Tôi chưa có thông tin về vấn đề này. Vui lòng liên hệ UBND Phường hoặc cơ quan chức năng."
                3. Trả lời bằng tiếng Việt, rõ ràng, thân thiện.
                4. Trích dẫn nguồn nếu có: [Nguồn: tên tài liệu]
                5. Tối đa 300 từ.
                """;

        String userMessage = """
                CONTEXT:
                %s

                CÂU HỎI: %s
                """.formatted(context, question);

        try {
            String result = groqAdapter.generateResponseAsync(systemPrompt, userMessage).get();
            return new LlmCallResult(result, "GROQ/llama-3.3-70b-versatile");
        } catch (GroqKeyPool.PoolExhaustedException poolEx) {
            log.warn("⚠️  [callLLM] Groq Pool cạn → Chuyển sang Fallback | Lý do: {}", poolEx.getMessage());
            throw poolEx; // Quăng ra để CircuitBreaker bắt và kích hoạt Fallback
        } catch (Exception e) {
            log.error("❌ [callLLM] Lỗi khi gọi Groq: {}", e.getMessage());
            throw new RuntimeException(e); // Quăng ra để Fallback xử lý
        }
    }

    public LlmCallResult callGeminiFallback(String question, String context, Exception e) {
        log.warn("⚠️  [FALLBACK] Groq circuit open hoặc bị lỗi, switching to Gemini. Lỗi: {}", e.getMessage());
        
        String systemPrompt = """
                Bạn là Trợ lý AI Đà Nẵng Lắng Nghe — hỗ trợ người dân giải đáp các thắc mắc và thủ tục hành chính.
                Nhiệm vụ: Trả lời câu hỏi của người dân dựa HOÀN TOÀN vào thông tin trong CONTEXT bên dưới.
                Tối đa 300 từ.
                """;
        String userMessage = """
                CONTEXT:
                %s

                CÂU HỎI: %s
                """.formatted(context, question);

        try {
            String geminiResult = geminiAdapter.generateResponseAsync(systemPrompt, userMessage).get();
            String provider = geminiAdapter.isHealthy() ? "GEMINI/gemini-1.5-flash [FALLBACK]" : "MOCK_FALLBACK";
            log.info("✅ [FALLBACK] Gemini fallback thành công.");
            return new LlmCallResult(geminiResult, provider);
        } catch (Exception geminiEx) {
            log.error("❌ [FALLBACK] Cả Groq lẫn Gemini đều lỗi: {}", geminiEx.getMessage());
            return new LlmCallResult("⏳ Hệ thống AI đang tạm thời quá tải. Vui lòng thử lại sau 1-2 phút.", "FAILED");
        }
    }

    // ──────────────────────────────────────────────────────────────
    // GENERAL LLM CALL — Không có Context
    // ──────────────────────────────────────────────────────────────

    @CircuitBreaker(name = "groq", fallbackMethod = "callGeneralGeminiFallback")
    @Retry(name = "llm")
    @RateLimiter(name = "llm")
    public LlmCallResult callGeneralLLM(String question) {
        String systemPrompt = """
                Bạn là Trợ lý AI Đà Nẵng Lắng Nghe — một chatbot thân thiện hỗ trợ người dân.
                Nhiệm vụ chính là giải đáp thủ tục hành chính tại Đà Nẵng, nhưng bạn cũng có thể
                trả lời các câu hỏi thông thường một cách tự nhiên và hữu ích.
                Tối đa 200 từ.
                """;

        String userMessage = "Câu hỏi: " + question;

        try {
            String result = groqAdapter.generateResponseAsync(systemPrompt, userMessage).get();
            return new LlmCallResult(result, "GROQ/llama-3.3-70b-versatile [GENERAL]");
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public LlmCallResult callGeneralGeminiFallback(String question, Exception e) {
        log.warn("⚠️  [FALLBACK] General AI switching to Gemini. Lỗi: {}", e.getMessage());
        String systemPrompt = """
                Bạn là Trợ lý AI Đà Nẵng Lắng Nghe — một chatbot thân thiện hỗ trợ người dân.
                Tối đa 200 từ.
                """;
        String userMessage = "Câu hỏi: " + question;

        try {
            String result = geminiAdapter.generateResponseAsync(systemPrompt, userMessage).get();
            return new LlmCallResult(result, "GEMINI/gemini-1.5-flash [GENERAL_FALLBACK]");
        } catch (Exception ex) {
            log.error("❌ [callGeneralLLM] Lỗi: {}", ex.getMessage());
            return new LlmCallResult("Xin lỗi, tôi không thể xử lý câu hỏi này lúc này. Vui lòng thử lại sau.", "ERROR");
        }
    }
}
