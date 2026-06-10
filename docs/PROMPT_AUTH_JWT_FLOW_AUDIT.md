# PROMPT: Authentication, Authorization & JWT Flow Audit

## 🎯 Mục Đích
Kiểm tra toàn diện luồng Authentication/Authorization, JWT implementation, và tối ưu hóa Payload structures trong Smart City Backend System.

---

## 📋 Phạm Vi Kiểm Tra

### 1. Authentication Flow Analysis
### 2. Authorization & Role-Based Access Control (RBAC)
### 3. JWT Token Lifecycle
### 4. Payload Structure Optimization
### 5. Security Vulnerabilities
### 6. Performance & Best Practices

---

## 🔍 Chi Tiết Yêu Cầu Kiểm Tra

---

## PART 1: AUTHENTICATION FLOW AUDIT

### 1.1 Login Flow (Standard Username/Password)

**Các file cần kiểm tra:**
- `Sources/Backend/src/main/java/com/example/smartcity/modules/auth/controller/AuthController.java`
- `Sources/Backend/src/main/java/com/example/smartcity/modules/auth/service/AuthService.java`
- `Sources/Backend/src/main/java/com/example/smartcity/modules/auth/payload/LoginRequest.java`
- `Sources/Backend/src/main/java/com/example/smartcity/modules/auth/payload/AuthResponse.java`
- `Sources/Backend/src/main/java/com/example/smartcity/security/CustomUserDetailsService.java`

**Yêu cầu kiểm tra:**

```
✅ Xác minh luồng đăng nhập:
1. Client gửi POST /api/auth/login với { username, password }
2. AuthController nhận request và gọi AuthService
3. AuthService load user từ database qua CustomUserDetailsService
4. Validate password (BCrypt/Argon2?)
5. Nếu thành công: generate JWT token + refresh token
6. Trả về AuthResponse với tokens

❓ Các câu hỏi cần trả lời:
- Password có được hash đúng chuẩn không? (BCrypt rounds? Salt?)
- Có rate limiting cho login endpoint không?
- Có log failed login attempts không?
- Có implement account lockout sau X lần đăng nhập sai không?
- Response có leak thông tin nhạy cảm không? (email, phone number?)
```

### 1.2 Multi-Factor Authentication (MFA) Flow

**Các file cần kiểm tra:**
- `Sources/Backend/src/main/java/com/example/smartcity/modules/auth/service/MfaService.java`
- `Sources/Backend/src/main/java/com/example/smartcity/modules/auth/service/SmsService.java`
- `Sources/Backend/src/main/java/com/example/smartcity/modules/auth/service/MfaSessionService.java`
- `Sources/Backend/src/main/java/com/example/smartcity/modules/auth/payload/MfaVerificationRequest.java`
- `Sources/Backend/src/main/java/com/example/smartcity/modules/auth/entity/SmsVerification.java`

**Yêu cầu kiểm tra:**

```
✅ Xác minh luồng MFA:
1. Sau login thành công, check nếu user enable MFA
2. Generate OTP code (6 digits) và gửi qua SMS
3. Lưu OTP vào SmsVerification entity với expiration time
4. Client gửi MfaVerificationRequest với OTP code
5. Verify OTP và session
6. Nếu đúng: issue final JWT tokens

❓ Các câu hỏi cần trả lời:
- OTP có được generate securely không? (SecureRandom?)
- OTP expiration time là bao lâu? (recommended: 5-10 phút)
- Có giới hạn số lần thử OTP sai không?
- OTP có được delete sau khi verify thành công không?
- MFA session có timeout không?
- Có hỗ trợ TOTP (Google Authenticator) hay chỉ SMS?
```

### 1.3 Firebase Authentication Flow

**Các file cần kiểm tra:**
- `Sources/Backend/src/main/java/com/example/smartcity/modules/auth/service/FirebaseService.java`
- `Sources/Backend/src/main/java/com/example/smartcity/modules/auth/payload/FirebaseLoginRequest.java`

**Yêu cầu kiểm tra:**

