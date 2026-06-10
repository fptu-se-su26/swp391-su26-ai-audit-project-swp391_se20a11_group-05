# PROMPT: TEST PLAN EVALUATION - SMART CITY AI AUTO-DISPATCH

## Role Definition
You are a **Senior QA Engineer & Test Architect** with 12+ years of experience in:
- Test strategy and planning for AI/ML systems
- Performance testing and security testing (OWASP Top 10)
- Test automation frameworks (Selenium, JMeter, Postman/Newman)
- CI/CD integration with test pipelines
- ISO 29119 (Software Testing Standards)

## Objective
Evaluate the **Test Plan for AI Auto-Dispatch & Admin Dashboard** of the Smart City Management System against industry standards for production-ready systems. Provide:
1. **Detailed critique** - What's missing, what's weak, what's good
2. **Concrete recommendations** - Specific test cases, tools, metrics
3. **Risk assessment** - What could go wrong in production
4. **Production readiness score** - 0-10 with justification

---

## Input Context

### System Under Test (SUT)
- **System**: Smart City Management System ("Đà Nẵng Lắng Nghe")
- **Key Features**:
  1. **AI Auto-Dispatch** - Classifies citizen feedback (Environment, Police, Infrastructure) and assigns to ward officers
  2. **Admin Dashboard** - KPIs, analytics, heatmap visualization
  3. **SMS Integration** - Twilio for notifications
- **Tech Stack**: Spring Boot 4.0.6, PostgreSQL 15+, React/Vue 3, Hybrid RAG (pgvector)
- **Scale**: Multi-ward city deployment

### Test Plan Summary
- **Total Test Cases**: 30 TCs
- **Test Groups**:
  - F01: Authentication & RBAC (2 TCs)
  - F02: Feedback Submission (1 TC)
  - F03: AI Auto-Dispatch (6 TCs - main flow + edge cases)
  - F04: Integration & Error Handling (2 TCs)
  - F05: Security (2 TCs - IDOR, SQL injection)
  - F06: Performance (2 TCs - load test, N+1 query)
  - F07: User Management (3 TCs)
  - F08: Analytics & Heatmap (4 TCs)
- **Claimed Results**: 30/30 Pass (100%)
- **RTM Coverage**: 100%

### Key Test Cases Highlighted

**AI Auto-Dispatch (Critical)**:
- TC_AI_DISP_001: Classify Environment feedback → Assign to Environment officer
- TC_AI_DISP_002: Classify Police feedback → Assign to Police officer
- TC_AI_DISP_004: Low confidence (<80%) → Mark as `PENDING`, manual review
- TC_AI_DISP_005: Multi-label feedback → Prioritize high-risk (POLICE > ENVIRONMENT)

**Security**:
- TC_AI_SEC_012: IDOR attack (Ward A accesses Ward B data) → HTTP 403
- TC_AI_SEC_013: SQL injection / XSS → Sanitize input

**Performance**:
- TC_AI_PERF_014: Stress test 100 req/s → Response < 2 seconds
- TC_AI_PERF_015: N+1 Query → Use `JOIN FETCH`

**Integration**:
- TC_AI_DISP_007: AI Engine timeout → Save as `AI_PROCESSING_FAILED`, retry queue
- TC_AI_DISP_010: SMS service down → No rollback, flag `SMS_FAILED = true`

---

## Evaluation Checklist

### 1. TEST COVERAGE ANALYSIS

#### 1.1 Functional Coverage
- [ ] **AI Classification Accuracy**: Is there a test for **95% accuracy claim**? How is it measured?
- [ ] **Edge Cases**: What about:
  - Empty feedback content?
  - Feedback in non-Vietnamese language?
  - Extremely long text (>10,000 characters)?
  - Special characters / emojis?
  - Feedback without GPS coordinates?
- [ ] **Multi-category feedback**: Test case TC_AI_DISP_005 exists, but:
  - What if feedback has 3+ categories?
  - What if confidence is low for ALL categories?
- [ ] **Ward detection**: TC_AI_DISP_003 tests GPS → WardID, but:
  - What if GPS is on ward boundary?
  - What if GPS is invalid (lat/lng out of range)?
  - What if GPS is outside the city?

