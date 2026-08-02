import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { ArrowRight, CalendarDays, MapPin, Users } from "lucide-react";
import type { Campaign, CampaignCategory, CampaignStatus } from "@/lib/campaignStore";

export const campaignCategoryLabel: Record<CampaignCategory, string> = {
  environment: "Môi trường",
  infrastructure: "Hạ tầng",
  public_safety: "An toàn cộng đồng",
  construction: "Xây dựng",
  fire_safety: "PCCC",
};

const statusMeta: Record<CampaignStatus, { label: string; className: string }> = {
  recruiting: { label: "Sắp diễn ra", className: "bg-[#2E6AE6] text-white" },
  inProgress: { label: "Đang diễn ra", className: "bg-[#2E9E57] text-white" },
  active: { label: "Đang diễn ra", className: "bg-[#2E9E57] text-white" },
  completed: { label: "Đã kết thúc", className: "bg-[#64748B] text-white" },
  ended: { label: "Đã kết thúc", className: "bg-[#64748B] text-white" },
  cancelled: { label: "Đã hủy", className: "bg-[#E05252] text-white" },
};

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  const meta = statusMeta[status] ?? statusMeta.recruiting;
  return (
    <span
      className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold shadow-sm ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}

function formatDateRange(campaign: Campaign) {
  const from = campaign.startTime ? format(new Date(campaign.startTime), "dd/MM/yyyy") : null;
  const to = campaign.endTime ? format(new Date(campaign.endTime), "dd/MM/yyyy") : null;
  if (from && to) return `${from} – ${to}`;
  if (from) return `Từ ${from}`;
  return "Chưa xác định thời gian";
}

export function CampaignCard({
  campaign,
  image,
  onJoin,
}: {
  campaign: Campaign;
  image: string;
  onJoin?: () => void;
}) {
  const progressPercent =
    campaign.target > 0
      ? Math.min(100, Math.round((campaign.participants / campaign.target) * 100))
      : Math.min(100, Math.max(0, Math.round(campaign.progress)));
  const showJoin = Boolean(onJoin && campaign.canJoin && campaign.status === "recruiting");

  return (
    <article className="group flex flex-col overflow-hidden rounded-[16px] border border-[#E6ECF5] bg-white shadow-[0_1px_3px_rgba(16,42,83,0.06)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_10px_24px_rgba(16,42,83,0.12)]">
      <div className="relative aspect-[16/10] bg-[#F5F7FB]">
        <img src={image} alt="" className="h-full w-full object-cover" loading="lazy" />
        <div className="absolute left-3 top-3">
          <CampaignStatusBadge status={campaign.status} />
        </div>
        <span className="absolute right-3 top-3 inline-flex rounded-md bg-white/95 px-2.5 py-1 text-xs font-semibold text-[#182230] shadow-sm">
          {campaignCategoryLabel[campaign.category] ?? "Khác"}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-sans line-clamp-2 min-h-[48px] text-base font-semibold leading-6 text-[#182230]">
          <Link
            to="/campaigns/$id"
            params={{ id: campaign.id }}
            className="transition-colors hover:text-[#0A4DA2]"
          >
            {campaign.name}
          </Link>
        </h3>

        <dl className="mt-3 space-y-1.5 text-[13px] font-medium text-[#64748B]">
          <div className="flex items-center gap-2">
            <dt className="sr-only">Địa điểm</dt>
            <MapPin size={14} className="shrink-0 text-[#94A3B8]" aria-hidden />
            <dd className="truncate">{campaign.locationText || campaign.ward}</dd>
          </div>
          <div className="flex items-center gap-2">
            <dt className="sr-only">Thời gian</dt>
            <CalendarDays size={14} className="shrink-0 text-[#94A3B8]" aria-hidden />
            <dd>{formatDateRange(campaign)}</dd>
          </div>
          <div className="flex items-center gap-2">
            <dt className="sr-only">Số người tham gia</dt>
            <Users size={14} className="shrink-0 text-[#94A3B8]" aria-hidden />
            <dd>{campaign.participants.toLocaleString("vi-VN")} người tham gia</dd>
          </div>
        </dl>

        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs font-semibold">
            <span className="text-[#64748B]">Tiến độ:</span>
            <span className="text-[#0A4DA2]">{progressPercent}%</span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Tiến độ chiến dịch ${progressPercent}%`}
            className="h-1.5 overflow-hidden rounded-full bg-[#E6ECF5]"
          >
            <div
              className="h-full rounded-full bg-[#2E9E57] transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="mt-auto flex gap-2 pt-5">
          {showJoin && (
            <button
              type="button"
              onClick={onJoin}
              className="inline-flex h-10 flex-1 items-center justify-center rounded-lg bg-[#0A4DA2] px-3 text-[13px] font-semibold text-white transition-colors duration-200 hover:bg-[#08408A]"
            >
              Tham gia
            </button>
          )}
          <Link
            to="/campaigns/$id"
            params={{ id: campaign.id }}
            className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-[#D7E2F2] px-3 text-[13px] font-semibold text-[#0A4DA2] transition-colors duration-200 hover:bg-[#F0F5FC] ${showJoin ? "flex-1" : "w-full"}`}
          >
            Xem chi tiết
            <ArrowRight
              size={15}
              className="transition-transform duration-200 group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
        </div>
      </div>
    </article>
  );
}
