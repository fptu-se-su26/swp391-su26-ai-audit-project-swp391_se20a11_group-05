# PROMPT: SPRING BOOT ARCHITECTURE & SOURCE CODE AUDIT

## Role Definition
You are a **Senior Spring Boot Architect** with 10+ years of experience building production systems serving 200,000+ concurrent users. Your expertise includes:
- Layered Architecture & Domain-Driven Design (DDD)
- High-performance Spring Boot applications with HikariCP, caching, and async processing
- Security hardening (JWT, OAuth2, secrets management, HTTPS)
- Scalability patterns (horizontal scaling, stateless design, distributed caching)
- Production-ready practices (externalized config, observability, CI/CD)

## Objective
Audit the **Smart City Backend** Spring Boot application against production standards for a system serving **200,000 users**. Evaluate:
1. **Architecture Pattern** - Layered architecture quality (Controller → Service → Repository)
2. **Dependency Management** - Maven configuration, version management, security vulnerabilities
3. **Project Structure** - Package organization, separation of concerns, modularity
4. **Configuration Management** - Externalized config, secrets handling, environment-specific settings
5. **Security Posture** - Authentication, authorization, HTTPS, rate limiting, input validation
6. **Performance & Scalability** - Connection pooling, caching, async processing, stateless design
7. **Code Quality** - SOLID principles, DRY, testability, error handling

## Input Context

### System Overview
- **Application**: Smart City Backend (Monolithic Spring Boot 4.0.6)
- **Language**: Java 21
- **Build Tool**: Maven
- **Databases**: PostgreSQL (primary), SQL Server (legacy)
- **Key Features**:
  - JWT-based authentication with MFA (TOTP for officers, SMS OTP for citizens)
  - Hybrid RAG (Retrieval-Augmented Generation) with vector search + BM25
  - AI Orchestrator with Groq/Gemini API key pooling and circuit breakers
  - Real-time notifications via WebSocket
  - Weather forecasting with Caffeine cache
  - File upload management
  - Analytics and feedback modules

### Target Scale
- **Users**: 200,000 registered users
- **Concurrent Users**: 20,000 peak concurrent (10% of total)
- **Requests/Second**: 2,000 RPS peak
- **Database Connections**: 10 max pool size (HikariCP)
- **Uptime SLA**: 99.9% (8.76 hours downtime/year max)

### Files to Audit
1. **pom.xml** - Maven dependencies and build configuration
2. **application.properties** - Configuration and externalized settings
3. **Package Structure** - `com.example.smartcity.*` (controller, service, repository, dto, entity, config, security)
4. **Security Components** - `SecurityConfig.java`, JWT filters, rate limiters, secrets management
5. **Module Organization** - `modules/auth`, `modules/user`, `modules/chatbot`, `modules/notification`, etc.
6. **Common Layer** - `common/base`, `common/exception`, `common/response`, `common/security`

---

## Audit Checklist

### 1. ARCHITECTURE PATTERN (Layered Architecture)

#### 1.1 Controller Layer (Presentation)
- [ ] **Thin Controllers**: Controllers MUST NOT contain business logic (only request validation, DTO mapping, response formatting)
- [ ] **REST Best Practices**: Proper HTTP methods (GET, POST, PUT, DELETE), status codes (200, 201, 400, 401, 404, 500)
- [ ] **Input Validation**: `@Valid` + `@Validated` on DTOs with JSR-303 annotations (`@NotNull`, `@Size`, `@Email`, `@Pattern`)
- [ ] **Exception Handling**: Global `@ControllerAdvice` for consistent error responses
- [ ] **API Versioning**: `/api/v1/...` or header-based versioning for backward compatibility
- [ ] **Rate Limiting**: Applied at controller level for public endpoints (login, register, SMS OTP)

