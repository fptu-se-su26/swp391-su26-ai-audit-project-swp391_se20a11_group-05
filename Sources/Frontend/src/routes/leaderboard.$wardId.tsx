import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { wardRankingApi, feedbackApi, getToken } from "@/lib/api";
import { format, differenceInHours } from "date-fns";
import { vi } from "date-fns/locale";
import { useEffect, useState, useMemo } from "react";
import geoData from "@/assets/danang-wards.json";
import "leaflet/dist/leaflet.css";
import {
  ArrowLeft,
  Share2,
  Download,
  Zap,
  ShieldCheck,
  Heart,
  Leaf,
  TrendingUp,
  MapPin,
  Clock,
  AlertCircle,
  FileText,
  CheckCircle2,
  Loader2,
  Award,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
} from "lucide-react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import causonghanImg from "@/assets/causonghan.png";

export const Route = createFileRoute("/leaderboard/$wardId")({
  component: WardDetailPage,
});

const MONTH_LABELS = [
  "",
  "T1",
  "T2",
  "T3",
  "T4",
  "T5",
  "T6",
  "T7",
  "T8",
  "T9",
  "T10",
  "T11",
  "T12",
];

function getRankStyle(rank: number) {
  if (rank === 1)
    return {
      color: "#FBBF24",
      text: "HẠNG NHẤT",
      bg: "#FEF3C7",
      border: "#F59E0B",
      textFill: "#B45309",
    };
  if (rank === 2)
    return {
      color: "#94A3B8",
      text: "HẠNG NHÌ",
      bg: "#F1F5F9",
      border: "#64748B",
      textFill: "#334155",
    };
  if (rank === 3)
    return {
      color: "#FDE68A",
      text: "HẠNG BA",
      bg: "#FEF3C7",
      border: "#D97706",
      textFill: "#B45309",
    };
  return {
    color: "#E2E8F0",
    text: `TOP ${rank}`,
    bg: "#F8FAFC",
    border: "#CBD5E1",
    textFill: "#64748B",
  };
}

function getPageItems(current: number, total: number): (number | "...")[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i);
  const items: (number | "...")[] = [0];
  if (current > 2) items.push("...");
  for (let i = Math.max(1, current - 1); i <= Math.min(total - 2, current + 1); i++) items.push(i);
  if (current < total - 3) items.push("...");
  items.push(total - 1);
  return items;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "RESOLVED") {
    return (
      <span className="inline-flex px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold">
        Đã xử lý
      </span>
    );
  }
  if (status === "IN_PROGRESS" || status === "ASSIGNED") {
    return (
      <span className="inline-flex px-2.5 py-1 rounded-md bg-amber-50 border border-amber-100 text-amber-700 text-xs font-semibold">
        Đang xử lý
      </span>
    );
  }
  if (status === "REJECTED") {
    return (
      <span className="inline-flex px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold">
        Từ chối
      </span>
    );
  }
  return (
    <span className="inline-flex px-2.5 py-1 rounded-md bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold">
      Tiếp nhận
    </span>
  );
}

function CategoryBadge({ category }: { category: string }) {
  let bg = "bg-slate-50 border-slate-200 text-slate-700";
  if (category === "Môi trường") bg = "bg-emerald-50 border-emerald-200 text-emerald-700";
  if (category === "Hạ tầng") bg = "bg-blue-50 border-blue-200 text-blue-700";
  if (category === "Trật tự đô thị") bg = "bg-violet-50 border-violet-200 text-violet-700";

  return (
    <span className={`inline-flex px-2.5 py-1 rounded-md border text-xs font-semibold ${bg}`}>
      {category}
    </span>
  );
}

