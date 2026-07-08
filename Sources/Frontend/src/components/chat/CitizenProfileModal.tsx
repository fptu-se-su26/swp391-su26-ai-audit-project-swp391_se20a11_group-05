import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userApi, campaignApi } from "@/lib/api";
import {
  useWarnUserMutation,
  useBanUserMutation,
  useUnbanUserMutation,
} from "@/hooks/useCampaigns";
import { useAuth, Role } from "@/lib/auth";
import {
  X,
  ShieldAlert,
  AlertTriangle,
  User,
  Mail,
  Phone,
  MapPin,
  UserX,
  CheckCircle,
  Clock,
  Award,
  Frown,
  Calendar,
} from "lucide-react";

const getRoleBadge = (role: string) => {
  switch (role) {
    case "CITIZEN":
      return {
        label: "Người dân",
        className: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400",
      };
    case "WARD_STAFF":
      return {
        label: "Cán bộ Phường",
        className:
          "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-400",
      };
    case "POLICE":
      return {
        label: "Công an địa phương",
        className:
          "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-400",
      };
    case "CITY_ADMIN":
      return {
        label: "Quản trị viên Thành phố",
        className:
          "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400",
      };
    case "SUPER_ADMIN":
      return {
        label: "Quản trị viên cấp cao",
        className:
          "bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/30 dark:text-purple-400",
      };
    default:
      return {
        label: role,
        className: "bg-slate-50 text-slate-700 dark:bg-slate-950/30 dark:text-slate-400",
      };
  }
};

const getAvatarStyle = (role: string) => {
  switch (role) {
    case "WARD_STAFF":
      return "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400";
    case "POLICE":
      return "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400";
    case "CITY_ADMIN":
    case "SUPER_ADMIN":
      return "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400";
    default:
  }
};

const getAvatarAuraClass = (badge?: string) => {
  if (!badge) return "";
  switch (badge) {
    case "Đại sứ Vì cộng đồng":
      return "ring-4 ring-amber-400 dark:ring-amber-500 shadow-[0_0_15px_#f59e0b] ring-offset-2 ring-offset-white dark:ring-offset-slate-900";
    case "Trụ cột Cộng đồng":
      return "ring-4 ring-cyan-400 dark:ring-cyan-500 shadow-[0_0_12px_#06b6d4] ring-offset-2 ring-offset-white dark:ring-offset-slate-900";
    case "Thành viên Năng nổ":
      return "ring-4 ring-emerald-400 dark:ring-emerald-500 shadow-[0_0_8px_#10b981] ring-offset-2 ring-offset-white dark:ring-offset-slate-900";
    default: // Tình nguyện viên Mới
      return "ring-2 ring-slate-300 dark:ring-slate-700 ring-offset-2 ring-offset-white dark:ring-offset-slate-900";
  }
};

const getReputationBadgeStyle = (badge: string) => {
  switch (badge) {
    case "Đại sứ Vì cộng đồng":
      return "bg-gradient-to-r from-[#dc2626] via-[#ea580c] to-[#eab308] text-white shadow-[0_0_15px_rgba(245,158,11,0.8)] [text-shadow:0_0_6px_rgba(255,255,255,0.9)] border border-yellow-400/50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider";
    case "Trụ cột Cộng đồng":
      return "bg-gradient-to-r from-[#2563eb] to-[#06b6d4] text-white shadow-[0_0_12px_rgba(6,182,212,0.7)] [text-shadow:0_0_5px_rgba(255,255,255,0.9)] border border-cyan-400/40 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider";
    case "Thành viên Năng nổ":
      return "bg-gradient-to-r from-[#059669] to-[#10b981] text-white shadow-[0_0_10px_rgba(16,185,129,0.6)] [text-shadow:0_0_4px_rgba(255,255,255,0.9)] border border-emerald-400/30 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider";
    default: // Tình nguyện viên Mới
      return "bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-700/50 px-2.5 py-0.5 text-xs font-bold";
  }
};

const getReputationBadgeLabel = (badge: string) => {
  switch (badge) {
    case "Đại sứ Vì cộng đồng":
      return "ĐẠI SỨ VÌ CỘNG ĐỒNG";
    case "Trụ cột Cộng đồng":
      return "TRỤ CỘT CỘNG ĐỒNG";
    case "Thành viên Năng nổ":
      return "THÀNH VIÊN NĂNG NỔ";
    default:
      return "Tình nguyện viên Mới";
  }
};

