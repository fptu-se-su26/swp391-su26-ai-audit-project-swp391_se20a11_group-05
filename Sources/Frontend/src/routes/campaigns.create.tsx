import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import type { ElementType, FormEvent, ReactNode } from "react";
import { ArrowLeft, Calendar, ClipboardList, Lock, MapPin, Package, Send, Users } from "lucide-react";
import { toast } from "sonner";
import { useCreateCampaign } from "@/hooks/useCampaigns";
import { Role, useAuth } from "@/lib/auth";
import type { CampaignCategory } from "@/lib/campaignStore";

export const Route = createFileRoute("/campaigns/create")({
  head: () => ({
    meta: [
      { title: "Tạo chiến dịch cộng đồng - Đà Nẵng Kết Nối" },
      {
        name: "description",
        content: "Biểu mẫu tạo chiến dịch cộng đồng dành cho cán bộ phường.",
      },
    ],
  }),
  component: CreateCampaignPage,
});

const categories: { value: CampaignCategory; label: string }[] = [
  { value: "environment", label: "Môi trường" },
  { value: "infrastructure", label: "Hạ tầng" },
  { value: "public_safety", label: "An toàn cộng đồng" },
  { value: "construction", label: "Xây dựng" },
  { value: "fire_safety", label: "Phòng cháy chữa cháy" },
];

const inputClass =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#1E5EFF] focus:ring-2 focus:ring-[#1E5EFF]/15";

function CreateCampaignPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { submit, isLoading } = useCreateCampaign();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<CampaignCategory>("environment");
  const [locationText, setLocationText] = useState("");
  const [description, setDescription] = useState("");
  const [privateLocationText, setPrivateLocationText] = useState("");
  const [requiredTools, setRequiredTools] = useState("");
  const [organizerContact, setOrganizerContact] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("30");

  const canCreate = isAuthenticated && user?.role === Role.WARD_STAFF;

  const getDurationText = () => {
    if (!startTime || !endTime) return null;
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
    const diffMs = end.getTime() - start.getTime();
    if (diffMs <= 0) return "Thời gian kết thúc phải diễn ra sau thời gian bắt đầu";
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    const remainingHours = diffHours % 24;
    if (diffDays > 0) {
      return `Thời gian diễn ra: ${diffDays} ngày ${remainingHours > 0 ? `${remainingHours} giờ` : ""}`;
    }
    return `Thời gian diễn ra: ${diffHours} giờ`;
  };

  const durationText = getDurationText();
  const isDurationError = !!(durationText && durationText.includes("phải diễn ra sau"));

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    // Field required validations
    if (!title.trim()) {
      toast.error("Vui lòng nhập tên chiến dịch.");
      return;
    }
    if (!locationText.trim()) {
      toast.error("Vui lòng nhập khu vực công khai.");
      return;
    }
    if (!description.trim()) {
      toast.error("Vui lòng nhập mô tả công khai.");
      return;
    }
    if (!privateLocationText.trim()) {
      toast.error("Vui lòng nhập điểm tập kết nội bộ.");
      return;
    }
    if (!requiredTools.trim()) {
      toast.error("Vui lòng nhập danh sách dụng cụ cần thiết.");
      return;
    }
    if (!organizerContact.trim()) {
      toast.error("Vui lòng nhập thông tin liên hệ ban tổ chức.");
      return;
    }

    // Date validations
    if (!startTime) {
      toast.error("Vui lòng chọn thời gian bắt đầu chiến dịch.");
      return;
    }
    if (!endTime) {
      toast.error("Vui lòng chọn thời gian kết thúc chiến dịch.");
      return;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();

    if (start < new Date(now.getTime() - 5 * 60 * 1000)) { // 5 minutes grace period
      toast.error("Thời gian bắt đầu không thể ở trong quá khứ.");
      return;
    }
    if (end <= start) {
      toast.error("Thời gian kết thúc phải diễn ra sau thời gian bắt đầu.");
      return;
    }

    // Participants validation
    const maxPartNum = parseInt(maxParticipants, 10);
    if (isNaN(maxPartNum) || maxPartNum <= 0) {
      toast.error("Số lượng tình nguyện viên tối đa phải là số nguyên dương.");
      return;
    }

    try {
      const campaign = await submit({
        title: title.trim(),
        category,
        description: description.trim(),
        locationText: locationText.trim(),
        privateLocationText: privateLocationText.trim(),
        requiredTools: requiredTools.trim(),
        organizerContact: organizerContact.trim(),
        startTime,
        endTime,
        maxParticipants: maxParticipants,
        wardName: user?.org,
      });

      toast.success("Đã gửi chiến dịch thành công để chờ phê duyệt.");
      navigate({ to: "/campaigns/$id", params: { id: campaign.id } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể gửi chiến dịch để phê duyệt.");
    }
  };

  if (!canCreate) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] px-4 py-12">
        <section className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-red-50 text-red-600">
            <Lock size={22} />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Quyền truy cập bị giới hạn</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Chỉ có cán bộ địa phương phụ trách (Ward Staff) được cấp quyền tạo các chiến dịch cộng đồng mới.
            Người dân có thể đăng ký tham gia các chiến dịch khi đã được phê duyệt chính thức.
          </p>
          <Link
            to="/campaigns"
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-[#1E5EFF] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#154ecc]"
          >
            <ArrowLeft size={16} />
            Quay lại danh sách
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-16">
      {/* Dynamic Header */}
      <div className="border-b border-slate-200 bg-white shadow-xs">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link to="/campaigns" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-slate-900">
            <ArrowLeft size={16} />
            Danh sách chiến dịch
          </Link>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500"></span>
            <span className="rounded-md border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
              Chờ phê duyệt
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8">
          <p className="text-xs font-black uppercase tracking-wider text-[#1E5EFF]">Phát động phong trào</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">Tạo chiến dịch mới</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Chiến dịch tạo ra sẽ được chuyển thẳng đến Ủy ban Thành phố phê duyệt trước khi công khai.
            Các chi tiết nhạy cảm (vị trí tập trung, liên hệ) sẽ được bảo mật.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Main Form Area */}
          <div className="space-y-6">
            {/* Section 1: Basic info */}
            <section className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-black text-slate-900">1. Thông tin chung chiến dịch</h2>
                <p className="text-xs text-slate-500">Hiển thị công khai cho mọi người dân tìm kiếm</p>
              </div>

              <Field icon={ClipboardList} label="Tên chiến dịch" required>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className={inputClass}
                  placeholder="Ví dụ: Dọn rác bãi biển Mỹ Khê chủ nhật xanh"
                />
              </Field>

              <div className="grid gap-4 md:grid-cols-2">
                <Field icon={Package} label="Lĩnh vực">
                  <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value as CampaignCategory)}
                    className={inputClass}
                  >
                    {categories.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field icon={Users} label="Tình nguyện viên cần tuyển">
                  <input
                    value={maxParticipants}
                    onChange={(event) => setMaxParticipants(event.target.value)}
                    className={inputClass}
                    type="number"
                    min="1"
                    placeholder="30"
                  />
                </Field>
              </div>

              <Field icon={MapPin} label="Khu vực hoạt động công khai" required>
                <input
                  value={locationText}
                  onChange={(event) => setLocationText(event.target.value)}
                  className={inputClass}
                  placeholder="Tên Phường hoặc Quận hoạt động (Ví dụ: Phường Hòa Khánh Nam)"
                />
              </Field>

              <Field icon={ClipboardList} label="Mô tả chi tiết chiến dịch" required>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className={`${inputClass} min-h-28 resize-y py-3`}
                  placeholder="Mục đích, thông điệp truyền tải, quyền lợi và nội dung hoạt động..."
                />
              </Field>
            </section>

            {/* Section 2: Time */}
            <section className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-black text-slate-900">2. Lập lịch & Thời gian diễn ra</h2>
                <p className="text-xs text-slate-500">Cần thiết lập khoảng thời gian hoạt động thực tế</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field icon={Calendar} label="Thời gian bắt đầu" required>
                  <input
                    type="datetime-local"
                    value={startTime}
                    onChange={(event) => setStartTime(event.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field icon={Calendar} label="Thời gian kết thúc" required>
                  <input
                    type="datetime-local"
                    value={endTime}
                    onChange={(event) => setEndTime(event.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>

              {/* Dynamic duration validation block */}
              {durationText && (
                <div className={`rounded-lg border px-4 py-3 text-xs font-semibold flex items-center gap-2 ${
                  isDurationError 
                    ? "border-red-200 bg-red-50 text-red-700" 
                    : "border-emerald-200 bg-emerald-50 text-emerald-800"
                }`}>
                  <Calendar size={14} className={isDurationError ? "text-red-500" : "text-emerald-600"} />
                  <span>{durationText}</span>
                </div>
              )}
            </section>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-6">
            {/* Private parameters block */}
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2 text-sm font-black text-slate-900 border-b border-slate-100 pb-2">
                <Lock size={16} className="text-[#1E5EFF]" />
                Thông tin bảo mật
              </div>
              <p className="mb-4 text-[11px] leading-5 text-slate-500">
                Thông tin này được ẩn với công chúng, chỉ những tình nguyện viên đã đăng ký và được duyệt mới có thể xem.
              </p>

              <div className="space-y-4">
                <Field label="Địa điểm tập trung / Hẹn gặp" required compact>
                  <textarea
                    value={privateLocationText}
                    onChange={(event) => setPrivateLocationText(event.target.value)}
                    className={`${inputClass} min-h-20 resize-y py-2 text-xs`}
                    placeholder="VD: Cổng trường Tiểu học Trần Cao Vân, số 23 Lê Duẩn"
                  />
                </Field>
                <Field label="Công cụ cần mang theo" required compact>
                  <textarea
                    value={requiredTools}
                    onChange={(event) => setRequiredTools(event.target.value)}
                    className={`${inputClass} min-h-20 resize-y py-2 text-xs`}
                    placeholder="VD: Mang theo găng tay cao su, mũ tai bèo, nước cá nhân"
                  />
                </Field>
                <Field label="Người phụ trách / SĐT" required compact>
                  <input
                    value={organizerContact}
                    onChange={(event) => setOrganizerContact(event.target.value)}
                    className={`${inputClass} text-xs`}
                    placeholder="VD: Anh Hải (0905.xxx.xxx) - Bí thư chi đoàn"
                  />
                </Field>
              </div>
            </section>

            {/* Campaign lifecycle guidelines */}
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3">Quy trình chiến dịch</h3>
              <ul className="space-y-3 text-xs text-slate-600">
                <li className="flex gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[10px] font-bold text-blue-600">1</span>
                  <span><strong>Tạo & gửi phê duyệt:</strong> Bạn hoàn thành và gửi biểu mẫu này.</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">2</span>
                  <span><strong>Đánh giá:</strong> Lãnh đạo Thành phố kiểm duyệt sự phù hợp.</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">3</span>
                  <span><strong>Đăng ký:</strong> Chiến dịch mở tuyển và người dân có thể đăng ký.</span>
                </li>
              </ul>
            </section>

            <button
              type="submit"
              disabled={isLoading || isDurationError}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#1E5EFF] text-sm font-black text-white shadow-md transition hover:bg-[#154ecc] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send size={16} />
              {isLoading ? "Đang gửi..." : "Gửi phê duyệt"}
            </button>
          </div>
        </div>
      </form>
    </main>
  );
}

function Field({
  icon: Icon,
  label,
  required,
  compact,
  children,
}: {
  icon?: ElementType;
  label: string;
  required?: boolean;
  compact?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className={`mb-2 flex items-center gap-2 font-bold text-slate-800 ${compact ? "text-xs" : "text-sm"}`}>
        {Icon && <Icon size={15} className="text-slate-400" />}
        {label}
        {required && <span className="text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}

