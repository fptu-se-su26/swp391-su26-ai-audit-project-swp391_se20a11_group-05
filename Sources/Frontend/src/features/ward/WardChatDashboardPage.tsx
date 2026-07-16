import { useState, useMemo, useRef, useEffect, useLayoutEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Route } from "@/routes/_auth.ward";
import {
  Search,
  Users,
  Paperclip,
  Smile,
  SendHorizontal,
  X,
  Lock,
  Pin,
  Loader2,
  Crown,
  ChevronLeft,
  Info,
  MessageSquare,
  AlertCircle,
  Inbox,
  Zap,
  ChevronUp,
  ChevronDown,
  ChevronsDown,
} from "lucide-react";
import {
  useCampaignList,
  useCampaignDetail,
  useCampaignChat,
  usePinChatMessage,
  useUnpinChatMessage,
  useDeleteChatMessageMutation,
  useSetAnnouncementMode,
  useCampaignThumbnail,
  useCampaignParticipants,
} from "@/hooks/useCampaigns";
import { useAuth } from "@/lib/auth";
import { API_BASE, getToken } from "@/lib/api";
import { toast } from "sonner";
import { CampaignChatBubble } from "@/components/chat/CampaignChatBubble";
import { CampaignChatMenu } from "@/components/chat/CampaignChatMenu";
import { CitizenProfileModal } from "@/components/chat/CitizenProfileModal";
import { PinnedMessagesDropdown } from "@/components/chat/PinnedMessagesDropdown";
import { EmojiPicker } from "@/components/chat/EmojiPicker";
import {
  ChatMessage,
  getInitials,
  getJoinStatusLabel,
} from "@/components/chat/CampaignChatHelpers";
import type { Campaign } from "@/lib/campaignStore";
import { Skeleton } from "@/components/ui/skeleton";

