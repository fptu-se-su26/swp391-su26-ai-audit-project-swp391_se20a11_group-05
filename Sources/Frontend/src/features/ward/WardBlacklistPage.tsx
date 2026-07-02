import React, { useState } from "react";
import { useBlacklistQuery, useUnbanUserMutation } from "@/hooks/useCampaigns";
import { Search, UserCheck, AlertTriangle, ShieldAlert, Sparkles, Inbox, RefreshCw, Mail, Phone } from "lucide-react";

export default function WardBlacklistPage() {
  const [search, setSearch] = useState("");
  const { data: bannedUsers = [], isLoading, error, refetch } = useBlacklistQuery();
  const unbanMutation = useUnbanUserMutation();

  const handleUnban = async (userId: number, fullName: string) => {
    if (confirm(`Bạn có chắc chắn muốn mở khóa tài khoản của "${fullName}"?`)) {
      try {
        await unbanMutation.mutateAsync(userId);
        alert("Đã mở khóa tài khoản thành công!");
        refetch();
      } catch (err: any) {
        alert(err.message || "Có lỗi xảy ra, vui lòng thử lại sau.");
      }
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <ShieldAlert className="h-5.5 w-5.5 text-rose-500" />
            Danh sách chặn (Blacklist)
          </h2>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Quản lý và giám sát các tài khoản bị khóa do vi phạm tiêu chuẩn cộng đồng hoặc tích lũy đủ 3 cảnh cáo.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-800 border border-slate-200 hover:border-slate-350 bg-white rounded-lg transition-all cursor-pointer shadow-sm"
        >
          <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
          Tải lại
        </button>
      </div>

      {/* Control bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-150/80 dark:border-slate-800/80">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, tài khoản, email, số điện thoại..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
        </div>
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Tổng cộng: {filteredUsers.length} tài khoản
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-150/80 dark:border-slate-800/80 shadow-sm">
          <div className="h-9 w-9 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-500">Đang tải danh sách chặn...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 bg-rose-50/50 dark:bg-rose-950/5 border border-rose-100 dark:border-rose-900/50 rounded-xl">
          <AlertTriangle className="h-10 w-10 text-rose-500" />
          <p className="text-sm font-bold text-rose-700">Không thể tải danh sách tài khoản bị chặn</p>
          <p className="text-xs text-slate-500">{(error as any)?.message || "Vui lòng thử lại sau"}</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-150/80 dark:border-slate-800/80 shadow-sm">
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-emerald-100 dark:bg-emerald-950/30 rounded-full scale-150 blur-xl opacity-60"></div>
            <Inbox className="h-12 w-12 text-slate-350 dark:text-slate-600 relative z-10" />
          </div>
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Không có tài khoản bị chặn</p>
          <p className="text-xs text-slate-450 dark:text-slate-500 mt-1 max-w-sm">
            {search ? "Không tìm thấy kết quả nào phù hợp với từ khóa." : "Nhóm chat và cộng đồng của bạn hiện tại hoạt động rất tích cực và sạch sẽ!"}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-150/80 dark:border-slate-800/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                  <th className="px-6 py-4">Tài khoản & Họ tên</th>
                  <th className="px-6 py-4">Liên hệ</th>
                  <th className="px-6 py-4 text-center">Số cảnh cáo</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/55 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 place-items-center rounded-full bg-rose-150 text-rose-700 font-bold shrink-0">
                          {user.fullName.split(" ").at(-1)?.[0] || "U"}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 dark:text-slate-200">{user.fullName}</div>
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
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30">
                        <ShieldAlert size={12} /> Bị chặn (Banned)
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleUnban(user.id, user.fullName)}
                        disabled={unbanMutation.isPending}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-600 hover:text-white bg-indigo-50 hover:bg-indigo-600 rounded-lg transition-all duration-200 cursor-pointer disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
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
    </div>
  );
}
