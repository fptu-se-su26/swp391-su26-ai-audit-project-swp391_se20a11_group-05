package com.example.smartcity.rag.retrieval;

import com.example.smartcity.rag.model.DocumentChunk;
import com.example.smartcity.rag.repository.DocumentChunkRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * [LAYER 3] BM25 RETRIEVER — Tìm kiếm Sparse bằng Keyword Matching.
 *
 * Ưu điểm: Bắt chính xác từ khóa đặc thù (tên riêng, mã code, ngữ pháp cụ thể).
 * Nhược điểm: Không hiểu ngữ nghĩa, bỏ sót đồng nghĩa.
 *
 *
 * Implementation hiện tại: Native PostgreSQL Full-Text Search (tsvector).
 * Cung cấp thuật toán BM25 gốc trực tiếp từ Database (Supabase) mà không cần 
 * cài đặt thêm Hibernate Search hay Apache Lucene nặng nề.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BM25Retriever {

    private final DocumentChunkRepository repository;
    private static final int DEFAULT_TOP_K = 20;

    /**
     * Tìm kiếm keyword và trả về Top-K chunk phù hợp nhất.
     *
     * @param query   Câu hỏi gốc (chưa biến đổi)
     * @param docType Loại tài liệu để thu hẹp phạm vi tìm kiếm
     * @param topK    Số lượng kết quả tối đa
     * @return Danh sách chunk chứa keyword
     */
    public List<DocumentChunk> search(String query, String docType, int topK) {
        log.debug("🔍 [BM25] Keyword search: '{}' (docType={})", 
            query.substring(0, Math.min(50, query.length())), docType);

        // Trích xuất keyword quan trọng từ câu hỏi
        String keyword = extractPrimaryKeyword(query);

        List<DocumentChunk> results = repository.findByKeyword(keyword, docType);

        // Giới hạn số lượng kết quả
        List<DocumentChunk> limited = results.size() > topK
            ? results.subList(0, topK)
            : results;

        log.debug("   → BM25 search trả về {} chunk (keyword='{}')", limited.size(), keyword);
        return limited;
    }

    /**
     * Overload với topK mặc định.
     */
    public List<DocumentChunk> search(String query, String docType) {
        return search(query, docType, DEFAULT_TOP_K);
    }

    // ──────────────────────────────────────────────────────────────
    //  KEYWORD EXTRACTION (Heuristic đơn giản)
    // ──────────────────────────────────────────────────────────────

    /**
     * Trích xuất keyword chính từ câu hỏi bằng heuristic đơn giản.
     * Loại bỏ stop words tiếng Việt và giữ lại từ có nghĩa nhất.
     *
     * TODO: Thay bằng NLP tokenizer (VnCoreNLP cho tiếng Việt, Lucene StandardAnalyzer cho tiếng Anh)
     */
    private String extractPrimaryKeyword(String query) {
        // Stop words tiếng Việt phổ biến
        String[] stopWords = {
            "là", "gì", "như", "thế nào", "khi nào", "ở đâu",
            "tôi", "bạn", "chúng ta", "họ", "này", "đó",
            "và", "hoặc", "nhưng", "vì", "nếu", "thì",
            "how", "what", "when", "where", "why", "is", "are", "the", "a", "an"
        };

        String lower = query.toLowerCase();
        for (String sw : stopWords) {
            // Dùng (?U)\b để hỗ trợ word boundary cho tiếng Việt Unicode, tránh thay thế chữ cái bên trong từ khác
            lower = lower.replaceAll("(?U)\\b" + sw + "\\b", " ");
        }

        // Giữ lại toàn bộ cụm từ khóa có nghĩa thay vì chỉ lấy 1 từ dài nhất (làm sai lệch thuật toán BM25)
        String cleanedQuery = lower.trim().replaceAll("\\s+", " ");

        // Fallback: dùng toàn bộ query nếu chuỗi rỗng (bị xóa sạch bởi stop words)
        return cleanedQuery.isEmpty() ? query : cleanedQuery;
    }
}



