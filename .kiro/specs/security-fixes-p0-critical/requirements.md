# Requirements Document

## Introduction

This document specifies the requirements for addressing three P0 (Priority Zero) critical security vulnerabilities in the Smart City Backend system. These vulnerabilities pose immediate risks to system security, data confidentiality, and user privacy. The fixes must be implemented with zero downtime and backward compatibility to avoid disrupting existing users.

The Smart City Backend is a monolithic Spring Boot 4.0.6 application running on Java 21, using PostgreSQL and SQL Server databases, with Spring Security and JWT-based authentication. The system currently operates on HTTP port 8081 without encryption and contains hardcoded secrets in configuration files.

## Glossary

- **Security_Manager**: The component responsible for validating secrets, managing encryption keys, and enforcing security policies at application startup
- **HTTPS_Server**: The TLS/SSL-enabled web server component that handles encrypted HTTPS connections on port 8443
- **HTTP_Redirector**: The component that intercepts HTTP requests on port 8080 and redirects them to HTTPS port 8443
- **Token_Manager**: The component responsible for generating, validating, rotating, and revoking JWT access tokens and refresh tokens
- **Token_Blacklist**: The in-memory or database-backed storage that tracks invalidated tokens to prevent reuse after logout
- **Refresh_Token_Store**: The database repository that persists refresh tokens with associated user information and expiration timestamps
- **Secret**: Any sensitive credential including API keys, encryption keys, passwords, or authentication tokens that must not be exposed in source code
- **Environment_Variable**: A system-level configuration value provided at runtime through the operating system or container orchestration platform
- **Secrets_Manager**: An external service (Docker Secrets, Kubernetes Secrets, or HashiCorp Vault) that securely stores and provides secrets to the application
- **Access_Token**: A short-lived JWT token (15 minutes) used to authenticate API requests
- **Refresh_Token**: A long-lived token (7 days) stored in the database used to obtain new access tokens without re-authentication
- **Token_Rotation**: The process of issuing a new refresh token when an old one is used, invalidating the old token
- **Certificate**: A digital certificate (X.509) used to establish TLS/SSL encryption for HTTPS connections
- **Keystore**: A secure file (PKCS12 or JKS format) that stores certificates and private keys for TLS/SSL encryption
- **Startup_Validation**: The process of checking required configuration values and security settings before the application accepts requests
- **Rate_Limiter**: The component that tracks and enforces request rate limits to prevent brute force attacks and abuse

## Requirements

### Requirement 1: Remove Hardcoded Secrets from Configuration Files

**User Story:** As a security engineer, I want all secrets removed from application.properties and loaded from secure external sources, so that credentials are not exposed in version control or to unauthorized personnel.

#### Acceptance Criteria

1. THE Security_Manager SHALL NOT load any secret values from application.properties default values
2. WHEN the application starts, THE Security_Manager SHALL load Twilio credentials (account SID, auth token, phone number) from Environment_Variables
3. WHEN the application starts, THE Security_Manager SHALL load JWT secret from Environment_Variables
4. WHEN the application starts, THE Security_Manager SHALL load encryption secret from Environment_Variables
5. WHEN the application starts, THE Security_Manager SHALL load Groq API keys from Environment_Variables
6. WHEN the application starts, THE Security_Manager SHALL load Gemini API keys from Environment_Variables
7. WHEN the application starts, THE Security_Manager SHALL load admin API token from Environment_Variables
8. FOR ALL secret values loaded from Environment_Variables, THE Security_Manager SHALL verify the values are non-empty strings
9. WHEN application.properties is committed to version control, THE configuration file SHALL contain only environment variable references without default values

### Requirement 2: Validate Secret Requirements at Startup

**User Story:** As a system administrator, I want the application to fail fast at startup if required secrets are missing or invalid, so that I can detect configuration errors before the system accepts traffic.

#### Acceptance Criteria

1. WHEN the application starts, THE Security_Manager SHALL validate that JWT_SECRET Environment_Variable is provided
2. WHEN the application starts, THE Security_Manager SHALL validate that ENCRYPTION_SECRET Environment_Variable is provided
3. WHEN the application starts, THE Security_Manager SHALL validate that TWILIO_ACCOUNT_SID Environment_Variable is provided
4. WHEN the application starts, THE Security_Manager SHALL validate that TWILIO_AUTH_TOKEN Environment_Variable is provided
5. WHEN the application starts, THE Security_Manager SHALL validate that TWILIO_PHONE_NUMBER Environment_Variable is provided
6. WHEN JWT_SECRET is shorter than 32 characters, THE Security_Manager SHALL terminate startup with error message "JWT_SECRET must be at least 32 characters"
7. WHEN ENCRYPTION_SECRET is not exactly 32 characters, THE Security_Manager SHALL terminate startup with error message "ENCRYPTION_SECRET must be exactly 32 characters"
8. WHEN any required secret is missing or empty, THE Security_Manager SHALL terminate startup with error message identifying the missing secret
9. WHEN all required secrets are valid, THE Security_Manager SHALL log "Security validation passed" at INFO level without exposing secret values

