import React, { useState, Suspense, useMemo, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useHotspots, usePoliceAssignedFeedbacks, useAcceptFeedback, useRejectFeedback, useRequestMoreInfo, useUpdatePoliceFeedbackStatus } from "@/hooks";
import { clientOnly } from "@/components/ClientOnly";
import { Link, useNavigate } from "@tanstack/react-router";
import { authApi } from "@/lib/api";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Bell,
  Search,
  User,
  Home,
  Inbox,
  ClipboardList,
  RefreshCw,
  AlertTriangle,
  Map as MapIcon,
  BarChart2,
  Users,
  Settings,
  MoreVertical,
  ChevronRight,
  CheckCircle2,
  Clock,
  LogOut
} from "lucide-react";
import policeEmblemImg from "@/assets/police-emblem.png";

const HeatmapMap = clientOnly(() =>
  import("@/components/site/HeatmapMap").then((m) => ({ default: m.HeatmapMap })),
);

// Design System Colors mapping to Tailwind arbitrary values
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

export function ModernPoliceDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { data: hotspots } = useHotspots();
  const { data: feedbacksData } = usePoliceAssignedFeedbacks();
  const [activeTab, setActiveTab] = useState("overview");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "PENDING" | "ASSIGNED" | "IN_PROGRESS" | "RESOLVED" | "REJECTED">("ALL");
  
  const acceptMut = useAcceptFeedback();
  const rejectMut = useRejectFeedback();
  const requestInfoMut = useRequestMoreInfo();
  const updateStatusMut = useUpdatePoliceFeedbackStatus();

  const [rejectingItem, setRejectingItem] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [requestInfoItem, setRequestInfoItem] = useState<any>(null);
  const [requestReason, setRequestReason] = useState("");

  const handleAccept = async (e: React.MouseEvent, id: number | string) => {
    e.stopPropagation();
    try {
      await acceptMut.mutateAsync(id);
      toast.success("Đã tiếp nhận phản ánh thành công");
      setFilterStatus("ASSIGNED");
    } catch (err) {
      toast.error("Không thể tiếp nhận phản ánh");
    }
  };

  const handleStartProcessing = async (e: React.MouseEvent, id: number | string) => {
    e.stopPropagation();
    try {
      await updateStatusMut.mutateAsync({ id, status: "IN_PROGRESS" });
      toast.success("Đã chuyển sang trạng thái Đang xử lý");
      setFilterStatus("IN_PROGRESS");
    } catch (err) {
      toast.error("Không thể cập nhật trạng thái");
    }
  };

  const handleRequestInfo = async () => {
    if (!requestReason.trim()) {
      toast.error("Vui lòng nhập thông tin cần bổ sung");
      return;
    }
    try {
      await requestInfoMut.mutateAsync({ id: requestInfoItem.id, reason: requestReason });
      toast.success("Đã gửi yêu cầu bổ sung thông tin");
      setRequestInfoItem(null);
      setRequestReason("");
      setFilterStatus("IN_PROGRESS");
    } catch (err) {
      toast.error("Không thể gửi yêu cầu");
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error("Vui lòng nhập lý do từ chối");
      return;
    }
    try {
      await rejectMut.mutateAsync({ id: rejectingItem.id, reason: rejectReason });
      toast.success("Đã từ chối phản ánh");
      setRejectingItem(null);
      setRejectReason("");
      setFilterStatus("REJECTED");
    } catch (err) {
      toast.error("Không thể từ chối phản ánh");
    }
  };
  
  // Real-time clock
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    try {
      await authApi.logout().catch(() => {});
    } finally {
      logout();
      navigate({ to: "/login" });
    }
  };

  // Filtered feedbacks
  const feedbacks = useMemo(() => feedbacksData || [], [feedbacksData]);

  // Calculate Stats
  const pendingCount = feedbacks.filter(
    (f) =>
      f.status === "PENDING" ||
      f.status === "PENDING_RECEIVE" ||
      f.status === "SUBMITTED" ||
      f.status === "NEED_LOCATION_REVIEW",
  ).length;
  const acceptedCount = feedbacks.filter((f) => f.status === "ASSIGNED").length;
  const inProgressCount = feedbacks.filter(
    (f) => f.status === "IN_PROGRESS" || f.status === "WAITING_INFO",
  ).length;
  const resolvedCount = feedbacks.filter((f) => f.status === "RESOLVED").length;
  const rejectedCount = feedbacks.filter((f) => f.status === "REJECTED").length;

  // Vụ việc ưu tiên: Lấy các phản ánh chưa hoàn thành, ưu tiên Critical/High hoặc mới nhất
  const priorityIncidents = useMemo(() => {
    return [...feedbacks]
      .filter((f) => f.status !== "RESOLVED" && f.status !== "REJECTED")
      .sort((a, b) => {
        const priorityScore = (p: string) => (p === "CRITICAL" ? 3 : p === "HIGH" ? 2 : 1);
        const diff = priorityScore(b.priority) - priorityScore(a.priority);
        if (diff !== 0) return diff;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .slice(0, 5); // Hiển thị 5 vụ việc
  }, [feedbacks]);

  // Dữ liệu cho tab Quản lý phản ánh
  const filteredForManage = useMemo(() => {
    return feedbacks.filter((f) => {
      if (filterStatus === "ALL") return true;
      if (filterStatus === "PENDING")
        return ["PENDING", "PENDING_RECEIVE", "SUBMITTED", "NEED_LOCATION_REVIEW"].includes(f.status);
      if (filterStatus === "ASSIGNED") return f.status === "ASSIGNED";
      if (filterStatus === "IN_PROGRESS") return ["IN_PROGRESS", "WAITING_INFO"].includes(f.status);
      if (filterStatus === "RESOLVED") return f.status === "RESOLVED";
      if (filterStatus === "REJECTED") return f.status === "REJECTED";
      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [feedbacks, filterStatus]);

  const [mapFilters, setMapFilters] = useState({
    traffic: true,
    security: true,
    fire: true,
  });

  const filteredHotspots = useMemo(() => {
    if (!hotspots) return [];
    
    // Nếu tất cả bộ lọc đều đang bật, hiển thị toàn bộ điểm nóng để đảm bảo bản đồ không bị mất màu
    if (mapFilters.traffic && mapFilters.security && mapFilters.fire) {
      return hotspots;
    }

    return hotspots.filter((h: any) => {
      const name = (h.categoryName || "").toLowerCase();
      const isTraffic = name.includes("giao thông") || name.includes("traffic") || name.includes("giao thong");
      const isSecurity = name.includes("an ninh") || name.includes("security") || name.includes("trật tự") || name.includes("công an");
      const isFire = name.includes("phòng cháy") || name.includes("chữa cháy") || name.includes("fire");
      
      if (isTraffic) return mapFilters.traffic;
      if (isSecurity) return mapFilters.security;
      if (isFire) return mapFilters.fire;
      
      return true; // Các vấn đề khác luôn hiển thị
    });
  }, [hotspots, mapFilters]);

  const menuItems = [
    { id: "overview", name: "Tổng quan", icon: Home },
    { id: "receive", name: "Tiếp nhận phản ánh", icon: Inbox },
    { id: "manage", name: "Quản lý phản ánh", icon: ClipboardList },
    { id: "tracking", name: "Theo dõi xử lý", icon: RefreshCw },
    { id: "overdue", name: "Phản ánh quá hạn", icon: AlertTriangle },
    { id: "hotspots", name: "Điểm nóng vi phạm", icon: MapIcon },
    { id: "reports", name: "Báo cáo thống kê", icon: BarChart2 },
    { id: "officers", name: "Quản lý cán bộ", icon: Users },
    { id: "settings", name: "Cấu hình hệ thống", icon: Settings },
  ];

  return (
    <div className="min-h-screen flex font-sans" style={{ backgroundColor: colors.background, color: colors.textPrimary }}>
      {/* LEFT SIDEBAR */}
      <aside className="w-[260px] flex flex-col shrink-0" style={{ backgroundColor: colors.primaryNavy }}>
        <div className="p-6 pb-4 border-b border-white/10 flex flex-col items-center">
          <img src={policeEmblemImg} alt="Emblem" className="w-16 h-16 object-contain mb-3 drop-shadow-md" />
          <h1 className="text-center font-bold text-[13px] text-white uppercase leading-snug w-full px-1">
            {user?.org || "CÔNG AN ĐÀ NẴNG"}
          </h1>
        </div>
        
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-sm font-medium transition-colors ${
                  isActive ? "text-white" : "text-slate-300 hover:text-white hover:bg-white/5"
                }`}
                style={{ backgroundColor: isActive ? colors.secondaryBlue : "transparent" }}
              >
                <Icon size={18} strokeWidth={2} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* MAIN CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* HEADER */}
        <header className="h-[90px] bg-white border-b px-6 flex items-center justify-between shrink-0 gap-6" style={{ borderColor: colors.border, fontFamily: 'Inter, sans-serif' }}>
          {/* LEFT SECTION */}
          <div className="flex-[2] xl:flex-[2.5] flex items-center gap-3 lg:gap-4 min-w-0">
            <img src={policeEmblemImg} alt="Police Emblem" className="w-[45px] h-[45px] lg:w-[50px] lg:h-[50px] object-contain drop-shadow-sm shrink-0" />
            <div className="flex flex-col min-w-0">
              <h2 className="text-[17px] md:text-[19px] lg:text-[21px] font-bold leading-tight truncate" style={{ color: colors.primaryNavy }}>
                {user?.org ? user.org.toUpperCase() : (user?.wardName ? `CÔNG AN ${user.wardType === 'COMMUNE' ? 'XÃ' : 'PHƯỜNG'} ${user.wardName.toUpperCase()}` : "CÔNG AN ĐỊA PHƯƠNG")}
              </h2>
              <span className="text-[12px] lg:text-[13px] font-medium mt-0.5 truncate hidden sm:block" style={{ color: colors.textSecondary }}>
                Hệ thống tiếp nhận và xử lý phản ánh người dân
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
                  <div className="marquee-text">Chúc các đồng chí một ngày làm việc hiệu quả, trách nhiệm, tận tâm phục vụ Nhân dân, góp phần giữ vững an ninh trật tự trên địa bàn.</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* CENTER SECTION */}
          <div className="flex-1 flex justify-center px-4 min-w-0">
            <div className="relative w-full max-w-[400px]">
              <input 
                type="text" 
                placeholder="Tìm kiếm phản ánh, hồ sơ..." 
                className="w-full h-10 pl-10 pr-4 rounded-[4px] border text-sm focus:outline-none focus:ring-1 bg-slate-50 transition-all"
                style={{ borderColor: colors.border }}
              />
              <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
            </div>
          </div>

          {/* RIGHT SECTION */}
          <div className="flex items-center justify-end gap-5 shrink-0">
            <div className="text-[13px] font-medium text-right leading-tight hidden lg:block whitespace-nowrap" style={{ color: colors.textSecondary }}>
              <div className="text-[14px]">{currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
              <div>{currentTime.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
            </div>
            <button className="relative p-2 rounded hover:bg-slate-50 transition-colors shrink-0" style={{ color: colors.primaryNavy }}>
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full border border-white" style={{ backgroundColor: colors.criticalRed }}></span>
            </button>
            <div className="flex items-center gap-3 pl-5 border-l shrink-0" style={{ borderColor: colors.border }}>
              <div className="text-right hidden sm:block whitespace-nowrap">
                <div className="text-sm font-bold leading-none">{user?.name || "Cán bộ trực ban"}</div>
                <div className="text-[11px] font-medium mt-1 uppercase tracking-wide" style={{ color: colors.textSecondary }}>
                  {user?.org || "Trực ban tác chiến"}
                </div>
              </div>
              <div className="w-10 h-10 rounded flex items-center justify-center text-white font-bold shrink-0" style={{ backgroundColor: colors.secondaryBlue }}>
                <User size={20} />
              </div>
              <button 
                onClick={handleLogout}
                className="w-10 h-10 rounded flex items-center justify-center text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
                title="Đăng xuất"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 p-6 overflow-y-auto">
          {activeTab === "overview" && (
            <div className="space-y-6 max-w-[1600px] mx-auto">
              
              {/* FIRST SECTION: OPERATION STATUS */}
              <div className="grid grid-cols-5 gap-4">
                {[
                  { id: "PENDING", label: "Phản ánh mới", value: pendingCount.toString(), icon: Inbox, color: colors.secondaryBlue, trend: "Chờ duyệt" },
                  { id: "ASSIGNED", label: "Đã tiếp nhận", value: acceptedCount.toString(), icon: ClipboardList, color: colors.primaryNavy, trend: "Đang phân công" },
                  { id: "IN_PROGRESS", label: "Đang xử lý", value: inProgressCount.toString(), icon: RefreshCw, color: colors.policeGold, trend: "Trong tiến độ" },
                  { id: "RESOLVED", label: "Đã hoàn thành", value: resolvedCount.toString(), icon: CheckCircle2, color: colors.successGreen, trend: "Đã đóng" },
                  { id: "REJECTED", label: "Đã từ chối", value: rejectedCount.toString(), icon: AlertTriangle, color: colors.criticalRed, trend: "Không hợp lệ" },
                ].map((stat, idx) => (
                  <div key={idx} 
                    onClick={() => { setFilterStatus(stat.id as any); setActiveTab("manage"); }}
                    className="bg-white rounded-[8px] p-4 border flex flex-col justify-between cursor-pointer hover:shadow-md hover:border-blue-300 transition-all group" 
                    style={{ borderColor: colors.border }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wider group-hover:text-blue-600 transition-colors" style={{ color: colors.textSecondary }}>{stat.label}</span>
                      <stat.icon size={16} style={{ color: stat.color }} className="group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="flex items-end justify-between mt-2">
                      <span className="text-3xl font-bold leading-none" style={{ color: colors.textPrimary }}>{stat.value}</span>
                      <span className="text-[11px] font-medium group-hover:text-blue-500 transition-colors" style={{ color: colors.textSecondary }}>{stat.trend}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* SECOND SECTION: Split Layout */}
              <div className="flex gap-6 h-[400px]">
                {/* 40% LEFT PANEL: PRIORITY INCIDENTS */}
                <div className="w-[40%] bg-white rounded-[8px] border flex flex-col" style={{ borderColor: colors.border }}>
                  <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: colors.border }}>
                    <h3 className="font-bold text-sm uppercase" style={{ color: colors.primaryNavy }}>Vụ việc ưu tiên</h3>
                    <button className="text-xs font-medium hover:underline" style={{ color: colors.secondaryBlue }}>Xem tất cả</button>
                  </div>
                  <div className="flex-1 overflow-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">Mã HS</th>
                          <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">Phân loại</th>
                          <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y" style={{ borderColor: colors.border }}>
                        {priorityIncidents.length > 0 ? (
                          priorityIncidents.map((row, i) => {
                            const isUrgent = row.priority === "CRITICAL" || row.priority === "HIGH";
                            return (
                              <tr key={i} className={`hover:bg-slate-50 ${isUrgent ? 'bg-red-50/30' : ''}`}>
                                <td className="px-4 py-3 font-medium" style={{ color: colors.primaryNavy }}>{row.trackingCode}</td>
                                <td className="px-4 py-3 text-slate-600">{row.categoryName}</td>
                                <td className="px-4 py-3">
                                  <span className="text-[11px] px-2 py-1 rounded-[4px] font-semibold" 
                                    style={{ 
                                      backgroundColor: isUrgent ? '#FEE2E2' : '#F1F5F9',
                                      color: isUrgent ? colors.criticalRed : colors.textSecondary 
                                    }}>
                                    {row.priority === "CRITICAL" ? "Khẩn cấp" : row.priority === "HIGH" ? "Ưu tiên" : "Bình thường"}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={3} className="px-4 py-8 text-center text-slate-500 text-sm">
                              Không có vụ việc nào đang chờ xử lý
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 60% RIGHT PANEL: HOTSPOT MAP */}
                <div className="w-[60%] bg-white rounded-[8px] border relative overflow-hidden flex flex-col" style={{ borderColor: colors.border }}>
                  <div className="absolute top-4 left-4 bg-white p-3 rounded-[8px] border shadow-sm z-10" style={{ borderColor: colors.border }}>
                    <h4 className="text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: colors.primaryNavy }}>Bộ lọc Bản đồ</h4>
                    <div className="space-y-2 text-xs">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={mapFilters.traffic} onChange={(e) => setMapFilters(prev => ({...prev, traffic: e.target.checked}))} /> Giao thông
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={mapFilters.security} onChange={(e) => setMapFilters(prev => ({...prev, security: e.target.checked}))} /> An ninh trật tự
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={mapFilters.fire} onChange={(e) => setMapFilters(prev => ({...prev, fire: e.target.checked}))} /> Phòng cháy chữa cháy
                      </label>
                    </div>
                  </div>
                  <Suspense
                    fallback={
                      <div className="w-full h-full flex items-center justify-center text-slate-500 font-medium">
                        Đang tải dữ liệu điểm nóng...
                      </div>
                    }
                  >
                    <div className="w-full flex-1">
                      <HeatmapMap hotspots={filteredHotspots} />
                    </div>
                  </Suspense>
                </div>
              </div>

              {/* THIRD SECTION: URGENT WORKBOARD */}
              <div>
                <h3 className="font-bold text-sm uppercase mb-4" style={{ color: colors.primaryNavy }}>Bảng việc khẩn cấp</h3>
                <div className="grid grid-cols-3 gap-6">
                  {/* Overdue */}
                  <div className="bg-white rounded-[8px] border p-4 border-t-4" style={{ borderColor: colors.border, borderTopColor: colors.criticalRed }}>
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle size={16} style={{ color: colors.criticalRed }} />
                      <h4 className="font-bold text-sm" style={{ color: colors.criticalRed }}>Quá hạn xử lý (3)</h4>
                    </div>
                    <div className="space-y-3">
                      <div className="p-3 bg-slate-50 rounded-[4px] border" style={{ borderColor: colors.border }}>
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-xs font-bold" style={{ color: colors.primaryNavy }}>PA-0998</span>
                          <span className="text-[10px] text-red-600 font-bold">Trễ 2 ngày</span>
                        </div>
                        <div className="text-xs text-slate-600 mb-2 truncate">Xả rác thải trái phép tại ngõ 24...</div>
                        <button className="w-full py-1.5 text-xs font-bold text-white rounded-[4px]" style={{ backgroundColor: colors.criticalRed }}>Xử lý ngay</button>
                      </div>
                    </div>
                  </div>

                  {/* Critical */}
                  <div className="bg-white rounded-[8px] border p-4 border-t-4" style={{ borderColor: colors.border, borderTopColor: colors.policeGold }}>
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle size={16} style={{ color: colors.policeGold }} />
                      <h4 className="font-bold text-sm" style={{ color: colors.policeGold }}>Nghiêm trọng (2)</h4>
                    </div>
                    <div className="space-y-3">
                      <div className="p-3 bg-slate-50 rounded-[4px] border" style={{ borderColor: colors.border }}>
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-xs font-bold" style={{ color: colors.primaryNavy }}>PA-1042</span>
                          <span className="text-[10px] text-amber-600 font-bold">Mới</span>
                        </div>
                        <div className="text-xs text-slate-600 mb-2 truncate">Gây rối trật tự công cộng...</div>
                        <button className="w-full py-1.5 text-xs font-bold text-white rounded-[4px]" style={{ backgroundColor: colors.primaryNavy }}>Phân công</button>
                      </div>
                    </div>
                  </div>

                  {/* Due Today */}
                  <div className="bg-white rounded-[8px] border p-4 border-t-4" style={{ borderColor: colors.border, borderTopColor: colors.secondaryBlue }}>
                    <div className="flex items-center gap-2 mb-3">
                      <Clock size={16} style={{ color: colors.secondaryBlue }} />
                      <h4 className="font-bold text-sm" style={{ color: colors.secondaryBlue }}>Đến hạn hôm nay (5)</h4>
                    </div>
                    <div className="space-y-3">
                      <div className="p-3 bg-slate-50 rounded-[4px] border" style={{ borderColor: colors.border }}>
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-xs font-bold" style={{ color: colors.primaryNavy }}>PA-1015</span>
                          <span className="text-[10px] text-blue-600 font-bold">16:00 hôm nay</span>
                        </div>
                        <div className="text-xs text-slate-600 mb-2 truncate">Lấn chiếm vỉa hè...</div>
                        <button className="w-full py-1.5 text-xs font-bold bg-white border rounded-[4px]" style={{ color: colors.primaryNavy, borderColor: colors.border }}>Cập nhật tiến độ</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}
          {activeTab === "manage" && (
            <div className="max-w-[1600px] mx-auto bg-white rounded-[8px] border shadow-sm p-6" style={{ borderColor: colors.border }}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold" style={{ color: colors.primaryNavy }}>Quản lý phản ánh</h3>
                  <p className="text-sm text-slate-500 mt-1">Danh sách hồ sơ phản ánh hiện tại trên địa bàn</p>
                </div>
                <div className="flex gap-2">
                  <select 
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="h-9 px-3 border rounded-[4px] text-sm focus:outline-none focus:ring-1 bg-slate-50"
                  >
                    <option value="ALL">Tất cả trạng thái</option>
                    <option value="PENDING">Chờ duyệt / Mới</option>
                    <option value="ASSIGNED">Đã tiếp nhận</option>
                    <option value="IN_PROGRESS">Đang xử lý</option>
                    <option value="RESOLVED">Đã hoàn thành</option>
                    <option value="REJECTED">Đã từ chối</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto border rounded-[4px]">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-slate-600">Mã HS</th>
                      <th className="px-4 py-3 font-semibold text-slate-600">Tiêu đề</th>
                      <th className="px-4 py-3 font-semibold text-slate-600">Phân loại</th>
                      <th className="px-4 py-3 font-semibold text-slate-600">Người phản ánh</th>
                      <th className="px-4 py-3 font-semibold text-slate-600">Ngày gửi</th>
                      <th className="px-4 py-3 font-semibold text-slate-600">Trạng thái</th>
                      <th className="px-4 py-3 font-semibold text-slate-600">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: colors.border }}>
                    {filteredForManage.length > 0 ? (
                      filteredForManage.map((item, idx) => {
                        const statusLabel = 
                          item.status === 'RESOLVED' ? 'Hoàn thành' :
                          item.status === 'REJECTED' ? 'Từ chối' :
                          item.status === 'WAITING_INFO' ? 'Chờ bổ sung' :
                          item.status === 'IN_PROGRESS' ? 'Đang xử lý' :
                          item.status === 'ASSIGNED' ? 'Đã tiếp nhận' :
                          'Chờ duyệt';
                        
                        const statusClass = 
                          item.status === 'RESOLVED' ? 'bg-green-100 text-green-700' :
                          item.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                          item.status === 'WAITING_INFO' ? 'bg-purple-100 text-purple-700' :
                          item.status === 'IN_PROGRESS' ? 'bg-orange-100 text-orange-700' :
                          item.status === 'ASSIGNED' ? 'bg-blue-100 text-blue-700' :
                          'bg-slate-100 text-slate-700';

                        return (
                          <tr 
                            key={idx} 
                            onClick={() => navigate({ to: "/authority/feedback/$feedbackId", params: { feedbackId: String(item.id) } })}
                            className="hover:bg-slate-50 cursor-pointer transition-colors"
                          >
                            <td className="px-4 py-3 font-bold" style={{ color: colors.secondaryBlue }}>{item.trackingCode}</td>
                            <td className="px-4 py-3 max-w-[250px] truncate font-medium text-slate-800" title={item.title}>{item.title}</td>
                            <td className="px-4 py-3 text-slate-600">{item.categoryName}</td>
                            <td className="px-4 py-3 text-slate-600">{item.citizenName || 'Ẩn danh'}</td>
                            <td className="px-4 py-3 text-slate-600">{new Date(item.createdAt).toLocaleDateString('vi-VN')}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-[4px] text-[11px] font-semibold ${statusClass}`}>
                                {statusLabel}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {["PENDING", "PENDING_RECEIVE", "SUBMITTED", "NEED_LOCATION_REVIEW"].includes(item.status) && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={(e) => handleAccept(e, item.id)}
                                    disabled={acceptMut.isPending}
                                    className="px-2 py-1 bg-blue-600 text-white text-[11px] font-bold rounded hover:bg-blue-700 disabled:opacity-50"
                                  >
                                    Tiếp nhận
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setRejectingItem(item); }}
                                    className="px-2 py-1 bg-red-100 text-red-600 text-[11px] font-bold rounded hover:bg-red-200"
                                  >
                                    Từ chối
                                  </button>
                                </div>
                              )}
                              {item.status === "ASSIGNED" && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={(e) => handleStartProcessing(e, item.id)}
                                    disabled={updateStatusMut.isPending}
                                    className="px-2 py-1 bg-amber-500 text-white text-[11px] font-bold rounded hover:bg-amber-600 disabled:opacity-50"
                                  >
                                    Xử lý ngay
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setRequestInfoItem(item); }}
                                    className="px-2 py-1 bg-slate-100 text-slate-700 text-[11px] font-bold rounded hover:bg-slate-200"
                                  >
                                    Hỏi thêm
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                          Không có dữ liệu phản ánh nào cho trạng thái này.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {activeTab !== "overview" && activeTab !== "manage" && (
            <div className="flex items-center justify-center h-full text-slate-400">
              Chức năng đang được cập nhật theo giao diện mới...
            </div>
          )}
        </main>
      </div>

      {/* Reject Dialog */}
      <Dialog open={!!rejectingItem} onOpenChange={(open) => !open && setRejectingItem(null)}>
        <DialogContent className="bg-white rounded-[8px] p-6 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold" style={{ color: colors.primaryNavy }}>Từ chối phản ánh</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-slate-600 mb-2">Vui lòng nhập lý do từ chối phản ánh này. Người dân sẽ nhận được thông báo kèm lý do này.</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Nhập lý do từ chối..."
              className="w-full min-h-[100px] p-3 border rounded-[4px] text-sm focus:outline-none focus:ring-1 bg-slate-50"
              style={{ borderColor: colors.border }}
            />
          </div>
          <DialogFooter className="flex justify-end gap-3">
            <button
              onClick={() => setRejectingItem(null)}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-[4px] hover:bg-slate-200"
            >
              Hủy
            </button>
            <button
              onClick={handleReject}
              disabled={rejectMut.isPending}
              className="px-4 py-2 text-sm font-bold text-white rounded-[4px] disabled:opacity-50"
              style={{ backgroundColor: colors.criticalRed }}
            >
              {rejectMut.isPending ? "Đang xử lý..." : "Xác nhận từ chối"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Info Dialog */}
      <Dialog open={!!requestInfoItem} onOpenChange={(open) => !open && setRequestInfoItem(null)}>
        <DialogContent className="bg-white rounded-[8px] p-6 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold" style={{ color: colors.secondaryBlue }}>Yêu cầu bổ sung thông tin</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-slate-600 mb-2">Nhập chi tiết thông tin bạn cần người dân cung cấp thêm để có thể xử lý phản ánh này. Người dân sẽ nhận được thông báo ngay lập tức.</p>
            <textarea
              value={requestReason}
              onChange={(e) => setRequestReason(e.target.value)}
              placeholder="VD: Vui lòng cung cấp thêm hình ảnh rõ biển số xe..."
              className="w-full min-h-[100px] p-3 border rounded-[4px] text-sm focus:outline-none focus:ring-1 bg-slate-50"
              style={{ borderColor: colors.border }}
            />
          </div>
          <DialogFooter className="flex justify-end gap-3">
            <button
              onClick={() => setRequestInfoItem(null)}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-[4px] hover:bg-slate-200"
            >
              Hủy
            </button>
            <button
              onClick={handleRequestInfo}
              disabled={requestInfoMut.isPending}
              className="px-4 py-2 text-sm font-bold text-white rounded-[4px] disabled:opacity-50"
              style={{ backgroundColor: colors.secondaryBlue }}
            >
              {requestInfoMut.isPending ? "Đang gửi..." : "Gửi yêu cầu"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
