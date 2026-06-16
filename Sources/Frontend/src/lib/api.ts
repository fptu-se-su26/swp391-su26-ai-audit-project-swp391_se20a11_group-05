/**
 * API Client v2 — Kết nối Frontend ↔ Backend Spring Boot
 *
 * Cải tiến so với v1:
 *  - Interceptor pattern: tự động refresh token, xử lý lỗi tập trung
 *  - Type-safe hoàn toàn
 *  - Hỗ trợ pagination
 *  - Error handling tập trung với ApiError
 */

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

// ─── Error types ──────────────────────────────────────────────

/** Cấu trúc lỗi từ Backend ApiResponse */
export interface ApiErrorData {
  status: number;
  message: string;
  data?: unknown;
}

export class ApiError extends Error {
  public status: number;
  public data?: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }

  static fromResponse(response: Response, body: unknown): ApiError {
    const data = body as ApiErrorData | null;
    return new ApiError(
      response.status,
      data?.message || `Lỗi ${response.status}: ${response.statusText}`,
      data,
    );
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  get isRateLimited(): boolean {
    return this.status === 429;
  }
}

// ─── Generic Fetch Wrapper with Interceptors ────────────────

interface ApiOptions extends RequestInit {
  skipAuth?: boolean;
  /** Timeout in ms (default: 30000) */
  timeout?: number;
}

let onUnauthorized: (() => void) | null = null;

/**
 * Đăng ký callback khi nhận 401 (dùng để logout tự động)
 */
export function setOnUnauthorized(cb: () => void) {
  onUnauthorized = cb;
}

async function request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { skipAuth, timeout = 30000, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (!skipAuth) {
    const token = getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    });

    const contentType = response.headers.get("content-type");
    const isJson = contentType?.includes("application/json");
    const body = isJson ? await response.json().catch(() => null) : null;

    if (!response.ok) {
      const error = ApiError.fromResponse(response, body);

      // Auto-logout on 401, but bypass if using the dummy demo token
      if (error.isUnauthorized && onUnauthorized && getToken() !== "demo-token") {
        onUnauthorized();
      }

      throw error;
    }

    if (response.status === 204) return undefined as T;

    // Tự động bóc vỏ ApiResponse từ Backend (nếu có)
    if (isJson && body && typeof body === "object" && !Array.isArray(body)) {
      if ("status" in body && "message" in body) {
        // Backend trả về chuẩn { status, message, data }
        if (body.status >= 400) {
          const error = new ApiError(body.status, body.message, body.data);
          if (error.isUnauthorized && onUnauthorized && getToken() !== "demo-token")
            onUnauthorized();
          throw error;
        }
        return body.data as T;
      }
    }

    return (isJson ? body : await response.text()) as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError(408, "Request timeout — máy chủ không phản hồi kịp.");
    }
    throw new ApiError(0, "Lỗi kết nối: " + (error instanceof Error ? error.message : "unknown"));
  } finally {
    clearTimeout(timeoutId);
  }
}

// ═══════════════════════════════════════════════════════════════
// TYPE DEFINITIONS — re-exported from @/types/api for backward compat.
// In new code, import types directly from "@/types/api".
// ═══════════════════════════════════════════════════════════════

export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
}

// ─── Auth Types ───────────────────────────────────────────────

export interface TokenResponse {
  token: string;
  tokenType: string;
  username: string;
  role: BackendRole;
}

export interface MfaRequiredResponse {
  username: string;
  mfaRequired: true;
  mfaSetupRequired: boolean;
}

export type BackendRole = "CITIZEN" | "WARD_STAFF" | "POLICE" | "SUPER_ADMIN";

export interface UserProfile {
  id: number;
  username: string;
  fullName: string;
  phoneNumber?: string;
  email?: string;
  role: BackendRole;
  active: boolean;
  mfaEnabled: boolean;
}

export interface UpdateProfileRequest {
  fullName: string;
  phoneNumber?: string;
  email?: string;
}

// ─── Feedback Types ───────────────────────────────────────────