**Scoring**:
- ✅ **9-10/10**: All criteria met, production-ready
- ⚠️ **6-8/10**: Minor issues (missing validation, inconsistent error handling)
- ❌ **0-5/10**: Critical issues (business logic in controllers, no input validation, no rate limiting)

#### 1.2 Service Layer (Business Logic)
- [ ] **100% Business Logic**: All algorithms, calculations, and workflows MUST be in Service layer
- [ ] **Transaction Management**: `@Transactional` on methods that modify data (with proper propagation and isolation levels)
- [ ] **Stateless Design**: Services MUST NOT store user-specific state (use database or distributed cache instead)
- [ ] **Dependency Injection**: Constructor injection (preferred) or `@Autowired` field injection
- [ ] **Interface Segregation**: Services implement interfaces for testability and loose coupling
- [ ] **Error Handling**: Business exceptions (`ResourceNotFoundException`, `ValidationException`) with meaningful messages

**Scoring**:
- ✅ **9-10/10**: Clean separation, stateless, transactional, testable
- ⚠️ **6-8/10**: Minor issues (missing transactions, some state leakage)
- ❌ **0-5/10**: Critical issues (stateful services, no transactions, tight coupling)

#### 1.3 Repository Layer (Data Access)
- [ ] **Spring Data JPA**: Use `JpaRepository<Entity, ID>` for CRUD operations
- [ ] **Custom Queries**: `@Query` with JPQL or native SQL for complex queries (with proper indexing)
- [ ] **Pagination**: `Pageable` parameter for list endpoints to prevent memory exhaustion
- [ ] **Projection**: Use DTOs or projections to fetch only required columns (avoid `SELECT *`)
- [ ] **N+1 Query Prevention**: `@EntityGraph` or `JOIN FETCH` to avoid lazy loading issues
- [ ] **Connection Pooling**: HikariCP configured with proper pool size (10-20 for 200k users)

**Scoring**:
- ✅ **9-10/10**: Optimized queries, pagination, no N+1 issues
- ⚠️ **6-8/10**: Minor issues (missing pagination, some N+1 queries)
- ❌ **0-5/10**: Critical issues (no connection pooling, SELECT *, no indexing)

#### 1.4 DTO & Entity Separation
- [ ] **DTO for API**: Use DTOs (`@Data` + Lombok) for request/response to decouple API from database schema
- [ ] **Entity for Database**: Use `@Entity` classes with JPA annotations (`@Table`, `@Column`, `@Id`, `@GeneratedValue`)
- [ ] **Mapping**: MapStruct or ModelMapper for DTO ↔ Entity conversion (avoid manual mapping)
- [ ] **Security**: NEVER expose `@Entity` directly in API responses (prevents mass assignment attacks)
- [ ] **Validation**: DTOs have `@Valid` annotations, Entities have database constraints (`@Column(nullable=false)`)

**Scoring**:
- ✅ **9-10/10**: Complete separation, automated mapping, secure
- ⚠️ **6-8/10**: Minor issues (some manual mapping, missing validation)
- ❌ **0-5/10**: Critical issues (entities exposed in API, no DTOs, mass assignment risk)

---

### 2. DEPENDENCY MANAGEMENT (Maven)

#### 2.1 Dependency Versions
- [ ] **Spring Boot BOM**: Use `spring-boot-starter-parent` for consistent version management
- [ ] **No Version Conflicts**: Run `mvn dependency:tree` to check for conflicts
- [ ] **Security Patches**: All dependencies MUST be on latest patch versions (check CVE databases)
- [ ] **Minimal Dependencies**: Avoid unused dependencies (bloat increases attack surface)

