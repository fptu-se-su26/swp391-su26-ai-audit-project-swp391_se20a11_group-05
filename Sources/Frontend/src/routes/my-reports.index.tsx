import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, lazy, Suspense } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useFeedbacks, useFeedbackStatuses } from "@/lib/hooks";
import { EmptyState, ErrorState, NotLoggedIn } from "@/components/site/EmptyState";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  MapPin,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  RefreshCw,
  Headset,
  Calendar,
  Grid,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Info,
  Loader2,
  X,
} from "lucide-react";
import { mapStatus } from "@/lib/status";
import { toast } from "sonner";
import { Role, AUTHORITY_ROLES, parseBackendRole } from "@/lib/roles";
import {
  getToken,
  categoryApi,
  analyticsApi,
  type FeedbackAttachmentResponse,
  type FeedbackStatus,
  type CategoryResponse,
  type KpiData,
} from "@/lib/api";

const CivicMap = lazy(() =>
  import("@/components/site/CivicMap").then((m) => ({ default: m.CivicMap })),
);

export const Route = createFileRoute("/my-reports/")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: (search.q as string) || "",
  }),
  beforeLoad: async () => {
    const token = typeof window !== "undefined" ? getToken() : null;
    const raw = typeof window !== "undefined" ? localStorage.getItem("dn_auth_user_v2") : null;

    if (!token || !raw) {
      throw redirect({ to: "/login", search: { error: "auth_required", redirect: "/my-reports" } });
    }

    let user: { role: string } | null = null;
    try {
      user = JSON.parse(raw);
    } catch {
      /* ignore */
    }

    if (!user)
      throw redirect({ to: "/login", search: { redirect: undefined, error: "auth_required" } });

    const role = parseBackendRole(user.role);

    // Authority staff should not access citizen report list
    if (AUTHORITY_ROLES.has(role)) {
      throw redirect({ to: "/login", search: { redirect: undefined, error: "forbidden" } });
    }

    // Confirm CITIZEN role
    if (role !== Role.CITIZEN) {
      throw redirect({ to: "/login", search: { redirect: undefined, error: "forbidden" } });
    }
  },
  head: () => ({
    meta: [
      { title: "Tra cứu phản ánh — Đà Nẵng Kết Nối" },
      { name: "description", content: "Tìm kiếm và theo dõi tình trạng xử lý các phản ánh hiện trường." },
    ],
  }),
  component: MyReports,
});

