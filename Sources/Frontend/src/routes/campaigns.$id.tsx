import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import type { ElementType, ReactNode } from "react";
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Lock,
  MapPin,
  MessageCircle,
  Package,
  Send,
  ShieldCheck,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import {
  useApproveCampaign,
  useCampaignChat,
  useCampaignComments,
  useCampaignDetail,
  useJoinCampaign,
} from "@/hooks/useCampaigns";
import { Role, useAuth } from "@/lib/auth";
import type { Campaign } from "@/lib/campaignStore";

export const Route = createFileRoute("/campaigns/$id")({
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

function CampaignDetailPage() {
  const { id } = Route.useParams();
  const campaign = useCampaignDetail(id);
  const { user, isAuthenticated } = useAuth();
  const joinCampaign = useJoinCampaign();
  const approveCampaign = useApproveCampaign();

  if (!campaign) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] px-4 py-10">
        <section className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-black text-slate-900">Không tìm thấy chiến dịch</h1>
          <Link to="/campaigns" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#1E5EFF]">
            <ArrowLeft size={16} />
            Quay lại danh sách
          </Link>
        </section>
      </main>
    );
  }

  const handleJoin = async () => {
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

  const handleApprove = async () => {
    await approveCampaign.mutateAsync(campaign.id);
    toast.success("Đã phê duyệt chiến dịch và mở đăng ký.");
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-16">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/campaigns" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600">
            <ArrowLeft size={16} />
            Chiến dịch
          </Link>
          <StatusBadge status={campaign.status} />
        </div>
      </div>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_340px]">
        <article className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h1 className="text-3xl font-black tracking-tight text-slate-950">{campaign.name}</h1>
            <p className="mt-3 text-sm leading-7 text-slate-600">{campaign.desc || "Chưa có mô tả công khai."}</p>

            <div className="mt-6 grid gap-3 text-sm md:grid-cols-3">
              <InfoTile icon={MapPin} label="Khu vực" value={campaign.locationText || campaign.ward} />
              <InfoTile icon={Users} label="Người tham gia" value={`${campaign.participants}/${campaign.target}`} />
              <InfoTile icon={Calendar} label="Thời gian" value={dateRange(campaign)} />
            </div>

            {/* Premium Volunteer Recruitment Progress Bar */}
            {campaign.target > 0 && campaign.status === "recruiting" && (
              <div className="mt-6 border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between text-xs font-black text-slate-500 mb-2">
                  <span className="flex items-center gap-1">
                    <Users size={14} className="text-[#1E5EFF]" />
                    TIẾN ĐỘ TUYỂN DỤNG TÌNH NGUYỆN VIÊN
                  </span>
                  <span>{campaign.participants} / {campaign.target} người ({Math.min(100, Math.round((campaign.participants / campaign.target) * 100))}%)</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, Math.round((campaign.participants / campaign.target) * 100))}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {campaign.privateDetailsVisible ? (
            <PrivateDetails campaign={campaign} />
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  <Lock size={18} />
                </div>
                <div>
                  <h2 className="font-black text-slate-900">Thông tin nội bộ được bảo mật</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Vị trí tập trung cụ thể, dụng cụ, liên hệ ban tổ chức và group chat chỉ hiển thị cho người đã
                    được duyệt tham gia hoặc người quản lý chiến dịch.
                  </p>
                </div>
              </div>
            </div>
          )}

          {campaign.canComment && <DiscussionPanel campaignId={campaign.id} />}
        </article>

        <aside className="space-y-4">
          {user?.role === Role.SUPER_ADMIN && campaign.status === "pending_review" && (
            <section className="rounded-lg border border-amber-200 bg-amber-50 p-5">
              <div className="mb-3 flex items-center gap-2 font-black text-amber-800">
                <ShieldCheck size={18} />
                Cần phê duyệt
              </div>
              <p className="mb-4 text-sm leading-6 text-amber-800">
                Chiến dịch đang chờ lãnh đạo thành phố phê duyệt trước khi mở đăng ký cho người dân.
              </p>
              <button
                onClick={handleApprove}
                disabled={approveCampaign.isPending}
                className="h-10 w-full rounded-md bg-amber-600 text-sm font-black text-white disabled:opacity-60"
              >
                Phê duyệt và mở đăng ký
              </button>
            </section>
          )}

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-black uppercase tracking-wider text-slate-500">Hành động</h2>
            {campaign.status === "recruiting" && (
              <button
                onClick={handleJoin}
                disabled={joinCampaign.isPending || !campaign.canJoin}
                className="h-11 w-full rounded-md bg-[#1E5EFF] text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {campaign.currentUserJoinStatus === "PENDING" ? "Đang chờ duyệt" : "Đăng ký tham gia"}
              </button>
            )}

            {campaign.currentUserJoinStatus && (
              <div className="mt-3 rounded-md bg-slate-50 p-3 text-sm font-bold text-slate-700">
                Trạng thái của bạn: {joinLabel(campaign.currentUserJoinStatus)}
              </div>
            )}

            {!isAuthenticated && (
              <p className="mt-3 text-xs leading-5 text-slate-500">
                Đăng nhập để đăng ký tham gia, bình luận và truy cập group chat khi được duyệt.
              </p>
            )}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-500">Người phụ trách</h2>
            <p className="font-black text-slate-900">{campaign.createdBy}</p>
            <p className="mt-1 text-sm text-slate-500">{campaign.ward}</p>
          </section>
        </aside>
      </section>
    </main>
  );
}

