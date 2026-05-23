import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { reports } from "@/lib/mock-data";
import { StatusBadge } from "@/components/site/StatusBadge";
import { MapPin } from "lucide-react";
import { Role, AUTHORITY_ROLES, parseBackendRole } from "@/lib/roles";
import { getToken } from "@/lib/api";

export const Route = createFileRoute("/my-reports/")({
  /**
   * beforeLoad guard — citizen portal protected route.
   *
   * SECURITY:
   *   - Unauthenticated users → redirect to /login
   *   - Authority staff navigating here → redirect to /login (not a threat,
   *     but they should not access citizen report history)
   */
  beforeLoad: async () => {
    const token = typeof window !== "undefined" ? getToken() : null;
    const raw = typeof window !== "undefined"
      ? localStorage.getItem("dn_auth_user_v2")
      : null;

    if (!token || !raw) {
      throw redirect({ to: "/login", search: { redirect: "/my-reports" } });
    }

    let user: { role: string } | null = null;
    try { user = JSON.parse(raw); } catch { /* ignore */ }

    if (!user) throw redirect({ to: "/login" });

    const role = parseBackendRole(user.role);

    // Authority staff should not access citizen report list
    if (AUTHORITY_ROLES.has(role)) {
      throw redirect({ to: "/login" });
    }

    // Confirm CITIZEN role
    if (role !== Role.CITIZEN) {
      throw redirect({ to: "/login" });
    }
  },
  head: () => ({
    meta: [
      { title: "Báo cáo của tôi — Đà Nẵng Kết Nối" },
      { name: "description", content: "Theo dõi tất cả phản ánh bạn đã gửi." },
    ],
  }),
  component: MyReports,
});

function MyReports() {
  const { t, locale } = useI18n();
  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-10 md:py-14">
      <h1 className="font-heading text-4xl md:text-5xl text-gov-blue mb-3">{t("my.title")}</h1>
      <p className="text-lg text-ink-soft mb-10">{t("my.subtitle")}</p>

      <div className="space-y-4">
        {reports.map((r) => (
          <Link
            key={r.id}
            to="/my-reports/$id"
            params={{ id: r.id }}
            className="card-civic p-5 md:p-6 flex flex-col sm:flex-row gap-5 hover:shadow-md transition-shadow"
          >
            <img
              src={r.image}
              alt={r.title[locale]}
              loading="lazy"
              width={400}
              height={400}
              className="w-full sm:w-40 h-40 object-cover rounded-lg"
            />
            <div className="flex-1">
              <div className="flex flex-wrap items-start gap-2 mb-2">
                <StatusBadge status={r.status} />
                <span className="text-ink-soft text-sm ml-auto">{r.createdAt}</span>
              </div>
              <h2 className="text-xl font-bold text-ink font-sans mb-1">{r.title[locale]}</h2>
              <p className="text-ink-soft mb-3 line-clamp-2">{r.description[locale]}</p>
              <div className="flex flex-wrap gap-4 text-sm text-ink-soft">
                <span className="flex items-center gap-1.5"><MapPin size={16} /> {r.address[locale]}</span>
                <span className="font-mono text-xs">{r.id}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
