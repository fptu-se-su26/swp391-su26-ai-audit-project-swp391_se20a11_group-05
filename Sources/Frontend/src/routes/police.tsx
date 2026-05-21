import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { feedbackApi, type FeedbackResponse } from "@/lib/api";
import { reports as mockReports, type ReportStatus } from "@/lib/mock-data";
import { StatusBadge } from "@/components/site/StatusBadge";
import { RoleGuard } from "@/components/site/RoleGuard";
import { StaffShell } from "@/components/site/StaffShell";
import { AlertTriangle, Megaphone, ScanLine, Video, Loader2 } from "lucide-react";

export const Route = createFileRoute("/police")({
  head: () => ({
    meta: [
      { title: "Cổng Công an & CSGT — Đà Nẵng Lắng Nghe" },
      { name: "description", content: "Cổng dành cho lực lượng Công an, CSGT, PCCC — giám sát giao thông và an ninh." },
    ],
  }),
  component: PolicePage,
});

function PolicePage() {
  const { t, locale } = useI18n();
  
  const [apiFeedbacks, setApiFeedbacks] = useState<FeedbackResponse[]>([]);
  const [apiLoaded, setApiLoaded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    feedbackApi.getAll()
      .then(data => {
        // Filter traffic/urgent for police view
        // Depending on real API, this might need categoryId filtering or status filtering
        const filtered = data.filter(r => r.categoryName === "Giao thông" || r.status === "REJECTED");
        setApiFeedbacks(filtered);
        setApiLoaded(true);
      })
      .catch(() => {
        setApiLoaded(false);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const mapStatus = (s: string): ReportStatus => {
    const m: Record<string, ReportStatus> = {
      PENDING: "pending", ASSIGNED: "inProgress", IN_PROGRESS: "inProgress",
      WAITING_INFO: "pending", RESOLVED: "resolved", REJECTED: "urgent",
    };
    return m[s] || "pending";
  };

  const trafficReports = mockReports.filter((r) => r.category === "traffic" || r.status === "urgent");

  return (
    <RoleGuard roles={["police", "city_admin"]}>
      <StaffShell
        accent="red"
        eyebrow={locale === "vi" ? "Lực lượng phản ứng nhanh" : "Emergency forces"}
        title={t("police.title")}
        org="Công an Thành phố Đà Nẵng · CSGT · PCCC"
      >
        <div className="flex items-center justify-between mb-6">
          {!apiLoaded && !loading ? (
             <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                ⚠️ Demo mode
             </span>
          ) : <div />}
          <button className="btn-civic btn-civic-primary" style={{ background: "var(--status-danger)" }}>
            <Megaphone size={20} /> {t("police.broadcast")}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {[
            { icon: AlertTriangle, label: "Khẩn cấp đang xử lý", val: apiLoaded ? apiFeedbacks.filter(f => f.status === 'REJECTED').length : 4, color: "text-[var(--status-danger)]", border: "border-[var(--status-danger)]" },
            { icon: Video, label: "Video chờ thẩm tra", val: 12, color: "text-gov-blue", border: "border-gov-blue" },
            { icon: ScanLine, label: "Biển số đã OCR (24h)", val: 38, color: "text-[var(--status-pending)]", border: "border-[var(--status-pending)]" },
          ].map((c) => (
            <div key={c.label} className={`card-civic p-5 border-l-4 ${c.border} flex items-center gap-4`}>
              <c.icon className={c.color} size={36} />
              <div>
                <div className="text-xs uppercase font-bold text-ink-soft tracking-wider">{c.label}</div>
                <div className={`text-3xl font-bold ${c.color}`}>
                  {loading ? <Loader2 size={24} className="animate-spin inline" /> : c.val}
                </div>
              </div>
            </div>
          ))}
        </div>

        <h2 className="text-2xl mb-4">Phản ánh ưu tiên / Priority queue</h2>
        
        {loading && (
           <div className="flex items-center justify-center py-10">
              <Loader2 size={32} className="animate-spin text-[var(--status-danger)]" />
           </div>
        )}

        <div className="space-y-4">
          {/* API Data */}
          {!loading && apiLoaded && apiFeedbacks.map((r) => (
            <div key={r.id} className="card-civic p-5 md:p-6 grid md:grid-cols-12 gap-5">
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
          {!loading && !apiLoaded && trafficReports.map((r) => (
            <div key={r.id} className="card-civic p-5 md:p-6 grid md:grid-cols-12 gap-5">
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
      </StaffShell>
    </RoleGuard>
  );
}
