import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useI18n } from "@/lib/i18n";
import { ApiError } from "@/lib/api";
import { useRegisterMutation } from "@/lib/hooks";
import {
  UserPlus,
  Loader2,
  AtSign,
  Lock,
  Mail,
  Phone,
  Zap,
  MessageSquare,
  Eye,
  EyeOff,
  Shield,
  User,
} from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import logoUrl from "@/assets/logo.png";
import { getFirebaseAuth } from "@/lib/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from "firebase/auth";
import { useAuth } from "@/lib/auth";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export const Route = createFileRoute("/register")({
  validateSearch: (search: Record<string, unknown>): { googleEmail?: string; googleName?: string } => ({
    googleEmail: typeof search.googleEmail === "string" ? search.googleEmail : undefined,
    googleName: typeof search.googleName === "string" ? search.googleName : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Đăng ký — Đà Nẵng Kết Nối" },
      { name: "description", content: "Đăng ký tài khoản công dân để gửi phản ánh." },
    ],
  }),
  component: RegisterPage,
});

const registerSchema = z.object({
  username: z.string().min(3, "Tên đăng nhập phải có ít nhất 3 ký tự"),
  fullName: z.string().min(1, "Họ và tên là bắt buộc"),
  password: z
    .string()
    .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
    .regex(/[a-z]/, "Mật khẩu phải có ít nhất 1 chữ thường")
    .regex(/[A-Z]/, "Mật khẩu phải có ít nhất 1 chữ hoa")
    .regex(/\d/, "Mật khẩu phải có ít nhất 1 chữ số"),
  email: z.string().min(1, "Email là bắt buộc").email("Email không hợp lệ"),
  phone: z
    .string()
    .min(1, "Số điện thoại là bắt buộc")
    .regex(/^(\+84|0)[3-9]\d{8}$/, "Số điện thoại không hợp lệ (VD: 0901234567 hoặc +84901234567)"),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

function PasswordStrengthIndicator({ password }: { password: string }) {
  const { locale } = useI18n();

  const checks = [
    { label: "≥8 ký tự", passed: password.length >= 8 },
    { label: "Chữ hoa", passed: /[A-Z]/.test(password) },
    { label: "Chữ thường", passed: /[a-z]/.test(password) },
    { label: "Chữ số", passed: /\d/.test(password) },
  ];

  const passedCount = checks.filter((c) => c.passed).length;
  const activeSegmentClass =
    passedCount <= 1 ? "bg-red-300" : passedCount === 2 ? "bg-amber-400" : "bg-green-500";

  const strengthLabel =
    password.length === 0
      ? ""
      : passedCount <= 1
        ? locale === "vi"
          ? "Yếu"
          : "Weak"
        : passedCount === 2
          ? locale === "vi"
            ? "Trung bình"
            : "Medium"
          : locale === "vi"
            ? "Mạnh"
            : "Strong";

  return (
    <div className="space-y-1.5 mt-2">
      <div className="flex gap-1.5">
        {checks.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-200 ${password.length === 0
                ? "bg-gray-200"
                : i < passedCount
                  ? activeSegmentClass
                  : "bg-gray-200"
              }`}
          />
        ))}
      </div>
      {password.length > 0 && <p className="text-xs text-muted-foreground">{strengthLabel}</p>}
    </div>
  );
}

function RegisterPage() {
  const { locale } = useI18n();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const { googleEmail, googleName } = Route.useSearch();
  const isFromGoogle = !!googleEmail;

  // Firebase Phone Auth States
  const [otpCode, setOtpCode] = useState("");
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [registerValues, setRegisterValues] = useState<RegisterFormValues | null>(null);

  const registerMutation = useRegisterMutation();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      fullName: googleName ?? "",
      password: "",
      email: googleEmail ?? "",
      phone: "",
    },
  });

  const watchedPassword = form.watch("password");

  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    try {
      const authInstance = getFirebaseAuth();
      const verifier = new RecaptchaVerifier(authInstance, "recaptcha-container", {
        size: "invisible",
      });
      verifier.render().then(() => {
        recaptchaVerifierRef.current = verifier;
      }).catch(err => {
        console.warn("Failed to render recaptcha badge immediately:", err);
      });
    } catch (err) {
      console.warn("Recaptcha initialization failed on mount:", err);
    }

    return () => {
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch (e) {}
      }
    };
  }, []);

  const handleRegister = async (values: RegisterFormValues) => {
    setRegisterValues(values);
    setIsSendingOtp(true);
    const toastId = toast.loading(locale === "vi" ? "Đang gửi mã OTP..." : "Sending OTP...");

    try {
      const authInstance = getFirebaseAuth();
      let verifier = recaptchaVerifierRef.current;

      if (!verifier) {
        const container = document.getElementById("recaptcha-container");
        if (container) {
          container.innerHTML = "";
        }
        verifier = new RecaptchaVerifier(authInstance, "recaptcha-container", {
          size: "invisible",
        });
        recaptchaVerifierRef.current = verifier;
      }

      let formattedPhone = values.phone.trim();
      if (formattedPhone.startsWith("0")) {
        formattedPhone = "+84" + formattedPhone.substring(1);
      }

      const confirmation = await signInWithPhoneNumber(authInstance, formattedPhone, verifier);
      setConfirmationResult(confirmation);
      toast.success(locale === "vi" ? "Đã gửi mã OTP đến điện thoại!" : "OTP sent to your phone!", { id: toastId });
      setShowOtpModal(true);
    } catch (err: any) {
      toast.error(err?.message || (locale === "vi" ? "Không thể gửi OTP. Thử lại sau." : "Failed to send OTP. Try again."), { id: toastId });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult || otpCode.length !== 6 || !registerValues) return;

    setIsVerifyingOtp(true);
    const toastId = toast.loading(locale === "vi" ? "Đang xác thực mã OTP..." : "Verifying OTP...");

    try {
      // 1. Confirm OTP with Firebase
      const result = await confirmationResult.confirm(otpCode);
      const idToken = await result.user.getIdToken();

      // 2. Register user at Backend with Firebase Token
      const response = await registerMutation.mutateAsync({
        data: {
          username: registerValues.username,
          password: registerValues.password,
          fullName: registerValues.fullName,
          email: registerValues.email,
          phoneNumber: registerValues.phone,
        },
        firebaseToken: idToken,
      });

      toast.success(locale === "vi" ? "Đăng ký thành công!" : "Registration successful!", { id: toastId });

      // 3. Set token in localStorage and log in
      if (response && response.token) {
        localStorage.setItem("dn_token_v2", response.token);
        login({
          name: response.username,
          role: response.role,
          org: response.org || "",
          wardName: response.wardName,
          wardType: response.wardType,
          wardId: response.wardId,
          token: response.token,
        });
      }

      setShowOtpModal(false);
      setTimeout(() => {
        navigate({ to: "/" });
      }, 1000);
    } catch (err: any) {
      toast.error(
        err?.message || (locale === "vi" ? "Mã OTP không chính xác hoặc lỗi đăng ký." : "Invalid OTP or registration error."),
        { id: toastId }
      );
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row animate-fade-in">
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
                  Thành Phố
                  <br />
                  <span style={{ color: "#d4af37" }}>Kết Nối</span>
                </>
              ) : (
                <>
                  A City That
                  <br />
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
            <div
              className="flex items-start gap-3 px-4 py-3 rounded-xl"
              style={{ background: "rgba(255,255,255,0.07)" }}
            >
              <Zap size={16} className="text-gov-gold mt-0.5 shrink-0" />
              <div>
                <p className="text-white/80 text-xs font-bold uppercase tracking-wider">
                  {locale === "vi" ? "Tiện ích thông minh" : "Smart Services"}
                </p>
                <p className="text-white/50 text-xs mt-0.5">
                  {locale === "vi"
                    ? "Tra cứu dịch vụ công 24/7 tức thì"
                    : "Access public services 24/7 instantly"}
                </p>
              </div>
            </div>
            <div
              className="flex items-start gap-3 px-4 py-3 rounded-xl"
              style={{ background: "rgba(255,255,255,0.07)" }}
            >
              <MessageSquare size={16} className="text-gov-gold mt-0.5 shrink-0" />
              <div>
                <p className="text-white/80 text-xs font-bold uppercase tracking-wider">
                  {locale === "vi" ? "Tương tác trực tiếp" : "Direct Interaction"}
                </p>
                <p className="text-white/50 text-xs mt-0.5">
                  {locale === "vi"
                    ? "Gửi phản ánh, nhận phản hồi minh bạch"
                    : "Submit reports, get transparent feedback"}
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
            <div className="flex gap-6 mb-8 border-b border-slate-200">
              <Link
                to="/login"
                className="pb-3 text-base font-medium border-b-2 border-transparent text-ink-soft hover:text-ink -mb-px transition-colors"
              >
                {locale === "vi" ? "Đăng nhập" : "Sign in"}
              </Link>
              <button
                type="button"
                className="pb-3 text-base font-bold border-b-2 border-gov-blue text-gov-blue -mb-px transition-colors"
              >
                {locale === "vi" ? "Đăng ký" : "Register"}
              </button>
            </div>

            {/* Banner thông báo khi đến từ Google */}
            {isFromGoogle && (
              <div className="mb-5 p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-3 text-blue-800">
                <svg width="18" height="18" viewBox="0 0 24 24" className="shrink-0 mt-0.5" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <div className="text-sm">
                  <p className="font-semibold mb-0.5">
                    {locale === "vi"
                      ? `Email Google "${googleEmail}" chưa có tài khoản`
                      : `Google email "${googleEmail}" has no account yet`}
                  </p>
                  <p className="text-blue-700">
                    {locale === "vi"
                      ? "Vui lòng đăng ký và xác minh số điện thoại để hoàn tất."
                      : "Please register and verify your phone number to complete."}
                  </p>
                </div>
              </div>
            )}

            {/* Form */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleRegister)} className="space-y-4">
                {/* Username field */}
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <div className="relative">
                        <AtSign
                          size={16}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                        />
                        <Input
                          placeholder={locale === "vi" ? "Tên đăng nhập" : "Username"}
                          className="w-full min-h-[52px] pl-10 pr-4 rounded-xl border-2 border-slate-200 bg-white text-base focus:border-gov-blue focus-visible:ring-0 outline-none transition-colors placeholder:text-slate-400"
                          {...field}
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Full Name field */}
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <div className="relative">
                        <User
                          size={16}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                        />
                        <Input
                          placeholder={locale === "vi" ? "Họ và tên" : "Full name"}
                          className="w-full min-h-[52px] pl-10 pr-4 rounded-xl border-2 border-slate-200 bg-white text-base focus:border-gov-blue focus-visible:ring-0 outline-none transition-colors placeholder:text-slate-400"
                          {...field}
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Email field */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <div className="relative">
                        <Mail
                          size={16}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                        />
                        <Input
                          type="email"
                          placeholder={locale === "vi" ? "Email" : "Email"}
                          className={`w-full min-h-[52px] pl-10 pr-4 rounded-xl border-2 bg-white text-base focus:border-gov-blue focus-visible:ring-0 outline-none transition-colors placeholder:text-slate-400 ${isFromGoogle
                              ? "border-blue-300 bg-blue-50 text-blue-900 cursor-not-allowed"
                              : "border-slate-200"
                            }`}
                          readOnly={isFromGoogle}
                          {...field}
                        />
                        {isFromGoogle && (
                          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-blue-600 font-semibold bg-blue-100 px-2 py-0.5 rounded-full">
                            Google
                          </span>
                        )}
                      </div>
                      {isFromGoogle && (
                        <p className="text-xs text-blue-600 px-1">
                          {locale === "vi"
                            ? "Email đã được xác minh qua Google, không thể thay đổi."
                            : "Email verified via Google and cannot be changed."}
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Phone field */}
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <div className="relative">
                        <Phone
                          size={16}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                        />
                        <Input
                          type="tel"
                          placeholder={locale === "vi" ? "Số điện thoại" : "Phone number"}
                          className="w-full min-h-[52px] pl-10 pr-4 rounded-xl border-2 border-slate-200 bg-white text-base focus:border-gov-blue focus-visible:ring-0 outline-none transition-colors placeholder:text-slate-400"
                          {...field}
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Password field */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <div className="relative">
                        <Lock
                          size={16}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                        />
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder={locale === "vi" ? "Mật khẩu" : "Password"}
                          className="w-full min-h-[52px] pl-10 pr-12 rounded-xl border-2 border-slate-200 bg-white text-base focus:border-gov-blue focus-visible:ring-0 outline-none transition-colors placeholder:text-slate-400"
                          {...field}
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
                      <PasswordStrengthIndicator password={watchedPassword} />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={registerMutation.isPending}
                  className="w-full min-h-[52px] rounded-xl text-base font-bold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                  style={{ background: "linear-gradient(135deg, #00387b 0%, #00264d 100%)" }}
                >
                  {registerMutation.isPending && <Loader2 size={18} className="animate-spin" />}
                  {locale === "vi" ? "Đăng ký ngay →" : "Register Now →"}
                </button>
              </form>
            </Form>
          </div>
        </div>

        {/* Footer */}
        <footer className="px-6 pb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <img
              src={logoUrl}
              alt=""
              className="h-6 w-auto object-contain opacity-50"
              aria-hidden="true"
            />
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

      {/* Invisible Recaptcha */}
      <div id="recaptcha-container"></div>
      <style dangerouslySetInnerHTML={{__html: `
        .grecaptcha-badge { 
          position: fixed !important; 
          bottom: 75px !important; 
          right: 0 !important; 
          z-index: 40 !important; 
        }
        body {
          overflow-x: hidden;
        }
      `}} />

      {/* OTP verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 relative overflow-hidden animate-scale-up">
            <div className="flex items-center gap-2 text-gov-blue mb-4">
              <Shield className="h-6 w-6 text-[#00387b]" />
              <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">
                {locale === "vi" ? "Xác thực số điện thoại" : "Verify Phone Number"}
              </h3>
            </div>

            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed mb-5">
              {locale === "vi"
                ? `Mã OTP đã được gửi đến số điện thoại ${registerValues?.phone}. Vui lòng nhập mã 6 số để hoàn tất đăng ký.`
                : `A 6-digit OTP has been sent to ${registerValues?.phone}. Please enter it to complete registration.`}
            </p>

            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={otpCode}
                  onChange={setOtpCode}
                  autoFocus
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} className="w-10 h-12 sm:w-12 sm:h-14 text-xl sm:text-2xl font-bold bg-white dark:bg-slate-950" />
                    <InputOTPSlot index={1} className="w-10 h-12 sm:w-12 sm:h-14 text-xl sm:text-2xl font-bold bg-white dark:bg-slate-950" />
                    <InputOTPSlot index={2} className="w-10 h-12 sm:w-12 sm:h-14 text-xl sm:text-2xl font-bold bg-white dark:bg-slate-950" />
                    <InputOTPSlot index={3} className="w-10 h-12 sm:w-12 sm:h-14 text-xl sm:text-2xl font-bold bg-white dark:bg-slate-950" />
                    <InputOTPSlot index={4} className="w-10 h-12 sm:w-12 sm:h-14 text-xl sm:text-2xl font-bold bg-white dark:bg-slate-950" />
                    <InputOTPSlot index={5} className="w-10 h-12 sm:w-12 sm:h-14 text-xl sm:text-2xl font-bold bg-white dark:bg-slate-950" />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <div className="flex gap-3 justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowOtpModal(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  {locale === "vi" ? "Hủy" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={isVerifyingOtp || otpCode.length !== 6}
                  className="flex items-center gap-2 bg-[#00387b] hover:bg-[#00264d] text-white font-bold py-2.5 px-5 rounded-xl text-sm disabled:opacity-50 transition-all duration-200 cursor-pointer"
                >
                  {isVerifyingOtp && <Loader2 className="animate-spin h-4 w-4" />}
                  {locale === "vi" ? "Xác nhận" : "Confirm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