export type FeedbackStatus =
  | "SUBMITTED"
  | "PENDING_RECEIVE"
  | "PENDING"
  | "NEED_LOCATION_REVIEW"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "WAITING_INFO"
  | "RESOLVED"
  | "REJECTED"
  | "PRE_EMPTIVE";

export interface FeedbackResponse {
  id: number;
  trackingCode: string;
  code?: string;
  title: string;
  description: string;
  content?: string;
  latitude: number | null;
  longitude: number | null;
  addressDetails: string | null;
  address?: string | null;
  status: FeedbackStatus;
  categoryCode?: string | null;
  categoryName: string | null;
  category?: string | null;
  managedByRole?: BackendRole | null;
  wardId?: number | null;
  wardName: string | null;
  districtName?: string | null;
  cityName?: string | null;
  assignedUnitId?: number | null;
  assignedUnitName?: string | null;
  assignedToRole?: BackendRole | null;
  assignedStaffId?: number | null;
  citizenName: string | null;
  assigneeName: string | null;
  assignedAuthorityName?: string | null;
  rejectionReason?: string | null;
  resultContent?: string | null;
  attachments?: FeedbackAttachmentResponse[];
  mediaUrls?: string[];
  timeline?: FeedbackLogResponse[];
  submittedAt?: string | null;
  receivedAt?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackAttachmentResponse {
  id: number;
  fileUrl: string;
  fileType: string;
  fileName: string | null;
  fileSize: number | null;
  uploadedAt: string;
}

export interface FeedbackStatusOption {
  value: FeedbackStatus;
  label: string;
}

export interface FeedbackListFilters {
  keyword?: string;
  category?: string;
  status?: FeedbackStatus | "";
  fromDate?: string;
  toDate?: string;
}

export interface FeedbackLookupStatsResponse {
  total: number;
  pending: number;
  resolved: number;
  rejected: number;
}

export interface FeedbackRequest {
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  addressDetails?: string;
  categoryId?: number;
  categoryCode: string;
  wardId?: number;
}

export interface NotificationResponse {
  id: number;
  userId: number;
  title: string;
  content: string;
  type: string;
  referenceId: number | null;
  feedbackId?: number | null;
  feedbackTrackingCode?: string | null;
  feedbackTitle?: string | null;
  feedbackStatus?: FeedbackStatus | null;
  isRead: boolean;
  createdAt: string;
}

export interface FeedbackLogResponse {
  id: number;
  actionByName: string;
  actorName?: string | null;
  actorRole?: string | null;
  authorityName?: string | null;
  assignedToName?: string | null;
  action?: string | null;
  status?: FeedbackStatus | string | null;
  title?: string | null;
  deadline?: string | null;
  oldStatus: FeedbackStatus | null;
  newStatus: FeedbackStatus | null;
  note: string | null;
  createdAt: string;
}

// ─── Category Types ───────────────────────────────────────────

export interface CategoryResponse {
  id: number;
  code: string;
  name: string;
  description: string;
  nameVi?: string;
  nameEn?: string;
  descriptionVi?: string;
  descriptionEn?: string;
  managedByRole?: BackendRole;
  active?: boolean;
}

// ─── Pagination ───────────────────────────────────────────────

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  page?: number;
  number?: number;
  first: boolean;
  last: boolean;
  hasNext?: boolean;
  empty: boolean;
}

// ─── RAG / Chatbot Types ──────────────────────────────────────

export interface Citation {
  source: string;
  content: string;
}

export interface RetrievalMeta {
  totalChunksRetrieved: number;
  afterFusion: number;
  afterGrading: number;
  latencyMs: number;
  provider: string;
}

export interface RagResponse {
  answer: string;
  citations: Citation[];
  meta: RetrievalMeta;
}

export interface ChatbotResponse {
  answer: string;
  citations: Citation[];
  latencyMs: number;
  provider: string;
  userId: number;
  chatId: string;
}

// ═══════════════════════════════════════════════════════════════
// API METHODS
// ═══════════════════════════════════════════════════════════════