function PrivateDetails({ campaign }: { campaign: Campaign }) {
  return (
    <section className="rounded-lg border border-blue-200 bg-blue-50/60 p-6">
      <div className="mb-4 flex items-center gap-2 text-lg font-black text-slate-950">
        <Lock size={18} className="text-[#1E5EFF]" />
        Thông tin nội bộ
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <InfoTile icon={MapPin} label="Điểm tập kết" value={campaign.privateLocationText || "Chưa cập nhật"} />
        <InfoTile icon={Package} label="Dụng cụ" value={campaign.requiredTools || "Chưa cập nhật"} />
        <InfoTile icon={Users} label="Liên hệ" value={campaign.organizerContact || "Chưa cập nhật"} />
      </div>
    </section>
  );
}

function DiscussionPanel({ campaignId }: { campaignId: string }) {
  const comments = useCampaignComments(campaignId);
  const chat = useCampaignChat(campaignId);
  const [commentText, setCommentText] = useState("");
  const [chatText, setChatText] = useState("");

  const submitComment = async () => {
    if (!commentText.trim()) return;
    await comments.addComment.mutateAsync(commentText.trim());
    setCommentText("");
  };

  const submitChat = async () => {
    if (!chatText.trim()) return;
    await chat.sendMessage.mutateAsync(chatText.trim());
    setChatText("");
  };

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <Panel title="Bình luận chiến dịch" icon={MessageCircle}>
        <div className="mb-3 max-h-64 space-y-3 overflow-y-auto pr-1">
          {(comments.data ?? []).map((comment) => (
            <MessageItem key={comment.id} name={comment.authorName} role={comment.authorRole} content={comment.content} />
          ))}
          {!comments.data?.length && <EmptyMessage text="Chưa có bình luận." />}
        </div>
        <Composer
          value={commentText}
          onChange={setCommentText}
          onSubmit={submitComment}
          disabled={comments.addComment.isPending}
          placeholder="Nhập bình luận..."
        />
      </Panel>

      <Panel title="Group chat realtime" icon={Send}>
        <div className="mb-3 max-h-64 space-y-3 overflow-y-auto pr-1">
          {(chat.data ?? []).map((message) => (
            <MessageItem key={message.id} name={message.senderName} role={message.senderRole} content={message.message} />
          ))}
          {!chat.data?.length && <EmptyMessage text="Chưa có tin nhắn trong nhóm." />}
        </div>
        <Composer
          value={chatText}
          onChange={setChatText}
          onSubmit={submitChat}
          disabled={chat.sendMessage.isPending}
          placeholder="Gửi tin nhắn cho nhóm..."
        />
      </Panel>
    </section>
  );
}

