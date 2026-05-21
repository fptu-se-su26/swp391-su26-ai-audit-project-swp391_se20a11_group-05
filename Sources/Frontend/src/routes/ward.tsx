import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { feedbackApi, type FeedbackResponse } from "@/lib/api";
import { reports as mockReports, type ReportStatus } from "@/lib/mock-data";
import { StatusBadge } from "@/components/site/StatusBadge";
import { RoleGuard } from "@/components/site/RoleGuard";
import { StaffShell } from "@/components/site/StaffShell";
import danangMap from "@/assets/danang-map.jpg";
import { Check, Loader2, MapPin, MessageSquare, RefreshCw, X } from "lucide-react";

export const Route = createFileRoute("/ward")({
  head: () => ({
    meta: [
      { title: "Cổng cán bộ phường — UBND Hải Châu I" },
      { name: "description", content: "Bảng điều khiển dành cho cán bộ phường: tiếp nhận, xử lý, hoàn thành phản ánh." },
    ],
  }),
  component: WardDashboard,
});

function WardDashboard() {
  const { t, locale } = useI18n();

  const [apiFeedbacks, setApiFeedbacks] = useState<FeedbackResponse[]>([]);
  const [apiLoaded, setApiLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | number | null>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await feedbackApi.getAll();
      setApiFeedbacks(data);
      setApiLoaded(true);
      if (data.length > 0) setSelectedId(data[0].id);
    } catch {
      setApiLoaded(false);
      if (mockReports.length > 0) setSelectedId(mockReports[0].id);
    } finally {
      setLoading(false);
    }
  };

  const mapStatus = (s: string): ReportStatus => {
    const m: Record<string, ReportStatus> = {
      PENDING: "pending", ASSIGNED: "inProgress", IN_PROGRESS: "inProgress",
      WAITING_INFO: "pending", RESOLVED: "resolved", REJECTED: "urgent",
    };
    return m[s] || "pending";
  };

  const selected = apiLoaded
    ? apiFeedbacks.find((r) => r.id === selectedId)
    : mockReports.find((r) => r.id === selectedId);

  return (
    <RoleGuard roles={["ward", "city_admin"]}>
      <StaffShell
        accent="blue"
        eyebrow={locale === "vi" ? "Cổng cán bộ phường" : "Ward officer portal"}
        title={t("ward.title")}
        org="UBND Phường Hải Châu I · Quận Hải Châu"
      >
        {/* Toolbar */}
        <div className="flex flex-wrap items-end justify-between gap-2 mb-6">
          <div className="flex gap-2">
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
          <div className="flex items-center gap-3">
            {!apiLoaded && (
              <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                ⚠️ Demo mode
              </span>
            )}
            <button onClick={loadData} disabled={loading} className="btn-civic btn-civic-ghost flex items-center gap-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              {locale === "vi" ? "Làm mới" : "Refresh"}
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left: map + list */}
          <section className="lg:col-span-7">
            <div className="card-civic p-0 overflow-hidden mb-6">
              <div className="bg-gov-blue text-white p-4 flex items-center justify-between">
                <h2 className="text-white font-heading text-xl">Bản đồ nhiệt khu vực</h2>
                <span className="text-xs font-mono uppercase tracking-widest bg-white/10 px-3 py-1 rounded">Live</span>
              </div>
              <img src={danangMap} alt="Da Nang heatmap" loading="lazy" width={1024} height={1024} className="w-full h-72 md:h-96 object-cover" />
            </div>

            <h2 className="text-2xl mb-4">
              {t("ward.incoming")}
              {apiLoaded && <span className="ml-2 text-base font-normal text-ink-soft">({apiFeedbacks.length})</span>}
            </h2>

            {loading && (
              <div className="flex items-center justify-center py-10">
                <Loader2 size={32} className="animate-spin text-gov-blue" />
              </div>
            )}

            <div className="space-y-3">
              {/* API data list */}
              {!loading && apiLoaded && apiFeedbacks.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className={`w-full text-left card-civic p-4 flex gap-4 transition-all ${
                    selectedId === r.id ? "ring-2 ring-gov-blue" : "hover:shadow-md"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <StatusBadge status={mapStatus(r.status)} />
                      <span className="text-xs text-ink-soft ml-auto font-mono">{r.trackingCode}</span>
                    </div>
                    <div className="font-bold text-ink truncate">{r.title}</div>
                    {r.addressDetails && (
                      <div className="text-sm text-ink-soft flex items-center gap-1.5 mt-1">
                        <MapPin size={14} /> {r.addressDetails}
                      </div>
                    )}
                  </div>
                </button>
              ))}

              {/* Mock fallback list */}
              {!loading && !apiLoaded && mockReports.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className={`w-full text-left card-civic p-4 flex gap-4 transition-all ${
                    selectedId === r.id ? "ring-2 ring-gov-blue" : "hover:shadow-md"
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

          {/* Right: detail panel */}
          <aside className="lg:col-span-5">
            {selected && (
              <div className="card-civic p-6 sticky top-32">
                {apiLoaded ? (
                  <>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <StatusBadge status={mapStatus((selected as FeedbackResponse).status)} />
                      <span className="font-mono text-sm text-ink-soft">{(selected as FeedbackResponse).trackingCode}</span>
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-ink font-sans">{(selected as FeedbackResponse).title}</h3>
                    <p className="text-ink-soft mb-4 leading-relaxed">{(selected as FeedbackResponse).description}</p>
                    <div className="space-y-2 text-sm text-ink mb-6">
                      {(selected as FeedbackResponse).addressDetails && (
                        <div><span className="font-semibold text-ink-soft">Vị trí:</span> {(selected as FeedbackResponse).addressDetails}</div>
                      )}
                      {(selected as FeedbackResponse).citizenName && (
                        <div><span className="font-semibold text-ink-soft">Người gửi:</span> {(selected as FeedbackResponse).citizenName}</div>
                      )}
                      {(selected as FeedbackResponse).categoryName && (
                        <div><span className="font-semibold text-ink-soft">Loại:</span> {(selected as FeedbackResponse).categoryName}</div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <StatusBadge status={(selected as typeof mockReports[0]).status} />
                      <span className="font-mono text-sm text-ink-soft">{(selected as typeof mockReports[0]).id}</span>
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-ink font-sans">{(selected as typeof mockReports[0]).title[locale]}</h3>
                    <p className="text-ink-soft mb-4 leading-relaxed">{(selected as typeof mockReports[0]).description[locale]}</p>
                    <img src={(selected as typeof mockReports[0]).image} alt="" loading="lazy" width={800} height={800} className="w-full aspect-video object-cover rounded-lg mb-4" />
                    <div className="space-y-2 text-sm text-ink mb-6">
                      <div><span className="font-semibold text-ink-soft">Vị trí:</span> {(selected as typeof mockReports[0]).address[locale]}</div>
                      <div><span className="font-semibold text-ink-soft">Người gửi:</span> {(selected as typeof mockReports[0]).reporter}</div>
                      <div><span className="font-semibold text-ink-soft">Loại:</span> {(selected as typeof mockReports[0]).category}</div>
                    </div>
                  </>
                )}

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
            )}
          </aside>
        </div>
      </StaffShell>
    </RoleGuard>
  );
}
