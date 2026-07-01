import { createFileRoute, Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useMemo, useRef } from "react";
import type { ElementType, ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Copy,
  Facebook,
  Heart,
  Lock,
  Map,
  MapPin,
  MessageCircle,
  MessageSquare,
  MoreHorizontal,
  Package,
  Send,
  ShieldCheck,
  Users,
  UserRound,
  Filter,
  AlertTriangle,
  Check,
  X,
  Award,
  History,
  UserX,
} from "lucide-react";
import { toast } from "sonner";
import {
  useApproveCampaign,
  useApproveCampaignParticipant,
  useCampaignChat,
  useCampaignComments,
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
  useSignalAttendance,
  useFinalizeCampaign,
} from "@/hooks/useCampaigns";
import type { CampaignParticipantResponse } from "@/lib/api";
import { Role, useAuth } from "@/lib/auth";
import type { Campaign } from "@/lib/campaignStore";
import {
  buildGoogleMapsEmbedUrl,
  buildGoogleMapsSearchUrl,
  resolveCampaignCoordinates,
} from "@/lib/campaignLocation";
import { SingleCampaignMap } from "@/components/site/SingleCampaignMap";

export const Route = createFileRoute("/campaigns/$id")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      join: search.join === "true" || search.join === true,
    };
  },
  head: () => ({
    meta: [
      { title: "Chi tiết chiến dịch - Đà Nẵng Kết Nối" },
      {
        name: "description",
        content: "Thông tin chi tiết chiến dịch cộng đồng.",
      },
    ],
  }),
  component: CampaignDetailPage,
});

const defaultHeroImage =
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&auto=format&fit=crop&q=85";

export function CampaignDetailPage() {
  const { id } = Route.useParams();
  const { join } = Route.useSearch();
  return <CampaignDetailPageComponent campaignId={id} join={join} />;
}

type CampaignDetailPageComponentProps = {
  campaignId: string;
  join?: boolean;
  initialEditMode?: boolean;
  onBack?: () => void;
  isWard?: boolean;
};

