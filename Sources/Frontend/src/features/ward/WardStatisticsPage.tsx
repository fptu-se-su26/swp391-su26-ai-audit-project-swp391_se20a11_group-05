import { useMemo, useState } from "react";
import type { ElementType, ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertCircle, CheckCircle2, Clock, FileText, TimerReset } from "lucide-react";
import { useFeedbacks } from "@/hooks";
import { useAuth } from "@/lib/auth";
import { getGroupedFeedbackStatus } from "@/lib/status";
import type { FeedbackResponse } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

type RangeKey = "7d" | "30d" | "90d" | "all";

const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: "7d", label: "7 ngày" },
  { key: "30d", label: "30 ngày" },
  { key: "90d", label: "90 ngày" },
  { key: "all", label: "Tất cả" },
];

const STATUS_COLORS = {
  pending: "#4F46E5",
  inProgress: "#D97706",
  resolved: "#059669",
  overdue: "#E11D48",
};

function formatDay(date: Date) {
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

function formatFullDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function mapCategoryName(feedback: FeedbackResponse) {
  const source = `${feedback.categoryCode || ""} ${feedback.categoryName || ""} ${feedback.category || ""}`.toLowerCase();
  if (source.includes("environment") || source.includes("moi truong") || source.includes("môi trường") || source.includes("rác")) {
    return "Môi trường";
  }
  if (source.includes("construction") || source.includes("xay dung") || source.includes("xây dựng")) {
    return "Xây dựng";
  }
  if (source.includes("traffic") || source.includes("giao thong") || source.includes("giao thông")) {
    return "Giao thông";
  }
  if (source.includes("fire") || source.includes("pccc") || source.includes("phòng cháy")) {
    return "PCCC";
  }
  return "Hạ tầng";
}

function isWardStaffCategory(feedback: FeedbackResponse) {
  const code = (feedback.categoryCode || "").toUpperCase();
  if (code) {
    return code === "URBAN_INFRASTRUCTURE" || code === "ENVIRONMENT" || code === "CONSTRUCTION";
  }

  const name = `${feedback.categoryName || ""} ${feedback.category || ""}`.toLowerCase();
  const isPolice =
    name.includes("an ninh") ||
    name.includes("security") ||
    name.includes("safety") ||
    name.includes("trật tự") ||
    name.includes("công an");
  const isFire = name.includes("phòng cháy") || name.includes("chữa cháy") || name.includes("fire");
  return !isPolice && !isFire;
}

function isOverdue(feedback: FeedbackResponse) {
  const status = (feedback.status || "").toUpperCase();
  const createdAt = new Date(feedback.createdAt);
  if (Number.isNaN(createdAt.getTime())) return false;
  const diffHours = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);

  return (
    ((status === "SUBMITTED" || status === "PENDING_RECEIVE") && diffHours > 24) ||
    ((status === "PENDING" || status === "PRE_EMPTIVE") && diffHours > 12)
  );
}