### Requirement 3: Integrate with Secrets Management Systems

**User Story:** As a DevOps engineer, I want the application to support multiple secrets management backends, so that I can deploy securely in different environments (Docker, Kubernetes, cloud platforms).

#### Acceptance Criteria

1. WHERE Docker Secrets are available, THE Security_Manager SHALL load secrets from /run/secrets/ directory
2. WHERE Kubernetes Secrets are mounted, THE Security_Manager SHALL load secrets from mounted volume paths
3. WHERE HashiCorp Vault is configured, THE Security_Manager SHALL authenticate to Vault and retrieve secrets from specified paths
4. WHEN multiple secrets sources are available, THE Security_Manager SHALL prioritize in order: Vault, Kubernetes Secrets, Docker Secrets, Environment_Variables
5. WHEN a Secrets_Manager connection fails, THE Security_Manager SHALL fall back to the next available source
6. WHEN no secrets source provides a required secret, THE Security_Manager SHALL terminate startup with error message
7. THE Security_Manager SHALL log which secrets source was used at INFO level during startup

### Requirement 4: Enable HTTPS with TLS/SSL Encryption

**User Story:** As a security engineer, I want all API traffic encrypted with HTTPS, so that sensitive data (passwords, tokens, MFA secrets) cannot be intercepted in transit.

#### Acceptance Criteria

1. THE HTTPS_Server SHALL listen on port 8443 with TLS 1.2 or higher
2. WHEN the application starts in production mode, THE HTTPS_Server SHALL load Certificate and private key from PKCS12 keystore file specified in KEYSTORE_PATH Environment_Variable
3. WHEN loading keystore, THE HTTPS_Server SHALL use password from KEYSTORE_PASSWORD Environment_Variable
4. THE HTTPS_Server SHALL support PKCS12 (.p12, .pfx) and JKS (.jks) keystore formats
5. WHEN a client connects without TLS, THE HTTPS_Server SHALL reject the connection
6. THE HTTPS_Server SHALL support TLS 1.2 and TLS 1.3 protocols
7. THE HTTPS_Server SHALL disable SSLv3, TLS 1.0, and TLS 1.1 protocols
8. THE HTTPS_Server SHALL use strong cipher suites (AES-256-GCM, ChaCha20-Poly1305)
9. WHEN Certificate expiration is within 30 days, THE HTTPS_Server SHALL log a warning at startup

### Requirement 5: Redirect HTTP Traffic to HTTPS

**User Story:** As a user, I want HTTP requests automatically redirected to HTTPS, so that I am protected even if I accidentally use an HTTP URL.

#### Acceptance Criteria

1. THE HTTP_Redirector SHALL listen on port 8080
2. WHEN an HTTP request arrives on port 8080, THE HTTP_Redirector SHALL respond with HTTP 301 status code
3. WHEN redirecting, THE HTTP_Redirector SHALL set Location header to https://[same-host]:8443[same-path]
4. WHEN the request path is /actuator/health, THE HTTP_Redirector SHALL respond with HTTP 200 without redirecting
5. WHEN the request path is /actuator/info, THE HTTP_Redirector SHALL respond with HTTP 200 without redirecting
6. THE HTTP_Redirector SHALL preserve query parameters in the redirect Location header
7. THE HTTP_Redirector SHALL add Strict-Transport-Security header with value "max-age=31536000; includeSubDomains"

### Requirement 6: Implement Short-Lived Access Tokens

**User Story:** As a security engineer, I want access tokens to expire after 15 minutes, so that stolen tokens have a limited window of exploitation.

#### Acceptance Criteria

