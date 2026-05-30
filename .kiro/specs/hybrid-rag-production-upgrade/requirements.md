# Requirements Document

## Introduction

Hệ thống Hybrid RAG (Retrieval-Augmented Generation) hiện tại đã triển khai các luồng cơ bản nhưng chưa đạt chuẩn production-ready cho môi trường Enterprise. Tài liệu này định nghĩa các yêu cầu để nâng cấp hệ thống lên chuẩn production với khả năng chịu tải cao, tối ưu chi phí, giám sát toàn diện, và độ chính xác cao.

Mục tiêu chính:
- Tăng performance vector search từ 5-10 giây xuống dưới 100ms
- Tăng độ chính xác Precision@10 từ 60% lên 85%
- Đạt 99.9% uptime với resilience patterns
- Giảm 50% storage cost thông qua tối ưu vector dimensions
- Triển khai observability đầy đủ với metrics và structured logging

## Glossary

- **RAG_System**: Hệ thống Hybrid Retrieval-Augmented Generation chịu trách nhiệm xử lý queries, retrieval, và generation
- **Vector_Index**: HNSW (Hierarchical Navigable Small World) index cho vector similarity search trong PostgreSQL với pgvector
- **Cross_Encoder_Reranker**: Service sử dụng transformer model để rerank kết quả retrieval dựa trên relevance score
- **Circuit_Breaker**: Resilience pattern ngăn chặn cascade failures khi downstream services không khả dụng
- **Embedding_Cache**: In-memory cache lưu trữ embeddings và relevance scores để giảm API calls
- **Token_Cost_Tracker**: Service theo dõi số lượng tokens tiêu thụ và chi phí API calls
- **Rate_Limiter**: Component giới hạn số lượng requests per user trong time window
- **Health_Indicator**: Spring Boot Actuator component kiểm tra health status của services
- **Metrics_Collector**: Service thu thập và expose metrics cho Prometheus
- **HyDE**: Hypothetical Document Embeddings - technique tạo hypothetical answers để improve retrieval
- **RRF_Fusion**: Reciprocal Rank Fusion - algorithm kết hợp kết quả từ multiple retrieval strategies
- **Semantic_Chunker**: Component chia documents thành chunks dựa trên semantic boundaries
- **RAGAS**: RAG Assessment framework đo lượng faithfulness, answer relevancy, và context precision

## Requirements

### Requirement 1: Vector Search Performance Optimization

**User Story:** Là một developer, tôi muốn vector search trả về kết quả trong dưới 100ms, để người dùng có trải nghiệm real-time khi query.

#### Acceptance Criteria

1. THE RAG_System SHALL create HNSW Vector_Index với parameters m=16 và ef_construction=64 trong PostgreSQL
2. WHEN a vector similarity search is executed, THE Vector_Index SHALL return results within 100 milliseconds for datasets up to 1 million vectors
3. THE RAG_System SHALL create composite indexes combining vector similarity với metadata filters (document_type, created_date)
4. WHEN comparing performance before and after indexing, THE Vector_Index SHALL reduce query latency by at least 100x (từ 5-10 seconds xuống dưới 100ms)
5. THE RAG_System SHALL implement Flyway migration V3__create_vector_index.sql để tạo indexes một cách reproducible

### Requirement 2: Vector Dimension Correction

**User Story:** Là một system administrator, tôi muốn sửa dimension mismatch giữa embeddings và database schema, để tiết kiệm 50% storage cost và tránh padding overhead.

#### Acceptance Criteria

1. THE RAG_System SHALL alter vector column từ vector(1536) sang vector(768) để match với embedding model dimensions
2. THE RAG_System SHALL remove padding logic trong EmbeddingClientFacade
3. WHEN storing embeddings, THE RAG_System SHALL store exactly 768 dimensions without padding
4. WHEN comparing storage usage before and after migration, THE RAG_System SHALL reduce storage consumption by at least 50%
5. THE RAG_System SHALL create Flyway migration để alter column một cách safe với zero downtime

### Requirement 3: Cross-Encoder Reranking

**User Story:** Là một data scientist, tôi muốn rerank retrieval results bằng cross-encoder model, để tăng precision@10 từ 60% lên 85%.

#### Acceptance Criteria

