# Technical Design Document

## Overview

This document specifies the technical design for addressing three P0 critical security vulnerabilities in the Smart City Backend system:

1. **Hardcoded Secrets** - Secrets exposed in application.properties must be removed and loaded from secure external sources
2. **No HTTPS Encryption** - All traffic must be encrypted with TLS/SSL to prevent interception of sensitive data
3. **Weak JWT Configuration** - Long-lived tokens (7 days) must be replaced with short-lived access tokens (15 minutes) and refresh token rotation

### Design Goals

- **Zero Downtime**: Deploy without logging out existing users (24-hour backward compatibility window)
- **Performance**: Add less than 5ms latency per request
- **Flexibility**: Support multiple secrets backends (Vault, Kubernetes, Docker, environment variables)
- **Security**: Eliminate secrets exposure, encrypt all traffic, minimize token theft impact
- **Observability**: Comprehensive security logging without exposing secrets
- **Testability**: Support unit and integration testing with mock secrets

### System Context

The Smart City Backend is a monolithic Spring Boot 4.0.6 application running on Java 21 with:
- **Web Framework**: Spring Boot Starter Web (Tomcat embedded server)
- **Security**: Spring Security with JWT authentication (JJWT 0.11.5)
- **Databases**: PostgreSQL (primary) and SQL Server (legacy support)
- **Caching**: Caffeine (in-memory), optional Redis (distributed)
- **Current State**: HTTP on port 8081, secrets in application.properties, 7-day JWT tokens

## Architecture

### High-Level Component Diagram

```mermaid
graph TB
    Client[Client Application]
    LB[Load Balancer]
    
    subgraph "Application Instance"
        HTTP[HTTP Redirector :8080]
        HTTPS[HTTPS Server :8443]
        SecMgr[Security Manager]
        TokenMgr[Token Manager]
        RateLim[Rate Limiter]
        
        subgraph "Token Components"
            TokenGen[Token Generator]
            TokenVal[Token Validator]
            Blacklist[Token Blacklist]
            RefreshStore[Refresh Token Store]
        end
    end
    
    subgraph "External Services"
        Vault[HashiCorp Vault]
        K8s[Kubernetes Secrets]
        Docker[Docker Secrets]
        Redis[Redis Cache]
    end
    
    subgraph "Data Layer"
        DB[(PostgreSQL/SQL Server)]
    end
    
    Client -->|HTTP| LB
    LB -->|HTTP :8080| HTTP
    LB -->|HTTPS :8443| HTTPS
    HTTP -->|301 Redirect| Client
    HTTPS --> SecMgr
    HTTPS --> TokenMgr
    HTTPS --> RateLim
    
    SecMgr -.->|Load Secrets| Vault
    SecMgr -.->|Load Secrets| K8s
    SecMgr -.->|Load Secrets| Docker
    
    TokenMgr --> TokenGen
    TokenMgr --> TokenVal
    TokenVal --> Blacklist
    TokenGen --> RefreshStore
    
    Blacklist -.->|Optional| Redis
    RateLim -.->|Optional| Redis
    
    RefreshStore --> DB
    Blacklist --> DB
```


### Architectural Principles

1. **Defense in Depth**: Multiple security layers (secrets management, HTTPS, short-lived tokens, blacklist, rate limiting)
2. **Fail Fast**: Validate all security requirements at startup before accepting traffic
3. **Least Privilege**: Tokens contain only necessary claims, secrets accessible only to authorized components
4. **Graceful Degradation**: Fall back to alternative secrets sources, support both Redis and in-memory blacklist
5. **Zero Trust**: Validate every token on every request, check blacklist even for valid signatures
6. **Observability**: Log all security events without exposing secrets

### Deployment Architecture

```mermaid
graph LR
    subgraph "Development"
        DevApp[App Instance]
        DevEnv[Environment Variables]
        DevCert[Self-Signed Certificate]
        DevApp --> DevEnv
        DevApp --> DevCert
    end
    
    subgraph "Docker Deployment"
        DockerApp[App Container]
        DockerSecrets[Docker Secrets Volume]
        DockerCert[Certificate Secret]
        DockerApp --> DockerSecrets
        DockerApp --> DockerCert
    end
    
    subgraph "Kubernetes Deployment"
        K8sApp[App Pod]
        K8sSecrets[Secrets Volume Mount]
        K8sCert[TLS Secret]
        K8sApp --> K8sSecrets
        K8sApp --> K8sCert
    end
    
    subgraph "Production with Vault"
        ProdApp[App Instance]
        VaultSvc[Vault Service]
        CertMgr[Certificate Manager]
        ProdApp --> VaultSvc
        ProdApp --> CertMgr
    end
```

## Components and Interfaces

### 1. Security Manager

**Responsibility**: Load and validate secrets from external sources at application startup.

**Interface**:
```java
public interface SecretsProvider {
    String getSecret(String key);
    boolean isAvailable();
    int getPriority(); // Higher = preferred
}
```


**Implementation Classes**:

```java
@Component
@Order(1) // Highest priority
public class VaultSecretsProvider implements SecretsProvider {
    private final VaultTemplate vaultTemplate;
    
    @Override
    public String getSecret(String key) {
        try {
            VaultResponse response = vaultTemplate.read("secret/data/smartcity");
            return (String) response.getData().get(key);
        } catch (Exception e) {
            log.warn("Failed to read secret {} from Vault: {}", key, e.getMessage());
            return null;
        }
    }
    
    @Override
    public boolean isAvailable() {
        return vaultTemplate != null && vaultTemplate.opsForSys().health().isInitialized();
    }
    
    @Override
    public int getPriority() { return 100; }
}

@Component
@Order(2)
public class KubernetesSecretsProvider implements SecretsProvider {
    private static final String SECRETS_PATH = "/var/run/secrets/smartcity";
    
    @Override
    public String getSecret(String key) {
        Path secretFile = Paths.get(SECRETS_PATH, key.toLowerCase().replace('_', '-'));
        if (Files.exists(secretFile)) {
            try {
                return Files.readString(secretFile).trim();
            } catch (IOException e) {
                log.warn("Failed to read K8s secret {}: {}", key, e.getMessage());
            }
        }
        return null;
    }
    
    @Override
    public boolean isAvailable() {
        return Files.isDirectory(Paths.get(SECRETS_PATH));
    }
    
    @Override
    public int getPriority() { return 90; }
}

@Component
@Order(3)
public class DockerSecretsProvider implements SecretsProvider {
    private static final String SECRETS_PATH = "/run/secrets";
    
    @Override
    public String getSecret(String key) {
        Path secretFile = Paths.get(SECRETS_PATH, key.toLowerCase());
        if (Files.exists(secretFile)) {
            try {
                return Files.readString(secretFile).trim();
            } catch (IOException e) {
                log.warn("Failed to read Docker secret {}: {}", key, e.getMessage());
            }
        }
        return null;
    }
    
    @Override
    public boolean isAvailable() {
        return Files.isDirectory(Paths.get(SECRETS_PATH));
    }
    
    @Override
    public int getPriority() { return 80; }
}

@Component
@Order(4) // Lowest priority
public class EnvironmentSecretsProvider implements SecretsProvider {
    private final Environment environment;
    
    @Override
    public String getSecret(String key) {
        return environment.getProperty(key);
    }
    
    @Override
    public boolean isAvailable() {
        return true; // Always available
    }
    
    @Override
    public int getPriority() { return 70; }
}

@Component
public class SecurityManager implements ApplicationListener<ApplicationReadyEvent> {
    private final List<SecretsProvider> providers;
    private final Map<String, String> secretsCache = new ConcurrentHashMap<>();
    
    private static final List<String> REQUIRED_SECRETS = List.of(
        "JWT_SECRET", "ENCRYPTION_SECRET", "TWILIO_ACCOUNT_SID",
        "TWILIO_AUTH_TOKEN", "TWILIO_PHONE_NUMBER"
    );
    
    @Override
    public void onApplicationEvent(ApplicationReadyEvent event) {
        log.info("Starting security validation...");
        
        // Sort providers by priority (highest first)
        List<SecretsProvider> sortedProviders = providers.stream()
            .filter(SecretsProvider::isAvailable)
            .sorted(Comparator.comparingInt(SecretsProvider::getPriority).reversed())
            .toList();
        
        log.info("Available secrets providers: {}", 
            sortedProviders.stream()
                .map(p -> p.getClass().getSimpleName())
                .collect(Collectors.joining(", ")));
        
        // Load and validate each required secret
        for (String secretKey : REQUIRED_SECRETS) {
            String value = loadSecret(secretKey, sortedProviders);
            if (value == null || value.isBlank()) {
                throw new IllegalStateException(
                    "Required secret " + secretKey + " is missing or empty. " +
                    "Please configure it in one of: Vault, Kubernetes Secrets, " +
                    "Docker Secrets, or Environment Variables."
                );
            }
            validateSecret(secretKey, value);
            secretsCache.put(secretKey, value);
        }
        
        log.info("Security validation passed. All required secrets loaded.");
    }
    
    private String loadSecret(String key, List<SecretsProvider> providers) {
        for (SecretsProvider provider : providers) {
            String value = provider.getSecret(key);
            if (value != null && !value.isBlank()) {
                log.info("Loaded secret {} from {}", key, 
                    provider.getClass().getSimpleName());
                return value;
            }
        }
        return null;
    }
    
    private void validateSecret(String key, String value) {
        switch (key) {
            case "JWT_SECRET":
                if (value.length() < 32) {
                    throw new IllegalStateException(
                        "JWT_SECRET must be at least 32 characters for HS256 security"
                    );
                }
                break;
            case "ENCRYPTION_SECRET":
                if (value.length() != 32) {
                    throw new IllegalStateException(
                        "ENCRYPTION_SECRET must be exactly 32 characters for AES-256"
                    );
                }
                break;
        }
    }
    
    public String getSecret(String key) {
        return secretsCache.get(key);
    }
}
```


