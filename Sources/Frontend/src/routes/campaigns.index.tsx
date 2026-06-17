import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense, useState, useMemo } from "react";
import { useI18n } from "@/lib/i18n";
import {
  Search,
  Filter,
  Users,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  TrendingUp,
  Bookmark,
  PlusCircle,
  ChevronRight,
  ArrowRight,
  Flame,
  Leaf,
  Zap,
  Shield,
  Wrench,
  AlertTriangle,
  Star,
  Activity,
  Award,
  Target,
  BarChart2,
  Globe,
  FileText,
  Info,
  SlidersHorizontal,
  Layers,
  Map,
  TreePine,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

// Lazy-load map to prevent Leaflet SSR issues
const CampaignMap = lazy(() =>
  import("@/components/site/CampaignMap").then((m) => ({ default: m.CampaignMap })),
);

export const Route = createFileRoute("/campaigns/")({
  head: () => ({
    meta: [
      { title: "Chiến dịch cộng đồng — Đà Nẵng Kết Nối" },
      {
        name: "description",
        content:
          "Khám phá và tham gia các chiến dịch cộng đồng do chính quyền và người dân Đà Nẵng phối hợp triển khai.",
      },
    ],
  }),
  component: CampaignList,
});

// ─── Data ────────────────────────────────────────────────────────────────────

const CAMPAIGNS = [
  {
    id: "green-hoa-xuan",
    name: "Chiến dịch Xanh Hòa Xuân",
    nameEn: "Green Hoa Xuan Campaign",
    category: "environment",
    categoryEn: "Environment",
    status: "inProgress",
    ward: "Hòa Xuân",
    createdBy: "Đoàn TN & UBND Phường",
    createdByEn: "Youth Union & Ward Authority",
    participants: 42,
    target: 50,
    progress: 68,
    reports: 18,
    daysLeft: 12,
    impactScore: 8.5,
    affectedCitizens: 1245,
    cover:
      "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80",
    desc: "Dọn dẹp các điểm xả rác tự phát, cải tạo mương thoát nước và tôn tạo không gian xanh.",
    descEn: "Cleanup illegal dumping sites, restore drainage canals, and improve green spaces.",
    featured: true,
  },
  {
    id: "beach-cleanup-my-khe",
    name: "Làm sạch bãi biển Mỹ Khê",
    nameEn: "Beach Cleanup My Khe",
    category: "environment",
    categoryEn: "Environment",
    status: "recruiting",
    ward: "Mỹ An",
    createdBy: "Hội Liên hiệp Thanh niên",
    createdByEn: "Youth Federation",
    participants: 18,
    target: 80,
    progress: 22,
    reports: 11,
    daysLeft: 21,
    impactScore: 9.1,
    affectedCitizens: 2800,
    cover:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&q=80",
    desc: "Vệ sinh đường bờ biển Mỹ Khê, thu gom rác nhựa và nâng cao ý thức bảo vệ biển.",
    descEn: "Clean My Khe shoreline, collect plastic waste and raise ocean protection awareness.",
    featured: false,
  },
  {
    id: "drainage-restoration",
    name: "Cải tạo hệ thống thoát nước Hải Châu",
    nameEn: "Drainage Restoration Hai Chau",
    category: "infrastructure",
    categoryEn: "Infrastructure",
    status: "inProgress",
    ward: "Hải Châu 1",
    createdBy: "UBND Q. Hải Châu",
    createdByEn: "Hai Chau District Authority",
    participants: 35,
    target: 45,
    progress: 78,
    reports: 24,
    daysLeft: 7,
    impactScore: 7.8,
    affectedCitizens: 4150,
    cover:
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80",
    desc: "Khơi thông, nạo vét cống rãnh tại các điểm ngập lụt nghiêm trọng khu vực nội đô.",
    descEn: "Dredge and restore blocked drains at severe flood-prone areas in the city centre.",
    featured: false,
  },
  {
    id: "community-safety",
    name: "An toàn cộng đồng Thanh Khê",
    nameEn: "Community Safety Awareness Thanh Khe",
    category: "public_safety",
    categoryEn: "Public Safety",
    status: "recruiting",
    ward: "Thanh Khê Đông",
    createdBy: "Công an Phường",
    createdByEn: "Ward Police",
    participants: 9,
    target: 30,
    progress: 30,
    reports: 8,
    daysLeft: 28,
    impactScore: 6.9,
    affectedCitizens: 1860,
    cover:
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=600&q=80",
    desc: "Tuyên truyền phòng chống tội phạm, lắp camera an ninh và nâng cao ý thức dân cư.",
    descEn: "Crime prevention outreach, security camera installation and community awareness.",
    featured: false,
  },
  {
    id: "tree-planting",
    name: "Chương trình Trồng cây Đà Nẵng Xanh",
    nameEn: "Da Nang Tree Planting Program",
    category: "environment",
    categoryEn: "Environment",
    status: "completed",
    ward: "Hòa Khánh Bắc",
    createdBy: "Sở Tài nguyên Môi trường",
    createdByEn: "Dept. of Natural Resources",
    participants: 120,
    target: 100,
    progress: 100,
    reports: 6,
    daysLeft: 0,
    impactScore: 9.7,
    affectedCitizens: 6200,
    cover:
      "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=600&q=80",
    desc: "Trồng 4,500 cây xanh bóng mát dọc các tuyến đường chính và công viên thành phố.",
    descEn: "Planted 4,500 shade trees along main roads and city parks.",
    featured: false,
  },
  {
    id: "illegal-ads-removal",
    name: "Xoá biển quảng cáo sai phép Ngũ Hành Sơn",
    nameEn: "Illegal Advertising Removal Ngu Hanh Son",
    category: "infrastructure",
    categoryEn: "Infrastructure",
    status: "inProgress",
    ward: "Ngũ Hành Sơn",
    createdBy: "Thanh tra Xây dựng",
    createdByEn: "Construction Inspectorate",
    participants: 22,
    target: 25,
    progress: 88,
    reports: 15,
    daysLeft: 4,
    impactScore: 7.2,
    affectedCitizens: 3200,
    cover:
      "https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=600&q=80",
    desc: "Tháo dỡ toàn bộ biển quảng cáo không phép gây mất mỹ quan đô thị khu du lịch.",
    descEn: "Remove all unlicensed banners and billboards degrading the urban and tourism landscape.",
    featured: false,
  },
  {
    id: "neighborhood-beautification",
    name: "Làm đẹp Khu phố Liên Chiểu",
    nameEn: "Neighborhood Beautification Lien Chieu",
    category: "environment",
    categoryEn: "Environment",
    status: "recruiting",
    ward: "Liên Chiểu",
    createdBy: "Tổ dân phố số 7",
    createdByEn: "Neighborhood Team No.7",
    participants: 5,
    target: 40,
    progress: 12,
    reports: 9,
    daysLeft: 35,
    impactScore: 6.5,
    affectedCitizens: 980,
    cover:
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=600&q=80",
    desc: "Sơn tường ngõ hẻm, trồng hoa dọc vỉa hè và lắp đèn chiếu sáng trang trí.",
    descEn: "Paint alleyway murals, plant flowers along sidewalks, and install decorative lighting.",
    featured: false,
  },
  {
    id: "public-facility-repair",
    name: "Sửa chữa cơ sở hạ tầng công cộng Cẩm Lệ",
    nameEn: "Public Facility Repair Cam Le",
    category: "infrastructure",
    categoryEn: "Infrastructure",
    status: "completed",
    ward: "Cẩm Lệ",
    createdBy: "UBND Q. Cẩm Lệ",
    createdByEn: "Cam Le District Authority",
    participants: 56,
    target: 50,
    progress: 100,
    reports: 31,
    daysLeft: 0,
    impactScore: 8.9,
    affectedCitizens: 5400,
    cover:
      "https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=600&q=80",
    desc: "Sửa chữa đèn đường hỏng, nắp cống, vỉa hè sụt lún và biển chỉ đường mờ nhạt.",
    descEn: "Repaired broken streetlights, manhole covers, sunken pavements and faded road signs.",
    featured: false,
  },
];

const TOP_VOLUNTEER_TEAMS = [
  {
    name: "Đoàn Thanh niên Hòa Xuân",
    nameEn: "Youth Union Hoa Xuan",
    members: 148,
    campaigns: 12,
    score: 9840,
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80",
    rank: 1,
    color: "#1E5EFF",
  },
  {
    name: "Tổ dân phố số 5",
    nameEn: "Neighborhood Team 5",
    members: 92,
    campaigns: 9,
    score: 7320,
    avatar: "https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?auto=format&fit=crop&w=100&q=80",
    rank: 2,
    color: "#22C55E",
  },
  {
    name: "Nhóm Tình nguyện Cộng đồng",
    nameEn: "Community Volunteers Group",
    members: 214,
    campaigns: 8,
    score: 6890,
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80",
    rank: 3,
    color: "#F59E0B",
  },
  {
    name: "Đội Hành động Môi trường",
    nameEn: "Environmental Action Team",
    members: 76,
    campaigns: 14,
    score: 6210,
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
    rank: 4,
    color: "#8B5CF6",
  },
];

const UPCOMING_ACTIVITIES = [
  { date: "17/06/2026", time: "07:30", loc: "Đường Trần Nam Trung, Hòa Xuân", locEn: "Tran Nam Trung St, Hoa Xuan", campaign: "Chiến dịch Xanh Hòa Xuân", campaignEn: "Green Hoa Xuan", participants: "45 TNV", status: "upcoming" },
  { date: "18/06/2026", time: "08:00", loc: "Kênh sinh thái Hòa Xuân", locEn: "Hoa Xuan Eco Canal", campaign: "Chiến dịch Xanh Hòa Xuân", campaignEn: "Green Hoa Xuan", participants: "30 TNV", status: "upcoming" },
  { date: "20/06/2026", time: "06:30", loc: "Bãi biển Mỹ Khê", locEn: "My Khe Beach", campaign: "Làm sạch bãi biển Mỹ Khê", campaignEn: "Beach Cleanup My Khe", participants: "60 TNV", status: "upcoming" },
  { date: "21/06/2026", time: "14:00", loc: "Nhà VH Thanh Khê Đông", locEn: "Thanh Khe Community Hall", campaign: "An toàn cộng đồng Thanh Khê", campaignEn: "Community Safety Awareness", participants: "80 người", status: "draft" },
  { date: "22/06/2026", time: "07:30", loc: "Công viên Liên Chiểu", locEn: "Lien Chieu Park", campaign: "Làm đẹp Khu phố Liên Chiểu", campaignEn: "Neighborhood Beautification", participants: "35 TNV", status: "upcoming" },
];

const SUCCESS_STORIES = [
  {
    id: "1",
    name: "Chương trình Trồng cây Đà Nẵng Xanh",
    nameEn: "Da Nang Tree Planting Program",
    before: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=400&q=80",
    after: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=400&q=80",
    metric: "4,500 cây được trồng",
    metricEn: "4,500 trees planted",
    satisfaction: 4.9,
    volunteers: 120,
  },
  {
    id: "2",
    name: "Sửa chữa CSHT Cẩm Lệ",
    nameEn: "Public Facility Repair Cam Le",
    before: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=80",
    after: "https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=400&q=80",
    metric: "31 phản ánh được giải quyết",
    metricEn: "31 reports resolved",
    satisfaction: 4.8,
    volunteers: 56,
  },
];

// ─── Category helpers ────────────────────────────────────────────────────────
const CATEGORY_META: Record<string, { icon: React.ElementType; label: string; labelEn: string; color: string; bg: string }> = {
  environment: { icon: Leaf, label: "Môi trường", labelEn: "Environment", color: "text-[#22C55E]", bg: "bg-[#22C55E]/10" },
  infrastructure: { icon: Wrench, label: "Hạ tầng", labelEn: "Infrastructure", color: "text-slate-700", bg: "bg-slate-100" },
  public_safety: { icon: Shield, label: "An toàn công cộng", labelEn: "Public Safety", color: "text-[#1E5EFF]", bg: "bg-[#1E5EFF]/10" },
  construction: { icon: Zap, label: "Xây dựng", labelEn: "Construction", color: "text-amber-600", bg: "bg-amber-50" },
  fire_safety: { icon: Flame, label: "Phòng cháy", labelEn: "Fire Safety", color: "text-red-600", bg: "bg-red-50" },
};

const STATUS_META: Record<string, { label: string; labelEn: string; color: string; dot: string }> = {
  recruiting: { label: "Đang tuyển TNV", labelEn: "Recruiting", color: "text-amber-700 bg-amber-50 border-amber-200", dot: "bg-amber-400 animate-pulse" },
  inProgress: { label: "Đang thực hiện", labelEn: "In Progress", color: "text-[#1E5EFF] bg-[#EFF6FF] border-[#BFDBFE]", dot: "bg-[#1E5EFF] animate-pulse" },
  completed: { label: "Đã hoàn thành", labelEn: "Completed", color: "text-[#22C55E] bg-[#F0FDF4] border-[#BBF7D0]", dot: "bg-[#22C55E]" },
};

// ─── Component ───────────────────────────────────────────────────────────────

function CampaignList() {
  const { locale } = useI18n();
  const isVi = locale === "vi";

  // Filter state
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterWard, setFilterWard] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [savedCampaigns, setSavedCampaigns] = useState<string[]>([]);
  const [joinedCampaigns, setJoinedCampaigns] = useState<string[]>([]);
  const [quickPanelOpen, setQuickPanelOpen] = useState(true);

  const filtered = useMemo(() => {
    let data = [...CAMPAIGNS];
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter((c) =>
        c.name.toLowerCase().includes(q) || c.nameEn.toLowerCase().includes(q) || c.ward.toLowerCase().includes(q),
      );
    }
    if (filterCategory !== "all") data = data.filter((c) => c.category === filterCategory);
    if (filterStatus !== "all") data = data.filter((c) => c.status === filterStatus);
    if (filterWard !== "all") data = data.filter((c) => c.ward === filterWard);

    switch (sortBy) {
      case "volunteers":
        data.sort((a, b) => b.participants - a.participants);
        break;
      case "impact":
        data.sort((a, b) => b.impactScore - a.impactScore);
        break;
      case "urgent":
        data.sort((a, b) => a.daysLeft - b.daysLeft);
        break;
      default:
        // newest: keep original order
        break;
    }
    return data;
  }, [search, filterCategory, filterStatus, filterWard, sortBy]);

  const featured = CAMPAIGNS.find((c) => c.featured);

  const handleSave = (id: string) => {
    setSavedCampaigns((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
    toast.success(
      savedCampaigns.includes(id)
        ? isVi ? "Đã bỏ lưu chiến dịch." : "Campaign unsaved."
        : isVi ? "Đã lưu chiến dịch thành công!" : "Campaign saved!",
    );
  };

  const handleJoin = (id: string, name: string) => {
    setJoinedCampaigns((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
    toast.success(
      joinedCampaigns.includes(id)
        ? isVi ? "Đã hủy tham gia chiến dịch." : "Left the campaign."
        : isVi ? `Đăng ký tham gia ${name} thành công!` : `Joined ${name} successfully!`,
    );
  };

  const clearFilters = () => {
    setSearch("");
    setFilterCategory("all");
    setFilterStatus("all");
    setFilterWard("all");
    setSortBy("newest");
  };

  const hasFilters =
    search || filterCategory !== "all" || filterStatus !== "all" || filterWard !== "all";

  const wards = [...new Set(CAMPAIGNS.map((c) => c.ward))];

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans">

      {/* ── Top Info Bar ──────────────────────────────────────── */}
      <div className="bg-slate-900 py-2.5 text-white">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Info size={13} className="text-[#1E5EFF]" />
            {isVi
              ? "Cổng chiến dịch cộng đồng — Đà Nẵng Kết Nối 2026"
              : "Community Campaign Portal — Da Nang Connect 2026"}
          </span>
          <span className="text-[11px] text-slate-400 font-semibold">
            {isVi ? "Cập nhật mỗi 15 phút" : "Updated every 15 minutes"}
          </span>
        </div>
      </div>

      {/* ── Breadcrumb ────────────────────────────────────────── */}
      <div className="border-b border-[#E2E8F0] bg-white py-4 shadow-sm">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 flex items-center justify-between">
          <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Link to="/" className="hover:text-[#1E5EFF] transition-colors">
              {isVi ? "Trang chủ" : "Home"}
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800 font-extrabold">
              {isVi ? "Chiến dịch cộng đồng" : "Community Campaigns"}
            </span>
          </nav>
          <Link
            to="/campaigns/green-hoa-xuan"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#1E5EFF] text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition shadow-sm"
          >
            <PlusCircle size={14} />
            {isVi ? "Tạo chiến dịch" : "Create Campaign"}
          </Link>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 md:px-8">

        {/* ── Page Header ───────────────────────────────────────── */}
        <div className="pt-10 pb-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#1E5EFF]/8 border border-[#1E5EFF]/20 rounded-full text-xs font-bold text-[#1E5EFF] mb-4">
                <Activity size={12} />
                {isVi ? "156 chiến dịch đang hoạt động" : "156 active campaigns"}
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-[#0B2545] tracking-tight leading-tight mb-2">
                {isVi ? "Chiến dịch Cộng đồng" : "Community Campaigns"}
              </h1>
              <p className="text-slate-500 text-sm md:text-base font-semibold max-w-xl leading-relaxed">
                {isVi
                  ? "Tham gia các chiến dịch hành động cộng đồng giải quyết các phản ánh của người dân."
                  : "Join community-driven initiatives that help solve issues reported by citizens."}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {isVi ? "Tổng tình nguyện viên" : "Total Volunteers"}
                </span>
                <span className="text-2xl font-black text-[#1E5EFF]">8,452</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Statistics Cards ──────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {[
            { label: isVi ? "Chiến dịch Đang chạy" : "Active Campaigns", value: "156", icon: Activity, color: "text-[#1E5EFF]", iconBg: "bg-[#1E5EFF]/10", border: "border-[#1E5EFF]/15" },
            { label: isVi ? "Đang tuyển TNV" : "Recruiting", value: "48", icon: Users, color: "text-amber-600", iconBg: "bg-amber-50", border: "border-amber-100" },
            { label: isVi ? "Đã hoàn thành" : "Completed", value: "327", icon: CheckCircle, color: "text-[#22C55E]", iconBg: "bg-[#22C55E]/10", border: "border-[#22C55E]/15" },
            { label: isVi ? "Tổng Tình nguyện viên" : "Total Volunteers", value: "8,452", icon: TrendingUp, color: "text-purple-600", iconBg: "bg-purple-50", border: "border-purple-100" },
          ].map((stat, i) => (
            <div
              key={i}
              className={`bg-white rounded-[20px] border ${stat.border} p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)] flex items-center gap-4 group hover:-translate-y-0.5 transition-all duration-200`}
            >
              <div className={`w-11 h-11 ${stat.iconBg} rounded-2xl flex items-center justify-center shrink-0`}>
                <stat.icon size={20} className={stat.color} />
              </div>
              <div className="min-w-0">
                <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider leading-tight mt-0.5">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Main Two-Column Layout ────────────────────────────── */}
        <div className="flex gap-8 items-start">
          {/* ── LEFT MAIN CONTENT ─────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-10">

            {/* ── Featured Campaign Hero ─────────────────────── */}
            {featured && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1.5 h-5 bg-[#1E5EFF] rounded-sm" />
                  <h2 className="text-[#0B2545] font-black text-xl">
                    {isVi ? "Chiến dịch nổi bật" : "Featured Campaign"}
                  </h2>
                </div>

                <div
                  className="relative w-full h-[320px] rounded-[24px] overflow-hidden bg-cover bg-center shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-slate-200 flex flex-col justify-between p-6 md:p-8 cursor-pointer group"
                  style={{
                    backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0.1) 100%), url('${featured.cover}')`,
                  }}
                >
                  {/* Badge row */}
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#1E5EFF]/30 backdrop-blur-sm text-white border border-[#1E5EFF]/40 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                      <Star size={11} className="fill-white" />
                      {isVi ? "Nổi bật · Đang thực hiện" : "Featured · In Progress"}
                    </span>
                    <span className="px-3 py-1 bg-white/15 backdrop-blur-sm text-white border border-white/20 rounded-full text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                      <Leaf size={11} />
                      {isVi ? "Môi trường" : "Environment"}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="text-white space-y-4">
                    <div>
                      <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-tight drop-shadow-md mb-2">
                        {isVi ? featured.name : featured.nameEn}
                      </h2>
                      <p className="text-white/75 text-xs md:text-sm font-semibold max-w-xl leading-relaxed">
                        {isVi ? featured.desc : featured.descEn}
                      </p>
                    </div>

                    {/* Stats row */}
                    <div className="flex flex-wrap items-center gap-5 text-white/80 text-xs font-bold border-t border-white/10 pt-3">
                      <span className="flex items-center gap-1.5">
                        <Users size={13} />
                        {featured.participants}/{featured.target} {isVi ? "TNV" : "Vol."}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <FileText size={13} />
                        {featured.reports} {isVi ? "phản ánh" : "reports"}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin size={13} />
                        {featured.ward}
                      </span>
                      <div className="flex-1 max-w-[200px]">
                        <div className="flex justify-between text-[10px] font-bold mb-1 text-white/60">
                          <span>{isVi ? "Tiến độ" : "Progress"}</span>
                          <span className="text-[#22C55E]">{featured.progress}%</span>
                        </div>
                        <div className="w-full h-2 bg-white/15 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#22C55E] to-emerald-400 rounded-full"
                            style={{ width: `${featured.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-3">
                      <Link
                        to={`/campaigns/${featured.id}` as any}
                        className="px-5 py-2.5 bg-white text-[#0B2545] font-bold text-sm rounded-xl hover:bg-slate-100 transition shadow-md flex items-center gap-2 min-h-[44px]"
                      >
                        {isVi ? "Xem chi tiết" : "View Campaign"}
                        <ChevronRight size={16} />
                      </Link>
                      <button
                        onClick={() => handleJoin(featured.id, isVi ? featured.name : featured.nameEn)}
                        className={`px-5 py-2.5 font-bold text-sm rounded-xl transition shadow-md min-h-[44px] cursor-pointer ${
                          joinedCampaigns.includes(featured.id)
                            ? "bg-white/20 text-white border border-white/30 hover:bg-white/30"
                            : "bg-[#1E5EFF] text-white hover:bg-blue-600"
                        }`}
                      >
                        {joinedCampaigns.includes(featured.id)
                          ? isVi ? "✓ Đang tham gia" : "✓ Joined"
                          : isVi ? "Tham gia ngay" : "Join Campaign"}
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* ── Campaign Map Overview ──────────────────────── */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-5 bg-[#1E5EFF] rounded-sm" />
                  <h2 className="text-[#0B2545] font-black text-xl">
                    {isVi ? "Bản đồ tổng quan chiến dịch" : "Campaign Map Overview"}
                  </h2>
                </div>
                <span className="text-xs font-bold text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-full shadow-inner flex items-center gap-1.5">
                  <Map size={12} className="text-[#1E5EFF]" />
                  {isVi ? "Thành phố Đà Nẵng" : "Da Nang City"}
                </span>
              </div>

              <Suspense
                fallback={
                  <div className="w-full h-[500px] bg-slate-100 rounded-[20px] flex items-center justify-center flex-col gap-3">
                    <span className="w-8 h-8 rounded-full border-4 border-[#1E5EFF] border-t-transparent animate-spin" />
                    <span className="text-sm font-semibold text-slate-500">
                      {isVi ? "Đang tải bản đồ..." : "Loading Map..."}
                    </span>
                  </div>
                }
              >
                <CampaignMap height="500px" />
              </Suspense>

              {/* Map Legend */}
              <div className="flex flex-wrap gap-3 mt-3 text-xs font-bold text-slate-600">
                {[
                  { color: "bg-[#22C55E]", label: isVi ? "Chiến dịch hoàn thành" : "Completed Campaigns" },
                  { color: "bg-[#1E5EFF]", label: isVi ? "Đang thực hiện" : "Active Campaigns" },
                  { color: "bg-amber-400", label: isVi ? "Đang tuyển TNV" : "Recruiting" },
                  { color: "bg-red-400", label: isVi ? "Điểm nóng vấn đề" : "Issue Hotspots" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                    {item.label}
                  </div>
                ))}
              </div>
            </section>

            {/* ── Filter Bar ────────────────────────────────── */}
            <section className="sticky top-[76px] z-30 bg-white/95 backdrop-blur-md rounded-[20px] border border-[#E2E8F0] shadow-[0_10px_30px_rgba(0,0,0,0.06)] p-4">
              <div className="flex flex-wrap gap-3 items-center">
                {/* Search */}
                <div className="relative flex-grow min-w-[180px] max-w-xs">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="campaign-search"
                    type="text"
                    placeholder={isVi ? "Tìm chiến dịch..." : "Search campaigns..."}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs font-semibold border border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1E5EFF]/20 focus:border-[#1E5EFF] placeholder-slate-400 transition"
                  />
                </div>

                {/* Category Filter */}
                <select
                  id="filter-category"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1E5EFF]/20 cursor-pointer"
                >
                  <option value="all">{isVi ? "Tất cả danh mục" : "All Categories"}</option>
                  <option value="environment">{isVi ? "Môi trường" : "Environment"}</option>
                  <option value="infrastructure">{isVi ? "Hạ tầng" : "Infrastructure"}</option>
                  <option value="public_safety">{isVi ? "An toàn công cộng" : "Public Safety"}</option>
                  <option value="construction">{isVi ? "Xây dựng" : "Construction"}</option>
                  <option value="fire_safety">{isVi ? "Phòng cháy" : "Fire Safety"}</option>
                </select>

                {/* Status Filter */}
                <select
                  id="filter-status"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1E5EFF]/20 cursor-pointer"
                >
                  <option value="all">{isVi ? "Mọi trạng thái" : "All Statuses"}</option>
                  <option value="recruiting">{isVi ? "Đang tuyển TNV" : "Recruiting"}</option>
                  <option value="inProgress">{isVi ? "Đang thực hiện" : "In Progress"}</option>
                  <option value="completed">{isVi ? "Đã hoàn thành" : "Completed"}</option>
                </select>

                {/* Ward Filter */}
                <select
                  id="filter-ward"
                  value={filterWard}
                  onChange={(e) => setFilterWard(e.target.value)}
                  className="px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1E5EFF]/20 cursor-pointer"
                >
                  <option value="all">{isVi ? "Mọi phường" : "All Wards"}</option>
                  {wards.map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>

                {/* Sort By */}
                <div className="ml-auto flex items-center gap-2">
                  <SlidersHorizontal size={13} className="text-slate-400 shrink-0" />
                  <select
                    id="sort-by"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1E5EFF]/20 cursor-pointer"
                  >
                    <option value="newest">{isVi ? "Mới nhất" : "Newest"}</option>
                    <option value="volunteers">{isVi ? "Nhiều TNV nhất" : "Most Volunteers"}</option>
                    <option value="impact">{isVi ? "Tác động cao nhất" : "Highest Impact"}</option>
                    <option value="urgent">{isVi ? "Khẩn cấp nhất" : "Most Urgent"}</option>
                  </select>
                </div>

                {/* Clear button */}
                {hasFilters && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-600 border border-red-200 bg-red-50 rounded-xl hover:bg-red-100 transition cursor-pointer shrink-0"
                  >
                    <X size={13} />
                    {isVi ? "Xóa lọc" : "Clear"}
                  </button>
                )}
              </div>

              {/* Results count */}
              <div className="mt-2.5 pt-2.5 border-t border-slate-100 text-xs font-bold text-slate-400">
                {isVi
                  ? `Hiển thị ${filtered.length} / ${CAMPAIGNS.length} chiến dịch`
                  : `Showing ${filtered.length} of ${CAMPAIGNS.length} campaigns`}
              </div>
            </section>

            {/* ── Campaign Grid ─────────────────────────────── */}
            <section>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1.5 h-5 bg-[#1E5EFF] rounded-sm" />
                <h2 className="text-[#0B2545] font-black text-xl">
                  {isVi ? "Danh sách chiến dịch" : "All Campaigns"}
                </h2>
                <span className="ml-1 text-[11px] bg-[#1E5EFF]/10 text-[#1E5EFF] px-2.5 py-0.5 rounded-full font-extrabold border border-[#1E5EFF]/15">
                  {filtered.length}
                </span>
              </div>

              {filtered.length === 0 ? (
                /* Empty State */
                <div className="bg-white rounded-[20px] border border-slate-200 shadow-[0_10px_30px_rgba(0,0,0,0.04)] p-16 flex flex-col items-center justify-center text-center gap-5">
                  <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center">
                    <Layers size={36} className="text-slate-300" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-700 text-lg mb-1">
                      {isVi ? "Không tìm thấy chiến dịch nào." : "No campaigns match your filters."}
                    </h3>
                    <p className="text-slate-400 text-sm font-semibold max-w-xs">
                      {isVi
                        ? "Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm."
                        : "Try adjusting your filter criteria or search terms."}
                    </p>
                  </div>
                  <button
                    onClick={clearFilters}
                    className="px-6 py-2.5 bg-[#1E5EFF] text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition cursor-pointer"
                  >
                    {isVi ? "Xóa bộ lọc" : "Clear Filters"}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filtered.map((campaign) => {
                    const catMeta = CATEGORY_META[campaign.category] || CATEGORY_META.environment;
                    const statusMeta = STATUS_META[campaign.status] || STATUS_META.inProgress;
                    const CatIcon = catMeta.icon;
                    const isSaved = savedCampaigns.includes(campaign.id);
                    const isJoined = joinedCampaigns.includes(campaign.id);

                    return (
                      <div
                        key={campaign.id}
                        className="bg-white rounded-[20px] border border-slate-200/80 shadow-[0_10px_30px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] transition-all duration-200 group"
                      >
                        {/* Cover Image */}
                        <div className="relative h-44 overflow-hidden bg-slate-100">
                          <img
                            src={campaign.cover}
                            alt={campaign.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          {/* Overlay gradient */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                          {/* Status Badge */}
                          <div className="absolute top-3 left-3">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border backdrop-blur-sm ${statusMeta.color}`}>
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusMeta.dot}`} />
                              {isVi ? statusMeta.label : statusMeta.labelEn}
                            </span>
                          </div>

                          {/* Bookmark */}
                          <button
                            onClick={() => handleSave(campaign.id)}
                            className={`absolute top-3 right-3 w-8 h-8 rounded-lg border backdrop-blur-sm flex items-center justify-center transition cursor-pointer ${
                              isSaved
                                ? "bg-[#1E5EFF] border-[#1E5EFF] text-white"
                                : "bg-white/80 border-white/50 text-slate-700 hover:bg-white"
                            }`}
                          >
                            <Bookmark size={13} fill={isSaved ? "currentColor" : "none"} />
                          </button>

                          {/* Category pill on image */}
                          <div className="absolute bottom-3 left-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider bg-white/90 backdrop-blur-sm ${catMeta.color}`}>
                              <CatIcon size={10} />
                              {isVi ? catMeta.label : catMeta.labelEn}
                            </span>
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-5 flex flex-col flex-1 gap-3">
                          {/* Title */}
                          <h3 className="font-black text-[#0B2545] text-sm leading-snug line-clamp-2">
                            {isVi ? campaign.name : campaign.nameEn}
                          </h3>

                          {/* Meta info */}
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-bold text-slate-400">
                            <span className="flex items-center gap-1">
                              <MapPin size={10} />
                              {campaign.ward}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users size={10} />
                              {campaign.participants}/{campaign.target} {isVi ? "TNV" : "Vol."}
                            </span>
                            <span className="flex items-center gap-1">
                              <FileText size={10} />
                              {campaign.reports} {isVi ? "phản ánh" : "reports"}
                            </span>
                            {campaign.daysLeft > 0 && (
                              <span className="flex items-center gap-1 text-amber-600">
                                <Clock size={10} />
                                {campaign.daysLeft} {isVi ? "ngày" : "days left"}
                              </span>
                            )}
                          </div>

                          {/* Created by */}
                          <div className="text-[10px] text-slate-400 font-semibold">
                            <span className="text-slate-300">{isVi ? "Khởi xướng bởi:" : "Created by:"}</span>{" "}
                            <span className="text-[#1E5EFF] font-bold">{isVi ? campaign.createdBy : campaign.createdByEn}</span>
                          </div>

                          {/* Progress Bar */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                              <span>{isVi ? "Tiến độ" : "Progress"}</span>
                              <span className={campaign.progress === 100 ? "text-[#22C55E]" : "text-[#1E5EFF]"}>
                                {campaign.progress}%
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  campaign.progress === 100
                                    ? "bg-gradient-to-r from-[#22C55E] to-emerald-400"
                                    : "bg-gradient-to-r from-[#1E5EFF] to-blue-400"
                                }`}
                                style={{ width: `${campaign.progress}%` }}
                              />
                            </div>
                          </div>

                          {/* Community Impact Score */}
                          <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                              <Star size={11} className="text-amber-400 fill-amber-400" />
                              <span>{isVi ? "Chỉ số tác động:" : "Impact Score:"}</span>
                              <span className="text-amber-500 font-extrabold">{campaign.impactScore}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
                              <Users size={10} />
                              <span>{campaign.affectedCitizens.toLocaleString()} {isVi ? "hộ dân" : "citizens"}</span>
                            </div>
                          </div>

                          {/* Buttons */}
                          <div className="flex gap-2 mt-1">
                            <Link
                              to={`/campaigns/${campaign.id}` as any}
                              className="flex-1 py-2 text-center text-[11px] font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition cursor-pointer"
                            >
                              {isVi ? "Xem chi tiết" : "View Detail"}
                            </Link>
                            {campaign.status !== "completed" && (
                              <button
                                onClick={() => handleJoin(campaign.id, isVi ? campaign.name : campaign.nameEn)}
                                className={`flex-1 py-2 text-[11px] font-bold rounded-xl transition cursor-pointer ${
                                  isJoined
                                    ? "bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/25 hover:bg-[#22C55E]/20"
                                    : "bg-[#1E5EFF] text-white hover:bg-blue-700 shadow-sm"
                                }`}
                              >
                                {isJoined ? (isVi ? "✓ Đang tham gia" : "✓ Joined") : (isVi ? "Tham gia" : "Join Campaign")}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* ── Community Impact Dashboard ────────────────── */}
            <section className="bg-white rounded-[20px] border border-[#E2E8F0] p-6 md:p-8 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-5 mb-6">
                <div className="w-1.5 h-5 bg-[#1E5EFF] rounded-sm" />
                <h2 className="text-[#0B2545] font-black text-xl">
                  {isVi ? "Chỉ số tác động cộng đồng" : "Community Impact Dashboard"}
                </h2>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: isVi ? "Phản ánh đã xử lý" : "Reports Resolved", value: "1,284", sub: isVi ? "Toàn thành phố" : "City-wide", icon: CheckCircle, color: "text-[#22C55E]", iconBg: "bg-[#22C55E]/10" },
                  { label: isVi ? "Công dân được hỗ trợ" : "Citizens Helped", value: "85,000", sub: isVi ? "Ước tính lũy kế" : "Cumulative estimate", icon: Users, color: "text-[#1E5EFF]", iconBg: "bg-[#1E5EFF]/10" },
                  { label: isVi ? "Chiến dịch hoàn thành" : "Campaigns Completed", value: "327", sub: isVi ? "Từ đầu năm 2026" : "Since Q1 2026", icon: Target, color: "text-purple-600", iconBg: "bg-purple-50" },
                  { label: isVi ? "Tình nguyện viên" : "Volunteers Participated", value: "8,452", sub: isVi ? "Tất cả chiến dịch" : "All campaigns", icon: Award, color: "text-amber-600", iconBg: "bg-amber-50" },
                  { label: isVi ? "Rác thu gom" : "Waste Collected", value: "24 Tấn", sub: isVi ? "Rác các loại" : "All waste types", icon: Trash2, color: "text-slate-700", iconBg: "bg-slate-100" },
                  { label: isVi ? "Cây xanh trồng mới" : "Trees Planted", value: "4,500", sub: isVi ? "Cây bóng mát, hoa" : "Shade & ornamental trees", icon: TreePine, color: "text-[#22C55E]", iconBg: "bg-[#22C55E]/10" },
                ].map((item, i) => (
                  <div key={i} className="p-4 bg-slate-50/60 border border-slate-100 rounded-2xl flex items-center gap-3 hover:bg-slate-50 transition">
                    <div className={`w-10 h-10 ${item.iconBg} rounded-xl flex items-center justify-center shrink-0`}>
                      <item.icon size={18} className={item.color} />
                    </div>
                    <div className="min-w-0">
                      <div className={`text-lg font-black ${item.color}`}>{item.value}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-tight">{item.label}</div>
                      <div className="text-[10px] font-semibold text-slate-300 mt-0.5">{item.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Top Volunteer Teams Leaderboard ───────────── */}
            <section className="bg-white rounded-[20px] border border-[#E2E8F0] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-5 bg-[#1E5EFF] rounded-sm" />
                  <h2 className="text-[#0B2545] font-black text-xl">
                    {isVi ? "Đội tình nguyện tiêu biểu" : "Top Volunteer Teams"}
                  </h2>
                </div>
                <span className="text-xs font-bold text-slate-400 bg-slate-50 border border-slate-100 px-2.5 py-1.5 rounded-lg">
                  {isVi ? "Tháng 6/2026" : "June 2026"}
                </span>
              </div>

              <div className="space-y-3">
                {TOP_VOLUNTEER_TEAMS.map((team, i) => (
                  <div key={i} className="flex items-center gap-4 p-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl hover:bg-slate-50 transition">
                    {/* Rank badge */}
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-black shrink-0 shadow-sm"
                      style={{ backgroundColor: team.color }}
                    >
                      #{team.rank}
                    </div>

                    {/* Avatar */}
                    <img src={team.avatar} alt={team.name} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm shrink-0" />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-black text-slate-800 truncate">
                        {isVi ? team.name : team.nameEn}
                      </div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                        {team.members} {isVi ? "thành viên" : "members"} · {team.campaigns} {isVi ? "chiến dịch" : "campaigns"}
                      </div>
                    </div>

                    {/* Score */}
                    <div className="text-right shrink-0">
                      <div className="text-sm font-black" style={{ color: team.color }}>
                        {team.score.toLocaleString()}
                      </div>
                      <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                        {isVi ? "điểm tác động" : "impact pts"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Upcoming Activities Timeline ──────────────── */}
            <section className="bg-white rounded-[20px] border border-[#E2E8F0] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-6">
                <div className="w-1.5 h-5 bg-[#1E5EFF] rounded-sm" />
                <h2 className="text-[#0B2545] font-black text-xl">
                  {isVi ? "Hoạt động sắp diễn ra" : "Upcoming Activities"}
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                      <th className="pb-3 pr-4">{isVi ? "Thời gian" : "Date/Time"}</th>
                      <th className="pb-3 pr-4">{isVi ? "Địa điểm" : "Location"}</th>
                      <th className="pb-3 pr-4">{isVi ? "Chiến dịch" : "Campaign"}</th>
                      <th className="pb-3 pr-4 text-right">{isVi ? "Dự kiến" : "Target"}</th>
                      <th className="pb-3 text-right">{isVi ? "Trạng thái" : "Status"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-600">
                    {UPCOMING_ACTIVITIES.map((act, i) => (
                      <tr key={i} className="hover:bg-slate-50/60 transition">
                        <td className="py-3.5 pr-4">
                          <span className="block font-black text-slate-800 text-xs">{act.date}</span>
                          <span className="text-[10px] text-slate-400">{act.time}</span>
                        </td>
                        <td className="py-3.5 pr-4">
                          <span className="flex items-center gap-1 text-slate-500 text-[11px]">
                            <MapPin size={11} className="text-slate-400 shrink-0" />
                            {isVi ? act.loc : act.locEn}
                          </span>
                        </td>
                        <td className="py-3.5 pr-4">
                          <span className="text-[#1E5EFF] font-bold text-[11px]">
                            {isVi ? act.campaign : act.campaignEn}
                          </span>
                        </td>
                        <td className="py-3.5 pr-4 text-right font-black text-slate-800 text-[11px]">
                          {act.participants}
                        </td>
                        <td className="py-3.5 text-right">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide border ${
                            act.status === "upcoming"
                              ? "bg-blue-50 border-blue-100 text-[#1E5EFF]"
                              : "bg-slate-50 border-slate-100 text-slate-400"
                          }`}>
                            {act.status === "upcoming" ? (isVi ? "Lên lịch" : "Scheduled") : (isVi ? "Dự thảo" : "Draft")}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* ── Success Stories ───────────────────────────── */}
            <section>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1.5 h-5 bg-[#1E5EFF] rounded-sm" />
                <h2 className="text-[#0B2545] font-black text-xl">
                  {isVi ? "Câu chuyện thành công" : "Success Stories"}
                </h2>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {SUCCESS_STORIES.map((story) => (
                  <div key={story.id} className="bg-white rounded-[20px] border border-[#E2E8F0] overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
                    {/* Before / After grid */}
                    <div className="grid grid-cols-2 gap-1 p-3 bg-slate-50 border-b border-slate-100">
                      <div className="relative rounded-xl overflow-hidden aspect-[4/3]">
                        <img src={story.before} alt="Before" className="w-full h-full object-cover" />
                        <div className="absolute top-2 left-2 px-2 py-0.5 bg-red-600/90 text-white text-[9px] font-extrabold uppercase rounded-md tracking-wide">
                          BEFORE
                        </div>
                      </div>
                      <div className="relative rounded-xl overflow-hidden aspect-[4/3]">
                        <img src={story.after} alt="After" className="w-full h-full object-cover" />
                        <div className="absolute top-2 left-2 px-2 py-0.5 bg-green-600/90 text-white text-[9px] font-extrabold uppercase rounded-md tracking-wide">
                          AFTER
                        </div>
                      </div>
                    </div>

                    <div className="p-5 space-y-3">
                      <h3 className="font-black text-slate-800 text-sm">
                        {isVi ? story.name : story.nameEn}
                      </h3>
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-[#22C55E] flex items-center gap-1.5">
                          <CheckCircle size={13} />
                          {isVi ? story.metric : story.metricEn}
                        </div>
                        <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
                          <Star size={12} className="fill-amber-400" />
                          {story.satisfaction} / 5.0
                        </div>
                      </div>
                      <div className="text-[11px] font-bold text-slate-400">
                        {story.volunteers} {isVi ? "tình nguyện viên tham gia" : "volunteers participated"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

          </div>

          {/* ── RIGHT FLOATING PANEL ──────────────────────────── */}
          <div className="hidden xl:block w-[280px] shrink-0 space-y-5 sticky top-[76px]">

            {/* Quick Campaign Summary */}
            <div className="bg-white rounded-[20px] border border-[#E2E8F0] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
              <h3 className="flex items-center gap-2 text-sm font-black text-[#0B2545] border-b border-slate-50 pb-3 mb-4">
                <BarChart2 size={15} className="text-[#1E5EFF]" />
                {isVi ? "Tổng quan nhanh" : "Quick Summary"}
              </h3>

              <div className="space-y-0 divide-y divide-slate-100">
                {[
                  { label: isVi ? "Đang hoạt động" : "Active", value: "156", color: "text-[#1E5EFF]" },
                  { label: isVi ? "Đang tuyển TNV" : "Recruiting", value: "48", color: "text-amber-500" },
                  { label: isVi ? "Đã tham gia" : "My Joined", value: joinedCampaigns.length.toString(), color: "text-[#22C55E]" },
                  { label: isVi ? "Đã lưu" : "My Saved", value: savedCampaigns.length.toString(), color: "text-purple-600" },
                ].map((row, i) => (
                  <div key={i} className="flex justify-between items-center py-2.5 text-xs font-semibold">
                    <span className="text-slate-500">{row.label}</span>
                    <span className={`font-black text-sm ${row.color}`}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Buttons */}
            <div className="bg-white rounded-[20px] border border-[#E2E8F0] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)] space-y-2.5">
              <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">
                {isVi ? "Hành động nhanh" : "Quick Actions"}
              </h3>

              <Link
                to="/campaigns/green-hoa-xuan"
                className="w-full flex items-center justify-between px-4 py-3 bg-[#1E5EFF] text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition cursor-pointer shadow-sm"
              >
                <span className="flex items-center gap-2">
                  <PlusCircle size={14} />
                  {isVi ? "Tạo chiến dịch mới" : "Create Campaign"}
                </span>
                <ArrowRight size={12} />
              </Link>

              <button
                onClick={() => toast.success(isVi ? "Đang mở chiến dịch của bạn..." : "Opening your campaigns...")}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Users size={14} />
                  {isVi ? "Chiến dịch của tôi" : "My Campaigns"}
                </span>
                <ChevronRight size={12} />
              </button>

              <button
                onClick={() => toast.success(isVi ? "Đang mở danh sách đã lưu..." : "Opening saved campaigns...")}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Bookmark size={14} />
                  {isVi ? "Đã lưu" : "Saved Campaigns"}
                </span>
                <ChevronRight size={12} />
              </button>
            </div>

            {/* Platform Stats */}
            <div className="bg-gradient-to-br from-[#1E5EFF] to-blue-700 rounded-[20px] p-5 text-white shadow-[0_10px_30px_rgba(30,94,255,0.25)]">
              <div className="flex items-center gap-2 mb-4">
                <Globe size={15} className="text-white/70" />
                <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-white/70">
                  {isVi ? "Nền tảng Đà Nẵng Kết Nối" : "Da Nang Connect Platform"}
                </h3>
              </div>
              <div className="space-y-3">
                {[
                  { label: isVi ? "Phường đã tham gia" : "Wards Participating", value: "56/56" },
                  { label: isVi ? "Người dùng tích cực" : "Active Citizens", value: "24,800+" },
                  { label: isVi ? "Tỷ lệ giải quyết" : "Resolution Rate", value: "91.4%" },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center text-xs">
                    <span className="text-white/70 font-semibold">{item.label}</span>
                    <span className="font-black text-white">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity Feed */}
            <div className="bg-white rounded-[20px] border border-[#E2E8F0] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
              <h3 className="flex items-center gap-2 text-xs font-extrabold text-[#0B2545] uppercase tracking-wider mb-4">
                <Activity size={13} className="text-[#1E5EFF]" />
                {isVi ? "Hoạt động gần đây" : "Recent Activity"}
              </h3>
              <div className="space-y-3">
                {[
                  { text: isVi ? "42 TNV tham gia Chiến dịch Xanh Hòa Xuân" : "42 volunteers joined Green Hoa Xuan", time: "5m" },
                  { text: isVi ? "Chiến dịch Trồng cây đã hoàn thành" : "Tree Planting Program completed", time: "2h" },
                  { text: isVi ? "18 phản ánh mới được tiếp nhận" : "18 new reports received", time: "4h" },
                  { text: isVi ? "Tổ dân phố số 5 đạt 7,320 điểm tác động" : "Neighborhood Team 5 achieved 7,320 pts", time: "1d" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1E5EFF] mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-semibold text-slate-600 leading-snug">{item.text}</p>
                      <span className="text-[9px] text-slate-300 font-bold">{item.time} {isVi ? "trước" : "ago"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Footer ────────────────────────────────────────────── */}
      <div className="mt-16 border-t border-[#E2E8F0] bg-white py-10">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-xs">
            {/* Gov info */}
            <div>
              <h4 className="font-extrabold text-[#0B2545] uppercase tracking-wider text-[10px] mb-3">
                {isVi ? "Thông tin chính quyền" : "Government Information"}
              </h4>
              <ul className="space-y-2 text-slate-500 font-semibold">
                <li><a href="#" className="hover:text-[#1E5EFF] transition">UBND TP. Đà Nẵng</a></li>
                <li><a href="#" className="hover:text-[#1E5EFF] transition">{isVi ? "Cổng thông tin điện tử" : "Digital Information Portal"}</a></li>
                <li><a href="#" className="hover:text-[#1E5EFF] transition">{isVi ? "Văn bản pháp luật" : "Legal Documents"}</a></li>
              </ul>
            </div>
            {/* Support */}
            <div>
              <h4 className="font-extrabold text-[#0B2545] uppercase tracking-wider text-[10px] mb-3">
                {isVi ? "Hỗ trợ" : "Support"}
              </h4>
              <ul className="space-y-2 text-slate-500 font-semibold">
                <li><a href="#" className="hover:text-[#1E5EFF] transition">{isVi ? "Hướng dẫn sử dụng" : "User Guide"}</a></li>
                <li><a href="#" className="hover:text-[#1E5EFF] transition">FAQ</a></li>
                <li><a href="#" className="hover:text-[#1E5EFF] transition">{isVi ? "Báo lỗi kỹ thuật" : "Report Bug"}</a></li>
              </ul>
            </div>
            {/* Contact */}
            <div>
              <h4 className="font-extrabold text-[#0B2545] uppercase tracking-wider text-[10px] mb-3">
                {isVi ? "Liên hệ" : "Contact"}
              </h4>
              <ul className="space-y-2 text-slate-500 font-semibold">
                <li>contact@danangconnect.gov.vn</li>
                <li>{isVi ? "Đà Nẵng, Việt Nam" : "Da Nang, Vietnam"}</li>
              </ul>
            </div>
            {/* Hotline */}
            <div>
              <h4 className="font-extrabold text-[#0B2545] uppercase tracking-wider text-[10px] mb-3">
                {isVi ? "Đường dây nóng" : "Hotline"}
              </h4>
              <div className="text-2xl font-black text-[#1E5EFF] mb-1">1022</div>
              <p className="text-slate-400 font-semibold text-[10px] leading-snug">
                {isVi ? "Phản ánh khẩn cấp 24/7" : "24/7 Emergency Reporting"}
              </p>
              <div className="mt-3">
                <a href="#" className="text-[10px] font-bold text-slate-500 hover:text-[#1E5EFF] transition underline underline-offset-2">
                  {isVi ? "Quy tắc cộng đồng" : "Community Guidelines"}
                </a>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-slate-100 text-center text-[10px] text-slate-400 font-semibold">
            © 2026 Đà Nẵng Kết Nối · UBND Thành phố Đà Nẵng · {isVi ? "Nền tảng phản ánh đô thị thông minh" : "Smart City Civic Reporting Platform"}
          </div>
        </div>
      </div>

    </div>
  );
}
