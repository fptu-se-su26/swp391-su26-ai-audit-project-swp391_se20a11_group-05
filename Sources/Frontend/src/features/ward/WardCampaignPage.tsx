import { useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Download,
  Eye,
  FileText,
  Filter,
  Flag,
  Grid2X2,
  Handshake,
  Layers,
  List,
  MapPin,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Star,
  Target,
  TrendingDown,
  Users,
} from "lucide-react";

type CampaignRole = "Chủ trì" | "Phối hợp" | "Tham khảo" | "Chờ duyệt";
type CampaignStatus = "Đang diễn ra" | "Sắp kết thúc" | "Hoàn thành" | "Quá hạn" | "Sắp diễn ra";

interface Campaign {
  id: string;
  name: string;
  description: string;
  field: string;
  hostUnit: string;
  role: CampaignRole;
  area: string;
  time: string;
  status: CampaignStatus;
  reports: number;
  progress: number;
  participants: string;
  createdBy: string;
  updatedAt: string;
}

const campaigns: Campaign[] = [
  {
    id: "CD-2026-024",
    name: "Hòa Xuân xanh & sạch",
    description: "Dọn dẹp tuyến đường, xử lý điểm rác tồn đọng và tuyên truyền phân loại rác.",
    field: "Môi trường",
    hostUnit: "UBND Phường Hòa Xuân",
    role: "Chủ trì",
    area: "Hòa Xuân Bắc",
    time: "01/06/2026 - 30/06/2026",
    status: "Đang diễn ra",
    reports: 18,
    progress: 72,
    participants: "42/60",
    createdBy: "UBND Phường Hòa Xuân",
    updatedAt: "Hôm nay",
  },
  {
    id: "CD-2026-025",
    name: "Khắc phục ổ gà đường 2/9",
    description: "Tổng hợp phản ánh hạ tầng, khoanh vùng điểm nguy hiểm và phối hợp xử lý mặt đường.",
    field: "Hạ tầng giao thông",
    hostUnit: "UBND Phường Hòa Xuân",
    role: "Chủ trì",
    area: "Đường 2/9",
    time: "05/06/2026 - 18/06/2026",
    status: "Sắp kết thúc",
    reports: 14,
    progress: 84,
    participants: "18/24",
    createdBy: "UBND Phường Hòa Xuân",
    updatedAt: "1 giờ trước",
  },
  {
    id: "CD-2026-018",
    name: "Vệ sinh tuyến kênh giáp Hòa Quý",
    description: "Phối hợp làm sạch tuyến kênh, gom rác nổi và kiểm tra điểm xả thải.",
    field: "Môi trường",
    hostUnit: "UBND Phường Hòa Quý",
    role: "Phối hợp",
    area: "Kênh giáp ranh",
    time: "10/06/2026 - 24/06/2026",
    status: "Đang diễn ra",
    reports: 9,
    progress: 45,
    participants: "12/20",
    createdBy: "UBND Phường Hòa Quý",
    updatedAt: "Hôm qua",
  },
  {
    id: "CD-2026-011",
    name: "Tuyên truyền an toàn cổng trường",
    description: "Mô hình tham khảo về phân luồng phụ huynh và giảm ùn tắc giờ cao điểm.",
    field: "Tuyên truyền",
    hostUnit: "UBND Phường Khuê Mỹ",
    role: "Tham khảo",
    area: "Cụm trường học",
    time: "12/05/2026 - 28/05/2026",
    status: "Hoàn thành",
    reports: 5,
    progress: 100,
    participants: "120",
    createdBy: "UBND Phường Khuê Mỹ",
    updatedAt: "22 ngày trước",
  },
  {
    id: "CD-2026-031",
    name: "Kiểm tra trật tự đô thị tuyến Nguyễn Phước Lan",
    description: "Đã gửi đề xuất hỗ trợ vì tuyến đường có đoạn giáp ranh cần phối hợp kiểm tra.",
    field: "Trật tự đô thị",
    hostUnit: "UBND Phường Cẩm Lệ",
    role: "Chờ duyệt",
    area: "Nguyễn Phước Lan",
    time: "22/06/2026 - 30/06/2026",
    status: "Sắp diễn ra",
    reports: 7,
    progress: 12,
    participants: "Chờ duyệt",
    createdBy: "UBND Phường Cẩm Lệ",
    updatedAt: "2 ngày trước",
  },
];

const roleTabs = [
  { label: "Của phường tôi", count: 12 },
  { label: "Đang phối hợp", count: 4 },
  { label: "Tham khảo liên phường", count: 18 },
  { label: "Chờ duyệt hỗ trợ", count: 3 },
];

const statusTone: Record<CampaignStatus, string> = {
  "Đang diễn ra": "bg-emerald-50 text-emerald-700 border-emerald-100",
  "Sắp kết thúc": "bg-amber-50 text-amber-700 border-amber-100",
  "Hoàn thành": "bg-blue-50 text-blue-700 border-blue-100",
  "Quá hạn": "bg-rose-50 text-rose-700 border-rose-100",
  "Sắp diễn ra": "bg-violet-50 text-violet-700 border-violet-100",
};

