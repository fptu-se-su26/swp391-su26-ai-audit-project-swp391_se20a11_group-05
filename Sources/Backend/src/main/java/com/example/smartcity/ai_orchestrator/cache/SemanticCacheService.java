package com.example.smartcity.ai_orchestrator.cache;

import com.example.smartcity.rag.ingestion.EmbeddingClientFacade;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;

/**
 * [TÍNH NĂNG MỚI] Semantic Cache Service — Bộ nhớ đệm ngữ nghĩa (PGVector)
 *
 * Lưu trữ câu hỏi, vector và câu trả lời vào PostgreSQL (`semantic_cache`).
 * Khi nhận được câu hỏi mới, mã hóa thành vector và dùng toán tử `<=>` (Cosine Distance)
 * của pgvector để tìm câu hỏi tương tự (> 92% similarity).
 */
@Service
@Slf4j
public class SemanticCacheService {

    // 0.08 distance <=> 0.92 similarity
    private static final double MAX_COSINE_DISTANCE = 0.08;

    private final EmbeddingClientFacade embeddingFacade;
    private final JdbcTemplate jdbcTemplate;

    public SemanticCacheService(EmbeddingClientFacade embeddingFacade, JdbcTemplate jdbcTemplate) {
        this.embeddingFacade = embeddingFacade;
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Tìm câu trả lời trong cache dựa trên Semantic Search.
     * @param query Câu hỏi của người dùng
     * @return Câu trả lời (nếu Hit), hoặc null (nếu Miss)
     */
    public String findSimilar(String query) {
        try {
            float[] queryVector = embeddingFacade.embed(query);
            String vectorString = formatVector(queryVector);

            // Tìm top 1 có cosine distance < 0.08
            String sql = """
                SELECT response_text 
                FROM semantic_cache 
                WHERE query_vector <=> ?::vector < ?
                ORDER BY query_vector <=> ?::vector ASC 
                LIMIT 1
            """;

            List<String> results = jdbcTemplate.query(
                sql,
                (rs, rowNum) -> rs.getString("response_text"),
                vectorString, MAX_COSINE_DISTANCE, vectorString
            );

            if (!results.isEmpty()) {
                log.info("🎯 [Semantic Cache] HIT! Truy vấn PGVector thành công.");
                // Update hit count (tùy chọn, chạy ngầm)
                String updateHitSql = "UPDATE semantic_cache SET hit_count = hit_count + 1, last_hit_at = NOW() WHERE response_text = ?";
                jdbcTemplate.update(updateHitSql, results.get(0));
                return results.get(0);
            }

            log.debug("📉 [Semantic Cache] MISS cho: {}", query);
            return null;

        } catch (Exception e) {
            log.warn("⚠️ [Semantic Cache] Lỗi khi truy vấn PGVector: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Lưu kết quả mới vào cache sau khi đã gọi LLM.
     */
    public void save(String query, String response) {
        try {
            float[] vector = embeddingFacade.embed(query);
            String vectorString = formatVector(vector);
            
            String sql = "INSERT INTO semantic_cache (query_text, query_vector, response_text) VALUES (?, ?::vector, ?)";
            jdbcTemplate.update(sql, query, vectorString, response);
            
            log.info("💾 [Semantic Cache] Đã lưu câu hỏi mới vào PGVector.");
        } catch (Exception e) {
            log.warn("⚠️ [Semantic Cache] Lỗi khi lưu vào DB: {}", e.getMessage());
        }
    }

    /**
     * Xóa toàn bộ Cache (Dùng khi model đổi hoặc cần refresh)
     */
    public void clearCache() {
        try {
            jdbcTemplate.update("TRUNCATE TABLE semantic_cache");
            log.info("🧹 [Semantic Cache] Đã xóa toàn bộ bộ nhớ đệm trong PGVector.");
        } catch (Exception e) {
            log.warn("⚠️ [Semantic Cache] Lỗi khi xóa cache: {}", e.getMessage());
        }
    }

    /** Helper: Chuyển float[] thành chuỗi format [0.1, 0.2, ...] cho PostgreSQL */
    private String formatVector(float[] vector) {
        return Arrays.toString(vector);
    }
}
