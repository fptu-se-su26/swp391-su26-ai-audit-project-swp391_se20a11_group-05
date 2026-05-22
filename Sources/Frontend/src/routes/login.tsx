import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth, mapBackendRole } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { useLoginMutation, useMfaVerifyMutation } from "@/lib/hooks";
import { LogIn, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

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

const loginSchema = z.object({
  username: z.string().min(3, "Tên đăng nhập phải có ít nhất 3 ký tự"),
  password: z.string().min(3, "Mật khẩu không được để trống"),
});

const mfaSchema = z.object({
  mfaCode: z.string().length(6, "Mã MFA phải có đúng 6 chữ số").regex(/^\d+$/, "Mã MFA chỉ chứa số"),
});

function LoginPage() {
  const { t, locale } = useI18n();
  const { login } = useAuth();
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/login" });

  const [error, setError] = useState<string | null>(null);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [savedUsername, setSavedUsername] = useState("");
  const [savedPassword, setSavedPassword] = useState("");

  const loginMutation = useLoginMutation();
  const mfaVerifyMutation = useMfaVerifyMutation();

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const mfaForm = useForm<z.infer<typeof mfaSchema>>({
    resolver: zodResolver(mfaSchema),
    defaultValues: { mfaCode: "" },
  });

  const handleLoginSubmit = async (values: z.infer<typeof loginSchema>) => {
    setError(null);

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
        processSuccessfulLogin(data);
      }
    } catch (err) {
      const msg = err instanceof ApiError
        ? (err.status === 401 ? "Sai tài khoản hoặc mật khẩu" : err.message)
        : "Lỗi kết nối máy chủ";
      setError(msg);
      toast.error(msg);
    }
  };

  const handleMfaSubmit = async (values: z.infer<typeof mfaSchema>) => {
    setError(null);

    try {
      const result = await mfaVerifyMutation.mutateAsync({
        username: savedUsername,
        password: savedPassword,
        mfaCode: values.mfaCode,
      });
      processSuccessfulLogin(result.data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError("Mã xác thực không đúng");
      } else {
        setError("Lỗi kết nối máy chủ");
      }
    }
  };

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const processSuccessfulLogin = (data: any) => {
    const backendRole = mapBackendRole(data.role);
    let org = "Người dân Đà Nẵng";
    if (backendRole === "ward") org = "UBND Phường Hải Châu I";
    else if (backendRole === "police") org = "Công an TP. Đà Nẵng";
    else if (backendRole === "city_admin") org = "UBND TP. Đà Nẵng — IOC";

    login({
      name: data.username,
      role: backendRole,
      org: org,
      token: data.token,
    });

    let targetRoute = "/";
    if (backendRole === "ward") targetRoute = "/ward";
    else if (backendRole === "police") targetRoute = "/police";
    else if (backendRole === "city_admin") targetRoute = "/city-admin";

    navigate({ to: (redirect || targetRoute) as any });
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 md:py-24 animate-fade-in-up">
      <Card className="border-t-4 border-t-gov-gold shadow-lg hover:shadow-xl transition-shadow duration-200">
        <CardHeader className="text-center pb-4">
          <p className="text-gov-gold uppercase tracking-[0.2em] text-xs font-bold mb-2">
            Cổng đăng nhập
          </p>
          <CardTitle className="font-heading text-3xl md:text-4xl text-gov-blue">
            {t("login.title")}
          </CardTitle>
          <CardDescription className="text-base mt-2">
            {locale === "vi"
              ? "Đăng nhập để sử dụng các dịch vụ đô thị thông minh."
              : "Sign in to access smart city services."}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-3 text-destructive">
              <AlertCircle size={20} className="shrink-0" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          {mfaRequired ? (
            <Form {...mfaForm}>
              <form onSubmit={mfaForm.handleSubmit(handleMfaSubmit)} className="space-y-6">
                <div className="text-center p-4 bg-primary/5 rounded-lg border border-primary/20 mb-2">
                  <p className="text-primary font-semibold">Xác thực 2 bước (MFA)</p>
                  <p className="text-sm text-muted-foreground mt-1">Mở Google Authenticator và nhập mã 6 số</p>
                </div>

                <FormField
                  control={mfaForm.control}
                  name="mfaCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mã xác thực</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="000000"
                          maxLength={6}
                          className="text-center text-2xl tracking-[0.5em] font-mono h-14"
                          {...field}
                          autoFocus
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex flex-col gap-3">
                  <Button type="submit" size="lg" disabled={mfaVerifyMutation.isPending} className="w-full text-base">
                    {mfaVerifyMutation.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <LogIn className="mr-2 h-5 w-5" />}
                    Xác nhận
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => { setMfaRequired(false); mfaForm.reset(); }}
                    className="w-full"
                  >
                    Quay lại
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(handleLoginSubmit)} className="space-y-5">
                <FormField
                  control={loginForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("login.phone")}</FormLabel>
                      <FormControl>
                        <Input placeholder="Nhập tên đăng nhập" className="h-12" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("login.password")}</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" className="h-12" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" size="lg" disabled={loginMutation.isPending} className="w-full text-base mt-2">
                  {loginMutation.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <LogIn className="mr-2 h-5 w-5" />}
                  {locale === "vi" ? "Đăng nhập" : "Sign in"}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>

        <CardFooter className="justify-center border-t pt-6">
          <Link to={"/register" as any} className="text-primary font-semibold hover:underline text-sm">
            {t("login.register")}
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
