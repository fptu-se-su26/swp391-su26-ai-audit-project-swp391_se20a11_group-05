import React, { useState, Suspense, useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { useHotspots } from "@/hooks";
import { clientOnly } from "@/components/ClientOnly";
import { Link, useNavigate } from "@tanstack/react-router";
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
  Clock
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
  const { user } = useAuth();
  const { data: hotspots } = useHotspots();
  const [activeTab, setActiveTab] = useState("overview");

  const [mapFilters, setMapFilters] = useState({
    traffic: true,
    security: true,
    fire: true,
  });

  const filteredHotspots = useMemo(() => {
    if (!hotspots) return [];
    return hotspots.filter((h: any) => {
      const name = (h.categoryName || "").toLowerCase();
      const isTraffic = name.includes("giao thông") || name.includes("traffic") || name.includes("giao thong");
      const isSecurity = name.includes("an ninh") || name.includes("security") || name.includes("trật tự") || name.includes("công an");
      const isFire = name.includes("phòng cháy") || name.includes("chữa cháy") || name.includes("fire");
      
      if (isTraffic) return mapFilters.traffic;
      if (isSecurity) return mapFilters.security;
      if (isFire) return mapFilters.fire;
      
      return mapFilters.traffic && mapFilters.security && mapFilters.fire; // If all checked, show others too, otherwise hide
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
        <div className="p-6 pb-2 border-b border-white/10 flex flex-col items-center">
          <img src={policeEmblemImg} alt="Emblem" className="w-16 h-16 object-contain mb-3 drop-shadow-md" />
          <h1 className="text-center font-bold text-sm tracking-wide text-white uppercase leading-tight px-2">
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
        <header className="h-[72px] bg-white border-b px-6 flex items-center justify-between shrink-0" style={{ borderColor: colors.border }}>
          <div className="flex-1 flex items-center">
            <div className="flex flex-col">
              <h2 className="text-lg font-bold" style={{ color: colors.primaryNavy }}>Hệ thống tiếp nhận và xử lý phản ánh người dân</h2>
              <span className="text-xs font-medium uppercase tracking-wider" style={{ color: colors.textSecondary }}>Cổng thông tin nội bộ</span>
            </div>
          </div>
          
          <div className="flex-1 flex justify-center">
            <div className="relative w-full max-w-md">
              <input 
                type="text" 
                placeholder="Tra cứu mã hồ sơ, số điện thoại, biển số xe..." 
                className="w-full h-10 pl-10 pr-4 rounded-[8px] border text-sm focus:outline-none focus:ring-1 bg-slate-50"
                style={{ borderColor: colors.border }}
              />
              <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
            </div>
          </div>

          <div className="flex-1 flex items-center justify-end gap-5">
            <div className="text-sm font-medium" style={{ color: colors.textSecondary }}>
              {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            <button className="relative p-2 rounded-[8px] hover:bg-slate-50 transition-colors" style={{ color: colors.primaryNavy }}>
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ backgroundColor: colors.criticalRed }}></span>
            </button>
            <div className="flex items-center gap-3 pl-5 border-l" style={{ borderColor: colors.border }}>
              <div className="text-right hidden md:block">
                <div className="text-sm font-bold leading-none">{user?.name || "Thiếu tá Nguyễn Văn A"}</div>
                <div className="text-[11px] font-medium mt-1 uppercase tracking-wide" style={{ color: colors.textSecondary }}>
                  {user?.org || "Trực ban tác chiến"}
                </div>
              </div>
              <div className="w-10 h-10 rounded-[8px] flex items-center justify-center text-white font-bold" style={{ backgroundColor: colors.secondaryBlue }}>
                <User size={20} />
              </div>
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
                  { label: "Phản ánh mới", value: "24", icon: Inbox, color: colors.secondaryBlue, trend: "+3 hnay" },
                  { label: "Đã tiếp nhận", value: "12", icon: ClipboardList, color: colors.primaryNavy, trend: "Đang phân công" },
                  { label: "Đang xử lý", value: "8", icon: RefreshCw, color: colors.policeGold, trend: "Trong tiến độ" },
                  { label: "Đã hoàn thành", value: "156", icon: CheckCircle2, color: colors.successGreen, trend: "Tháng này" },
                  { label: "Quá hạn", value: "3", icon: AlertTriangle, color: colors.criticalRed, trend: "Cần chú ý" },
                ].map((stat, idx) => (
                  <div key={idx} className="bg-white rounded-[8px] p-4 border flex flex-col justify-between" style={{ borderColor: colors.border }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textSecondary }}>{stat.label}</span>
                      <stat.icon size={16} style={{ color: stat.color }} />
                    </div>
                    <div className="flex items-end justify-between mt-2">
                      <span className="text-3xl font-bold leading-none" style={{ color: colors.textPrimary }}>{stat.value}</span>
                      <span className="text-[11px] font-medium" style={{ color: colors.textSecondary }}>{stat.trend}</span>
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
                        {[
                          { id: "PA-1042", cat: "An ninh trật tự", status: "Nghiêm trọng", urgent: true },
                          { id: "PA-1041", cat: "Tai nạn giao thông", status: "Cần xử lý", urgent: true },
                          { id: "PA-1040", cat: "Trật tự đô thị", status: "Mới tiếp nhận", urgent: false },
                          { id: "PA-1039", cat: "Môi trường", status: "Đang xử lý", urgent: false },
                        ].map((row, i) => (
                          <tr key={i} className={`hover:bg-slate-50 ${row.urgent ? 'bg-red-50/30' : ''}`}>
                            <td className="px-4 py-3 font-medium" style={{ color: colors.primaryNavy }}>{row.id}</td>
                            <td className="px-4 py-3 text-slate-600">{row.cat}</td>
                            <td className="px-4 py-3">
                              <span className="text-[11px] px-2 py-1 rounded-[4px] font-semibold" 
                                style={{ 
                                  backgroundColor: row.urgent ? '#FEE2E2' : '#F1F5F9',
                                  color: row.urgent ? colors.criticalRed : colors.textSecondary 
                                }}>
                                {row.status}
                              </span>
                            </td>
                          </tr>
                        ))}
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
                    <div className="w-full h-full">
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
          {activeTab !== "overview" && (
            <div className="flex items-center justify-center h-full text-slate-400">
              Chức năng đang được cập nhật theo giao diện mới...
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
