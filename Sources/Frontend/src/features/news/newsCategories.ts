import {
  Activity,
  Bell,
  Building2,
  FileText,
  HelpCircle,
  Shield,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

export const NEWS_CATEGORIES = [
  "Tất cả",
  "Thông báo",
  "Chính sách",
  "Hoạt động",
  "Hạ tầng - Đô thị",
  "Kinh tế - Xã hội",
  "An ninh - Trật tự",
  "Khác",
];

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  "Thông báo": Bell,
  "Chính sách": FileText,
  "Hoạt động": Activity,
  "Hạ tầng - Đô thị": Building2,
  "Kinh tế - Xã hội": TrendingUp,
  "An ninh - Trật tự": Shield,
  Khác: HelpCircle,
};

export const CATEGORY_COLORS: Record<string, { text: string; bg: string }> = {
  "Thông báo": { text: "text-[#0A4DA2]", bg: "bg-[#EDF3FC]" },
  "Chính sách": { text: "text-[#6D28D9]", bg: "bg-[#F2EDFF]" },
  "Hoạt động": { text: "text-[#C2410C]", bg: "bg-[#FFF4E8]" },
  "Hạ tầng - Đô thị": { text: "text-[#15803D]", bg: "bg-[#EAF8EF]" },
  "Kinh tế - Xã hội": { text: "text-[#0E7490]", bg: "bg-[#ECFEFF]" },
  "An ninh - Trật tự": { text: "text-[#1E3A8A]", bg: "bg-[#EBF3FF]" },
  Khác: { text: "text-[#4B5563]", bg: "bg-[#F3F4F6]" },
};

export const NEWS_FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80";
