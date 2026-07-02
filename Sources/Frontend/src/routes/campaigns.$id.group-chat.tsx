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
import { useCampaignDetail, useCampaignChat, usePinChatMessage, useUnpinChatMessage, useCampaignParticipants } from "@/hooks/useCampaigns";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
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

const DEFAULT_CAMPAIGN_NAME = "Chiến dịch Mùa Hè Xanh - Dọn dẹp bãi biển Xuân Thiều";


const initialMessages: ChatMessage[] = [
  {
    id: "m1",
    sender: "Người chủ trì",
    role: "host",
    time: "10:15",
    text: "Chào mọi người! Chiến dịch sẽ bắt đầu lúc 6h sáng 19/6. Mọi người tập trung đúng giờ nhé.",
    pinned: false,
  },
  {
    id: "m2",
    sender: "Nguyễn Văn A",
    role: "member",
    time: "10:17",
    text: "Dạ em sẽ có mặt ạ!",
    pinned: false,
  },
  {
    id: "m3",
    sender: "Trần Thị B",
    role: "member",
    time: "10:18",
    text: "Mình cần mang thêm găng tay không ạ?",
    pinned: false,
  },
  {
    id: "m4",
    sender: "Người chủ trì",
    role: "host",
    time: "10:19",
    text: "Mình sẽ chuẩn bị dụng cụ cho mọi người, không cần mang thêm.",
    pinned: false,
  },
  {
    id: "m5",
    sender: "citizen1",
    role: "me",
    time: "10:20",
    text: "Ok em hiểu rồi ạ, cảm ơn anh/chị!",
    status: "seen",
    pinned: false,
  },
];

function CampaignGroupChatPage() {
  const { id } = Route.useParams();
  const campaign = useCampaignDetail(id);
  const { user } = useAuth();
  const [noticeVisible, setNoticeVisible] = useState(true);
  const [infoOpen, setInfoOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: chatMessages = [], sendMessage, isLoading: chatLoading, error: chatError, isError: isChatError } = useCampaignChat(id);
  const pinMutation = usePinChatMessage(id);
  const unpinMutation = useUnpinChatMessage(id);
  const participantsQuery = useCampaignParticipants(id);
  const realParticipants = participantsQuery.data ?? [];

  const hostName = campaign?.createdBy || "Người chủ trì";
  const campaignName = campaign?.name || DEFAULT_CAMPAIGN_NAME;
  const memberCount = campaign?.participants || 1;
  const target = campaign?.target || 30;
  
  const members = useMemo(() => {
    const hostMember = { name: hostName, initials: hostName.split(" ").at(-1)?.[0] || "H", online: true, role: "host" };
    const meMember = user ? { name: user.name, initials: user.name.split(" ").at(-1)?.[0] || "C", online: true, role: "me" } : null;
    
    const approvedParticipants = realParticipants
      .filter((p) => p.joinStatus === "APPROVED" && (!user || p.citizenName !== user.name))
      .map((p, i) => ({
        name: p.citizenName,
        initials: p.citizenName.split(" ").at(-1)?.[0] || "U",
        online: i % 3 === 0, // Mock online status
        role: "member",
      }));

    const result = [hostMember];
    if (meMember && meMember.name !== hostName) {
      result.push(meMember);
    }
    result.push(...approvedParticipants);
    return result;
  }, [hostName, user, realParticipants]);
  const onlineCount = members.filter((member) => member.online).length;
  const progressPercent = Math.min(100, Math.round((memberCount / target) * 100));

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
        hostName={hostName}
        hostWard={campaign?.ward || "Chưa cập nhật"}
        members={members}
      />
    ),
    [campaignName, id, memberCount, progressPercent, target, hostName, campaign?.ward, members],
  );

  const handleSendMessage = () => {
    const text = draft.trim();
    if (!text) return;
    sendMessage.mutate(text);
    setDraft("");
  };

  const isForbiddenError = isChatError && (chatError as any)?.status === 403;

  // If campaign details are loaded, check if user is authorized (manager or approved participant)
  if (isForbiddenError) {
    return (
      <main className="min-h-screen bg-[#F5F7FA] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/80 backdrop-blur-md border border-slate-200 shadow-xl rounded-2xl p-6 text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
            <Lock size={24} />
          </div>
          <h1 className="text-lg font-black text-slate-900 mb-2">Quyền truy cập bị từ chối</h1>
          <p className="text-sm font-semibold text-slate-500 mb-6 leading-relaxed">
            Bạn không có quyền truy cập nhóm chat này. Chỉ quản trị viên và thành viên đã tham gia mới có quyền truy cập.
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

          {withinConfirmWindow && (currentStatus === "APPROVED" || currentStatus === "PENDING") && (
            <div className="flex shrink-0 flex-col gap-2 border-b border-indigo-100 bg-indigo-50 px-4 py-3 md:px-6 animate-[chatSlideUp_0.2s_ease] sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs sm:text-sm text-indigo-800 font-bold">
                  Chiến dịch sắp khởi chạy. Vui lòng cập nhật khả năng tham gia của bạn.
                </span>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => handleSignal("CONFIRMED")}
                  disabled={signalAttendance.isPending}
                  className="text-white bg-[#7C3AED] hover:bg-[#6D28D9] px-3 py-1.5 rounded-lg text-xs font-black shadow-sm cursor-pointer transition active:scale-[0.97] disabled:opacity-50"
                >
                  Xác nhận tham gia
                </button>
                <button
                  onClick={() => handleSignal("MAYBE")}
                  disabled={signalAttendance.isPending}
                  className="text-slate-700 border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 rounded-lg text-xs font-black shadow-sm cursor-pointer transition active:scale-[0.97] disabled:opacity-50"
                >
                  Có thể tham gia
                </button>
              </div>
            </div>
          )}

          {withinConfirmWindow && (currentStatus as string) === "CONFIRMED" && (
            <div className="flex shrink-0 items-center justify-between border-b border-emerald-100 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800 shadow-sm md:px-6">
              Bạn đã xác nhận tham gia. Vui lòng chờ cán bộ phường phê duyệt chính thức.
            </div>
          )}

          {withinConfirmWindow && (currentStatus as string) === "MAYBE" && (
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-slate-100 px-4 py-3 text-xs font-bold text-slate-700 shadow-sm md:px-6">
              Bạn đã chọn khả năng Có thể tham gia chiến dịch (Không cần duyệt).
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
                  canManage={campaign.canManage || false}
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
  hostName,
  hostWard,
  members,
}: {
  campaignId: string;
  campaignName: string;
  campaign?: Campaign;
  hostName: string;
  target: number;
  memberCount: number;
  progressPercent: number;
  hostName: string;
  hostWard: string;
  members: any[];
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
                <span className="grid h-10 w-10 place-items-center rounded-full bg-amber-100 text-sm font-black text-amber-700 uppercase">
                  {hostName.split(" ").at(-1)?.[0] || "H"}
                </span>
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-slate-900">{hostName}</p>
                <p className="text-xs font-semibold text-slate-500">{hostWard}</p>
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
            ))}
          </div>
          {members.length > 8 && (
            <p className="mt-3 text-xs font-bold text-slate-400">+ {members.length - 8} người khác</p>
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
        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-black uppercase ${
          host ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
        }`}>
          {host ? message.sender.split(" ").at(-1)?.[0] || "H" : message.sender.split(" ").at(-1)?.[0] || "A"}
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