#### 2.2 Critical Dependencies Audit
| Dependency | Current Version | Latest Stable | Security Issues | Recommendation |
|------------|----------------|---------------|-----------------|----------------|
| Spring Boot | 4.0.6 | 4.0.6 | ✅ None | Keep |
| JJWT | 0.11.5 | 0.12.6 | ⚠️ Minor | Upgrade to 0.12.6 |
| PostgreSQL Driver | (runtime) | 42.7.3 | ✅ None | Keep |
| Twilio SDK | 10.1.1 | 10.6.3 | ⚠️ Minor | Upgrade to 10.6.3 |
| Resilience4j | 2.2.0 | 2.2.0 | ✅ None | Keep |
| Caffeine | (managed) | 3.1.8 | ✅ None | Keep |

**Action Items**:
1. Run `mvn versions:display-dependency-updates` to check for updates
2. Run `mvn dependency-check:check` (OWASP Dependency-Check) to scan for CVEs
3. Upgrade JJWT to 0.12.6 for security patches
4. Upgrade Twilio SDK to 10.6.3 for bug fixes

#### 2.3 Build Configuration
- [ ] **Compiler Plugin**: Java 21 source/target configured
- [ ] **Annotation Processors**: Lombok + MapStruct configured correctly (order matters!)
- [ ] **Executable JAR**: `spring-boot-maven-plugin` configured to create runnable JAR
- [ ] **Test Exclusions**: Lombok excluded from final JAR

**Scoring**:
- ✅ **9-10/10**: All dependencies up-to-date, no CVEs, clean build
- ⚠️ **6-8/10**: Minor version lags, no critical CVEs
- ❌ **0-5/10**: Critical CVEs, version conflicts, broken build

---

### 3. PROJECT STRUCTURE (Package Organization)

#### 3.1 Current Structure Analysis
```
com.example.smartcity/
├── ai_orchestrator/          # AI key pooling, racing, circuit breakers
│   ├── adapter/              # Groq, Gemini adapters
│   ├── pool/                 # API key pool management
│   ├── racing/               # Parallel LLM racing
│   ├── guardrails/           # Input/output validation
│   └── controller/           # Admin API endpoints
├── common/                   # Shared utilities
│   ├── base/                 # Base classes (BaseEntity, BaseDTO)
│   ├── exception/            # Custom exceptions
│   ├── response/             # Standard API response wrapper
│   └── security/             # Shared security utilities
├── config/                   # Spring configuration beans
│   ├── CacheConfig.java
│   ├── WebClientConfig.java
│   └── WebSocketConfig.java
├── modules/                  # Feature modules (bounded contexts)
│   ├── auth/                 # Authentication (login, register, MFA)
│   ├── user/                 # User management (CRUD, roles)
│   ├── chatbot/              # AI chatbot with RAG
│   ├── notification/         # WebSocket notifications
│   ├── weather/              # Weather forecast caching
│   ├── feedback/             # User feedback
│   ├── analytics/            # Usage analytics
│   └── file/                 # File upload/download
├── rag/                      # Hybrid RAG module
│   ├── ingestion/            # Document indexing
│   ├── retrieval/            # Vector + BM25 search
│   ├── generation/           # LLM response generation
│   └── selfrag/              # Self-RAG (relevance scoring)
└── security/                 # Security infrastructure
    ├── jwt/                  # JWT token generation/validation
    ├── ratelimit/            # Rate limiting filters
    ├── secrets/              # Secrets management (Vault, K8s, Docker)
    └── https/                # HTTPS redirect filter
```

#### 3.2 Structure Quality Checklist
- [ ] **Modular Design**: Each `modules/*` folder is a bounded context (can be extracted to microservice later)
- [ ] **Layered Within Modules**: Each module has `controller/`, `service/`, `repository/`, `dto/`, `entity/`
- [ ] **Common Layer**: Shared code in `common/` (avoid duplication across modules)
- [ ] **Configuration Separation**: All `@Configuration` classes in `config/` package
- [ ] **Security Isolation**: Security components in dedicated `security/` package
- [ ] **No Circular Dependencies**: Run `mvn dependency:analyze` to check

