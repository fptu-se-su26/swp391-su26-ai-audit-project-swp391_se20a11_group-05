import { createFileRoute, Link, notFound, redirect } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { reports } from "@/lib/mock-data";
import { StatusBadge } from "@/components/site/StatusBadge";
import { ArrowLeft, Check, Clock, MapPin, User } from "lucide-react";
import { Role, AUTHORITY_ROLES, parseBackendRole } from "@/lib/roles";
import { getToken } from "@/lib/api";

export const Route = createFileRoute("/my-reports/$id")({
  beforeLoad: async ({ params }) => {
    const token = typeof window !== "undefined" ? getToken() : null;
    const raw = typeof window !== "undefined"
      ? localStorage.getItem("dn_auth_user_v2")
      : null;

    if (!token || !raw) {
      throw redirect({ to: "/login", search: { redirect: `/my-reports/${params.id}` } });
    }

    let user: { role: string } | null = null;
    try { user = JSON.parse(raw); } catch { /* ignore */ }
    if (!user) throw redirect({ to: "/login" });

    const role = parseBackendRole(user.role);
    if (AUTHORITY_ROLES.has(role) || role !== Role.CITIZEN) {
      throw redirect({ to: "/login" });
    }
  },
  head: ({ params }) => ({
    meta: [
      { title: `Phản ánh ${params.id} — Đà Nẵng Kết Nối` },
      { name: "description", content: `Trạng thái phản ánh ${params.id} và lịch sử xử lý.` },
    ],
  }),
  loader: ({ params }) => {
    const report = reports.find((r) => r.id === params.id);
    if (!report) throw notFound();
    return { report };
  },
  notFoundComponent: () => (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <h1 className="text-3xl font-heading text-gov-blue mb-3">Không tìm thấy phản ánh</h1>
      <p className="text-ink-soft mb-6">The report you're looking for doesn't exist.</p>
      <Link to="/my-reports" className="btn-civic btn-civic-primary">Quay lại danh sách</Link>
    </div>
  ),
  component: ReportDetail,
});


function ReportDetail() {
  const { report } = Route.useLoaderData();
  const { t, locale } = useI18n();

  const stages = ["pending", "inProgress", "resolved"] as const;
  const currentIdx = stages.indexOf(report.status as (typeof stages)[number]);

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-10 md:py-14">
      <Link to="/my-reports" className="inline-flex items-center gap-2 text-gov-blue font-semibold mb-6 hover:underline">
        <ArrowLeft size={18} /> {t("my.title")}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <StatusBadge status={report.status} />
        <span className="font-mono text-sm text-ink-soft">{report.id}</span>
      </div>

      <h1 className="font-heading text-3xl md:text-4xl text-gov-blue mb-4">{report.title[locale]}</h1>
      <p className="text-lg text-ink-soft mb-8 leading-relaxed">{report.description[locale]}</p>

      <div className="grid md:grid-cols-2 gap-6 mb-10">
        <img
          src={report.image}
          alt={report.title[locale]}
          loading="lazy"
          width={800}
          height={800}
          className="w-full aspect-square object-cover rounded-2xl card-civic p-0"
        />
        <div className="card-civic p-6 space-y-3">
          <div className="flex items-start gap-3">
            <MapPin className="text-gov-blue mt-1" size={20} />
            <div>
              <div className="text-xs uppercase font-bold text-ink-soft tracking-wider">Vị trí</div>
              <div className="text-base text-ink">{report.address[locale]}</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <User className="text-gov-blue mt-1" size={20} />
            <div>
              <div className="text-xs uppercase font-bold text-ink-soft tracking-wider">Người gửi</div>
              <div className="text-base text-ink">{report.reporter}</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock className="text-gov-blue mt-1" size={20} />
            <div>
              <div className="text-xs uppercase font-bold text-ink-soft tracking-wider">Thời gian</div>
              <div className="text-base text-ink">{report.createdAt}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <h2 className="text-2xl mb-5">Tiến trình xử lý / Resolution timeline</h2>
      <ol className="relative border-l-4 border-slate-200 pl-6 space-y-6">
        {stages.map((stage, i) => {
          const reached = i <= currentIdx || report.status === "urgent";
          const stageEntry = report.timeline.find((te: typeof report.timeline[number]) => te.status === stage);
          const label =
            stage === "pending" ? t("my.timeline.submitted")
            : stage === "inProgress" ? t("my.timeline.inProgress")
            : t("my.timeline.resolved");
          return (
            <li key={stage} className="relative">
              <span
                className={`absolute -left-[34px] w-7 h-7 rounded-full grid place-items-center border-4 ${
                  reached ? "bg-[var(--status-success)] border-white" : "bg-slate-200 border-white"
                }`}
              >
                {reached && <Check size={14} className="text-white" />}
              </span>
              <div className={`font-bold text-lg ${reached ? "text-ink" : "text-ink-soft"}`}>{label}</div>
              {stageEntry && (
                <div className="text-sm text-ink-soft">{stageEntry.label[locale]} · {stageEntry.at}</div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
