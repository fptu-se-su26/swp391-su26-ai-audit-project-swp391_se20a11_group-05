import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, useLayoutEffect } from "react";
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
  Loader2,
  ChevronUp,
  ChevronDown,
  ChevronsDown,
} from "lucide-react";
import logoImg from "@/assets/logo.png";
import {
  useCampaignDetail,
  useCampaignChat,
  usePinChatMessage,
  useUnpinChatMessage,
  useCampaignParticipants,
  useCampaignThumbnail,
  useDeleteChatMessageMutation,
  useSignalAttendance,
} from "@/hooks/useCampaigns";
import { useAuth } from "@/lib/auth";
import { Role } from "@/lib/roles";
import { toast } from "sonner";
import type { Campaign } from "@/lib/campaignStore";
import { CampaignChatBubble } from "@/components/chat/CampaignChatBubble";
import { EmojiPicker } from "@/components/chat/EmojiPicker";
import { API_BASE, getToken } from "@/lib/api";
import { CampaignChatMenu } from "@/components/chat/CampaignChatMenu";

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
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === Role.WARD_STAFF) {
      void navigate({
        to: "/ward",
        search: { tab: "chat", detailId: id },
      });
    }
  }, [user, id, navigate]);
  const [noticeVisible, setNoticeVisible] = useState(true);
  const [infoOpen, setInfoOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);

  interface ImageAttachment {
    id: string;
    file: File;
    preview: string;
    url: string | null;
    isUploading: boolean;
    error?: string;
  }
  const [attachments, setAttachments] = useState<ImageAttachment[]>([]);
  const [searchMsgQuery, setSearchMsgQuery] = useState("");
  const [isSearchingMsg, setIsSearchingMsg] = useState(false);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    setShowScrollBottomBtn(distanceFromBottom > 300);
  };

  const {
    chatMessages = [],
    sendMessage,
    isLoading: chatLoading,
    error: chatError,
    isError: isChatError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useCampaignChat(id);

  useEffect(() => {
    if (chatMessages && chatMessages.length > 0) {
      const maxId = Math.max(...chatMessages.map((m) => Number(m.id)).filter((id) => !isNaN(id)));
      if (maxId > 0) {
        localStorage.setItem(`campaign-chat-seen-${id}`, String(maxId));
      }
    }
  }, [chatMessages, id]);

  const pinMutation = usePinChatMessage(id);
  const unpinMutation = useUnpinChatMessage(id);
  const deleteMutation = useDeleteChatMessageMutation(id);

  const signalAttendance = useSignalAttendance(id);
  const currentStatus = campaign?.currentUserJoinStatus as string | undefined;

  const startTime = campaign?.startTime ? new Date(campaign.startTime) : null;
  const now = new Date();
  const withinConfirmWindow =
    startTime !== null &&
    now < startTime &&
    now >= new Date(startTime.getTime() - 24 * 60 * 60 * 1000);

  const handleSignal = async (signal: "CONFIRMED" | "MAYBE") => {
    try {
      await signalAttendance.mutateAsync(signal);
      toast.success(
        signal === "CONFIRMED" ? "Đã xác nhận tham gia chiến dịch!" : "Đã chọn 'Có thể tham gia'.",
      );
    } catch (err: any) {
      toast.error(err?.message || "Không thể gửi xác nhận.");
    }
  };

  const canViewParticipants = Boolean(campaign?.canManage || campaign?.privateDetailsVisible);
  const participantsQuery = useCampaignParticipants(id, canViewParticipants);
  const realParticipants = useMemo(() => participantsQuery.data ?? [], [participantsQuery.data]);

  const hostName = campaign?.createdBy || "Người chủ trì";
  const campaignName = campaign?.name || DEFAULT_CAMPAIGN_NAME;
  const memberCount = campaign?.participants || 1;
  const target = campaign?.target || 30;

  interface GroupMember {
    name: string;
    initials: string;
    online: boolean;
    role: string;
  }

  const members = useMemo((): GroupMember[] => {
    const hostMember = {
      name: hostName,
      initials: hostName.split(" ").at(-1)?.[0] || "H",
      online: true,
      role: "host",
    };
    const meMember = user
      ? {
          name: user.name,
          initials: user.name.split(" ").at(-1)?.[0] || "C",
          online: true,
          role: "me",
        }
      : null;

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
      const isMe =
        !!user &&
        (user.id != null && msg.senderId != null && msg.senderId !== 0
          ? Number(user.id) === Number(msg.senderId)
          : user.name === msg.senderName || msg.senderName === "Tôi");
      const isHost = msg.senderRole === "WARD_STAFF" || msg.senderRole === "SUPER_ADMIN";

      // Diagnostic log to investigate identity matching issues
      console.log("[GroupChat] isMe check:", {
        messageId: msg.id,
        isMe,
        userId: user?.id,
        msgSenderId: msg.senderId,
        userName: user?.name,
        msgSenderName: msg.senderName,
      });

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
        senderId: msg.senderId,
        role: isMe ? "me" : isHost ? "host" : "member",
        text: msg.message,
        time: timeStr,
        pinned: msg.pinned || false,
        imageUrls: msg.imageUrls || [],
        status: msg.status,
        senderAvatar: msg.senderAvatar,
        pastCampaignCount: msg.pastCampaignCount,
      } as ChatMessage;
    });
  }, [chatMessages, user]);

  const pinnedMsg = useMemo(() => {
    return chatMessages.find((m) => m.pinned);
  }, [chatMessages]);

  const matchingMessageIds = useMemo(() => {
    if (!isSearchingMsg || !searchMsgQuery.trim()) return [];
    return formattedMessages
      .filter((msg) => msg.text?.toLowerCase().includes(searchMsgQuery.toLowerCase()))
      .map((msg) => msg.id);
  }, [formattedMessages, isSearchingMsg, searchMsgQuery]);

  useEffect(() => {
    setCurrentMatchIndex(0);
  }, [searchMsgQuery]);

  useEffect(() => {
    if (matchingMessageIds.length === 0) return;
    const targetId = matchingMessageIds[currentMatchIndex];
    if (targetId) {
      const el = document.querySelector(`[data-message-id="${targetId}"]`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [currentMatchIndex, matchingMessageIds]);

  const lastMessageIdRef = useRef<string | null>(null);
  const isInitialLoadRef = useRef(true);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (formattedMessages.length === 0) return;

    const lastMsg = formattedMessages[formattedMessages.length - 1];
    const isNewMessage = lastMsg.id !== lastMessageIdRef.current;

    if (isInitialLoadRef.current || isNewMessage) {
      messagesEndRef.current?.scrollIntoView({
        behavior: isInitialLoadRef.current ? "auto" : "smooth",
      });
      isInitialLoadRef.current = false;
    }

    lastMessageIdRef.current = lastMsg.id;
  }, [formattedMessages]);

  const firstMessageIdBeforeFetch = useRef<string | null>(null);
  const firstMessageOffsetTop = useRef<number>(0);

  // Scroll retention when loading older messages
  useLayoutEffect(() => {
    if (!firstMessageIdBeforeFetch.current) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    const targetEl = container.querySelector(
      `[data-message-id="${firstMessageIdBeforeFetch.current}"]`,
    );
    if (targetEl) {
      const targetRect = targetEl.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const currentOffsetTop = targetRect.top - containerRect.top;
      const diff = currentOffsetTop - firstMessageOffsetTop.current;
      container.scrollTop += diff;
    }

    firstMessageIdBeforeFetch.current = null;
  }, [formattedMessages]);

  // Infinite scroll old messages hook
  useEffect(() => {
    if (isSearchingMsg) return; // Disable automatic load while searching

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          const container = scrollContainerRef.current;
          if (container && formattedMessages.length > 0) {
            // Save the top message ID and its offset relative to the scroll container
            const topMsg = formattedMessages[0];
            firstMessageIdBeforeFetch.current = topMsg.id;

            const firstMessageEl = container.querySelector(`[data-message-id="${topMsg.id}"]`);
            if (firstMessageEl) {
              firstMessageOffsetTop.current =
                firstMessageEl.getBoundingClientRect().top - container.getBoundingClientRect().top;
            }

            void fetchNextPage();
          }
        }
      },
      { threshold: 0.1 },
    );

    const currentLoader = loaderRef.current;
    if (currentLoader) {
      observer.observe(currentLoader);
    }
    return () => {
      if (currentLoader) {
        observer.unobserve(currentLoader);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, formattedMessages, isSearchingMsg]);

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
        hostWard={campaign?.ward || "Chưa cập nhật"}
        members={members}
      />
    ),
    [campaignName, id, memberCount, progressPercent, target, hostName, members, campaign],
  );

  const isCampaignEndedOrCancelled =
    campaign?.status === "ended" ||
    campaign?.status === "completed" ||
    campaign?.status === "cancelled";

  const isInputDisabled =
    ((campaign?.announcementMode ?? false) && !campaign?.canManage) ||
    (isCampaignEndedOrCancelled && !campaign?.canManage);

  const handleSendMessage = () => {
    if (isInputDisabled) return;

    const text = draft.trim();
    const uploadedUrls = attachments
      .filter((att) => att.url !== null)
      .map((att) => att.url as string);
    const hasUploading = attachments.some((att) => att.isUploading);

    if (hasUploading) {
      toast.warning("Vui lòng đợi hình ảnh tải lên hoàn tất");
      return;
    }

    if (!text && uploadedUrls.length === 0) return;

    sendMessage.mutate({ content: text, imageUrls: uploadedUrls });
    setDraft("");
    setAttachments([]);
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAttachments: ImageAttachment[] = [];
    const token = getToken();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!file.type.startsWith("image/")) {
        toast.error(`File "${file.name}" không phải hình ảnh hợp lệ`);
        continue;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error(`Ảnh "${file.name}" vượt quá kích thước 10MB`);
        continue;
      }

      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const previewUrl = URL.createObjectURL(file);

      newAttachments.push({
        id,
        file,
        preview: previewUrl,
        url: null,
        isUploading: true,
      });
    }

    if (newAttachments.length === 0) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setAttachments((prev) => [...prev, ...newAttachments]);
    if (fileInputRef.current) fileInputRef.current.value = "";

    newAttachments.forEach(async (att) => {
      try {
        const formData = new FormData();
        formData.append("file", att.file);

        const res = await fetch(`${API_BASE}/api/files/upload`, {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });

        const data = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(data?.message || data?.error || "Upload failed");
        }

        setAttachments((prev) =>
          prev.map((item) =>
            item.id === att.id ? { ...item, url: data.fileUrl, isUploading: false } : item,
          ),
        );
      } catch (err) {
        console.error(err);
        toast.error(`Không thể tải lên ảnh "${att.file.name}"`);
        setAttachments((prev) =>
          prev.map((item) =>
            item.id === att.id ? { ...item, isUploading: false, error: "Upload failed" } : item,
          ),
        );
      }
    });
  };

  const handleCancelAttachment = (attId: string) => {
    setAttachments((prev) => {
      const target = prev.find((x) => x.id === attId);
      if (target?.preview) {
        URL.revokeObjectURL(target.preview);
      }
      return prev.filter((x) => x.id !== attId);
    });
  };

  const isForbiddenError = isChatError && (chatError as { status?: number })?.status === 403;

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
            Bạn không có quyền truy cập nhóm chat này. Chỉ quản trị viên và thành viên đã tham gia
            mới có quyền truy cập.
          </p>
          {user?.role === Role.WARD_STAFF ? (
            <Link
              to="/ward"
              search={{ tab: "campaign", detailId: id }}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-4 text-xs font-black text-white shadow-md hover:bg-blue-700 transition"
            >
              Quay lại trang chi tiết
            </Link>
          ) : (
            <Link
              to="/campaigns/$id"
              params={{ id }}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-4 text-xs font-black text-white shadow-md hover:bg-blue-700 transition"
            >
              Quay lại trang chi tiết
            </Link>
          )}
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

        <section className="flex min-w-0 flex-1 flex-col relative">
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
              <button
                type="button"
                onClick={() => {
                  setIsSearchingMsg((prev) => !prev);
                  if (!isSearchingMsg) {
                    setSearchMsgQuery("");
                  }
                }}
                className={`grid h-10 w-10 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-[#3B82F6] ${
                  isSearchingMsg ? "bg-blue-50 text-[#3B82F6]" : ""
                }`}
                title="Tìm kiếm tin nhắn"
              >
                <Search size={18} />
              </button>
              <IconButton
                label="Danh sách thành viên"
                icon={<Users size={18} />}
                onClick={() => setInfoOpen(true)}
              />
              <CampaignChatMenu
                campaignId={id}
                canManage={campaign.canManage || false}
                chatMessages={formattedMessages}
                announcementMode={campaign.announcementMode ?? false}
                setAnnouncementMode={() => {}}
                onUnpin={(msgId) => unpinMutation.mutate(msgId)}
                onShowMembers={() => setInfoOpen(true)}
              />
            </div>
          </header>

          {/* Message Search Bar */}
          {isSearchingMsg && (
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-slate-50/50 px-4 py-2 gap-3">
              <div className="relative flex-1 max-w-md flex items-center bg-white rounded-xl border border-slate-200 px-3 py-1.5 shadow-sm">
                <Search className="h-3.5 w-3.5 text-slate-400 shrink-0 mr-2" />
                <input
                  type="text"
                  placeholder="Tìm tin nhắn..."
                  value={searchMsgQuery}
                  onChange={(e) => setSearchMsgQuery(e.target.value)}
                  className="w-full text-xs font-semibold outline-none placeholder:text-slate-400 text-slate-800 bg-transparent"
                  autoFocus
                />
                <div className="flex items-center gap-1 shrink-0 pl-2 border-l border-slate-150 select-none">
                  <span className="text-[10px] font-bold text-slate-500 font-mono pr-1">
                    {searchMsgQuery.trim()
                      ? matchingMessageIds.length > 0
                        ? `${currentMatchIndex + 1} of ${matchingMessageIds.length}`
                        : "No results"
                      : ""}
                  </span>
                  <button
                    type="button"
                    disabled={matchingMessageIds.length === 0}
                    onClick={() =>
                      setCurrentMatchIndex((prev) =>
                        prev === 0 ? matchingMessageIds.length - 1 : prev - 1,
                      )
                    }
                    className="p-1 rounded text-slate-400 hover:text-slate-650 hover:bg-slate-100 disabled:opacity-30 transition cursor-pointer"
                    title="Tìm trước đó"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    type="button"
                    disabled={matchingMessageIds.length === 0}
                    onClick={() =>
                      setCurrentMatchIndex((prev) =>
                        prev === matchingMessageIds.length - 1 ? 0 : prev + 1,
                      )
                    }
                    className="p-1 rounded text-slate-400 hover:text-slate-650 hover:bg-slate-100 disabled:opacity-30 transition cursor-pointer"
                    title="Tìm tiếp theo"
                  >
                    <ChevronDown size={14} />
                  </button>
                  {searchMsgQuery && (
                    <button
                      onClick={() => setSearchMsgQuery("")}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      title="Xóa tìm kiếm"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  setIsSearchingMsg(false);
                  setSearchMsgQuery("");
                }}
                className="text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg transition"
              >
                Đóng
              </button>
            </div>
          )}

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

          {withinConfirmWindow && currentStatus === "CONFIRMED" && (
            <div className="flex shrink-0 items-center justify-between border-b border-emerald-100 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800 shadow-sm md:px-6">
              Bạn đã xác nhận tham gia. Vui lòng chờ cán bộ phường phê duyệt chính thức.
            </div>
          )}

          {withinConfirmWindow && currentStatus === "MAYBE" && (
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-slate-100 px-4 py-3 text-xs font-bold text-slate-700 shadow-sm md:px-6">
              Bạn đã chọn khả năng Có thể tham gia chiến dịch (Không cần duyệt).
            </div>
          )}

          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto bg-[#F5F7FA] px-4 py-5 md:px-8"
          >
            <div className="mx-auto flex max-w-3xl flex-col gap-4">
              {hasNextPage && (
                <div className="flex justify-center py-2 shrink-0">
                  {isFetchingNextPage ? (
                    <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                  ) : (
                    <span
                      ref={loaderRef}
                      onClick={() => fetchNextPage()}
                      className="text-[10px] text-slate-400 font-bold select-none cursor-pointer hover:underline"
                    >
                      Xem tin nhắn cũ hơn
                    </span>
                  )}
                </div>
              )}

              <div className="self-center rounded-full bg-slate-200/70 px-3 py-1 text-xs font-bold text-slate-500">
                Hôm nay
              </div>

              {formattedMessages.map((message) => (
                <div
                  key={message.id}
                  data-message-id={message.id}
                  className="transition-all duration-300 rounded-xl"
                >
                  <CampaignChatBubble
                    key={message.id}
                    message={message}
                    canManage={campaign.canManage || false}
                    onPin={(msgId) => pinMutation.mutate(msgId)}
                    onUnpin={(msgId) => unpinMutation.mutate(msgId)}
                    onDelete={(msgId) => {
                      if (confirm("Bạn có chắc chắn muốn xóa tin nhắn này không?")) {
                        deleteMutation.mutate(msgId);
                      }
                    }}
                    highlightQuery={isSearchingMsg ? searchMsgQuery : undefined}
                  />
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Scroll to bottom button */}
          {showScrollBottomBtn && (
            <button
              type="button"
              onClick={() => {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
              }}
              className="absolute bottom-[80px] right-6 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-500 hover:text-indigo-650 hover:bg-white border border-slate-200/80 shadow-md backdrop-blur-sm transition-all duration-200 active:scale-95 cursor-pointer"
              title="Về tin nhắn mới nhất"
            >
              <ChevronsDown size={18} />
            </button>
          )}

          <footer className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 md:px-6">
            {attachments.length > 0 && (
              <div className="mx-auto max-w-3xl mb-3 flex flex-wrap gap-2 bg-slate-50 border border-slate-200/50 p-2 rounded-xl">
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="relative h-12 w-12 overflow-hidden rounded-lg border border-slate-200 bg-white shrink-0 group"
                  >
                    <img
                      src={att.preview}
                      alt="Attachment preview"
                      className="h-full w-full object-cover"
                    />
                    {att.isUploading && (
                      <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center">
                        <Loader2 className="animate-spin text-white h-4 w-4" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => handleCancelAttachment(att.id)}
                      className="absolute top-0.5 right-0.5 bg-black/60 hover:bg-rose-600 text-white rounded-full p-0.5 transition shadow"
                      title="Remove image"
                    >
                      <X size={8} />
                    </button>
                    {att.error && (
                      <div className="absolute inset-0 bg-rose-500/20 flex items-center justify-center">
                        <span className="text-[8px] font-black text-rose-700 bg-white/90 px-1 rounded">
                          Lỗi
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {isCampaignEndedOrCancelled && !campaign.canManage ? (
              <div className="mx-auto max-w-3xl flex flex-col gap-1.5 py-2.5 px-4 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600 font-medium">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-slate-500 shrink-0" />
                  <span className="font-bold">
                    Chiến dịch đã {campaign.status === "cancelled" ? "bị hủy" : "kết thúc"}. Nhóm
                    chat hiện ở chế độ chỉ đọc.
                  </span>
                </div>
                {campaign.status === "cancelled" && campaign.cancellationReason && (
                  <div className="text-[10px] font-bold text-rose-500 italic ml-6">
                    Lý do hủy: {campaign.cancellationReason}
                  </div>
                )}
              </div>
            ) : isInputDisabled ? (
              <div className="mx-auto max-w-3xl flex items-center gap-2.5 py-2.5 px-4 rounded-xl bg-blue-50 border border-blue-100 text-xs text-blue-750">
                <Lock className="h-4 w-4 text-blue-600 shrink-0" />
                <span className="font-bold">
                  Nhóm chat đang ở chế độ chỉ dành cho người quản lý nhắn tin.
                </span>
              </div>
            ) : (
              <div className="mx-auto flex max-w-3xl items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="grid h-10 w-10 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-[#3B82F6] shrink-0"
                  title="Đính kèm"
                >
                  <Paperclip size={19} />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageSelect}
                />
                <EmojiPicker
                  onSelectEmoji={(emoji) => setDraft((prev) => prev + emoji)}
                  disabled={isInputDisabled}
                  triggerSize={19}
                  triggerClassName="grid h-10 w-10 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-[#3B82F6] disabled:opacity-50 shrink-0"
                />
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
                  disabled={!draft.trim() && attachments.length === 0}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-[#3B82F6] transition hover:bg-blue-50 disabled:text-slate-300 disabled:hover:bg-transparent"
                  aria-label="Gửi tin nhắn"
                >
                  <SendHorizontal size={21} />
                </button>
              </div>
            )}
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
  hostWard: string;
  members: { name: string; initials: string; online: boolean; role: string }[];
}) {
  const { user } = useAuth();
  const getStatusInfo = (status?: string) => {
    switch (status) {
      case "recruiting":
        return {
          label: "Đang tuyển",
          className: "border-[#10B981] bg-[#10B981]/10 text-[#10B981]",
        };
      case "inProgress":
        return {
          label: "Đang diễn ra",
          className: "border-[#3B82F6] bg-[#3B82F6]/10 text-[#3B82F6]",
        };
      case "completed":
        return {
          label: "Hoàn thành",
          className: "border-[#8B5CF6] bg-[#8B5CF6]/10 text-[#8B5CF6]",
        };
      case "ended":
        return {
          label: "Đã kết thúc",
          className: "border-slate-500 bg-slate-500/10 text-slate-500",
        };
      default:
        return { label: "Chờ duyệt", className: "border-amber-500 bg-amber-500/10 text-amber-500" };
    }
  };
  const getCategoryLabel = (category?: string) => {
    switch (category) {
      case "environment":
        return "Môi trường";
      case "infrastructure":
        return "Hạ tầng";
      case "public_safety":
        return "An ninh";
      case "construction":
        return "Xây dựng";
      case "fire_safety":
        return "PCCC";
      default:
        return "Cộng đồng";
    }
  };

  const thumbnail = useCampaignThumbnail(campaign);
  const statusInfo = getStatusInfo(campaign?.status);
  const categoryLabel = getCategoryLabel(campaign?.category);
  const wardName = campaign?.ward || "Chưa cập nhật địa bàn";
  const memberRatio = target > 0 ? `${memberCount}/${target}` : String(memberCount);

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

        {user?.role === Role.WARD_STAFF ? (
          <Link
            to="/ward"
            search={{ tab: "campaign", detailId: campaignId }}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-black text-slate-700 transition hover:bg-slate-50"
          >
            <ArrowLeft size={15} />
            Quay lại chiến dịch
          </Link>
        ) : (
          <Link
            to="/campaigns/$id"
            params={{ id: campaignId }}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-black text-slate-700 transition hover:bg-slate-50"
          >
            <ArrowLeft size={15} />
            Quay lại chiến dịch
          </Link>
        )}
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
        </section>
      </div>
    </div>
  );
}

function IconButton({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="grid h-10 w-10 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-[#3B82F6] cursor-pointer"
      aria-label={label}
      title={label}
    >
      {icon}
    </button>
  );
}
