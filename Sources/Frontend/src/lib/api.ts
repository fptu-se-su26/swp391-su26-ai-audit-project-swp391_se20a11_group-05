/**
 * API Client — Kết nối Frontend ↔ Backend Spring Boot (Port 8081)
 *
 * Cơ chế hoạt động:
 *  - DEV:  Vite proxy chuyển /api/* → http://localhost:8081 (không bị CORS)
 *  - PROD: Đặt biến môi trường VITE_API_BASE=https://api.yourdomain.com
 *
 * Tính năng:
 *  - Auto-attach JWT Bearer token từ localStorage
 *  - Xử lý lỗi tập trung (ApiError)
 *  - Type-safe: Interface TypeScript đồng bộ 100% với Java DTOs
 *
 * Controllers đồng bộ:
 *  - AuthController    → /api/auth/*
 *  - FeedbackController → /api/feedbacks/*
 *  - CategoryController → /api/categories/*
 *  - RagController     → /api/rag/*
 *  - AiController      → /api/ai/*
 */

// ─── Base URL ────────────────────────────────────────────────
// Dev: để trống → Vite proxy tự forward /api/* sang Backend port 8081
// Prod: set env VITE_API_BASE=https://your-backend-domain.com
const API_BASE: string =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE) || "";

// ─── JWT Token Management ─────────────────────────────────────
const TOKEN_KEY = "dn_jwt_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  if (typeof window !== "undefined") localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken() {
  if (typeof window !== "undefined") localStorage.removeItem(TOKEN_KEY);
}

// ─── Generic Fetch Wrapper ────────────────────────────────────

interface ApiOptions extends RequestInit {
  /** Bỏ qua việc gắn Authorization header (dùng cho login/register) */
  skipAuth?: boolean;
}

/** Lỗi trả về từ Backend khi status != 2xx */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function apiFetch<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { skipAuth, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers as Record<string, string>),
  };

  // Gắn JWT token tự động nếu có
  if (!skipAuth) {
    const token = getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  const contentType = response.headers.get("content-type");
  const isJson = contentType?.includes("application/json");

  if (!response.ok) {
    const errorData = isJson ? await response.json().catch(() => null) : null;
    throw new ApiError(
      response.status,
      errorData?.message || `Lỗi ${response.status}: ${response.statusText}`,
      errorData,
    );
  }

  if (response.status === 204) return undefined as T; // No Content

  if (isJson) return response.json() as Promise<T>;
  return response.text() as unknown as T;
}

// ═══════════════════════════════════════════════════════════════
// TYPE DEFINITIONS — Đồng bộ với Java DTOs/Entities/Enums
// ═══════════════════════════════════════════════════════════════

// ─── Wrapper chung của Backend ApiResponse<T> ─────────────────
/**
 * Backend trả về cấu trúc: { success, message, data }
 * Sử dụng cho AuthController (login, register, mfa, firebase)
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// ─── Auth Types ───────────────────────────────────────────────

/**
 * Đồng bộ với: TokenResponse.java
 * Fields: token, tokenType ("Bearer"), username, role
 */
export interface TokenResponse {
  token: string;
  tokenType: string; // luôn = "Bearer"
  username: string;
  role: BackendRole;
}

/**
 * Phản hồi khi user cần MFA (isHighRiskRole = true)
 * Backend trả: { username, mfaRequired: true, mfaSetupRequired: boolean }
 */
export interface MfaRequiredResponse {
  username: string;
  mfaRequired: true;
  mfaSetupRequired: boolean;
}

/**
 * Đồng bộ với: Role.java enum
 * CITIZEN | WARD_STAFF | POLICE | SUPER_ADMIN
 */
export type BackendRole = "CITIZEN" | "WARD_STAFF" | "POLICE" | "SUPER_ADMIN";

// ─── Feedback Types ───────────────────────────────────────────

/**
 * Đồng bộ với: FeedbackStatus.java enum
 */
export type FeedbackStatus =
  | "PENDING"       // Mới gửi, chờ phân loại
  | "ASSIGNED"      // Đã phân công về Phường/Công an
  | "IN_PROGRESS"   // Cán bộ đang xử lý
  | "WAITING_INFO"  // Cần người dân bổ sung thông tin
  | "RESOLVED"      // Đã xử lý xong
  | "REJECTED";     // Từ chối xử lý

/**
 * Đồng bộ với: FeedbackResponse.java
 */