### 2. HTTPS Server Configuration

**Responsibility**: Enable TLS/SSL encryption on port 8443, support TLS 1.2/1.3, load certificates from keystore.

**Configuration Class**:

```java
@Configuration
@ConditionalOnProperty(name = "server.ssl.enabled", havingValue = "true", matchIfMissing = true)
public class HttpsConfiguration {
    
    @Value("${server.ssl.key-store:#{null}}")
    private String keystorePath;
    
    @Value("${server.ssl.key-store-password:#{null}}")
    private String keystorePassword;
    
    @Value("${server.ssl.key-store-type:PKCS12}")
    private String keystoreType;
    
    @Bean
    public ServletWebServerFactory servletContainer() {
        TomcatServletWebServerFactory tomcat = new TomcatServletWebServerFactory() {
            @Override
            protected void postProcessContext(Context context) {
                SecurityConstraint securityConstraint = new SecurityConstraint();
                securityConstraint.setUserConstraint("CONFIDENTIAL");
                SecurityCollection collection = new SecurityCollection();
                collection.addPattern("/*");
                securityConstraint.addCollection(collection);
                context.addConstraint(securityConstraint);
            }
        };
        
        tomcat.addAdditionalTomcatConnectors(createHttpConnector());
        return tomcat;
    }
    
    private Connector createHttpConnector() {
        Connector connector = new Connector(TomcatServletWebServerFactory.DEFAULT_PROTOCOL);
        connector.setScheme("http");
        connector.setPort(8080);
        connector.setSecure(false);
        connector.setRedirectPort(8443);
        return connector;
    }
    
    @Bean
    public WebServerFactoryCustomizer<TomcatServletWebServerFactory> sslCustomizer() {
        return factory -> {
            Ssl ssl = new Ssl();
            ssl.setEnabled(true);
            ssl.setKeyStore(keystorePath);
            ssl.setKeyStorePassword(keystorePassword);
            ssl.setKeyStoreType(keystoreType);
            ssl.setProtocol("TLS");
            ssl.setEnabledProtocols(new String[]{"TLSv1.2", "TLSv1.3"});
            ssl.setCiphers(new String[]{
                "TLS_AES_256_GCM_SHA384",
                "TLS_CHACHA20_POLY1305_SHA256",
                "TLS_AES_128_GCM_SHA256",
                "TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384",
                "TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256"
            });
            
            factory.setSsl(ssl);
            factory.setPort(8443);
            
            // Check certificate expiration
            checkCertificateExpiration();
        };
    }
    
    private void checkCertificateExpiration() {
        if (keystorePath == null) return;
        
        try {
            KeyStore keyStore = KeyStore.getInstance(keystoreType);
            try (FileInputStream fis = new FileInputStream(keystorePath)) {
                keyStore.load(fis, keystorePassword.toCharArray());
            }
            
            Enumeration<String> aliases = keyStore.aliases();
            while (aliases.hasMoreElements()) {
                String alias = aliases.nextElement();
                if (keyStore.isCertificateEntry(alias) || keyStore.isKeyEntry(alias)) {
                    X509Certificate cert = (X509Certificate) keyStore.getCertificate(alias);
                    Date expirationDate = cert.getNotAfter();
                    long daysUntilExpiration = ChronoUnit.DAYS.between(
                        LocalDate.now(), 
                        expirationDate.toInstant().atZone(ZoneId.systemDefault()).toLocalDate()
                    );
                    
                    if (daysUntilExpiration <= 30) {
                        log.warn("Certificate '{}' expires in {} days ({})", 
                            alias, daysUntilExpiration, expirationDate);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to check certificate expiration: {}", e.getMessage());
        }
    }
}
```


### 3. HTTP to HTTPS Redirector

**Responsibility**: Redirect HTTP requests to HTTPS, except health check endpoints.

**Implementation**:

```java
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class HttpsRedirectFilter extends OncePerRequestFilter {
    
    private static final Set<String> HEALTH_CHECK_PATHS = Set.of(
        "/actuator/health",
        "/actuator/info"
    );
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                   HttpServletResponse response, 
                                   FilterChain filterChain) throws ServletException, IOException {
        
        String requestPath = request.getRequestURI();
        
        // Allow health checks on HTTP
        if (HEALTH_CHECK_PATHS.contains(requestPath)) {
            filterChain.doFilter(request, response);
            return;
        }
        
        // Redirect HTTP to HTTPS
        if (!request.isSecure() && request.getServerPort() == 8080) {
            String redirectUrl = buildHttpsUrl(request);
            response.setStatus(HttpServletResponse.SC_MOVED_PERMANENTLY);
            response.setHeader("Location", redirectUrl);
            response.setHeader("Strict-Transport-Security", 
                "max-age=31536000; includeSubDomains");
            return;
        }
        
        // Add HSTS header for HTTPS requests
        if (request.isSecure()) {
            response.setHeader("Strict-Transport-Security", 
                "max-age=31536000; includeSubDomains");
        }
        
        filterChain.doFilter(request, response);
    }
    
    private String buildHttpsUrl(HttpServletRequest request) {
        StringBuilder url = new StringBuilder("https://");
        url.append(request.getServerName());
        url.append(":8443");
        url.append(request.getRequestURI());
        
        String queryString = request.getQueryString();
        if (queryString != null) {
            url.append("?").append(queryString);
        }
        
        return url.toString();
    }
}
```

### 4. Token Manager

**Responsibility**: Generate, validate, rotate, and revoke JWT tokens.

**Core Interface**:

```java
public interface TokenManager {
    TokenPair generateTokens(Authentication authentication);
    TokenPair refreshTokens(String refreshToken);
    void revokeTokens(String accessToken, Long userId);
    boolean validateAccessToken(String token);
    Authentication getAuthentication(String token);
}

public record TokenPair(String accessToken, String refreshToken) {}
```


**Implementation**:

```java
@Service
public class JwtTokenManager implements TokenManager {
    
    private static final long ACCESS_TOKEN_VALIDITY = 15 * 60 * 1000; // 15 minutes
    private static final long REFRESH_TOKEN_VALIDITY = 7 * 24 * 60 * 60 * 1000; // 7 days
    private static final long LEGACY_TOKEN_GRACE_PERIOD = 24 * 60 * 60 * 1000; // 24 hours
    
    private final SecurityManager securityManager;
    private final RefreshTokenRepository refreshTokenRepository;
    private final TokenBlacklist tokenBlacklist;
    private final Instant startupTime = Instant.now();
    
    private Key currentSigningKey;
    private Key legacySigningKey;
    
    @PostConstruct
    public void init() {
        String currentSecret = securityManager.getSecret("JWT_SECRET");
        this.currentSigningKey = Keys.hmacShaKeyFor(currentSecret.getBytes(StandardCharsets.UTF_8));
        
        String legacySecret = securityManager.getSecret("OLD_JWT_SECRET");
        if (legacySecret != null && !legacySecret.isBlank()) {
            this.legacySigningKey = Keys.hmacShaKeyFor(legacySecret.getBytes(StandardCharsets.UTF_8));
            log.info("Legacy token support enabled for 24 hours");
        }
    }
    
    @Override
    public TokenPair generateTokens(Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        Long userId = extractUserId(userDetails);
        
        String accessToken = generateAccessToken(userDetails, userId);
        String refreshToken = generateRefreshToken(userId);
        
        // Store refresh token in database
        RefreshTokenEntity entity = new RefreshTokenEntity();
        entity.setUserId(userId);
        entity.setTokenHash(hashToken(refreshToken));
        entity.setExpiresAt(Instant.now().plusMillis(REFRESH_TOKEN_VALIDITY));
        refreshTokenRepository.save(entity);
        
        log.info("User {} authenticated from IP {}", 
            userDetails.getUsername(), 
            getCurrentRequestIp());
        
        return new TokenPair(accessToken, refreshToken);
    }
    
    private String generateAccessToken(UserDetails userDetails, Long userId) {
        Instant now = Instant.now();
        return Jwts.builder()
            .setSubject(userDetails.getUsername())
            .claim("userId", userId)
            .claim("roles", userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList()))
            .setIssuedAt(Date.from(now))
            .setExpiration(Date.from(now.plusMillis(ACCESS_TOKEN_VALIDITY)))
            .signWith(currentSigningKey, SignatureAlgorithm.HS256)
            .compact();
    }
    
    private String generateRefreshToken(Long userId) {
        Instant now = Instant.now();
        String tokenId = UUID.randomUUID().toString();
        
        return Jwts.builder()
            .setSubject(String.valueOf(userId))
            .claim("tokenId", tokenId)
            .claim("type", "refresh")
            .setIssuedAt(Date.from(now))
            .setExpiration(Date.from(now.plusMillis(REFRESH_TOKEN_VALIDITY)))
            .signWith(currentSigningKey, SignatureAlgorithm.HS256)
            .compact();
    }

    @Override
    public TokenPair refreshTokens(String refreshToken) {
        try {
            Claims claims = parseToken(refreshToken);
            
            // Verify it's a refresh token
            if (!"refresh".equals(claims.get("type"))) {
                throw new InvalidTokenException("Not a refresh token");
            }
            
            Long userId = Long.parseLong(claims.getSubject());
            String tokenId = claims.get("tokenId", String.class);
            String tokenHash = hashToken(refreshToken);
            
            // Check if token exists and hasn't been used
            RefreshTokenEntity entity = refreshTokenRepository
                .findByTokenHash(tokenHash)
                .orElseThrow(() -> new InvalidTokenException("Refresh token not found"));
            
            if (entity.isUsed()) {
                log.error("Refresh token reuse detected for user {}, possible token theft", userId);
                // Revoke all tokens for this user
                refreshTokenRepository.deleteByUserId(userId);
                throw new SecurityException("Token reuse detected");
            }
            
            if (entity.getExpiresAt().isBefore(Instant.now())) {
                throw new InvalidTokenException("Refresh token expired");
            }
            
            // Mark old token as used
            entity.setUsed(true);
            refreshTokenRepository.save(entity);
            
            // Generate new token pair
            UserDetails userDetails = loadUserDetails(userId);
            Authentication auth = new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities());
            
            return generateTokens(auth);
            
        } catch (JwtException e) {
            log.warn("Invalid refresh token: {}", e.getMessage());
            throw new InvalidTokenException("Invalid refresh token");
        }
    }
    
    @Override
    public void revokeTokens(String accessToken, Long userId) {
        // Add access token to blacklist
        Claims claims = parseToken(accessToken);
        Date expiration = claims.getExpiration();
        tokenBlacklist.add(accessToken, expiration.toInstant());
        
        // Remove all refresh tokens for user
        int deleted = refreshTokenRepository.deleteByUserId(userId);
        
        log.info("User {} logged out, tokens invalidated (deleted {} refresh tokens)", 
            userId, deleted);
    }
    
    @Override
    public boolean validateAccessToken(String token) {
        try {
            // Check blacklist first (fast path)
            if (tokenBlacklist.contains(token)) {
                log.warn("Blacklisted token rejected");
                return false;
            }
            
            // Parse and validate token
            Claims claims = parseToken(token);
            
            // Verify not expired
            if (claims.getExpiration().before(new Date())) {
                log.warn("Expired token rejected for user {}", claims.getSubject());
                return false;
            }
            
            return true;
            
        } catch (JwtException e) {
            log.error("Invalid token signature from IP {}: {}", 
                getCurrentRequestIp(), e.getMessage());
            return false;
        }
    }

    private Claims parseToken(String token) {
        // Try current key first
        try {
            return Jwts.parserBuilder()
                .setSigningKey(currentSigningKey)
                .build()
                .parseClaimsJws(token)
                .getBody();
        } catch (JwtException e) {
            // If legacy key is available and grace period hasn't expired, try it
            if (legacySigningKey != null && isWithinGracePeriod()) {
                try {
                    Claims claims = Jwts.parserBuilder()
                        .setSigningKey(legacySigningKey)
                        .build()
                        .parseClaimsJws(token)
                        .getBody();
                    
                    log.warn("Legacy token detected for user {}", claims.getSubject());
                    return claims;
                } catch (JwtException legacyException) {
                    // Both keys failed, throw original exception
                    throw e;
                }
            }
            throw e;
        }
    }
    
    private boolean isWithinGracePeriod() {
        return Instant.now().isBefore(startupTime.plusMillis(LEGACY_TOKEN_GRACE_PERIOD));
    }
    
    @Override
    public Authentication getAuthentication(String token) {
        Claims claims = parseToken(token);
        
        String username = claims.getSubject();
        Long userId = claims.get("userId", Long.class);
        List<String> roles = claims.get("roles", List.class);
        
        List<GrantedAuthority> authorities = roles.stream()
            .map(SimpleGrantedAuthority::new)
            .collect(Collectors.toList());
        
        UserDetails userDetails = User.builder()
            .username(username)
            .password("") // Not needed for token auth
            .authorities(authorities)
            .build();
        
        return new UsernamePasswordAuthenticationToken(userDetails, token, authorities);
    }
    
    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }
    
    private String getCurrentRequestIp() {
        ServletRequestAttributes attrs = 
            (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attrs != null) {
            HttpServletRequest request = attrs.getRequest();
            String xForwardedFor = request.getHeader("X-Forwarded-For");
            if (xForwardedFor != null) {
                return xForwardedFor.split(",")[0].trim();
            }
            return request.getRemoteAddr();
        }
        return "unknown";
    }
}
```


### 5. Token Blacklist

**Responsibility**: Track invalidated tokens to prevent reuse after logout.

**Interface**:

```java
public interface TokenBlacklist {
    void add(String token, Instant expiresAt);
    boolean contains(String token);
    void cleanup(); // Remove expired entries
}
```

**Redis Implementation** (preferred for distributed systems):

```java
@Service
@ConditionalOnProperty(name = "spring.data.redis.host")
public class RedisTokenBlacklist implements TokenBlacklist {
    
    private final RedisTemplate<String, String> redisTemplate;
    private static final String BLACKLIST_PREFIX = "token:blacklist:";
    
    @Override
    public void add(String token, Instant expiresAt) {
        String key = BLACKLIST_PREFIX + hashToken(token);
        long ttlSeconds = expiresAt.getEpochSecond() - Instant.now().getEpochSecond();
        
        if (ttlSeconds > 0) {
            redisTemplate.opsForValue().set(key, "1", Duration.ofSeconds(ttlSeconds));
        }
    }
    
    @Override
    public boolean contains(String token) {
        String key = BLACKLIST_PREFIX + hashToken(token);
        return Boolean.TRUE.equals(redisTemplate.hasKey(key));
    }
    
    @Override
    public void cleanup() {
        // Redis handles TTL automatically, no manual cleanup needed
    }
    
    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }
}
```

**In-Memory Implementation** (fallback):

```java
@Service
@ConditionalOnMissingBean(RedisTokenBlacklist.class)
public class InMemoryTokenBlacklist implements TokenBlacklist {
    
    private final Cache<String, Instant> blacklist = Caffeine.newBuilder()
        .maximumSize(10_000)
        .expireAfter(new Expiry<String, Instant>() {
            @Override
            public long expireAfterCreate(String key, Instant expiresAt, long currentTime) {
                long ttlNanos = Duration.between(Instant.now(), expiresAt).toNanos();
                return Math.max(ttlNanos, 0);
            }
            
            @Override
            public long expireAfterUpdate(String key, Instant expiresAt, 
                                         long currentTime, long currentDuration) {
                return currentDuration;
            }
            
            @Override
            public long expireAfterRead(String key, Instant expiresAt, 
                                       long currentTime, long currentDuration) {
                return currentDuration;
            }
        })
        .build();
    
    @Override
    public void add(String token, Instant expiresAt) {
        blacklist.put(hashToken(token), expiresAt);
    }
    
    @Override
    public boolean contains(String token) {
        return blacklist.getIfPresent(hashToken(token)) != null;
    }
    
    @Override
    @Scheduled(fixedRate = 60000) // Every minute
    public void cleanup() {
        blacklist.cleanUp();
    }
    
    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }
}
```


### 6. Rate Limiter

**Responsibility**: Prevent brute force attacks by limiting authentication requests.

**Implementation**:

```java
@Component
public class AuthenticationRateLimiter {
    
    private final Cache<String, RateLimitBucket> loginAttempts;
    private final Cache<String, RateLimitBucket> refreshAttempts;
    
    public AuthenticationRateLimiter() {
        this.loginAttempts = Caffeine.newBuilder()
            .maximumSize(10_000)
            .expireAfterWrite(Duration.ofMinutes(15))
            .build();
        
        this.refreshAttempts = Caffeine.newBuilder()
            .maximumSize(10_000)
            .expireAfterWrite(Duration.ofMinutes(1))
            .build();
    }
    
    public void checkLoginRateLimit(String ipAddress) {
        RateLimitBucket bucket = loginAttempts.get(ipAddress, 
            k -> new RateLimitBucket(5, Duration.ofMinutes(15)));
        
        if (!bucket.tryConsume()) {
            log.warn("Login rate limit exceeded for IP: {}", ipAddress);
            throw new RateLimitExceededException(
                "Too many login attempts. Please try again in " + 
                bucket.getResetTimeSeconds() + " seconds"
            );
        }
    }
    
    public void checkRefreshRateLimit(String userId) {
        RateLimitBucket bucket = refreshAttempts.get(userId, 
            k -> new RateLimitBucket(10, Duration.ofMinutes(1)));
        
        if (!bucket.tryConsume()) {
            log.warn("Refresh rate limit exceeded for user: {}", userId);
            throw new RateLimitExceededException(
                "Too many refresh requests. Please try again in " + 
                bucket.getResetTimeSeconds() + " seconds"
            );
        }
    }
    
    private static class RateLimitBucket {
        private final int capacity;
        private final Duration window;
        private final Deque<Instant> timestamps;
        
        public RateLimitBucket(int capacity, Duration window) {
            this.capacity = capacity;
            this.window = window;
            this.timestamps = new LinkedList<>();
        }
        
        public synchronized boolean tryConsume() {
            Instant now = Instant.now();
            Instant cutoff = now.minus(window);
            
            // Remove expired timestamps
            while (!timestamps.isEmpty() && timestamps.peekFirst().isBefore(cutoff)) {
                timestamps.pollFirst();
            }
            
            // Check if we have capacity
            if (timestamps.size() < capacity) {
                timestamps.addLast(now);
                return true;
            }
            
            return false;
        }
        
        public long getResetTimeSeconds() {
            if (timestamps.isEmpty()) return 0;
            Instant oldest = timestamps.peekFirst();
            Instant resetTime = oldest.plus(window);
            return Duration.between(Instant.now(), resetTime).getSeconds();
        }
    }
}

@ControllerAdvice
public class RateLimitExceptionHandler {
    
    @ExceptionHandler(RateLimitExceededException.class)
    public ResponseEntity<ErrorResponse> handleRateLimitExceeded(
            RateLimitExceededException ex) {
        
        HttpHeaders headers = new HttpHeaders();
        headers.add("Retry-After", String.valueOf(ex.getRetryAfterSeconds()));
        
        ErrorResponse error = new ErrorResponse(
            HttpStatus.TOO_MANY_REQUESTS.value(),
            ex.getMessage()
        );
        
        return new ResponseEntity<>(error, headers, HttpStatus.TOO_MANY_REQUESTS);
    }
}
```


