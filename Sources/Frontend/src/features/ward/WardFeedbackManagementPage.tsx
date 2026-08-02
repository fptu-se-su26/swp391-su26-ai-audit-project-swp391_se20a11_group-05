import { useEffect, useMemo, useState, type ReactNode, type SelectHTMLAttributes } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Role } from "@/lib/roles";
import { useCategories, useFeedbacks } from "@/lib/hooks";
import { feedbackApi, wardApi, type FeedbackListFilters, type FeedbackStatus } from "@/lib/api";
import { OFFICIAL_CATEGORIES } from "@/lib/categoryConfig";
import { Link } from "@tanstack/react-router";

const WARD_STAFF_CATEGORY_CODES = ["URBAN_INFRASTRUCTURE", "ENVIRONMENT", "CONSTRUCTION"];

const STATUS_TABS: Array<{
  key: "ALL" | FeedbackStatus;
  label: string;
  countKey: "total" | "pending" | "inProgress" | "resolved" | "rejected";
}> = [
  { key: "ALL", label: "Tất cả", countKey: "total" },
  { key: "PENDING", label: "Đang chờ xử lý", countKey: "pending" },
  { key: "IN_PROGRESS", label: "Đang xử lý", countKey: "inProgress" },
  { key: "RESOLVED", label: "Đã xử lý", countKey: "resolved" },
  { key: "REJECTED", label: "Từ chối xử lý", countKey: "rejected" },
];

const PRIORITY_OPTIONS = [
  { value: "", label: "Tất cả" },
  { value: "LOW", label: "Thấp" },
  { value: "MEDIUM", label: "Trung bình" },
  { value: "HIGH", label: "Cao" },
  { value: "CRITICAL", label: "Khẩn cấp" },
];

interface WardFeedbackManagementPageProps {
  hideHeader?: boolean;
}

