# Architure.md - Thanh Pho Lang Nghe / SmartCity

> Doc het file nay truoc khi viet code.
> File nay la "agent contract" cho repo hien tai, de agent khong tao file rac,
> khong dat sai package, khong them framework/dependency ngoai y muon.

---

## 1. Tong Quan Repo

Ten du an: The City Connection / SmartCity

Muc tieu: nen tang tiep nhan phan anh do thi, phan quyen xu ly theo vai tro
cong dan, can bo phuong, cong an va quan tri cap thanh pho. Du an co them cac
phan AI/RAG de ho tro hoi dap, phan tich, audit va dieu phoi.

Repo hien tai khong phai la template rong. Khong duoc tu y doi root package,
doi framework, hoac tao cau truc moi song song voi cau truc dang co.

Root quan trong:

```text
Sources/Backend/        Spring Boot backend
Sources/Frontend/       TanStack Start / React frontend
docs/                   Tai lieu kien truc, prompt, audit, changelog
Member/                 Tai lieu ca nhan thanh vien
Database/               Tai lieu database
supabase/               Supabase config va migrations ngoai backend
```

---

## 2. Tech Stack Thuc Te

Backend:

```text
Java 21
Spring Boot 4.0.6
Spring Security, JWT, stateless session
Spring Data JPA / Hibernate
PostgreSQL + pgvector cho local RAG qua Docker Compose
Supabase profile cho moi truong chinh
H2 cho test
Flyway migration trong Sources/Backend/src/main/resources/db/migration
Maven wrapper: Sources/Backend/mvnw.cmd
Lombok
MapStruct
WebFlux WebClient cho AI provider calls
WebSocket notification
Resilience4j
Twilio/Firebase/MFA
```

Frontend:

```text
React 19
TypeScript strict
TanStack Start + TanStack Router
TanStack Query
Vite via @lovable.dev/vite-tanstack-config
Tailwind CSS v4
Radix/shadcn-style UI components in src/components/ui
lucide-react icons
Leaflet / react-leaflet
Recharts
```

Khong duoc ghi trong prompt/rule rang du an dung MySQL, Redis, React 18,
Axios bat buoc, package `com.danang.urban`, hoac frontend co `src/main.tsx`.
Do la thong tin sai voi repo nay.

---

## 3. Backend Structure Bat Buoc

Backend root:

```text
Sources/Backend/
  pom.xml
  compose.yaml
  src/main/java/com/example/smartcity/
  src/main/resources/
  src/test/java/com/example/smartcity/
```

Java package root bat buoc:

```text
com.example.smartcity
```

Khong tao package `com.danang.urban`, `com.smartcity`, `backend`, `feature`,
hoac package ngoai `com.example.smartcity`.

Top-level backend packages:

```text
com.example.smartcity/
  SmartCityApplication.java
  config/             Cross-cutting Spring config
  security/           Spring Security, JWT, CORS, secrets, rate limit
  common/             Base classes, exceptions, response, logging, security utils
  modules/            Business modules
  ai_orchestrator/    AI provider routing, adapters, pool, guardrails
  rag/                Hybrid RAG ingestion/retrieval/generation/self-rag
```

Business modules dang co:

```text
modules/
  analytics/
  auth/
  campaign/
  chatbot/
  core/
  feedback/
  file/
  notification/
  police/
  user/
  warning/
```

Trong moi business module, uu tien dung cac folder da co:

```text
controller/
service/
repository/
dto/
entity/
mapper/
payload/       Chi dung neu module da dung pattern payload, vi du auth
job/           Scheduler/background job neu da co ly do ro
```

Vi du them logic campaign thi dat trong:

```text
Sources/Backend/src/main/java/com/example/smartcity/modules/campaign/
  controller/
  service/
  repository/
  dto/
  entity/
  mapper/
```

Khong tao `modules/campaigns`, `campaignModule`, `feature/campaign`,
`src/main/java/CampaignService.java`, hoac file Java o root package neu khong
co ly do kien truc ro rang.