## Data Models

### Refresh Token Entity

```java
@Entity
@Table(name = "refresh_tokens", indexes = {
    @Index(name = "idx_refresh_tokens_user_id", columnList = "user_id"),
    @Index(name = "idx_refresh_tokens_expires_at", columnList = "expires_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RefreshTokenEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "user_id", nullable = false)
    private Long userId;
    
    @Column(name = "token_hash", nullable = false, unique = true, length = 64)
    private String tokenHash;
    
    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
    
    @Column(name = "used", nullable = false)
    private boolean used = false;
    
    @Column(name = "used_at")
    private Instant usedAt;
}
```

### Token Blacklist Entity (Database-backed option)

```java
@Entity
@Table(name = "token_blacklist", indexes = {
    @Index(name = "idx_token_blacklist_expires_at", columnList = "expires_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TokenBlacklistEntity {
    
    @Id
    @Column(name = "token_hash", length = 64)
    private String tokenHash;
    
    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;
    
    @Column(name = "blacklisted_at", nullable = false, updatable = false)
    private Instant blacklistedAt = Instant.now();
}
```

### Database Migration Scripts

**V10__create_refresh_tokens_table.sql**:

```sql
-- Refresh Tokens Table
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id BIGINT NOT NULL,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    used_at TIMESTAMP
);

-- Indexes for efficient queries
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
CREATE UNIQUE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);

-- Cleanup expired tokens (optional scheduled job)
COMMENT ON TABLE refresh_tokens IS 'Stores refresh tokens for JWT token rotation';
```

**V11__create_token_blacklist_table.sql** (optional, if not using Redis):

```sql
-- Token Blacklist Table
CREATE TABLE token_blacklist (
    token_hash VARCHAR(64) PRIMARY KEY,
    expires_at TIMESTAMP NOT NULL,
    blacklisted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for cleanup queries
CREATE INDEX idx_token_blacklist_expires_at ON token_blacklist(expires_at);

COMMENT ON TABLE token_blacklist IS 'Tracks invalidated JWT tokens to prevent reuse';
```


### Repository Interfaces

```java
@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshTokenEntity, UUID> {
    
    Optional<RefreshTokenEntity> findByTokenHash(String tokenHash);
    
    @Transactional
    @Modifying
    int deleteByUserId(Long userId);
    
    @Transactional
    @Modifying
    @Query("DELETE FROM RefreshTokenEntity r WHERE r.expiresAt < :now")
    int deleteExpiredTokens(@Param("now") Instant now);
    
    List<RefreshTokenEntity> findByUserIdAndUsedFalse(Long userId);
}

@Repository
public interface TokenBlacklistRepository extends JpaRepository<TokenBlacklistEntity, String> {
    
    @Transactional
    @Modifying
    @Query("DELETE FROM TokenBlacklistEntity t WHERE t.expiresAt < :now")
    int deleteExpiredTokens(@Param("now") Instant now);
}
```

### Scheduled Cleanup Jobs

```java
@Component
@EnableScheduling
public class TokenCleanupScheduler {
    
    private final RefreshTokenRepository refreshTokenRepository;
    private final TokenBlacklistRepository tokenBlacklistRepository;
    
    @Scheduled(cron = "0 0 2 * * ?") // Daily at 2 AM
    public void cleanupExpiredRefreshTokens() {
        int deleted = refreshTokenRepository.deleteExpiredTokens(Instant.now());
        log.info("Cleaned up {} expired refresh tokens", deleted);
    }
    
    @Scheduled(cron = "0 */30 * * * ?") // Every 30 minutes
    public void cleanupExpiredBlacklistedTokens() {
        int deleted = tokenBlacklistRepository.deleteExpiredTokens(Instant.now());
        if (deleted > 0) {
            log.info("Cleaned up {} expired blacklisted tokens", deleted);
        }
    }
}
```

## API Changes

### Authentication Endpoints

**POST /api/auth/login** (existing, modified response):

```json
Request:
{
  "username": "user@example.com",
  "password": "SecurePassword123!"
}

Response (200 OK):
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 900,
  "user": {
    "id": 123,
    "username": "user@example.com",
    "roles": ["ROLE_USER"]
  }
}

Error (429 Too Many Requests):
{
  "status": 429,
  "message": "Too many login attempts. Please try again in 847 seconds"
}
Headers:
  Retry-After: 847
```


**POST /api/auth/refresh** (new endpoint):

```json
Request:
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

Response (200 OK):
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 900
}

Error (401 Unauthorized):
{
  "status": 401,
  "message": "Invalid or expired refresh token"
}

Error (429 Too Many Requests):
{
  "status": 429,
  "message": "Too many refresh requests. Please try again in 47 seconds"
}
Headers:
  Retry-After: 47
```

**POST /api/auth/logout** (existing, modified behavior):

```json
Request:
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Response (200 OK):
{
  "message": "Logged out successfully"
}
```

### Controller Implementation

```java
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthenticationController {
    
    private final AuthenticationManager authenticationManager;
    private final TokenManager tokenManager;
    private final AuthenticationRateLimiter rateLimiter;
    
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody @Valid LoginRequest request,
                                             HttpServletRequest httpRequest) {
        String ipAddress = getClientIp(httpRequest);
        rateLimiter.checkLoginRateLimit(ipAddress);
        
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                request.getUsername(),
                request.getPassword()
            )
        );
        
        TokenPair tokens = tokenManager.generateTokens(authentication);
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        
        return ResponseEntity.ok(new AuthResponse(
            tokens.accessToken(),
            tokens.refreshToken(),
            "Bearer",
            900, // 15 minutes in seconds
            mapToUserDto(userDetails)
        ));
    }
    
    @PostMapping("/refresh")
    public ResponseEntity<TokenRefreshResponse> refresh(
            @RequestBody @Valid RefreshTokenRequest request) {
        
        // Extract user ID from token for rate limiting
        String userId = extractUserIdFromToken(request.getRefreshToken());
        rateLimiter.checkRefreshRateLimit(userId);
        
        TokenPair tokens = tokenManager.refreshTokens(request.getRefreshToken());
        
        return ResponseEntity.ok(new TokenRefreshResponse(
            tokens.accessToken(),
            tokens.refreshToken(),
            "Bearer",
            900
        ));
    }
    
    @PostMapping("/logout")
    public ResponseEntity<MessageResponse> logout(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestHeader("Authorization") String authHeader) {
        
        String token = authHeader.substring(7); // Remove "Bearer " prefix
        Long userId = extractUserId(userDetails);
        
        tokenManager.revokeTokens(token, userId);
        
        return ResponseEntity.ok(new MessageResponse("Logged out successfully"));
    }
    
    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
```


## Algorithms and Implementation Details

### Token Generation Algorithm

```
FUNCTION generateAccessToken(userDetails, userId):
    now = currentTimestamp()
    expirationTime = now + 15_MINUTES
    
    claims = {
        "sub": userDetails.username,
        "userId": userId,
        "roles": userDetails.authorities,
        "iat": now,
        "exp": expirationTime
    }
    
    token = JWT.sign(claims, currentSigningKey, HS256)
    RETURN token
END FUNCTION

FUNCTION generateRefreshToken(userId):
    now = currentTimestamp()
    expirationTime = now + 7_DAYS
    tokenId = generateUUID()
    
    claims = {
        "sub": userId,
        "tokenId": tokenId,
        "type": "refresh",
        "iat": now,
        "exp": expirationTime
    }
    
    token = JWT.sign(claims, currentSigningKey, HS256)
    
    // Store in database
    tokenHash = SHA256(token)
    database.save({
        userId: userId,
        tokenHash: tokenHash,
        expiresAt: expirationTime,
        used: false
    })
    
    RETURN token
END FUNCTION
```

### Token Validation Algorithm

```
FUNCTION validateAccessToken(token):
    // Fast path: check blacklist first
    IF tokenBlacklist.contains(token):
        LOG "Blacklisted token rejected"
        RETURN false
    END IF
    
    // Parse and verify signature
    TRY:
        claims = parseTokenWithCurrentKey(token)
    CATCH SignatureException:
        // Try legacy key if within grace period
        IF legacyKeyAvailable AND withinGracePeriod():
            TRY:
                claims = parseTokenWithLegacyKey(token)
                LOG "Legacy token detected for user " + claims.sub
            CATCH:
                LOG "Invalid token signature"
                RETURN false
            END TRY
        ELSE:
            LOG "Invalid token signature"
            RETURN false
        END IF
    END TRY
    
    // Check expiration
    IF claims.exp < currentTimestamp():
        LOG "Expired token rejected for user " + claims.sub
        RETURN false
    END IF
    
    RETURN true
END FUNCTION
```

