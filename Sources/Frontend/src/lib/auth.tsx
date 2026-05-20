import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getToken, setToken, removeToken } from "./api";

/**
 * Role mapping — Backend dùng UPPER_CASE, Frontend dùng lowercase.
 * Mapping 2 chiều để tương thích.
 */
export type Role = "citizen" | "ward" | "police" | "city_admin";

// Backend → Frontend role mapping
const BACKEND_TO_FRONTEND_ROLE: Record<string, Role> = {
  CITIZEN: "citizen",
  ROLE_CITIZEN: "citizen",
  WARD_STAFF: "ward",
  ROLE_WARD_STAFF: "ward",
  POLICE: "police",
  ROLE_POLICE: "police",
  SUPER_ADMIN: "city_admin",
  ROLE_SUPER_ADMIN: "city_admin",
};

// Frontend → Backend role mapping (dùng khi register)
export const FRONTEND_TO_BACKEND_ROLE: Record<Role, string> = {
  citizen: "CITIZEN",
  ward: "WARD_STAFF",
  police: "POLICE",
  city_admin: "SUPER_ADMIN",
};

export function mapBackendRole(backendRole: string): Role {
  return BACKEND_TO_FRONTEND_ROLE[backendRole] || "citizen";
}

export interface AuthUser {
  name: string;
  role: Role;
  org: string;
  token?: string;
}

interface AuthCtx {
  user: AuthUser | null;
  login: (u: AuthUser) => void;
  logout: () => void;
  hasRole: (...roles: Role[]) => boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthCtx | null>(null);
const STORAGE_KEY = "dn_auth_user_v1";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        setUser(parsed);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const login = (u: AuthUser) => {
    setUser(u);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      // Also store JWT token separately for API calls
      if (u.token) {
        setToken(u.token);
      }
    }
  };

  const logout = () => {
    setUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
      removeToken();
    }
  };

  const hasRole = (...roles: Role[]) => !!user && roles.includes(user.role);
  const isAuthenticated = !!user && !!getToken();

  return (
    <AuthContext.Provider value={{ user, login, logout, hasRole, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export const ROLE_LABEL: Record<Role, { vi: string; en: string }> = {
  citizen: { vi: "Người dân", en: "Citizen" },
  ward: { vi: "Cán bộ phường", en: "Ward officer" },
  police: { vi: "Công an / CSGT", en: "Police officer" },
  city_admin: { vi: "Lãnh đạo thành phố", en: "City leadership" },
};