export function WardChatDashboardPage() {
  const { user } = useAuth();
  const campaigns = useCampaignList();
  const [searchQuery, setSearchQuery] = useState("");
  const { tab, detailId } = Route.useSearch();
  const navigate = useNavigate();
  const selectedCampaignId = tab === "chat" && detailId ? detailId : null;

  const setSelectedCampaignId = (id: string | null) => {
    navigate({
      to: "/ward",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      search: (prev: any) => ({
        ...prev,
        detailId: id || undefined,
      }),
    });
  };

  // Filter campaigns by current ward and search query
  const wardCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      const matchWard = !user?.wardId || String(c.wardId) === String(user.wardId);
      const matchSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchWard && matchSearch;
    });
  }, [campaigns, user, searchQuery]);

  return (
    <div className="flex bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden h-[calc(100vh-140px)]">
      {/* ─── LEFT COLUMN: CAMPAIGN LIST (Desktop: 320px-380px, Mobile: conditional) ─── */}
      <div
        className={`${
          selectedCampaignId ? "hidden md:flex" : "flex"
        } w-full md:w-[350px] shrink-0 flex-col border-r border-slate-100 bg-slate-50/20`}
      >
        {/* Search Header */}
        <div className="p-4 border-b border-slate-100 bg-white space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-tight text-slate-800 flex items-center gap-2">
            <MessageSquare size={16} className="text-indigo-600" />
            Tin nhắn chiến dịch
          </h3>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm chiến dịch..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200/80 outline-none transition focus:bg-white focus:border-indigo-500/80 text-slate-700 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Campaign List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {wardCampaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Inbox size={32} className="text-slate-355 stroke-[1.5] mb-2" />
              <p className="text-xs font-bold text-slate-400">Không tìm thấy chiến dịch</p>
            </div>
          ) : (
            wardCampaigns.map((camp) => (
              <CampaignListItem
                key={camp.id}
                campaign={camp}
                isSelected={selectedCampaignId === camp.id}
                onClick={() => setSelectedCampaignId(camp.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* ─── RIGHT COLUMN: CHAT BOX (Desktop: flex-1, Mobile: conditional) ─── */}
      <div
        className={`${
          selectedCampaignId ? "flex" : "hidden md:flex"
        } flex-1 flex-col h-full bg-slate-50/50 min-w-0`}
      >
        {selectedCampaignId ? (
          <ActiveChatArea
            campaignId={selectedCampaignId}
            onBack={() => setSelectedCampaignId(null)}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/40">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 border border-indigo-100/50 shadow-sm animate-pulse">
              <MessageSquare size={32} />
            </div>
            <h3 className="text-sm font-extrabold text-slate-800">Chưa chọn chiến dịch</h3>
            <p className="text-xs font-semibold text-slate-400 mt-2 max-w-sm leading-relaxed">
              Chọn một chiến dịch từ danh sách bên trái để bắt đầu xem và trao đổi tin nhắn với các
              tình nguyện viên.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── HELPER COMPONENT: CAMPAIGN LIST ITEM ───
function CampaignListItem({
  campaign,
  isSelected,
  onClick,
}: {
  campaign: Campaign;
  isSelected: boolean;
  onClick: () => void;
}) {
  const thumbnail = useCampaignThumbnail(campaign);

  // Status mapping to friendly vietnamese text and badges
  const statusConfig = useMemo(() => {
    const map: Record<Campaign["status"], { label: string; badge: string }> = {
      recruiting: {
        label: "Đang tuyển",
        badge: "bg-blue-50 text-blue-700 border-blue-100",
      },
      inProgress: {
        label: "Đang diễn ra",
        badge: "bg-amber-50 text-amber-700 border-amber-100",
      },
      active: {
        label: "Đang diễn ra",
        badge: "bg-amber-50 text-amber-700 border-amber-100",
      },
      completed: {
        label: "Đã kết thúc",
        badge: "bg-green-50 text-green-700 border-green-100",
      },
      ended: {
        label: "Đã kết thúc",
        badge: "bg-green-50 text-green-700 border-green-100",
      },
      cancelled: {
        label: "Đã hủy",
        badge: "bg-red-50 text-red-650 border-red-100",
      },
    };
    return map[campaign.status] || { label: campaign.status, badge: "bg-slate-50 text-slate-600" };
  }, [campaign.status]);

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-xl border flex gap-3 transition-all duration-200 cursor-pointer ${
        isSelected
          ? "bg-indigo-50/50 border-indigo-200/80 shadow-sm"
          : "bg-white border-transparent hover:bg-slate-50 hover:border-slate-100/80"
      }`}
    >
      <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-slate-100 bg-slate-50">
        <img
          src={thumbnail}
          alt={campaign.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-start gap-1 mb-1">
          <span
            className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${statusConfig.badge}`}
          >
            {statusConfig.label}
          </span>
        </div>
        <h4 className="text-sm font-bold text-slate-800 truncate mb-1" title={campaign.name}>
          {campaign.name}
        </h4>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="flex items-center gap-1">
            <Users size={12} className="text-slate-400" />
            {campaign.participants}/{campaign.target || "?"}
          </span>
        </div>
      </div>
    </button>
  );
}

// ─── HELPER COMPONENT: ACTIVE CHAT AREA ───
function ActiveChatArea({ campaignId, onBack }: { campaignId: string; onBack: () => void }) {
  const campaign = useCampaignDetail(campaignId);
  const { user } = useAuth();
  const [draft, setDraft] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  interface ImageAttachment {
    id: string;
    file: File;
    preview: string;
    url: string | null;
    isUploading: boolean;
    error?: string;
  }
  const [attachments, setAttachments] = useState<ImageAttachment[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [searchMsgQuery, setSearchMsgQuery] = useState("");
  const [isSearchingMsg, setIsSearchingMsg] = useState(false);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    setShowScrollBottomBtn(distanceFromBottom > 300);
  };

  const {
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    sendMessage,
    isLoading: chatLoading,
    isWsConnected,
    error: chatError,
    isError: isChatError,
    chatMessages,
  } = useCampaignChat(campaignId);

  const pinMutation = usePinChatMessage(campaignId);
  const unpinMutation = useUnpinChatMessage(campaignId);
  const deleteMutation = useDeleteChatMessageMutation(campaignId);
  const announcementMutation = useSetAnnouncementMode(campaignId);

  const formattedMessages = useMemo(() => {
    return chatMessages
      .filter(
        (msg) =>
          (msg.message && msg.message.trim() !== "") || (msg.imageUrls && msg.imageUrls.length > 0),
      )
      .map((msg) => {
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

  const pinnedMessages = useMemo(() => {
    return formattedMessages.filter((m) => m.pinned);
  }, [formattedMessages]);

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

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);
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

  const handleSendMessage = () => {
    const announcementMode = campaign?.announcementMode ?? false;
    const isInputDisabled =
      (announcementMode && !campaign?.canManage) ||
      (isCampaignEndedOrCancelled && !campaign?.canManage);
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
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error(err);
        toast.error(`Không thể tải ảnh "${att.file.name}" lên server: ${errorMsg}`);
        setAttachments((prev) =>
          prev.map((item) =>
            item.id === att.id ? { ...item, isUploading: false, error: errorMsg } : item,
          ),
        );
      }
    });
  };

  const handleCancelAttachment = (attId: string) => {
    setAttachments((prev) => {
      const target = prev.find((item) => item.id === attId);
      if (target) {
        URL.revokeObjectURL(target.preview);
      }
      return prev.filter((item) => item.id !== attId);
    });
  };

  const handleResend = (msg: ChatMessage) => {
    sendMessage.mutate({
      content: msg.text,
      imageUrls: msg.imageUrls,
      resendId: Number(msg.id),
    });
  };

  const isForbiddenError = isChatError && (chatError as { status?: number })?.status === 403;
  const isBanned =
    isForbiddenError && (chatError as { message?: string })?.message?.includes("khóa");

  if (isForbiddenError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="mx-auto w-12 h-12 bg-red-100 text-red-650 rounded-full flex items-center justify-center mb-4">
          <Lock size={22} />
        </div>
        <h3 className="text-sm font-extrabold text-slate-900 mb-2">
          {isBanned ? "Tài khoản bị khóa" : "Không có quyền truy cập"}
        </h3>
        <p className="text-xs font-semibold text-slate-500 max-w-xs leading-relaxed">
          {isBanned
            ? "Tài khoản cán bộ của bạn đã bị khóa. Vui lòng liên hệ quản trị viên để mở khóa."
            : "Phường của bạn không quản lý hoặc có quyền xem nhóm chat của chiến dịch này."}
        </p>
      </div>
    );
  }

  if (!campaign || chatLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-6 h-6 border-2 border-indigo-650 border-t-transparent rounded-full animate-spin mb-2" />
        <p className="text-xs font-bold text-slate-400">Đang tải tin nhắn...</p>
      </div>
    );
  }

  const isCampaignEndedOrCancelled = campaign.status === "ended" || campaign.status === "cancelled";

  const announcementMode = campaign.announcementMode ?? false;
  const isInputDisabled =
    (announcementMode && !campaign.canManage) ||
    (isCampaignEndedOrCancelled && !campaign.canManage);

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 bg-white relative">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-100 bg-white px-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-1 text-slate-400 hover:text-slate-650 hover:bg-slate-50 rounded-lg md:hidden shrink-0"
            aria-label="Back"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="w-8 h-8 shrink-0 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
            {campaign.name.substring(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h4
              className="truncate text-sm font-extrabold text-slate-800 md:text-base"
              title={campaign.name}
            >
              {campaign.name}
            </h4>
            <button
              onClick={() => setIsMembersModalOpen(true)}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mt-0.5 hover:text-indigo-650 transition cursor-pointer select-none"
              title="Xem danh sách thành viên"
            >
              <Users size={12} className="shrink-0" />
              <span>{campaign.participants} thành viên</span>
            </button>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setIsSearchingMsg((prev) => !prev);
              if (!isSearchingMsg) {
                setSearchMsgQuery("");
              }
            }}
            className={`p-1.5 rounded-lg transition-all border ${
              isSearchingMsg
                ? "bg-indigo-50 text-indigo-650 border-indigo-200"
                : "text-slate-400 hover:text-indigo-650 hover:bg-slate-50 border-transparent"
            }`}
            title="Tìm kiếm tin nhắn"
          >
            <Search size={14} />
          </button>
          <Link
            to="/ward"
            search={{ tab: "campaign", detailId: campaignId }}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100/80 rounded-lg transition-all shadow-sm active:scale-[0.97] cursor-pointer"
          >
            <Info size={12} />
            <span>Xem chi tiết</span>
          </Link>
          {pinnedMessages.length > 0 && (
            <PinnedMessagesDropdown
              pinnedMessages={pinnedMessages}
              canManage={!!campaign.canManage}
              onUnpin={(msgId) => unpinMutation.mutate(msgId)}
              onJumpTo={(msgId) => {
                const el = document.querySelector(`[data-message-id="${msgId}"]`);
                if (el) {
                  el.scrollIntoView({ behavior: "smooth", block: "center" });
                  el.classList.add("bg-amber-50");
                  setTimeout(() => {
                    el.classList.remove("bg-amber-50");
                  }, 2000);
                } else {
                  toast.error("Không tìm thấy tin nhắn hoặc tin nhắn chưa được tải.");
                }
              }}
            />
          )}
          <CampaignChatMenu
            campaignId={campaignId}
            canManage={!!campaign.canManage}
            chatMessages={formattedMessages}
            announcementMode={announcementMode}
            setAnnouncementMode={(val) => announcementMutation.mutate(val)}
            onUnpin={(msgId) => unpinMutation.mutate(msgId)}
            onShowMembers={() => setIsMembersModalOpen(true)}
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

      {/* Admin Notice */}
      <div className="flex shrink-0 items-center justify-between border-b border-indigo-100/50 bg-indigo-50/40 px-4 py-1.5 text-[11px] font-semibold text-indigo-700">
        <span className="min-w-0">
          <Crown size={12} className="mr-1 inline text-amber-500" />
          Bạn đang nhắn tin với tư cách là cán bộ quản lý phường.
        </span>
      </div>

      {/* Message Feed */}
      <div
        className="flex-1 overflow-y-auto bg-slate-50/50 px-4 py-4"
        ref={scrollContainerRef}
        onScroll={handleScroll}
      >
        <div className="mx-auto flex max-w-5xl flex-col gap-4">
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

          {formattedMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <AlertCircle size={28} className="text-slate-300 mb-2" />
              <p className="text-xs font-semibold">Chưa có tin nhắn nào</p>
            </div>
          ) : (
            formattedMessages.map((message) => (
              <div
                key={message.id}
                data-message-id={message.id}
                className="transition-all duration-300 rounded-xl"
              >
                <CampaignChatBubble
                  message={message}
                  canManage={!!campaign.canManage}
                  onPin={(msgId) => pinMutation.mutate(msgId)}
                  onUnpin={(msgId) => unpinMutation.mutate(msgId)}
                  onResend={handleResend}
                  onAvatarClick={(userId) => setSelectedUserId(userId)}
                  onDelete={(msgId) => {
                    if (confirm("Bạn có chắc chắn muốn xóa tin nhắn này không?")) {
                      deleteMutation.mutate(msgId);
                    }
                  }}
                  highlightQuery={isSearchingMsg ? searchMsgQuery : undefined}
                />
              </div>
            ))
          )}
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
          className="absolute bottom-[80px] right-6 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-500 hover:text-indigo-600 hover:bg-white border border-slate-200/80 shadow-md backdrop-blur-sm transition-all duration-200 active:scale-95 cursor-pointer"
          title="Về tin nhắn mới nhất"
        >
          <ChevronsDown size={18} />
        </button>
      )}

      {/* Footer / Input Area */}
      <footer className="shrink-0 border-t border-slate-100 bg-white px-4 py-3">
        {attachments.length > 0 && (
          <div className="mx-auto max-w-5xl mb-3 flex flex-wrap gap-2 bg-slate-50 border border-slate-200/50 p-2 rounded-xl">
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
          <div className="mx-auto max-w-5xl flex flex-col gap-1.5 py-2.5 px-4 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-650 font-medium">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-slate-500 shrink-0" />
              <span className="font-semibold">
                Chiến dịch đã {campaign.status === "cancelled" ? "bị hủy" : "kết thúc"}. Nhóm chat
                hiện ở chế độ chỉ đọc.
              </span>
            </div>
            {campaign.status === "cancelled" && campaign.cancellationReason && (
              <div className="text-[10px] font-bold text-rose-500 italic ml-6">
                Lý do hủy: {campaign.cancellationReason}
              </div>
            )}
          </div>
        ) : isInputDisabled ? (
          <div className="mx-auto max-w-5xl flex items-center gap-2.5 py-2.5 px-4 rounded-xl bg-blue-50 border border-blue-100 text-xs text-slate-600">
            <Info className="h-4 w-4 text-indigo-600 shrink-0" />
            <span className="font-semibold text-slate-700">
              Nhóm chat đang ở chế độ chỉ dành cho cán bộ phường nhắn tin.
            </span>
          </div>
        ) : (
          <div className="mx-auto flex max-w-5xl items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="grid h-11 w-11 place-items-center rounded-xl text-slate-400 hover:text-indigo-650 hover:bg-slate-50 transition cursor-pointer border border-slate-200/60 shadow-sm shrink-0"
              title="Đính kèm ảnh"
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
              triggerSize={18}
              triggerClassName="grid h-11 w-11 place-items-center rounded-xl text-slate-400 hover:text-indigo-650 hover:bg-slate-50 transition cursor-pointer border border-slate-200/60 shadow-sm disabled:opacity-50 shrink-0"
            />

            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setShowQuickReplies((prev) => !prev)}
                disabled={isInputDisabled}
                className={`grid h-11 w-11 place-items-center rounded-xl transition cursor-pointer border shadow-sm disabled:opacity-50 shrink-0 ${
                  showQuickReplies
                    ? "bg-amber-50 text-amber-600 border-amber-200"
                    : "text-slate-400 hover:text-amber-500 hover:bg-slate-50 border-slate-200/60"
                }`}
                title="Trả lời nhanh"
              >
                <Zap size={18} />
              </button>
              {showQuickReplies && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowQuickReplies(false)} />
                  <div className="absolute bottom-14 left-0 z-50 w-72 md:w-80 rounded-2xl bg-white border border-slate-200 shadow-xl p-3 animate-[chatSlideUp_0.15s_ease] space-y-2">
                    <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1 py-0.5 border-b border-slate-100 mb-1 flex items-center gap-1">
                      <Zap size={10} className="text-amber-500" />
                      Tin nhắn mẫu nhanh
                    </h5>
                    <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                      {[
                        "Mọi người lưu ý tập trung đúng giờ tại địa điểm đã thông báo nhé!",
                        "Hãy đảm bảo an toàn lao động và mặc trang phục bảo hộ đầy đủ.",
                        "Cán bộ đã duyệt thêm một số tình nguyện viên mới. Mọi người chào mừng nhé!",
                        "Chiến dịch hôm nay tạm hoãn do thời tiết xấu. Lịch cụ thể sẽ thông báo sau.",
                        "Cảm ơn tinh thần tình nguyện của các bạn trong ngày hôm nay!",
                      ].map((tpl, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setDraft((prev) => (prev ? prev + " " + tpl : tpl));
                            setShowQuickReplies(false);
                          }}
                          className="w-full text-left p-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-amber-50/50 hover:text-amber-800 transition border border-transparent hover:border-amber-100/50 cursor-pointer block truncate"
                          title={tpl}
                        >
                          {tpl}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSendMessage();
              }}
              placeholder="Nhập tin nhắn..."
              className="h-11 min-w-0 flex-1 rounded-xl px-4 text-sm font-semibold outline-none border border-slate-200/80 transition placeholder:text-slate-400 focus:bg-white focus:border-indigo-500/80 bg-slate-50 text-slate-800"
            />
            <button
              type="button"
              onClick={handleSendMessage}
              disabled={
                (!draft.trim() && attachments.filter((a) => a.url).length === 0) ||
                attachments.some((a) => a.isUploading)
              }
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-350 transition shadow-sm active:scale-[0.97] cursor-pointer"
              aria-label="Gửi tin nhắn"
            >
              <SendHorizontal size={19} />
            </button>
          </div>
        )}
      </footer>

      {isMembersModalOpen && (
        <CampaignMembersModal
          campaignId={campaignId}
          campaign={campaign}
          messages={formattedMessages}
          onClose={() => setIsMembersModalOpen(false)}
          onAvatarClick={(userId) => setSelectedUserId(userId)}
        />
      )}

      {selectedUserId && (
        <CitizenProfileModal userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
      )}
    </div>
  );
}

