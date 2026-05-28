/**
 * authority-login.tsx — Login page exclusively for authority staff.
 *
 * SECURITY:
 *   - This page ONLY accepts WARD_STAFF, POLICE, SUPER_ADMIN logins.
 *   - If a CITIZEN token is returned by the backend, it is rejected here
 *     and the user is shown an error message. We do NOT redirect CITIZENS
 *     to their portal automatically — that would be a UX hint about backend behavior.
 *   - The URL is /authority-login to match the authority portal path convention.
 *   - In production, this page would be on quanly.example.gov.vn, making it
 *     unreachable from the citizen domain entirely.
 *
 * NOTE: No role picker — staff do not choose their role. The backend determines
 * the role from the credentials. This prevents role-spoofing via UI manipulation.
 */

import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth, mapBackendRole } from "@/lib/auth";
import { Role, AUTHORITY_ROLES, ROLE_LABEL } from "@/lib/roles";
import { authApi, ApiError } from "@/lib/api";
import { LogIn, Shield, Loader2, AlertCircle, ShieldCheck } from "lucide-react";
import logoUrl from "@/assets/logo.png";

export const Route = createFileRoute("/authority-login")({
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
    error: typeof s.error === "string" ? s.error : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Đăng nhập Cán bộ — Đà Nẵng Kết Nối" },
      { name: "description", content: "Cổng đăng nhập dành cho cán bộ phường, công an và lãnh đạo thành phố." },
      // SECURITY: Prevent indexing of the staff login page
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AuthorityLoginPage,
});

/** Default redirects per authority role after login */
const ROLE_REDIRECT: Partial<Record<Role, string>> = {
  [Role.WARD_STAFF]:  "/ward",
  [Role.POLICE]:      "/police",
  [Role.SUPER_ADMIN]: "/city-admin",
};

