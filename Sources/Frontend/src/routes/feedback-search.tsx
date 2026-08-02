import { clientOnly } from "@/components/ClientOnly";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useRef, Suspense } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import {
  usePublicFeedbacks,
  usePublicFeedbackStats,
  useFeedbackStatuses,
  useFeedbacks,
  useNotifications,
  useNotificationUnreadCount,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from "@/hooks";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { EmptyState, ErrorState } from "@/components/site/EmptyState";
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
  User,
  BookOpen,
  FileCheck,
  HelpCircle,
  Smartphone,
  Building,
  Eye,
  Check,
  ArrowRight,
  Mail,
  Phone,
} from "lucide-react";
import { mapStatus } from "@/lib/status";
import { toast } from "sonner";
import { Role } from "@/lib/roles";
import { feedbackApi, type FeedbackStatus } from "@/lib/api";
import { OFFICIAL_CATEGORIES } from "@/lib/categoryConfig";
import { WardFeedbackManagementPage } from "@/features/ward/WardFeedbackManagementPage";
import toanhatraibap from "@/assets/toanhatraibap.png";
import trongdong from "@/assets/trongdong.png";
import logoImg from "@/assets/logo.png";

const CivicMap = clientOnly(
  () => import("@/components/site/CivicMap").then((m) => ({ default: m.CivicMap })) as any,
) as any;

export const Route = createFileRoute("/feedback-search")({
  validateSearch: (
    search: Record<string, unknown>,
  ): {
    category?: string;
    q?: string;
    status?: string;
    range?: string;
    wardId?: string | number;
    categories?: string;
    tab?: string;
  } => ({
    category: search.category as string | undefined,
    q: search.q as string | undefined,
    status: search.status as string | undefined,
    range: search.range as string | undefined,
    wardId: search.wardId
      ? typeof search.wardId === "number"
        ? search.wardId
        : Number(search.wardId)
      : undefined,
    categories: search.categories as string | undefined,
    tab: search.tab as string | undefined,
  }),
  head: () => ({
    meta: [
      { title: "Tra cứu phản ánh — Đà Nẵng Kết Nối" },
      {
        name: "description",
        content: "Tìm kiếm và theo dõi tình trạng xử lý các phản ánh hiện trường.",
      },
    ],
  }),
  component: FeedbackSearch,
});