### Refresh Token Rotation Algorithm

```
FUNCTION refreshTokens(refreshToken):
    // Parse and validate token
    claims = parseToken(refreshToken)
    
    // Verify it's a refresh token
    IF claims.type != "refresh":
        THROW InvalidTokenException("Not a refresh token")
    END IF
    
    userId = claims.sub
    tokenId = claims.tokenId
    tokenHash = SHA256(refreshToken)
    
    // Check database
    entity = database.findByTokenHash(tokenHash)
    IF entity == null:
        THROW InvalidTokenException("Refresh token not found")
    END IF
    
    // Check for reuse (potential token theft)
    IF entity.used == true:
        LOG "SECURITY ALERT: Token reuse detected for user " + userId
        database.deleteAllTokensForUser(userId)
        THROW SecurityException("Token reuse detected")
    END IF
    
    // Check expiration
    IF entity.expiresAt < currentTimestamp():
        THROW InvalidTokenException("Refresh token expired")
    END IF
    
    // Mark old token as used
    entity.used = true
    entity.usedAt = currentTimestamp()
    database.save(entity)
    
    // Generate new token pair
    newAccessToken = generateAccessToken(userId)
    newRefreshToken = generateRefreshToken(userId)
    
    RETURN (newAccessToken, newRefreshToken)
END FUNCTION
```


### Rate Limiting Algorithm (Sliding Window)

```
FUNCTION checkRateLimit(identifier, maxRequests, windowDuration):
    now = currentTimestamp()
    cutoff = now - windowDuration
    
    // Get or create bucket for this identifier
    bucket = cache.get(identifier)
    IF bucket == null:
        bucket = createEmptyBucket()
    END IF
    
    // Remove timestamps outside the window
    WHILE bucket.timestamps.notEmpty() AND bucket.timestamps.first() < cutoff:
        bucket.timestamps.removeFirst()
    END WHILE
    
    // Check if we have capacity
    IF bucket.timestamps.size() >= maxRequests:
        oldestTimestamp = bucket.timestamps.first()
        resetTime = oldestTimestamp + windowDuration
        retryAfterSeconds = resetTime - now
        
        LOG "Rate limit exceeded for " + identifier
        THROW RateLimitExceededException(retryAfterSeconds)
    END IF
    
    // Add current request
    bucket.timestamps.add(now)
    cache.put(identifier, bucket)
    
    RETURN true
END FUNCTION
```

### Secrets Loading Priority Algorithm

```
FUNCTION loadSecret(secretKey):
    providers = [
        VaultSecretsProvider,      // Priority 100
        KubernetesSecretsProvider, // Priority 90
        DockerSecretsProvider,     // Priority 80
        EnvironmentSecretsProvider // Priority 70
    ]
    
    // Filter to available providers and sort by priority
    availableProviders = providers
        .filter(p => p.isAvailable())
        .sortByPriority(descending)
    
    LOG "Available secrets providers: " + availableProviders.names()
    
    // Try each provider in priority order
    FOR EACH provider IN availableProviders:
        value = provider.getSecret(secretKey)
        IF value != null AND value.notBlank():
            LOG "Loaded secret " + secretKey + " from " + provider.name()
            RETURN value
        END IF
    END FOR
    
    // No provider had the secret
    RETURN null
END FUNCTION
```

### Token Hash Function

```
FUNCTION hashToken(token):
    // Use SHA-256 for consistent, secure hashing
    digest = SHA256.create()
    hashBytes = digest.hash(token.toBytes(UTF8))
    hashString = Base64.encode(hashBytes)
    RETURN hashString
END FUNCTION

// Why hash tokens before storage?
// 1. Prevents token exposure if database is compromised
// 2. Fixed-length storage (64 chars) regardless of token length
// 3. Fast lookup with indexed hash column
// 4. Industry standard practice for token storage
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing the acceptance criteria, I identified the following testable properties. Several properties were combined to eliminate redundancy:

- **Token expiration properties (6.1, 6.2, 6.7, 6.8)** can be combined into a single property about correct expiration calculation
- **Token claims properties (6.3, 6.6)** can be combined into a property about token structure and signing
- **Blacklist properties (8.1, 8.4)** can be combined into a property about blacklist round-trip behavior
- **Validation properties (2.6, 2.7, 2.8)** can be combined into a property about input validation

The following properties represent the core correctness guarantees for the pure functional components of this system:

### Property 1: Secret Validation Rejects Invalid Inputs

*For any* secret key with validation rules, if the secret value violates those rules (JWT_SECRET < 32 chars, ENCRYPTION_SECRET != 32 chars, or any required secret is empty), the Security_Manager SHALL reject the configuration and terminate startup.

**Validates: Requirements 2.6, 2.7, 2.8**

### Property 2: Token Expiration Calculation

*For any* user authentication and token type (access or refresh), the generated token SHALL have an expiration time equal to the issued-at time plus the configured validity period (15 minutes for access tokens, 7 days for refresh tokens).

**Validates: Requirements 6.1, 6.2, 6.7, 6.8**

### Property 3: Token Structure and Signing

*For any* user with any set of roles, the generated access token SHALL contain userId, username, and roles claims, AND SHALL be signed with the JWT_SECRET using HS256 algorithm such that parsing with the same secret succeeds.

**Validates: Requirements 6.3, 6.6**

### Property 4: Token Signature Round-Trip

*For any* generated token, parsing the token with the signing key that created it SHALL successfully extract the original claims without modification.

**Validates: Requirements 6.6**

### Property 5: Refresh Token Rotation Produces New Token

*For any* valid refresh token, when rotation is performed, the Token_Manager SHALL generate a new refresh token with a different tokenId claim than the original token.

**Validates: Requirements 7.3**

### Property 6: Refresh Token Single-Use Enforcement

*For any* refresh token, after it has been used once for rotation, subsequent attempts to use the same token SHALL be rejected with an error.

**Validates: Requirements 7.4, 7.7**

### Property 7: Token Blacklist Round-Trip

*For any* access token, after adding it to the Token_Blacklist, querying the blacklist with that token SHALL return true, and validation of that token SHALL fail.

**Validates: Requirements 8.1, 8.4**

### Property 8: Backward Compatibility Window

*For any* token signed with the old JWT_SECRET, if the application started less than 24 hours ago and OLD_JWT_SECRET is configured, token validation SHALL succeed. After 24 hours, validation SHALL fail.

**Validates: Requirements 9.1**

### Property 9: Rate Limit Enforcement

*For any* identifier (IP address or user ID), after N requests within the configured time window, the (N+1)th request SHALL be rejected with a rate limit error.

**Validates: Requirements 13.1, 13.2**

### Property 10: Sliding Window Rate Limiting

*For any* sequence of requests, only requests with timestamps within the sliding window (current time minus window duration) SHALL count toward the rate limit.

**Validates: Requirements 13.6**


## Error Handling

### Error Categories and Responses

#### 1. Startup Validation Errors

**Scenario**: Missing or invalid secrets during application startup

**Handling**:
- Log detailed error message identifying the missing/invalid secret
- Terminate application with non-zero exit code
- Do NOT start accepting requests with invalid configuration

**Example**:
```
ERROR: Required secret JWT_SECRET is missing or empty. 
Please configure it in one of: Vault, Kubernetes Secrets, Docker Secrets, or Environment Variables.
Application startup failed.
```

#### 2. Authentication Errors

**Scenario**: Invalid credentials, expired tokens, blacklisted tokens

**HTTP Status**: 401 Unauthorized

**Response**:
```json
{
  "status": 401,
  "message": "Invalid credentials",
  "timestamp": "2025-06-15T10:30:00Z"
}
```

**Logging**:
- INFO: Successful authentication
- WARN: Expired token rejected
- ERROR: Invalid signature, blacklisted token, token reuse detected

#### 3. Rate Limit Errors

**Scenario**: Too many requests from same IP or user

**HTTP Status**: 429 Too Many Requests

**Response**:
```json
{
  "status": 429,
  "message": "Too many login attempts. Please try again in 847 seconds",
  "timestamp": "2025-06-15T10:30:00Z"
}
```

**Headers**:
```
Retry-After: 847
```

**Logging**:
- WARN: Rate limit exceeded with identifier (IP or user ID)

#### 4. Token Refresh Errors

**Scenario**: Invalid refresh token, expired refresh token, token reuse

**HTTP Status**: 401 Unauthorized

**Response**:
```json
{
  "status": 401,
  "message": "Invalid or expired refresh token",
  "timestamp": "2025-06-15T10:30:00Z"
}
```

**Special Case - Token Reuse (Security Alert)**:

**HTTP Status**: 401 Unauthorized

**Response**:
```json
{
  "status": 401,
  "message": "Security violation detected. Please log in again.",
  "timestamp": "2025-06-15T10:30:00Z"
}
```

**Logging**:
- ERROR: "SECURITY ALERT: Refresh token reuse detected for user {userId}, possible token theft"

**Action**:
- Revoke ALL refresh tokens for the affected user
- Force re-authentication

#### 5. TLS/SSL Errors

**Scenario**: Certificate loading failure, expired certificate, invalid keystore

**Handling**:
- Log detailed error with certificate details
- Terminate application startup (fail fast)
- Warn if certificate expires within 30 days

**Example**:
```
ERROR: Failed to load keystore from /etc/ssl/keystore.p12: Invalid keystore password
Application startup failed.

