package com.example.smartcity.rag;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

/**
 * Base class cho Integration Tests với PostgreSQL + pgvector.
 * Tự động khởi tạo Database Docker Container trước khi chạy test.
 */
@SpringBootTest
@Testcontainers
@ActiveProfiles("rag")
public abstract class AbstractIntegrationTest {

    // Sử dụng image pgvector để hỗ trợ vector datatype và HNSW index
    @Container
    protected static final PostgreSQLContainer<?> postgres = 
        new PostgreSQLContainer<>(DockerImageName.parse("pgvector/pgvector:pg16"))
            .withDatabaseName("test_ragdb")
            .withUsername("postgres")
            .withPassword("postgres");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        // Bật Flyway để nó tự động tạo bảng (bao gồm bảng document_chunks với vector(768) và HNSW)
        registry.add("spring.flyway.enabled", () -> "true");
        registry.add("spring.flyway.url", postgres::getJdbcUrl);
        registry.add("spring.flyway.user", postgres::getUsername);
        registry.add("spring.flyway.password", postgres::getPassword);
    }
}
