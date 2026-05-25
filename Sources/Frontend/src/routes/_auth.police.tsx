/**
 * _auth.police.tsx — Police & Traffic Agency Dashboard
 *
 * Protected by TWO independent guards:
 *   1. _auth.tsx layout → checks AUTHORITY_ROLES membership
 *   2. This route's beforeLoad → checks specifically for POLICE role
 */

import { createFileRoute, redirect } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { useFeedbacks } from "@/lib/hooks";
import { reports as mockReports } from "@/lib/mock-data";
import { StatusBadge } from "@/components/site/StatusBadge";
import { StaffShell } from "@/components/site/StaffShell";
import { mapStatus } from "@/lib/status";
import { Sparkline, textClassToHex } from "@/components/site/KpiChart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Role } from "@/lib/roles";
import { AlertTriangle, Megaphone, ScanLine, Video, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_auth/police")({
  beforeLoad: ({ context }) => {
    const { currentUser } = context as { currentUser: { role: string } };

    // SECURITY: Only POLICE may access this route
    if (currentUser.role !== Role.POLICE) {
      throw redirect({ to: "/login", search: { error: "forbidden" } });
    }
  },
  head: () => ({
    meta: [
      { title: "Cổng Công an & CSGT — Đà Nẵng Kết Nối" },
      { name: "description", content: "Cổng dành cho lực lượng Công an, CSGT, PCCC — giám sát giao thông và an ninh." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PolicePage,
});

function PolicePage() {
  const { t, locale } = useI18n();

  const { data: feedbacksPage, isLoading } = useFeedbacks(0, 50);
  const hasApiData = !!feedbacksPage && feedbacksPage.content.length > 0;
  const apiFeedbacks = feedbacksPage?.content ?? [];

  // Filter traffic/urgent for police view
  const filteredApi = apiFeedbacks.filter(r => r.categoryName === "Giao thông" || r.status === "REJECTED");
  const trafficReports = mockReports.filter((r) => r.category === "traffic" || r.status === "urgent");

  return (
    <StaffShell
      accent="red"
      eyebrow={locale === "vi" ? "Lực lượng phản ứng nhanh" : "Emergency forces"}
      title={t("police.title")}
      org="Công an Thành phố Đà Nẵng · CSGT · PCCC"
    >
      <div className="flex justify-end mb-6">
        <button className="btn-civic btn-civic-primary" style={{ background: "var(--status-danger)" }}>
          <Megaphone size={20} /> {t("police.broadcast")}
        </button>
      </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {[
            { icon: AlertTriangle, label: "Khẩn cấp đang xử lý", val: hasApiData ? filteredApi.filter(f => f.status === 'REJECTED').length : 4, color: "text-[var(--status-danger)]", border: "border-[var(--status-danger)]", spark: [6, 8, 4, 7, 5, 9, 3, 6, 8, 4, 7, 5] },
            { icon: Video, label: "Video chờ thẩm tra", val: 12, color: "text-gov-blue", border: "border-gov-blue", spark: [15, 12, 18, 10, 14, 16, 11, 13, 9, 17, 12, 14] },
            { icon: ScanLine, label: "Biển số đã OCR (24h)", val: 38, color: "text-[var(--status-pending)]", border: "border-[var(--status-pending)]", spark: [28, 35, 32, 40, 38, 42, 36, 44, 38, 41, 37, 43] },
          ].map((c, idx) => (
            <div
              key={c.label}
              className={`card-civic p-5 border-l-4 ${c.border} flex flex-col hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 animate-fade-in-up stagger-${(idx % 4) + 1}`}
            >
              <div className="flex items-center gap-4 mb-1">
                <c.icon className={c.color} size={36} />
                <div className="flex-1">
                  <div className="text-xs uppercase font-bold text-ink-soft tracking-wider">{c.label}</div>
                  <div className={`text-3xl font-bold ${c.color}`}>
                    {isLoading ? <Loader2 size={24} className="animate-spin inline" /> : c.val}
                  </div>
                </div>
              </div>
              <Sparkline data={c.spark} color={textClassToHex(c.color)} height={32} />
            </div>
          ))}
        </div>

        <h2 className="text-2xl mb-4">Phản ánh ưu tiên / Priority queue</h2>

        {isLoading && (
           <div className="space-y-4">
             {[1, 2, 3].map((s) => (
               <div key={s} className="card-civic p-5 md:p-6 grid md:grid-cols-12 gap-5">
                 <div className="md:col-span-3">
                   <Skeleton className="w-full aspect-video md:aspect-square rounded-lg" />
                 </div>
                 <div className="md:col-span-6 space-y-3">
                   <div className="flex items-center gap-2">
                     <Skeleton className="h-6 w-16 rounded" />
                     <Skeleton className="h-6 w-24 rounded ml-auto" />
                   </div>
                   <Skeleton className="h-6 w-3/4 rounded" />
                   <Skeleton className="h-4 w-full rounded" />
                   <Skeleton className="h-4 w-1/2 rounded" />
                 </div>
                 <div className="md:col-span-3 flex flex-col gap-2">
                   <Skeleton className="h-10 w-full rounded" />
                   <Skeleton className="h-10 w-full rounded" />
                 </div>
               </div>
             ))}
           </div>
        )}

        <div className="space-y-4">
          {/* API Data */}
          {!isLoading && hasApiData && filteredApi.map((r, idx) => (
            <div
              key={r.id}
              className={`card-civic p-5 md:p-6 grid md:grid-cols-12 gap-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 animate-fade-in-up stagger-${(idx % 4) + 1}`}
            >
              <div className="md:col-span-3 bg-slate-100 w-full aspect-video md:aspect-square flex items-center justify-center rounded-lg text-slate-400">
                Không có ảnh
              </div>
              <div className="md:col-span-6">
                <div className="flex items-center gap-2 mb-2">
                  <StatusBadge status={mapStatus(r.status)} />
                  <span className="font-mono text-xs text-ink-soft">{r.trackingCode}</span>
                </div>
                <h3 className="text-lg font-bold mb-2 text-ink font-sans">{r.title}</h3>
                <p className="text-ink-soft text-sm mb-3">{r.description}</p>
                <div className="text-sm text-ink-soft">{r.addressDetails}</div>
              </div>
              <div className="md:col-span-3 flex flex-col gap-2">
                <button className="btn-civic btn-civic-primary text-sm bg-[var(--status-danger)] border-[var(--status-danger)]">
                  <Video size={18} /> Xem bằng chứng
                </button>
                <button className="btn-civic btn-civic-ghost text-sm">
                  Chuyển đơn vị khác
                </button>
              </div>
            </div>
          ))}

          {/* Fallback Mock Data */}
          {!isLoading && !hasApiData && trafficReports.map((r, idx) => (
            <div
              key={r.id}
              className={`card-civic p-5 md:p-6 grid md:grid-cols-12 gap-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 animate-fade-in-up stagger-${(idx % 4) + 1}`}
            >
              <img
                src={r.image}
                alt={r.title[locale]}
                loading="lazy"
                width={400}
                height={400}
                className="md:col-span-3 w-full aspect-video md:aspect-square object-cover rounded-lg"
              />
              <div className="md:col-span-6">
                <div className="flex items-center gap-2 mb-2">
                  <StatusBadge status={r.status} />
                  <span className="font-mono text-xs text-ink-soft">{r.id}</span>
                </div>
                <h3 className="text-lg font-bold mb-2 text-ink font-sans">{r.title[locale]}</h3>
                <p className="text-ink-soft text-sm mb-3">{r.description[locale]}</p>
                <div className="text-sm text-ink-soft">{r.address[locale]}</div>
              </div>
              <div className="md:col-span-3 flex flex-col gap-2">
                {r.licensePlate && (
                  <div className="bg-slate-900 text-[var(--status-danger)] p-3 rounded-lg text-center">
                    <div className="text-[10px] uppercase tracking-widest text-white/60">{t("police.licensePlate")}</div>
                    <div className="font-mono font-bold text-xl">{r.licensePlate}</div>
                  </div>
                )}
                <button className="btn-civic btn-civic-primary text-sm bg-[var(--status-danger)] border-[var(--status-danger)]">
                  <Video size={18} /> Xem video bằng chứng
                </button>
                <button className="btn-civic btn-civic-ghost text-sm">
                  Chuyển đơn vị khác
                </button>
              </div>
            </div>
          ))}
        </div>
        {/* Phản ánh theo ngày */}
        <div className="mt-8 card-civic p-6 animate-fade-in">
          <h2 className="text-xl font-bold text-ink mb-1">Phản ánh theo ngày / Daily reports</h2>
          <p className="text-sm text-ink-soft mb-5">7 ngày gần đây</p>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { day: "T2", count: 24 },
                  { day: "T3", count: 18 },
                  { day: "T4", count: 31 },
                  { day: "T5", count: 27 },
                  { day: "T6", count: 35 },
                  { day: "T7", count: 22 },
                  { day: "CN", count: 15 },
                ]}
                margin={{ top: 8, right: 16, bottom: 0, left: -16 }}
              >
                <XAxis dataKey="day" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    fontSize: 13,
                  }}
                />
                <Bar dataKey="count" fill="#ef4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>
    </StaffShell>
  );
}