const getFromDateString = (range: string) => {
  const now = new Date();
  let diffDays = 0;
  switch (range) {
    case "24h":
      diffDays = 1;
      break;
    case "7d":
      diffDays = 7;
      break;
    case "1m":
      diffDays = 30;
      break;
    case "3m":
      diffDays = 90;
      break;
    case "1y":
      diffDays = 365;
      break;
    default:
      return "";
  }
  const fromDate = new Date(now.getTime() - diffDays * 24 * 60 * 60 * 1000);
  const year = fromDate.getFullYear();
  const month = String(fromDate.getMonth() + 1).padStart(2, "0");
  const day = String(fromDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

function FeedbackSearch() {
  const { isAuthenticated, user } = useAuth();
  if (isAuthenticated && (user?.role === Role.WARD_STAFF || user?.role === Role.SUPER_ADMIN)) {
    return <WardFeedbackManagementPage />;
  }
  return <PublicFeedbackLookup />;
}

function PublicFeedbackLookup() {
  const { locale, t, setLocale } = useI18n();
  const navigate = useNavigate({ from: "/feedback-search" });
  const {
    category = "",
    q = "",
    status = "",
    range = "",
    wardId,
    categories,
    tab,
  } = Route.useSearch();
  const { isAuthenticated, user: currentUser, logout } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"public" | "my">(() => {
    return tab === "my" ? "my" : "public";
  });

  useEffect(() => {
    if (tab === "my") {
      setActiveTab("my");
    } else {
      setActiveTab("public");
    }
  }, [tab]);

  const isWardStaffUser = currentUser?.role === "WARD_STAFF";
  // WARD_STAFF allowed categories constant
  const WARD_STAFF_CATEGORIES = ["URBAN_INFRASTRUCTURE", "ENVIRONMENT", "CONSTRUCTION"];

  // Detect Case 2: WardStaff clicked "Phản ánh" in Officer Sidebar (search params have wardId or categories)
  const [enteredFromSidebar] = useState(() => {
    if (!isWardStaffUser) return false;
    return !!(wardId || categories);
  });

  // Parse initial selected categories from URL params
  const parseCategories = (raw: string | undefined): string[] => {
    if (!raw) return [];
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  };

  // Search & Filter Panel state variables
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [keywordInput, setKeywordInput] = useState(q);
  const [locationInput, setLocationInput] = useState(() => {
    if (enteredFromSidebar) return currentUser?.wardName || "";
    return "";
  });
  const [districtInput, setDistrictInput] = useState("");

  // Multi-select: selectedCategories replaces single categoryInput
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
    if (categories) return parseCategories(categories);
    if (category) return [category];
    if (enteredFromSidebar) return WARD_STAFF_CATEGORIES;
    return [];
  });
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  const [statusInput, setStatusInput] = useState<FeedbackStatus | "">("");
  const [fromDateInput, setFromDateInput] = useState("");
  const [toDateInput, setToDateInput] = useState("");

  const [dateRangeOpen, setDateRangeOpen] = useState(false);
  const [sortBy, setSortBy] = useState("newest");


  // Dropdown refs
  const langRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Fetch notifications for the logged-in citizen
  const { data: notifications = [], isLoading: notifLoading } = useNotifications(!!currentUser);
  const { data: unreadCountData } = useNotificationUnreadCount(!!currentUser);
  const unreadCount = unreadCountData ?? notifications.filter((n) => !n.isRead).length;

  const markRead = useMarkNotificationReadMutation();
  const markAllRead = useMarkAllNotificationsReadMutation();

  // Committed search filters
  const [filters, setFilters] = useState(() => {
    const isMatchingWard = !!(
      currentUser?.wardName &&
      locationInput.trim().toLowerCase() === currentUser.wardName.trim().toLowerCase()
    );
    const resolvedWardId =
      wardId ||
      (enteredFromSidebar
        ? isMatchingWard
          ? currentUser?.wardId || undefined
          : undefined
        : undefined);
    return {
      keyword: q,
      location: locationInput,
      district: "",
      category: "",
      status: "" as FeedbackStatus | "",
      fromDate: "",
      toDate: "",
      wardId: resolvedWardId,
      categories: categories || (enteredFromSidebar ? WARD_STAFF_CATEGORIES.join(",") : undefined),
    };
  });

  const isFiltered = useMemo(() => {
    return (
      filters.keyword.toLowerCase().trim() !== "" ||
      filters.location.toLowerCase().trim() !== "" ||
      filters.district.toLowerCase().trim() !== "" ||
      filters.status !== "" ||
      filters.fromDate !== "" ||
      filters.toDate !== ""
    );
  }, [filters]);

  // Close category dropdown on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node)) {
        setCategoryDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const lastSyncedWardId = useRef<string | number | undefined>(wardId);
  const lastSyncedCategories = useRef<string | undefined>(categories);

  // Sync search URL query parameter
  useEffect(() => {
    let mappedStatus: FeedbackStatus | "" = "";
    if (status === "PROCESSING") {
      mappedStatus = "IN_PROGRESS";
    } else if (status === "PROCESSED") {
      mappedStatus = "RESOLVED";
    } else if (status) {
      mappedStatus = status as FeedbackStatus;
    }

    let calculatedFromDate = "";
    if (range) {
      calculatedFromDate = getFromDateString(range);
    }

    setKeywordInput(q);
    setStatusInput(mappedStatus);

    if (calculatedFromDate) {
      setFromDateInput(calculatedFromDate);
    } else if (range === "") {
      setFromDateInput("");
    }

    // Sync selectedCategories from URL only when URL changes
    if (categories !== lastSyncedCategories.current) {
      lastSyncedCategories.current = categories;
      if (categories) {
        setSelectedCategories(parseCategories(categories));
      } else {
        setSelectedCategories([]);
      }
    }

    // Sync locationInput/wardId from URL only when URL changes
    if (wardId !== lastSyncedWardId.current) {
      lastSyncedWardId.current = wardId;
      if (wardId && currentUser?.wardId && Number(wardId) === currentUser.wardId) {
        setLocationInput(currentUser?.wardName || "");
      } else if (!wardId) {
        setLocationInput("");
      }
    }

    const derivedCategories =
      categories ||
      (category ? category : null) ||
      (enteredFromSidebar ? WARD_STAFF_CATEGORIES.join(",") : undefined);

    setFilters((prev) => {
      const isMatchingWard = !!(
        currentUser?.wardName &&
        locationInput.trim().toLowerCase() === currentUser.wardName.trim().toLowerCase()
      );
      const resolvedWardId =
        wardId ||
        (enteredFromSidebar
          ? isMatchingWard
            ? currentUser?.wardId || undefined
            : undefined
          : undefined);
      return {
        ...prev,
        keyword: q,
        location: locationInput,
        district: prev.district,
        category: "",
        status: mappedStatus,
        fromDate: calculatedFromDate || (status || range ? "" : prev.fromDate),
        wardId: resolvedWardId,
        categories: derivedCategories || prev.categories,
      };
    });
    setPage(0);
  }, [q, category, status, range, wardId, categories, enteredFromSidebar, currentUser]);

  // Construct query filters to send to backend API
  const apiFilters = useMemo(() => {
    const parts = [];
    if (filters.keyword.trim()) parts.push(filters.keyword.trim());
    if (filters.location.trim()) parts.push(filters.location.trim());
    if (filters.district.trim()) parts.push(filters.district.trim());
    const mergedKeyword = parts.join(" ");

    const resolvedCategories =
      selectedCategories.length > 0 ? selectedCategories.join(",") : undefined;

    return {
      keyword: mergedKeyword,
      category: "",
      status: filters.status,
      fromDate: filters.fromDate,
      toDate: filters.toDate,
      wardId: filters.wardId,
      categories: resolvedCategories,
    };
  }, [filters, selectedCategories]);

  // Main reports list fetch (Public lookup)
  const {
    data: publicFeedbacksPage,
    isLoading: isPublicLoading,
    isFetching: isPublicFetching,
    refetch: refetchPublic,
    error: publicError,
    isError: isPublicError,
  } = usePublicFeedbacks(page, pageSize, apiFilters, {
    enabled: activeTab === "public",
  });

  // Citizen's own reports list fetch
  const {
    data: myFeedbacksPage,
    isLoading: isMyLoading,
    isFetching: isMyFetching,
    refetch: refetchMy,
    error: myError,
    isError: isMyError,
  } = useFeedbacks(page, pageSize, apiFilters, {
    enabled: activeTab === "my" && isAuthenticated,
  });

  // Fetch public statistics for overview panel
  const { data: publicStats } = usePublicFeedbackStats(apiFilters, {
    enabled: activeTab === "public",
  });

  // Fetch citizen's own statistics for overview panel
  const { data: myStats } = useQuery({
    queryKey: ["feedbacks", "my-stats", apiFilters],
    queryFn: () => feedbackApi.getMyStats(apiFilters),
    enabled: activeTab === "my" && isAuthenticated,
    staleTime: 30_000,
  });

  const { data: statuses = [] } = useFeedbackStatuses();

  // Combine query states based on activeTab
  const feedbacksPage = activeTab === "my" ? myFeedbacksPage : publicFeedbacksPage;
  const isLoading = activeTab === "my" ? isMyLoading : isPublicLoading;
  const isFetching = activeTab === "my" ? isMyFetching : isPublicFetching;
  const isError = activeTab === "my" ? isMyError : isPublicError;
  const error = activeTab === "my" ? myError : publicError;
  const refetch = activeTab === "my" ? refetchMy : refetchPublic;

  // Reset page number on filter/tab changes
  useEffect(() => {
    setPage(0);
  }, [
    activeTab,
    filters.keyword,
    filters.location,
    filters.district,
    filters.category,
    filters.status,
    filters.fromDate,
    filters.toDate,
  ]);

  const feedbacks = feedbacksPage?.content ?? [];
  const totalPages = feedbacksPage?.totalPages ?? 0;

  // Cửa sổ tối đa 5 nút số trang quanh trang hiện tại
  const pageButtons = useMemo(() => {
    const maxButtons = Math.min(5, totalPages);
    const start = Math.max(0, Math.min(page - 2, totalPages - maxButtons));
    return Array.from({ length: maxButtons }, (_, i) => start + i);
  }, [page, totalPages]);

  const filteredFeedbacks = feedbacks;

  // Client-side sorting fallback (backend forces newest first)
  const sortedFeedbacks = useMemo(() => {
    const list = [...filteredFeedbacks];
    if (sortBy === "oldest") {
      list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sortBy === "updated") {
      list.sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt).getTime() -
          new Date(a.updatedAt || a.createdAt).getTime(),
      );
    } else {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return list;
  }, [filteredFeedbacks, sortBy]);

  // Combined statistics helper from backend
  const stats = useMemo(() => {
    const activeStats = activeTab === "my" ? myStats : publicStats;
    if (activeStats) {
      return {
        total: activeStats.total,
        resolved: activeStats.resolved,
        pending: activeStats.pending,
        rejected: activeStats.rejected,
      };
    }
    return { total: 0, resolved: 0, pending: 0, rejected: 0 };
  }, [activeTab, publicStats, myStats]);

  const processingRate = useMemo(() => {
    if (!stats.total) return "0.0";
    return ((stats.pending / stats.total) * 100).toFixed(1);
  }, [stats.pending, stats.total]);

  const resolvedRate = useMemo(() => {
    if (!stats.total) return "0.0";
    return ((stats.resolved / stats.total) * 100).toFixed(1);
  }, [stats.resolved, stats.total]);

  const rejectedRate = useMemo(() => {
    if (!stats.total) return "0.0";
    return ((stats.rejected / stats.total) * 100).toFixed(1);
  }, [stats.rejected, stats.total]);

  // Popular categories calculations based on real data list
  const categoryStats = useMemo(() => {
    const list = feedbacks;
    if (!list || list.length === 0) return [];
    const counts: Record<string, number> = {};
    list.forEach((f) => {
      const cat = f.categoryName || f.category || (locale === "vi" ? "Khác" : "Other");
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
  }, [feedbacks, locale]);

  // Category counts for the Donut Chart widget
  const categoryCounts = useMemo(() => {
    let infra = 0;
    let env = 0;
    let traffic = 0;
    let security = 0;

    feedbacks.forEach((f) => {
      const cat = f.categoryCode || "";
      if (cat.includes("INFRASTRUCTURE") || cat.includes("CONSTRUCTION")) {
        infra++;
      } else if (cat.includes("ENVIRONMENT")) {
        env++;
      } else if (cat.includes("TRAFFIC")) {
        traffic++;
      } else if (cat.includes("SECURITY") || cat.includes("SAFETY")) {
        security++;
      }
    });

    const total = infra + env + traffic + security;
    if (total === 0) {
      // Default realistic values matching mockups
      return { infra: 45, env: 12, traffic: 6, security: 1, total: 64 };
    }

    return { infra, env, traffic, security, total };
  }, [feedbacks]);

  const handleCategoryToggle = (code: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(code)) {
        return prev.filter((c) => c !== code);
      } else {
        return [...prev, code];
      }
    });
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPage(0);

    let urlStatus: string | undefined = undefined;
    if (statusInput === "IN_PROGRESS") {
      urlStatus = "PROCESSING";
    } else if (statusInput === "RESOLVED") {
      urlStatus = "PROCESSED";
    } else if (statusInput) {
      urlStatus = statusInput;
    }

    // Build categories from multi-select state
    const resolvedCategoriesForSubmit =
      selectedCategories.length > 0 ? selectedCategories.join(",") : undefined;

    const isMatchingWard = !!(
      currentUser?.wardName &&
      locationInput.trim().toLowerCase() === currentUser.wardName.trim().toLowerCase()
    );
    const resolvedWardId = enteredFromSidebar
      ? isMatchingWard
        ? currentUser?.wardId || undefined
        : undefined
      : undefined;

    setFilters({
      keyword: keywordInput,
      location: locationInput,
      district: districtInput,
      category: "",
      status: statusInput,
      fromDate: fromDateInput,
      toDate: toDateInput,
      wardId: resolvedWardId,
      categories: resolvedCategoriesForSubmit,
    });

    navigate({
      search: (prev) => {
        const nextSearch: Record<string, any> = {
          ...prev,
          q: keywordInput || undefined,
          category: undefined,
          categories: resolvedCategoriesForSubmit || undefined,
          status: urlStatus || undefined,
          wardId: resolvedWardId || undefined,
        };
        // If range is set, verify if fromDateInput still matches it.
        if (prev.range) {
          const expectedFromDate = getFromDateString(prev.range);
          if (expectedFromDate !== fromDateInput) {
            nextSearch.range = undefined;
          }
        }
        return nextSearch;
      },
    });
  };

  const handleReset = () => {
    setPage(0);
    setKeywordInput("");
    setStatusInput("");
    setFromDateInput("");
    setToDateInput("");
    setDistrictInput("");

    if (enteredFromSidebar) {
      // Reset to WARD_STAFF scope: current ward + their 3 categories
      setLocationInput(currentUser?.wardName || "");
      setSelectedCategories(WARD_STAFF_CATEGORIES);
      setFilters({
        keyword: "",
        location: currentUser?.wardName || "",
        district: "",
        category: "",
        status: "",
        fromDate: "",
        toDate: "",
        wardId: currentUser?.wardId || undefined,
        categories: WARD_STAFF_CATEGORIES.join(","),
      });
      navigate({
        search: () => ({
          wardId: currentUser?.wardId || undefined,
          categories: WARD_STAFF_CATEGORIES.join(","),
        }),
      });
    } else {
      setLocationInput("");
      setSelectedCategories([]);
      setFilters({
        keyword: "",
        location: "",
        district: "",
        category: "",
        status: "",
        fromDate: "",
        toDate: "",
        wardId: undefined,
        categories: undefined,
      });
      navigate({
        search: () => ({}),
      });
    }
  };

  const handleTabChange = (newTab: "public" | "my") => {
    setActiveTab(newTab);
    navigate({
      search: (prev) => ({
        ...prev,
        tab: newTab === "my" ? "my" : undefined,
      }),
    });
  };



  const getStatusInfo = (status: string) => {
    switch (status) {
      case "RESOLVED":
        return {
          label: locale === "vi" ? "Đã hoàn thành" : "Resolved",
          badgeClass: "bg-[#EAF8EF] text-[#16A34A] border border-[#BBF7D0]",
        };
      case "IN_PROGRESS":
      case "ASSIGNED":
        return {
          label: locale === "vi" ? "Đang xử lý" : "Processing",
          badgeClass: "bg-[#FFF4E8] text-[#F97316] border border-[#FFEDD5]",
        };
      case "PENDING_RECEIVE":
        return {
          label: locale === "vi" ? "Chờ tiếp nhận" : "Awaiting review",
          badgeClass: "bg-[#F3E8FF] text-[#9333EA] border border-[#E9D5FF]",
        };
      case "REJECTED":
        return {
          label: locale === "vi" ? "Từ chối" : "Rejected",
          badgeClass: "bg-[#FDECEC] text-[#DC2626] border border-[#FECACA]",
        };
      case "NEED_LOCATION_REVIEW":
        return {
          label: locale === "vi" ? "Chờ xác minh vị trí" : "Location review",
          badgeClass: "bg-[#FFF7D6] text-[#A16207] border border-[#FEF3C7]",
        };
      case "SUBMITTED":
        return {
          label: locale === "vi" ? "Đã gửi" : "Submitted",
          badgeClass: "bg-[#EAF2FF] text-[#0B4FC4] border border-[#BFDBFE]",
        };
      case "WAITING_INFO":
        return {
          label: locale === "vi" ? "Chờ bổ sung thông tin" : "Waiting for info",
          badgeClass: "bg-[#FFF7D6] text-[#A16207] border border-[#FEF3C7]",
        };
      case "PENDING":
      case "PRE_EMPTIVE":
      default:
        return {
          label: locale === "vi" ? "Đang chờ duyệt" : "Pending",
          badgeClass: "bg-[#EAF2FF] text-[#0B4FC4] border border-[#BFDBFE]",
        };
    }
  };

  return (
    <div className="relative min-h-screen font-sans bg-[#F5F8FC] selection:bg-[#0B4DBB] selection:text-white pb-16 overflow-hidden">
      {/* Subtle Vietnamese Dong Son bronze drum pattern background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: `url(${trongdong})`,
          backgroundSize: "750px",
          backgroundRepeat: "repeat",
          backgroundPosition: "center top",
          mixBlendMode: "multiply",
        }}
      />
      {/* Modern gradient blobs */}
      <div className="absolute top-[-10%] left-[-15%] w-[60%] aspect-square rounded-full bg-gradient-to-tr from-[#1E88E5]/5 to-transparent blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-15%] w-[50%] aspect-square rounded-full bg-gradient-to-br from-[#0B4DBB]/5 to-transparent blur-[140px] pointer-events-none" />


      {/* HERO SECTION */}
      <section
        className="relative w-full h-[380px] flex items-center overflow-hidden border-b border-slate-200/40"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(245, 248, 252, 0.98) 0%, rgba(245, 248, 252, 0.9) 40%, rgba(245, 248, 252, 0.5) 70%, rgba(245, 248, 252, 0.15) 100%), url(${toanhatraibap})`,
          backgroundSize: "cover",
          backgroundPosition: "center 38%",
        }}
      >
        <div className="max-w-[1440px] mx-auto w-full px-6 md:px-12 flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
          <div className="max-w-[650px] flex flex-col justify-center animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200/60 rounded-full px-3 py-1 text-[10px] font-extrabold text-[#0B4DBB] uppercase tracking-wider mb-4 w-fit">
              <Building size={12} />
              <span>
                {locale === "vi" ? "Thông tin dịch vụ công" : "Public Government Service"}
              </span>
            </div>
            <h1 className="font-sans text-[#063A94] text-4xl md:text-5xl font-black leading-tight mb-4 tracking-tight">
              {locale === "vi" ? "Tra cứu phản ánh" : "Search Reports"}
            </h1>
            <p className="text-slate-600 text-sm md:text-base leading-relaxed max-w-[560px] font-semibold">
              {locale === "vi"
                ? "Tra cứu thông tin, theo dõi tiến độ xử lý và xem kết quả phản ánh hiện trường của người dân gửi đến chính quyền Thành phố Đà Nẵng."
                : "Search information, track resolution progress and view results of field reports submitted by citizens to the Da Nang City Government."}
            </p>
          </div>

          <div className="shrink-0 flex justify-start md:justify-end animate-in fade-in slide-in-from-right-4 duration-500">
            <a
              href="tel:1022"
              className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-[0_10px_30px_rgba(11,77,187,0.04)] flex items-center gap-5 hover:shadow-[0_12px_36px_rgba(11,77,187,0.08)] hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-full bg-blue-50 text-[#0B4DBB] flex items-center justify-center shrink-0 shadow-inner">
                <Headset size={24} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
                  {locale === "vi" ? "Tổng đài hỗ trợ 24/7" : "Government Support 24/7"}
                </span>
                <span className="text-3xl font-black text-[#0B4DBB] leading-tight font-sans tracking-tight">
                  1022
                </span>
                <span className="text-[10px] text-slate-500 font-semibold mt-1">
                  {locale === "vi"
                    ? "Miễn phí · Mọi lúc, mọi nơi"
                    : "Free of charge · Support anytime"}
                </span>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* SEARCH PANEL */}
      <div className="relative z-30 max-w-[1440px] mx-auto px-6 md:px-12 -mt-20 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-white rounded-[18px] p-6 md:p-8 shadow-[0_16px_48px_rgba(11,77,187,0.08)] border border-slate-100">
          {/* Tabs */}
          <div className="flex gap-8 border-b border-slate-100 mb-6 pb-2.5">
            <button
              type="button"
              onClick={() => handleTabChange("public")}
              className={`pb-2.5 text-sm font-bold transition-all relative cursor-pointer ${
                activeTab === "public"
                  ? "text-[#0B4DBB] font-extrabold"
                  : "text-slate-400 hover:text-[#0B4DBB]"
              }`}
            >
              {locale === "vi" ? "Phản ánh công cộng" : "Public Reports"}
              {activeTab === "public" && (
                <div className="absolute bottom-[-11px] left-0 right-0 h-[3px] bg-[#0B4DBB] rounded-full" />
              )}
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("my")}
              className={`pb-2.5 text-sm font-bold transition-all relative cursor-pointer ${
                activeTab === "my"
                  ? "text-[#0B4DBB] font-extrabold"
                  : "text-slate-400 hover:text-[#0B4DBB]"
              }`}
            >
              {locale === "vi" ? "Phản ánh của tôi" : "My Reports"}
              {activeTab === "my" && (
                <div className="absolute bottom-[-11px] left-0 right-0 h-[3px] bg-[#0B4DBB] rounded-full" />
              )}
            </button>
          </div>

          <form onSubmit={handleSearchSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
              {/* Filter 1: Từ khóa */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="filter-keyword"
                  className="text-xs font-bold text-slate-500 uppercase tracking-wider"
                >
                  {locale === "vi" ? "Từ khóa" : "Keyword"}
                </label>
                <div className="relative">
                  <input
                    id="filter-keyword"
                    type="text"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    placeholder={
                      locale === "vi" ? "Nhập mã, tiêu đề, nội dung..." : "Code, title, content..."
                    }
                    className="w-full min-h-[48px] pl-4 pr-10 rounded-xl border-2 border-slate-200/80 bg-white text-sm focus:border-[#0B4DBB] focus:ring-2 focus:ring-[#0B4DBB]/10 outline-none transition-all"
                  />
                  <Search
                    size={16}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>
              </div>

              {/* Filter 2: Lĩnh vực */}
              <div className="flex flex-col gap-1.5 relative" ref={categoryDropdownRef}>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {locale === "vi" ? "Lĩnh vực" : "Category"}
                </label>
                <button
                  id="filter-category"
                  type="button"
                  onClick={() => setCategoryDropdownOpen((o) => !o)}
                  className="w-full min-h-[48px] px-3.5 rounded-xl border-2 border-slate-200/80 bg-white text-sm text-left flex items-center justify-between gap-2 hover:border-[#0B4DBB] focus:border-[#0B4DBB] outline-none transition-colors cursor-pointer text-[#475467]"
                >
                  <span className="truncate font-semibold">
                    {selectedCategories.length === 0
                      ? locale === "vi"
                        ? "Tất cả lĩnh vực"
                        : "All categories"
                      : selectedCategories.length === 1
                        ? t(
                            (OFFICIAL_CATEGORIES.find((c) => c.code === selectedCategories[0])
                              ?.nameKey ?? "") as any,
                          )
                        : `${selectedCategories.length} ${locale === "vi" ? "lĩnh vực" : "categories"}`}
                  </span>
                  <ChevronDown size={14} className="text-slate-400 shrink-0" />
                </button>

                {categoryDropdownOpen && (
                  <div className="absolute top-[74px] left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg py-2.5 z-50 min-w-[220px] animate-in fade-in slide-in-from-top-1 duration-150">
                    <button
                      type="button"
                      onClick={() => setSelectedCategories([])}
                      className={`w-full text-left px-4 py-2.5 text-xs flex items-center gap-2.5 transition-colors ${
                        selectedCategories.length === 0
                          ? "bg-blue-50 text-[#0B4DBB] font-bold"
                          : "text-slate-600 hover:bg-slate-50 font-semibold"
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${selectedCategories.length === 0 ? "border-[#0B4DBB] bg-[#0B4DBB] text-white" : "border-slate-300"}`}
                      >
                        {selectedCategories.length === 0 && <Check size={10} strokeWidth={3} />}
                      </span>
                      {locale === "vi" ? "Tất cả lĩnh vực" : "All categories"}
                    </button>
                    {OFFICIAL_CATEGORIES.map((c) => {
                      const checked = selectedCategories.includes(c.code);
                      return (
                        <button
                          key={c.code}
                          type="button"
                          onClick={() => handleCategoryToggle(c.code)}
                          className={`w-full text-left px-4 py-2.5 text-xs flex items-center gap-2.5 transition-colors ${
                            checked
                              ? "bg-blue-50 text-[#0B4DBB] font-bold"
                              : "text-slate-600 hover:bg-slate-50 font-semibold"
                          }`}
                        >
                          <span
                            className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${checked ? "border-[#0B4DBB] bg-[#0B4DBB] text-white" : "border-slate-300"}`}
                          >
                            {checked && <Check size={10} strokeWidth={3} />}
                          </span>
                          {t(c.nameKey as any)}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Filter 3: Địa phương */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="filter-district"
                  className="text-xs font-bold text-slate-500 uppercase tracking-wider"
                >
                  {locale === "vi" ? "Địa phương" : "Location"}
                </label>
                <div className="relative">
                  <select
                    id="filter-district"
                    value={districtInput}
                    onChange={(e) => setDistrictInput(e.target.value)}
                    className="w-full min-h-[48px] pl-3.5 pr-10 rounded-xl border-2 border-slate-200/80 bg-white text-sm font-semibold text-[#475467] focus:border-[#0B4DBB] outline-none transition-colors appearance-none cursor-pointer"
                  >
                    <option value="">
                      {locale === "vi" ? "Tất cả địa phương" : "All locations"}
                    </option>
                    {DANANG_DISTRICTS.map((dist) => (
                      <option key={dist.code} value={dist.nameVi}>
                        {locale === "vi" ? dist.nameVi : dist.nameEn}
                      </option>
                    ))}
                  </select>
                  <MapPin
                    size={16}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                </div>
              </div>

              {/* Filter 4: Trạng thái */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="filter-status"
                  className="text-xs font-bold text-slate-500 uppercase tracking-wider"
                >
                  {locale === "vi" ? "Trạng thái" : "Status"}
                </label>
                <div className="relative">
                  <select
                    id="filter-status"
                    value={statusInput}
                    onChange={(e) => setStatusInput(e.target.value as FeedbackStatus | "")}
                    className="w-full min-h-[48px] px-3.5 rounded-xl border-2 border-slate-200/80 bg-white text-sm font-semibold text-[#475467] focus:border-[#0B4DBB] outline-none transition-colors appearance-none cursor-pointer"
                    style={{
                      backgroundImage: `url("data:image/svg+xml;utf8,<svg fill='%23667085' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/></svg>")`,
                      backgroundPosition: "right 12px center",
                      backgroundRepeat: "no-repeat",
                    }}
                  >
                    <option value="">
                      {locale === "vi" ? "Tất cả trạng thái" : "All statuses"}
                    </option>
                    {statuses.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Filter 5: Thời gian */}
              <div className="flex flex-col gap-1.5 relative">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {locale === "vi" ? "Thời gian" : "Date range"}
                </label>
                <button
                  type="button"
                  onClick={() => setDateRangeOpen(!dateRangeOpen)}
                  className="w-full min-h-[48px] px-4 rounded-xl border-2 border-slate-200/80 bg-white text-sm font-semibold text-left flex items-center justify-between text-[#475467] hover:border-[#0B4DBB] transition-colors"
                >
                  <span className="truncate flex items-center gap-2">
                    <Calendar size={16} className="text-slate-400" />
                    {fromDateInput || toDateInput
                      ? `${fromDateInput || "..."} → ${toDateInput || "..."}`
                      : locale === "vi"
                        ? "Chọn khoảng thời gian"
                        : "Select date range"}
                  </span>
                </button>

                {dateRangeOpen && (
                  <div className="absolute top-[74px] left-0 right-0 lg:left-auto lg:right-0 w-[290px] bg-white border border-slate-200 rounded-xl shadow-xl p-4 z-50 space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-500">
                        {locale === "vi" ? "Từ ngày" : "From date"}
                      </span>
                      <input
                        type="date"
                        value={fromDateInput}
                        onChange={(e) => setFromDateInput(e.target.value)}
                        className="w-full h-10 border border-slate-200 rounded-lg px-2 text-sm focus:border-[#0B4DBB] outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-500">
                        {locale === "vi" ? "Đến ngày" : "To date"}
                      </span>
                      <input
                        type="date"
                        value={toDateInput}
                        onChange={(e) => setToDateInput(e.target.value)}
                        className="w-full h-10 border border-slate-200 rounded-lg px-2 text-sm focus:border-[#0B4DBB] outline-none"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-1 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          setFromDateInput("");
                          setToDateInput("");
                        }}
                        className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-red-500 rounded transition"
                      >
                        {locale === "vi" ? "Xóa" : "Clear"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDateRangeOpen(false)}
                        className="px-4.5 py-1.5 bg-[#0B4DBB] text-white text-xs font-bold rounded-lg hover:bg-[#174EA6] transition"
                      >
                        {locale === "vi" ? "Áp dụng" : "Apply"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end border-t border-slate-100 pt-5 gap-3.5">
              <button
                type="button"
                onClick={handleReset}
                className="min-h-[42px] px-5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <RefreshCw size={14} className="text-slate-500" />
                <span>{locale === "vi" ? "Đặt lại" : "Reset"}</span>
              </button>
              <button
                type="submit"
                className="min-h-[42px] px-8 rounded-xl bg-[#0B4DBB] hover:bg-[#174EA6] text-xs font-bold text-white transition-colors flex items-center gap-2 shadow-[0_4px_12px_rgba(11,77,187,0.15)] cursor-pointer"
              >
                <Search size={14} />
                <span>{locale === "vi" ? "Tìm kiếm" : "Search"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* STATISTICS BAR */}
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 mb-8 animate-in fade-in slide-in-from-bottom-5 duration-600">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_8px_30px_rgba(11,77,187,0.04)] py-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            {/* Card 1: Total Reports */}
            <div className="flex items-center gap-4 px-6 py-2">
              <div className="w-11 h-11 rounded-full border-2 border-blue-100 text-[#0B4DBB] flex items-center justify-center shrink-0">
                <FileText size={20} strokeWidth={1.5} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xl font-black text-[#0B4DBB] leading-none mb-1">
                  {stats.total.toLocaleString("vi-VN")}
                </span>
                <span className="text-[11px] font-bold text-slate-700 leading-tight">
                  {locale === "vi" ? "Tổng phản ánh" : "Total Reports"}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 font-semibold truncate">
                  {locale === "vi" ? "Tất cả thời gian" : "All time"}
                </span>
              </div>
            </div>

            {/* Card 2: Processing */}
            <div className="flex items-center gap-4 px-6 py-2">
              <div className="w-11 h-11 rounded-full border-2 border-orange-100 text-[#F97316] flex items-center justify-center shrink-0">
                <Clock size={20} strokeWidth={1.5} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xl font-black text-[#F97316] leading-none mb-1">
                  {stats.pending}
                </span>
                <span className="text-[11px] font-bold text-slate-700 leading-tight">
                  {locale === "vi" ? "Đang xử lý" : "Processing"}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 font-semibold truncate">
                  {locale === "vi" ? `Chiếm ${processingRate}%` : `Rate: ${processingRate}%`}
                </span>
              </div>
            </div>

            {/* Card 3: Resolved */}
            <div className="flex items-center gap-4 px-6 py-2">
              <div className="w-11 h-11 rounded-full border-2 border-green-100 text-[#10B981] flex items-center justify-center shrink-0">
                <CheckCircle2 size={20} strokeWidth={1.5} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xl font-black text-[#10B981] leading-none mb-1">
                  {stats.resolved}
                </span>
                <span className="text-[11px] font-bold text-slate-700 leading-tight">
                  {locale === "vi" ? "Đã xử lý" : "Resolved"}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 font-semibold truncate">
                  {locale === "vi" ? `Chiếm ${resolvedRate}%` : `Rate: ${resolvedRate}%`}
                </span>
              </div>
            </div>

            {/* Card 4: Overdue */}
            <div className="flex items-center gap-4 px-6 py-2">
              <div className="w-11 h-11 rounded-full border-2 border-red-100 text-[#EF4444] flex items-center justify-center shrink-0">
                <AlertTriangle size={20} strokeWidth={1.5} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xl font-black text-[#EF4444] leading-none mb-1">
                  {stats.rejected}
                </span>
                <span className="text-[11px] font-bold text-slate-700 leading-tight">
                  {locale === "vi" ? "Quá hạn" : "Overdue"}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 font-semibold truncate">
                  {locale === "vi" ? `Chiếm ${rejectedRate}%` : `Rate: ${rejectedRate}%`}
                </span>
              </div>
            </div>

            {/* Card 5: Average Resolution Time */}
            <div className="flex items-center gap-4 px-6 py-2">
              <div className="w-11 h-11 rounded-full border-2 border-purple-100 text-[#8B5CF6] flex items-center justify-center shrink-0">
                <Clock size={20} strokeWidth={1.5} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xl font-black text-[#8B5CF6] leading-none mb-1">
                  {locale === "vi" ? "15 phút" : "15m"}
                </span>
                <span className="text-[11px] font-bold text-slate-700 leading-tight">
                  {locale === "vi" ? "Thời gian xử lý TB" : "Avg. Duration"}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 font-semibold truncate">
                  {locale === "vi" ? "Trong ngày" : "Within today"}
                </span>
              </div>
            </div>

            {/* Card 6: Followers */}
            <div className="flex items-center gap-4 px-6 py-2">
              <div className="w-11 h-11 rounded-full border-2 border-indigo-100 text-[#4F46E5] flex items-center justify-center shrink-0">
                <User size={20} strokeWidth={1.5} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xl font-black text-[#4F46E5] leading-none mb-1">2.136</span>
                <span className="text-[11px] font-bold text-slate-700 leading-tight">
                  {locale === "vi" ? "Lượt theo dõi" : "Followers"}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 font-semibold truncate">
                  {locale === "vi" ? "Trong tháng" : "This month"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TWO-COLUMN MAIN CONTENT CONTAINER */}
      <div className="max-w-[1440px] mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: feedback list */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white border border-slate-200/70 rounded-2xl p-6 md:p-8 shadow-[0_4px_24px_rgba(11,77,187,0.02)] space-y-6">
              {activeTab === "my" && !isAuthenticated ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                  <div className="w-20 h-20 bg-blue-50 text-[#0B4DBB] rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <User size={36} />
                  </div>
                  <h3 className="text-xl font-bold text-[#063A94] mb-2 font-sans">
                    {locale === "vi" ? "Yêu cầu đăng nhập" : "Authentication Required"}
                  </h3>
                  <p className="text-sm text-slate-500 max-w-sm mb-8 leading-relaxed font-semibold">
                    {locale === "vi"
                      ? "Vui lòng đăng nhập bằng tài khoản công dân của bạn để xem và theo dõi tiến độ các phản ánh bạn đã gửi."
                      : "Please sign in with your citizen account to inspect and track feedback reports submitted by you."}
                  </p>
                  <Link
                    to="/login"
                    search={{ redirect: "/feedback-search?tab=my" }}
                    className="px-8 py-3 bg-[#0B4DBB] hover:bg-[#174EA6] text-white rounded-xl text-xs font-bold transition shadow-lg hover:shadow-xl font-sans"
                  >
                    {locale === "vi" ? "Đăng nhập ngay" : "Sign in now"}
                  </Link>
                </div>
              ) : (
                <>
                  {/* Results Count & Sorting Header */}
                  <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4 flex-wrap gap-4">
                    <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                      {locale === "vi" ? "Danh sách phản ánh" : "Citizen Reports"}
                    </h2>

                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-slate-500 font-bold">
                        {locale === "vi" ? "Sắp xếp theo:" : "Sort by:"}
                      </span>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="bg-white border border-slate-200 rounded text-slate-700 font-bold outline-none focus:border-[#0B4DBB] cursor-pointer py-1 px-2"
                      >
                        <option value="newest">{locale === "vi" ? "Mới nhất" : "Newest"}</option>
                        <option value="oldest">{locale === "vi" ? "Cũ nhất" : "Oldest"}</option>
                      </select>
                    </div>
                  </div>

                  {/* Errors */}
                  {isError && !isLoading && (
                    <ErrorState
                      message={
                        error instanceof Error
                          ? error.message
                          : locale === "vi"
                            ? "Không thể tải danh sách phản ánh. Vui lòng thử lại sau."
                            : "Failed to download feedback list. Please try again."
                      }
                      onRetry={() => refetch()}
                      compact
                    />
                  )}

                  {/* Skeletons Loading */}
                  {isLoading && (
                    <div className="space-y-5">
                      {[1, 2, 3].map((s) => (
                        <div
                          key={s}
                          className="border border-slate-100 bg-white rounded-xl p-5 flex flex-col md:flex-row gap-5 animate-pulse"
                        >
                          <div className="w-full md:w-40 aspect-[16/10] bg-slate-100 rounded-xl" />
                          <div className="flex-1 space-y-4 py-1">
                            <div className="h-3.5 bg-slate-100 rounded w-1/4" />
                            <div className="h-5 bg-slate-100 rounded w-3/4" />
                            <div className="h-3 bg-slate-100 rounded w-1/2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Empty States */}
                  {!isLoading && !isError && sortedFeedbacks.length === 0 && (
                    <EmptyState
                      title={locale === "vi" ? "Không có phản ánh nào" : "No reports found"}
                      description={
                        locale === "vi"
                          ? "Không tìm thấy phản ánh nào khớp với bộ lọc hiện tại của bạn. Vui lòng thay đổi thông tin bộ lọc và thử lại."
                          : "No report matches your filters. Please try modifying your search options."
                      }
                      action={
                        <button
                          onClick={handleReset}
                          className="px-5 py-2.5 bg-[#0B4DBB] hover:bg-[#174EA6] text-white rounded-xl text-xs font-bold transition shadow-md"
                        >
                          {locale === "vi" ? "Nhập lại bộ lọc" : "Reset all filters"}
                        </button>
                      }
                    />
                  )}

                  {/* Feedbacks Grid List */}
                  {!isLoading && !isError && sortedFeedbacks.length > 0 && (
                    <div className="space-y-4">
                      {sortedFeedbacks.map((report) => {
                        const statusObj = getStatusInfo(report.status);
                        const reportViews = Math.max(12, (report.id * 7) % 184);
                        const reportFollowers = Math.max(2, (report.id * 3) % 43);
                        return (
                          <article
                            key={report.id}
                            onClick={() =>
                              navigate({ to: "/my-reports/$id", params: { id: String(report.id) } })
                            }
                            className="bg-white rounded-none border-b border-slate-200/60 pb-5 mb-5 last:mb-0 last:border-b-0 flex flex-col md:flex-row gap-5 hover:bg-slate-50 transition-colors cursor-pointer group"
                          >
                            {/* Left Thumbnail Image */}
                            <div className="w-full md:w-[180px] aspect-[16/10] bg-slate-50 rounded-lg overflow-hidden shrink-0 border border-slate-100 relative shadow-sm">
                              <img
                                src={
                                  report.attachments?.[0]?.fileUrl ||
                                  "https://images.unsplash.com/photo-1596402184320-417e7178b2cd?auto=format&fit=crop&w=300&h=200&q=80"
                                }
                                alt={report.title}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                loading="lazy"
                              />
                            </div>

                            {/* Center Report Details */}
                            <div className="flex-1 min-w-0 flex flex-col justify-start">
                              <div className="flex items-center justify-between mb-2">
                                <span className="px-2 py-0.5 bg-blue-50 text-[#0B4DBB] text-[10px] font-black rounded font-mono tracking-wider">
                                  {locale === "vi" ? "Mã" : "ID"}:{" "}
                                  {report.trackingCode || `FB-008712`}
                                </span>
                                <div className="md:hidden">
                                  <span
                                    className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider ${statusObj.badgeClass}`}
                                  >
                                    {statusObj.label}
                                  </span>
                                </div>
                              </div>
                              <h3 className="text-base font-black text-slate-800 leading-snug line-clamp-2 mb-3 font-sans group-hover:text-[#0B4DBB] transition-colors">
                                {report.title}
                              </h3>
                              <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-xs font-semibold text-slate-500">
                                <span className="flex items-center gap-1.5">
                                  <MapPin size={14} className="text-slate-400" />
                                  {report.addressDetails ||
                                    report.wardName ||
                                    (locale === "vi"
                                      ? "Phường Hải Châu I, Quận Hải Châu"
                                      : "Hai Chau I, Hai Chau")}
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <Calendar size={14} className="text-slate-400" />
                                  {new Date(report.createdAt).toLocaleDateString(
                                    locale === "vi" ? "vi-VN" : "en-US",
                                  )}{" "}
                                  -{" "}
                                  {new Date(report.createdAt).toLocaleTimeString(
                                    locale === "vi" ? "vi-VN" : "en-US",
                                    { hour: "2-digit", minute: "2-digit" },
                                  )}
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <Eye size={14} className="text-slate-400" />
                                  {reportViews}
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <User size={14} className="text-slate-400" />
                                  {locale === "vi" ? "Theo dõi" : "Followers"}
                                </span>
                              </div>
                            </div>

                            {/* Right Status Badge & Arrow */}
                            <div className="hidden md:flex flex-col items-end justify-between shrink-0 pl-4 w-[160px]">
                              <span
                                className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-wider ${statusObj.badgeClass}`}
                              >
                                {statusObj.label}
                              </span>
                              <div className="flex items-center gap-1 text-slate-400 font-semibold text-[10px]">
                                <span>{locale === "vi" ? "Cập nhật:" : "Updated:"}</span>
                                <span>
                                  {new Date(
                                    report.updatedAt || report.createdAt,
                                  ).toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US")}{" "}
                                  {new Date(
                                    report.updatedAt || report.createdAt,
                                  ).toLocaleTimeString(locale === "vi" ? "vi-VN" : "en-US", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                                <ChevronRight size={14} className="ml-1 text-slate-400" />
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}

                  {/* Pagination Section */}
                  {!isLoading && !isError && totalPages > 1 && (
                    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-6 mt-6">
                      <div className="flex items-center gap-2">
                        {pageButtons.map((pi) => (
                          <button
                            key={pi}
                            type="button"
                            onClick={() => setPage(pi)}
                            className={`w-8 h-8 rounded font-extrabold text-xs transition-colors cursor-pointer ${
                              pi === page
                                ? "bg-[#0B4DBB] text-white"
                                : "bg-white border border-slate-200 text-slate-600 hover:border-[#0B4DBB] hover:text-[#0B4DBB]"
                            }`}
                          >
                            {pi + 1}
                          </button>
                        ))}
                        {totalPages > 5 && (
                          <span className="w-8 h-8 flex items-center justify-center text-slate-400 text-xs font-bold bg-white border border-slate-200 rounded">
                            ...
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => setPage(totalPages - 1)}
                          className="w-8 h-8 rounded bg-white border border-slate-200 font-extrabold text-xs text-slate-600 hover:border-[#0B4DBB] hover:text-[#0B4DBB] transition-colors cursor-pointer flex items-center justify-center"
                        >
                          {totalPages}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                          disabled={feedbacksPage?.last}
                          className="w-8 h-8 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-600 disabled:opacity-30 hover:border-[#0B4DBB] hover:text-[#0B4DBB] transition-colors cursor-pointer ml-2"
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                        <span>{locale === "vi" ? "Hiển thị:" : "Show:"}</span>
                        <select
                          value={pageSize}
                          onChange={(e) => {
                            setPageSize(Number(e.target.value));
                            setPage(0);
                          }}
                          className="bg-white border border-slate-200 rounded px-2 py-1 text-[11px] font-bold text-slate-800 focus:border-[#0B4DBB] outline-none cursor-pointer"
                        >
                          <option value={10}>10 / {locale === "vi" ? "trang" : "page"}</option>
                          <option value={20}>20 / {locale === "vi" ? "trang" : "page"}</option>
                          <option value={50}>50 / {locale === "vi" ? "trang" : "page"}</option>
                        </select>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Info advice footer */}
            <div className="flex items-start gap-2 pt-2 px-2">
              <Info size={14} className="text-slate-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-500 font-semibold">
                {locale === "vi"
                  ? "Kết quả được cập nhật liên tục. Vui lòng chọn bộ lọc phù hợp để tìm kiếm chính xác hơn."
                  : "Results are updated continuously. Please apply appropriate filters for better accuracy."}
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN: Sidebar widgets */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-[96px]">
            {/* Sidebar 1: Map */}
            <div className="bg-white border border-slate-200/70 rounded-xl p-5 shadow-[0_4px_24px_rgba(11,77,187,0.02)] space-y-4">
              <h3 className="text-slate-800 font-bold text-sm border-b border-slate-100 pb-3">
                {locale === "vi" ? "Bản đồ phản ánh" : "Feedback Map"}
              </h3>
              <div className="aspect-[4/3] rounded-lg overflow-hidden border border-slate-200 relative z-0 shadow-sm">
                <Suspense
                  fallback={
                    <div className="w-full h-full bg-slate-50 animate-pulse flex items-center justify-center text-xs text-slate-400">
                      Loading Map...
                    </div>
                  }
                >
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
                    interactive={true}
                  />
                </Suspense>
              </div>

              {/* Map Legend */}
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                  <span>{locale === "vi" ? "Chưa xử lý" : "Pending"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" />
                  <span>{locale === "vi" ? "Đang xử lý" : "Processing"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
                  <span>{locale === "vi" ? "Đã xử lý" : "Resolved"}</span>
                </div>
              </div>
            </div>

            {/* Sidebar 2: Category Statistics Donut Chart */}
            <div className="bg-white border border-slate-200/70 rounded-xl p-5 shadow-[0_4px_24px_rgba(11,77,187,0.02)] space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-slate-800 font-bold text-sm">
                  {locale === "vi" ? "Thống kê theo lĩnh vực" : "Category Statistics"}
                </h3>
                <button className="text-[#0B4DBB] text-[10px] font-bold flex items-center gap-1 hover:underline">
                  {locale === "vi" ? "Xem chi tiết" : "View detail"} <ChevronRight size={12} />
                </button>
              </div>
              <div className="pt-2 w-full">
                <DonutChart
                  infra={categoryCounts.infra}
                  env={categoryCounts.env}
                  traffic={categoryCounts.traffic}
                  security={categoryCounts.security}
                />
              </div>
            </div>

            {/* Sidebar 3: Quick Links */}
            <div className="bg-white border border-slate-200/70 rounded-xl p-5 shadow-[0_4px_24px_rgba(11,77,187,0.02)] space-y-4">
              <h3 className="text-slate-800 font-bold text-sm border-b border-slate-100 pb-3">
                {locale === "vi" ? "Liên kết nhanh" : "Quick Links"}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <a
                  href="#huong-dan"
                  className="p-3 border border-slate-100 rounded-lg flex flex-col items-center text-center hover:bg-slate-50 transition cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full border border-blue-100 bg-white text-[#0B4DBB] flex items-center justify-center mb-2">
                    <BookOpen size={14} />
                  </div>
                  <span className="text-[10px] font-bold text-slate-700 leading-snug">
                    {locale === "vi" ? "Hướng dẫn gửi phản ánh" : "User Guide"}
                  </span>
                </a>

                <a
                  href="#quy-trinh"
                  className="p-3 border border-slate-100 rounded-lg flex flex-col items-center text-center hover:bg-slate-50 transition cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full border border-blue-100 bg-white text-[#0B4DBB] flex items-center justify-center mb-2">
                    <FileCheck size={14} />
                  </div>
                  <span className="text-[10px] font-bold text-slate-700 leading-snug">
                    {locale === "vi" ? "Quy trình xử lý" : "Workflow Process"}
                  </span>
                </a>

                <a
                  href="#cau-hoi"
                  className="p-3 border border-slate-100 rounded-lg flex flex-col items-center text-center hover:bg-slate-50 transition cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full border border-blue-100 bg-white text-[#0B4DBB] flex items-center justify-center mb-2">
                    <HelpCircle size={14} />
                  </div>
                  <span className="text-[10px] font-bold text-slate-700 leading-snug">
                    {locale === "vi" ? "Câu hỏi thường gặp" : "FAQs"}
                  </span>
                </a>

                <a
                  href="#mobile-app"
                  className="p-3 border border-slate-100 rounded-lg flex flex-col items-center text-center hover:bg-slate-50 transition cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full border border-blue-100 bg-white text-[#0B4DBB] flex items-center justify-center mb-2">
                    <Smartphone size={14} />
                  </div>
                  <span className="text-[10px] font-bold text-slate-700 leading-snug">
                    {locale === "vi" ? "Tải ứng dụng mobile" : "Mobile App"}
                  </span>
                </a>
              </div>
            </div>

            {/* Sidebar 4: Search Guide Illustration */}
            <div className="bg-white border border-slate-200/70 rounded-xl p-5 shadow-[0_4px_24px_rgba(11,77,187,0.02)] space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-slate-800 font-bold text-sm">
                  {locale === "vi" ? "Hướng dẫn tra cứu" : "Search Assistance"}
                </h3>
                <button className="text-[#0B4DBB] text-[10px] font-bold flex items-center gap-1 hover:underline">
                  {locale === "vi" ? "Xem hướng dẫn" : "View guide"} <ChevronRight size={12} />
                </button>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-[11px] text-slate-600 font-semibold leading-relaxed flex-1">
                  {locale === "vi"
                    ? "Hướng dẫn chi tiết cách tìm kiếm và theo dõi phản ánh hiện trường trên hệ thống Đà Nẵng Kết Nối."
                    : "Detailed guide on how to search and track field reports on Da Nang Connect system."}
                </p>
                <div className="w-16 h-16 shrink-0 relative bg-[#EEF2F6] rounded-xl flex items-center justify-center">
                  <FileText size={28} className="text-[#0B4DBB] opacity-40" />
                  <Search
                    size={20}
                    className="text-[#0B4DBB] absolute -bottom-1 -right-1"
                    strokeWidth={3}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* FOOTER SECTION */}
      <footer className="relative z-30 bg-[#051D45] text-slate-300 mt-20 border-t-4 border-[#0B4DBB]">
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {/* Col 1: Logo Portal info */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center p-1.5 shadow-md">
                  <img
                    src={logoImg}
                    alt="Da Nang Emblem"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-black text-white uppercase tracking-tight leading-none">
                    ĐÀ NẴNG KẾT NỐI
                  </span>
                  <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-wider mt-1.5 leading-none">
                    {locale === "vi"
                      ? "Hệ thống phản ánh ý kiến công dân"
                      : "Da Nang Civic Feedback System"}
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed pt-2 font-semibold">
                {locale === "vi"
                  ? "Cổng thông tin tương tác trực tuyến giữa chính quyền và người dân Thành phố Đà Nẵng. Tiếp nhận, lắng nghe và giải quyết kịp thời các kiến nghị của cử tri."
                  : "Online interactive portal between municipal government and citizens of Da Nang. Receive, listen and timely resolve voter proposals."}
              </p>
            </div>

            {/* Col 2: Sitemap links */}
            <div className="space-y-4">
              <h4 className="text-white text-xs font-black uppercase tracking-widest border-l-2 border-[#0B4DBB] pl-2.5">
                {locale === "vi" ? "Liên kết dịch vụ công" : "Citizen Services"}
              </h4>
              <ul className="space-y-2 text-xs font-semibold">
                <li>
                  <Link
                    to="/"
                    className="hover:text-white transition flex items-center gap-1 text-slate-400"
                  >
                    <ArrowRight size={10} />
                    <span>{locale === "vi" ? "Trang chủ cổng thông tin" : "Home Portal"}</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/tin-tuc"
                    className="hover:text-white transition flex items-center gap-1 text-slate-400"
                  >
                    <ArrowRight size={10} />
                    <span>{locale === "vi" ? "Tin tức & Thông báo" : "News & Announcements"}</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/feedback-search"
                    className="hover:text-white transition flex items-center gap-1 text-slate-400"
                  >
                    <ArrowRight size={10} />
                    <span>
                      {locale === "vi" ? "Tra cứu phản ánh trực tuyến" : "Online Feedback Lookup"}
                    </span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/campaigns"
                    className="hover:text-white transition flex items-center gap-1 text-slate-400"
                  >
                    <ArrowRight size={10} />
                    <span>
                      {locale === "vi" ? "Chiến dịch dọn vệ sinh" : "Civic Clean campaigns"}
                    </span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Legal & Help info */}
            <div className="space-y-4">
              <h4 className="text-white text-xs font-black uppercase tracking-widest border-l-2 border-[#0B4DBB] pl-2.5">
                {locale === "vi" ? "Văn bản pháp lý" : "Resources"}
              </h4>
              <ul className="space-y-2 text-xs font-semibold">
                <li>
                  <a
                    href="#quy-trinh"
                    className="hover:text-white transition flex items-center gap-1 text-slate-400"
                  >
                    <ArrowRight size={10} />
                    <span>
                      {locale === "vi" ? "Quy trình giải quyết 1022" : "Workflow Resolution 1022"}
                    </span>
                  </a>
                </li>
                <li>
                  <a
                    href="#bao-mat"
                    className="hover:text-white transition flex items-center gap-1 text-slate-400"
                  >
                    <ArrowRight size={10} />
                    <span>{locale === "vi" ? "Chính sách quyền riêng tư" : "Privacy Policy"}</span>
                  </a>
                </li>
                <li>
                  <a
                    href="#dieu-khoan"
                    className="hover:text-white transition flex items-center gap-1 text-slate-400"
                  >
                    <ArrowRight size={10} />
                    <span>{locale === "vi" ? "Điều khoản dịch vụ" : "Terms of Service"}</span>
                  </a>
                </li>
                <li>
                  <a
                    href="#gop-y"
                    className="hover:text-white transition flex items-center gap-1 text-slate-400"
                  >
                    <ArrowRight size={10} />
                    <span>{locale === "vi" ? "Câu hỏi & Giải đáp FAQ" : "FAQ Help Center"}</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 4: Contact details */}
            <div className="space-y-4">
              <h4 className="text-white text-xs font-black uppercase tracking-widest border-l-2 border-[#0B4DBB] pl-2.5">
                {locale === "vi" ? "Thông tin liên hệ" : "Contact Information"}
              </h4>
              <div className="space-y-3.5 text-xs text-slate-400 font-semibold pt-1">
                <p className="leading-relaxed flex items-start gap-2">
                  <MapPin size={16} className="text-[#0B4DBB] shrink-0 mt-0.5" />
                  <span>
                    {locale === "vi"
                      ? "Tòa nhà Trung tâm Hành chính, số 24 Trần Phú, Hải Châu, Đà Nẵng, Việt Nam"
                      : "Administrative Center Building, 24 Tran Phu St, Hai Chau Dist, Da Nang, Vietnam"}
                  </span>
                </p>
                <p className="flex items-center gap-2">
                  <Mail size={14} className="text-[#0B4DBB] shrink-0" />
                  <span>gopy@danang.gov.vn</span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone size={14} className="text-[#0B4DBB] shrink-0" />
                  <span>
                    {locale === "vi" ? "Đường dây nóng: 1022 (Trong nước)" : "Hotline: 1022"}
                  </span>
                </p>
                <p className="text-[10px] text-slate-500 font-extrabold italic pl-6 leading-none">
                  {locale === "vi"
                    ? "Giờ làm việc: 24/7 các ngày trong tuần"
                    : "Working Hours: 24/7"}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800/80 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-bold">
            <p>
              © {new Date().getFullYear()}{" "}
              {locale === "vi"
                ? "UBND Thành phố Đà Nẵng. Bản quyền đã được bảo lưu."
                : "Da Nang City People's Committee. All rights reserved."}
            </p>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="text-[#0B4DBB] hover:text-[#174EA6] hover:underline cursor-pointer flex items-center gap-1.5"
            >
              <span>{locale === "vi" ? "Lên đầu trang" : "Back to top"}</span>
              <ChevronDown size={14} className="rotate-180" />
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}

// ─── HELPER COMPONENTS ───────────────────────────────────────

interface DonutChartProps {
  infra: number;
  env: number;
  traffic: number;
  security: number;
}

function DonutChart({ infra, env, traffic, security }: DonutChartProps) {
  const total = infra + env + traffic + security;
  const pInfra = total > 0 ? (infra / total) * 100 : 0;
  const pEnv = total > 0 ? (env / total) * 100 : 0;
  const pTraffic = total > 0 ? (traffic / total) * 100 : 0;
  const pSecurity = total > 0 ? (security / total) * 100 : 0;

  // Render a clean SVG Donut Chart
  const r = 36;
  const circ = 2 * Math.PI * r; // ~226.2

  const dashInfra = circ * (pInfra / 100);
  const dashEnv = circ * (pEnv / 100);
  const dashTraffic = circ * (pTraffic / 100);
  const dashSecurity = circ * (pSecurity / 100);

  const offsetInfra = 0;
  const offsetEnv = dashInfra;
  const offsetTraffic = dashInfra + dashEnv;
  const offsetSecurity = dashInfra + dashEnv + dashTraffic;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative w-28 h-28 shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={r} fill="transparent" stroke="#f1f5f9" strokeWidth="11" />

          {pInfra > 0 && (
            <circle
              cx="50"
              cy="50"
              r={r}
              fill="transparent"
              stroke="#0B4DBB"
              strokeWidth="11"
              strokeDasharray={`${dashInfra} ${circ}`}
              strokeDashoffset={-offsetInfra}
              strokeLinecap="round"
            />
          )}
          {pEnv > 0 && (
            <circle
              cx="50"
              cy="50"
              r={r}
              fill="transparent"
              stroke="#10B981"
              strokeWidth="11"
              strokeDasharray={`${dashEnv} ${circ}`}
              strokeDashoffset={-offsetEnv}
              strokeLinecap="round"
            />
          )}
          {pTraffic > 0 && (
            <circle
              cx="50"
              cy="50"
              r={r}
              fill="transparent"
              stroke="#F59E0B"
              strokeWidth="11"
              strokeDasharray={`${dashTraffic} ${circ}`}
              strokeDashoffset={-offsetTraffic}
              strokeLinecap="round"
            />
          )}
          {pSecurity > 0 && (
            <circle
              cx="50"
              cy="50"
              r={r}
              fill="transparent"
              stroke="#8B5CF6"
              strokeWidth="11"
              strokeDasharray={`${dashSecurity} ${circ}`}
              strokeDashoffset={-offsetSecurity}
              strokeLinecap="round"
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
            Tỉ lệ
          </span>
          <span className="text-sm font-black text-[#063A94] mt-0.5">{total} PA</span>
        </div>
      </div>

      <div className="flex-1 space-y-2.5 text-xs font-bold w-full">
        <div className="flex items-center justify-between border-b border-slate-50 pb-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0B4DBB] inline-block shadow-sm" />
            <span className="text-slate-500">Hạ tầng đô thị</span>
          </div>
          <span className="text-[#063A94]">
            {infra} ({Math.round(pInfra)}%)
          </span>
        </div>
        <div className="flex items-center justify-between border-b border-slate-50 pb-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] inline-block shadow-sm" />
            <span className="text-slate-500">Môi trường</span>
          </div>
          <span className="text-[#063A94]">
            {env} ({Math.round(pEnv)}%)
          </span>
        </div>
        <div className="flex items-center justify-between border-b border-slate-50 pb-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] inline-block shadow-sm" />
            <span className="text-slate-500">Giao thông</span>
          </div>
          <span className="text-[#063A94]">
            {traffic} ({Math.round(pTraffic)}%)
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6] inline-block shadow-sm" />
            <span className="text-slate-500">Trật tự đô thị</span>
          </div>
          <span className="text-[#063A94]">
            {security} ({Math.round(pSecurity)}%)
          </span>
        </div>
      </div>
    </div>
  );
}

// Da Nang districts data
const DANANG_DISTRICTS = [
  { code: "HAI_CHAU", nameVi: "Quận Hải Châu", nameEn: "Hai Chau District" },
  { code: "THANH_KHE", nameVi: "Quận Thanh Khê", nameEn: "Thanh Khe District" },
  { code: "SON_TRA", nameVi: "Quận Sơn Trà", nameEn: "Son Tra District" },
  { code: "NGU_HANH_SON", nameVi: "Quận Ngũ Hành Sơn", nameEn: "Ngu Hanh Son District" },
  { code: "LIEN_CHIEU", nameVi: "Quận Liên Chiểu", nameEn: "Lien Chieu District" },
  { code: "CAM_LE", nameVi: "Quận Cẩm Lệ", nameEn: "Cam Le District" },
  { code: "HOA_VANG", nameVi: "Huyện Hòa Vang", nameEn: "Hoa Vang District" },
];

function getVisiblePageIndexes(currentPage: number, totalPages: number) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index);
  }

  const start = Math.max(0, Math.min(currentPage - 2, totalPages - 5));
  return Array.from({ length: 5 }, (_, index) => start + index);
}
