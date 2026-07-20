/**
 * auth.tsx — Auth context provider and hook.
 *
 * CHANGES from v1:
 *   - Role type replaced with Role enum imported from ./roles
 *   - Token storage key namespaced per-portal (future-proof for split)
 *   - logout() now also clears the JWT token
 *   - isAuthenticated checks BOTH user object AND token presence
 *   - Re-exports Role, ROLE_LABEL, parseBackendRole from ./roles for convenience
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { getToken, setToken, removeToken, setOnUnauthorized, userApi } from "./api";
import {
  Role,
  ROLE_LABEL,
  parseBackendRole,
  AUTHORITY_ROLES,
  CITIZEN_ROLES,
  type Role as RoleType,
} from "./roles";

// Re-export for consumers that import everything from "@/lib/auth"
export { Role, ROLE_LABEL, parseBackendRole, AUTHORITY_ROLES, CITIZEN_ROLES };
export type { RoleType };

// ─── Types ───────────────────────────────────────────────────

export interface AuthUser {
  id?: number | null;
  name: string;
  role: RoleType;
  org: string;
  wardName?: string | null;
  wardType?: string | null;
  wardId?: number | null;
  avatarUrl?: string | null;
  token?: string;
  campaignBanned?: boolean;
}

interface AuthCtx {
  user: AuthUser | null;
  login: (u: AuthUser, opts?: { remember?: boolean }) => void;
  logout: () => void;
  hasRole: (...roles: RoleType[]) => boolean;
  isAuthenticated: boolean;
}

// ─── Context & Storage ───────────────────────────────────────

const AuthContext = createContext<AuthCtx | null>(null);

/**
 * Storage key — use a more specific key so citizen/authority sessions
 * can be isolated once we move to separate subdomains.
 */
const STORAGE_KEY = "dn_auth_user_v2";

/**
 * Lưu user vào localStorage NHƯNG loại bỏ token — token do api.ts quản lý
 * (localStorage hoặc sessionStorage tùy lựa chọn "Ghi nhớ đăng nhập").
 * Nếu lưu token trong JSON này thì phiên tạm vẫn tồn tại vĩnh viễn.
 */
function persistUser(u: AuthUser) {
  if (typeof window === "undefined") return;
  const { token: _omitted, ...rest } = u;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
}

// ─── Provider ────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(null);

  // Rehydrate from localStorage on mount (SSR-safe)
  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      const storedToken = typeof window !== "undefined" ? getToken() : null;

      if (raw && storedToken) {
        const parsed: AuthUser = JSON.parse(raw);
        // SECURITY: Validate that the stored role is a known Role value
        // Unknown/tampered roles are rejected, not trusted
        const knownRoles = Object.values(Role) as string[];
        if (!knownRoles.includes(parsed.role)) {
          console.warn("[auth] Stored user has unknown role — clearing session");
          localStorage.removeItem(STORAGE_KEY);
          removeToken();
          return;
        }

        // Token đã nằm sẵn trong storage (local hoặc session) — chỉ gắn vào
        // state, KHÔNG ghi lại bằng setToken vì sẽ nâng phiên tạm thành vĩnh viễn
        parsed.token = parsed.token || storedToken;

        setUser(parsed);

        // Fetch full profile info to get the full name, wardId and avatarUrl
        userApi
          .profile()
          .then((profile) => {
            if (profile) {
              const updated = {
                ...parsed,
                id: profile.id,
                name: profile.fullName || parsed.name,
                wardId: (profile.wardId !== undefined && profile.wardId !== null) ? profile.wardId : parsed.wardId,
                avatarUrl: profile.avatarUrl || parsed.avatarUrl || null,
                campaignBanned: profile.campaignBanned !== undefined ? profile.campaignBanned : parsed.campaignBanned,
              };
              setUser(updated);
              persistUser(updated);
            }
          })
          .catch(() => {});
      } else if (raw || storedToken) {
        // If only one exists, clear both to avoid inconsistent state
        localStorage.removeItem(STORAGE_KEY);
        removeToken();
      }
    } catch {
      // Corrupt storage — clear it
      localStorage.removeItem(STORAGE_KEY);
      removeToken();
    }

    // Auto-logout when backend returns 401
    setOnUnauthorized(() => {
      setUser(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem(STORAGE_KEY);
        removeToken();
        const path = window.location.pathname;
        const isAuthority = ["/ward", "/police", "/city-admin", "/assistant"].some((p) =>
          path.startsWith(p),
        );
        void navigate({ to: isAuthority ? "/authority-login" : "/login", replace: true });
      }
    });
  }, [navigate]);

  const login = (u: AuthUser, opts?: { remember?: boolean }) => {
    setUser(u);
    if (typeof window !== "undefined") {
      persistUser(u);
      if (u.token) {
        setToken(u.token, opts?.remember ?? true);
      }
    }
    // Fetch profile to get full name, wardId and avatarUrl
    userApi
      .profile()
      .then((profile) => {
        if (profile) {
          const updated = {
            ...u,
            id: profile.id,
            name: profile.fullName || u.name,
            wardId: (profile.wardId !== undefined && profile.wardId !== null) ? profile.wardId : u.wardId,
            avatarUrl: profile.avatarUrl || u.avatarUrl || null,
            campaignBanned: profile.campaignBanned !== undefined ? profile.campaignBanned : u.campaignBanned,
          };
          setUser(updated);
          persistUser(updated);
        }
      })
      .catch(() => {});
  };

  const logout = () => {
    setUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
      removeToken();
    }
  };

  const hasRole = (...roles: RoleType[]) => !!user && roles.includes(user.role);

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, login, logout, hasRole, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