function Panel({ title, icon: Icon, children }: { title: string; icon: ElementType; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 flex items-center gap-2 font-black text-slate-950 border-b border-slate-50 pb-2">
        <Icon size={17} className="text-[#1E5EFF]" />
        {title}
      </h2>
      {children}
    </div>
  );
}

// Composer helper with rounded-lg styling
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
        className="h-10 min-w-0 flex-1 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-[#1E5EFF] focus:ring-2 focus:ring-[#1E5EFF]/15 transition"
        placeholder={placeholder}
      />
      <button
        type="button"
        onClick={onSubmit}
        disabled={disabled}
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#1E5EFF] text-white hover:bg-[#154ecc] transition disabled:opacity-50"
      >
        <Send size={16} />
      </button>
    </div>
  );
}

// Upgraded MessageItem with role labels and modern visual styling
function MessageItem({ name, role, content }: { name: string; role?: string; content: string }) {
  const roleBadge = () => {
    if (role === "SUPER_ADMIN") {
      return <span className="rounded-sm bg-amber-50 px-1.5 py-0.5 text-[9px] font-black text-amber-700 border border-amber-200">Lãnh đạo TP</span>;
    }
    if (role === "WARD_STAFF") {
      return <span className="rounded-sm bg-blue-50 px-1.5 py-0.5 text-[9px] font-black text-blue-700 border border-blue-200">Cán bộ Phường</span>;
    }
    if (role === "POLICE") {
      return <span className="rounded-sm bg-red-50 px-1.5 py-0.5 text-[9px] font-black text-red-700 border border-red-200">Công an</span>;
    }
    return <span className="text-[10px] font-semibold text-slate-400">Tình nguyện viên</span>;
  };

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-xs font-black text-slate-800">{name}</span>
        {roleBadge()}
      </div>
      <p className="text-sm leading-6 text-slate-600 font-medium">{content}</p>
    </div>
  );
}

function EmptyMessage({ text }: { text: string }) {
  return <p className="rounded-md bg-slate-50 p-3 text-sm font-semibold text-slate-500">{text}</p>;
}

function InfoTile({ icon: Icon, label, value }: { icon: ElementType; label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500">
        <Icon size={14} />
        {label}
      </div>
      <p className="text-sm font-bold leading-6 text-slate-900">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: Campaign["status"] }) {
  const meta = {
    pending_review: { label: "Chờ duyệt", className: "border-slate-200 bg-slate-100 text-slate-600" },
    recruiting: { label: "Đang tuyển", className: "border-amber-200 bg-amber-50 text-amber-700" },
    inProgress: { label: "Đang thực hiện", className: "border-blue-200 bg-blue-50 text-blue-700" },
    completed: { label: "Hoàn thành", className: "border-green-200 bg-green-50 text-green-700" },
  }[status];

  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-black ${meta.className}`}>
      <CheckCircle size={13} />
      {meta.label}
    </span>
  );
}

function dateRange(campaign: Campaign) {
  const start = campaign.startTime ? new Date(campaign.startTime).toLocaleDateString("vi-VN") : "Chưa đặt";
  const end = campaign.endTime ? new Date(campaign.endTime).toLocaleDateString("vi-VN") : "Chưa đặt";
  return `${start} - ${end}`;
}

function joinLabel(status: NonNullable<Campaign["currentUserJoinStatus"]>) {
  if (status === "APPROVED") return "Đã được duyệt";
  if (status === "PENDING") return "Chờ duyệt";
  if (status === "REJECTED") return "Bị từ chối";
  return "Đã hủy";
}