export function CitizenProfileModal({
  userId,
  onClose,
  hideModerationActions = false,
}: {
  userId: number;
  onClose: () => void;
  hideModerationActions?: boolean;
}) {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [reason, setReason] = useState("");
  const [actionType, setActionType] = useState<"WARN" | "BAN" | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const canModerate =
    currentUser &&
    (currentUser.role === Role.WARD_STAFF ||
      currentUser.role === Role.POLICE ||
      currentUser.role === Role.SUPER_ADMIN);

  const {
    data: profile,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => userApi.getById(userId),
    enabled: !!userId,
  });

  const [selectedHistoryTab, setSelectedHistoryTab] = useState<"completed" | "noshow" | null>(null);

  const canViewHistory =
    currentUser &&
    (currentUser.role === Role.WARD_STAFF ||
      currentUser.role === Role.POLICE ||
      currentUser.role === Role.SUPER_ADMIN);

  const { data: historyList, isLoading: isHistoryLoading } = useQuery({
    queryKey: ["user-campaign-history", userId],
    queryFn: () => campaignApi.getCitizenParticipationHistory(userId),
    enabled: !!userId && !!canViewHistory,
  });

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const hrs = String(d.getHours()).padStart(2, "0");
    const mins = String(d.getMinutes()).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const yr = d.getFullYear();
    return `${hrs}:${mins} ${day}/${month}/${yr}`;
  };

  const warnMutation = useWarnUserMutation();
  const banMutation = useBanUserMutation();
  const unbanMutation = useUnbanUserMutation();

  const handleUnban = async () => {
    if (!profile) return;
    if (!window.confirm(`Bạn có chắc chắn muốn mở khóa cho người dùng ${profile.fullName}?`)) {
      return;
    }
    try {
      setErrorMsg("");
      await unbanMutation.mutateAsync(userId);
      setSuccessMsg("Mở khóa người dùng thành công!");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Không thể mở khóa.";
      setErrorMsg(errorMsg);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setErrorMsg(`Vui lòng nhập lý do ${actionType === "WARN" ? "cảnh cáo" : "chặn"}`);
      return;
    }

    try {
      setErrorMsg("");
      if (actionType === "WARN") {
        await warnMutation.mutateAsync({ userId, reason });
        setSuccessMsg("Cảnh cáo thành viên thành công!");
      } else {
        await banMutation.mutateAsync({ userId, reason });
        setSuccessMsg("Chặn thành viên thành công!");
      }
      setReason("");
      setActionType(null);
      refetch();
      // Invalidate general query keys to sync lists
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Không thể thực hiện yêu cầu. Vui lòng thử lại.";
      setErrorMsg(errorMsg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 transition-all duration-300 transform scale-100 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-indigo-600" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Thông tin cá nhân
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <div className="h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-medium text-slate-500">Đang tải thông tin...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-10 w-10 text-rose-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-rose-600">Đã xảy ra lỗi khi lấy thông tin</p>
              <p className="text-xs text-slate-400 mt-1">
                {(error as { message?: string })?.message || "Vui lòng thử lại sau"}
              </p>
            </div>
          ) : profile ? (
            <div className="space-y-5">
              {/* Profile card summary */}
              <div className="flex items-center gap-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.fullName}
                    className={`h-12 w-12 rounded-full object-cover border border-slate-200 dark:border-slate-800 shrink-0 ${
                      profile.role === "CITIZEN" ? getAvatarAuraClass(profile.reputationBadge) : ""
                    }`}
                  />
                ) : (
                  <div
                    className={`grid h-12 w-12 place-items-center rounded-full text-lg font-black transition-all duration-300 ${getAvatarStyle(profile.role)} ${
                      profile.role === "CITIZEN" ? getAvatarAuraClass(profile.reputationBadge) : ""
                    }`}
                  >
                    {profile.fullName.split(" ").at(-1)?.[0] || "U"}
                  </div>
                )}
                <div>
                  <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">
                    {profile.fullName}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${getRoleBadge(profile.role).className}`}
                    >
                      {getRoleBadge(profile.role).label}
                    </span>
                    {profile.role === "CITIZEN" && (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                          profile.active
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
                            : "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400"
                        }`}
                      >
                        {profile.active ? (
                          <>
                            <CheckCircle size={10} /> Hoạt động
                          </>
                        ) : (
                          <>
                            <Clock size={10} /> Bị chặn / Khóa
                          </>
                        )}
                      </span>
                    )}
                  </div>
                  {profile.role === "CITIZEN" && profile.reputationBadge && (
                    <div className="flex items-center gap-1 mt-2 animate-fade-in">
                      <span
                        className={`inline-flex items-center rounded-full transition-all duration-300 hover:scale-105 cursor-default ${getReputationBadgeStyle(profile.reputationBadge)}`}
                      >
                        {getReputationBadgeLabel(profile.reputationBadge)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status / Warnings alert */}
              {profile.role === "CITIZEN" &&
                profile.warningCount !== undefined &&
                profile.warningCount > 0 && (
                  <div className="flex items-start gap-3 p-3.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 dark:bg-amber-950/10 dark:border-amber-900/50 dark:text-amber-300">
                    <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-sm font-bold">Lịch sử cảnh cáo</h5>
                      <p className="text-xs mt-0.5 font-medium">
                        Tài khoản này đã bị cảnh cáo{" "}
                        <strong className="text-amber-600 dark:text-amber-400">
                          {profile.warningCount}/3
                        </strong>{" "}
                        lần. Đạt 3 lần sẽ bị tự động chặn vĩnh viễn khỏi hệ thống.
                      </p>
                    </div>
                  </div>
                )}

              {/* Contact info list */}
              <div className="space-y-3.5">
                <div className="flex items-center gap-3 text-slate-655 dark:text-slate-400 text-sm">
                  <Mail className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                  <span className="font-medium truncate">
                    {profile.email || "Chưa cập nhật email"}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-slate-655 dark:text-slate-400 text-sm">
                  <Phone className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                  <span className="font-medium">
                    {profile.phoneNumber || "Chưa cập nhật số điện thoại"}
                  </span>
                </div>
                {profile.wardName && (
                  <div className="flex items-center gap-3 text-slate-655 dark:text-slate-400 text-sm">
                    <MapPin className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                    <span className="font-medium">
                      {profile.wardType || ""} {profile.wardName}
                    </span>
                  </div>
                )}
              </div>

              {/* Volunteer Participation Stats */}
              {profile.role === "CITIZEN" && (
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <h5 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Thống kê hoạt động
                  </h5>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Attended Campaigns */}
                    <div
                      onClick={() => {
                        if (canViewHistory) {
                          setSelectedHistoryTab(
                            selectedHistoryTab === "completed" ? null : "completed",
                          );
                        }
                      }}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 select-none ${
                        canViewHistory
                          ? "cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-700 active:scale-95"
                          : ""
                      } ${
                        selectedHistoryTab === "completed"
                          ? "ring-2 ring-emerald-500/50 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-700"
                          : "bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/30"
                      }`}
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                        <Award size={20} />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-none">
                          Tham gia
                        </div>
                        <div className="text-lg font-black text-emerald-700 dark:text-emerald-400 mt-1">
                          {profile.completedCampaignCount ?? 0}
                        </div>
                      </div>
                    </div>

                    {/* No-Shows */}
                    <div
                      onClick={() => {
                        if (canViewHistory) {
                          setSelectedHistoryTab(selectedHistoryTab === "noshow" ? null : "noshow");
                        }
                      }}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 select-none ${
                        canViewHistory
                          ? "cursor-pointer hover:border-rose-300 dark:hover:border-rose-700 active:scale-95"
                          : ""
                      } ${
                        selectedHistoryTab === "noshow"
                          ? "ring-2 ring-rose-500/50 bg-rose-50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-700"
                          : (profile.noShowCampaignCount ?? 0) > 0
                            ? "bg-rose-50/50 dark:bg-rose-950/10 border-rose-100 dark:border-rose-900/30"
                            : "bg-slate-50 dark:bg-slate-800/20 border-slate-100 dark:border-slate-800"
                      }`}
                    >
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                          (profile.noShowCampaignCount ?? 0) > 0
                            ? "bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        <Frown size={20} />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-none">
                          Vắng mặt (Bùng)
                        </div>
                        <div
                          className={`text-lg font-black mt-1 ${
                            (profile.noShowCampaignCount ?? 0) > 0
                              ? "text-rose-700 dark:text-rose-400"
                              : "text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {profile.noShowCampaignCount ?? 0}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Collapsible Campaign History Section */}
                  {selectedHistoryTab && (
                    <div className="mt-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold tracking-wider uppercase text-slate-400">
                          {selectedHistoryTab === "completed"
                            ? "Danh sách đã tham gia"
                            : "Danh sách vắng mặt (Bùng)"}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedHistoryTab(null)}
                          className="text-[10px] font-bold text-slate-400 hover:text-slate-655 dark:hover:text-slate-350 cursor-pointer"
                        >
                          Thu gọn
                        </button>
                      </div>

                      {isHistoryLoading ? (
                        <div className="flex justify-center items-center py-4 gap-2">
                          <div className="h-4 w-4 border-2 border-indigo-650 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-xs text-slate-400 font-medium">
                            Đang tải lịch sử...
                          </span>
                        </div>
                      ) : (
                        (() => {
                          const filtered = (historyList || []).filter((item) =>
                            selectedHistoryTab === "completed"
                              ? item.attended === true
                              : item.joinStatus === "NO_SHOW" ||
                                (item.joinStatus === "APPROVED" &&
                                  item.attended === false &&
                                  !!item.attendedAt),
                          );

                          if (filtered.length === 0) {
                            return (
                              <p className="text-xs font-semibold text-slate-400 text-center py-3">
                                Không có dữ liệu chiến dịch nào.
                              </p>
                            );
                          }

                          return (
                            <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                              {filtered.map((item) => (
                                <div
                                  key={item.id}
                                  className="p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-950 flex flex-col gap-1 text-xs"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <span className="font-bold text-slate-700 dark:text-slate-300 break-words flex-1">
                                      {item.campaignTitle || `Chiến dịch #${item.campaignId}`}
                                    </span>
                                    <span
                                      className={`inline-flex shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                                        item.attended
                                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
                                          : "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400"
                                      }`}
                                    >
                                      {item.attended ? "Đã tham gia" : "Vắng mặt"}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-medium">
                                    <Calendar size={11} className="shrink-0" />
                                    <span>
                                      {item.attended
                                        ? `Điểm danh lúc: ${formatDate(item.attendedAt || item.createdAt)}`
                                        : `Đăng ký lúc: ${formatDate(item.createdAt)}`}
                                    </span>
                                  </div>
                                  {!item.attended && item.rejectionReason && (
                                    <div className="mt-1 p-1.5 rounded bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100/50 dark:border-rose-900/20 text-[10px] text-rose-600 dark:text-rose-400 leading-normal font-medium">
                                      <strong>Lý do vắng mặt:</strong> {item.rejectionReason}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          );
                        })()
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Success / Error feedbacks */}
              {successMsg && (
                <div className="p-3 text-sm font-medium text-emerald-700 bg-emerald-50 rounded-lg border border-emerald-200">
                  {successMsg}
                </div>
              )}
              {errorMsg && (
                <div className="p-3 text-sm font-medium text-rose-700 bg-rose-50 rounded-lg border border-rose-200">
                  {errorMsg}
                </div>
              )}

              {/* Actions panel */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                {actionType === null ? (
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    >
                      Đóng
                    </button>
                    {canModerate &&
                      !hideModerationActions &&
                      profile.role === "CITIZEN" &&
                      (profile.active ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setActionType("WARN")}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-lg shadow-sm hover:shadow transition-all duration-200 cursor-pointer"
                          >
                            <AlertTriangle size={15} /> Cảnh cáo
                          </button>
                          <button
                            type="button"
                            onClick={() => setActionType("BAN")}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm hover:shadow transition-all duration-200 cursor-pointer"
                          >
                            <UserX size={15} /> Chặn
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={handleUnban}
                          disabled={unbanMutation.isPending}
                          className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm hover:shadow disabled:bg-slate-300 disabled:shadow-none transition-all duration-200 cursor-pointer"
                        >
                          <CheckCircle size={15} /> Mở khóa
                        </button>
                      ))}
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-3.5 animate-slide-down">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                        {actionType === "WARN" ? "Lý do cảnh cáo" : "Lý do chặn tài khoản"}
                      </label>
                      <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder={
                          actionType === "WARN"
                            ? "Nhập lý do gửi cảnh cáo (ví dụ: Spam tin nhắn, phát ngôn thiếu văn hóa...)"
                            : "Nhập lý do chặn tài khoản (ví dụ: Vi phạm quy định nghiêm trọng, phá hoại chiến dịch...)"
                        }
                        rows={3}
                        className={`w-full rounded-xl border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-950 p-3 text-sm focus:ring-1 focus:outline-none ${
                          actionType === "WARN"
                            ? "focus:border-amber-400 focus:ring-amber-400"
                            : "focus:border-rose-500 focus:ring-rose-500"
                        }`}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setActionType(null)}
                        className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={warnMutation.isPending || banMutation.isPending}
                        className={`px-4 py-2 text-sm font-bold text-white rounded-lg shadow-sm hover:shadow disabled:bg-slate-300 disabled:shadow-none transition-all duration-200 cursor-pointer flex items-center gap-1 ${
                          actionType === "WARN"
                            ? "bg-amber-500 hover:bg-amber-600"
                            : "bg-rose-600 hover:bg-rose-700"
                        }`}
                      >
                        {(warnMutation.isPending || banMutation.isPending) && (
                          <span className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        )}
                        Xác nhận {actionType === "WARN" ? "cảnh cáo" : "chặn"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
