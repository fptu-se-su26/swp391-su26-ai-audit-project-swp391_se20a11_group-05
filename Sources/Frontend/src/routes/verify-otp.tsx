import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { Shield, Loader2, Key } from "lucide-react";
import { toast } from "sonner";
import logoUrl from "@/assets/logo.png";
import { api } from "@/lib/api"; // Giả định dùng api.ts của thư mục lib

// Định nghĩa search params để lấy phone từ URL
export const Route = createFileRoute("/verify-otp")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      phone: (search.phone as string) || "",
    };
  },
  component: VerifyOtpPage,
});

function VerifyOtpPage() {
  const { locale } = useI18n();
  const navigate = useNavigate();
  const { phone } = Route.useSearch();
  const [otpArray, setOtpArray] = useState(["", "", "", "", "", ""]);
  const otpString = otpArray.join("");
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);

  // Chuyển hướng về register nếu không có SĐT trên URL (ví dụ user vào thẳng)
  useEffect(() => {
    if (!phone) {
      navigate({ to: "/register" });
    }
  }, [phone, navigate]);

  // Bộ đếm đếm ngược nút "Gửi lại"
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpString.length !== 6) {
      toast.error(locale === "vi" ? "Mã OTP phải gồm 6 chữ số" : "OTP must be 6 digits");
      return;
    }

    setIsLoading(true);
    try {
      // Gọi API mới tạo bên Backend
      const response = await api.post("/auth/register-confirm", {
        phoneNumber: phone,
        otpCode: otpString,
      });

      toast.success(
        locale === "vi" ? "Kích hoạt tài khoản thành công!" : "Account verified successfully!"
      );
      
      // Thành công thì chuyển về login
      setTimeout(() => {
        navigate({ to: "/login" });
      }, 1500);

    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || "Mã OTP không chính xác");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setCountdown(60);
    try {
      await api.post("/auth/sms/send", { phoneNumber: phone });
      toast.success(locale === "vi" ? "Đã gửi lại mã OTP!" : "OTP resent!");
    } catch (err: any) {
      toast.error(locale === "vi" ? "Lỗi khi gửi lại mã" : "Error resending OTP");
    }
  };

  if (!phone) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 animate-fade-in">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="p-8 text-center bg-gov-blue/5">
          <div className="mx-auto w-16 h-16 bg-gov-blue/10 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-gov-blue" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            {locale === "vi" ? "Xác thực số điện thoại" : "Verify Phone Number"}
          </h2>
          <p className="text-sm text-slate-500">
            {locale === "vi"
              ? "Mã OTP 6 số đã được gửi qua SMS đến số điện thoại"
              : "A 6-digit OTP has been sent via SMS to"}
            <br />
            <strong className="text-slate-800 text-lg mt-1 block">
              {phone.replace(/(\d{3})\d{4}(\d{3})/, "$1****$2")}
            </strong>
          </p>
        </div>

        <form onSubmit={handleVerify} className="p-8 space-y-6">
          <div className="flex justify-center gap-2 sm:gap-3">
            {otpArray.map((digit, idx) => (
              <input
                key={idx}
                id={`otp-${idx}`}
                type="text"
                inputMode="numeric"
                maxLength={6} // Cho phép paste dài hơn 1 ký tự để bắt event
                value={digit}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  if (val.length > 1) {
                    // Xử lý trường hợp người dùng Paste 6 số
                    const pasted = val.slice(0, 6).split("");
                    const newOtp = [...otpArray];
                    pasted.forEach((char, i) => {
                      if (i < 6) newOtp[i] = char;
                    });
                    setOtpArray(newOtp);
                    document.getElementById(`otp-${Math.min(5, pasted.length)}`)?.focus();
                  } else {
                    // Xử lý gõ 1 số bình thường
                    const newOtp = [...otpArray];
                    newOtp[idx] = val.slice(-1); // Lấy ký tự cuối cùng
                    setOtpArray(newOtp);
                    // Tự động nhảy sang ô tiếp theo
                    if (val && idx < 5) {
                      document.getElementById(`otp-${idx + 1}`)?.focus();
                    }
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Backspace" && !digit && idx > 0) {
                    // Xóa lùi về ô trước
                    document.getElementById(`otp-${idx - 1}`)?.focus();
                  }
                }}
                className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold rounded-xl border-2 border-slate-200 bg-white focus:border-gov-blue focus:ring-2 focus:ring-gov-blue/20 outline-none transition-all placeholder:text-slate-200"
                placeholder="•"
                autoFocus={idx === 0}
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={isLoading || otpString.length !== 6}
            className="w-full h-14 rounded-xl text-base font-bold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2 bg-gov-blue hover:bg-gov-blue/90"
          >
            {isLoading && <Loader2 size={18} className="animate-spin" />}
            {locale === "vi" ? "Xác nhận & Kích hoạt" : "Verify & Activate"}
          </button>

          <div className="text-center">
            <p className="text-sm text-slate-500">
              {locale === "vi" ? "Chưa nhận được mã? " : "Didn't receive code? "}
              <button
                type="button"
                onClick={handleResend}
                disabled={countdown > 0}
                className="font-bold text-gov-blue hover:underline disabled:opacity-50 disabled:no-underline transition-all"
              >
                {countdown > 0
                  ? locale === "vi"
                    ? `Gửi lại sau ${countdown}s`
                    : `Resend in ${countdown}s`
                  : locale === "vi"
                  ? "Gửi lại mã OTP"
                  : "Resend OTP"}
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
