/**
 * login.tsx — Citizen Portal Login
 *
 * Self-contained citizen login. No mention of any other portal, staff system,
 * authority link, or role-based redirects. Citizens interact only with this page.
 */

import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth, mapBackendRole } from "@/lib/auth";
import { Role } from "@/lib/roles";
import { authApi, ApiError } from "@/lib/api";
import { LogIn, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import logoUrl from "@/assets/logo.png";

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
    error: typeof s.error === "string" ? s.error : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Đăng nhập — Đà Nẵng Kết Nối" },
      {
        name: "description",
        content:
          "Đăng nhập để gửi và theo dõi phản ánh đô thị tại Thành phố Đà Nẵng.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { locale } = useI18n();
  const { login } = useAuth();
  const navigate = useNavigate();
  const { redirect, error: authError } = useSearch({ from: "/login" });

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [savedUsername, setSavedUsername] = useState("");
  const [savedPassword, setSavedPassword] = useState("");

  // ─── Handlers ────────────────────────────────────────────────

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await loginMutation.mutateAsync(values);
      const data = result.data;

      if ("mfaRequired" in data && data.mfaRequired) {
        setSavedUsername(values.username);
        setSavedPassword(values.password);
        setMfaRequired(true);
        return;
      }

      if ("token" in data && data.token) {
        const role = mapBackendRole(data.role);
        login({
          name: data.username,
          role,
          org: "",
          token: data.token,
        });
        navigate({ to: redirect || "/" });
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(
          err.status === 401
            ? locale === "vi"
              ? "Số điện thoại hoặc mật khẩu không đúng."
              : "Incorrect phone number or password."
            : err.message
        );
      } else {
        // Demo fallback when backend is offline
        login({ name: username || "citizen1", role: Role.CITIZEN, org: "" });
        navigate({ to: redirect || "/" });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSubmit = async (values: z.infer<typeof mfaSchema>) => {
    setError(null);

    try {
      const result = await authApi.mfaVerify(username, password, mfaCode);
      const data = result.data;
      login({
        name: data.username,
        role: mapBackendRole(data.role),
        org: "",
        token: data.token,
      });
      navigate({ to: redirect || "/" });
    } catch (err) {
      setError(
        err instanceof ApiError
          ? locale === "vi"
            ? "Mã xác thực không đúng."
            : "Invalid verification code."
          : locale === "vi"
            ? "Lỗi kết nối. Vui lòng thử lại."
            : "Connection error. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand header */}
        <div className="text-center mb-8">
          <p className="text-gov-gold uppercase tracking-[0.2em] text-xs font-bold mb-3">
            Đà Nẵng Kết Nối
          </p>
          <img src={logoUrl} alt="Đà Nẵng Kết Nối" className="h-28 w-auto object-contain mx-auto mb-4" />
          <h1 className="font-heading text-3xl md:text-4xl text-gov-blue">
            {locale === "vi" ? "Đăng nhập" : "Sign in"}
          </h1>
          <p className="text-ink-soft mt-2 text-sm">
            {locale === "vi"
              ? "Theo dõi và gửi phản ánh đô thị tại Thành phố Đà Nẵng."
              : "Submit and track urban reports in Da Nang City."}
          </p>
        </div>

        <div className="card-civic p-6 md:p-8 border-t-4 border-gov-gold">

          {/* Access-denied error (when redirected from a protected page) */}
          {authError === "forbidden" && !error && (
            <div className="mb-5 p-4 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-3 text-amber-800">
              <AlertCircle size={18} className="shrink-0" />
              <span className="text-sm">
                {locale === "vi"
                  ? "Vui lòng đăng nhập để tiếp tục."
                  : "Please sign in to continue."}
              </span>
            </div>
          )}

          {/* Generic error */}
          {error && (
            <div className="mb-5 p-4 rounded-lg bg-red-50 border border-red-200 flex items-center gap-3 text-red-700">
              <AlertCircle size={18} className="shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* ── MFA step ── */}
          {mfaRequired ? (
            <form className="space-y-5" onSubmit={handleMfaVerify}>
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-gov-blue font-semibold text-sm">
                  {locale === "vi"
                    ? "Xác thực 2 bước (MFA)"
                    : "Two-factor Authentication"}
                </p>
                <p className="text-xs text-ink-soft mt-1">
                  {locale === "vi"
                    ? "Nhập mã 6 số từ ứng dụng xác thực của bạn."
                    : "Enter the 6-digit code from your authenticator app."}
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">
                  {locale === "vi" ? "Mã xác thực" : "Verification code"}
                </label>
                <input
                  id="mfa-code"
                  type="text"
                  inputMode="numeric"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
                  maxLength={6}
                  className="w-full min-h-[52px] px-4 rounded-lg border-2 border-slate-200 text-base focus:border-gov-blue outline-none text-center text-2xl tracking-[0.5em] font-mono"
                  placeholder="000000"
                  autoFocus
                  autoComplete="one-time-code"
                />
              </div>

              <button
                type="submit"
                disabled={loading || mfaCode.length !== 6}
                className="btn-civic btn-civic-primary w-full text-base disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : null}
                {locale === "vi" ? "Xác nhận" : "Verify"}
              </button>

              <button
                type="button"
                onClick={() => { setMfaRequired(false); setMfaCode(""); setError(null); }}
                className="btn-civic btn-civic-ghost w-full"
              >
                {locale === "vi" ? "← Quay lại" : "← Back"}
              </button>
            </form>

          ) : (
            /* ── Login form ── */
            <form className="space-y-5" onSubmit={handleLogin}>

              {/* Phone / username */}
              <div>
                <label htmlFor="login-phone" className="block text-sm font-bold mb-2">
                  {locale === "vi" ? "Số điện thoại / Tên đăng nhập" : "Phone number / Username"}
                </label>
                <input
                  id="login-phone"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full min-h-[52px] px-4 rounded-lg border-2 border-slate-200 text-base focus:border-gov-blue outline-none transition-colors"
                  placeholder={locale === "vi" ? "Nhập số điện thoại" : "Enter phone number"}
                  autoComplete="username"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="login-password" className="text-sm font-bold">
                    {locale === "vi" ? "Mật khẩu" : "Password"}
                  </label>
                  <Link
                    to="/login"
                    className="text-xs text-gov-blue font-semibold hover:underline"
                  >
                    {locale === "vi" ? "Quên mật khẩu?" : "Forgot password?"}
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full min-h-[52px] px-4 pr-12 rounded-lg border-2 border-slate-200 text-base focus:border-gov-blue outline-none transition-colors"
                    placeholder={locale === "vi" ? "Nhập mật khẩu" : "Enter password"}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink p-1"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Login button */}
              <button
                type="submit"
                disabled={loading || !username || !password}
                className="btn-civic btn-civic-primary w-full text-base min-h-[52px] disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <LogIn size={18} />
                )}
                {locale === "vi" ? "Đăng nhập" : "Sign in"}
              </button>

              {/* Register */}
              <div className="text-center">
                <span className="text-sm text-ink-soft">
                  {locale === "vi" ? "Chưa có tài khoản? " : "Don't have an account? "}
                </span>
                <Link
                  to="/"
                  className="text-sm font-bold text-gov-blue hover:underline"
                >
                  {locale === "vi" ? "Đăng ký ngay" : "Register"}
                </Link>
              </div>

              {/* Terms */}
              <p className="text-center text-xs text-ink-soft leading-relaxed">
                {locale === "vi"
                  ? "Bằng cách đăng nhập, bạn đồng ý với "
                  : "By signing in, you agree to our "}
                <Link to="/" className="underline hover:text-ink">
                  {locale === "vi" ? "Điều khoản sử dụng" : "Terms of Service"}
                </Link>
                {locale === "vi" ? " và " : " and "}
                <Link to="/" className="underline hover:text-ink">
                  {locale === "vi" ? "Chính sách bảo mật" : "Privacy Policy"}
                </Link>
                {"."}
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