```
✅ Xác minh luồng Firebase Auth:
1. Client gửi Firebase ID token
2. Backend verify token với Firebase Admin SDK
3. Extract user info (email, uid, name)
4. Check user exists trong database
5. Nếu không tồn tại: auto-create user
6. Generate internal JWT token
7. Trả về AuthResponse

❓ Các câu hỏi cần trả lời:
- Firebase token có được verify đúng không?
- Có validate Firebase token expiration không?
- Auto-created user có default role gì?
- Có conflict resolution khi email đã tồn tại không?
```

### 1.4 Refresh Token Flow

**Các file cần kiểm tra:**
- `Sources/Backend/src/main/java/com/example/smartcity/modules/auth/service/RefreshTokenService.java`
- `Sources/Backend/src/main/java/com/example/smartcity/modules/auth/entity/RefreshToken.java`
- `Sources/Backend/src/main/java/com/example/smartcity/modules/auth/repository/RefreshTokenRepository.java`

**Yêu cầu kiểm tra:**

```
✅ Xác minh luồng Refresh Token:
1. Client gửi POST /api/auth/refresh với refresh token
2. Backend validate refresh token từ database
3. Check token expiration
4. Generate new access token (và optionally new refresh token)
5. Trả về TokenPairResponse

❓ Các câu hỏi cần trả lời:
- Refresh token có được lưu trong database không?
- Refresh token expiration time? (recommended: 7-30 days)
- Có implement refresh token rotation không? (security best practice)
- Có revoke old refresh token sau khi issue new token không?
- Có detect refresh token reuse attack không?
```

---

## PART 2: AUTHORIZATION & RBAC AUDIT

### 2.1 Role-Based Access Control

**Các file cần kiểm tra:**
- `Sources/Backend/src/main/java/com/example/smartcity/modules/user/entity/User.java`
- `Sources/Backend/src/main/java/com/example/smartcity/modules/user/entity/Role.java`
- `Sources/Backend/src/main/java/com/example/smartcity/security/SecurityConfig.java`

**Yêu cầu kiểm tra:**

```
✅ Xác minh RBAC implementation:
1. Liệt kê tất cả roles: ADMIN, OFFICER, CITIZEN, v.v.
2. Xác định permissions của từng role
3. Kiểm tra role assignment logic
4. Verify role inheritance (nếu có)

❓ Các câu hỏi cần trả lời:
- Roles được define như thế nào? (Enum? Database?)
- Có support multiple roles per user không?
- Authorization rules được config ở đâu? (SecurityConfig? Annotations?)
- Có sử dụng @PreAuthorize/@Secured annotations không?
- Có permission granularity (CRUD per resource) không?

📋 Ví dụ mapping mong muốn:
ROLE_ADMIN:
  - Full access tất cả modules
  
ROLE_OFFICER:
  - Read/Write feedbacks
  - Read analytics
  - Cannot manage users
  
ROLE_CITIZEN:
  - Create feedback
  - Read own feedbacks
  - Read weather
```

### 2.2 Endpoint Protection

**Yêu cầu kiểm tra:**

```
✅ Kiểm tra authorization cho từng module:

Module: Auth
  POST /api/auth/register      → permitAll()
  POST /api/auth/login         → permitAll()
  POST /api/auth/refresh       → permitAll()
  POST /api/auth/logout        → authenticated()
  
Module: User
  GET /api/users               → ROLE_ADMIN
  GET /api/users/{id}          → authenticated() + own resource check
  PUT /api/users/{id}          → authenticated() + own resource check
  DELETE /api/users/{id}       → ROLE_ADMIN
  
Module: Feedback
  POST /api/feedbacks          → ROLE_CITIZEN
  GET /api/feedbacks           → ROLE_OFFICER, ROLE_ADMIN
  PUT /api/feedbacks/{id}      → ROLE_OFFICER, ROLE_ADMIN
  DELETE /api/feedbacks/{id}   → ROLE_ADMIN
  
Module: Analytics
  GET /api/analytics/*         → ROLE_OFFICER, ROLE_ADMIN
  
Module: Weather
  GET /api/weather/*           → permitAll()
  
Module: AI Orchestrator
  POST /api/ai/chat            → authenticated()
  POST /api/ai/admin/*         → ROLE_ADMIN

❓ Liệt kê tất cả endpoints và access rules của từng module
```

