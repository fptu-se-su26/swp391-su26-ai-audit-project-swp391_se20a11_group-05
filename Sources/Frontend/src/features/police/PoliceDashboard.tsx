import { lazy, Suspense, useState, useEffect, useRef, useMemo } from "react";
import { useI18n } from "@/lib/i18n";
import {
  useFeedbacks,
  useNotifications,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useNotificationUnreadCount,
  useHotspots,
} from "@/hooks";
import { useAuth } from "@/lib/auth";
import { getLoginPathForRole } from "@/lib/roles";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Menu,
  X,
  Bell,
  LogOut,
  User,
  ChevronDown,
  Search,
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Building2,
  Leaf,
  Shield,
  Flame,
  Construction,
  Car,
  RefreshCw,
  ChevronLeft,
  Settings,
  MoreVertical,
  Activity,
  BarChart3,
  Sliders,
  CheckCircle,
  Plus,
  Grid,
} from "lucide-react";
import emblemUrl from "@/assets/police-emblem.png";
import logoImg from "@/assets/logo.png";
import { toast } from "sonner";
import { authApi, type NotificationResponse, type FeedbackResponse } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

const CivicMap = lazy(() =>
  import("@/components/site/CivicMap").then((m) => ({ default: m.CivicMap })),
);

const HeatmapMap = lazy(() =>
  import("@/components/site/HeatmapMap").then((m) => ({ default: m.HeatmapMap })),
);

