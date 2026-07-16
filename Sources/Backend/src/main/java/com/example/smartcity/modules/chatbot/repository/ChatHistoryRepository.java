package com.example.smartcity.modules.chatbot.repository;

import com.example.smartcity.modules.chatbot.entity.ChatHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * [REPOSITORY] ChatHistoryRepository
 * Truy xuất lịch sử hội thoại của người dùng với Chatbot.
 */
@Repository
public interface ChatHistoryRepository extends JpaRepository<ChatHistory, UUID> {

    /**
     * Lấy lịch sử chat của một người dùng, mới nhất trước.
     */
    List<ChatHistory> findByUserIdOrderByCreatedAtDesc(Long userId);

    /**
     * Lấy N chat gần nhất của người dùng.
     */
    @Query("""
        SELECT c FROM ChatHistory c
        WHERE c.user.id = :userId
        ORDER BY c.createdAt DESC
        LIMIT :limit
        """)
    List<ChatHistory> findRecentByUserId(
        @Param("userId") Long userId,
        @Param("limit") int limit
    );

    /**
     * Thống kê số câu hỏi theo từng AI provider.
     */
    @Query("""
        SELECT c.aiProvider, COUNT(c)
        FROM ChatHistory c
        GROUP BY c.aiProvider
        """)
    List<Object[]> countByProvider();

    /** Tổng số câu hỏi đã xử lý */
    long count();

    /**
     * Cập nhật đánh giá của người dùng cho một tin nhắn.
     * @param historyId ID của ChatHistory
     * @param rating 1 = helpful, -1 = not helpful
     */
    @org.springframework.data.jpa.repository.Modifying
    @Query("UPDATE ChatHistory c SET c.userRating = :rating WHERE c.id = :historyId")
    int updateUserRating(@Param("historyId") UUID historyId, @Param("rating") int rating);

    /**
     * Lấy danh sách sessions (phân biệt theo sessionId) của một user.
     * Trả về: [sessionId, sessionName, lastMessageTime, messageCount]
     */
    @Query("""
        SELECT c.sessionId, MIN(c.sessionName), MAX(c.createdAt), COUNT(c)
        FROM ChatHistory c
        WHERE c.user.id = :userId
          AND c.sessionId IS NOT NULL
        GROUP BY c.sessionId
        ORDER BY MAX(c.createdAt) DESC
        LIMIT 20
        """)
    List<Object[]> findSessionsByUserId(@Param("userId") Long userId);

    /**
     * Lấy toàn bộ tin nhắn trong một session.
     */
    @Query("""
        SELECT c FROM ChatHistory c
        WHERE c.user.id = :userId
          AND c.sessionId = :sessionId
        ORDER BY c.createdAt ASC
        """)
    List<ChatHistory> findByUserIdAndSessionId(
        @Param("userId") Long userId,
        @Param("sessionId") String sessionId
    );

    /**
     * Tìm tin nhắn đầu tiên của một session để lấy tên session gốc.
     */
    java.util.Optional<ChatHistory> findFirstBySessionIdOrderByCreatedAtAsc(String sessionId);
}