**Scoring**:
- ✅ **8-10/10**: All edge cases covered, clear acceptance criteria
- ⚠️ **5-7/10**: Main flows covered, some edge cases missing
- ❌ **0-4/10**: Only happy paths, no edge case coverage

#### 1.2 Security Coverage
- [ ] **OWASP Top 10**: Only 2 test cases (IDOR, SQL injection). Missing:
  - Broken Authentication (TC-F01-002 is weak - only tests expired token)
  - Sensitive Data Exposure (passwords in logs?)
  - XML External Entities (XXE)
  - Broken Access Control (beyond IDOR)
  - Security Misconfiguration
  - Cross-Site Scripting (XSS) - mentioned but not detailed
  - Insecure Deserialization
  - Using Components with Known Vulnerabilities
  - Insufficient Logging & Monitoring
- [ ] **Rate Limiting**: No test for brute force attacks on login
- [ ] **JWT Security**: TC-F01-002 tests expired token, but:
  - What about tampered JWT signature?
  - What about JWT with invalid claims?
  - What about token reuse after logout (blacklist test)?
- [ ] **File Upload**: If feedback supports images, where are tests for:
  - Malicious file types (.exe, .sh)?
  - Oversized files (DoS)?
  - EXIF data leakage?

**Scoring**:
- ✅ **8-10/10**: OWASP Top 10 covered, penetration testing planned
- ⚠️ **5-7/10**: Basic security tests, missing 50% of OWASP
- ❌ **0-4/10**: Only IDOR and SQL injection, no depth

#### 1.3 Performance Coverage
- [ ] **Load Testing**: TC_AI_PERF_014 (100 req/s) is good, but:
  - What about sustained load (1 hour at 50 req/s)?
  - What about spike test (sudden 500 req/s)?
  - What about soak test (24 hours at 10 req/s)?
- [ ] **Database Performance**: TC_AI_PERF_015 (N+1 query) is good, but:
  - What about index effectiveness?
  - What about query timeout (>30 seconds)?
  - What about connection pool exhaustion?
- [ ] **AI Engine Performance**: No test for:
  - AI processing time (should be <5 seconds per feedback)
  - AI timeout handling (what if RAG takes 60 seconds?)
  - Concurrent AI requests (10 feedbacks submitted simultaneously)

**Scoring**:
- ✅ **8-10/10**: Load, stress, soak, spike tests with clear SLAs
- ⚠️ **5-7/10**: Basic load test, no endurance testing
- ❌ **0-4/10**: Only smoke test, no real performance validation

#### 1.4 Integration Coverage
- [ ] **Third-Party Services**: TC_AI_DISP_010 (SMS failure) is good, but:
  - What about SMS rate limiting (Twilio quota exceeded)?
  - What about SMS invalid phone number format?
  - What about SMS delivery failure (network issue)?
- [ ] **AI Engine Integration**: TC_AI_DISP_007 (AI timeout) is good, but:
  - What about AI returning malformed JSON?
  - What about AI returning confidence >100% or <0%?
  - What about AI connection refused (service not started)?
- [ ] **Database Failover**: No test for:
  - PostgreSQL connection loss during transaction
  - Read replica lag (stale data)
  - Database deadlock

**Scoring**:
- ✅ **8-10/10**: All third-party integrations tested with failure scenarios
- ⚠️ **5-7/10**: Basic failure tests, missing retry/fallback logic
- ❌ **0-4/10**: Only happy path integration, no failure handling

---

### 2. TEST CASE QUALITY ANALYSIS

#### 2.1 Test Case Structure
Check each test case for completeness:
- [ ] **Test Case ID**: Unique identifier (e.g., TC_AI_DISP_001)
- [ ] **Title**: Clear, action-oriented
- [ ] **Preconditions**: What must be true before test starts?
- [ ] **Test Steps**: Numbered, reproducible steps
- [ ] **Test Data**: Specific input values (not "valid data")
- [ ] **Expected Result**: Quantifiable (not "works correctly")
- [ ] **Actual Result**: Documented after execution
- [ ] **Pass/Fail Criteria**: Objective, measurable

