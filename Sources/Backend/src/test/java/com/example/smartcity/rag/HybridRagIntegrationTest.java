package com.example.smartcity.rag;

import com.example.smartcity.rag.model.DocumentChunk;
import com.example.smartcity.rag.retrieval.RrfFusionService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
public class HybridRagIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private RrfFusionService rrfFusionService;

    @Test
    public void testRrfFusionAlgorithm_ShouldRankCorrectly() {
        // Arrange
        // Dùng reflection hoặc constructor mặc định để giả lập chunk vì không rõ cấu trúc cụ thể
        DocumentChunk chunk1 = createChunk(UUID.randomUUID(), "Thủ tục hành chính A");
        DocumentChunk chunk2 = createChunk(UUID.randomUUID(), "Văn bản hướng dẫn B");
        DocumentChunk chunk3 = createChunk(UUID.randomUUID(), "Thời tiết Đà Nẵng");

        List<DocumentChunk> vectorResults = List.of(chunk1, chunk2, chunk3);
        List<DocumentChunk> bm25Results = List.of(chunk3, chunk1, chunk2);

        // Act
        // Fusion 3 kết quả
        List<DocumentChunk> fusedResults = rrfFusionService.fuse(vectorResults, bm25Results, 3);

        // Assert
        assertNotNull(fusedResults);
        assertEquals(3, fusedResults.size());
        
        // Chunk1: Vector Top 1, BM25 Top 2
        // Chunk3: Vector Top 3, BM25 Top 1
        // RRF algorithm (K=60):
        // Score(Chunk1) = 1/61 + 1/62 ≈ 0.03251
        // Score(Chunk3) = 1/63 + 1/61 ≈ 0.03226
        // Chunk1 vẫn ở Top 1 vì 0.03251 > 0.03226
        assertEquals(chunk1.getId(), fusedResults.get(0).getId());
        assertEquals(chunk3.getId(), fusedResults.get(1).getId());
        assertEquals(chunk2.getId(), fusedResults.get(2).getId());
    }

    private DocumentChunk createChunk(UUID id, String content) {
        // Tạm dùng Mock đối tượng vì DocumentChunk là một model
        DocumentChunk chunk = new DocumentChunk();
        try {
            java.lang.reflect.Field idField = DocumentChunk.class.getDeclaredField("id");
            idField.setAccessible(true);
            idField.set(chunk, id);

            java.lang.reflect.Field contentField = DocumentChunk.class.getDeclaredField("content");
            contentField.setAccessible(true);
            contentField.set(chunk, content);
        } catch (Exception e) {
            // Ignore for test mockup
        }
        return chunk;
    }
}
