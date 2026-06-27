import { useState, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Route } from "@/routes/_auth.ward";
import { CampaignCreateContent } from "./CampaignCreateContent";
import {
  CalendarDays,
  Flag,
  Users,
  Plus,
  Eye,
  CheckCircle2,
  Clock3,
  Target,
  FileText,
  Pencil,

  Settings,
} from "lucide-react";
import { useCampaignList, useCampaignThumbnail } from "@/hooks/useCampaigns";
import { CampaignMap } from "@/components/site/CampaignMap";
import type { Campaign } from "@/lib/campaignStore";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { CampaignDetailPageComponent } from "@/routes/campaigns.$id";

function formatDate(dateStr?: string) {
  if (!dateStr) return "Chưa cập nhật";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return dateStr;
  }
}

function getCategoryInfo(category?: string) {
  switch (category) {
    case "environment":
      return { label: "Môi trường", bg: "bg-emerald-50 text-emerald-700 border-emerald-100" };
    case "infrastructure":
      return { label: "Hạ tầng", bg: "bg-blue-50 text-blue-700 border-blue-100" };
    case "public_safety":
      return { label: "An toàn", bg: "bg-red-50 text-red-700 border-red-100" };
    case "construction":
      return { label: "Xây dựng", bg: "bg-amber-50 text-amber-700 border-amber-100" };
    case "fire_safety":
      return { label: "Phòng cháy", bg: "bg-rose-50 text-rose-700 border-rose-100" };
    default:
      return { label: "Khác", bg: "bg-slate-50 text-slate-700 border-slate-100" };
  }
}

function getStatusInfo(status?: string) {
  switch (status) {
    case "active":
    case "recruiting":
    case "inProgress":
      return { label: "Đang hoạt động", bg: "bg-emerald-100 text-emerald-800 border border-emerald-200" };
    case "ended":
    case "completed":
      return { label: "Đã kết thúc", bg: "bg-red-100 text-red-800 border border-red-200" };
    default:
      return { label: "Đang hoạt động", bg: "bg-emerald-100 text-emerald-800 border border-emerald-200" };
  }
}