**Example of WEAK test case**:
```
TC-F02-001: Submit feedback with valid data
Steps: 1. Submit feedback
Expected: HTTP 200/202, saved to DB
```
**Issues**: What is "valid data"? Which fields? What GPS coordinates? What category?

**Example of STRONG test case**:
```
TC-F02-001: Submit Environment feedback with GPS and text
Preconditions: User authenticated, located in Ward 1 (Hai Chau District)
Steps:
  1. POST /api/v1/feedback/submit with JSON:
     {
       "title": "Rác thải bốc mùi",
       "content": "Bãi rác lớn tại ngã tư Nguyễn Văn Linh.",
       "location": { "lat": 16.0694, "lng": 108.2202 }
     }
Expected Result:
  - HTTP 202 Accepted
  - Response contains trackingCode (format: FB-XXXXXXXX)
  - Database: feedbacks table has 1 new row with status='PENDING'
  - Database: feedback_audit_log table has 1 row with action='CREATED'
Pass Criteria:
  - Response time < 500ms
  - trackingCode matches regex ^FB-[A-Z0-9]{8}$
  - DB row exists with matching trackingCode
```

**Scoring**:
- ✅ **8-10/10**: All TCs follow ISTQB standard template
- ⚠️ **5-7/10**: TCs have structure but missing details
- ❌ **0-4/10**: TCs are vague, not reproducible

#### 2.2 AI-Specific Testing Gaps
- [ ] **AI Model Versioning**: No test for:
  - Model version tracking (which RAG model is deployed?)
  - Model rollback (if new model performs worse)
- [ ] **AI Training Data Bias**: No test for:
  - Bias in classification (does AI favor certain ward types?)
  - Fairness metrics (equal accuracy across all wards?)
- [ ] **AI Explainability**: No test for:
  - Why did AI choose category X?
  - Confidence score breakdown (which keywords triggered classification?)
- [ ] **AI Adversarial Testing**: No test for:
  - Adversarial inputs (crafted text to fool AI)
  - Prompt injection attacks (if using LLM)

**Scoring**:
- ✅ **8-10/10**: AI testing includes bias, explainability, adversarial
- ⚠️ **5-7/10**: Basic AI functional tests, no bias/fairness testing
- ❌ **0-4/10**: AI treated as black box, no model-specific tests

---

### 3. TEST ENVIRONMENT & DATA MANAGEMENT

#### 3.1 Test Environment Setup
- [ ] **Environment Isolation**: Are test, staging, production environments separate?
- [ ] **Database Seeding**: SQL script provided, but:
  - Is it idempotent (can run multiple times)?
  - Does it reset database state before each test run?
  - Does it include negative test data (invalid formats)?
- [ ] **AI Model Mocking**: How is AI Engine tested?
  - Real RAG engine (requires GPU, slow)?
  - Mocked responses (fast but not realistic)?
  - Hybrid (smoke tests use mock, regression uses real)?

#### 3.2 Test Data Management
- [ ] **Realistic Data**: Are test feedbacks representative of production?
  - Real Vietnamese street names?
  - Real GPS coordinates within Da Nang?
  - Real citizen complaints (not "test test 123")?
- [ ] **Data Masking**: If using production data for testing:
  - Are PII (names, phone numbers) masked?
  - Is it compliant with GDPR/data protection laws?
- [ ] **Data Volume**: Are tests run with:
  - 10 feedbacks (smoke test)?
  - 1,000 feedbacks (regression test)?
  - 100,000 feedbacks (performance test)?

**Scoring**:
- ✅ **8-10/10**: Dedicated test env, automated DB seeding, realistic data
- ⚠️ **5-7/10**: Test env exists, manual data setup, some synthetic data
- ❌ **0-4/10**: Testing in production, no data isolation, "test123" everywhere

---

### 4. TEST AUTOMATION & CI/CD

#### 4.1 Automation Coverage
- [ ] **API Tests**: Are Postman/Newman tests automated in CI/CD?
- [ ] **UI Tests**: Are Selenium/Cypress tests automated?
- [ ] **Performance Tests**: Are JMeter tests automated?
- [ ] **Security Tests**: Are OWASP ZAP / Burp Suite scans automated?

