import type { Campaign } from "@/lib/campaignStore";

export type ChatMessage = {
  id: string;
  sender: string;
  senderId?: number;
  role: "host" | "member" | "me";
  text: string;
  time: string;
  pinned: boolean;
  imageUrls?: string[];
  status?: "sending" | "failed" | "sent" | "seen";
  senderAvatar?: string;
  pastCampaignCount?: number;
};

export function getStatusInfo(status?: Campaign["status"]) {
  switch (status) {
    case "recruiting":
      return {
        label: "Chưa diễn ra",
        className: "bg-amber-50 text-amber-700 border-amber-100",
      };
    case "inProgress":
    case "active":
      return {
        label: "Đang diễn ra",
        className: "bg-blue-50 text-blue-700 border-blue-100",
      };
    case "ended":
    case "completed":
      return {
        label: "Đã kết thúc",
        className: "bg-rose-50 text-rose-700 border-rose-100",
      };
    case "cancelled":
      return {
        label: "Đã bị hủy",
        className: "bg-slate-100 text-slate-700 border-slate-200",
      };
    default:
      return {
        label: "Chưa cập nhật",
        className: "bg-slate-50 text-slate-600 border-slate-100",
      };
  }
}

export function getCategoryLabel(category?: Campaign["category"]) {
  switch (category) {
    case "environment":
      return "Môi trường";
    case "infrastructure":
      return "Hạ tầng";
    case "public_safety":
      return "An toàn";
    case "construction":
      return "Xây dựng";
    case "fire_safety":
      return "Phòng cháy";
    default:
      return "Chiến dịch";
  }
}

export function getInitials(name?: string | null) {
  const parts = (name || "CB").trim().split(/\s+/).filter(Boolean);
  return parts
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function getJoinStatusLabel(status?: string) {
  switch (status) {
    case "APPROVED":
      return "Đã duyệt";
    case "PENDING":
      return "Chờ duyệt";
    case "WAITLIST":
      return "Danh sách chờ";
    case "PENDING_CONFIRM":
      return "Chờ xác nhận";
    case "NO_SHOW":
      return "Vắng mặt";
    case "REJECTED":
      return "Từ chối";
    case "CANCELLED":
      return "Đã hủy";
    default:
      return "Chưa cập nhật";
  }
}
