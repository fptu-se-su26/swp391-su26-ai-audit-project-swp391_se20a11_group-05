import { lazy, Suspense, useState, useEffect, useRef, useMemo } from "react";
import { useI18n } from "@/lib/i18n";
import { useQuery } from "@tanstack/react-query";
import { useFeedbacks, useNotifications, useMarkNotificationReadMutation } from "@/hooks";
import { useFeedbackNotification } from "@/hooks/use-notification";
import { useAuth } from "@/lib/auth";
import { analyticsApi, type KpiData, type WardPerformance, type MonthlyTrend } from "@/lib/api";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  kpis as mockKpis,
  wardPerformance as mockWardPerf,
  reports as mockReports,
} from "@/lib/mock-data";
import { Skeleton } from "@/components/ui/skeleton";
import { mapStatus } from "@/lib/status";
import logoImg from "@/assets/logo.png";
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
  if (n.includes("môi trường") || n.includes("environment") || n.includes("moi truong") || n.includes("rác")) {
    return "Môi trường";
  }
  if (n.includes("an ninh") || n.includes("security") || n.includes("safety") || n.includes("trật tự") || n.includes("pháp")) {
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
  useFeedbackNotification(); // Real-time WebSockets update listener
  const { user, logout } = useAuth();

  // State controls for headers/sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter states
  const [selectedWard, setSelectedWard] = useState<string | undefined>(undefined);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(undefined);

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

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

  // Fetch real backend data
  const { data: feedbacksPage, isLoading: feedbacksLoading, isError: feedbacksError, refetch: refetchFeedbacks } = useFeedbacks(0, 300);
  const { data: analyticsKpi, isLoading: kpiLoading, isError: kpiError } = useQuery<KpiData>({
    queryKey: ["analytics", "kpi"],
    queryFn: () => analyticsApi.kpi(),
    staleTime: 30_000,
  });
  const { data: wardPerf, isLoading: wardLoading } = useQuery<WardPerformance[]>({
    queryKey: ["analytics", "ward-performance"],
    queryFn: () => analyticsApi.wardPerformance(),
    staleTime: 30_000,
  });
  const { data: monthlyTrend } = useQuery<MonthlyTrend[]>({
    queryKey: ["analytics", "monthly-trend"],
    queryFn: () => analyticsApi.monthlyTrend(12),
    staleTime: 30_000,
  });

  const { data: notifications = [] } = useNotifications();
  const markRead = useMarkNotificationReadMutation();
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const feedbacks = feedbacksPage?.content ?? [];
  const hasApiData = feedbacks.length > 0;

  // Sync / derive stats dynamically from real report list
  const totalReportsCount = hasApiData ? feedbacks.length : (analyticsKpi?.total ?? 0);
  const unresolvedCount = feedbacks.filter((f) => f.status !== "RESOLVED" && f.status !== "REJECTED").length;
  const inProgressCount = feedbacks.filter((f) => f.status === "IN_PROGRESS" || f.status === "ASSIGNED" || f.status === "WAITING_INFO").length;
  
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
    { name: "Tổng quan", path: "/city-admin", icon: LayoutDashboard, active: true },
    { name: "Bản đồ nóng", path: "/ward", icon: MapPin },
    { name: "Phản ánh", path: "/my-reports", icon: FileText },
    { name: "Báo cáo", path: "/city-admin", icon: BarChart3 },
    { name: "Người dùng", path: "/profile", icon: Users },
  ];

  // Hotspot location database
  const defaultWards = ["Hải Châu", "Thanh Khê", "Liên Chiểu", "Sơn Trà", "Ngũ Hành Sơn", "Cẩm Lệ", "Hòa Vang"];
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
    const areaMap: Record<string, { name: string; total: number; unresolved: number; overdue: number; categoryCounts: Record<string, number> }> = {};

    defaultWards.forEach((w) => {
      areaMap[w] = { name: w, total: 0, unresolved: 0, overdue: 0, categoryCounts: {} };
    });

    feedbacks.forEach((fb) => {
      // Find ward name from database mapping
      let matchedWard = "Khác";
      for (const w of defaultWards) {
        if (fb.wardName?.toLowerCase().includes(w.toLowerCase()) || fb.addressDetails?.toLowerCase().includes(w.toLowerCase())) {
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
        areaMap[matchedWard].categoryCounts[mappedCat] = (areaMap[matchedWard].categoryCounts[mappedCat] || 0) + 1;
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
    return [...areaHotspots]
      .sort((a, b) => b.unresolved - a.unresolved)
      .slice(0, 5);
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
    return feedbacks
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
          if (fb.wardName?.toLowerCase().includes(w.toLowerCase()) || fb.addressDetails?.toLowerCase().includes(w.toLowerCase())) {
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
      .sort((a, b) => b.diffDays - a.diffDays);
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
      result = result.filter((r) => 
        r.trackingCode.toLowerCase().includes(q) ||
        r.ward.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q)
      );
    }
    return result.slice(0, 5);
  }, [priorityReports, selectedWard, selectedCategory, selectedStatus, searchQuery]);

  const handleMarkAllRead = async () => {
    const unreadItems = notifications.filter((n) => !n.isRead).slice(0, 5);
    if (unreadItems.length === 0) return;
    try {
      await Promise.all(unreadItems.map((item) => markRead.mutateAsync(item.id)));
      toast.success("Đã đánh dấu đọc tất cả thông báo");
    } catch (err) {
      toast.error("Thao tác thất bại");
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

  const resetAllFilters = () => {
    setSelectedWard(undefined);
    setSelectedCategory(undefined);
    setSelectedStatus(undefined);
    setSearchQuery("");
  };

  return (
    <div className="min-h-screen bg-[#F7FAFF] flex text-[#1D2939] font-sans antialiased overflow-x-hidden">
      {/* 1. LEFT BLUE SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-[#0647A5] text-white flex flex-col z-40 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Branding */}
        <div className="p-5 flex items-center gap-3 border-b border-[#053d8e] shrink-0">
          <img
            src={logoImg}
            alt="Đà Nẵng Connect Logo"
            className="w-10 h-10 object-contain shrink-0"
          />
          <div className="flex flex-col leading-none">
            <span className="font-extrabold text-base tracking-tight uppercase font-sans">
              ĐÀ NẴNG
            </span>
            <span className="font-extrabold text-base tracking-tight uppercase font-sans">
              KẾT NỐI
            </span>
            <span className="text-[7.5px] text-[#A6C5F7] font-bold uppercase tracking-wider mt-0.5 leading-tight font-sans">
              NỀN TẢNG PHẢN ÁNH HIỆN TRƯỜNG
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const active = item.active;
            return (
              <Link
                key={index}
                to={item.path as any}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-lg transition-all ${
                  active
                    ? "bg-white text-[#0647A5] shadow-sm font-bold"
                    : "text-[#D0E2FF] hover:bg-[#0753BF] hover:text-white"
                }`}
              >
                <Icon size={18} className="shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom account summary */}
        <div className="p-4 border-t border-[#053d8e] bg-[#053c8c] flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-full bg-[#002B73] border border-blue-400/20 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-sm truncate text-white">Super Admin</span>
            <span className="text-[10px] text-[#A6C5F7] font-medium leading-none mt-0.5">
              Quyền cao nhất
            </span>
          </div>
        </div>
      </aside>

      {/* Drawer Overlay for Mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/40 z-30 md:hidden transition-opacity duration-300"
        />
      )}

      {/* Main Container Wrapper */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0 min-h-screen">
        
        {/* 2. TOP HEADER */}
        <header className="h-16 bg-white border-b border-[#E4EAF2] flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden text-slate-500 hover:text-[#0B4FC4] p-1.5 rounded-lg border border-slate-200 bg-slate-50"
              aria-label="Toggle menu"
            >
              <Menu size={20} />
            </button>
            <h2 className="text-lg font-bold text-[#1D2939] font-sans">Tổng quan</h2>
          </div>

          {/* Search field */}
          <div className="hidden md:flex items-center relative w-96">
            <input
              type="text"
              placeholder="Tìm kiếm phản ánh, khu vực, mã..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-4 pr-10 rounded-lg border border-[#E4EAF2] text-sm focus:border-[#0B4FC4] outline-none bg-slate-50/50"
            />
            <Search size={16} className="absolute right-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* User profile dropdown and notification controls */}
          <div className="flex items-center gap-3">
            
            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => {
                  setNotifOpen(!notifOpen);
                  setUserOpen(false);
                }}
                className="relative p-2 text-slate-500 hover:text-[#0B4FC4] transition rounded-full hover:bg-slate-100 flex items-center justify-center cursor-pointer min-w-[36px] min-h-[36px]"
                aria-label="Thông báo"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-[16px] h-[16px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-[320px] bg-white border border-[#E4EAF2] rounded-xl shadow-lg py-2.5 z-50 animate-fade-in">
                  <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-700">Thông báo mới</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[11px] text-[#0B4FC4] hover:underline font-bold"
                      >
                        Đọc tất cả
                      </button>
                    )}
                  </div>
                  <div className="max-h-[240px] overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400">Không có thông báo mới</div>
                    ) : (
                      notifications.slice(0, 5).map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleNotifClick(item.id, item.feedbackId ?? item.referenceId)}
                          className={`w-full text-left p-3 flex flex-col transition-colors hover:bg-slate-50 ${
                            item.isRead ? "opacity-75" : "bg-blue-50/40"
                          }`}
                        >
                          <span className="text-xs font-bold text-slate-800 leading-snug">{item.title}</span>
                          <span className="text-[10px] text-slate-500 mt-1 leading-snug">{item.content}</span>
                        </button>
                      ))
                    )}
                  </div>
                  <div className="pt-2 text-center border-t border-slate-100">
                    <Link
                      to="/notifications"
                      onClick={() => setNotifOpen(false)}
                      className="text-xs font-bold text-[#0B4FC4] hover:underline inline-block py-0.5"
                    >
                      Xem tất cả
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* User Dropdown */}
            <div className="relative" ref={userRef}>
              <button
                onClick={() => {
                  setUserOpen(!userOpen);
                  setNotifOpen(false);
                }}
                className="flex items-center gap-2 focus:outline-none cursor-pointer text-left"
              >
                <div className="w-8.5 h-8.5 rounded-full bg-blue-100 text-[#0B4FC4] flex items-center justify-center font-bold text-sm border border-slate-200">
                  {user?.name ? user.name.charAt(0).toUpperCase() : "S"}
                </div>
                <div className="leading-tight hidden sm:block">
                  <div className="text-xs font-bold text-[#1D2939] flex items-center gap-1">
                    {user?.name || "Super Admin"}
                    <ChevronDown size={14} className="text-slate-400" />
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold">Super Admin</span>
                </div>
              </button>

              {/* User settings menu dropdown */}
              {userOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-[#E4EAF2] rounded-xl shadow-lg py-1.5 z-50 animate-fade-in">
                  <div className="px-4 py-2 border-b border-slate-100 mb-1">
                    <div className="text-xs font-bold text-slate-700 truncate">{user?.name || "Super Admin"}</div>
                    <div className="text-[10px] text-slate-400 font-semibold truncate mt-0.5">super_admin@danang.gov.vn</div>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setUserOpen(false)}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-[#1D2939] hover:bg-slate-50 transition flex items-center gap-2"
                  >
                    <Settings size={14} className="text-slate-400" />
                    Cấu hình tài khoản
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setUserOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50/50 transition flex items-center gap-2 cursor-pointer border-t border-slate-100 mt-1"
                  >
                    <LogOut size={14} />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* 3. MAIN DASHBOARD CONTENT */}
        <main className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto">

          {/* Active filters status indicators if selected */}
          {(selectedWard || selectedCategory || selectedStatus || searchQuery) && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-center justify-between flex-wrap gap-2 animate-fade-in">
              <div className="flex items-center gap-2 text-xs text-[#0B4FC4] font-bold flex-wrap">
                <span>Bộ lọc hiện tại:</span>
                {selectedWard && (
                  <span className="bg-white border border-blue-200 rounded px-2 py-0.5 flex items-center gap-1.5">
                    Khu vực: {selectedWard}
                    <button onClick={() => setSelectedWard(undefined)} className="hover:text-red-500 font-extrabold text-[10px]">×</button>
                  </span>
                )}
                {selectedCategory && (
                  <span className="bg-white border border-blue-200 rounded px-2 py-0.5 flex items-center gap-1.5">
                    Lĩnh vực: {selectedCategory}
                    <button onClick={() => setSelectedCategory(undefined)} className="hover:text-red-500 font-extrabold text-[10px]">×</button>
                  </span>
                )}
                {selectedStatus && (
                  <span className="bg-white border border-blue-200 rounded px-2 py-0.5 flex items-center gap-1.5">
                    Trạng thái: {selectedStatus}
                    <button onClick={() => setSelectedStatus(undefined)} className="hover:text-red-500 font-extrabold text-[10px]">×</button>
                  </span>
                )}
                {searchQuery && (
                  <span className="bg-white border border-blue-200 rounded px-2 py-0.5 flex items-center gap-1.5">
                    Từ khóa: "{searchQuery}"
                    <button onClick={() => setSearchQuery("")} className="hover:text-red-500 font-extrabold text-[10px]">×</button>
                  </span>
                )}
              </div>
              <button
                onClick={resetAllFilters}
                className="text-xs font-bold text-[#0B4FC4] hover:underline flex items-center gap-1"
              >
                <RefreshCw size={12} /> Xóa tất cả bộ lọc
              </button>
            </div>
          )}

          {/* 4. KPI SUMMARY CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* KPI 1: Tổng phản ánh */}
            <button
              onClick={() => setSelectedStatus(undefined)}
              className="card-civic p-5 border-l-4 border-[#0B4FC4] flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all text-left w-full cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-blue-50 text-[#0B4FC4] flex items-center justify-center shrink-0">
                <FileText size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng phản ánh</span>
                <h3 className="text-2xl font-extrabold text-[#1D2939] mt-0.5">
                  {kpiLoading ? <Skeleton className="h-8 w-20" /> : totalReportsCount.toLocaleString("vi-VN")}
                </h3>
                {totalTrend && (
                  <span className={`text-[10px] font-bold ${totalTrend.isUp ? "text-green-600" : "text-red-600"} flex items-center gap-0.5 mt-1`}>
                    {totalTrend.isUp ? "↗" : "↘"} {totalTrend.pct} so với tháng trước
                  </span>
                )}
              </div>
            </button>

            {/* KPI 2: Chưa xử lý */}
            <button
              onClick={() => setSelectedStatus(undefined)}
              className="card-civic p-5 border-l-4 border-orange-500 flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all text-left w-full cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
                <Clock size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Chưa xử lý</span>
                <h3 className="text-2xl font-extrabold text-orange-600 mt-0.5">
                  {feedbacksLoading ? <Skeleton className="h-8 w-20" /> : unresolvedCount.toLocaleString("vi-VN")}
                </h3>
                {totalTrend && (
                  <span className={`text-[10px] font-bold ${totalTrend.isUp ? "text-green-600" : "text-red-600"} flex items-center gap-0.5 mt-1`}>
                    {totalTrend.isUp ? "↗" : "↘"} {totalTrend.pct} so với tháng trước
                  </span>
                )}
              </div>
            </button>

            {/* KPI 3: Đang xử lý */}
            <button
              onClick={() => setSelectedStatus("Đang xử lý")}
              className="card-civic p-5 border-l-4 border-blue-500 flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all text-left w-full cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                <RefreshCw size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Đang xử lý</span>
                <h3 className="text-2xl font-extrabold text-blue-600 mt-0.5">
                  {feedbacksLoading ? <Skeleton className="h-8 w-20" /> : inProgressCount.toLocaleString("vi-VN")}
                </h3>
                {resolvedTrend && (
                  <span className={`text-[10px] font-bold ${resolvedTrend.isUp ? "text-green-600" : "text-red-600"} flex items-center gap-0.5 mt-1`}>
                    {resolvedTrend.isUp ? "↗" : "↘"} {resolvedTrend.pct} so với tháng trước
                  </span>
                )}
              </div>
            </button>

            {/* KPI 4: Quá hạn */}
            <button
              onClick={() => setSelectedStatus("Quá hạn")}
              className="card-civic p-5 border-l-4 border-red-500 flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all text-left w-full cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                <AlertCircle size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quá hạn</span>
                <h3 className="text-2xl font-extrabold text-red-600 mt-0.5">
                  {feedbacksLoading ? <Skeleton className="h-8 w-20" /> : overdueCount.toLocaleString("vi-VN")}
                </h3>
                {resolvedTrend && (
                  <span className={`text-[10px] font-bold ${resolvedTrend.isUp ? "text-red-600" : "text-green-600"} flex items-center gap-0.5 mt-1`}>
                    {resolvedTrend.isUp ? "↗" : "↘"} {resolvedTrend.pct} so với tháng trước
                  </span>
                )}
              </div>
            </button>
          </div>

          {/* 5. MAIN TWO-COLUMN HOTSPOT & RANKING AREA */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left: Hotspot Map */}
            <div className="lg:col-span-7 card-civic overflow-hidden flex flex-col min-h-[440px]">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="font-heading text-lg font-bold text-[#0B4FC4]">
                  Bản đồ điểm nóng theo khu vực
                </h3>
              </div>
              <div className="flex-1 relative bg-slate-100 min-h-[300px]">
                <Suspense fallback={<div className="w-full h-full bg-slate-100 animate-pulse flex items-center justify-center text-slate-400">Đang tải bản đồ...</div>}>
                  {feedbacksLoading ? (
                    <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">Đang đồng bộ dữ liệu...</div>
                  ) : (
                    <SuperAdminMap
                      hotspots={areaHotspots}
                      onSelectWard={(w) => setSelectedWard(w === selectedWard ? undefined : w)}
                      selectedWard={selectedWard}
                    />
                  )}
                </Suspense>
              </div>
              {/* Legend */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex flex-col gap-1.5 w-full">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Mức độ điểm nóng (chưa xử lý)
                  </span>
                  <div className="flex items-center gap-3 w-full">
                    <span className="text-xs font-semibold text-slate-600">Thấp</span>
                    <div className="flex-1 h-3 rounded-full bg-gradient-to-r from-[#FCD34D] via-[#F97316] to-[#EF4444]" />
                    <span className="text-xs font-semibold text-slate-600">Cao</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Priority Area Ranking */}
            <div className="lg:col-span-5 card-civic p-5 flex flex-col justify-between">
              <div>
                <h3 className="font-heading text-lg font-bold text-[#0B4FC4] border-b border-slate-100 pb-3 mb-4">
                  Khu vực cần ưu tiên
                </h3>
                {feedbacksLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-12 w-full rounded-lg" />
                    ))}
                  </div>
                ) : rankedAreas.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">Chưa có khu vực cần ưu tiên.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100 pb-2">
                          <th className="pb-3 pr-2 w-8">#</th>
                          <th className="pb-3">Khu vực</th>
                          <th className="pb-3 text-center">Tổng số</th>
                          <th className="pb-3 text-center">Chưa xử lý</th>
                          <th className="pb-3 text-right">Quá hạn (%)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {rankedAreas.map((area, idx) => {
                          const isSelected = selectedWard === area.name;
                          // Custom rank badges
                          let rankBadge = "bg-slate-100 text-slate-600";
                          if (idx === 0) rankBadge = "bg-red-100 text-red-600 font-bold";
                          else if (idx === 1) rankBadge = "bg-orange-100 text-orange-600 font-bold";
                          else if (idx === 2) rankBadge = "bg-amber-100 text-amber-600 font-bold";

                          return (
                            <tr
                              key={area.name}
                              onClick={() => setSelectedWard(isSelected ? undefined : area.name)}
                              className={`group hover:bg-slate-50/60 transition-colors cursor-pointer ${
                                isSelected ? "bg-blue-50/80 hover:bg-blue-50" : ""
                              }`}
                            >
                              <td className="py-3.5 pr-2">
                                <span className={`w-5.5 h-5.5 rounded-full flex items-center justify-center text-xs ${rankBadge}`}>
                                  {idx + 1}
                                </span>
                              </td>
                              <td className="py-3.5 font-bold text-slate-800 text-xs group-hover:text-[#0B4FC4] transition-colors">
                                {area.name}
                              </td>
                              <td className="py-3.5 text-center text-xs font-semibold text-slate-600">
                                {area.total}
                              </td>
                              <td className="py-3.5 text-center">
                                <span className="px-2.5 py-0.5 bg-red-100 text-red-600 rounded-full text-xs font-bold">
                                  {area.unresolved}
                                </span>
                              </td>
                              <td className="py-3.5 text-right">
                                <div className="inline-flex flex-col items-end w-20">
                                  <span className="text-xs font-bold text-slate-700">{area.unresolvedPct.toFixed(1)}%</span>
                                  <div className="w-full h-1 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                                    <div
                                      className="h-full bg-red-500 rounded-full"
                                      style={{ width: `${area.unresolvedPct}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <button
                onClick={() => setSelectedWard(undefined)}
                className="w-full text-center text-xs font-bold text-[#0B4FC4] hover:underline pt-4 border-t border-slate-100 mt-4 block"
              >
                Xem tất cả khu vực &rarr;
              </button>
            </div>
          </div>

          {/* 6. LOWER CONTENT GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left: Category Unresolved reports */}
            <div className="lg:col-span-5 card-civic p-5 flex flex-col justify-between">
              <div>
                <h3 className="font-heading text-lg font-bold text-[#0B4FC4] border-b border-slate-100 pb-3 mb-4">
                  Phản ánh chưa xử lý theo lĩnh vực
                </h3>
                {feedbacksLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <Skeleton key={i} className="h-10 w-full rounded-lg" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4.5">
                    {categoryCounts.map((cat) => {
                      const isSelected = selectedCategory === cat.name;
                      const percentage = (cat.count / maxCategoryCount) * 100;

                      return (
                        <button
                          key={cat.name}
                          onClick={() => setSelectedCategory(isSelected ? undefined : cat.name)}
                          className={`w-full text-left group flex items-center gap-3.5 p-1.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer ${
                            isSelected ? "bg-blue-50 hover:bg-blue-50" : ""
                          }`}
                        >
                          <div className={`w-8.5 h-8.5 rounded-lg flex items-center justify-center shrink-0 ${
                            isSelected ? "bg-[#0B4FC4] text-white" : "bg-blue-50 text-[#0B4FC4] group-hover:bg-[#0B4FC4] group-hover:text-white"
                          } transition-all duration-200`}>
                            {getCategoryIcon(cat.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-bold text-slate-700 truncate group-hover:text-[#0B4FC4] transition-colors">
                                {cat.name}
                              </span>
                              <span className="text-xs font-extrabold text-red-600">
                                {cat.count.toLocaleString("vi-VN")}
                              </span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-600 rounded-full transition-all duration-300"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <button
                onClick={() => setSelectedCategory(undefined)}
                className="w-full text-center text-xs font-bold text-[#0B4FC4] hover:underline pt-4 border-t border-slate-100 mt-4 block"
              >
                Xem chi tiết báo cáo &rarr;
              </button>
            </div>

            {/* Right: High-Priority Report Table */}
            <div className="lg:col-span-7 card-civic p-5 flex flex-col justify-between">
              <div>
                <h3 className="font-heading text-lg font-bold text-[#0B4FC4] border-b border-slate-100 pb-3 mb-4">
                  Phản ánh ưu tiên cao
                </h3>
                {feedbacksLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-12 w-full rounded-lg" />
                    ))}
                  </div>
                ) : filteredPriorityReports.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">Chưa có phản ánh ưu tiên cao.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100 pb-2">
                          <th className="pb-3 pl-1">Mã phản ánh</th>
                          <th className="pb-3">Khu vực</th>
                          <th className="pb-3">Lĩnh vực</th>
                          <th className="pb-3 text-center">Trạng thái</th>
                          <th className="pb-3 text-right">Thời gian quá hạn</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredPriorityReports.map((report) => (
                          <tr
                            key={report.id}
                            onClick={() => navigate({ to: "/my-reports/$id", params: { id: String(report.id) } })}
                            className="group hover:bg-slate-50/60 transition-colors cursor-pointer"
                          >
                            <td className="py-3.5 pl-1 font-mono text-[11px] font-bold text-slate-700 group-hover:text-[#0B4FC4] transition-colors">
                              {report.trackingCode}
                            </td>
                            <td className="py-3.5 text-slate-800 text-xs font-semibold">
                              {report.ward}
                            </td>
                            <td className="py-3.5 text-slate-600 text-xs font-semibold">
                              {report.category}
                            </td>
                            <td className="py-3.5 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide leading-none ${report.badgeColor}`}>
                                {report.status}
                              </span>
                            </td>
                            <td className="py-3.5 text-right font-semibold text-xs text-red-600">
                              {report.overdueTime}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <Link
                to="/my-reports"
                className="w-full text-center text-xs font-bold text-[#0B4FC4] hover:underline pt-4 border-t border-slate-100 mt-4 block"
              >
                Xem tất cả phản ánh ưu tiên &rarr;
              </Link>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
