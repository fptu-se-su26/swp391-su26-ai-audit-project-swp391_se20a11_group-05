import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { wardRankingApi, getToken } from "@/lib/api";
import {
  Trophy,
  Zap,
  Star,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileText,
  AlertTriangle,
  Award,
  BarChart3,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

export const Route = createFileRoute("/leaderboard/$wardId")({
  beforeLoad: ({ location }) => {
    if (typeof window !== "undefined") {
      const token = getToken();
      if (!token) {
        throw redirect({
          to: "/login",
          search: {
            redirect: location.href,
          },
        });
      }
    }
  },
  component: WardDetailPage,
});

const BADGE_META: Record<string, { label: string; icon: typeof Trophy; color: string; bg: string }> = {
  TOP_PERFORMER: { label: "Top Performer", icon: Trophy, color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
  FASTEST_RESPONDER: { label: "Phản hồi nhanh nhất", icon: Zap, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
  RISING_STAR: { label: "Ngôi sao đang lên", icon: Star, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
  MOST_IMPROVED: { label: "Tiến bộ nhất", icon: TrendingUp, color: "text-violet-600", bg: "bg-violet-50 border-violet-200" },
};

const MONTH_LABELS = ["", "T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];

function WardDetailPage() {
  const { wardId } = Route.useParams();

  const { data: ward, isLoading, error } = useQuery({
    queryKey: ["ward-ranking", "detail", wardId],
    queryFn: () => wardRankingApi.getWardDetail(wardId),
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 text-slate-400">
        <Loader2 size={40} className="animate-spin" />
        <p className="mt-4 text-sm font-medium">Đang tải thông tin phường...</p>
      </div>
    );
  }

  if (error || !ward) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 text-red-400">
        <AlertCircle size={40} />
        <p className="mt-4 text-sm font-medium">Không thể tải dữ liệu phường.</p>
        <Link to="/leaderboard" className="mt-4 text-sm font-bold text-violet-500 hover:underline">
          ← Quay lại bảng xếp hạng
        </Link>
      </div>
    );
  }

  const chartData = [...ward.history]
    .reverse()
    .map((h) => ({
      label: `${MONTH_LABELS[h.month]}/${h.year % 100}`,
      score: h.score,
      rank: h.rank,
    }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/20 to-slate-50">
      {/* Header */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#4c1d95] py-12 text-white">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-5xl px-4">
          <Link to="/leaderboard" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-violet-200 transition hover:text-white">
            <ArrowLeft size={16} />
            Quay lại bảng xếp hạng
          </Link>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-black md:text-4xl">{ward.wardName}</h1>
              <p className="mt-2 text-violet-200">Bảng điểm chi tiết hiệu suất xử lý phản ánh</p>
            </div>
            <div className="text-right">
              <div className="text-5xl font-black text-amber-300">{ward.currentScore.toFixed(1)}</div>
              <div className="text-sm font-semibold text-violet-200">
                Hạng #{ward.currentRank}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Score Breakdown Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ScoreCard
            icon={CheckCircle2}
            label="Môi trường đô thị"
            value={`${ward.lowIncidenceScore.toFixed(1)}`}
            sub={`Độ sạch đẹp & an toàn`}
            color="text-emerald-600"
            bg="bg-emerald-50"
          />
          <ScoreCard
            icon={Clock}
            label="Điểm tốc độ"
            value={`${ward.speedScore.toFixed(1)}`}
            sub={`≈ ${ward.avgResolutionHours.toFixed(0)}h trung bình`}
            color="text-blue-600"
            bg="bg-blue-50"
          />
          <ScoreCard
            icon={Award}
            label="Mức độ hài lòng"
            value={`${ward.satisfactionScore.toFixed(1)}`}
            sub={`Đánh giá từ người dân`}
            color="text-pink-600"
            bg="bg-pink-50"
          />
          <ScoreCard
            icon={TrendingUp}
            label="Điểm xu hướng"
            value={`${ward.trendScore.toFixed(1)}`}
            sub={`Sự cải thiện qua tháng`}
            color="text-violet-600"
            bg="bg-violet-50"
          />
        </div>

        {/* Stats Summary */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                <FileText size={20} className="text-slate-500" />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-800">{ward.totalFeedbacks}</div>
                <div className="text-xs font-semibold text-slate-400">Tổng phản ánh</div>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                <CheckCircle2 size={20} className="text-emerald-500" />
              </div>
              <div>
                <div className="text-2xl font-black text-emerald-600">{ward.resolvedCount}</div>
                <div className="text-xs font-semibold text-slate-400">Đã giải quyết</div>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                <Clock size={20} className="text-amber-500" />
              </div>
              <div>
                <div className="text-2xl font-black text-amber-600">{ward.avgResolutionHours.toFixed(0)}h</div>
                <div className="text-xs font-semibold text-slate-400">Thời gian trung bình</div>
              </div>
            </div>
          </div>
        </div>

        {/* Historical Chart */}
        {chartData.length > 1 && (
          <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-lg font-black text-slate-800">Xu hướng điểm số qua các tháng</h2>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#94a3b8" }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "#94a3b8" }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                    fontSize: "13px",
                  }}
                />
                <Area type="monotone" dataKey="score" stroke="#7C3AED" strokeWidth={2.5} fill="url(#scoreGrad)" name="Điểm" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Achievements Gallery */}
        {ward.achievements.length > 0 && (
          <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-slate-800">
              <Award size={20} className="text-amber-500" />
              Thành tích đạt được
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ward.achievements.map((a, i) => {
                const meta = BADGE_META[a.badgeCode];
                const Icon = meta?.icon ?? Award;
                return (
                  <div key={i} className={`flex items-center gap-3 rounded-xl border p-4 ${meta?.bg ?? "bg-slate-50 border-slate-200"}`}>
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ${meta?.color ?? "text-slate-500"}`}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <div className={`text-sm font-black ${meta?.color ?? "text-slate-700"}`}>
                        {a.badgeLabel}
                      </div>
                      {a.earnedAt && (
                        <div className="mt-0.5 text-xs text-slate-400">
                          {new Date(a.earnedAt).toLocaleDateString("vi-VN")}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Ranking History Table */}
        {ward.history.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-black text-slate-800">Lịch sử xếp hạng</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                    <th className="px-3 py-3">Kỳ</th>
                    <th className="px-3 py-3 text-center">Hạng</th>
                    <th className="px-3 py-3 text-center">Điểm</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {ward.history.map((h, i) => (
                    <tr key={i} className="transition hover:bg-slate-50/50">
                      <td className="px-3 py-3 font-semibold text-slate-700">
                        {MONTH_LABELS[h.month]}/{h.year}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-black text-slate-600">
                          {h.rank}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center font-black text-slate-800">
                        {h.score.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Score Card ──────────────────────────────────────────────

function ScoreCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  bg,
}: {
  icon: typeof Trophy;
  label: string;
  value: string;
  sub?: string;
  color: string;
  bg: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${bg}`}>
          <Icon size={20} className={color} />
        </div>
      </div>
      <div className={`mt-3 text-2xl font-black ${color}`}>{value}</div>
      <div className="mt-1 text-xs font-semibold text-slate-400">{label}</div>
      {sub && <div className="mt-0.5 text-[10px] text-slate-400">{sub}</div>}
    </div>
  );
}
