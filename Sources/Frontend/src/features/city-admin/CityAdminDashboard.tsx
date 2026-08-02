import { lazy, Suspense, useState, useEffect, useRef, useMemo } from "react";
import { useI18n } from "@/lib/i18n";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNotifications, useMarkNotificationReadMutation } from "@/hooks";
import { highlightNotificationContent, translateNotificationTitle } from "@/lib/notificationHelper";
import { useFeedbackNotification } from "@/hooks/use-notification";
import { useAuth } from "@/lib/auth";
import { getLoginPathForRole } from "@/lib/roles";
import {
  analyticsApi,
  authApi,
  feedbackApi,
  type KpiData,
  type WardPerformance,
  type MonthlyTrend,
} from "@/lib/api";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  kpis as mockKpis,
  wardPerformance as mockWardPerf,
  reports as mockReports,
} from "@/lib/mock-data";
import { Skeleton } from "@/components/ui/skeleton";
import { mapStatus } from "@/lib/status";
import logoImg from "@/assets/logo.png";
import { OverviewPage } from "./pages/OverviewPage";
import { FeedbacksPage } from "./pages/FeedbacksPage";
import { ReportsPage } from "./pages/ReportsPage";
import { UsersPage } from "./pages/UsersPage";
import { PermissionsPage } from "./pages/PermissionsPage";
import { AiDashboardPage } from "./pages/AiDashboardPage";
import { NewsManagement } from "../news/NewsManagement";
import { toast } from "sonner";
import {
  LayoutDashboard,
  MapPin,
  FileText,
  BarChart3,
  Users,
  Shield,
  Menu,
  Search,
  Bell,
  ChevronDown,
  Clock,
  RefreshCw,
  AlertCircle,
  Building2,
  Leaf,
  Flame,
  Construction,
  Car,
  Download,
  Settings,
  LogOut,
  ChevronRight,
  TrendingUp,
  Home,
  UserCheck,
  Activity,
  Zap,
  Maximize2,
  Minimize2,
} from "lucide-react";

// Lazy-load Leaflet map component to prevent SSR issues (window is not defined)
const SuperAdminMap = lazy(() =>
  import("./SuperAdminMap").then((m) => ({ default: m.SuperAdminMap })),
);

// Map category helper
const mapCategoryName = (name: string | null | undefined): string => {
  if (!name) return "Hạ tầng đô thị";
  const n = name.toLowerCase();
  if (n.includes("giao thông") || n.includes("traffic") || n.includes("giao thong")) {
    return "Giao thông";
  }
  if (
    n.includes("môi trường") ||
    n.includes("environment") ||
    n.includes("moi truong") ||
    n.includes("rác")
  ) {
    return "Môi trường";
  }
  if (
    n.includes("an ninh") ||
    n.includes("security") ||
    n.includes("safety") ||
    n.includes("trật tự") ||
    n.includes("pháp")
  ) {
    return "An ninh trật tự";
  }
  if (n.includes("xây dựng") || n.includes("construction") || n.includes("xay dung")) {
    return "Xây dựng";
  }
  if (n.includes("phòng cháy") || n.includes("chữa cháy") || n.includes("fire")) {
    return "Phòng cháy chữa cháy";
  }
  // Default to "Hạ tầng đô thị" for generic / infrastructure cases
  return "Hạ tầng đô thị";
};

// Category Icon helper
const getCategoryIcon = (catName: string) => {
  switch (catName) {
    case "Giao thông":
      return <Car className="w-5 h-5" />;
    case "Hạ tầng đô thị":
      return <Building2 className="w-5 h-5" />;
    case "Môi trường":
      return <Leaf className="w-5 h-5" />;
    case "An ninh trật tự":
      return <Shield className="w-5 h-5" />;
    case "Xây dựng":
      return <Construction className="w-5 h-5" />;
    case "Phòng cháy chữa cháy":
      return <Flame className="w-5 h-5" />;
    default:
      return <Building2 className="w-5 h-5" />;
  }
};

