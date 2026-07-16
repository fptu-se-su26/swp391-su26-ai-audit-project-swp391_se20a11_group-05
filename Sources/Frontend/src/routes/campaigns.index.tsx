import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Flame,
  Hammer,
  Landmark,
  Leaf,
  Mail,
  MapPin,
  Megaphone,
  MessageSquareText,
  Newspaper,
  Phone,
  Plus,
  Search as SearchIcon,
  Send,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useCampaignList } from "@/hooks/useCampaigns";
import { Role, useAuth } from "@/lib/auth";
import { feedbackApi, newsApi } from "@/lib/api";
import type { Campaign, CampaignCategory } from "@/lib/campaignStore";
import { useI18n } from "@/lib/i18n";
import { CampaignAppealModal } from "@/components/site/CampaignAppealModal";
import causonghanImg from "@/assets/causonghan.png";
import { CampaignCard, campaignCategoryLabel } from "@/features/campaigns/CampaignCard";
import { StatisticCard } from "@/features/campaigns/StatisticCard";
import {
  DEFAULT_FILTERS,
  FilterBar,
  type CampaignFilters,
} from "@/features/campaigns/FilterBar";

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

const categoryOptions = [
  { value: "all", label: "Tất cả lĩnh vực" },
  ...Object.entries(campaignCategoryLabel).map(([value, label]) => ({ value, label })),
];

const statusOptions = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "recruiting", label: "Sắp diễn ra" },
  { value: "inProgress", label: "Đang diễn ra" },
  { value: "ended", label: "Đã kết thúc" },
  { value: "cancelled", label: "Đã hủy" },
];

const timeOptions = [
  { value: "all", label: "Tất cả thời gian" },
  { value: "month", label: "Tháng này" },
  { value: "quarter", label: "Quý này" },
  { value: "year", label: "Năm nay" },
];

const sortOptions = [
  { value: "newest", label: "Mới nhất" },
  { value: "oldest", label: "Cũ nhất" },
  { value: "participants", label: "Nhiều người tham gia" },
];

const categoryIcon: Record<CampaignCategory, typeof Leaf> = {
  environment: Leaf,
  infrastructure: Landmark,
  public_safety: ShieldCheck,
  construction: Hammer,
  fire_safety: Flame,
};

const fallbackImages = [
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&auto=format&fit=crop&q=80",
];

function isUpcoming(c: Campaign) {
  return c.status === "recruiting";
}
function isOngoing(c: Campaign) {
  return c.status === "inProgress" || c.status === "active";
}
function isEnded(c: Campaign) {
  return c.status === "ended" || c.status === "completed";
}

function matchesTime(campaign: Campaign, time: string) {
  if (time === "all") return true;
  const raw = campaign.startTime ?? campaign.createdAt;
  if (!raw) return false;
  const date = new Date(raw);
  const now = new Date();
  if (date.getFullYear() !== now.getFullYear()) return false;
  if (time === "year") return true;
  if (time === "quarter") {
    return Math.floor(date.getMonth() / 3) === Math.floor(now.getMonth() / 3);
  }
  return date.getMonth() === now.getMonth();
}

