import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  Grid3X3,
  LayoutList,
  Leaf,
  ListChecks,
  MapPin,
  Megaphone,
  Plus,
  Search,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { useCampaignList, useJoinCampaign, useCampaignThumbnail } from "@/hooks/useCampaigns";
import { Role, useAuth } from "@/lib/auth";
import type { Campaign, CampaignCategory } from "@/lib/campaignStore";

export const Route = createFileRoute("/campaigns/")({
  head: () => ({
    meta: [
      { title: "Chiến dịch cộng đồng - Đà Nẵng Kết Nối" },
      {
        name: "description",
        content: "Danh sách chiến dịch cộng đồng tại Đà Nẵng.",
      },
    ],
  }),
  component: CampaignList,
});

const statusOptions = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "recruiting", label: "Đang tuyển" },
  { value: "inProgress", label: "Đang thực hiện" },
  { value: "completed", label: "Hoàn thành" },
  { value: "pending_review", label: "Chờ duyệt" },
];

const categoryOptions: { value: "all" | CampaignCategory; label: string }[] = [
  { value: "all", label: "Tất cả lĩnh vực" },
  { value: "environment", label: "Môi trường" },
  { value: "infrastructure", label: "Hạ tầng" },
  { value: "public_safety", label: "An toàn cộng đồng" },
  { value: "construction", label: "Xây dựng" },
  { value: "fire_safety", label: "PCCC" },
];

const categoryLabel: Record<CampaignCategory, string> = {
  environment: "Môi trường",
  infrastructure: "Hạ tầng",
  public_safety: "An toàn",
  construction: "Xây dựng",
  fire_safety: "PCCC",
};

const categoryIcon: Record<CampaignCategory, typeof Leaf> = {
  environment: Leaf,
  infrastructure: MapPin,
  public_safety: Users,
  construction: Zap,
  fire_safety: Sparkles,
};

const mockImages = [
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&auto=format&fit=crop&q=80",
];