function AuthorityLoginPage() {
  const { locale } = useI18n();
  const { login } = useAuth();
  const navigate = useNavigate();
  const { redirect, error: authError } = useSearch({ from: "/authority-login" });
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaCode, setMfaCode] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await authApi.login(username, password);
      const data = result.data;

      if ("mfaRequired" in data && data.mfaRequired) {
        setMfaRequired(true);
        setLoading(false);
        return;
      }

      if ("token" in data && data.token) {
        const role = mapBackendRole(data.role);

        // SECURITY: If the backend returns a CITIZEN role for this staff login page,
        // reject it — citizens must use /login, not this page.
        if (!AUTHORITY_ROLES.has(role)) {
          setError(
            locale === "vi"
              ? "Tài khoản này không có quyền truy cập cổng cán bộ."
              : "This account does not have authority portal access."
          );
          setLoading(false);
          return;
        }

        login({
          name: data.username,
          role,
          org: "", // Will be populated from user profile
          token: data.token,
        });

        const defaultRedirect = ROLE_REDIRECT[role] ?? "/city-admin";
        navigate({ to: redirect || defaultRedirect });
      }
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setError(
            locale === "vi"
              ? "Sai tài khoản hoặc mật khẩu"
              : "Invalid username or password"
          );
        } else {
          setError(err.message);
        }
      } else {
        setError(
          locale === "vi"
            ? "Không thể kết nối tới máy chủ. Vui lòng thử lại."
            : "Cannot connect to server. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMfaVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await authApi.mfaVerify(username, password, mfaCode);
      const data = result.data;
      const role = mapBackendRole(data.role);

      if (!AUTHORITY_ROLES.has(role)) {
        setError(
          locale === "vi"
            ? "Tài khoản này không có quyền truy cập cổng cán bộ."
            : "This account does not have authority portal access."
        );
        return;
      }

      login({ name: data.username, role, org: "", token: data.token });
      navigate({ to: redirect || ROLE_REDIRECT[role] || "/city-admin" });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(locale === "vi" ? "Mã xác thực không đúng" : "Invalid MFA code");
      } else {
        setError(locale === "vi" ? "Lỗi kết nối" : "Connection error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 md:py-16">
      <div className="card-civic p-6 md:p-10 border-t-4 border-gov-blue">
        {/* Header */}
        <div className="text-center mb-8">
          <img src={logoUrl} alt="Đà Nẵng Kết Nối" className="h-28 w-auto object-contain mx-auto mb-4" />
          <p className="text-gov-blue uppercase tracking-[0.2em] text-xs font-bold mb-2">
            Cổng cán bộ / Authority Portal
          </p>
          <h1 className="font-heading text-3xl md:text-4xl text-gov-blue">
            {locale === "vi" ? "Đăng nhập Cán bộ" : "Staff Login"}
          </h1>
          <p className="text-ink-soft mt-2 text-sm">
            {locale === "vi"
              ? "Dành riêng cho cán bộ phường, công an và lãnh đạo thành phố."
              : "Exclusively for ward officers, police, and city leadership."}
          </p>
        </div>

        {/* Access denied banner */}
        {authError === "forbidden" && (
          <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 flex items-center gap-3 text-red-700">
            <AlertCircle size={20} className="shrink-0" />
            <span className="text-sm">
              {locale === "vi"
                ? "Bạn không có quyền truy cập trang đó."
                : "You do not have permission to access that page."}
            </span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 flex items-center gap-3 text-red-700">
            <AlertCircle size={20} className="shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* MFA Form */}
        {mfaRequired ? (
          <form className="space-y-4" onSubmit={handleMfaVerify}>
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200 mb-4">
              <p className="text-gov-blue font-semibold">
                {locale === "vi" ? "Xác thực 2 bước (MFA)" : "Two-factor Authentication (MFA)"}
              </p>
              <p className="text-sm text-ink-soft mt-1">
                {locale === "vi"
                  ? "Mở Google Authenticator và nhập mã 6 số"
                  : "Open Google Authenticator and enter the 6-digit code"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">
                {locale === "vi" ? "Mã xác thực" : "Verification code"}
              </label>
              <input
                type="text"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                maxLength={6}
                pattern="[0-9]{6}"
                className="w-full min-h-[52px] px-4 rounded-lg border-2 border-slate-200 text-base focus:border-gov-blue outline-none text-center text-2xl tracking-[0.5em] font-mono"
                placeholder="000000"
                autoFocus
              />
            </div>
            <button type="submit" disabled={loading || mfaCode.length !== 6} className="btn-civic btn-civic-primary w-full text-lg disabled:opacity-50">
              {loading ? <Loader2 size={20} className="animate-spin" /> : <Shield size={20} />}
              {locale === "vi" ? "Xác nhận" : "Verify"}
            </button>
            <button type="button" onClick={() => { setMfaRequired(false); setMfaCode(""); }} className="btn-civic btn-civic-ghost w-full">
              {locale === "vi" ? "Quay lại" : "Back"}
            </button>
          </form>
        ) : (
          /* Login Form */
          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-bold mb-2">
                {locale === "vi" ? "Tên đăng nhập" : "Username"}
              </label>
              <input
                id="authority-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full min-h-[52px] px-4 rounded-lg border-2 border-slate-200 text-base focus:border-gov-blue outline-none"
                placeholder={locale === "vi" ? "Tên đăng nhập cán bộ" : "Staff username"}
                autoComplete="username"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">
                {locale === "vi" ? "Mật khẩu" : "Password"}
              </label>
              <input
                id="authority-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full min-h-[52px] px-4 rounded-lg border-2 border-slate-200 text-base focus:border-gov-blue outline-none"
                autoComplete="current-password"
              />
            </div>
            <button type="submit" disabled={loading || !username || !password} className="btn-civic btn-civic-primary w-full text-lg disabled:opacity-50">
              {loading ? <Loader2 size={20} className="animate-spin" /> : <LogIn size={20} />}
              {locale === "vi" ? "Đăng nhập Cán bộ" : "Staff Sign In"}
            </button>
          </form>
        )}

        {/* Allowed roles info */}
        <div className="mt-6 p-3 rounded-lg bg-slate-50 border border-slate-200">
          <p className="text-xs text-ink-soft text-center mb-2">
            {locale === "vi" ? "Vai trò được phép:" : "Authorized roles:"}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {[Role.WARD_STAFF, Role.POLICE, Role.SUPER_ADMIN].map((r) => (
              <span key={r} className="text-xs bg-gov-blue/10 text-gov-blue font-semibold px-2.5 py-1 rounded-full">
                {ROLE_LABEL[r][locale]}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-4 text-center">
          <Link to="/login" className="text-sm text-ink-soft hover:text-gov-blue">
            {locale === "vi" ? "← Cổng người dân" : "← Citizen portal"}
          </Link>
        </div>
      </div>
    </div>
  );
}
