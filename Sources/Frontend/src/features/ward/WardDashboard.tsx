import { clientOnly } from "@/components/ClientOnly";
import { lazy, Suspense, useState, useEffect, useRef, useMemo } from "react";
import { useI18n } from "@/lib/i18n";
import { getGroupedFeedbackStatus } from "@/lib/status";
import {
  useFeedbacks,
  useNotifications,
  useInfiniteNotifications,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useNotificationUnreadCount,
  useWardStaffStatistics,
} from "@/hooks";
import { useAuth } from "@/lib/auth";
import { useFeedbackNotification } from "@/hooks/use-notification";
import { getLoginPathForRole, Role } from "@/lib/roles";
import { Link, useNavigate } from "@tanstack/react-router";
import { Route } from "@/routes/_auth.ward";
import { FeedbackDetailPageComponent } from "@/routes/_auth.authority.feedback.$feedbackId";
import {
  Menu,
  X,
  Bell,
  LogOut,
  User,
  ChevronDown,
  ChevronLeft,
  FileText,
  AlertCircle,
  Clock,
  CheckCircle2,
  Shield,
  RefreshCw,
  Calendar,
  Sliders,
  Hourglass,
  UserCheck,
  Activity,
  BarChart3,
  Settings,
  Plus,
  ShieldAlert,
  MessageSquare,
} from "lucide-react";
import logoImg from "@/assets/logo.png";
import { toast } from "sonner";
import { authApi, type NotificationResponse, type FeedbackResponse } from "@/lib/api";
import { highlightNotificationContent } from "@/lib/notificationHelper";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { getAdministrativeUnitLabel, getAdministrativeUnitName } from "@/lib/administrativeUnit";
import { WardFeedbackManagementPage } from "./WardFeedbackManagementPage";
import { WardCampaignPage } from "./WardCampaignPage";
import { WardProfileConfigPage } from "./WardProfileConfigPage";
import { WardStatisticsPage } from "./WardStatisticsPage";
import WardBlacklistPage from "./WardBlacklistPage";
import { WardChatDashboardPage } from "./WardChatDashboardPage";
import { WardNotificationsPage } from "./WardNotificationsPage";

const CivicMap = clientOnly(
  () => import("@/components/site/CivicMap").then((m) => ({ default: m.CivicMap })) as any,
) as any;

import { WARD_CENTERS } from "@/lib/geojson";

type WardSection =
  | "overview"
  | "feedback"
  | "campaign"
  | "statistics"
  | "schedule"
  | "config"
  | "blacklist"
  | "chat"
  | "notifications";