export function WardCampaignPage() {
  const campaigns = useCampaignList();
  const navigate = useNavigate();
  const { tab } = Route.useSearch();
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [editModeOnOpen, setEditModeOnOpen] = useState(false);
  
  const activeCampaign = useMemo(() => {
    if (!campaigns.length) return null;
    return activeCampaignId ? campaigns.find((c) => c.id === activeCampaignId) || null : null;
  }, [campaigns, activeCampaignId]);

  // Statistics calculated from real-time backend data
  const stats = useMemo(() => {
    const total = campaigns.length;
    const recruiting = campaigns.filter(
      (c) => (c.status === "active" || c.status === "recruiting") && c.participants < c.target,
    ).length;
    const full = campaigns.filter(
      (c) => (c.status === "active" || c.status === "recruiting") && c.participants >= c.target,
    ).length;
    const ended = campaigns.filter(
      (c) => c.status === "ended" || c.status === "completed",
    ).length;
    return { total, recruiting, full, ended };
  }, [campaigns]);



  const handleCreateRedirect = () => {
    navigate({
      to: "/ward",
      search: { tab: "campaign/create" },
    });
  };

  const handleEdit = (id: string) => {
    setSelectedCampaignId(id);
    setEditModeOnOpen(true);
  };



  const handleViewDetail = (id: string) => {
    setSelectedCampaignId(id);
    setEditModeOnOpen(false);
  };

  if (tab === "campaign/create") {
    return (
      <CampaignCreateContent
        onBack={() => {
          navigate({
            to: "/ward",
            search: { tab: "campaign" },
          });
        }}
        onSuccess={(campaignId) => {
          setSelectedCampaignId(campaignId);
          navigate({
            to: "/ward",
            search: { tab: "campaign" },
          });
        }}
      />
    );
  }

  if (selectedCampaignId) {
    return (
      <CampaignDetailPageComponent
        key={selectedCampaignId}
        campaignId={selectedCampaignId}
        initialEditMode={editModeOnOpen}
        onBack={() => {
          setSelectedCampaignId(null);
          setEditModeOnOpen(false);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B2545]">Quản lý chiến dịch</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Theo dõi và điều phối các chiến dịch cộng đồng trên địa bàn dựa trên dữ liệu thực tế.
          </p>
        </div>
        <button
          onClick={handleCreateRedirect}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#0F5BD8] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#0B4FC0]"
        >
          <Plus size={17} />
          Tạo chiến dịch
        </button>
      </div>

      {/* KPI Cards Panel */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={Flag}
          label="Tổng chiến dịch"
          value={stats.total}
          note="Chiến dịch đã ghi nhận"
          tone="blue"
        />
        <KpiCard
          icon={Users}
          label="Đang tuyển thành viên"
          value={stats.recruiting}
          note="Thành viên chưa đầy"
          tone="amber"
        />
        <KpiCard
          icon={CheckCircle2}
          label="Đã tuyển đủ thành viên"
          value={stats.full}
          note="Thành viên đã đầy"
          tone="emerald"
        />
        <KpiCard
          icon={Clock3}
          label="Đã kết thúc"
          value={stats.ended}
          note="Đã quá hạn hoặc đóng"
          tone="violet"
        />
      </div>

      {/* Campaign Map and Selected Campaign Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <CampaignMap
            height="480px"
            campaigns={campaigns}
            activeCampaign={activeCampaign || undefined}
            onCampaignClick={(c) => setActiveCampaignId(c.id)}
            onCampaignDetail={(c) => handleViewDetail(c.id)}
          />
        </div>
        <div className="lg:col-span-4">
          {activeCampaign ? (
            <QuickDetailsPanel
              campaign={activeCampaign}
              onViewDetail={() => handleViewDetail(activeCampaign.id)}
            />
          ) : (
            <div className="bg-slate-50 border border-dashed border-[#E4EAF2] rounded-2xl p-6 flex flex-col items-center justify-center text-center h-[480px]">
              <Flag size={32} className="text-slate-300 mb-2" />
              <p className="text-slate-400 text-sm font-bold">Chưa có chiến dịch nào được chọn</p>
              <p className="text-slate-400 text-xs mt-1">
                Chọn một điểm mốc trên bản đồ để xem chi tiết nhanh.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Campaigns Table */}
      <section className="rounded-2xl border border-[#E4EAF2] bg-white shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-[#0B2545]">Danh sách tất cả chiến dịch</h2>
          <span className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg">
            Tổng số: {campaigns.length}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70">
                <th className="px-5 py-3.5 text-xs font-extrabold uppercase tracking-wide text-slate-400">
                  Tên chiến dịch
                </th>
                <th className="px-5 py-3.5 text-xs font-extrabold uppercase tracking-wide text-slate-400">
                  Lĩnh vực
                </th>
                <th className="px-5 py-3.5 text-xs font-extrabold uppercase tracking-wide text-slate-400">
                  Địa bàn
                </th>
                <th className="px-5 py-3.5 text-xs font-extrabold uppercase tracking-wide text-slate-400">
                  Thời gian
                </th>
                <th className="px-5 py-3.5 text-xs font-extrabold uppercase tracking-wide text-slate-400">
                  Trạng thái
                </th>
                <th className="px-5 py-3.5 text-xs font-extrabold uppercase tracking-wide text-slate-400">
                  Thành viên
                </th>
                <th className="px-5 py-3.5 text-xs font-extrabold uppercase tracking-wide text-slate-400">
                  Người tạo
                </th>
                <th className="px-5 py-3.5 text-xs font-extrabold uppercase tracking-wide text-slate-400">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {campaigns.map((c) => {
                const catInfo = getCategoryInfo(c.category);
                const statusInfo = getStatusInfo(c.status);
                const isSelected = activeCampaignId === c.id;

                return (
                  <tr
                    key={c.id}
                    className={`transition hover:bg-slate-50/80 cursor-pointer ${
                      isSelected ? "bg-blue-50/40" : ""
                    }`}
                    onClick={() => setActiveCampaignId(c.id)}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <p className="max-w-[280px] truncate text-sm font-extrabold text-[#0B2545]">
                          {c.name}
                        </p>
                      </div>
                      <p className="mt-1 max-w-[280px] truncate text-xs font-medium text-slate-400">
                        {c.desc}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-extrabold ${catInfo.bg}`}
                      >
                        {catInfo.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm font-bold text-slate-600">{c.ward}</td>
                    <td className="px-5 py-4 text-xs font-medium text-slate-500">
                      {formatDate(c.startTime)} - {formatDate(c.endTime)}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${statusInfo.bg}`}
                      >
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {(() => {
                        const isClosed = c.status === "ended" || c.status === "completed";
                        const isFull = c.participants >= c.target;
                        return (
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-extrabold ${
                              isClosed
                                ? "bg-slate-50 text-slate-600 border-slate-200"
                                : isFull
                                ? "bg-red-50 text-red-700 border-red-200"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}
                          >
                            {isClosed ? "Đã đóng" : `${isFull ? "Đã đầy" : "Đang tuyển"} ${c.participants}/${c.target}`}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-5 py-4 text-sm font-bold text-slate-500">{c.createdBy}</td>
                    <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleViewDetail(c.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition"
                          title="Xem chi tiết"
                        >
                          <Eye size={15} />
                        </button>
                        {c.canManage && (
                          <button
                            onClick={() => handleEdit(c.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition"
                            title="Chỉnh sửa"
                          >
                            <Pencil size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  note,
  tone = "blue",
}: {
  icon: typeof Flag;
  label: string;
  value: number;
  note: string;
  tone?: "blue" | "emerald" | "amber" | "violet";
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    violet: "bg-violet-50 text-violet-700 border-violet-100",
  };

  return (
    <section className="rounded-2xl border border-[#E4EAF2] bg-white p-5 shadow-sm flex items-start justify-between">
      <div className="space-y-2">
        <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="font-sans text-3xl font-extrabold text-[#0B2545]">{value}</p>
        <p className="text-xs font-semibold text-slate-400">{note}</p>
      </div>
      <span
        className={`flex h-11 w-11 items-center justify-center rounded-xl border ${colors[tone]}`}
      >
        <Icon size={20} />
      </span>
    </section>
  );
}

function QuickDetailsPanel({
  campaign,
  onViewDetail,
}: {
  campaign: Campaign;
  onViewDetail: () => void;
}) {
  const thumbnail = useCampaignThumbnail(campaign);
  const catInfo = getCategoryInfo(campaign.category);
  const statusInfo = getStatusInfo(campaign.status);

  return (
    <div className="bg-white border border-[#E4EAF2] rounded-2xl p-5 shadow-sm flex flex-col h-[480px] justify-between">
      <div className="space-y-4 overflow-hidden">
        <div className="relative h-44 rounded-xl overflow-hidden bg-slate-100 shrink-0">
          <img src={thumbnail} alt={campaign.name} className="w-full h-full object-cover" />
        </div>

        <div className="space-y-2 overflow-y-auto max-h-[190px] pr-1">
          <h3 className="text-base font-extrabold text-[#0B2545] leading-snug">{campaign.name}</h3>
          <p className="text-slate-400 text-[11px] font-bold">
            Phường: {campaign.ward} | Tạo bởi: {campaign.createdBy}
          </p>
          <p className="text-slate-600 text-xs leading-relaxed">{campaign.desc}</p>
        </div>
      </div>

      <div className="space-y-3 pt-3 border-t border-[#E4EAF2] shrink-0">
        <div className="space-y-1.5 text-xs font-bold text-slate-700">
          <div className="flex items-center gap-2">
            <CalendarDays size={14} className="text-slate-400" />
            <span>
              Thời gian: {formatDate(campaign.startTime)} - {formatDate(campaign.endTime)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Users size={14} className="text-slate-400" />
            <span>
              Thành viên: {campaign.participants}/{campaign.target}
            </span>
          </div>
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-400">Lĩnh vực:</span>
              <span
                className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-extrabold ${catInfo.bg}`}
              >
                {catInfo.label}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-400">Trạng thái:</span>
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${statusInfo.bg}`}
              >
                {statusInfo.label}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onViewDetail}
          className="w-full h-9 rounded-xl bg-[#0F5BD8] hover:bg-[#0B4FC0] text-white text-xs font-bold shadow-sm transition flex items-center justify-center gap-2 mt-2"
        >
          <Eye size={14} />
          Xem chi tiết đầy đủ
        </button>
      </div>
    </div>
  );
}
