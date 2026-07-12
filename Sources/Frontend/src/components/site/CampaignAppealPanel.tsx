import { FormEvent, useState } from "react";
import {
  Loader2,
  AlertTriangle,
  Send,
  Clock,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  useMyLastCampaignAppealQuery,
  useSubmitCampaignAppealMutation,
} from "@/hooks/useCampaigns";

interface CampaignAppealPanelProps {
  locale: string;
  isGlobalBan?: boolean;
  onSuccess?: () => void;
}

export function CampaignAppealPanel({ locale, isGlobalBan, onSuccess }: CampaignAppealPanelProps) {
  const { data: lastAppeal, isLoading, refetch } = useMyLastCampaignAppealQuery();
  const submitAppeal = useSubmitCampaignAppealMutation();
  const [reason, setReason] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error(
        locale === "vi" ? "Vui lòng nhập lý do giải trình." : "Please enter appeal reason.",
      );
      return;
    }
    try {
      await submitAppeal.mutateAsync(reason.trim());
      toast.success(
        locale === "vi"
          ? "Đã gửi đơn giải trình thành công. Vui lòng đợi cán bộ xem xét."
          : "Appeal submitted successfully. Please wait for review.",
      );
      setReason("");
      refetch();
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      toast.error(
        locale === "vi"
          ? "Gửi đơn thất bại: " + (err instanceof Error ? err.message : "Lỗi hệ thống")
          : "Failed to submit appeal: " + (err instanceof Error ? err.message : "System error"),
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex gap-3 p-3.5 border border-rose-250 bg-rose-50 rounded-xl dark:bg-rose-950/10 dark:border-rose-900/30">
        <Loader2 className="animate-spin h-5 w-5 text-rose-600 shrink-0" />
        <span className="text-xs font-semibold text-slate-500">
          {locale === "vi" ? "Đang tải thông quan khiếu nại..." : "Loading appeal info..."}
        </span>
      </div>
    );
  }

  const status = lastAppeal?.status;

  return (
    <div className="flex flex-col gap-3 p-4 border border-rose-200 bg-rose-50/50 rounded-xl text-rose-800 dark:bg-rose-950/10 dark:border-rose-900/30 dark:text-rose-350 shadow-sm transition-all duration-200">
      <div className="flex gap-3 items-start">
        <AlertTriangle className="h-5.5 w-5.5 text-rose-600 dark:text-rose-500 shrink-0 mt-0.5 animate-pulse" />
        <div className="flex-1">
          <h4 className="text-xs font-black uppercase tracking-wider text-rose-750 dark:text-rose-450">
            {isGlobalBan
              ? (locale === "vi" ? "Tài khoản bị chặn" : "Account Blocked")
              : (locale === "vi" ? "Đã khóa quyền tham gia" : "Campaign Registration Locked")}
          </h4>
          <p className="text-xs mt-1 leading-normal font-semibold text-rose-800/80 dark:text-rose-300">
            {isGlobalBan
              ? (locale === "vi"
                ? "Tài khoản của bạn đang bị chặn gửi phản ánh và tham gia chiến dịch do nhận đủ 3 cảnh cáo hoặc bị cán bộ khóa."
                : "Your account is blocked from creating feedbacks and joining campaigns due to 3 warnings or manual administrative lock.")
              : (locale === "vi"
                ? "Tài khoản của bạn đã bị tạm dừng đăng ký tham gia các chiến dịch cộng đồng mới do vắng mặt không lý do."
                : "Your account is temporarily suspended from registering for new community campaigns due to no-show records.")}
          </p>
        </div>
      </div>

      {status === "PENDING" && lastAppeal && (
        <div className="mt-2 p-3 bg-white dark:bg-slate-900/80 border border-amber-250 dark:border-amber-900/30 rounded-lg flex items-start gap-2.5 text-amber-800 dark:text-amber-400">
          <Clock className="h-4.5 w-4.5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs font-medium">
            <p className="font-bold text-amber-700 dark:text-amber-400">
              {locale === "vi" ? "Đơn giải trình đang chờ duyệt" : "Appeal pending review"}
            </p>
            <p className="mt-0.5 text-slate-500 dark:text-slate-450">
              {locale === "vi"
                ? `Lý do đã gửi: "${lastAppeal.reason}"`
                : `Submitted reason: "${lastAppeal.reason}"`}
            </p>
            <p className="mt-1 text-[10px] text-slate-400 font-semibold">
              {locale === "vi" ? "Gửi lúc: " : "Submitted at: "}
              {new Date(lastAppeal.createdAt).toLocaleString("vi-VN")}
            </p>
          </div>
        </div>
      )}

      {status === "REJECTED" && lastAppeal && (
        <div className="mt-2 p-3 bg-white dark:bg-slate-900/80 border border-rose-200 dark:border-rose-900/30 rounded-lg flex flex-col gap-1.5 text-rose-800 dark:text-rose-455">
          <div className="flex items-start gap-2.5">
            <XCircle className="h-4.5 w-4.5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs font-medium">
              <p className="font-bold text-rose-700 dark:text-rose-400">
                {locale === "vi" ? "Đơn giải trình bị từ chối" : "Appeal rejected"}
              </p>
              <p className="mt-0.5 text-slate-550 dark:text-slate-400">
                {locale === "vi"
                  ? `Phản hồi của cán bộ: "${lastAppeal.reviewNotes || "Không có ghi chú chi tiết"}"`
                  : `Staff feedback: "${lastAppeal.reviewNotes || "No detailed notes provided"}"`}
              </p>
              <p className="mt-1 text-[10px] text-slate-450 font-semibold">
                {locale === "vi" ? "Người duyệt: " : "Reviewed by: "}
                {lastAppeal.reviewedBy}
              </p>
            </div>
          </div>
        </div>
      )}

      {(!status || status === "REJECTED" || status === "APPROVED") && (
        <form onSubmit={handleSubmit} className="mt-2 space-y-2.5">
          <div className="text-xs font-bold text-slate-650 dark:text-slate-400 uppercase tracking-wider">
            {locale === "vi" ? "Gửi đơn giải trình mở khóa" : "Submit Appeal to Unlock"}
          </div>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={
              locale === "vi"
                ? "Trình bày lý do bất khả kháng dẫn đến việc vắng mặt (ví dụ: sự cố y tế, công việc đột xuất có giấy tờ minh chứng)..."
                : "Explain unavoidable circumstances causing no-shows (e.g. medical emergency, sudden work conflict with documentation)..."
            }
            className="w-full rounded-lg border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-950 p-2.5 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-[#0B4FC4] dark:focus:border-blue-500 transition min-h-[70px] resize-y"
            required
          />
          <button
            type="submit"
            disabled={submitAppeal.isPending}
            className="flex w-full items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 px-3 rounded-lg text-xs transition disabled:opacity-50 cursor-pointer shadow-sm hover:scale-[1.01]"
          >
            {submitAppeal.isPending ? (
              <Loader2 className="animate-spin h-3.5 w-3.5" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            {locale === "vi" ? "Gửi đơn giải trình" : "Submit Appeal"}
          </button>
        </form>
      )}
    </div>
  );
}
