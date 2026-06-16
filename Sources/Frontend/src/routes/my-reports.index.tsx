import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/my-reports/")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: (search.q as string) || "",
  }),
  beforeLoad: ({ search }) => {
    throw redirect({
      to: "/feedback-search",
      search: {
        q: search.q || "",
      },
    });
  },
});
