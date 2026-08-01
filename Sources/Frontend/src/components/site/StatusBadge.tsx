import { useI18n } from "@/lib/i18n";
import type { ReportStatus } from "@/types/status";

const styles: Record<ReportStatus, string> = {
  // Legacy mappings
  pending: "bg-amber-50 text-amber-800 border border-amber-200",
  inProgress: "bg-amber-50 text-amber-800 border border-amber-200",
  resolved: "bg-green-50 text-green-800 border border-green-200",
  urgent: "bg-red-50 text-red-800 border border-red-200",

  // Raw DB statuses (Citizen view colors)
  SUBMITTED: "bg-[#EAF2FF] text-[#0B4FC4] border border-[#BFDBFE]", // Blue
  PENDING_RECEIVE: "bg-[#F3E8FF] text-[#9333EA] border border-[#E9D5FF]", // Purple
  PENDING: "bg-[#EAF2FF] text-[#0B4FC4] border border-[#BFDBFE]", // Blue
  NEED_LOCATION_REVIEW: "bg-[#FFF7D6] text-[#A16207] border border-[#FEF3C7]", // Yellow
  ASSIGNED: "bg-[#FFF4E8] text-[#F97316] border border-[#FFEDD5]", // Orange
  IN_PROGRESS: "bg-[#FFF4E8] text-[#F97316] border border-[#FFEDD5]", // Orange
  WAITING_INFO: "bg-[#FFF7D6] text-[#A16207] border border-[#FEF3C7]", // Light Yellow
  RESOLVED: "bg-[#EAF8EF] text-[#16A34A] border border-[#BBF7D0]", // Green
  REJECTED: "bg-[#FDECEC] text-[#DC2626] border border-[#FECACA]", // Red
  PRE_EMPTIVE: "bg-[#EAF2FF] text-[#0B4FC4] border border-[#BFDBFE]",
};

const dots: Record<ReportStatus, string> = {
  pending: "bg-amber-500",
  inProgress: "bg-amber-500",
  resolved: "bg-green-500",
  urgent: "bg-red-500",

  SUBMITTED: "bg-[#0B4FC4]",
  PENDING_RECEIVE: "bg-[#9333EA]",
  PENDING: "bg-[#0B4FC4]",
  NEED_LOCATION_REVIEW: "bg-[#A16207]",
  ASSIGNED: "bg-[#F97316]",
  IN_PROGRESS: "bg-[#F97316]",
  WAITING_INFO: "bg-[#A16207]",
  RESOLVED: "bg-[#16A34A]",
  REJECTED: "bg-[#DC2626]",
  PRE_EMPTIVE: "bg-[#0B4FC4]",
};

const getLabel = (status: ReportStatus, locale: string) => {
  const isVi = locale === "vi";
  switch (status) {
    case "pending":
      return isVi ? "Đang chờ duyệt" : "Pending";
    case "inProgress":
      return isVi ? "Đang xử lý" : "In progress";
    case "resolved":
      return isVi ? "Đã hoàn thành" : "Resolved";
    case "urgent":
      return isVi ? "Khẩn cấp" : "Urgent";

    case "SUBMITTED":
      return isVi ? "Đã gửi" : "Submitted";
    case "PENDING_RECEIVE":
      return isVi ? "Chờ tiếp nhận" : "Awaiting review";
    case "NEED_LOCATION_REVIEW":
      return isVi ? "Chờ xác minh vị trí" : "Location review";
    case "ASSIGNED":
    case "IN_PROGRESS":
      return isVi ? "Đang xử lý" : "Processing";
    case "WAITING_INFO":
      return isVi ? "Chờ bổ sung thông tin" : "Waiting for info";
    case "RESOLVED":
      return isVi ? "Đã hoàn thành" : "Resolved";
    case "REJECTED":
      return isVi ? "Từ chối" : "Rejected";
    case "PENDING":
    case "PRE_EMPTIVE":
    default:
      return isVi ? "Đang chờ duyệt" : "Pending";
  }
};

export function StatusBadge({ status }: { status: ReportStatus }) {
  const { locale } = useI18n();
  const badgeStyle = styles[status] || styles.PENDING;
  const dotStyle = dots[status] || dots.PENDING;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full tracking-wide ${badgeStyle}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotStyle}`} />
      {getLabel(status, locale)}
    </span>
  );
}
