import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense, useState, useRef } from "react";
import { useI18n } from "@/lib/i18n";
import {
  ChevronRight,
  MapPin,
  Users,
  Calendar,
  FileText,
  Flag,
  AlertTriangle,
  CheckCircle,
  Clock,
  Upload,
  X,
  Plus,
  Minus,
  Search,
  Filter,
  Globe,
  Shield,
  Eye,
  Megaphone,
  Camera,
  Leaf,
  Zap,
  Truck,
  Package,
  Heart,
  TrendingUp,
  BarChart3,
  Star,
  Building2,
  Phone,
  Mail,
  ChevronDown,
  Save,
  Send,
  Maximize2,
  Crosshair,
  Layers,
  Activity,
  UserCheck,
  Flame,
  Construction,
  Car,
  ShieldCheck,
  TreePine,
  Trash2,
  Wrench,
  CircleDot,
  PlayCircle,
  BookOpen,
  ClipboardList,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
} from "recharts";

const CampaignMap = lazy(() =>
  import("@/components/site/CampaignMap").then((m) => ({ default: m.CampaignMap })),
);

export const Route = createFileRoute("/campaigns/create")({
  head: () => ({
    meta: [
      { title: "Tạo chiến dịch cộng đồng - Đà Nẵng Kết Nối" },
      {
        name: "description",
        content:
          "Tạo chiến dịch cộng đồng được chính phủ xác minh dựa trên các phản ánh của công dân để huy động tình nguyện viên và tổ chức địa phương.",
      },
    ],
  }),
  component: CreateCampaignPage,
});

// ─── TYPES ───────────────────────────────────────────────────────────────────
interface ReportRow {
  id: string;
  image: string;
  title: string;
  category: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "pending" | "processing" | "resolved";
  location: string;
  date: string;
  unit: string;
}

interface ActivityRow {
  date: string;
  time: string;
  activity: string;
  location: string;
  participants: number;
}

interface TaskCard {
  id: string;
  name: string;
  priority: "low" | "medium" | "high";
  team: string;
  duration: string;
  volunteers: number;
  column: "todo" | "inProgress" | "completed";
}

// ─── STATIC DATA ─────────────────────────────────────────────────────────────
const SAMPLE_REPORTS: ReportRow[] = [
  {
    id: "RPT-2025-0421",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=60&h=60&fit=crop",
    title: "Đổ rác thải trái phép khu vực mương Trần Nam Trung",
    category: "Môi trường",
    priority: "critical",
    status: "processing",
    location: "Phường Hòa Xuân",
    date: "12/06/2025",
    unit: "UBND Phường",
  },
  {
    id: "RPT-2025-0398",
    image: "https://images.unsplash.com/photo-1504707748692-419802cf3d26?w=60&h=60&fit=crop",
    title: "Cống thoát nước nghẹt kéo dài, ngập úng cục bộ",
    category: "Hạ tầng đô thị",
    priority: "high",
    status: "processing",
    location: "Phường Hòa Xuân",
    date: "10/06/2025",
    unit: "Phòng QLĐT",
  },
  {
    id: "RPT-2025-0387",
    image: "https://images.unsplash.com/photo-1529400971008-f566de0e6dfc?w=60&h=60&fit=crop",
    title: "Quảng cáo trái phép che khuất biển báo giao thông",
    category: "Hạ tầng đô thị",
    priority: "medium",
    status: "pending",
    location: "Phường Hòa Xuân",
    date: "09/06/2025",
    unit: "Phòng TNMT",
  },
  {
    id: "RPT-2025-0365",
    image: "https://images.unsplash.com/photo-1571867424488-4565932edb41?w=60&h=60&fit=crop",
    title: "Cây xanh mục rỗng, nguy cơ đổ ngã cao",
    category: "Môi trường",
    priority: "high",
    status: "pending",
    location: "Phường Hòa Xuân",
    date: "07/06/2025",
    unit: "Phòng QLĐT",
  },
  {
    id: "RPT-2025-0341",
    image: "https://images.unsplash.com/photo-1487017159836-4e23ece2e4cf?w=60&h=60&fit=crop",
    title: "Ghế đá công viên hư hỏng nặng, thiếu an toàn",
    category: "Hạ tầng đô thị",
    priority: "medium",
    status: "pending",
    location: "Phường Hòa Xuân",
    date: "05/06/2025",
    unit: "UBND Phường",
  },
  {
    id: "RPT-2025-0318",
    image: "https://images.unsplash.com/photo-1574482620826-7b8b7e6a1f57?w=60&h=60&fit=crop",
    title: "Kênh sinh thái ô nhiễm nặng, mùi hôi bốc lên",
    category: "Môi trường",
    priority: "critical",
    status: "processing",
    location: "Phường Hòa Xuân",
    date: "03/06/2025",
    unit: "Phòng TNMT",
  },
];

const SAMPLE_ACTIVITIES: ActivityRow[] = [
  {
    date: "05/07/2025",
    time: "07:00 – 11:00",
    activity: "Dọn dẹp vệ sinh môi trường khu vực mương số 1",
    location: "Điểm tập kết - Cổng UBND Phường",
    participants: 60,
  },
  {
    date: "06/07/2025",
    time: "07:00 – 12:00",
    activity: "Nạo vét cống thoát nước và khai thông mương",
    location: "Đường Trần Nam Trung",
    participants: 40,
  },
  {
    date: "07/07/2025",
    time: "08:00 – 11:00",
    activity: "Phát quang cây bụi và tỉa cành cây nguy hiểm",
    location: "Công viên sinh thái Hòa Xuân",
    participants: 35,
  },
  {
    date: "08/07/2025",
    time: "14:00 – 17:00",
    activity: "Tuyên truyền nhận thức bảo vệ môi trường",
    location: "Nhà văn hóa Phường Hòa Xuân",
    participants: 120,
  },
  {
    date: "09/07/2025",
    time: "07:00 – 11:00",
    activity: "Sơn sửa công trình công cộng, ghế đá, bảng hiệu",
    location: "Dọc trục đường Hòa Xuân",
    participants: 25,
  },
];

const SAMPLE_TASKS: TaskCard[] = [
  {
    id: "t1",
    name: "Thu gom rác thải khu vực mương",
    priority: "high",
    team: "Đội TNV Tổ 1",
    duration: "2 ngày",
    volunteers: 20,
    column: "todo",
  },
  {
    id: "t2",
    name: "Nạo vét, khai thông cống thoát nước",
    priority: "high",
    team: "Đội công nhân QLĐT",
    duration: "3 ngày",
    volunteers: 15,
    column: "todo",
  },
  {
    id: "t3",
    name: "Tháo gỡ quảng cáo trái phép",
    priority: "medium",
    team: "Đội tuần tra phường",
    duration: "1 ngày",
    volunteers: 8,
    column: "inProgress",
  },
  {
    id: "t4",
    name: "Tỉa cây xanh nguy hiểm",
    priority: "high",
    team: "Đội cây xanh đô thị",
    duration: "1 ngày",
    volunteers: 10,
    column: "inProgress",
  },
  {
    id: "t5",
    name: "Sửa chữa công trình công cộng",
    priority: "medium",
    team: "Đội sửa chữa phường",
    duration: "2 ngày",
    volunteers: 12,
    column: "inProgress",
  },
  {
    id: "t6",
    name: "Sơn tường và kẻ vạch đường",
    priority: "low",
    team: "Đội TNV Tổ 2",
    duration: "1 ngày",
    volunteers: 8,
    column: "completed",
  },
];

