package com.example.smartcity.rag.retrieval;

import com.example.smartcity.rag.model.DocumentChunk;
import com.knuddels.jtokkit.Encodings;
import com.knuddels.jtokkit.api.Encoding;
import com.knuddels.jtokkit.api.EncodingRegistry;
import com.knuddels.jtokkit.api.EncodingType;
import com.knuddels.jtokkit.api.IntArrayList;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * [LAYER 5] CONTEXT COMPRESSOR — Nén context trước khi nhét vào Prompt.
 *
 * Sử dụng JTokkit (chuẩn cl100k_base) để đếm và cắt token cực kỳ chính xác,
 * ngăn chặn việc gọi Groq/Gemini bị lỗi 400 do vượt giới hạn Token.
 */
@Service
@Slf4j
public class ContextCompressor {

    /** Số token tối đa cho toàn bộ context block (để lại chỗ cho System Prompt và Question) */
    private static final int MAX_PROMPT_TOKENS = 3000;
    
    private final Encoding encoding;

    public ContextCompressor() {
        EncodingRegistry registry = Encodings.newDefaultEncodingRegistry();
        this.encoding = registry.getEncoding(EncodingType.CL100K_BASE);
    }

    /**
     * Nén danh sách chunk thành một chuỗi context theo giới hạn Token.
     */
    public String compress(List<DocumentChunk> chunks, String question) {
        log.debug("📦 [COMPRESSOR] Nén {} chunk cho câu hỏi: '{}'...",
            chunks.size(), question.substring(0, Math.min(50, question.length())));

        StringBuilder context = new StringBuilder();
        int currentTokens = 0;

        for (int i = 0; i < chunks.size(); i++) {
            DocumentChunk chunk = chunks.get(i);
            
            // Thêm header đánh số nguồn để AI có thể trích dẫn [Nguồn: X]
            String block = String.format("[Nguồn: %d] (Loại: %s, Ngôn ngữ: %s)\n%s\n\n",
                i + 1,
                chunk.getDocType() != null ? chunk.getDocType() : "unknown",
                chunk.getLanguage() != null ? chunk.getLanguage() : "unknown",
                chunk.getContent()
            );

            IntArrayList encoded = encoding.encode(block);
            int blockTokens = encoded.size();

            if (currentTokens + blockTokens <= MAX_PROMPT_TOKENS) {
                context.append(block);
                currentTokens += blockTokens;
            } else {
                // Exact truncation: Cắt ngang chunk nếu vượt Token
                int remainingTokens = MAX_PROMPT_TOKENS - currentTokens;
                
                if (remainingTokens > 30) { // Đủ chỗ cho một đoạn ngắn
                    IntArrayList truncatedEncoded = new IntArrayList(remainingTokens);
                    for (int j = 0; j < remainingTokens; j++) {
                        truncatedEncoded.add(encoded.get(j));
                    }
                    String truncatedBlock = encoding.decode(truncatedEncoded) + "... [BỊ CẮT DO GIỚI HẠN TOKEN]\n\n";
                    context.append(truncatedBlock);
                    currentTokens += remainingTokens;
                }
                log.debug("   Đã đạt giới hạn token ({} tokens). Dừng ở chunk {}.", currentTokens, i);
                break;
            }
        }

        log.debug("   → Context cuối: {} tokens từ {} chunk", currentTokens, chunks.size());

        return context.toString().trim();
    }
}