1. WHEN a user successfully authenticates, THE Token_Manager SHALL generate an Access_Token with 15-minute expiration
2. WHEN a user successfully authenticates, THE Token_Manager SHALL generate a Refresh_Token with 7-day expiration
3. THE Token_Manager SHALL embed user ID, username, and roles in the Access_Token JWT payload
4. THE Token_Manager SHALL embed user ID and token ID in the Refresh_Token JWT payload
5. WHEN an Access_Token is expired, THE Token_Manager SHALL reject API requests with HTTP 401 status code
6. THE Token_Manager SHALL sign all tokens with the JWT_SECRET using HS256 algorithm
7. WHEN generating tokens, THE Token_Manager SHALL set the "iat" (issued at) claim to current timestamp
8. WHEN generating tokens, THE Token_Manager SHALL set the "exp" (expiration) claim to iat plus expiration duration

### Requirement 7: Implement Refresh Token Mechanism

**User Story:** As a user, I want to obtain new access tokens without re-entering my password, so that I can maintain my session seamlessly while benefiting from short-lived tokens.

#### Acceptance Criteria

1. WHEN a user authenticates successfully, THE Token_Manager SHALL store the Refresh_Token in Refresh_Token_Store with user ID, token ID, and expiration timestamp
2. WHEN a client presents a valid Refresh_Token to /api/auth/refresh endpoint, THE Token_Manager SHALL generate a new Access_Token
3. WHEN a client presents a valid Refresh_Token to /api/auth/refresh endpoint, THE Token_Manager SHALL generate a new Refresh_Token (token rotation)
4. WHEN rotating tokens, THE Token_Manager SHALL invalidate the old Refresh_Token in Refresh_Token_Store
5. WHEN a Refresh_Token is expired, THE Token_Manager SHALL reject the refresh request with HTTP 401 status code
6. WHEN a Refresh_Token is not found in Refresh_Token_Store, THE Token_Manager SHALL reject the refresh request with HTTP 401 status code
7. WHEN a Refresh_Token has been used (already rotated), THE Token_Manager SHALL reject the refresh request with HTTP 401 status code
8. THE Refresh_Token_Store SHALL index tokens by token ID for efficient lookup
9. THE Refresh_Token_Store SHALL persist tokens in a `refresh_tokens` table with columns: id (UUID PRIMARY KEY), user_id (BIGINT NOT NULL), token_hash (VARCHAR(64) UNIQUE NOT NULL), expires_at (TIMESTAMP NOT NULL), created_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP), used (BOOLEAN DEFAULT FALSE)
10. THE Refresh_Token_Store SHALL create index on user_id for efficient user token lookup
11. THE Refresh_Token_Store SHALL create unique index on token_hash for duplicate prevention
12. THE Refresh_Token_Store SHALL create index on expires_at for efficient cleanup of expired tokens

### Requirement 8: Implement Token Blacklist for Logout

**User Story:** As a user, I want my tokens immediately invalidated when I log out, so that they cannot be used if stolen after logout.

#### Acceptance Criteria

1. WHEN a user logs out, THE Token_Manager SHALL add the Access_Token to Token_Blacklist with expiration timestamp
2. WHEN a user logs out, THE Token_Manager SHALL remove all Refresh_Tokens for that user from Refresh_Token_Store
3. WHEN an API request presents a token, THE Token_Manager SHALL check if the token exists in Token_Blacklist before validating
4. WHEN a blacklisted token is presented, THE Token_Manager SHALL reject the request with HTTP 401 status code
5. THE Token_Blacklist SHALL automatically remove expired tokens to prevent unbounded growth
6. THE Token_Blacklist SHALL support concurrent access from multiple application instances
7. WHERE Redis is available, THE Token_Blacklist SHALL use Redis with TTL for distributed blacklist
8. WHERE Redis is not available, THE Token_Blacklist SHALL use in-memory storage with scheduled cleanup
9. WHERE database-backed blacklist is used, THE Token_Blacklist SHALL persist in `token_blacklist` table with columns: token_hash (VARCHAR(64) PRIMARY KEY), expires_at (TIMESTAMP NOT NULL), blacklisted_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
10. THE Token_Blacklist SHALL create index on expires_at for efficient cleanup queries

### Requirement 9: Maintain Backward Compatibility During Deployment

**User Story:** As a system administrator, I want to deploy security fixes without logging out existing users, so that the upgrade does not disrupt active sessions.

#### Acceptance Criteria

