import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, lazy, Suspense } from "react";
import { useI18n } from "@/lib/i18n";
import { useFeedbacks } from "@/lib/hooks";
import { reports as mockReports, type ReportStatus } from "@/lib/mock-data";
import { StatusBadge } from "@/components/site/StatusBadge";
import { DemoBanner } from "@/components/site/DemoBanner";
import { Skeleton } from "@/components/ui/skeleton";
import { RoleGuard } from "@/components/site/RoleGuard";
import { StaffShell } from "@/components/site/StaffShell";
import { Check, Loader2, MapPin, MessageSquare, RefreshCw, X, FileText } from "lucide-react";

const CivicMap = lazy(() => import("@/components/site/CivicMap").then(m => ({ default: m.CivicMap })));

export const Route = createFileRoute("/ward")({
  head: () => ({
    meta: [
      { title: "Cổng cán bộ phường — UBND Hải Châu I" },
      { name: "description", content: "Bảng điều khiển dành cho cán bộ phường: tiếp nhận, xử lý, hoàn thành phản ánh." },
    ],
  }),
  component: WardDashboard,
});

function mapStatus(s: string): ReportStatus {
  const m: Record<string, ReportStatus> = {
    PENDING: "pending", ASSIGNED: "inProgress", IN_PROGRESS: "inProgress",
    WAITING_INFO: "pending", RESOLVED: "resolved", REJECTED: "urgent",
  };
  return m[s] || "pending";
}

import type { FeedbackResponse } from "@/lib/api";

function WardDashboard() {
  const { t, locale } = useI18n();
  const { data: feedbacksPage, isLoading, isFetching, refetch } = useFeedbacks(0, 50);

  const [selectedId, setSelectedId] = useState<string | number | null>(null);

  const hasApiData = !!feedbacksPage && feedbacksPage.content.length > 0;
  const apiFeedbacks = feedbacksPage?.content ?? [];

  // Auto-select first item when data loads
  useEffect(() => {
    if (selectedId !== null) return;
    if (hasApiData && apiFeedbacks.length > 0) {
      setSelectedId(apiFeedbacks[0].id);
    } else if (!hasApiData && mockReports.length > 0) {
      setSelectedId(mockReports[0].id);
    }
  }, [hasApiData, apiFeedbacks, selectedId]);

  const selected = hasApiData
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
        {/* Demo banner */}
        {!hasApiData && !isLoading && <DemoBanner />}

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
            <button onClick={() => refetch()} disabled={isFetching} className="btn-civic btn-civic-ghost flex items-center gap-2">
              {isFetching ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              {locale === "vi" ? "Làm mới" : "Refresh"}
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left: map + list */}
          <section className="lg:col-span-7 animate-slide-in-right">
            <div className="card-civic p-0 overflow-hidden mb-6">
              <div className="bg-gov-blue text-white p-4 flex items-center justify-between">
                <h2 className="text-white font-heading text-xl">Bản đồ nhiệt khu vực</h2>
                <span className="text-xs font-mono uppercase tracking-widest bg-white/10 px-3 py-1 rounded">Live</span>
              </div>
              <Suspense fallback={<div className="w-full h-72 md:h-96 bg-slate-100 animate-pulse" />}>
                <CivicMap
                  center={[16.062, 108.222]}
                  zoom={14}
                  markers={[
                    { position: [16.062, 108.222], title: mockReports[0].title.vi, status: mockReports[0].status },
                    { position: [16.080, 108.155], title: mockReports[1].title.vi, status: mockReports[1].status },
                    { position: [16.078, 108.158], title: mockReports[2].title.vi, status: mockReports[2].status },
                    { position: [16.060, 108.228], title: mockReports[3].title.vi, status: mockReports[3].status },
                  ]}
                />
              </Suspense>
            </div>

            <h2 className="text-2xl mb-4">
              {t("ward.incoming")}
              {hasApiData && <span className="ml-2 text-base font-normal text-ink-soft">({apiFeedbacks.length})</span>}
            </h2>

            {isLoading && (
              <div className="space-y-3">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="card-civic p-4 flex gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-6 w-16 rounded" />
                        <Skeleton className="h-6 w-24 rounded ml-auto" />
                      </div>
                      <Skeleton className="h-5 w-3/4 rounded" />
                      <Skeleton className="h-4 w-1/2 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-3">
              {/* API data list */}
              {!isLoading && hasApiData && apiFeedbacks.map((r, idx) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className={`w-full text-left card-civic p-4 flex gap-4 transition-all duration-200 ${
                    selectedId === r.id ? "ring-2 ring-gov-blue" : "hover:shadow-md hover:-translate-y-0.5"
                  } animate-fade-in-up stagger-${(idx % 4) + 1}`}
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
              {!isLoading && !hasApiData && mockReports.map((r, idx) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className={`w-full text-left card-civic p-4 flex gap-4 transition-all duration-200 ${
                    selectedId === r.id ? "ring-2 ring-gov-blue" : "hover:shadow-md hover:-translate-y-0.5"
                  } animate-fade-in-up stagger-${(idx % 4) + 1}`}
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
            {selected ? (
              <div className="animate-fade-in card-civic p-6 sticky top-32">
                {hasApiData ? (
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
                  <button className="btn-civic bg-[var(--status-success)] text-white border-[var(--status-success)] hover:brightness-110 transition-all shadow-lg shadow-green-500/25">
                    <Check size={20} /> {t("ward.accept")}
                  </button>
                  <button className="btn-civic border-[var(--status-danger)] text-[var(--status-danger)] hover:bg-[var(--status-danger)]/10 transition-all">
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
            ) : (
              <div className="animate-fade-in card-civic p-10 sticky top-32 flex flex-col items-center justify-center text-center">
                <FileText size={48} className="text-slate-300 mb-4" />
                <h3 className="text-lg font-semibold text-ink-soft mb-1">
                  {locale === "vi" ? "Chưa chọn phản ánh" : "No report selected"}
                </h3>
                <p className="text-sm text-ink-soft/60">
                  {locale === "vi"
                    ? "Chọn một phản ánh từ danh sách bên trái để xem chi tiết."
                    : "Select a report from the list on the left to view details."}
                </p>
              </div>
            )}
          </aside>
        </div>
      </StaffShell>
    </RoleGuard>
  );
}
