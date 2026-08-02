import React, { useState, Suspense, useMemo, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import {
  useHotspots,
  usePoliceAssignedFeedbacks,
  useAcceptFeedback,
  useRejectFeedback,
  useRequestMoreInfo,
  useUpdatePoliceFeedbackStatus,
  useSubmitPoliceFeedbackResult,
} from "@/hooks";
import { clientOnly } from "@/components/ClientOnly";
import { Link, useNavigate } from "@tanstack/react-router";
import { authApi, policeApi } from "@/lib/api";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  LogOut,
  Key,
  Eye,
  EyeOff,
  Flag,
  Camera,
  Calendar,
  ExternalLink,
  Layers,
  Sparkles,
} from "lucide-react";
import policeEmblemImg from "@/assets/police-emblem.png";
import { PoliceCampaignPage } from "./PoliceCampaignPage";
import { FeedbackDetailPageComponent } from "@/routes/_auth.authority.feedback.$feedbackId";
import { PoliceStatisticalReports } from "./PoliceStatisticalReports";

const HeatmapMap = clientOnly(
  () => import("@/components/site/HeatmapMap").then((m) => ({ default: m.HeatmapMap })) as any,
) as any;
const initialSchedule = [
  {
    day: "Thứ 2",
    date: "29/06",
    morning: "Trực ban hành chính",
    mOfficer: "Đ/c Nguyễn Văn A",
    afternoon: "Xử lý hồ sơ",
    aOfficer: "Đ/c Lê Thị B",
    night: "Trực ban",
    nOfficer: "Đ/c Lê Thị B",
  },
  {
    day: "Thứ 3",
    date: "30/06",
    morning: "Tuần tra địa bàn",
    mOfficer: "Đ/c Phạm Văn C, Đ/c Võ D",
    afternoon: "Tuần tra địa bàn",
    aOfficer: "Đ/c Phạm Văn C, Đ/c Võ D",
    night: "Trực chỉ huy",
    nOfficer: "Đ/c Hoàng Văn E",
  },
  {
    day: "Thứ 4",
    date: "01/07",
    morning: "Trực ban hành chính",
    mOfficer: "Đ/c Lê Thị B",
    afternoon: "Tiếp công dân",
    aOfficer: "Đ/c Nguyễn Văn A",
    night: "Tuần tra đêm",
    nOfficer: "Đ/c Trần H",
  },
  {
    day: "Thứ 5",
    date: "02/07",
    morning: "Xử lý hồ sơ",
    mOfficer: "Đ/c Trần H",
    afternoon: "Tiếp công dân",
    aOfficer: "Đ/c Nguyễn Văn A",
    night: "Trực chỉ huy",
    nOfficer: "Đ/c Đặng L",
  },
  {
    day: "Thứ 6",
    date: "03/07",
    morning: "Họp giao ban",
    mOfficer: "Toàn Đội",
    afternoon: "Trực ban hành chính",
    aOfficer: "Đ/c Lê Thị B",
    night: "Tuần tra đêm",
    nOfficer: "Đ/c Phạm Văn C, Đ/c Trần H",
  },
  {
    day: "Thứ 7",
    date: "04/07",
    morning: "Trực ban cuối tuần",
    mOfficer: "Đ/c Hoàng Văn E",
    afternoon: "Tuần tra địa bàn",
    aOfficer: "Đ/c Võ D",
    night: "Trực ban",
    nOfficer: "Đ/c Đặng L",
  },
  {
    day: "Chủ nhật",
    date: "05/07",
    morning: "Trực ban",
    mOfficer: "Đ/c Đặng L",
    afternoon: "Trực ban",
    aOfficer: "Đ/c Đặng L",
    night: "Tuần tra đêm",
    nOfficer: "Đ/c Trần H",
  },
];