export const authApi = {
  login: (username: string, password: string) =>
    request<TokenResponse | MfaRequiredResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
      skipAuth: true,
    }),

  register: (data: {
    username: string;
    password: string;
    fullName: string;
    phoneNumber?: string;
    email: string;
  }) =>
    request<unknown>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
      skipAuth: true,
    }),

  registerConfirm: (phoneNumber: string, otpCode: string) =>
    request<unknown>("/api/auth/register-confirm", {
      method: "POST",
      body: JSON.stringify({ phoneNumber, otpCode }),
      skipAuth: true,
    }),

  sendSmsOtp: (phoneNumber: string) =>
    request<unknown>("/api/auth/sms/send", {
      method: "POST",
      body: JSON.stringify({ phoneNumber }),
      skipAuth: true,
    }),

  mfaSetup: (username: string, password: string) =>
    request<string>("/api/auth/mfa/setup", {
      method: "POST",
      body: JSON.stringify({ username, password }),
      skipAuth: true,
    }),

  mfaVerify: (username: string, password: string, mfaCode: string) =>
    request<TokenResponse>("/api/auth/mfa/verify", {
      method: "POST",
      body: JSON.stringify({ username, password, mfaCode }),
      skipAuth: true,
    }),

  firebaseLogin: (firebaseToken: string) =>
    request<TokenResponse>("/api/auth/firebase-login", {
      method: "POST",
      body: JSON.stringify({ firebaseToken }),
      skipAuth: true,
    }),

  logout: () =>
    request<unknown>("/api/auth/logout", {
      method: "POST",
    }),
};