**Scoring**:
- ✅ **9-10/10**: Clean modular structure, no circular deps, DDD-aligned
- ⚠️ **6-8/10**: Minor issues (some cross-module coupling, missing layers)
- ❌ **0-5/10**: Critical issues (circular deps, no modularity, spaghetti code)

---

### 4. CONFIGURATION MANAGEMENT (Externalized Config)

#### 4.1 Secrets Management Audit

**Current State** (from `application.properties`):
```properties
# ❌ CRITICAL ISSUE: Hardcoded secrets with empty defaults
jwt.secret=${JWT_SECRET:}
encryption.secret=${ENCRYPTION_SECRET:}
twilio.account-sid=${TWILIO_ACCOUNT_SID:}
twilio.auth-token=${TWILIO_AUTH_TOKEN:}
groq.api-keys=${GROQ_API_KEYS:}
gemini.api-keys=${GEMINI_API_KEYS:}
admin.api-token=${ADMIN_API_TOKEN:}
```

**Issues**:
1. ❌ **Empty Defaults**: If env vars not set, app starts with empty secrets (security risk)
2. ❌ **No Startup Validation**: App should fail-fast if required secrets missing
3. ❌ **No Secrets Manager Integration**: Should support Vault, K8s Secrets, Docker Secrets

**Required Fixes**:
- [ ] **Startup Validation**: Create `SecurityManager` bean that validates all secrets at startup (fail-fast if missing)
- [ ] **Secrets Manager Integration**: Support Vault, K8s Secrets, Docker Secrets (priority order: Vault > K8s > Docker > Env)
- [ ] **Remove Defaults**: Change `${JWT_SECRET:}` to `${JWT_SECRET}` (no default) to force explicit configuration
- [ ] **Minimum Length Validation**: JWT_SECRET ≥ 32 chars, ENCRYPTION_SECRET = exactly 32 chars

#### 4.2 Environment-Specific Configuration
- [ ] **Profiles**: Use `application-{profile}.properties` for dev, test, prod
- [ ] **Profile Activation**: `spring.profiles.active=${SPRING_PROFILES_ACTIVE:dev}`
- [ ] **Sensitive Data**: NEVER commit `application-prod.properties` with real secrets (use env vars or secrets manager)

#### 4.3 Configuration Properties Classes
- [ ] **Type-Safe Config**: Use `@ConfigurationProperties` classes instead of `@Value` annotations
- [ ] **Validation**: Add `@Validated` + JSR-303 annotations to config classes
- [ ] **Documentation**: Add Javadoc to config classes explaining each property

**Example**:
```java
@ConfigurationProperties(prefix = "jwt")
@Validated
@Data
public class JwtProperties {
    @NotBlank(message = "JWT secret must not be empty")
    @Size(min = 32, message = "JWT secret must be at least 32 characters")
    private String secret;
    
    @Min(value = 60000, message = "JWT expiration must be at least 1 minute")
    private long expirationMs = 900000; // 15 minutes
}
```

**Scoring**:
- ✅ **9-10/10**: All secrets externalized, startup validation, secrets manager integration
- ⚠️ **6-8/10**: Secrets externalized but no validation or secrets manager
- ❌ **0-5/10**: Hardcoded secrets, no validation, security risk

---

### 5. SECURITY POSTURE

#### 5.1 Authentication & Authorization
- [ ] **JWT Implementation**: Short-lived access tokens (15 min) + long-lived refresh tokens (7 days)
- [ ] **Token Blacklist**: Logout invalidates tokens immediately (Redis or database-backed)
- [ ] **MFA Support**: TOTP for officers, SMS OTP for citizens
- [ ] **Password Hashing**: BCrypt with cost factor ≥ 12
- [ ] **Role-Based Access Control (RBAC)**: `@PreAuthorize("hasRole('ADMIN')")` on sensitive endpoints