---

## PART 3: JWT TOKEN LIFECYCLE AUDIT

### 3.1 JWT Token Generation

**Các file cần kiểm tra:**
- `Sources/Backend/src/main/java/com/example/smartcity/security/jwt/JwtTokenProvider.java`

**Yêu cầu kiểm tra:**

```
✅ Xác minh JWT token generation:

🔍 JWT Structure:
Header:
  {
    "alg": "HS256" hoặc "RS256"?,
    "typ": "JWT"
  }

Payload (Claims):
  {
    "sub": "user_id",
    "username": "string",
    "roles": ["ROLE_CITIZEN"],
    "iat": timestamp,
    "exp": timestamp,
    "jti": "token_id" (có không?)
  }

Signature:
  HMACSHA256(base64UrlEncode(header) + "." + base64UrlEncode(payload), secret)

❓ Các câu hỏi cần trả lời:
- Algorithm sử dụng: HS256 (symmetric) hay RS256 (asymmetric)?
- Secret key được quản lý như thế nào? (Environment variable? Kubernetes Secret?)
- Secret key có đủ mạnh không? (min 256 bits for HS256)
- Access token expiration time? (recommended: 15 phút - 1 giờ)
- Có include jti (JWT ID) để support token revocation không?
- Có include device/IP info trong claims không?
```

### 3.2 JWT Token Validation

**Các file cần kiểm tra:**
- `Sources/Backend/src/main/java/com/example/smartcity/security/jwt/JwtAuthenticationFilter.java`
- `Sources/Backend/src/main/java/com/example/smartcity/security/jwt/JwtTokenProvider.java`

**Yêu cầu kiểm tra:**

```
✅ Xác minh JWT validation flow:

1. Client gửi request với header: Authorization: Bearer {token}
2. JwtAuthenticationFilter extract token từ header
3. JwtTokenProvider validate token:
   - Verify signature
   - Check expiration
   - Check token blacklist (nếu có)
4. Extract user info từ claims
5. Load full user details từ database (optional)
6. Set authentication vào SecurityContext
7. Continue filter chain

❓ Các câu hỏi cần trả lời:
- Có validate token signature đúng không?
- Có check token expiration không?
- Có validate issuer (iss) và audience (aud) claims không?
- Có kiểm tra token trong blacklist không?
- Có re-load user từ database mỗi request không? (performance issue?)
- Error handling khi token invalid: status code? message?
```

### 3.3 Token Blacklist & Revocation

**Các file cần kiểm tra:**
- `Sources/Backend/src/main/java/com/example/smartcity/security/jwt/TokenBlacklistService.java`

**Yêu cầu kiểm tra:**

```
✅ Xác minh token revocation mechanism:

Use cases cần revoke token:
1. User logout
2. User change password
3. Admin force logout user
4. Security breach

❓ Các câu hỏi cần trả lời:
- Có implement token blacklist không?
- Blacklist được store ở đâu? (Redis? Database? In-memory?)
- TTL của blacklist entries?
- Có support revoke tất cả tokens của một user không?
- Performance impact của blacklist checking?
```

---

## PART 4: PAYLOAD STRUCTURE OPTIMIZATION

### 4.1 Request Payload Analysis

**Các file cần kiểm tra:**
- `Sources/Backend/src/main/java/com/example/smartcity/modules/auth/payload/LoginRequest.java`
- `Sources/Backend/src/main/java/com/example/smartcity/modules/auth/payload/RegisterRequest.java`
- `Sources/Backend/src/main/java/com/example/smartcity/modules/auth/payload/MfaVerificationRequest.java`
- `Sources/Backend/src/main/java/com/example/smartcity/modules/auth/payload/FirebaseLoginRequest.java`
- `Sources/Backend/src/main/java/com/example/smartcity/modules/auth/payload/ForgotPasswordRequest.java`
- Payload test files: `payload.json`, `payload2.json`, `payload_login.json`