1. THE RAG_System SHALL integrate BAAI/bge-reranker-base model từ Hugging Face
2. WHEN RRF_Fusion returns top-20 candidates, THE Cross_Encoder_Reranker SHALL rerank them và return top-10 most relevant results
3. THE Cross_Encoder_Reranker SHALL compute relevance scores trong range [0, 1] cho mỗi query-document pair
4. WHEN measuring precision@10 on evaluation dataset, THE Cross_Encoder_Reranker SHALL achieve at least 85% precision (improvement từ 60%)
5. THE Cross_Encoder_Reranker SHALL complete reranking of 20 candidates within 200 milliseconds

### Requirement 4: Embedding Cache Implementation

**User Story:** Là một cost-conscious developer, tôi muốn cache embeddings và relevance scores, để giảm 80% API calls cho repeated queries.

#### Acceptance Criteria

1. THE RAG_System SHALL enable Caffeine cache với @Cacheable annotation cho embedding operations
2. THE Embedding_Cache SHALL cache embeddings với TTL (Time To Live) là 24 hours
3. THE Embedding_Cache SHALL cache relevance scores với TTL là 1 hour
4. WHEN a query is repeated within cache TTL, THE Embedding_Cache SHALL return cached results without calling embedding API
5. WHEN measuring cache hit rate over 1 week, THE Embedding_Cache SHALL achieve at least 80% hit rate cho repeated queries

### Requirement 5: Spring AI Integration for HyDE and Multi-Query

**User Story:** Là một ML engineer, tôi muốn thay thế mock implementations bằng real Spring AI ChatClient, để HyDE và Multi-Query expansion hoạt động thực tế và tăng recall 15-30%.

#### Acceptance Criteria

1. THE RAG_System SHALL integrate Spring AI ChatClient để replace mock implementations
2. WHEN HyDE is enabled, THE RAG_System SHALL generate hypothetical answers using ChatClient và embed them for retrieval
3. WHEN Multi-Query expansion is enabled, THE RAG_System SHALL generate 3-5 query variations using ChatClient
4. WHEN measuring recall on complex queries, THE RAG_System SHALL improve recall by at least 15% compared to baseline
5. THE RAG_System SHALL complete HyDE generation và Multi-Query expansion within 1 second combined

### Requirement 6: Semantic Chunking Optimization

**User Story:** Là một content engineer, tôi muốn optimize semantic chunker để giảm unnecessary chunk overlap, để tiết kiệm 20% storage và improve retrieval precision.

#### Acceptance Criteria

1. THE Semantic_Chunker SHALL detect semantic boundaries bằng embedding similarity threshold 0.7
2. THE Semantic_Chunker SHALL reduce chunk size từ current size xuống 1000-1200 characters
3. WHEN chunking documents, THE Semantic_Chunker SHALL maintain semantic coherence within each chunk
4. WHEN comparing chunk overlap before and after optimization, THE Semantic_Chunker SHALL reduce unnecessary overlap by at least 20%
5. THE Semantic_Chunker SHALL complete chunking of 10MB document within 5 seconds

### Requirement 7: Circuit Breaker and Retry for LLM Calls

**User Story:** Là một reliability engineer, tôi muốn implement circuit breaker và retry logic cho LLM calls, để tránh cascade failures khi LLM service down.

#### Acceptance Criteria

1. THE RAG_System SHALL configure Resilience4j circuit breaker với failure threshold 50% và wait duration 60 seconds
2. THE RAG_System SHALL configure retry policy với maximum 3 attempts và exponential backoff
3. WHEN LLM service fails, THE Circuit_Breaker SHALL open after 50% failure rate và prevent further calls for 60 seconds
4. WHEN Circuit_Breaker is open, THE RAG_System SHALL return fallback response hoặc cached result
5. THE RAG_System SHALL configure timeout 30 seconds cho mỗi LLM call using @TimeLimiter annotation

### Requirement 8: Rate Limiting per User

**User Story:** Là một security engineer, tôi muốn implement rate limiting per user, để tránh API abuse và protect API quota.

#### Acceptance Criteria

