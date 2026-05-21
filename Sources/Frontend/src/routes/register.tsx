import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { authApi, ApiError } from "@/lib/api";
import { UserPlus, Loader2, AlertCircle } from "lucide-react";
import { Role, FRONTEND_TO_BACKEND_ROLE, ROLE_LABEL } from "@/lib/auth";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Đăng ký — Đà Nẵng Lắng Nghe" },
      { name: "description", content: "Đăng ký tài khoản công dân để gửi phản ánh." },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const { t, locale } = useI18n();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<Role>("citizen");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await authApi.register({
        username,
        password,
        fullName: username,
        email: email || "",
        phoneNumber: phone || "",
        role: FRONTEND_TO_BACKEND_ROLE[role] as any,
      });
      setSuccess(true);
      setTimeout(() => {
        navigate({ to: "/login" as any });
      }, 2000);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(locale === "vi" ? "Lỗi kết nối. Backend chưa chạy?" : "Connection error. Backend running?");
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <UserPlus size={40} />
        </div>
        <h1 className="text-2xl font-bold mb-2">
          {locale === "vi" ? "Đăng ký thành công!" : "Registration successful!"}
        </h1>
        <p className="text-ink-soft mb-6">
          {locale === "vi" ? "Đang chuyển hướng đến trang đăng nhập..." : "Redirecting to login..."}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 md:py-16">
      <div className="card-civic p-6 md:p-10 border-t-4 border-gov-gold">
        <div className="text-center mb-8">
          <h1 className="font-heading text-3xl md:text-4xl text-gov-blue mb-2">
            {locale === "vi" ? "Đăng ký tài khoản" : "Create Account"}
          </h1>
          <p className="text-ink-soft">
            {locale === "vi" ? "Tham gia hệ thống phản ánh đô thị Đà Nẵng" : "Join Da Nang urban reporting system"}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-center gap-3 text-red-700">
            <AlertCircle size={20} className="shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2">
                {locale === "vi" ? "Tên đăng nhập" : "Username"} *
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full min-h-[52px] px-4 rounded-lg border-2 border-slate-200 text-base focus:border-gov-blue outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">
                {locale === "vi" ? "Mật khẩu" : "Password"} *
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full min-h-[52px] px-4 rounded-lg border-2 border-slate-200 text-base focus:border-gov-blue outline-none"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full min-h-[52px] px-4 rounded-lg border-2 border-slate-200 text-base focus:border-gov-blue outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">
                {locale === "vi" ? "Số điện thoại" : "Phone number"}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full min-h-[52px] px-4 rounded-lg border-2 border-slate-200 text-base focus:border-gov-blue outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">
              {locale === "vi" ? "Vai trò" : "Role"}
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="w-full min-h-[52px] px-4 rounded-lg border-2 border-slate-200 text-base focus:border-gov-blue outline-none bg-white"
            >
              <option value="citizen">{ROLE_LABEL["citizen"][locale]}</option>
              <option value="ward">{ROLE_LABEL["ward"][locale]}</option>
              <option value="police">{ROLE_LABEL["police"][locale]}</option>
            </select>
            <p className="text-xs text-ink-soft mt-1">
              * Chức năng chọn vai trò cán bộ chỉ dành cho mục đích demo môn học.
            </p>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading || !username || !password}
              className="btn-civic btn-civic-primary w-full text-lg disabled:opacity-50"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : <UserPlus size={20} />}
              {locale === "vi" ? "Đăng ký" : "Register"}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <span className="text-ink-soft">
            {locale === "vi" ? "Đã có tài khoản? " : "Already have an account? "}
          </span>
          <Link to={"/login" as any} className="text-gov-blue font-semibold hover:underline">
            {locale === "vi" ? "Đăng nhập" : "Login"}
          </Link>
        </div>
      </div>
    </div>
  );
}