function WardDetailPage() {
  const { wardId } = Route.useParams();

  const {
    data: ward,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["ward-ranking", "detail", wardId],
    queryFn: () => wardRankingApi.getWardDetail(wardId),
    staleTime: 60_000,
  });

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);

  const { data: recentReportsData, isFetching: isFetchingReports } = useQuery({
    queryKey: ["ward-feedbacks", wardId, page, pageSize],
    queryFn: () => feedbackApi.getPublic(page, pageSize, { wardId: Number(wardId) }),
    placeholderData: (prev) => prev,
  });
  const recentReports = recentReportsData?.content || [];
  const totalReports = recentReportsData?.totalElements ?? 0;
  const totalPages = recentReportsData?.totalPages ?? 0;

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8FAFC] text-slate-500 font-sans">
        <Loader2 size={40} className="animate-spin text-[#2563EB]" />
        <p className="mt-4 text-sm font-semibold">Đang tải thông tin phường...</p>
      </div>
    );
  }

  if (error || !ward) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8FAFC] text-red-500 font-sans">
        <AlertCircle size={40} />
        <p className="mt-4 text-sm font-semibold">Không thể tải dữ liệu phường.</p>
        <Link to="/leaderboard" className="mt-4 text-sm font-bold text-[#2563EB] hover:underline">
          ← Quay lại bảng xếp hạng
        </Link>
      </div>
    );
  }

  const chartData = [...ward.history].reverse().map((h) => ({
    label: `Th${h.month}/${h.year}`,
    Điểm: h.score,
  }));

  const radarData = [
    { subject: "Tốc độ xử lý", A: ward.speedScore, B: 75, fullMark: 100 },
    { subject: "Tỷ lệ giải quyết", A: ward.resolutionRate, B: 80, fullMark: 100 },
    { subject: "Hài lòng", A: ward.satisfactionScore ?? 0, B: 70, fullMark: 100 },
    { subject: "Môi trường", A: ward.lowIncidenceScore, B: 65, fullMark: 100 },
    { subject: "Cải thiện", A: ward.trendScore, B: 60, fullMark: 100 },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-20">
      {/* Top Bar for Back Navigation & Action Buttons */}
      <div className="max-w-[1440px] mx-auto px-6 md:px-8 py-4 flex items-center justify-between">
        <Link
          to="/leaderboard"
          className="inline-flex items-center gap-2 text-[14px] font-semibold text-slate-500 hover:text-[#1E40AF] transition-colors"
        >
          <ArrowLeft size={16} />
          Quay lại danh sách xếp hạng
        </Link>
        <div className="text-sm font-medium text-slate-400 flex items-center gap-1.5">
          <RefreshCw size={14} /> Dữ liệu cập nhật đến: 10:00, 15/06/2026
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-[1440px] mx-auto px-6 md:px-8 mb-6">
        <section className="relative h-[220px] w-full overflow-hidden rounded-[16px] bg-[#1E40AF] shadow-sm border border-blue-900/10">
          {/* Background Image placed on the right */}
          <div
            className="absolute inset-0 bg-no-repeat opacity-90 mix-blend-luminosity"
            style={{
              backgroundImage: `url(${causonghanImg})`,
              backgroundPosition: "right center",
              backgroundSize: "cover",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#1E40AF] via-[#1E40AF]/90 to-transparent w-full md:w-2/3"></div>
          </div>

          <div className="relative h-full flex items-center justify-between px-10">
            <div className="flex items-center gap-8">
              {/* Ward Icon/Emblem */}
              <div className="w-[120px] h-[120px] rounded-full border border-white/20 bg-[#1e3a8a]/50 flex items-center justify-center p-2 backdrop-blur-sm">
                <div className="w-full h-full rounded-full border border-white/10 flex items-center justify-center text-white/50">
                  <MapPin size={48} />
                </div>
              </div>

              <div className="text-white">
                <h1 className="font-sans text-[36px] font-bold tracking-tight mb-1">
                  {ward.wardName}
                </h1>
                <p className="text-blue-100 text-[15px] font-medium mb-4">
                  Phường {ward.wardName}, Quận{" "}
                  {ward.wardName === "Hòa Xuân" ? "Cẩm Lệ" : "Liên Chiểu"}
                </p>

                <div className="inline-flex items-center gap-2 rounded-full border border-[#D97706]/40 bg-[#D97706]/20 px-3 py-1.5 text-[13px] font-semibold text-amber-300">
                  <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                    {ward.currentRank}
                  </div>
                  Xếp hạng #{ward.currentRank} toàn thành phố
                </div>
              </div>
            </div>

            <div className="text-right border-l border-white/20 pl-10">
              <div className="text-sm font-semibold text-blue-200 mb-1 tracking-wider uppercase">
                ĐIỂM TỔNG HỢP
              </div>
              <div className="flex items-baseline justify-end gap-1 mb-2">
                <span className="text-[56px] font-black text-white leading-none">
                  {ward.currentScore.toFixed(1)}
                </span>
                <span className="text-xl font-bold text-blue-200">/100</span>
              </div>
              <div className="flex items-center justify-end gap-1.5 text-[14px] font-semibold text-emerald-400">
                <TrendingUp size={16} />
                +4.2 điểm so với tháng trước
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="max-w-[1440px] mx-auto px-6 md:px-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-5 mb-6">
          <KPICard
            title="Tốc độ xử lý"
            score={ward.speedScore}
            weight="35% trọng số"
            icon={Zap}
            color="text-[#2563EB]"
            barColor="bg-[#2563EB]"
            desc="SLA 48h"
          />
          <KPICard
            title="Tỷ lệ giải quyết"
            score={ward.resolutionRate}
            weight="30% trọng số"
            icon={ShieldCheck}
            color="text-[#16A34A]"
            barColor="bg-[#16A34A]"
            desc="Đã giải quyết đúng hạn"
          />
          <KPICard
            title="Hài lòng của người dân"
            score={ward.satisfactionScore}
            weight="20% trọng số"
            icon={Heart}
            color="text-[#EF4444]"
            barColor="bg-[#EF4444]"
            desc="Từ đánh giá người dân"
          />
          <KPICard
            title="Môi trường"
            score={ward.lowIncidenceScore}
            weight="10% trọng số"
            icon={Leaf}
            color="text-[#8B5CF6]"
            barColor="bg-[#8B5CF6]"
            desc="Phản ánh về môi trường"
          />
          <KPICard
            title="Cải thiện"
            score={ward.trendScore}
            weight="5% trọng số"
            icon={TrendingUp}
            color="text-[#F59E0B]"
            barColor="bg-[#F59E0B]"
            desc="Xu hướng cải thiện"
          />
        </div>

        {/* Top Right Action Buttons */}
        <div className="flex justify-end gap-3 mb-4">
          <button className="flex items-center gap-2 bg-white border border-slate-200 text-[#1E40AF] px-4 py-2 rounded-lg font-bold text-sm shadow-sm hover:bg-slate-50 transition-colors">
            <Share2 size={16} /> Chia sẻ
          </button>
          <button className="flex items-center gap-2 bg-[#1E40AF] text-white px-4 py-2 rounded-lg font-bold text-sm shadow-sm hover:bg-[#1e3a8a] transition-colors">
            <Download size={16} /> Xuất PDF
          </button>
        </div>

        {/* Content Grid (70% - 30%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN (70%) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Radar Chart */}
              <div className="bg-white rounded-[16px] border border-slate-200 shadow-sm p-6">
                <h3 className="font-sans text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-6">
                  PHÂN TÍCH ĐIỂM
                </h3>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: "#64748b", fontSize: 11, fontWeight: 600 }}
                      />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar
                        name={ward.wardName}
                        dataKey="A"
                        stroke="#2563EB"
                        strokeWidth={2}
                        fill="#3b82f6"
                        fillOpacity={0.15}
                      />
                      <Radar
                        name="Trung bình thành phố"
                        dataKey="B"
                        stroke="#cbd5e1"
                        strokeDasharray="4 4"
                        strokeWidth={2}
                        fill="transparent"
                      />
                      <Legend
                        wrapperStyle={{ fontSize: "12px", fontWeight: 600, color: "#64748b" }}
                        iconType="circle"
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Line Chart */}
              <div className="bg-white rounded-[16px] border border-slate-200 shadow-sm p-6 relative">
                <h3 className="font-sans text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-6">
                  XU HƯỚNG ĐIỂM TỔNG HỢP (12 THÁNG)
                </h3>

                {/* Highlight Badge */}
                <div className="absolute right-6 top-14 bg-[#1E40AF] text-white px-3 py-1.5 rounded-lg text-xs font-bold text-center shadow-md">
                  <div>Th6/2026</div>
                  <div>{ward.currentScore.toFixed(1)} điểm</div>
                </div>

                <div className="h-[220px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="label"
                        tick={
                          { fill: "#94a3b8", fontSize: 10, angle: -45, textAnchor: "end" } as any
                        }
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fill: "#94a3b8", fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <RechartsTooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid #e2e8f0",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                        labelStyle={{
                          color: "#475569",
                          fontWeight: 600,
                          fontSize: "12px",
                          marginBottom: "4px",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="Điểm"
                        stroke="#2563EB"
                        strokeWidth={3}
                        dot={{ r: 4, fill: "#2563EB", strokeWidth: 0 }}
                        activeDot={{ r: 6, fill: "#1E40AF" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Recent Reports Table */}
            <div className="bg-white rounded-[16px] border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-sans text-[14px] font-bold text-slate-700 uppercase tracking-wider">
                  DANH SÁCH PHẢN ÁNH GẦN NHẤT
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                      <th className="py-3 px-4 font-semibold w-12 text-center">#</th>
                      <th className="py-3 px-4 font-semibold w-32">Mã phản ánh</th>
                      <th className="py-3 px-4 font-semibold">Nội dung</th>
                      <th className="py-3 px-4 font-semibold w-32 text-center">Loại phản ánh</th>
                      <th className="py-3 px-4 font-semibold w-36 text-center">Ngày phản ánh</th>
                      <th className="py-3 px-4 font-semibold w-32 text-center">Thời gian xử lý</th>
                      <th className="py-3 px-4 font-semibold w-28 text-center">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody
                    className={`text-[13px] text-slate-700 transition-opacity ${isFetchingReports ? "opacity-50" : ""}`}
                  >
                    {recentReports.length > 0 ? (
                      recentReports.map((report, idx) => {
                        const timeToResolve = report.resolvedAt
                          ? differenceInHours(
                              new Date(report.resolvedAt),
                              new Date(report.createdAt),
                            )
                          : differenceInHours(new Date(), new Date(report.createdAt));
                        const processingTimeStr =
                          timeToResolve > 24
                            ? `${Math.floor(timeToResolve / 24)} ngày`
                            : `${timeToResolve} giờ`;
                        return (
                          <tr
                            key={report.id}
                            className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                          >
                            <td className="py-3 px-4 text-center text-slate-400 font-medium">
                              {page * pageSize + idx + 1}
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-600">
                              {report.trackingCode || `PA-${report.id}`}
                            </td>
                            <td
                              className="py-3 px-4 font-medium max-w-[200px] truncate"
                              title={report.title}
                            >
                              {report.title}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <CategoryBadge category={report.categoryName || "Khác"} />
                            </td>
                            <td className="py-3 px-4 text-center text-slate-500">
                              {format(new Date(report.createdAt), "dd/MM/yyyy HH:mm")}
                            </td>
                            <td className="py-3 px-4 text-center font-medium">
                              {processingTimeStr}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <StatusBadge status={report.status} />
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          Chưa có phản ánh nào gần đây
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {totalReports > 0 && (
                <div className="p-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500 font-medium">
                  <div>
                    Hiển thị {page * pageSize + 1} - {Math.min((page + 1) * pageSize, totalReports)}{" "}
                    trong tổng số {totalReports}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                      aria-label="Trang trước"
                      className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    {getPageItems(page, totalPages).map((item, i) =>
                      item === "..." ? (
                        <span key={`ellipsis-${i}`} className="px-1">
                          ...
                        </span>
                      ) : (
                        <button
                          key={item}
                          onClick={() => setPage(item)}
                          className={`w-8 h-8 flex items-center justify-center rounded ${
                            item === page
                              ? "bg-[#2563EB] text-white font-bold"
                              : "border border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          {item + 1}
                        </button>
                      ),
                    )}
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                      aria-label="Trang sau"
                      className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white"
                    >
                      <ChevronRight size={16} />
                    </button>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setPage(0);
                      }}
                      className="ml-2 border border-slate-200 rounded px-2 py-1 outline-none text-slate-600 bg-white"
                    >
                      <option value={5}>5 / trang</option>
                      <option value={10}>10 / trang</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN (30%) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Ranking Information */}
            <div className="bg-white rounded-[16px] border border-slate-200 shadow-sm p-6 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-full -z-0 opacity-50"></div>
              <h3 className="font-sans text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-2 text-left relative z-10">
                THÔNG TIN XẾP HẠNG
              </h3>
              <div className="flex items-center gap-6 mt-4 relative z-10">
                <div className="relative">
                  {/* Dynamic Medal */}
                  <svg
                    width="64"
                    height="64"
                    viewBox="0 0 64 64"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle
                      cx="32"
                      cy="32"
                      r="30"
                      fill={getRankStyle(ward.currentRank).color}
                      stroke={getRankStyle(ward.currentRank).border}
                      strokeWidth="4"
                    />
                    <circle cx="32" cy="32" r="24" fill={getRankStyle(ward.currentRank).bg} />
                    <text
                      x="32"
                      y="42"
                      fontSize="24"
                      fontWeight="900"
                      fill={getRankStyle(ward.currentRank).textFill}
                      textAnchor="middle"
                    >
                      {ward.currentRank}
                    </text>
                  </svg>
                  <div className="absolute -bottom-2 -left-2 -right-2 flex justify-center">
                    <div
                      className="text-white text-[10px] font-black px-2 py-0.5 rounded shadow-sm"
                      style={{ backgroundColor: getRankStyle(ward.currentRank).border }}
                    >
                      {getRankStyle(ward.currentRank).text}
                    </div>
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-[22px] font-black text-slate-800 leading-tight">
                    Hạng #{ward.currentRank}/56
                  </div>
                  <div className="text-[13px] font-medium text-slate-500 mb-2">
                    Trong bảng xếp hạng 56 phường xã
                  </div>
                  <Link
                    to="/leaderboard"
                    className="text-[12px] font-bold text-[#2563EB] hover:underline flex items-center gap-1"
                  >
                    Xem bảng xếp hạng chi tiết <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>

            {/* Comparison with City Average */}
            <div className="bg-white rounded-[16px] border border-slate-200 shadow-sm p-6">
              <h3 className="font-sans text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-6">
                SO SÁNH TRUNG BÌNH THÀNH PHỐ
              </h3>
              <div className="flex items-end justify-between gap-4 h-[120px] px-4">
                <div className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-12 bg-slate-300 rounded-t-sm relative"
                    style={{ height: "60.4%" }}
                  >
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-slate-600">
                      60.4
                    </div>
                  </div>
                  <div className="text-[12px] font-bold text-slate-500 text-center leading-tight">
                    Trung bình TP
                  </div>
                </div>
                <div className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-12 bg-[#2563EB] rounded-t-sm relative"
                    style={{ height: `${ward.currentScore}%` }}
                  >
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-[#2563EB]">
                      {ward.currentScore.toFixed(1)}
                    </div>
                  </div>
                  <div className="text-[12px] font-bold text-slate-700 text-center">
                    {ward.wardName}
                  </div>
                </div>

                {/* Annotation */}
                <div className="flex-1 flex flex-col justify-center pb-8 pl-4 border-l border-slate-100">
                  <div className="text-[12px] font-semibold text-slate-500 mb-1">
                    Điểm trung bình
                  </div>
                  <div className="text-[28px] font-black text-slate-800 leading-none mb-2">
                    60.4<span className="text-sm text-slate-400">/100</span>
                  </div>
                  <div className="text-[12px] text-slate-600 font-medium">
                    Phường {ward.wardName} cao hơn
                  </div>
                  <div className="text-[13px] font-bold text-emerald-600 flex items-center gap-1 mt-1">
                    <ArrowUpRight size={14} /> +{(ward.currentScore - 60.4).toFixed(1)} điểm
                  </div>
                </div>
              </div>
            </div>

            {/* Ward Location Map */}
            <div className="bg-white rounded-[16px] border border-slate-200 shadow-sm p-6">
              <h3 className="font-sans text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-4">
                VỊ TRÍ TRÊN BẢN ĐỒ
              </h3>
              <WardMiniMap wardName={ward.wardName} />
              <div className="text-[13px] font-semibold text-slate-700 mb-3">
                Phường {ward.wardName}, Quận{" "}
                {ward.wardName === "Hòa Xuân" ? "Cẩm Lệ" : "Liên Chiểu"}, TP. Đà Nẵng
              </div>
              <button className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-[#2563EB] font-bold text-[13px] flex items-center justify-center gap-2 transition-colors">
                <MapPin size={16} /> Xem trên bản đồ lớn
              </button>
            </div>

            {/* Quick Statistics */}
            <div className="bg-white rounded-[16px] border border-slate-200 shadow-sm p-6">
              <h3 className="font-sans text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-5">
                THỐNG KÊ THỰC TẾ
              </h3>
              <div className="flex flex-col gap-5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    <FileText size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="text-[12px] font-semibold text-slate-500">Tổng phản ánh</div>
                    <div className="text-[16px] font-black text-slate-800">
                      {ward.totalFeedbacks}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <CheckCircle2 size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="text-[12px] font-semibold text-slate-500">Đã xử lý</div>
                    <div className="text-[16px] font-black text-slate-800">
                      {ward.resolvedCount}{" "}
                      <span className="text-sm font-bold text-emerald-600">
                        ({((ward.resolvedCount / ward.totalFeedbacks) * 100).toFixed(0)}%)
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                    <Clock size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="text-[12px] font-semibold text-slate-500">Đang xử lý</div>
                    <div className="text-[16px] font-black text-slate-800">
                      1 <span className="text-sm font-bold text-amber-600">(50%)</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
                    <AlertCircle size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="text-[12px] font-semibold text-slate-500">Quá hạn</div>
                    <div className="text-[16px] font-black text-slate-800">
                      0 <span className="text-sm font-bold text-red-600">(0%)</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                    <Clock size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="text-[12px] font-semibold text-slate-500">
                      Thời gian xử lý trung bình
                    </div>
                    <div className="text-[16px] font-black text-slate-800">
                      {ward.avgResolutionHours.toFixed(0)} giờ
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Process Timeline */}
            <div className="bg-white rounded-[16px] border border-slate-200 shadow-sm p-6">
              <h3 className="font-sans text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-6">
                QUY TRÌNH XỬ LÝ PHẢN ÁNH
              </h3>
              <div className="flex items-start justify-between relative px-2">
                {/* Connector Line */}
                <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 -z-10"></div>
                <div className="absolute top-4 left-6 w-1/3 h-0.5 bg-[#2563EB] -z-10"></div>

                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#2563EB] text-white flex items-center justify-center shadow-sm text-xs">
                    <ArrowUpRight size={16} />
                  </div>
                  <div className="text-[11px] font-bold text-slate-700 text-center">
                    Tiếp nhận
                    <br />
                    <span className="text-slate-400 font-medium">0 - 6 giờ</span>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white border-2 border-[#2563EB] text-[#2563EB] flex items-center justify-center shadow-sm text-xs">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  <div className="text-[11px] font-bold text-slate-700 text-center">
                    Phân công
                    <br />
                    <span className="text-slate-400 font-medium">≤ 24 giờ</span>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white border-2 border-slate-300 text-slate-400 flex items-center justify-center shadow-sm text-xs">
                    <Clock size={16} />
                  </div>
                  <div className="text-[11px] font-bold text-slate-400 text-center">
                    Đang xử lý
                    <br />
                    <span className="text-slate-400 font-medium">≤ 48 giờ</span>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm text-xs">
                    <CheckCircle2 size={16} />
                  </div>
                  <div className="text-[11px] font-bold text-emerald-600 text-center">
                    Hoàn thành
                    <br />
                    <span className="text-slate-400 font-medium">≤ 72 giờ</span>
                  </div>
                </div>
              </div>
              <div className="mt-6 bg-slate-50 border border-slate-100 rounded-lg p-3 text-[11px] font-medium text-slate-500 text-center">
                Tất cả phản ánh đều được xử lý đúng quy trình và giám sát chặt chẽ
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── KPI Card ──────────────────────────────────────────────

function KPICard({
  title,
  score,
  weight,
  icon: Icon,
  color,
  barColor,
  desc,
}: {
  title: string;
  score: number | null | undefined;
  weight: string;
  icon: any;
  color: string;
  barColor: string;
  desc: string;
}) {
  const hasScore = score !== null && score !== undefined;
  return (
    <div className="bg-white rounded-[16px] border border-slate-200 shadow-sm p-5 relative overflow-hidden group hover:border-[#1E40AF]/30 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2 text-slate-700 font-bold text-[14px]">
          <Icon size={18} className={color} /> {title}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-slate-300 cursor-help ml-0.5"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
        </div>
      </div>
      {hasScore ? (
        <>
          <div className="flex items-baseline gap-1 mb-3">
            <div className={`text-3xl font-black ${color}`}>{score.toFixed(0)}</div>
            <div className="text-[13px] font-bold text-slate-400">/ 100</div>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mb-3 overflow-hidden">
            <div className={`h-full ${barColor} rounded-full`} style={{ width: `${score}%` }}></div>
          </div>
        </>
      ) : (
        <div className="flex items-baseline gap-1 mb-3 h-[calc(1.875rem+0.375rem+0.75rem)]">
          <div className="text-sm font-semibold text-slate-400">Chưa có đánh giá</div>
        </div>
      )}
      <div className="flex items-center justify-between text-[11px] font-bold">
        <span className="text-slate-500">{weight}</span>
      </div>
      <div className="text-[11px] text-slate-400 mt-1">{desc}</div>
    </div>
  );
}

function ArrowRight(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function ArrowUpRight(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M7 17L17 7" />
      <path d="M7 7h10v10" />
    </svg>
  );
}

function RefreshCw(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

// ─── Ward Mini Map ───────────────────────────────────────────

function WardMiniMap({ wardName }: { wardName: string }) {
  const [leaflet, setLeaflet] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([import("react-leaflet"), import("leaflet")]).then(([reactLeaflet, L]) => {
      if (!cancelled) {
        setLeaflet({ ...reactLeaflet, L: L.default });
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const feature = useMemo(() => {
    return (geoData as any).features.find(
      (f: any) => f.properties?.ten_xa?.toLowerCase().trim() === wardName.toLowerCase().trim(),
    );
  }, [wardName]);

  if (!leaflet || !feature) {
    return (
      <div className="w-full h-[140px] bg-slate-100 rounded-xl mb-3 border border-slate-200 flex items-center justify-center text-slate-400 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(90deg, #cbd5e1 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        ></div>
        <MapPin size={32} />
      </div>
    );
  }

  const { MapContainer, TileLayer, GeoJSON, useMap, L } = leaflet;

  const BoundsComponent = ({ data }: { data: any }) => {
    const map = useMap();
    useEffect(() => {
      const geoJsonLayer = L.geoJSON(data);
      map.fitBounds(geoJsonLayer.getBounds(), { padding: [10, 10] });
    }, [data, map, L]);
    return null;
  };

  const geoJsonStyle = {
    fillColor: "#2563EB",
    weight: 2,
    opacity: 1,
    color: "#1E40AF",
    fillOpacity: 0.3,
  };

  return (
    <div className="w-full h-[140px] rounded-xl mb-3 border border-slate-200 overflow-hidden relative z-0">
      <MapContainer
        center={[16.0544, 108.2022]}
        zoom={13}
        zoomControl={false}
        attributionControl={false}
        scrollWheelZoom={false}
        dragging={false}
        doubleClickZoom={false}
        className="w-full h-full"
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
        <GeoJSON data={feature} style={geoJsonStyle} />
        <BoundsComponent data={feature} />
      </MapContainer>
    </div>
  );
}