1. WHEN the application starts with new token configuration, THE Token_Manager SHALL accept tokens signed with the old JWT_SECRET for 24 hours
2. WHEN validating a token during migration period, THE Token_Manager SHALL try the new JWT_SECRET first, then fall back to old JWT_SECRET
3. WHEN a token signed with old JWT_SECRET is validated, THE Token_Manager SHALL log a warning "Legacy token detected for user [username]"
4. WHEN the OLD_JWT_SECRET Environment_Variable is not provided, THE Token_Manager SHALL only validate tokens with current JWT_SECRET
5. WHEN 24 hours have passed since startup, THE Token_Manager SHALL stop accepting tokens signed with old JWT_SECRET
6. THE Token_Manager SHALL log "Legacy token support expired" at INFO level after 24 hours
7. WHEN HTTPS is enabled, THE HTTPS_Server SHALL continue accepting HTTP health check requests for load balancer compatibility

### Requirement 10: Validate Performance Impact

**User Story:** As a system administrator, I want security enhancements to add less than 5ms latency per request, so that user experience is not degraded.

#### Acceptance Criteria

1. WHEN processing an authenticated API request, THE Token_Manager SHALL complete token validation within 2 milliseconds on average
2. WHEN checking Token_Blacklist, THE Token_Blacklist SHALL complete lookup within 1 millisecond on average
3. WHEN establishing HTTPS connection, THE HTTPS_Server SHALL complete TLS handshake within 50 milliseconds on average
4. WHEN redirecting HTTP to HTTPS, THE HTTP_Redirector SHALL respond within 1 millisecond
5. WHEN loading secrets at startup, THE Security_Manager SHALL complete validation within 5 seconds
6. THE Token_Manager SHALL cache JWT signature verification keys in memory to avoid repeated computation
7. THE Token_Blacklist SHALL use efficient data structures (hash table or sorted set) for O(1) or O(log n) lookup

### Requirement 11: Provide Comprehensive Security Logging

**User Story:** As a security auditor, I want detailed logs of authentication events and security violations, so that I can detect and investigate potential attacks.

#### Acceptance Criteria

1. WHEN a user successfully authenticates, THE Token_Manager SHALL log "User [username] authenticated from IP [ip-address]" at INFO level
2. WHEN a user logs out, THE Token_Manager SHALL log "User [username] logged out, tokens invalidated" at INFO level
3. WHEN an expired token is rejected, THE Token_Manager SHALL log "Expired token rejected for user [username]" at WARN level
4. WHEN a blacklisted token is rejected, THE Token_Manager SHALL log "Blacklisted token rejected for user [username]" at WARN level
5. WHEN an invalid token signature is detected, THE Token_Manager SHALL log "Invalid token signature from IP [ip-address]" at ERROR level
6. WHEN a refresh token is reused, THE Token_Manager SHALL log "Refresh token reuse detected for user [username], possible token theft" at ERROR level
7. WHEN startup validation fails, THE Security_Manager SHALL log the specific validation error at ERROR level
8. WHEN HTTPS connection fails due to certificate error, THE HTTPS_Server SHALL log the error details at ERROR level
9. THE Security_Manager SHALL NOT log secret values in any log message

### Requirement 12: Support Testing and Validation

**User Story:** As a developer, I want comprehensive test coverage for security features, so that I can verify correctness and prevent regressions.

#### Acceptance Criteria

1. THE Security_Manager SHALL provide a test mode that accepts mock secrets for unit testing
2. THE HTTPS_Server SHALL support disabling HTTPS in test profile for integration testing
3. THE Token_Manager SHALL provide methods to generate test tokens with custom expiration times
4. THE Token_Blacklist SHALL provide methods to clear all entries for test cleanup
5. THE Refresh_Token_Store SHALL support in-memory implementation for testing without database
6. WHEN running in test profile, THE Security_Manager SHALL skip startup validation for missing secrets
7. WHEN running in test profile, THE HTTP_Redirector SHALL be disabled to allow direct HTTP testing
8. THE Token_Manager SHALL expose metrics for token generation rate, validation rate, and rejection rate for monitoring

### Requirement 13: Rate Limit Authentication Endpoints

**User Story:** As a security engineer, I want rate limiting on authentication endpoints, so that brute force attacks are prevented.

#### Acceptance Criteria

1. THE Token_Manager SHALL limit login attempts to 5 per IP address per 15 minutes
2. THE Token_Manager SHALL limit refresh token requests to 10 per user per minute
3. WHEN rate limit is exceeded, THE Token_Manager SHALL respond with HTTP 429 status code
4. WHEN rate limit is exceeded, THE Token_Manager SHALL include Retry-After header indicating wait time in seconds
5. THE Token_Manager SHALL log rate limit violations at WARN level with IP address and username
6. THE Token_Manager SHALL use sliding window algorithm for rate limit calculation
7. WHERE Redis is available, THE Token_Manager SHALL use Redis for distributed rate limiting across multiple instances
8. WHERE Redis is not available, THE Token_Manager SHALL use in-memory rate limiting with Caffeine cache



