import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Crown,
  MoreVertical,
  Paperclip,
  Search,
  SendHorizontal,
  Smile,
  Users,
  X,
  Lock,
  Pin,
} from "lucide-react";
import logoImg from "@/assets/logo.png";
import {
  useCampaignChat,
  useCampaignDetail,
  useCampaignParticipants,
  useCampaignThumbnail,
  usePinChatMessage,
  useUnpinChatMessage,
} from "@/hooks/useCampaigns";
import { useAuth } from "@/lib/auth";
import type { Campaign } from "@/lib/campaignStore";

export const Route = createFileRoute("/campaigns/$id/group-chat")({
  head: () => ({
    meta: [
      { title: "Nhóm chat chiến dịch - Đà Nẵng Kết Nối" },
      {
        name: "description",
        content: "Không gian trao đổi nhóm cho thành viên chiến dịch cộng đồng.",
      },
    ],
  }),
  component: CampaignGroupChatPage,
});

type ChatMessage = {
  id: string;
  sender: string;
  role: "host" | "member" | "me";
  text: string;
  time: string;
  pinned: boolean;
  status?: "sent" | "seen";
};

const DEFAULT_CAMPAIGN_NAME = "Chiến dịch cộng đồng";

function getStatusInfo(status?: Campaign["status"]) {
  switch (status) {
    case "recruiting":
    case "active":
      return {
        label: "Đang tuyển",
        className: "bg-emerald-50 text-emerald-700 border-emerald-100",
      };
    case "inProgress":
      return {
        label: "Đang diễn ra",
        className: "bg-blue-50 text-blue-700 border-blue-100",
      };
    case "completed":
      return {
        label: "Hoàn thành",
        className: "bg-slate-100 text-slate-700 border-slate-200",
      };
    case "ended":
      return {
        label: "Đã kết thúc",
        className: "bg-rose-50 text-rose-700 border-rose-100",
      };
    case "pending_review":
      return {
        label: "Chờ duyệt",
        className: "bg-amber-50 text-amber-700 border-amber-100",
      };
    default:
      return {
        label: "Chưa cập nhật",
        className: "bg-slate-50 text-slate-600 border-slate-100",
      };
  }
}

function getCategoryLabel(category?: Campaign["category"]) {
  switch (category) {
    case "environment":
      return "Môi trường";
    case "infrastructure":
      return "Hạ tầng";
    case "public_safety":
      return "An toàn";
    case "construction":
      return "Xây dựng";
    case "fire_safety":
      return "Phòng cháy";
    default:
      return "Chiến dịch";
  }
}