const VOLUNTEER_PIE_DATA = [
  { name: "Đoàn Thanh niên", value: 35, color: "#1E5EFF" },
  { name: "Người dân", value: 30, color: "#22C55E" },
  { name: "Tổ dân phố", value: 15, color: "#F59E0B" },
  { name: "Hội phụ nữ", value: 10, color: "#A78BFA" },
  { name: "CAND hỗ trợ", value: 10, color: "#EF4444" },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const priorityConfig = {
  low: { label: "Thấp", color: "#22C55E", bg: "#F0FDF4", border: "#BBF7D0" },
  medium: { label: "Trung bình", color: "#F59E0B", bg: "#FFFBEB", border: "#FDE68A" },
  high: { label: "Cao", color: "#EF4444", bg: "#FEF2F2", border: "#FECACA" },
  critical: { label: "Khẩn cấp", color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE" },
};

const statusConfig = {
  pending: { label: "Chờ xử lý", color: "#F59E0B", bg: "#FFFBEB" },
  processing: { label: "Đang xử lý", color: "#1E5EFF", bg: "#EFF6FF" },
  resolved: { label: "Đã giải quyết", color: "#22C55E", bg: "#F0FDF4" },
};

function SectionHeader({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle?: string }) {
  return (
    <div className="flex items-start gap-3 border-b border-[#E5E7EB] pb-5 mb-6">
      <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center flex-shrink-0">
        <Icon size={20} className="text-[#1E5EFF]" />
      </div>
      <div>
        <h2 className="text-[#0B2545] font-bold text-lg leading-tight">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-semibold text-[#1E293B] mb-1.5">
      {children}
      {required && <span className="text-[#EF4444] ml-1">*</span>}
    </label>
  );
}

function FormInput({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-4 h-11 rounded-[14px] border border-[#E5E7EB] text-sm text-[#1E293B] bg-white focus:outline-none focus:border-[#1E5EFF] focus:ring-2 focus:ring-[#1E5EFF]/10 transition-all placeholder:text-slate-400"
    />
  );
}

function FormSelect({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 h-11 rounded-[14px] border border-[#E5E7EB] text-sm text-[#1E293B] bg-white focus:outline-none focus:border-[#1E5EFF] focus:ring-2 focus:ring-[#1E5EFF]/10 transition-all appearance-none pr-10"
      >
        {children}
      </select>
      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
    </div>
  );
}

function PriorityBadge({ level }: { level: keyof typeof priorityConfig }) {
  const cfg = priorityConfig[level];
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}
    >
      <CircleDot size={10} />
      {cfg.label}
    </span>
  );
}

function StatusBadge({ status }: { status: keyof typeof statusConfig }) {
  const cfg = statusConfig[status];
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ color: cfg.color, background: cfg.bg }}
    >
      {cfg.label}
    </span>
  );
}

