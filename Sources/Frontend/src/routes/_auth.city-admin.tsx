/**
 * _auth.city-admin.tsx — City Leadership / Super Admin Dashboard
 *
 * Protected by TWO independent guards:
 *   1. _auth.tsx layout → checks AUTHORITY_ROLES membership
 *   2. This route's beforeLoad → checks specifically for SUPER_ADMIN
 */

import { createFileRoute, redirect } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useFeedbacks } from "@/lib/hooks";
import { useQuery } from "@tanstack/react-query";
import { analyticsApi, type KpiData, type WardPerformance, type MonthlyTrend, type DispatchAgency } from "@/lib/api";
import { kpis as mockKpis, wardPerformance as mockWardPerf, reports as mockReports } from "@/lib/mock-data";
import { DemoBanner } from "@/components/site/DemoBanner";
import { Skeleton } from "@/components/ui/skeleton";
import { RoleGuard } from "@/components/site/RoleGuard";
import { StaffShell } from "@/components/site/StaffShell";
import { Role } from "@/lib/roles";
import { DonutChart, HorizontalBarChart, Sparkline, textClassToHex } from "@/components/site/KpiChart";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar } from "recharts";
import { Download, Settings, Users, TrendingUp, CloudRain, Wind, Thermometer, Droplets, AlertTriangle, MapPin, RefreshCw } from "lucide-react";
import { weatherApi, WeatherForecastResponse, AlertLevel, RiskLevel } from "@/lib/api";
import { useFeedbackNotification } from "@/lib/useNotification";

