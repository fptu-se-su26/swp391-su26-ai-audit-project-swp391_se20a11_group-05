import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { ApiError } from "@/lib/api";
import { useRegisterMutation } from "@/lib/hooks";
import { UserPlus, Loader2 } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Đăng ký — Đà Nẵng Lắng Nghe" },
      { name: "description", content: "Đăng ký tài khoản công dân để gửi phản ánh." },
    ],
  }),
  component: RegisterPage,
});

const registerSchema = z.object({
  username: z.string().min(3, "Tên đăng nhập phải có ít nhất 3 ký tự"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
  email: z.union([z.string().email("Email không hợp lệ"), z.literal("")]),
  phone: z.union([
    z.string().regex(/^0\d{9}$/, "Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0)"),
    z.literal(""),
  ]),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

function PasswordStrengthIndicator({ password }: { password: string }) {
  const { locale } = useI18n();

  const checks = [
    { label: "Độ dài", passed: password.length >= 6 },
    { label: "Số", passed: /\d/.test(password) },
    { label: "Ký tự đặc biệt", passed: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];

  const passedCount = checks.filter((c) => c.passed).length;

  const strengthLabel =
    password.length === 0
      ? ""
      : passedCount <= 1
        ? locale === "vi" ? "Yếu" : "Weak"
        : passedCount === 2
          ? locale === "vi" ? "Trung bình" : "Medium"
          : locale === "vi" ? "Mạnh" : "Strong";

  return (
    <div className="space-y-1.5 mt-2">
      <div className="flex gap-1.5">
        {checks.map((check, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-200 ${
              password.length === 0
                ? "bg-gray-200"
                : check.passed
                  ? "bg-green-500"
                  : "bg-red-300"
            }`}
          />
        ))}
      </div>
      {password.length > 0 && (
        <p className="text-xs text-muted-foreground">{strengthLabel}</p>
      )}
    </div>
  );
}

function RegisterPage() {
  const { t, locale } = useI18n();
  const navigate = useNavigate();

  const registerMutation = useRegisterMutation();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      email: "",
      phone: "",
    },
  });

  const watchedPassword = form.watch("password");

  const handleRegister = async (values: RegisterFormValues) => {
    try {
      await registerMutation.mutateAsync({
        username: values.username,
        password: values.password,
        fullName: values.username,
        email: values.email || "",
        phoneNumber: values.phone || "",
      });
      toast.success(
        locale === "vi" ? "Đăng ký thành công!" : "Registration successful!",
        {
          description:
            locale === "vi"
              ? "Đang chuyển hướng đến trang đăng nhập..."
              : "Redirecting to login...",
        },
      );
      setTimeout(() => {
        navigate({ to: "/login" as any });
      }, 1500);
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error(
          locale === "vi"
            ? "Lỗi kết nối. Backend chưa chạy?"
            : "Connection error. Backend running?",
        );
      }
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 md:py-24 animate-fade-in">
      <Card className="border-t-4 border-t-gov-gold shadow-lg card-civic-hover">
        <CardHeader className="text-center pb-4">
          <p className="text-gov-gold uppercase tracking-[0.2em] text-xs font-bold mb-2">
            {locale === "vi" ? "Cổng đăng ký" : "Registration"}
          </p>
          <CardTitle className="font-heading text-3xl md:text-4xl text-gov-blue">
            {locale === "vi" ? "Đăng ký tài khoản" : "Create Account"}
          </CardTitle>
          <CardDescription className="text-base mt-2">
            {locale === "vi"
              ? "Tham gia hệ thống phản ánh đô thị Đà Nẵng"
              : "Join Da Nang urban reporting system"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleRegister)} className="space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {locale === "vi" ? "Tên đăng nhập" : "Username"} *
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={locale === "vi" ? "Nhập tên đăng nhập" : "Enter username"}
                          className="h-12"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {locale === "vi" ? "Mật khẩu" : "Password"} *
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          className="h-12"
                          {...field}
                        />
                      </FormControl>
                      <PasswordStrengthIndicator password={watchedPassword} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="email@example.com"
                          className="h-12"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {locale === "vi" ? "Số điện thoại" : "Phone number"}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="0912345678"
                          className="h-12"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={registerMutation.isPending}
                className="w-full text-base mt-2"
              >
                {registerMutation.isPending ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <UserPlus className="mr-2 h-5 w-5" />
                )}
                {locale === "vi" ? "Đăng ký" : "Register"}
              </Button>
            </form>
          </Form>
        </CardContent>

        <CardFooter className="justify-center border-t pt-6">
          <span className="text-ink-soft text-sm">
            {locale === "vi" ? "Đã có tài khoản? " : "Already have an account? "}
          </span>
          <Link
            to={"/login" as any}
            className="text-primary font-semibold hover:underline text-sm"
          >
            {locale === "vi" ? "Đăng nhập" : "Login"}
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