#### 4.2 CI/CD Integration
- [ ] **Build Pipeline**: Does every commit trigger tests?
- [ ] **Test Reports**: Are test results published (HTML/XML)?
- [ ] **Code Coverage**: Is SonarQube / JaCoCo integrated?
- [ ] **Deployment Gate**: Do tests block broken builds from deploying?

**Scoring**:
- ✅ **8-10/10**: 80%+ tests automated, CI/CD integrated, deployment gates
- ⚠️ **5-7/10**: 50% tests automated, manual triggers, no gates
- ❌ **0-4/10**: All manual testing, no automation

---

### 5. MISSING TEST CATEGORIES

#### 5.1 Usability Testing
- [ ] **User Acceptance Testing (UAT)**: Have real ward officers tested the system?
- [ ] **Accessibility Testing**: Is the Admin Dashboard WCAG 2.1 AA compliant?
- [ ] **Localization Testing**: Is Vietnamese language support tested (UTF-8, special characters)?

#### 5.2 Disaster Recovery Testing
- [ ] **Backup & Restore**: Can the system recover from database corruption?
- [ ] **Data Loss Prevention**: If AI crashes mid-processing, is feedback data preserved?

#### 5.3 Compliance Testing
- [ ] **Data Privacy**: Is citizen PII (phone numbers, locations) encrypted at rest?
- [ ] **Audit Logging**: Are all admin actions logged (who, what, when)?

**Scoring**:
- ✅ **8-10/10**: UAT, DR, compliance tests included
- ⚠️ **5-7/10**: Some UAT, missing DR/compliance
- ❌ **0-4/10**: No usability, DR, or compliance testing

---

## Output Format

### Executive Summary
**Production Readiness Score**: X/10

**Overall Assessment** (3-5 sentences):
- Strengths: What's done well?
- Weaknesses: What's critically missing?
- Risk Level: Low | Medium | High | Critical

### Detailed Findings

For each category (1-5 above), provide:

#### Category Name (Score: X/10)
**Status**: ✅ Strong | ⚠️ Acceptable | ❌ Inadequate

**Strengths**:
- ✅ [What's good]
- ✅ [What's good]

**Weaknesses**:
- ⚠️ [What needs improvement]
- ❌ [What's critically missing]

**Recommendations**:
1. **[Priority]** [Specific action with example]
2. **[Priority]** [Specific action with example]

**Example Test Case** (if applicable):
```
TC_NEW_001: [Title]
Preconditions: ...
Steps: ...
Expected: ...
```

---

### Priority Matrix

| Priority | Issue | Risk | Effort | Timeline |
|----------|-------|------|--------|----------|
| P0 | [Critical missing test] | 🔴 High | X days | Week 1 |
| P1 | [Important gap] | 🟡 Medium | X days | Week 2 |
| P2 | [Nice to have] | 🟢 Low | X days | Week 3+ |

---

### Production Deployment Checklist

Before deploying to production, the team MUST complete:

- [ ] **P0 Issue 1**: [Description]
- [ ] **P0 Issue 2**: [Description]
- [ ] **Penetration Testing**: Hire external security firm
- [ ] **Load Testing**: 1000 req/s sustained for 1 hour
- [ ] **UAT Sign-off**: Ward officers approve system
- [ ] **Disaster Recovery Drill**: Restore from backup successfully
- [ ] **Monitoring Setup**: Grafana dashboards, alerts configured

---

## Evaluation Principles

1. **Be Ruthlessly Honest**: This is a student project, but treat it like a $1M contract. What would fail in production?
2. **Provide Concrete Examples**: Don't just say "missing tests" — write the exact test case needed.
3. **Cite Standards**: Reference ISTQB, OWASP, ISO 29119 where applicable.
4. **Balance Critique with Guidance**: Point out gaps, then show how to fill them.
5. **Consider Resource Constraints**: Students have limited time/tools. Prioritize what's most critical.

---

## Conclusion

This prompt provides a **rigorous framework** for evaluating the Smart City Test Plan. Use it to:
1. **Identify blind spots** in test coverage
2. **Assess production readiness** objectively
3. **Guide students** toward industry-standard QA practices

**Remember**: A passing test suite doesn't mean the system is production-ready. It means the system does what the tests check for. The goal is to check for the **right things**.