#### 5.2 HTTPS & Transport Security
- [ ] **HTTPS Enabled**: `server.ssl.enabled=true` in production
- [ ] **HTTP Redirect**: HTTP (8080) → HTTPS (8443) with 301 status
- [ ] **HSTS Header**: `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- [ ] **TLS Version**: TLS 1.2+ only (disable SSLv3, TLS 1.0, TLS 1.1)
- [ ] **Strong Ciphers**: AES-256-GCM, ChaCha20-Poly1305

#### 5.3 Rate Limiting
- [ ] **Login Endpoint**: 5 attempts / 15 min per IP (prevent brute force)
- [ ] **SMS OTP**: 3 attempts / 10 min per phone number (prevent Twilio abuse)
- [ ] **Register Endpoint**: 5 attempts / 60 min per IP (prevent mass account creation)
- [ ] **API Endpoints**: 100 requests / min per user (prevent DoS)

#### 5.4 Input Validation & Output Encoding
- [ ] **DTO Validation**: `@Valid` on all `@RequestBody` parameters
- [ ] **SQL Injection Prevention**: Use JPA/JPQL (no raw SQL concatenation)
- [ ] **XSS Prevention**: Sanitize user input, use `Content-Security-Policy` header
- [ ] **CSRF Protection**: Enabled for state-changing operations (POST, PUT, DELETE)

**Scoring**:
- ✅ **9-10/10**: All security controls in place, production-ready
- ⚠️ **6-8/10**: Minor gaps (missing rate limiting, weak TLS config)
- ❌ **0-5/10**: Critical gaps (no HTTPS, no rate limiting, hardcoded secrets)

---

### 6. PERFORMANCE & SCALABILITY

#### 6.1 Database Connection Pooling (HikariCP)
**Current Config**:
```properties
spring.datasource.hikari.maximum-pool-size=10
spring.datasource.hikari.minimum-idle=2
spring.datasource.hikari.connection-timeout=30000
spring.datasource.hikari.idle-timeout=600000
spring.datasource.hikari.max-lifetime=1800000
spring.datasource.hikari.leak-detection-threshold=60000
```

**Analysis**:
- ❌ **Pool Size Too Small**: 10 connections for 200k users = bottleneck
- ✅ **Leak Detection**: Enabled (good for debugging)
- ⚠️ **Idle Timeout**: 10 minutes (could be shorter to free resources)

**Recommendations for 200k Users**:
```properties
# Formula: pool_size = (core_count * 2) + effective_spindle_count
# For 8-core server with SSD: (8 * 2) + 1 = 17
spring.datasource.hikari.maximum-pool-size=20
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.connection-timeout=20000  # 20s (fail fast)
spring.datasource.hikari.idle-timeout=300000       # 5 min (free idle connections)
spring.datasource.hikari.max-lifetime=1800000      # 30 min (rotate connections)
```

#### 6.2 Caching Strategy
- [ ] **Caffeine Cache**: Configured for weather forecasts (good)
- [ ] **Redis Cache**: REQUIRED for distributed caching (token blacklist, rate limiting, session data)
- [ ] **Cache Eviction**: TTL configured for all cache entries (prevent stale data)
- [ ] **Cache Warming**: Pre-load frequently accessed data at startup

**Missing Caches** (should be added):
1. **User Roles Cache**: Cache user roles for 5 minutes (reduce DB queries on every request)
2. **API Response Cache**: Cache GET endpoints with `@Cacheable` (e.g., `/api/weather/forecast`)
3. **Rate Limit Cache**: Use Redis for distributed rate limiting (current in-memory won't work with multiple instances)

#### 6.3 Async Processing
- [ ] **@Async Methods**: Use for non-blocking operations (email sending, notifications, analytics)
- [ ] **Thread Pool**: Configure `TaskExecutor` with proper pool size
- [ ] **CompletableFuture**: Use for parallel processing (e.g., AI racing in `ai_orchestrator`)

**Current State**:
- ✅ **AI Racing**: Uses `CompletableFuture` for parallel Groq/Gemini calls (good)
- ❌ **Missing @Async**: No async processing for notifications, file uploads, analytics

#### 6.4 Stateless Design
- [ ] **No Session State**: Use JWT tokens (stateless) instead of HTTP sessions
- [ ] **Horizontal Scaling**: App can run on multiple instances without shared state
- [ ] **Sticky Sessions**: NOT required (all state in database or Redis)

**Scoring**:
- ✅ **9-10/10**: Optimized connection pool, distributed caching, async processing, stateless
- ⚠️ **6-8/10**: Minor issues (small pool size, missing caches, some blocking operations)
- ❌ **0-5/10**: Critical issues (no connection pooling, no caching, stateful design)

---

### 7. CODE QUALITY & BEST PRACTICES

#### 7.1 SOLID Principles
- [ ] **Single Responsibility**: Each class has one reason to change
- [ ] **Open/Closed**: Classes open for extension, closed for modification (use interfaces)
- [ ] **Liskov Substitution**: Subtypes can replace base types without breaking behavior
- [ ] **Interface Segregation**: Clients don't depend on methods they don't use
- [ ] **Dependency Inversion**: Depend on abstractions (interfaces), not concrete classes

#### 7.2 DRY (Don't Repeat Yourself)
- [ ] **Common Utilities**: Shared code in `common/` package (avoid copy-paste)
- [ ] **Base Classes**: `BaseEntity`, `BaseDTO`, `BaseService` for common fields/methods
- [ ] **Aspect-Oriented Programming (AOP)**: Use `@Aspect` for cross-cutting concerns (logging, metrics, security)

#### 7.3 Error Handling
- [ ] **Global Exception Handler**: `@ControllerAdvice` for consistent error responses
- [ ] **Custom Exceptions**: Business exceptions extend `RuntimeException` (e.g., `ResourceNotFoundException`)
- [ ] **Error Response Format**: Consistent JSON structure (`{ "error": "...", "message": "...", "timestamp": "..." }`)
- [ ] **Logging**: Log errors with stack traces at ERROR level (use SLF4J + Logback)

#### 7.4 Testing
- [ ] **Unit Tests**: Service layer tests with mocked repositories (JUnit 5 + Mockito)
- [ ] **Integration Tests**: Controller tests with `@SpringBootTest` + Testcontainers
- [ ] **Test Coverage**: ≥ 80% line coverage (use JaCoCo)
- [ ] **Property-Based Testing**: Use jqwik for testing invariants (e.g., token validation)

**Scoring**:
- ✅ **9-10/10**: SOLID principles followed, DRY, comprehensive tests, clean code
- ⚠️ **6-8/10**: Minor issues (some duplication, missing tests, minor violations)
- ❌ **0-5/10**: Critical issues (no tests, spaghetti code, massive duplication)

---

## Output Format

### Executive Summary
Provide a 3-sentence summary of the overall architecture quality:
- **Current State**: Brief description of the architecture
- **Critical Issues**: Top 3 issues that MUST be fixed before production
- **Overall Score**: X/10 with justification

### Detailed Findings

For each section (1-7), provide:

#### Section Name (Score: X/10)
**Status**: ✅ Good | ⚠️ Needs Improvement | ❌ Critical Issue

**Findings**:
- ✅ **Strength 1**: [What's working well]
- ✅ **Strength 2**: [What's working well]
- ⚠️ **Issue 1**: [What needs improvement]
- ❌ **Critical Issue 1**: [What MUST be fixed]

**Recommendations**:
1. **[Priority]** [Specific action with code example]
2. **[Priority]** [Specific action with code example]

**Code Example** (if applicable):
```java
// ❌ BEFORE (current code)
@Value("${jwt.secret}")
private String jwtSecret;

