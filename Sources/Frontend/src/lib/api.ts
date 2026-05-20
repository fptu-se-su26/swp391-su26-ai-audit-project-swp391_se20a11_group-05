/**
 * API Client — Kết nối Frontend với Backend Spring Boot.
 *
 * Features:
 *   - Proxy mode: trong dev, Vite proxy /api/* → Backend (cùng URL, không cần CORS)
 *   - Auto-attach JWT token từ localStorage
 *   - Type-safe request/response
 *   - Error handling thống nhất
 */

// Trong dev: dùng proxy (empty = same origin) → Vite forward /api/* tới Backend
// Trong production: set VITE_API_BASE nếu cần
const API_BASE = (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE) || "";

// ─── Token Management ────────────────────────────────────────
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

// ─── Generic Fetch Wrapper ───────────────────────────────────

interface ApiOptions extends RequestInit {
  skipAuth?: boolean;
}

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

  // Auto-attach JWT token
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

  // Handle non-JSON responses
  const contentType = response.headers.get("content-type");
  const isJson = contentType?.includes("application/json");

  if (!response.ok) {
    const errorData = isJson ? await response.json().catch(() => null) : null;
    throw new ApiError(
      response.status,
      errorData?.message || `API Error: ${response.status} ${response.statusText}`,
      errorData,
    );
  }

  if (isJson) {
    return response.json() as Promise<T>;
  }
  return response.text() as unknown as T;
}

// ─── API Response Types ──────────────────────────────────────

/** Backend chuẩn hóa response: ApiResponse<T> */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/** JWT token response từ backend */
export interface TokenResponse {
  token: string;
  username: string;
  role: string;
}

/** Feedback response từ backend */
export interface FeedbackResponse {
  id: number;
  trackingCode: string;
  title: string;
  description: string;
  latitude: number | null;
  longitude: number | null;
  addressDetails: string | null;
  status: string;
  categoryName: string | null;
  citizenName: string | null;
  assigneeName: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Feedback create request */
export interface FeedbackRequest {
  title: string;
  description: string;
  latitude?: number;
  longitude?: number;
  addressDetails?: string;
  categoryId?: number;
  citizenId: number;
}

/** RAG/Chatbot response */
export interface ChatbotResponse {
  answer: string;
  citations: Array<{ source: string; content: string }>;
  latencyMs: number;
  provider: string;
  userId: number;
  chatId: string;
}

// ─── AUTH API ────────────────────────────────────────────────

export const authApi = {
  login: (username: string, password: string) =>
    apiFetch<ApiResponse<TokenResponse | { username: string; mfaRequired: boolean; mfaSetupRequired: boolean }>>(
      "/api/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ username, password }),
        skipAuth: true,
      },
    ),

  register: (data: {
    username: string;
    password: string;
    fullName: string;
    phoneNumber: string;
    email: string;
    role: string;
  }) =>
    apiFetch<ApiResponse<unknown>>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
      skipAuth: true,
    }),

  mfaVerify: (username: string, password: string, mfaCode: string) =>
    apiFetch<ApiResponse<TokenResponse>>("/api/auth/mfa/verify", {
      method: "POST",
      body: JSON.stringify({ username, password, mfaCode }),
      skipAuth: true,
    }),

  mfaSetup: (username: string, password: string) =>
    apiFetch<ApiResponse<string>>("/api/auth/mfa/setup", {
      method: "POST",
      body: JSON.stringify({ username, password }),
      skipAuth: true,
    }),
};

// ─── FEEDBACK API ────────────────────────────────────────────

export const feedbackApi = {
  getAll: () => apiFetch<FeedbackResponse[]>("/api/feedbacks"),

  create: (data: FeedbackRequest) =>
    apiFetch<FeedbackResponse>("/api/feedbacks", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ─── CHATBOT / RAG API ───────────────────────────────────────

export const chatbotApi = {
  ask: (question: string, userId: number = 1) =>
    apiFetch<ChatbotResponse>(
      `/api/rag/chatbot?q=${encodeURIComponent(question)}&userId=${userId}`,
    ),

  getHistory: (userId: number = 1) =>
    apiFetch<unknown[]>(`/api/rag/chat-history?userId=${userId}`),

  getStats: () => apiFetch<unknown>("/api/rag/chat-stats"),
};

// ─── AI API ──────────────────────────────────────────────────

export const aiApi = {
  router: (message: string, userId: string = "User123") =>
    apiFetch<string>(
      `/api/ai/router?message=${encodeURIComponent(message)}&userId=${encodeURIComponent(userId)}`,
    ),

  racing: (message: string, userId: string = "User123") =>
    apiFetch<string>(
      `/api/ai/racing?message=${encodeURIComponent(message)}&userId=${encodeURIComponent(userId)}`,
    ),
};
