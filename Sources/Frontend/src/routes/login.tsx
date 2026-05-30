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
import { Loader2, AlertCircle, Eye, EyeOff, AtSign, Lock, Shield, Zap, MessageSquare } from "lucide-react";
import logoUrl from "@/assets/logo.png";

type LoginSearch = {
  redirect?: string;
  error?: string;
};

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>): LoginSearch => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
    error: typeof s.error === "string" ? s.error : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Đăng nhập — Đà Nẵng Kết Nối" },
      {
        name: "description",
        content: "Đăng nhập để gửi và theo dõi phản ánh đô thị tại Thành phố Đà Nẵng.",
      },
    ],
  }),
  component: LoginPage,
});

/* ── Google icon SVG (inline) ───────────────────────────────── */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

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
  const [mfaCode, setMfaCode] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  // ─── Handlers ────────────────────────────────────────────────

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await authApi.login(username, password);

      if ("mfaRequired" in data && data.mfaRequired) {
        setMfaRequired(true);
        setLoading(false);
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

  const handleMfaVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await authApi.mfaVerify(username, password, mfaCode);
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
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* ══ LEFT — Hero Panel ══════════════════════════════════════ */}
      <div
        className="hidden lg:flex lg:w-[42%] flex-col relative overflow-hidden"
        style={{
          background: "linear-gradient(155deg, #001028 0%, #001f46 45%, #00387b 100%)",
        }}
      >
        {/* Star particles */}
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 22 }).map((_, i) => (
            <span
              key={i}
              className="login-star"
              style={{
                left: `${(i * 37 + 11) % 100}%`,
                top: `${(i * 53 + 7) % 100}%`,
                animationDelay: `${(i * 0.4) % 6}s`,
                animationDuration: `${4 + (i % 4)}s`,
                width: i % 3 === 0 ? "2px" : "1.5px",
                height: i % 3 === 0 ? "2px" : "1.5px",
              }}
            />
          ))}
        </div>

        {/* Radial glow */}
        <div
          aria-hidden="true"
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(0,56,123,0.5) 0%, transparent 70%)" }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full px-10 py-10">
          {/* Top brand */}
          <div className="flex items-center gap-3 mb-auto">
            <img
              src={logoUrl}
              alt="Đà Nẵng Kết Nối"
              className="h-10 w-auto object-contain brightness-0 invert"
            />
            <span className="text-white/60 text-xs font-bold tracking-[0.2em] uppercase">
              DA NANG DIGITAL CENTER
            </span>
          </div>

          {/* Main heading */}
          <div className="mb-10">
            <h1 className="font-heading text-5xl xl:text-6xl font-bold text-white leading-tight mb-4">
              {locale === "vi" ? (
                <>
                  Thành Phố<br />
                  <span style={{ color: "#d4af37" }}>Kết Nối</span>
                </>
              ) : (
                <>
                  A City That<br />
                  <span style={{ color: "#d4af37" }}>Connect</span>
                </>
              )}
            </h1>
            <p className="text-white/65 text-base leading-relaxed max-w-xs">
              {locale === "vi"
                ? "Hệ thống kết nối trực tuyến giữa chính quyền và người dân Thành phố Đà Nẵng. Vì một thành phố thông minh và bền vững."
                : "Online connection system between the government and citizens of Da Nang City. For a smart and sustainable city."}
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-3 mb-10">
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl" style={{ background: "rgba(255,255,255,0.07)" }}>
              <Zap size={16} className="text-gov-gold mt-0.5 shrink-0" />
              <div>
                <p className="text-white/80 text-xs font-bold uppercase tracking-wider">
                  {locale === "vi" ? "Tiện ích thông minh" : "Smart Services"}
                </p>
                <p className="text-white/50 text-xs mt-0.5">
                  {locale === "vi" ? "Tra cứu dịch vụ công 24/7 tức thì" : "Access public services 24/7 instantly"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl" style={{ background: "rgba(255,255,255,0.07)" }}>
              <MessageSquare size={16} className="text-gov-gold mt-0.5 shrink-0" />
              <div>
                <p className="text-white/80 text-xs font-bold uppercase tracking-wider">
                  {locale === "vi" ? "Tương tác trực tiếp" : "Direct Interaction"}
                </p>
                <p className="text-white/50 text-xs mt-0.5">
                  {locale === "vi" ? "Gửi phản ánh, nhận phản hồi minh bạch" : "Submit reports, get transparent feedback"}
                </p>
              </div>
            </div>
          </div>

          {/* Bottom watermark */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.15)" }} />
            <span className="text-white/30 text-xs tracking-[0.15em] uppercase">
              DA NANG DIGITAL CENTER
            </span>
            <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.15)" }} />
          </div>
        </div>
      </div>

      {/* ══ RIGHT — Form Panel ═════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-h-screen" style={{ background: "#f4f7fa" }}>

        {/* Mobile logo (shown only on small screens) */}
        <div className="flex lg:hidden items-center gap-3 px-6 pt-8 pb-4">
          <img src={logoUrl} alt="Đà Nẵng Kết Nối" className="h-10 w-auto object-contain" />
        </div>

        {/* Form container */}
        <div className="flex-1 flex items-center justify-center px-6 py-8">
          <div className="w-full max-w-sm">

            {/* Tabs: Đăng nhập / Đăng ký */}
            {!mfaRequired && (
              <div className="flex gap-6 mb-8 border-b border-slate-200">
                <button
                  type="button"
                  className="pb-3 text-base font-bold border-b-2 border-gov-blue text-gov-blue -mb-px transition-colors"
                >
                  {locale === "vi" ? "Đăng nhập" : "Sign in"}
                </button>
                <Link
                  to="/register"
                  className="pb-3 text-base font-medium border-b-2 border-transparent text-ink-soft hover:text-ink -mb-px transition-colors"
                >
                  {locale === "vi" ? "Đăng ký" : "Register"}
                </Link>
              </div>
            )}

            {/* Access-denied error */}
            {authError === "forbidden" && !error && (
              <div className="mb-5 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-3 text-amber-800">
                <AlertCircle size={16} className="shrink-0" />
                <span className="text-sm">
                  {locale === "vi" ? "Vui lòng đăng nhập để tiếp tục." : "Please sign in to continue."}
                </span>
              </div>
            )}

            {/* Generic error */}
            {error && (
              <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 text-red-700">
                <AlertCircle size={16} className="shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* ── MFA Step ── */}
            {mfaRequired ? (
              <form className="space-y-5" onSubmit={handleMfaVerify}>
                <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <Shield size={24} className="text-gov-blue mx-auto mb-2" />
                  <p className="text-gov-blue font-bold text-sm">
                    {locale === "vi" ? "Xác thực 2 bước (MFA)" : "Two-factor Authentication"}
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
                    className="w-full min-h-[52px] px-4 rounded-xl border-2 border-slate-200 text-base focus:border-gov-blue outline-none text-center text-2xl tracking-[0.5em] font-mono bg-white transition-colors"
                    placeholder="000000"
                    autoFocus
                    autoComplete="one-time-code"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || mfaCode.length !== 6}
                  className="btn-civic btn-civic-primary w-full text-base min-h-[52px] disabled:opacity-50 rounded-xl"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : null}
                  {locale === "vi" ? "Xác nhận" : "Verify"}
                </button>

                <button
                  type="button"
                  onClick={() => { setMfaRequired(false); setMfaCode(""); setError(null); }}
                  className="btn-civic btn-civic-ghost w-full rounded-xl"
                >
                  {locale === "vi" ? "← Quay lại" : "← Back"}
                </button>
              </form>

            ) : (
              /* ── Login Form ── */
              <form className="space-y-4" onSubmit={handleLogin}>

                {/* Username input with icon */}
                <div className="relative">
                  <AtSign
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                  <input
                    id="login-phone"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full min-h-[52px] pl-10 pr-4 rounded-xl border-2 border-slate-200 bg-white text-base focus:border-gov-blue outline-none transition-colors placeholder:text-slate-400"
                    placeholder={locale === "vi" ? "Email hoặc Tên đăng nhập" : "Email or Username"}
                    autoComplete="username"
                    required
                  />
                </div>

                {/* Password input with icon + toggle */}
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full min-h-[52px] pl-10 pr-12 rounded-xl border-2 border-slate-200 bg-white text-base focus:border-gov-blue outline-none transition-colors placeholder:text-slate-400"
                    placeholder={locale === "vi" ? "Mật khẩu" : "Password"}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-ink p-1 transition-colors"
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Remember me + Forgot password */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      id="remember-me"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-gov-blue focus:ring-gov-blue accent-gov-blue"
                    />
                    <span className="text-xs text-ink-soft">
                      {locale === "vi" ? "Ghi nhớ đăng nhập" : "Remember me"}
                    </span>
                  </label>
                  <Link
                    to="/login"
                    className="text-xs font-semibold text-gov-blue hover:underline"
                  >
                    {locale === "vi" ? "Quên mật khẩu?" : "Forgot password?"}
                  </Link>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading || !username || !password}
                  className="w-full min-h-[52px] rounded-xl text-base font-bold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg, #00387b 0%, #00264d 100%)" }}
                >
                  {loading && <Loader2 size={18} className="animate-spin" />}
                  {locale === "vi" ? "Tiếp tục →" : "Continue →"}
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 my-1">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                    {locale === "vi" ? "Hoặc đăng nhập với" : "Or continue with"}
                  </span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>

                {/* Google OAuth placeholder */}
                <button
                  type="button"
                  onClick={() => {
                    // TODO: Implement Google OAuth when backend is ready
                  }}
                  className="w-full min-h-[52px] rounded-xl border-2 border-slate-200 bg-white text-sm font-semibold text-ink hover:border-gov-blue hover:bg-slate-50 transition-all flex items-center justify-center gap-3"
                >
                  <GoogleIcon />
                  {locale === "vi" ? "Tiếp tục với Google" : "Continue with Google"}
                </button>

              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="px-6 pb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <img src={logoUrl} alt="" className="h-6 w-auto object-contain opacity-50" aria-hidden="true" />
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            © {new Date().getFullYear()}{" "}
            <a
              href="https://danang.gov.vn"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gov-blue hover:underline"
            >
              {locale === "vi" ? "UBND Thành phố Đà Nẵng" : "Da Nang People's Committee"}
            </a>
            {" · "}
            <span className="text-slate-400">
              {locale === "vi" ? "Trung tâm Chuyển đổi số" : "Digital Transformation Center"}
            </span>
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {locale === "vi"
              ? "Đà Nẵng Kết Nối — Citizen-Staff Connection · SWP391 SE20A11"
              : "Da Nang Connects — Citizen-Staff Connection · SWP391 SE20A11"}
          </p>
        </footer>
      </div>
    </div>
  );
}
