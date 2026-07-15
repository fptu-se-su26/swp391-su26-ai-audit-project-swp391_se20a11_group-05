import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { wardRankingApi, type WardRankingEntry, getToken } from "@/lib/api";
import { WardChoroplethMap } from "@/features/wardRanking/components/WardChoroplethMap";
import { WardDetailModal } from "@/features/wardRanking/components/WardDetailModal";
import { WardCompareView } from "@/features/wardRanking/components/WardCompareView";
import { useState } from "react";
import { toast } from "sonner";
import {
  Calendar,
  Zap,
  RefreshCw,
  Trophy,
  ArrowRight,
  CheckCircle2,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
  Map,
  AlertCircle,
  Users
} from "lucide-react";
import { LineChart, Line, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

// Import local assets
import causonghanImg from "@/assets/causonghan.png";
import caurongImg from "@/assets/caurong.png";
import dinhImg from "@/assets/dinh.png";
import vongquayImg from "@/assets/vongquay.png";

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

const MONTHS = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
];

// Helper to generate mock sparkline data consistently based on wardId
const generateSparklineData = (seed: number, baseScore: number, isTrendUp: boolean) => {
  const data = [];
  let current = baseScore;
  for (let i = 0; i < 7; i++) {
    data.push({ value: current });
    const change = (Math.sin(seed * (i + 1)) * 3);
    current = isTrendUp ? current + Math.abs(change) : current - Math.abs(change);
  }
  return isTrendUp ? data : data.reverse();
};

function LeaderboardPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [activeTab, setActiveTab] = useState<"top" | "map" | "unranked">("top");
  const [selectedWardId, setSelectedWardId] = useState<number | null>(null);
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const navigate = useNavigate();

  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ["ward-ranking", "leaderboard", year, month],
    queryFn: () => wardRankingApi.getLeaderboard(year, month),
    staleTime: 60_000,
  });

  const rankedWards = leaderboard?.filter(w => w.rankPosition != null && w.rankPosition > 0) ?? [];
  const top3 = rankedWards.slice(0, 3);
  const rest = rankedWards.slice(3);
  const unrankedWards = leaderboard?.filter(w => w.rankPosition == null || w.rankPosition === 0 || w.totalFeedbacks < 5) ?? [];

  // Calculate city-wide stats for the dashboard widget
  const totalReports = leaderboard?.reduce((acc, w) => acc + w.totalFeedbacks, 0) || 0;
  const totalResolved = leaderboard?.reduce((acc, w) => acc + w.resolvedCount, 0) || 0;
  const overallResolutionRate = totalReports > 0 ? (totalResolved / totalReports) * 100 : 0;
  const totalPending = totalReports - totalResolved;
  
  // Fake overdue for UI mock
  const overdueReports = Math.floor(totalPending * 0.2);

  const pieData = [
    { name: "Đã giải quyết", value: totalResolved, color: "#10B981" }, // Emerald 500
    { name: "Đang xử lý", value: totalPending - overdueReports, color: "#F59E0B" }, // Amber 500
    { name: "Quá hạn", value: overdueReports, color: "#EF4444" }, // Red 500
  ];

  const handleRecalculate = () => {
    toast.promise(
      fetch("http://localhost:8081/api/ward-ranking/recalculate", { method: "POST" }),
      {
        loading: "Đang tính toán dữ liệu...",
        success: () => {
          setTimeout(() => window.location.reload(), 1000);
          return "Đã tính toán xong dữ liệu xếp hạng!";
        },
        error: "Lỗi khi tính toán",
      }
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-20">
      
      {/* 1. HERO SECTION */}
      <section className="relative h-[240px] w-full overflow-hidden bg-[#1e3a8a]">
        {/* Background Image placed on the right */}
        <div 
          className="absolute inset-0 bg-no-repeat"
          style={{ backgroundImage: `url(${causonghanImg})`, backgroundPosition: 'center', backgroundSize: 'cover' }}
        >
           <div className="absolute inset-0 bg-gradient-to-r from-[#1e3a8a] via-[#1e3a8a]/80 to-transparent w-full"></div>
        </div>
        
        <div className="relative h-full max-w-[1440px] mx-auto px-6 md:px-10 flex flex-col justify-center pb-6">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-extrabold tracking-[0.1em] uppercase text-blue-50 w-fit backdrop-blur-sm">
            <Trophy size={14} className="text-amber-400" />
            BẢNG XẾP HẠNG PHƯỜNG
          </div>
          <h1 className="text-3xl md:text-[38px] font-bold tracking-tight text-white mb-3 font-sans">
            Xếp hạng hiệu suất xử lý phản ánh
          </h1>
          <p className="max-w-2xl text-sm md:text-base text-blue-100 font-medium leading-relaxed">
            Đánh giá hiệu quả tiếp nhận, xử lý phản ánh của các phường dựa trên tốc độ, tỷ lệ giải<br className="hidden md:block" />
            quyết và chất lượng dịch vụ.
          </p>
        </div>
      </section>

      {/* 2. FILTER BAR */}
      <div className="max-w-[1440px] mx-auto px-6 md:px-10 relative z-20 -mt-8">
        <div className="bg-white rounded-[16px] shadow-sm shadow-[#1E3A8A]/5 border border-slate-200/80 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Left Filters */}
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-slate-400" />
              <span className="text-[14px] font-semibold text-slate-600">Kỳ xếp hạng:</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <select
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="appearance-none bg-white border border-slate-200 text-slate-700 text-[13px] font-bold rounded-lg pl-4 pr-10 py-2.5 outline-none hover:border-slate-300 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all cursor-pointer"
                >
                  {MONTHS.map((label, i) => (
                    <option key={i} value={i + 1}>{label}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>

              <div className="relative">
                <select
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="appearance-none bg-white border border-slate-200 text-slate-700 text-[13px] font-bold rounded-lg pl-4 pr-10 py-2.5 outline-none hover:border-slate-300 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all cursor-pointer"
                >
                  {[now.getFullYear(), now.getFullYear() - 1].map((y) => (
                    <option key={y} value={y}>Năm {y}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={handleRecalculate}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-5 py-2.5 rounded-full font-bold text-[13px] transition-all shadow-sm"
            >
              <Zap size={16} />
              Tính toán dữ liệu tháng này
            </button>
            <button
              onClick={() => setCompareModalOpen(true)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-5 py-2.5 rounded-full font-bold text-[13px] transition-all shadow-sm"
            >
              <RefreshCw size={16} className="text-slate-400" />
              So sánh phường
            </button>
          </div>
        </div>
      </div>

      {/* 3. TAB BAR */}
      <div className="max-w-[1440px] mx-auto px-6 md:px-10 mt-8 mb-8 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <button 
            onClick={() => setActiveTab("top")}
            className={`pb-4 text-sm font-bold flex items-center gap-2 relative transition-colors ${activeTab === "top" ? "text-[#2563EB]" : "text-slate-500 hover:text-slate-700"}`}
          >
            <Trophy size={18} className={activeTab === "top" ? "text-[#2563EB]" : "text-slate-400"} />
            Top Phường
            {activeTab === "top" && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[#2563EB] rounded-t-full" />}
          </button>
          <button 
            onClick={() => setActiveTab("map")}
            className={`pb-4 text-sm font-bold flex items-center gap-2 relative transition-colors ${activeTab === "map" ? "text-[#2563EB]" : "text-slate-500 hover:text-slate-700"}`}
          >
            <Map size={18} className={activeTab === "map" ? "text-[#2563EB]" : "text-slate-400"} />
            Bản đồ năng lực
            {activeTab === "map" && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[#2563EB] rounded-t-full" />}
          </button>
          <button 
            onClick={() => setActiveTab("unranked")}
            className={`pb-4 text-sm font-bold flex items-center gap-2 relative transition-colors ${activeTab === "unranked" ? "text-[#2563EB]" : "text-slate-500 hover:text-slate-700"}`}
          >
            <AlertCircle size={18} className={activeTab === "unranked" ? "text-[#2563EB]" : "text-slate-400"} />
            Chưa đủ dữ liệu
            {activeTab === "unranked" && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[#2563EB] rounded-t-full" />}
          </button>
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-slate-400 pb-4">
          <RefreshCw size={14} />
          Dữ liệu cập nhật đến 10:00, 15/06/2026
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-6 md:px-10">
        
        {activeTab === "map" && (
          <div className="bg-white p-6 rounded-[18px] border border-slate-200 shadow-sm mt-8">
            <h2 className="text-lg font-black text-[#1E3A8A] mb-4">Bản đồ nhiệt năng lực các phường (Đà Nẵng)</h2>
            <p className="text-sm text-slate-500 mb-6 font-medium">Màu xanh thể hiện điểm số cao, màu đỏ/vàng thể hiện khu vực cần cải thiện.</p>
            {leaderboard && (
              <div className="rounded-xl overflow-hidden border border-slate-100">
                <WardChoroplethMap 
                  data={[...leaderboard, ...unrankedWards]} 
                  onWardClick={(id) => setSelectedWardId(id)} 
                />
              </div>
            )}
          </div>
        )}

        {activeTab === "unranked" && (
          <div className="bg-white p-6 rounded-[18px] border border-slate-200 shadow-sm mt-8">
            <h2 className="text-lg font-black text-[#1E3A8A] mb-4">Phường chưa đủ dữ liệu</h2>
            <p className="text-sm text-slate-500 mb-6 font-medium">Các phường có ít hơn 5 phản ánh trong tháng sẽ không được xếp hạng để đảm bảo tính khách quan.</p>
            {unrankedWards.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {unrankedWards.map(w => (
                  <div key={w.wardId} className="border border-slate-200 p-4 rounded-[16px] shadow-sm hover:shadow-md cursor-pointer transition-shadow" onClick={() => setSelectedWardId(w.wardId)}>
                    <h3 className="font-black text-[#1E3A8A]">{w.wardName}</h3>
                    <div className="mt-3 text-sm text-slate-500 flex justify-between font-bold bg-slate-50 p-2.5 rounded-lg border border-slate-100">
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
        )}

        {activeTab === "top" && (
          <>
            {/* 4. TOP 3 RANKING */}
            {top3.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 items-center">
                
                {/* RANK 2 - SILVER */}
                {top3[1] && (
                  <div className="bg-white rounded-[18px] border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow relative overflow-hidden order-2 lg:order-1 h-[280px] flex flex-col">
                    {/* Rank Badge */}
                    <div className="absolute top-0 left-0 bg-gradient-to-br from-[#94A3B8] to-[#475569] text-white w-10 h-12 flex items-center justify-center font-black text-xl rounded-br-2xl shadow-sm z-10">
                      2
                    </div>
                    
                    <div className="flex justify-between items-start mb-6 mt-2 ml-8">
                      <div>
                        <h3 className="text-[#1E3A8A] font-black text-xl tracking-tight mb-1">{top3[1].wardName}</h3>
                        <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Tổng điểm</div>
                        <div className="text-3xl font-black text-[#1E3A8A] flex items-baseline gap-1 mt-1">
                          {top3[1].overallScore.toFixed(1)}
                          <span className="text-sm text-slate-400 font-bold">/100</span>
                        </div>
                      </div>
                      
                      <div className="w-20 h-20 shrink-0 relative rounded-full bg-slate-50 flex items-center justify-center border-4 border-slate-100/50 shadow-inner overflow-hidden">
                        <img src={dinhImg} alt="Icon" className="w-16 h-16 object-contain opacity-90 drop-shadow-sm" />
                      </div>
                    </div>

                    <div className="h-[40px] w-full mb-6 relative">
                       <ResponsiveContainer width="100%" height="100%">
                         <LineChart data={generateSparklineData(2, top3[1].overallScore, top3[1].rankChange >= 0)}>
                           <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} dot={false} isAnimationActive={false} />
                         </LineChart>
                       </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-4 gap-2 mb-5 divide-x divide-slate-100 mt-auto">
                      <StatMini label="Tỷ lệ giải quyết" value={`${top3[1].resolutionRate.toFixed(0)}%`} highlight />
                      <StatMini label="Tốc độ xử lý (ngày)" value={(top3[1].avgResolutionHours / 24).toFixed(1)} />
                      <StatMini label="Tổng phản ánh" value={top3[1].totalFeedbacks.toString()} />
                      <StatMini label="Đang xử lý" value={(top3[1].totalFeedbacks - top3[1].resolvedCount).toString()} />
                    </div>

                    <button onClick={() => navigate({ to: '/leaderboard/$wardId', params: { wardId: top3[1].wardId.toString() }})} className="flex items-center gap-1.5 text-sm font-bold text-[#2563EB] hover:text-[#1D4ED8] transition-colors">
                      Xem chi tiết <ArrowRight size={16} />
                    </button>
                  </div>
                )}

                {/* RANK 1 - GOLD (CENTER) */}
                {top3[0] && (
                  <div className="bg-white rounded-[24px] border-2 border-[#FBBF24] shadow-lg shadow-amber-500/10 p-7 hover:shadow-xl hover:shadow-amber-500/20 transition-all relative overflow-hidden order-1 lg:order-2 h-[310px] flex flex-col lg:-mt-6 z-10">
                    <div className="absolute top-0 left-0 bg-gradient-to-br from-[#FCD34D] to-[#D97706] text-white w-12 h-14 flex items-center justify-center font-black text-2xl rounded-br-2xl shadow-md z-10">
                      1
                    </div>
                    
                    <div className="flex justify-between items-start mb-6 mt-2 ml-10">
                      <div>
                        <h3 className="text-[#1E3A8A] font-black text-[22px] tracking-tight mb-1">{top3[0].wardName}</h3>
                        <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Tổng điểm</div>
                        <div className="text-[40px] font-black text-[#D97706] flex items-baseline gap-1 mt-1 leading-none drop-shadow-sm">
                          {top3[0].overallScore.toFixed(1)}
                          <span className="text-sm text-slate-400 font-bold">/100</span>
                        </div>
                      </div>
                      
                      <div className="w-24 h-24 shrink-0 relative rounded-full bg-amber-50 flex items-center justify-center border-[6px] border-amber-100/50 shadow-inner overflow-hidden">
                        <img src={caurongImg} alt="Icon" className="w-[72px] h-[72px] object-contain drop-shadow-md" />
                      </div>
                    </div>

                    <div className="h-[48px] w-full mb-6 relative">
                       <ResponsiveContainer width="100%" height="100%">
                         <LineChart data={generateSparklineData(1, top3[0].overallScore, true)}>
                           <Line type="monotone" dataKey="value" stroke="#F59E0B" strokeWidth={3} dot={false} isAnimationActive={false} />
                         </LineChart>
                       </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-4 gap-2 mb-6 divide-x divide-slate-100 mt-auto">
                      <StatMini label="Tỷ lệ giải quyết" value={`${top3[0].resolutionRate.toFixed(0)}%`} highlight highlightColor="text-[#D97706]" />
                      <StatMini label="Tốc độ xử lý (ngày)" value={(top3[0].avgResolutionHours / 24).toFixed(1)} />
                      <StatMini label="Tổng phản ánh" value={top3[0].totalFeedbacks.toString()} />
                      <StatMini label="Đang xử lý" value={(top3[0].totalFeedbacks - top3[0].resolvedCount).toString()} />
                    </div>

                    <button onClick={() => navigate({ to: '/leaderboard/$wardId', params: { wardId: top3[0].wardId.toString() }})} className="flex items-center justify-center w-full gap-1.5 text-sm font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 py-2.5 rounded-xl transition-colors">
                      Xem chi tiết <ArrowRight size={16} />
                    </button>
                  </div>
                )}

                {/* RANK 3 - BRONZE */}
                {top3[2] && (
                  <div className="bg-white rounded-[18px] border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow relative overflow-hidden order-3 h-[280px] flex flex-col">
                    <div className="absolute top-0 left-0 bg-gradient-to-br from-[#D97706] to-[#92400E] text-white w-10 h-12 flex items-center justify-center font-black text-xl rounded-br-2xl shadow-sm z-10">
                      3
                    </div>
                    
                    <div className="flex justify-between items-start mb-6 mt-2 ml-8">
                      <div>
                        <h3 className="text-[#1E3A8A] font-black text-xl tracking-tight mb-1">{top3[2].wardName}</h3>
                        <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Tổng điểm</div>
                        <div className="text-3xl font-black text-[#92400E] flex items-baseline gap-1 mt-1">
                          {top3[2].overallScore.toFixed(1)}
                          <span className="text-sm text-slate-400 font-bold">/100</span>
                        </div>
                      </div>
                      
                      <div className="w-20 h-20 shrink-0 relative rounded-full bg-orange-50 flex items-center justify-center border-4 border-orange-100/50 shadow-inner overflow-hidden">
                        <img src={vongquayImg} alt="Icon" className="w-16 h-16 object-contain opacity-90 drop-shadow-sm" />
                      </div>
                    </div>

                    <div className="h-[40px] w-full mb-6 relative">
                       <ResponsiveContainer width="100%" height="100%">
                         <LineChart data={generateSparklineData(3, top3[2].overallScore, top3[2].rankChange >= 0)}>
                           <Line type="monotone" dataKey="value" stroke="#F97316" strokeWidth={2} dot={false} isAnimationActive={false} />
                         </LineChart>
                       </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-4 gap-2 mb-5 divide-x divide-slate-100 mt-auto">
                      <StatMini label="Tỷ lệ giải quyết" value={`${top3[2].resolutionRate.toFixed(0)}%`} highlight highlightColor="text-[#92400E]" />
                      <StatMini label="Tốc độ xử lý (ngày)" value={(top3[2].avgResolutionHours / 24).toFixed(1)} />
                      <StatMini label="Tổng phản ánh" value={top3[2].totalFeedbacks.toString()} />
                      <StatMini label="Đang xử lý" value={(top3[2].totalFeedbacks - top3[2].resolvedCount).toString()} />
                    </div>

                    <button onClick={() => navigate({ to: '/leaderboard/$wardId', params: { wardId: top3[2].wardId.toString() }})} className="flex items-center gap-1.5 text-sm font-bold text-[#EA580C] hover:text-[#C2410C] transition-colors">
                      Xem chi tiết <ArrowRight size={16} />
                    </button>
                  </div>
                )}

              </div>
            )}

            {/* 5. MAIN CONTENT (2 COLUMNS) */}
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              
              {/* LEFT COLUMN: TABLE (70%) */}
              <div className="w-full lg:w-[70%] bg-white rounded-[18px] border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="text-lg font-black text-[#1E3A8A]">Bảng xếp hạng đầy đủ</h2>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-100">
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-16 text-center">#</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Phường</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng điểm</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Tỷ lệ giải quyết</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Tốc độ xử lý (ngày)</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Tổng phản ánh</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Đang xử lý</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-24">Xu hướng</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rankedWards.map((ward) => {
                        const isRank1 = ward.rankPosition === 1;
                        const isRank2 = ward.rankPosition === 2;
                        const isRank3 = ward.rankPosition === 3;
                        const badgeColor = isRank1 ? "bg-amber-400" : isRank2 ? "bg-slate-400" : isRank3 ? "bg-amber-600" : "bg-transparent text-slate-500 font-bold";
                        const isTrendUp = ward.rankChange >= 0;

                        return (
                          <tr key={ward.wardId} onClick={() => navigate({ to: '/leaderboard/$wardId', params: { wardId: ward.wardId.toString() }})} className="hover:bg-blue-50/40 transition-colors cursor-pointer group">
                            <td className="px-6 py-4">
                              <div className={`w-6 h-6 mx-auto rounded-full flex items-center justify-center text-xs font-black ${isRank1 || isRank2 || isRank3 ? `text-white ${badgeColor}` : ""}`}>
                                {ward.rankPosition}
                              </div>
                            </td>
                            <td className="px-6 py-4 font-bold text-slate-800 group-hover:text-[#2563EB] transition-colors whitespace-nowrap">
                              {ward.wardName}
                            </td>
                            <td className="px-6 py-4 font-black text-[#1E3A8A]">
                              {ward.overallScore.toFixed(1)}
                            </td>
                            <td className="px-6 py-4 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1.5">
                                <span className="font-bold text-slate-700">{ward.resolutionRate.toFixed(0)}%</span>
                                {ward.rankChange !== 0 && (
                                  <span className={`flex items-center text-[10px] font-bold ${ward.rankChange > 0 ? "text-emerald-500" : "text-red-500"}`}>
                                    {ward.rankChange > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                    {Math.abs(ward.rankChange)}%
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center font-bold text-slate-700">
                              {(ward.avgResolutionHours / 24).toFixed(1)}
                            </td>
                            <td className="px-6 py-4 text-center font-bold text-slate-700">
                              {ward.totalFeedbacks}
                            </td>
                            <td className="px-6 py-4 text-center font-bold text-slate-700">
                              {ward.totalFeedbacks - ward.resolvedCount}
                            </td>
                            <td className="px-6 py-4">
                              <div className="w-16 h-6">
                                <ResponsiveContainer width="100%" height="100%">
                                  <LineChart data={generateSparklineData(ward.wardId, ward.overallScore, isTrendUp)}>
                                    <Line type="monotone" dataKey="value" stroke={isTrendUp ? "#10B981" : "#EF4444"} strokeWidth={1.5} dot={false} isAnimationActive={false} />
                                  </LineChart>
                                </ResponsiveContainer>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                <div className="p-4 border-t border-slate-100 flex justify-center">
                   <button className="text-[#2563EB] text-sm font-bold flex items-center gap-1 hover:text-[#1D4ED8]">
                     Xem tất cả <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                   </button>
                </div>
              </div>

              {/* RIGHT COLUMN: WIDGETS (30%) */}
              <div className="w-full lg:w-[30%] flex flex-col gap-6">
                
                {/* Overall Widget */}
                <div className="bg-white rounded-[18px] border border-slate-200 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-black text-[#1E3A8A]">Tổng quan toàn thành phố</h3>
                    <button className="text-xs font-bold text-[#2563EB] hover:underline flex items-center gap-1">
                      Xem chi tiết <ArrowRight size={12} />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col">
                       <Users size={16} className="text-[#2563EB] mb-2" />
                       <span className="text-[20px] font-black text-slate-800">{totalReports.toLocaleString("vi-VN")}</span>
                       <span className="text-[10px] font-bold uppercase text-slate-400">Tổng phản ánh</span>
                    </div>
                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 flex flex-col">
                       <CheckCircle2 size={16} className="text-emerald-500 mb-2" />
                       <span className="text-[20px] font-black text-slate-800">{totalResolved.toLocaleString("vi-VN")}</span>
                       <span className="text-[10px] font-bold uppercase text-slate-400">Đã giải quyết</span>
                    </div>
                    <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 flex flex-col">
                       <Clock size={16} className="text-[#2563EB] mb-2" />
                       <span className="text-[20px] font-black text-slate-800">{overallResolutionRate.toFixed(1)}%</span>
                       <span className="text-[10px] font-bold uppercase text-slate-400">Tỷ lệ giải quyết</span>
                    </div>
                    <div className="bg-red-50/50 border border-red-100 rounded-xl p-3 flex flex-col">
                       <AlertCircle size={16} className="text-red-500 mb-2" />
                       <span className="text-[20px] font-black text-slate-800">{overdueReports}</span>
                       <span className="text-[10px] font-bold uppercase text-slate-400">Đang xử lý</span>
                    </div>
                  </div>
                </div>

                {/* Resolution Rate Chart */}
                <div className="bg-white rounded-[18px] border border-slate-200 shadow-sm p-6">
                  <h3 className="font-black text-[#1E3A8A] mb-6">Tỷ lệ giải quyết</h3>
                  <div className="flex items-center gap-6">
                    <div className="w-[120px] h-[120px] relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={60}
                            paddingAngle={2}
                            dataKey="value"
                            stroke="none"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-lg font-black text-slate-800">{overallResolutionRate.toFixed(1)}%</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Tổng tỷ lệ</span>
                      </div>
                    </div>
                    
                    <div className="flex-1 flex flex-col gap-3">
                      {pieData.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-xs font-bold text-slate-600">{item.name}</span>
                          </div>
                          <div className="text-right">
                             <span className="text-xs font-black text-slate-800 mr-1">
                               {totalReports > 0 ? ((item.value / totalReports) * 100).toFixed(1) : 0}%
                             </span>
                             <span className="text-[10px] text-slate-400 font-semibold">({item.value})</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Criteria Info Widget */}
                <div className="bg-[#F8FAFC] rounded-[18px] border border-slate-200 p-5 flex items-start gap-4">
                  <div className="mt-0.5 text-[#2563EB]">
                    <Info size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm mb-1">Tiêu chí xếp hạng</h4>
                    <p className="text-xs text-slate-500 mb-3 font-medium leading-relaxed">
                      Dựa trên 3 tiêu chí chính với trọng số tương ứng: Tốc độ xử lý (40%), Tỷ lệ giải quyết (40%) và Mức độ hài lòng (20%).
                    </p>
                    <button className="text-xs font-bold text-[#2563EB] hover:underline flex items-center gap-1">
                      Xem chi tiết <ArrowRight size={12} />
                    </button>
                  </div>
                </div>

              </div>
            </div>

          </>
        )}
      </div>

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
  );
}

// ─── StatMini Helper ──────────────────────────────────────────────
function StatMini({ label, value, highlight = false, highlightColor = "text-[#2563EB]" }: { label: string; value: string; highlight?: boolean; highlightColor?: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-1">
      <span className={`text-base font-black ${highlight ? highlightColor : "text-slate-800"}`}>
        {value}
      </span>
      <span className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase mt-0.5 text-center leading-tight">
        {label}
      </span>
    </div>
  );
}