// ─── HELPER COMPONENT: CAMPAIGN MEMBERS & MEDIA MODAL ───
function CampaignMembersModal({
  campaignId,
  campaign,
  messages,
  onClose,
  onAvatarClick,
}: {
  campaignId: string;
  campaign: Campaign;
  messages: ChatMessage[];
  onClose: () => void;
  onAvatarClick: (userId: number) => void;
}) {
  const { data: participants = [], isLoading } = useCampaignParticipants(campaignId);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"members" | "media">("members");
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const activeMembers = useMemo(() => {
    return participants.filter(
      (p) =>
        (p.joinStatus === "APPROVED" || p.joinStatus === "CONFIRMED" || p.joinStatus === "MAYBE") &&
        p.citizenName.toLowerCase().includes(search.toLowerCase()),
    );
  }, [participants, search]);

  const chatImages = useMemo(() => {
    const list: { url: string; sender: string; time: string }[] = [];
    messages.forEach((msg) => {
      if (msg.imageUrls && msg.imageUrls.length > 0) {
        msg.imageUrls.forEach((url) => {
          list.push({
            url,
            sender: msg.sender,
            time: msg.time,
          });
        });
      }
    });
    return list;
  }, [messages]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl animate-[chatSlideUp_0.2s_ease] overflow-hidden flex flex-col max-h-[500px]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 shrink-0 bg-white">
          <div className="flex items-center gap-2 text-indigo-750 font-black text-sm uppercase tracking-wider">
            <Users size={16} className="text-indigo-650" />
            Chi tiết phòng trò chuyện
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 shrink-0">
          <button
            onClick={() => setActiveTab("members")}
            className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition ${
              activeTab === "members"
                ? "border-indigo-600 text-indigo-600 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Thành viên ({activeMembers.length})
          </button>
          <button
            onClick={() => setActiveTab("media")}
            className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition ${
              activeTab === "media"
                ? "border-indigo-600 text-indigo-600 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Hình ảnh / Media ({chatImages.length})
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-5">
          {activeTab === "members" ? (
            <>
              {/* Admin / Host Section */}
              <section>
                <h5 className="mb-2.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Quản trị viên (Cán bộ)
                </h5>
                <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-3 flex items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber-100 text-xs font-black text-amber-700">
                    {getInitials(campaign.createdBy)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-extrabold text-slate-800">
                      {campaign.createdBy}
                    </p>
                    <p className="text-[10px] font-semibold text-slate-400">
                      {campaign.ward || "Cán bộ phường"}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-black text-amber-700 uppercase tracking-wide">
                    <Crown size={10} />
                    Admin
                  </span>
                </div>
              </section>

              {/* Search bar for members */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Danh sách thành viên
                  </h5>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm thành viên..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 py-2 text-xs font-semibold outline-none transition focus:border-indigo-500 focus:bg-white placeholder:text-slate-400 text-slate-800"
                  />
                </div>

                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                    <Loader2 className="h-5 w-5 animate-spin mb-2" />
                    <span className="text-xs font-semibold">Đang tải danh sách...</span>
                  </div>
                ) : activeMembers.length > 0 ? (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {activeMembers.map((member) => (
                      <div
                        key={member.id}
                        onClick={() => onAvatarClick(member.citizenId)}
                        className="flex items-center gap-3 rounded-xl p-2 hover:bg-slate-50 transition cursor-pointer border border-transparent hover:border-slate-100"
                      >
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-indigo-50 text-xs font-black text-indigo-750">
                          {getInitials(member.citizenName)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-extrabold text-slate-800 hover:text-indigo-650 transition">
                            {member.citizenName}
                          </p>
                          {member.citizenPhone && (
                            <p className="text-[10px] font-medium text-slate-450 mt-0.5">
                              SĐT: {member.citizenPhone}
                            </p>
                          )}
                        </div>
                        <span className="rounded-full bg-emerald-50 border border-emerald-100 px-2 py-0.5 text-[9px] font-black text-emerald-700">
                          {getJoinStatusLabel(member.joinStatus)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-xs font-semibold text-slate-400">
                    {search ? "Không tìm thấy thành viên nào." : "Chưa có thành viên nào tham gia."}
                  </div>
                )}
              </section>
            </>
          ) : (
            <div className="space-y-4">
              {chatImages.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-xs font-semibold text-slate-400 flex flex-col items-center justify-center">
                  <Paperclip size={24} className="text-slate-350 mb-2" />
                  Chưa có hình ảnh nào được gửi trong nhóm này.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {chatImages.map((img, i) => (
                    <div
                      key={i}
                      onClick={() => setPreviewImageUrl(img.url)}
                      className="group relative aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-50 cursor-pointer shadow-sm active:scale-95 transition-all"
                      title={`Gửi bởi: ${img.sender} lúc ${img.time}`}
                    >
                      <img
                        src={img.url}
                        alt="Media upload"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex flex-col justify-end p-1.5 text-white">
                        <p className="text-[8px] font-black truncate">{img.sender}</p>
                        <p className="text-[7px] font-bold opacity-80">{img.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {previewImageUrl && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm cursor-zoom-out animate-[chatSlideUp_0.15s_ease]"
          onClick={() => setPreviewImageUrl(null)}
        >
          <button
            onClick={() => setPreviewImageUrl(null)}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition"
          >
            <X size={20} />
          </button>
          <img
            src={previewImageUrl}
            alt="Preview large"
            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}
