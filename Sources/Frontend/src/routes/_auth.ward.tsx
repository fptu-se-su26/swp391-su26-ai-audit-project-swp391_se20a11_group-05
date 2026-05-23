/**
 * _auth.ward.tsx — Ward Staff Dashboard
 *
 * Protected by TWO independent guards:
 *   1. _auth.tsx layout → checks user is authenticated + is an AUTHORITY role
 *   2. This route's beforeLoad → checks specifically for WARD_STAFF
 *
 * Any other authority role (POLICE, SUPER_ADMIN) navigating here gets
 * redirected to /login — they cannot view ward operations.
 */

import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { reports } from "@/lib/mock-data";
import { StatusBadge } from "@/components/site/StatusBadge";
import { StaffShell } from "@/components/site/StaffShell";
import { Role } from "@/lib/roles";
import danangMap from "@/assets/danang-map.jpg";
import { Check, MapPin, MessageSquare, X } from "lucide-react";

export const Route = createFileRoute("/_auth/ward")({
  beforeLoad: ({ context }) => {
    // context.currentUser is set by _auth.tsx layout — always present here
    const { currentUser } = context as { currentUser: { name: string; role: string; org: string } };

    // SECURITY: Narrow check — only WARD_STAFF may access this route
    if (currentUser.role !== Role.WARD_STAFF) {
      throw redirect({ to: "/login", search: { error: "forbidden" } });
    }
  },
  head: () => ({
    meta: [
      { title: "Cổng cán bộ phường — UBND Hải Châu I" },
      { name: "description", content: "Bảng điều khiển dành cho cán bộ phường: tiếp nhận, xử lý, hoàn thành phản ánh." },
      // SECURITY: Prevent indexing of staff portals
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: WardDashboard,
});

function WardDashboard() {
  const { t, locale } = useI18n();
  const [selected, setSelected] = useState(reports[0]);

  return (
    <StaffShell
      accent="blue"
      eyebrow={locale === "vi" ? "Cổng cán bộ phường" : "Ward officer portal"}
      title={t("ward.title")}
      org="UBND Phường Hải Châu I · Quận Hải Châu"
    >
      <div className="flex flex-wrap items-end justify-end gap-2 mb-6">
        {["Hôm nay", "Tuần này", "Tháng này"].map((p, i) => (
          <button
            key={p}
            className={`min-h-[44px] px-4 rounded-md font-semibold text-sm border ${
              i === 0 ? "bg-gov-blue text-white border-gov-blue" : "bg-white border-slate-200"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        <section className="lg:col-span-7">
          <div className="card-civic p-0 overflow-hidden mb-6">
            <div className="bg-gov-blue text-white p-4 flex items-center justify-between">
              <h2 className="text-white font-heading text-xl">Bản đồ nhiệt khu vực</h2>
              <span className="text-xs font-mono uppercase tracking-widest bg-white/10 px-3 py-1 rounded">Live</span>
            </div>
            <img
              src={danangMap}
              alt="Da Nang heatmap"
              loading="lazy"
              width={1024}
              height={1024}
              className="w-full h-72 md:h-96 object-cover"
            />
          </div>

          <h2 className="text-2xl mb-4">{t("ward.incoming")}</h2>
          <div className="space-y-3">
            {reports.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelected(r)}
                className={`w-full text-left card-civic p-4 flex gap-4 transition-all ${
                  selected.id === r.id ? "ring-2 ring-gov-blue" : "hover:shadow-md"
                }`}
              >
                <img src={r.image} alt="" loading="lazy" width={120} height={120} className="w-20 h-20 rounded-md object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <StatusBadge status={r.status} />
                    <span className="text-xs text-ink-soft ml-auto">{r.createdAt}</span>
                  </div>
                  <div className="font-bold text-ink truncate">{r.title[locale]}</div>
                  <div className="text-sm text-ink-soft flex items-center gap-1.5 mt-1">
                    <MapPin size={14} /> {r.district} · {r.ward}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        <aside className="lg:col-span-5">
          <div className="card-civic p-6 sticky top-32">
            <div className="flex items-start justify-between gap-3 mb-4">
              <StatusBadge status={selected.status} />
              <span className="font-mono text-sm text-ink-soft">{selected.id}</span>
            </div>
            <h3 className="text-xl font-bold mb-2 text-ink font-sans">{selected.title[locale]}</h3>
            <p className="text-ink-soft mb-4 leading-relaxed">{selected.description[locale]}</p>
            <img
              src={selected.image}
              alt={selected.title[locale]}
              loading="lazy"
              width={800}
              height={800}
              className="w-full aspect-video object-cover rounded-lg mb-4"
            />
            <div className="space-y-2 text-sm text-ink mb-6">
              <div><span className="font-semibold text-ink-soft">Vị trí:</span> {selected.address[locale]}</div>
              <div><span className="font-semibold text-ink-soft">Người gửi:</span> {selected.reporter}</div>
              <div><span className="font-semibold text-ink-soft">Loại:</span> {selected.category}</div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button className="btn-civic btn-civic-primary" style={{ background: "var(--status-success)" }}>
                <Check size={20} /> {t("ward.accept")}
              </button>
              <button className="btn-civic btn-civic-ghost" style={{ borderColor: "var(--status-danger)", color: "var(--status-danger)" }}>
                <X size={20} /> {t("ward.reject")}
              </button>
              <button className="btn-civic btn-civic-ghost sm:col-span-2">
                <MessageSquare size={20} /> Nhắn cho người dân
              </button>
              <button className="btn-civic btn-civic-primary sm:col-span-2">
                <Check size={20} /> {t("ward.resolve")}
              </button>
            </div>
          </div>
        </aside>
      </div>
    </StaffShell>
  );
}
