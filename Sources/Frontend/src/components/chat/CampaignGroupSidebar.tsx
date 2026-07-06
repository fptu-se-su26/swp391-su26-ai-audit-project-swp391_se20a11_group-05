import { Link } from "@tanstack/react-router";
import { ArrowLeft, Crown } from "lucide-react";
import logoImg from "@/assets/logo.png";
import { useCampaignThumbnail, useCampaignParticipants } from "@/hooks/useCampaigns";
import type { Campaign } from "@/lib/campaignStore";
import {
  getStatusInfo,
  getCategoryLabel,
  getInitials,
  getJoinStatusLabel,
} from "./CampaignChatHelpers";
import { useAuth } from "@/lib/auth";
import { Role } from "@/lib/roles";

export function CampaignGroupSidebar({
  campaignId,
  campaignName,
  campaign,
  hostName,
  target,
  memberCount,
  progressPercent,
}: {
  campaignId: string;
  campaignName: string;
  campaign?: Campaign;
  hostName: string;
  target: number;
  memberCount: number;
  progressPercent: number;
}) {
  const { user } = useAuth();
  const thumbnail = useCampaignThumbnail(campaign);
  const statusInfo = getStatusInfo(campaign?.status);
  const categoryLabel = getCategoryLabel(campaign?.category);
  const wardName = campaign?.ward || "Chưa cập nhật địa bàn";
  const memberRatio = target > 0 ? `${memberCount}/${target}` : String(memberCount);
  const canViewParticipants = Boolean(campaign?.canManage);
  const { data: participants = [], isLoading: participantsLoading } = useCampaignParticipants(
    campaignId,
    canViewParticipants,
  );
  const approvedParticipants = participants.filter(
    (participant) => participant.joinStatus === "APPROVED",
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      <div className="space-y-4 border-b border-slate-100 p-4">
        <div className="flex items-center gap-2">
          <img src={logoImg} alt="Đà Nẵng Kết Nối" className="h-9 w-9 object-contain" />
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-[#0B4FC4]">Đà Nẵng Kết Nối</p>
            <p className="text-[10px] font-bold uppercase text-slate-400">Campaign Group</p>
          </div>
        </div>

        {user?.role === Role.WARD_STAFF ? (
          <Link
            to="/ward"
            search={{ tab: "campaign", detailId: campaignId }}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-black text-slate-700 transition hover:bg-slate-50"
          >
            <ArrowLeft size={15} />
            Quay lại chiến dịch
          </Link>
        ) : (
          <Link
            to="/campaigns/$id"
            params={{ id: campaignId }}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-black text-slate-700 transition hover:bg-slate-50"
          >
            <ArrowLeft size={15} />
            Quay lại chiến dịch
          </Link>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="relative aspect-video overflow-hidden rounded-lg bg-slate-100">
          <img src={thumbnail} alt={campaignName} className="h-full w-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/55 to-transparent p-4">
            <span className="rounded-md bg-white/90 px-2 py-1 text-xs font-black text-[#0B4FC4] shadow-sm">
              {categoryLabel}
            </span>
          </div>
        </div>

        <h2 className="mt-3 line-clamp-2 text-base font-black leading-6 text-slate-950">
          {campaignName}
        </h2>
        <span
          className={`mt-3 inline-flex rounded-full border px-2.5 py-1 text-xs font-black ${statusInfo.className}`}
        >
          {statusInfo.label}
        </span>

        <div className="my-5 h-px bg-slate-100" />

        <section>
          <p className="mb-3 text-[10px] font-black uppercase tracking-wider text-slate-400">
            Người chủ trì
          </p>
          <div className="rounded-lg border border-amber-100 bg-amber-50/60 p-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-amber-100 text-sm font-black text-amber-700">
                  {getInitials(hostName)}
                </span>
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-slate-900">{hostName}</p>
                <p className="text-xs font-semibold text-slate-500">{wardName}</p>
              </div>
            </div>
            <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[11px] font-black text-amber-700">
              <Crown size={13} />
              Quản trị nhóm
            </span>
          </div>
        </section>

        <section className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Thành viên ({memberRatio})
            </p>
            <span className="text-[10px] font-black text-slate-400">{progressPercent}%</span>
          </div>
          <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-[#3B82F6]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-3">
            <div className="flex items-center justify-between gap-3 text-xs font-bold text-slate-600">
              <span>Đã được duyệt tham gia</span>
              <span className="text-slate-900">{memberCount}</span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3 text-xs font-bold text-slate-600">
              <span>Sức chứa tối đa</span>
              <span className="text-slate-900">{target || "Chưa giới hạn"}</span>
            </div>
          </div>

          {canViewParticipants && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Danh sách đã duyệt
                </p>
                <span className="text-[10px] font-black text-slate-400">
                  {approvedParticipants.length}
                </span>
              </div>

              {participantsLoading ? (
                <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-3 text-xs font-bold text-slate-400">
                  Đang tải thành viên...
                </div>
              ) : approvedParticipants.length > 0 ? (
                <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                  {approvedParticipants.map((participant) => (
                    <div
                      key={participant.id}
                      className="flex items-center gap-2 rounded-lg px-1 py-1.5"
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-black text-slate-600">
                        {getInitials(participant.citizenName)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-700">
                          {participant.citizenName}
                        </p>
                        <p className="text-[10px] font-bold text-emerald-600">
                          {getJoinStatusLabel(participant.joinStatus)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-200 bg-white px-3 py-3 text-xs font-bold text-slate-400">
                  Chưa có thành viên được duyệt.
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