export interface FeedbackResponse {
  id: number;
  trackingCode: string;
  title: string;
  description: string;
  latitude: number | null;
  longitude: number | null;
  addressDetails: string | null;
  status: FeedbackStatus;
  categoryName: string | null;
  citizenName: string | null;
  assigneeName: string | null;
  createdAt: string; // ISO 8601 (LocalDateTime serialized)
  updatedAt: string;
}

/**
 * Đồng bộ với: FeedbackRequest.java
 */
export interface FeedbackRequest {
  title: string;
  description: string;
  latitude?: number;
  longitude?: number;
  addressDetails?: string;
  categoryId?: number;
  citizenId: number; // Tạm thời, sau thay bằng userId từ JWT
}

// ─── Category Types ───────────────────────────────────────────

/**
 * Đồng bộ với: CategoryDTO.java
 */
export interface CategoryResponse {
  id: number;
  name: string;
  description: string;
}

// ─── RAG / Chatbot Types ──────────────────────────────────────

/**
 * Đồng bộ với: Citation.java (model)
 */
export interface Citation {
  source: string;
  content: string;
}

/**
 * Đồng bộ với: RetrievalMeta.java (model)
 */
export interface RetrievalMeta {
  totalChunksRetrieved: number;
  afterFusion: number;
  afterGrading: number;
  latencyMs: number;
  provider: string;
  useHyDE: boolean;
  useMultiQuery: boolean;
}

/**
 * Đồng bộ với: RagResponse.java (record)
 * POST /api/rag/query → trả về đây
 */
export interface RagResponse {
  answer: string;
  citations: Citation[];
  meta: RetrievalMeta;
}

/**
 * Đồng bộ với: RetrievalOptions.java (record)
 */
export interface RetrievalOptions {
  docType: string;
  language: string;
  topK?: number;
  allowedPermissions?: string[];
  useHyDE?: boolean;
  useMultiQuery?: boolean;
}

/**
 * Đồng bộ với: RagRequest.java (record)
 * POST /api/rag/query body
 */
export interface RagQueryRequest {
  question: string;
  options: RetrievalOptions;
}

/**
 * Đồng bộ với: ChatbotService.ask() → Map<String, Object>
 * GET /api/rag/chatbot → trả về đây
 */
export interface ChatbotResponse {
  answer: string;
  citations: Citation[];
  latencyMs: number;
  provider: string;
  userId: number;
  chatId: string;
}

// ═══════════════════════════════════════════════════════════════
// API METHODS — Mapping 1-1 với Backend Controllers
// ═══════════════════════════════════════════════════════════════

// ─── AUTH API (/api/auth) ─────────────────────────────────────
// Đồng bộ với: AuthController.java

export const authApi = {
  /**
   * POST /api/auth/login
   * Body: { username, password }
   * Response: ApiResponse<TokenResponse | MfaRequiredResponse>
   */
  login: (username: string, password: string) =>
    apiFetch<ApiResponse<TokenResponse | MfaRequiredResponse>>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
      skipAuth: true,
    }),

  /**
   * POST /api/auth/register
   * Body: { username, password, fullName, phoneNumber, email, role: BackendRole }
   */
  register: (data: {
    username: string;
    password: string;
    fullName: string;
    phoneNumber?: string;
    email: string;
    role: BackendRole;
  }) =>
    apiFetch<ApiResponse<unknown>>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
      skipAuth: true,
    }),

  /**
   * POST /api/auth/mfa/setup
   * Body: { username, password }
   * Response: ApiResponse<string> — URI để render QR Code cho Google Authenticator
   */
  mfaSetup: (username: string, password: string) =>
    apiFetch<ApiResponse<string>>("/api/auth/mfa/setup", {
      method: "POST",
      body: JSON.stringify({ username, password }),
      skipAuth: true,
    }),

  /**
   * POST /api/auth/mfa/verify
   * Body: { username, password, mfaCode }
   * Response: ApiResponse<TokenResponse>
   */
  mfaVerify: (username: string, password: string, mfaCode: string) =>
    apiFetch<ApiResponse<TokenResponse>>("/api/auth/mfa/verify", {
      method: "POST",
      body: JSON.stringify({ username, password, mfaCode }),
      skipAuth: true,
    }),

  /**
   * POST /api/auth/firebase-login
   * Body: { firebaseToken }
   * Response: ApiResponse<TokenResponse>
   */
  firebaseLogin: (firebaseToken: string) =>
    apiFetch<ApiResponse<TokenResponse>>("/api/auth/firebase-login", {
      method: "POST",
      body: JSON.stringify({ firebaseToken }),
      skipAuth: true,
    }),
};

