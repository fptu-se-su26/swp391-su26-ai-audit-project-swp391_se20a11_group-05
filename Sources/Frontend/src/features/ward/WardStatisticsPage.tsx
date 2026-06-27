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
  pending: "#2563EB",
  inProgress: "#F59E0B",
  resolved: "#10B981",
  overdue: "#EF4444",
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

export function WardStatisticsPage() {
  const { user } = useAuth();
  const [range, setRange] = useState<RangeKey>("30d");
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
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B2545]">Thống kê phản ánh</h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Phân tích xu hướng, tỷ lệ xử lý và các điểm cần ưu tiên trong địa bàn phụ trách.
          </p>
        </div>
        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setRange(option.key)}
              className={`h-9 rounded-lg px-4 text-xs font-black transition ${
                range === option.key
                  ? "bg-[#0F5BD8] text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-50 hover:text-[#0B2545]"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={FileText} label="Tổng phản ánh" value={metrics.total} tone="blue" loading={isLoading} />
        <StatCard icon={Clock} label="Đang xử lý" value={metrics.inProgress} tone="amber" loading={isLoading} />
        <StatCard icon={CheckCircle2} label="Đã xử lý" value={metrics.resolved} tone="emerald" loading={isLoading} />
        <StatCard icon={TimerReset} label="Quá hạn" value={metrics.overdue} tone="red" loading={isLoading} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(360px,0.9fr)]">
        <Panel title="Xu hướng phản ánh theo thời gian">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E4EAF2" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748B" }} interval="preserveStartEnd" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748B" }} />
                <Tooltip />
                <Line type="monotone" dataKey="total" name="Tổng phản ánh" stroke="#0F5BD8" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="resolved" name="Đã xử lý" stroke="#10B981" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Tỷ lệ xử lý">
          <div className="grid min-h-[300px] place-items-center">
            {statusData.length === 0 ? (
              <EmptyChart />
            ) : (
              <div className="grid w-full gap-4 md:grid-cols-[170px_1fr] xl:grid-cols-1">
                <div className="relative h-[190px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statusData} innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                        {statusData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                    <div>
                      <div className="text-2xl font-black text-[#0B2545]">{metrics.completionRate}%</div>
                      <div className="text-[10px] font-bold uppercase text-slate-400">Hoàn tất</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  {statusData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-xs font-bold text-slate-600">
                      <span className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        {item.name}
                      </span>
                      <span className="font-black text-[#0B2545]">{item.value}</span>
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
                <BarChart data={categoryData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E4EAF2" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748B" }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748B" }} />
                  <Tooltip />
                  <Bar dataKey="value" name="Số phản ánh" radius={[8, 8, 0, 0]} fill="#0F5BD8" />
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
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm font-bold text-slate-400">
                Chưa có điểm nóng cần chú ý.
              </div>
            ) : (
              hotspots.map((feedback) => (
                <div key={feedback.id} className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-white px-2 py-1 text-[10px] font-black text-[#0B2545] ring-1 ring-slate-200">
                          {feedback.trackingCode || `#${feedback.id}`}
                        </span>
                        {isOverdue(feedback) && (
                          <span className="rounded-md border border-red-100 bg-red-50 px-2 py-1 text-[10px] font-black text-red-600">
                            Quá hạn
                          </span>
                        )}
                      </div>
                      <h3 className="line-clamp-2 text-sm font-extrabold text-[#0B2545]">{feedback.title}</h3>
                      <p className="mt-2 truncate text-xs font-semibold text-slate-500">
                        {feedback.addressDetails || feedback.address || "-"}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-slate-400">{formatFullDate(feedback.createdAt)}</p>
                    </div>
                    <AlertCircle size={18} className={isOverdue(feedback) ? "text-red-500" : "text-amber-500"} />
                  </div>
                </div>
              ))
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-[#E4EAF2] bg-white p-5 shadow-sm">
      <h2 className="mb-4 border-b border-slate-100 pb-3 text-base font-extrabold text-[#0B2545]">
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
  tone: "blue" | "amber" | "emerald" | "red";
  loading?: boolean;
}) {
  const styles = {
    blue: "bg-blue-50 text-[#0F5BD8]",
    amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <div className="rounded-2xl border border-[#E4EAF2] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className={`grid h-11 w-11 place-items-center rounded-xl ${styles[tone]}`}>
          <Icon size={20} />
        </span>
      </div>
      <p className="mt-4 text-xs font-black uppercase tracking-wide text-slate-400">{label}</p>
      {loading ? (
        <Skeleton className="mt-2 h-8 w-16" />
      ) : (
        <p className="mt-1 text-3xl font-black text-[#0B2545]">{value}</p>
      )}
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="grid h-full min-h-[180px] place-items-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm font-bold text-slate-400">
      Chưa có dữ liệu trong khoảng thời gian này.
    </div>
  );
}
