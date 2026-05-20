import { createFileRoute } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { kpis, wardPerformance } from "@/lib/mock-data";
import { RoleGuard } from "@/components/site/RoleGuard";
import { StaffShell } from "@/components/site/StaffShell";
import adminHeatmap from "@/assets/admin-heatmap.jpg";
import { Download, Settings, Users } from "lucide-react";

export const Route = createFileRoute("/city-admin")({
  head: () => ({
    meta: [
      { title: "Bảng điều hành Lãnh đạo Thành phố — Đà Nẵng Lắng Nghe" },
      { name: "description", content: "Bảng điều hành cấp thành phố: KPI, hiệu suất phường, xuất báo cáo." },
    ],
  }),
  component: CityAdmin,
});

function CityAdmin() {
  const { t, locale } = useI18n();
  const maxResolved = Math.max(...wardPerformance.map((w) => w.resolved));

  return (
    <RoleGuard roles={["city_admin"]}>
      <StaffShell
        accent="gold"
        eyebrow={locale === "vi" ? "Lãnh đạo thành phố" : "City leadership"}
        title={t("city.title")}
        org="UBND Thành phố Đà Nẵng · Trung tâm IOC"
      >
        <div className="flex flex-wrap justify-end gap-2 mb-6">
          <button className="btn-civic btn-civic-ghost">
            <Users size={18} /> Quản lý tài khoản
          </button>
          <button className="btn-civic btn-civic-ghost">
            <Settings size={18} /> Cấu hình
          </button>
          <button className="btn-civic btn-civic-primary">
            <Download size={18} /> {t("city.export")}
          </button>
        </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: t("home.kpi.total"), val: kpis.total.toLocaleString(), border: "border-gov-blue", color: "text-gov-blue" },
          { label: t("home.kpi.resolved"), val: kpis.resolved.toLocaleString(), border: "border-[var(--status-success)]", color: "text-[var(--status-success)]" },
          { label: t("home.kpi.pending"), val: kpis.pending.toLocaleString(), border: "border-[var(--status-pending)]", color: "text-[var(--status-pending)]" },
          { label: "Tỷ lệ hài lòng", val: "94%", border: "border-gov-gold", color: "text-gov-blue" },
        ].map((k) => (
          <div key={k.label} className={`card-civic p-5 border-l-4 ${k.border}`}>
            <div className="text-xs uppercase font-bold text-ink-soft tracking-wider mb-2">{k.label}</div>
            <div className={`text-3xl font-bold ${k.color}`}>{k.val}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Heatmap */}
        <div className="lg:col-span-7 card-civic p-0 overflow-hidden">
          <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
            <h2 className="text-white font-heading text-xl">Bản đồ nhiệt toàn thành phố</h2>
            <span className="text-xs font-mono uppercase tracking-widest bg-[var(--status-danger)]/20 text-[var(--status-danger)] px-3 py-1 rounded">
              5 ổ nóng
            </span>
          </div>
          <img
            src={adminHeatmap}
            alt="Da Nang heatmap"
            loading="lazy"
            width={1280}
            height={896}
            className="w-full h-[420px] object-cover"
          />
        </div>

        {/* Ward leaderboard */}
        <div className="lg:col-span-5 card-civic p-6">
          <h2 className="text-xl mb-5">{t("city.kpi.wardPerf")}</h2>
          <ul className="space-y-4">
            {wardPerformance.map((w) => (
              <li key={w.ward}>
                <div className="flex justify-between mb-1.5">
                  <span className="font-semibold text-ink">{w.ward}</span>
                  <span className="text-sm text-ink-soft">{w.resolved} · {w.avgHrs}h</span>
                </div>
                <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-gov-blue"
                    style={{ width: `${(w.resolved / maxResolved) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Inter-agency routing */}
      <div className="mt-8 card-civic p-6">
        <h2 className="text-xl mb-4">Điều phối liên ngành / Inter-agency dispatch</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { name: "Điện lực EVN", count: 23, status: "ok" },
            { name: "Viễn thông VNPT", count: 8, status: "ok" },
            { name: "Cấp thoát nước DAWACO", count: 14, status: "warn" },
          ].map((p) => (
            <div key={p.name} className="border border-slate-200 rounded-xl p-5">
              <div className="font-bold text-ink mb-1">{p.name}</div>
              <div className="text-sm text-ink-soft mb-3">Đơn chờ xử lý: {p.count}</div>
              <button className="btn-civic btn-civic-ghost w-full text-sm">Chuyển đơn mới</button>
            </div>
          ))}
        </div>
      </div>
      </StaffShell>
    </RoleGuard>
  );
}
