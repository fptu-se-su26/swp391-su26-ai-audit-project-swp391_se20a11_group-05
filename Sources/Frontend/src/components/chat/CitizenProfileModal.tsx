import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userApi } from "@/lib/api";
import { useWarnUserMutation, useBanUserMutation, useUnbanUserMutation } from "@/hooks/useCampaigns";
import { useAuth, Role } from "@/lib/auth";
import { X, ShieldAlert, AlertTriangle, User, Mail, Phone, MapPin, UserX, CheckCircle, Clock } from "lucide-react";

export function CitizenProfileModal({
  userId,
  onClose,
}: {
  userId: number;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [reason, setReason] = useState("");
  const [actionType, setActionType] = useState<"WARN" | "BAN" | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const canModerate = currentUser && (
    currentUser.role === Role.WARD_STAFF ||
    currentUser.role === Role.POLICE ||
    currentUser.role === Role.SUPER_ADMIN
  );

  const { data: profile, isLoading, error, refetch } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => userApi.getById(userId),
    enabled: !!userId,
  });

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
    } catch (err: any) {
      setErrorMsg(err.message || "Không thể mở khóa.");
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
    } catch (err: any) {
      setErrorMsg(err.message || `Không thể thực hiện yêu cầu. Vui lòng thử lại.`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 transition-all duration-300 transform scale-100 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-indigo-600" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Thông tin cá nhân</h3>
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
              <p className="text-xs text-slate-400 mt-1">{(error as any)?.message || "Vui lòng thử lại sau"}</p>
            </div>
          ) : profile ? (
            <div className="space-y-5">
              {/* Profile card summary */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-lg font-black">
                  {profile.fullName.split(" ").at(-1)?.[0] || "U"}
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">{profile.fullName}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400">
                      {profile.role === "CITIZEN" ? "Người dân" : profile.role}
                    </span>
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
                  </div>
                </div>
              </div>

              {/* Status / Warnings alert */}
              {profile.warningCount !== undefined && profile.warningCount > 0 && (
                <div className="flex items-start gap-3 p-3.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 dark:bg-amber-950/10 dark:border-amber-900/50 dark:text-amber-300">
                  <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-sm font-bold">Lịch sử cảnh cáo</h5>
                    <p className="text-xs mt-0.5 font-medium">
                      Tài khoản này đã bị cảnh cáo <strong className="text-amber-600 dark:text-amber-400">{profile.warningCount}/3</strong> lần. Đạt 3 lần sẽ bị tự động chặn vĩnh viễn khỏi hệ thống.
                    </p>
                  </div>
                </div>
              )}

              {/* Contact info list */}
              <div className="space-y-3.5">
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400 text-sm">
                  <Mail className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                  <span className="font-medium truncate">{profile.email || "Chưa cập nhật email"}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400 text-sm">
                  <Phone className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                  <span className="font-medium">{profile.phoneNumber || "Chưa cập nhật số điện thoại"}</span>
                </div>
                {profile.wardName && (
                  <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400 text-sm">
                    <MapPin className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                    <span className="font-medium">
                      {profile.wardType || ""} {profile.wardName}
                    </span>
                  </div>
                )}
              </div>

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
                    {canModerate && (
                      profile.active ? (
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
                      )
                    )}
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