function ToggleSwitch({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-[#334155]">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${value ? "bg-[#1E5EFF]" : "bg-slate-200"}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${value ? "translate-x-5" : "translate-x-0"}`}
        />
      </button>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
function CreateCampaignPage() {
  const { locale } = useI18n();
  const isVi = locale === "vi";

  // ── Form State ──
  const [campaignName, setCampaignName] = useState("Chiến dịch làm sạch kênh sinh thái Hòa Xuân");
  const [campaignType, setCampaignType] = useState("environment");
  const [priority, setPriority] = useState("high");
  const [description, setDescription] = useState(
    "Chiến dịch cộng đồng nhằm dọn dẹp rác thải, nạo vét cống và phục hồi cảnh quan kênh sinh thái tại phường Hòa Xuân, quận Cẩm Lệ, Đà Nẵng. Chiến dịch hướng đến giải quyết 18 phản ánh của người dân về ô nhiễm môi trường nghiêm trọng trong khu vực.",
  );
  const [objective, setObjective] = useState(
    "Thu gom và xử lý rác thải tồn đọng, nạo vét hệ thống thoát nước, tỉa cây nguy hiểm và nâng cao nhận thức cộng đồng về bảo vệ môi trường.",
  );
  const [expectedOutcome, setExpectedOutcome] = useState(
    "Giải quyết 100% phản ánh được tổng hợp. Cải thiện chỉ số vệ sinh môi trường phường tăng 30%. Thu hút 80+ tình nguyện viên tham gia.",
  );
  const [communityBenefit, setCommunityBenefit] = useState(
    "1.245 hộ dân được hưởng lợi trực tiếp. Cải thiện chất lượng sống, giảm ô nhiễm và phòng chống dịch bệnh liên quan đến môi trường nước.",
  );

  const [startDate, setStartDate] = useState("2025-07-05");
  const [endDate, setEndDate] = useState("2025-07-20");
  const [regDeadline, setRegDeadline] = useState("2025-06-30");

  const [targetVolunteers, setTargetVolunteers] = useState(80);
  const [minVolunteers, setMinVolunteers] = useState(50);
  const [maxVolunteers, setMaxVolunteers] = useState(120);

  const [selectedReports, setSelectedReports] = useState<string[]>(
    SAMPLE_REPORTS.map((r) => r.id),
  );
  const [reportSearch, setReportSearch] = useState("");

  const [tasks] = useState<TaskCard[]>(SAMPLE_TASKS);

  // Risk
  const [riskLevel, setRiskLevel] = useState("medium");

  // Visibility
  const [isPublic, setIsPublic] = useState(true);
  const [isGovVerified, setIsGovVerified] = useState(true);
  const [volunteerReg, setVolunteerReg] = useState(true);
  const [showHomepage, setShowHomepage] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [allowComments, setAllowComments] = useState(true);
  const [allowMedia, setAllowMedia] = useState(true);

  // Cover image
  const [coverPreview, setCoverPreview] = useState(
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&h=480&q=80",
  );
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleCoverUpload = (files: FileList | null) => {
    if (!files || !files[0]) return;
    const file = files[0];
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file ảnh.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) setCoverPreview(e.target.result as string);
    };
    reader.readAsDataURL(file);
  };

  const toggleReport = (id: string) => {
    setSelectedReports((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id],
    );
  };

  const filteredReports = SAMPLE_REPORTS.filter(
    (r) =>
      r.title.toLowerCase().includes(reportSearch.toLowerCase()) ||
      r.id.toLowerCase().includes(reportSearch.toLowerCase()),
  );

  const handleSaveDraft = () => {
    toast.success(
      isVi ? "Đã lưu bản nháp chiến dịch thành công!" : "Campaign draft saved successfully!",
    );
  };

  const handlePublish = () => {
    if (!campaignName.trim()) {
      toast.error("Vui lòng nhập tên chiến dịch.");
      return;
    }
    if (selectedReports.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 phản ánh liên quan.");
      return;
    }
    toast.success(
      isVi
        ? "🎉 Chiến dịch đã được tạo và công bố thành công!"
        : "🎉 Campaign created and published successfully!",
    );
  };

  const taskColumns = {
    todo: tasks.filter((t) => t.column === "todo"),
    inProgress: tasks.filter((t) => t.column === "inProgress"),
    completed: tasks.filter((t) => t.column === "completed"),
  };

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      {/* ── BREADCRUMB ─────────────────────────────────────────────────── */}
      <div className="border-b border-[#E5E7EB] bg-white">
        <div style={{ maxWidth: 1320 }} className="mx-auto px-6 py-3 flex items-center gap-2 text-sm">
          <Link to="/" className="text-slate-500 hover:text-[#1E5EFF] transition-colors">
            Dashboard
          </Link>
          <ChevronRight size={14} className="text-slate-300" />
          <a href="/my-reports" className="text-slate-500 hover:text-[#1E5EFF] transition-colors">
            Phản ánh
          </a>
          <ChevronRight size={14} className="text-slate-300" />
          <span className="text-slate-500">Chi tiết phản ánh</span>
          <ChevronRight size={14} className="text-slate-300" />
          <span className="text-[#1E5EFF] font-semibold">Tạo chiến dịch</span>
        </div>
      </div>

      {/* ── PAGE HEADER ────────────────────────────────────────────────── */}
      <div style={{ background: "linear-gradient(135deg, #1E5EFF 0%, #0B2545 100%)" }}>
        <div style={{ maxWidth: 1320 }} className="mx-auto px-6 py-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <Megaphone size={18} className="text-white" />
                </div>
                <span className="text-blue-200 text-sm font-medium">Hệ thống quản lý chiến dịch cộng đồng</span>
              </div>
              <h1 className="text-white font-black text-4xl mb-2">Tạo Chiến Dịch Cộng Đồng</h1>
              <p className="text-blue-200 text-base max-w-2xl">
                Tạo chiến dịch được chính quyền xác nhận từ các phản ánh của công dân, huy động tình nguyện viên và tổ chức địa phương cùng giải quyết vấn đề đô thị.
              </p>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <button
                onClick={handleSaveDraft}
                className="flex items-center gap-2 px-5 h-11 rounded-[14px] bg-white/15 border border-white/30 text-white text-sm font-semibold hover:bg-white/25 transition-all"
              >
                <Save size={16} />
                Lưu nháp
              </button>
              <button
                onClick={handlePublish}
                className="flex items-center gap-2 px-5 h-11 rounded-[14px] bg-white text-[#1E5EFF] text-sm font-bold hover:bg-blue-50 shadow-lg transition-all"
              >
                <Send size={16} />
                Công bố chiến dịch
              </button>
            </div>
          </div>

          {/* Step indicator */}
          <div className="mt-8 flex items-center gap-0">
            {[
              "Thông tin cơ bản",
              "Phản ánh liên quan",
              "Bản đồ & Địa điểm",
              "Lịch trình",
              "Tình nguyện viên",
              "Tài nguyên",
              "Công việc",
            ].map((step, i) => (
              <div key={i} className="flex items-center">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${i === 0 ? "bg-white text-[#1E5EFF]" : "bg-white/15 text-white/80"}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-[#1E5EFF] text-white" : "bg-white/30 text-white"}`}>
                    {i + 1}
                  </span>
                  {step}
                </div>
                {i < 6 && <div className="w-4 h-0.5 bg-white/20" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── MAIN LAYOUT ────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1320 }} className="mx-auto px-6 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-8 items-start">

          {/* ══════════════════════════════════════════════════════════════
              LEFT COLUMN
          ══════════════════════════════════════════════════════════════ */}
          <div className="space-y-8">

            {/* ─── SECTION 1: BASIC INFORMATION ─────────────────────────── */}
            <section className="bg-white rounded-[20px] border border-[#E5E7EB] p-8 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
              <SectionHeader
                icon={FileText}
                title="Thông tin cơ bản chiến dịch"
                subtitle="Xác định tên, loại hình và mục tiêu tổng quát của chiến dịch"
              />

              <div className="space-y-5">
                {/* Campaign Name */}
                <div>
                  <FieldLabel required>Tên chiến dịch</FieldLabel>
                  <FormInput
                    value={campaignName}
                    onChange={setCampaignName}
                    placeholder="VD: Chiến dịch làm sạch kênh sinh thái Hòa Xuân"
                  />
                </div>

                {/* Type + Priority row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FieldLabel required>Loại chiến dịch</FieldLabel>
                    <FormSelect value={campaignType} onChange={setCampaignType}>
                      <option value="environment">🌿 Môi trường</option>
                      <option value="infrastructure">🏗️ Hạ tầng đô thị</option>
                      <option value="traffic">🚦 Giao thông</option>
                      <option value="security">🛡️ An ninh công cộng</option>
                      <option value="construction">⚒️ Xây dựng</option>
                      <option value="fire_safety">🔥 Phòng cháy chữa cháy</option>
                    </FormSelect>
                  </div>
                  <div>
                    <FieldLabel required>Mức độ ưu tiên</FieldLabel>
                    <FormSelect value={priority} onChange={setPriority}>
                      <option value="low">🟢 Thấp</option>
                      <option value="medium">🟡 Trung bình</option>
                      <option value="high">🔴 Cao</option>
                      <option value="critical">🟣 Khẩn cấp</option>
                    </FormSelect>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <FieldLabel required>Mô tả chiến dịch</FieldLabel>
                  <div className="rounded-[14px] border border-[#E5E7EB] overflow-hidden focus-within:border-[#1E5EFF] focus-within:ring-2 focus-within:ring-[#1E5EFF]/10 transition-all">
                    {/* Toolbar */}
                    <div className="flex items-center gap-1 px-3 py-2 border-b border-[#E5E7EB] bg-slate-50">
                      {["B", "I", "U"].map((f) => (
                        <button key={f} className="w-7 h-7 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded transition-colors">
                          {f}
                        </button>
                      ))}
                      <div className="w-px h-4 bg-slate-200 mx-1" />
                      <button className="w-7 h-7 text-xs text-slate-600 hover:bg-slate-200 rounded transition-colors">H1</button>
                      <button className="w-7 h-7 text-xs text-slate-600 hover:bg-slate-200 rounded transition-colors">H2</button>
                      <div className="w-px h-4 bg-slate-200 mx-1" />
                      <button className="w-7 h-7 text-xs text-slate-600 hover:bg-slate-200 rounded transition-colors">≡</button>
                      <button className="w-7 h-7 text-xs text-slate-600 hover:bg-slate-200 rounded transition-colors">🔗</button>
                    </div>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={5}
                      className="w-full px-4 py-3 text-sm text-[#1E293B] outline-none resize-none bg-white"
                      placeholder="Mô tả chi tiết nội dung, phạm vi và ý nghĩa của chiến dịch..."
                    />
                  </div>
                </div>

                {/* Objective */}
                <div>
                  <FieldLabel required>Mục tiêu chiến dịch</FieldLabel>
                  <textarea
                    value={objective}
                    onChange={(e) => setObjective(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 rounded-[14px] border border-[#E5E7EB] text-sm text-[#1E293B] focus:outline-none focus:border-[#1E5EFF] focus:ring-2 focus:ring-[#1E5EFF]/10 transition-all resize-none"
                    placeholder="Các mục tiêu cụ thể cần đạt được..."
                  />
                </div>

                {/* Expected + Benefit */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FieldLabel>Kết quả mong đợi</FieldLabel>
                    <textarea
                      value={expectedOutcome}
                      onChange={(e) => setExpectedOutcome(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 rounded-[14px] border border-[#E5E7EB] text-sm text-[#1E293B] focus:outline-none focus:border-[#1E5EFF] focus:ring-2 focus:ring-[#1E5EFF]/10 transition-all resize-none"
                    />
                  </div>
                  <div>
                    <FieldLabel>Lợi ích cộng đồng</FieldLabel>
                    <textarea
                      value={communityBenefit}
                      onChange={(e) => setCommunityBenefit(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 rounded-[14px] border border-[#E5E7EB] text-sm text-[#1E293B] focus:outline-none focus:border-[#1E5EFF] focus:ring-2 focus:ring-[#1E5EFF]/10 transition-all resize-none"
                    />
                  </div>
                </div>

                {/* Cover Image Upload */}
                <div>
                  <FieldLabel>Ảnh bìa chiến dịch</FieldLabel>
                  <div className="relative rounded-[14px] overflow-hidden border-2 border-dashed border-[#E5E7EB] bg-slate-50 hover:border-[#1E5EFF] transition-all group">
                    {coverPreview ? (
                      <div className="relative">
                        <img
                          src={coverPreview}
                          alt="Campaign cover"
                          className="w-full h-48 object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                          <button
                            onClick={() => coverInputRef.current?.click()}
                            className="flex items-center gap-2 px-4 h-9 bg-white text-sm font-semibold text-[#1E293B] rounded-lg hover:bg-slate-100 transition-colors"
                          >
                            <Camera size={15} /> Thay ảnh
                          </button>
                          <button
                            onClick={() => setCoverPreview("")}
                            className="flex items-center gap-2 px-4 h-9 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 transition-colors"
                          >
                            <X size={15} /> Xóa
                          </button>
                        </div>
                        <div className="absolute top-3 right-3 bg-[#22C55E] text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                          <CheckCircle size={11} /> Ảnh đã tải
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => coverInputRef.current?.click()}
                        className="w-full h-48 flex flex-col items-center justify-center gap-3 text-slate-400 hover:text-[#1E5EFF] transition-colors"
                      >
                        <Upload size={36} />
                        <div className="text-center">
                          <p className="font-semibold text-sm">Kéo thả hoặc click để tải ảnh</p>
                          <p className="text-xs mt-1">PNG, JPG, WEBP · Tối đa 10MB · Tỷ lệ 16:9</p>
                        </div>
                      </button>
                    )}
                    <input
                      ref={coverInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleCoverUpload(e.target.files)}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* ─── SECTION 2: RELATED CITIZEN REPORTS ──────────────────── */}
            <section className="bg-white rounded-[20px] border border-[#E5E7EB] p-8 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
              <SectionHeader
                icon={ClipboardList}
                title="Phản ánh kích hoạt chiến dịch"
                subtitle="Chọn các phản ánh của công dân làm cơ sở để tạo chiến dịch này"
              />

              {/* Summary bar */}
              <div className="grid grid-cols-3 gap-4 mb-5">
                {[
                  { label: "Phản ánh đã chọn", value: `${selectedReports.length} phản ánh`, color: "#1E5EFF", bg: "#EFF6FF", icon: ClipboardList },
                  { label: "Người dân bị ảnh hưởng", value: "1.245 người", color: "#22C55E", bg: "#F0FDF4", icon: Users },
                  { label: "Địa bàn bị ảnh hưởng", value: "Phường Hòa Xuân", color: "#F59E0B", bg: "#FFFBEB", icon: MapPin },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center gap-3 px-4 py-3 rounded-[14px]" style={{ background: stat.bg }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: stat.color + "20" }}>
                      <stat.icon size={18} style={{ color: stat.color }} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">{stat.label}</p>
                      <p className="text-sm font-bold" style={{ color: stat.color }}>{stat.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Search + Filter bar */}
              <div className="flex gap-3 mb-4">
                <div className="relative flex-1">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={reportSearch}
                    onChange={(e) => setReportSearch(e.target.value)}
                    placeholder="Tìm kiếm phản ánh theo ID hoặc tiêu đề..."
                    className="w-full pl-9 pr-4 h-10 rounded-[12px] border border-[#E5E7EB] text-sm text-[#1E293B] focus:outline-none focus:border-[#1E5EFF] bg-white"
                  />
                </div>
                <button className="flex items-center gap-2 px-4 h-10 rounded-[12px] border border-[#E5E7EB] text-sm text-slate-600 bg-white hover:border-[#1E5EFF] hover:text-[#1E5EFF] transition-all">
                  <Filter size={14} /> Lọc
                </button>
                <button className="flex items-center gap-2 px-4 h-10 rounded-[12px] bg-[#1E5EFF] text-sm text-white font-semibold hover:bg-[#1E5EFF]/90 transition-all">
                  <Plus size={14} /> Thêm phản ánh
                </button>
              </div>

              {/* Reports Table */}
              <div className="rounded-[14px] border border-[#E5E7EB] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-[#E5E7EB]">
                        <th className="px-4 py-3 text-left w-10">
                          <input
                            type="checkbox"
                            checked={selectedReports.length === SAMPLE_REPORTS.length}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedReports(SAMPLE_REPORTS.map((r) => r.id));
                              else setSelectedReports([]);
                            }}
                            className="rounded"
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Mã phản ánh</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tiêu đề vấn đề</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Danh mục</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Ưu tiên</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Trạng thái</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Ngày</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReports.map((report, i) => {
                        const isSelected = selectedReports.includes(report.id);
                        return (
                          <tr
                            key={report.id}
                            className={`border-b border-[#E5E7EB] hover:bg-slate-50 transition-colors cursor-pointer ${isSelected ? "bg-blue-50/40" : ""} ${i === filteredReports.length - 1 ? "border-none" : ""}`}
                            onClick={() => toggleReport(report.id)}
                          >
                            <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleReport(report.id)}
                                className="rounded"
                              />
                            </td>
                            <td className="px-4 py-3 font-mono text-xs text-slate-500">{report.id}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <img src={report.image} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                                <span className="font-medium text-[#1E293B] text-xs leading-snug line-clamp-2 max-w-[200px]">{report.title}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs text-slate-600">{report.category}</span>
                            </td>
                            <td className="px-4 py-3">
                              <PriorityBadge level={report.priority} />
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge status={report.status} />
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-500">{report.date}</td>
                            <td className="px-4 py-3">
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleReport(report.id); }}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                              >
                                <Minus size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* ─── SECTION 3: MAP ───────────────────────────────────────── */}
            <section className="bg-white rounded-[20px] border border-[#E5E7EB] p-8 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
              <SectionHeader
                icon={MapPin}
                title="Bản đồ khu vực chiến dịch"
                subtitle="Xác định phạm vi địa lý, điểm tập kết và vị trí phản ánh liên quan"
              />

              {/* Map action buttons */}
              <div className="flex flex-wrap gap-2 mb-4">
                {[
                  { icon: Maximize2, label: "Toàn màn hình" },
                  { icon: Crosshair, label: "Vẽ vùng chiến dịch" },
                  { icon: MapPin, label: "Điểm tập kết" },
                  { icon: Layers, label: "Tự tạo vùng" },
                  { icon: Search, label: "Tìm kiếm địa điểm" },
                ].map((btn) => (
                  <button
                    key={btn.label}
                    className="flex items-center gap-1.5 px-3 h-9 rounded-[10px] border border-[#E5E7EB] text-xs font-semibold text-slate-600 bg-white hover:border-[#1E5EFF] hover:text-[#1E5EFF] transition-all"
                  >
                    <btn.icon size={14} />
                    {btn.label}
                  </button>
                ))}
              </div>

              {/* Map filters */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-xs font-semibold text-slate-500 self-center mr-1">Bộ lọc:</span>
                {[
                  { icon: Leaf, label: "Môi trường", color: "#22C55E" },
                  { icon: Building2, label: "Hạ tầng", color: "#1E5EFF" },
                  { icon: Car, label: "Giao thông", color: "#F59E0B" },
                  { icon: ShieldCheck, label: "An ninh", color: "#8B5CF6" },
                  { icon: Construction, label: "Xây dựng", color: "#EF4444" },
                  { icon: Flame, label: "PCCC", color: "#F97316" },
                ].map((f) => (
                  <button
                    key={f.label}
                    className="flex items-center gap-1.5 px-2.5 h-7 rounded-full border text-xs font-medium bg-white hover:opacity-80 transition-all"
                    style={{ borderColor: f.color + "40", color: f.color }}
                  >
                    <f.icon size={11} />
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Map */}
              <div className="rounded-[14px] overflow-hidden border border-[#E5E7EB]" style={{ height: 520 }}>
                <Suspense
                  fallback={
                    <div className="h-full flex flex-col items-center justify-center gap-3 bg-slate-50">
                      <div className="w-10 h-10 border-2 border-[#1E5EFF] border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm text-slate-500">Đang tải bản đồ tương tác...</p>
                    </div>
                  }
                >
                  <CampaignMap />
                </Suspense>
              </div>

              {/* Legend */}
              <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-600">
                {[
                  { color: "#EF4444", label: "Điểm phản ánh" },
                  { color: "#1E5EFF", label: "Vùng chiến dịch" },
                  { color: "#22C55E", label: "Điểm tập kết" },
                  { color: "#F59E0B", label: "Điểm phối hợp" },
                  { color: "#8B5CF6", label: "Điểm nóng" },
                ].map((l) => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full" style={{ background: l.color }} />
                    <span>{l.label}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* ─── SECTION 4: SCHEDULE ──────────────────────────────────── */}
            <section className="bg-white rounded-[20px] border border-[#E5E7EB] p-8 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
              <SectionHeader
                icon={Calendar}
                title="Lịch trình chiến dịch"
                subtitle="Thiết lập thời gian và lịch hoạt động cụ thể"
              />

              {/* Date fields */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div>
                  <FieldLabel required>Ngày bắt đầu</FieldLabel>
                  <FormInput value={startDate} onChange={setStartDate} type="date" />
                </div>
                <div>
                  <FieldLabel required>Ngày kết thúc</FieldLabel>
                  <FormInput value={endDate} onChange={setEndDate} type="date" />
                </div>
                <div>
                  <FieldLabel>Hạn đăng ký TNV</FieldLabel>
                  <FormInput value={regDeadline} onChange={setRegDeadline} type="date" />
                </div>
              </div>

              {/* Duration summary */}
              <div className="flex gap-4 mb-6">
                {[
                  { label: "Thời gian chiến dịch", value: "15 ngày", icon: Clock },
                  { label: "Ngày làm việc ước tính", value: "10 ngày", icon: Activity },
                  { label: "Thời gian còn lại đến khai mạc", value: "19 ngày", icon: Flag },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-3 px-4 py-3 rounded-[14px] bg-slate-50 border border-[#E5E7EB] flex-1">
                    <s.icon size={18} className="text-[#1E5EFF] flex-shrink-0" />
                    <div>
                      <p className="text-xs text-slate-500">{s.label}</p>
                      <p className="text-sm font-bold text-[#0B2545]">{s.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Activity Table */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-[#0B2545]">Lịch hoạt động chi tiết</h3>
                  <button className="flex items-center gap-1.5 px-3 h-8 rounded-[10px] bg-[#EFF6FF] text-[#1E5EFF] text-xs font-semibold hover:bg-[#1E5EFF] hover:text-white transition-all">
                    <Plus size={13} /> Thêm hoạt động
                  </button>
                </div>
                <div className="rounded-[14px] border border-[#E5E7EB] overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-[#E5E7EB]">
                        {["Ngày", "Giờ", "Hoạt động", "Địa điểm", "Số tham gia", ""].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {SAMPLE_ACTIVITIES.map((act, i) => (
                        <tr key={i} className={`border-b border-[#E5E7EB] hover:bg-slate-50 transition-colors ${i === SAMPLE_ACTIVITIES.length - 1 ? "border-none" : ""}`}>
                          <td className="px-4 py-3 text-xs font-semibold text-[#1E5EFF]">{act.date}</td>
                          <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{act.time}</td>
                          <td className="px-4 py-3 text-xs font-medium text-[#1E293B]">{act.activity}</td>
                          <td className="px-4 py-3 text-xs text-slate-500">{act.location}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#1E5EFF]">
                              <Users size={12} /> {act.participants}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button className="w-6 h-6 text-slate-300 hover:text-red-400 transition-colors">
                              <X size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* ─── SECTION 5: VOLUNTEER PLANNING ────────────────────────── */}
            <section className="bg-white rounded-[20px] border border-[#E5E7EB] p-8 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
              <SectionHeader
                icon={Users}
                title="Kế hoạch tình nguyện viên"
                subtitle="Xác định chỉ tiêu và cơ cấu tổ chức lực lượng tham gia"
              />

              {/* Volunteer count sliders */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { label: "Chỉ tiêu TNV", val: targetVolunteers, set: setTargetVolunteers, color: "#1E5EFF" },
                  { label: "Tối thiểu", val: minVolunteers, set: setMinVolunteers, color: "#22C55E" },
                  { label: "Tối đa", val: maxVolunteers, set: setMaxVolunteers, color: "#F59E0B" },
                ].map((v) => (
                  <div key={v.label} className="space-y-2">
                    <FieldLabel>{v.label}</FieldLabel>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => v.set(Math.max(0, v.val - 5))}
                        className="w-8 h-8 rounded-lg border border-[#E5E7EB] flex items-center justify-center text-slate-500 hover:border-[#1E5EFF] hover:text-[#1E5EFF] transition-all"
                      >
                        <Minus size={14} />
                      </button>
                      <div
                        className="flex-1 h-11 flex items-center justify-center rounded-[12px] border-2 text-xl font-black"
                        style={{ borderColor: v.color + "40", color: v.color, background: v.color + "10" }}
                      >
                        {v.val}
                      </div>
                      <button
                        onClick={() => v.set(v.val + 5)}
                        className="w-8 h-8 rounded-lg border border-[#E5E7EB] flex items-center justify-center text-slate-500 hover:border-[#1E5EFF] hover:text-[#1E5EFF] transition-all"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Volunteer categories */}
              <div>
                <FieldLabel>Thành phần tham gia</FieldLabel>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { name: "Đoàn Thanh niên", target: 35, icon: "🎯", color: "#1E5EFF" },
                    { name: "Người dân địa phương", target: 30, icon: "👥", color: "#22C55E" },
                    { name: "Tổ dân phố", target: 15, icon: "🏘️", color: "#F59E0B" },
                    { name: "Nhóm tình nguyện viên", target: 10, icon: "🤝", color: "#A78BFA" },
                    { name: "Tổ chức cộng đồng", target: 5, icon: "🏢", color: "#EC4899" },
                    { name: "Công an hỗ trợ", target: 5, icon: "🛡️", color: "#EF4444" },
                  ].map((cat) => (
                    <div key={cat.name} className="flex items-center gap-3 p-3 rounded-[12px] border border-[#E5E7EB] hover:border-slate-300 transition-all">
                      <span className="text-xl flex-shrink-0">{cat.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#1E293B]">{cat.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1.5 rounded-full bg-slate-100">
                            <div className="h-full rounded-full" style={{ width: `${cat.target}%`, background: cat.color }} />
                          </div>
                          <span className="text-xs font-bold" style={{ color: cat.color }}>{cat.target}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview stats */}
              <div className="mt-5 grid grid-cols-4 gap-3">
                {[
                  { label: "Ước tính tham gia", value: `${targetVolunteers} TNV`, icon: UserCheck, color: "#1E5EFF" },
                  { label: "Tỷ lệ tham gia", value: "78%", icon: TrendingUp, color: "#22C55E" },
                  { label: "Diện tích phủ sóng", value: "2.4 km²", icon: MapPin, color: "#F59E0B" },
                  { label: "Sức chứa TNV", value: `${maxVolunteers} người`, icon: Users, color: "#8B5CF6" },
                ].map((s) => (
                  <div key={s.label} className="text-center p-3 rounded-[12px]" style={{ background: s.color + "10" }}>
                    <s.icon size={20} className="mx-auto mb-1.5" style={{ color: s.color }} />
                    <p className="text-lg font-black" style={{ color: s.color }}>{s.value}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* ─── SECTION 6: RESOURCE & EQUIPMENT ─────────────────────── */}
            <section className="bg-white rounded-[20px] border border-[#E5E7EB] p-8 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
              <SectionHeader
                icon={Package}
                title="Tài nguyên & Vật tư hỗ trợ"
                subtitle="Lên kế hoạch vật tư, thiết bị và nguồn kinh phí cho chiến dịch"
              />

              {/* Inventory */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  { icon: Trash2, label: "Túi đựng rác", qty: "500 túi", color: "#22C55E" },
                  { icon: Shield, label: "Găng tay bảo hộ", qty: "200 đôi", color: "#1E5EFF" },
                  { icon: Wrench, label: "Dụng cụ vệ sinh", qty: "80 bộ", color: "#F59E0B" },
                  { icon: Truck, label: "Xe vận chuyển rác", qty: "5 xe", color: "#EF4444" },
                  { icon: ShieldCheck, label: "Thiết bị an toàn", qty: "50 bộ", color: "#8B5CF6" },
                  { icon: Heart, label: "Y tế hỗ trợ", qty: "2 trạm", color: "#EC4899" },
                  { icon: Package, label: "Nước uống", qty: "500 chai", color: "#0EA5E9" },
                  { icon: Megaphone, label: "Loa phát thanh", qty: "10 bộ", color: "#6B7280" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 p-3 rounded-[12px] border border-[#E5E7EB] hover:border-slate-300 transition-all">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: item.color + "15" }}>
                      <item.icon size={17} style={{ color: item.color }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-[#1E293B]">{item.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{item.qty}</p>
                    </div>
                    <input
                      type="number"
                      defaultValue={item.qty.match(/\d+/)?.[0]}
                      className="w-16 h-8 px-2 text-xs text-center rounded-[8px] border border-[#E5E7EB] focus:outline-none focus:border-[#1E5EFF]"
                    />
                  </div>
                ))}
              </div>

              {/* Budget */}
              <div className="rounded-[14px] border border-[#E5E7EB] p-5 bg-slate-50">
                <h3 className="text-sm font-bold text-[#0B2545] mb-4">Ước tính ngân sách & Nguồn tài trợ</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FieldLabel>Tổng ngân sách ước tính (VNĐ)</FieldLabel>
                    <FormInput value="15.000.000" onChange={() => {}} placeholder="VD: 15.000.000" />
                  </div>
                  <div>
                    <FieldLabel>Nguồn kinh phí chính</FieldLabel>
                    <FormSelect value="ward" onChange={() => {}}>
                      <option value="ward">Ngân sách phường</option>
                      <option value="sponsor">Nhà tài trợ</option>
                      <option value="community">Đóng góp cộng đồng</option>
                      <option value="government">Hỗ trợ chính phủ</option>
                    </FormSelect>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {[
                    { label: "Ngân sách phường", pct: 60, color: "#1E5EFF" },
                    { label: "Nhà tài trợ", pct: 25, color: "#22C55E" },
                    { label: "Đóng góp cộng đồng", pct: 10, color: "#F59E0B" },
                    { label: "Hỗ trợ chính phủ", pct: 5, color: "#8B5CF6" },
                  ].map((s) => (
                    <div key={s.label} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-600">{s.label}</span>
                        <span className="font-semibold" style={{ color: s.color }}>{s.pct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white border border-slate-200">
                        <div className="h-full rounded-full transition-all" style={{ width: `${s.pct}%`, background: s.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ─── SECTION 7: TASK MANAGEMENT ───────────────────────────── */}
            <section className="bg-white rounded-[20px] border border-[#E5E7EB] p-8 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
              <SectionHeader
                icon={Activity}
                title="Bảng quản lý công việc"
                subtitle="Kanban board phân công và theo dõi tiến độ công việc chiến dịch"
              />

              <div className="grid grid-cols-3 gap-4">
                {(
                  [
                    { key: "todo", title: "Cần làm", color: "#F59E0B", bg: "#FFFBEB", count: taskColumns.todo.length },
                    { key: "inProgress", title: "Đang thực hiện", color: "#1E5EFF", bg: "#EFF6FF", count: taskColumns.inProgress.length },
                    { key: "completed", title: "Hoàn thành", color: "#22C55E", bg: "#F0FDF4", count: taskColumns.completed.length },
                  ] as const
                ).map((col) => (
                  <div key={col.key} className="rounded-[14px] border border-[#E5E7EB] overflow-hidden">
                    <div className="px-4 py-3 flex items-center justify-between" style={{ background: col.bg }}>
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: col.color }} />
                        <span className="text-sm font-bold" style={{ color: col.color }}>{col.title}</span>
                      </div>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: col.color + "20", color: col.color }}>
                        {col.count}
                      </span>
                    </div>
                    <div className="p-3 space-y-2 bg-slate-50/50 min-h-[180px]">
                      {taskColumns[col.key].map((task) => (
                        <div key={task.id} className="bg-white rounded-[10px] border border-[#E5E7EB] p-3 hover:shadow-sm transition-shadow cursor-pointer">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <p className="text-xs font-semibold text-[#1E293B] leading-snug">{task.name}</p>
                            <PriorityBadge level={task.priority} />
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-slate-400 flex items-center gap-1">
                              <Users size={10} /> {task.team}
                            </p>
                            <p className="text-xs text-slate-400 flex items-center gap-1">
                              <Clock size={10} /> {task.duration} · {task.volunteers} TNV
                            </p>
                          </div>
                        </div>
                      ))}
                      <button className="w-full mt-2 py-2 rounded-[10px] border border-dashed border-slate-300 text-xs text-slate-400 hover:border-[#1E5EFF] hover:text-[#1E5EFF] transition-all flex items-center justify-center gap-1">
                        <Plus size={12} /> Thêm công việc
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

          </div>
          {/* ══════════════════════════════════════════════════════════════
              RIGHT SIDEBAR
          ══════════════════════════════════════════════════════════════ */}
          <div className="space-y-5 xl:sticky xl:top-6">

            {/* ── LIVE PREVIEW ─────────────────────────────────────────── */}
            <div className="bg-white rounded-[20px] border border-[#E5E7EB] overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
              <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye size={16} className="text-[#1E5EFF]" />
                  <span className="text-sm font-bold text-[#0B2545]">Xem trước chiến dịch</span>
                </div>
                <span className="text-xs text-[#22C55E] font-semibold flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" /> Live
                </span>
              </div>
              {/* Banner */}
              <div className="relative h-28 overflow-hidden">
                <img src={coverPreview || "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=200&fit=crop"} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="px-2 py-0.5 bg-[#1E5EFF] text-white text-xs font-bold rounded-full">Môi trường</span>
                    <span className="px-2 py-0.5 bg-[#F59E0B] text-white text-xs font-bold rounded-full">Cao</span>
                  </div>
                  <p className="text-white font-bold text-sm leading-tight line-clamp-2">{campaignName || "Tên chiến dịch..."}</p>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { label: "Tình nguyện viên", value: `${targetVolunteers} người`, icon: Users, color: "#1E5EFF" },
                    { label: "Phản ánh liên quan", value: `${selectedReports.length} phản ánh`, icon: ClipboardList, color: "#22C55E" },
                    { label: "Thời gian", value: "15 ngày", icon: Calendar, color: "#F59E0B" },
                    { label: "Địa bàn", value: "P. Hòa Xuân", icon: MapPin, color: "#8B5CF6" },
                  ].map((s) => (
                    <div key={s.label} className="flex items-center gap-2 p-2 rounded-[10px] bg-slate-50">
                      <s.icon size={13} style={{ color: s.color }} />
                      <div>
                        <p className="text-slate-400" style={{ fontSize: 10 }}>{s.label}</p>
                        <p className="font-semibold text-[#1E293B]">{s.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-2">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-500">Tiến độ tạo chiến dịch</span>
                    <span className="font-bold text-[#1E5EFF]">72%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-[#1E5EFF] to-[#22C55E]" />
                  </div>
                </div>
              </div>
            </div>

            {/* ── IMPACT ESTIMATION ────────────────────────────────────── */}
            <div className="bg-white rounded-[20px] border border-[#E5E7EB] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 size={16} className="text-[#1E5EFF]" />
                <span className="text-sm font-bold text-[#0B2545]">Ước tính tác động</span>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Người dân hưởng lợi", value: "1.245 hộ", color: "#1E5EFF", pct: 85 },
                  { label: "TNV tham gia ước tính", value: `${targetVolunteers} người`, color: "#22C55E", pct: 65 },
                  { label: "Phản ánh được giải quyết", value: `${selectedReports.length}/18`, color: "#F59E0B", pct: (selectedReports.length / 18) * 100 },
                  { label: "Diện tích phủ sóng", value: "2.4 km²", color: "#8B5CF6", pct: 70 },
                ].map((s) => (
                  <div key={s.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500">{s.label}</span>
                      <span className="font-bold" style={{ color: s.color }}>{s.value}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100">
                      <div className="h-full rounded-full transition-all" style={{ width: `${s.pct}%`, background: s.color }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Impact Scores */}
              <div className="grid grid-cols-2 gap-2 mt-4">
                <div className="text-center p-3 rounded-[12px] bg-[#EFF6FF]">
                  <p className="text-2xl font-black text-[#1E5EFF]">87</p>
                  <p className="text-xs text-slate-500 mt-0.5">Chỉ số tác động<br />cộng đồng</p>
                  <div className="flex justify-center mt-1 gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={10} fill={i < 4 ? "#1E5EFF" : "none"} className="text-[#1E5EFF]" />
                    ))}
                  </div>
                </div>
                <div className="text-center p-3 rounded-[12px] bg-[#F0FDF4]">
                  <p className="text-2xl font-black text-[#22C55E]">92</p>
                  <p className="text-xs text-slate-500 mt-0.5">Chỉ số tác động<br />môi trường</p>
                  <div className="flex justify-center mt-1 gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={10} fill={i < 5 ? "#22C55E" : "none"} className="text-[#22C55E]" />
                    ))}
                  </div>
                </div>
              </div>

              {/* Volunteer pie chart */}
              <div className="mt-4">
                <p className="text-xs font-semibold text-slate-500 mb-2">Cơ cấu lực lượng</p>
                <div className="flex items-center gap-3">
                  <div style={{ width: 80, height: 80 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={VOLUNTEER_PIE_DATA} cx="50%" cy="50%" innerRadius={22} outerRadius={38} dataKey="value" stroke="none">
                          {VOLUNTEER_PIE_DATA.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <ChartTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-1">
                    {VOLUNTEER_PIE_DATA.map((d) => (
                      <div key={d.name} className="flex items-center gap-1.5 text-xs">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                        <span className="text-slate-500 flex-1">{d.name}</span>
                        <span className="font-bold text-slate-700">{d.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ── ORGANIZER INFORMATION ────────────────────────────────── */}
            <div className="bg-white rounded-[20px] border border-[#E5E7EB] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
              <div className="flex items-center gap-2 mb-4">
                <Building2 size={16} className="text-[#1E5EFF]" />
                <span className="text-sm font-bold text-[#0B2545]">Thông tin tổ chức</span>
              </div>
              <div className="space-y-3">
                <div>
                  <FieldLabel>Loại tổ chức</FieldLabel>
                  <FormSelect value="ward" onChange={() => {}}>
                    <option value="ward">Ban điều hành phường</option>
                    <option value="police">Công an phường</option>
                    <option value="youth">Đoàn Thanh niên</option>
                    <option value="community">Tổ chức cộng đồng</option>
                  </FormSelect>
                </div>
                <div>
                  <FieldLabel>Cán bộ phụ trách</FieldLabel>
                  <FormInput value="Nguyễn Văn Phúc" onChange={() => {}} placeholder="Tên cán bộ..." />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FieldLabel>Số điện thoại</FieldLabel>
                    <div className="relative">
                      <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input value="0905 123 456" readOnly className="w-full pl-8 pr-3 h-11 rounded-[14px] border border-[#E5E7EB] text-sm text-[#1E293B] bg-white" />
                    </div>
                  </div>
                  <div>
                    <FieldLabel>Phòng ban</FieldLabel>
                    <FormInput value="UBND Phường Hòa Xuân" onChange={() => {}} />
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-[12px] bg-[#EFF6FF] border border-[#BFDBFE]">
                  <div className="w-10 h-10 rounded-full bg-[#1E5EFF] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">NP</div>
                  <div>
                    <p className="text-sm font-bold text-[#1E5EFF]">Nguyễn Văn Phúc</p>
                    <p className="text-xs text-slate-500">Chủ tịch UBND Phường Hòa Xuân</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-[#22C55E]" />
                      <span className="text-xs text-[#22C55E] font-semibold">Đã xác thực</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── VISIBILITY SETTINGS ──────────────────────────────────── */}
            <div className="bg-white rounded-[20px] border border-[#E5E7EB] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
              <div className="flex items-center gap-2 mb-4">
                <Globe size={16} className="text-[#1E5EFF]" />
                <span className="text-sm font-bold text-[#0B2545]">Cài đặt hiển thị</span>
              </div>
              <div className="divide-y divide-[#E5E7EB]">
                <ToggleSwitch value={isPublic} onChange={setIsPublic} label="Chiến dịch công khai" />
                <ToggleSwitch value={isGovVerified} onChange={setIsGovVerified} label="Đã xác thực chính phủ" />
                <ToggleSwitch value={volunteerReg} onChange={setVolunteerReg} label="Mở đăng ký tình nguyện viên" />
                <ToggleSwitch value={showHomepage} onChange={setShowHomepage} label="Hiển thị trên trang chủ" />
                <ToggleSwitch value={isFeatured} onChange={setIsFeatured} label="Chiến dịch nổi bật" />
                <ToggleSwitch value={allowComments} onChange={setAllowComments} label="Cho phép bình luận" />
                <ToggleSwitch value={allowMedia} onChange={setAllowMedia} label="Cho phép đưa tin truyền thông" />
              </div>
            </div>

            {/* ── RISK ASSESSMENT ──────────────────────────────────────── */}
            <div className="bg-white rounded-[20px] border border-[#E5E7EB] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={16} className="text-[#F59E0B]" />
                <span className="text-sm font-bold text-[#0B2545]">Đánh giá rủi ro</span>
              </div>

              <div className="mb-3">
                <FieldLabel>Mức độ rủi ro</FieldLabel>
                <div className="flex gap-2">
                  {[
                    { val: "low", label: "Thấp", color: "#22C55E" },
                    { val: "medium", label: "Trung bình", color: "#F59E0B" },
                    { val: "high", label: "Cao", color: "#EF4444" },
                  ].map((r) => (
                    <button
                      key={r.val}
                      onClick={() => setRiskLevel(r.val)}
                      className="flex-1 h-9 rounded-[10px] text-xs font-bold border-2 transition-all"
                      style={{
                        borderColor: riskLevel === r.val ? r.color : "#E5E7EB",
                        background: riskLevel === r.val ? r.color + "15" : "white",
                        color: riskLevel === r.val ? r.color : "#64748B",
                      }}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 mb-3">
                <p className="text-xs font-semibold text-slate-500">Rủi ro tiềm ẩn</p>
                {[
                  { label: "Thời tiết xấu", icon: "🌧️" },
                  { label: "Ùn tắc giao thông", icon: "🚦" },
                  { label: "Thiếu vật tư thiết bị", icon: "📦" },
                  { label: "Tỷ lệ tham gia thấp", icon: "👥" },
                ].map((r) => (
                  <div key={r.label} className="flex items-center gap-2 p-2 rounded-[10px] bg-[#FFF7ED] border border-[#FDE68A]">
                    <span className="text-sm">{r.icon}</span>
                    <span className="text-xs text-[#92400E]">{r.label}</span>
                  </div>
                ))}
              </div>

              <div>
                <FieldLabel>Phương án ứng phó khẩn cấp</FieldLabel>
                <textarea
                  rows={3}
                  defaultValue="Liên hệ ngay UBND phường và đội ứng phó khẩn cấp. Dự phòng ngày thực hiện bổ sung trong trường hợp thời tiết xấu."
                  className="w-full px-3 py-2 rounded-[12px] border border-[#E5E7EB] text-xs text-[#1E293B] focus:outline-none focus:border-[#1E5EFF] resize-none"
                />
              </div>
            </div>

            {/* ── QUICK ACTIONS ────────────────────────────────────────── */}
            <div className="bg-white rounded-[20px] border border-[#E5E7EB] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
              <div className="flex items-center gap-2 mb-4">
                <Zap size={16} className="text-[#1E5EFF]" />
                <span className="text-sm font-bold text-[#0B2545]">Hành động nhanh</span>
              </div>
              <div className="space-y-2.5">
                <button
                  onClick={handleSaveDraft}
                  className="w-full flex items-center justify-center gap-2 h-11 rounded-[14px] border-2 border-[#E5E7EB] text-sm font-semibold text-slate-600 hover:border-[#1E5EFF] hover:text-[#1E5EFF] transition-all"
                >
                  <Save size={16} /> Lưu bản nháp
                </button>
                <button className="w-full flex items-center justify-center gap-2 h-11 rounded-[14px] border-2 border-[#E5E7EB] text-sm font-semibold text-slate-600 hover:border-[#1E5EFF] hover:text-[#1E5EFF] transition-all">
                  <Eye size={16} /> Xem trước công khai
                </button>
                <button
                  onClick={handlePublish}
                  className="w-full flex items-center justify-center gap-2 h-12 rounded-[14px] bg-[#1E5EFF] text-white text-sm font-bold shadow-[0_4px_16px_rgba(30,94,255,0.35)] hover:bg-[#1E5EFF]/90 transition-all"
                >
                  <Send size={16} /> Công bố chiến dịch
                </button>
                <button
                  onClick={handlePublish}
                  className="w-full flex items-center justify-center gap-2 h-11 rounded-[14px] bg-[#22C55E] text-white text-sm font-bold shadow-[0_4px_16px_rgba(34,197,94,0.25)] hover:bg-[#22C55E]/90 transition-all"
                >
                  <CheckCircle size={16} /> Tạo & Kích hoạt ngay
                </button>
              </div>

              {/* Status indicator */}
              <div className="mt-4 p-3 rounded-[12px] bg-[#F0FDF4] border border-[#BBF7D0]">
                <div className="flex items-start gap-2">
                  <Info size={14} className="text-[#22C55E] mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-[#166534]">
                    Chiến dịch sẽ được UBND phường xem xét và phê duyệt trước khi công bố rộng rãi đến người dân.
                  </p>
                </div>
              </div>
            </div>

          </div>
          {/* END RIGHT SIDEBAR */}
        </div>

        {/* ══════════════════════════════════════════════════════════════
            BOTTOM: CAMPAIGN WORKFLOW VISUALIZATION
        ══════════════════════════════════════════════════════════════ */}
        <section className="mt-12 bg-white rounded-[20px] border border-[#E5E7EB] p-10 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-black text-[#0B2545] mb-2">Quy trình vận hành chiến dịch cộng đồng</h2>
            <p className="text-slate-500 text-sm max-w-xl mx-auto">
              Mô hình hoạt động tích hợp từ phản ánh công dân đến giải quyết vấn đề, đảm bảo minh bạch và hiệu quả.
            </p>
          </div>

          <div className="flex items-start justify-between gap-2">
            {[
              {
                step: 1,
                icon: ClipboardList,
                title: "Phản ánh công dân",
                desc: "Công dân ghi nhận và gửi phản ánh qua ứng dụng Đà Nẵng Kết Nối",
                color: "#6366F1",
                bg: "#EEF2FF",
              },
              {
                step: 2,
                icon: Eye,
                title: "Rà soát chính phủ",
                desc: "UBND phường xem xét mức độ ảnh hưởng và khả năng cộng đồng tham gia",
                color: "#1E5EFF",
                bg: "#EFF6FF",
              },
              {
                step: 3,
                icon: Megaphone,
                title: "Tạo chiến dịch",
                desc: "Cán bộ phụ trách tạo và thiết lập các thông số chiến dịch chi tiết",
                color: "#0EA5E9",
                bg: "#F0F9FF",
              },
              {
                step: 4,
                icon: Users,
                title: "Tuyển TNV",
                desc: "Người dân, đoàn thể đăng ký tham gia qua nền tảng hoặc trực tiếp",
                color: "#22C55E",
                bg: "#F0FDF4",
              },
              {
                step: 5,
                icon: PlayCircle,
                title: "Thực hiện",
                desc: "Các nhóm TNV phối hợp thực hiện công việc theo lịch trình và kanban",
                color: "#F59E0B",
                bg: "#FFFBEB",
              },
              {
                step: 6,
                icon: CheckCircle,
                title: "Giải quyết vấn đề",
                desc: "Công việc hoàn thành, báo cáo tiến độ và cập nhật trạng thái phản ánh",
                color: "#EF4444",
                bg: "#FEF2F2",
              },
              {
                step: 7,
                icon: Star,
                title: "Hoàn thành",
                desc: "Đánh giá kết quả, lưu trữ hồ sơ và ghi nhận đóng góp cộng đồng",
                color: "#22C55E",
                bg: "#F0FDF4",
              },
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center flex-1 relative">
                {/* Arrow connector */}
                {i < 6 && (
                  <div className="absolute left-full top-8 z-10 -translate-x-1/2 w-full flex items-center justify-center" style={{ width: "calc(100% - 64px)", left: "calc(50% + 28px)" }}>
                    <div className="h-0.5 w-full bg-gradient-to-r from-slate-200 to-slate-300" />
                    <ChevronRight size={16} className="text-slate-400 flex-shrink-0 -ml-2" />
                  </div>
                )}
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3 shadow-sm relative z-20"
                  style={{ background: step.bg, border: `2px solid ${step.color}20` }}
                >
                  <step.icon size={24} style={{ color: step.color }} />
                  <div
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full text-white flex items-center justify-center text-xs font-black shadow"
                    style={{ background: step.color }}
                  >
                    {step.step}
                  </div>
                </div>
                <p className="text-xs font-bold text-[#0B2545] text-center leading-tight mb-1">{step.title}</p>
                <p className="text-xs text-slate-400 text-center leading-snug max-w-[100px]">{step.desc}</p>
              </div>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="mt-10 flex items-center justify-center gap-4">
            <div className="flex items-center gap-2 px-5 py-3 rounded-[14px] bg-[#EFF6FF] border border-[#BFDBFE]">
              <BookOpen size={16} className="text-[#1E5EFF]" />
              <span className="text-sm font-semibold text-[#1E5EFF]">Hướng dẫn tạo chiến dịch</span>
            </div>
            <div className="flex items-center gap-2 px-5 py-3 rounded-[14px] bg-[#F0FDF4] border border-[#BBF7D0]">
              <CheckCircle size={16} className="text-[#22C55E]" />
              <span className="text-sm font-semibold text-[#22C55E]">Chiến dịch của tôi</span>
            </div>
          </div>
        </section>
      </div>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="mt-12 border-t border-[#E5E7EB] bg-white">
        <div style={{ maxWidth: 1320 }} className="mx-auto px-6 py-10">
          <div className="grid grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-[#1E5EFF] flex items-center justify-center">
                  <MapPin size={16} className="text-white" />
                </div>
                <span className="font-black text-[#0B2545] text-base">Đà Nẵng Kết Nối</span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">Nền tảng quản lý chiến dịch cộng đồng thành phố thông minh Đà Nẵng.</p>
            </div>
            <div>
              <p className="text-sm font-bold text-[#0B2545] mb-3">Liên hệ chính phủ</p>
              <div className="space-y-2 text-xs text-slate-500">
                <p className="flex items-center gap-2"><Phone size={12} /> 0236 3 820 020</p>
                <p className="flex items-center gap-2"><Mail size={12} /> info@danang.gov.vn</p>
                <p className="flex items-center gap-2"><MapPin size={12} /> 24 Trần Phú, Hải Châu, Đà Nẵng</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-[#0B2545] mb-3">Hỗ trợ</p>
              <div className="space-y-2 text-xs text-slate-500">
                <p className="cursor-pointer hover:text-[#1E5EFF] transition-colors">Trung tâm hỗ trợ</p>
                <p className="cursor-pointer hover:text-[#1E5EFF] transition-colors">Hướng dẫn sử dụng</p>
                <p className="cursor-pointer hover:text-[#1E5EFF] transition-colors">Quy định cộng đồng</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-[#0B2545] mb-3">Pháp lý</p>
              <div className="space-y-2 text-xs text-slate-500">
                <p className="cursor-pointer hover:text-[#1E5EFF] transition-colors">Điều khoản sử dụng</p>
                <p className="cursor-pointer hover:text-[#1E5EFF] transition-colors">Chính sách bảo mật</p>
                <p className="cursor-pointer hover:text-[#1E5EFF] transition-colors">Chính sách cookie</p>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-slate-400">
            <p>© 2025 Đà Nẵng Kết Nối · UBND TP Đà Nẵng · Tất cả quyền được bảo lưu.</p>
            <p>Phiên bản 2.5.1 · Smart City Platform</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