1. THE RAG_System SHALL implement Bucket4j rate limiter với per-user buckets
2. THE Rate_Limiter SHALL enforce 10 requests per minute cho FREE tier users
3. THE Rate_Limiter SHALL enforce 100 requests per minute cho PREMIUM tier users
4. WHEN rate limit is exceeded, THE Rate_Limiter SHALL return HTTP 429 (Too Many Requests) với Retry-After header
5. THE Rate_Limiter SHALL reset buckets every minute theo sliding window algorithm

### Requirement 9: Token Cost Tracking

**User Story:** Là một finance manager, tôi muốn track token consumption và costs real-time, để optimize spending và avoid budget overruns.

#### Acceptance Criteria

1. THE RAG_System SHALL integrate JTokkit library để count tokens accurately
2. THE Token_Cost_Tracker SHALL track input tokens và output tokens separately cho mỗi LLM call
3. THE Token_Cost_Tracker SHALL calculate cost dựa trên pricing model (e.g., $0.002 per 1K tokens)
4. WHEN cumulative cost exceeds $100 threshold, THE Token_Cost_Tracker SHALL send budget alert notification
5. THE Token_Cost_Tracker SHALL expose cost metrics qua Prometheus endpoint

### Requirement 10: Database Connection Pool Tuning

**User Story:** Là một database administrator, tôi muốn tune HikariCP connection pool, để tránh connection exhaustion under high load.

#### Acceptance Criteria

1. THE RAG_System SHALL configure HikariCP với maximum-pool-size=20 connections
2. THE RAG_System SHALL configure connection timeout 30 seconds
3. THE RAG_System SHALL enable connection leak detection với leak detection threshold 60 seconds
4. WHEN connection leak is detected, THE RAG_System SHALL log warning với stack trace
5. THE RAG_System SHALL expose HikariCP metrics (active connections, idle connections, pending threads) qua Actuator

### Requirement 11: Request Timeout and Graceful Degradation

**User Story:** Là một user experience designer, tôi muốn implement request timeout và graceful degradation, để users không phải chờ indefinitely khi system slow.

#### Acceptance Criteria

1. THE RAG_System SHALL wrap RAG pipeline trong CompletableFuture với timeout 30 seconds
2. WHEN timeout occurs, THE RAG_System SHALL cancel ongoing operations và return partial results if available
3. WHEN timeout occurs và no partial results available, THE RAG_System SHALL return graceful error message với suggestions
4. THE RAG_System SHALL log timeout events với request context (query, user_id, timestamp)
5. THE RAG_System SHALL expose timeout rate metric qua Prometheus

### Requirement 12: Prometheus Metrics Collection

**User Story:** Là một DevOps engineer, tôi muốn collect comprehensive metrics và expose qua Prometheus, để có 100% visibility vào production system.

#### Acceptance Criteria

1. THE RAG_System SHALL create custom Micrometer metrics cho query rate, latency (p50, p95, p99), và error rate
2. THE Metrics_Collector SHALL track vector search latency separately từ total pipeline latency
3. THE Metrics_Collector SHALL track cache hit rate, circuit breaker state, và rate limit violations
4. THE RAG_System SHALL expose metrics endpoint tại /actuator/prometheus
5. THE Metrics_Collector SHALL include labels (user_tier, query_type, error_type) cho dimensional analysis

### Requirement 13: Structured Logging with MDC

**User Story:** Là một support engineer, tôi muốn structured logging với request correlation, để dễ dàng trace requests qua multiple services.

#### Acceptance Criteria

1. THE RAG_System SHALL implement RequestIdFilter để generate và inject unique requestId vào MDC (Mapped Diagnostic Context)
2. THE RAG_System SHALL configure Logback pattern để include requestId và userId trong mọi log entries
3. WHEN a request flows through multiple components, THE RAG_System SHALL propagate requestId qua MDC
4. THE RAG_System SHALL log key events (query received, retrieval completed, generation completed) với structured JSON format
5. THE RAG_System SHALL include execution time và result count trong log entries

### Requirement 14: Integration Tests with Testcontainers

**User Story:** Là một QA engineer, tôi muốn comprehensive integration tests với real PostgreSQL, để có confidence khi deploy to production.

#### Acceptance Criteria

1. THE RAG_System SHALL create AbstractIntegrationTest base class với PostgreSQL Testcontainer và pgvector extension
2. THE RAG_System SHALL implement VectorSearchIntegrationTest covering HNSW index creation và similarity search
3. THE RAG_System SHALL implement HybridRagIntegrationTest covering end-to-end pipeline từ query đến response
4. WHEN integration tests run, THE RAG_System SHALL verify vector search latency < 100ms và precision@10 > 80%
5. THE RAG_System SHALL achieve at least 80% code coverage cho core RAG components