---

## 4. Backend Coding Rules

Quy tac chung:

```text
- Controller chi validate input, lay Authentication khi can, delegate Service.
- Business logic nam trong Service.
- Query nam trong Repository, khong nhan JPQL/native SQL dai vao Service.
- Khong return Entity truc tiep tu endpoint moi; dung DTO/Response.
- Khong log password, JWT, OTP, API key, secret, refresh token.
- Khong hardcode credential trong application.properties/yml.
- Khong them dependency moi vao pom.xml neu chua can thiet.
- Khong doi port backend mac dinh 8081 neu task khong yeu cau.
```

Dependency injection:

```text
- Uu tien constructor injection qua Lombok @RequiredArgsConstructor.
- Khong dung @Autowired field injection cho code moi.
```

Transaction:

```text
- Read method: @Transactional(readOnly = true)
- Write method: @Transactional
- Dat transaction o Service, khong dat logic transaction trong Controller.
```

Response style:

Repo dang co 2 style response:

```text
1. Nhieu controller tra truc tiep ResponseEntity<DTO> hoac ResponseEntity<List<DTO>>
2. common.response.ApiResponse<T> hien tai co schema:
   { status: number, message: string, data: T }
```

Khi them endpoint moi:

```text
- Neu module hien tai tra DTO truc tiep, tiep tuc theo style module do.
- Neu can wrapper, dung ApiResponse hien co voi status/message/data.
- Khong tu tao schema moi { success, errorCode, ... } neu chua refactor toan cuc.
```

Base classes:

```text
common/base/BaseEntity.java
common/base/BaseRepository.java
common/base/BaseService.java
common/base/BaseServiceImpl.java
common/base/BaseGenericController.java
common/base/BaseMapper.java
```

Neu module dang extend base class thi tiep tuc dung. Neu endpoint can security
dac thu, override base endpoint nhu FeedbackController dang lam.

Roles thuc te:

```text
CITIZEN
WARD_STAFF
POLICE
SUPER_ADMIN
```

Khong tao role `COMMITTEE`, `ADMIN`, `OFFICER` cho code moi neu chua co migration
va thay doi security dong bo.

Feedback status thuc te:

```text
SUBMITTED
PENDING_RECEIVE
PENDING
NEED_LOCATION_REVIEW
IN_PROGRESS
WAITING_INFO
RESOLVED
REJECTED
```

Frontend hien co them mot vai union value de backward-compatible; backend enum
la nguon chinh khi sua logic trang thai.

Security:

```text
- SecurityConfig la noi khai bao filter chain.
- CorsConfig la noi khai bao CORS.
- JWT filter nam trong security/jwt.
- Dung @PreAuthorize khi endpoint can role constraint ro rang.
- Luon validate ownership/ward/managedByRole trong Service de tranh IDOR/BOLA.
```

---

## 5. Database Va Migration

Backend migration path:

```text
Sources/Backend/src/main/resources/db/migration/
```

Quy tac:

```text
- Khong sua migration da merge neu khong co task ro rang.
- Truoc khi tao migration moi, list folder migration de xem version hien co.
- Dung version Flyway tiep theo chua dung. Hien tai da co V1..V5, neu them moi
  thi uu tien V6__descriptive_name.sql.
- Khong tao duplicate version nhu V2/V3 moi.
- Khong dung Hibernate ddl-auto de tao schema production; ddl-auto dang validate.
- Entity va migration phai khop ten bang/cot.
```

Database local/RAG:

```text
Sources/Backend/compose.yaml chay PostgreSQL pgvector va pgAdmin.
src/test/resources/application.properties dung H2 in-memory cho test.
application.properties active profile mac dinh la supabase.
```

Khong them MySQL/Redis migration/config neu task khong yeu cau.

---

## 6. Frontend Structure Bat Buoc

Frontend root:

```text
Sources/Frontend/
  package.json
  vite.config.ts
  tsconfig.json
  src/
```

Frontend src hien tai:

```text
src/
  assets/
  components/
    ui/          Radix/shadcn-style primitives
    site/        Shared site/layout/domain components
  features/
    assistant/
    auth/
    city-admin/
    police/
    shared/
    ward/
  hooks/
  lib/
  routes/
  server/
  types/
  routeTree.gen.ts
  router.tsx
  start.ts
  server.ts
  styles.css
```

Routing:

```text
- TanStack Router file-based routes nam trong src/routes.
- Repo dang dung file route phang:
  _auth.tsx
  _auth.ward.tsx
  _auth.police.tsx
  _auth.city-admin.tsx
  my-reports.index.tsx
  my-reports.$id.tsx
  campaigns.create.tsx
  campaigns.$id.tsx
- Khong tu tao route folder nested neu pattern hien tai la file phang.
- Khong sua src/routeTree.gen.ts bang tay tru khi task yeu cau va biet ro no la generated file.
```

API client:

```text
src/lib/api.ts la API client trung tam.
No dung fetch wrapper co token, timeout, ApiError, tu boc ApiResponse {status,message,data}.
```

Khi them API frontend:

```text
- Uu tien them method vao src/lib/api.ts neu pattern lien quan dang o do.
- Neu tach file moi, chi tach khi module thuc su lon va phai import lai qua boundary ro.
- Khong dung axios cho code moi vi repo hien tai khong dung axios.
- Khong goi fetch truc tiep trong component/page neu co the dat vao lib/api.ts.
```

Types:

```text
- Type dung chung dat trong src/types hoac gan trong src/lib/api.ts neu file do da chua domain type.
- Khong dung any cho code moi. Neu gap any cu, chi sua khi dang cham vao logic do.
- Neu khong biet type, dung unknown va narrow.
```

UI:

```text
- Dung components/ui co san truoc khi tao primitive moi.
- Dung lucide-react icon khi can icon.
- Dung Tailwind utility va token/style dang co.
- Khong tao CSS global moi neu component-level Tailwind du dap ung.
- Khong tao component qua lon; tach component khi vuot qua mot workflow ro rang.
```

Vite config:

```text
@lovable.dev/vite-tanstack-config da include TanStack Start, React, Tailwind,
tsconfig paths, Cloudflare plugin, env injection, alias @.

Khong add lai cac plugin do vao vite.config.ts, vi comment trong file da canh bao
co the gay duplicate plugin va break app.
```

---

## 7. Naming Rules

Backend:

```text
Package: lower-case, theo module dang co
Entity: PascalCase, khong suffix Entity
DTO: PascalCase + Request/Response/DTO tuy pattern module
Controller: PascalCase + Controller
Service: PascalCase + Service
Repository: PascalCase + Repository
Mapper: PascalCase + Mapper
Enum values: UPPER_SNAKE_CASE
```

Frontend:

```text
Component file: PascalCase.tsx
Hook: useSomething.ts / use-something neu folder dang dung kebab, uu tien pattern hien co
Route file: theo TanStack Router pattern hien co trong src/routes
Shared utilities: camelCase functions
Type/interface: PascalCase
Constants: UPPER_SNAKE_CASE
```

Database:

```text
Table/column: snake_case
Migration: V{next}__short_descriptive_name.sql
```

---

## 8. Khong Tao File Rac

Truoc khi tao file moi, agent phai tra loi duoc:

```text
1. File nay thuoc backend, frontend, docs hay migration?
2. Module/feature hien tai da co file tuong duong chua?
3. Co the sua file hien co thay vi tao file moi khong?
4. Neu tao folder moi, folder do co nam trong cau truc repo hien tai khong?
5. File co duoc import/use boi code khac khong?
```

Khong tao cac file/folder sau neu task khong yeu cau:

```text
backend/
frontend/
src/
feature/
features/ o backend
api/ o root repo
components/ o root repo
utils/ o root repo
test-output/
tmp/
*.bak
*.old
*.copy
*_new.*
*_fixed.*
```

Khong tao file JSON payload test moi o root. Repo da co mot so payload cu; code
moi khong duoc tiep tuc pattern do. Neu can test request, dat trong docs hoac
test resource co ten ro rang va chi khi task yeu cau.

Generated/build files khong sua tay:

```text
Sources/Frontend/src/routeTree.gen.ts
Sources/Frontend/dist/
Sources/Frontend/.output/
Sources/Frontend/.vinxi/
Sources/Frontend/node_modules/
Sources/Backend/target/
```

---

## 9. Workflow Khi Agent Nhan Task

Bat buoc lam theo thu tu:

```text
1. Doc Architure.md.
2. Chay rg/rg --files de tim file lien quan.
3. Xac dinh task thuoc module nao.
4. Doc controller/service/repository/entity/dto hien co cua module do.
5. Liet ke file se sua/tao trong suy luan truoc khi edit.
6. Sua nho, dung pattern hien co.
7. Khong refactor lon ngoai pham vi task.
8. Chay test/build/lint phu hop neu kha thi.
9. Neu khong chay duoc test, noi ro ly do.
```

Thu tu implement backend feature moi:

```text
Entity/migration -> Repository -> DTO/payload -> Mapper -> Service -> Controller -> Test
```

Thu tu implement frontend feature moi:

```text
Type -> API client method -> hook/query logic -> component -> route/page -> UI polish
```

Nhung neu module hien co da co pattern khac, uu tien pattern hien co hon thu tu
chung.

---

## 10. Test Va Command

Backend:

```powershell
cd Sources/Backend
.\mvnw.cmd test
.\mvnw.cmd spring-boot:run
```

Frontend:

```powershell
cd Sources/Frontend
npm run lint
npm run build
npm run dev
```

Neu dependency chua cai:

```powershell
cd Sources/Frontend
npm install
```

Khong chay command download/install dependency neu khong can thiet cho task.

---

## 11. Environment

Backend env quan trong:

```text
JWT_SECRET
ENCRYPTION_SECRET
GROQ_API_KEYS
GEMINI_API_KEYS
ADMIN_API_TOKEN
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_STORAGE_BUCKET
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER
HTTPS_REDIRECT_ENABLED
```

Frontend env:

```text
VITE_API_BASE
```

Trong dev, Vite proxy `/api` ve backend `http://localhost:8081`.

Khong commit `.env`, `.env.local`, secret, token, key.

---

## 12. AI Audit / Docs

Du an la bai SWP391 co yeu cau audit AI. Khi task co thay doi dang ke, can cap
nhat dung tai lieu neu user yeu cau hoac workflow nhom yeu cau:

```text
docs/AI_AUDIT_LOG.md
docs/PROMPTS.md
docs/REFLECTION.md
docs/CHANGELOG.md
Member/<ten-thanh-vien>/*.md
```

Khong tao file audit moi ngoai cac file tren neu khong co yeu cau.

---

## 13. Prompt Tot Cho Agent

Prompt tot:

```text
Them API cho campaign participant.

Backend:
- Module: modules/campaign
- Endpoint: POST /api/campaigns/{id}/join
- Role: CITIZEN
- Validate: campaign status OPEN, chua tham gia, chua vuot maxParticipants
- Files du kien: CampaignParticipantRepository, CampaignService, CampaignController,
  JoinCampaignResponse

Frontend:
- Them method vao src/lib/api.ts
- Dung trong route campaigns.$id.tsx
- Khong tao route/folder moi neu khong can
```

Prompt de gay file rac:

```text
Lam chuc nang campaign day du cho toi.
```

Neu prompt mo ho, agent phai doc code truoc va chi tao file toi thieu. Neu can
quyet dinh lon ve kien truc, hoi lai truoc khi edit.

---

Cap nhat lan cuoi: 2026-06-16