// Date formatting helper
function formatDate(dateStr: string, includeTime = true): string {
  const d = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, "0");
  const datePart = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  if (!includeTime) return datePart;
  return `${datePart} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Map whatever the backend categoryName is to our standard categories
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
    n.includes("pháp") ||
    n.includes("công an")
  ) {
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

export function WardDashboard() {
  const { locale } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, logout, login } = useAuth();
  useFeedbackNotification();

  // State controls for sidebar and dropdowns
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const { tab, detailId } = Route.useSearch();
  const activeSection = (
    tab &&
    ([
      "overview",
      "feedback",
      "campaign",
      "statistics",
      "schedule",
      "config",
      "blacklist",
      "chat",
      "notifications",
    ].includes(tab) ||
      tab.startsWith("campaign/"))
      ? tab.startsWith("campaign/")
        ? "campaign"
        : tab
      : "overview"
  ) as WardSection;

  // Map persistent states
  const [mapCenterState, setMapCenterState] = useState<[number, number] | undefined>(undefined);
  const [mapZoomState, setMapZoomState] = useState<number | undefined>(undefined);
  const [mapLayerType, setMapLayerType] = useState<"osm" | "satellite">("osm");
  const [activeStatusFilter, setActiveStatusFilter] = useState<
    "ALL" | "PENDING" | "IN_PROGRESS" | "RESOLVED" | "REJECTED"
  >("ALL");
  const [activeTaskGroupFilter, setActiveTaskGroupFilter] = useState<
    "OVERDUE_RECEIVE" | "PENDING_12H" | "WAITING_INFO" | "TRANSFERRED" | null
  >(null);
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<number | null>(null);
  const [statsRange, setStatsRange] = useState<"7d" | "30d" | "90d" | "all">("30d");

  const defaultCenter = useMemo<[number, number]>(() => {
    if (user?.wardName && WARD_CENTERS[user.wardName]) {
      return WARD_CENTERS[user.wardName];
    }
    return [16.044, 108.22];
  }, [user]);

  // Scroll card into view when selectedFeedbackId changes
  useEffect(() => {
    if (selectedFeedbackId) {
      const element = document.getElementById(`fb-card-${selectedFeedbackId}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [selectedFeedbackId]);

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

  // Date Picker & Reload Logic
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const formatDateToISO = (date: Date | null): string => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatDateToDisplay = (date: Date | null): string => {
    if (!date) return "";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const isTodayDate = (date: Date | null): boolean => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const dateStr = useMemo(() => formatDateToISO(selectedDate), [selectedDate]);

  // Derive fromDate/toDate for API filter from selectedDate (full day range)
  const feedbackDateFilters = useMemo(
    () => ({
      fromDate: dateStr || undefined,
      toDate: dateStr || undefined,
    }),
    [dateStr],
  );

  const {
    data: feedbacksPage,
    isLoading: feedbacksLoading,
    refetch,
  } = useFeedbacks(0, 500, feedbackDateFilters, { enabled: !!user });
  const { data: notifications = [], isLoading: notifLoading } = useNotifications(!!user);
  const { data: unreadCountData } = useNotificationUnreadCount(!!user);
  const markRead = useMarkNotificationReadMutation();
  const markAllRead = useMarkAllNotificationsReadMutation();

  const unreadCount = unreadCountData ?? notifications.filter((n) => !n.isRead).length;

  const rawFeedbacks = feedbacksPage?.content ?? [];

  // Today's feedback query for "Phản ánh hôm nay" section
  const todayStr = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  const todayFeedbackFilters = useMemo(
    () => ({
      fromDate: todayStr,
      toDate: todayStr,
    }),
    [todayStr],
  );

  const {
    data: todayFeedbacksPage,
    isLoading: todayFeedbacksLoading,
    refetch: refetchToday,
  } = useFeedbacks(0, 500, todayFeedbackFilters, { enabled: !!user });

  const todayFeedbacks = useMemo(() => {
    const rawToday = todayFeedbacksPage?.content ?? [];
    return rawToday.filter((fb) => {
      // 1. Scoped by wardId
      if (user?.wardId && fb.wardId && fb.wardId !== user.wardId) return false;

      // 2. Category check
      const code = (fb.categoryCode || "").toUpperCase();
      const isAllowedCategory =
        code === "URBAN_INFRASTRUCTURE" || code === "ENVIRONMENT" || code === "CONSTRUCTION";
      if (!isAllowedCategory) return false;

      // 3. Status in "Chờ xử lý" group
      const grp = getGroupedFeedbackStatus(fb.status);
      return grp === "PENDING";
    });
  }, [todayFeedbacksPage, user]);

  // Filter rawFeedbacks by WARD_STAFF role allowed categories and wardId scope
  const feedbacks = useMemo(() => {
    return rawFeedbacks.filter((fb) => {
      // Scoped by logged-in officer's wardId
      if (user?.wardId && fb.wardId && fb.wardId !== user.wardId) {
        return false;
      }

      const code = (fb.categoryCode || "").toUpperCase();
      if (code) {
        return code === "URBAN_INFRASTRUCTURE" || code === "ENVIRONMENT" || code === "CONSTRUCTION";
      }
      const name = (fb.categoryName || fb.category || "").toLowerCase();
      const isTraffic =
        name.includes("giao thông") || name.includes("traffic") || name.includes("giao thong");
      const isSecurity =
        name.includes("an ninh") ||
        name.includes("security") ||
        name.includes("safety") ||
        name.includes("trật tự") ||
        name.includes("pháp") ||
        name.includes("công an");
      const isFire =
        name.includes("phòng cháy") || name.includes("chữa cháy") || name.includes("fire");
      return !isTraffic && !isSecurity && !isFire;
    });
  }, [rawFeedbacks, user]);

  // Administrative Unit details
  const authorityUnitName = getAdministrativeUnitName(user?.wardName, user?.org) || "Tân Bình";
  const authorityUnitLabel = getAdministrativeUnitLabel(
    user?.wardType || user?.org,
    authorityUnitName,
  );

  const {
    data: statsData,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useWardStaffStatistics(dateStr || undefined, { enabled: !!user });

  const dateLabel = selectedDate
    ? isTodayDate(selectedDate)
      ? `Hôm nay - ${formatDateToDisplay(selectedDate)}`
      : formatDateToDisplay(selectedDate)
    : "Tất cả thời gian";

  const handleReload = () => {
    setSelectedDate(null);
    refetch();
    refetchStats();
    refetchToday();
  };

  // Dynamic statistics counts mapping API response to the 5 status cards
  const totalCount = statsData?.total ?? 0;
  const pendingCount = statsData?.pending ?? 0;
  const inProgressCount = statsData?.inProgress ?? 0;
  const resolvedCount = statsData?.resolved ?? 0;
  const rejectedCount = statsData?.rejected ?? 0;

  const statusCounts = useMemo(() => {
    return {
      ALL: totalCount,
      PENDING: pendingCount,
      IN_PROGRESS: inProgressCount,
      RESOLVED: resolvedCount,
      REJECTED: rejectedCount,
    };
  }, [totalCount, pendingCount, inProgressCount, resolvedCount, rejectedCount]);

  const filteredFeedbacks = useMemo(() => {
    let result = feedbacks;

    if (activeTaskGroupFilter) {
      result = result.filter((fb) => {
        const status = (fb.status || "").toUpperCase();
        const now = new Date();
        const created = new Date(fb.createdAt);
        const diffTime = Math.abs(now.getTime() - created.getTime());
        const diffHours = diffTime / (1000 * 60 * 60);

        switch (activeTaskGroupFilter) {
          case "OVERDUE_RECEIVE":
            return (status === "SUBMITTED" || status === "PENDING_RECEIVE") && diffHours > 24;
          case "PENDING_12H":
            return (status === "PENDING" || status === "PRE_EMPTIVE") && diffHours > 12;
          case "WAITING_INFO":
            return status === "WAITING_INFO" || status === "NEED_MORE_INFO";
          case "TRANSFERRED":
            return status === "TRANSFERRED";
          default:
            return true;
        }
      });
    } else if (activeStatusFilter !== "ALL") {
      result = result.filter((fb) => getGroupedFeedbackStatus(fb.status) === activeStatusFilter);
    }

    return result;
  }, [feedbacks, activeStatusFilter, activeTaskGroupFilter]);

  const mapMarkers = useMemo(() => {
    return filteredFeedbacks
      .filter((f) => f.latitude !== null && f.longitude !== null)
      .map((f) => ({
        id: f.id,
        position: [f.latitude!, f.longitude!] as [number, number],
        title: f.title,
        description: f.description,
        status: f.status,
        address: f.addressDetails || f.address || "",
        category: mapCategoryName(f.categoryName),
        date: formatDate(f.createdAt),
      }));
  }, [filteredFeedbacks]);

  const mapCenter = useMemo<[number, number]>(() => {
    if (mapMarkers.length > 0) {
      return mapMarkers[0].position;
    }
    return defaultCenter;
  }, [mapMarkers, defaultCenter]);

  // Compute counts for the 4 task groups from feedbacks
  const taskGroupCounts = useMemo(() => {
    let overdueReceive = 0;
    let pending12h = 0;
    let waitingInfo = 0;
    let transferred = 0;

    feedbacks.forEach((fb) => {
      const status = (fb.status || "").toUpperCase();
      const now = new Date();
      const created = new Date(fb.createdAt);
      const diffTime = Math.abs(now.getTime() - created.getTime());
      const diffHours = diffTime / (1000 * 60 * 60);

      if ((status === "SUBMITTED" || status === "PENDING_RECEIVE") && diffHours > 24) {
        overdueReceive++;
      }
      if ((status === "PENDING" || status === "PRE_EMPTIVE") && diffHours > 12) {
        pending12h++;
      }
      if (status === "WAITING_INFO" || status === "NEED_MORE_INFO") {
        waitingInfo++;
      }
      if (status === "TRANSFERRED") {
        transferred++;
      }
    });

    return {
      OVERDUE_RECEIVE: overdueReceive,
      PENDING_12H: pending12h,
      WAITING_INFO: waitingInfo,
      TRANSFERRED: transferred,
    };
  }, [feedbacks]);

  // Categories chart stats
  const categoryCounts = useMemo(() => {
    const counts = {
      ENVIRONMENT: 0,
      URBAN_INFRASTRUCTURE: 0,
      CONSTRUCTION: 0,
    };

    feedbacks.forEach((fb) => {
      const code = (fb.categoryCode || "").toUpperCase();
      if (code === "ENVIRONMENT") {
        counts.ENVIRONMENT++;
      } else if (code === "CONSTRUCTION") {
        counts.CONSTRUCTION++;
      } else if (code === "URBAN_INFRASTRUCTURE") {
        counts.URBAN_INFRASTRUCTURE++;
      } else {
        const name = (fb.categoryName || fb.category || "").toLowerCase();
        if (
          name.includes("môi trường") ||
          name.includes("environment") ||
          name.includes("moi truong") ||
          name.includes("rác")
        ) {
          counts.ENVIRONMENT++;
        } else if (
          name.includes("xây dựng") ||
          name.includes("construction") ||
          name.includes("xay dung")
        ) {
          counts.CONSTRUCTION++;
        } else {
          counts.URBAN_INFRASTRUCTURE++;
        }
      }
    });

    const total = feedbacks.length || 1;

    const displayList = [
      { name: "Vệ sinh môi trường", count: counts.ENVIRONMENT, color: "bg-[#0b5ed7]" },
      { name: "Hạ tầng đô thị", count: counts.URBAN_INFRASTRUCTURE, color: "bg-[#0b5ed7]" },
      { name: "Trật tự xây dựng", count: counts.CONSTRUCTION, color: "bg-[#0b5ed7]" },
    ];

    return displayList.map((item) => ({
      ...item,
      percentage: ((item.count / total) * 100).toFixed(1).replace(".", ","),
      rawPercentage: (item.count / total) * 100,
    }));
  }, [feedbacks]);

  // Stats calculations

  // High-priority reports table â€” uses feedbacks already filtered by selectedDate
  const priorityReports = useMemo(() => {
    return feedbacks
      .filter((fb) => {
        const grp = getGroupedFeedbackStatus(fb.status);
        return grp !== "RESOLVED" && grp !== "REJECTED";
      })
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
        if (item.type === "NEW_CAMPAIGN_APPEAL") {
          if (user?.role === Role.WARD_STAFF) {
            navigate({ to: "/ward", search: { tab: "blacklist", detailId: String(feedbackId) } });
          }
        } else if (item.type === "CAMPAIGN_APPEAL_APPROVED" || item.type === "CAMPAIGN_APPEAL_REJECTED") {
          navigate({ to: "/profile" });
        } else if (item.type?.startsWith("CAMPAIGN")) {
          if (user?.role === Role.WARD_STAFF) {
            navigate({ to: "/ward", search: { tab: "campaign", detailId: String(feedbackId) } });
          } else {
            navigate({ to: "/campaigns/$id", params: { id: String(feedbackId) } });
          }
        } else {
          if (user?.role === Role.WARD_STAFF) {
            navigate({ to: "/ward", search: { tab: "feedback", detailId: String(feedbackId) } });
          } else {
            navigate({ to: "/my-reports/$id", params: { id: String(feedbackId) } });
          }
        }
      }
    } catch (e) {
      // Ignore error
    }
  };

  const handleLogout = async () => {
    const loginPath = getLoginPathForRole(user?.role);
    try {
      await authApi.logout().catch(() => {});
    } catch (e) {
      // Ignore error
    }
    logout();
    navigate({ to: loginPath });
    setTimeout(() => {
      queryClient.clear();
    }, 0);
  };
  const handleSectionChange = (section: WardSection) => {
    setSidebarOpen(false);
    navigate({
      to: "/ward",
      search: {
        tab: section === "overview" ? undefined : section,
        detailId: undefined,
      },
    });
  };

  const menuItems = [
    { name: "Tổng quan", section: "overview" as const, icon: Sliders },
    { name: "Phản ánh", section: "feedback" as const, icon: FileText },
    { name: "Chiến dịch", section: "campaign" as const, icon: Activity },
    { name: "Tin nhắn", section: "chat" as const, icon: MessageSquare },
    { name: "Thống kê", section: "statistics" as const, icon: BarChart3 },
    { name: "Danh sách chặn", section: "blacklist" as const, icon: ShieldAlert },
    { name: "Cấu hình", section: "config" as const, icon: Settings },
  ];

  const activeSectionTitle =
    activeSection === "notifications"
      ? locale === "vi"
        ? "Thông báo hệ thống"
        : "System Notifications"
      : menuItems.find((item) => item.section === activeSection)?.name || "Tổng quan";

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800 font-sans antialiased flex">
      {/* ─── 1. FIXED LEFT SIDEBAR ─── */}
      <aside
        className={`bg-slate-950 text-white flex flex-col z-[2010] transition-all duration-300 fixed inset-y-0 left-0 ${
          sidebarCollapsed ? "w-[76px]" : "w-[240px]"
        } ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        {/* Emblem & Ward Title */}
        <div className="p-5 flex flex-col items-center border-b border-white/5 shrink-0">
          <img
            src={logoImg}
            alt="Biểu trưng UBND"
            className={`transition-all duration-300 object-contain ${
              sidebarCollapsed ? "w-10 h-10" : "w-14 h-14"
            }`}
          />
          {!sidebarCollapsed && (
            <div className="mt-3 text-center">
              <span className="font-extrabold text-sm tracking-wider uppercase block text-slate-400">
                {getAdministrativeUnitLabel(user?.wardType, user?.wardName)
                  .replace(authorityUnitName, "")
                  .trim() || "UBND"}
              </span>
              <span className="font-extrabold text-base tracking-widest uppercase block text-white mt-0.5 animate-pulse">
                {authorityUnitName.toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Navigation items */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item, idx) => {
            const Icon = item.icon;
            const isActive = activeSection === item.section;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSectionChange(item.section)}
                className={`w-full text-left flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon size={18} className="shrink-0" />
                {!sidebarCollapsed && <span>{item.name}</span>}
              </button>
            );
          })}
        </nav>

        {/* Collapse button at bottom */}
        <div className="p-4 border-t border-white/5 shrink-0">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer"
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
          className="fixed inset-0 bg-slate-900/40 z-[2050] md:hidden"
        />
      )}

      {/* ─── MAIN WRAPPER ─── */}
      <div
        className={`flex-1 flex flex-col min-w-0 min-h-screen transition-all duration-300 ${
          sidebarCollapsed ? "md:pl-[76px]" : "md:pl-[240px]"
        }`}
      >
        {/* ─── 2. TOP WHITE HEADER ─── */}
        <header className="h-[76px] bg-white border-b border-slate-100 flex items-center justify-between px-6 sticky top-0 z-[2000] shadow-sm shrink-0">
          {/* Title & Hamburger */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden text-slate-500 hover:text-indigo-600 p-2 rounded-lg border border-slate-200 bg-slate-50"
              aria-label="Toggle menu"
            >
              <Menu size={20} />
            </button>
            <div className="flex flex-col">
              <h2 className="text-[17px] font-extrabold text-slate-900 tracking-tight font-sans leading-tight">
                {activeSectionTitle}
              </h2>
              {activeSection === "overview" && (
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 block">
                  UBND PHƯỜNG {authorityUnitName.toUpperCase()}
                </span>
              )}
              {activeSection === "feedback" && (
                <span className="text-[11px] text-slate-400 font-medium mt-0.5 block">
                  Quản lý, tiếp nhận và xử lý phản ánh của người dân trong địa bàn
                </span>
              )}
              {activeSection === "campaign" && (
                <span className="text-[11px] text-slate-400 font-medium mt-0.5 block">
                  Theo dõi và điều phối các chiến dịch cộng đồng trên địa bàn
                </span>
              )}
              {activeSection === "chat" && (
                <span className="text-[11px] text-slate-400 font-medium mt-0.5 block">
                  Trò chuyện nhóm và truyền thông hoạt động chiến dịch với người dân
                </span>
              )}
              {activeSection === "statistics" && (
                <span className="text-[11px] text-slate-400 font-medium mt-0.5 block">
                  Phân tích xu hướng, tỷ lệ xử lý và các điểm cần ưu tiên trong địa bàn phụ trách
                </span>
              )}
              {activeSection === "config" && (
                <span className="text-[11px] text-slate-400 font-medium mt-0.5 block">
                  Cấu hình thông tin cá nhân và tài khoản cán bộ
                </span>
              )}
            </div>
          </div>

          {/* Controls: Bell & Profile */}
          <div className="flex items-center gap-4">
            {/* Dynamic Actions per section */}
            {activeSection === "overview" && (
              <div className="flex items-center gap-2 mr-2">
                <div className="relative">
                  <button
                    onClick={() =>
                      dateInputRef.current?.showPicker
                        ? dateInputRef.current.showPicker()
                        : dateInputRef.current?.click()
                    }
                    className="flex items-center gap-2 px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 rounded-xl text-xs font-bold text-slate-700 transition-all duration-200 shadow-sm hover:shadow active:scale-[0.98] cursor-pointer"
                  >
                    <Calendar size={14} className="text-indigo-600" />
                    <span className="font-mono">{dateLabel}</span>
                    <ChevronDown size={14} className="text-slate-500" />
                  </button>
                  <input
                    type="date"
                    ref={dateInputRef}
                    value={formatDateToISO(selectedDate)}
                    onChange={(e) => {
                      if (e.target.value) {
                        const [year, month, day] = e.target.value.split("-").map(Number);
                        setSelectedDate(new Date(year, month - 1, day));
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer pointer-events-none"
                  />
                </div>
                <button
                  onClick={handleReload}
                  className="p-1.5 bg-slate-50 border border-slate-100 hover:bg-slate-100 rounded-xl transition-all duration-200 shadow-sm cursor-pointer"
                  aria-label="Tải lại dữ liệu"
                >
                  <RefreshCw
                    size={14}
                    className={`text-slate-500 ${feedbacksLoading ? "animate-spin" : ""}`}
                  />
                </button>
              </div>
            )}

            {activeSection === "campaign" && !detailId && tab !== "campaign/create" && (
              <button
                onClick={() => navigate({ to: "/ward", search: { tab: "campaign/create" } })}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#0F5BD8] px-3.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#0B4FC0] active:scale-[0.98] mr-2 cursor-pointer"
              >
                <Plus size={14} />
                Tạo chiến dịch
              </button>
            )}

            {activeSection === "statistics" && (
              <div className="inline-flex rounded-xl bg-slate-100 p-0.5 ring-1 ring-slate-900/5 select-none mr-2">
                {[
                  { key: "7d", label: "7 ngày" },
                  { key: "30d", label: "30 ngày" },
                  { key: "90d", label: "90 ngày" },
                  { key: "all", label: "Tất cả" },
                ].map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setStatsRange(option.key as any)}
                    className={`h-7 rounded-lg px-3 text-[11px] font-bold transition-all duration-200 active:scale-[0.98] ${
                      statsRange === option.key
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-900 cursor-pointer"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => {
                  setNotifOpen(!notifOpen);
                  setUserOpen(false);
                }}
                className="relative p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-full transition-all flex items-center justify-center min-w-[40px] min-h-[40px] border border-slate-100 cursor-pointer"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-[16px] h-[16px] bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white font-sans">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown notification panel */}
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-[340px] bg-white border border-slate-100 rounded-2xl shadow-lg py-3 z-50 animate-fade-in">
                  <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-800">Thông báo mới</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[11px] text-indigo-600 hover:underline font-bold"
                      >
                        Đánh dấu đã đọc
                      </button>
                    )}
                  </div>
                  <div className="max-h-[280px] overflow-y-auto divide-y divide-slate-100/50">
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
                      <div className="py-8 text-center text-xs text-slate-400">
                        Không có thông báo mới
                      </div>
                    ) : (
                      notifications.slice(0, 5).map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleNotifClick(item)}
                          className={`w-full text-left p-3.5 flex gap-3 transition-colors hover:bg-slate-100 ${
                            item.isRead ? "opacity-75" : "bg-indigo-100 hover:bg-indigo-200/80"
                          }`}
                        >
                          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100/50">
                            <Bell size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-bold text-slate-800 block truncate">
                              {item.title}
                            </span>
                            <span className="text-[11px] text-slate-500 mt-0.5 block line-clamp-2 leading-relaxed font-semibold">
                              {highlightNotificationContent(item.content)}
                            </span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                  <div className="pt-2 text-center border-t border-slate-100">
                    <button
                      onClick={() => {
                        handleSectionChange("notifications");
                        setNotifOpen(false);
                      }}
                      className="text-xs font-bold text-indigo-600 hover:underline inline-block py-1 bg-transparent border-0 cursor-pointer"
                    >
                      {locale === "vi" ? "Xem tất cả" : "See all"}
                    </button>
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
                className="flex items-center gap-3 focus:outline-none cursor-pointer text-left pl-2 border-l border-slate-100"
              >
                <div className="w-9 h-9 rounded-full bg-slate-50 text-indigo-600 flex items-center justify-center font-bold border border-slate-100 shrink-0">
                  <User size={18} />
                </div>
                <div className="leading-tight hidden sm:block">
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    {user?.name || "Nguyễn Văn Nam"}
                    <ChevronDown size={14} className="text-slate-400" />
                  </div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">
                    {authorityUnitLabel}
                  </span>
                </div>
              </button>

              {userOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-100 rounded-xl shadow-lg py-2 z-50 animate-fade-in">
                  <div className="px-4 py-2 border-b border-slate-100 mb-1">
                    <div className="text-xs font-bold text-slate-700 truncate">
                      {user?.name || "Nguyễn Văn Nam"}
                    </div>
                    <div className="text-[9px] text-slate-400 font-bold truncate mt-0.5">
                      {authorityUnitLabel}
                    </div>
                  </div>
                  <Link
                    to="/ward"
                    search={{ tab: "config" }}
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
        <main
          className={`flex-1 space-y-6 overflow-y-auto ${activeSection === "feedback" && !detailId ? "p-5 md:p-6" : activeSection === "feedback" && detailId ? "p-0" : "p-6 md:p-8"}`}
        >
          {activeSection === "feedback" ? (
            detailId ? (
              <FeedbackDetailPageComponent
                feedbackId={detailId}
                onBack={() => {
                  navigate({
                    to: "/ward",
                    search: { tab: "feedback" },
                  });
                }}
              />
            ) : (
              <WardFeedbackManagementPage hideHeader={true} />
            )
          ) : activeSection === "overview" ? (
            <>
              {/* ─── KPI CARDS ─── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  {
                    title: "Tổng phản ánh",
                    val: totalCount,
                    tone: "indigo",
                    icon: FileText,
                  },
                  {
                    title: "Phản ánh hôm nay",
                    val: todayFeedbacks.length,
                    tone: "sky",
                    icon: Clock,
                  },
                  {
                    title: "Chờ xử lý",
                    val: pendingCount,
                    tone: "indigo",
                    icon: AlertCircle,
                  },
                  {
                    title: "Đang xử lý",
                    val: inProgressCount,
                    tone: "amber",
                    icon: Hourglass,
                  },
                  {
                    title: "Đã xử lý",
                    val: resolvedCount,
                    tone: "emerald",
                    icon: CheckCircle2,
                  },
                  {
                    title: "Đã từ chối",
                    val: rejectedCount,
                    tone: "rose",
                    icon: X,
                  },
                ].map((card, idx) => {
                  const Icon = card.icon;
                  const styles = {
                    indigo: "bg-indigo-50/70 text-indigo-600 border-indigo-100/50",
                    sky: "bg-sky-50/70 text-sky-600 border-sky-100/50",
                    amber: "bg-amber-50/70 text-amber-600 border-amber-100/50",
                    emerald: "bg-emerald-50/70 text-emerald-600 border-emerald-100/50",
                    rose: "bg-rose-50/70 text-rose-600 border-rose-100/50",
                  };
                  return (
                    <div
                      key={idx}
                      className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center justify-between hover:shadow-md transition-all duration-300"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block whitespace-normal leading-tight">
                          {card.title}
                        </span>
                        <h3 className="text-2xl font-bold font-mono tracking-tight text-slate-900 mt-2 leading-none">
                          {statsLoading || feedbacksLoading ? (
                            <Skeleton className="h-6 w-12 mt-1" />
                          ) : (
                            card.val.toLocaleString("vi-VN")
                          )}
                        </h3>
                      </div>
                      <div
                        className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${styles[card.tone as keyof typeof styles]}`}
                      >
                        <Icon size={18} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ─── MIDDLE ROW GRID ─── */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* Map Panel (65%) */}
                <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[480px]">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                    <h3 className="text-sm font-bold uppercase tracking-tight text-slate-900 flex items-center gap-2">
                      Bản đồ phản ánh theo khu vực
                    </h3>
                  </div>

                  {/* Status Filter Chips */}
                  <div className="px-4 py-2 bg-slate-50/30 border-b border-slate-100 flex flex-wrap gap-2 shrink-0">
                    {[
                      {
                        key: "ALL",
                        label: "Tất cả",
                        color: "bg-slate-50 text-slate-600 border-slate-100 hover:border-slate-200",
                        activeColor: "bg-slate-900 text-white border-slate-900",
                      },
                      {
                        key: "PENDING",
                        label: "Chờ xử lý",
                        color:
                          "bg-indigo-50/50 text-indigo-700 border-indigo-100/30 hover:border-indigo-100",
                        activeColor: "bg-indigo-600 text-white border-indigo-600",
                      },
                      {
                        key: "IN_PROGRESS",
                        label: "Đang xử lý",
                        color: "bg-yellow-50 text-yellow-700 border-yellow-200",
                        activeColor: "bg-amber-600 text-white border-amber-600",
                      },
                      {
                        key: "RESOLVED",
                        label: "Đã xử lý",
                        color: "bg-green-50 text-green-700 border-green-200",
                        activeColor: "bg-emerald-600 text-white border-emerald-600",
                      },
                      {
                        key: "REJECTED",
                        label: "Đã từ chối",
                        color: "bg-red-50 text-red-700 border-red-200",
                        activeColor: "bg-rose-600 text-white border-rose-600",
                      },
                    ].map((chip) => {
                      const isActive = activeStatusFilter === chip.key && !activeTaskGroupFilter;
                      return (
                        <button
                          key={chip.key}
                          type="button"
                          onClick={() => {
                            setActiveStatusFilter(chip.key as any);
                            setActiveTaskGroupFilter(null);
                          }}
                          className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border transition-all duration-200 active:scale-[0.97] ${
                            isActive ? chip.activeColor : `${chip.color} cursor-pointer`
                          }`}
                        >
                          <span>{chip.label}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold font-mono ${
                              isActive ? "bg-white/20 text-white" : "bg-slate-200/50 text-slate-600"
                            }`}
                          >
                            {statusCounts[chip.key as keyof typeof statusCounts]}
                          </span>
                        </button>
                      );
                    })}

                    {activeTaskGroupFilter && (
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#E8F0FE] text-indigo-600 border border-indigo-100 animate-fadeIn">
                        <span>
                          Bộ lọc công việc:{" "}
                          {activeTaskGroupFilter === "OVERDUE_RECEIVE"
                            ? "Quá hạn tiếp nhận"
                            : activeTaskGroupFilter === "PENDING_12H"
                              ? "Chờ xử lý > 12 giờ"
                              : activeTaskGroupFilter === "WAITING_INFO"
                                ? "Yêu cầu bổ sung"
                                : "Đã chuyển liên ngành"}
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveTaskGroupFilter(null)}
                          className="hover:bg-indigo-100 text-indigo-800 rounded-full w-4 h-4 inline-flex items-center justify-center cursor-pointer border-0 ml-1 font-bold text-[10px]"
                          title="Bỏ lọc công việc"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Split Content (Map + Sidebar List) */}
                  <div className="flex-1 flex flex-col md:flex-row min-h-0">
                    {/* Map Container */}
                    <div className="flex-1 h-full relative">
                      <Suspense
                        fallback={
                          <div className="w-full h-full flex items-center justify-center text-slate-400 animate-pulse">
                            Đang tải bản đồ...
                          </div>
                        }
                      >
                        <CivicMap
                          center={mapCenterState || defaultCenter}
                          zoom={mapZoomState || 13}
                          markers={mapMarkers}
                          height="100%"
                          wardName={user?.wardName || undefined}
                          showBoundary={false}
                          activeMarkerId={selectedFeedbackId || undefined}
                          layerType={mapLayerType}
                          detailUrlTemplate="/ward?tab=feedback&detailId=:id"
                          onMarkerClick={(id: any) => {
                            setSelectedFeedbackId(Number(id));
                          }}
                          onViewportChange={(center: any, zoom: any) => {
                            setMapCenterState(center);
                            setMapZoomState(zoom);
                          }}
                          onLayerTypeChange={setMapLayerType}
                        />
                      </Suspense>
                    </div>

                    {/* Sidebar Scrollable Feedback List */}
                    <div className="w-full md:w-80 flex flex-col h-full bg-slate-50/50 shrink-0 border-t md:border-t-0 md:border-l border-slate-100">
                      <div className="p-3 border-b border-slate-100 bg-white font-bold text-xs text-slate-400 flex items-center justify-between shrink-0">
                        <span className="text-[10px] uppercase tracking-wider">
                          DANH SÁCH PHẢN ÁNH
                        </span>
                        <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">
                          {filteredFeedbacks.length}
                        </span>
                      </div>
                      <div className="flex-1 overflow-y-auto p-2 space-y-2 max-h-[150px] md:max-h-none">
                        {filteredFeedbacks.length === 0 ? (
                          <div className="text-center text-slate-400 py-10 text-xs font-bold">
                            Không có phản ánh nào
                          </div>
                        ) : (
                          filteredFeedbacks.map((fb) => {
                            const isSelected = selectedFeedbackId === fb.id;
                            const grp = getGroupedFeedbackStatus(fb.status);
                            const statusColor =
                              grp === "RESOLVED"
                                ? "bg-emerald-500"
                                : grp === "REJECTED"
                                  ? "bg-rose-500"
                                  : grp === "IN_PROGRESS"
                                    ? "bg-amber-500"
                                    : "bg-indigo-500";
                            return (
                              <div
                                key={fb.id}
                                id={`fb-card-${fb.id}`}
                                onClick={() => {
                                  setSelectedFeedbackId(fb.id);
                                  if (fb.latitude && fb.longitude) {
                                    setMapCenterState([fb.latitude, fb.longitude]);
                                    setMapZoomState(16);
                                  }
                                }}
                                className={`p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                                  isSelected
                                    ? "bg-indigo-50/70 border-indigo-200 shadow-sm"
                                    : "bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm"
                                }`}
                              >
                                <div className="flex items-center gap-2 mb-1.5">
                                  <span className={`w-2 h-2 rounded-full ${statusColor}`} />
                                  <span className="font-bold font-mono text-[10px] text-slate-500 truncate">
                                    {fb.trackingCode || `#${fb.id}`}
                                  </span>
                                  <span className="text-[9px] font-mono text-slate-400 ml-auto shrink-0 font-medium">
                                    {formatDate(fb.createdAt, false)}
                                  </span>
                                </div>
                                <h4 className="font-bold text-xs text-slate-800 line-clamp-1 mb-1">
                                  {fb.title}
                                </h4>
                                <p className="text-[10px] text-slate-500 line-clamp-1 font-semibold">
                                  {fb.addressDetails || fb.address}
                                </p>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status Color Legend */}
                  <div className="p-4 bg-white border-t border-slate-100 flex flex-wrap gap-4 items-center justify-between shrink-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                        Trạng thái:
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                        <span className="text-[11px] font-bold text-slate-500">Chờ xử lý</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        <span className="text-[11px] font-bold text-slate-500">Đang xử lý</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span className="text-[11px] font-bold text-slate-500">Đã xử lý</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                        <span className="text-[11px] font-bold text-slate-500">Đã từ chối</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Work Tasks Widget (35%) */}
                <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between h-[480px]">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                      <h3 className="text-sm font-bold uppercase tracking-tight text-slate-900">
                        Công việc cần xử lý
                      </h3>
                      <button
                        onClick={() => handleSectionChange("feedback")}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition cursor-pointer bg-transparent border-0"
                      >
                        Xem tất cả →
                      </button>
                    </div>
                    <div className="space-y-3">
                      {feedbacksLoading
                        ? [1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex gap-3 animate-pulse py-2">
                              <div className="w-3 h-3 bg-slate-100 rounded-full shrink-0" />
                              <div className="flex-1 space-y-2">
                                <div className="h-3 bg-slate-100 rounded w-1/3" />
                                <div className="h-2.5 bg-slate-100 rounded w-2/3" />
                              </div>
                            </div>
                          ))
                        : [
                            {
                              key: "OVERDUE_RECEIVE" as const,
                              title: "Quá hạn tiếp nhận",
                              desc: "Phản ánh chờ tiếp nhận quá 24 giờ",
                              color: "bg-rose-500",
                              textColor: "text-rose-700",
                              bgColor: "bg-rose-50/70",
                              borderColor: "border-rose-100/50",
                              activeBorderColor: "border-rose-400",
                              count: taskGroupCounts.OVERDUE_RECEIVE,
                            },
                            {
                              key: "PENDING_12H" as const,
                              title: "Chờ xử lý > 12 giờ",
                              desc: "Sắp quá hạn xử lý",
                              color: "bg-amber-500",
                              textColor: "text-amber-700",
                              bgColor: "bg-amber-50/70",
                              borderColor: "border-amber-100/50",
                              activeBorderColor: "border-amber-400",
                              count: taskGroupCounts.PENDING_12H,
                            },
                            {
                              key: "WAITING_INFO" as const,
                              title: "Yêu cầu bổ sung thông tin",
                              desc: "Đang chờ người dân phản hồi",
                              color: "bg-indigo-500",
                              textColor: "text-indigo-700",
                              bgColor: "bg-indigo-50/70",
                              borderColor: "border-indigo-100/50",
                              activeBorderColor: "border-indigo-400",
                              count: taskGroupCounts.WAITING_INFO,
                            },
                            {
                              key: "TRANSFERRED" as const,
                              title: "Đã chuyển liên ngành",
                              desc: "Cần theo dõi tiến độ phối hợp",
                              color: "bg-purple-500",
                              textColor: "text-purple-700",
                              bgColor: "bg-purple-50/70",
                              borderColor: "border-purple-100/50",
                              activeBorderColor: "border-purple-400",
                              count: taskGroupCounts.TRANSFERRED,
                            },
                          ].map((group) => {
                            const isZero = group.count === 0;
                            const isActive = activeTaskGroupFilter === group.key;
                            return (
                              <button
                                key={group.key}
                                type="button"
                                onClick={() => {
                                  if (isActive) {
                                    setActiveTaskGroupFilter(null);
                                  } else {
                                    setActiveTaskGroupFilter(group.key);
                                    setActiveStatusFilter("ALL");
                                  }
                                }}
                                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-200 text-left ${
                                  isActive
                                    ? `${group.bgColor} border-2 ${group.activeBorderColor} shadow-sm`
                                    : isZero
                                      ? "bg-white border-slate-100 opacity-40 hover:opacity-100 hover:border-slate-200 cursor-pointer"
                                      : "bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm cursor-pointer"
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <span
                                    className={`w-2 h-2 rounded-full shrink-0 ${group.color}`}
                                  />
                                  <div className="min-w-0">
                                    <span
                                      className={`text-xs font-bold block truncate ${isZero ? "text-slate-500 font-medium" : "text-slate-800"}`}
                                    >
                                      {group.title}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-medium block truncate mt-1">
                                      {group.desc}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <span
                                    className={`text-xs font-bold font-mono px-2.5 py-0.5 rounded-full ${isZero ? "bg-slate-50 text-slate-400" : `${group.bgColor} ${group.textColor}`}`}
                                  >
                                    {group.count}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                    </div>
                  </div>
                  <div className="pt-2 text-[10px] text-slate-400 font-bold italic text-center border-t border-slate-50 shrink-0">
                    Bấm vào từng nhóm công việc để xem trên bản đồ & danh sách phản ánh.
                  </div>
                </div>
              </div>

              {/* ─── BOTTOM ROW GRID ─── */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* Reports by Category Panel (50%) */}
                <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between min-h-[380px]">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                      <h3 className="text-sm font-bold uppercase tracking-tight text-slate-900">
                        Phản ánh theo lĩnh vực
                      </h3>
                      <Link
                        to="/ward"
                        search={{ tab: "feedback" }}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition"
                      >
                        Xem chi tiết
                      </Link>
                    </div>
                    <div className="space-y-4">
                      {feedbacksLoading
                        ? [1, 2, 3].map((i) => (
                            <div key={i} className="space-y-2">
                              <Skeleton className="h-3 w-1/3" />
                              <Skeleton className="h-2 w-full" />
                            </div>
                          ))
                        : categoryCounts.map((cat, idx) => (
                            <div key={idx} className="space-y-1">
                              <div className="flex justify-between text-xs font-bold text-slate-600">
                                <span>{cat.name}</span>
                                <span className="text-slate-800 font-bold font-mono">
                                  {cat.count}{" "}
                                  <span className="text-slate-400 font-semibold font-sans text-[10px]">
                                    ({cat.percentage}%)
                                  </span>
                                </span>
                              </div>
                              <div className="w-full bg-slate-50 border border-slate-100/50 h-2 rounded-full overflow-hidden">
                                <div
                                  className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                                  style={{ width: `${cat.rawPercentage}%` }}
                                />
                              </div>
                            </div>
                          ))}
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-100">
                    <span className="text-xs font-bold text-slate-700">
                      Tổng: {totalCount} phản ánh
                    </span>
                  </div>
                </div>

                {/* High Priority Reports Table (70%) */}
                <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between min-h-[380px]">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                      <h3 className="text-sm font-bold uppercase tracking-tight text-slate-900">
                        Phản ánh ưu tiên cao
                      </h3>
                      <Link
                        to="/ward"
                        search={{ tab: "feedback" }}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition"
                      >
                        Xem tất cả →
                      </Link>
                    </div>
                    <div className="space-y-3">
                      {feedbacksLoading ? (
                        [1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="rounded-xl border border-slate-100 bg-slate-50/60 p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-2">
                                <Skeleton className="h-3 w-20" />
                                <Skeleton className="h-4 w-56" />
                                <Skeleton className="h-3 w-40" />
                              </div>
                              <Skeleton className="h-6 w-20" />
                            </div>
                          </div>
                        ))
                      ) : priorityReports.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-8 text-center">
                          <p className="text-sm font-bold text-slate-500">
                            Chưa có phản ánh ưu tiên cao.
                          </p>
                        </div>
                      ) : (
                        priorityReports.map((row) => {
                          const grp = getGroupedFeedbackStatus(row.status);
                          const statusMeta =
                            grp === "PENDING"
                              ? {
                                  label: "Chờ xử lý",
                                  className: "bg-indigo-50 border-indigo-100 text-indigo-700",
                                }
                              : grp === "IN_PROGRESS"
                                ? {
                                    label: "Đang xử lý",
                                    className: "bg-amber-50 border-amber-100 text-amber-700",
                                  }
                                : grp === "RESOLVED"
                                  ? {
                                      label: "Đã xử lý",
                                      className:
                                        "bg-emerald-50 border-emerald-100 text-emerald-700",
                                    }
                                  : grp === "REJECTED"
                                    ? {
                                        label: "Đã từ chối",
                                        className: "bg-rose-50 border-rose-100 text-rose-700",
                                      }
                                    : {
                                        label: "Không xác định",
                                        className: "bg-slate-50 border-slate-100 text-slate-600",
                                      };

                          return (
                            <div
                              key={row.id}
                              className="group relative rounded-xl border border-slate-100 bg-white p-4 shadow-sm hover:border-slate-200 hover:shadow-md transition-all duration-300 animate-fade-in"
                            >
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0 flex-1">
                                  <div className="mb-2 flex flex-wrap items-center gap-2">
                                    <span className="inline-block rounded-md bg-slate-50 border border-slate-100 px-2 py-0.5 text-[9px] font-bold font-mono text-slate-500">
                                      {row.trackingCode}
                                    </span>
                                    <span
                                      className={`inline-block rounded-md border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${statusMeta.className}`}
                                    >
                                      {statusMeta.label}
                                    </span>
                                  </div>
                                  <h4 className="text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors duration-200">
                                    {row.title}
                                  </h4>
                                  <div className="mt-2.5 grid gap-2 text-[11px] font-semibold text-slate-500 sm:grid-cols-2">
                                    <span className="truncate">
                                      Lĩnh vực:{" "}
                                      <b className="font-bold text-slate-700">
                                        {mapCategoryName(row.categoryName)}
                                      </b>
                                    </span>
                                    <span
                                      className="truncate"
                                      title={row.addressDetails || row.address || "Tân Bình"}
                                    >
                                      Địa chỉ: {row.addressDetails || row.address || "Tân Bình"}
                                    </span>
                                    <span className="font-mono text-slate-400 text-[10px]">
                                      {formatDate(row.createdAt)}
                                    </span>
                                  </div>
                                </div>
                                <Link
                                  to="/ward"
                                  search={{ tab: "feedback", detailId: String(row.id) }}
                                  className="inline-flex h-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 hover:bg-slate-800 px-3 text-xs font-bold text-white shadow-sm transition active:scale-[0.97]"
                                >
                                  Xem chi tiết
                                </Link>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <div className="hidden">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-[#E4EAF2] bg-slate-50/50">
                            <th className="px-5 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Mã phản ánh
                            </th>
                            <th className="px-5 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Nội dung
                            </th>
                            <th className="px-5 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Lĩnh vực
                            </th>
                            <th className="px-5 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Địa chỉ
                            </th>
                            <th className="px-5 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Thời gian
                            </th>
                            <th className="px-5 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Trạng thái
                            </th>
                            <th className="px-5 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">
                              Hành động
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E4EAF2]">
                          {feedbacksLoading ? (
                            [1, 2, 3].map((i) => (
                              <tr key={i} className="animate-pulse">
                                <td className="px-5 py-3">
                                  <Skeleton className="h-3.5 w-16" />
                                </td>
                                <td className="px-5 py-3">
                                  <Skeleton className="h-3.5 w-36" />
                                </td>
                                <td className="px-5 py-3">
                                  <Skeleton className="h-3.5 w-24" />
                                </td>
                                <td className="px-5 py-3">
                                  <Skeleton className="h-3.5 w-24" />
                                </td>
                                <td className="px-5 py-3">
                                  <Skeleton className="h-3.5 w-16" />
                                </td>
                                <td className="px-5 py-3">
                                  <Skeleton className="h-5 w-12" />
                                </td>
                                <td className="px-5 py-3 text-right">
                                  <Skeleton className="h-6 w-16 inline-block" />
                                </td>
                              </tr>
                            ))
                          ) : priorityReports.length === 0 ? (
                            <tr>
                              <td
                                colSpan={7}
                                className="px-5 py-8 text-center text-xs text-slate-400"
                              >
                                Chưa có phản ánh ưu tiên cao.
                              </td>
                            </tr>
                          ) : (
                            priorityReports.map((row) => {
                              const grp = getGroupedFeedbackStatus(row.status);
                              return (
                                <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                                  <td className="px-5 py-3.5 text-xs font-bold text-slate-800">
                                    {row.trackingCode}
                                  </td>
                                  <td
                                    className="px-5 py-3.5 text-xs text-slate-700 font-semibold max-w-[150px] truncate"
                                    title={row.title}
                                  >
                                    {row.title}
                                  </td>
                                  <td className="px-5 py-3.5 text-xs text-slate-600">
                                    {mapCategoryName(row.categoryName)}
                                  </td>
                                  <td
                                    className="px-5 py-3.5 text-xs text-slate-500 truncate max-w-[120px] font-sans"
                                    title={row.addressDetails || row.address || "Tân Bình"}
                                  >
                                    {row.addressDetails || row.address || "Tân Bình"}
                                  </td>
                                  <td className="px-5 py-3.5 text-xs text-slate-500 whitespace-nowrap font-sans">
                                    {formatDate(row.createdAt)}
                                  </td>
                                  <td className="px-5 py-3.5">
                                    {grp === "PENDING" ? (
                                      <span className="px-2 py-0.5 text-[9px] font-extrabold rounded bg-blue-50 text-blue-700 border border-blue-100 whitespace-nowrap">
                                        Chờ xử lý
                                      </span>
                                    ) : grp === "IN_PROGRESS" ? (
                                      <span className="px-2 py-0.5 text-[9px] font-extrabold rounded bg-yellow-50 text-yellow-700 border border-yellow-100 whitespace-nowrap">
                                        Đang xử lý
                                      </span>
                                    ) : grp === "RESOLVED" ? (
                                      <span className="px-2 py-0.5 text-[9px] font-extrabold rounded bg-green-50 text-green-700 border border-green-100 whitespace-nowrap">
                                        Đã xử lý
                                      </span>
                                    ) : grp === "REJECTED" ? (
                                      <span className="px-2 py-0.5 text-[9px] font-extrabold rounded bg-red-50 text-red-600 border border-red-100 whitespace-nowrap">
                                        Đã từ chối
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 text-[9px] font-extrabold rounded bg-slate-50 text-slate-600 border border-slate-100 whitespace-nowrap">
                                        Không xác định
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-5 py-3.5 text-right">
                                    <Link
                                      to="/ward"
                                      search={{ tab: "feedback", detailId: String(row.id) }}
                                      className="inline-flex items-center justify-center px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold rounded-lg transition-colors border border-blue-200/50 cursor-pointer"
                                    >
                                      Xem chi tiết
                                    </Link>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* ─── TODAY'S PENDING FEEDBACKS SECTION ─── */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-2">
                  <h3 className="text-sm font-bold uppercase tracking-tight text-slate-900 flex items-center gap-2">
                    Phản ánh hôm nay (Chờ xử lý)
                    <span className="inline-block rounded-md border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-[10px] font-bold font-mono text-indigo-700">
                      {todayFeedbacks.length}
                    </span>
                  </h3>
                </div>
                <div className="overflow-x-auto -mx-6">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/30">
                        <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Mã phản ánh
                        </th>
                        <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Nội dung
                        </th>
                        <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Lĩnh vực
                        </th>
                        <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Địa chỉ
                        </th>
                        <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Thời gian tạo
                        </th>
                        <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Trạng thái
                        </th>
                        <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">
                          Hành động
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/50">
                      {todayFeedbacksLoading ? (
                        [1, 2].map((i) => (
                          <tr key={i} className="animate-pulse">
                            <td className="px-6 py-3">
                              <Skeleton className="h-3.5 w-16" />
                            </td>
                            <td className="px-6 py-3">
                              <Skeleton className="h-3.5 w-36" />
                            </td>
                            <td className="px-6 py-3">
                              <Skeleton className="h-3.5 w-24" />
                            </td>
                            <td className="px-6 py-3">
                              <Skeleton className="h-3.5 w-24" />
                            </td>
                            <td className="px-6 py-3">
                              <Skeleton className="h-3.5 w-16" />
                            </td>
                            <td className="px-6 py-3">
                              <Skeleton className="h-5 w-12" />
                            </td>
                            <td className="px-6 py-3 text-right">
                              <Skeleton className="h-6 w-16 inline-block" />
                            </td>
                          </tr>
                        ))
                      ) : todayFeedbacks.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-6 py-8 text-center text-xs font-bold text-slate-400"
                          >
                            Hôm nay chưa có phản ánh mới chờ xử lý.
                          </td>
                        </tr>
                      ) : (
                        todayFeedbacks.map((row) => {
                          const grp = getGroupedFeedbackStatus(row.status);
                          return (
                            <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-3.5 text-xs font-bold font-mono text-slate-800">
                                {row.trackingCode}
                              </td>
                              <td
                                className="px-6 py-3.5 text-xs text-slate-700 font-bold max-w-[180px] truncate"
                                title={row.title}
                              >
                                {row.title}
                              </td>
                              <td className="px-6 py-3.5 text-xs text-slate-600 font-semibold">
                                {mapCategoryName(row.categoryName)}
                              </td>
                              <td
                                className="px-6 py-3.5 text-xs text-slate-500 truncate max-w-[180px]"
                                title={row.addressDetails || row.address || "Tân Bình"}
                              >
                                {row.addressDetails || row.address || "Tân Bình"}
                              </td>
                              <td className="px-6 py-3.5 text-xs text-slate-500 whitespace-nowrap font-mono">
                                {formatDate(row.createdAt)}
                              </td>
                              <td className="px-6 py-3.5">
                                {grp === "PENDING" ? (
                                  <span className="inline-block rounded-md border border-indigo-100 bg-indigo-50/50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-indigo-700">
                                    Chờ xử lý
                                  </span>
                                ) : grp === "IN_PROGRESS" ? (
                                  <span className="inline-block rounded-md border border-amber-100 bg-amber-50/50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-700">
                                    Đang xử lý
                                  </span>
                                ) : grp === "RESOLVED" ? (
                                  <span className="inline-block rounded-md border border-emerald-100 bg-emerald-50/50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-700">
                                    Đã xử lý
                                  </span>
                                ) : grp === "REJECTED" ? (
                                  <span className="inline-block rounded-md border border-rose-100 bg-rose-50/50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-rose-700">
                                    Đã từ chối
                                  </span>
                                ) : (
                                  <span className="inline-block rounded-md border border-slate-100 bg-slate-50/50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-600">
                                    Không xác định
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-3.5 text-right">
                                <Link
                                  to="/ward"
                                  search={{ tab: "feedback", detailId: String(row.id) }}
                                  className="inline-flex items-center justify-center px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition active:scale-[0.97] cursor-pointer"
                                >
                                  Xem chi tiết
                                </Link>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Footer branding */}
              <footer className="pt-4 border-t border-slate-100 text-center text-xs text-slate-400 font-bold">
                © 2026 {authorityUnitLabel}. Hệ thống quản lý phản ánh hiện trường
              </footer>
            </>
          ) : activeSection === "campaign" ? (
            <WardCampaignPage hideHeader={true} />
          ) : activeSection === "chat" ? (
            <WardChatDashboardPage />
          ) : activeSection === "statistics" ? (
            <WardStatisticsPage range={statsRange} setRange={setStatsRange} hideHeader={true} />
          ) : activeSection === "blacklist" ? (
            <WardBlacklistPage defaultAppealId={detailId ? Number(detailId) : undefined} />
          ) : activeSection === "config" ? (
            <WardProfileConfigPage
              user={user}
              authorityUnitName={authorityUnitName}
              authorityUnitLabel={authorityUnitLabel}
              onProfileUpdated={(profile) => {
                if (!user) return;
                login({
                  ...user,
                  name: profile.fullName || user.name,
                  wardId: profile.wardId !== undefined ? profile.wardId : user.wardId,
                });
              }}
            />
          ) : activeSection === "notifications" ? (
            <WardNotificationsPage />
          ) : (
            <WardSectionPlaceholder section={activeSection as "schedule"} />
          )}
        </main>
      </div>
    </div>
  );
}

function WardSectionPlaceholder({ section }: { section: "schedule" }) {
  const labels: Record<"schedule", { title: string; description: string }> = {
    schedule: {
      title: "L\u1ecbch ti\u1ebfp c\u00f4ng d\u00e2n",
      description:
        "Khu v\u1ef1c l\u1ecbch ti\u1ebfp c\u00f4ng d\u00e2n s\u1ebd \u0111\u01b0\u1ee3c hi\u1ec3n th\u1ecb trong khung dashboard n\u00e0y.",
    },
  };
  const copy = labels[section];

  return (
    <div className="rounded-2xl border border-[#E4EAF2] bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-extrabold text-[#0B2545]">{copy.title}</h1>
      <p className="mt-2 text-sm text-slate-500">{copy.description}</p>
    </div>
  );
}