**Yêu cầu kiểm tra:**

```
✅ Phân tích từng Request Payload:

1. LoginRequest
   Current structure (dự đoán):
   {
     "username": "string",
     "password": "string"
   }
   
   Optimization suggestions:
   - Có cần thêm "rememberMe": boolean?
   - Có cần "deviceId": string?
   - Có validate input format không? (@NotBlank, @Size, @Pattern)
   
2. RegisterRequest
   Current structure (dự đoán):
   {
     "username": "string",
     "password": "string",
     "fullName": "string",
     "email": "string"?,
     "phoneNumber": "string"?
   }
   
   Optimization suggestions:
   - Có cần confirm password field không?
   - Có validate password strength không? (regex, min length)
   - Email và phone có required không?
   - Có cần captcha token không?
   
3. MfaVerificationRequest
   Current structure (dự đoán):
   {
     "code": "string",
     "sessionId": "string"
   }
   
   Optimization suggestions:
   - Session ID có cần thiết không? (có thể dùng JWT session?)
   - Code format validation?
   
4. FirebaseLoginRequest
   Current structure (dự đoán):
   {
     "idToken": "string"
   }
   
   Optimization suggestions:
   - Có cần thêm platform info? (iOS, Android, Web)

❓ Câu hỏi chung cho tất cả Request Payloads:
- Có duplicate fields giữa các payloads không?
- Có thể tạo base class/interface chung không?
- Validation annotations có đầy đủ không?
- Field naming convention: camelCase consistent?
```

### 4.2 Response Payload Analysis

**Các file cần kiểm tra:**
- `Sources/Backend/src/main/java/com/example/smartcity/modules/auth/payload/AuthResponse.java`
- `Sources/Backend/src/main/java/com/example/smartcity/modules/auth/payload/TokenResponse.java`
- `Sources/Backend/src/main/java/com/example/smartcity/modules/auth/payload/TokenPairResponse.java`
- `Sources/Backend/src/main/java/com/example/smartcity/common/response/ApiResponse.java`

**Yêu cầu kiểm tra:**

```
✅ Phân tích Response Payloads:

1. AuthResponse
   Current structure (dự đoán):
   {
     "accessToken": "string",
     "refreshToken": "string",
     "tokenType": "Bearer",
     "expiresIn": 3600,
     "user": {
       "id": "string",
       "username": "string",
       "fullName": "string",
       "role": "ROLE_CITIZEN"
     }
   }
   
   ❓ Questions:
   - Có return sensitive info không? (password hash, email verified status)
   - TokenType có cần thiết không? (luôn là "Bearer")
   - ExpiresIn format: seconds hay timestamp?
   - User object có quá nhiều fields không?
   
2. TokenPairResponse
   Current structure (dự đoán):
   {
     "accessToken": "string",
     "refreshToken": "string"
   }
   
   ❓ Questions:
   - Có trùng lặp với AuthResponse không?
   - Có thể merge 2 classes này không?
   
3. TokenResponse
   Current structure (dự đoán):
   {
     "token": "string"
   }
   
   ❓ Questions:
   - Class này dùng cho trường hợp nào?
   - Có thể deprecate và dùng TokenPairResponse thay thế?

💡 Đề xuất cấu trúc Response chuẩn hóa:

ApiResponse<T> wrapper:
{
  "success": boolean,
  "message": "string",
  "data": T,
  "timestamp": "ISO-8601",
  "errors": [
    {
      "field": "username",
      "message": "Username is required"
    }
  ]
}

Áp dụng cho Auth:
{
  "success": true,
  "message": "Login successful",
  "data": {
    "tokens": {
      "access": "jwt_string",
      "refresh": "refresh_string",
      "expiresIn": 3600
    },
    "user": {
      "id": "uuid",
      "username": "string",
      "fullName": "string",
      "roles": ["ROLE_CITIZEN"]
    }
  },
  "timestamp": "2026-06-04T10:30:00Z"
}
```