// ✅ AFTER (recommended)
@ConfigurationProperties(prefix = "jwt")
@Validated
@Data
public class JwtProperties {
    @NotBlank @Size(min = 32)
    private String secret;
}
```

### Priority Matrix

| Priority | Issue | Impact | Effort | Timeline |
|----------|-------|--------|--------|----------|
| P0 | Hardcoded secrets | 🔴 Critical | 2 days | Week 1 |
| P0 | No HTTPS | 🔴 Critical | 1 day | Week 1 |
| P1 | Small connection pool | 🟡 High | 1 hour | Week 1 |
| P1 | Missing Redis cache | 🟡 High | 3 days | Week 2 |
| P2 | Missing async processing | 🟢 Medium | 2 days | Week 3 |

### Scalability Roadmap (200k Users)

**Phase 1: Immediate Fixes (Week 1)**
- Fix P0 security issues (secrets, HTTPS)
- Increase HikariCP pool size to 20
- Add startup validation for secrets

**Phase 2: Performance Optimization (Week 2-3)**
- Integrate Redis for distributed caching
- Add rate limiting with Redis backend
- Implement async processing for notifications

**Phase 3: Horizontal Scaling (Week 4)**
- Deploy 3+ instances behind load balancer
- Configure sticky sessions (if needed)
- Set up distributed tracing (Zipkin/Jaeger)

**Phase 4: Monitoring & Observability (Week 5)**
- Integrate Prometheus + Grafana
- Set up alerts for high latency, error rates
- Add custom metrics for business KPIs

### Final Recommendation

**Production Readiness**: ✅ Ready | ⚠️ Ready with Fixes | ❌ Not Ready

**Justification**: [2-3 sentences explaining the decision]

**Next Steps**:
1. [Immediate action 1]
2. [Immediate action 2]
3. [Immediate action 3]

---

## Attack Scenarios (Security Testing)

### Scenario 1: Brute Force Login Attack
**Attack**: Attacker tries 1000 login attempts with common passwords
**Expected Defense**: Rate limiter blocks after 5 attempts, returns HTTP 429
**Test Command**:
```bash
for i in {1..20}; do
  curl -X POST http://localhost:8081/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"password123"}' \
    -w "\nStatus: %{http_code}\n"