// Calculate time elapsed since report was created in Vietnamese format
function getOverdueTime(createdAt: string): string {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHrs < 24) {
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / 60000);
    return `${diffHrs} giờ ${mins} phút`;
  } else {
    const days = Math.floor(diffHrs / 24);
    const remainingHrs = diffHrs % 24;
    return `${days} ngày ${remainingHrs} giờ`;
  }
}

export function CityAdminDashboard() {
  const { locale } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  useFeedbackNotification(); // Real-time WebSockets update listener
  const { user, logout } = useAuth();

  // State controls for headers/sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<
    "overview" | "feedbacks" | "reports" | "users" | "news" | "permissions" | "ai_stats"
  >("overview");

  // Filter states
  const [selectedWard, setSelectedWard] = useState<string | undefined>(undefined);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(undefined);

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Click outside listener for dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setUserOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const colors = {
    primaryNavy: "#0B1F4D",
    secondaryBlue: "#234E9B",
    policeGold: "#C9A227",
    criticalRed: "#C62828",
    successGreen: "#2E7D32",
    background: "#F5F7FA",
    border: "#D9E1EC",
    textPrimary: "#1B1F23",
    textSecondary: "#6B7280",
  };

  // Fetch real backend data — dùng admin endpoint để lấy toàn bộ phản ánh thành phố
  const {
    data: feedbacksPage,
    isLoading: feedbacksLoading,
    isError: feedbacksError,
    refetch: refetchFeedbacks,
  } = useQuery({
    queryKey: ["admin", "feedbacks", "all"],
    queryFn: () => feedbackApi.adminGetAll(0, 500),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  const {
    data: analyticsKpi,
    isLoading: kpiLoading,
    isError: kpiError,
  } = useQuery<KpiData>({
    queryKey: ["analytics", "kpi"],
    queryFn: () => analyticsApi.kpi(),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  const { data: wardPerf, isLoading: wardLoading } = useQuery<WardPerformance[]>({
    queryKey: ["analytics", "ward-performance"],
    queryFn: () => analyticsApi.wardPerformance(),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  const { data: monthlyTrend } = useQuery<MonthlyTrend[]>({
    queryKey: ["analytics", "monthly-trend"],
    queryFn: () => analyticsApi.monthlyTrend(12),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const { data: notifications = [] } = useNotifications();
  const markRead = useMarkNotificationReadMutation();
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const feedbacks = feedbacksPage?.content ?? [];
  const hasApiData = feedbacks.length > 0;

  // Sync / derive stats dynamically from real report list
  const totalReportsCount = hasApiData ? feedbacks.length : (analyticsKpi?.total ?? 0);
  const unresolvedCount = feedbacks.filter(
    (f) => f.status !== "RESOLVED" && f.status !== "REJECTED",
  ).length;
  const inProgressCount = feedbacks.filter(
    (f) => f.status === "IN_PROGRESS" || f.status === "ASSIGNED" || f.status === "WAITING_INFO",
  ).length;

  // Overdue count derivation (created > 3 days ago and not resolved)
  const overdueCount = feedbacks.filter((f) => {
    const isNotResolved = f.status !== "RESOLVED" && f.status !== "REJECTED";
    const diffTime = Math.abs(new Date().getTime() - new Date(f.createdAt).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return isNotResolved && diffDays > 3;
  }).length;

  // Deriving trend statistics from monthlyTrend
  const getTrendPct = (key: "total" | "resolved") => {
    if (!monthlyTrend || monthlyTrend.length < 2) return null;
    const current = monthlyTrend[monthlyTrend.length - 1];
    const previous = monthlyTrend[monthlyTrend.length - 2];
    if (!previous || previous[key] === 0) return null;
    const diff = current[key] - previous[key];
    const pct = (diff / previous[key]) * 100;
    return {
      pct: Math.abs(pct).toFixed(1) + "%",
      isUp: diff >= 0,
    };
  };

  const totalTrend = getTrendPct("total");
  const resolvedTrend = getTrendPct("resolved");

  // Navigation config for left blue sidebar
  const navItems = [
    {
      name: "Tổng quan",
      tab: "overview" as const,
      icon: Home,
      badge: null,
      description: "Dashboard tổng quan",
    },
    {
      name: "Phản ánh",
      tab: "feedbacks" as const,
      icon: FileText,
      badge: unresolvedCount > 0 ? unresolvedCount : null,
      description: "Quản lý phản ánh từ dân",
    },
    {
      name: "Báo cáo",
      tab: "reports" as const,
      icon: BarChart3,
      badge: null,
      description: "Thống kê & phân tích",
    },
    {
      name: "Tài khoản",
      tab: "users" as const,
      icon: Users,
      badge: null,
      description: "Quản lý người dùng",
    },
    {
      name: "Thống kê AI",
      tab: "ai_stats" as const,
      icon: Zap,
      badge: null,
      description: "Hiệu suất AI Auto-Dispatch",
    },
    {
      name: "Tin tức",
      tab: "news" as const,
      icon: FileText,
      badge: null,
      description: "Quản lý tin tức",
    },
    // Tạm ẩn Phân quyền theo yêu cầu
    // {
    //   name: "Phân quyền",
    //   tab: "permissions" as const,
    //   icon: Shield,
    //   badge: "NEW",
    //   description: "Cấp quyền & phân công"
    // },
  ];

  // Hotspot location database
  const defaultWards = [
    "Hải Châu",
    "Thanh Khê",
    "Liên Chiểu",
    "Sơn Trà",
    "Ngũ Hành Sơn",
    "Cẩm Lệ",
    "Hòa Vang",
  ];
  const WARD_COORDINATES: Record<string, [number, number]> = {
    "Hải Châu": [16.047, 108.218],
    "Thanh Khê": [16.062, 108.182],
    "Liên Chiểu": [16.079, 108.152],
    "Sơn Trà": [16.085, 108.244],
    "Ngũ Hành Sơn": [16.023, 108.258],
    "Cẩm Lệ": [16.014, 108.173],
    "Hòa Vang": [15.992, 108.115],
  };

  // Group real feedbacks by area
  const areaHotspots = useMemo(() => {
    const areaMap: Record<
      string,
      {
        name: string;
        total: number;
        unresolved: number;
        overdue: number;
        categoryCounts: Record<string, number>;
      }
    > = {};

    defaultWards.forEach((w) => {
      areaMap[w] = { name: w, total: 0, unresolved: 0, overdue: 0, categoryCounts: {} };
    });

    feedbacks.forEach((fb) => {
      // Find ward name from database mapping
      let matchedWard = "Khác";
      for (const w of defaultWards) {
        if (
          fb.wardName?.toLowerCase().includes(w.toLowerCase()) ||
          fb.addressDetails?.toLowerCase().includes(w.toLowerCase())
        ) {
          matchedWard = w;
          break;
        }
      }

      if (matchedWard === "Khác") return;

      areaMap[matchedWard].total++;
      const isUnresolved = fb.status !== "RESOLVED" && fb.status !== "REJECTED";
      if (isUnresolved) {
        areaMap[matchedWard].unresolved++;
        const diffTime = Math.abs(new Date().getTime() - new Date(fb.createdAt).getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 3) {
          areaMap[matchedWard].overdue++;
        }
        const mappedCat = mapCategoryName(fb.categoryName);
        areaMap[matchedWard].categoryCounts[mappedCat] =
          (areaMap[matchedWard].categoryCounts[mappedCat] || 0) + 1;
      }
    });

    return Object.values(areaMap).map((w) => {
      // Find top category
      let topCategory = "";
      let maxCatCount = 0;
      Object.entries(w.categoryCounts).forEach(([cat, count]) => {
        if (count > maxCatCount) {
          maxCatCount = count;
          topCategory = cat;
        }
      });

      const coords = WARD_COORDINATES[w.name] || [16.0544, 108.2022];
      return {
        name: w.name,
        lat: coords[0],
        lng: coords[1],
        total: w.total,
        unresolved: w.unresolved,
        overdue: w.overdue,
        unresolvedPct: w.total > 0 ? (w.unresolved / w.total) * 100 : 0,
        topCategory,
      };
    });
  }, [feedbacks]);

  // Sort areas by unresolved count to display in ranking list
  const rankedAreas = useMemo(() => {
    return [...areaHotspots].sort((a, b) => b.unresolved - a.unresolved).slice(0, 5);
  }, [areaHotspots]);

  // Unresolved counts by 6 main categories
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      "Giao thông": 0,
      "Hạ tầng đô thị": 0,
      "Môi trường": 0,
      "An ninh trật tự": 0,
      "Xây dựng": 0,
      "Phòng cháy chữa cháy": 0,
    };

    feedbacks.forEach((fb) => {
      const isUnresolved = fb.status !== "RESOLVED" && fb.status !== "REJECTED";
      if (isUnresolved) {
        const mapped = mapCategoryName(fb.categoryName);
        if (mapped in counts) {
          counts[mapped]++;
        }
      }
    });

    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
    }));
  }, [feedbacks]);

  const maxCategoryCount = useMemo(() => {
    return Math.max(1, ...categoryCounts.map((c) => c.count));
  }, [categoryCounts]);

  // High priority list derivation
  const priorityReports = useMemo(() => {
    return (
      feedbacks
        .filter((fb) => fb.status !== "RESOLVED" && fb.status !== "REJECTED")
        .map((fb) => {
          const diffTime = Math.abs(new Date().getTime() - new Date(fb.createdAt).getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          let priorityStatus = "Đang xử lý";
          let priorityBadgeColor = "bg-blue-50 text-blue-600 border border-blue-100";

          if (diffDays > 3) {
            priorityStatus = "Quá hạn";
            priorityBadgeColor = "bg-red-50 text-red-600 border border-red-100";
          } else if (diffDays >= 1) {
            priorityStatus = "Sắp quá hạn";
            priorityBadgeColor = "bg-orange-50 text-orange-600 border border-orange-100";
          }

          // Find area name
          let matchedWard = "Đà Nẵng";
          for (const w of defaultWards) {
            if (
              fb.wardName?.toLowerCase().includes(w.toLowerCase()) ||
              fb.addressDetails?.toLowerCase().includes(w.toLowerCase())
            ) {
              matchedWard = w;
              break;
            }
          }

          return {
            id: fb.id,
            trackingCode: fb.trackingCode || `PA-${fb.id}`,
            ward: matchedWard,
            category: mapCategoryName(fb.categoryName),
            status: priorityStatus,
            badgeColor: priorityBadgeColor,
            overdueTime: getOverdueTime(fb.createdAt),
            createdAt: new Date(fb.createdAt).getTime(),
            diffDays,
          };
        })
        // Sort: Overdue first, then Sắp quá hạn, then Đang xử lý
        .sort((a, b) => b.diffDays - a.diffDays)
    );
  }, [feedbacks]);

  // Filters application
  const filteredPriorityReports = useMemo(() => {
    let result = [...priorityReports];
    if (selectedWard) {
      result = result.filter((r) => r.ward === selectedWard);
    }
    if (selectedCategory) {
      result = result.filter((r) => r.category === selectedCategory);
    }
    if (selectedStatus) {
      result = result.filter((r) => r.status === selectedStatus);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.trackingCode.toLowerCase().includes(q) ||
          r.ward.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q),
      );
    }
    return result.slice(0, 5);
  }, [priorityReports, selectedWard, selectedCategory, selectedStatus, searchQuery]);

  const handleMarkAllRead = async () => {
    const unreadItems = notifications.filter((n) => !n.isRead).slice(0, 5);
    if (unreadItems.length === 0) return;
    try {
      await Promise.all(unreadItems.map((item) => markRead.mutateAsync(item.id)));
      toast.success(
        locale === "vi" ? "Đã đánh dấu đọc tất cả thông báo" : "All notifications marked as read",
      );
    } catch (err) {
      toast.error(locale === "vi" ? "Thao tác thất bại" : "Action failed");
    }
  };

  const handleNotifClick = async (id: number | string, refId: number | null) => {
    setNotifOpen(false);
    try {
      await markRead.mutateAsync(id);
      if (refId) {
        await navigate({ to: "/my-reports/$id", params: { id: String(refId) } });
      }
    } catch (err) {
      // ignore
    }
  };

  const handleLogout = async () => {
    try {
      const loginPath = getLoginPathForRole(user?.role);
      await authApi.logout().catch(() => {
        // Ignore logout API errors, still proceed with local logout
      });
      logout();
      setUserOpen(false);
      toast.success("Đã đăng xuất thành công");
      // Small delay to show toast before navigation
      setTimeout(() => {
        navigate({ to: loginPath });
      }, 500);
    } catch (error) {
      // Even if logout fails, still clear local state
      logout();
      setUserOpen(false);
      navigate({ to: "/login" });
    }
  };

  const resetAllFilters = () => {
    setSelectedWard(undefined);
    setSelectedCategory(undefined);
    setSelectedStatus(undefined);
    setSearchQuery("");
  };

  // Error boundary cho queries
  if (feedbacksError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7FAFF] to-[#EDF4FF] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Không thể tải dữ liệu</h2>
          <p className="text-slate-600 mb-4">Vui lòng thử lại sau</p>
          <button
            onClick={() => {
              // Refresh data instead of reloading page
              queryClient.invalidateQueries();
              toast.success("Đã làm mới dữ liệu");
            }}
            className="px-4 py-2 bg-[#0B4FC4] text-white rounded-lg hover:bg-blue-700 transition"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex font-sans" style={{ backgroundColor: colors.background, color: colors.textPrimary }}>
      {/* LEFT SIDEBAR */}
      <aside className="w-[260px] flex flex-col shrink-0" style={{ backgroundColor: colors.primaryNavy }}>
        <div className="p-6 pb-4 border-b border-white/10 flex flex-col items-center">
          <img src={logoImg} alt="Emblem" className="w-16 h-16 object-contain mb-3 drop-shadow-md" />
          <h1 className="text-center font-bold text-[13px] text-white uppercase leading-snug w-full px-1">
            ĐÀ NẴNG KẾT NỐI
          </h1>
        </div>
        
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.tab;
            return (
              <button
                key={item.tab}
                onClick={() => {
                  setActiveTab(item.tab);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[8px] text-sm font-medium transition-colors ${
                  isActive ? "text-white" : "text-slate-300 hover:text-white hover:bg-white/5"
                }`}
                style={{ backgroundColor: isActive ? colors.secondaryBlue : "transparent" }}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} strokeWidth={2} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9.5px] font-black relative z-10 ${
                      String(item.badge) === "NEW"
                        ? "bg-emerald-500 text-white shadow-sm"
                        : "bg-red-500 text-white shadow-sm"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* MAIN CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* HEADER */}
        <header className="min-h-[90px] py-3 bg-white border-b px-6 flex items-center justify-between shrink-0 gap-6" style={{ borderColor: colors.border, fontFamily: 'Inter, sans-serif' }}>
          {/* LEFT SECTION */}
          <div className="flex-[2] xl:flex-[2.5] flex items-center gap-3 lg:gap-4 min-w-0">
            <img src={logoImg} alt="Emblem" className="w-[45px] h-[45px] lg:w-[50px] lg:h-[50px] object-contain drop-shadow-sm shrink-0" />
            <div className="flex flex-col min-w-0">
              <h2 className="text-[14px] md:text-[16px] lg:text-[17px] font-bold leading-tight whitespace-normal break-words" style={{ color: colors.primaryNavy }}>
                TRUNG TÂM ĐIỀU HÀNH THÀNH PHỐ ĐÀ NẴNG
              </h2>
              <span className="text-[12px] lg:text-[13px] font-medium mt-0.5 truncate hidden sm:block" style={{ color: colors.textSecondary }}>
                Hệ thống quản lý đô thị - <strong className="text-red-600">Phân hệ Super Admin</strong>
              </span>
              <style>{`
                @keyframes marquee {
                  from { transform: translateX(100%); }
                  to { transform: translateX(-100%); }
                }
                .marquee-text {
                  display: inline-block;
                  white-space: nowrap;
                  animation: marquee 20s linear infinite;
                }
              `}</style>
              <div className="mt-1.5 hidden md:flex items-center rounded text-[13px] font-normal w-full max-w-[500px] overflow-hidden relative" style={{ backgroundColor: "#E3F2FD", color: colors.secondaryBlue, padding: "2px 0" }}>
                <div className="absolute left-0 top-0 bottom-0 px-2.5 flex items-center z-10" style={{ backgroundColor: "#E3F2FD" }}>
                  <span className="text-[14px]">🇻🇳</span>
                </div>
                <div className="flex-1 overflow-hidden w-full pl-10 pr-2">
                  <div className="marquee-text">Chào mừng Quản trị viên, chúc bạn một ngày làm việc hiệu quả và thành công.</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* CENTER SECTION */}
          <div className="flex-1 flex justify-center px-4 min-w-0">
            <div className="relative w-full max-w-[400px]">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value.trim() !== "") {
                    setActiveTab("feedbacks");
                  }
                }}
                placeholder="Tìm kiếm mã phản ánh, nội dung, khu vực..." 
                className="w-full h-10 pl-10 pr-4 rounded-[4px] border text-sm focus:outline-none focus:ring-1 bg-slate-50 transition-all"
                style={{ borderColor: colors.border }}
              />
              <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
            </div>
          </div>

          {/* RIGHT SECTION */}
          <div className="flex items-center justify-end gap-5 shrink-0 relative">
            <div className="text-[13px] font-medium text-right leading-tight hidden lg:block whitespace-nowrap" style={{ color: colors.textSecondary }}>
              <div className="text-[14px]">{currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
              <div>{currentTime.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
            </div>
            
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => {
                  setNotifOpen(!notifOpen);
                  setUserOpen(false);
                }}
                className="relative p-2 rounded hover:bg-slate-50 transition-colors shrink-0" 
                style={{ color: colors.primaryNavy }}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full border border-white animate-pulse" style={{ backgroundColor: colors.criticalRed }}></span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-[320px] bg-white border border-[#E4EAF2] rounded-xl shadow-lg py-2.5 z-50">
                  <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-700">
                      {locale === "vi" ? "Thông báo mới" : "New Notifications"}
                    </span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[11px] text-[#0B4FC4] hover:underline font-bold"
                      >
                        {locale === "vi" ? "Đọc tất cả" : "Mark all read"}
                      </button>
                    )}
                  </div>
                  <div className="max-h-[240px] overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400">
                        {locale === "vi" ? "Không có thông báo mới" : "No new notifications"}
                      </div>
                    ) : (
                      notifications.slice(0, 5).map((item) => (
                        <button
                          key={item.id}
                          onClick={() =>
                            handleNotifClick(item.id, item.feedbackId ?? item.referenceId)
                          }
                          className={`w-full text-left p-3 flex flex-col transition-colors hover:bg-slate-100 ${
                            item.isRead ? "opacity-75" : "bg-blue-100 hover:bg-blue-200/80"
                          }`}
                        >
                          <span className="text-xs font-bold text-slate-800 leading-snug">
                            {translateNotificationTitle(item.title, item.type, locale)}
                          </span>
                          <span className="text-[10px] text-slate-500 mt-1 leading-snug">
                            {highlightNotificationContent(item.content, item.type, locale)}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center pl-5 border-l shrink-0 relative" style={{ borderColor: colors.border }} ref={userRef}>
              <div className="mr-3 text-right hidden sm:block">
                <div className="text-[12px] font-bold text-slate-800 leading-tight">{user?.name || "Super Admin"}</div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Quản trị viên</div>
              </div>
              <button 
                onClick={() => {
                  setUserOpen(!userOpen);
                  setNotifOpen(false);
                }}
                className="relative w-[48px] h-[34px] rounded overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.1)] border border-black/5 cursor-pointer hover:shadow-md transition-all waving-flag-container" 
                title="Tài khoản & Thiết lập"
              >
                <div className="relative w-full h-full scale-[1.15]">
                  <svg viewBox="0 0 300 200" className="w-full h-full">
                    <rect width="300" height="200" fill="#DA251D"/>
                    <g transform="translate(150, 100) scale(60)">
                      <polygon points="0,-1 0.2245,-0.309 0.951,-0.309 0.363,0.118 0.587,0.809 0,0.382 -0.587,0.809 -0.363,0.118 -0.951,-0.309 -0.2245,-0.309" fill="#FFFF00"/>
                    </g>
                  </svg>
                  <div className="absolute inset-0 wind-ripple mix-blend-overlay"></div>
                </div>
                <style>{`
                  @keyframes flag-wave {
                    0%   { transform: perspective(400px) rotateY(-10deg) rotateX(2deg) scaleY(1); }
                    30%  { transform: perspective(400px) rotateY(5deg) rotateX(-1deg) scaleY(1.05); }
                    60%  { transform: perspective(400px) rotateY(-5deg) rotateX(3deg) scaleY(0.95); }
                    100% { transform: perspective(400px) rotateY(-10deg) rotateX(2deg) scaleY(1); }
                  }
                  @keyframes wind-ripple-anim {
                    0% { background-position: 200% 0; opacity: 0.2; }
                    50% { opacity: 0.6; }
                    100% { background-position: -200% 0; opacity: 0.2; }
                  }
                  .waving-flag-container {
                    animation: flag-wave 1.5s ease-in-out infinite;
                    transform-origin: left center;
                  }
                  .wind-ripple {
                    background: linear-gradient(
                      90deg, 
                      rgba(0,0,0,0) 0%, 
                      rgba(255,255,255,0.4) 25%, 
                      rgba(0,0,0,0.4) 50%, 
                      rgba(255,255,255,0.4) 75%, 
                      rgba(0,0,0,0) 100%
                    );
                    background-size: 200% 100%;
                    animation: wind-ripple-anim 1.5s linear infinite;
                    pointer-events: none;
                  }
                `}</style>
              </button>

              {userOpen && (
                <div className="absolute top-[120%] right-0 w-60 bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-slate-100 py-2 z-50">
                  <div className="px-4 py-3 border-b border-slate-50 mb-1 bg-slate-50/50">
                    <p className="text-[14px] font-bold text-slate-800 leading-tight">{user?.name || "Super Admin"}</p>
                    <p className="text-[11px] font-semibold text-blue-600 mt-1 uppercase tracking-wide truncate">
                      Quản trị viên hệ thống
                    </p>
                  </div>
                  <Link 
                    to="/profile"
                    onClick={() => setUserOpen(false)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <Settings size={16} />
                    Cấu hình tài khoản
                  </Link>
                  <div className="h-px bg-slate-100 my-1"></div>
                  <button 
                    onClick={() => void handleLogout()}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={16} />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* 3. MAIN DASHBOARD CONTENT */}
        <main
          className={`flex-1 overflow-y-auto bg-[#F5F7FA] relative transition-all duration-300 ${fullscreen ? "p-2" : "p-6 md:p-8"}`}
        >
          <div className={`${fullscreen ? "max-w-none" : "max-w-[1600px] mx-auto"}`}>
            {/* Loading State */}
            {(feedbacksLoading || kpiLoading) && activeTab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-2xl" />
                  ))}
                </div>
                <Skeleton className="h-96 rounded-2xl" />
              </div>
            )}

            {/* Content */}
            {!(feedbacksLoading || kpiLoading) && (
              <>
                {activeTab === "overview" && <OverviewPage />}
                {activeTab === "feedbacks" && <FeedbacksPage />}
                {activeTab === "reports" && <ReportsPage />}
                {activeTab === "users" && <UsersPage />}
                {activeTab === "news" && <NewsManagement />}
                {activeTab === "ai_stats" && <AiDashboardPage />}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