### 4.3 Consolidation Opportunities

**Yêu cầu phân tích:**

```
✅ Xác định cơ hội hợp nhất payloads:

1. Token-related responses:
   - AuthResponse
   - TokenResponse
   - TokenPairResponse
   
   💡 Đề xuất: Tạo unified TokenDTO
   
2. User-related info trong responses:
   - UserDTO trong AuthResponse
   - UserDTO trong GET /api/users
   
   💡 Đề xuất: Tạo shared UserResponseDTO
   
3. Error responses:
   - Có chuẩn hóa error format không?
   - HTTP status codes mapping?
   
   💡 Đề xuất: GlobalExceptionHandler với ApiResponse wrapper

📊 Đánh giá hiện trạng:
- Tổng số payload classes hiện tại: ?
- Số classes có thể merge: ?
- Code duplication percentage: ?
- Recommended refactoring priority: High/Medium/Low
```

---

## PART 5: SECURITY VULNERABILITIES AUDIT

### 5.1 Common Vulnerabilities Checklist

```
🔒 OWASP Top 10 Security Checks:

✅ A01: Broken Access Control
- [ ] Có kiểm tra user ownership trước khi update/delete resource không?
- [ ] Có prevent horizontal privilege escalation không? (user A không thể xem data của user B)
- [ ] Có prevent vertical privilege escalation không? (citizen không thể access admin endpoints)
- [ ] CORS configuration secure không?

✅ A02: Cryptographic Failures
- [ ] Passwords được hash với bcrypt/argon2?
- [ ] JWT secret đủ mạnh không? (min 256 bits)
- [ ] Sensitive data có được encrypt at rest không?
- [ ] HTTPS enforced cho production?

✅ A03: Injection
- [ ] Có sử dụng PreparedStatement/JPA để prevent SQL injection không?
- [ ] Input validation đầy đủ không?
- [ ] Output encoding để prevent XSS?

✅ A04: Insecure Design
- [ ] MFA có được implement đúng flow không?
- [ ] Rate limiting cho sensitive endpoints?
- [ ] Account lockout mechanism?

✅ A05: Security Misconfiguration
- [ ] Default credentials có được remove không?
- [ ] Error messages có leak thông tin không?
- [ ] Security headers (HSTS, CSP, X-Frame-Options)?
- [ ] Unnecessary features/endpoints disabled?

✅ A07: Identification and Authentication Failures
- [ ] Session timeout configured?
- [ ] Multi-factor authentication available?
- [ ] Password policy enforced? (complexity, length, rotation)
- [ ] Brute force protection?

✅ A08: Software and Data Integrity Failures
- [ ] JWT signature verification?
- [ ] Refresh token rotation?
- [ ] Token reuse detection?

✅ A09: Security Logging and Monitoring Failures
- [ ] Authentication attempts logged?
- [ ] Authorization failures logged?
- [ ] Suspicious activities detected and alerted?
```

### 5.2 JWT-Specific Vulnerabilities

```
🔍 JWT Security Audit:

✅ Algorithm Confusion Attack
- [ ] Có force algorithm trong validation không?
- [ ] Có accept "none" algorithm không? (MUST NOT)

✅ Token Forgery
- [ ] Secret key management secure?
- [ ] Key rotation policy?

✅ Token Replay Attack
- [ ] Có implement jti (JWT ID) không?
- [ ] Có check token reuse không?

✅ Information Disclosure
- [ ] JWT payload có chứa sensitive info không? (password, SSN, credit card)
- [ ] Có encrypt JWT không? (JWE)

✅ Token Expiration
- [ ] Access token short-lived? (< 1 hour)
- [ ] Refresh token long-lived với rotation?
- [ ] Có handle token expiration gracefully ở client không?
```

---

## PART 6: PERFORMANCE & BEST PRACTICES

### 6.1 Performance Analysis

