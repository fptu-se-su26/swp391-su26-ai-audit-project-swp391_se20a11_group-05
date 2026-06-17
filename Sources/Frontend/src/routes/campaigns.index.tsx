import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Calendar, CheckCircle, Clock, MapPin, PlusCircle, Search, Users } from "lucide-react";
import { toast } from "sonner";
import { useCampaignList, useJoinCampaign } from "@/hooks/useCampaigns";
import { Role, useAuth } from "@/lib/auth";
import type { Campaign } from "@/lib/campaignStore";

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
  { value: "all", label: "Tất cả" },
  { value: "recruiting", label: "Đang tuyển" },
  { value: "inProgress", label: "Đang làm" },
  { value: "completed", label: "Hoàn thành" },
  { value: "pending_review", label: "Chờ duyệt" },
];

const categoryLabel: Record<string, string> = {
  environment: "Môi trường",
  infrastructure: "Hạ tầng",
  public_safety: "An toàn",
  construction: "Xây dựng",
  fire_safety: "PCCC",
};

function CampaignList() {
  const campaigns = useCampaignList();
  const { user, isAuthenticated } = useAuth();
  const joinCampaign = useJoinCampaign();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return campaigns.filter((campaign) => {
      const matchesSearch =
        !keyword ||
        campaign.name.toLowerCase().includes(keyword) ||
        campaign.ward.toLowerCase().includes(keyword) ||
        campaign.desc.toLowerCase().includes(keyword);
      const matchesStatus = status === "all" || campaign.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [campaigns, search, status]);

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

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-16">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-wider text-[#1E5EFF]">Chiến dịch cộng đồng</p>
            <h1 className="text-3xl font-black tracking-tight text-slate-950">Chiến dịch cộng đồng</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Xem các chiến dịch đã được phê duyệt, đăng ký tham gia và theo dõi tiến độ tại địa phương.
            </p>
          </div>
          {canCreate && (
            <Link
              to="/campaigns/create"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#1E5EFF] px-4 text-sm font-black text-white hover:bg-[#154ecc] transition shadow-sm"
            >
              <PlusCircle size={16} />
              Tạo chiến dịch
            </Link>
          )}
        </div>
      </section>

      {/* Dynamic Statistics Panel */}
      <section className="mx-auto max-w-6xl px-4 mt-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tất cả chiến dịch</p>
            <p className="mt-1 text-2xl font-black text-slate-900">{campaigns.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Đang tuyển quân</p>
            <p className="mt-1 text-2xl font-black text-amber-600">
              {campaigns.filter((c) => c.status === "recruiting").length}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Đang thực hiện</p>
            <p className="mt-1 text-2xl font-black text-[#1E5EFF]">
              {campaigns.filter((c) => c.status === "inProgress").length}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hoàn thành</p>
            <p className="mt-1 text-2xl font-black text-emerald-600">
              {campaigns.filter((c) => c.status === "completed").length}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_220px]">
          <label className="relative block">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-10 w-full rounded-md border border-slate-300 pl-9 pr-3 text-sm outline-none focus:border-[#1E5EFF] focus:ring-2 focus:ring-[#1E5EFF]/15"
              placeholder="Tìm theo tên, phường hoặc mô tả"
            />
          </label>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="h-10 rounded-md border border-slate-300 px-3 text-sm font-semibold outline-none focus:border-[#1E5EFF]"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4">
          {filtered.map((campaign) => {
            const hasTarget = campaign.target > 0;
            const progressPercent = hasTarget 
              ? Math.min(100, Math.round((campaign.participants / campaign.target) * 100))
              : 0;

            const categoryStyle = {
              environment: "bg-emerald-50 text-emerald-700 border-emerald-200",
              infrastructure: "bg-blue-50 text-blue-700 border-blue-200",
              public_safety: "bg-red-50 text-red-700 border-red-200",
              construction: "bg-amber-50 text-amber-700 border-amber-200",
              fire_safety: "bg-orange-50 text-orange-700 border-orange-200",
            }[campaign.category] || "bg-slate-50 text-slate-700 border-slate-200";

            return (
              <article key={campaign.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition duration-200 hover:shadow-md hover:border-slate-300">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <StatusBadge status={campaign.status} />
                      <span className={`rounded-md border px-2 py-0.5 text-xs font-bold ${categoryStyle}`}>
                        {categoryLabel[campaign.category] ?? "Khác"}
                      </span>
                      {campaign.currentUserJoinStatus && (
                        <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700 border border-blue-100">
                          {joinLabel(campaign.currentUserJoinStatus)}
                        </span>
                      )}
                    </div>

                    <Link to="/campaigns/$id" params={{ id: campaign.id }} className="text-xl font-black text-slate-950 hover:text-[#1E5EFF] transition">
                      {campaign.name}
                    </Link>
                    <p className="mt-2 line-clamp-2 max-w-3xl text-sm leading-6 text-slate-600">{campaign.desc}</p>

                    {/* Progress Bar for Volunteer Recruitment */}
                    {hasTarget && campaign.status === "recruiting" && (
                      <div className="mt-4 max-w-sm">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
                          <span className="flex items-center gap-1">
                            <Users size={12} />
                            Đăng ký tham gia
                          </span>
                          <span>{campaign.participants}/{campaign.target} ({progressPercent}%)</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap gap-4 text-xs font-semibold text-slate-500 border-t border-slate-50 pt-3">
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={14} />
                        {campaign.locationText || campaign.ward}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Users size={14} />
                        {campaign.participants}/{campaign.target} người
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar size={14} />
                        {campaign.daysLeft > 0 ? `${campaign.daysLeft} ngày còn lại` : "Đã kết thúc"}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 gap-2 md:flex-col md:min-w-28">
                    <Link
                      to="/campaigns/$id"
                      params={{ id: campaign.id }}
                      className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-300 px-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition w-full"
                    >
                      Chi tiết
                    </Link>
                    {campaign.status === "recruiting" && (
                      <button
                        type="button"
                        onClick={() => handleJoin(campaign)}
                        disabled={joinCampaign.isPending || !campaign.canJoin}
                        className="inline-flex h-9 items-center justify-center rounded-lg bg-[#1E5EFF] px-3 text-sm font-black text-white hover:bg-[#154ecc] transition disabled:cursor-not-allowed disabled:opacity-50 w-full"
                      >
                        Tham gia
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-sm font-semibold text-slate-500">
            Chưa có chiến dịch phù hợp với bộ lọc hiện tại.
          </div>
        )}
      </section>
    </main>
  );
}

function StatusBadge({ status }: { status: Campaign["status"] }) {
  const meta = {
    pending_review: { label: "Chờ duyệt", className: "border-slate-200 bg-slate-100 text-slate-600", icon: Clock },
    recruiting: { label: "Đang tuyển", className: "border-amber-200 bg-amber-50 text-amber-700", icon: Users },
    inProgress: { label: "Đang thực hiện", className: "border-blue-200 bg-blue-50 text-blue-700", icon: Clock },
    completed: { label: "Hoàn thành", className: "border-green-200 bg-green-50 text-green-700", icon: CheckCircle },
  }[status];
  const Icon = meta.icon;

  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-black ${meta.className}`}>
      <Icon size={13} />
      {meta.label}
    </span>
  );
}

function joinLabel(status: NonNullable<Campaign["currentUserJoinStatus"]>) {
  if (status === "APPROVED") return "Đã duyệt tham gia";
  if (status === "PENDING") return "Chờ duyệt tham gia";
  if (status === "REJECTED") return "Bị từ chối";
  return "Đã hủy";
}
