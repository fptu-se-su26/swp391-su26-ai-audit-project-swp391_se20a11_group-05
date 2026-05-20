import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth, ROLE_LABEL, mapBackendRole, type Role } from "@/lib/auth";
import { authApi, ApiError } from "@/lib/api";
import { LogIn, Building2, Shield, Landmark, User, Loader2, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Đăng nhập — Đà Nẵng Lắng Nghe" },
      { name: "description", content: "Đăng nhập vào cổng phản ánh chính quyền Thành phố Đà Nẵng." },
    ],
  }),
  component: LoginPage,
});

const ROLE_OPTIONS: { role: Role; icon: typeof User; demoUser: string; demoPass: string; org: string; redirect: string }[] = [
  { role: "citizen", icon: User, demoUser: "citizen1", demoPass: "123456", org: "Người dân Đà Nẵng", redirect: "/" },
  { role: "ward", icon: Building2, demoUser: "ward_staff1", demoPass: "123456", org: "UBND Phường Hải Châu I", redirect: "/ward" },
  { role: "police", icon: Shield, demoUser: "police1", demoPass: "123456", org: "Công an TP. Đà Nẵng", redirect: "/police" },
  { role: "city_admin", icon: Landmark, demoUser: "admin", demoPass: "admin123", org: "UBND TP. Đà Nẵng — IOC", redirect: "/city-admin" },
];

function LoginPage() {
  const { t, locale } = useI18n();
  const { login } = useAuth();
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/login" });
  const [selected, setSelected] = useState<Role>("citizen");
  const [username, setUsername] = useState("citizen1");
  const [password, setPassword] = useState("123456");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaCode, setMfaCode] = useState("");

  const opt = ROLE_OPTIONS.find((o) => o.role === selected)!;

  // Auto-fill demo credentials when role changes
  const selectRole = (role: Role) => {
    setSelected(role);
    const roleOpt = ROLE_OPTIONS.find((o) => o.role === role)!;
    setUsername(roleOpt.demoUser);
    setPassword(roleOpt.demoPass);
    setError(null);
    setMfaRequired(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await authApi.login(username, password);
      const data = result.data;

      // Check if MFA is required
      if ("mfaRequired" in data && data.mfaRequired) {
        setMfaRequired(true);
        setLoading(false);
        return;
      }

      // Direct login success — has token
      if ("token" in data && data.token) {
        login({
          name: data.username,
          role: mapBackendRole(data.role),
          org: opt.org,
          token: data.token,
        });
        navigate({ to: redirect || opt.redirect });
      }
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setError(locale === "vi" ? "Sai tài khoản hoặc mật khẩu" : "Invalid username or password");
        } else {
          setError(err.message);
        }
      } else {
        // Fallback: Demo mode khi backend chưa chạy
        setError(null);
        login({ name: opt.demoUser, role: selected, org: opt.org });
        navigate({ to: redirect || opt.redirect });
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
      login({
        name: data.username,
        role: mapBackendRole(data.role),
        org: opt.org,
        token: data.token,
      });
      navigate({ to: redirect || opt.redirect });
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
    <div className="max-w-3xl mx-auto px-4 py-12 md:py-16">
      <div className="card-civic p-6 md:p-10 border-t-4 border-gov-gold">
        <div className="text-center mb-8">
          <p className="text-gov-gold uppercase tracking-[0.2em] text-xs font-bold mb-2">
            Cổng đăng nhập / Authentication
          </p>
          <h1 className="font-heading text-3xl md:text-4xl text-gov-blue">{t("login.title")}</h1>
          <p className="text-ink-soft mt-2">
            {locale === "vi"
              ? "Chọn vai trò và đăng nhập. Nếu backend chưa chạy → tự động vào chế độ demo."
              : "Select a role and sign in. If backend is not running → auto-fallback to demo mode."}
          </p>
        </div>

        {/* Role Selection */}
        <div className="grid sm:grid-cols-2 gap-3 mb-7">
          {ROLE_OPTIONS.map((o) => {
            const Icon = o.icon;
            const active = selected === o.role;
            return (
              <button
                key={o.role}
                type="button"
                onClick={() => selectRole(o.role)}
                className={`text-left p-4 rounded-xl border-2 transition-all flex gap-3 items-start min-h-[88px] ${
                  active
                    ? "border-gov-blue bg-gov-blue/5 shadow-sm"
                    : "border-slate-200 bg-white hover:border-gov-blue/40"
                }`}
                aria-pressed={active}
              >
                <div
                  className={`w-11 h-11 rounded-lg grid place-items-center shrink-0 ${
                    active ? "bg-gov-blue text-white" : "bg-slate-100 text-gov-blue"
                  }`}
                >
                  <Icon size={22} />
                </div>
                <div>
                  <div className="font-bold text-ink">{ROLE_LABEL[o.role][locale]}</div>
                  <div className="text-xs text-ink-soft mt-0.5">{o.org}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Error message */}
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
              {loading ? <Loader2 size={20} className="animate-spin" /> : <LogIn size={20} />}
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
              <label className="block text-sm font-bold mb-2">{t("login.phone")}</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full min-h-[52px] px-4 rounded-lg border-2 border-slate-200 text-base focus:border-gov-blue outline-none"
                placeholder="username"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">{t("login.password")}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full min-h-[52px] px-4 rounded-lg border-2 border-slate-200 text-base focus:border-gov-blue outline-none"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-civic btn-civic-primary w-full text-lg disabled:opacity-50">
              {loading ? <Loader2 size={20} className="animate-spin" /> : <LogIn size={20} />}
              {locale === "vi"
                ? `Đăng nhập với vai trò ${ROLE_LABEL[selected].vi}`
                : `Sign in as ${ROLE_LABEL[selected].en}`}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link to="/" className="text-gov-blue font-semibold hover:underline">
            {t("login.register")}
          </Link>
        </div>
      </div>
    </div>
  );
}