const DutyRoster = ({ onSave }: { onSave?: () => void }) => {
  const [view, setView] = useState<"week" | "month" | "year">("week");
  const [isEditing, setIsEditing] = useState(false);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);

  const getMondayKey = (offset: number) => {
    const today = new Date();
    const dayOfWeek = today.getDay() || 7;
    const diff = today.getDate() - dayOfWeek + 1 + offset * 7;
    const monday = new Date(today.getFullYear(), today.getMonth(), diff);
    return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, "0")}-${String(monday.getDate()).padStart(2, "0")}`;
  };

  useEffect(() => {
    if (view === "week") {
      const key = getMondayKey(weekOffset);

      policeApi
        .getSchedule(key)
        .then((res) => {
          if (res?.data?.scheduleData) {
            try {
              setSchedule(JSON.parse(res.data.scheduleData));
              return;
            } catch (e) {
              console.error("Failed to parse backend schedule", e);
            }
          }

          // Fallback to local storage (if any) or fallback to initial template
          const localSaved = localStorage.getItem(`police_schedule_week_${key}`);
          if (localSaved) {
            try {
              setSchedule(JSON.parse(localSaved));
              return;
            } catch (e) {
              // ignore
            }
          }

          // Generate from template
          const parts = key.split("-");
          const year = parseInt(parts[0]);
          const month = parseInt(parts[1]) - 1;
          const dateStr = parseInt(parts[2]);
          const monday = new Date(year, month, dateStr);

          const defaultSchedule = initialSchedule.map((row, idx) => {
            const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + idx);
            const dayStr = String(d.getDate()).padStart(2, "0");
            const monthStr = String(d.getMonth() + 1).padStart(2, "0");
            return { ...row, date: `${dayStr}/${monthStr}` };
          });
          setSchedule(defaultSchedule);
        })
        .catch((err) => {
          console.error("Failed to fetch schedule from backend", err);

          // Fallback to local storage or template
          const localSaved = localStorage.getItem(`police_schedule_week_${key}`);
          if (localSaved) {
            try {
              setSchedule(JSON.parse(localSaved));
              return;
            } catch (e) {
              // ignore
            }
          }

          const parts = key.split("-");
          const year = parseInt(parts[0]);
          const month = parseInt(parts[1]) - 1;
          const dateStr = parseInt(parts[2]);
          const monday = new Date(year, month, dateStr);

          const defaultSchedule = initialSchedule.map((row, idx) => {
            const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + idx);
            const dayStr = String(d.getDate()).padStart(2, "0");
            const monthStr = String(d.getMonth() + 1).padStart(2, "0");
            return { ...row, date: `${dayStr}/${monthStr}` };
          });
          setSchedule(defaultSchedule);
        });
    }
  }, [weekOffset, view]);

  return (
    <div
      className="max-w-[1600px] mx-auto bg-white rounded-[8px] border shadow-sm p-6"
      style={{ borderColor: "#D9E1EC" }}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h3 className="text-lg font-bold" style={{ color: "#0B1F4D" }}>
            Lịch phân công trực công tác
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý và theo dõi lịch trực ban, tuần tra, họp giao ban của đơn vị
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center">
          {view === "week" && (
            <div className="flex items-center bg-slate-100 rounded-[6px] p-1 gap-1 shrink-0">
              <button
                onClick={() => setWeekOffset((w) => w - 1)}
                className="p-1 hover:bg-white rounded shadow-sm text-slate-600 transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-bold px-2 text-slate-700 min-w-[70px] text-center">
                {weekOffset === 0
                  ? "Tuần này"
                  : weekOffset === 1
                    ? "Tuần sau"
                    : weekOffset === -1
                      ? "Tuần trước"
                      : weekOffset > 0
                        ? `+${weekOffset} Tuần`
                        : `${weekOffset} Tuần`}
              </span>
              <button
                onClick={() => setWeekOffset((w) => w + 1)}
                className="p-1 hover:bg-white rounded shadow-sm text-slate-600 transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
          {view === "week" && (
            <button
              onClick={async () => {
                if (isEditing) {
                  const key = getMondayKey(weekOffset);
                  const scheduleStr = JSON.stringify(schedule);

                  localStorage.setItem(`police_schedule_week_${key}`, scheduleStr);

                  try {
                    await policeApi.saveSchedule(key, scheduleStr);
                    toast.success("Đã lưu lịch phân công trực vào cơ sở dữ liệu thành công!");
                    if (onSave) onSave();
                  } catch (err) {
                    console.error("Failed to save schedule to database", err);
                    toast.error("Không thể lưu vào cơ sở dữ liệu. Đã lưu tạm ở trình duyệt.");
                    if (onSave) onSave();
                  }
                }
                setIsEditing(!isEditing);
              }}
              className={`px-4 py-1.5 text-sm font-bold rounded-[4px] transition-all ${isEditing ? "bg-green-600 text-white hover:bg-green-700" : "bg-white border text-blue-600 hover:bg-blue-50"}`}
              style={!isEditing ? { borderColor: "#D9E1EC" } : {}}
            >
              {isEditing ? "Lưu lịch trực" : "Sửa lịch trực"}
            </button>
          )}
          <div className="flex gap-1 bg-slate-100 p-1 rounded-[6px] shrink-0">
            <button
              onClick={() => setView("week")}
              className={`px-4 py-1.5 text-sm font-medium rounded-[4px] transition-all ${view === "week" ? "bg-white shadow-sm text-[#0B1F4D]" : "text-slate-500 hover:text-slate-700"}`}
            >
              Theo Tuần
            </button>
            <button
              onClick={() => setView("month")}
              className={`px-4 py-1.5 text-sm font-medium rounded-[4px] transition-all ${view === "month" ? "bg-white shadow-sm text-[#0B1F4D]" : "text-slate-500 hover:text-slate-700"}`}
            >
              Theo Tháng
            </button>
            <button
              onClick={() => setView("year")}
              className={`px-4 py-1.5 text-sm font-medium rounded-[4px] transition-all ${view === "year" ? "bg-white shadow-sm text-[#0B1F4D]" : "text-slate-500 hover:text-slate-700"}`}
            >
              Theo Năm
            </button>
          </div>
        </div>
      </div>

      {view === "week" && (
        <div className="border rounded-[8px] overflow-hidden" style={{ borderColor: "#D9E1EC" }}>
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-[12px] font-semibold text-slate-600 uppercase border-b border-r w-32">
                  Thứ / Ngày
                </th>
                <th className="px-4 py-3 text-[12px] font-semibold text-slate-600 uppercase border-b border-r text-center">
                  Ca Sáng
                  <br />
                  <span className="text-[10px] font-normal text-slate-400">07:30 - 11:30</span>
                </th>
                <th className="px-4 py-3 text-[12px] font-semibold text-slate-600 uppercase border-b border-r text-center">
                  Ca Chiều
                  <br />
                  <span className="text-[10px] font-normal text-slate-400">13:30 - 17:30</span>
                </th>
                <th className="px-4 py-3 text-[12px] font-semibold text-slate-600 uppercase border-b text-center">
                  Ca Đêm
                  <br />
                  <span className="text-[10px] font-normal text-slate-400">17:30 - 07:30</span>
                </th>
              </tr>
            </thead>
            <tbody className="text-[13px]">
              {schedule.map((row, idx) => (
                <tr key={idx} className="border-b last:border-b-0 hover:bg-slate-50/50">
                  <td className="px-4 py-4 border-r bg-slate-50/30">
                    <div className="font-bold text-slate-700 text-sm">{row.day}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{row.date}</div>
                  </td>
                  <td className="px-4 py-4 border-r text-center align-top">
                    {row.morning !== "-" ? (
                      <div className="flex flex-col items-center">
                        <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 rounded-[4px] font-medium border border-blue-100 mb-1.5">
                          {row.morning}
                        </span>
                        {isEditing ? (
                          <input
                            type="text"
                            value={row.mOfficer}
                            onChange={(e) => {
                              const newSch = [...schedule];
                              newSch[idx].mOfficer = e.target.value;
                              setSchedule(newSch);
                            }}
                            className="w-full text-[11px] font-semibold text-slate-700 text-center border rounded px-1 py-1 focus:ring-1 focus:outline-none"
                            placeholder="Tên cán bộ..."
                          />
                        ) : (
                          <span className="text-[11px] font-semibold text-slate-600 max-w-[120px] text-center">
                            {row.mOfficer}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="px-4 py-4 border-r text-center align-top">
                    {row.afternoon !== "-" ? (
                      <div className="flex flex-col items-center">
                        <span className="inline-block px-3 py-1 bg-amber-50 text-amber-700 rounded-[4px] font-medium border border-amber-100 mb-1.5">
                          {row.afternoon}
                        </span>
                        {isEditing ? (
                          <input
                            type="text"
                            value={row.aOfficer}
                            onChange={(e) => {
                              const newSch = [...schedule];
                              newSch[idx].aOfficer = e.target.value;
                              setSchedule(newSch);
                            }}
                            className="w-full text-[11px] font-semibold text-slate-700 text-center border rounded px-1 py-1 focus:ring-1 focus:outline-none"
                            placeholder="Tên cán bộ..."
                          />
                        ) : (
                          <span className="text-[11px] font-semibold text-slate-600 max-w-[120px] text-center">
                            {row.aOfficer}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center align-top">
                    {row.night !== "-" ? (
                      <div className="flex flex-col items-center">
                        <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 rounded-[4px] font-medium border border-indigo-100 mb-1.5">
                          {row.night}
                        </span>
                        {isEditing ? (
                          <input
                            type="text"
                            value={row.nOfficer}
                            onChange={(e) => {
                              const newSch = [...schedule];
                              newSch[idx].nOfficer = e.target.value;
                              setSchedule(newSch);
                            }}
                            className="w-full text-[11px] font-semibold text-slate-700 text-center border rounded px-1 py-1 focus:ring-1 focus:outline-none"
                            placeholder="Tên cán bộ..."
                          />
                        ) : (
                          <span className="text-[11px] font-semibold text-slate-600 max-w-[120px] text-center">
                            {row.nOfficer}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {view === "month" && (
        <div className="border rounded-[8px] p-6" style={{ borderColor: "#D9E1EC" }}>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-bold text-slate-700">Tháng 6 / 2026</h4>
            <div className="flex gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-blue-100 border border-blue-200"></div> Hành
                chính
              </span>
              <span className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-indigo-100 border border-indigo-200"></div>{" "}
                Trực đêm
              </span>
              <span className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-amber-100 border border-amber-200"></div> Tuần
                tra
              </span>
            </div>
          </div>
          <div
            className="grid grid-cols-7 gap-px bg-slate-200 rounded-[8px] overflow-hidden border"
            style={{ borderColor: "#D9E1EC" }}
          >
            {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((d) => (
              <div
                key={d}
                className="bg-slate-50 font-bold text-sm text-slate-600 py-3 text-center"
              >
                {d}
              </div>
            ))}
            {Array.from({ length: 30 }).map((_, i) => (
              <div
                key={i}
                className={`bg-white h-28 p-2 flex flex-col hover:bg-slate-50 transition-colors ${i === 14 ? "bg-blue-50/30" : ""}`}
              >
                <span
                  className={`text-xs font-bold self-end w-6 h-6 flex items-center justify-center rounded-full ${i === 14 ? "bg-blue-600 text-white" : "text-slate-600"}`}
                >
                  {i + 1}
                </span>
                <div className="flex flex-col gap-1 mt-auto">
                  {i % 4 === 0 && (
                    <span
                      className="text-[10px] bg-blue-50 text-blue-700 border border-blue-100 p-1 rounded-[4px] truncate leading-tight font-medium"
                      title="Đ/c Nguyễn Văn A"
                    >
                      Hành chính - Đ/c A
                    </span>
                  )}
                  {i % 6 === 2 && (
                    <span
                      className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100 p-1 rounded-[4px] truncate leading-tight font-medium"
                      title="Đ/c Trần H"
                    >
                      Trực đêm - Đ/c H
                    </span>
                  )}
                  {i % 5 === 3 && (
                    <span
                      className="text-[10px] bg-amber-50 text-amber-700 border border-amber-100 p-1 rounded-[4px] truncate leading-tight font-medium"
                      title="Đ/c Võ D"
                    >
                      Tuần tra - Đ/c D
                    </span>
                  )}
                </div>
              </div>
            ))}
            {/* Empty padding for the rest of the calendar grid (if 30 days start on Monday, ends on Tuesday, need 5 more days) */}
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={"empty" + i} className="bg-slate-50 h-28 p-2 opacity-50"></div>
            ))}
          </div>
        </div>
      )}
      {view === "year" && (
        <div className="border rounded-[8px] p-6" style={{ borderColor: "#D9E1EC" }}>
          <h4 className="text-lg font-bold text-slate-700 mb-6 text-center uppercase tracking-wide">
            Thống Kê Ca Trực Năm 2026
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="border rounded-[8px] p-4 bg-slate-50 flex flex-col items-center hover:shadow-md transition-shadow cursor-pointer hover:border-blue-300 group"
              >
                <span className="font-bold text-lg text-slate-700 group-hover:text-blue-700 transition-colors">
                  Tháng {i + 1}
                </span>
                <div className="mt-3 w-full bg-white border rounded-[6px] p-3 text-center">
                  <div className="text-2xl font-black text-slate-800">{15 + (i % 4) * 5}</div>
                  <div className="text-[11px] font-medium text-slate-500 uppercase mt-1">
                    Tổng ca trực
                  </div>
                </div>
                <div className="flex w-full gap-2 mt-2">
                  <div className="flex-1 bg-white border rounded-[4px] p-1.5 text-center">
                    <div className="text-sm font-bold text-blue-600">{10 + (i % 3) * 2}</div>
                    <div className="text-[9px] text-slate-500">SÁNG</div>
                  </div>
                  <div className="flex-1 bg-white border rounded-[4px] p-1.5 text-center">
                    <div className="text-sm font-bold text-indigo-600">{5 + (i % 2) * 3}</div>
                    <div className="text-[9px] text-slate-500">ĐÊM</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

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

export type Reminder = {
  id: string;
  title: string;
  desc: string;
  startHour: number;
  endHour: number;
  iconName: "Users" | "Clock" | "ClipboardList" | "CheckCircle2" | "AlertTriangle" | "RefreshCw";
  isUrgent: boolean;
};

const DEFAULT_REMINDERS: Reminder[] = [
  {
    id: "1",
    title: "Giờ làm việc buổi sáng",
    desc: "Bắt đầu ca làm việc hành chính. Các đồng chí kiểm tra, giao nhận ca trực và trang thiết bị.",
    startHour: 7,
    endHour: 8,
    iconName: "Users",
    isUrgent: true,
  },
  {
    id: "2",
    title: "Giờ ăn trưa và nghỉ ngơi",
    desc: "Đã đến giờ nghỉ trưa. Chúc các đồng chí ngon miệng. Đội trực ban chú ý vị trí.",
    startHour: 11,
    endHour: 13,
    iconName: "Clock",
    isUrgent: false,
  },
  {
    id: "3",
    title: "Giờ làm việc buổi chiều",
    desc: "Bắt đầu ca làm việc chiều. Vui lòng kiểm tra các phản ánh mới.",
    startHour: 13,
    endHour: 14,
    iconName: "ClipboardList",
    isUrgent: true,
  },
  {
    id: "4",
    title: "Kết thúc ca hành chính",
    desc: "Chuẩn bị bàn giao ca cho đội trực ban đêm. Kiểm tra lại hồ sơ.",
    startHour: 17,
    endHour: 18,
    iconName: "CheckCircle2",
    isUrgent: true,
  },
  {
    id: "5",
    title: "Tuần tra địa bàn ban đêm",
    desc: "Đến giờ đi tuần tra kiểm soát ANTT. Yêu cầu bật định vị trên thiết bị.",
    startHour: 20,
    endHour: 22,
    iconName: "AlertTriangle",
    isUrgent: true,
  },
];

const iconMap = {
  Users,
  Clock,
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
};

export function ModernPoliceDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  // Load today's active duty officer name
  const [currentDutyOfficerName, setCurrentDutyOfficerName] = useState<string>("");
  const [currentWeekSchedule, setCurrentWeekSchedule] = useState<any[]>([]);

  const fetchCurrentWeekSchedule = () => {
    const today = new Date();
    const dayOfWeek = today.getDay() || 7;
    const diff = today.getDate() - dayOfWeek + 1;
    const monday = new Date(today.getFullYear(), today.getMonth(), diff);
    const key = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, "0")}-${String(monday.getDate()).padStart(2, "0")}`;

    policeApi
      .getSchedule(key)
      .then((res) => {
        let activeSchedule = null;
        if (res?.data?.scheduleData) {
          try {
            activeSchedule = JSON.parse(res.data.scheduleData);
          } catch (e) {
            console.error("Failed to parse schedule", e);
          }
        }

        if (!activeSchedule) {
          const localSaved = localStorage.getItem(`police_schedule_week_${key}`);
          if (localSaved) {
            try {
              activeSchedule = JSON.parse(localSaved);
            } catch (e) {}
          }
        }

        if (activeSchedule && Array.isArray(activeSchedule)) {
          setCurrentWeekSchedule(activeSchedule);
          const now = new Date();
          const days = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
          const todayDayName = days[now.getDay()];
          const todayRow = activeSchedule.find((s: any) => s.day === todayDayName);

          if (todayRow) {
            const hour = now.getHours();
            let currentOfficer = "";
            if (hour >= 7 && hour < 11.5) {
              currentOfficer = todayRow.mOfficer;
            } else if (hour >= 11.5 && hour < 17.5) {
              currentOfficer = todayRow.aOfficer;
            } else {
              currentOfficer = todayRow.nOfficer;
            }

            if (currentOfficer && currentOfficer !== "-") {
              setCurrentDutyOfficerName(currentOfficer);
            } else {
              setCurrentDutyOfficerName("");
            }
          } else {
            setCurrentDutyOfficerName("");
          }
        }
      })
      .catch((err) => {
        console.error("Failed to fetch schedule in header", err);
      });
  };

  useEffect(() => {
    fetchCurrentWeekSchedule();
  }, [activeTab]);

  const getDefaultSchedule = () => {
    const today = new Date();
    const dayOfWeek = today.getDay() || 7;
    const diff = today.getDate() - dayOfWeek + 1;
    const monday = new Date(today.getFullYear(), today.getMonth(), diff);

    return initialSchedule.map((row, idx) => {
      const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + idx);
      const dayStr = String(d.getDate()).padStart(2, "0");
      const monthStr = String(d.getMonth() + 1).padStart(2, "0");
      return { ...row, date: `${dayStr}/${monthStr}` };
    });
  };

  const displaySchedule =
    currentWeekSchedule.length > 0 ? currentWeekSchedule : getDefaultSchedule();

  const policeUnitName = useMemo(() => {
    if (user?.org) return user.org.toUpperCase();
    if (user?.wardName) {
      const wardTypeStr = user.wardType === "COMMUNE" ? "XÃ" : "PHƯỜNG";
      const wardName = user.wardName.toUpperCase();
      return wardName.includes("PHƯỜNG") || wardName.includes("XÃ") || wardName.includes("THỊ TRẤN")
        ? `CÔNG AN ${wardName}`
        : `CÔNG AN ${wardTypeStr} ${wardName}`;
    }
    return "CÔNG AN PHƯỜNG NGŨ HÀNH SƠN";
  }, [user]);

  const [hotspotMonth, setHotspotMonth] = useState<number>(new Date().getMonth() + 1);
  const [hotspotYear, setHotspotYear] = useState<number>(new Date().getFullYear());

  const { data: hotspots } = useHotspots({ month: hotspotMonth, year: hotspotYear });
  const { data: feedbacksData } = usePoliceAssignedFeedbacks();
  const [filterStatus, setFilterStatus] = useState<
    "ALL" | "PENDING" | "ASSIGNED" | "IN_PROGRESS" | "RESOLVED" | "REJECTED"
  >("ALL");
  const [filterDate, setFilterDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMapFilterOpen, setIsMapFilterOpen] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const [customReminders, setCustomReminders] = useState<Reminder[]>(DEFAULT_REMINDERS);
  const [isReminderSettingsOpen, setIsReminderSettingsOpen] = useState(false);
  const [newReminder, setNewReminder] = useState<Partial<Reminder>>({
    title: "",
    desc: "",
    startHour: 8,
    endHour: 10,
    iconName: "Users",
    isUrgent: false,
  });

  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    phone: "0901234567",
    rank: "Thiếu tá",
  });

  const [passwordForm, setPasswordForm] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const [selectedFeedbackId, setSelectedFeedbackId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.name) {
      setProfileForm((prev) => ({ ...prev, name: user.name }));
    }
  }, [user?.name]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const acceptMut = useAcceptFeedback();
  const rejectMut = useRejectFeedback();
  const requestInfoMut = useRequestMoreInfo();
  const updateStatusMut = useUpdatePoliceFeedbackStatus();
  const submitResultMut = useSubmitPoliceFeedbackResult();

  const [rejectingItem, setRejectingItem] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [requestInfoItem, setRequestInfoItem] = useState<any>(null);
  const [requestReason, setRequestReason] = useState("");
  const [submittingItem, setSubmittingItem] = useState<any>(null);
  const [resultNote, setResultNote] = useState("");

  const handleSubmitResult = async () => {
    if (!resultNote.trim()) {
      toast.error("Vui lòng nhập kết quả xử lý");
      return;
    }
    try {
      await submitResultMut.mutateAsync({ id: submittingItem.id, resultNote });
      toast.success("Đã báo cáo kết quả xử lý");
      setSubmittingItem(null);
      setResultNote("");
      setFilterStatus("RESOLVED");
    } catch (err) {
      toast.error("Không thể báo cáo kết quả");
    }
  };

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

  const [aiGroups, setAiGroups] = useState<any[]>([]);
  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);

  const handleAnalyzeAI = async () => {
    setIsAnalyzingAI(true);
    try {
      const res = await policeApi.analyzeDuplicates();
      if (res) {
        setAiGroups(res);
      }
    } catch (e) {
      console.error("AI Error:", e);
    } finally {
      setIsAnalyzingAI(false);
    }
  };

  // Filtered feedbacks: Separate priority (only 1 representative per group) and regular
  const { priorityFeedbacks, regularFeedbacks } = useMemo(() => {
    if (!feedbacksData) return { priorityFeedbacks: [], regularFeedbacks: [] };

    if (aiGroups && aiGroups.length > 0) {
      const pList: any[] = [];
      const allDuplicateIds = new Set<number>();

      aiGroups.forEach((g) => {
        g.feedbackIds.forEach((id: number) => allDuplicateIds.add(id));
        const groupItems = feedbacksData.filter((f) => g.feedbackIds.includes(f.id));
        if (groupItems.length > 0) {
          const rep: any = { ...groupItems[0] };
          rep._aiScore = g.matchScore || 90;
          rep._aiReason = g.reason;
          rep._groupCount = g.feedbackIds.length;
          rep._groupedIds = g.feedbackIds;
          pList.push(rep);
        }
      });

      // Filter out ALL duplicate IDs so secondary duplicates don't clutter regular list
      const rList = feedbacksData.filter((f) => !allDuplicateIds.has(f.id));
      return { priorityFeedbacks: pList, regularFeedbacks: rList };
    }

    // Group feedbacks by a content key (title + location) to find duplicates
    const contentGroups: Record<string, typeof feedbacksData> = {};
    feedbacksData.forEach((f) => {
      const titleKey = (f.title || "").toLowerCase().trim();
      const lat = f.latitude ? f.latitude.toFixed(4) : "";
      const lng = f.longitude ? f.longitude.toFixed(4) : "";
      const addressKey = (f.addressDetails || "").toLowerCase().trim();
      const key = `${titleKey}_${lat}_${lng}_${addressKey}`;

      if (!contentGroups[key]) contentGroups[key] = [];
      contentGroups[key].push(f);
    });

    const pList: any[] = [];
    const allGroupedIds = new Set<number>();

    Object.values(contentGroups).forEach((items) => {
      if (items.length >= 3) {
        items.forEach((item) => allGroupedIds.add(item.id));
        const rep: any = { ...items[0] };
        rep._groupCount = items.length;
        rep._aiScore = 90;
        rep._aiReason = `Gom nhóm ${items.length} tin báo trùng vị trí & nội dung`;
        pList.push(rep);
      }
    });

    // Exclude all duplicate group members from regular list
    const rList = feedbacksData.filter((f) => !allGroupedIds.has(f.id));

    return { priorityFeedbacks: pList, regularFeedbacks: rList };
  }, [feedbacksData, aiGroups]);

  // Regular feedbacks for normal processing boards
  const feedbacks = regularFeedbacks;

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

  // Group priority incidents by date
  const groupedPriorityIncidents = useMemo(() => {
    const sorted = [...priorityFeedbacks].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    const groups: Record<string, typeof priorityFeedbacks> = {};
    sorted.forEach((f) => {
      const dateStr = new Date(f.createdAt).toLocaleDateString("vi-VN");
      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(f);
    });
    return groups;
  }, [priorityFeedbacks]);

  // Dữ liệu cho tab Quản lý phản ánh
  const { filteredForManage, groupedForManage } = useMemo(() => {
    const filtered = feedbacks
      .filter((f) => {
        if (
          filterStatus === "PENDING" &&
          !["PENDING", "PENDING_RECEIVE", "SUBMITTED", "NEED_LOCATION_REVIEW"].includes(f.status)
        )
          return false;
        if (filterStatus === "ASSIGNED" && f.status !== "ASSIGNED") return false;
        if (filterStatus === "IN_PROGRESS" && !["IN_PROGRESS", "WAITING_INFO"].includes(f.status))
          return false;
        if (filterStatus === "RESOLVED" && f.status !== "RESOLVED") return false;
        if (filterStatus === "REJECTED" && f.status !== "REJECTED") return false;

        if (filterDate) {
          const itemDateStr = new Date(f.createdAt).toLocaleDateString("vi-VN");
          const filterDateStr = new Date(filterDate).toLocaleDateString("vi-VN");
          if (itemDateStr !== filterDateStr) return false;
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const tracking = (f.trackingCode || "").toLowerCase();
          const title = (f.title || "").toLowerCase();
          const category = (f.categoryName || "").toLowerCase();
          const citizen = (f.citizenName || "").toLowerCase();

          if (
            !tracking.includes(q) &&
            !title.includes(q) &&
            !category.includes(q) &&
            !citizen.includes(q)
          ) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const groups: Record<string, typeof feedbacks> = {};
    filtered.forEach((f) => {
      const dateStr = new Date(f.createdAt).toLocaleDateString("vi-VN");
      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(f);
    });

    return { filteredForManage: filtered, groupedForManage: groups };
  }, [feedbacks, filterStatus, filterDate, searchQuery]);

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
      const isTraffic =
        name.includes("giao thông") || name.includes("traffic") || name.includes("giao thong");
      const isSecurity =
        name.includes("an ninh") ||
        name.includes("security") ||
        name.includes("trật tự") ||
        name.includes("công an");
      const isFire =
        name.includes("phòng cháy") || name.includes("chữa cháy") || name.includes("fire");

      if (isTraffic) return mapFilters.traffic;
      if (isSecurity) return mapFilters.security;
      if (isFire) return mapFilters.fire;

      return true; // Các vấn đề khác luôn hiển thị
    });
  }, [hotspots, mapFilters]);

  const menuItems = [
    { id: "overview", name: "Tổng quan", icon: Home },
    { id: "manage", name: "Quản lý phản ánh", icon: ClipboardList },
    { id: "campaigns", name: "Chiến dịch", icon: Flag },
    { id: "schedule", name: "Lịch trực ban", icon: Calendar },
    { id: "reports", name: "Báo cáo thống kê", icon: BarChart2 },
    { id: "go_home", name: "Về trang chủ", icon: ExternalLink },
  ];

  return (
    <div
      className="min-h-screen flex font-sans"
      style={{ backgroundColor: colors.background, color: colors.textPrimary }}
    >
      {/* LEFT SIDEBAR */}
      <aside
        className="w-[260px] flex flex-col shrink-0"
        style={{ backgroundColor: colors.primaryNavy }}
      >
        <div className="p-6 pb-4 border-b border-white/10 flex flex-col items-center">
          <img
            src={policeEmblemImg}
            alt="Emblem"
            className="w-16 h-16 object-contain mb-3 drop-shadow-md"
          />
          <h1 className="text-center font-bold text-[13px] text-white uppercase leading-snug w-full px-1">
            CÔNG AN ĐÀ NẴNG
          </h1>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === "go_home") {
                    navigate({ to: "/" });
                    return;
                  }
                  setSelectedFeedbackId(null);
                  setActiveTab(item.id);
                  if (item.id === "manage") {
                    setFilterStatus("ALL");
                    setFilterDate("");
                  }
                }}
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
        <header
          className="h-[90px] bg-white border-b px-6 flex items-center justify-between shrink-0 gap-6"
          style={{ borderColor: colors.border, fontFamily: "Inter, sans-serif" }}
        >
          {/* LEFT SECTION */}
          <div className="flex-[2] xl:flex-[2.5] flex items-center gap-3 lg:gap-4 min-w-0">
            <img
              src={policeEmblemImg}
              alt="Police Emblem"
              className="w-[45px] h-[45px] lg:w-[50px] lg:h-[50px] object-contain drop-shadow-sm shrink-0"
            />
            <div className="flex flex-col min-w-0">
              <h2
                className="text-[15px] md:text-[17px] lg:text-[19px] font-bold leading-snug whitespace-normal break-words"
                style={{ color: colors.primaryNavy }}
              >
                {policeUnitName}
              </h2>
              <span
                className="text-[12px] lg:text-[13px] font-medium mt-0.5 truncate hidden sm:block"
                style={{ color: colors.textSecondary }}
              >
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
              <div
                className="mt-1.5 hidden md:flex items-center rounded text-[13px] font-normal w-full max-w-[500px] overflow-hidden relative"
                style={{
                  backgroundColor: "#E3F2FD",
                  color: colors.secondaryBlue,
                  padding: "2px 0",
                }}
              >
                <div
                  className="absolute left-0 top-0 bottom-0 px-2.5 flex items-center z-10"
                  style={{ backgroundColor: "#E3F2FD" }}
                >
                  <span className="text-[14px]">🇻🇳</span>
                </div>
                <div className="flex-1 overflow-hidden w-full pl-10 pr-2">
                  <div className="marquee-text">
                    Chúc các đồng chí một ngày làm việc hiệu quả, trách nhiệm, tận tâm phục vụ Nhân
                    dân, góp phần giữ vững an ninh trật tự trên địa bàn.
                  </div>
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
                    setActiveTab("manage");
                    setFilterStatus("ALL");
                    setSelectedFeedbackId(null);
                  }
                }}
                placeholder="Tìm kiếm mã HS, tiêu đề, người gửi..."
                className="w-full h-10 pl-10 pr-4 rounded-[4px] border text-sm focus:outline-none focus:ring-1 bg-slate-50 transition-all"
                style={{ borderColor: colors.border }}
              />
              <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
            </div>
          </div>

          {/* RIGHT SECTION */}
          <div className="flex items-center justify-end gap-5 shrink-0 relative">
            <div
              className="text-[13px] font-medium text-right leading-tight hidden lg:block whitespace-nowrap"
              style={{ color: colors.textSecondary }}
            >
              <div className="text-[14px]">
                {currentTime.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
              </div>
              <div>
                {currentTime.toLocaleDateString("vi-VN", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            </div>
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="relative p-2 rounded hover:bg-slate-50 transition-colors shrink-0"
                style={{ color: colors.primaryNavy }}
              >
                <Bell size={20} />
                <span
                  className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full border border-white animate-pulse"
                  style={{ backgroundColor: colors.criticalRed }}
                ></span>
              </button>

              {isNotificationOpen && (
                <div
                  className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border z-50 overflow-hidden animate-in fade-in slide-in-from-top-2"
                  style={{ borderColor: colors.border }}
                >
                  <div
                    className="p-3 border-b bg-slate-50 flex justify-between items-center"
                    style={{ borderColor: colors.border }}
                  >
                    <h3 className="font-bold text-sm" style={{ color: colors.primaryNavy }}>
                      Nhắc nhở nghiệp vụ
                    </h3>
                    <span className="text-xs text-blue-600 cursor-pointer hover:underline">
                      Đánh dấu đã đọc
                    </span>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {(() => {
                      const currentHour = currentTime.getHours();
                      const activeReminders = customReminders.filter(
                        (r) => currentHour >= r.startHour && currentHour <= r.endHour,
                      );
                      if (activeReminders.length === 0) {
                        return (
                          <div className="p-6 text-center text-[13px] text-slate-500 font-medium">
                            Không có nhắc nhở nào trong khung giờ hiện tại.
                          </div>
                        );
                      }
                      return activeReminders.map((reminder) => {
                        const IconComponent = iconMap[reminder.iconName];
                        return (
                          <div
                            key={reminder.id}
                            className="p-3 border-b hover:bg-slate-50 transition-colors flex gap-3 cursor-pointer"
                            style={{ borderColor: colors.border }}
                          >
                            <div
                              className={`mt-0.5 rounded-full p-1.5 shrink-0 h-fit ${reminder.isUrgent ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"}`}
                            >
                              <IconComponent size={14} />
                            </div>
                            <div>
                              <div
                                className="text-xs font-bold mb-1"
                                style={{ color: colors.primaryNavy }}
                              >
                                {reminder.title}
                              </div>
                              <div className="text-[11px] text-slate-600 leading-relaxed">
                                {reminder.desc}
                              </div>
                              <div className="text-[10px] text-slate-400 mt-1 font-medium">
                                {String(reminder.startHour).padStart(2, "0")}:00 -{" "}
                                {String(reminder.endHour).padStart(2, "0")}:59
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                  <div
                    className="grid grid-cols-2 text-center border-t bg-slate-50 text-xs font-semibold"
                    style={{ borderColor: colors.border }}
                  >
                    <div
                      className="p-2.5 border-r hover:bg-slate-100 cursor-pointer"
                      style={{ borderColor: colors.border, color: colors.secondaryBlue }}
                    >
                      Xem tất cả
                    </div>
                    <div
                      className="p-2.5 hover:bg-slate-100 cursor-pointer"
                      style={{ color: colors.secondaryBlue }}
                      onClick={() => {
                        setIsNotificationOpen(false);
                        setIsReminderSettingsOpen(true);
                      }}
                    >
                      Cài đặt nhắc nhở
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div
              className="flex items-center pl-5 border-l shrink-0 relative"
              style={{ borderColor: colors.border }}
              ref={dropdownRef}
            >
              <div className="mr-3 text-right hidden sm:block">
                <div className="text-[12px] font-bold text-slate-800 leading-tight">
                  {user?.name || "Cán bộ trực ban"}
                </div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  {user?.org || "Quản trị viên"}
                </div>
              </div>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="relative w-[48px] h-[34px] rounded overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.1)] border border-black/5 cursor-pointer hover:shadow-md transition-all waving-flag-container"
                title="Tài khoản & Thiết lập"
              >
                <div className="relative w-full h-full scale-[1.15]">
                  <svg viewBox="0 0 300 200" className="w-full h-full">
                    <rect width="300" height="200" fill="#DA251D" />
                    <g transform="translate(150, 100) scale(60)">
                      <polygon
                        points="0,-1 0.2245,-0.309 0.951,-0.309 0.363,0.118 0.587,0.809 0,0.382 -0.587,0.809 -0.363,0.118 -0.951,-0.309 -0.2245,-0.309"
                        fill="#FFFF00"
                      />
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

              {/* DROPDOWN MENU */}
              {isDropdownOpen && (
                <div className="absolute top-[120%] right-0 w-60 bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-3 border-b border-slate-50 mb-1 bg-slate-50/50">
                    <p className="text-[14px] font-bold text-slate-800 leading-tight">
                      {user?.name || "Cán bộ trực ban"}
                    </p>
                    <p className="text-[11px] font-semibold text-blue-600 mt-1 uppercase tracking-wide truncate">
                      {policeUnitName}
                    </p>
                    {currentDutyOfficerName && (
                      <p className="text-[10px] text-slate-500 mt-1">
                        Trực ban: <span className="font-semibold">{currentDutyOfficerName}</span>
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setIsProfileDialogOpen(true);
                      setIsDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <User size={16} />
                    Thông tin cá nhân
                  </button>
                  <button
                    onClick={() => {
                      setIsPasswordDialogOpen(true);
                      setIsDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <Key size={16} />
                    Đổi mật khẩu
                  </button>
                  <div className="h-px bg-slate-100 my-1"></div>
                  <button
                    onClick={handleLogout}
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

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto bg-[#F5F7FA] relative">
          {selectedFeedbackId ? (
            <div className="absolute inset-0 bg-[#F8FAFC] z-10 overflow-y-auto pb-8">
              <FeedbackDetailPageComponent
                feedbackId={selectedFeedbackId}
                onBack={() => setSelectedFeedbackId(null)}
              />
            </div>
          ) : null}

          <div className={`p-6 ${selectedFeedbackId ? "hidden" : "block"}`}>
            {activeTab === "overview" && (
              <div className="space-y-6 max-w-[1600px] mx-auto">
                {/* FIRST SECTION: OPERATION STATUS */}
                <div className="grid grid-cols-5 gap-4">
                  {[
                    {
                      id: "PENDING",
                      label: "Phản ánh mới",
                      value: pendingCount.toString(),
                      icon: Inbox,
                      color: colors.secondaryBlue,
                      trend: "Chờ duyệt",
                    },
                    {
                      id: "ASSIGNED",
                      label: "Đã tiếp nhận",
                      value: acceptedCount.toString(),
                      icon: ClipboardList,
                      color: colors.primaryNavy,
                      trend: "Đang phân công",
                    },
                    {
                      id: "IN_PROGRESS",
                      label: "Đang xử lý",
                      value: inProgressCount.toString(),
                      icon: RefreshCw,
                      color: colors.policeGold,
                      trend: "Trong tiến độ",
                    },
                    {
                      id: "RESOLVED",
                      label: "Đã hoàn thành",
                      value: resolvedCount.toString(),
                      icon: CheckCircle2,
                      color: colors.successGreen,
                      trend: "Đã đóng",
                    },
                    {
                      id: "REJECTED",
                      label: "Đã từ chối",
                      value: rejectedCount.toString(),
                      icon: AlertTriangle,
                      color: colors.criticalRed,
                      trend: "Không hợp lệ",
                    },
                  ].map((stat, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setFilterStatus(stat.id as any);
                        setActiveTab("manage");
                      }}
                      className="bg-white rounded-[8px] p-4 border flex flex-col justify-between cursor-pointer hover:shadow-md hover:border-blue-300 transition-all group"
                      style={{ borderColor: colors.border }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className="text-xs font-semibold uppercase tracking-wider group-hover:text-blue-600 transition-colors"
                          style={{ color: colors.textSecondary }}
                        >
                          {stat.label}
                        </span>
                        <stat.icon
                          size={16}
                          style={{ color: stat.color }}
                          className="group-hover:scale-110 transition-transform"
                        />
                      </div>
                      <div className="flex items-end justify-between mt-2">
                        <span
                          className="text-3xl font-bold leading-none"
                          style={{ color: colors.textPrimary }}
                        >
                          {stat.value}
                        </span>
                        <span
                          className="text-[11px] font-medium group-hover:text-blue-500 transition-colors"
                          style={{ color: colors.textSecondary }}
                        >
                          {stat.trend}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* SECOND SECTION: Split Layout */}
                <div className="flex gap-6 min-h-[500px] h-[calc(100vh-250px)]">
                  {/* 40% LEFT PANEL: PRIORITY INCIDENTS */}
                  <div
                    className="w-[40%] bg-white rounded-[8px] border flex flex-col"
                    style={{ borderColor: colors.border }}
                  >
                    <div
                      className="p-4 border-b flex items-center justify-between"
                      style={{ borderColor: colors.border }}
                    >
                      <h3
                        className="font-bold text-sm uppercase"
                        style={{ color: colors.primaryNavy }}
                      >
                        Vụ việc ưu tiên
                      </h3>
                      <button
                        className="text-xs font-medium hover:underline"
                        style={{ color: colors.secondaryBlue }}
                      >
                        Xem tất cả
                      </button>
                    </div>
                    <div
                      className="p-4 border-b bg-red-50/50 flex items-center justify-between"
                      style={{ borderColor: colors.border }}
                    >
                      <div className="flex items-center gap-2">
                        <h4
                          className="text-[13px] font-bold uppercase tracking-wide"
                          style={{ color: colors.criticalRed }}
                        >
                          Hồ Sơ Cần Ưu Tiên (Gom Nhóm AI)
                        </h4>
                        <span className="bg-red-100 text-red-600 text-[10px] px-1.5 py-0.5 rounded font-bold">
                          {Object.keys(groupedPriorityIncidents).length} Vụ Việc
                        </span>
                      </div>
                      <button
                        onClick={handleAnalyzeAI}
                        disabled={isAnalyzingAI}
                        className="text-[11px] bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-[4px] font-bold flex items-center gap-1.5 disabled:opacity-50 transition-colors shadow-sm"
                      >
                        {isAnalyzingAI ? (
                          <RefreshCw size={12} className="animate-spin" />
                        ) : (
                          <RefreshCw size={12} />
                        )}
                        Phân Tích AI
                      </button>
                    </div>
                    <div className="flex-1 overflow-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 sticky top-0">
                          <tr>
                            <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">
                              Mã HS
                            </th>
                            <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">
                              Phân loại
                            </th>
                            <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">
                              Trạng thái
                            </th>
                            <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">
                              Độ trùng khớp (AI)
                            </th>
                            <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">
                              Thao tác
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y" style={{ borderColor: colors.border }}>
                          {Object.keys(groupedPriorityIncidents).length > 0 ? (
                            Object.entries(groupedPriorityIncidents).map(([dateStr, items]) => (
                              <React.Fragment key={dateStr}>
                                <tr
                                  className="bg-slate-100/70 border-y"
                                  style={{ borderColor: colors.border }}
                                >
                                  <td
                                    colSpan={5}
                                    className="px-4 py-2 text-[11px] font-bold text-slate-700 uppercase tracking-wide"
                                  >
                                    Ngày: {dateStr}
                                  </td>
                                </tr>
                                {items.map((row) => {
                                  const isUrgent =
                                    row.priority === "CRITICAL" || row.priority === "HIGH";
                                  const aiScore =
                                    (row as any)._aiScore || 85 + (Number(row.id) % 15);
                                  const aiReason =
                                    (row as any)._aiReason || "Khớp: Tiêu đề, Nội dung, Định vị";
                                  const groupCount = (row as any)._groupCount || 2;

                                  return (
                                    <tr
                                      key={row.id}
                                      onClick={() => setSelectedFeedbackId(String(row.id))}
                                      className={`hover:bg-slate-50 cursor-pointer ${isUrgent ? "bg-red-50/30" : ""}`}
                                    >
                                      <td
                                        className="px-4 py-3 font-medium"
                                        style={{ color: colors.primaryNavy }}
                                      >
                                        {row.trackingCode}
                                      </td>
                                      <td
                                        className="px-4 py-3 text-slate-600 truncate max-w-[120px]"
                                        title={row.title}
                                      >
                                        {row.categoryName}
                                      </td>
                                      <td className="px-4 py-3">
                                        <span
                                          className="text-[11px] px-2 py-1 rounded-[4px] font-semibold"
                                          style={{
                                            backgroundColor: isUrgent ? "#FEE2E2" : "#F1F5F9",
                                            color: isUrgent
                                              ? colors.criticalRed
                                              : colors.textSecondary,
                                          }}
                                        >
                                          {row.priority === "CRITICAL"
                                            ? "Khẩn cấp"
                                            : row.priority === "HIGH"
                                              ? "Ưu tiên"
                                              : "Bình thường"}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3">
                                        <div
                                          className="flex items-center gap-2 whitespace-nowrap"
                                          title={aiReason}
                                        >
                                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-gradient-to-r from-red-500 via-rose-500 to-red-600 text-white shadow-sm hover:shadow transition-all">
                                            <Layers
                                              size={13}
                                              className="text-white/90 animate-pulse"
                                            />
                                            <span>Gom {groupCount} tin</span>
                                          </span>
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                            <Sparkles size={11} className="text-emerald-500" />
                                            {aiScore}%
                                          </span>
                                        </div>
                                      </td>
                                      <td className="px-4 py-3">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setRejectingItem(row);
                                          }}
                                          className="px-2.5 py-1 text-[11px] font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-[4px] transition-colors flex items-center gap-1 shadow-xs"
                                          title="Từ chối phản ánh này"
                                        >
                                          <AlertTriangle size={12} />
                                          Từ chối
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </React.Fragment>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan={5}
                                className="px-4 py-8 text-center text-slate-500 text-sm"
                              >
                                Không có vụ việc ưu tiên nào
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 60% RIGHT PANEL: HOTSPOT MAP */}
                  <div
                    className="w-[60%] bg-white rounded-[8px] border relative overflow-hidden flex flex-col"
                    style={{ borderColor: colors.border }}
                  >
                    <div
                      className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm p-3.5 rounded-xl border shadow-sm z-10 transition-all min-w-[150px]"
                      style={{ borderColor: colors.border }}
                    >
                      <div
                        className="flex items-center justify-between mb-2 cursor-pointer"
                        onClick={() => setIsMapFilterOpen(!isMapFilterOpen)}
                      >
                        <h4
                          className="text-[10px] font-extrabold uppercase tracking-wide"
                          style={{ color: colors.primaryNavy }}
                        >
                          Bộ lọc Bản đồ
                        </h4>
                        {isMapFilterOpen ? (
                          <ChevronUp size={14} style={{ color: colors.primaryNavy }} />
                        ) : (
                          <ChevronDown size={14} style={{ color: colors.primaryNavy }} />
                        )}
                      </div>
                      
                      {/* Month and Year Selectors */}
                      <div className="flex items-center gap-1 mb-3">
                        <select
                          className="text-[11px] font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded px-1.5 py-1 outline-none w-full"
                          value={hotspotMonth}
                          onChange={(e) => setHotspotMonth(Number(e.target.value))}
                        >
                          {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>
                              Tháng {i + 1}
                            </option>
                          ))}
                        </select>
                        <select
                          className="text-[11px] font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded px-1.5 py-1 outline-none w-full"
                          value={hotspotYear}
                          onChange={(e) => setHotspotYear(Number(e.target.value))}
                        >
                          {Array.from({ length: 5 }, (_, i) => {
                            const y = new Date().getFullYear() - i;
                            return (
                              <option key={y} value={y}>
                                Năm {y}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                      {isMapFilterOpen && (
                        <div className="space-y-2.5 text-[11px] font-medium text-slate-700 animate-in fade-in slide-in-from-top-2">
                          <label className="flex items-center gap-2 cursor-pointer hover:text-blue-600 transition-colors">
                            <input
                              type="checkbox"
                              checked={mapFilters.traffic}
                              onChange={(e) =>
                                setMapFilters((prev) => ({ ...prev, traffic: e.target.checked }))
                              }
                              className="rounded-sm"
                            />{" "}
                            Giao thông
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer hover:text-blue-600 transition-colors">
                            <input
                              type="checkbox"
                              checked={mapFilters.security}
                              onChange={(e) =>
                                setMapFilters((prev) => ({ ...prev, security: e.target.checked }))
                              }
                              className="rounded-sm"
                            />{" "}
                            An ninh trật tự
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer hover:text-blue-600 transition-colors">
                            <input
                              type="checkbox"
                              checked={mapFilters.fire}
                              onChange={(e) =>
                                setMapFilters((prev) => ({ ...prev, fire: e.target.checked }))
                              }
                              className="rounded-sm"
                            />{" "}
                            Phòng cháy chữa cháy
                          </label>
                        </div>
                      )}
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
              </div>
            )}
            {activeTab === "manage" && (
              <div
                className="max-w-[1600px] mx-auto bg-white rounded-[8px] border shadow-sm p-6"
                style={{ borderColor: colors.border }}
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold" style={{ color: colors.primaryNavy }}>
                      Quản lý phản ánh
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      Danh sách hồ sơ phản ánh hiện tại trên địa bàn
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex items-center">
                      <input
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="h-9 px-3 border rounded-[4px] text-sm focus:outline-none focus:ring-1 bg-slate-50 text-slate-700"
                        title="Lọc theo ngày"
                      />
                      {filterDate && (
                        <button
                          onClick={() => setFilterDate("")}
                          className="absolute right-8 text-slate-400 hover:text-red-500"
                          title="Xóa bộ lọc ngày"
                        >
                          ×
                        </button>
                      )}
                    </div>
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
                        Object.entries(groupedForManage).map(([dateStr, items]) => (
                          <React.Fragment key={dateStr}>
                            <tr
                              className="bg-slate-100/70 border-y"
                              style={{ borderColor: colors.border }}
                            >
                              <td
                                colSpan={7}
                                className="px-4 py-2 text-xs font-bold text-slate-700 uppercase tracking-wide"
                              >
                                Ngày: {dateStr}
                              </td>
                            </tr>
                            {items.map((item, idx) => {
                              const statusLabel =
                                item.status === "RESOLVED"
                                  ? "Đã xử lý"
                                  : item.status === "REJECTED"
                                    ? "Từ chối"
                                    : item.status === "ASSIGNED"
                                      ? "Đã tiếp nhận"
                                      : item.status === "IN_PROGRESS" ||
                                          item.status === "WAITING_INFO"
                                        ? "Đang xử lý"
                                        : "Chưa xử lý";

                              const statusClass =
                                item.status === "RESOLVED"
                                  ? "bg-green-100 text-green-700"
                                  : item.status === "REJECTED"
                                    ? "bg-red-100 text-red-700"
                                    : item.status === "ASSIGNED"
                                      ? "bg-purple-100 text-purple-700"
                                      : item.status === "IN_PROGRESS" ||
                                          item.status === "WAITING_INFO"
                                        ? "bg-blue-100 text-blue-700"
                                        : "bg-orange-100 text-orange-700";

                              return (
                                <tr
                                  key={item.id}
                                  onClick={() => setSelectedFeedbackId(String(item.id))}
                                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                                >
                                  <td
                                    className="px-4 py-3 font-bold"
                                    style={{ color: colors.secondaryBlue }}
                                  >
                                    {item.trackingCode}
                                  </td>
                                  <td
                                    className="px-4 py-3 max-w-[250px] truncate font-medium text-slate-800"
                                    title={item.title}
                                  >
                                    {item.title}
                                  </td>
                                  <td className="px-4 py-3 text-slate-600">{item.categoryName}</td>
                                  <td className="px-4 py-3 text-slate-600">
                                    {item.citizenName || "Ẩn danh"}
                                  </td>
                                  <td className="px-4 py-3 text-slate-600">
                                    {new Date(item.createdAt).toLocaleString("vi-VN", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span
                                      className={`px-2 py-1 rounded-[4px] text-[11px] font-semibold ${statusClass}`}
                                    >
                                      {statusLabel}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    {[
                                      "PENDING",
                                      "PENDING_RECEIVE",
                                      "SUBMITTED",
                                      "NEED_LOCATION_REVIEW",
                                    ].includes(item.status) && (
                                      <div className="flex gap-2">
                                        <button
                                          onClick={(e) => handleAccept(e, item.id)}
                                          disabled={acceptMut.isPending}
                                          className="px-2 py-1 bg-blue-600 text-white text-[11px] font-bold rounded hover:bg-blue-700 disabled:opacity-50"
                                        >
                                          Tiếp nhận
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setRejectingItem(item);
                                          }}
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
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setRequestInfoItem(item);
                                          }}
                                          className="px-2 py-1 bg-slate-100 text-slate-700 text-[11px] font-bold rounded hover:bg-slate-200"
                                        >
                                          Hỏi thêm
                                        </button>
                                      </div>
                                    )}
                                    {item.status === "IN_PROGRESS" && (
                                      <div className="flex gap-2">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSubmittingItem(item);
                                          }}
                                          className="px-2 py-1 bg-green-600 text-white text-[11px] font-bold rounded hover:bg-green-700"
                                        >
                                          Báo cáo kết quả
                                        </button>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        ))
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
            {activeTab === "campaigns" && <PoliceCampaignPage />}
            {activeTab === "schedule" && <DutyRoster onSave={fetchCurrentWeekSchedule} />}
            {activeTab === "reports" && (
              <PoliceStatisticalReports feedbacks={feedbacksData || []} />
            )}
            {activeTab !== "overview" &&
              activeTab !== "manage" &&
              activeTab !== "campaigns" &&
              activeTab !== "schedule" &&
              activeTab !== "reports" && (
                <div className="flex items-center justify-center h-full text-slate-400">
                  Chức năng đang được cập nhật theo giao diện mới...
                </div>
              )}
          </div>
        </main>
      </div>

      {/* Reject Dialog */}
      <Dialog open={!!rejectingItem} onOpenChange={(open) => !open && setRejectingItem(null)}>
        <DialogContent className="bg-white rounded-[8px] p-6 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold" style={{ color: colors.primaryNavy }}>
              Từ chối phản ánh
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-slate-600 mb-2">
              Vui lòng nhập lý do từ chối phản ánh này. Người dân sẽ nhận được thông báo kèm lý do
              này.
            </p>
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
            <DialogTitle className="text-lg font-bold" style={{ color: colors.secondaryBlue }}>
              Yêu cầu bổ sung thông tin
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-slate-600 mb-2">
              Nhập chi tiết thông tin bạn cần người dân cung cấp thêm để có thể xử lý phản ánh này.
              Người dân sẽ nhận được thông báo ngay lập tức.
            </p>
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

      {/* Submit Result Dialog */}
      <Dialog open={!!submittingItem} onOpenChange={(open) => !open && setSubmittingItem(null)}>
        <DialogContent className="bg-white rounded-[8px] p-6 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold" style={{ color: colors.successGreen }}>
              Báo cáo kết quả xử lý
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-slate-600 mb-2">
              Nhập kết quả xử lý phản ánh này để báo cáo cho người dân và lưu trữ vào hồ sơ.
            </p>
            <textarea
              value={resultNote}
              onChange={(e) => setResultNote(e.target.value)}
              placeholder="VD: Đã tiến hành kiểm tra, xử phạt vi phạm hành chính..."
              className="w-full min-h-[100px] p-3 border rounded-[4px] text-sm focus:outline-none focus:ring-1 bg-slate-50"
              style={{ borderColor: colors.border }}
            />
          </div>
          <DialogFooter className="flex justify-end gap-3">
            <button
              onClick={() => setSubmittingItem(null)}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-[4px] hover:bg-slate-200"
            >
              Hủy
            </button>
            <button
              onClick={handleSubmitResult}
              disabled={submitResultMut.isPending}
              className="px-4 py-2 text-sm font-bold text-white rounded-[4px] disabled:opacity-50"
              style={{ backgroundColor: colors.successGreen }}
            >
              {submitResultMut.isPending ? "Đang lưu..." : "Xác nhận hoàn thành"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Profile Dialog */}
      <Dialog
        open={isProfileDialogOpen}
        onOpenChange={(open) => {
          setIsProfileDialogOpen(open);
          if (!open) setIsEditingProfile(false);
        }}
      >
        <DialogContent className="bg-white rounded-[8px] p-0 max-w-[950px] overflow-hidden">
          <div className="flex flex-col md:flex-row h-full">
            {/* Cột trái: Thông tin cá nhân */}
            <div
              className="w-full md:w-[350px] p-6 bg-slate-50 border-r"
              style={{ borderColor: colors.border }}
            >
              <DialogHeader className="mb-6">
                <DialogTitle className="text-lg font-bold" style={{ color: colors.primaryNavy }}>
                  Hồ sơ Cán bộ
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Avatar Section */}
                <div className="flex flex-col items-center mb-6">
                  <div className="relative group">
                    <div
                      className="w-24 h-24 rounded-full border-4 shadow-sm overflow-hidden flex items-center justify-center bg-white"
                      style={{ borderColor: colors.border }}
                    >
                      {profileAvatar ? (
                        <img
                          src={profileAvatar}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User size={40} className="text-slate-400" />
                      )}
                    </div>
                    <label
                      htmlFor="avatar-upload"
                      className="absolute bottom-0 right-0 bg-blue-600 rounded-full w-8 h-8 flex items-center justify-center text-white border-2 border-white shadow-md hover:bg-blue-700 transition-colors cursor-pointer"
                      title="Đổi ảnh đại diện"
                    >
                      <Camera size={14} />
                    </label>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const url = URL.createObjectURL(file);
                          setProfileAvatar(url);
                        }
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1">
                    Đơn vị công tác
                  </label>
                  <input
                    type="text"
                    value={policeUnitName}
                    disabled
                    className="w-full h-9 px-3 border rounded-[4px] text-sm bg-slate-100/50 text-slate-500 cursor-not-allowed"
                    style={{ borderColor: colors.border }}
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1">
                    Họ và Tên
                  </label>
                  <input
                    type="text"
                    value={profileForm.name}
                    disabled={!isEditingProfile}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className={`w-full h-9 px-3 border rounded-[4px] text-sm focus:outline-none focus:ring-1 ${!isEditingProfile ? "bg-transparent border-transparent px-0 font-medium text-slate-800" : "bg-white text-slate-800"}`}
                    style={{ borderColor: !isEditingProfile ? "transparent" : colors.border }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1">
                      Cấp bậc
                    </label>
                    <select
                      value={profileForm.rank}
                      disabled={!isEditingProfile}
                      onChange={(e) => setProfileForm({ ...profileForm, rank: e.target.value })}
                      className={`w-full h-9 px-3 border rounded-[4px] text-sm focus:outline-none focus:ring-1 ${!isEditingProfile ? "bg-transparent border-transparent px-0 font-medium text-slate-800 appearance-none" : "bg-white text-slate-800"}`}
                      style={{ borderColor: !isEditingProfile ? "transparent" : colors.border }}
                    >
                      <option value="Thượng úy">Thượng úy</option>
                      <option value="Đại úy">Đại úy</option>
                      <option value="Thiếu tá">Thiếu tá</option>
                      <option value="Trung tá">Trung tá</option>
                      <option value="Thượng tá">Thượng tá</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1">
                      Số điện thoại
                    </label>
                    <input
                      type="text"
                      value={profileForm.phone}
                      disabled={!isEditingProfile}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className={`w-full h-9 px-3 border rounded-[4px] text-sm focus:outline-none focus:ring-1 ${!isEditingProfile ? "bg-transparent border-transparent px-0 font-medium text-slate-800" : "bg-white text-slate-800"}`}
                      style={{ borderColor: !isEditingProfile ? "transparent" : colors.border }}
                    />
                  </div>
                </div>
              </div>

              <div
                className="mt-8 pt-6 border-t flex justify-end gap-3"
                style={{ borderColor: colors.border }}
              >
                {!isEditingProfile ? (
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="w-full py-2 text-sm font-bold text-white rounded-[4px] hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: colors.secondaryBlue }}
                  >
                    Chỉnh sửa thông tin
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setIsEditingProfile(false)}
                      className="flex-1 py-2 text-sm font-medium text-slate-600 bg-slate-200 rounded-[4px] hover:bg-slate-300"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={() => {
                        toast.success("Đã cập nhật thông tin thành công!");
                        setIsEditingProfile(false);
                      }}
                      className="flex-1 py-2 text-sm font-bold text-white rounded-[4px] hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: colors.primaryNavy }}
                    >
                      Lưu lại
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Cột phải: Lịch phân công công tác */}
            <div className="flex-1 p-6 bg-white flex flex-col">
              <div className="flex items-center gap-2 mb-6">
                <Clock className="text-blue-600" size={20} />
                <h3 className="text-lg font-bold" style={{ color: colors.primaryNavy }}>
                  Lịch phân công trực công tác tuần này
                </h3>
              </div>

              <div
                className="flex-1 overflow-auto rounded-lg border"
                style={{ borderColor: colors.border }}
              >
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-[12px] font-semibold text-slate-600 uppercase border-b border-r w-24">
                        Thứ / Ngày
                      </th>
                      <th className="px-4 py-3 text-[12px] font-semibold text-slate-600 uppercase border-b border-r text-center">
                        Ca Sáng
                        <br />
                        <span className="text-[10px] font-normal text-slate-400">
                          07:30 - 11:30
                        </span>
                      </th>
                      <th className="px-4 py-3 text-[12px] font-semibold text-slate-600 uppercase border-b border-r text-center">
                        Ca Chiều
                        <br />
                        <span className="text-[10px] font-normal text-slate-400">
                          13:30 - 17:30
                        </span>
                      </th>
                      <th className="px-4 py-3 text-[12px] font-semibold text-slate-600 uppercase border-b text-center">
                        Ca Đêm
                        <br />
                        <span className="text-[10px] font-normal text-slate-400">
                          17:30 - 07:30
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-[13px]">
                    {displaySchedule.map((row, idx) => (
                      <tr key={idx} className="border-b last:border-b-0 hover:bg-slate-50/50">
                        <td className="px-4 py-3 border-r bg-slate-50/30">
                          <div className="font-semibold text-slate-700">{row.day}</div>
                          <div className="text-[11px] text-slate-400">{row.date}</div>
                        </td>
                        <td className="px-4 py-3 border-r text-center">
                          {row.morning !== "-" ? (
                            <div className="flex flex-col items-center">
                              <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[12px] font-medium mb-0.5">
                                {row.morning}
                              </span>
                              <span className="text-[10px] text-slate-500 font-medium truncate max-w-[120px]">
                                {row.mOfficer}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 border-r text-center">
                          {row.afternoon !== "-" ? (
                            <div className="flex flex-col items-center">
                              <span className="inline-block px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-[12px] font-medium mb-0.5">
                                {row.afternoon}
                              </span>
                              <span className="text-[10px] text-slate-500 font-medium truncate max-w-[120px]">
                                {row.aOfficer}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {row.night !== "-" ? (
                            <div className="flex flex-col items-center">
                              <span className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[12px] font-medium mb-0.5">
                                {row.night}
                              </span>
                              <span className="text-[10px] text-slate-500 font-medium truncate max-w-[120px]">
                                {row.nOfficer}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex justify-between items-center text-[11px] text-slate-500">
                <span>
                  * Lịch trực có thể thay đổi theo lệnh điều động đột xuất của Trưởng Công an
                  Phường.
                </span>
                <button
                  onClick={() => setIsProfileDialogOpen(false)}
                  className="px-6 py-2 rounded font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  Đóng cửa sổ
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Password Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="bg-white rounded-[8px] p-6 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold" style={{ color: colors.primaryNavy }}>
              Đổi mật khẩu
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-4">
            <div className="relative">
              <label className="block text-[13px] font-semibold text-slate-700 mb-1">
                Mật khẩu hiện tại
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={passwordForm.current}
                onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                className="w-full h-9 px-3 pr-10 border rounded-[4px] text-sm focus:outline-none focus:ring-1 bg-slate-50 text-slate-700"
                style={{ borderColor: colors.border }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[26px] text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div className="relative">
              <label className="block text-[13px] font-semibold text-slate-700 mb-1">
                Mật khẩu mới
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={passwordForm.new}
                onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                className="w-full h-9 px-3 pr-10 border rounded-[4px] text-sm focus:outline-none focus:ring-1 bg-slate-50 text-slate-700"
                style={{ borderColor: colors.border }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[26px] text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div className="relative">
              <label className="block text-[13px] font-semibold text-slate-700 mb-1">
                Xác nhận mật khẩu mới
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={passwordForm.confirm}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                className="w-full h-9 px-3 pr-10 border rounded-[4px] text-sm focus:outline-none focus:ring-1 bg-slate-50 text-slate-700"
                style={{ borderColor: colors.border }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[26px] text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <DialogFooter className="flex justify-end gap-3 mt-4">
            <button
              onClick={() => setIsPasswordDialogOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-[4px] hover:bg-slate-200"
            >
              Hủy
            </button>
            <button
              onClick={() => {
                if (!passwordForm.current || !passwordForm.new || !passwordForm.confirm) {
                  toast.error("Vui lòng điền đầy đủ thông tin!");
                  return;
                }
                if (passwordForm.new !== passwordForm.confirm) {
                  toast.error("Mật khẩu xác nhận không khớp!");
                  return;
                }
                toast.success("Đổi mật khẩu thành công!");
                setIsPasswordDialogOpen(false);
                setPasswordForm({ current: "", new: "", confirm: "" });
              }}
              className="px-4 py-2 text-sm font-bold text-white rounded-[4px] hover:opacity-90"
              style={{ backgroundColor: colors.primaryNavy }}
            >
              Xác nhận đổi
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reminder Settings Dialog */}
      <Dialog open={isReminderSettingsOpen} onOpenChange={setIsReminderSettingsOpen}>
        <DialogContent className="bg-white rounded-[8px] p-6 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle
              className="text-lg font-bold flex items-center gap-2"
              style={{ color: colors.primaryNavy }}
            >
              <Bell size={20} /> Cài đặt nhắc nhở nghiệp vụ
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-6">
            <div>
              <h4 className="font-bold text-sm mb-3" style={{ color: colors.secondaryBlue }}>
                Danh sách khung giờ đã cài đặt
              </h4>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                {customReminders.length === 0 ? (
                  <div className="text-center p-4 text-sm text-slate-500 border rounded border-dashed">
                    Chưa có nhắc nhở nào
                  </div>
                ) : (
                  customReminders.map((r) => {
                    const IconComp = iconMap[r.iconName];
                    return (
                      <div
                        key={r.id}
                        className="flex items-start justify-between p-3 border rounded-[4px] bg-slate-50"
                        style={{ borderColor: colors.border }}
                      >
                        <div className="flex gap-3">
                          <div
                            className={`mt-0.5 rounded-full p-1.5 shrink-0 h-fit ${r.isUrgent ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"}`}
                          >
                            <IconComp size={14} />
                          </div>
                          <div>
                            <div
                              className="font-bold text-sm"
                              style={{ color: colors.primaryNavy }}
                            >
                              {r.title}
                            </div>
                            <div className="text-xs text-slate-600 mt-0.5">{r.desc}</div>
                            <div
                              className="text-xs font-semibold mt-1"
                              style={{ color: colors.secondaryBlue }}
                            >
                              Từ {String(r.startHour).padStart(2, "0")}:00 đến{" "}
                              {String(r.endHour).padStart(2, "0")}:59
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            setCustomReminders(customReminders.filter((rem) => rem.id !== r.id))
                          }
                          className="text-xs text-red-500 hover:underline font-medium p-1 shrink-0"
                        >
                          Xóa
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="pt-4 border-t" style={{ borderColor: colors.border }}>
              <h4 className="font-bold text-sm mb-3" style={{ color: colors.secondaryBlue }}>
                Thêm nhắc nhở mới
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1">
                    Tiêu đề nhắc nhở
                  </label>
                  <input
                    type="text"
                    value={newReminder.title}
                    onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
                    placeholder="VD: Giao ban buổi sáng..."
                    className="w-full h-9 px-3 border rounded-[4px] text-sm focus:outline-none focus:ring-1 bg-slate-50 text-slate-700"
                    style={{ borderColor: colors.border }}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1">
                    Nội dung chi tiết
                  </label>
                  <input
                    type="text"
                    value={newReminder.desc}
                    onChange={(e) => setNewReminder({ ...newReminder, desc: e.target.value })}
                    placeholder="Mô tả công việc cần làm..."
                    className="w-full h-9 px-3 border rounded-[4px] text-sm focus:outline-none focus:ring-1 bg-slate-50 text-slate-700"
                    style={{ borderColor: colors.border }}
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1">
                    Giờ bắt đầu (0-23)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={newReminder.startHour}
                    onChange={(e) =>
                      setNewReminder({ ...newReminder, startHour: parseInt(e.target.value) || 0 })
                    }
                    className="w-full h-9 px-3 border rounded-[4px] text-sm focus:outline-none focus:ring-1 bg-slate-50 text-slate-700"
                    style={{ borderColor: colors.border }}
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1">
                    Giờ kết thúc (0-23)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={newReminder.endHour}
                    onChange={(e) =>
                      setNewReminder({ ...newReminder, endHour: parseInt(e.target.value) || 0 })
                    }
                    className="w-full h-9 px-3 border rounded-[4px] text-sm focus:outline-none focus:ring-1 bg-slate-50 text-slate-700"
                    style={{ borderColor: colors.border }}
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1">
                    Biểu tượng
                  </label>
                  <select
                    value={newReminder.iconName}
                    onChange={(e) =>
                      setNewReminder({ ...newReminder, iconName: e.target.value as any })
                    }
                    className="w-full h-9 px-3 border rounded-[4px] text-sm focus:outline-none focus:ring-1 bg-slate-50 text-slate-700"
                    style={{ borderColor: colors.border }}
                  >
                    <option value="Users">Nhóm / Cán bộ</option>
                    <option value="Clock">Đồng hồ</option>
                    <option value="ClipboardList">Hồ sơ</option>
                    <option value="CheckCircle2">Hoàn thành</option>
                    <option value="AlertTriangle">Cảnh báo</option>
                    <option value="RefreshCw">Đồng bộ</option>
                  </select>
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={newReminder.isUrgent}
                      onChange={(e) =>
                        setNewReminder({ ...newReminder, isUrgent: e.target.checked })
                      }
                      className="rounded-sm"
                    />
                    Đánh dấu quan trọng (Màu đỏ)
                  </label>
                </div>
              </div>
              <button
                onClick={() => {
                  if (!newReminder.title) {
                    toast.error("Vui lòng nhập tiêu đề nhắc nhở");
                    return;
                  }
                  if (newReminder.startHour! > newReminder.endHour!) {
                    toast.error("Giờ kết thúc phải lớn hơn hoặc bằng giờ bắt đầu");
                    return;
                  }
                  const newRem: Reminder = {
                    id: Date.now().toString(),
                    title: newReminder.title!,
                    desc: newReminder.desc!,
                    startHour: newReminder.startHour!,
                    endHour: newReminder.endHour!,
                    iconName: newReminder.iconName as any,
                    isUrgent: newReminder.isUrgent || false,
                  };
                  setCustomReminders([...customReminders, newRem]);
                  setNewReminder({
                    title: "",
                    desc: "",
                    startHour: 8,
                    endHour: 10,
                    iconName: "Users",
                    isUrgent: false,
                  });
                  toast.success("Đã thêm nhắc nhở mới!");
                }}
                className="w-full mt-4 py-2 text-sm font-bold text-white rounded-[4px] hover:opacity-90"
                style={{ backgroundColor: colors.secondaryBlue }}
              >
                + Thêm vào danh sách
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