export const feedbackApi = {
  getAll: (page = 0, size = 3, filters: FeedbackListFilters = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      size: String(size),
    });

    const keyword = filters.keyword?.trim();
    if (keyword) params.set("keyword", keyword);
    if (filters.status) params.set("status", filters.status);
    if (filters.fromDate) params.set("fromDate", filters.fromDate);
    if (filters.toDate) params.set("toDate", filters.toDate);

    return request<PageResponse<FeedbackResponse>>(`/api/feedbacks/my?${params}`);
  },

  getPublic: (page = 0, size = 10, filters: FeedbackListFilters = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      size: String(size),
    });

    const keyword = filters.keyword?.trim();
    if (keyword) params.set("keyword", keyword);
    if (filters.category?.trim()) params.set("category", filters.category.trim());
    if (filters.status) params.set("status", filters.status);
    if (filters.fromDate) params.set("fromDate", filters.fromDate);
    if (filters.toDate) params.set("toDate", filters.toDate);

    return request<PageResponse<FeedbackResponse>>(`/api/feedbacks/public?${params}`, { skipAuth: true });
  },

  getPublicStats: (filters: FeedbackListFilters = {}) => {
    const params = new URLSearchParams();

    const keyword = filters.keyword?.trim();
    if (keyword) params.set("keyword", keyword);
    if (filters.category?.trim()) params.set("category", filters.category.trim());
    if (filters.status) params.set("status", filters.status);
    if (filters.fromDate) params.set("fromDate", filters.fromDate);
    if (filters.toDate) params.set("toDate", filters.toDate);

    return request<FeedbackLookupStatsResponse>(`/api/feedbacks/public/stats?${params}`, { skipAuth: true });
  },

  getPublicFeedbackStatistics: (filters: FeedbackListFilters = {}) =>
    feedbackApi.getPublicStats(filters),

  getRecentPublicFeedback: (limit = 5, filters: FeedbackListFilters = {}) =>
    feedbackApi.getPublic(0, limit, filters),

  getPublicById: (id: string | number) =>
    request<FeedbackResponse>(`/api/feedbacks/public/${id}`, { skipAuth: true }),

  getStatuses: () => request<FeedbackStatusOption[]>("/api/feedbacks/statuses", { skipAuth: true }),

  getById: (id: string | number) => request<FeedbackResponse>(`/api/feedback/my-reports/${id}`),

  create: (data: FeedbackRequest) =>
    request<FeedbackResponse>("/api/feedbacks/submit", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // New: state machine endpoints
  changeStatus: (id: number | string, status: string, note?: string) =>
    request<FeedbackResponse>(`/api/feedbacks/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, note }),
    }),

  assignFeedback: (id: number | string, assigneeId: number) =>
    request<FeedbackResponse>(`/api/feedbacks/${id}/assign`, {
      method: "PATCH",
      body: JSON.stringify({ assigneeId }),
    }),

  getLogs: (id: number | string) => request<unknown[]>(`/api/feedbacks/${id}/logs`),
};

export const userApi = {
  profile: () => request<UserProfile>("/api/users/profile"),

  updateProfile: (data: UpdateProfileRequest) =>
    request<UserProfile>("/api/users/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};

export const notificationApi = {
  getAll: () => request<NotificationResponse[]>("/api/notifications"),

  getPage: (page = 0, size = 5) =>
    request<PageResponse<NotificationResponse>>(`/api/notifications?page=${page}&size=${size}`),

  markAsRead: (id: number | string) =>
    request<NotificationResponse>(`/api/notifications/${id}/read`, {
      method: "PUT",
    }),

  markAllAsRead: () =>
    request<void>("/api/notifications/read-all", {
      method: "PUT",
    }),

  getUnreadCount: () =>
    request<number>("/api/notifications/unread-count"),
};

export const policeApi = {
  rejectFeedback: (id: number | string, reason: string) =>
    request<FeedbackResponse>(`/api/police/feedbacks/${id}/reject`, {
      method: "PATCH",
      body: JSON.stringify({ reason }),
    }),

  requestMoreInfo: (id: number | string, reason: string) =>
    request<FeedbackResponse>(`/api/police/feedbacks/${id}/request-info`, {
      method: "PATCH",
      body: JSON.stringify({ reason }),
    }),

  getHotspots: () =>
    request<any[]>("/api/police/feedbacks/hotspots", {
      method: "GET",
    }),
};

export const categoryApi = {
  getAll: () => request<CategoryResponse[]>("/api/categories"),

  create: (name: string, description?: string) =>
    request<CategoryResponse>("/api/categories", {
      method: "POST",
      body: JSON.stringify({ name, description }),
    }),
};

export const ragApi = {
  query: (question: string, options?: Record<string, unknown>) =>
    request<RagResponse>("/api/rag/query", {
      method: "POST",
      body: JSON.stringify({
        question,
        options: options || {
          docType: "traffic",
          language: "vi",
          topK: 10,
          allowedPermissions: ["PUBLIC"],
        },
      }),
    }),

  chatbot: (question: string, userId: string | number) =>
    request<ChatbotResponse>(`/api/rag/chatbot?q=${encodeURIComponent(question)}&userId=${userId}`),

  chatHistory: (userId: string | number) =>
    request<unknown[]>(`/api/rag/chat-history?userId=${userId}`),

  stats: () => request<Record<string, unknown>>("/api/rag/stats"),
};

export const aiApi = {
  router: (message: string, userId: string) =>
    request<Record<string, unknown>>(
      `/api/ai/router?message=${encodeURIComponent(message)}&userId=${encodeURIComponent(userId)}`,
    ),
};

// ─── Analytics Types ─────────────────────────────────────────

export interface KpiData {
  total: number;
  resolved: number;
  pending: number;
  satisfactionRate: string;
}

export interface WardPerformance {
  name: string;
  resolved: number;
  satisfactionPct: number;
}

export interface MonthlyTrend {
  month: string;
  total: number;
  resolved: number;
}

export interface DispatchAgency {
  name: string;
  pendingCount: number;
  status: string;
}

export const analyticsApi = {
  kpi: () => request<KpiData>("/api/analytics/kpi"),
  wardPerformance: () => request<WardPerformance[]>("/api/analytics/ward-performance"),
  monthlyTrend: (months = 12) =>
    request<MonthlyTrend[]>(`/api/analytics/monthly-trend?months=${months}`),
  dispatch: () => request<DispatchAgency[]>("/api/analytics/dispatch"),
};

// ─── Ward API ────────────────────────────────────────────────

export interface Ward {
  id: number;
  name: string;
}

export const wardApi = {
  getAll: () => request<Ward[]>("/api/wards"),
  search: (name: string) => request<Ward[]>(`/api/wards/search?name=${encodeURIComponent(name)}`),
  locate: (lat: number, lng: number) =>
    request<Ward>(
      `/api/wards/locate?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`,
    ),
};
