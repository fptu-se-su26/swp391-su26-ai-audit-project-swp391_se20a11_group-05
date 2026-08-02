import { useState, useMemo, useRef } from "react";
import {
  ArrowLeft,
  Search,
  Save,
  CheckCircle,
  XCircle,
  UserCheck,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useLookupParticipantByPhone, useBulkSaveAttendance } from "@/hooks/useCampaigns";
import type { CampaignParticipantResponse } from "@/lib/api";
import type { Campaign } from "@/lib/campaignStore";
import { CitizenProfileModal } from "@/components/chat/CitizenProfileModal";

type WardAttendancePageProps = {
  campaign: Campaign;
  participants: CampaignParticipantResponse[];
  onBack: () => void;
  theme: any;
};

export function WardAttendancePage({
  campaign,
  participants,
  onBack,
  theme,
}: WardAttendancePageProps) {
  // Lọc ra những người có trạng thái APPROVED hoặc NO_SHOW (những người đã được duyệt)
  const attendanceList = useMemo(() => {
    return participants.filter((p) => p.joinStatus === "APPROVED" || p.joinStatus === "NO_SHOW");
  }, [participants]);

  // Local state để lưu kết quả điểm danh trước khi bấm Save
  // Khởi tạo dựa trên thuộc tính `attended` từ backend
  const [localAttendance, setLocalAttendance] = useState<Record<number, boolean>>(() => {
    const initial: Record<number, boolean> = {};
    attendanceList.forEach((p) => {
      // Nếu attended là true -> true, ngược lại (false hoặc null) -> false (mặc định là vắng)
      initial[p.id] = p.attended === true;
    });
    return initial;
  });

  const [phoneSearch, setPhoneSearch] = useState("");
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const [selectedCitizenId, setSelectedCitizenId] = useState<number | null>(null);

  const rowRefs = useRef<Record<number, HTMLTableRowElement | null>>({});

  const lookupMutation = useLookupParticipantByPhone(campaign.id);
  const saveAttendanceMutation = useBulkSaveAttendance(campaign.id);

  // Xử lý tìm kiếm SĐT
  const handleSearchPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneSearch.trim()) return;

    try {
      const result = await lookupMutation.mutateAsync(phoneSearch.trim());
      if (result) {
        toast.success(`Tìm thấy người tham gia: ${result.citizenName}`);

        // Highlight dòng
        setHighlightedId(result.id);

        // Cuộn tới dòng đó
        setTimeout(() => {
          const row = rowRefs.current[result.id];
          if (row) {
            row.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 100);

        // Tự động tắt highlight sau 5 giây
        setTimeout(() => {
          setHighlightedId((curr) => (curr === result.id ? null : curr));
        }, 5000);
      }
    } catch (err: any) {
      toast.error(
        err?.message ||
          "Không tìm thấy người tham gia với số điện thoại này hoặc người đó chưa được duyệt.",
      );
    }
  };

  // Toggle có mặt / vắng
  const handleToggleAttendance = (participantId: number, attended: boolean) => {
    setLocalAttendance((prev) => ({
      ...prev,
      [participantId]: attended,
    }));
  };

  // Lưu điểm danh hàng loạt
  const handleSave = async () => {
    const payload = attendanceList.map((p) => ({
      participantId: p.id,
      attended: !!localAttendance[p.id],
    }));

    try {
      await saveAttendanceMutation.mutateAsync({ attendances: payload });
      toast.success("Đã lưu kết quả điểm danh thành công!");
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi lưu kết quả điểm danh.");
    }
  };

  // Tính toán thống kê
  const totalEligible = attendanceList.length;
  const presentCount = Object.values(localAttendance).filter(Boolean).length;
  const absentCount = totalEligible - presentCount;

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
            title="Quay lại chi tiết"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Chi tiết chiến dịch</h1>
            <p className="text-xs text-slate-500 mt-0.5">{campaign.name}</p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saveAttendanceMutation.isPending || totalEligible === 0}
          className={`flex items-center justify-center gap-2 px-4 py-2 text-white font-medium rounded-lg shadow-sm transition-all ${theme.primaryBg} ${theme.primaryHover} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <Save className="w-4 h-4" />
          {saveAttendanceMutation.isPending ? "Đang lưu..." : "Lưu điểm danh"}
        </button>
      </div>

      {/* Tìm kiếm và Thống kê */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tìm kiếm bằng SĐT */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-slate-700">Tìm kiếm nhanh bằng SĐT</h2>
          <form onSubmit={handleSearchPhone} className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Nhập số điện thoại..."
                value={phoneSearch}
                onChange={(e) => setPhoneSearch(e.target.value)}
                className={`w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500`}
              />
            </div>
            <button
              type="submit"
              disabled={lookupMutation.isPending}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${theme.primaryBg} ${theme.primaryHover}`}
            >
              {lookupMutation.isPending ? "Đang tìm..." : "Tìm"}
            </button>
          </form>
          <p className="text-xs text-slate-400">
            * Nhập đầy đủ số điện thoại của người tham gia để hệ thống đối chiếu và định danh.
          </p>
        </div>

        {/* Bảng thống kê */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Tình hình điểm danh</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-50 p-4 rounded-lg text-center">
              <span className="text-xs text-slate-500 font-medium">Tổng danh sách</span>
              <div className="text-2xl font-bold text-slate-700 mt-1">{totalEligible}</div>
            </div>
            <div className="bg-emerald-50 p-4 rounded-lg text-center">
              <span className="text-xs text-emerald-600 font-medium">Có mặt</span>
              <div className="text-2xl font-bold text-emerald-600 mt-1">{presentCount}</div>
            </div>
            <div className="bg-rose-50 p-4 rounded-lg text-center">
              <span className="text-xs text-rose-600 font-medium">Vắng mặt</span>
              <div className="text-2xl font-bold text-rose-600 mt-1">{absentCount}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Danh sách người tham gia */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {totalEligible === 0 ? (
          <div className="py-12 text-center space-y-3">
            <AlertCircle className="w-12 h-12 text-slate-300 mx-auto" />
            <div className="text-slate-500 font-medium">
              Không có tình nguyện viên nào trong danh sách được duyệt
            </div>
            <p className="text-sm text-slate-400">
              Chỉ những tình nguyện viên đã xác nhận tham gia (CONFIRMED) và được cán bộ duyệt mới
              xuất hiện ở đây.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-600 text-xs font-semibold uppercase">
                  <th className="py-3.5 px-6">Tình nguyện viên</th>
                  <th className="py-3.5 px-6">Số điện thoại</th>
                  <th className="py-3.5 px-6 text-right">Trạng thái điểm danh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendanceList.map((p) => {
                  const isPresent = !!localAttendance[p.id];
                  const isHighlighted = highlightedId === p.id;

                  return (
                    <tr
                      key={p.id}
                      ref={(el) => {
                        rowRefs.current[p.id] = el;
                      }}
                      className={`transition-all duration-300 ${
                        isHighlighted
                          ? "bg-amber-50/80 ring-2 ring-amber-400 ring-inset"
                          : "hover:bg-slate-50/30"
                      }`}
                    >
                      {/* Tên */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setSelectedCitizenId(p.citizenId)}
                            className={`w-8 h-8 rounded-full ${theme.avatarBg} ${theme.avatarText} flex items-center justify-center font-bold text-sm hover:opacity-85 transition-opacity cursor-pointer`}
                          >
                            {p.citizenName.charAt(0).toUpperCase()}
                          </button>
                          <div>
                            <button
                              type="button"
                              onClick={() => setSelectedCitizenId(p.citizenId)}
                              className="font-medium text-slate-800 hover:text-indigo-600 hover:underline transition-colors text-left cursor-pointer"
                            >
                              {p.citizenName}
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* SĐT */}
                      <td className="py-4 px-6 text-slate-600 font-medium">
                        {p.citizenPhone || "Chưa cập nhật"}
                      </td>

                      {/* Điểm danh Switcher */}
                      <td className="py-4 px-6 text-right">
                        <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
                          <button
                            type="button"
                            onClick={() => handleToggleAttendance(p.id, false)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                              !isPresent
                                ? "bg-white text-rose-600 shadow-sm"
                                : "text-slate-500 hover:text-slate-700"
                            }`}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Vắng mặt
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleAttendance(p.id, true)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                              isPresent
                                ? "bg-white text-emerald-600 shadow-sm"
                                : "text-slate-500 hover:text-slate-700"
                            }`}
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            Có mặt
                          </button>
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

      {selectedCitizenId !== null && (
        <CitizenProfileModal
          userId={selectedCitizenId}
          onClose={() => setSelectedCitizenId(null)}
          hideModerationActions={true}
        />
      )}
    </div>
  );
}
