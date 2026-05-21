import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { reports as mockReports, kpis } from "@/lib/mock-data";
import { feedbackApi, type FeedbackResponse } from "@/lib/api";
import { StatusBadge } from "@/components/site/StatusBadge";
import danangMap from "@/assets/danang-map.jpg";
import { Camera, MapPin, User, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Đà Nẵng Lắng Nghe — Cổng phản ánh thành phố" },
      { name: "description", content: "Gửi phản ánh hạ tầng, môi trường, an ninh — cùng xây dựng Đà Nẵng văn minh." },
      { property: "og:title", content: "Đà Nẵng Lắng Nghe" },
      { property: "og:description", content: "Da Nang civic reporting platform — submit and track municipal reports." },
    ],
  }),
  component: HomePage,
});

import { type ReportStatus } from "@/lib/mock-data";

/** Map backend status → frontend status for StatusBadge */
function mapStatus(backendStatus: string): ReportStatus {
  const map: Record<string, ReportStatus> = {
    PENDING: "pending",
    ASSIGNED: "inProgress",
    IN_PROGRESS: "inProgress",
    WAITING_INFO: "pending",
    RESOLVED: "resolved",
    REJECTED: "urgent",
  };
  return map[backendStatus] || "pending";
}

function HomePage() {
  const { t, locale } = useI18n();
  const [apiFeedbacks, setApiFeedbacks] = useState<FeedbackResponse[]>([]);
  const [apiLoaded, setApiLoaded] = useState(false);
  const [loadingApi, setLoadingApi] = useState(false);

  // Thử load feedbacks từ backend
  useEffect(() => {
    loadFeedbacks();
  }, []);

  const loadFeedbacks = async () => {
    setLoadingApi(true);
    try {
      const data = await feedbackApi.getAll();
      setApiFeedbacks(data);
      setApiLoaded(true);
    } catch {
      // Backend chưa chạy → dùng mock data
      setApiLoaded(false);
    } finally {
      setLoadingApi(false);
    }
  };

  // Decide data source
  const hasApiData = apiLoaded && apiFeedbacks.length > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-14">
      {/* Hero */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
        <div className="max-w-2xl">
          <p className="text-gov-gold uppercase tracking-[0.2em] text-xs font-bold mb-3">
            Chính quyền điện tử · E-Government
          </p>
          <h1 className="font-heading text-4xl md:text-6xl text-gov-blue mb-5 leading-tight">
            {t("home.title")}
          </h1>
          <p className="text-lg md:text-xl text-ink-soft leading-relaxed">{t("home.subtitle")}</p>
        </div>
        <Link
          to="/report"
          className="btn-civic btn-civic-primary animate-civic-pulse text-xl px-8 py-5 self-start md:self-auto"
        >
          <Camera size={28} />
          <span className="flex flex-col items-start leading-tight">
            <span>{t("home.cta.report")}</span>
            <span className="text-xs font-medium text-white/80 normal-case">{t("home.cta.reportHint")}</span>
          </span>
        </Link>
      </section>

      {/* KPIs */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-14">
        {[
          { label: t("home.kpi.total"), value: hasApiData ? apiFeedbacks.length.toString() : kpis.total.toLocaleString(), accent: "border-gov-blue", val: "text-gov-blue" },
          { label: t("home.kpi.resolved"), value: hasApiData ? apiFeedbacks.filter(f => f.status === "RESOLVED").length.toString() : kpis.resolved.toLocaleString(), accent: "border-[var(--status-success)]", val: "text-[var(--status-success)]" },
          { label: t("home.kpi.pending"), value: hasApiData ? apiFeedbacks.filter(f => f.status === "PENDING").length.toString() : kpis.pending.toLocaleString(), accent: "border-[var(--status-pending)]", val: "text-[var(--status-pending)]" },
          { label: t("home.kpi.avg"), value: `${kpis.avgHours} ${locale === "vi" ? "giờ" : "hrs"}`, accent: "border-gov-gold", val: "text-ink" },
        ].map((k) => (
          <div key={k.label} className={`card-civic p-5 md:p-6 border-l-4 ${k.accent}`}>
            <div className="text-ink-soft text-xs md:text-sm font-bold uppercase tracking-wider mb-2">{k.label}</div>
            <div className={`text-2xl md:text-3xl font-bold ${k.val}`}>{k.value}</div>
          </div>
        ))}
      </section>

      {/* Data source indicator */}
      <div className="flex items-center gap-2 mb-4 text-sm text-ink-soft">
        <span className={`w-2 h-2 rounded-full ${hasApiData ? "bg-green-500" : "bg-amber-400"}`} />
        <span>
          {hasApiData
            ? (locale === "vi" ? "Dữ liệu thực từ Backend API" : "Live data from Backend API")
            : (locale === "vi" ? "Dữ liệu demo (Backend chưa kết nối)" : "Demo data (Backend offline)")}
        </span>
        <button onClick={loadFeedbacks} disabled={loadingApi} className="text-gov-blue hover:underline ml-2 inline-flex items-center gap-1">
          <RefreshCw size={14} className={loadingApi ? "animate-spin" : ""} />
          {locale === "vi" ? "Thử lại" : "Retry"}
        </button>
      </div>

      {/* Recent + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10">
        <section className="lg:col-span-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl md:text-3xl font-bold">{t("home.recent")}</h2>
            <div className="flex flex-wrap gap-2">
              {[t("home.filter.all"), t("home.filter.env"), t("home.filter.traffic"), t("home.filter.infra")].map(
                (f, i) => (
                  <button
                    key={f}
                    className={`min-h-[44px] px-4 py-2 rounded-md text-sm border font-semibold ${
                      i === 0 ? "bg-gov-blue text-white border-gov-blue" : "bg-white border-slate-200 text-ink hover:border-gov-blue"
                    }`}
                  >
                    {f}
                  </button>
                ),
              )}
            </div>
          </div>

          <div className="space-y-5">
            {/* Show API feedbacks if available, else mock data */}
            {hasApiData ? (
              apiFeedbacks.slice(0, 5).map((fb) => (
                <div key={fb.id} className="card-civic flex flex-col sm:flex-row overflow-hidden group hover:shadow-md transition-shadow">
                  <div className="p-5 md:p-6 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                      <StatusBadge status={mapStatus(fb.status)} />
                      <span className="text-ink-soft text-sm">{new Date(fb.createdAt).toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US")}</span>
                    </div>
                    <h3 className="text-lg md:text-xl font-bold mb-2 text-ink font-sans group-hover:text-gov-blue transition-colors">
                      {fb.title}
                    </h3>
                    <p className="text-ink-soft mb-3 leading-relaxed line-clamp-2">{fb.description}</p>
                    <div className="flex flex-wrap items-center text-sm text-ink-soft gap-4">
                      {fb.addressDetails && (
                        <span className="flex items-center gap-1.5"><MapPin size={16} /> {fb.addressDetails}</span>
                      )}
                      {fb.citizenName && (
                        <span className="flex items-center gap-1.5"><User size={16} /> {fb.citizenName}</span>
                      )}
                      <span className="font-mono text-xs text-ink-soft/70">{fb.trackingCode}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              mockReports.slice(0, 3).map((r) => (
                <Link
                  key={r.id}
                  to="/my-reports/$id"
                  params={{ id: r.id }}
                  className="card-civic flex flex-col sm:flex-row overflow-hidden group hover:shadow-md transition-shadow"
                >
                  <div className="sm:w-56 shrink-0 aspect-video sm:aspect-auto bg-slate-100">
                    <img src={r.image} alt={r.title[locale]} loading="lazy" width={400} height={400} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-5 md:p-6 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                      <StatusBadge status={r.status} />
                      <span className="text-ink-soft text-sm">{r.createdAt}</span>
                    </div>
                    <h3 className="text-lg md:text-xl font-bold mb-2 text-ink font-sans group-hover:text-gov-blue transition-colors">
                      {r.title[locale]}
                    </h3>
                    <p className="text-ink-soft mb-3 leading-relaxed">{r.description[locale]}</p>
                    <div className="flex flex-wrap items-center text-sm text-ink-soft gap-4">
                      <span className="flex items-center gap-1.5"><MapPin size={16} /> {r.district}, Đà Nẵng</span>
                      <span className="flex items-center gap-1.5"><User size={16} /> {r.reporter}</span>
                      <span className="font-mono text-xs text-ink-soft/70">{r.id}</span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        <aside className="lg:col-span-4 space-y-6">
          <div className="card-civic p-6">
            <h3 className="text-lg font-bold text-gov-blue mb-4">{t("home.map.title")}</h3>
            <div className="aspect-square rounded-xl overflow-hidden border border-slate-100 mb-4">
              <img src={danangMap} alt="Da Nang reports map" loading="lazy" width={1024} height={1024} className="w-full h-full object-cover" />
            </div>
            <Link to="/ward" className="btn-civic btn-civic-ghost w-full">
              {t("home.map.cta")}
            </Link>
          </div>

          <div className="bg-gov-blue rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-2xl font-bold mb-3 text-white font-heading">{t("home.hotline.title")}</h3>
              <p className="text-blue-100 mb-6 leading-relaxed">{t("home.hotline.body")}</p>
              <a href="tel:1022" className="inline-block text-3xl font-bold text-gov-gold tracking-widest hover:underline">
                (0236) 1022
              </a>
            </div>
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full" />
            <div className="absolute -right-4 -top-8 w-24 h-24 bg-gov-gold/10 rounded-full" />
          </div>
        </aside>
      </div>
    </div>
  );
}