export const Route = createFileRoute("/_auth/city-admin")({
  beforeLoad: ({ context }) => {
    const { currentUser } = context as { currentUser: { role: string } };

    // SECURITY: Only SUPER_ADMIN may access the city leadership dashboard
    if (currentUser.role !== Role.SUPER_ADMIN) {
      throw redirect({ to: "/login", search: { error: "forbidden" } });
    }
  },
  head: () => ({
    meta: [
      { title: "Bảng điều hành Lãnh đạo Thành phố — Đà Nẵng Kết Nối" },
      { name: "description", content: "Bảng điều hành cấp thành phố: KPI, hiệu suất phường, xuất báo cáo." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: CityAdmin,
});

function CityAdmin() {
  const { t, locale } = useI18n();
  useFeedbackNotification(); // WebSocket real-time updates

  const { data: feedbacksPage, isLoading } = useFeedbacks(0, 200);
  const { data: analyticsKpi, isLoading: kpiLoading } = useQuery<KpiData>({
    queryKey: ["analytics", "kpi"],
    queryFn: () => analyticsApi.kpi(),
    staleTime: 60_000,
  });
  const { data: wardPerf, isLoading: wardLoading } = useQuery<WardPerformance[]>({
    queryKey: ["analytics", "ward-performance"],
    queryFn: () => analyticsApi.wardPerformance(),
    staleTime: 60_000,
  });
  const { data: monthlyTrend, isLoading: trendLoading } = useQuery<MonthlyTrend[]>({
    queryKey: ["analytics", "monthly-trend"],
    queryFn: () => analyticsApi.monthlyTrend(12),
    staleTime: 60_000,
  });
  const { data: dispatchAgencies } = useQuery<DispatchAgency[]>({
    queryKey: ["analytics", "dispatch"],
    queryFn: () => analyticsApi.dispatch(),
    staleTime: 60_000,
  });

  const hasApiData = !!feedbacksPage && feedbacksPage.content.length > 0;
  const apiFeedbacks = feedbacksPage?.content ?? [];

  // Resolve KPI: analytics API → feedback-based fallback → mock
  const currentKpis: { total: number; resolved: number; pending: number; satisfactionRate: string } =
    analyticsKpi ?? (hasApiData ? {
      total: apiFeedbacks.length,
      resolved: apiFeedbacks.filter(d => d.status === "RESOLVED").length,
      pending: apiFeedbacks.filter(d => d.status !== "RESOLVED").length,
      satisfactionRate: "Đang tính...",
    } : { total: mockKpis.total, resolved: mockKpis.resolved, pending: mockKpis.pending, satisfactionRate: "94%" });

  const isApi = !!(analyticsKpi || hasApiData);

  const wardData = wardPerf ?? mockWardPerf;
  const maxResolved = Math.max(...wardData.map((w: WardPerformance) => w.resolved));

  return (
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
          { label: t("home.kpi.total"), val: currentKpis.total.toLocaleString(), border: "border-gov-blue", color: "text-gov-blue", spark: [42, 56, 48, 72, 65, 80, 78, 92, 88, 95, 102, 98] },
          { label: t("home.kpi.resolved"), val: currentKpis.resolved.toLocaleString(), border: "border-[var(--status-success)]", color: "text-[var(--status-success)]", spark: [30, 45, 38, 52, 48, 60, 58, 70, 68, 75, 82, 78] },
          { label: t("home.kpi.pending"), val: currentKpis.pending.toLocaleString(), border: "border-[var(--status-pending)]", color: "text-[var(--status-pending)]", spark: [18, 22, 15, 25, 20, 18, 28, 22, 16, 20, 18, 12] },
          { label: "Tỷ lệ hài lòng", val: analyticsKpi ? analyticsKpi.satisfactionRate : "Đang tính...", border: "border-gov-gold", color: "text-gov-blue", spark: [88, 90, 85, 92, 91, 94, 93, 95, 92, 94, 93, 94] },
        ].map((k, idx) => (
          <div
            key={k.label}
            className={`card-civic p-5 border-l-4 ${k.border} hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 animate-fade-in-up stagger-${(idx % 4) + 1}`}
          >
            <div className="text-xs uppercase font-bold text-ink-soft tracking-wider mb-2">{k.label}</div>
            <div className={`text-3xl font-bold ${k.color}`}>
              {kpiLoading && !analyticsKpi ? <Skeleton className="h-9 w-20 rounded" /> : k.val}
            </div>
            <Sparkline data={k.spark} color={textClassToHex(k.color)} height={36} />
          </div>
        ))}
      </div>

      {/* Donut + Ward Performance */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <DonutChart resolved={currentKpis.resolved} pending={currentKpis.pending} />
        <HorizontalBarChart
          data={wardData.map((w: WardPerformance) => ({ name: w.name, value: w.resolved }))}
          title={t("city.kpi.wardPerf")}
          color="#2563eb"
          unit=""
        />
      </div>

      {/* Monthly trend */}
      <div className="card-civic p-6 mb-8 animate-fade-in">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp size={20} className="text-gov-blue" />
          <h2 className="text-xl font-bold text-ink">Tổng quan / Overview</h2>
        </div>
        <p className="text-sm text-ink-soft mb-5">Xu hướng phản ánh 12 tháng gần đây</p>
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={monthlyTrend ?? [
                { month: "T6", total: 82, resolved: 58 },
                { month: "T7", total: 95, resolved: 62 },
                { month: "T8", total: 88, resolved: 60 },
                { month: "T9", total: 110, resolved: 75 },
                { month: "T10", total: 104, resolved: 70 },
                { month: "T11", total: 120, resolved: 82 },
                { month: "T12", total: 98, resolved: 68 },
                { month: "T1", total: 76, resolved: 54 },
                { month: "T2", total: 92, resolved: 66 },
                { month: "T3", total: 108, resolved: 78 },
                { month: "T4", total: 115, resolved: 85 },
                { month: "T5", total: 102, resolved: 72 },
              ]}
              margin={{ top: 8, right: 16, bottom: 0, left: -16 }}
            >
              <defs>
                <linearGradient id="trendTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="trendResolved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: 13 }} />
              <Area type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={2} fill="url(#trendTotal)" name="Tổng số" />
              <Area type="monotone" dataKey="resolved" stroke="#22c55e" strokeWidth={2} fill="url(#trendResolved)" name="Đã xử lý" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Map */}
        <div className="lg:col-span-7 card-civic p-0 overflow-hidden animate-fade-in">
          <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
            <h2 className="text-white font-heading text-xl">Bản đồ nhiệt toàn thành phố</h2>
            <span className="text-xs font-mono uppercase tracking-widest bg-[var(--status-danger)]/20 text-[var(--status-danger)] px-3 py-1 rounded">
              {apiFeedbacks.filter(f => f.latitude && f.longitude).length} điểm
            </span>
          </div>
          <Suspense fallback={<div className="w-full h-[420px] bg-slate-800 animate-pulse" />}>
            <CivicMap
              center={[16.0544, 108.2022]}
              zoom={12}
              markers={apiFeedbacks.length > 0
                ? apiFeedbacks.filter(f => f.latitude && f.longitude).slice(0, 50).map(f => ({
                    position: [f.latitude!, f.longitude!] as [number, number],
                    title: f.title,
                    description: f.description,
                    status: mapStatus(f.status) as any,
                  }))
                : [
                    { position: [16.062, 108.222], title: mockReports[0].title.vi, status: mockReports[0].status },
                    { position: [16.080, 108.155], title: mockReports[1].title.vi, status: mockReports[1].status },
                    { position: [16.078, 108.158], title: mockReports[2].title.vi, status: mockReports[2].status },
                    { position: [16.060, 108.228], title: mockReports[3].title.vi, status: mockReports[3].status },
                    { position: [16.070, 108.210], title: "Phản ánh hạ tầng Hải Châu", status: "inProgress" },
                    { position: [16.048, 108.215], title: "Phản ánh môi trường Sơn Trà", status: "pending" },
                    { position: [16.065, 108.240], title: "Phản ánh an toàn Ngũ Hành Sơn", status: "urgent" },
                    { position: [16.092, 108.175], title: "Phản ánh giao thông Thanh Khê", status: "resolved" },
                    { position: [16.040, 108.180], title: "Phản ánh vệ sinh Cẩm Lệ", status: "pending" },
                  ]
              }
              height="420px"
            />
          </Suspense>
        </div>

        {/* Ward leaderboard — now from API */}
        <div className="lg:col-span-5 card-civic p-6">
          <h2 className="text-xl mb-5">{t("city.kpi.wardPerf")}</h2>
          {wardLoading && !wardPerf ? (
            <div className="space-y-4">
              {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-10 rounded" />)}
            </div>
          ) : (
          <ul className="space-y-4">
            {wardData.map((w: WardPerformance, idx: number) => (
              <li key={w.name} className={`animate-fade-in-up stagger-${(idx % 4) + 1}`}>
                <div className="flex justify-between mb-1.5">
                  <span className="font-semibold text-ink">{w.name}</span>
                  <span className="text-sm text-ink-soft">{w.resolved} · {w.satisfactionPct}%</span>
                </div>
                <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-gov-blue" style={{ width: `${(w.resolved / maxResolved) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
          )}
        </div>
      </div>

      {/* Inter-agency dispatch — now from API */}
      <div className="mt-8 card-civic p-6 animate-slide-in-right">
        <h2 className="text-xl mb-4">Điều phối liên ngành / Inter-agency dispatch</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {(dispatchAgencies ?? [
            { name: "Điện lực EVN", pendingCount: 23, status: "ok" },
            { name: "Viễn thông VNPT", pendingCount: 8, status: "ok" },
            { name: "Cấp thoát nước DAWACO", pendingCount: 14, status: "warn" },
          ]).map((p: DispatchAgency) => (
            <div key={p.name} className="border border-slate-200 rounded-xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <div className="font-bold text-ink mb-1">{p.name}</div>
              <div className="text-sm text-ink-soft mb-3">Đơn chờ xử lý: {p.pendingCount}</div>
              <button className="btn-civic btn-civic-ghost w-full text-sm">Chuyển đơn mới</button>
            </div>
          ))}
        </div>
      </div>
      {/* Weather Panel */}
      <WeatherForecastPanel />

    </StaffShell>
  );
}

function mapStatus(s: string): string {
  const m: Record<string, string> = {
    PENDING: "pending", ASSIGNED: "inProgress", IN_PROGRESS: "inProgress",
    WAITING_INFO: "pending", RESOLVED: "resolved", REJECTED: "urgent", PRE_EMPTIVE: "pending",
  };
  return m[s] || "pending";
}

// ─── Weather Forecast Panel ──────────────────────────────────────────

const ALERT_CONFIG: Record<AlertLevel, { bg: string; border: string; text: string; icon: string }> = {
  NORMAL:  { bg: "bg-emerald-50",  border: "border-emerald-400", text: "text-emerald-700", icon: "🟢" },
  WATCH:   { bg: "bg-yellow-50",   border: "border-yellow-400",  text: "text-yellow-700",  icon: "🟡" },
  WARNING: { bg: "bg-orange-50",   border: "border-orange-400",  text: "text-orange-700",  icon: "🟠" },
  DANGER:  { bg: "bg-red-50",      border: "border-red-500",     text: "text-red-700",     icon: "🔴" },
};

const RISK_BADGE: Record<RiskLevel, string> = {
  LOW:      "bg-emerald-100 text-emerald-700",
  MEDIUM:   "bg-yellow-100  text-yellow-700",
  HIGH:     "bg-orange-100  text-orange-700",
  CRITICAL: "bg-red-100     text-red-700",
};

const INCIDENT_ICON: Record<string, string> = {
  FLOOD:       "🌊",
  FALLEN_TREE: "🌳",
  ROAD_DAMAGE: "🛣️",
  POWER_OUTAGE:"⚡",
};

function WeatherForecastPanel() {
  const [forecast, setForecast] = useState<WeatherForecastResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await weatherApi.getForecast();
      setForecast(data);
      setLastUpdated(new Date());
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const alert = forecast ? ALERT_CONFIG[forecast.alertLevel] : ALERT_CONFIG.NORMAL;

  return (
    <div className="mt-8 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CloudRain size={22} className="text-gov-blue" />
          <h2 className="text-xl font-bold text-ink">Dự báo Thời tiết & Cảnh báo Sự cố Đô thị</h2>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-ink-soft">Cập nhật: {lastUpdated.toLocaleTimeString("vi-VN")}</span>
          )}
          <button onClick={load} disabled={loading} className="btn-civic btn-civic-ghost flex items-center gap-1.5 text-sm">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Làm mới
          </button>
        </div>
      </div>

      {loading && !forecast && (
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      )}

      {forecast && (
        <>
          <div className={`rounded-xl border-l-4 p-4 mb-6 ${alert.bg} ${alert.border}`}>
            <p className={`font-semibold text-sm ${alert.text}`}>{forecast.alertMessage}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { icon: <Thermometer size={20} className="text-orange-500" />, label: "Nhiệt độ",  val: `${forecast.current.temperature.toFixed(1)}°C` },
              { icon: <CloudRain   size={20} className="text-blue-500"   />, label: "Lượng mưa", val: `${forecast.current.precipitation.toFixed(1)}mm` },
              { icon: <Wind        size={20} className="text-slate-500"  />, label: "Gió",        val: `${forecast.current.windspeed.toFixed(1)}km/h` },
              { icon: <Droplets    size={20} className="text-cyan-500"   />, label: "Độ ẩm",     val: `${forecast.current.relativeHumidity.toFixed(0)}%` },
            ].map((k) => (
              <div key={k.label} className="card-civic p-4 flex items-center gap-3">
                <div className="p-2 bg-slate-50 rounded-lg">{k.icon}</div>
                <div>
                  <div className="text-xs text-ink-soft">{k.label}</div>
                  <div className="text-xl font-bold text-ink">{k.val}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="card-civic p-5">
              <h3 className="font-bold text-ink mb-4">📊 Biểu đồ Mưa 24h Tới</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={forecast.next24Hours.slice(0, 24).map((h) => ({ time: h.time.slice(11, 16), rain: h.precipitation, wind: h.windspeed }))} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                    <XAxis dataKey="time" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} interval={3} />
                    <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid #e2e8f0" }} formatter={(val: number, name: string) => [name === "rain" ? `${val}mm` : `${val}km/h`, name === "rain" ? "Mưa" : "Gió"]} />
                    <Bar dataKey="rain" fill="#3b82f6" radius={[3, 3, 0, 0]} name="rain" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card-civic p-5">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={18} className="text-orange-500" />
                <h3 className="font-bold text-ink">Điểm Nguy Cơ Dự Đoán</h3>
                {forecast.predictedHotspots && forecast.predictedHotspots.length > 0 && (
                  <span className="ml-auto text-xs font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                    {forecast.predictedHotspots.length} điểm
                  </span>
                )}
              </div>
              {!forecast.predictedHotspots || forecast.predictedHotspots.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-36 text-ink-soft text-sm">
                  <span className="text-3xl mb-2">✅</span>
                  Không có điểm nguy cơ cao trong 24h tới
                </div>
              ) : (
                <ul className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {forecast.predictedHotspots.map((h, i) => (
                    <li key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                      <span className="text-xl mt-0.5">{INCIDENT_ICON[h.incidentType] ?? "⚠️"}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-ink text-sm">{h.wardName}</span>
                          <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${RISK_BADGE[h.riskLevel]}`}>{h.riskLevel}</span>
                          <span className="text-xs text-ink-soft">{h.incidentLabel}</span>
                        </div>
                        <p className="text-xs text-ink-soft mt-0.5 line-clamp-2">{h.reason}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-lg font-bold text-ink">{h.riskScore}</div>
                        <div className="text-xs text-ink-soft">/ 100</div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