function filterByRange(feedbacks: FeedbackResponse[], range: RangeKey) {
  if (range === "all") return feedbacks;
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days + 1);
  cutoff.setHours(0, 0, 0, 0);
  return feedbacks.filter((feedback) => new Date(feedback.createdAt) >= cutoff);
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-slate-100 bg-white/95 p-3 shadow-md backdrop-blur-sm">
        <p className="text-[10px] font-bold text-slate-400 mb-1.5">{label}</p>
        {payload.map((pld: any) => (
          <div key={pld.name} className="flex items-center gap-4 justify-between text-xs py-0.5">
            <span className="flex items-center gap-1.5 font-semibold text-slate-600">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: pld.color }} />
              {pld.name}
            </span>
            <span className="font-mono font-bold text-slate-900">{pld.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

interface WardStatisticsPageProps {
  range?: RangeKey;
  setRange?: (range: RangeKey) => void;
  hideHeader?: boolean;
}

export function WardStatisticsPage({ range: propRange, setRange: propSetRange, hideHeader = false }: WardStatisticsPageProps = {}) {
  const { user } = useAuth();
  const [localRange, setLocalRange] = useState<RangeKey>("30d");
  const range = propRange ?? localRange;
  const setRange = propSetRange ?? setLocalRange;
  const { data: feedbacksPage, isLoading } = useFeedbacks(0, 500);

  const scopedFeedbacks = useMemo(() => {
    const source = feedbacksPage?.content ?? [];
    return source.filter((feedback) => {
      if (user?.wardId && feedback.wardId && feedback.wardId !== user.wardId) return false;
      return isWardStaffCategory(feedback);
    });
  }, [feedbacksPage?.content, user?.wardId]);

  const filteredFeedbacks = useMemo(
    () => filterByRange(scopedFeedbacks, range),
    [range, scopedFeedbacks],
  );

  const metrics = useMemo(() => {
    let pending = 0;
    let inProgress = 0;
    let resolved = 0;
    let rejected = 0;
    let overdue = 0;

    filteredFeedbacks.forEach((feedback) => {
      const group = getGroupedFeedbackStatus(feedback.status);
      if (group === "PENDING") pending += 1;
      if (group === "IN_PROGRESS") inProgress += 1;
      if (group === "RESOLVED") resolved += 1;
      if (group === "REJECTED") rejected += 1;
      if (isOverdue(feedback)) overdue += 1;
    });

    const total = filteredFeedbacks.length;
    const completionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
    return { total, pending, inProgress, resolved, rejected, overdue, completionRate };
  }, [filteredFeedbacks]);

  const trendData = useMemo(() => {
    const days = range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : 30;
    const buckets = new Map<string, { date: string; label: string; total: number; resolved: number }>();

    for (let index = days - 1; index >= 0; index -= 1) {
      const date = new Date();
      date.setDate(date.getDate() - index);
      date.setHours(0, 0, 0, 0);
      const key = date.toISOString().slice(0, 10);
      buckets.set(key, { date: key, label: formatDay(date), total: 0, resolved: 0 });
    }

    filteredFeedbacks.forEach((feedback) => {
      const date = new Date(feedback.createdAt);
      if (Number.isNaN(date.getTime())) return;
      const key = date.toISOString().slice(0, 10);
      const bucket = buckets.get(key);
      if (!bucket) return;
      bucket.total += 1;
      if (getGroupedFeedbackStatus(feedback.status) === "RESOLVED") {
        bucket.resolved += 1;
      }
    });

    return Array.from(buckets.values());
  }, [filteredFeedbacks, range]);

  const categoryData = useMemo(() => {
    const counts = new Map<string, number>();
    filteredFeedbacks.forEach((feedback) => {
      const category = mapCategoryName(feedback);
      counts.set(category, (counts.get(category) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredFeedbacks]);

  const statusData = useMemo(
    () => [
      { name: "Chờ xử lý", value: metrics.pending, color: STATUS_COLORS.pending },
      { name: "Đang xử lý", value: metrics.inProgress, color: STATUS_COLORS.inProgress },
      { name: "Đã xử lý", value: metrics.resolved, color: STATUS_COLORS.resolved },
      { name: "Quá hạn", value: metrics.overdue, color: STATUS_COLORS.overdue },
    ].filter((item) => item.value > 0),
    [metrics],
  );

  const hotspots = useMemo(() => {
    return [...filteredFeedbacks]
      .filter((feedback) => isOverdue(feedback) || getGroupedFeedbackStatus(feedback.status) !== "RESOLVED")
      .sort((a, b) => {
        const overdueDiff = Number(isOverdue(b)) - Number(isOverdue(a));
        if (overdueDiff !== 0) return overdueDiff;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .slice(0, 5);
  }, [filteredFeedbacks]);

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto py-6">
      {!hideHeader && (
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-slate-100 pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Thống kê phản ánh</h1>
            <p className="mt-1 text-sm text-slate-500 max-w-[65ch]">
              Phân tích xu hướng, tỷ lệ xử lý và các điểm cần ưu tiên trong địa bàn phụ trách.
            </p>
          </div>
          <div className="inline-flex rounded-xl bg-slate-100 p-1 ring-1 ring-slate-900/5 select-none">
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setRange(option.key)}
                className={`h-8 rounded-lg px-4 text-xs font-bold transition-all duration-200 active:scale-[0.98] ${
                  range === option.key
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </header>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={FileText} label="Tổng phản ánh" value={metrics.total} tone="indigo" loading={isLoading} />
        <StatCard icon={Clock} label="Đang xử lý" value={metrics.inProgress} tone="amber" loading={isLoading} />
        <StatCard icon={CheckCircle2} label="Đã xử lý" value={metrics.resolved} tone="emerald" loading={isLoading} />
        <StatCard icon={TimerReset} label="Quá hạn" value={metrics.overdue} tone="rose" loading={isLoading} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(360px,0.9fr)]">
        <Panel title="Xu hướng phản ánh theo thời gian">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="total" name="Tổng phản ánh" stroke="#4F46E5" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="resolved" name="Đã xử lý" stroke="#059669" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Tỷ lệ xử lý">
          <div className="grid min-h-[300px] place-items-center">
            {statusData.length === 0 ? (
              <EmptyChart />
            ) : (
              <div className="grid w-full gap-6 md:grid-cols-[180px_1fr] xl:grid-cols-1">
                <div className="relative h-[190px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statusData} innerRadius={58} outerRadius={82} paddingAngle={4} dataKey="value">
                        {statusData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-3xl font-black font-mono tracking-tight text-slate-900">{metrics.completionRate}%</span>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">Hoàn tất</span>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {statusData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-xs font-bold text-slate-600">
                      <span className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        {item.name}
                      </span>
                      <span className="font-mono font-bold text-slate-900">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(420px,0.85fr)]">
        <Panel title="Phản ánh theo lĩnh vực">
          <div className="h-[300px]">
            {categoryData.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" name="Số phản ánh" radius={[6, 6, 0, 0]} fill="#4F46E5" maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Panel>

        <Panel title="Điểm nóng cần chú ý">
          <div className="space-y-3">
            {isLoading ? (
              [1, 2, 3].map((item) => (
                <div key={item} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="mt-3 h-3 w-full" />
                </div>
              ))
            ) : hotspots.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center text-sm font-bold text-slate-400">
                Chưa có điểm nóng cần chú ý.
              </div>
            ) : (
              hotspots.map((feedback) => {
                const overdueStatus = isOverdue(feedback);
                return (
                  <div
                    key={feedback.id}
                    className="group relative rounded-xl border border-slate-100 bg-white p-4 shadow-sm hover:border-slate-200 hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="mb-2.5 flex flex-wrap items-center gap-2">
                          <span className="inline-block rounded-md bg-slate-50 border border-slate-100 px-2 py-0.5 text-[9px] font-bold font-mono text-slate-500">
                            {feedback.trackingCode || `#${feedback.id}`}
                          </span>
                          {overdueStatus && (
                            <span className="inline-block rounded-md border border-rose-100 bg-rose-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-rose-600">
                              Quá hạn
                            </span>
                          )}
                        </div>
                        <h3 className="text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors duration-200">
                          {feedback.title}
                        </h3>
                        <p className="mt-1.5 truncate text-[11px] font-semibold text-slate-500">
                          {feedback.addressDetails || feedback.address || "-"}
                        </p>
                        <p className="mt-1 text-[10px] font-mono text-slate-400">
                          {formatFullDate(feedback.createdAt)}
                        </p>
                      </div>
                      <span className={`grid h-7 w-7 place-items-center rounded-lg border ${
                        overdueStatus 
                          ? "bg-rose-50 text-rose-600 border-rose-100/50" 
                          : "bg-amber-50 text-amber-600 border-amber-100/50"
                      }`}>
                        <AlertCircle size={14} />
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-md transition-all duration-300">
      <h2 className="mb-5 border-b border-slate-100 pb-3 text-sm font-bold tracking-tight text-slate-900 uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
  loading,
}: {
  icon: ElementType;
  label: string;
  value: number;
  tone: "indigo" | "amber" | "emerald" | "rose";
  loading?: boolean;
}) {
  const styles = {
    indigo: "bg-indigo-50/70 text-indigo-600 border-indigo-100/50",
    amber: "bg-amber-50/70 text-amber-600 border-amber-100/50",
    emerald: "bg-emerald-50/70 text-emerald-600 border-emerald-100/50",
    rose: "bg-rose-50/70 text-rose-600 border-rose-100/50",
  };

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
        <span className={`grid h-9 w-9 place-items-center rounded-xl border ${styles[tone]}`}>
          <Icon size={18} />
        </span>
      </div>
      {loading ? (
        <Skeleton className="mt-3 h-8 w-16" />
      ) : (
        <p className="mt-2 text-3xl font-bold font-mono tracking-tight text-slate-900">{value}</p>
      )}
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-full min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
      <span className="text-slate-300 mb-2">
        <FileText size={28} strokeWidth={1.5} />
      </span>
      <p className="text-xs font-bold text-slate-400">Chưa có dữ liệu thống kê</p>
      <p className="text-[10px] text-slate-400 mt-1 max-w-[200px]">Không tìm thấy phản ánh nào trong phạm vi thời gian này.</p>
    </div>
  );
}
