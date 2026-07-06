import { useState, useEffect, useMemo, useRef } from "react";
import { WardAttendancePage } from "./WardAttendancePage";
import type { ElementType, ReactNode } from "react";
import { Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Copy,
  Lock,
  MapPin,
  MessageCircle,
  Package,
  Send,
  Users,
  ShieldCheck,
  Filter,
  Check,
  Flag,
  List as ListIcon,
  Pencil,
  AlertTriangle,
  Map,
  MessageSquare,
  ArrowRight,
  Facebook,
} from "lucide-react";
import { toast } from "sonner";
import {
  useCampaignDetail,
  useCampaignParticipants,
  useJoinCampaign,
  useRejectCampaignParticipant,
  useLeaveCampaign,
  useConfirmWaitlist,
  useSendEmailOtp,
  useBatchApproveParticipants,
  useMarkNoShow,
  useUpdateCampaign,
  useEndCampaign,
  useApproveCampaignParticipant,
  useCampaignChat,
  useFinalizeCampaign,
} from "@/hooks/useCampaigns";
import type { CampaignParticipantResponse } from "@/lib/api";
import { Role, useAuth } from "@/lib/auth";
import type { Campaign } from "@/lib/campaignStore";
import {
  buildGoogleMapsSearchUrl,
  resolveCampaignCoordinates,
} from "@/lib/campaignLocation";
import { SingleCampaignMap } from "@/components/site/SingleCampaignMap";

const defaultHeroImage =
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&auto=format&fit=crop&q=85";

type WardCampaignDetailPageProps = {
  campaignId: string;
  initialEditMode?: boolean;
  onBack: () => void;
};

