import { useEffect, useMemo, useRef, useState } from "react";
import {
  Minus,
  X,
  Plus,
  Image,
  SendHorizontal,
  Loader2,
  AlertCircle,
  Smile,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  MessageSquare,
  Palette,
  UserCheck,
  LogOut,
  Check,
  Pin,
} from "lucide-react";
import {
  useCampaignChat,
  useCampaignDetail,
  usePinChatMessage,
  useUnpinChatMessage,
  useDeleteChatMessageMutation,
  useCampaignParticipants,
  useLeaveCampaign,
} from "@/hooks/useCampaigns";
import { useAuth } from "@/lib/auth";
import { Role } from "@/lib/roles";
import { API_BASE, getToken } from "@/lib/api";
import { toast } from "sonner";
import { CampaignChatBubble } from "./CampaignChatBubble";
import { EmojiPicker } from "./EmojiPicker";
import type { ChatMessage } from "./CampaignChatHelpers";

interface FloatingCampaignChatProps {
  campaignId: string;
  onClose: () => void;
}

interface ImageAttachment {
  id: string;
  file: File;
  preview: string;
  url: string | null;
  isUploading: boolean;
}

export function FloatingCampaignChat({ campaignId, onClose }: FloatingCampaignChatProps) {
  const campaign = useCampaignDetail(campaignId);
  const { user } = useAuth();

  const [isMinimized, setIsMinimized] = useState(false);
  const [draft, setDraft] = useState("");
  const [attachments, setAttachments] = useState<ImageAttachment[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    sendMessage,
    isLoading: chatLoading,
    isWsConnected,
    chatMessages,
  } = useCampaignChat(campaignId);

  const pinMutation = usePinChatMessage(campaignId);
  const unpinMutation = useUnpinChatMessage(campaignId);
  const deleteMutation = useDeleteChatMessageMutation(campaignId);

  // Dropdown & Settings state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<"menu" | "theme" | "emoji" | "pinned" | "members">(
    "menu",
  );

  // Customization states persisted in localStorage
  const [chatTheme, setChatTheme] = useState<string>(() => {
    return localStorage.getItem(`campaign-chat-theme-${campaignId}`) || "default";
  });
  const [quickEmoji, setQuickEmoji] = useState<string>(() => {
    return localStorage.getItem(`campaign-chat-quick-emoji-${campaignId}`) || "👍";
  });

  // Leave Campaign hook
  const leaveCampaign = useLeaveCampaign();

  // Participant query
  const { data: participants = [], isLoading: loadingParticipants } = useCampaignParticipants(
    campaignId,
    activePanel === "members",
  );

  const isCampaignEndedOrCancelled =
    campaign?.status === "ended" ||
    campaign?.status === "completed" ||
    campaign?.status === "cancelled";

  const isInputDisabled =
    ((campaign?.announcementMode ?? false) && !campaign?.canManage) ||
    (isCampaignEndedOrCancelled && !campaign?.canManage);

  // Set message seen status in localStorage on loading
  useEffect(() => {
    if (chatMessages && chatMessages.length > 0) {
      const maxId = Math.max(...chatMessages.map((m) => Number(m.id)).filter((id) => !isNaN(id)));
      if (maxId > 0) {
        localStorage.setItem(`campaign-chat-seen-${campaignId}`, String(maxId));
      }
    }
  }, [chatMessages, campaignId]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (!isMinimized && !isSettingsOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isMinimized, isSettingsOpen]);

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
          role: isMe ? ("me" as const) : isHost ? ("host" as const) : ("member" as const),
          sender: msg.senderName,
          senderId: msg.senderId,
          text: msg.message || "",
          imageUrls: msg.imageUrls || [],
          time: timeStr,
          pinned: msg.pinned,
          status: "sent" as const,
          senderAvatar: msg.senderAvatar,
          pastCampaignCount: msg.pastCampaignCount,
        };
      });
  }, [chatMessages, user]);

  const pinnedMessages = useMemo(() => {
    return formattedMessages.filter((m) => m.pinned);
  }, [formattedMessages]);

  const handleResend = (msg: ChatMessage) => {
    sendMessage.mutate({
      content: msg.text,
      imageUrls: msg.imageUrls,
      resendId: Number(msg.id),
    });
  };

  const handleSendMessage = () => {
    if (isInputDisabled) {
      toast.error("Không thể nhắn tin. Nhóm chat đang ở chế độ chỉ đọc.");
      return;
    }

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
    if (isInputDisabled) return;

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
        setAttachments((prev) => prev.filter((item) => item.id !== att.id));
      }
    });
  };

  const handleLeaveGroup = () => {
    if (confirm("Bạn có chắc chắn muốn rời khỏi chiến dịch này và nhóm chat không?")) {
      leaveCampaign.mutate(
        { id: campaignId, reason: "Rời nhóm từ cửa sổ chat nổi" },
        {
          onSuccess: () => {
            toast.success("Đã rời chiến dịch thành công!");
            onClose();
          },
          onError: (err) => {
            toast.error(err.message || "Không thể rời chiến dịch.");
          },
        },
      );
    }
  };

  const handleScrollToMessage = (messageId: string | number) => {
    console.log("[ChatScroll] handleScrollToMessage called for messageId:", messageId);
    const el = document.getElementById(`msg-${messageId}`);
    console.log("[ChatScroll] Target element found:", el);

    if (el) {
      // Find the scrollable container parent
      const container = el.closest(".overflow-y-auto");
      console.log("[ChatScroll] Scroll container:", container);

      if (container) {
        const containerRect = container.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();

        // Calculate exact scrollTop to center the message bubble in the scroll view
        const targetScrollTop =
          container.scrollTop +
          (elRect.top - containerRect.top) -
          containerRect.height / 2 +
          elRect.height / 2;

        container.scrollTo({
          top: targetScrollTop,
          behavior: "smooth",
        });
      } else {
        // Fallback to standard scrollIntoView
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }

      // Temporary premium visual highlight effect (ring glow and slight zoom)
      el.classList.add(
        "ring-2",
        "ring-amber-500",
        "ring-offset-2",
        "scale-[1.02]",
        "bg-amber-50/50",
      );
      setTimeout(() => {
        el.classList.remove(
          "ring-2",
          "ring-amber-500",
          "ring-offset-2",
          "scale-[1.02]",
          "bg-amber-50/50",
        );
      }, 2000);
    } else {
      toast.error("Không tìm thấy tin nhắn này trong khung chat hiện tại.");
    }
  };

  const campaignTitle = campaign?.name || "Chiến dịch";
  const coverImg = campaign?.coverImageUrl || null;

  const getThemeClass = () => {
    switch (chatTheme) {
      case "lavender":
        return "bg-gradient-to-br from-purple-50 via-indigo-50 to-indigo-150";
      case "sunset":
        return "bg-gradient-to-br from-amber-50 via-orange-50 to-rose-150";
      case "ocean":
        return "bg-gradient-to-br from-sky-50 via-blue-50 to-emerald-150";
      case "midnight":
        return "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-slate-100";
      case "matrix":
        return "bg-zinc-950 text-emerald-400 font-mono";
      case "default":
      default:
        return "bg-slate-50";
    }
  };

  return (
    <div
      className={`fixed bottom-0 right-4 sm:right-10 z-[999] w-[340px] sm:w-[380px] bg-white border border-[#E4EAF2] rounded-t-xl shadow-2xl transition-all duration-300 flex flex-col font-sans ${
        isMinimized ? "h-[52px]" : "h-[480px] sm:h-[520px]"
      }`}
    >
      {/* Settings Panel positioned to the left of the main chat box */}
      {!isMinimized && isSettingsOpen && (
        <div className="absolute bottom-0 right-full mr-2 w-[280px] sm:w-[320px] h-full bg-white border border-[#E4EAF2] rounded-xl shadow-2xl flex flex-col z-[1000] overflow-hidden text-slate-700 animate-[fadeIn_0.15s_ease-out]">
          {/* Settings Subheader */}
          <div className="h-12 border-b border-slate-100 px-3 bg-slate-50 flex items-center gap-2 shrink-0 select-none">
            {activePanel !== "menu" && (
              <button
                onClick={() => setActivePanel("menu")}
                className="p-1.5 hover:bg-slate-200 rounded-full transition cursor-pointer"
                title="Quay lại"
              >
                <ChevronLeft size={16} className="text-slate-600" />
              </button>
            )}
            <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
              {activePanel === "menu" && "Cài đặt đoạn chat"}
              {activePanel === "theme" && "Thay đổi chủ đề"}
              {activePanel === "emoji" && "Biểu tượng nhanh"}
              {activePanel === "pinned" && "Tin nhắn đã ghim"}
              {activePanel === "members" && "Thành viên nhóm"}
            </span>
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="ml-auto p-1.5 hover:bg-slate-200 rounded-full transition cursor-pointer text-slate-400 hover:text-slate-600"
              title="Đóng cài đặt"
            >
              <X size={16} />
            </button>
          </div>

          {/* Settings Scroll Content */}
          <div className="flex-1 overflow-y-auto p-3 text-slate-700">
            {activePanel === "menu" && (
              <div className="space-y-1">
                {[
                  {
                    id: "open",
                    label: "Mở trong trang chính",
                    desc: "Xem cuộc trò chuyện ở trang chi tiết",
                    icon: MessageSquare,
                    color: "text-blue-500 bg-blue-50",
                    action: () => {
                      if (user?.role === Role.WARD_STAFF) {
                        window.location.href = `/ward?tab=chat&detailId=${campaignId}`;
                      } else {
                        window.location.href = `/campaigns/${campaignId}/group-chat`;
                      }
                    },
                  },
                  {
                    id: "theme",
                    label: "Đổi chủ đề",
                    desc: "Tùy chỉnh màu nền khung chat",
                    icon: Palette,
                    color: "text-purple-500 bg-purple-50",
                    action: () => setActivePanel("theme"),
                  },
                  {
                    id: "emoji",
                    label: "Biểu tượng cảm xúc",
                    desc: `Thay đổi icon gửi nhanh (${quickEmoji})`,
                    icon: Smile,
                    color: "text-amber-500 bg-amber-50",
                    action: () => setActivePanel("emoji"),
                  },
                  {
                    id: "pinned",
                    label: "Xem tin nhắn đã ghim",
                    desc: "Xem danh sách tin nhắn được ghim",
                    icon: Pin,
                    color: "text-orange-500 bg-orange-50",
                    action: () => setActivePanel("pinned"),
                  },
                  {
                    id: "members",
                    label: "Thành viên",
                    desc: "Danh sách những người tham gia",
                    icon: UserCheck,
                    color: "text-indigo-500 bg-indigo-50",
                    action: () => setActivePanel("members"),
                  },
                  {
                    id: "leave",
                    label: "Rời nhóm",
                    desc: "Hủy tham gia chiến dịch và nhóm chat",
                    icon: LogOut,
                    color: "text-rose-500 bg-rose-50",
                    action: handleLeaveGroup,
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={item.action}
                    className="w-full flex items-start gap-3 p-2 hover:bg-slate-50 rounded-xl transition text-left cursor-pointer active:bg-slate-100"
                  >
                    <div className={`p-2 rounded-xl shrink-0 ${item.color}`}>
                      <item.icon size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-800">{item.label}</p>
                      <p className="text-[10px] text-slate-400 font-semibold leading-normal truncate">
                        {item.desc}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {activePanel === "theme" && (
              <div className="space-y-3">
                <p className="text-xs font-medium text-slate-500 mb-2">
                  Chọn giao diện cho cuộc trò chuyện này:
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: "default", name: "Mặc định", preview: "bg-slate-100 border-slate-300" },
                    {
                      id: "lavender",
                      name: "Oải hương",
                      preview: "bg-gradient-to-br from-purple-200 to-indigo-300 border-indigo-400",
                    },
                    {
                      id: "sunset",
                      name: "Hoàng hôn",
                      preview: "bg-gradient-to-br from-amber-200 to-rose-300 border-rose-400",
                    },
                    {
                      id: "ocean",
                      name: "Đại dương",
                      preview: "bg-gradient-to-br from-sky-200 to-emerald-300 border-emerald-400",
                    },
                    {
                      id: "midnight",
                      name: "Đêm huyền ảo",
                      preview: "bg-gradient-to-br from-slate-700 to-slate-900 border-slate-800",
                    },
                    {
                      id: "matrix",
                      name: "Ma trận",
                      preview: "bg-black border border-emerald-500",
                    },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setChatTheme(t.id);
                        localStorage.setItem(`campaign-chat-theme-${campaignId}`, t.id);
                        toast.success(`Đã đổi chủ đề sang "${t.name}"`);
                      }}
                      className={`flex flex-col items-center gap-2 p-2 rounded-xl border transition-all cursor-pointer ${
                        chatTheme === t.id
                          ? "border-[#0B4FC4] bg-blue-50/50"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-full shadow-sm border ${t.preview}`} />
                      <span className="text-[11px] font-bold text-slate-700">{t.name}</span>
                      {chatTheme === t.id && (
                        <span className="text-[10px] text-[#0B4FC4] font-black flex items-center gap-0.5">
                          <Check size={10} /> Đang dùng
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activePanel === "emoji" && (
              <div>
                <p className="text-xs font-medium text-slate-500 mb-3">
                  Chọn biểu tượng phản hồi nhanh:
                </p>
                <div className="grid grid-cols-4 gap-3">
                  {["👍", "❤️", "😆", "😮", "😢", "🔥", "👏", "🎉", "🤝", "💡", "✅", "❌"].map(
                    (em) => (
                      <button
                        key={em}
                        onClick={() => {
                          setQuickEmoji(em);
                          localStorage.setItem(`campaign-chat-quick-emoji-${campaignId}`, em);
                          toast.success(`Đã đổi biểu tượng nhanh thành ${em}`);
                          setActivePanel("menu");
                        }}
                        className={`text-2xl p-3 hover:bg-slate-100 active:scale-90 transition rounded-xl border cursor-pointer ${
                          quickEmoji === em ? "border-amber-400 bg-amber-50" : "border-slate-200"
                        }`}
                      >
                        {em}
                      </button>
                    ),
                  )}
                </div>
              </div>
            )}

            {activePanel === "pinned" && (
              <div className="space-y-3">
                <p className="text-xs font-medium text-slate-500 mb-2">
                  Các tin nhắn được ghim bởi quản trị viên:
                </p>
                {pinnedMessages.length === 0 ? (
                  <div className="text-center py-8">
                    <Pin size={24} className="mx-auto text-slate-350 mb-1" />
                    <p className="text-xs text-slate-400 font-semibold">
                      Chưa có tin nhắn nào được ghim
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {pinnedMessages.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => handleScrollToMessage(m.id)}
                        className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100/50 hover:border-slate-200 transition flex items-start gap-2 relative cursor-pointer active:scale-[0.98]"
                        title="Nhấp để đi đến tin nhắn"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-slate-500 mb-0.5">{m.sender}</p>
                          {m.text && (
                            <p className="text-xs text-slate-700 leading-relaxed line-clamp-3">
                              {m.text}
                            </p>
                          )}
                          {m.imageUrls && m.imageUrls.length > 0 && (
                            <p className="text-[10px] text-blue-500 font-semibold mt-1">
                              Đính kèm {m.imageUrls.length} hình ảnh
                            </p>
                          )}
                        </div>
                        {campaign?.canManage && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              unpinMutation.mutate(m.id);
                            }}
                            className="p-1 hover:bg-white text-slate-400 hover:text-rose-500 rounded border border-slate-205/50 cursor-pointer z-10"
                            title="Bỏ ghim"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activePanel === "members" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-slate-500">Thành viên trong chiến dịch:</p>
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                    {participants.length} người
                  </span>
                </div>
                {loadingParticipants ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="w-5 h-5 text-[#0B4FC4] animate-spin" />
                  </div>
                ) : participants.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-8">
                    Không tìm thấy thành viên nào.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                    {participants.map((p) => (
                      <div
                        key={p.id}
                        className="p-2 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-700 truncate">
                            {p.citizenName}
                          </p>
                          <p className="text-[9px] text-slate-400 truncate">{p.citizenEmail}</p>
                        </div>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                            p.joinStatus === "APPROVED" || p.joinStatus === "CONFIRMED"
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                              : p.joinStatus === "PENDING"
                                ? "bg-amber-50 text-amber-600 border border-amber-100"
                                : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {p.joinStatus === "APPROVED"
                            ? "Đã duyệt"
                            : p.joinStatus === "CONFIRMED"
                              ? "Tham gia"
                              : p.joinStatus}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header Bar */}
      <div className="h-[52px] px-3 bg-gradient-to-r from-[#123E8A] to-[#0B4FC4] text-white flex items-center justify-between rounded-t-xl shrink-0 select-none shadow-md">
        {/* Info */}
        <button
          onClick={() => {
            if (isMinimized) {
              setIsMinimized(false);
            } else {
              setIsSettingsOpen(!isSettingsOpen);
              setActivePanel("menu");
            }
          }}
          className="flex items-center gap-2 overflow-hidden text-left bg-transparent border-0 outline-none cursor-pointer group"
          title="Cài đặt đoạn chat"
        >
          <div className="relative shrink-0">
            {coverImg ? (
              <img
                src={coverImg}
                alt={campaignTitle}
                className="w-8 h-8 rounded-full object-cover border border-white/20 animate-[pulse_2s_infinite]"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-white/10 text-white font-bold flex items-center justify-center text-sm border border-white/20">
                {campaignTitle.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border border-[#0B4FC4] rounded-full" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold truncate leading-tight pr-1 flex items-center gap-1 group-hover:text-blue-100 transition-colors">
              <span className="truncate max-w-[130px] sm:max-w-[160px]">{campaignTitle}</span>
              <ChevronDown
                size={12}
                className={`shrink-0 transition-transform ${isSettingsOpen ? "rotate-180" : ""}`}
              />
            </h4>
            <p className="text-[9px] text-green-200/90 font-medium">Đang hoạt động</p>
          </div>
        </button>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 text-white/90">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 hover:bg-white/15 rounded-full transition cursor-pointer"
            title={isMinimized ? "Mở rộng" : "Thu nhỏ"}
          >
            {isMinimized ? <ChevronUp size={14} /> : <Minus size={14} />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/15 rounded-full transition cursor-pointer"
            title="Đóng chat"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Body / Chat Area */}
      {!isMinimized && (
        <div className="flex-1 min-h-0 flex flex-col relative overflow-hidden bg-slate-50">
          {/* Scroll Area */}
          <div className={`flex-1 overflow-y-auto p-3 space-y-3 ${getThemeClass()}`}>
            {chatLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-[#0B4FC4] animate-spin" />
              </div>
            )}

            {!chatLoading && formattedMessages.length === 0 && (
              <div className="text-center py-12 px-4">
                <AlertCircle className="w-8 h-8 text-slate-350 mx-auto mb-2" />
                <p className="text-xs text-[#667085] font-sans">
                  Chưa có tin nhắn nào trong cuộc trò chuyện này.
                </p>
              </div>
            )}

            {!chatLoading &&
              formattedMessages.map((message) => (
                <div
                  key={message.id}
                  id={`msg-${message.id}`}
                  className="transition-all duration-300 animate-[fadeIn_0.15s_ease-in-out]"
                >
                  <CampaignChatBubble
                    message={message}
                    canManage={!!campaign?.canManage}
                    onPin={(msgId) => pinMutation.mutate(msgId)}
                    onUnpin={(msgId) => unpinMutation.mutate(msgId)}
                    onResend={handleResend}
                    onDelete={(msgId) => {
                      if (confirm("Bạn có chắc chắn muốn xóa tin nhắn này không?")) {
                        deleteMutation.mutate(msgId);
                      }
                    }}
                  />
                </div>
              ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Locked announcement or ended banner */}
          {isCampaignEndedOrCancelled && !campaign?.canManage && (
            <div className="bg-rose-50 border-t border-b border-rose-200 px-4 py-2 flex items-center justify-center gap-2">
              <span className="text-[10px] text-rose-700 font-bold text-center">
                Chiến dịch đã {campaign?.status === "cancelled" ? "bị hủy" : "kết thúc"}. Nhóm chat
                hiện ở chế độ chỉ đọc.
              </span>
            </div>
          )}

          {!isCampaignEndedOrCancelled && campaign?.announcementMode && !campaign?.canManage && (
            <div className="bg-[#EFF6FF] border-t border-b border-[#BFDBFE] px-4 py-2 flex items-center justify-center gap-2">
              <span className="text-[10px] text-[#1E40AF] font-bold text-center">
                Chỉ quản trị viên mới có thể nhắn tin trong chế độ thông báo
              </span>
            </div>
          )}

          {/* Attachments preview */}
          {attachments.length > 0 && (
            <div className="p-2 bg-white border-t border-slate-100 flex flex-wrap gap-2 animate-[chatSlideUp_0.15s_ease]">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="relative w-12 h-12 rounded border border-slate-200 overflow-hidden shrink-0 group"
                >
                  <img
                    src={att.preview}
                    alt="Upload preview"
                    className="w-full h-full object-cover"
                  />
                  {att.isUploading ? (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    </div>
                  ) : (
                    <button
                      onClick={() => setAttachments((prev) => prev.filter((x) => x.id !== att.id))}
                      className="absolute top-0 right-0 bg-rose-500 text-white p-0.5 rounded-bl hover:bg-rose-600 cursor-pointer"
                    >
                      <X size={10} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Footer Input panel */}
          <div className="p-2 bg-white border-t border-[#E4EAF2] flex items-center gap-1.5 shrink-0">
            {/* Input helpers */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={isInputDisabled}
                className="p-1.5 text-slate-400 hover:text-[#0B4FC4] hover:bg-slate-50 rounded-full transition cursor-pointer disabled:opacity-40"
                title="Tính năng bổ sung"
              >
                <Plus size={16} />
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isInputDisabled}
                className="p-1.5 text-slate-400 hover:text-[#0B4FC4] hover:bg-slate-50 rounded-full transition cursor-pointer disabled:opacity-40"
                title="Gửi hình ảnh"
              >
                <Image size={16} />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                multiple
                accept="image/*"
                className="hidden"
              />
            </div>

            {/* Input pill */}
            <div className="flex-1 relative flex items-center bg-slate-50 border border-[#E4EAF2] rounded-full px-3 py-1">
              <input
                type="text"
                placeholder="Aa"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSendMessage();
                }}
                disabled={isInputDisabled}
                className="w-full bg-transparent text-xs font-semibold text-slate-800 outline-none placeholder:text-slate-400 pr-7 py-1 disabled:cursor-not-allowed"
              />
              <div className="absolute right-1">
                <EmojiPicker
                  onSelectEmoji={(emoji) => setDraft((prev) => prev + emoji)}
                  triggerSize={16}
                  disabled={isInputDisabled}
                  triggerClassName="p-1 text-slate-400 hover:text-amber-500 rounded-full cursor-pointer hover:bg-slate-100 transition block disabled:opacity-40"
                />
              </div>
            </div>

            {/* Send or Quick Emoji action */}
            {!draft.trim() && attachments.length === 0 ? (
              <button
                type="button"
                onClick={() => {
                  if (isInputDisabled) return;
                  sendMessage.mutate({ content: quickEmoji, imageUrls: [] });
                }}
                disabled={isInputDisabled}
                className="p-2 text-base hover:bg-slate-150 rounded-full transition cursor-pointer disabled:opacity-40 select-none shrink-0"
                title={`Gửi nhanh ${quickEmoji}`}
              >
                {quickEmoji}
              </button>
            ) : (
              <button
                onClick={handleSendMessage}
                disabled={isInputDisabled}
                className="p-2 bg-[#0B4FC4] text-white rounded-full transition hover:bg-[#0B4FC4]/90 disabled:bg-slate-200 disabled:text-slate-400 cursor-pointer shadow-sm active:scale-95 shrink-0"
                title="Gửi tin nhắn"
              >
                <SendHorizontal size={14} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