function CampaignList() {
  const campaigns = useCampaignList();
  const { user, isAuthenticated } = useAuth();
  const joinCampaign = useJoinCampaign();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState<"all" | CampaignCategory>("all");
  const [view, setView] = useState<"grid" | "list">("grid");

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return campaigns.filter((campaign) => {
      const matchesSearch =
        !keyword ||
        campaign.name.toLowerCase().includes(keyword) ||
        campaign.ward.toLowerCase().includes(keyword) ||
        campaign.desc.toLowerCase().includes(keyword) ||
        (campaign.locationText ?? "").toLowerCase().includes(keyword);
      const matchesStatus = status === "all" || campaign.status === status;
      const matchesCategory = category === "all" || campaign.category === category;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [campaigns, search, status, category]);

  const canCreate = isAuthenticated && user?.role === Role.WARD_STAFF;

  const handleJoin = async (campaign: Campaign) => {
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để tham gia chiến dịch.");
      return;
    }
    if (!campaign.canJoin) {
      toast.error("Chiến dịch hiện không mở đăng ký.");
      return;
    }
    await joinCampaign.mutateAsync(campaign.id);
    toast.success("Đã gửi yêu cầu tham gia, vui lòng chờ người quản lý duyệt.");
  };

  const stats = [
    {
      label: "Tất cả chiến dịch",
      value: campaigns.length,
      icon: ListChecks,
      color: "#7C3AED",
      border: "border-l-[#7C3AED]",
    },
    {
      label: "Đang tuyển quân",
      value: campaigns.filter((c) => c.status === "recruiting").length,
      icon: Megaphone,
      color: "#10B981",
      border: "border-l-[#10B981]",
    },
    {
      label: "Đang thực hiện",
      value: campaigns.filter((c) => c.status === "inProgress").length,
      icon: Zap,
      color: "#3B82F6",
      border: "border-l-[#3B82F6]",
    },
    {
      label: "Hoàn thành",
      value: campaigns.filter((c) => c.status === "completed").length,
      icon: CheckCircle2,
      color: "#6B7280",
      border: "border-l-[#6B7280]",
    },
  ];

  return (
    <main className="min-h-screen bg-[#F8F7FF] pb-16 text-slate-950">
      <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">
        <section className="relative mb-8 overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#7C3AED_0%,#4F46E5_100%)] p-8 shadow-lg md:p-12">
          <div className="grid gap-8 md:grid-cols-[1fr_360px] md:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-100">
                Chiến dịch cộng đồng
              </p>
              <h1 className="mt-3 text-4xl font-black tracking-tight text-white">
                Chiến dịch cộng đồng
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-white/80">
                Xem các chiến dịch đã được phê duyệt, đăng ký tham gia và theo dõi tiến độ tại địa
                phương.
              </p>
              {canCreate && (
                <Link
                  to="/campaigns/create"
                  className="mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-black text-[#6D28D9] shadow-lg transition hover:-translate-y-0.5 hover:brightness-110"
                >
                  <Plus size={18} />
                  Tạo chiến dịch
                </Link>
              )}
            </div>
            <VolunteerIllustration />
          </div>
        </section>

        <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className={`rounded-xl border border-white bg-white p-5 shadow-md border-l-4 ${stat.border}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      {stat.label}
                    </p>
                    <p className="mt-2 text-3xl font-black" style={{ color: stat.color }}>
                      {stat.value}
                    </p>
                  </div>
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#F3F0FF]">
                    <Icon size={20} style={{ color: stat.color }} />
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        <section className="mb-6 rounded-xl border border-violet-100 bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[1fr_190px_190px_auto]">
            <label className="relative block">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-12 w-full rounded-lg border border-slate-200 bg-white pl-11 pr-3 text-sm outline-none transition focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/15"
                placeholder="Tìm theo tên, phường hoặc mô tả..."
              />
            </label>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as "all" | CampaignCategory)}
              className="h-12 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold outline-none transition focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/15"
            >
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="h-12 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold outline-none transition focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/15"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="inline-flex h-12 rounded-lg border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => setView("grid")}
                className={`grid h-10 w-10 place-items-center rounded-md transition ${view === "grid" ? "bg-white text-[#7C3AED] shadow-sm" : "text-slate-500"}`}
                aria-label="Hiển thị dạng lưới"
              >
                <Grid3X3 size={17} />
              </button>
              <button
                type="button"
                onClick={() => setView("list")}
                className={`grid h-10 w-10 place-items-center rounded-md transition ${view === "list" ? "bg-white text-[#7C3AED] shadow-sm" : "text-slate-500"}`}
                aria-label="Hiển thị dạng danh sách"
              >
                <LayoutList size={18} />
              </button>
            </div>
          </div>
        </section>

        <section className={view === "grid" ? "grid gap-6 lg:grid-cols-2" : "grid gap-5"}>
          {filtered.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              compact={view === "list"}
              isJoining={joinCampaign.isPending}
              onJoin={() => handleJoin(campaign)}
            />
          ))}
        </section>

        {filtered.length === 0 && (
          <div className="mt-6 rounded-xl border border-dashed border-violet-200 bg-white p-10 text-center text-sm font-semibold text-slate-500">
            Chưa có chiến dịch phù hợp với bộ lọc hiện tại.
          </div>
        )}
      </div>
    </main>
  );
}

function CampaignCard({
  campaign,
  compact,
  isJoining,
  onJoin,
}: {
  campaign: Campaign;
  compact: boolean;
  isJoining: boolean;
  onJoin: () => void;
}) {
  const image = useCampaignThumbnail(campaign);
  const progressPercent =
    campaign.target > 0
      ? Math.min(100, Math.round((campaign.participants / campaign.target) * 100))
      : 0;
  const CategoryIcon = categoryIcon[campaign.category] ?? Leaf;

  return (
    <article
      className={`overflow-hidden rounded-xl border border-violet-100 bg-white shadow-md transition duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
        compact ? "grid md:grid-cols-[280px_1fr]" : ""
      }`}
    >
      <div
        className={`relative bg-slate-100 ${compact ? "min-h-56 md:min-h-full" : "aspect-video"}`}
      >
        <img
          src={image}
          alt={campaign.name}
          className="h-full w-full object-cover"
          loading="lazy"
        />
        <div className="absolute left-4 top-4">
          <StatusBadge status={campaign.status} />
        </div>
        <div className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-white/50 bg-white/90 px-3 py-1 text-xs font-black text-slate-700 shadow-sm backdrop-blur">
          <CategoryIcon size={14} className="text-emerald-600" />
          {categoryLabel[campaign.category] ?? "Khác"}
        </div>
      </div>

      <div className="p-5">
        <Link
          to="/campaigns/$id"
          params={{ id: campaign.id }}
          className="line-clamp-2 text-lg font-black leading-7 text-slate-950 transition hover:text-[#6D28D9]"
        >
          {campaign.name}
        </Link>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
          {campaign.desc || "Chưa có mô tả công khai."}
        </p>

        <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <MapPin size={14} />
            {campaign.locationText || campaign.ward}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users size={14} />
            {campaign.participants}/{campaign.target} người
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock3 size={14} />
            {campaign.daysLeft > 0 ? `Còn ${campaign.daysLeft} ngày` : "Đã kết thúc"}
          </span>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between gap-3 text-xs font-black text-slate-600">
            <span>Tiến độ tuyển quân</span>
            <span>
              {campaign.participants}/{campaign.target} ({progressPercent}%)
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-[#10B981] transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {campaign.currentUserJoinStatus && (
          <div className="mt-4 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
            {joinLabel(campaign.currentUserJoinStatus)}
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Link
            to="/campaigns/$id"
            params={{ id: campaign.id }}
            className={
              campaign.status === "pending_review"
                ? "col-span-2 inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                : "inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 text-sm font-black text-slate-700 transition hover:bg-slate-50"
            }
          >
            Chi tiết
          </Link>
          {campaign.status !== "pending_review" && (
            <button
              type="button"
              onClick={onJoin}
              disabled={isJoining || !campaign.canJoin || campaign.status !== "recruiting"}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-[#7C3AED] text-sm font-black text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Tham gia
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function StatusBadge({ status }: { status: Campaign["status"] }) {
  const meta = {
    pending_review: {
      label: "Chờ duyệt",
      className: "border-slate-200 bg-slate-100 text-slate-600",
    },
    recruiting: {
      label: "Đang tuyển",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
    inProgress: {
      label: "Đang thực hiện",
      className: "border-amber-200 bg-amber-50 text-amber-700",
    },
    completed: { label: "Hoàn thành", className: "border-violet-200 bg-violet-50 text-[#7C3AED]" },
  }[status];

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-black shadow-sm ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}

function VolunteerIllustration() {
  return (
    <div className="hidden justify-end md:flex" aria-hidden="true">
      <svg viewBox="0 0 360 260" className="h-64 w-full max-w-sm">
        <rect x="28" y="174" width="300" height="34" rx="17" fill="rgba(255,255,255,0.16)" />
        <circle cx="260" cy="66" r="34" fill="#DDD6FE" opacity="0.95" />
        <path
          d="M78 172c26-41 72-58 118-44 33 10 57 2 85-24"
          fill="none"
          stroke="#C4B5FD"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path
          d="M110 150l38-54 34 54"
          fill="none"
          stroke="#fff"
          strokeWidth="14"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="148" cy="76" r="19" fill="#FDE68A" />
        <path
          d="M196 89c23 13 42 35 51 64"
          fill="none"
          stroke="#fff"
          strokeWidth="13"
          strokeLinecap="round"
        />
        <path d="M224 162h54l-11 47h-35z" fill="#A7F3D0" />
        <path d="M228 154h46" stroke="#fff" strokeWidth="10" strokeLinecap="round" />
        <path
          d="M109 150l-33 55M183 151l26 55"
          stroke="#fff"
          strokeWidth="13"
          strokeLinecap="round"
        />
        <path d="M96 210h42M190 210h38" stroke="#DDD6FE" strokeWidth="10" strokeLinecap="round" />
        <path d="M267 132c23-24 46-30 68-19-8 28-29 42-63 39" fill="#BBF7D0" />
        <path
          d="M273 149c18-8 35-19 51-33"
          stroke="#10B981"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

function joinLabel(status: NonNullable<Campaign["currentUserJoinStatus"]>) {
  if (status === "APPROVED") return "Đã duyệt tham gia";
  if (status === "PENDING") return "Chờ duyệt tham gia";
  if (status === "REJECTED") return "Bị từ chối";
  return "Đã hủy";
}