done
```
**Expected Output**: First 5 requests return 401, remaining return 429

### Scenario 2: JWT Token Theft
**Attack**: Attacker steals JWT token and uses it after user logs out
**Expected Defense**: Token blacklist rejects the token with HTTP 401
**Test Steps**:
1. Login and get JWT token
2. Logout (token added to blacklist)
3. Try to access protected endpoint with stolen token
**Expected Output**: HTTP 401 Unauthorized

### Scenario 3: SQL Injection
**Attack**: Attacker sends malicious input to search endpoint
**Test Input**: `'; DROP TABLE users; --`
**Expected Defense**: JPA parameterized queries prevent SQL injection
**Test Command**:
```bash
curl -X GET "http://localhost:8081/api/users/search?name=';DROP%20TABLE%20users;--"
```
**Expected Output**: HTTP 400 Bad Request (validation error) or empty results (no SQL execution)

### Scenario 4: Secrets Exposure
**Attack**: Attacker reads `application.properties` from version control
**Expected Defense**: No secrets in file, only env var references
**Test Command**:
```bash
git grep -E "(jwt\.secret|twilio\.auth-token|encryption\.secret)" -- "*.properties"
```
**Expected Output**: Only `${ENV_VAR}` references, no hardcoded values

---

## Conclusion

This prompt provides a **comprehensive framework** for auditing the Smart City Backend architecture against production standards for 200,000 users. Use this checklist to:
1. **Identify critical security gaps** (P0 issues)
2. **Optimize performance bottlenecks** (connection pool, caching)
3. **Ensure scalability** (stateless design, horizontal scaling)
4. **Improve code quality** (SOLID, DRY, testing)

**Remember**: Production readiness is not just about features—it's about **security, performance, reliability, and maintainability**. Every issue found is an opportunity to build a more robust system.
