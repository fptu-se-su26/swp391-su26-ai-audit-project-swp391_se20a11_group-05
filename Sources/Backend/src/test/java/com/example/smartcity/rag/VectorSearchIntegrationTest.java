package com.example.smartcity.rag;

import com.example.smartcity.rag.model.DocumentChunk;
import com.example.smartcity.rag.repository.DocumentChunkRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration Test kiểm chứng tính năng Vector Search HNSW trên PostgreSQL thực tế.
 */
public class VectorSearchIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private DocumentChunkRepository repository;

    @BeforeEach
    void setUp() {
        // Tạo dữ liệu test
        DocumentChunk chunk1 = new DocumentChunk();
        chunk1.setSourceUrl("doc-1");
        chunk1.setDocType("THU_TUC");
        chunk1.setContent("Thủ tục làm căn cước công dân gắn chip tại Đà Nẵng");
        // Giả lập embedding 768 chiều (tất cả là 0 trừ phần tử đầu tiên)
        float[] emb1 = new float[768];
        emb1[0] = 0.9f;
        chunk1.setEmbedding(emb1);
        chunk1.setPermissionLevel(DocumentChunk.PermissionLevel.PUBLIC);
        chunk1.setLanguage("vi");

        DocumentChunk chunk2 = new DocumentChunk();
        chunk2.setSourceUrl("doc-2");
        chunk2.setDocType("TIN_TUC");
        chunk2.setContent("Đà Nẵng tổ chức lễ hội pháo hoa quốc tế DIFF");
        float[] emb2 = new float[768];
        emb2[1] = 0.9f;
        chunk2.setEmbedding(emb2);
        chunk2.setPermissionLevel(DocumentChunk.PermissionLevel.PUBLIC);
        chunk2.setLanguage("vi");

        repository.saveAll(List.of(chunk1, chunk2));
    }

    @AfterEach
    void tearDown() {
        repository.deleteAll();
    }

    @Test
    void testVectorSearch_ShouldReturnClosestMatch() {
        // Query mô phỏng gần giống emb1
        StringBuilder queryVectorBuilder = new StringBuilder("[0.8");
        for (int i = 1; i < 768; i++) {
            queryVectorBuilder.append(",0");
        }
        queryVectorBuilder.append("]");

        // Gọi hàm tìm kiếm theo Cosine Similarity (trong repository)
        List<DocumentChunk> results = repository.findSimilar(
            queryVectorBuilder.toString(), 
            "THU_TUC",
            "vi",
            2
        );

        assertThat(results).isNotEmpty();
        assertThat(results.get(0).getSourceUrl()).isEqualTo("doc-1");
    }
}
