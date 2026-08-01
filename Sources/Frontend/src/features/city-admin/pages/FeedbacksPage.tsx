import { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { feedbackApi, type FeedbackResponse } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  X,
  Eye,
  ExternalLink,
  Clock,
  CheckCircle,
  AlertCircle,
  Filter,
  FileText,
  MapPin,
  Trash2,
  User,
  Calendar,
  Tag,
  TrendingUp,
  TrendingDown,
  Activity,
  Settings,
  Download,
  Upload,
  RefreshCw,
  MoreVertical,
  Edit2,
  MessageSquare,
  Phone,
  Mail,
  CheckSquare,
  Square,
  ArrowUpDown,
  Zap,
  Target,
  BarChart3,
} from "lucide-react";
import { mapStatus } from "@/lib/status";
import { FeedbackDetailModal } from "./FeedbackDetailModal";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  SUBMITTED: { bg: "bg-slate-50", text: "text-slate-600", dot: "bg-slate-400" },
  PENDING_RECEIVE: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  PENDING: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  NEED_LOCATION_REVIEW: { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500" },
  IN_PROGRESS: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  ASSIGNED: { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500" },
  WAITING_INFO: { bg: "bg-indigo-50", text: "text-indigo-700", dot: "bg-indigo-500" },
  RESOLVED: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  REJECTED: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
};

const PRIORITY_LEVELS = {
  HIGH: { label: "Khẩn cấp", color: "text-red-600", bg: "bg-red-100", icon: AlertCircle },
  MEDIUM: { label: "Quan trọng", color: "text-orange-600", bg: "bg-orange-100", icon: Clock },
  LOW: { label: "Thông thường", color: "text-blue-600", bg: "bg-blue-100", icon: CheckCircle },
};

const WARD_LIST = [
  "Hải Châu",
  "Thanh Khê",
  "Liên Chiểu",
  "Sơn Trà",
  "Ngũ Hành Sơn",
  "Cẩm Lệ",
  "Hòa Vang",
];

export function FeedbacksPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [wardFilter, setWardFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [page, setPage] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "grid" | "kanban">("table");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const PAGE_SIZE = 15;

  const {
    data: feedbacksPage,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["admin", "feedbacks", "all"],
    queryFn: () => feedbackApi.adminGetAll(0, 500),
    staleTime: 30_000,
    refetchInterval: 60_000, // Auto-refresh every minute
  });

  const allFeedbacks = feedbacksPage?.content ?? [];

  // Auto-refresh effect
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refetch();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [refetch]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast.success("Đã cập nhật dữ liệu mới nhất");
    } catch (error) {
      toast.error("Không thể cập nhật dữ liệu");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Enhanced filtering and sorting
  const getPriority = (feedback: any): keyof typeof PRIORITY_LEVELS => {
    const daysSinceCreated =
      (Date.now() - new Date(feedback.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    const isUrgent = ["EMERGENCY", "SAFETY"].some(
      (keyword) =>
        feedback.title?.toUpperCase().includes(keyword) ||
        feedback.categoryName?.toUpperCase().includes(keyword),
    );

    if (isUrgent || daysSinceCreated > 7) return "HIGH";
    if (daysSinceCreated > 3) return "MEDIUM";
    return "LOW";
  };

  const categories = useMemo(() => {
    const cats = new Set(allFeedbacks.map((f) => f.categoryName).filter(Boolean));
    return Array.from(cats) as string[];
  }, [allFeedbacks]);

  const filtered = useMemo(() => {
    let data = [...allFeedbacks];

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (f) =>
          f.trackingCode?.toLowerCase().includes(q) ||
          f.title?.toLowerCase().includes(q) ||
          f.wardName?.toLowerCase().includes(q) ||
          f.citizenName?.toLowerCase().includes(q) ||
          f.categoryName?.toLowerCase().includes(q),
      );
    }

    // Status filter
    if (statusFilter) data = data.filter((f) => f.status === statusFilter);

    // Category filter
    if (categoryFilter) data = data.filter((f) => f.categoryName === categoryFilter);

    // Ward filter
    if (wardFilter) data = data.filter((f) => f.wardName === wardFilter);

    // Priority filter
    if (priorityFilter) {
      data = data.filter((f) => getPriority(f) === priorityFilter);
    }

    // Date filter
    if (dateFilter) {
      const now = new Date();
      const filterDate = new Date();

      switch (dateFilter) {
        case "today":
          filterDate.setHours(0, 0, 0, 0);
          data = data.filter((f) => new Date(f.createdAt) >= filterDate);
          break;
        case "week":
          filterDate.setDate(now.getDate() - 7);
          data = data.filter((f) => new Date(f.createdAt) >= filterDate);
          break;
        case "month":
          filterDate.setMonth(now.getMonth() - 1);
          data = data.filter((f) => new Date(f.createdAt) >= filterDate);
          break;
      }
    }

    // Sorting
    data.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case "createdAt":
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case "priority":
          const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
          aValue = priorityOrder[getPriority(a)];
          bValue = priorityOrder[getPriority(b)];
          break;
        case "title":
          aValue = a.title?.toLowerCase() || "";
          bValue = b.title?.toLowerCase() || "";
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return data;
  }, [
    allFeedbacks,
    search,
    statusFilter,
    categoryFilter,
    wardFilter,
    priorityFilter,
    dateFilter,
    sortBy,
    sortOrder,
  ]);

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const stats = useMemo(() => {
    const total = allFeedbacks.length;
    const pending = allFeedbacks.filter((f) => !["RESOLVED", "REJECTED"].includes(f.status)).length;
    const resolved = allFeedbacks.filter((f) => f.status === "RESOLVED").length;
    const overdue = allFeedbacks.filter(
      (f) =>
        !["RESOLVED", "REJECTED"].includes(f.status) &&
        Date.now() - new Date(f.createdAt).getTime() > 3 * 86400000,
    ).length;
    const inProgress = allFeedbacks.filter((f) => f.status === "IN_PROGRESS").length;
    const highPriority = allFeedbacks.filter((f) => getPriority(f) === "HIGH").length;

    // Calculate trends (mock data for demo)
    const trends = {
      total: { value: "+12%", isUp: true },
      pending: { value: "-5%", isUp: false },
      resolved: { value: "+18%", isUp: true },
      overdue: { value: "-8%", isUp: false },
    };

    return { total, pending, resolved, overdue, inProgress, highPriority, trends };
  }, [allFeedbacks]);

  // Selection handlers
  const handleSelectFeedback = (id: number, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(paginated.map((f) => f.id));
      setSelectedIds(allIds);
      setShowBulkActions(true);
    } else {
      setSelectedIds(new Set());
      setShowBulkActions(false);
    }
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedIds.size === 0) return;

    try {
      // Mock bulk update - replace with actual API call
      await Promise.all(
        Array.from(selectedIds).map((id) => feedbackApi.changeStatus(id, newStatus)),
      );

      await queryClient.invalidateQueries({ queryKey: ["admin", "feedbacks", "all"] });
      setSelectedIds(new Set());
      setShowBulkActions(false);
      toast.success(`Đã cập nhật trạng thái cho ${selectedIds.size} phản ánh`);
    } catch (error) {
      toast.error("Không thể cập nhật trạng thái");
    }
  };

  const handleDeleteFeedback = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Bạn có chắc chắn muốn xóa phản ánh này? Hành động này không thể hoàn tác.")) {
      try {
        await feedbackApi.delete(id);
        await queryClient.invalidateQueries({ queryKey: ["admin", "feedbacks", "all"] });
        toast.success("Đã xóa phản ánh thành công");
      } catch (error) {
        toast.error("Không thể xóa phản ánh");
      }
    }
  };

  const exportFeedbacks = () => {
    // Mock export functionality
    const csv =
      "trackingCode,title,status,categoryName,wardName,citizenName,createdAt\n" +
      filtered
        .map(
          (f) =>
            `${f.trackingCode},${f.title},${f.status},${f.categoryName},${f.wardName},${f.citizenName},${f.createdAt}`,
        )
        .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "feedbacks-export.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Đã xuất dữ liệu phản ánh");
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setCategoryFilter("");
    setWardFilter("");
    setPriorityFilter("");
    setDateFilter("");
    setPage(0);
  };

  return (
    <div className="space-y-6">
      {/* Modern Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="hidden lg:block"></div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 shadow-sm font-medium bg-white"
          >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
            <span className="hidden sm:block">Làm mới</span>
          </button>
          <button
            onClick={exportFeedbacks}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            <Download size={14} />
            Xuất Excel
          </button>
          
          {/* Segmented Control */}
          <div className="flex items-center p-1 bg-slate-100/80 rounded-lg border border-slate-200/60 shadow-inner">
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                viewMode === "table" ? "bg-white text-slate-800 shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
              }`}
            >
              Bảng
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                viewMode === "grid" ? "bg-white text-slate-800 shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
              }`}
            >
              Lưới
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                viewMode === "kanban" ? "bg-white text-slate-800 shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
              }`}
            >
              Kanban
            </button>
          </div>
        </div>
      </div>

      {/* Minimalist KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          {
            label: "Tổng phản ánh",
            value: stats.total,
            icon: FileText,
            color: "text-slate-900",
            iconColor: "text-blue-600",
            bg: "bg-blue-50/50",
            trend: stats.trends.total,
          },
          {
            label: "Chờ xử lý",
            value: stats.pending,
            icon: Clock,
            color: "text-slate-900",
            iconColor: "text-orange-500",
            bg: "bg-orange-50/50",
            trend: stats.trends.pending,
          },
          {
            label: "Đã giải quyết",
            value: stats.resolved,
            icon: CheckCircle,
            color: "text-slate-900",
            iconColor: "text-emerald-500",
            bg: "bg-emerald-50/50",
            trend: stats.trends.resolved,
          },
          {
            label: "Ưu tiên cao",
            value: stats.highPriority,
            icon: AlertCircle,
            color: "text-slate-900",
            iconColor: "text-red-500",
            bg: "bg-red-50/50",
            trend: { value: "+2", isUp: false },
          },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="bg-white rounded-2xl p-5 border border-slate-200/70 shadow-sm flex flex-col justify-between"
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-10 h-10 rounded-full ${stat.bg} ${stat.iconColor} flex items-center justify-center shrink-0`}
                >
                  <Icon size={18} />
                </div>
                <div className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
                  {stat.label}
                </div>
              </div>
              <div className="flex items-end justify-between">
                <div className={`text-3xl font-bold tracking-tight ${stat.color}`}>
                  {isLoading ? "—" : stat.value.toLocaleString("vi-VN")}
                </div>
                {stat.trend && (
                  <div
                    className={`text-xs font-bold flex items-center gap-1 ${
                      stat.trend.isUp ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {stat.trend.isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {stat.trend.value}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Advanced Filters & Controls */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/70 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="text-slate-500" size={16} />
            <h3 className="text-sm font-bold text-slate-800">Bộ lọc & Tìm kiếm</h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
              <span className="text-xs font-semibold text-slate-500">Sắp xếp:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer border-none p-0 pr-4"
              >
                <option value="createdAt">Ngày tạo</option>
                <option value="priority">Độ ưu tiên</option>
                <option value="status">Trạng thái</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="text-slate-400 hover:text-[#0B4FC4] p-1 rounded transition-colors"
              >
                <ArrowUpDown size={14} />
              </button>
            </div>
            
            {filtered.length !== allFeedbacks.length && (
              <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-100">
                {filtered.length} kết quả
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative lg:col-span-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Mã, tiêu đề..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="w-full pl-9 pr-3 py-2 text-sm font-medium border border-slate-200/60 bg-slate-50/50 hover:bg-slate-100/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B4FC4]/20 focus:bg-white transition-all"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            className="px-3 py-2 text-sm font-medium border border-slate-200/60 bg-slate-50/50 hover:bg-slate-100/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B4FC4]/20 focus:bg-white cursor-pointer transition-all"
          >
            <option value="">Trạng thái (Tất cả)</option>
            <option value="SUBMITTED">Vừa gửi</option>
            <option value="PENDING">Đang chờ</option>
            <option value="IN_PROGRESS">Đang xử lý</option>
            <option value="WAITING_INFO">Chờ bổ sung</option>
            <option value="RESOLVED">Đã giải quyết</option>
            <option value="REJECTED">Từ chối</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setPage(0);
            }}
            className="px-3 py-2 text-sm font-medium border border-slate-200/60 bg-slate-50/50 hover:bg-slate-100/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B4FC4]/20 focus:bg-white cursor-pointer transition-all"
          >
            <option value="">Mức độ (Tất cả)</option>
            <option value="HIGH">Khẩn cấp</option>
            <option value="MEDIUM">Quan trọng</option>
            <option value="LOW">Thông thường</option>
          </select>

          {/* Ward Filter */}
          <select
            value={wardFilter}
            onChange={(e) => {
              setWardFilter(e.target.value);
              setPage(0);
            }}
            className="px-3 py-2 text-sm font-medium border border-slate-200/60 bg-slate-50/50 hover:bg-slate-100/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B4FC4]/20 focus:bg-white cursor-pointer transition-all"
          >
            <option value="">Khu vực (Tất cả)</option>
            {WARD_LIST.map((ward) => (
              <option key={ward} value={ward}>
                {ward}
              </option>
            ))}
          </select>

          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setPage(0);
            }}
            className="px-3 py-2 text-sm font-medium border border-slate-200/60 bg-slate-50/50 hover:bg-slate-100/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B4FC4]/20 focus:bg-white cursor-pointer transition-all"
          >
            <option value="">Thời gian (Tất cả)</option>
            <option value="today">Hôm nay</option>
            <option value="week">Tuần này</option>
            <option value="month">Tháng này</option>
          </select>
        </div>

        {/* Active Filters Clear Button */}
        {(search || statusFilter || priorityFilter || wardFilter || dateFilter) && (
          <div className="mt-3 flex justify-end">
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-600 border border-red-200 bg-red-50 rounded-lg hover:bg-red-100 transition"
            >
              <X size={12} />
              Xóa tất cả bộ lọc
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200/60">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/80 border-b border-slate-200/70">
              <tr className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">
                <th className="px-5 py-4">Mã phản ánh</th>
                <th className="px-4 py-4">Tiêu đề</th>
                <th className="px-4 py-4">Người gửi</th>
                <th className="px-4 py-4">Khu vực</th>
                <th className="px-4 py-4">Lĩnh vực</th>
                <th className="px-4 py-4 text-center">Trạng thái</th>
                <th className="px-4 py-4 text-right">Ngày gửi</th>
                <th className="px-4 py-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8} className="px-5 py-3">
                      <Skeleton className="h-10 w-full rounded" />
                    </td>
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-sm text-slate-400">
                    Không có phản ánh nào phù hợp.
                  </td>
                </tr>
              ) : (
                paginated.map((fb) => (
                  <tr 
                    key={fb.id} 
                    className="hover:bg-slate-50 transition-colors group cursor-pointer"
                    onClick={() => setSelectedId(fb.id)}
                  >
                    <td className="px-5 py-4 font-mono text-[13px] font-bold text-slate-700 group-hover:text-[#0B4FC4] transition-colors">
                      {fb.trackingCode || `#${fb.id}`}
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-semibold text-slate-800 line-clamp-2 max-w-[250px] leading-snug">
                        {fb.title}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-slate-600">{fb.citizenName || "—"}</td>
                    <td className="px-4 py-4 text-sm text-slate-600">{fb.wardName || "—"}</td>
                    <td className="px-4 py-4">
                      <span className="inline-flex px-2.5 py-1 bg-slate-100 text-slate-600 text-[11px] font-bold rounded-lg border border-slate-200">
                        {fb.categoryName || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200/60">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${STATUS_COLORS[fb.status]?.dot || "bg-slate-400"}`}
                        />
                        <span className={`text-[11px] font-bold uppercase tracking-wide ${STATUS_COLORS[fb.status]?.text || "text-slate-600"}`}>
                          {mapStatus(fb.status)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right text-sm text-slate-500 font-medium">
                      {fb.createdAt ? new Date(fb.createdAt).toLocaleDateString("vi-VN") : "—"}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedId(fb.id);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-[#0B4FC4] hover:bg-blue-50 transition-colors cursor-pointer bg-white border border-slate-200 shadow-sm"
                          title="Xem chi tiết"
                        >
                          <Eye size={16} />
                        </button>
                        <a
                          href={`/my-reports/${fb.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer bg-white border border-slate-200 shadow-sm inline-block"
                          title="Xem trên trang người dân"
                        >
                          <ExternalLink size={16} />
                        </a>
                        <button
                          onClick={(e) => handleDeleteFeedback(fb.id, e)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer bg-white border border-slate-200 shadow-sm"
                          title="Xóa phản ánh"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Trang {page + 1} / {totalPages} ({filtered.length} kết quả)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition cursor-pointer"
              >
                ← Trước
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition cursor-pointer"
              >
                Tiếp →
              </button>
            </div>
          </div>
        )}
      </div>
      <FeedbackDetailModal feedbackId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}