export function WardFeedbackManagementPage({
  hideHeader = false,
}: WardFeedbackManagementPageProps) {
  const { user } = useAuth();
  const isWardStaff = user?.role === Role.WARD_STAFF;
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [searchDraft, setSearchDraft] = useState("");
  const [statusDraft, setStatusDraft] = useState<FeedbackStatus | "">("");
  const [categoryDraft, setCategoryDraft] = useState("");
  const [priorityDraft, setPriorityDraft] = useState("");
  const [fromDateDraft, setFromDateDraft] = useState("");
  const [toDateDraft, setToDateDraft] = useState("");
  const [wardDraft, setWardDraft] = useState<string>(() =>
    isWardStaff && user?.wardId ? String(user.wardId) : "",
  );
  const [activeTab, setActiveTab] = useState<"ALL" | FeedbackStatus>("ALL");
  const [filters, setFilters] = useState<FeedbackListFilters>(() => ({
    wardId: isWardStaff ? user?.wardId || undefined : undefined,
    categories: isWardStaff ? WARD_STAFF_CATEGORY_CODES.join(",") : undefined,
  }));

  // Debounce searchDraft to avoid excessive API requests
  const [debouncedSearch, setDebouncedSearch] = useState(searchDraft);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchDraft);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchDraft]);

  // Automatically apply filters when any input changes
  useEffect(() => {
    const nextKeyword = debouncedSearch.trim();
    const nextWardId = isWardStaff ? user?.wardId || undefined : wardDraft || undefined;

    setFilters((prev) => {
      if (
        prev.keyword === nextKeyword &&
        prev.status === statusDraft &&
        prev.category === categoryDraft &&
        prev.priority === priorityDraft &&
        prev.fromDate === fromDateDraft &&
        prev.toDate === toDateDraft &&
        prev.wardId === nextWardId
      ) {
        return prev;
      }
      setPage(0);
      return {
        keyword: nextKeyword,
        status: statusDraft,
        category: categoryDraft,
        priority: priorityDraft,
        fromDate: fromDateDraft,
        toDate: toDateDraft,
        wardId: nextWardId,
        categories: isWardStaff ? WARD_STAFF_CATEGORY_CODES.join(",") : undefined,
      };
    });
  }, [
    debouncedSearch,
    statusDraft,
    categoryDraft,
    priorityDraft,
    fromDateDraft,
    toDateDraft,
    wardDraft,
    isWardStaff,
    user?.wardId,
  ]);

  const queryFilters = useMemo<FeedbackListFilters>(
    () => ({
      ...filters,
      status: activeTab !== "ALL" ? activeTab : filters.status,
      wardId: isWardStaff ? user?.wardId || undefined : filters.wardId,
      categories: isWardStaff ? WARD_STAFF_CATEGORY_CODES.join(",") : undefined,
    }),
    [activeTab, filters, isWardStaff, user?.wardId],
  );

  const statsFilters = useMemo<FeedbackListFilters>(
    () => ({
      ...filters,
      status: "",
      wardId: isWardStaff ? user?.wardId || undefined : filters.wardId,
      categories: isWardStaff ? WARD_STAFF_CATEGORY_CODES.join(",") : undefined,
    }),
    [filters, isWardStaff, user?.wardId],
  );

  const { data: feedbacksPage, isLoading } = useFeedbacks(page, pageSize, queryFilters);
  const { data: categories = [] } = useCategories();
  const { data: wards = [] } = useQuery({
    queryKey: ["wards", "feedback-management"],
    queryFn: () => wardApi.getAll(),
    enabled: !isWardStaff,
    staleTime: 300_000,
  });
  const { data: stats } = useQuery({
    queryKey: ["feedbacks", "management-stats", statsFilters],
    queryFn: () => feedbackApi.getMyStats(statsFilters),
    staleTime: 30_000,
  });

  const categoryOptions = useMemo(() => {
    const allowed = isWardStaff ? new Set(WARD_STAFF_CATEGORY_CODES) : null;
    const byCode = new Map<string, { code: string; label: string }>();
    OFFICIAL_CATEGORIES.forEach((category) => {
      if (!allowed || allowed.has(category.code)) {
        byCode.set(category.code, {
          code: category.code,
          label: officialCategoryName(category.code),
        });
      }
    });
    categories.forEach((category) => {
      if (!allowed || allowed.has(category.code)) {
        byCode.set(category.code, {
          code: category.code,
          label: category.nameVi || category.name || officialCategoryName(category.code),
        });
      }
    });
    return Array.from(byCode.values());
  }, [categories, isWardStaff]);

  useEffect(() => {
    if (isWardStaff && user?.wardId) {
      setWardDraft(String(user.wardId));
      setFilters((current) => ({
        ...current,
        wardId: user.wardId || undefined,
        categories: WARD_STAFF_CATEGORY_CODES.join(","),
      }));
    }
  }, [isWardStaff, user?.wardId]);

  const rows = feedbacksPage?.content ?? [];
  const totalPages = feedbacksPage?.totalPages ?? 0;
  const totalElements = feedbacksPage?.totalElements ?? 0;
  const pageButtons = getVisiblePageIndexes(page, totalPages);

  const applyFilters = () => {
    setPage(0);
    setActiveTab(statusDraft || "ALL");
    setFilters({
      keyword: searchDraft.trim(),
      status: statusDraft,
      category: categoryDraft,
      priority: priorityDraft,
      fromDate: fromDateDraft,
      toDate: toDateDraft,
      wardId: isWardStaff ? user?.wardId || undefined : wardDraft || undefined,
      categories: isWardStaff ? WARD_STAFF_CATEGORY_CODES.join(",") : undefined,
    });
  };

  const resetFilters = () => {
    setSearchDraft("");
    setStatusDraft("");
    setCategoryDraft("");
    setPriorityDraft("");
    setFromDateDraft("");
    setToDateDraft("");
    setWardDraft(isWardStaff && user?.wardId ? String(user.wardId) : "");
    setActiveTab("ALL");
    setPage(0);
    setFilters({
      wardId: isWardStaff ? user?.wardId || undefined : undefined,
      categories: isWardStaff ? WARD_STAFF_CATEGORY_CODES.join(",") : undefined,
    });
  };

  return (
    <div className="space-y-6">
      {!hideHeader && (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">
            Danh sách phản ánh
          </p>
          <p className="text-sm text-slate-500 font-medium">
            Quản lý, tiếp nhận và xử lý phản ánh của người dân trong địa bàn
          </p>
        </div>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          applyFilters();
        }}
        className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-4"
      >
        {/* Main Search Row */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 text-sm text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100/50 transition-all placeholder-slate-400"
              placeholder="Nhập mã, nội dung hoặc địa điểm để tìm kiếm..."
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition active:scale-[0.97] cursor-pointer ${
                isAdvancedOpen
                  ? "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              <SlidersHorizontal size={15} />
              Bộ lọc nâng cao
              {isAdvancedOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition active:scale-[0.97] cursor-pointer"
            >
              <Search size={15} />
              Tìm kiếm
            </button>
          </div>
        </div>

        {/* Collapsible Advanced Filters Panel */}
        {isAdvancedOpen && (
          <div className="grid grid-cols-1 gap-4 pt-4 border-t border-slate-100 md:grid-cols-2 xl:grid-cols-3 animate-fade-in">
            <FilterField label="Trạng thái">
              <Select
                value={statusDraft}
                onChange={(event) => setStatusDraft(event.target.value as FeedbackStatus | "")}
              >
                <option value="">Tất cả</option>
                <option value="PENDING_RECEIVE">Chờ tiếp nhận</option>
                <option value="PENDING">Đang chờ xử lý</option>
                <option value="IN_PROGRESS">Đang xử lý</option>
                <option value="WAITING_INFO">Yêu cầu bổ sung thông tin</option>
                <option value="RESOLVED">Đã xử lý</option>
                <option value="REJECTED">Từ chối xử lý</option>
              </Select>
            </FilterField>
            <FilterField label="Lĩnh vực">
              <Select
                value={categoryDraft}
                onChange={(event) => setCategoryDraft(event.target.value)}
              >
                <option value="">Tất cả</option>
                {categoryOptions.map((category) => (
                  <option key={category.code} value={category.code}>
                    {category.label}
                  </option>
                ))}
              </Select>
            </FilterField>
            <FilterField label="Mức độ ưu tiên">
              <Select
                value={priorityDraft}
                onChange={(event) => setPriorityDraft(event.target.value)}
              >
                {PRIORITY_OPTIONS.map((priority) => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </Select>
            </FilterField>
            <FilterField label="Từ ngày">
              <input
                type="date"
                value={fromDateDraft}
                onChange={(event) => setFromDateDraft(event.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100/50 transition-all text-slate-800"
              />
            </FilterField>
            <FilterField label="Đến ngày">
              <input
                type="date"
                value={toDateDraft}
                onChange={(event) => setToDateDraft(event.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100/50 transition-all text-slate-800"
              />
            </FilterField>
            <FilterField label="Địa bàn">
              <Select
                value={wardDraft}
                disabled={isWardStaff}
                onChange={(event) => setWardDraft(event.target.value)}
              >
                <option value="">
                  {isWardStaff ? user?.wardName || "Phường đang quản lý" : "Tất cả"}
                </option>
                {isWardStaff && user?.wardId ? (
                  <option value={String(user.wardId)}>
                    {user.wardName || "Phường đang quản lý"}
                  </option>
                ) : null}
                {!isWardStaff &&
                  wards.map((ward) => (
                    <option key={ward.id} value={ward.id}>
                      {ward.name}
                    </option>
                  ))}
              </Select>
            </FilterField>
            <div className="md:col-span-2 xl:col-span-3 flex justify-end">
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition active:scale-[0.97] cursor-pointer"
              >
                <RefreshCw size={15} />
                Đặt lại bộ lọc
              </button>
            </div>
          </div>
        )}
      </form>

      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        <div className="flex gap-4 overflow-x-auto border-b border-slate-100 px-6 bg-slate-50/30">
          {STATUS_TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setActiveTab(tab.key);
                  setStatusDraft(tab.key === "ALL" ? "" : tab.key);
                  setPage(0);
                }}
                className={`flex h-14 shrink-0 items-center gap-2 border-b-2 px-1 text-xs font-bold uppercase tracking-wider transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                  isActive
                    ? "border-indigo-600 text-indigo-600 font-extrabold"
                    : "border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-200"
                }`}
              >
                {tab.label}
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold font-mono transition-colors ${
                    isActive ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {stats?.[tab.countKey] ?? 0}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center px-6 py-3 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3 text-xs text-slate-500 font-semibold">
            <span>Hiển thị</span>
            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(0);
              }}
              className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100/50 cursor-pointer"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
            <span>
              trên tổng số{" "}
              <strong className="font-mono text-slate-700">
                {totalElements.toLocaleString("vi-VN")}
              </strong>{" "}
              phản ánh
            </span>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[550px] overflow-y-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="sticky top-0 z-10 bg-slate-50 text-slate-500 border-b border-slate-100">
                {[
                  "Mã phản ánh",
                  "Nội dung phản ánh",
                  "Người gửi",
                  "Địa điểm",
                  "Lĩnh vực",
                  "Mức độ ưu tiên",
                  "Trạng thái",
                  "Thời gian gửi",
                  "Thao tác",
                ].map((header) => (
                  <th
                    key={header}
                    className="sticky top-0 z-10 bg-slate-50 px-4 py-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: pageSize }).map((_, index) => (
                  <tr key={index} className="border-b border-slate-100 last:border-0">
                    <td colSpan={9} className="px-4 py-4">
                      <div className="h-10 animate-pulse rounded-xl bg-slate-100/70" />
                    </td>
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-16 text-center text-xs text-slate-400 font-bold bg-slate-50/10"
                  >
                    Không có phản ánh phù hợp.
                  </td>
                </tr>
              ) : (
                rows.map((feedback) => (
                  <tr
                    key={feedback.id}
                    className="hover:bg-slate-50/50 border-b border-slate-100 last:border-0 transition-colors"
                  >
                    <td className="px-4 py-3.5 font-bold font-mono text-indigo-600 text-xs">
                      {feedback.trackingCode || feedback.code || `#${feedback.id}`}
                    </td>
                    <td className="max-w-[240px] px-4 py-3.5">
                      <div className="line-clamp-2 font-semibold text-slate-800 text-xs">
                        {feedback.title || feedback.description}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-600 font-medium">
                      {feedback.citizenName || "-"}
                    </td>
                    <td className="max-w-[200px] px-4 py-3.5 text-xs text-slate-500 font-medium">
                      <span className="line-clamp-2">
                        {feedback.addressDetails || feedback.wardName || "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-600 font-semibold">
                      {feedback.categoryName ||
                        officialCategoryName(feedback.categoryCode || feedback.category || "")}
                    </td>
                    <td className="px-4 py-3.5">
                      <PriorityBadge value={feedback.priority} />
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={feedback.status} />
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500 font-mono font-medium">
                      {formatDateTime(feedback.submittedAt || feedback.createdAt)}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Link
                        to="/ward"
                        search={{ tab: "feedback", detailId: String(feedback.id) }}
                        className="inline-flex items-center justify-center px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition active:scale-[0.97] cursor-pointer"
                      >
                        Xem chi tiết
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-4 border-t border-slate-100 px-6 py-4 md:flex-row md:items-center md:justify-end bg-slate-50/30">
          <div className="flex items-center gap-1.5">
            <PageButton
              disabled={page === 0}
              onClick={() => setPage((value) => Math.max(0, value - 1))}
            >
              <ChevronLeft size={14} />
            </PageButton>
            {pageButtons.map((pageIndex) => (
              <PageButton
                key={pageIndex}
                active={pageIndex === page}
                onClick={() => setPage(pageIndex)}
              >
                {pageIndex + 1}
              </PageButton>
            ))}
            <PageButton
              disabled={totalPages === 0 || page >= totalPages - 1}
              onClick={() => setPage((value) => Math.min(totalPages - 1, value + 1))}
            >
              <ChevronRight size={14} />
            </PageButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">
        {label}
      </span>
      {children}
    </label>
  );
}

function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100/50 transition-all disabled:bg-slate-100 disabled:text-slate-400 cursor-pointer ${props.className || ""}`}
    />
  );
}

function PageButton({
  active,
  disabled,
  onClick,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex h-8 min-w-[32px] items-center justify-center rounded-lg border px-2 text-xs font-bold font-mono transition-all duration-200 active:scale-[0.95] disabled:cursor-not-allowed disabled:opacity-30 ${
        active
          ? "border-indigo-600 bg-indigo-600 text-white shadow-sm shadow-indigo-100"
          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-800"
      }`}
    >
      {children}
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const info = getOfficerStatusInfo(status);
  return (
    <span
      className={`inline-block rounded-md border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider whitespace-nowrap ${info.className}`}
    >
      {info.label}
    </span>
  );
}

function PriorityBadge({ value }: { value?: string | null }) {
  const normalized = (value || "MEDIUM").toUpperCase();
  const info =
    normalized === "URGENT" || normalized === "CRITICAL"
      ? { label: "Khẩn cấp", className: "bg-rose-50/50 text-rose-700 border-rose-100" }
      : normalized === "HIGH"
        ? { label: "Cao", className: "bg-rose-50/50 text-rose-700 border-rose-100" }
        : normalized === "LOW"
          ? { label: "Thấp", className: "bg-emerald-50/50 text-emerald-700 border-emerald-100" }
          : { label: "Trung bình", className: "bg-amber-50/50 text-amber-700 border-amber-100" };
  return (
    <span
      className={`inline-block rounded-md border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider whitespace-nowrap ${info.className}`}
    >
      {info.label}
    </span>
  );
}

function getOfficerStatusInfo(status: string) {
  const upper = (status || "").toUpperCase();
  if (upper === "RESOLVED") {
    return {
      label: "Đã giải quyết",
      className: "bg-emerald-50/50 text-emerald-700 border-emerald-100",
    };
  }
  if (upper === "REJECTED") {
    return { label: "Từ chối xử lý", className: "bg-rose-50/50 text-rose-700 border-rose-100" };
  }
  if (upper === "SUBMITTED") {
    return { label: "Mới gửi", className: "bg-indigo-50/50 text-indigo-700 border-indigo-100" };
  }
  if (upper === "PENDING_RECEIVE") {
    return {
      label: "Chờ tiếp nhận",
      className: "bg-indigo-50/50 text-indigo-700 border-indigo-100",
    };
  }
  if (upper === "WAITING_INFO" || upper === "NEED_MORE_INFO") {
    return {
      label: "Chờ dân bổ sung",
      className: "bg-slate-50/50 text-slate-700 border-slate-100",
    };
  }
  if (upper === "TRANSFERRED") {
    return {
      label: "Đã chuyển xử lý",
      className: "bg-amber-50/50 text-amber-700 border-amber-100",
    };
  }
  if (upper === "PENDING") {
    return {
      label: "Đang chờ xử lý",
      className: "bg-indigo-50/50 text-indigo-700 border-indigo-100",
    };
  }
  if (upper === "ASSIGNED") {
    return {
      label: "Đã tiếp nhận",
      className: "bg-purple-50/50 text-purple-700 border-purple-100",
    };
  }
  if (upper === "NEED_LOCATION_REVIEW") {
    return {
      label: "Cần xác minh",
      className: "bg-slate-50/50 text-slate-700 border-slate-100",
    };
  }
  if (upper === "PRE_EMPTIVE") {
    return { label: "Xử lý trước", className: "bg-amber-50/50 text-amber-700 border-amber-100" };
  }
  // Default for IN_PROGRESS and fallback
  return { label: "Đang xử lý", className: "bg-amber-50/50 text-amber-700 border-amber-100" };
}

function officialCategoryName(code: string) {
  switch (code) {
    case "URBAN_INFRASTRUCTURE":
      return "Hạ tầng đô thị";
    case "ENVIRONMENT":
      return "Môi trường";
    case "CONSTRUCTION":
      return "Xây dựng";
    case "TRAFFIC":
      return "Giao thông";
    case "PUBLIC_SECURITY":
      return "An ninh trật tự";
    case "FIRE_SAFETY":
      return "An toàn PCCC";
    default:
      return code || "Khác";
  }
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getVisiblePageIndexes(currentPage: number, totalPages: number) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index);
  }

  const start = Math.max(0, Math.min(currentPage - 2, totalPages - 5));
  return Array.from({ length: 5 }, (_, index) => start + index);
}