WARN: Certificate 'smartcity-prod' expires in 28 days (2025-07-13)
```


### Error Handling Principles

1. **Fail Fast**: Detect configuration errors at startup, not at runtime
2. **Clear Messages**: Provide actionable error messages without exposing secrets
3. **Security First**: Log security violations at ERROR level, revoke tokens on suspicious activity
4. **User-Friendly**: Return generic messages to clients, detailed logs for operators
5. **Graceful Degradation**: Fall back to alternative secrets sources, support both Redis and in-memory blacklist

### Exception Hierarchy

```java
// Base exception for security-related errors
public class SecurityException extends RuntimeException {
    public SecurityException(String message) {
        super(message);
    }
}

// Token validation failures
public class InvalidTokenException extends SecurityException {
    public InvalidTokenException(String message) {
        super(message);
    }
}

// Rate limiting
public class RateLimitExceededException extends SecurityException {
    private final long retryAfterSeconds;
    
    public RateLimitExceededException(String message, long retryAfterSeconds) {
        super(message);
        this.retryAfterSeconds = retryAfterSeconds;
    }
    
    public long getRetryAfterSeconds() {
        return retryAfterSeconds;
    }
}

// Startup validation
public class ConfigurationException extends RuntimeException {
    public ConfigurationException(String message) {
        super(message);
    }
}
```

## Testing Strategy

### Testing Approach

This feature requires a **dual testing approach**:

1. **Unit Tests**: Test pure functions (token generation, validation, hashing) and specific scenarios
2. **Integration Tests**: Test infrastructure integration (secrets loading, database operations, HTTPS)
3. **Property-Based Tests**: Test universal properties across randomized inputs (token generation, validation, rate limiting)

### Property-Based Testing

**Library**: [jqwik](https://jqwik.net/) for Java property-based testing

**Configuration**: Minimum 100 iterations per property test

**Test Structure**:

```java
@Property
@Label("Feature: security-fixes-p0-critical, Property 2: Token Expiration Calculation")
void accessTokenExpirationIsAlways15Minutes(@ForAll("userAuthentications") Authentication auth) {
    // Generate token
    TokenPair tokens = tokenManager.generateTokens(auth);
    
    // Parse token
    Claims claims = Jwts.parserBuilder()
        .setSigningKey(signingKey)
        .build()
        .parseClaimsJws(tokens.accessToken())
        .getBody();
    
    // Verify expiration
    long issuedAt = claims.getIssuedAt().getTime();
    long expiration = claims.getExpiration().getTime();
    long actualValidity = expiration - issuedAt;
    long expectedValidity = 15 * 60 * 1000; // 15 minutes
    
    assertThat(actualValidity).isEqualTo(expectedValidity);
}

@Provide
Arbitrary<Authentication> userAuthentications() {
    return Combinators.combine(
        Arbitraries.strings().alpha().ofMinLength(3).ofMaxLength(50),
        Arbitraries.longs().between(1L, 1_000_000L),
        Arbitraries.of("ROLE_USER", "ROLE_ADMIN", "ROLE_MODERATOR")
            .list().ofMinSize(1).ofMaxSize(3)
    ).as((username, userId, roles) -> {
        List<GrantedAuthority> authorities = roles.stream()
            .map(SimpleGrantedAuthority::new)
            .collect(Collectors.toList());
        
        UserDetails userDetails = User.builder()
            .username(username)
            .password("password")
            .authorities(authorities)
            .build();
        
        return new UsernamePasswordAuthenticationToken(userDetails, null, authorities);
    });
}
```


### Unit Testing Strategy

**Focus Areas**:
- Token generation with specific user data
- Token validation with expired tokens
- Blacklist add/contains operations
- Rate limiter with specific request sequences
- Secret validation with invalid inputs
- Backward compatibility with old/new secrets

**Example Unit Test**:

```java
@Test
@DisplayName("Should reject JWT_SECRET shorter than 32 characters")
void shouldRejectShortJwtSecret() {
    // Arrange
    String shortSecret = "short"; // Only 5 characters
    
    // Act & Assert
    assertThatThrownBy(() -> securityManager.validateSecret("JWT_SECRET", shortSecret))
        .isInstanceOf(IllegalStateException.class)
        .hasMessageContaining("JWT_SECRET must be at least 32 characters");
}

@Test
@DisplayName("Should add token to blacklist and reject validation")
void shouldBlacklistToken() {
    // Arrange
    String token = generateTestToken();
    Instant expiration = Instant.now().plusSeconds(900);
    
    // Act
    tokenBlacklist.add(token, expiration);
    boolean isValid = tokenManager.validateAccessToken(token);
    
    // Assert
    assertThat(tokenBlacklist.contains(token)).isTrue();
    assertThat(isValid).isFalse();
}

@Test
@DisplayName("Should reject 6th login attempt within 15 minutes")
void shouldEnforceLoginRateLimit() {
    // Arrange
    String ipAddress = "192.168.1.100";
    
    // Act - Make 5 successful attempts
    for (int i = 0; i < 5; i++) {
        rateLimiter.checkLoginRateLimit(ipAddress);
    }
    
    // Assert - 6th attempt should fail
    assertThatThrownBy(() -> rateLimiter.checkLoginRateLimit(ipAddress))
        .isInstanceOf(RateLimitExceededException.class)
        .hasMessageContaining("Too many login attempts");
}
```

### Integration Testing Strategy

**Focus Areas**:
- Secrets loading from Docker Secrets, Kubernetes, environment variables
- Database operations for refresh tokens and blacklist
- HTTPS server configuration and certificate loading
- HTTP to HTTPS redirection
- End-to-end authentication flow

**Example Integration Test**:

```java
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@Testcontainers
class AuthenticationIntegrationTest {
    
    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15")
        .withDatabaseName("testdb");
    
    @Autowired
    private TestRestTemplate restTemplate;
    