const roleTone: Record<CampaignRole, string> = {
  "Chủ trì": "bg-blue-50 text-blue-700 border-blue-100",
  "Phối hợp": "bg-emerald-50 text-emerald-700 border-emerald-100",
  "Tham khảo": "bg-slate-50 text-slate-600 border-slate-200",
  "Chờ duyệt": "bg-orange-50 text-orange-700 border-orange-100",
};

const fieldTone: Record<string, string> = {
  "Môi trường": "bg-emerald-50 text-emerald-700",
  "Hạ tầng giao thông": "bg-orange-50 text-orange-700",
  "Trật tự đô thị": "bg-violet-50 text-violet-700",
  "Tuyên truyền": "bg-blue-50 text-blue-700",
};

export function WardCampaignPage() {
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const selectedCampaign = useMemo(
    () => campaigns.find((campaign) => campaign.id === selectedCampaignId) ?? campaigns[0],
    [selectedCampaignId],
  );

  if (selectedCampaignId) {
    return (
      <CampaignDetail
        campaign={selectedCampaign}
        onBack={() => setSelectedCampaignId(null)}
      />
    );
  }

  return <CampaignDashboard onSelectCampaign={setSelectedCampaignId} />;
}

function CampaignDashboard({ onSelectCampaign }: { onSelectCampaign: (id: string) => void }) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B2545]">Quản lý chiến dịch</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Theo dõi, tạo và điều phối các chiến dịch trên địa bàn phường.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50">
            <Download size={16} />
            Xuất báo cáo
          </button>
          <button className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#0F5BD8] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#0B4FC0]">
            <Plus size={17} />
            Tạo chiến dịch
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <AiSuggestionCard />
        <KpiCard icon={Flag} label="Tổng chiến dịch" value="28" note="+4 so với tháng trước" />
        <KpiCard icon={Target} label="Đang diễn ra" value="12" note="42,9% tổng số" tone="emerald" />
        <KpiCard icon={Clock3} label="Sắp kết thúc" value="5" note="Trong 7 ngày tới" tone="amber" />
        <KpiCard icon={CheckCircle2} label="Đã kết thúc" value="11" note="39,2% tổng số" tone="violet" />
        <KpiCard icon={FileText} label="Phản ánh liên quan" value="12.456" note="Trong tất cả chiến dịch" tone="sky" />
      </div>

      <div className="rounded-xl border border-[#E4EAF2] bg-white p-2 shadow-sm">
        <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
          {roleTabs.map((tab, index) => (
            <button
              key={tab.label}
              className={`h-11 rounded-lg px-3 text-sm font-extrabold transition ${
                index === 0
                  ? "bg-[#0F5BD8] text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {tab.label} <span className="font-sans">{tab.count}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <section className="xl:col-span-6 rounded-xl border border-[#E4EAF2] bg-white p-4 shadow-sm">
          <PanelHeader title="Bản đồ chiến dịch" action="Tất cả chiến dịch" />
          <CampaignImpactMap />
        </section>

        <section className="xl:col-span-3 rounded-xl border border-[#E4EAF2] bg-white p-4 shadow-sm">
          <PanelHeader title="Cần chú ý" action="Xem tất cả" />
          <div className="mt-4 space-y-3">
            {[
              ["2 chiến dịch quá hạn", "Cần cập nhật tiến độ", "rose"],
              ["3 chiến dịch sắp kết thúc", "Trong vòng 7 ngày", "amber"],
              ["5 phản ánh chưa gắn chiến dịch", "Cần xem xét xử lý", "blue"],
            ].map(([title, desc, tone]) => (
              <div key={title} className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/70 p-3">
                <span className={`flex h-9 w-9 items-center justify-center rounded-full ${
                  tone === "rose" ? "bg-rose-50 text-rose-600" : tone === "amber" ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                }`}>
                  <AlertTriangle size={17} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-extrabold text-slate-800">{title}</p>
                  <p className="text-xs font-medium text-slate-500">{desc}</p>
                </div>
                <ChevronRight size={16} className="text-slate-400" />
              </div>
            ))}
          </div>
        </section>

        <section className="xl:col-span-3 rounded-xl border border-[#E4EAF2] bg-white p-4 shadow-sm">
          <PanelHeader title="Hiệu quả tháng này" />
          <div className="mt-5 grid grid-cols-3 gap-3">
            <MiniMetric value="76%" label="Tỷ lệ hoàn thành" color="emerald" />
            <MiniMetric value="186" label="Người tham gia" color="blue" />
            <MiniMetric value="42" label="Phản ánh đã xử lý" color="violet" />
          </div>
          <div className="mt-5 rounded-lg bg-emerald-50 p-3">
            <div className="flex items-center gap-2 text-sm font-extrabold text-emerald-700">
              <TrendingDown size={16} />
              Giảm 81% phản ánh sau chiến dịch
            </div>
            <p className="mt-1 text-xs font-medium text-emerald-700/80">
              Dựa trên các phản ánh liên quan trong 30 ngày gần nhất.
            </p>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <section className="xl:col-span-4 rounded-xl border border-[#E4EAF2] bg-white p-4 shadow-sm">
          <PanelHeader title="Tiến trình chiến dịch" action="Đang diễn ra" />
          <Timeline />
        </section>

        <section className="xl:col-span-5 rounded-xl border border-[#E4EAF2] bg-white p-4 shadow-sm">
          <PanelHeader title="Chiến dịch đang theo dõi" />
          <FeaturedCampaign onSelect={() => onSelectCampaign("CD-2026-024")} />
        </section>

        <section className="xl:col-span-3 rounded-xl border border-[#E4EAF2] bg-white p-4 shadow-sm">
          <PanelHeader title="Phối hợp liên phường" action="Xem tất cả" />
          <div className="mt-4 space-y-3">
            <div className="rounded-lg border border-amber-100 bg-amber-50/60 p-3">
              <p className="text-sm font-extrabold text-slate-800">Hòa Quý đề xuất hỗ trợ tuyến kênh</p>
              <p className="mt-1 text-xs font-medium text-slate-500">Cần phản hồi trong hôm nay.</p>
              <div className="mt-3 flex gap-2">
                <button className="h-8 rounded-lg bg-[#0F5BD8] px-3 text-xs font-bold text-white">Duyệt</button>
                <button className="h-8 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600">Từ chối</button>
              </div>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
              <p className="text-sm font-extrabold text-slate-800">Đã gửi đề xuất đến Khuê Mỹ</p>
              <span className="mt-2 inline-flex rounded-full bg-orange-50 px-2 py-1 text-[11px] font-extrabold text-orange-700">
                Chờ phản hồi
              </span>
            </div>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <section className="xl:col-span-4 rounded-xl border border-[#E4EAF2] bg-white p-4 shadow-sm">
          <PanelHeader title="So sánh trước & sau chiến dịch" action="30 ngày" />
          <BeforeAfterChart />
        </section>
        <section className="xl:col-span-4 rounded-xl border border-[#E4EAF2] bg-white p-4 shadow-sm">
          <PanelHeader title="Tác động của chiến dịch" />
          <ImpactStats />
        </section>
        <section className="xl:col-span-4 rounded-xl border border-[#E4EAF2] bg-white p-4 shadow-sm">
          <PanelHeader title="Đánh giá hiệu quả bởi AI" action="Xem đánh giá" />
          <AiEvaluation />
        </section>
      </div>

      <CampaignTable onSelectCampaign={onSelectCampaign} />
    </div>
  );
}

function CampaignDetail({ campaign, onBack }: { campaign: Campaign; onBack: () => void }) {
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-[#E4EAF2] bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <button
                onClick={onBack}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                aria-label="Quay lại danh sách chiến dịch"
              >
                <ArrowLeft size={17} />
              </button>
              <span className="text-sm font-bold text-slate-400">Chiến dịch / Chi tiết chiến dịch</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-extrabold text-[#0B2545]">{campaign.name}</h1>
              <Badge className={statusTone[campaign.status]}>{campaign.status}</Badge>
              <Badge className={fieldTone[campaign.field] ?? "bg-slate-50 text-slate-600"}>{campaign.field}</Badge>
            </div>
            <p className="mt-2 max-w-3xl text-sm font-medium text-slate-500">{campaign.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <MetaChip icon={CalendarDays} label={campaign.time} />
              <MetaChip icon={Layers} label={`Đơn vị chủ trì: ${campaign.hostUnit}`} />
              <MetaChip icon={Users} label={`Người tham gia: ${campaign.participants}`} />
              <MetaChip icon={Flag} label={`Mã ${campaign.id}`} />
            </div>
          </div>
          <div className="flex gap-2">
            <button className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#0F5BD8] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#0B4FC0]">
              <BarChart3 size={16} />
              Cập nhật tiến độ
            </button>
            <button className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50">
              <Pencil size={16} />
              Chỉnh sửa
            </button>
            <button className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50">
              <MoreHorizontal size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <DetailKpi label="Tiến độ" value={`${campaign.progress}%`} progress={campaign.progress} icon={TrendingDown} />
        <DetailKpi label="Nhiệm vụ" value="12/18" progress={67} icon={CheckCircle2} />
        <DetailKpi label="Phản ánh liên quan" value={String(campaign.reports)} progress={55} icon={FileText} />
        <DetailKpi label="Ngày còn lại" value="11 ngày" progress={42} icon={Clock3} />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <section className="xl:col-span-7 space-y-5">
          <div className="rounded-xl border border-[#E4EAF2] bg-white p-4 shadow-sm">
            <PanelHeader title="Tổng quan chiến dịch" />
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Chiến dịch tập trung xử lý các điểm phản ánh lặp lại, cải thiện vệ sinh khu dân cư và giảm khối lượng phản ánh mới trong khu vực Hòa Xuân.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {["Thu gom rác tồn đọng tại các điểm nóng", "Phân loại và vận chuyển rác đúng quy định", "Tuyên truyền duy trì vệ sinh khu dân cư", "Nghiệm thu khu vực sau khi xử lý"].map((item) => (
                <div key={item} className="flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-sm font-bold text-slate-700">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  {item}
                </div>
              ))}
            </div>
            <Timeline compact />
          </div>

          <div className="rounded-xl border border-[#E4EAF2] bg-white p-4 shadow-sm">
            <PanelHeader title="Nhiệm vụ thực hiện" />
            <TaskList />
          </div>

          <div className="rounded-xl border border-[#E4EAF2] bg-white p-4 shadow-sm">
            <PanelHeader title="Phản ánh liên quan" action={`${campaign.reports} phản ánh`} />
            <RelatedReports />
          </div>
        </section>

        <aside className="xl:col-span-5 space-y-5">
          <div className="rounded-xl border border-[#E4EAF2] bg-white p-4 shadow-sm">
            <PanelHeader title="Khu vực triển khai" />
            <CampaignRouteMap />
          </div>

          <div className="rounded-xl border border-[#E4EAF2] bg-white p-4 shadow-sm">
            <PanelHeader title="Đơn vị thực hiện" />
            <UnitCollaboration />
          </div>

          <div className="rounded-xl border border-[#E4EAF2] bg-white p-4 shadow-sm">
            <PanelHeader title="Tài liệu & hình ảnh" />
            <AttachmentGrid />
          </div>
        </aside>
      </div>

      <section className="rounded-xl border border-[#E4EAF2] bg-white p-4 shadow-sm">
        <PanelHeader title="Nhật ký cập nhật" />
        <ActivityLog />
      </section>
    </div>
  );
}

function AiSuggestionCard() {
  return (
    <section className="xl:col-span-5 rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-extrabold text-[#0B2545]">
            <Sparkles size={17} className="text-[#0F5BD8]" />
            AI đề xuất
          </div>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Phát hiện 14 phản ánh cùng chủ đề trong 5 ngày qua
          </p>
          <h2 className="mt-3 text-lg font-extrabold text-[#0B2545]">Khắc phục ổ gà đường 2/9</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge className="bg-orange-50 text-orange-700">Hạ tầng giao thông</Badge>
            <Badge className="bg-blue-50 text-blue-700">Đề xuất bởi AI</Badge>
          </div>
        </div>
        <div className="hidden h-24 w-28 items-center justify-center rounded-xl bg-white/80 text-[#0F5BD8] shadow-sm md:flex">
          <BarChart3 size={42} />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <Metric label="Phản ánh liên quan" value="14" />
        <Metric label="Liên tục" value="6 ngày" />
        <Metric label="Vụ tai nạn liên quan" value="3" />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button className="h-9 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50">
          Xem chi tiết phân tích
        </button>
        <button className="h-9 flex-1 rounded-lg bg-[#0F5BD8] px-3 text-xs font-bold text-white hover:bg-[#0B4FC0]">
          Tạo chiến dịch
        </button>
      </div>
    </section>
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
  value: string;
  note: string;
  tone?: "blue" | "emerald" | "amber" | "violet" | "sky";
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    violet: "bg-violet-50 text-violet-700",
    sky: "bg-sky-50 text-sky-700",
  };
  return (
    <section className="xl:col-span-1 min-h-[132px] rounded-xl border border-[#E4EAF2] bg-white p-4 shadow-sm">
      <span className={`flex h-10 w-10 items-center justify-center rounded-full ${colors[tone]}`}>
        <Icon size={19} />
      </span>
      <p className="mt-4 text-xs font-extrabold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-extrabold text-[#0B2545]">{value}</p>
      <p className="mt-1 text-xs font-medium text-slate-400">{note}</p>
    </section>
  );
}

function PanelHeader({ title, action }: { title: string; action?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-base font-extrabold text-[#0B2545]">{title}</h2>
      {action ? (
        <button className="text-xs font-bold text-[#0F5BD8] hover:underline">{action}</button>
      ) : null}
    </div>
  );
}

function CampaignImpactMap() {
  const pins = [
    ["left-[21%] top-[42%]", "bg-red-500", "Rất cao"],
    ["left-[39%] top-[35%]", "bg-orange-500", "Cao"],
    ["left-[52%] top-[53%]", "bg-emerald-500", "Thấp"],
    ["left-[64%] top-[31%]", "bg-blue-500", "Đang diễn ra"],
    ["left-[72%] top-[57%]", "bg-violet-500", "Tuyên truyền"],
    ["left-[31%] top-[64%]", "bg-orange-500", "Cao"],
  ];
  return (
    <div className="relative mt-4 h-[300px] overflow-hidden rounded-xl border border-slate-200 bg-[#e8f1f5]">
      <MapBackdrop />
      <div className="absolute inset-x-12 top-10 h-48 rounded-[45%] border-2 border-dashed border-[#0F5BD8]/50 bg-[#0F5BD8]/5" />
      {pins.map(([pos, color, label]) => (
        <div key={pos} className={`absolute ${pos} group`}>
          <span className={`block h-4 w-4 rounded-full ${color} ring-8 ring-current/20 shadow-lg`} />
          <span className="pointer-events-none absolute left-5 top-0 hidden whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-[10px] font-bold text-white group-hover:block">
            {label}
          </span>
        </div>
      ))}
      <div className="absolute left-4 bottom-4 rounded-lg bg-white/95 p-3 shadow-sm">
        {[
          ["bg-red-500", "Rất cao"],
          ["bg-orange-500", "Cao"],
          ["bg-amber-400", "Trung bình"],
          ["bg-emerald-500", "Thấp"],
          ["bg-slate-300", "Rất thấp"],
        ].map(([color, label]) => (
          <div key={label} className="mb-1 flex items-center gap-2 last:mb-0">
            <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
            <span className="text-[11px] font-bold text-slate-600">{label}</span>
          </div>
        ))}
      </div>
      <div className="absolute right-4 top-4 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <button className="block h-8 w-8 border-b border-slate-200 text-sm font-extrabold text-slate-600">+</button>
        <button className="block h-8 w-8 text-sm font-extrabold text-slate-600">-</button>
      </div>
    </div>
  );
}

function MapBackdrop() {
  return (
    <div className="absolute inset-0">
      <div className="absolute -right-8 top-0 h-full w-32 rotate-12 bg-sky-200/70" />
      <div className="absolute left-0 top-[34%] h-4 w-full -rotate-12 bg-white/85 shadow-sm" />
      <div className="absolute left-0 top-[58%] h-3 w-full rotate-6 bg-white/85 shadow-sm" />
      <div className="absolute left-[30%] top-0 h-full w-3 rotate-12 bg-white/85 shadow-sm" />
      <div className="absolute left-[58%] top-0 h-full w-4 -rotate-6 bg-white/85 shadow-sm" />
      <span className="absolute left-[18%] top-[25%] text-[10px] font-extrabold uppercase text-slate-400">Hòa Xuân Bắc</span>
      <span className="absolute left-[50%] top-[44%] text-[10px] font-extrabold uppercase text-slate-400">Hòa Xuân Đông</span>
      <span className="absolute left-[37%] top-[70%] text-[10px] font-extrabold uppercase text-slate-400">Hòa Xuân Tây</span>
      <span className="absolute right-[5%] top-[31%] text-[10px] font-extrabold uppercase text-slate-400">Hòa Quý</span>
    </div>
  );
}

function MiniMetric({ value, label, color }: { value: string; label: string; color: "emerald" | "blue" | "violet" }) {
  const colors = {
    emerald: "border-emerald-200 text-emerald-700",
    blue: "border-blue-200 text-blue-700",
    violet: "border-violet-200 text-violet-700",
  };
  return (
    <div className={`flex aspect-square flex-col items-center justify-center rounded-full border-4 ${colors[color]}`}>
      <span className="font-sans text-lg font-extrabold">{value}</span>
      <span className="mt-1 max-w-[76px] text-center text-[10px] font-bold leading-tight text-slate-500">{label}</span>
    </div>
  );
}

function Timeline({ compact = false }: { compact?: boolean }) {
  const items = [
    ["Tạo chiến dịch", "01/06/2026", "Cán bộ phường tạo", true],
    ["Giao nhiệm vụ", "02/06/2026", "Đã giao 5 nhóm xử lý", true],
    ["Xử lý phản ánh", "05/06/2026", "Đã xử lý 8/20 điểm", true],
    ["Nghiệm thu", "Hiện tại", "Đang kiểm tra, đánh giá", false],
    ["Hoàn thành", "Dự kiến 30/06/2026", "Chờ xác nhận", false],
  ] as const;
  return (
    <div className={`mt-4 ${compact ? "grid gap-3 md:grid-cols-5" : "space-y-4"}`}>
      {items.map(([title, date, desc, done], index) => (
        <div key={title} className={`relative ${compact ? "" : "pl-9"}`}>
          {!compact ? <span className="absolute left-3 top-8 h-full w-px bg-slate-200 last:hidden" /> : null}
          <span className={`${compact ? "mb-2" : "absolute left-0 top-0"} flex h-7 w-7 items-center justify-center rounded-full ${
            done ? "bg-emerald-500 text-white" : index === 3 ? "bg-[#0F5BD8] text-white" : "bg-slate-200 text-slate-500"
          }`}>
            {done ? <CheckCircle2 size={15} /> : index + 1}
          </span>
          <p className="text-sm font-extrabold text-slate-800">{title}</p>
          <p className="text-xs font-bold text-slate-400">{date}</p>
          <p className="mt-1 text-xs font-medium text-slate-500">{desc}</p>
        </div>
      ))}
    </div>
  );
}

function FeaturedCampaign({ onSelect }: { onSelect: () => void }) {
  return (
    <div className="mt-4 grid gap-4 md:grid-cols-[180px_1fr]">
      <div className="flex min-h-[140px] items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-sky-100 text-emerald-700">
        <Users size={54} />
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-extrabold text-[#0B2545]">Hòa Xuân xanh & sạch</h3>
          <Badge className="bg-emerald-50 text-emerald-700">Môi trường</Badge>
        </div>
        <p className="mt-2 text-sm font-medium text-slate-500">Thời gian: 01/06/2026 - 30/06/2026</p>
        <p className="text-sm font-medium text-slate-500">Đơn vị chủ trì: UBND Phường Hòa Xuân</p>
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-bold text-slate-600">Tiến độ tổng thể</span>
            <span className="font-sans text-lg font-extrabold text-[#0B2545]">72%</span>
          </div>
          <ProgressBar value={72} />
        </div>
        <div className="mt-4 grid grid-cols-4 gap-2">
          <Metric label="Phản ánh" value="18" />
          <Metric label="Đã xử lý" value="7" />
          <Metric label="Đang xử lý" value="5" />
          <Metric label="Chờ xử lý" value="6" />
        </div>
        <button
          onClick={onSelect}
          className="mt-4 h-9 w-full rounded-lg border border-slate-200 bg-white text-xs font-bold text-[#0F5BD8] transition hover:bg-blue-50"
        >
          Xem chi tiết chiến dịch
        </button>
      </div>
    </div>
  );
}

function BeforeAfterChart() {
  return (
    <div className="mt-4 grid grid-cols-3 gap-3">
      <div className="rounded-lg bg-rose-50 p-3">
        <p className="text-xs font-bold text-slate-500">Trước chiến dịch</p>
        <p className="mt-2 font-sans text-3xl font-extrabold text-[#0B2545]">38</p>
        <p className="text-xs font-medium text-slate-500">phản ánh/tháng</p>
        <TinyChart color="rose" />
      </div>
      <div className="flex flex-col items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
        <TrendingDown size={26} />
        <p className="mt-2 font-sans text-lg font-extrabold">81%</p>
        <p className="text-xs font-bold">Giảm phản ánh</p>
      </div>
      <div className="rounded-lg bg-emerald-50 p-3">
        <p className="text-xs font-bold text-slate-500">Sau chiến dịch</p>
        <p className="mt-2 font-sans text-3xl font-extrabold text-[#0B2545]">7</p>
        <p className="text-xs font-medium text-slate-500">phản ánh/tháng</p>
        <TinyChart color="emerald" />
      </div>
    </div>
  );
}

function TinyChart({ color }: { color: "rose" | "emerald" }) {
  const bars = color === "rose" ? [42, 62, 34, 48, 29, 54, 38, 45] : [36, 28, 22, 24, 18, 14, 12, 9];
  return (
    <div className="mt-4 flex h-12 items-end gap-1">
      {bars.map((bar, index) => (
        <span
          key={index}
          className={`w-full rounded-t ${color === "rose" ? "bg-rose-300" : "bg-emerald-300"}`}
          style={{ height: `${bar}%` }}
        />
      ))}
    </div>
  );
}

function ImpactStats() {
  const items = [
    [Users, "235", "Hộ dân hưởng lợi", "text-violet-700 bg-violet-50"],
    [Flag, "12", "Trường học", "text-orange-700 bg-orange-50"],
    [Target, "1", "Bệnh viện", "text-amber-700 bg-amber-50"],
    [MapPin, "3", "Tuyến xe buýt", "text-sky-700 bg-sky-50"],
  ] as const;
  return (
    <div className="mt-4">
      <div className="grid grid-cols-4 gap-3">
        {items.map(([Icon, value, label, tone]) => (
          <div key={label} className="text-center">
            <span className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full ${tone}`}>
              <Icon size={18} />
            </span>
            <p className="mt-2 font-sans text-xl font-extrabold text-[#0B2545]">{value}</p>
            <p className="text-[11px] font-bold text-slate-500">{label}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 rounded-lg bg-slate-50 p-4">
        <p className="text-sm font-bold text-slate-500">Ước tính người hưởng lợi</p>
        <p className="mt-1 font-sans text-3xl font-extrabold text-[#0B2545]">8.500</p>
        <p className="text-xs font-medium text-slate-400">Dữ liệu ước tính dựa trên khu vực tác động</p>
      </div>
    </div>
  );
}

function AiEvaluation() {
  return (
    <div className="mt-4 grid gap-4 md:grid-cols-[120px_1fr]">
      <div className="rounded-lg bg-slate-50 p-4 text-center">
        <p className="font-sans text-3xl font-extrabold text-[#0B2545]">4.6<span className="text-base text-slate-400">/5</span></p>
        <div className="mt-2 flex justify-center gap-0.5 text-amber-400">
          {[1, 2, 3, 4, 5].map((star) => <Star key={star} size={14} fill="currentColor" />)}
        </div>
        <Badge className="mt-3 bg-emerald-50 text-emerald-700">Rất hiệu quả</Badge>
      </div>
      <div>
        <p className="text-sm font-extrabold text-slate-800">AI nhận xét</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Chiến dịch đạt hiệu quả cao, giảm mạnh phản ánh lặp lại. Nên duy trì kiểm tra định kỳ và mở rộng sang các tuyến liền kề.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {["Mở rộng khu vực", "Tăng tần suất kiểm tra", "Tuyên truyền thêm"].map((item) => (
            <Badge key={item} className="bg-emerald-50 text-emerald-700">{item}</Badge>
          ))}
        </div>
      </div>
    </div>
  );
}

function CampaignTable({ onSelectCampaign }: { onSelectCampaign: (id: string) => void }) {
  return (
    <section className="rounded-xl border border-[#E4EAF2] bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
        <h2 className="text-base font-extrabold text-[#0B2545]">Danh sách chiến dịch</h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="h-9 w-60 rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm font-medium outline-none transition focus:border-[#0F5BD8]"
              placeholder="Tìm kiếm chiến dịch..."
            />
          </div>
          <button className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50">
            <Filter size={14} />
            Bộ lọc
          </button>
          <button className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50">
            <List size={14} />
            Sắp xếp
          </button>
          <button className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-[#0F5BD8]">
            <List size={15} />
          </button>
          <button className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500">
            <Grid2X2 size={15} />
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1120px] text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/70">
              {["Chiến dịch", "Lĩnh vực", "Đơn vị chủ trì", "Vai trò của tôi", "Thời gian", "Trạng thái", "Phản ánh", "Tiến độ", "Người tạo", "Thao tác"].map((head) => (
                <th key={head} className="px-4 py-3 text-[11px] font-extrabold uppercase tracking-wide text-slate-400">
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {campaigns.map((campaign) => (
              <tr key={campaign.id} className="transition hover:bg-slate-50/80">
                <td className="px-4 py-3">
                  <button onClick={() => onSelectCampaign(campaign.id)} className="text-left">
                    <p className="max-w-[260px] truncate text-sm font-extrabold text-[#0B2545]">{campaign.name}</p>
                    <p className="mt-1 max-w-[260px] truncate text-xs font-medium text-slate-500">{campaign.description}</p>
                  </button>
                </td>
                <td className="px-4 py-3"><Badge className={fieldTone[campaign.field] ?? "bg-slate-50 text-slate-600"}>{campaign.field}</Badge></td>
                <td className="px-4 py-3 text-sm font-bold text-slate-600">{campaign.hostUnit}</td>
                <td className="px-4 py-3"><Badge className={roleTone[campaign.role]}>{campaign.role}</Badge></td>
                <td className="px-4 py-3 text-xs font-medium text-slate-500">{campaign.time}</td>
                <td className="px-4 py-3"><Badge className={statusTone[campaign.status]}>{campaign.status}</Badge></td>
                <td className="px-4 py-3 font-sans text-sm font-extrabold text-slate-700">{campaign.reports}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <ProgressBar value={campaign.progress} />
                    <span className="font-sans text-xs font-bold text-slate-500">{campaign.progress}%</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm font-bold text-slate-600">{campaign.createdBy}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => onSelectCampaign(campaign.id)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-white">
                      <Eye size={15} />
                    </button>
                    <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-white">
                      <Pencil size={15} />
                    </button>
                    <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-white">
                      <MoreHorizontal size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CampaignRouteMap() {
  return (
    <div className="relative mt-4 h-[260px] overflow-hidden rounded-xl border border-slate-200 bg-[#e8f1f5]">
      <MapBackdrop />
      <div className="absolute left-[17%] top-[40%] h-1.5 w-[62%] rotate-[-8deg] rounded-full bg-[#0F5BD8]" />
      {[
        ["left-[18%] top-[38%]", "bg-emerald-500"],
        ["left-[36%] top-[34%]", "bg-[#0F5BD8]"],
        ["left-[55%] top-[31%]", "bg-orange-500"],
        ["left-[76%] top-[27%]", "bg-violet-500"],
      ].map(([pos, color]) => (
        <span key={pos} className={`absolute ${pos} h-5 w-5 rounded-full ${color} ring-4 ring-white shadow-md`} />
      ))}
      <div className="absolute left-4 bottom-4 rounded-lg bg-white/95 p-3 shadow-sm">
        <div className="flex flex-wrap gap-3 text-[11px] font-bold text-slate-600">
          <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-emerald-500" />Điểm tập kết</span>
          <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-[#0F5BD8]" />Khu vực xử lý</span>
          <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-orange-500" />Điểm liên quan</span>
        </div>
      </div>
    </div>
  );
}

function UnitCollaboration() {
  const units = [
    ["UBND Phường Hòa Xuân", "Đơn vị chủ trì", "Chủ trì", "bg-blue-50 text-blue-700"],
    ["UBND Phường Hòa Quý", "Hỗ trợ khu vực giáp ranh", "Phối hợp", "bg-emerald-50 text-emerald-700"],
    ["Đoàn Thanh niên", "Hỗ trợ truyền thông và lực lượng", "Hỗ trợ", "bg-violet-50 text-violet-700"],
  ];
  return (
    <div className="mt-4 space-y-3">
      {units.map(([name, desc, role, tone]) => (
        <div key={name} className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/70 p-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#0F5BD8] shadow-sm">
            <Handshake size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-extrabold text-slate-800">{name}</p>
            <p className="text-xs font-medium text-slate-500">{desc}</p>
          </div>
          <Badge className={tone}>{role}</Badge>
        </div>
      ))}
    </div>
  );
}

function TaskList() {
  const tasks = [
    ["Khảo sát điểm phản ánh trên tuyến Nguyễn Phước Lan", "Đã hoàn thành", "Cao"],
    ["Phân loại phản ánh theo cụm khu dân cư", "Đã hoàn thành", "Cao"],
    ["Tổ chức thu gom rác tồn đọng", "Đang làm", "Cao"],
    ["Tuyên truyền nhắc nhở hộ kinh doanh", "Đang làm", "Trung bình"],
    ["Nghiệm thu và cập nhật hình ảnh", "Chưa bắt đầu", "Thấp"],
  ];
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[660px]">
        <tbody className="divide-y divide-slate-100">
          {tasks.map(([task, status, priority]) => (
            <tr key={task}>
              <td className="py-3 pr-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={17} className={status === "Đã hoàn thành" ? "text-emerald-600" : "text-slate-300"} />
                  <span className="text-sm font-bold text-slate-700">{task}</span>
                </div>
              </td>
              <td className="px-3 py-3"><Badge className={status === "Đã hoàn thành" ? "bg-emerald-50 text-emerald-700" : status === "Đang làm" ? "bg-blue-50 text-blue-700" : "bg-slate-50 text-slate-500"}>{status}</Badge></td>
              <td className="px-3 py-3 text-xs font-bold text-slate-500">{priority}</td>
              <td className="py-3 text-right text-xs font-bold text-slate-400">30/06/2026</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RelatedReports() {
  const reports = [
    ["PA-2026-409", "Rác thải tồn đọng tại Nguyễn Phước Lan", "Đang xử lý"],
    ["PA-2026-398", "Mương thoát nước có mùi hôi", "Đã xử lý"],
    ["PA-2026-377", "Tập kết rác sai vị trí", "Đang xử lý"],
  ];
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[620px]">
        <tbody className="divide-y divide-slate-100">
          {reports.map(([code, title, status]) => (
            <tr key={code}>
              <td className="py-3 pr-3 font-sans text-xs font-extrabold text-[#0F5BD8]">{code}</td>
              <td className="px-3 py-3 text-sm font-bold text-slate-700">{title}</td>
              <td className="px-3 py-3"><Badge className={status === "Đã xử lý" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"}>{status}</Badge></td>
              <td className="py-3 text-right">
                <button className="text-xs font-bold text-[#0F5BD8] hover:underline">Xem</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AttachmentGrid() {
  return (
    <div className="mt-4 grid grid-cols-4 gap-3">
      {["PDF", "Bản đồ", "Hiện trạng", "Nghiệm thu"].map((item, index) => (
        <div key={item} className={`flex aspect-square items-center justify-center rounded-lg border border-slate-100 text-xs font-extrabold ${
          index === 0 ? "bg-rose-50 text-rose-700" : "bg-slate-50 text-slate-600"
        }`}>
          {item}
        </div>
      ))}
      <button className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white text-slate-500">
        <Plus size={22} />
      </button>
    </div>
  );
}

function ActivityLog() {
  const logs = [
    ["09:30", "Cập nhật tiến độ lên 72%"],
    ["08:45", "Gắn thêm 2 phản ánh liên quan"],
    ["Hôm qua", "Hoàn thành vệ sinh đoạn đường số 3"],
  ];
  return (
    <div className="mt-4 space-y-3">
      {logs.map(([time, text]) => (
        <div key={text} className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
          <span className="font-sans text-xs font-extrabold text-slate-400">{time}</span>
          <span className="text-sm font-bold text-slate-700">{text}</span>
        </div>
      ))}
    </div>
  );
}

function DetailKpi({
  label,
  value,
  progress,
  icon: Icon,
}: {
  label: string;
  value: string;
  progress: number;
  icon: typeof Flag;
}) {
  return (
    <div className="rounded-xl border border-[#E4EAF2] bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-[#0F5BD8]">
          <Icon size={18} />
        </span>
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wide text-slate-400">{label}</p>
          <p className="font-sans text-xl font-extrabold text-[#0B2545]">{value}</p>
        </div>
      </div>
      <div className="mt-4">
        <ProgressBar value={progress} />
      </div>
    </div>
  );
}

function MetaChip({ icon: Icon, label }: { icon: typeof Flag; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">
      <Icon size={14} className="text-slate-400" />
      {label}
    </span>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-sans text-lg font-extrabold text-[#0B2545]">{value}</p>
      <p className="text-[11px] font-bold text-slate-500">{label}</p>
    </div>
  );
}

function Badge({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-extrabold ${className}`}>
      {children}
    </span>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div className="h-full rounded-full bg-[#0F5BD8]" style={{ width: `${value}%` }} />
    </div>
  );
}