function CampaignList() {
  const campaigns = useCampaignList();
  const { user, isAuthenticated } = useAuth();
  const { locale } = useI18n();
  const navigate = useNavigate();
  const [filters, setFilters] = useState<CampaignFilters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(0);
  const [showAppealModal, setShowAppealModal] = useState(false);

  const updateFilters = (next: Partial<CampaignFilters>) => {
    setFilters((prev) => ({ ...prev, ...next }));
    setPage(0);
  };

  const { data: feedbackStats } = useQuery({
    queryKey: ["public-feedback-stats"],
    queryFn: () => feedbackApi.getPublicStats(),
    staleTime: 60_000,
  });

  const { data: newsData } = useQuery({
    queryKey: ["news", "latest", 3],
    queryFn: () => newsApi.getAll(0, 3),
    staleTime: 60_000,
  });
  const latestNews = newsData?.content ?? [];

  const wardOptions = useMemo(() => {
    const wards = [...new Set(campaigns.map((c) => c.ward).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, "vi"),
    );
    return [
      { value: "all", label: "Tất cả địa phương" },
      ...wards.map((ward) => ({ value: ward, label: ward })),
    ];
  }, [campaigns]);

  // Mọi bộ lọc trừ trạng thái — tab đếm số lượng trên tập này
  const preFiltered = useMemo(() => {
    const keyword = filters.keyword.trim().toLowerCase();
    return campaigns.filter((campaign) => {
      const matchesSearch =
        !keyword ||
        campaign.name.toLowerCase().includes(keyword) ||
        campaign.ward.toLowerCase().includes(keyword) ||
        campaign.desc.toLowerCase().includes(keyword) ||
        (campaign.locationText ?? "").toLowerCase().includes(keyword);
      const matchesCategory =
        filters.category === "all" || campaign.category === filters.category;
      const matchesWard = filters.ward === "all" || campaign.ward === filters.ward;
      return matchesSearch && matchesCategory && matchesWard && matchesTime(campaign, filters.time);
    });
  }, [campaigns, filters.keyword, filters.category, filters.ward, filters.time]);

  const filtered = useMemo(() => {
    const byStatus = preFiltered.filter((campaign) => {
      if (filters.status === "all") return true;
      if (filters.status === "recruiting") return isUpcoming(campaign);
      if (filters.status === "inProgress") return isOngoing(campaign);
      if (filters.status === "ended") return isEnded(campaign);
      return campaign.status === filters.status;
    });
    return [...byStatus].sort((a, b) => {
      if (sort === "participants") return b.participants - a.participants;
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return sort === "oldest" ? timeA - timeB : timeB - timeA;
    });
  }, [preFiltered, filters.status, sort]);

  const PAGE_SIZE = 12;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const paginated = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  const goToPage = (next: number) => {
    setPage(next);
    document.getElementById("campaigns-list")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const tabs = [
    { value: "all", label: "Tất cả", count: preFiltered.length },
    { value: "recruiting", label: "Sắp diễn ra", count: preFiltered.filter(isUpcoming).length },
    { value: "inProgress", label: "Đang diễn ra", count: preFiltered.filter(isOngoing).length },
    { value: "ended", label: "Đã kết thúc", count: preFiltered.filter(isEnded).length },
  ];

  const totalParticipants = campaigns.reduce((sum, c) => sum + c.participants, 0);
  const campaignsThisMonth = campaigns.filter((c) => matchesTime(c, "month")).length;

  const categoryStats = useMemo(() => {
    return (Object.keys(campaignCategoryLabel) as CampaignCategory[])
      .map((category) => ({
        category,
        count: campaigns.filter((c) => c.category === category).length,
      }))
      .filter((entry) => entry.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [campaigns]);

  const canCreate = isAuthenticated && user?.role === Role.WARD_STAFF;

  const handleJoin = (campaign: Campaign) => {
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để tham gia chiến dịch.");
      return;
    }
    if (user?.campaignBanned) {
      setShowAppealModal(true);
      return;
    }
    if (!campaign.canJoin) {
      toast.error("Chiến dịch hiện không mở đăng ký.");
      return;
    }
    navigate({
      to: "/campaigns/$id",
      params: { id: campaign.id },
      search: { join: true },
    });
  };

  return (
    <main className="min-h-screen bg-[#F5F7FB] pb-16">
      {/* ── Hero: tiêu đề trang + thống kê trên nền minh họa thành phố ── */}
      <section
        aria-labelledby="page-title"
        className="relative overflow-hidden border-b border-[#E6ECF5] bg-gradient-to-r from-[#E9F1FB] to-[#F6FAFE]"
      >
        {/* Ảnh cầu sông Hàn phủ tông xanh, mờ dần về bên trái để giữ độ tương phản chữ */}
        <div
          aria-hidden
          className="absolute inset-y-0 right-0 hidden w-[58%] bg-cover bg-center opacity-45 mix-blend-luminosity md:block"
          style={{
            backgroundImage: `url(${causonghanImg})`,
            maskImage: "linear-gradient(to right, transparent, black 48%)",
            WebkitMaskImage: "linear-gradient(to right, transparent, black 48%)",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-y-0 right-0 hidden w-[58%] bg-gradient-to-r from-transparent via-[#2E6AE6]/5 to-[#0A4DA2]/15 md:block"
        />
        <div className="relative mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="mb-3">
            <ol className="flex items-center gap-1.5 text-[13px] font-medium text-[#64748B]">
              <li>
                <Link to="/" className="transition-colors hover:text-[#0A4DA2]">
                  Trang chủ
                </Link>
              </li>
              <li aria-hidden>
                <ChevronRight size={14} />
              </li>
              <li aria-current="page" className="text-[#182230]">
                Chiến dịch
              </li>
            </ol>
          </nav>

          <div className="grid items-center gap-8 lg:grid-cols-[minmax(300px,420px)_1fr]">
            <div>
              <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#C9DAF2] bg-white/80 px-3 py-1 text-xs font-semibold text-[#0A4DA2]">
                <Landmark size={13} aria-hidden />
                Cổng thông tin phản ánh hiện trường · TP. Đà Nẵng
              </span>
              <h1 id="page-title" className="font-sans text-[32px] font-bold tracking-tight text-[#182230]">
                Chiến dịch cộng đồng
              </h1>
              <p className="mt-2 max-w-md text-[15px] leading-relaxed text-[#64748B]">
                Nơi kết nối các chiến dịch cộng đồng, tiếp nhận phản ánh và lan tỏa những giá trị
                tốt đẹp đến cộng đồng.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatisticCard
                icon={ClipboardList}
                value={campaigns.length}
                label="Tổng chiến dịch"
                tone="blue"
              />
              <StatisticCard
                icon={Users}
                value={totalParticipants.toLocaleString("vi-VN")}
                label="Người tham gia"
                tone="green"
              />
              <StatisticCard
                icon={BarChart3}
                value={feedbackStats ? feedbackStats.resolved.toLocaleString("vi-VN") : "—"}
                label="Phản ánh đã xử lý"
                tone="amber"
              />
              <StatisticCard
                icon={CheckCircle2}
                value={campaigns.filter(isEnded).length}
                label="Chiến dịch hoàn thành"
                tone="indigo"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        {isAuthenticated && user?.campaignBanned && (
          <div className="mt-6 flex flex-col justify-between gap-4 rounded-[16px] border border-[#F3D3D3] bg-[#FDF4F4] p-5 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3.5">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#F8E1E1] text-[#B23B3B]">
                <AlertTriangle size={20} aria-hidden />
              </div>
              <div>
                <h2 className="font-sans text-sm font-bold text-[#8F2F2F]">
                  Quyền tham gia chiến dịch đang bị khóa
                </h2>
                <p className="mt-1 text-[13px] leading-relaxed text-[#9A4A4A]">
                  Tài khoản của bạn đã bị tạm dừng đăng ký tham gia các chiến dịch cộng đồng mới do
                  vắng mặt không lý do. Vui lòng gửi đơn giải trình để được mở khóa.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowAppealModal(true)}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#E05252] px-4 text-[13px] font-semibold text-white transition-colors duration-200 hover:bg-[#C74444]"
            >
              <Send size={14} aria-hidden />
              Gửi đơn giải trình mở khóa
            </button>
          </div>
        )}

        <div className="mt-6">
          <FilterBar
            filters={filters}
            categoryOptions={categoryOptions}
            wardOptions={wardOptions}
            statusOptions={statusOptions}
            timeOptions={timeOptions}
            onChange={updateFilters}
            onReset={() => {
              setFilters(DEFAULT_FILTERS);
              setPage(0);
            }}
          />
        </div>

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_320px]">
          {/* ── Cột trái: tabs + danh sách chiến dịch + tin tức ── */}
          <div>
            <div
              id="campaigns-list"
              className="flex scroll-mt-24 flex-wrap items-center justify-between gap-3 border-b border-[#E6ECF5]"
            >
              <div role="tablist" aria-label="Lọc theo trạng thái chiến dịch" className="flex gap-1">
                {tabs.map((tab) => {
                  const selected = filters.status === tab.value;
                  return (
                    <button
                      key={tab.value}
                      role="tab"
                      aria-selected={selected}
                      onClick={() => updateFilters({ status: tab.value })}
                      className={`relative px-4 pb-3 pt-2 text-sm font-semibold transition-colors duration-200 ${
                        selected ? "text-[#0A4DA2]" : "text-[#64748B] hover:text-[#182230]"
                      }`}
                    >
                      {tab.label} ({tab.count})
                      <span
                        aria-hidden
                        className={`absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-[#0A4DA2] transition-transform duration-200 ${
                          selected ? "scale-x-100" : "scale-x-0"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              <label className="flex items-center gap-2 pb-2 text-[13px] font-medium text-[#64748B]">
                Sắp xếp theo:
                <select
                  value={sort}
                  onChange={(event) => {
                    setSort(event.target.value);
                    setPage(0);
                  }}
                  className="h-9 rounded-lg border border-[#E6ECF5] bg-white px-2.5 text-[13px] font-semibold text-[#182230] outline-none transition focus:border-[#2E6AE6]"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {filtered.length > 0 ? (
              <>
                <div
                  role="tabpanel"
                  className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
                >
                  {paginated.map((campaign, index) => (
                    <CampaignCard
                      key={campaign.id}
                      campaign={campaign}
                      image={
                        campaign.coverImageUrl ||
                        campaign.cover ||
                        fallbackImages[index % fallbackImages.length]
                      }
                      onJoin={() => handleJoin(campaign)}
                    />
                  ))}
                </div>
                {totalPages > 1 && (
                  <nav
                    aria-label="Phân trang danh sách chiến dịch"
                    className="mt-8 flex items-center justify-center gap-1.5"
                  >
                    <button
                      type="button"
                      onClick={() => goToPage(Math.max(0, safePage - 1))}
                      disabled={safePage === 0}
                      aria-label="Trang trước"
                      className="grid h-9 w-9 place-items-center rounded-lg border border-[#E6ECF5] bg-white text-[#64748B] transition-colors hover:bg-[#F5F7FB] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white"
                    >
                      <ChevronLeft size={16} aria-hidden />
                    </button>
                    {getPageItems(safePage, totalPages).map((item, i) =>
                      item === "..." ? (
                        <span key={`ellipsis-${i}`} className="px-1 text-sm text-[#64748B]">
                          ...
                        </span>
                      ) : (
                        <button
                          key={item}
                          type="button"
                          onClick={() => goToPage(item)}
                          aria-current={item === safePage ? "page" : undefined}
                          className={`grid h-9 w-9 place-items-center rounded-lg text-sm font-semibold transition-colors ${
                            item === safePage
                              ? "bg-[#0A4DA2] text-white"
                              : "border border-[#E6ECF5] bg-white text-[#182230] hover:bg-[#F5F7FB]"
                          }`}
                        >
                          {item + 1}
                        </button>
                      ),
                    )}
                    <button
                      type="button"
                      onClick={() => goToPage(Math.min(totalPages - 1, safePage + 1))}
                      disabled={safePage >= totalPages - 1}
                      aria-label="Trang sau"
                      className="grid h-9 w-9 place-items-center rounded-lg border border-[#E6ECF5] bg-white text-[#64748B] transition-colors hover:bg-[#F5F7FB] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white"
                    >
                      <ChevronRight size={16} aria-hidden />
                    </button>
                  </nav>
                )}
              </>
            ) : (
              <div className="mt-6 rounded-[16px] border border-dashed border-[#C9D8EE] bg-white p-12 text-center">
                <SearchIcon size={32} className="mx-auto text-[#94A3B8]" aria-hidden />
                <p className="mt-3 text-sm font-semibold text-[#182230]">
                  Không tìm thấy chiến dịch phù hợp
                </p>
                <p className="mt-1 text-[13px] text-[#64748B]">
                  Hãy thử thay đổi từ khóa hoặc đặt lại bộ lọc để xem tất cả chiến dịch.
                </p>
              </div>
            )}

            {latestNews.length > 0 && (
              <section aria-labelledby="news-heading" className="mt-8 rounded-[16px] border border-[#E6ECF5] bg-white p-6 shadow-[0_1px_3px_rgba(16,42,83,0.06)]">
                <div className="mb-5 flex items-center justify-between">
                  <h2 id="news-heading" className="font-sans flex items-center gap-2 text-[15px] font-bold uppercase tracking-wide text-[#182230]">
                    <Newspaper size={18} className="text-[#0A4DA2]" aria-hidden />
                    Tin tức &amp; thông báo
                  </h2>
                  <Link
                    to="/tin-tuc"
                    className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#0A4DA2] hover:underline"
                  >
                    Xem tất cả
                    <ArrowRight size={14} aria-hidden />
                  </Link>
                </div>
                <div className="grid gap-6 md:grid-cols-3">
                  {latestNews.map((news) => (
                    <Link
                      key={news.id}
                      to="/tin-tuc/$id"
                      params={{ id: String(news.id) }}
                      className="group flex gap-3.5"
                    >
                      <img
                        src={news.imageUrl}
                        alt=""
                        loading="lazy"
                        className="h-[72px] w-[96px] shrink-0 rounded-lg border border-[#E6ECF5] object-cover"
                      />
                      <div className="min-w-0">
                        <time
                          dateTime={news.createdAt}
                          className="text-xs font-medium text-[#64748B]"
                        >
                          {format(new Date(news.createdAt), "dd/MM/yyyy")}
                        </time>
                        <h3 className="font-sans mt-0.5 line-clamp-2 text-[13px] font-semibold leading-snug text-[#182230] transition-colors group-hover:text-[#0A4DA2]">
                          {news.title}
                        </h3>
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#64748B]">
                          {news.summary}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* ── Sidebar phải ── */}
          <aside aria-label="Thông tin bổ sung" className="flex flex-col gap-6">
            {categoryStats.length > 0 && (
              <section className="rounded-[16px] border border-[#E6ECF5] bg-white p-5 shadow-[0_1px_3px_rgba(16,42,83,0.06)]">
                <h2 className="font-sans mb-4 text-[15px] font-bold text-[#182230]">Lĩnh vực nổi bật</h2>
                <ul className="divide-y divide-[#F0F4FA]">
                  {categoryStats.map(({ category, count }) => {
                    const Icon = categoryIcon[category];
                    return (
                      <li key={category}>
                        <button
                          type="button"
                          onClick={() => updateFilters({ category })}
                          className="flex w-full items-center gap-3 py-2.5 text-left transition-colors hover:text-[#0A4DA2]"
                        >
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#EDF3FC] text-[#0A4DA2]">
                            <Icon size={15} aria-hidden />
                          </span>
                          <span className="flex-1 text-sm font-medium text-[#182230]">
                            {campaignCategoryLabel[category]}
                          </span>
                          <span className="text-[13px] font-semibold text-[#64748B]">{count}</span>
                          <ChevronRight size={15} className="text-[#94A3B8]" aria-hidden />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            <section className="rounded-[16px] border border-[#D7E4F6] bg-[#EDF3FC] p-5">
              <h2 className="font-sans text-[15px] font-bold text-[#0A4DA2]">
                Bạn muốn tổ chức chiến dịch?
              </h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-[#3D5A80]">
                {canCreate
                  ? "Tạo chiến dịch mới để huy động cộng đồng chung tay cải thiện địa phương của bạn."
                  : "Đăng nhập để tham gia chiến dịch và kết nối cộng đồng dễ dàng hơn."}
              </p>
              {canCreate ? (
                <Link
                  to="/campaigns/create"
                  className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#0A4DA2] text-[13px] font-semibold text-white transition-colors duration-200 hover:bg-[#08408A]"
                >
                  <Plus size={15} aria-hidden />
                  Tạo chiến dịch mới
                </Link>
              ) : isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => updateFilters({ status: "recruiting" })}
                  className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#0A4DA2] text-[13px] font-semibold text-white transition-colors duration-200 hover:bg-[#08408A]"
                >
                  <Megaphone size={15} aria-hidden />
                  Xem chiến dịch sắp diễn ra
                </button>
              ) : (
                <Link
                  to="/login"
                  className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#0A4DA2] text-[13px] font-semibold text-white transition-colors duration-200 hover:bg-[#08408A]"
                >
                  <Users size={15} aria-hidden />
                  Đăng nhập ngay
                </Link>
              )}
            </section>

            <section className="rounded-[16px] border border-[#E6ECF5] bg-white p-5 shadow-[0_1px_3px_rgba(16,42,83,0.06)]">
              <h2 className="font-sans mb-4 text-[15px] font-bold text-[#182230]">Thống kê nhanh</h2>
              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="font-medium text-[#64748B]">Chiến dịch trong tháng</dt>
                  <dd className="font-bold text-[#182230]">{campaignsThisMonth}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="font-medium text-[#64748B]">Đang diễn ra</dt>
                  <dd className="font-bold text-[#182230]">
                    {campaigns.filter(isOngoing).length}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="font-medium text-[#64748B]">Tổng người tham gia</dt>
                  <dd className="font-bold text-[#182230]">
                    {totalParticipants.toLocaleString("vi-VN")}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="rounded-[16px] border border-[#E6ECF5] bg-white p-5 shadow-[0_1px_3px_rgba(16,42,83,0.06)]">
              <h2 className="font-sans mb-4 text-[15px] font-bold text-[#182230]">Liên kết hữu ích</h2>
              <ul className="space-y-1 text-sm font-medium">
                {[
                  { to: "/report", label: "Gửi phản ánh hiện trường", icon: MessageSquareText },
                  { to: "/feedback-search", label: "Tra cứu phản ánh", icon: SearchIcon },
                  { to: "/leaderboard", label: "Xếp hạng phường xã", icon: Trophy },
                  { to: "/tin-tuc", label: "Tin tức thành phố", icon: Newspaper },
                ].map(({ to, label, icon: Icon }) => (
                  <li key={to}>
                    <Link
                      to={to}
                      className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-[#182230] transition-colors hover:bg-[#F5F7FB] hover:text-[#0A4DA2]"
                    >
                      <Icon size={15} className="text-[#0A4DA2]" aria-hidden />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-[16px] border border-[#E6ECF5] bg-white p-5 shadow-[0_1px_3px_rgba(16,42,83,0.06)]">
              <h2 className="font-sans mb-4 text-[15px] font-bold text-[#182230]">Thông tin liên hệ</h2>
              <ul className="space-y-3 text-[13px] font-medium text-[#64748B]">
                <li className="flex items-center gap-2.5">
                  <Phone size={15} className="shrink-0 text-[#0A4DA2]" aria-hidden />
                  <span>
                    Hotline:{" "}
                    <a href="tel:1022" className="font-semibold text-[#182230] hover:text-[#0A4DA2]">
                      1022
                    </a>
                  </span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Mail size={15} className="shrink-0 text-[#0A4DA2]" aria-hidden />
                  <a
                    href="mailto:gopy@danang.gov.vn"
                    className="font-semibold text-[#182230] hover:text-[#0A4DA2]"
                  >
                    gopy@danang.gov.vn
                  </a>
                </li>
                <li className="flex items-center gap-2.5">
                  <MapPin size={15} className="shrink-0 text-[#0A4DA2]" aria-hidden />
                  <span>24 Trần Phú, Hải Châu, Đà Nẵng</span>
                </li>
              </ul>
            </section>
          </aside>
        </div>
      </div>

      <CampaignAppealModal
        isOpen={showAppealModal}
        onOpenChange={setShowAppealModal}
        locale={locale}
      />
    </main>
  );
}

function getPageItems(current: number, total: number): (number | "...")[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i);
  const items: (number | "...")[] = [0];
  if (current > 2) items.push("...");
  for (let i = Math.max(1, current - 1); i <= Math.min(total - 2, current + 1); i++) items.push(i);
  if (current < total - 3) items.push("...");
  items.push(total - 1);
  return items;
}