function getInitials(name?: string | null) {
  const parts = (name || "CB").trim().split(/\s+/).filter(Boolean);
  return parts
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getJoinStatusLabel(status?: string) {
  switch (status) {
    case "APPROVED":
      return "Đã duyệt";
    case "PENDING":
      return "Chờ duyệt";
    case "WAITLIST":
      return "Danh sách chờ";
    case "PENDING_CONFIRM":
      return "Chờ xác nhận";
    case "NO_SHOW":
      return "Vắng mặt";
    case "REJECTED":
      return "Từ chối";
    case "CANCELLED":
      return "Đã hủy";
    default:
      return "Chưa cập nhật";
  }
}

function CampaignGroupChatPage() {
  const { id } = Route.useParams();
  const campaign = useCampaignDetail(id);
  const { user } = useAuth();
  const [noticeVisible, setNoticeVisible] = useState(true);
  const [infoOpen, setInfoOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: chatMessages = [], sendMessage, isLoading: chatLoading } = useCampaignChat(id);
  const pinMutation = usePinChatMessage(id);
  const unpinMutation = useUnpinChatMessage(id);

  const campaignName = campaign?.name || DEFAULT_CAMPAIGN_NAME;
  const hostName = campaign?.createdBy || "Cán bộ phường";
  const memberCount = campaign?.participants ?? 0;
  const target = campaign?.target ?? 0;
  const progressPercent = target > 0 ? Math.min(100, Math.round((memberCount / target) * 100)) : 0;

  const formattedMessages = useMemo(() => {
    return chatMessages.map((msg) => {
      const isMe = user && user.name === msg.senderName;
      const isHost = msg.senderRole === "WARD_STAFF" || msg.senderRole === "SUPER_ADMIN";

      let timeStr = "";
      try {
        const date = new Date(msg.createdAt);
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        timeStr = `${hours}:${minutes}`;
      } catch {
        timeStr = "12:00";
      }

      return {
        id: String(msg.id),
        sender: msg.senderName,
        role: isMe ? "me" : isHost ? "host" : "member",
        text: msg.message,
        time: timeStr,
        pinned: msg.pinned || false,
      } as ChatMessage;
    });
  }, [chatMessages, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [formattedMessages]);

  const pinnedMsg = useMemo(() => {
    return chatMessages.find((m) => m.pinned);
  }, [chatMessages]);

  const sidebar = useMemo(
    () => (
      <GroupSidebar
        campaignId={id}
        campaignName={campaignName}
        campaign={campaign}
        hostName={hostName}
        target={target}
        memberCount={memberCount}
        progressPercent={progressPercent}
      />
    ),
    [campaign, campaignName, hostName, id, memberCount, progressPercent, target],
  );

  const handleSendMessage = () => {
    const text = draft.trim();
    if (!text) return;
    sendMessage.mutate(text);
    setDraft("");
  };

  // If campaign details are loaded, check if user is authorized (manager or approved participant)
  if (campaign && !campaign.privateDetailsVisible) {
    return (
      <main className="min-h-screen bg-[#F5F7FA] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/80 backdrop-blur-md border border-slate-200 shadow-xl rounded-2xl p-6 text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
            <Lock size={24} />
          </div>
          <h1 className="text-lg font-black text-slate-900 mb-2">Quyền truy cập bị từ chối</h1>
          <p className="text-sm font-semibold text-slate-500 mb-6 leading-relaxed">
            Bạn không có quyền truy cập nhóm chat này. Chỉ quản trị viên và thành viên đã được duyệt
            tham gia mới có quyền truy cập.
          </p>
          <Link
            to="/campaigns/$id"
            params={{ id }}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-4 text-xs font-black text-white shadow-md hover:bg-blue-700 transition"
          >
            Quay lại trang chi tiết
          </Link>
        </div>
      </main>
    );
  }

  // Loading state
  if (!campaign || chatLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F5F7FA]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-500">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F7FA] font-sans text-slate-900">
      <style>{`
        @keyframes chatSlideUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="flex h-screen overflow-hidden">
        <aside className="hidden w-[280px] shrink-0 border-r border-slate-200 bg-white md:flex md:flex-col">
          {sidebar}
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm md:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setInfoOpen(true)}
                className="grid h-10 w-10 place-items-center rounded-full bg-[#EFF6FF] text-[#3B82F6] md:hidden"
                aria-label="Mở thông tin nhóm"
              >
                <Users size={18} />
              </button>
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#EFF6FF] text-[#3B82F6]">
                <Users size={20} />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-sm font-black text-slate-950 md:text-base">
                  {campaignName}
                </h1>
                <p className="text-xs font-semibold text-slate-500">
                  {memberCount}/{target || "?"} thành viên
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <IconButton label="Tìm kiếm tin nhắn" icon={<Search size={18} />} />
              <IconButton label="Danh sách thành viên" icon={<Users size={18} />} />
              <IconButton label="Menu thêm" icon={<MoreVertical size={18} />} />
            </div>
          </header>

          {/* Pinned Message Bar */}
          {pinnedMsg && (
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-amber-100 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-900 md:px-6 animate-[chatSlideUp_0.2s_ease]">
              <div className="flex items-center gap-2 min-w-0">
                <Pin size={15} className="text-amber-500 fill-current shrink-0 rotate-45" />
                <span className="truncate text-xs sm:text-sm">
                  <span className="font-black text-amber-800">Tin nhắn đã ghim: </span>
                  {pinnedMsg.message}
                </span>
              </div>
              {campaign.canManage && (
                <button
                  onClick={() => unpinMutation.mutate(pinnedMsg.id)}
                  disabled={unpinMutation.isPending}
                  className="text-amber-700 hover:text-amber-900 text-xs font-black shrink-0 underline decoration-dotted cursor-pointer"
                >
                  Bỏ ghim
                </button>
              )}
            </div>
          )}

          {noticeVisible && (
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-blue-100 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-800 md:px-6">
              <span className="min-w-0">
                <Crown size={15} className="mr-1 inline text-amber-500" />
                {hostName} là người chủ trì nhóm này. Hãy tôn trọng nội quy chiến dịch.
              </span>
              <button
                type="button"
                onClick={() => setNoticeVisible(false)}
                className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-blue-700 hover:bg-blue-100"
                aria-label="Đóng thông báo"
              >
                <X size={15} />
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto bg-[#F5F7FA] px-4 py-5 md:px-8">
            <div className="mx-auto flex max-w-3xl flex-col gap-4">
              <div className="self-center rounded-full bg-slate-200/70 px-3 py-1 text-xs font-bold text-slate-500">
                Hôm nay
              </div>

              {formattedMessages.map((message) => (
                <ChatBubble
                  key={message.id}
                  message={message}
                  canManage={campaign.canManage}
                  onPin={(msgId) => pinMutation.mutate(msgId)}
                  onUnpin={(msgId) => unpinMutation.mutate(msgId)}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <footer className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 md:px-6">
            <div className="mx-auto flex max-w-3xl items-center gap-2">
              <IconButton label="Đính kèm" icon={<Paperclip size={19} />} />
              <IconButton label="Emoji" icon={<Smile size={19} />} />
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleSendMessage();
                }}
                placeholder="Nhắn tin cho nhóm..."
                className="h-11 min-w-0 flex-1 rounded-full bg-[#F3F4F6] px-4 text-sm font-semibold text-slate-800 outline-none ring-1 ring-transparent transition placeholder:text-slate-400 focus:bg-white focus:ring-[#3B82F6]/30"
              />
              <button
                type="button"
                onClick={handleSendMessage}
                disabled={!draft.trim()}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-[#3B82F6] transition hover:bg-blue-50 disabled:text-slate-300 disabled:hover:bg-transparent"
                aria-label="Gửi tin nhắn"
              >
                <SendHorizontal size={21} />
              </button>
            </div>
          </footer>
        </section>
      </div>

      {infoOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/30 md:hidden"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="absolute inset-0 h-full w-full"
            onClick={() => setInfoOpen(false)}
            aria-label="Đóng thông tin nhóm"
          />
          <aside className="absolute inset-x-0 bottom-0 max-h-[86vh] overflow-hidden rounded-t-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <span className="text-sm font-black text-slate-900">Thông tin nhóm</span>
              <button
                type="button"
                onClick={() => setInfoOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-600"
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
            </div>
            <div className="max-h-[calc(86vh-57px)] overflow-y-auto">{sidebar}</div>
          </aside>
        </div>
      )}
    </main>
  );
}

function GroupSidebar({
  campaignId,
  campaignName,
  campaign,
  hostName,
  target,
  memberCount,
  progressPercent,
}: {
  campaignId: string;
  campaignName: string;
  campaign?: Campaign;
  hostName: string;
  target: number;
  memberCount: number;
  progressPercent: number;
}) {
  const thumbnail = useCampaignThumbnail(campaign);
  const statusInfo = getStatusInfo(campaign?.status);
  const categoryLabel = getCategoryLabel(campaign?.category);
  const wardName = campaign?.ward || "Chưa cập nhật địa bàn";
  const memberRatio = target > 0 ? `${memberCount}/${target}` : String(memberCount);
  const canViewParticipants = Boolean(campaign?.canManage);
  const { data: participants = [], isLoading: participantsLoading } = useCampaignParticipants(
    campaignId,
    canViewParticipants,
  );
  const approvedParticipants = participants.filter(
    (participant) => participant.joinStatus === "APPROVED",
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      <div className="space-y-4 border-b border-slate-100 p-4">
        <div className="flex items-center gap-2">
          <img src={logoImg} alt="Đà Nẵng Kết Nối" className="h-9 w-9 object-contain" />
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-[#0B4FC4]">Đà Nẵng Kết Nối</p>
            <p className="text-[10px] font-bold uppercase text-slate-400">Campaign Group</p>
          </div>
        </div>

        <Link
          to="/campaigns/$id"
          params={{ id: campaignId }}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-black text-slate-700 transition hover:bg-slate-50"
        >
          <ArrowLeft size={15} />
          Quay lại chiến dịch
        </Link>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="relative aspect-video overflow-hidden rounded-lg bg-slate-100">
          <img src={thumbnail} alt={campaignName} className="h-full w-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/55 to-transparent p-4">
            <span className="rounded-md bg-white/90 px-2 py-1 text-xs font-black text-[#0B4FC4] shadow-sm">
              {categoryLabel}
            </span>
          </div>
        </div>

        <h2 className="mt-3 line-clamp-2 text-base font-black leading-6 text-slate-950">
          {campaignName}
        </h2>
        <span
          className={`mt-3 inline-flex rounded-full border px-2.5 py-1 text-xs font-black ${statusInfo.className}`}
        >
          {statusInfo.label}
        </span>

        <div className="my-5 h-px bg-slate-100" />

        <section>
          <p className="mb-3 text-[10px] font-black uppercase tracking-wider text-slate-400">
            Người chủ trì
          </p>
          <div className="rounded-lg border border-amber-100 bg-amber-50/60 p-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-amber-100 text-sm font-black text-amber-700">
                  {getInitials(hostName)}
                </span>
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-slate-900">{hostName}</p>
                <p className="text-xs font-semibold text-slate-500">{wardName}</p>
              </div>
            </div>
            <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[11px] font-black text-amber-700">
              <Crown size={13} />
              Quản trị nhóm
            </span>
          </div>
        </section>

        <section className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Thành viên ({memberRatio})
            </p>
            <span className="text-[10px] font-black text-slate-400">{progressPercent}%</span>
          </div>
          <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-[#3B82F6]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-3">
            <div className="flex items-center justify-between gap-3 text-xs font-bold text-slate-600">
              <span>Đã được duyệt tham gia</span>
              <span className="text-slate-900">{memberCount}</span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3 text-xs font-bold text-slate-600">
              <span>Sức chứa tối đa</span>
              <span className="text-slate-900">{target || "Chưa giới hạn"}</span>
            </div>
          </div>

          {canViewParticipants && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Danh sách đã duyệt
                </p>
                <span className="text-[10px] font-black text-slate-400">
                  {approvedParticipants.length}
                </span>
              </div>

              {participantsLoading ? (
                <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-3 text-xs font-bold text-slate-400">
                  Đang tải thành viên...
                </div>
              ) : approvedParticipants.length > 0 ? (
                <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                  {approvedParticipants.map((participant) => (
                    <div
                      key={participant.id}
                      className="flex items-center gap-2 rounded-lg px-1 py-1.5"
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-black text-slate-600">
                        {getInitials(participant.citizenName)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-700">
                          {participant.citizenName}
                        </p>
                        <p className="text-[10px] font-bold text-emerald-600">
                          {getJoinStatusLabel(participant.joinStatus)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-200 bg-white px-3 py-3 text-xs font-bold text-slate-400">
                  Chưa có thành viên được duyệt.
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function ChatBubble({
  message,
  canManage,
  onPin,
  onUnpin,
}: {
  message: ChatMessage;
  canManage: boolean;
  onPin: (id: string) => void;
  onUnpin: (id: string) => void;
}) {
  if (message.role === "me") {
    return (
      <div
        className="flex justify-end items-center gap-2 group"
        style={{ animation: "chatSlideUp 0.2s ease" }}
      >
        {canManage && (
          <button
            onClick={() => (message.pinned ? onUnpin(message.id) : onPin(message.id))}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full hover:bg-slate-250/80 bg-slate-100/50 text-slate-400 hover:text-amber-500 transition-all duration-200 shrink-0 shadow-sm border border-slate-200/50 cursor-pointer"
            title={message.pinned ? "Bỏ ghim tin nhắn" : "Ghim tin nhắn"}
          >
            <Pin size={13} className={message.pinned ? "fill-amber-500 text-amber-500" : ""} />
          </button>
        )}
        <div
          className={`max-w-[78%] rounded-[12px_0_12px_12px] bg-[#3B82F6] px-4 py-2.5 text-white shadow-sm relative ${message.pinned ? "border-t-[3px] border-t-amber-400" : ""}`}
        >
          {message.pinned && (
            <div
              className="absolute -top-2 -right-1 bg-amber-400 text-white rounded-full p-0.5 shadow-sm"
              title="Đã ghim"
            >
              <Pin size={9} className="fill-current" />
            </div>
          )}
          <p className="text-sm font-medium leading-6">{message.text}</p>
          <div className="mt-1 flex items-center justify-end gap-1 text-[10px] font-bold text-blue-100">
            <span>{message.time}</span>
            <span>{message.status === "seen" ? "✓✓" : "✓"}</span>
          </div>
        </div>
      </div>
    );
  }

  const host = message.role === "host";

  return (
    <div className="flex items-start gap-2 group" style={{ animation: "chatSlideUp 0.2s ease" }}>
      <span
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-black ${
          host ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
        }`}
      >
        {host ? "CB" : message.sender.split(" ").at(-1)?.[0] || "A"}
      </span>
      <div
        className={`max-w-[78%] rounded-[0_12px_12px_12px] bg-white px-4 py-2.5 text-slate-800 shadow-sm relative ${
          host ? "border-l-[3px] border-l-[#F59E0B]" : ""
        } ${message.pinned ? "border-t-[3px] border-t-amber-400" : ""}`}
      >
        {message.pinned && (
          <div
            className="absolute -top-2 -right-1 bg-amber-400 text-white rounded-full p-0.5 shadow-sm"
            title="Đã ghim"
          >
            <Pin size={9} className="fill-current" />
          </div>
        )}
        <p className={`mb-1 text-xs font-black ${host ? "text-amber-700" : "text-[#2563EB]"}`}>
          {host && <Crown size={13} className="mr-1 inline text-amber-500" />}
          {message.sender}
        </p>
        <p className="text-sm font-medium leading-6">{message.text}</p>
        <p className="mt-1 text-[10px] font-bold text-slate-400">{message.time}</p>
      </div>
      {canManage && (
        <button
          onClick={() => (message.pinned ? onUnpin(message.id) : onPin(message.id))}
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full hover:bg-slate-250/80 bg-slate-100/50 text-slate-400 hover:text-amber-500 transition-all duration-200 self-center shrink-0 shadow-sm border border-slate-200/50 cursor-pointer"
          title={message.pinned ? "Bỏ ghim tin nhắn" : "Ghim tin nhắn"}
        >
          <Pin size={13} className={message.pinned ? "fill-amber-500 text-amber-500" : ""} />
        </button>
      )}
    </div>
  );
}

function IconButton({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <button
      type="button"
      className="grid h-10 w-10 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-[#3B82F6]"
      aria-label={label}
      title={label}
    >
      {icon}
    </button>
  );
}