### Requirement 15: RAGAS Evaluation Framework

**User Story:** Là một ML engineer, tôi muốn automated RAG quality evaluation bằng RAGAS metrics, để measure faithfulness, answer relevancy, và context precision.

#### Acceptance Criteria

1. THE RAG_System SHALL integrate RAGAS Python library với evaluation dataset
2. THE RAG_System SHALL compute Faithfulness score measuring factual consistency giữa answer và retrieved context
3. THE RAG_System SHALL compute Answer Relevancy score measuring relevance của answer to query
4. THE RAG_System SHALL compute Context Precision score measuring quality của retrieved contexts
5. WHEN running RAGAS evaluation, THE RAG_System SHALL achieve minimum scores: Faithfulness > 0.8, Answer Relevancy > 0.85, Context Precision > 0.75

### Requirement 16: Health Check and Readiness Probe

**User Story:** Là một Kubernetes operator, tôi muốn custom health checks và readiness probes, để K8s có thể manage pod lifecycle correctly.

#### Acceptance Criteria

1. THE RAG_System SHALL implement RagHealthIndicator extending Spring Boot HealthIndicator
2. THE Health_Indicator SHALL check PostgreSQL connectivity, pgvector extension availability, và embedding service reachability
3. THE Health_Indicator SHALL return UP status only when all critical dependencies are healthy
4. THE RAG_System SHALL expose liveness probe tại /actuator/health/liveness
5. THE RAG_System SHALL expose readiness probe tại /actuator/health/readiness với startup grace period 30 seconds

## Non-Functional Requirements

### Performance
- Vector search latency: < 100ms (p95)
- Total RAG pipeline latency: < 2 seconds (p95)
- System throughput: > 100 queries per second
- Cache hit rate: > 80% for repeated queries

### Reliability
- System uptime: 99.9% (< 43 minutes downtime per month)
- Circuit breaker prevents cascade failures
- Graceful degradation under high load
- Zero data loss during failures

### Scalability
- Support up to 1 million vectors in index
- Horizontal scaling via stateless design
- Connection pool handles 20 concurrent connections
- Rate limiting prevents resource exhaustion

### Observability
- All critical operations logged with structured format
- Metrics exposed for Prometheus scraping
- Request tracing via correlation IDs
- Health checks for Kubernetes orchestration

### Cost Optimization
- 50% storage reduction via dimension correction
- 80% API call reduction via caching
- Real-time cost tracking and budget alerts
- Token usage optimization

### Security
- Rate limiting per user tier
- Input validation and sanitization
- Secure credential management
- Audit logging for compliance

## Success Metrics

- **Performance**: Vector search < 100ms, Total pipeline < 2s
- **Accuracy**: Precision@10 > 85%, Recall improvement > 15%
- **Reliability**: 99.9% uptime, Circuit breaker prevents failures
- **Cost**: 50% storage reduction, 80% cache hit rate
- **Quality**: RAGAS scores > thresholds (Faithfulness > 0.8, Answer Relevancy > 0.85, Context Precision > 0.75)
- **Coverage**: Integration test coverage > 80%

## Dependencies

- Spring Boot 4.0.6
- Java 21
- PostgreSQL 15+ với pgvector extension
- Resilience4j (Circuit Breaker, Retry, Rate Limiter)
- Micrometer + Prometheus
- Spring AI
- Caffeine Cache
- Testcontainers
- JTokkit (token counting)
- Hugging Face Transformers (BAAI/bge-reranker-base)
- RAGAS (Python evaluation framework)

## Timeline Estimate

- **Sprint 1 (Week 1)**: Requirements 1, 2, 7, 12 - CRITICAL (8 hours)
- **Sprint 2 (Week 2)**: Requirements 3, 5, 8, 11 (11 hours)
- **Sprint 3 (Week 3)**: Requirements 14, 13, 16, 4 (9 hours)
- **Sprint 4 (Optional)**: Requirements 6, 9, 10, 15 (10 hours)

**Total Effort**: 38 hours (≈ 5 working days)