export function WardCampaignDetailPage({
  campaignId,
  initialEditMode = false,
  onBack,
}: WardCampaignDetailPageProps) {
  const theme = {
    primaryText: "text-indigo-600",
    primaryBg: "bg-indigo-600",
    primaryBorder: "border-indigo-600",
    primaryHover: "hover:bg-indigo-700",
    lightBg: "bg-indigo-50/30",
    lightBorder: "border-slate-100",
    lightBgHover: "hover:bg-indigo-50/50",
    avatarBg: "bg-indigo-50",
    avatarText: "text-indigo-600",
    focusRing: "focus:border-indigo-600 focus:ring-indigo-100/50",
    tabActive: "border-indigo-600 text-indigo-600",
    mainBg: "bg-slate-50/50",
    textHover: "hover:text-indigo-700",
    textHoverPrimary: "hover:text-indigo-600",
    borderDashed: "border-indigo-200 bg-indigo-50/20",
  };

  const campaign = useCampaignDetail(campaignId);
  const { user, isAuthenticated } = useAuth();

  const updateCampaign = useUpdateCampaign();
  const endCampaign = useEndCampaign();
  const finalizeCampaign = useFinalizeCampaign();
  const participantsQuery = useCampaignParticipants(campaignId);

  const [isEditing, setIsEditing] = useState(initialEditMode);
  const [isAttending, setIsAttending] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState<any>("environment");
  const [editTarget, setEditTarget] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editLocationText, setEditLocationText] = useState("");
  const [editPrivateLocationText, setEditPrivateLocationText] = useState("");
  const [editRequiredTools, setEditRequiredTools] = useState("");
  const [editOrganizerContact, setEditOrganizerContact] = useState("");
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");
  const [editLatitude, setEditLatitude] = useState<number | null>(null);
  const [editLongitude, setEditLongitude] = useState<number | null>(null);

  const hasInitializedRef = useRef(false);

  useEffect(() => {
    hasInitializedRef.current = false;
  }, [campaignId]);

  useEffect(() => {
    if (campaign && (!hasInitializedRef.current || !isEditing)) {
      setEditTitle(campaign.name || "");
      setEditCategory(campaign.category || "environment");
      setEditTarget(String(campaign.target || 30));
      setEditDescription(campaign.desc || "");
      setEditLocationText(campaign.locationText || "");
      setEditPrivateLocationText(campaign.privateLocationText || "");
      setEditRequiredTools(campaign.requiredTools || "");
      setEditOrganizerContact(campaign.organizerContact || "");
      setEditStartTime(campaign.startTime ? campaign.startTime.slice(0, 16) : "");
      setEditEndTime(campaign.endTime ? campaign.endTime.slice(0, 16) : "");
      setEditLatitude(campaign.latitude ?? null);
      setEditLongitude(campaign.longitude ?? null);
      hasInitializedRef.current = true;
    }
  }, [campaign, isEditing]);

  const handleSave = async () => {
    if (!editTitle.trim()) {
      toast.error("Vui lòng nhập tên chiến dịch.");
      return;
    }
    if (!editLocationText.trim()) {
      toast.error("Vui lòng nhập địa chỉ cụ thể.");
      return;
    }
    if (!editDescription.trim()) {
      toast.error("Vui lòng nhập mô tả chi tiết chiến dịch.");
      return;
    }
    if (!editPrivateLocationText.trim()) {
      toast.error("Vui lòng nhập điểm tập trung nội bộ.");
      return;
    }
    if (!editRequiredTools.trim()) {
      toast.error("Vui lòng nhập dụng cụ cần mang theo.");
      return;
    }
    if (!editOrganizerContact.trim()) {
      toast.error("Vui lòng nhập thông tin liên hệ ban tổ chức.");
      return;
    }
    if (!editStartTime) {
      toast.error("Vui lòng chọn thời gian bắt đầu.");
      return;
    }
    if (!editEndTime) {
      toast.error("Vui lòng chọn thời gian kết thúc.");
      return;
    }

    const start = new Date(editStartTime);
    const end = new Date(editEndTime);
    if (end <= start) {
      toast.error("Thời gian kết thúc phải diễn ra sau thời gian bắt đầu.");
      return;
    }

    const maxPartNum = Number.parseInt(editTarget, 10);
    if (Number.isNaN(maxPartNum) || maxPartNum <= 0) {
      toast.error("Số lượng tình nguyện viên tối đa phải là số nguyên dương.");
      return;
    }

    try {
      await updateCampaign.mutateAsync({
        id: campaignId,
        data: {
          title: editTitle.trim(),
          category: editCategory,
          description: editDescription.trim(),
          locationText: editLocationText.trim(),
          privateLocationText: editPrivateLocationText.trim(),
          requiredTools: editRequiredTools.trim(),
          organizerContact: editOrganizerContact.trim(),
          maxParticipants: maxPartNum,
          startTime: editStartTime || undefined,
          endTime: editEndTime || undefined,
          latitude: editLatitude ?? undefined,
          longitude: editLongitude ?? undefined,
          coverImageUrl: campaign?.coverImageUrl ?? undefined,
          imageUrls: campaign?.imageUrls ?? undefined,
        },
      });
      toast.success("Cập nhật chiến dịch thành công.");
      setIsEditing(false);
    } catch (err) {
      toast.error("Lỗi khi cập nhật chiến dịch: " + (err instanceof Error ? err.message : "Lỗi hệ thống"));
    }
  };

  const handleEndCampaign = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn kết thúc sớm chiến dịch này? Hành động này sẽ khóa đơn đăng ký và dừng tuyển quân.")) {
      return;
    }
    try {
      await endCampaign.mutateAsync(campaignId);
      toast.success("Đã kết thúc chiến dịch thành công.");
    } catch (err) {
      toast.error("Lỗi khi kết thúc chiến dịch: " + (err instanceof Error ? err.message : "Lỗi hệ thống"));
    }
  };

  const handleFinalize = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn chốt chiến dịch này? Hệ thống sẽ chốt danh sách người tham gia và bắt đầu chiến dịch (nếu đủ số người tối thiểu).")) {
      return;
    }
    try {
      await finalizeCampaign.mutateAsync(campaignId);
      toast.success("Chốt chiến dịch thành công.");
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi chốt chiến dịch.");
    }
  };

  if (!campaign) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <section className="mx-auto max-w-3xl rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-md">
          <h1 className="text-2xl font-black text-slate-900">Không tìm thấy chiến dịch</h1>
          <button
            onClick={onBack}
            className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700"
          >
            <ArrowLeft size={16} />
            Quay lại danh sách
          </button>
        </section>
      </main>
    );
  }

  const progressPercent =
    campaign.target > 0
      ? Math.min(100, Math.round((campaign.participants / campaign.target) * 100))
      : 0;

  return (
    <div className="pb-16 text-slate-950">
      <div className="mx-auto max-w-[1400px] pt-1">
        {/* Navigation & Header Actions */}
        {!isAttending && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 text-sm font-black text-slate-600 transition hover:text-indigo-600"
            >
              <ArrowLeft size={16} />
              Danh sách chiến dịch
            </button>
            <div className="flex items-center gap-2">
              {!campaign.canManage && (
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-black text-slate-500 shadow-sm uppercase tracking-wide">
                  Chỉ xem
                </span>
              )}
              {campaign.canManage && (
                <>
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleSave}
                        disabled={updateCampaign.isPending}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-black text-white hover:bg-emerald-700 transition active:scale-[0.97] disabled:opacity-50"
                      >
                        <CheckCircle2 size={14} />
                        Lưu thay đổi
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-slate-200 px-3.5 py-1.5 text-xs font-black text-slate-700 hover:bg-slate-300 transition active:scale-[0.97]"
                      >
                        Hủy bỏ
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-black text-white shadow-sm hover:bg-indigo-700 transition active:scale-[0.97]"
                    >
                      <Pencil size={13} />
                      Chỉnh sửa chiến dịch
                    </button>
                  )}
                </>
              )}
              <StatusBadge status={campaign.status} theme={theme} />
            </div>
          </div>
        )}

        {isAttending ? (
          <WardAttendancePage
            campaign={campaign}
            participants={participantsQuery.data || []}
            onBack={() => setIsAttending(false)}
            theme={theme}
          />
        ) : isEditing ? (
          /* Editing Form Layout */
          <div className="space-y-6 max-w-4xl mx-auto">
            <section className="rounded-2xl border border-slate-100 bg-white p-7 shadow-md">
              <h2 className="mb-4 text-lg font-black text-slate-950">Thông tin chung</h2>
              <div className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-sm font-black text-slate-700">Tên chiến dịch</label>
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100/50"
                    placeholder="Ví dụ: Dọn rác bãi biển Mỹ Khê..."
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-black text-slate-700">Danh mục</label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100/50"
                    >
                      <option value="environment">Môi trường</option>
                      <option value="infrastructure">Hạ tầng</option>
                      <option value="public_safety">An toàn cộng đồng</option>
                      <option value="construction">Xây dựng</option>
                      <option value="fire_safety">Phòng cháy chữa cháy</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-black text-slate-700">Số lượng cần tuyển</label>
                    <input
                      value={editTarget}
                      onChange={(e) => setEditTarget(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100/50 font-mono"
                      type="number"
                      min="1"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-black text-slate-700">Mô tả công khai</label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100/50 min-h-32 leading-relaxed"
                    placeholder="Mục đích, hoạt động cụ thể..."
                  />
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-100 bg-white p-7 shadow-md">
              <h2 className="mb-4 text-lg font-black text-slate-950">Lịch trình & Địa điểm công khai</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-black text-slate-700">Bắt đầu</label>
                  <input
                    type="datetime-local"
                    value={editStartTime}
                    onChange={(e) => setEditStartTime(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100/50 font-mono"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-black text-slate-700">Kết thúc</label>
                  <input
                    type="datetime-local"
                    value={editEndTime}
                    onChange={(e) => setEditEndTime(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100/50 font-mono"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="mb-1.5 block text-sm font-black text-slate-700">Địa chỉ cụ thể</label>
                <input
                  value={editLocationText}
                  onChange={(e) => setEditLocationText(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100/50"
                  placeholder="Nhập địa chỉ dọn dẹp, hỗ trợ..."
                />
              </div>
            </section>

            <section className="rounded-2xl border border-amber-200 bg-amber-50/20 p-7 shadow-md">
              <h2 className="mb-4 text-lg font-black text-amber-900">Thông tin bảo mật (Nội bộ)</h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-black text-amber-800">Điểm tập kết nội bộ</label>
                  <textarea
                    value={editPrivateLocationText}
                    onChange={(e) => setEditPrivateLocationText(e.target.value)}
                    className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100/50 min-h-24 leading-relaxed"
                    placeholder="Điểm tập trung cụ thể chỉ người được duyệt mới xem được..."
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-black text-amber-800">Dụng cụ yêu cầu</label>
                  <textarea
                    value={editRequiredTools}
                    onChange={(e) => setEditRequiredTools(e.target.value)}
                    className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100/50 min-h-24 leading-relaxed"
                    placeholder="Các dụng cụ cán bộ phường yêu cầu tình nguyện viên tự đem theo..."
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-black text-amber-800">Người phụ trách / SĐT liên hệ</label>
                  <input
                    value={editOrganizerContact}
                    onChange={(e) => setEditOrganizerContact(e.target.value)}
                    className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100/50"
                    placeholder="Họ tên - Số điện thoại cán bộ phụ trách..."
                  />
                </div>
              </div>
            </section>
          </div>
        ) : (
          /* Bento Grid Presentation Layout */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column Left (2 cols wide on desktop) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Card 1: Banner aspect-[16/7] */}
              <div className="relative aspect-[16/7] overflow-hidden rounded-2xl shadow-md border border-slate-100 bg-white">
                <img
                  src={campaign.cover || defaultHeroImage}
                  alt={campaign.name}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <h1 className="absolute bottom-6 left-6 right-6 text-2xl font-extrabold leading-tight text-white md:text-3xl">
                  {campaign.name}
                </h1>
              </div>

              {/* Bento Row: Progress & Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Card 2: Recruitment Progress */}
                <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <h2 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-3">
                      Tiến độ tuyển quân
                    </h2>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-3xl font-black text-slate-900">{campaign.participants}</span>
                      <span className="text-slate-400 text-sm font-semibold">/ {campaign.target} tình nguyện viên</span>
                    </div>
                  </div>
                  <div className="space-y-2 mt-4">
                    <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-indigo-600 transition-all duration-700"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs font-black text-slate-500">
                      <span>Đạt {progressPercent}% chỉ tiêu</span>
                      <span>{campaign.target - campaign.participants} chỉ tiêu còn lại</span>
                    </div>
                  </div>
                </div>

                {/* Card 3: Date & Location Info */}
                <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
                      <CalendarDays size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Thời gian diễn ra</h4>
                      <p className="text-sm font-bold text-slate-800 mt-1">{dateRange(campaign)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
                      <MapPin size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Khu vực địa điểm</h4>
                      <p className="text-sm font-bold text-slate-800 mt-1">{campaign.locationText || campaign.ward}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 4: Description */}
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-black text-slate-900 mb-3 flex items-center gap-2">
                  <ListIcon size={18} className="text-indigo-600" />
                  Về chiến dịch này
                </h3>
                <p className="text-sm leading-8 text-slate-600 whitespace-pre-line">
                  {campaign.desc || "Chưa có mô tả chi tiết từ phường."}
                </p>
              </div>

              {/* Card 5: Internal / Private Info */}
              <div className="rounded-2xl border border-amber-200 bg-amber-50/20 p-6 shadow-sm space-y-4">
                <h3 className="text-lg font-black text-amber-900 flex items-center gap-2">
                  <Lock size={18} className="text-amber-600" />
                  Thông tin nội bộ phường
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-amber-100">
                    <h5 className="text-xs font-black text-amber-800 uppercase tracking-wide flex items-center gap-1.5">
                      <MapPin size={13} />
                      Điểm tập kết
                    </h5>
                    <p className="text-sm font-bold text-slate-800 mt-1.5">{campaign.privateLocationText || "Chưa thiết lập"}</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-amber-100">
                    <h5 className="text-xs font-black text-amber-800 uppercase tracking-wide flex items-center gap-1.5">
                      <Package size={13} />
                      Dụng cụ yêu cầu
                    </h5>
                    <p className="text-sm font-bold text-slate-800 mt-1.5">{campaign.requiredTools || "Chưa thiết lập"}</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-amber-100">
                    <h5 className="text-xs font-black text-amber-800 uppercase tracking-wide flex items-center gap-1.5">
                      <MessageCircle size={13} />
                      Cán bộ liên hệ
                    </h5>
                    <p className="text-sm font-bold text-slate-800 mt-1.5">{campaign.organizerContact || "Chưa thiết lập"}</p>
                  </div>
                </div>
              </div>

              {/* Card 6: Interactive Map */}
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                  <Map size={18} className="text-indigo-600" />
                  Bản đồ vị trí
                </h3>
                <div className="overflow-hidden rounded-xl border border-slate-100 h-72">
                  <SingleCampaignMap campaign={campaign} />
                </div>
              </div>
            </div>

            {/* Column Right (1 col wide on desktop) */}
            <div className="space-y-6">
              {/* Card 7: Actions Panel */}
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-md space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                  Hành động
                </h3>

                {campaign.canManage ? (
                  <>

                    {campaign.status === "recruiting" && (
                      <button
                        onClick={handleFinalize}
                        disabled={finalizeCampaign.isPending}
                        className="w-full h-11 rounded-xl bg-amber-600 hover:bg-amber-700 text-xs font-black text-white shadow-sm transition active:scale-[0.97]"
                      >
                        {finalizeCampaign.isPending ? "Đang xử lý..." : "Chốt chiến dịch"}
                      </button>
                    )}

                    {campaign.status === "inProgress" && (
                      <button
                        onClick={() => setIsAttending(true)}
                        className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-black text-white shadow-sm transition active:scale-[0.97] flex items-center justify-center gap-2"
                      >
                        Điểm danh
                      </button>
                    )}

                    {(campaign.status === "recruiting" || campaign.status === "inProgress") && (
                      <button
                        onClick={handleEndCampaign}
                        disabled={endCampaign.isPending}
                        className="w-full h-11 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-black text-white shadow-sm transition active:scale-[0.97]"
                      >
                        {endCampaign.isPending ? "Đang dừng chiến dịch..." : "Kết thúc chiến dịch"}
                      </button>
                    )}

                    {campaign.status === "completed" && (
                      <div className="rounded-xl bg-emerald-50 p-3 text-center text-xs font-black text-emerald-600">
                        Chiến dịch đã hoàn thành
                      </div>
                    )}

                    {campaign.status === "ended" && (
                      <div className="rounded-xl bg-slate-50 p-3 text-center text-xs font-black text-slate-500">
                        Chiến dịch đã kết thúc
                      </div>
                    )}

                    {campaign.status === "cancelled" && (
                      <div className="rounded-xl bg-rose-50 p-3 text-center text-xs font-black text-rose-600">
                        Chiến dịch đã bị hủy
                      </div>
                    )}

                    <div className="text-[11px] font-semibold text-slate-400 leading-relaxed">
                      * Cán bộ phường có thể chỉnh sửa thông tin hoặc đóng đăng ký bất cứ lúc nào tùy thuộc vào tình hình thực địa.
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-3.5 text-xs font-semibold text-slate-500">
                    <Lock size={14} className="shrink-0 text-slate-400" />
                    Bạn chỉ có quyền xem chiến dịch này.
                  </div>
                )}
              </div>

              {/* Card 8: Host/Manager Info */}
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                  Cán bộ phụ trách
                </h3>
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-indigo-50 text-base font-black text-indigo-600">
                    CB
                  </div>
                  <div>
                    <p className="font-black text-slate-900">{campaign.createdBy}</p>
                    <p className="text-xs font-semibold text-slate-500">{campaign.ward}</p>
                  </div>
                </div>

              </div>

              <GroupChatNavigationCard
                campaign={campaign}
                approvedStatus={campaign.currentUserJoinStatus === "APPROVED"}
                theme={theme}
              />
              <ShareCard theme={theme} />

              {/* Card 9: Volunteer Approvals Panel */}
              {campaign.canManage && (
                <div className="lg:col-span-3">
                  <ParticipantReviewPanel campaignId={campaign.id} theme={theme} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ParticipantReviewPanel({ campaignId, theme }: { campaignId: string; theme: any }) {
  const participantsQuery = useCampaignParticipants(campaignId);
  const approveParticipant = useApproveCampaignParticipant(campaignId);
  const rejectParticipant = useRejectCampaignParticipant(campaignId);
  const batchApprove = useBatchApproveParticipants(campaignId);
  const markNoShow = useMarkNoShow(campaignId);

  const participants = participantsQuery.data ?? [];
  const pendingParticipants = participants.filter((p) => p.joinStatus === "PENDING");
  const confirmedParticipants = participants.filter((p) => p.joinStatus === "CONFIRMED");
  const approvedParticipants = participants.filter((p) => p.joinStatus === "APPROVED");
  const cancelledParticipants = participants.filter(
    (p) => p.joinStatus === "CANCELLED" || p.joinStatus === "REJECTED" || p.joinStatus === "NO_SHOW",
  );

  const [activeTab, setActiveTab] = useState<"pending" | "confirmed" | "approved" | "cancelled">("confirmed");
  const [expandedApprovedId, setExpandedApprovedId] = useState<number | null>(null);

  // Filters state (only used in confirmed tab)
  const [minPastCampaigns, setMinPastCampaigns] = useState<number>(0);
  const [minRating, setMinRating] = useState<number>(0);
  const [noShowOnly, setNoShowOnly] = useState<boolean>(false);

  // Selection state for batch approval (only used in confirmed tab)
  const [selectedIds, setSelectedIds] = useState<Record<number, boolean>>({});

  // Filter confirmed list
  const filteredConfirmed = confirmedParticipants.filter((p) => {
    if (p.pastCampaignCount < minPastCampaigns) return false;
    if (p.averageRating < minRating) return false;
    if (noShowOnly && p.noShowCount <= 2) return false;
    return true;
  });

  const handleApprove = async (participant: CampaignParticipantResponse) => {
    try {
      await approveParticipant.mutateAsync(participant.id);
      toast.success(`Đã duyệt ${participant.citizenName} vào chiến dịch.`);
    } catch (error) {
      toast.error((error as any)?.message || "Lỗi phê duyệt.");
    }
  };

  const handleReject = async (participant: CampaignParticipantResponse) => {
    const reason = window.prompt("Nhập lý do từ chối yêu cầu tham gia:", "");
    if (reason === null) return;

    try {
      await rejectParticipant.mutateAsync({
        participantId: participant.id,
        reason: reason.trim() || undefined,
      });
      toast.success(`Đã từ chối yêu cầu của ${participant.citizenName}.`);
    } catch (error) {
      toast.error((error as any)?.message || "Lỗi từ chối.");
    }
  };

  const handleMarkAbsent = async (participant: CampaignParticipantResponse) => {
    if (
      !window.confirm(
        `Xác nhận đánh dấu vắng mặt (NO_SHOW) cho ${participant.citizenName}? Việc này sẽ làm giảm độ tin cậy của họ.`,
      )
    ) {
      return;
    }
    try {
      await markNoShow.mutateAsync(participant.id);
      toast.success(`Đã đánh dấu vắng mặt cho ${participant.citizenName}.`);
    } catch (error) {
      toast.error((error as any)?.message || "Lỗi đánh dấu vắng mặt.");
    }
  };

  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleSelectAll = (checked: boolean) => {
    const newSelections: Record<number, boolean> = {};
    if (checked) {
      filteredConfirmed.forEach((p) => {
        newSelections[p.id] = true;
      });
    }
    setSelectedIds(newSelections);
  };

  const handleBatchApprove = async () => {
    const idsToApprove = Object.keys(selectedIds)
      .map(Number)
      .filter((id) => selectedIds[id]);

    if (idsToApprove.length === 0) {
      toast.error("Vui lòng chọn ít nhất một tình nguyện viên để duyệt hàng loạt.");
      return;
    }

    try {
      await batchApprove.mutateAsync(idsToApprove);
      toast.success(`Đã duyệt hàng loạt thành công ${idsToApprove.length} tình nguyện viên.`);
      setSelectedIds({});
    } catch (error) {
      toast.error((error as any)?.message || "Lỗi khi duyệt hàng loạt.");
    }
  };

  const isAllSelected =
    filteredConfirmed.length > 0 && filteredConfirmed.every((p) => selectedIds[p.id]);

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-lg space-y-4">
      {/* Tabs */}
      <div className="flex border-b border-slate-100">
        <button
          type="button"
          onClick={() => setActiveTab("pending")}
          className={`flex-1 pb-3 text-xs md:text-sm font-black transition-all ${activeTab === "pending"
            ? `border-b-2 ${theme.tabActive}`
            : "text-slate-500 hover:text-slate-800"
            }`}
        >
          Chưa xác nhận ({pendingParticipants.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("confirmed")}
          className={`flex-1 pb-3 text-xs md:text-sm font-black transition-all ${activeTab === "confirmed"
            ? `border-b-2 ${theme.tabActive}`
            : "text-slate-500 hover:text-slate-800"
            }`}
        >
          Chờ duyệt ({confirmedParticipants.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("approved")}
          className={`flex-1 pb-3 text-xs md:text-sm font-black transition-all ${activeTab === "approved"
            ? `border-b-2 ${theme.tabActive}`
            : "text-slate-500 hover:text-slate-800"
            }`}
        >
          Danh sách tham gia ({approvedParticipants.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("cancelled")}
          className={`flex-1 pb-3 text-xs md:text-sm font-black transition-all ${activeTab === "cancelled"
            ? `border-b-2 ${theme.tabActive}`
            : "text-slate-500 hover:text-slate-800"
            }`}
        >
          Đã từ chối ({cancelledParticipants.length})
        </button>
      </div>

      {activeTab === "pending" && (
        <div className="space-y-4">
          {/* List pending */}
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {pendingParticipants.length === 0 ? (
              <p className="text-center py-6 text-xs text-slate-400 font-bold">
                Không tìm thấy tình nguyện viên nào chưa xác nhận.
              </p>
            ) : (
              pendingParticipants.map((p) => {
                const hasNoShowWarning = p.noShowCount > 2;

                return (
                  <div
                    key={p.id}
                    className="rounded-xl border border-slate-100 bg-white p-4 hover:border-slate-200 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-slate-900">{p.citizenName}</span>
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-600">
                            Chưa xác nhận
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-semibold mt-0.5">{p.citizenEmail}</p>

                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="text-xs font-semibold text-slate-500">
                            Số chiến dịch: <strong className="text-slate-700">{p.pastCampaignCount}</strong>
                          </span>
                          <span className="text-xs font-black text-amber-600">
                            ★ {p.averageRating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {activeTab === "confirmed" && (
        <div className="space-y-4">
          {/* Filters Panel */}
          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100 space-y-3">
            <div className="flex items-center gap-2 text-xs font-black uppercase text-indigo-600">
              <Filter size={14} />
              Bộ lọc tình nguyện viên chờ duyệt
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                  Số chiến dịch tham gia
                </label>
                <select
                  value={minPastCampaigns}
                  onChange={(e) => setMinPastCampaigns(Number(e.target.value))}
                  className="w-full h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold outline-none"
                >
                  <option value={0}>0 chiến dịch</option>
                  <option value={1}>1 chiến dịch</option>
                  <option value={3}>3 chiến dịch</option>
                  <option value={5}>5 chiến dịch</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                  Đánh giá tối thiểu
                </label>
                <select
                  value={minRating}
                  onChange={(e) => setMinRating(Number(e.target.value))}
                  className="w-full h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold outline-none"
                >
                  <option value={0}>Mọi đánh giá</option>
                  <option value={3}>Từ 3.0 ★ trở lên</option>
                  <option value={4}>Từ 4.0 ★ trở lên</option>
                  <option value={4.5}>Từ 4.5 ★ trở lên</option>
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={noShowOnly}
                onChange={(e) => setNoShowOnly(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs font-semibold text-slate-600">
                Chỉ hiện người có cảnh báo (No-show &gt; 2)
              </span>
            </label>
          </div>

          {/* Batch Approve Control */}
          {filteredConfirmed.length > 0 && (
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs font-black text-slate-700">Chọn tất cả</span>
              </label>

              <button
                type="button"
                onClick={handleBatchApprove}
                disabled={batchApprove.isPending}
                className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-black text-white disabled:opacity-50 flex items-center gap-1.5 transition"
              >
                <Check size={14} />
                Duyệt hàng loạt
              </button>
            </div>
          )}

          {/* List confirmed */}
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {filteredConfirmed.length === 0 ? (
              <p className="text-center py-6 text-xs text-slate-400 font-bold">
                Không tìm thấy tình nguyện viên nào đã xác nhận.
              </p>
            ) : (
              filteredConfirmed.map((p) => {
                const isSelected = !!selectedIds[p.id];
                const hasNoShowWarning = p.noShowCount > 2;

                return (
                  <div
                    key={p.id}
                    className={`rounded-xl border p-4 transition-all duration-200 ${isSelected
                      ? "border-indigo-200 bg-indigo-50/20 shadow-sm"
                      : "border-slate-100 bg-white hover:border-slate-200"
                      }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(p.id)}
                          className="mt-1 h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-slate-900">{p.citizenName}</span>
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-600">
                              {p.pastCampaignCount} chiến dịch
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 font-semibold mt-0.5">{p.citizenEmail}</p>

                          {/* Ratings and No-show counts */}
                          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span className="text-xs font-black text-amber-600 flex items-center gap-0.5">
                              ★ {p.averageRating.toFixed(1)}
                            </span>
                            <span
                              className={`text-[10px] font-black ${hasNoShowWarning
                                ? "text-red-600 bg-red-50 px-2 py-0.5 rounded-full flex items-center gap-1 border border-red-100 animate-pulse"
                                : "text-slate-500"
                                }`}
                            >
                              {hasNoShowWarning && <AlertTriangle size={10} />}
                              Bỏ buổi (No-Show): {p.noShowCount}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {p.volunteerExperience && (
                      <div className="mt-3 rounded-lg bg-slate-50 p-2.5 text-xs text-slate-600 leading-relaxed font-semibold">
                        <span className="font-black text-slate-500 block mb-1">Kinh nghiệm:</span>
                        {p.volunteerExperience}
                      </div>
                    )}

                    {p.availabilityHours && (
                      <p className="mt-2 text-[11px] font-black text-indigo-600">
                        Rảnh: {p.availabilityHours}
                      </p>
                    )}

                    <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3">
                      <button
                        type="button"
                        onClick={() => handleApprove(p)}
                        className="flex-1 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-xs font-black text-white active:scale-[0.98] transition"
                      >
                        Duyệt tham gia
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReject(p)}
                        className="h-8 px-3 rounded-lg border border-red-100 bg-red-50 text-xs font-black text-red-600 hover:bg-red-100 active:scale-[0.98] transition"
                      >
                        Từ chối
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {activeTab === "approved" && (
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
          {approvedParticipants.length === 0 ? (
            <p className="text-center py-6 text-xs text-slate-400 font-bold">
              Chưa có tình nguyện viên nào được duyệt.
            </p>
          ) : (
            approvedParticipants.map((p) => {
              const isExpanded = expandedApprovedId === p.id;
              const hasNoShowWarning = p.noShowCount > 2;

              return (
                <div
                  key={p.id}
                  className="rounded-xl border border-slate-100 bg-white p-4 hover:border-slate-200 transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-900">{p.citizenName}</span>
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
                          Chính thức
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-semibold mt-0.5">{p.citizenEmail}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setExpandedApprovedId(isExpanded ? null : p.id)}
                      className="text-xs font-bold text-indigo-600 hover:underline"
                    >
                      {isExpanded ? "Thu gọn" : "Chi tiết"}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 border-t border-slate-100 pt-3 space-y-3">
                      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
                        <span className="font-semibold text-slate-500">
                          Đánh giá: <strong className="text-slate-800">★ {p.averageRating.toFixed(1)}</strong>
                        </span>
                        <span className="font-semibold text-slate-500">
                          Đã tham gia: <strong className="text-slate-800">{p.pastCampaignCount}</strong>
                        </span>
                        <span
                          className={`font-semibold ${hasNoShowWarning ? "text-red-600" : "text-slate-500"
                            }`}
                        >
                          Số lần bùng: <strong>{p.noShowCount}</strong>
                        </span>
                      </div>

                      {p.volunteerExperience && (
                        <p className="text-xs leading-relaxed text-slate-600 font-semibold bg-slate-50 p-2.5 rounded-lg">
                          <span className="font-black text-slate-500 block mb-1">Kinh nghiệm:</span>
                          {p.volunteerExperience}
                        </p>
                      )}

                      {p.availabilityHours && (
                        <p className="text-[11px] font-black text-indigo-600">
                          Rảnh: {p.availabilityHours}
                        </p>
                      )}

                      <button
                        type="button"
                        onClick={() => handleMarkAbsent(p)}
                        className="w-full h-8 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-xs font-black text-red-700 active:scale-[0.98] transition"
                      >
                        Đánh dấu vắng mặt (No-Show)
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === "cancelled" && (
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
          {cancelledParticipants.length === 0 ? (
            <p className="text-center py-6 text-xs text-slate-400 font-bold">
              Không có tình nguyện viên nào bị hủy hoặc từ chối.
            </p>
          ) : (
            cancelledParticipants.map((p) => {
              return (
                <div
                  key={p.id}
                  className="rounded-xl border border-slate-100 bg-white p-4 opacity-75"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-black text-slate-900">{p.citizenName}</span>
                    <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[9px] font-black uppercase text-red-600 tracking-wider border border-red-100">
                      {p.joinStatus === "CANCELLED"
                        ? "Hủy đăng ký"
                        : p.joinStatus === "NO_SHOW"
                          ? "Vắng mặt"
                          : "Từ chối"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">{p.citizenEmail}</p>

                  {p.cancellationReason && (
                    <div className="mt-2.5 rounded-lg bg-red-50/50 p-2.5 text-xs text-red-800 leading-relaxed font-semibold border border-red-100/50">
                      <span className="font-black text-red-900 block mb-0.5">Lý do:</span>
                      {p.cancellationReason}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </section>
  );
}

function StatusBadge({ status, theme }: { status: Campaign["status"]; theme?: any }) {
  const meta: Record<string, { label: string; className: string }> = {
    recruiting: {
      label: "Chưa diễn ra",
      className: "border-amber-200 bg-amber-50 text-amber-700",
    },
    inProgress: { label: "Đang diễn ra", className: "border-blue-200 bg-blue-50 text-blue-700" },
    active: { label: "Đang diễn ra", className: "border-blue-200 bg-blue-50 text-blue-700" },
    completed: {
      label: "Đã kết thúc",
      className: "border-red-200 bg-red-50 text-red-700",
    },
    ended: {
      label: "Đã kết thúc",
      className: "border-red-200 bg-red-50 text-red-700",
    },
    cancelled: {
      label: "Đã bị hủy",
      className: "border-slate-300 bg-slate-100 text-slate-700",
    },
  };

  const current = meta[status] || {
    label: "Chưa diễn ra",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide shadow-sm ${current.className}`}>
      {current.label}
    </span>
  );
}

function dateRange(campaign: Campaign) {
  if (!campaign.startTime) return "Chưa cập nhật";
  const start = formatDateTime(campaign.startTime);
  const end = campaign.endTime ? formatDateTime(campaign.endTime) : "";
  return end ? `${start} - ${end}` : start;
}

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr);
  const time = d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  const date = d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  return `${time} ${date}`;
}

function GroupChatNavigationCard({
  campaign,
  approvedStatus,
  theme,
}: {
  campaign: Campaign;
  approvedStatus: boolean;
  theme: any;
}) {
  const chat = useCampaignChat(campaign.id);
  const memberCount = Math.max(1, campaign.participants || 0);
  const allMessages = chat.data?.pages.flat() || [];
  const latest = allMessages.reduce<any>((latestMsg, currentMsg) => {
    if (!latestMsg) return currentMsg;
    return new Date(currentMsg.createdAt) > new Date(latestMsg.createdAt) ? currentMsg : latestMsg;
  }, null);
  const latestPreview = latest
    ? `${latest.senderName}: ${latest.message}`
    : "Chưa có tin nhắn nào.";
  const avatars = ["CB", "A", "B"];

  return (
    <section className={`rounded-2xl border ${theme.lightBorder} bg-white p-6 shadow-lg`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-black text-slate-950">
          <MessageSquare size={17} className={theme.primaryText} />
          Nhóm chat chiến dịch
        </h2>
        {approvedStatus && (
          <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-black text-red-600">
            Tin mới
          </span>
        )}
      </div>
      <div className="flex -space-x-2">
        {avatars.map((avatar) => (
          <span
            key={avatar}
            className={`grid h-9 w-9 place-items-center rounded-full border-2 border-white ${theme.avatarBg} text-xs font-black ${theme.avatarText} shadow-sm`}
          >
            {avatar}
          </span>
        ))}
      </div>
      <p className="mt-4 text-sm font-black text-slate-900">
        {memberCount} thành viên đang trong nhóm
      </p>
      <p className="mt-1 truncate text-sm font-semibold text-slate-500">{latestPreview}</p>
      <Link
        to="/campaigns/$id/group-chat"
        params={{ id: campaign.id }}
        className={`mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl ${theme.primaryBg} px-4 text-sm font-black text-white shadow-sm transition ${theme.primaryHover} active:scale-[0.97]`}
      >
        Vào nhóm chat
        <ArrowRight size={16} />
      </Link>
    </section>
  );
}

function ShareCard({ theme }: { theme: any }) {
  return (
    <section className={`rounded-2xl border ${theme.lightBorder} bg-white p-6 shadow-lg`}>
      <h2 className="mb-4 text-sm font-black uppercase tracking-wider text-slate-500">
        Chia sẻ chiến dịch
      </h2>
      <div className="grid grid-cols-3 gap-3">
        <IconButton label="Facebook" icon={Facebook} theme={theme} />
        <IconButton label="Zalo" text="Z" theme={theme} />
        <IconButton label="Copy link" icon={Copy} theme={theme} />
      </div>
    </section>
  );
}

function IconButton({
  label,
  icon: Icon,
  text,
  theme,
}: {
  label: string;
  icon?: ElementType;
  text?: string;
  theme: any;
}) {
  return (
    <button
      type="button"
      className={`grid h-11 place-items-center rounded-xl border ${theme.lightBorder} ${theme.mainBg} text-sm font-black ${theme.primaryText} transition ${theme.lightBgHover} active:scale-[0.97]`}
      aria-label={label}
      title={label}
    >
      {Icon ? <Icon size={18} /> : text}
    </button>
  );
}