// Date formatting helper
function formatDate(dateStr: string, includeTime = true): string {
  const d = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, "0");
  const datePart = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  if (!includeTime) return datePart;
  return `${datePart} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Deadline formatter (3 days after creation)
function getDeadlineDate(dateStr: string): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + 3);
  return formatDate(d.toISOString(), false);
}

// Map whatever the backend categoryName is to our standard categories
const mapCategoryName = (name: string | null | undefined): string => {
  if (!name) return "Hạ tầng đô thị";
  const n = name.toLowerCase();
  if (n.includes("giao thông") || n.includes("traffic") || n.includes("giao thong")) {
    return "Giao thông";
  }
  if (n.includes("môi trường") || n.includes("environment") || n.includes("moi truong") || n.includes("rác")) {
    return "Môi trường";
  }
  if (n.includes("an ninh") || n.includes("security") || n.includes("safety") || n.includes("trật tự") || n.includes("pháp") || n.includes("công an")) {
    return "An ninh trật tự";
  }
  if (n.includes("xây dựng") || n.includes("construction") || n.includes("xay dung")) {
    return "Xây dựng";
  }
  if (n.includes("phòng cháy") || n.includes("chữa cháy") || n.includes("fire")) {
    return "Phòng cháy chữa cháy";
  }
  return "Hạ tầng đô thị";
};

export function PoliceDashboard() {
  const { locale, t } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();

  // Controls for sidebar and header dropdowns
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Click outside handler for dropdowns
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

  // Fetch real data
  const { data: feedbacksPage, isLoading: feedbacksLoading, refetch } = useFeedbacks(0, 200, {
    keyword: debouncedSearch,
  });
  const { data: hotspots } = useHotspots();
  const { data: notifications = [], isLoading: notifLoading } = useNotifications();
  const { data: unreadCountData } = useNotificationUnreadCount(!!user);
  const markRead = useMarkNotificationReadMutation();
  const markAllRead = useMarkAllNotificationsReadMutation();

  const unreadCount = unreadCountData ?? notifications.filter((n) => !n.isRead).length;
  const feedbacks = feedbacksPage?.content ?? [];

  // Sync stats dynamically from backend reports list
  const totalCount = feedbacks.length;
  const pendingCount = feedbacks.filter((f) => f.status === "PENDING").length;
  const inProgressCount = feedbacks.filter(
    (f) => f.status === "ASSIGNED" || f.status === "IN_PROGRESS" || f.status === "WAITING_INFO"
  ).length;
  const resolvedCount = feedbacks.filter((f) => f.status === "RESOLVED").length;
  const overdueCount = feedbacks.filter((f) => {
    const isNotResolved = f.status !== "RESOLVED" && f.status !== "REJECTED";
    const diffTime = Math.abs(new Date().getTime() - new Date(f.createdAt).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return isNotResolved && diffDays > 3;
  }).length;

  // Trend computations
  const getKpiTrend = (statusType: "total" | "pending" | "inProgress" | "resolved" | "overdue") => {
    let filterFn = (f: FeedbackResponse) => true;
    if (statusType === "pending") {
      filterFn = (f: FeedbackResponse) => f.status === "PENDING";
    } else if (statusType === "inProgress") {
      filterFn = (f: FeedbackResponse) =>
        f.status === "ASSIGNED" || f.status === "IN_PROGRESS" || f.status === "WAITING_INFO";
    } else if (statusType === "resolved") {
      filterFn = (f: FeedbackResponse) => f.status === "RESOLVED";
    } else if (statusType === "overdue") {
      filterFn = (f: FeedbackResponse) => {
        const isNotResolved = f.status !== "RESOLVED" && f.status !== "REJECTED";
        const diffTime = Math.abs(new Date().getTime() - new Date(f.createdAt).getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return isNotResolved && diffDays > 3;
      };
    }

    const now = new Date().getTime();
    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    const sevenDaysAgo = now - 7 * MS_PER_DAY;
    const fourteenDaysAgo = now - 14 * MS_PER_DAY;

    const currentPeriod = feedbacks.filter(
      (f) => filterFn(f) && new Date(f.createdAt).getTime() >= sevenDaysAgo
    );
    const previousPeriod = feedbacks.filter(
      (f) =>
        filterFn(f) &&
        new Date(f.createdAt).getTime() >= fourteenDaysAgo &&
        new Date(f.createdAt).getTime() < sevenDaysAgo
    );

    const currentC = currentPeriod.length;
    const previousC = previousPeriod.length;

    if (previousC === 0) {
      if (currentC === 0) return { text: "0,0%", isUp: true, color: "text-slate-400" };
      return {
        text: "100,0%",
        isUp: true,
        color: statusType === "resolved" ? "text-green-600" : "text-red-500",
      };
    }

    const diff = currentC - previousC;
    const pct = ((diff / previousC) * 100).toFixed(1).replace(".", ",");

    let color = "text-green-600";
    if (diff > 0) {
      if (statusType === "overdue" || statusType === "pending") {
        color = "text-red-500";
      }
    } else if (diff < 0) {
      if (statusType === "overdue" || statusType === "pending") {
        color = "text-green-600";
      } else {
        color = "text-red-500";
      }
    } else {
      color = "text-slate-400";
    }

    return {
      text: `${Math.abs(Number((diff / previousC) * 100)).toFixed(1).replace(".", ",")}%`,
      isUp: diff >= 0,
      color,
    };
  };

  const totalTrend = getKpiTrend("total");
  const pendingTrend = getKpiTrend("pending");
  const inProgressTrend = getKpiTrend("inProgress");
  const resolvedTrend = getKpiTrend("resolved");
  const overdueTrend = getKpiTrend("overdue");

  // Category chart stats calculation
  const categoryStats = useMemo(() => {
    const categoriesList = [
      { name: "Giao thông", key: "TRAFFIC", icon: Car, color: "bg-[#0b5ed7]" },
      { name: "Hạ tầng đô thị", key: "URBAN_INFRASTRUCTURE", icon: Building2, color: "bg-[#0dcaf0]" },
      { name: "Môi trường", key: "ENVIRONMENT", icon: Leaf, color: "bg-[#198754]" },
      { name: "An ninh trật tự", key: "PUBLIC_SECURITY", icon: Shield, color: "bg-[#6f42c1]" },
      { name: "Xây dựng", key: "CONSTRUCTION", icon: Construction, color: "bg-[#fd7e14]" },
      { name: "Phòng cháy chữa cháy", key: "FIRE_SAFETY", icon: Flame, color: "bg-[#dc3545]" },
    ];

    const counts: Record<string, number> = {
      TRAFFIC: 0,
      URBAN_INFRASTRUCTURE: 0,
      ENVIRONMENT: 0,
      PUBLIC_SECURITY: 0,
      CONSTRUCTION: 0,
      FIRE_SAFETY: 0,
    };

    feedbacks.forEach((fb) => {
      const name = fb.categoryName || fb.category || "";
      const n = name.toLowerCase();
      if (n.includes("giao thông") || n.includes("traffic") || n.includes("giao thong")) {
        counts["TRAFFIC"]++;
      } else if (n.includes("môi trường") || n.includes("environment") || n.includes("moi truong") || n.includes("rác")) {
        counts["ENVIRONMENT"]++;
      } else if (
        n.includes("an ninh") ||
        n.includes("security") ||
        n.includes("safety") ||
        n.includes("trật tự") ||
        n.includes("pháp") ||
        n.includes("công an")
      ) {
        counts["PUBLIC_SECURITY"]++;
      } else if (n.includes("xây dựng") || n.includes("construction") || n.includes("xay dung")) {
        counts["CONSTRUCTION"]++;
      } else if (n.includes("phòng cháy") || n.includes("chữa cháy") || n.includes("fire")) {
        counts["FIRE_SAFETY"]++;
      } else {
        counts["URBAN_INFRASTRUCTURE"]++;
      }
    });

    const total = feedbacks.length || 1;

    return categoriesList.map((c) => {
      const count = counts[c.key] || 0;
      const percentage = (count / total) * 100;
      return {
        ...c,
        count,
        percentage: percentage.toFixed(1).replace(".", ","),
        rawPercentage: percentage,
      };
    });
  }, [feedbacks]);

  // High-priority reports list filtering (unresolved, sorted by age / overdue)
  const priorityReports = useMemo(() => {
    return feedbacks
      .filter((fb) => fb.status !== "RESOLVED" && fb.status !== "REJECTED")
      .map((fb) => {
        const diffTime = Math.abs(new Date().getTime() - new Date(fb.createdAt).getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return {
          ...fb,
          diffDays,
        };
      })
      .sort((a, b) => b.diffDays - a.diffDays)
      .slice(0, 5);
  }, [feedbacks]);

  // Map markers mapping
  const mapMarkers = useMemo(() => {
    return feedbacks
      .filter((f) => f.latitude !== null && f.longitude !== null)
      .map((f) => {
        let markerStatus: "pending" | "inProgress" | "resolved" | "urgent" = "pending";
        const isNotResolved = f.status !== "RESOLVED" && f.status !== "REJECTED";
        const diffTime = Math.abs(new Date().getTime() - new Date(f.createdAt).getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (f.status === "RESOLVED") {
          markerStatus = "resolved";
        } else if (isNotResolved && diffDays > 3) {
          markerStatus = "urgent";
        } else if (
          f.status === "ASSIGNED" ||
          f.status === "IN_PROGRESS" ||
          f.status === "WAITING_INFO"
        ) {
          markerStatus = "inProgress";
        }

        return {
          position: [f.latitude!, f.longitude!] as [number, number],
          title: f.title,
          description: f.description,
          status: markerStatus,
        };
      });
  }, [feedbacks]);

  const mapCenter = useMemo<[number, number]>(() => {
    if (mapMarkers.length > 0) {
      return mapMarkers[0].position;
    }
    return [16.0544, 108.2022]; // Da Nang center
  }, [mapMarkers]);

  // Handlers for notifications
  const handleMarkAllRead = async () => {
    try {
      await markAllRead.mutateAsync();
      toast.success(locale === "vi" ? "Đã đọc tất cả thông báo" : "All notifications marked read");
    } catch {
      toast.error(locale === "vi" ? "Thao tác thất bại" : "Action failed");
    }
  };

  const handleNotifClick = async (item: NotificationResponse) => {
    setNotifOpen(false);
    try {
      if (!item.isRead) {
        await markRead.mutateAsync(item.id);
      }
      const feedbackId = item.feedbackId ?? item.referenceId;
      if (feedbackId) {
        navigate({ to: "/my-reports/$id", params: { id: String(feedbackId) } });
      }
    } catch {}
  };

  const handleLogout = async () => {
    const loginPath = getLoginPathForRole(user?.role);
    try {
      await authApi.logout().catch(() => {});
    } catch {}
    logout();
    queryClient.clear();
    navigate({ to: loginPath });
  };

  const menuItems = [
    { name: "Tổng quan", path: "/police", icon: Grid, active: true },
    { name: "Phản ánh", path: "/my-reports", icon: FileText },
    { name: "Theo dõi xử lý", path: "/my-reports", icon: Activity },
    { name: "Báo cáo", path: "/police", icon: BarChart3 },
    { name: "Cấu hình", path: "/profile", icon: Sliders },
  ];

  return (
    <div className="min-h-screen bg-[#F4F7FA] text-[#1E293B] font-sans antialiased flex">
      {/* ─── 1. FIXED LEFT SIDEBAR ─── */}
      <aside
        className={`bg-gradient-to-b from-[#0F2042] to-[#0A1630] text-white flex flex-col z-40 transition-all duration-300 fixed inset-y-0 left-0 ${
          sidebarCollapsed ? "w-[76px]" : "w-[240px]"
        } ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        {/* Emblem & Ward Title */}
        <div className="p-5 flex flex-col items-center border-b border-white/10 shrink-0">
          <img
            src={emblemUrl}
            alt="Huy hiệu Công an nhân dân"
            className={`transition-all duration-300 object-contain ${
              sidebarCollapsed ? "w-10 h-10" : "w-16 h-16"
            }`}
          />
          {!sidebarCollapsed && (
            <div className="mt-3 text-center">
              <span className="font-extrabold text-sm tracking-wider uppercase block text-amber-400">
                CÔNG AN PHƯỜNG
              </span>
              <span className="font-extrabold text-base tracking-widest uppercase block text-white mt-0.5">
                HẢI CHÂU 1
              </span>
            </div>
          )}
        </div>

        {/* Navigation items */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <Link
                key={idx}
                to={item.path as any}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all ${
                  item.active
                    ? "bg-[#0F5BD8] text-white shadow-lg"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon size={18} className="shrink-0" />
                {!sidebarCollapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse button at bottom */}
        <div className="p-4 border-t border-white/10 shrink-0">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-slate-300 hover:text-white transition cursor-pointer"
          >
            <ChevronLeft
              size={16}
              className={`transform transition-transform ${sidebarCollapsed ? "rotate-180" : ""}`}
            />
            {!sidebarCollapsed && <span>Thu gọn</span>}
          </button>
        </div>
      </aside>

      {/* Drawer Overlay for Mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/40 z-30 md:hidden"
        />
      )}

      {/* ─── MAIN WRAPPER ─── */}
      <div
        className={`flex-1 flex flex-col min-w-0 min-h-screen transition-all duration-300 ${
          sidebarCollapsed ? "md:pl-[76px]" : "md:pl-[240px]"
        }`}
      >
        {/* ─── 2. TOP WHITE HEADER ─── */}
        <header className="h-[76px] bg-white border-b border-[#E4EAF2] flex items-center justify-between px-6 sticky top-0 z-35 shadow-sm shrink-0">
          {/* Title & Hamburger */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden text-slate-500 hover:text-[#0F5BD8] p-2 rounded-lg border border-slate-200 bg-slate-50"
              aria-label="Toggle menu"
            >
              <Menu size={20} />
            </button>
            <h2 className="text-xl font-extrabold text-[#0B2545] font-sans">Tổng quan</h2>
          </div>

          {/* Search bar */}
          <div className="hidden md:flex items-center relative w-96">
            <input
              type="text"
              placeholder="Tìm kiếm phản ánh, mã phản ánh, địa điểm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-4 pr-10 rounded-xl border border-[#E4EAF2] text-sm focus:border-[#0F5BD8] focus:ring-1 focus:ring-[#0F5BD8] outline-none bg-slate-50/50"
            />
            <Search size={16} className="absolute right-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Controls: Bell & Profile */}
          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => {
                  setNotifOpen(!notifOpen);
                  setUserOpen(false);
                }}
                className="relative p-2 text-slate-500 hover:text-[#0F5BD8] hover:bg-slate-50 rounded-full transition flex items-center justify-center min-w-[40px] min-h-[40px] border border-[#E4EAF2] cursor-pointer"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-[18px] h-[18px] bg-[#dc3545] text-white text-[10px] font-bold rounded-full flex items-center justify-center border border-white font-sans">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown notification panel */}
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-[340px] bg-white border border-[#E4EAF2] rounded-xl shadow-xl py-3 z-50 animate-fade-in">
                  <div className="flex items-center justify-between px-4 pb-2 border-b border-[#E4EAF2]">
                    <span className="text-xs font-bold text-[#0B2545]">Thông báo mới</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[11px] text-[#0F5BD8] hover:underline font-bold"
                      >
                        Đánh dấu đã đọc
                      </button>
                    )}
                  </div>
                  <div className="max-h-[280px] overflow-y-auto divide-y divide-[#E4EAF2]">
                    {notifLoading ? (
                      <div className="p-4 space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex gap-3 animate-pulse">
                            <div className="w-8 h-8 bg-slate-100 rounded-full shrink-0" />
                            <div className="flex-1 space-y-2">
                              <div className="h-3 bg-slate-100 rounded w-1/3" />
                              <div className="h-2.5 bg-slate-100 rounded w-4/5" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400">Không có thông báo mới</div>
                    ) : (
                      notifications.slice(0, 5).map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleNotifClick(item)}
                          className={`w-full text-left p-3.5 flex gap-3 transition-colors hover:bg-slate-50 ${
                            item.isRead ? "opacity-70" : "bg-[#EFF6FF]"
                          }`}
                        >
                          <div className="w-8 h-8 rounded-full bg-[#0F5BD8]/10 text-[#0F5BD8] flex items-center justify-center shrink-0">
                            <Bell size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-bold text-slate-800 leading-snug block">
                              {item.title}
                            </span>
                            <span className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed block">
                              {item.content}
                            </span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                  <div className="pt-2 text-center border-t border-[#E4EAF2]">
                    <Link
                      to="/notifications"
                      onClick={() => setNotifOpen(false)}
                      className="text-xs font-bold text-[#0F5BD8] hover:underline inline-block py-1"
                    >
                      Xem tất cả thông báo
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative" ref={userRef}>
              <button
                onClick={() => {
                  setUserOpen(!userOpen);
                  setNotifOpen(false);
                }}
                className="flex items-center gap-3 focus:outline-none cursor-pointer text-left pl-2 border-l border-[#E4EAF2]"
              >
                <div className="w-9 h-9 rounded-full bg-slate-100 text-[#0F5BD8] flex items-center justify-center font-bold border border-[#E4EAF2] shrink-0">
                  <User size={18} />
                </div>
                <div className="leading-tight hidden sm:block">
                  <div className="text-xs font-bold text-[#0B2545] flex items-center gap-1.5">
                    {user?.name || "Thượng úy Nguyễn Văn An"}
                    <ChevronDown size={14} className="text-slate-400" />
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mt-0.5">
                    {user?.org || "Admin công an phường"}
                  </span>
                </div>
              </button>

              {userOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white border border-[#E4EAF2] rounded-xl shadow-xl py-2 z-50 animate-fade-in">
                  <div className="px-4 py-2 border-b border-slate-100 mb-1">
                    <div className="text-xs font-bold text-slate-700 truncate">
                      {user?.name || "Thượng úy Nguyễn Văn An"}
                    </div>
                    <div className="text-[10px] text-slate-400 font-semibold truncate mt-0.5">
                      {user?.org || "Admin công an phường"}
                    </div>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setUserOpen(false)}
                    className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center gap-2.5"
                  >
                    <Settings size={14} className="text-slate-400" />
                    Cấu hình cá nhân
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 transition flex items-center gap-2.5 cursor-pointer border-t border-slate-100 mt-1"
                  >
                    <LogOut size={14} />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ─── 3. MAIN DASHBOARD CONTENT ─── */}
        <main className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto">
          {/* ─── KPI CARDS ROW ─── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              {
                title: "Tổng phản ánh",
                val: totalCount,
                bg: "bg-[#0b5ed7]",
                trend: totalTrend,
              },
              {
                title: "Chưa xử lý",
                val: pendingCount,
                bg: "bg-[#fd7e14]",
                trend: pendingTrend,
              },
              {
                title: "Đang xử lý",
                val: inProgressCount,
                bg: "bg-[#3b82f6]",
                trend: inProgressTrend,
              },
              {
                title: "Đã xử lý",
                val: resolvedCount,
                bg: "bg-[#198754]",
                trend: resolvedTrend,
              },
              {
                title: "Quá hạn",
                val: overdueCount,
                bg: "bg-[#dc3545]",
                trend: overdueTrend,
              },
            ].map((card, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-[#E4EAF2] p-5 shadow-sm flex flex-col justify-between"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0 ${card.bg}`}
                  >
                    <FileText size={22} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-slate-400 block truncate">
                      {card.title}
                    </span>
                    <h3 className="text-2xl font-extrabold text-[#0B2545] mt-0.5 leading-none">
                      {feedbacksLoading ? (
                        <Skeleton className="h-6 w-12" />
                      ) : (
                        card.val.toLocaleString("vi-VN")
                      )}
                    </h3>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-50 flex items-center">
                  <span className={`text-[11px] font-bold flex items-center gap-0.5 ${card.trend.color}`}>
                    {card.trend.isUp ? "↑" : "↓"} {card.trend.text}
                    <span className="text-slate-400 font-semibold ml-1">so với 7 ngày trước</span>
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* ─── GRID CONTENT ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left Column (65%) */}
            <div className="lg:col-span-8 flex flex-col gap-6">


              {/* Heatmap Card */}
              <div className="bg-white rounded-2xl border border-[#E4EAF2] shadow-sm overflow-hidden flex flex-col min-h-[480px]">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-extrabold text-base text-[#0B2545] flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#dc3545]" />
                    Bản đồ Điểm nóng vi phạm (Heatmap)
                  </h3>
                </div>
                <div className="flex-1 bg-slate-50 relative p-4">
                  <Suspense
                    fallback={
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        Đang tải bản đồ nhiệt...
                      </div>
                    }
                  >
                    <div className="h-[400px] w-full bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                      <HeatmapMap hotspots={hotspots || []} />
                    </div>
                  </Suspense>
                </div>
              </div>

              {/* Priority Reports Table */}
              <div className="bg-white rounded-2xl border border-[#E4EAF2] shadow-sm p-5 flex flex-col justify-between min-h-[360px]">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                    <h3 className="font-extrabold text-base text-[#0B2545]">
                      Phản ánh ưu tiên cao
                    </h3>
                    <Link
                      to="/my-reports"
                      className="text-xs font-bold text-[#0F5BD8] hover:underline"
                    >
                      Xem tất cả
                    </Link>
                  </div>
                  <div className="overflow-x-auto -mx-5">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#E4EAF2] bg-slate-50/50">
                          <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                            Mã phản ánh
                          </th>
                          <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                            Nội dung
                          </th>
                          <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                            Địa điểm
                          </th>
                          <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                            Thời gian
                          </th>
                          <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                            Hạn xử lý
                          </th>
                          <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                            Trạng thái
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E4EAF2]">
                        {feedbacksLoading ? (
                          [1, 2, 3].map((i) => (
                            <tr key={i} className="animate-pulse">
                              <td className="px-5 py-4"><Skeleton className="h-4 w-12" /></td>
                              <td className="px-5 py-4"><Skeleton className="h-4 w-40" /></td>
                              <td className="px-5 py-4"><Skeleton className="h-4 w-32" /></td>
                              <td className="px-5 py-4"><Skeleton className="h-4 w-24" /></td>
                              <td className="px-5 py-4"><Skeleton className="h-4 w-20" /></td>
                              <td className="px-5 py-4"><Skeleton className="h-6 w-16" /></td>
                            </tr>
                          ))
                        ) : priorityReports.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-5 py-8 text-center text-xs text-slate-400">
                              Chưa có phản ánh ưu tiên cao.
                            </td>
                          </tr>
                        ) : (
                          priorityReports.map((row) => (
                            <tr
                              key={row.id}
                              onClick={() =>
                                navigate({ to: "/my-reports/$id", params: { id: String(row.id) } })
                              }
                              className="hover:bg-slate-50 transition-colors cursor-pointer"
                            >
                              <td className="px-5 py-4 text-xs font-bold text-[#0F5BD8]">
                                {row.trackingCode || `PA-${row.id}`}
                              </td>
                              <td className="px-5 py-4 text-xs text-slate-700 font-semibold max-w-[200px] truncate">
                                {row.title}
                              </td>
                              <td className="px-5 py-4 text-xs text-slate-500 truncate max-w-[150px]">
                                {row.addressDetails || row.address || "Chưa xác định"}
                              </td>
                              <td className="px-5 py-4 text-xs text-slate-500">
                                {formatDate(row.createdAt)}
                              </td>
                              <td className="px-5 py-4 text-xs text-slate-500 font-bold">
                                {getDeadlineDate(row.createdAt)}
                              </td>
                              <td className="px-5 py-4">
                                {(() => {
                                  const isNotResolved =
                                    row.status !== "RESOLVED" && row.status !== "REJECTED";
                                  if (isNotResolved && row.diffDays > 3) {
                                    return (
                                      <span className="px-2 py-0.5 text-[10px] font-extrabold rounded bg-red-50 text-red-600 border border-red-100 uppercase">
                                        Quá hạn
                                      </span>
                                    );
                                  }
                                  switch (row.status) {
                                    case "PENDING":
                                      return (
                                        <span className="px-2 py-0.5 text-[10px] font-extrabold rounded bg-orange-50 text-orange-600 border border-orange-100 uppercase">
                                          Chưa xử lý
                                        </span>
                                      );
                                    case "RESOLVED":
                                      return (
                                        <span className="px-2 py-0.5 text-[10px] font-extrabold rounded bg-green-50 text-green-600 border border-green-100 uppercase">
                                          Đã xử lý
                                        </span>
                                      );
                                    default:
                                      return (
                                        <span className="px-2 py-0.5 text-[10px] font-extrabold rounded bg-blue-50 text-blue-600 border border-blue-100 uppercase">
                                          Đang xử lý
                                        </span>
                                      );
                                  }
                                })()}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column (35%) */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              {/* Category Classification Card */}
              <div className="bg-white rounded-2xl border border-[#E4EAF2] shadow-sm p-5 flex flex-col justify-between h-[480px]">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                    <h3 className="font-extrabold text-base text-[#0B2545]">
                      Phân loại phản ánh
                    </h3>
                    <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                      7 ngày qua
                    </span>
                  </div>
                  <div className="space-y-4">
                    {feedbacksLoading ? (
                      [1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="space-y-2">
                          <div className="flex justify-between">
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-3 w-10" />
                          </div>
                          <Skeleton className="h-2 w-full rounded" />
                        </div>
                      ))
                    ) : feedbacks.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400">
                        Chưa có dữ liệu phân loại.
                      </div>
                    ) : (
                      categoryStats.map((cat, idx) => {
                        const Icon = cat.icon;
                        return (
                          <div key={idx} className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2 text-slate-600 font-bold">
                                <Icon size={16} className="text-[#0B2545] shrink-0" />
                                <span>{cat.name}</span>
                              </div>
                              <span className="text-slate-700 font-extrabold">
                                {cat.count}{" "}
                                <span className="text-slate-400 font-semibold">
                                  ({cat.percentage}%)
                                </span>
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div
                                className={`${cat.color} h-full rounded-full transition-all duration-500`}
                                style={{ width: `${cat.rawPercentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Activity Card */}
              <div className="bg-white rounded-2xl border border-[#E4EAF2] shadow-sm p-5 flex flex-col justify-between h-[360px]">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                    <h3 className="font-extrabold text-base text-[#0B2545]">
                      Hoạt động gần đây
                    </h3>
                    <Link
                      to="/notifications"
                      className="text-xs font-bold text-[#0F5BD8] hover:underline"
                    >
                      Xem tất cả
                    </Link>
                  </div>
                  <div className="space-y-4 max-h-[260px] overflow-y-auto pr-1">
                    {notifLoading ? (
                      [1, 2, 3].map((i) => (
                        <div key={i} className="flex gap-3 animate-pulse">
                          <div className="w-8 h-8 bg-slate-100 rounded-full shrink-0" />
                          <div className="flex-1 space-y-2">
                            <div className="h-3 bg-slate-100 rounded w-1/3" />
                            <div className="h-2.5 bg-slate-100 rounded w-4/5" />
                          </div>
                        </div>
                      ))
                    ) : notifications.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400">
                        Chưa có hoạt động gần đây.
                      </div>
                    ) : (
                      notifications.slice(0, 4).map((activity) => {
                        let iconBg = "bg-blue-50 text-blue-600 border-blue-100";
                        let Icon = RefreshCw;
                        if (activity.type === "FEEDBACK_SUBMITTED") {
                          iconBg = "bg-purple-50 text-purple-600 border-purple-100";
                          Icon = Plus;
                        } else if (
                          activity.type === "FEEDBACK_COMPLETED" ||
                          activity.type === "RESOLVED" ||
                          activity.type === "FEEDBACK_CLOSED"
                        ) {
                          iconBg = "bg-green-50 text-green-600 border-green-100";
                          Icon = CheckCircle2;
                        } else if (activity.type === "FEEDBACK_ASSIGNED") {
                          iconBg = "bg-blue-50 text-blue-600 border-blue-100";
                          Icon = User;
                        }

                        return (
                          <div key={activity.id} className="flex gap-3">
                            <div
                              className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 ${iconBg}`}
                            >
                              <Icon size={14} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-xs font-bold text-slate-800 block truncate">
                                {activity.title}
                              </span>
                              <span className="text-[10px] text-slate-500 mt-0.5 block line-clamp-2 leading-relaxed">
                                {activity.content}
                              </span>
                              <span className="text-[9px] text-slate-400 mt-1 block">
                                {formatDate(activity.createdAt)}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
