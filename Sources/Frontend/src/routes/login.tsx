/**
 * login.tsx — Citizen Portal Login Wrapper Route
 *
 * This route has been optimized to be a thin configuration wrapper.
 * All UI implementation details, forms, states, and styles are maintained
 * inside "@/features/auth/LoginPage".
 */

import { createFileRoute } from "@tanstack/react-router";
import { LoginPage } from "@/features/auth/LoginPage";

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
