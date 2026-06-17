/**
 * _auth.assistant.tsx — AI Assistant Route Wrapper
 *
 * Optimized to be a thin TanStack Router configuration wrapper.
 * The core layout, chat log state, suggested question chips, and citation lists
 * are maintained modularly inside "@/features/assistant/AssistantPage".
 */

import { createFileRoute, redirect } from "@tanstack/react-router";
import { AUTHORITY_ROLES, parseBackendRole } from "@/lib/roles";
import { AssistantPage } from "@/features/assistant/AssistantPage";

export const Route = createFileRoute("/_auth/assistant")({
  beforeLoad: ({ context }) => {
    if (typeof window === "undefined") return;
    const { currentUser } = context as { currentUser: { role: string } };

    // SECURITY check: Assistant is accessible to all AUTHORITY_ROLES.
    if (!AUTHORITY_ROLES.has(currentUser?.role as Role)) {
      throw redirect({ to: "/authority-login", search: { redirect: undefined, error: "forbidden" } });
    }
  },
  head: () => ({
    meta: [
      { title: "Trợ lý AI Nội bộ — Đà Nẵng Kết Nối" },
      {
        name: "description",
        content: "Hỏi đáp nội bộ cho cán bộ về quy trình hành chính và tình huống khẩn cấp.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AssistantPage,
});