## Success Metrics

### Security Metrics
- **Secrets Exposure**: 0 secrets in version control (verified by `git grep` for patterns)
- **HTTPS Adoption**: 100% of traffic on HTTPS within 7 days of deployment
- **Token Theft Prevention**: 0 successful attacks using expired/blacklisted tokens
- **Rate Limit Effectiveness**: < 0.1% of requests blocked by rate limiting (indicating minimal abuse)

### Performance Metrics
- **Token Validation Latency**: p95 < 2ms, p99 < 5ms
- **TLS Handshake Time**: p95 < 50ms, p99 < 100ms
- **Startup Time**: < 30 seconds (including secrets validation and database migrations)
- **Blacklist Lookup**: p95 < 1ms, p99 < 2ms

### Operational Metrics
- **Zero Downtime**: 0 user logouts during deployment
- **Backward Compatibility**: 100% of old tokens valid for 24 hours post-deployment
- **Test Coverage**: > 90% for security components (Security_Manager, Token_Manager, HTTPS_Server)
- **Deployment Success Rate**: 100% (no rollbacks due to security issues)


## Dependencies

### Required Libraries (Already Included)
- ✅ **Spring Boot Starter Security** (4.0.6) - Authentication and authorization
- ✅ **JJWT** (0.11.5) - JWT token generation and validation
- ✅ **Spring Boot Starter Actuator** (4.0.6) - Health checks and metrics
- ✅ **Caffeine Cache** (3.1.8) - In-memory caching for blacklist and rate limiting

### Optional Libraries (For Enhanced Features)

#### HashiCorp Vault Integration
```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-vault-config</artifactId>
    <version>4.0.0</version>
</dependency>
```

#### Distributed Token Blacklist (Redis)
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
    <version>4.0.6</version>
</dependency>
```

#### Rate Limiting (Bucket4j)
```xml
<dependency>
    <groupId>com.github.vladimir-bukhtoyarov</groupId>
    <artifactId>bucket4j-core</artifactId>
    <version>8.7.0</version>
</dependency>
```

### Database Migrations
- **Flyway**: Already included ✅
- **Required Migration Scripts**:
  - `V10__create_refresh_tokens_table.sql` - Create refresh_tokens table with indexes
  - `V11__create_token_blacklist_table.sql` - Create token_blacklist table with indexes


## Timeline Estimate

### Phase 1: Secrets Management (Week 1) - 16 hours
**Requirements**: 1, 2, 3
- Remove hardcoded secrets from application.properties
- Implement startup validation with fail-fast behavior
- Integrate with Docker Secrets, Kubernetes Secrets, and HashiCorp Vault
- **Priority**: P0 - CRITICAL
- **Assignee**: Senior Developer

### Phase 2: HTTPS Implementation (Week 1) - 8 hours
**Requirements**: 4, 5
- Configure HTTPS server on port 8443
- Implement HTTP to HTTPS redirect on port 8080
- Generate self-signed certificates for development
- Configure production certificate loading
- **Priority**: P0 - CRITICAL
- **Assignee**: Senior Developer

### Phase 3: Token Improvements (Week 2) - 24 hours
**Requirements**: 6, 7, 8, 13
- Implement 15-minute access tokens
- Implement refresh token mechanism with rotation
- Create database tables for refresh tokens and blacklist
- Implement token blacklist for logout
- Add rate limiting for authentication endpoints
- **Priority**: P0 - CRITICAL
- **Assignee**: 2 Developers (Senior + Mid-level)

### Phase 4: Cross-Cutting Concerns (Week 2) - 12 hours
**Requirements**: 9, 10, 11, 12
- Implement backward compatibility (24-hour migration window)
- Performance optimization and validation
- Comprehensive security logging
- Testing support and test coverage
- **Priority**: P1 - HIGH
- **Assignee**: Mid-level Developer

### Phase 5: Testing & Validation (Week 3) - 16 hours
- Unit tests for all security components
- Integration tests with Testcontainers
- Performance testing and benchmarking
- Security penetration testing
- **Priority**: P1 - HIGH
- **Assignee**: QA Engineer + Developer

**Total Effort**: 76 hours (≈ 9.5 working days)
**Recommended Team**: 2 Developers + 1 QA Engineer
**Total Duration**: 3 weeks (with parallel work)
