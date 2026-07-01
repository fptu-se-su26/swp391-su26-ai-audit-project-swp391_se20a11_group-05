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
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  useCampaignChat,
  useCampaignComments,
  useCampaignDetail,
  useJoinCampaign,
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
import { useAuth } from "@/lib/auth";
import type { Campaign } from "@/lib/campaignStore";
import { buildGoogleMapsSearchUrl, resolveCampaignCoordinates } from "@/lib/campaignLocation";
import { SingleCampaignMap } from "@/components/site/SingleCampaignMap";

export const Route = createFileRoute("/campaigns/$id")({
  validateSearch: (search: Record<string, unknown>): { join?: boolean } => {
    return {
      join: (search.join === "true" || search.join === true) ? true : undefined,
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
  onBack?: () => void;
  initialEditMode?: boolean;
};

export function CampaignDetailPageComponent({
  campaignId,
  join = false,
  onBack,
  initialEditMode = false,
}: CampaignDetailPageComponentProps) {
  const theme = {
    primaryText: "text-[#7C3AED]",
    primaryBg: "bg-[#7C3AED]",
    primaryBorder: "border-[#7C3AED]",
    primaryHover: "hover:brightness-110",
    lightBg: "bg-[#F3F0FF]",
    lightBorder: "border-violet-100",
    lightBgHover: "hover:bg-[#F3F0FF]",
    avatarBg: "bg-[#F3F0FF]",
    avatarText: "text-[#7C3AED]",
    focusRing: "focus:border-[#7C3AED] focus:ring-[#7C3AED]/15",
    tabActive: "border-[#7C3AED] text-[#7C3AED]",
    mainBg: "bg-[#F8F7FF]",
    textHover: "hover:text-[#7C3AED]",
    textHoverPrimary: "hover:text-[#7C3AED]",
    borderDashed: "border-violet-100 bg-[#F8F7FF]",
  };

  const isGroupChatRoute = useRouterState({
    select: (state) => state.location.pathname.endsWith("/group-chat"),
  });
  const campaign = useCampaignDetail(campaignId);
  const { user, isAuthenticated } = useAuth();
  const hasJoined = !!(campaign && (
    campaign.canManage ||
    (campaign.currentUserJoinStatus && ["APPROVED", "CONFIRMED", "MAYBE", "PENDING_CONFIRM", "PENDING"].includes(campaign.currentUserJoinStatus))
  ));
  const joinCampaign = useJoinCampaign();
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

  const navigate = useNavigate({ from: "/campaigns/$id" });

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
    (campaign.currentUserJoinStatus as string) === "CONFIRMED" ||
    (campaign.currentUserJoinStatus as string) === "MAYBE";

  const handleSendOtp = async () => {
    try {
      await sendEmailOtp.mutateAsync();
      setOtpSent(true);
      toast.success(
        "Mã OTP đã được gửi thành công đến Gmail của bạn. Vui lòng kiểm tra hộp thư (hoặc console log).",
      );
    } catch (error) {
      const err = error as Error;
      toast.error(err?.message || "Không thể gửi OTP. Vui lòng thử lại.");
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
    } catch (error) {
      const err = error as Error;
      toast.error(err?.message || "Đăng ký không thành công. Vui lòng kiểm tra lại mã OTP.");
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
    } catch (error) {
      const err = error as Error;
      toast.error(err?.message || "Không thể hủy tham gia chiến dịch.");
    }
  };

  const handleConfirmWaitlist = async () => {
    try {
      await confirmWaitlist.mutateAsync(campaign.id);
      toast.success("Xác nhận tham gia chính thức thành công!");
    } catch (error) {
      const err = error as Error;
      toast.error(err?.message || "Xác nhận không thành công.");
    }
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
            <StatusBadge status={campaign.status} theme={theme} />
          </div>
        </div>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,65fr)_minmax(320px,35fr)]">
          <article className="space-y-6">
            <div className="relative aspect-[21/9] overflow-hidden rounded-2xl shadow-lg">
              <img
                src={campaign.cover || defaultHeroImage}
                alt={campaign.name}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <h1 className="absolute bottom-6 left-6 right-6 text-2xl font-black leading-tight text-white md:text-[28px]">
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
                  value={`${campaign.participants}/${campaign.target}`}
                  theme={theme}
                />
                <InfoTile
                  icon={CalendarDays}
                  label="Thời gian"
                  value={dateRange(campaign)}
                  theme={theme}
                />
              </div>

              <div className={`mt-7 rounded-xl ${theme.lightBg} p-5`}>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-black text-slate-900">Tiến độ tuyển quân</p>
                    <p className="text-xs font-semibold text-slate-500">
                      Cập nhật theo số lượng người được duyệt tham gia.
                    </p>
                  </div>
                  <span
                    className={`rounded-full bg-white px-3 py-1 text-xs font-black ${theme.primaryText} shadow-sm`}
                  >
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

            {approvedStatus || campaign.canManage ? (
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

            <MapPanel campaign={campaign} theme={theme} />
            <DiscussionPanel campaign={campaign} theme={theme} />
          </article>

          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
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

            <section className={`rounded-2xl border ${theme.lightBorder} bg-white p-6 shadow-lg`}>
              <h2 className="mb-4 text-sm font-black uppercase tracking-wider text-slate-500">
                Người phụ trách
              </h2>
              <div className="flex items-center gap-3">
                <div
                  className={`grid h-14 w-14 place-items-center rounded-full ${theme.avatarBg} text-lg font-black ${theme.avatarText}`}
                >
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

        {/* Smart Join Modal */}
        {showJoinModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-100">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-black text-slate-900">Đăng ký tham gia</h3>
                <button
                  onClick={handleCloseJoinModal}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleJoinSubmit} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">
                    Kinh nghiệm tình nguyện
                  </label>
                  <textarea
                    value={volunteerExperience}
                    onChange={(e) => setVolunteerExperience(e.target.value)}
                    placeholder="Mô tả ngắn kinh nghiệm hoặc thông tin hữu ích..."
                    className={`w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-[#7C3AED] focus:ring focus:ring-[#7C3AED]/15 min-h-[60px]`}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">
                    Thời gian có thể tham gia (Chọn ca rảnh của bạn)
                  </label>
                  <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pr-1">
                    {campaignDays.map((day) => (
                      <div
                        key={day}
                        className="rounded-lg border border-slate-100 p-2 bg-slate-50/50 space-y-1.5"
                      >
                        <span className="text-xs font-black text-slate-700">{day}</span>
                        <div className="flex flex-wrap gap-1.5">
                          {timeShifts.map((shift) => {
                            const label = `${day} - ${shift}`;
                            const isSelected = selectedSlots.includes(label);
                            return (
                              <button
                                key={shift}
                                type="button"
                                onClick={() => handleToggleSlot(day, shift)}
                                className={`rounded px-2 py-1 text-[10px] font-black transition ${
                                  isSelected
                                    ? "bg-[#7C3AED] text-white"
                                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                                }`}
                              >
                                {shift.split(" ")[0]}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-700">Mã xác nhận (OTP)</span>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={sendEmailOtp.isPending}
                      className="text-xs font-black text-[#7C3AED] hover:underline disabled:opacity-50"
                    >
                      {otpSent ? "Gửi lại mã OTP" : "Nhận mã qua Gmail"}
                    </button>
                  </div>
                  <input
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="Nhập 6 ký tự OTP"
                    maxLength={6}
                    className="w-full text-center tracking-widest font-mono font-black h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-[#7C3AED] focus:ring focus:ring-[#7C3AED]/15"
                  />
                </div>

                <button
                  type="submit"
                  disabled={joinCampaign.isPending}
                  className={`h-11 w-full rounded-xl ${theme.primaryBg} text-sm font-black text-white shadow-md transition ${theme.primaryHover} active:scale-[0.97] disabled:opacity-50`}
                >
                  {joinCampaign.isPending ? "Đang xử lý..." : "Xác nhận Đăng ký"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Leave Modal */}
        {showLeaveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-100">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-black text-slate-900">Hủy tham gia chiến dịch</h3>
                <button
                  onClick={() => setShowLeaveModal(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleLeaveSubmit} className="space-y-4">
                <p className="text-sm leading-6 text-slate-600">
                  Bạn có chắc chắn muốn rút khỏi chiến dịch này? Lưu ý việc hủy tham gia sát ngày có
                  thể ảnh hưởng đến điểm uy tín của bạn.
                </p>
                <div>
                  <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">
                    Lý do hủy tham gia
                  </label>
                  <textarea
                    value={leaveReason}
                    onChange={(e) => setLeaveReason(e.target.value)}
                    placeholder="Vui lòng cho biết lý do của bạn..."
                    required
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-red-500 focus:ring focus:ring-red-100 min-h-[80px]"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowLeaveModal(false)}
                    className="h-10 flex-1 rounded-lg border border-slate-200 text-xs font-black text-slate-700 hover:bg-slate-50"
                  >
                    Quay lại
                  </button>
                  <button
                    type="submit"
                    disabled={leaveCampaign.isPending}
                    className="h-10 flex-1 rounded-lg bg-red-600 text-xs font-black text-white hover:brightness-110 disabled:opacity-50"
                  >
                    Xác nhận Hủy
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function PrivateDetails({
  campaign,
  theme,
}: {
  campaign: Campaign;
  theme: Record<string, string>;
}) {
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

function MapPanel({ campaign, theme }: { campaign: Campaign; theme: Record<string, string> }) {
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
function DiscussionPanel({
  campaign,
  theme,
}: {
  campaign: Campaign;
  theme: Record<string, string>;
}) {
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
    <Panel title="Bình luận chiến dịch" icon={MessageCircle} theme={theme}>
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
          theme={theme}
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

function ShareCard({ theme }: { theme: Record<string, string> }) {
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
  theme: Record<string, string>;
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
  theme: Record<string, string>;
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
  theme: Record<string, string>;
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
  theme: Record<string, string>;
}) {
  return (
    <div className={`rounded-xl border ${theme.lightBorder} ${theme.lightBg} p-4`}>
      <div
        className={`mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wider ${theme.primaryText}`}
      >
        <Icon size={15} />
        {label}
      </div>
      <p className="text-sm font-bold leading-6 text-slate-900">{value}</p>
    </div>
  );
}

function StatusBadge({
  status,
  theme,
}: {
  status: Campaign["status"];
  theme?: Record<string, string>;
}) {
  const currentMeta = {
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
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-black shadow-sm ${currentMeta.className}`}
    >
      <CheckCircle2 size={13} />
      {currentMeta.label}
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

function joinLabel(status: string) {
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
