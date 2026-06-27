import { createFileRoute, Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
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
} from "@/hooks/useCampaigns";
import type { CampaignParticipantResponse } from "@/lib/api";
import { Role, useAuth } from "@/lib/auth";
import type { Campaign } from "@/lib/campaignStore";
import {
  buildGoogleMapsEmbedUrl,
  buildGoogleMapsSearchUrl,
  resolveCampaignCoordinates,
} from "@/lib/campaignLocation";

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

function CampaignDetailPage() {
  const { id } = Route.useParams();
  const { join } = Route.useSearch();
  const isGroupChatRoute = useRouterState({
    select: (state) => state.location.pathname.endsWith("/group-chat"),
  });
  const campaign = useCampaignDetail(id);
  const { user, isAuthenticated } = useAuth();
  const joinCampaign = useJoinCampaign();
  const approveCampaign = useApproveCampaign();
  const leaveCampaign = useLeaveCampaign();
  const confirmWaitlist = useConfirmWaitlist();
  const sendEmailOtp = useSendEmailOtp();

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
  const approvedStatus = campaign.currentUserJoinStatus === "APPROVED";

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
      toast.success("Đăng ký thành công! Hãy đợi cán bộ phường phê duyệt hoặc theo dõi hàng đợi.");
      setShowJoinModal(false);
      setVolunteerExperience("");
      setAvailabilityHours("");
      setOtpCode("");
      setOtpSent(false);
      navigate({
        search: (prev) => ({ ...prev, join: undefined }),
        replace: true,
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
    <main className="min-h-screen bg-[#F8F7FF] pb-16 text-slate-950">
      <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-center justify-between gap-4">
          <Link
            to="/campaigns"
            className="inline-flex items-center gap-2 text-sm font-black text-slate-600 transition hover:text-[#6D28D9]"
          >
            <ArrowLeft size={16} />
            Chiến dịch
          </Link>
          <StatusBadge status={campaign.status} />
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

            <section className="rounded-2xl border border-violet-100 bg-white p-7 shadow-md">
              <p className="text-base leading-8 text-slate-600">
                {campaign.desc || "Chưa có mô tả công khai."}
              </p>

              <div className="mt-6 grid gap-3 md:grid-cols-3">
                <InfoTile
                  icon={MapPin}
                  label="Khu vực"
                  value={campaign.locationText || campaign.ward}
                />
                <InfoTile
                  icon={Users}
                  label="Người tham gia"
                  value={`${campaign.participants}/${campaign.target}`}
                />
                <InfoTile icon={CalendarDays} label="Thời gian" value={dateRange(campaign)} />
              </div>

              <div className="mt-7 rounded-xl bg-[#F3F0FF] p-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-black text-slate-900">Tiến độ tuyển quân</p>
                    <p className="text-xs font-semibold text-slate-500">
                      Cập nhật theo số lượng người được duyệt tham gia.
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#7C3AED] shadow-sm">
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

            <Panel title="Về chiến dịch này" icon={ListIcon}>
              <p className="text-sm leading-7 text-slate-600">
                Chiến dịch được phát động nhằm kêu gọi cộng đồng chung tay dọn dẹp bãi biển Xuân
                Thiều, một trong những bãi biển đẹp của Đà Nẵng. Hoạt động gồm thu gom rác thải
                nhựa, phân loại rác tại chỗ, trồng cây ven biển và tuyên truyền bảo vệ môi trường.
                Đây là cơ hội để người dân Đà Nẵng thể hiện tình yêu quê hương và ý thức bảo vệ
                thiên nhiên.
              </p>
            </Panel>

            {campaign.privateDetailsVisible ? (
              <PrivateDetails campaign={campaign} />
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

            <MapPanel campaign={campaign} />
            <DiscussionPanel campaign={campaign} />
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
                  className="h-11 w-full rounded-xl bg-amber-600 text-sm font-black text-white transition hover:brightness-110 disabled:opacity-60"
                >
                  Phê duyệt và mở đăng ký
                </button>
              </section>
            )}

            <section className="rounded-2xl border border-violet-100 bg-white p-6 shadow-lg">
              <h2 className="mb-4 text-sm font-black uppercase tracking-wider text-slate-500">
                Hành động
              </h2>
              {(campaign.status === "recruiting" ||
                campaign.status === "completed" ||
                campaign.status === "inProgress") && (
                <div
                  title={campaign.status !== "recruiting" ? "Chiến dịch đã đóng" : undefined}
                  className="w-full"
                >
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
                      joinCampaign.isPending ||
                      !campaign.canJoin
                    }
                    className="h-12 w-full rounded-xl bg-[#7C3AED] text-sm font-black text-white shadow-md transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {campaign.currentUserJoinStatus === "PENDING"
                      ? "Đang chờ duyệt"
                      : campaign.currentUserJoinStatus === "APPROVED"
                        ? "Đã tham gia"
                        : campaign.currentUserJoinStatus === "WAITLIST"
                          ? "Đang ở danh sách chờ"
                          : campaign.currentUserJoinStatus === "PENDING_CONFIRM"
                            ? "Chờ xác nhận"
                            : campaign.status !== "recruiting"
                              ? "Chiến dịch đã đóng"
                              : "Đăng ký tham gia"}
                  </button>
                </div>
              )}

              {campaign.currentUserJoinStatus === "PENDING_CONFIRM" && (
                <button
                  type="button"
                  onClick={handleConfirmWaitlist}
                  disabled={confirmWaitlist.isPending}
                  className="mt-3 h-12 w-full rounded-xl bg-emerald-600 text-sm font-black text-white shadow-md transition hover:brightness-110 disabled:opacity-50"
                >
                  Xác nhận tham gia chính thức
                </button>
              )}

              {campaign.canLeave && (
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(true)}
                  className="mt-3 h-11 w-full rounded-xl border border-red-200 bg-red-50 text-sm font-black text-red-700 shadow-sm transition hover:bg-red-100"
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

            {campaign.canManage && <ParticipantReviewPanel campaignId={campaign.id} />}

            <section className="rounded-2xl border border-violet-100 bg-white p-6 shadow-lg">
              <h2 className="mb-4 text-sm font-black uppercase tracking-wider text-slate-500">
                Người phụ trách
              </h2>
              <div className="flex items-center gap-3">
                <div className="grid h-14 w-14 place-items-center rounded-full bg-[#F3F0FF] text-lg font-black text-[#7C3AED]">
                  CB
                </div>
                <div>
                  <p className="font-black text-slate-900">{campaign.createdBy}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-500">{campaign.ward}</p>
                </div>
              </div>
              <button
                type="button"
                className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-violet-200 text-sm font-black text-[#7C3AED] transition hover:bg-[#F3F0FF]"
              >
                <MessageCircle size={16} />
                Nhắn tin
              </button>
            </section>

            <GroupChatNavigationCard campaign={campaign} approvedStatus={approvedStatus} />
            <ShareCard />
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
                              className={`h-8 px-2.5 rounded-lg border text-xs font-semibold transition ${
                                isSelected
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

function ParticipantReviewPanel({ campaignId }: { campaignId: string }) {
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
    <section className="rounded-2xl border border-violet-100 bg-white p-5 shadow-lg space-y-4">
      {/* Tabs */}
      <div className="flex border-b border-slate-100">
        <button
          type="button"
          onClick={() => setActiveTab("pending")}
          className={`flex-1 pb-3 text-sm font-black transition-all ${
            activeTab === "pending"
              ? "border-b-2 border-[#7C3AED] text-[#7C3AED]"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Đang chờ ({pendingParticipants.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("approved")}
          className={`flex-1 pb-3 text-sm font-black transition-all ${
            activeTab === "approved"
              ? "border-b-2 border-[#7C3AED] text-[#7C3AED]"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Đã duyệt ({approvedParticipants.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("cancelled")}
          className={`flex-1 pb-3 text-sm font-black transition-all ${
            activeTab === "cancelled"
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
          <div className="rounded-xl bg-[#F8F7FF] p-3.5 border border-violet-50 space-y-3">
            <div className="flex items-center gap-2 text-xs font-black uppercase text-[#7C3AED]">
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
                  className="w-full h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold focus:border-[#7C3AED] outline-none"
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
                  className="w-full h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold focus:border-[#7C3AED] outline-none"
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
                className="h-3.5 w-3.5 rounded border-slate-300 text-[#7C3AED] focus:ring-[#7C3AED]/20"
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
                  className="h-3.5 w-3.5 rounded border-slate-300 text-[#7C3AED] focus:ring-[#7C3AED]/20"
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
                    className={`rounded-xl border p-3.5 transition space-y-3 ${
                      isFlagged
                        ? "border-red-200 bg-red-50/70 shadow-sm"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        checked={!!selectedIds[p.id]}
                        onChange={() => handleToggleSelect(p.id)}
                        className="mt-1 h-3.5 w-3.5 rounded border-slate-300 text-[#7C3AED] focus:ring-[#7C3AED]/20"
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
                        className="h-8.5 rounded-lg border border-red-200 bg-red-50 text-xs font-black text-red-700 hover:bg-red-100 disabled:opacity-50 transition"
                      >
                        Từ chối
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApprove(p)}
                        disabled={approveParticipant.isPending || rejectParticipant.isPending}
                        className="h-8.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-black text-white disabled:opacity-50 transition"
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
                            <span className="text-[10px] text-[#7C3AED]">
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

function PrivateDetails({ campaign }: { campaign: Campaign }) {
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
        />
        <InfoTile
          icon={Package}
          label="Dụng cụ"
          value={campaign.requiredTools || "Chưa cập nhật"}
        />
        <InfoTile
          icon={Users}
          label="Liên hệ"
          value={campaign.organizerContact || "Chưa cập nhật"}
        />
      </div>
    </section>
  );
}

function MapPanel({ campaign }: { campaign: Campaign }) {
  const coordinates = resolveCampaignCoordinates(campaign);
  const displayLocation = campaign.locationText || coordinates.label;

  return (
    <Panel title="Vị trí hoạt động" icon={MapPin}>
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <iframe
          title={displayLocation}
          src={buildGoogleMapsEmbedUrl(coordinates)}
          className="h-80 w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
        <div className="flex flex-col gap-3 border-t border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-slate-600">{displayLocation}</p>
          <a
            href={buildGoogleMapsSearchUrl(coordinates)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-violet-200 px-4 text-sm font-black text-[#7C3AED] transition hover:bg-[#F3F0FF]"
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
}: {
  campaign: Campaign;
  approvedStatus: boolean;
}) {
  const chat = useCampaignChat(campaign.id);
  const memberCount = Math.max(1, campaign.participants || 0);
  const latest = chat.data?.at(-1);
  const latestPreview = latest
    ? `${latest.senderName}: ${latest.message}`
    : "Cán Bộ Phường 1: Chiến dịch sẽ bắt đầu lúc 6h sáng 19/6.";
  const avatars = ["CB", "A", "B"];

  return (
    <section className="rounded-2xl border border-violet-100 bg-white p-6 shadow-lg">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-black text-slate-950">
          <MessageSquare size={17} className="text-[#7C3AED]" />
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
            className="grid h-9 w-9 place-items-center rounded-full border-2 border-white bg-[#F3F0FF] text-xs font-black text-[#7C3AED] shadow-sm"
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
        className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-4 text-sm font-black text-white shadow-sm transition hover:brightness-110"
      >
        Vào nhóm chat
        <ArrowRight size={16} />
      </Link>
    </section>
  );
}

function ShareCard() {
  return (
    <section className="rounded-2xl border border-violet-100 bg-white p-6 shadow-lg">
      <h2 className="mb-4 text-sm font-black uppercase tracking-wider text-slate-500">
        Chia sẻ chiến dịch
      </h2>
      <div className="grid grid-cols-3 gap-3">
        <IconButton label="Facebook" icon={Facebook} />
        <IconButton label="Zalo" text="Z" />
        <IconButton label="Copy link" icon={Copy} />
      </div>
    </section>
  );
}

function IconButton({
  label,
  icon: Icon,
  text,
}: {
  label: string;
  icon?: ElementType;
  text?: string;
}) {
  return (
    <button
      type="button"
      className="grid h-11 place-items-center rounded-xl border border-violet-100 bg-[#F8F7FF] text-sm font-black text-[#7C3AED] transition hover:bg-[#F3F0FF]"
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
}: {
  title: string;
  icon: ElementType;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-violet-100 bg-white p-6 shadow-md">
      <h2 className="mb-4 flex items-center gap-2 text-xl font-black text-slate-950">
        <Icon size={20} className="text-[#7C3AED]" />
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
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  placeholder: string;
}) {
  return (
    <div className="flex gap-2">
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/15"
        placeholder={placeholder}
      />
      <button
        type="button"
        onClick={onSubmit}
        disabled={disabled}
        className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#7C3AED] text-white transition hover:brightness-110 disabled:opacity-50"
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
}: {
  icon: ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-violet-100 bg-[#F3F0FF] p-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#7C3AED]">
        <Icon size={15} />
        {label}
      </div>
      <p className="text-sm font-bold leading-6 text-slate-900">{value}</p>
    </div>
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
    inProgress: { label: "Đang thực hiện", className: "border-blue-200 bg-blue-50 text-blue-700" },
    completed: { label: "Hoàn thành", className: "border-violet-200 bg-violet-50 text-[#7C3AED]" },
  }[status];

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
  return "Đã hủy";
}
