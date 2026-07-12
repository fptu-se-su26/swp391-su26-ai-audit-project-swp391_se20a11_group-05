import React, { useState } from "react";
import { useBlacklistQuery, useUnbanUserMutation } from "@/hooks/useCampaigns";
import {
  usePendingCampaignAppealsQuery,
  useApproveCampaignAppealMutation,
  useRejectCampaignAppealMutation,
} from "@/hooks/useCampaigns";
import {
  Search,
  UserCheck,
  AlertTriangle,
  ShieldAlert,
  Inbox,
  RefreshCw,
  Mail,
  Phone,
  CheckCircle2,
  XCircle,
  FileText,
  MessageSquare,
  Clock,
  ChevronRight,
} from "lucide-react";

export default function WardBlacklistPage() {
  const [activeTab, setActiveTab] = useState<"platform" | "appeals">("platform");
  const [search, setSearch] = useState("");
  
  // Platform blacklist hooks
  const { data: bannedUsers = [], isLoading: isBlacklistLoading, error: blacklistError, refetch: refetchBlacklist } = useBlacklistQuery();
  const unbanMutation = useUnbanUserMutation();

  // Appeal hooks
  const { data: pendingAppeals = [], isLoading: isAppealsLoading, error: appealsError, refetch: refetchAppeals } = usePendingCampaignAppealsQuery();
  const approveAppealMutation = useApproveCampaignAppealMutation();
  const rejectAppealMutation = useRejectCampaignAppealMutation();

  const [selectedAppealId, setSelectedAppealId] = useState<number | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");

  const handleUnban = async (userId: number, fullName: string) => {
    if (confirm(`Bạn có chắc chắn muốn mở khóa tài khoản của "${fullName}"?`)) {
      try {
        await unbanMutation.mutateAsync(userId);
        alert("Đã mở khóa tài khoản thành công!");
        refetchBlacklist();
      } catch (err: any) {
        alert(err.message || "Có lỗi xảy ra, vui lòng thử lại sau.");
      }
    }
  };

  const handleApproveAppeal = async (appealId: number) => {
    try {
      await approveAppealMutation.mutateAsync({ id: appealId, reviewNotes });
      alert("Đã duyệt đơn giải trình và mở khóa quyền tham gia chiến dịch!");
      setSelectedAppealId(null);
      setReviewNotes("");
      refetchAppeals();
    } catch (err: any) {
      alert(err.message || "Có lỗi xảy ra khi duyệt đơn.");
    }
  };

  const handleRejectAppeal = async (appealId: number) => {
    if (!reviewNotes.trim()) {
      alert("Vui lòng nhập lý do từ chối đơn giải trình.");
      return;
    }
    try {
      await rejectAppealMutation.mutateAsync({ id: appealId, reviewNotes });
      alert("Đã từ chối đơn giải trình.");
      setSelectedAppealId(null);
      setReviewNotes("");
      refetchAppeals();
    } catch (err: any) {
      alert(err.message || "Có lỗi xảy ra khi từ chối đơn.");
    }
  };

  const handleRefresh = () => {
    if (activeTab === "platform") {
      refetchBlacklist();
    } else {
      refetchAppeals();
    }
  };

  const filteredUsers = bannedUsers.filter((user) => {
    const term = search.toLowerCase();
    return (
      user.fullName.toLowerCase().includes(term) ||
      user.username.toLowerCase().includes(term) ||
      (user.email && user.email.toLowerCase().includes(term)) ||
      (user.phoneNumber && user.phoneNumber.includes(term))
    );
  });

  const filteredAppeals = pendingAppeals.filter((appeal) => {
    const term = search.toLowerCase();
    return (
      appeal.citizenName.toLowerCase().includes(term) ||
      appeal.reason.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <ShieldAlert className="h-5.5 w-5.5 text-rose-500" />
            Danh sách chặn & giải trình
          </h2>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Quản lý tài khoản bị chặn trên hệ thống và xử lý các đơn xin mở khóa quyền tham gia chiến dịch.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-800 border border-slate-200 hover:border-slate-350 bg-white rounded-lg transition-all cursor-pointer shadow-sm hover:shadow"
        >
          <RefreshCw size={13} className={isBlacklistLoading || isAppealsLoading ? "animate-spin" : ""} />
          Tải lại
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => { setActiveTab("platform"); setSearch(""); }}
          className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "platform"
              ? "border-indigo-600 text-indigo-600 font-extrabold"
              : "border-transparent text-slate-550 hover:text-slate-800"
          }`}
        >
          Tài khoản bị chặn ({bannedUsers.length})
        </button>
        <button
          onClick={() => { setActiveTab("appeals"); setSearch(""); }}
          className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "appeals"
              ? "border-indigo-600 text-indigo-600 font-extrabold"
              : "border-transparent text-slate-550 hover:text-slate-800"
          }`}
        >
          Đơn giải trình chiến dịch ({pendingAppeals.length})
        </button>
      </div>

      {/* Control bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-150/80 dark:border-slate-800/80">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder={
              activeTab === "platform"
                ? "Tìm kiếm tài khoản..."
                : "Tìm theo tên công dân, lý do giải trình..."
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
        </div>
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          {activeTab === "platform"
            ? `Tổng cộng: ${filteredUsers.length} tài khoản`
            : `Đang chờ: ${filteredAppeals.length} đơn`}
        </div>
      </div>

      {/* Content for Platform Blacklist */}
      {activeTab === "platform" && (
        <>
          {isBlacklistLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-150/80 dark:border-slate-800/80 shadow-sm">
              <div className="h-9 w-9 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-semibold text-slate-500">Đang tải danh sách chặn...</p>
            </div>
          ) : blacklistError ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 bg-rose-50/50 dark:bg-rose-950/5 border border-rose-100 dark:border-rose-900/50 rounded-xl">
              <AlertTriangle className="h-10 w-10 text-rose-500" />
              <p className="text-sm font-bold text-rose-700">
                Không thể tải danh sách tài khoản bị chặn
              </p>
              <p className="text-xs text-slate-550">
                {(blacklistError as any)?.message || "Vui lòng thử lại sau"}
              </p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-150/80 dark:border-slate-800/80 shadow-sm">
              <Inbox className="h-12 w-12 text-slate-350 dark:text-slate-650 mb-3" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Không có tài khoản bị chặn
              </p>
              <p className="text-xs text-slate-450 mt-1">
                Không tìm thấy kết quả nào phù hợp.
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-150/80 dark:border-slate-800/80 overflow-hidden">
              <div className="overflow-x-auto max-h-[550px] overflow-y-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                      <th className="px-6 py-4 border-b border-slate-150 dark:border-slate-800">
                        Tài khoản & Họ tên
                      </th>
                      <th className="px-6 py-4 border-b border-slate-150 dark:border-slate-800">
                        Liên hệ
                      </th>
                      <th className="px-6 py-4 border-b border-slate-150 dark:border-slate-800 text-center">
                        Số cảnh cáo
                      </th>
                      <th className="px-6 py-4 border-b border-slate-150 dark:border-slate-800">
                        Trạng thái
                      </th>
                      <th className="px-6 py-4 border-b border-slate-150 dark:border-slate-800 text-right">
                        Hành động
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                    {filteredUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="hover:bg-slate-50/55 dark:hover:bg-slate-800/20 transition-colors animate-fade-in"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="grid h-9 w-9 place-items-center rounded-full bg-rose-150 text-rose-700 font-bold shrink-0">
                              {user.fullName.split(" ").at(-1)?.[0] || "U"}
                            </div>
                            <div>
                              <div className="font-bold text-slate-800 dark:text-slate-200">
                                {user.fullName}
                              </div>
                              <div className="text-xs text-slate-400 font-medium">@{user.username}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-600 dark:text-slate-400">
                          {user.email && (
                            <div className="flex items-center gap-1.5 text-xs">
                              <Mail size={12} className="text-slate-400" />
                              <span>{user.email}</span>
                            </div>
                          )}
                          {user.phoneNumber && (
                            <div className="flex items-center gap-1.5 text-xs mt-1">
                              <Phone size={12} className="text-slate-400" />
                              <span>{user.phoneNumber}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50">
                            {user.warningCount || 0} / 3 cảnh cáo
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {user.isCampaignBanned && user.status !== "BANNED" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30">
                              <AlertTriangle size={12} /> Cấm chiến dịch
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30">
                              <ShieldAlert size={12} /> Bị chặn (Banned)
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleUnban(user.id, user.fullName)}
                            disabled={unbanMutation.isPending}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-600 hover:text-white bg-indigo-50 hover:bg-indigo-600 rounded-lg transition-all duration-200 cursor-pointer disabled:bg-slate-100 disabled:text-slate-400"
                          >
                            {unbanMutation.isPending ? (
                              <span className="h-3 w-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
                            ) : (
                              <UserCheck size={13} />
                            )}
                            Mở khóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Content for Campaign Appeals */}
      {activeTab === "appeals" && (
        <>
          {isAppealsLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-150/80 dark:border-slate-800/80 shadow-sm">
              <div className="h-9 w-9 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-semibold text-slate-500">Đang tải danh sách đơn giải trình...</p>
            </div>
          ) : appealsError ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 bg-rose-50/50 dark:bg-rose-950/5 border border-rose-100 dark:border-rose-900/50 rounded-xl">
              <AlertTriangle className="h-10 w-10 text-rose-500" />
              <p className="text-sm font-bold text-rose-700">
                Không thể tải danh sách đơn giải trình
              </p>
              <p className="text-xs text-slate-550">
                {(appealsError as any)?.message || "Vui lòng thử lại sau"}
              </p>
            </div>
          ) : filteredAppeals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-150/80 dark:border-slate-800/80 shadow-sm">
              <Inbox className="h-12 w-12 text-slate-350 dark:text-slate-655 mb-3" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Không có đơn giải trình nào đang chờ
              </p>
              <p className="text-xs text-slate-450 mt-1">
                Tất cả các đơn đã được giải quyết hoặc chưa có đơn nào được gửi lên.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Left Column: Appeals List */}
              <div className="lg:col-span-2 space-y-4">
                {filteredAppeals.map((appeal) => (
                  <div
                    key={appeal.id}
                    onClick={() => {
                      setSelectedAppealId(appeal.id);
                      setReviewNotes("");
                    }}
                    className={`p-5 bg-white dark:bg-slate-900 rounded-xl border transition-all duration-200 cursor-pointer ${
                      selectedAppealId === appeal.id
                        ? "border-indigo-600 ring-1 ring-indigo-650/40 bg-indigo-50/10"
                        : "border-slate-150/80 dark:border-slate-800 hover:border-slate-300 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                          {appeal.citizenName[0] || "C"}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                            {appeal.citizenName}
                          </h4>
                          <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 mt-1">
                            <Clock size={11} />
                            {new Date(appeal.createdAt).toLocaleString("vi-VN")}
                          </span>
                        </div>
                      </div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        Chờ duyệt
                      </span>
                    </div>

                    <div className="mt-4 bg-slate-50 dark:bg-slate-950 p-3.5 rounded-lg border border-slate-100 dark:border-slate-800/80">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <FileText size={12} className="text-slate-400" />
                        Lý do từ công dân:
                      </p>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 italic leading-relaxed">
                        "{appeal.reason}"
                      </p>
                    </div>

                    <div className="mt-3.5 flex items-center justify-end text-xs font-bold text-indigo-600 gap-1">
                      <span>Xem & xét duyệt</span>
                      <ChevronRight size={14} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Right Column: Review Action Panel */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-150/80 dark:border-slate-800/80 p-5 shadow-sm sticky top-24">
                {selectedAppealId ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                      <MessageSquare size={16} className="text-indigo-600" />
                      <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-tight">
                        Xem xét giải trình #{selectedAppealId}
                      </h3>
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-2">
                        Ý kiến / Ghi chú phản hồi:
                      </label>
                      <textarea
                        rows={5}
                        placeholder="Nhập phản hồi cho công dân... (Bắt buộc nếu từ chối)"
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        className="w-full p-3 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => handleRejectAppeal(selectedAppealId)}
                        disabled={rejectAppealMutation.isPending || approveAppealMutation.isPending}
                        className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 text-xs font-bold transition-all cursor-pointer disabled:bg-slate-100 disabled:text-slate-400"
                      >
                        <XCircle size={14} />
                        Từ chối
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApproveAppeal(selectedAppealId)}
                        disabled={rejectAppealMutation.isPending || approveAppealMutation.isPending}
                        className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-lg bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 text-xs font-bold transition-all cursor-pointer disabled:bg-slate-100 disabled:text-slate-400"
                      >
                        <CheckCircle2 size={14} />
                        Duyệt & Mở khóa
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <MessageSquare size={36} className="text-slate-300 mx-auto mb-3" />
                    <p className="text-xs font-bold text-slate-500">
                      Chọn một đơn giải trình bên trái để bắt đầu xét duyệt.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