export function CampaignDetailPageComponent({
  campaignId,
  join = false,
  initialEditMode,
  onBack,
  isWard = false,
}: CampaignDetailPageComponentProps) {
  const theme = {
    primaryText: isWard ? "text-indigo-600" : "text-[#7C3AED]",
    primaryBg: isWard ? "bg-indigo-600" : "bg-[#7C3AED]",
    primaryBorder: isWard ? "border-indigo-600" : "border-[#7C3AED]",
    primaryHover: isWard ? "hover:bg-indigo-700" : "hover:brightness-110",
    lightBg: isWard ? "bg-indigo-50/30" : "bg-[#F3F0FF]",
    lightBorder: isWard ? "border-slate-100" : "border-violet-100",
    lightBgHover: isWard ? "hover:bg-indigo-50/50" : "hover:bg-[#F3F0FF]",
    avatarBg: isWard ? "bg-indigo-50" : "bg-[#F3F0FF]",
    avatarText: isWard ? "text-indigo-600" : "text-[#7C3AED]",
    focusRing: isWard ? "focus:border-indigo-600 focus:ring-indigo-100/50" : "focus:border-[#7C3AED] focus:ring-[#7C3AED]/15",
    tabActive: isWard ? "border-indigo-600 text-indigo-600" : "border-[#7C3AED] text-[#7C3AED]",
    mainBg: isWard ? "bg-slate-50/50" : "bg-[#F8F7FF]",
    textHover: isWard ? "hover:text-indigo-700" : "hover:text-[#7C3AED]",
    textHoverPrimary: isWard ? "hover:text-indigo-600" : "hover:text-[#7C3AED]",
    borderDashed: isWard ? "border-indigo-200 bg-indigo-50/20" : "border-violet-100 bg-[#F8F7FF]",
  };

  const isGroupChatRoute = useRouterState({
    select: (state) => state.location.pathname.endsWith("/group-chat"),
  });
  const campaign = useCampaignDetail(campaignId);
  const { user, isAuthenticated } = useAuth();
  const hasJoined = campaign && (
    campaign.canManage ||
    (campaign.currentUserJoinStatus && ["APPROVED", "CONFIRMED", "MAYBE", "PENDING_CONFIRM", "PENDING"].includes(campaign.currentUserJoinStatus))
  );
  const joinCampaign = useJoinCampaign();
  const approveCampaign = useApproveCampaign();
  const leaveCampaign = useLeaveCampaign();
  const confirmWaitlist = useConfirmWaitlist();
  const sendEmailOtp = useSendEmailOtp();

  const updateCampaign = useUpdateCampaign();
  const endCampaign = useEndCampaign();
  const signalAttendance = useSignalAttendance(campaignId);
  const finalizeCampaign = useFinalizeCampaign();

  const [isEditing, setIsEditing] = useState(initialEditMode || false);
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
          coverImageUrl: campaign.coverImageUrl ?? undefined,
          imageUrls: campaign.imageUrls ?? undefined,
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

  const handleFinalizeCampaign = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn chốt chiến dịch? Hệ thống sẽ kiểm tra số người tham gia và chuyển trạng thái chiến dịch.")) {
      return;
    }
    try {
      const result = await finalizeCampaign.mutateAsync(campaignId);
      if (result.status === "IN_PROGRESS") {
        toast.success("Chiến dịch đã bắt đầu! Đủ số người tối thiểu.");
      } else {
        toast.error("Chiến dịch bị hủy do không đủ số người tối thiểu.");
      }
    } catch (err) {
      toast.error("Lỗi khi chốt chiến dịch: " + (err instanceof Error ? err.message : "Lỗi hệ thống"));
    }
  };

  // Smart Join Modal states
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [volunteerExperience, setVolunteerExperience] = useState("");
  const [availabilityHours, setAvailabilityHours] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  // Leave Modal states
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveReason, setLeaveReason] = useState("");

  const navigate = useNavigate();

  const handleCloseJoinModal = () => {
    setShowJoinModal(false);
    navigate({
      search: (prev) => ({ ...prev, join: undefined }),
      replace: true,
    });
  };

  // Dynamic availability slot selector
  const campaignDays = useMemo(() => {
    if (!campaign?.startTime || !campaign?.endTime) {
      return ["Thứ Bảy", "Chủ Nhật"];
    }
    const start = new Date(campaign.startTime);
    const end = new Date(campaign.endTime);
    const days: string[] = [];
    const current = new Date(start);
    // Limit to max 5 days to avoid UI overflow
    while (current <= end && days.length < 5) {
      const dayStr = current.toLocaleDateString("vi-VN", {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
      });
      days.push(dayStr);
      current.setDate(current.getDate() + 1);
    }
    return days;
  }, [campaign?.startTime, campaign?.endTime]);

  const timeShifts = ["Sáng (07:30-11:30)", "Chiều (13:30-17:30)", "Tối (18:00-21:00)"];

  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);

  const handleToggleSlot = (day: string, shift: string) => {
    const slotLabel = `${day} - ${shift}`;
    setSelectedSlots((prev) => {
      const newSlots = prev.includes(slotLabel)
        ? prev.filter((s) => s !== slotLabel)
        : [...prev, slotLabel];

      setAvailabilityHours(newSlots.join(", "));
      return newSlots;
    });
  };

  useEffect(() => {
    if (join && isAuthenticated && campaign?.canJoin && campaign?.status === "recruiting") {
      setShowJoinModal(true);
      navigate({
        search: (prev) => ({ ...prev, join: undefined }),
        replace: true,
      });
    }
  }, [join, isAuthenticated, campaign, navigate]);

  if (isGroupChatRoute) {
    return <Outlet />;
  }

  if (!campaign) {
    return (
      <main className="min-h-screen bg-[#F8F7FF] px-4 py-10">
        <section className="mx-auto max-w-3xl rounded-2xl border border-violet-100 bg-white p-8 text-center shadow-md">
          <h1 className="text-2xl font-black text-slate-900">Không tìm thấy chiến dịch</h1>
          <Link
            to="/campaigns"
            onClick={(event) => {
              if (onBack) {
                event.preventDefault();
                onBack();
              }
            }}
            className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#7C3AED]"
          >
            <ArrowLeft size={16} />
            Quay lại danh sách
          </Link>
        </section>
      </main>
    );
  }

  const progressPercent =
    campaign.target > 0
      ? Math.min(100, Math.round((campaign.participants / campaign.target) * 100))
      : 0;
  const approvedStatus =
    campaign.currentUserJoinStatus === "APPROVED" ||
    campaign.currentUserJoinStatus === "CONFIRMED" ||
    campaign.currentUserJoinStatus === "MAYBE";

  const handleSendOtp = async () => {
    try {
      await sendEmailOtp.mutateAsync();
      setOtpSent(true);
      toast.success(
        "Mã OTP đã được gửi thành công đến Gmail của bạn. Vui lòng kiểm tra hộp thư (hoặc console log).",
      );
    } catch (error: any) {
      toast.error(error?.message || "Không thể gửi OTP. Vui lòng thử lại.");
    }
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) {
      toast.error("Vui lòng nhập mã xác thực OTP.");
      return;
    }
    try {
      await joinCampaign.mutateAsync({
        id: campaign.id,
        volunteerExperience: volunteerExperience.trim() || undefined,
        availabilityHours: availabilityHours.trim() || undefined,
        otpCode: otpCode.trim(),
      });
      toast.success("Tham gia và kết nối chat chiến dịch thành công!");
      setShowJoinModal(false);
      setVolunteerExperience("");
      setAvailabilityHours("");
      setOtpCode("");
      setOtpSent(false);
      navigate({
        to: "/campaigns/$id/group-chat",
        params: { id: campaign.id },
      });
    } catch (error: any) {
      toast.error(error?.message || "Đăng ký không thành công. Vui lòng kiểm tra lại mã OTP.");
    }
  };

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveReason.trim()) {
      toast.error("Vui lòng nhập lý do hủy tham gia.");
      return;
    }
    try {
      await leaveCampaign.mutateAsync({
        id: campaign.id,
        reason: leaveReason.trim(),
      });
      toast.success("Hủy đăng ký tham gia chiến dịch thành công.");
      setShowLeaveModal(false);
      setLeaveReason("");
    } catch (error: any) {
      toast.error(error?.message || "Không thể hủy tham gia chiến dịch.");
    }
  };

  const handleConfirmWaitlist = async () => {
    try {
      await confirmWaitlist.mutateAsync(campaign.id);
      toast.success("Xác nhận tham gia chính thức thành công!");
    } catch (error: any) {
      toast.error(error?.message || "Xác nhận không thành công.");
    }
  };

  const handleApprove = async () => {
    await approveCampaign.mutateAsync(campaign.id);
    toast.success("Đã phê duyệt chiến dịch và mở đăng ký.");
  };

  return (
    <main className={`min-h-screen ${theme.mainBg} pb-16 text-slate-950`}>
      <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-center justify-between gap-4">
          <Link
            to="/campaigns"
            onClick={(event) => {
              if (onBack) {
                event.preventDefault();
                onBack();
              }
            }}
            className={`inline-flex items-center gap-2 text-sm font-black text-slate-600 transition ${theme.textHoverPrimary}`}
          >
            <ArrowLeft size={16} />
            Chiến dịch
          </Link>
          <div className="flex items-center gap-2">
            {user?.role === "WARD_STAFF" && !campaign.canManage && (
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
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-black text-white hover:bg-emerald-700 transition active:scale-[0.97] cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 size={13} />
                      Lưu
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-black text-slate-700 hover:bg-slate-300 transition active:scale-[0.97] cursor-pointer"
                    >
                      Hủy
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-black text-white shadow-sm transition ${theme.primaryBg} ${theme.primaryHover} active:scale-[0.97] cursor-pointer`}
                  >
                    Chỉnh sửa
                  </button>
                )}
              </>
            )}
            <StatusBadge status={campaign.status} theme={theme} />
          </div>
        </div>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,65fr)_minmax(320px,35fr)]">
          <article className="space-y-6">
            {isEditing ? (
              <div className="space-y-6">
                <section className={`rounded-2xl border ${theme.lightBorder} bg-white p-7 shadow-md`}>
                  <h2 className="mb-4 text-xl font-black text-slate-950">Thông tin chung</h2>
                  <div className="space-y-5">
                    <div>
                      <label className={`mb-1.5 block text-sm font-black ${isWard ? "text-slate-700" : "text-[#0B2545]"}`}>Tên chiến dịch</label>
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className={`w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition ${theme.focusRing}`}
                        placeholder="Ví dụ: Dọn rác bãi biển Mỹ Khê..."
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className={`mb-1.5 block text-sm font-black ${isWard ? "text-slate-700" : "text-[#0B2545]"}`}>Danh mục</label>
                        <select
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value)}
                          className={`w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition ${theme.focusRing}`}
                        >
                          <option value="environment">Môi trường</option>
                          <option value="infrastructure">Hạ tầng</option>
                          <option value="public_safety">An toàn cộng đồng</option>
                          <option value="construction">Xây dựng</option>
                          <option value="fire_safety">Phòng cháy chữa cháy</option>
                        </select>
                      </div>

                      <div>
                        <label className={`mb-1.5 block text-sm font-black ${isWard ? "text-slate-700" : "text-[#0B2545]"}`}>Tình nguyện viên cần tuyển</label>
                        <input
                          value={editTarget}
                          onChange={(e) => setEditTarget(e.target.value)}
                          className={`w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition ${theme.focusRing} font-mono`}
                          type="number"
                          min="1"
                        />
                      </div>
                    </div>

                    <div>
                      <label className={`mb-1.5 block text-sm font-black ${isWard ? "text-slate-700" : "text-[#0B2545]"}`}>Mô tả chi tiết chiến dịch</label>
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className={`w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition ${theme.focusRing} min-h-32 leading-relaxed`}
                        placeholder="Mục đích, thông điệp truyền tải..."
                      />
                    </div>
                  </div>
                </section>

                <section className={`rounded-2xl border ${theme.lightBorder} bg-white p-7 shadow-md`}>
                  <h2 className="mb-4 text-xl font-black text-slate-950">Lịch và địa điểm</h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className={`mb-1.5 block text-sm font-black ${isWard ? "text-slate-700" : "text-[#0B2545]"}`}>Thời gian bắt đầu</label>
                      <input
                        type="datetime-local"
                        value={editStartTime}
                        onChange={(e) => setEditStartTime(e.target.value)}
                        className={`w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition ${theme.focusRing} font-mono`}
                      />
                    </div>
                    <div>
                      <label className={`mb-1.5 block text-sm font-black ${isWard ? "text-slate-700" : "text-[#0B2545]"}`}>Thời gian kết thúc</label>
                      <input
                        type="datetime-local"
                        value={editEndTime}
                        onChange={(e) => setEditEndTime(e.target.value)}
                        className={`w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition ${theme.focusRing} font-mono`}
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className={`mb-1.5 block text-sm font-black ${isWard ? "text-slate-700" : "text-[#0B2545]"}`}>Địa chỉ cụ thể (Địa điểm)</label>
                    <input
                      value={editLocationText}
                      onChange={(e) => setEditLocationText(e.target.value)}
                      className={`w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition ${theme.focusRing}`}
                      placeholder="Nhập địa chỉ, phường hoặc quận tại Đà Nẵng"
                    />
                  </div>
                </section>

                <section className="rounded-2xl border border-amber-200 bg-[#FFFBF0] p-7 shadow-md">
                  <h2 className="mb-4 text-xl font-black text-amber-900">Thông tin nội bộ</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-black text-amber-800">Điểm tập trung / Hẹn gặp</label>
                      <textarea
                        value={editPrivateLocationText}
                        onChange={(e) => setEditPrivateLocationText(e.target.value)}
                        className={`w-full rounded-lg border border-amber-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition ${theme.focusRing} min-h-24 leading-relaxed`}
                        placeholder="Điểm hẹn tập trung chi tiết chỉ hiển thị cho tình nguyện viên được duyệt..."
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-black text-amber-800">Công cụ cần mang theo</label>
                      <textarea
                        value={editRequiredTools}
                        onChange={(e) => setEditRequiredTools(e.target.value)}
                        className={`w-full rounded-lg border border-amber-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition ${theme.focusRing} min-h-24 leading-relaxed`}
                        placeholder="Các dụng cụ bắt buộc/khuyến khích tự mang theo..."
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-black text-amber-800">Người phụ trách / SĐT</label>
                      <input
                        value={editOrganizerContact}
                        onChange={(e) => setEditOrganizerContact(e.target.value)}
                        className={`w-full rounded-lg border border-amber-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition ${theme.focusRing}`}
                        placeholder="Họ tên người phụ trách và số điện thoại liên hệ..."
                      />
                    </div>
                  </div>
                </section>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 hover:bg-slate-50 transition active:scale-[0.97] cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={updateCampaign.isPending}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-black text-white shadow-sm transition ${theme.primaryBg} ${theme.primaryHover} active:scale-[0.97] cursor-pointer disabled:opacity-50`}
                  >
                    {updateCampaign.isPending ? "Đang lưu..." : "Lưu thay đổi"}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="relative aspect-[21/9] overflow-hidden rounded-2xl shadow-lg">
                  <img
                    src={campaign.cover || defaultHeroImage}
                    alt={campaign.name}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                  <h1 className={`absolute bottom-6 left-6 right-6 text-2xl font-black leading-tight text-white md:text-[28px] ${isWard ? "font-sans" : ""}`}>
                    {campaign.name}
                  </h1>
                </div>

                <section className={`rounded-2xl border ${theme.lightBorder} bg-white p-7 shadow-md`}>
                  <p className="text-base leading-8 text-slate-600">
                    {campaign.desc || "Chưa có mô tả công khai."}
                  </p>

                  <div className="mt-6 grid gap-3 md:grid-cols-3">
                    <InfoTile
                      icon={MapPin}
                      label="Khu vực"
                      value={campaign.locationText || campaign.ward}
                      theme={theme}
                    />
                    <InfoTile
                      icon={Users}
                      label="Người tham gia"
                      value={`${campaign.participants}/${campaign.target}${
                        (campaign as any).minParticipants ? ` (tối thiểu ${(campaign as any).minParticipants})` : ''
                      }`}
                      theme={theme}
                    />
                    <InfoTile icon={CalendarDays} label="Thời gian" value={dateRange(campaign)} theme={theme} />
                  </div>

                  <div className={`mt-7 rounded-xl ${theme.lightBg} p-5`}>
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-black text-slate-900">Tiến độ tuyển quân</p>
                        <p className="text-xs font-semibold text-slate-500">
                          Cập nhật theo số lượng người được duyệt tham gia.
                        </p>
                      </div>
                      <span className={`rounded-full bg-white px-3 py-1 text-xs font-black ${theme.primaryText} shadow-sm`}>
                        {campaign.participants}/{campaign.target} ({progressPercent}%)
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-white">
                      <div
                        className="h-full rounded-full bg-[#10B981] transition-all duration-700"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </section>

                <Panel title="Về chiến dịch này" icon={ListIcon} theme={theme}>
                  <p className="text-sm leading-7 text-slate-600">
                    Chiến dịch được phát động nhằm kêu gọi cộng đồng chung tay dọn dẹp bãi biển Xuân
                    Thiều, một trong những bãi biển đẹp của Đà Nẵng. Hoạt động gồm thu gom rác thải
                    nhựa, phân loại rác tại chỗ, trồng cây ven biển và tuyên truyền bảo vệ môi trường.
                    Đây là cơ hội để người dân Đà Nẵng thể hiện tình yêu quê hương và ý thức bảo vệ
                    thiên nhiên.
                  </p>
                </Panel>

                {campaign.privateDetailsVisible ? (
                  <PrivateDetails campaign={campaign} theme={theme} />
                ) : (
                  <section className="rounded-2xl border border-dashed border-amber-200 bg-[#FFFBF0] p-6 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700">
                        <Lock size={20} />
                      </div>
                      <div>
                        <h2 className="font-black text-slate-900">Thông tin nội bộ được bảo mật</h2>
                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          Vị trí tập trung cụ thể, dụng cụ, liên hệ ban tổ chức và group chat chỉ hiển
                          thị cho người đã được duyệt tham gia hoặc người quản lý chiến dịch.
                        </p>
                      </div>
                    </div>
                  </section>
                )}
              </>
            )}

            <MapPanel campaign={campaign} theme={theme} />
          </article>

          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            {user?.role === Role.SUPER_ADMIN && campaign.status === "pending_review" && (
              <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-lg">
                <div className="mb-3 flex items-center gap-2 font-black text-amber-800">
                  <ShieldCheck size={18} />
                  Cần phê duyệt
                </div>
                <p className="mb-4 text-sm leading-6 text-amber-800">
                  Chiến dịch đang chờ lãnh đạo thành phố phê duyệt trước khi mở đăng ký cho người
                  dân.
                </p>
                <button
                  onClick={handleApprove}
                  disabled={approveCampaign.isPending}
                  className="h-11 w-full rounded-xl bg-amber-600 text-sm font-black text-white transition hover:brightness-110 active:scale-[0.97] disabled:opacity-60"
                >
                  Phê duyệt và mở đăng ký
                </button>
              </section>
            )}

            <section className={`rounded-2xl border ${theme.lightBorder} bg-white p-6 shadow-lg`}>
              <h2 className="mb-4 text-sm font-black uppercase tracking-wider text-slate-500">
                Hành động
              </h2>
              {campaign.canManage && campaign.status === "recruiting" && (
                <button
                  onClick={handleFinalizeCampaign}
                  disabled={finalizeCampaign.isPending}
                  className="mb-3 h-12 w-full rounded-xl bg-indigo-600 text-sm font-black text-white shadow-md transition hover:bg-indigo-700 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {finalizeCampaign.isPending ? "Đang xử lý..." : "Chốt chiến dịch"}
                </button>
              )}
              {campaign.canManage && (campaign.status === "recruiting" || campaign.status === "inProgress") && (
                <button
                  onClick={handleEndCampaign}
                  disabled={endCampaign.isPending}
                  className="mb-3 h-12 w-full rounded-xl bg-red-600 text-sm font-black text-white shadow-md transition hover:bg-red-700 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {endCampaign.isPending ? "Đang xử lý..." : "Kết thúc chiến dịch"}
                </button>
              )}
              {(campaign.status === "recruiting" ||
                campaign.status === "completed" ||
                campaign.status === "ended" ||
                campaign.status === "inProgress") && (
                  <div
                    title={campaign.status !== "recruiting" ? "Chiến dịch đã đóng" : undefined}
                    className="w-full"
                  >
                    {hasJoined ? (
                      <Link
                        to="/campaigns/$id/group-chat"
                        params={{ id: campaign.id }}
                        className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#7C3AED] text-sm font-black text-white shadow-sm transition hover:brightness-110"
                      >
                        Vào nhóm chat
                      </Link>
                    ) : (
                      <button
                        onClick={() => {
                          if (!isAuthenticated) {
                            toast.error("Vui lòng đăng nhập để tham gia chiến dịch.");
                            return;
                          }
                          setShowJoinModal(true);
                        }}
                        disabled={
                          campaign.status !== "recruiting" ||
                          joinCampaign.isPending
                        }
                        className="h-12 w-full rounded-xl bg-[#7C3AED] text-sm font-black text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Đăng ký & Vào Chat
                      </button>
                    )}
                  </div>
                )}

              {campaign.currentUserJoinStatus === "PENDING_CONFIRM" && (
                <button
                  type="button"
                  onClick={handleConfirmWaitlist}
                  disabled={confirmWaitlist.isPending}
                  className="mt-3 h-12 w-full rounded-xl bg-emerald-600 text-sm font-black text-white shadow-md transition hover:brightness-110 active:scale-[0.97] disabled:opacity-50"
                >
                  Xác nhận tham gia chính thức
                </button>
              )}

              {campaign.canLeave && (
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(true)}
                  className="mt-3 h-11 w-full rounded-xl border border-red-200 bg-red-50 text-sm font-black text-red-700 shadow-sm transition hover:bg-red-100 active:scale-[0.97]"
                >
                  Hủy tham gia
                </button>
              )}

              {campaign.currentUserJoinStatus && (
                <div className="mt-4 inline-flex w-full items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">
                  <CheckCircle2 size={16} />
                  Trạng thái: {joinLabel(campaign.currentUserJoinStatus)}
                </div>
              )}

              <div className="mt-4 inline-flex w-full items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm font-black text-amber-700">
                <Clock3 size={16} />
                {campaign.daysLeft > 0
                  ? `Còn ${campaign.daysLeft} ngày để đăng ký`
                  : "Đợt đăng ký đã kết thúc"}
              </div>

              {!isAuthenticated && (
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  Đăng nhập để đăng ký tham gia, bình luận và truy cập group chat khi được duyệt.
                </p>
              )}
            </section>

            {campaign.canManage && <ParticipantReviewPanel campaignId={campaign.id} theme={theme} />}

            <section className={`rounded-2xl border ${theme.lightBorder} bg-white p-6 shadow-lg`}>
              <h2 className="mb-4 text-sm font-black uppercase tracking-wider text-slate-500">
                Người phụ trách
              </h2>
              <div className="flex items-center gap-3">
                <div className={`grid h-14 w-14 place-items-center rounded-full ${theme.avatarBg} text-lg font-black ${theme.avatarText}`}>
                  CB
                </div>
                <div>
                  <p className="font-black text-slate-900">{campaign.createdBy}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-500">{campaign.ward}</p>
                </div>
              </div>
              <button
                type="button"
                className={`mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border ${theme.lightBorder} text-sm font-black ${theme.primaryText} transition ${theme.lightBgHover} active:scale-[0.97]`}
              >
                <MessageCircle size={16} />
                Nhắn tin
              </button>
            </section>

            <GroupChatNavigationCard campaign={campaign} approvedStatus={approvedStatus} theme={theme} hasJoined={hasJoined} onJoinClick={() => setShowJoinModal(true)} isAuthenticated={isAuthenticated} />
            <ShareCard theme={theme} />
          </aside>
        </section>
      </div>

      {/* Smart Join Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-black text-slate-900 mb-4">Đăng ký tham gia chiến dịch</h3>
            <form onSubmit={handleJoinSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-1">
                  Họ và tên
                </label>
                <input
                  type="text"
                  value={user?.fullName || ""}
                  disabled
                  className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500 font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-1">
                  Email nhận OTP
                </label>
                <input
                  type="text"
                  value={user?.email || ""}
                  disabled
                  className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500 font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-1">
                  Kinh nghiệm tình nguyện (tùy chọn)
                </label>
                <textarea
                  value={volunteerExperience}
                  onChange={(e) => setVolunteerExperience(e.target.value)}
                  placeholder="Ví dụ: Đã tham gia 2 chiến dịch dọn rác bãi biển..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]/20 outline-none"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-2">
                  Chọn khung giờ rảnh tham gia (theo thời gian chiến dịch)
                </label>
                <div className="space-y-3">
                  {campaignDays.map((day) => (
                    <div key={day} className="space-y-1.5">
                      <span className="text-xs font-black text-slate-700">{day}</span>
                      <div className="flex flex-wrap gap-2">
                        {timeShifts.map((shift) => {
                          const slotLabel = `${day} - ${shift}`;
                          const isSelected = selectedSlots.includes(slotLabel);
                          return (
                            <button
                              key={shift}
                              type="button"
                              onClick={() => handleToggleSlot(day, shift)}
                              className={`h-8 px-2.5 rounded-lg border text-xs font-semibold transition ${isSelected
                                ? "bg-[#7C3AED] text-white border-[#7C3AED] shadow-sm"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                }`}
                            >
                              {shift.split(" ")[0]}{" "}
                              <span className="text-[10px] opacity-80">{shift.split(" ")[1]}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                {selectedSlots.length > 0 && (
                  <p className="mt-2 text-xs font-semibold text-[#7C3AED]">
                    Đã chọn: {availabilityHours}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-1">
                  Xác thực OTP qua Gmail
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="Nhập mã OTP 6 số"
                    maxLength={6}
                    className="flex-1 h-10 rounded-lg border border-slate-200 px-3 text-sm focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]/20 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={sendEmailOtp.isPending}
                    className="h-10 px-4 rounded-lg bg-[#7C3AED] text-xs font-black text-white hover:brightness-110 disabled:opacity-50 transition"
                  >
                    {otpSent ? "Gửi lại OTP" : "Gửi mã OTP"}
                  </button>
                </div>
                <p className="mt-1 text-[10px] font-semibold text-slate-400">
                  Mã OTP sẽ được gửi về địa chỉ email đăng ký tài khoản của bạn.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseJoinModal}
                  className="h-10 px-4 rounded-lg border border-slate-200 text-sm font-black text-slate-600 hover:bg-slate-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={joinCampaign.isPending || !otpCode}
                  className="h-10 px-5 rounded-lg bg-emerald-600 text-sm font-black text-white hover:brightness-110 disabled:opacity-50"
                >
                  Xác nhận & Đăng ký
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hủy tham gia Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-black text-slate-900 mb-4">Hủy đăng ký tham gia</h3>
            <p className="text-sm text-slate-500 mb-4 leading-relaxed font-semibold">
              Vui lòng nhập lý do hủy đăng ký tham gia chiến dịch này. Lưu ý bạn chỉ được hủy trước
              12 giờ chiến dịch bắt đầu và không thể hủy 2 lần liên tiếp.
            </p>
            <form onSubmit={handleLeaveSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-1">
                  Lý do hủy tham gia
                </label>
                <textarea
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="Nhập lý do chi tiết..."
                  required
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]/20 outline-none"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(false)}
                  className="h-10 px-4 rounded-lg border border-slate-200 text-sm font-black text-slate-600 hover:bg-slate-50"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={leaveCampaign.isPending || !leaveReason.trim()}
                  className="h-10 px-5 rounded-lg bg-red-600 text-sm font-black text-white hover:brightness-110 disabled:opacity-50"
                >
                  Xác nhận Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
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
  const approvedParticipants = participants.filter(
    (p) => p.joinStatus === "APPROVED" || p.joinStatus === "PENDING_CONFIRM",
  );
  const cancelledParticipants = participants.filter(
    (p) => p.joinStatus === "CANCELLED" || p.joinStatus === "REJECTED",
  );

  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "cancelled">("pending");
  const [expandedApprovedId, setExpandedApprovedId] = useState<number | null>(null);

  // Filters state
  const [minPastCampaigns, setMinPastCampaigns] = useState<number>(0);
  const [minRating, setMinRating] = useState<number>(0);
  const [noShowOnly, setNoShowOnly] = useState<boolean>(false);

  // Selection state for batch approval
  const [selectedIds, setSelectedIds] = useState<Record<number, boolean>>({});

  // Filter pending list
  const filteredPending = pendingParticipants.filter((p) => {
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      filteredPending.forEach((p) => {
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      toast.error((error as any)?.message || "Lỗi khi duyệt hàng loạt.");
    }
  };

  const isAllSelected =
    filteredPending.length > 0 && filteredPending.every((p) => selectedIds[p.id]);

  return (
    <section className={`rounded-2xl border ${theme.lightBorder} bg-white p-5 shadow-lg space-y-4`}>
      {/* Tabs */}
      <div className="flex border-b border-slate-100">
        <button
          type="button"
          onClick={() => setActiveTab("pending")}
          className={`flex-1 pb-3 text-sm font-black transition-all ${activeTab === "pending"
            ? "border-b-2 border-[#7C3AED] text-[#7C3AED]"
            : "text-slate-500 hover:text-slate-800"
            }`}
        >
          Đang chờ ({pendingParticipants.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("approved")}
          className={`flex-1 pb-3 text-sm font-black transition-all ${activeTab === "approved"
            ? "border-b-2 border-[#7C3AED] text-[#7C3AED]"
            : "text-slate-500 hover:text-slate-800"
            }`}
        >
          Đã duyệt ({approvedParticipants.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("cancelled")}
          className={`flex-1 pb-3 text-sm font-black transition-all ${activeTab === "cancelled"
            ? "border-b-2 border-[#7C3AED] text-[#7C3AED]"
            : "text-slate-500 hover:text-slate-800"
            }`}
        >
          Đã hủy & Từ chối ({cancelledParticipants.length})
        </button>
      </div>

      {activeTab === "pending" && (
        <div className="space-y-4">
          {/* Filters Panel */}
          <div className={`rounded-xl ${theme.mainBg} p-3.5 border ${theme.lightBorder} space-y-3`}>
            <div className={`flex items-center gap-2 text-xs font-black uppercase ${theme.primaryText}`}>
              <Filter size={14} />
              Bộ lọc nâng cao
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                  Đã tham gia tối thiểu
                </label>
                <select
                  value={minPastCampaigns}
                  onChange={(e) => setMinPastCampaigns(Number(e.target.value))}
                  className={`w-full h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold ${theme.focusRing} outline-none`}
                >
                  <option value={0}>0 chiến dịch</option>
                  <option value={1}>1 chiến dịch</option>
                  <option value={3}>3 chiến dịch</option>
                  <option value={5}>5 chiến dịch</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                  Đánh giá trung bình
                </label>
                <select
                  value={minRating}
                  onChange={(e) => setMinRating(Number(e.target.value))}
                  className={`w-full h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold ${theme.focusRing} outline-none`}
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
                className={`h-3.5 w-3.5 rounded border-slate-300 ${theme.primaryText} ${theme.focusRing}`}
              />
              <span className="text-xs font-semibold text-slate-600">
                Chỉ hiện người có cảnh báo (No-show &gt; 2)
              </span>
            </label>
          </div>

          {/* Batch Approve Control */}
          {filteredPending.length > 0 && (
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className={`h-3.5 w-3.5 rounded border-slate-300 ${theme.primaryText} ${theme.focusRing}`}
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

          {participantsQuery.isLoading ? (
            <p className="rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-500">
              Đang tải yêu cầu...
            </p>
          ) : filteredPending.length === 0 ? (
            <p className="rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-500 text-center">
              Không tìm thấy yêu cầu phù hợp với bộ lọc.
            </p>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {filteredPending.map((p) => {
                const isFlagged = p.noShowCount > 2;
                return (
                  <div
                    key={p.id}
                    className={`rounded-xl border p-3.5 transition space-y-3 ${isFlagged
                      ? "border-red-200 bg-red-50/70 shadow-sm"
                      : "border-slate-200 bg-white"
                      }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        checked={!!selectedIds[p.id]}
                        onChange={() => handleToggleSelect(p.id)}
                        className={`mt-1 h-3.5 w-3.5 rounded border-slate-300 ${theme.primaryText} ${theme.focusRing}`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-black text-slate-900 truncate">{p.citizenName}</p>
                          {isFlagged && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-red-100 px-1.5 py-0.5 text-[9px] font-black text-red-700">
                              <AlertTriangle size={10} />
                              LỊCH SỬ XẤU ({p.noShowCount} vắng)
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
                          Đăng ký lúc {formatDateTime(p.createdAt)}
                        </p>

                        {/* Additional stats */}
                        <div className="mt-2 flex gap-3 text-[11px] font-semibold text-slate-500">
                          <span className="flex items-center gap-1">
                            <History size={12} />
                            Đã tham gia: {p.pastCampaignCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <Award size={12} />
                            Đánh giá: {p.averageRating ? `${p.averageRating}★` : "Chưa có"}
                          </span>
                        </div>

                        {/* Experience and Availability info */}
                        {(p.volunteerExperience || p.availabilityHours) && (
                          <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-1 text-xs">
                            {p.volunteerExperience && (
                              <p className="text-slate-600 leading-relaxed">
                                <span className="font-black text-slate-700">Kinh nghiệm:</span>{" "}
                                {p.volunteerExperience}
                              </p>
                            )}
                            {p.availabilityHours && (
                              <p className="text-slate-600 leading-relaxed">
                                <span className="font-black text-slate-700">Thời gian rảnh:</span>{" "}
                                {p.availabilityHours}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleReject(p)}
                        disabled={rejectParticipant.isPending || approveParticipant.isPending}
                        className="h-8.5 rounded-lg border border-red-200 bg-red-50 text-xs font-black text-red-700 hover:bg-red-100 disabled:opacity-50 transition active:scale-[0.97]"
                      >
                        Từ chối
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApprove(p)}
                        disabled={approveParticipant.isPending || rejectParticipant.isPending}
                        className="h-8.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-black text-white disabled:opacity-50 transition active:scale-[0.97]"
                      >
                        Duyệt
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === "approved" && (
        <div className="space-y-3">
          {participantsQuery.isLoading ? (
            <p className="rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-500">
              Đang tải danh sách...
            </p>
          ) : approvedParticipants.length === 0 ? (
            <p className="rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-500 text-center">
              Chưa có tình nguyện viên nào trong danh sách duyệt.
            </p>
          ) : (
            <div className="space-y-2.5 max-h-[450px] overflow-y-auto pr-1">
              {approvedParticipants.map((p) => {
                const isPendingConfirm = p.joinStatus === "PENDING_CONFIRM";
                const isExpanded = expandedApprovedId === p.id;
                return (
                  <div
                    key={p.id}
                    className="rounded-xl border border-slate-200 bg-white p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div
                        className="min-w-0 flex-1 cursor-pointer"
                        onClick={() => setExpandedApprovedId(isExpanded ? null : p.id)}
                      >
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-black text-slate-900 truncate flex items-center gap-1">
                            {p.citizenName}
                            <span className={`text-[10px] ${theme.primaryText}`}>
                              {isExpanded ? "▲ Thu gọn" : "▼ Chi tiết"}
                            </span>
                          </p>
                          {isPendingConfirm ? (
                            <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[9px] font-black text-amber-700 border border-amber-200">
                              Chờ xác nhận
                            </span>
                          ) : (
                            <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[9px] font-black text-emerald-700 border border-emerald-100">
                              Đã tham gia
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
                          Duyệt lúc{" "}
                          {p.approvedAt ? formatDateTime(p.approvedAt) : "Hệ thống tự động"}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleMarkAbsent(p)}
                        disabled={markNoShow.isPending}
                        className="h-8 px-2.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-[11px] font-black flex items-center gap-1 transition disabled:opacity-50"
                        title="Đánh dấu vắng mặt không lý do"
                      >
                        <UserX size={12} />
                        Vắng mặt
                      </button>
                    </div>

                    {isExpanded && (p.volunteerExperience || p.availabilityHours) && (
                      <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
                        {p.volunteerExperience && (
                          <p className="text-slate-600 leading-relaxed">
                            <span className="font-black text-slate-700">Kinh nghiệm:</span>{" "}
                            {p.volunteerExperience}
                          </p>
                        )}
                        {p.availabilityHours && (
                          <p className="text-slate-600 leading-relaxed">
                            <span className="font-black text-slate-700">Thời gian rảnh:</span>{" "}
                            {p.availabilityHours}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === "cancelled" && (
        <div className="space-y-3">
          {participantsQuery.isLoading ? (
            <p className="rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-500">
              Đang tải danh sách...
            </p>
          ) : cancelledParticipants.length === 0 ? (
            <p className="rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-500 text-center">
              Chưa có lịch sử hủy hoặc từ chối tham gia.
            </p>
          ) : (
            <div className="space-y-2.5 max-h-[450px] overflow-y-auto pr-1">
              {cancelledParticipants.map((p) => {
                const isRejected = p.joinStatus === "REJECTED";
                return (
                  <div
                    key={p.id}
                    className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-black text-slate-900 truncate">{p.citizenName}</p>
                          {isRejected ? (
                            <span className="rounded-md bg-red-50 px-1.5 py-0.5 text-[9px] font-black text-red-700 border border-red-100">
                              Bị từ chối
                            </span>
                          ) : (
                            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-black text-slate-600 border border-slate-200">
                              Đã hủy tham gia
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
                          {isRejected ? (
                            <>Từ chối lúc {p.rejectedAt ? formatDateTime(p.rejectedAt) : ""}</>
                          ) : (
                            <>
                              Thời gian hủy:{" "}
                              {p.cancelledAt
                                ? formatDateTime(p.cancelledAt)
                                : p.createdAt
                                  ? formatDateTime(p.createdAt)
                                  : ""}
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="pt-1.5 border-t border-slate-100 space-y-1 text-xs">
                      {isRejected
                        ? p.rejectionReason && (
                          <p className="text-red-600 leading-relaxed">
                            <span className="font-black text-red-700">Lý do từ chối:</span>{" "}
                            {p.rejectionReason}
                          </p>
                        )
                        : p.cancellationReason && (
                          <p className="text-slate-600 leading-relaxed">
                            <span className="font-black text-slate-700">Lý do hủy:</span>{" "}
                            {p.cancellationReason}
                          </p>
                        )}
                      {p.volunteerExperience && (
                        <p className="text-slate-500 leading-relaxed text-[11px]">
                          <span className="font-black text-slate-500">Kinh nghiệm ban đầu:</span>{" "}
                          {p.volunteerExperience}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function PrivateDetails({ campaign, theme }: { campaign: Campaign; theme: any }) {
  return (
    <section className="rounded-2xl border border-amber-300 bg-[#FFFBF0] p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2 text-lg font-black text-slate-950">
        <Lock size={18} className="text-amber-600" />
        Thông tin nội bộ
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <InfoTile
          icon={MapPin}
          label="Điểm tập kết"
          value={campaign.privateLocationText || "Chưa cập nhật"}
          theme={theme}
        />
        <InfoTile
          icon={Package}
          label="Dụng cụ"
          value={campaign.requiredTools || "Chưa cập nhật"}
          theme={theme}
        />
        <InfoTile
          icon={Users}
          label="Liên hệ"
          value={campaign.organizerContact || "Chưa cập nhật"}
          theme={theme}
        />
      </div>
    </section>
  );
}

function MapPanel({ campaign, theme }: { campaign: Campaign; theme: any }) {
  const coordinates = resolveCampaignCoordinates(campaign);
  const displayLocation = campaign.locationText || coordinates.label;

  return (
    <Panel title="Vị trí hoạt động" icon={MapPin} theme={theme}>
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <SingleCampaignMap campaign={campaign} height="320px" />
        <div className="flex flex-col gap-3 border-t border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-slate-600">{displayLocation}</p>
          <a
            href={buildGoogleMapsSearchUrl(coordinates)}
            target="_blank"
            rel="noreferrer"
            className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg border ${theme.lightBorder} px-4 text-sm font-black ${theme.primaryText} transition ${theme.lightBgHover} active:scale-[0.97]`}
          >
            <Map size={16} />
            Xem trên Google Maps
          </a>
        </div>
      </div>
    </Panel>
  );
}
function DiscussionPanel({ campaign }: { campaign: Campaign }) {
  const comments = useCampaignComments(campaign.id);
  const [commentText, setCommentText] = useState("");
  const fallbackComments = [
    {
      id: "mock-1",
      authorName: "Nguyễn Văn A",
      createdAt: "10:30",
      content: "Mình đã đăng ký rồi, rất mong được tham gia!",
    },
    {
      id: "mock-2",
      authorName: "Trần Thị B",
      createdAt: "11:15",
      content: "Chiến dịch ý nghĩa quá, ủng hộ 100%!",
    },
    {
      id: "mock-3",
      authorName: "Lê Văn C",
      createdAt: "14:00",
      content: "Cho mình hỏi có cần mang theo đồ ăn không ạ?",
    },
  ];
  const visibleComments = comments.data?.length ? comments.data : fallbackComments;

  const submitComment = async () => {
    if (!commentText.trim()) return;
    await comments.addComment.mutateAsync(commentText.trim());
    setCommentText("");
  };

  return (
    <Panel title="Bình luận chiến dịch" icon={MessageCircle}>
      <div className="mb-4 space-y-3">
        {visibleComments.map((comment) => (
          <div
            key={comment.id}
            className="flex gap-3 rounded-xl border border-slate-100 bg-white p-4"
          >
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#F3F0FF] text-xs font-black text-[#7C3AED]">
              {comment.authorName.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-black text-slate-900">{comment.authorName}</p>
                <span className="text-xs font-semibold text-slate-400">
                  {comment.createdAt ? formatDisplayTime(comment.createdAt) : ""}
                </span>
              </div>
              <p className="mt-1 text-sm leading-6 text-slate-600">{comment.content}</p>
              <button
                type="button"
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-black text-slate-500 transition hover:text-[#7C3AED]"
              >
                <Heart size={14} />
                Like
              </button>
            </div>
          </div>
        ))}
      </div>
      {campaign.canComment && (
        <Composer
          value={commentText}
          onChange={setCommentText}
          onSubmit={submitComment}
          disabled={comments.addComment.isPending}
          placeholder="Nhập bình luận..."
        />
      )}
    </Panel>
  );
}

function GroupChatNavigationCard({
  campaign,
  approvedStatus,
  theme,
  hasJoined,
  onJoinClick,
  isAuthenticated,
}: {
  campaign: Campaign;
  approvedStatus: boolean;
  theme: any;
  hasJoined: boolean;
  onJoinClick: () => void;
  isAuthenticated: boolean;
}) {
  const chat = useCampaignChat(campaign.id);
  const signalAttendance = useSignalAttendance(campaign.id);
  const memberCount = Math.max(1, campaign.participants || 0);
  const latest = chat.data?.at(-1);
  const latestPreview = latest
    ? `${latest.senderName}: ${latest.message}`
    : "Cán Bộ Phường 1: Chiến dịch sẽ bắt đầu lúc 6h sáng 19/6.";
  const avatars = ["CB", "A", "B"];

  // Check if within 24h window
  const startTime = campaign.startTime ? new Date(campaign.startTime) : null;
  const now = new Date();
  const withinConfirmWindow =
    startTime !== null &&
    now < startTime &&
    now >= new Date(startTime.getTime() - 24 * 60 * 60 * 1000);

  const currentStatus = campaign.currentUserJoinStatus as string | undefined;

  const handleSignal = async (signal: "CONFIRMED" | "MAYBE") => {
    try {
      await signalAttendance.mutateAsync(signal);
      toast.success(
        signal === "CONFIRMED"
          ? "Đã xác nhận tham gia chiến dịch!"
          : "Đã chọn 'Có thể tham gia'."
      );
    } catch (err: any) {
      toast.error(err?.message || "Không thể gửi xác nhận.");
    }
  };

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
      {/* Attendance signal banner — shown 24h before startTime for APPROVED/PENDING participants */}
      {withinConfirmWindow && (currentStatus === "APPROVED" || currentStatus === "PENDING") && (
        <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3 shadow-sm">
          <div>
            <p className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Xác nhận tham gia trước 24 giờ
            </p>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Chiến dịch sắp khởi chạy. Vui lòng cập nhật khả năng tham gia của bạn để ban tổ chức chuẩn bị chu đáo.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              id="btn-confirm-attendance"
              onClick={() => handleSignal("CONFIRMED")}
              disabled={signalAttendance.isPending}
              className="flex-1 h-10 rounded-lg bg-[#7C3AED] text-xs font-black text-white shadow-sm transition hover:bg-[#6D28D9] active:scale-[0.97] disabled:opacity-50 cursor-pointer"
            >
              Xác nhận tham gia
            </button>
            <button
              id="btn-maybe-attendance"
              onClick={() => handleSignal("MAYBE")}
              disabled={signalAttendance.isPending}
              className="flex-1 h-10 rounded-lg border border-slate-200 bg-white text-xs font-black text-slate-700 transition hover:bg-slate-50 active:scale-[0.97] disabled:opacity-50 cursor-pointer"
            >
              Có thể tham gia
            </button>
          </div>
        </div>
      )}
      {withinConfirmWindow && currentStatus === "CONFIRMED" && (
        <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3.5 text-xs font-bold text-emerald-800 leading-relaxed shadow-sm">
          Bạn đã xác nhận tham gia. Vui lòng chờ cán bộ phường phê duyệt chính thức.
        </div>
      )}
      {withinConfirmWindow && currentStatus === "MAYBE" && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-100 px-4 py-3.5 text-xs font-bold text-slate-700 leading-relaxed shadow-sm">
          Bạn đã chọn khả năng Có thể tham gia chiến dịch (Không cần duyệt).
        </div>
      )}
      {hasJoined ? (
        <Link
          to="/campaigns/$id/group-chat"
          params={{ id: campaign.id }}
          className={`mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl ${theme.primaryBg} px-4 text-sm font-black text-white shadow-sm transition ${theme.primaryHover} active:scale-[0.97]`}
        >
          Vào nhóm chat
          <ArrowRight size={16} />
        </Link>
      ) : (
        <button
          onClick={() => {
            if (!isAuthenticated) {
              toast.error("Vui lòng đăng nhập để tham gia chat.");
              return;
            }
            onJoinClick();
          }}
          className={`mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl ${theme.primaryBg} px-4 text-sm font-black text-white shadow-sm transition ${theme.primaryHover} active:scale-[0.97] cursor-pointer`}
        >
          Đăng ký & Vào Chat
          <ArrowRight size={16} />
        </button>
      )}
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

function Panel({
  title,
  icon: Icon,
  children,
  theme,
}: {
  title: string;
  icon: ElementType;
  children: ReactNode;
  theme: any;
}) {
  return (
    <section className={`rounded-2xl border ${theme.lightBorder} bg-white p-6 shadow-md`}>
      <h2 className="mb-4 flex items-center gap-2 text-xl font-black text-slate-950">
        <Icon size={20} className={theme.primaryText} />
        {title}
      </h2>
      {children}
    </section>
  );
}

function Composer({
  value,
  onChange,
  onSubmit,
  disabled,
  placeholder,
  theme,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  placeholder: string;
  theme: any;
}) {
  return (
    <div className="flex gap-2">
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`h-11 min-w-0 flex-1 rounded-xl border border-slate-200 px-4 text-sm outline-none transition ${theme.focusRing}`}
        placeholder={placeholder}
      />
      <button
        type="button"
        onClick={onSubmit}
        disabled={disabled}
        className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${theme.primaryBg} text-white transition ${theme.primaryHover} active:scale-[0.97] disabled:opacity-50`}
      >
        <Send size={17} />
      </button>
    </div>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
  theme,
}: {
  icon: ElementType;
  label: string;
  value: string;
  theme: any;
}) {
  return (
    <div className={`rounded-xl border ${theme.lightBorder} ${theme.lightBg} p-4`}>
      <div className={`mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wider ${theme.primaryText}`}>
        <Icon size={15} />
        {label}
      </div>
      <p className="text-sm font-bold leading-6 text-slate-900">{value}</p>
    </div>
  );
}

function StatusBadge({ status, theme }: { status: Campaign["status"]; theme?: any }) {
  const meta = {
    pending_review: {
      label: "Chờ duyệt",
      className: "border-slate-200 bg-slate-100 text-slate-600",
    },
    recruiting: {
      label: "Đang tuyển",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
    inProgress: { label: "Đang thực hiện", className: "border-blue-200 bg-blue-50 text-blue-700" },
    completed: { label: "Hoàn thành", className: "border-violet-200 bg-violet-50 text-[#7C3AED]" },
    active: { label: "Đang hoạt động", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
    ended: { label: "Đã kết thúc", className: "border-red-200 bg-red-50 text-red-700" },
    CANCELLED: { label: "Đã hủy", className: "border-red-200 bg-red-50 text-red-700" },
    IN_PROGRESS: { label: "Đang diễn ra", className: "border-blue-200 bg-blue-50 text-blue-700" },
  }[status] ?? { label: status || "Không rõ", className: "border-slate-200 bg-slate-50 text-slate-600" };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-black shadow-sm ${meta.className}`}
    >
      <CheckCircle2 size={13} />
      {meta.label}
    </span>
  );
}

function ListIcon(props: React.ComponentProps<typeof MoreHorizontal>) {
  return <MoreHorizontal {...props} />;
}

function dateRange(campaign: Campaign) {
  const start = campaign.startTime
    ? new Date(campaign.startTime).toLocaleDateString("vi-VN")
    : "Chưa đặt";
  const end = campaign.endTime
    ? new Date(campaign.endTime).toLocaleDateString("vi-VN")
    : "Chưa đặt";
  return `${start} - ${end}`;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDisplayTime(value: string) {
  if (/^\d{2}:\d{2}$/.test(value)) return value;
  return formatDateTime(value);
}

function joinLabel(status: NonNullable<Campaign["currentUserJoinStatus"]>) {
  if (status === "APPROVED") return "Đã được duyệt";
  if (status === "PENDING") return "Chờ duyệt";
  if (status === "REJECTED") return "Bị từ chối";
  if (status === "WAITLIST") return "Đang trong danh sách chờ";
  if (status === "PENDING_CONFIRM") return "Chờ bạn xác nhận (2h)";
  if (status === "NO_SHOW") return "Vắng mặt không lý do";
  if (status === "CONFIRMED") return "Đã xác nhận tham gia";
  if (status === "MAYBE") return "Có thể tham gia";
  return "Đã hủy";
}