function MyReports() {
  const { locale } = useI18n();
  const navigate = useNavigate();
  const { q = "" } = Route.useSearch();
  const { isAuthenticated } = useAuth();

  // Search & Filter Panel state variables
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [keywordInput, setKeywordInput] = useState(q);
  const [locationInput, setLocationInput] = useState("");
  const [categoryInput, setCategoryInput] = useState("");
  const [statusInput, setStatusInput] = useState<FeedbackStatus | "">("");
  const [fromDateInput, setFromDateInput] = useState("");
  const [toDateInput, setToDateInput] = useState("");

  const [dateRangeOpen, setDateRangeOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortBy, setSortBy] = useState("newest");

  // Committed search filters
  const [filters, setFilters] = useState({
    keyword: q,
    location: "",
    category: "",
    status: "" as FeedbackStatus | "",
    fromDate: "",
    toDate: "",
  });

  // Sync search URL query parameter
  useEffect(() => {
    if (q) {
      setKeywordInput(q);
      setPage(0);
      setFilters((prev) => ({ ...prev, keyword: q }));
    }
  }, [q]);

  // Categories list query
  const { data: categories = [] } = useQuery<CategoryResponse[]>({
    queryKey: ["categories"],
    queryFn: () => categoryApi.getAll(),
  });

  // KPI Overview stats query
  const { data: analyticsKpi } = useQuery<KpiData>({
    queryKey: ["analytics", "kpi"],
    queryFn: () => analyticsApi.kpi(),
    retry: false,
  });

  // Construct query filters to send to backend API
  const apiFilters = useMemo(() => {
    const parts = [];
    if (filters.keyword.trim()) parts.push(filters.keyword.trim());
    if (filters.location.trim()) parts.push(filters.location.trim());
    const mergedKeyword = parts.join(" ");

    return {
      keyword: mergedKeyword,
      status: filters.status,
      fromDate: filters.fromDate,
      toDate: filters.toDate,
    };
  }, [filters]);

  // Main reports list fetch
  const {
    data: feedbacksPage,
    isLoading,
    isFetching,
    refetch,
    error,
    isError,
  } = useFeedbacks(page, pageSize, apiFilters);

  // Fetch all citizen reports in background to calculate fallback statistics
  const { data: allCitizenFeedbacks } = useFeedbacks(0, 1000, {
    keyword: "",
    status: "",
    fromDate: "",
    toDate: "",
  });

  const { data: statuses = [] } = useFeedbackStatuses();

  // Reset page number on filter changes
  useEffect(() => {
    setPage(0);
  }, [filters.keyword, filters.location, filters.category, filters.status, filters.fromDate, filters.toDate]);

  if (!isAuthenticated) {
    return <NotLoggedIn />;
  }

  const feedbacks = feedbacksPage?.content ?? [];
  const totalPages = feedbacksPage?.totalPages ?? 0;

  // Client-side category filter fallback (backend doesn't support category param)
  const filteredFeedbacks = useMemo(() => {
    let list = feedbacks;
    if (filters.category) {
      list = list.filter((f) => {
        const catName = f.categoryName || f.category || "";
        return catName.toLowerCase().includes(filters.category.toLowerCase());
      });
    }
    return list;
  }, [feedbacks, filters.category]);

  // Client-side sorting fallback (backend forces newest first)
  const sortedFeedbacks = useMemo(() => {
    const list = [...filteredFeedbacks];
    if (sortBy === "oldest") {
      list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sortBy === "updated") {
      list.sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime(),
      );
    } else {
      // Default: newest
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return list;
  }, [filteredFeedbacks, sortBy]);

  // Combined statistics helper
  const stats = useMemo(() => {
    if (analyticsKpi) {
      const total = analyticsKpi.total;
      const resolved = analyticsKpi.resolved;
      const pending = analyticsKpi.pending;
      const rejected = Math.max(0, total - resolved - pending);
      return { total, resolved, pending, rejected };
    }

    // Fallback: Calculate citizen's own report summary
    const list = allCitizenFeedbacks?.content ?? [];
    const total = allCitizenFeedbacks?.totalElements ?? list.length;
    const resolved = list.filter((f) => f.status === "RESOLVED").length;
    const rejected = list.filter((f) => f.status === "REJECTED").length;
    const pending = Math.max(0, total - resolved - rejected);
    return { total, resolved, pending, rejected };
  }, [analyticsKpi, allCitizenFeedbacks]);

  // Popular categories calculations based on real data list
  const categoryStats = useMemo(() => {
    const list = allCitizenFeedbacks?.content ?? feedbacks;
    if (!list || list.length === 0) return [];
    const counts: Record<string, number> = {};
    list.forEach((f) => {
      const cat = f.categoryName || f.category || "Khác";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    const total = list.length;
    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }, [allCitizenFeedbacks, feedbacks]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPage(0);
    setFilters({
      keyword: keywordInput,
      location: locationInput,
      category: categoryInput,
      status: statusInput,
      fromDate: fromDateInput,
      toDate: toDateInput,
    });
  };

  const handleReset = () => {
    setPage(0);
    setKeywordInput("");
    setLocationInput("");
    setCategoryInput("");
    setStatusInput("");
    setFromDateInput("");
    setToDateInput("");
    setFilters({
      keyword: "",
      location: "",
      category: "",
      status: "",
      fromDate: "",
      toDate: "",
    });
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "RESOLVED":
        return {
          label: locale === "vi" ? "Đã xử lý" : "Resolved",
          badgeClass: "bg-[#EAF8EF] text-[#16A34A]",
        };
      case "IN_PROGRESS":
      case "ASSIGNED":
        return {
          label: locale === "vi" ? "Đang xử lý" : "Processing",
          badgeClass: "bg-[#FFF4E8] text-[#F97316]",
        };
      case "REJECTED":
        return {
          label: locale === "vi" ? "Từ chối" : "Rejected",
          badgeClass: "bg-[#FDECEC] text-[#DC2626]",
        };
      case "PENDING":
      default:
        return {
          label: locale === "vi" ? "Tiếp nhận" : "Received",
          badgeClass: "bg-[#EAF2FF] text-[#0B4FC4]",
        };
    }
  };

  const pageButtons = getVisiblePageIndexes(page, totalPages);

  return (
    <div className="w-full flex flex-col min-h-screen" style={{ background: "#F7FAFF" }}>
      {/* 1. Hero Banner */}
      <section
        className="relative w-full h-[260px] md:h-[280px] flex items-center bg-cover bg-center overflow-hidden border-b border-[#E4EAF2]"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.96) 40%, rgba(255,255,255,0.85) 60%, rgba(255,255,255,0.2) 100%), url('https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1600&h=600&q=80')`,
        }}
      >
        <div className="max-w-[1440px] mx-auto w-full px-6 md:px-12 flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          {/* Left: Headline info */}
          <div className="max-w-[600px] flex flex-col justify-center">
            <h1 className="font-serif text-[#123E8A] text-4xl md:text-5xl font-bold leading-tight mb-3">
              Tra cứu phản ánh
            </h1>
            <p className="text-[#475467] text-sm md:text-base leading-relaxed">
              Tìm kiếm và theo dõi tình trạng xử lý các phản ánh hiện trường của người dân trên địa bàn thành phố Đà Nẵng.
            </p>
          </div>

          {/* Right: Hotline card */}
          <div className="shrink-0 flex justify-start md:justify-end">
            <a
              href="tel:1022"
              className="bg-white rounded-2xl border border-[#E4EAF2] p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow duration-200"
            >
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-[#0B4FC4]">
                <Headset size={22} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-[#667085] uppercase tracking-wider leading-none mb-1">
                  Cần hỗ trợ?
                </span>
                <span className="text-xs text-[#475467] leading-none mb-1">
                  Gọi ngay đường dây nóng
                </span>
                <span className="text-2xl font-extrabold text-[#0B4FC4] leading-tight font-sans">
                  1022
                </span>
                <span className="text-[10px] text-[#667085] mt-0.5 leading-none">
                  24/7 · Miễn phí
                </span>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Center container */}
      <div className="max-w-[1440px] mx-auto w-full px-6 md:px-12 pb-16">
        {/* 2. Large Search & Filter Panel */}
        <div className="-mt-12 relative z-20 bg-white border border-[#E4EAF2] rounded-2xl p-6 shadow-md mb-8">
          <form onSubmit={handleSearchSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Field 1: Từ khóa */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="filter-keyword" className="text-xs font-bold text-[#667085] uppercase tracking-wider">
                  Từ khóa
                </label>
                <div className="relative">
                  <input
                    id="filter-keyword"
                    type="text"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    placeholder="Nhập mã, tiêu đề, nội dung..."
                    className="w-full min-h-[48px] pl-4 pr-10 rounded-xl border-2 border-slate-200 bg-white text-sm focus:border-[#0B4FC4] outline-none transition-colors"
                  />
                  <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              {/* Field 2: Lĩnh vực */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="filter-category" className="text-xs font-bold text-[#667085] uppercase tracking-wider">
                  Lĩnh vực
                </label>
                <select
                  id="filter-category"
                  value={categoryInput}
                  onChange={(e) => setCategoryInput(e.target.value)}
                  className="w-full min-h-[48px] px-3.5 rounded-xl border-2 border-slate-200 bg-white text-sm focus:border-[#0B4FC4] outline-none transition-colors appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml;utf8,<svg fill='%23667085' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/></svg>")`,
                    backgroundPosition: "right 12px center",
                    backgroundRepeat: "no-repeat",
                  }}
                >
                  <option value="">Tất cả lĩnh vực</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Field 3: Địa điểm */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="filter-location" className="text-xs font-bold text-[#667085] uppercase tracking-wider">
                  Địa điểm
                </label>
                <div className="relative">
                  <input
                    id="filter-location"
                    type="text"
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    placeholder="Nhập địa điểm, phường, quận..."
                    className="w-full min-h-[48px] pl-4 pr-10 rounded-xl border-2 border-slate-200 bg-white text-sm focus:border-[#0B4FC4] outline-none transition-colors"
                  />
                  <MapPin size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              {/* Field 4: Trạng thái */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="filter-status" className="text-xs font-bold text-[#667085] uppercase tracking-wider">
                  Trạng thái
                </label>
                <select
                  id="filter-status"
                  value={statusInput}
                  onChange={(e) => setStatusInput(e.target.value as FeedbackStatus | "")}
                  className="w-full min-h-[48px] px-3.5 rounded-xl border-2 border-slate-200 bg-white text-sm focus:border-[#0B4FC4] outline-none transition-colors appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml;utf8,<svg fill='%23667085' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/></svg>")`,
                    backgroundPosition: "right 12px center",
                    backgroundRepeat: "no-repeat",
                  }}
                >
                  <option value="">Tất cả trạng thái</option>
                  {statuses.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Field 5: Thời gian */}
              <div className="flex flex-col gap-1.5 relative">
                <label className="text-xs font-bold text-[#667085] uppercase tracking-wider">
                  Thời gian
                </label>
                <button
                  type="button"
                  onClick={() => setDateRangeOpen(!dateRangeOpen)}
                  className="w-full min-h-[48px] px-4 rounded-xl border-2 border-slate-200 bg-white text-sm text-left flex items-center justify-between text-[#475467] hover:border-[#0B4FC4] transition-colors"
                >
                  <span className="truncate flex items-center gap-2">
                    <Calendar size={16} className="text-slate-400" />
                    {fromDateInput || toDateInput
                      ? `${fromDateInput || "..."} → ${toDateInput || "..."}`
                      : "Chọn khoảng thời gian"}
                  </span>
                  <ChevronDown size={14} className="text-slate-400" />
                </button>

                {dateRangeOpen && (
                  <div className="absolute top-[70px] left-0 right-0 lg:left-auto lg:right-0 w-[280px] bg-white border border-[#E4EAF2] rounded-xl shadow-lg p-4 z-50 space-y-3">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-[#667085]">Từ ngày</span>
                      <input
                        type="date"
                        value={fromDateInput}
                        onChange={(e) => setFromDateInput(e.target.value)}
                        className="w-full h-10 border border-slate-200 rounded-lg px-2 text-sm focus:border-[#0B4FC4] outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-[#667085]">Đến ngày</span>
                      <input
                        type="date"
                        value={toDateInput}
                        onChange={(e) => setToDateInput(e.target.value)}
                        className="w-full h-10 border border-slate-200 rounded-lg px-2 text-sm focus:border-[#0B4FC4] outline-none"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setFromDateInput("");
                          setToDateInput("");
                        }}
                        className="px-2.5 py-1 text-xs font-semibold text-[#667085] hover:text-[#0B4FC4] hover:bg-slate-50 rounded"
                      >
                        Xóa
                      </button>
                      <button
                        type="button"
                        onClick={() => setDateRangeOpen(false)}
                        className="px-3 py-1 bg-[#0B4FC4] text-white text-xs font-semibold rounded hover:bg-blue-700"
                      >
                        Áp dụng
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions Row */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-4 flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setFiltersOpen(!filtersOpen)}
                className={`min-h-[40px] px-4 rounded-lg border-2 text-xs font-bold transition-colors flex items-center gap-2 ${
                  filtersOpen
                    ? "border-[#0B4FC4] bg-[#0B4FC4] text-white"
                    : "border-slate-200 bg-white text-[#0B4FC4] hover:bg-blue-50/50"
                }`}
              >
                <SlidersHorizontal size={14} />
                Bộ lọc nâng cao
              </button>

              <div className="flex items-center gap-3 ml-auto">
                <button
                  type="button"
                  onClick={handleReset}
                  className="min-h-[40px] px-4 rounded-lg border-2 border-slate-200 bg-white text-xs font-bold text-[#475467] hover:bg-slate-50 transition-colors flex items-center gap-2"
                >
                  <RefreshCw size={14} />
                  Đặt lại
                </button>
                <button
                  type="submit"
                  className="min-h-[40px] px-6 rounded-lg bg-[#0B4FC4] hover:bg-blue-700 text-xs font-bold text-white transition-colors flex items-center gap-2 shadow-sm"
                >
                  <Search size={14} />
                  Tìm kiếm
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* 3. Two-Column split area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Report results list */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white border border-[#E4EAF2] rounded-2xl p-5 md:p-6 shadow-sm space-y-6">
              {/* Header result info */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 flex-wrap gap-2">
                <div className="text-sm font-semibold text-[#475467]">
                  Tổng số{" "}
                  <span className="text-2xl font-extrabold text-[#0B4FC4] font-sans inline-block align-middle -mt-1 mx-1">
                    {feedbacksPage?.totalElements ?? sortedFeedbacks.length}
                  </span>{" "}
                  phản ánh
                </div>

                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="text-[#667085]">Sắp xếp theo:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-transparent text-[#123E8A] outline-none border-b-2 border-transparent focus:border-[#0B4FC4] cursor-pointer py-1 font-bold"
                  >
                    <option value="newest">Mới nhất</option>
                    <option value="oldest">Cũ nhất</option>
                    <option value="updated">Cập nhật gần nhất</option>
                  </select>
                </div>
              </div>

              {/* Error state */}
              {isError && !isLoading && (
                <ErrorState
                  message={
                    error instanceof Error
                      ? error.message
                      : locale === "vi"
                        ? "Không thể tải dữ liệu phản ánh."
                        : "Failed to load reports."
                  }
                  onRetry={() => refetch()}
                  compact
                />
              )}

              {/* Loading skeleton */}
              {isLoading && (
                <div className="space-y-4">
                  {[1, 2, 3].map((s) => (
                    <div key={s} className="border border-[#E4EAF2] rounded-2xl p-5 flex gap-4 animate-pulse">
                      <div className="w-32 aspect-[16/10] bg-slate-100 rounded-xl" />
                      <div className="flex-1 space-y-3">
                        <div className="h-4 bg-slate-100 rounded w-1/4" />
                        <div className="h-5 bg-slate-100 rounded w-3/4" />
                        <div className="h-4 bg-slate-100 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Empty state */}
              {!isLoading && !isError && sortedFeedbacks.length === 0 && (
                <EmptyState
                  title="Không tìm thấy phản ánh phù hợp."
                  description="Vui lòng thử thay đổi từ khóa hoặc bộ lọc tìm kiếm."
                  action={
                    <button onClick={handleReset} className="btn-civic btn-civic-primary">
                      Xóa bộ lọc
                    </button>
                  }
                />
              )}

              {/* List rows */}
              {!isLoading && !isError && sortedFeedbacks.length > 0 && (
                <div className="space-y-4">
                  {sortedFeedbacks.map((report) => (
                    <article
                      key={report.id}
                      onClick={() => navigate({ to: "/my-reports/$id", params: { id: String(report.id) } })}
                      className="bg-white rounded-xl border border-[#E4EAF2] p-4 flex flex-col md:flex-row gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                    >
                      {/* Left thumbnail */}
                      <div className="w-full md:w-36 aspect-[16/10] md:h-[90px] bg-slate-50 rounded-xl overflow-hidden shrink-0 border border-slate-100 relative">
                        <img
                          src={
                            report.attachments?.[0]?.fileUrl ||
                            "https://images.unsplash.com/photo-1596402184320-417e7178b2cd?auto=format&fit=crop&w=150&h=150&q=80"
                          }
                          alt=""
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>

                      {/* Main text content */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 bg-[#EAF2FF] text-[#0B4FC4] text-[9px] font-bold rounded font-mono uppercase tracking-wider">
                              Mã: {report.trackingCode}
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-[#123E8A] leading-snug line-clamp-1 mb-2 hover:text-[#0B4FC4] transition-colors">
                            {report.title}
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-2 gap-x-4 text-[11px] text-[#667085]">
                            <span className="flex items-center gap-1.5 truncate">
                              <MapPin size={13} className="shrink-0 text-slate-400" />
                              {report.addressDetails || report.wardName || "Đà Nẵng"}
                            </span>
                            <span className="flex items-center gap-1.5 truncate">
                              <Grid size={13} className="shrink-0 text-slate-400" />
                              {report.categoryName || report.category || "Khác"}
                            </span>
                            <span className="flex items-center gap-1.5 truncate">
                              <Calendar size={13} className="shrink-0 text-slate-400" />
                              {new Date(report.createdAt).toLocaleDateString("vi-VN")} -{" "}
                              {new Date(report.createdAt).toLocaleTimeString("vi-VN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right action status section */}
                      <div className="flex flex-col items-end justify-between shrink-0 self-stretch md:border-l md:border-slate-100 md:pl-5 md:min-w-[120px] md:pt-0 pt-3 border-t md:border-t-0 border-slate-100">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wide leading-none ${getStatusInfo(report.status).badgeClass}`}>
                          {getStatusInfo(report.status).label}
                        </span>
                        <span className="text-[10px] text-[#667085] font-medium mt-auto md:mb-0 mb-1">
                          Cập nhật: {new Date(report.updatedAt || report.createdAt).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {!isLoading && !isError && totalPages > 1 && (
                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-6 mt-8">
                  <div className="flex items-center gap-1.5">
                    {/* Previous */}
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={feedbacksPage?.first}
                      className="w-9 h-9 rounded-xl border border-[#E4EAF2] bg-white flex items-center justify-center text-slate-400 disabled:opacity-30 hover:bg-slate-50 transition-colors"
                      aria-label="Trang trước"
                    >
                      <ChevronLeft size={16} />
                    </button>

                    {/* Page buttons */}
                    {pageButtons.map((pi) => (
                      <button
                        key={pi}
                        type="button"
                        onClick={() => setPage(pi)}
                        className={`w-9 h-9 rounded-xl font-bold text-xs border transition-colors ${
                          pi === page
                            ? "bg-[#0B4FC4] text-white border-[#0B4FC4]"
                            : "bg-white border-[#E4EAF2] text-[#475467] hover:border-[#0B4FC4]"
                        }`}
                      >
                        {pi + 1}
                      </button>
                    ))}

                    {/* Next */}
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={feedbacksPage?.last}
                      className="w-9 h-9 rounded-xl border border-[#E4EAF2] bg-white flex items-center justify-center text-slate-400 disabled:opacity-30 hover:bg-slate-50 transition-colors"
                      aria-label="Trang sau"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-bold text-[#475467]">
                    <span>Hiển thị:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setPage(0);
                      }}
                      className="bg-white border-2 border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-[#123E8A] focus:border-[#0B4FC4] outline-none cursor-pointer"
                    >
                      <option value={5}>5 / trang</option>
                      <option value={10}>10 / trang</option>
                      <option value={20}>20 / trang</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Informational Note */}
            <div className="bg-[#F4F9FF] border border-[#E1EEFF] rounded-2xl p-4 flex items-start gap-3">
              <Info size={16} className="text-[#0B4FC4] shrink-0 mt-0.5" />
              <p className="text-xs text-[#475467] leading-relaxed">
                Kết quả được cập nhật liên tục. Vui lòng chọn bộ lọc phù hợp để tìm kiếm chính xác hơn.
              </p>
            </div>
          </div>

          {/* Right Column: Sidebar panels */}
          <div className="lg:col-span-4 space-y-6">
            {/* Sidebar 1: Overview Statistics */}
            <div className="bg-white border border-[#E4EAF2] rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-[#123E8A] font-bold text-base border-b border-slate-100 pb-3 flex items-center gap-2">
                Thống kê tổng quan
              </h3>
              {isLoading ? (
                <div className="grid grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map((s) => (
                    <div key={s} className="bg-slate-50 border border-slate-100 rounded-xl p-3 h-[72px] animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {/* Total */}
                  <div className="bg-white border border-[#E4EAF2] rounded-xl p-3 flex items-center justify-between shadow-sm">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase text-[#667085] tracking-wider">Tổng phản ánh</span>
                      <span className="text-xl font-extrabold text-[#0B4FC4] mt-0.5">{stats.total.toLocaleString()}</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-[#0B4FC4] flex items-center justify-center shrink-0">
                      <FileText size={16} />
                    </div>
                  </div>

                  {/* Processing */}
                  <div className="bg-white border border-[#E4EAF2] rounded-xl p-3 flex items-center justify-between shadow-sm">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase text-[#667085] tracking-wider">Đang xử lý</span>
                      <span className="text-xl font-extrabold text-[#F97316] mt-0.5">{stats.pending.toLocaleString()}</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-orange-50 text-[#F97316] flex items-center justify-center shrink-0">
                      <Clock size={16} />
                    </div>
                  </div>

                  {/* Resolved */}
                  <div className="bg-white border border-[#E4EAF2] rounded-xl p-3 flex items-center justify-between shadow-sm">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase text-[#667085] tracking-wider">Đã xử lý</span>
                      <span className="text-xl font-extrabold text-[#16A34A] mt-0.5">{stats.resolved.toLocaleString()}</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-green-50 text-[#16A34A] flex items-center justify-center shrink-0">
                      <CheckCircle2 size={16} />
                    </div>
                  </div>

                  {/* Rejected */}
                  <div className="bg-white border border-[#E4EAF2] rounded-xl p-3 flex items-center justify-between shadow-sm">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase text-[#667085] tracking-wider">Từ chối</span>
                      <span className="text-xl font-extrabold text-[#DC2626] mt-0.5">{stats.rejected.toLocaleString()}</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-red-50 text-[#DC2626] flex items-center justify-center shrink-0">
                      <AlertTriangle size={16} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar 2: Distribution Map */}
            <div className="bg-white border border-[#E4EAF2] rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-1">
                <h3 className="text-[#123E8A] font-bold text-base">
                  Phân bố theo khu vực
                </h3>
                <Link to="/" className="text-xs font-semibold text-[#0B4FC4] hover:underline">
                  Xem chi tiết
                </Link>
              </div>
              <div className="aspect-[4/3] rounded-xl overflow-hidden border border-[#E4EAF2] relative z-0">
                <Suspense fallback={<div className="w-full h-full bg-slate-100 animate-pulse" />}>
                  <CivicMap
                    markers={sortedFeedbacks
                      .filter((f) => f.latitude && f.longitude)
                      .map((f) => ({
                        position: [f.latitude!, f.longitude!] as [number, number],
                        title: f.title,
                        description: f.description,
                        status: mapStatus(f.status),
                      }))}
                    height="100%"
                    interactive={false}
                  />
                </Suspense>
              </div>
              <Link
                to="/"
                className="w-full min-h-[40px] rounded-lg border border-slate-200 hover:border-[#0B4FC4] bg-white text-xs font-bold text-[#475467] hover:text-[#0B4FC4] transition-colors flex items-center justify-center gap-2 border-2"
              >
                Xem trên bản đồ lớn
                <ExternalLink size={14} />
              </Link>
            </div>

            {/* Sidebar 3: Popular Categories */}
            {categoryStats.length > 0 && (
              <div className="bg-white border border-[#E4EAF2] rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-1">
                  <h3 className="text-[#123E8A] font-bold text-base">
                    Lĩnh vực phổ biến
                  </h3>
                  <Link to="/my-reports" className="text-xs font-semibold text-[#0B4FC4] hover:underline">
                    Xem chi tiết
                  </Link>
                </div>
                <div className="space-y-3">
                  {categoryStats.slice(0, 4).map((c) => {
                    let barColor = "bg-[#0B4FC4]"; // Giao thông - blue
                    if (c.name.includes("Môi trường")) barColor = "bg-[#16A34A]"; // green
                    else if (c.name.includes("Hạ tầng")) barColor = "bg-[#8B5CF6]"; // violet
                    else if (c.name.includes("Trật tự")) barColor = "bg-[#F97316]"; // orange

                    return (
                      <div key={c.name} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-[#123E8A]">{c.name}</span>
                          <span className="text-[#475467]">{c.percentage}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${barColor} rounded-full`} style={{ width: `${c.percentage}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getVisiblePageIndexes(currentPage: number, totalPages: number) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index);
  }

  const start = Math.max(0, Math.min(currentPage - 2, totalPages - 5));
  return Array.from({ length: 5 }, (_, index) => start + index);
}