```
⚡ Performance Checks:

✅ Database Queries
- [ ] User lookup có được cache không?
- [ ] Refresh token queries có index không?
- [ ] N+1 query problems?

✅ Token Operations
- [ ] JWT validation có expensive operations không?
- [ ] Có re-load user từ DB mỗi request không? (anti-pattern)
- [ ] Blacklist lookup performance?

✅ Rate Limiting
- [ ] Rate limiter implementation? (Redis? Bucket4j?)
- [ ] Rate limit thresholds reasonable?
- [ ] Rate limit per user or per IP?

✅ Caching Strategy
- [ ] User roles/permissions cached?
- [ ] JWT secret cached?
- [ ] Cache invalidation strategy?
```

### 6.2 Code Quality & Best Practices

```
📝 Code Quality Checks:

✅ Architecture
- [ ] Clear separation of concerns? (Controller → Service → Repository)
- [ ] Dependency injection proper?
- [ ] Avoid circular dependencies?

✅ Error Handling
- [ ] Custom exceptions defined?
- [ ] GlobalExceptionHandler covers all cases?
- [ ] Error messages helpful for debugging?
- [ ] Error responses không leak sensitive info?

✅ Testing
- [ ] Unit tests cho AuthService, JwtTokenProvider?
- [ ] Integration tests cho auth flows?
- [ ] Security tests (penetration testing)?
- [ ] Test coverage percentage?

✅ Documentation
- [ ] API documentation (Swagger/OpenAPI)?
- [ ] Code comments for complex logic?
- [ ] README with setup instructions?
- [ ] Security documentation?

✅ Logging
- [ ] Structured logging (JSON)?
- [ ] Log levels appropriate? (INFO, WARN, ERROR)
- [ ] Không log sensitive data? (passwords, tokens)
- [ ] Request tracing (MDC)?
```

---

## 📤 DELIVERABLES - Báo cáo yêu cầu

Sau khi audit, tạo báo cáo với các sections:

### 1. Executive Summary
- Tổng quan hệ thống Auth/JWT
- Highlights (tốt và xấu)
- Priority issues

### 2. Authentication Flow Diagram
- Mermaid sequence diagrams cho:
  - Standard login flow
  - MFA flow
  - Firebase login flow
  - Refresh token flow
  - Logout flow

### 3. Authorization Matrix
- Table mapping roles → endpoints → permissions

### 4. JWT Token Analysis
- Current JWT structure (header + payload sample)
- Token lifecycle diagram
- Security assessment

### 5. Payload Optimization Report
- Current payload structures
- Identified duplications
- Consolidation recommendations
- Before/After comparison

### 6. Security Findings
- Vulnerability list (severity: Critical/High/Medium/Low)
- Exploitation scenarios
- Remediation recommendations

### 7. Performance Recommendations
- Bottlenecks identified
- Optimization suggestions
- Estimated impact

### 8. Action Items
- Prioritized list of improvements
- Effort estimation (S/M/L)
- Implementation roadmap

---

## 🎯 Success Criteria

Audit được coi là hoàn thành khi:

✅ Tất cả files liên quan đã được review
✅ Luồng Auth/JWT được document đầy đủ với diagrams
✅ Security vulnerabilities được identify và rate theo severity
✅ Payload optimization recommendations được provide với code examples
✅ Performance bottlenecks được identify với metrics
✅ Actionable items được prioritize với effort estimation
✅ Final report được approve bởi tech lead/architect

---

## 🚀 Cách Sử Dụng Prompt Này

```bash
# Step 1: Clone hoặc mở project
cd swp391-su26-ai-audit-project-swp391_se20a11_group-05

# Step 2: Paste prompt này vào AI assistant (Claude/GPT-4/Gemini)

# Step 3: AI sẽ thực hiện audit theo từng PART

# Step 4: Review findings và tạo action items

# Step 5: Implement improvements theo priority
```

---

## 📚 Reference Materials

- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Spring Security Reference](https://docs.spring.io/spring-security/reference/)
- [NIST Password Guidelines](https://pages.nist.gov/800-63-3/)

---

**Version:** 1.0.0  
**Last Updated:** 2026-06-04  
**Author:** Phạm Bá Trí  
**Review Required:** Tech Lead Approval