    @Test
    @DisplayName("Should complete full authentication flow with token refresh")
    void shouldCompleteAuthenticationFlow() {
        // 1. Login
        LoginRequest loginRequest = new LoginRequest("user@example.com", "password");
        ResponseEntity<AuthResponse> loginResponse = restTemplate.postForEntity(
            "/api/auth/login", loginRequest, AuthResponse.class);
        
        assertThat(loginResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        String accessToken = loginResponse.getBody().getAccessToken();
        String refreshToken = loginResponse.getBody().getRefreshToken();
        
        // 2. Use access token
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        ResponseEntity<String> apiResponse = restTemplate.exchange(
            "/api/protected-resource", HttpMethod.GET, 
            new HttpEntity<>(headers), String.class);
        
        assertThat(apiResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        
        // 3. Refresh tokens
        RefreshTokenRequest refreshRequest = new RefreshTokenRequest(refreshToken);
        ResponseEntity<TokenRefreshResponse> refreshResponse = restTemplate.postForEntity(
            "/api/auth/refresh", refreshRequest, TokenRefreshResponse.class);
        
        assertThat(refreshResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        String newAccessToken = refreshResponse.getBody().getAccessToken();
        assertThat(newAccessToken).isNotEqualTo(accessToken);
        
        // 4. Logout
        headers.setBearerAuth(newAccessToken);
        ResponseEntity<MessageResponse> logoutResponse = restTemplate.exchange(
            "/api/auth/logout", HttpMethod.POST, 
            new HttpEntity<>(headers), MessageResponse.class);
        
        assertThat(logoutResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        
        // 5. Verify token is blacklisted
        ResponseEntity<String> afterLogout = restTemplate.exchange(
            "/api/protected-resource", HttpMethod.GET, 
            new HttpEntity<>(headers), String.class);
        
        assertThat(afterLogout.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }
}
```


### Test Mode Support

**Configuration for Testing**:

```yaml
# application-test.yml
spring:
  profiles:
    active: test

server:
  ssl:
    enabled: false  # Disable HTTPS in tests

security:
  validation:
    enabled: false  # Skip startup validation in tests
  
jwt:
  secret: test-secret-key-32-characters-long-for-testing
  
encryption:
  secret: test-encryption-key-32-chars!!

# Use H2 in-memory database for tests
spring:
  datasource:
    url: jdbc:h2:mem:testdb
    driver-class-name: org.h2.Driver
  jpa:
    hibernate:
      ddl-auto: create-drop
```

**Test Configuration Class**:

```java
@TestConfiguration
public class SecurityTestConfig {
    
    @Bean
    @Primary
    public SecurityManager testSecurityManager() {
        return new SecurityManager() {
            @Override
            public void onApplicationEvent(ApplicationReadyEvent event) {
                // Skip validation in test mode
                log.info("Test mode: Skipping security validation");
            }
            
            @Override
            public String getSecret(String key) {
                // Return test secrets
                return switch (key) {
                    case "JWT_SECRET" -> "test-secret-key-32-characters-long-for-testing";
                    case "ENCRYPTION_SECRET" -> "test-encryption-key-32-chars!!";
                    default -> "test-value";
                };
            }
        };
    }
    
    @Bean
    @Primary
    public TokenBlacklist testTokenBlacklist() {
        return new InMemoryTokenBlacklist(); // Always use in-memory for tests
    }
}
```

### Performance Testing

**Benchmarks to Validate**:

1. **Token Validation Latency**: < 2ms (p95)
2. **Blacklist Lookup**: < 1ms (p95)
3. **TLS Handshake**: < 50ms (p95)
4. **Token Generation**: < 5ms (p95)

**JMH Benchmark Example**:

```java
@State(Scope.Benchmark)
@BenchmarkMode(Mode.AverageTime)
@OutputTimeUnit(TimeUnit.MILLISECONDS)
public class TokenValidationBenchmark {
    
    private JwtTokenManager tokenManager;
    private String validToken;
    
    @Setup
    public void setup() {
        tokenManager = new JwtTokenManager(/* dependencies */);
        validToken = generateTestToken();
    }
    
    @Benchmark
    public boolean validateToken() {
        return tokenManager.validateAccessToken(validToken);
    }
}
```

### Test Coverage Goals

- **Unit Tests**: > 90% coverage for security components
- **Integration Tests**: All critical paths (login, refresh, logout, rate limiting)
- **Property Tests**: All 10 correctness properties with 100+ iterations each
- **Performance Tests**: All latency requirements validated


## Configuration Reference

### Environment Variables

**Required Secrets**:

```bash
# JWT Configuration
JWT_SECRET=<64-character-random-string>  # Min 32 chars, recommend 64+
OLD_JWT_SECRET=<previous-jwt-secret>     # Optional, for 24-hour migration

# Encryption
ENCRYPTION_SECRET=<exactly-32-character-string>  # For AES-256

# Twilio (SMS/MFA)
TWILIO_ACCOUNT_SID=<twilio-account-sid>
TWILIO_AUTH_TOKEN=<twilio-auth-token>
TWILIO_PHONE_NUMBER=<twilio-phone-number>

# Optional: API Keys
GROQ_API_KEYS=<comma-separated-keys>
GEMINI_API_KEYS=<comma-separated-keys>
ADMIN_API_TOKEN=<admin-api-token>
```

**HTTPS Configuration**:

```bash
# TLS/SSL Certificate
KEYSTORE_PATH=/etc/ssl/smartcity.p12
KEYSTORE_PASSWORD=<keystore-password>
KEYSTORE_TYPE=PKCS12  # or JKS
```

**Optional: Vault Configuration**:

```bash
VAULT_ADDR=https://vault.example.com:8200
VAULT_TOKEN=<vault-token>
VAULT_NAMESPACE=smartcity
```

### Application Properties

**application.properties** (production):

```properties
# Server Configuration
server.port=8443
server.ssl.enabled=true
server.ssl.key-store=${KEYSTORE_PATH}
server.ssl.key-store-password=${KEYSTORE_PASSWORD}
server.ssl.key-store-type=${KEYSTORE_TYPE:PKCS12}
server.ssl.protocol=TLS
server.ssl.enabled-protocols=TLSv1.2,TLSv1.3

# JWT Configuration (NO DEFAULT VALUES)
jwt.secret=${JWT_SECRET}
jwt.old-secret=${OLD_JWT_SECRET:}
jwt.access-token-validity-ms=900000
jwt.refresh-token-validity-ms=604800000

# Encryption (NO DEFAULT VALUES)
encryption.secret=${ENCRYPTION_SECRET}

# Twilio (NO DEFAULT VALUES)
twilio.account-sid=${TWILIO_ACCOUNT_SID}
twilio.auth-token=${TWILIO_AUTH_TOKEN}
twilio.phone-number=${TWILIO_PHONE_NUMBER}

# Rate Limiting
rate-limit.login.max-attempts=5
rate-limit.login.window-minutes=15
rate-limit.refresh.max-attempts=10
rate-limit.refresh.window-minutes=1

# Token Blacklist
token.blacklist.type=redis  # or 'memory'
spring.data.redis.host=${REDIS_HOST:localhost}
spring.data.redis.port=${REDIS_PORT:6379}

# Database
spring.datasource.url=${DATABASE_URL}
spring.datasource.username=${DATABASE_USERNAME}
spring.datasource.password=${DATABASE_PASSWORD}

# Flyway Migrations
spring.flyway.enabled=true
spring.flyway.locations=classpath:db/migration
```

### Docker Compose Example

```yaml
version: '3.8'

services:
  smartcity-backend:
    image: smartcity-backend:latest
    ports:
      - "8080:8080"   # HTTP (redirects to HTTPS)
      - "8443:8443"   # HTTPS
    environment:
      - DATABASE_URL=jdbc:postgresql://postgres:5432/smartcity
      - DATABASE_USERNAME=smartcity
      - DATABASE_PASSWORD_FILE=/run/secrets/db_password
      - JWT_SECRET_FILE=/run/secrets/jwt_secret
      - ENCRYPTION_SECRET_FILE=/run/secrets/encryption_secret
      - KEYSTORE_PATH=/run/secrets/keystore.p12
      - KEYSTORE_PASSWORD_FILE=/run/secrets/keystore_password
    secrets:
      - db_password
      - jwt_secret
      - encryption_secret
      - keystore.p12
      - keystore_password
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=smartcity
      - POSTGRES_USER=smartcity
      - POSTGRES_PASSWORD_FILE=/run/secrets/db_password
    secrets:
      - db_password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

secrets:
  db_password:
    file: ./secrets/db_password.txt
  jwt_secret:
    file: ./secrets/jwt_secret.txt
  encryption_secret:
    file: ./secrets/encryption_secret.txt
  keystore.p12:
    file: ./secrets/keystore.p12
  keystore_password:
    file: ./secrets/keystore_password.txt

volumes:
  postgres_data:
```


### Kubernetes Deployment Example

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: smartcity-secrets
type: Opaque
stringData:
  jwt-secret: "<base64-encoded-jwt-secret>"
  encryption-secret: "<exactly-32-chars>"
  twilio-account-sid: "<twilio-sid>"
  twilio-auth-token: "<twilio-token>"
  twilio-phone-number: "<twilio-number>"
  keystore-password: "<keystore-password>"

---
apiVersion: v1
kind: Secret
metadata:
  name: smartcity-tls
type: kubernetes.io/tls
data:
  keystore.p12: "<base64-encoded-keystore>"

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: smartcity-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: smartcity-backend
  template:
    metadata:
      labels:
        app: smartcity-backend
    spec:
      containers:
      - name: backend
        image: smartcity-backend:latest
        ports:
        - containerPort: 8080
          name: http
        - containerPort: 8443
          name: https
        env:
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: smartcity-secrets
              key: jwt-secret
        - name: ENCRYPTION_SECRET
          valueFrom:
            secretKeyRef:
              name: smartcity-secrets
              key: encryption-secret
        - name: TWILIO_ACCOUNT_SID
          valueFrom:
            secretKeyRef:
              name: smartcity-secrets
              key: twilio-account-sid
        - name: TWILIO_AUTH_TOKEN
          valueFrom:
            secretKeyRef:
              name: smartcity-secrets
              key: twilio-auth-token
        - name: TWILIO_PHONE_NUMBER
          valueFrom:
            secretKeyRef:
              name: smartcity-secrets
              key: twilio-phone-number
        - name: KEYSTORE_PASSWORD
          valueFrom:
            secretKeyRef:
              name: smartcity-secrets
              key: keystore-password
        - name: KEYSTORE_PATH
          value: "/etc/ssl/keystore.p12"
        - name: DATABASE_URL
          value: "jdbc:postgresql://postgres-service:5432/smartcity"
        - name: REDIS_HOST
          value: "redis-service"
        volumeMounts:
        - name: tls-cert
          mountPath: /etc/ssl
          readOnly: true
        livenessProbe:
          httpGet:
            path: /actuator/health
            port: 8080
            scheme: HTTP
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /actuator/health
            port: 8080
            scheme: HTTP
          initialDelaySeconds: 10
          periodSeconds: 5
      volumes:
      - name: tls-cert
        secret:
          secretName: smartcity-tls

---
apiVersion: v1
kind: Service
metadata:
  name: smartcity-backend
spec:
  type: LoadBalancer
  selector:
    app: smartcity-backend
  ports:
  - name: http
    port: 80
    targetPort: 8080
  - name: https
    port: 443
    targetPort: 8443
```


## Deployment Strategy

### Zero-Downtime Deployment Process

**Phase 1: Preparation (Before Deployment)**

1. **Generate Secrets**:
   ```bash
   # Generate JWT secret (64 characters)
   openssl rand -base64 48
   
   # Generate encryption secret (exactly 32 characters)
   openssl rand -base64 24 | cut -c1-32
   
   # Generate self-signed certificate for development
   keytool -genkeypair -alias smartcity -keyalg RSA -keysize 2048 \
     -storetype PKCS12 -keystore keystore.p12 -validity 365 \
     -dname "CN=localhost, OU=Development, O=SmartCity, L=City, ST=State, C=US"
   ```

2. **Store Secrets** in chosen backend (Vault, Kubernetes, Docker Secrets)

3. **Database Migration**: Run Flyway migrations to create new tables
   ```bash
   ./mvnw flyway:migrate
   ```

**Phase 2: Deployment with Backward Compatibility**

1. **Set OLD_JWT_SECRET** to current production JWT secret
2. **Set JWT_SECRET** to new secret
3. **Deploy new version** with both secrets configured
4. **Verify** health checks pass on HTTPS port 8443
5. **Monitor** logs for "Legacy token detected" warnings

**Phase 3: Traffic Migration (24-hour window)**

1. **Update load balancer** to route traffic to HTTPS port 8443
2. **Keep HTTP port 8080** active for redirects
3. **Monitor** metrics:
   - Token validation latency
   - Rate limit violations
   - Legacy token usage
   - TLS handshake time

**Phase 4: Cleanup (After 24 hours)**

1. **Remove OLD_JWT_SECRET** from configuration
2. **Verify** no legacy token warnings in logs
3. **Update documentation** with new endpoints

### Rollback Plan

If issues are detected:

1. **Immediate**: Revert to previous version
2. **Database**: Refresh token and blacklist tables are backward compatible
3. **Secrets**: Old JWT_SECRET still works with previous version
4. **Monitoring**: Watch for increased 401 errors or authentication failures

### Certificate Management

**Development**:
- Use self-signed certificates
- Generate with keytool or openssl
- Store in version control (encrypted)

**Production**:
- Use certificates from trusted CA (Let's Encrypt, DigiCert)
- Automate renewal with cert-manager (Kubernetes) or certbot
- Monitor expiration with automated alerts (30 days before expiry)

**Certificate Renewal Process**:

```bash
# Using certbot for Let's Encrypt
certbot certonly --standalone -d api.smartcity.com

# Convert to PKCS12 format
openssl pkcs12 -export -in /etc/letsencrypt/live/api.smartcity.com/fullchain.pem \
  -inkey /etc/letsencrypt/live/api.smartcity.com/privkey.pem \
  -out keystore.p12 -name smartcity

# Update secret in Kubernetes
kubectl create secret generic smartcity-tls \
  --from-file=keystore.p12=keystore.p12 \
  --dry-run=client -o yaml | kubectl apply -f -

# Rolling restart to pick up new certificate
kubectl rollout restart deployment/smartcity-backend
```


## Monitoring and Observability

### Metrics to Track

**Security Metrics** (via Micrometer/Prometheus):

```java
@Component
public class SecurityMetrics {
    private final MeterRegistry meterRegistry;
    
    private final Counter loginAttempts;
    private final Counter loginFailures;
    private final Counter tokenRefreshes;
    private final Counter tokenValidations;
    private final Counter tokenRejections;
    private final Counter rateLimitViolations;
    private final Counter tokenReuseDetections;
    
    private final Timer tokenValidationTime;
    private final Timer tokenGenerationTime;
    private final Timer blacklistLookupTime;
    
    public SecurityMetrics(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
        
        this.loginAttempts = Counter.builder("auth.login.attempts")
            .description("Total login attempts")
            .register(meterRegistry);
        
        this.loginFailures = Counter.builder("auth.login.failures")
            .description("Failed login attempts")
            .tag("reason", "invalid_credentials")
            .register(meterRegistry);
        
        this.tokenRefreshes = Counter.builder("auth.token.refreshes")
            .description("Token refresh operations")
            .register(meterRegistry);
        
        this.tokenValidations = Counter.builder("auth.token.validations")
            .description("Token validation attempts")
            .register(meterRegistry);
        
        this.tokenRejections = Counter.builder("auth.token.rejections")
            .description("Rejected tokens")
            .tag("reason", "expired")
            .register(meterRegistry);
        
        this.rateLimitViolations = Counter.builder("auth.ratelimit.violations")
            .description("Rate limit violations")
            .tag("endpoint", "login")
            .register(meterRegistry);
        
        this.tokenReuseDetections = Counter.builder("auth.token.reuse")
            .description("Token reuse detections (security alerts)")
            .register(meterRegistry);
        
        this.tokenValidationTime = Timer.builder("auth.token.validation.time")
            .description("Token validation latency")
            .register(meterRegistry);
        
        this.tokenGenerationTime = Timer.builder("auth.token.generation.time")
            .description("Token generation latency")
            .register(meterRegistry);
        
        this.blacklistLookupTime = Timer.builder("auth.blacklist.lookup.time")
            .description("Blacklist lookup latency")
            .register(meterRegistry);
    }
    
    public void recordLoginAttempt() {
        loginAttempts.increment();
    }
    
    public void recordTokenReuse() {
        tokenReuseDetections.increment();
    }
    
    // ... other recording methods
}
```

**Prometheus Queries**:

```promql
# Login success rate
rate(auth_login_attempts_total[5m]) - rate(auth_login_failures_total[5m])

# Token validation latency (p95)
histogram_quantile(0.95, rate(auth_token_validation_time_bucket[5m]))

# Rate limit violation rate
rate(auth_ratelimit_violations_total[5m])

# Token reuse alerts (security incidents)
increase(auth_token_reuse_total[1h]) > 0
```

### Logging Strategy

**Log Levels**:

- **INFO**: Successful operations (login, logout, token refresh)
- **WARN**: Suspicious activity (expired tokens, rate limits, legacy tokens)
- **ERROR**: Security violations (invalid signatures, token reuse, blacklisted tokens)

**Log Format** (JSON for structured logging):

```json
{
  "timestamp": "2025-06-15T10:30:00.123Z",
  "level": "INFO",
  "logger": "com.example.smartcity.security.JwtTokenManager",
  "message": "User authenticated successfully",
  "context": {
    "username": "user@example.com",
    "userId": 12345,
    "ipAddress": "192.168.1.100",
    "userAgent": "Mozilla/5.0...",
    "sessionId": "abc123"
  }
}
```

**Security Alert Example**:

```json
{
  "timestamp": "2025-06-15T10:30:00.123Z",
  "level": "ERROR",
  "logger": "com.example.smartcity.security.JwtTokenManager",
  "message": "SECURITY ALERT: Refresh token reuse detected",
  "context": {
    "userId": 12345,
    "username": "user@example.com",
    "tokenId": "abc-123-def-456",
    "ipAddress": "192.168.1.100",
    "action": "revoked_all_user_tokens"
  }
}
```

### Alerting Rules

**Critical Alerts** (PagerDuty/Slack):

1. **Token Reuse Detection**: Any occurrence
2. **Startup Validation Failure**: Application fails to start
3. **Certificate Expiration**: < 7 days remaining
4. **High Token Rejection Rate**: > 10% of validations failing

**Warning Alerts**:

1. **Rate Limit Violations**: > 100/minute
2. **Legacy Token Usage**: After 20 hours of deployment
3. **Token Validation Latency**: p95 > 5ms
4. **Certificate Expiration**: < 30 days remaining


## Security Considerations

### Threat Model

**Threats Addressed**:

1. **T1: Secrets Exposure in Version Control**
   - **Mitigation**: Remove all secrets from application.properties, load from external sources
   - **Validation**: Startup fails if secrets are missing

2. **T2: Man-in-the-Middle Attacks**
   - **Mitigation**: HTTPS with TLS 1.2/1.3, strong cipher suites
   - **Validation**: HTTP automatically redirects to HTTPS

3. **T3: Token Theft and Replay**
   - **Mitigation**: Short-lived access tokens (15 min), token blacklist on logout
   - **Validation**: Stolen tokens expire quickly, blacklisted tokens rejected

4. **T4: Refresh Token Theft**
   - **Mitigation**: Token rotation (one-time use), reuse detection
   - **Validation**: Reused tokens trigger security alert and revoke all user tokens

5. **T5: Brute Force Attacks**
   - **Mitigation**: Rate limiting (5 login attempts per 15 minutes)
   - **Validation**: 6th attempt returns 429 with Retry-After header

6. **T6: Session Fixation**
   - **Mitigation**: New tokens generated on each refresh, old tokens invalidated
   - **Validation**: Old refresh tokens cannot be reused

### Security Best Practices Implemented

1. **Defense in Depth**: Multiple security layers (secrets management, HTTPS, short tokens, blacklist, rate limiting)
2. **Principle of Least Privilege**: Tokens contain only necessary claims
3. **Fail Secure**: Invalid configuration prevents startup
4. **Secure by Default**: HTTPS enabled, HTTP redirects, strong ciphers
5. **Audit Trail**: Comprehensive logging of all security events
6. **Token Hygiene**: Hash tokens before storage, automatic cleanup of expired tokens

### Compliance Considerations

**OWASP Top 10 Coverage**:

- ✅ **A01:2021 – Broken Access Control**: JWT validation on every request, role-based authorization
- ✅ **A02:2021 – Cryptographic Failures**: HTTPS/TLS encryption, strong cipher suites, proper key management
- ✅ **A03:2021 – Injection**: Parameterized queries for database operations
- ✅ **A05:2021 – Security Misconfiguration**: Startup validation, fail-fast on missing secrets
- ✅ **A07:2021 – Identification and Authentication Failures**: Short-lived tokens, MFA support, rate limiting

**GDPR Considerations**:

- Token blacklist and refresh tokens contain minimal PII (user ID only)
- Tokens automatically expire and are cleaned up
- Logout immediately revokes all tokens
- Security logging does not expose passwords or secrets

### Known Limitations

1. **In-Memory Blacklist**: Not suitable for multi-instance deployments without Redis
   - **Mitigation**: Use Redis for distributed blacklist in production

2. **Certificate Management**: Manual renewal process
   - **Mitigation**: Use cert-manager (Kubernetes) or automated renewal scripts

3. **Rate Limiting**: In-memory implementation not shared across instances
   - **Mitigation**: Use Redis for distributed rate limiting

4. **Token Revocation Delay**: Blacklisted tokens remain valid until expiration (max 15 minutes)
   - **Mitigation**: Short token lifetime minimizes exposure window

5. **Backward Compatibility Window**: 24-hour grace period for old tokens
   - **Mitigation**: Monitor legacy token usage, remove OLD_JWT_SECRET after migration

