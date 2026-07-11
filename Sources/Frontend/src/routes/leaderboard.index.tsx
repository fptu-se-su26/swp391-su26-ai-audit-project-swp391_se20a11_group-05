import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { wardRankingApi, type WardRankingEntry, getToken } from "@/lib/api";
import { WardChoroplethMap } from "@/features/wardRanking/components/WardChoroplethMap";
import { WardDetailModal } from "@/features/wardRanking/components/WardDetailModal";
import { WardCompareView } from "@/features/wardRanking/components/WardCompareView";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  Medal,
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  Star,
  Award,
  ArrowUpRight,
  BarChart3,
  Clock,
  CheckCircle2,
  FileText,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/leaderboard/")({
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
  component: LeaderboardPage,
});

const BADGE_META: Record<string, { label: string; icon: typeof Trophy; color: string }> = {
  TOP_PERFORMER: { label: "Top Performer", icon: Trophy, color: "text-amber-500" },
  FASTEST_RESPONDER: { label: "Phản hồi nhanh", icon: Zap, color: "text-blue-500" },
  RISING_STAR: { label: "Ngôi sao đang lên", icon: Star, color: "text-emerald-500" },
  MOST_IMPROVED: { label: "Tiến bộ nhất", icon: TrendingUp, color: "text-violet-500" },
};

const MONTHS = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
];

function LeaderboardPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { data: leaderboard, isLoading, error } = useQuery({
    queryKey: ["ward-ranking", "leaderboard", year, month],
    queryFn: () => wardRankingApi.getLeaderboard(year, month),
    staleTime: 60_000,
  });

  const [selectedWardId, setSelectedWardId] = useState<number | null>(null);
  const [compareModalOpen, setCompareModalOpen] = useState(false);

  const top3 = leaderboard?.filter(w => w.rankPosition != null && w.rankPosition > 0).slice(0, 3) ?? [];
  const rest = leaderboard?.filter(w => w.rankPosition != null && w.rankPosition > 0).slice(3) ?? [];
  const unrankedWards = leaderboard?.filter(w => w.rankPosition == null || w.rankPosition === 0 || w.totalFeedbacks < 5) ?? [];

  return (
    <div className="relative z-10 min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#4c1d95] py-16">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-indigo-400/15 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium backdrop-blur-sm text-white">
            <BarChart3 size={16} />
            Bảng Xếp Hạng Phường
          </div>
          <h1 className="text-4xl font-black tracking-tight md:text-5xl text-white">
            Top Performing Wards
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-violet-200">
            Xếp hạng hiệu suất xử lý phản ánh của các phường dựa trên tốc độ phản hồi, tỷ lệ giải quyết, và chất lượng dịch vụ.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Period Selector */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm font-semibold text-slate-600">Kỳ xếp hạng:</label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-violet-300 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            >
              {MONTHS.map((label, i) => (
                <option key={i} value={i + 1}>{label}</option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-violet-300 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            >
            {[now.getFullYear(), now.getFullYear() - 1].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
            </select>
            <button
              onClick={() => {
                toast.promise(
                  fetch("http://localhost:8081/api/ward-ranking/recalculate", { method: "POST" }),
                  {
                    loading: "Đang tính toán dữ liệu...",
                    success: () => {
                      setTimeout(() => window.location.reload(), 1000);
                      return "Đã tính toán xong!";
                    },
                    error: "Lỗi khi tính toán",
                  }
                );
              }}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
            >
              <Zap size={16} className="inline-block mr-1.5" />
              Tính toán dữ liệu tháng này
            </button>
            <Button variant="outline" onClick={() => setCompareModalOpen(true)}>
              So sánh phường
            </Button>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-32 text-slate-400">
            <Loader2 size={40} className="animate-spin" />
            <p className="mt-4 text-sm font-medium">Đang tải bảng xếp hạng...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex flex-col items-center justify-center py-32 text-red-400">
            <AlertCircle size={40} />
            <p className="mt-4 text-sm font-medium">Không thể tải dữ liệu xếp hạng.</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && leaderboard?.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 text-slate-400">
            <Trophy size={48} className="opacity-40" />
            <p className="mt-4 text-base font-semibold text-slate-500">Chưa có dữ liệu xếp hạng</p>
            <p className="mt-1 text-sm">Dữ liệu sẽ được tính toán vào đầu mỗi tháng.</p>
          </div>
        )}

        {/* Tabs for different views */}
        <Tabs defaultValue="list" className="space-y-8">
          <TabsList className="bg-white border border-slate-200 shadow-sm p-1 rounded-xl">
            <TabsTrigger value="list" className="rounded-lg data-[state=active]:bg-violet-100 data-[state=active]:text-violet-700">Top Phường</TabsTrigger>
            <TabsTrigger value="map" className="rounded-lg data-[state=active]:bg-violet-100 data-[state=active]:text-violet-700">Bản Đồ Năng Lực</TabsTrigger>
            <TabsTrigger value="unranked" className="rounded-lg data-[state=active]:bg-violet-100 data-[state=active]:text-violet-700">Chưa Đủ Dữ Liệu</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-8">
            {/* Top 3 Podium */}
            {top3.length > 0 && (
              <div className="mb-12 grid gap-6 md:grid-cols-3">
                {[top3[1], top3[0], top3[2]].filter(Boolean).map((ward, idx) => {
                  const podiumRank = [2, 1, 3][idx];
                  return ward ? (
                    <div key={ward.wardId} onClick={() => setSelectedWardId(ward.wardId)} className="cursor-pointer">
                      <PodiumCard ward={ward} podiumRank={podiumRank!} />
                    </div>
                  ) : null;
                })}
              </div>
            )}

            {/* Full Leaderboard Table */}
            {rest.length > 0 && (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                  <h2 className="text-lg font-black text-slate-800">Bảng xếp hạng đầy đủ</h2>
                </div>
                <div className="divide-y divide-slate-100">
                  {rest.map((ward) => (
                    <div key={ward.wardId} onClick={() => setSelectedWardId(ward.wardId)} className="cursor-pointer">
                      <LeaderboardRow ward={ward} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State when there are wards but none qualify for ranking */}
            {leaderboard && leaderboard.length > 0 && top3.length === 0 && rest.length === 0 && (
              <div className="bg-white p-12 rounded-xl border border-slate-200 shadow-sm text-center">
                <Trophy size={40} className="mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-bold text-slate-700">Chưa có phường nào được xếp hạng</h3>
                <p className="text-slate-500 mt-2">Trong tháng này, các phường hiện tại chưa đủ số lượng phản ánh tối thiểu (5 phản ánh) để tham gia bảng xếp hạng.</p>
                <p className="text-slate-500">Vui lòng kiểm tra tab "Chưa Đủ Dữ Liệu" để xem chi tiết.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="map">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h2 className="text-lg font-black text-slate-800 mb-4">Bản đồ nhiệt năng lực các phường (Đà Nẵng)</h2>
              <p className="text-sm text-slate-500 mb-6">Màu xanh thể hiện điểm số cao, màu đỏ/vàng thể hiện khu vực cần cải thiện.</p>
              {leaderboard && (
                <WardChoroplethMap 
                  data={[...leaderboard, ...unrankedWards]} 
                  onWardClick={(id) => setSelectedWardId(id)} 
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="unranked">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h2 className="text-lg font-black text-slate-800 mb-4">Phường chưa đủ dữ liệu</h2>
              <p className="text-sm text-slate-500 mb-6">Các phường có ít hơn 5 phản ánh trong tháng sẽ không được xếp hạng để đảm bảo tính khách quan.</p>
              {unrankedWards.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {unrankedWards.map(w => (
                    <div key={w.wardId} className="border border-slate-200 p-4 rounded-xl shadow-sm hover:shadow-md cursor-pointer transition-shadow" onClick={() => setSelectedWardId(w.wardId)}>
                      <h3 className="font-bold text-slate-800">{w.wardName}</h3>
                      <div className="mt-2 text-sm text-slate-500 flex justify-between">
                        <span>Tổng phản ánh: {w.totalFeedbacks}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  Không có phường nào thiếu dữ liệu trong tháng này.
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Modals */}
        <WardDetailModal 
          wardId={selectedWardId} 
          isOpen={!!selectedWardId} 
          onClose={() => setSelectedWardId(null)} 
        />
        
        {leaderboard && (
          <WardCompareView 
            isOpen={compareModalOpen} 
            onClose={() => setCompareModalOpen(false)} 
            allWards={leaderboard} 
            initialWardId1={selectedWardId ?? undefined}
          />
        )}
      </div>
    </div>
  );
}

// ─── Podium Card ──────────────────────────────────────────────

function PodiumCard({ ward, podiumRank }: { ward: WardRankingEntry; podiumRank: number }) {
  const medalColors = {
    1: "from-amber-400 to-yellow-500",
    2: "from-slate-300 to-slate-400",
    3: "from-amber-600 to-amber-700",
  } as Record<number, string>;

  const borderColors = {
    1: "border-amber-200 ring-amber-100",
    2: "border-slate-200 ring-slate-100",
    3: "border-amber-200/60 ring-amber-100/60",
  } as Record<number, string>;

  const isGold = podiumRank === 1;

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border bg-white p-6 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${borderColors[podiumRank] ?? ""} ${isGold ? "md:order-none md:-mt-4 ring-2" : "ring-1"}`}
    >
      {/* Medal */}
      <div className={`absolute -right-3 -top-3 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br ${medalColors[podiumRank]} shadow-lg`}>
        <span className="text-2xl font-black text-white">{podiumRank}</span>
      </div>

      {/* Score */}
      <div className="mb-4">
        <div className={`text-4xl font-black ${isGold ? "text-amber-500" : "text-slate-700"}`}>
          {ward.overallScore.toFixed(1)}
        </div>
        <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Điểm tổng hợp
        </div>
      </div>

      {/* Ward Name */}
      <h3 className="mb-3 text-lg font-black text-slate-900 transition group-hover:text-violet-600">
        {ward.wardName}
      </h3>

      {/* Stats */}
      <div className="mb-4 grid grid-cols-2 gap-3 text-xs">
        <StatMini icon={CheckCircle2} label="Giải quyết" value={`${ward.resolutionRate.toFixed(0)}%`} />
        <StatMini icon={Clock} label="Tốc độ" value={`${ward.speedScore.toFixed(0)} đ`} />
        <StatMini icon={FileText} label="Tổng PÁ" value={String(ward.totalFeedbacks)} />
        <StatMini icon={CheckCircle2} label="Đã xử lý" value={String(ward.resolvedCount)} />
      </div>

      {/* Rank Change */}
      <RankChange change={ward.rankChange} />

      {/* Badges */}
      {ward.badges.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {ward.badges.map((code) => {
            const meta = BADGE_META[code];
            if (!meta) return null;
            const Icon = meta.icon;
            return (
              <span key={code} className={`inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-bold ${meta.color}`}>
                <Icon size={10} />
                {meta.label}
              </span>
            );
          })}
        </div>
      )}

      <div className="absolute bottom-4 right-4 opacity-0 transition group-hover:opacity-100">
        <ArrowUpRight size={18} className="text-violet-400" />
      </div>
    </div>
  );
}

// ─── Leaderboard Table Row ──────────────────────────────────

function LeaderboardRow({ ward }: { ward: WardRankingEntry }) {
  return (
    <div
      className="group flex items-center gap-4 px-6 py-4 transition hover:bg-violet-50/40"
    >
      {/* Rank */}
      <div className="flex w-10 items-center justify-center text-lg font-black text-slate-400">
        {ward.rankPosition}
      </div>

      {/* Ward Info */}
      <div className="flex-1">
        <div className="font-bold text-slate-800 transition group-hover:text-violet-600">
          {ward.wardName}
        </div>
        {ward.badges.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {ward.badges.map((code) => {
              const meta = BADGE_META[code];
              if (!meta) return null;
              const Icon = meta.icon;
              return (
                <span key={code} className={`inline-flex items-center gap-0.5 text-[10px] font-bold ${meta.color}`}>
                  <Icon size={10} />
                  {meta.label}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="hidden gap-6 text-xs font-semibold text-slate-500 md:flex">
        <span className="w-20 text-center">
          <span className="block text-sm font-black text-slate-700">{ward.resolutionRate.toFixed(0)}%</span>
          Giải quyết
        </span>
        <span className="w-20 text-center">
          <span className="block text-sm font-black text-slate-700">{ward.speedScore.toFixed(0)}</span>
          Tốc độ
        </span>
        <span className="w-20 text-center">
          <span className="block text-sm font-black text-slate-700">{ward.totalFeedbacks}</span>
          Tổng PÁ
        </span>
      </div>

      {/* Score */}
      <div className="text-right">
        <div className="text-xl font-black text-slate-800">{ward.overallScore.toFixed(1)}</div>
        <RankChange change={ward.rankChange} />
      </div>
    </div>
  );
}

// ─── Helper Components ──────────────────────────────────────

function StatMini({ icon: Icon, label, value }: { icon: typeof Trophy; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5 text-slate-500">
      <Icon size={12} className="shrink-0 text-slate-400" />
      <span className="truncate">
        <span className="font-black text-slate-700">{value}</span>{" "}
        <span className="text-[10px]">{label}</span>
      </span>
    </div>
  );
}

function RankChange({ change }: { change: number }) {
  if (change > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-500">
        <TrendingUp size={12} />
        +{change}
      </span>
    );
  }
  if (change < 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-bold text-red-400">
        <TrendingDown size={12} />
        {change}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-slate-400">
      <Minus size={12} />
      —
    </span>
  );
}