// ─── FEEDBACK API (/api/feedbacks) ───────────────────────────
// Đồng bộ với: FeedbackController.java

export const feedbackApi = {
  /** GET /api/feedbacks → FeedbackResponse[] */
  getAll: () => apiFetch<FeedbackResponse[]>("/api/feedbacks"),

  /** GET /api/feedbacks/{id} → FeedbackResponse */
  getById: (id: string | number) => apiFetch<FeedbackResponse>(`/api/feedbacks/${id}`),

  /** POST /api/feedbacks → FeedbackResponse (có trackingCode tự sinh) */
  create: (data: FeedbackRequest) =>
    apiFetch<FeedbackResponse>("/api/feedbacks", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ─── CATEGORY API (/api/categories) ──────────────────────────
// Đồng bộ với: CategoryController.java

export const categoryApi = {
  /** GET /api/categories → CategoryResponse[] */
  getAll: () => apiFetch<CategoryResponse[]>("/api/categories"),

  /** POST /api/categories → CategoryResponse */
  create: (name: string, description?: string) =>
    apiFetch<CategoryResponse>("/api/categories", {
      method: "POST",
      body: JSON.stringify({ name, description }),
    }),
};

// ─── RAG API (/api/rag) ───────────────────────────────────────
// Đồng bộ với: RagController.java

export const ragApi = {
  /**
   * POST /api/rag/query
   * Pipeline 8 bước: QueryTransform → HybridSearch → RRF → SelfRAG → LLM → Citation
   */
  query: (question: string, options?: Partial<RetrievalOptions>) =>
    apiFetch<RagResponse>("/api/rag/query", {
      method: "POST",
      body: JSON.stringify({
        question,
        options: {
          docType: "danang-policy",
          language: "vi",
          topK: 10,
          allowedPermissions: ["PUBLIC"],
          useHyDE: false,
          useMultiQuery: false,
          ...options,
        },
      } satisfies RagQueryRequest),
    }),

  /** GET /api/rag/query-simple?q=...&docType=danang-policy&lang=vi */
  querySimple: (q: string, docType = "danang-policy", lang = "vi") =>
    apiFetch<RagResponse>(
      `/api/rag/query-simple?q=${encodeURIComponent(q)}&docType=${encodeURIComponent(docType)}&lang=${encodeURIComponent(lang)}`,
    ),

  /** GET /api/rag/stats → { totalChunks, byDocType, status } */
  stats: () => apiFetch<Record<string, unknown>>("/api/rag/stats"),

  /**
   * GET /api/rag/chatbot?q=...&userId=1
   * Hỏi chatbot Đà Nẵng. Kết quả được lưu vào ChatHistory.
   */
  chatbot: (question: string, userId: number = 1) =>
    apiFetch<ChatbotResponse>(
      `/api/rag/chatbot?q=${encodeURIComponent(question)}&userId=${userId}`,
    ),

  /** GET /api/rag/chat-history?userId=1 — Lấy 20 câu gần nhất */
  chatHistory: (userId: number = 1) =>
    apiFetch<unknown[]>(`/api/rag/chat-history?userId=${userId}`),

  /** GET /api/rag/chat-stats */
  chatStats: () => apiFetch<Record<string, unknown>>("/api/rag/chat-stats"),
};

// ─── AI ORCHESTRATOR API (/api/ai) ───────────────────────────
// Đồng bộ với: AiController.java

export const aiApi = {
  /** GET /api/ai/router?message=...&userId=... */
  router: (message: string, userId: string = "User123") =>
    apiFetch<string>(
      `/api/ai/router?message=${encodeURIComponent(message)}&userId=${encodeURIComponent(userId)}`,
    ),

  /** GET /api/ai/racing?message=...&userId=... */
  racing: (message: string, userId: string = "User123") =>
    apiFetch<string>(
      `/api/ai/racing?message=${encodeURIComponent(message)}&userId=${encodeURIComponent(userId)}`,
    ),

  /** GET /api/ai/clear-session?userId=... */
  clearSession: (userId: string = "User123") =>
    apiFetch<string>(`/api/ai/clear-session?userId=${encodeURIComponent(userId)}`),
};
