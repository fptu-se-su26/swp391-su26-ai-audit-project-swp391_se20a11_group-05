import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Paperclip,
  Search,
  SendHorizontal,
  Smile,
  Users,
  X,
  Lock,
  Pin,
  Loader2,
  Crown,
  ChevronLeft,
  ChevronRight,
  Info,
} from "lucide-react";
import {
  useCampaignChat,
  useCampaignDetail,
  usePinChatMessage,
  useUnpinChatMessage,
  useSignalAttendance,
  useDeleteChatMessageMutation,
  useSetAnnouncementMode,
} from "@/hooks/useCampaigns";
import { useAuth } from "@/lib/auth";
import { API_BASE, getToken } from "@/lib/api";
import { toast } from "sonner";
import { CampaignGroupSidebar } from "@/components/chat/CampaignGroupSidebar";
import { CampaignChatBubble } from "@/components/chat/CampaignChatBubble";
import { CampaignChatMenu } from "@/components/chat/CampaignChatMenu";
import { CitizenProfileModal } from "@/components/chat/CitizenProfileModal";
import type { ChatMessage } from "@/components/chat/CampaignChatHelpers";
import type { Campaign } from "@/lib/campaignStore";
import { PinnedMessagesDropdown } from "@/components/chat/PinnedMessagesDropdown";

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

const DEFAULT_CAMPAIGN_NAME = "Chiến dịch cộng đồng";

function CampaignGroupChatPage() {
  const { id } = Route.useParams();
  const campaign = useCampaignDetail(id);
  const { user } = useAuth();
  const [noticeVisible, setNoticeVisible] = useState(true);
  const [infoOpen, setInfoOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const announcementMode = campaign?.announcementMode ?? false;
  const announcementMutation = useSetAnnouncementMode(id);

  interface ImageAttachment {
    id: string;
    file: File;
    preview: string;
    url: string | null;
    isUploading: boolean;
    error?: string;
  }
  const [attachments, setAttachments] = useState<ImageAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    data: chatData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    sendMessage,
    isLoading: chatLoading,
    isWsConnected,
    error: chatError,
    isError: isChatError,
  } = useCampaignChat(id);

  const chatMessages = useMemo(() => {
    if (!chatData) return [];
    const allMsgs = chatData.pages.flat();
    return [...allMsgs].sort((a, b) => {
      const aId = Number(a.id);
      const bId = Number(b.id);
      if (aId < 0 && bId >= 0) return 1;
      if (bId < 0 && aId >= 0) return -1;
      if (aId < 0 && bId < 0) return aId - bId;
      if (a.createdAt !== b.createdAt) {
        return a.createdAt > b.createdAt ? 1 : -1;
      }
      return aId - bId;
    });
  }, [chatData]);
  const pinMutation = usePinChatMessage(id);
  const unpinMutation = useUnpinChatMessage(id);
  const deleteMutation = useDeleteChatMessageMutation(id);

  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const handleResend = (msg: ChatMessage) => {
    sendMessage.mutate({
      content: msg.text,
      imageUrls: msg.imageUrls,
      resendId: Number(msg.id),
    });
  };

  const campaignName = campaign?.name || DEFAULT_CAMPAIGN_NAME;
  const hostName = campaign?.createdBy || "Cán bộ phường";
  const memberCount = campaign?.participants ?? 0;
  const target = campaign?.target ?? 0;
  const progressPercent = target > 0 ? Math.min(100, Math.round((memberCount / target) * 100)) : 0;

  const startTime = campaign?.startTime ? new Date(campaign.startTime) : null;
  const now = new Date();
  const withinConfirmWindow =
    startTime !== null &&
    now < startTime &&
    now >= new Date(startTime.getTime() - 24 * 60 * 60 * 1000);

  const signalAttendance = useSignalAttendance(id);
  const currentStatus = campaign?.currentUserJoinStatus;

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

  const formattedMessages = useMemo(() => {
    return chatMessages
      .filter((msg) => msg.message && msg.message.trim() !== "")
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
        } as ChatMessage;
      });
  }, [chatMessages, user]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<string | null>(null);
  const isInitialLoadRef = useRef(true);

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

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          const container = scrollContainerRef.current;
          if (container) {
            const previousScrollHeight = container.scrollHeight;
            const previousScrollTop = container.scrollTop;

            fetchNextPage().then(() => {
              requestAnimationFrame(() => {
                const newScrollHeight = container.scrollHeight;
                container.scrollTop = previousScrollTop + (newScrollHeight - previousScrollHeight);
              });
            });
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
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const pinnedMessages = useMemo(() => {
    return formattedMessages.filter((m) => m.pinned);
  }, [formattedMessages]);

  const sidebar = useMemo(
    () => (
      <CampaignGroupSidebar
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
    const isInputDisabled = announcementMode && !campaign?.canManage;
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
    const isInputDisabled = announcementMode && !campaign?.canManage;
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
      } catch (err: any) {
        console.error(err);
        toast.error(`Không thể tải ảnh "${att.file.name}" lên server: ${err.message}`);
        setAttachments((prev) =>
          prev.map((item) =>
            item.id === att.id ? { ...item, isUploading: false, error: err.message } : item,
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

  const handleAttachmentClick = () => {
    const isInputDisabled = announcementMode && !campaign?.canManage;
    if (isInputDisabled) return;
    fileInputRef.current?.click();
  };

  const isForbiddenError = isChatError && (chatError as any)?.status === 403;
  const isBanned = isForbiddenError && (chatError as any)?.message?.includes("khóa");

  // If campaign details are loaded, check if user is authorized (manager or approved participant)
  if (isForbiddenError) {
    return (
      <main className="min-h-screen bg-[#F5F7FA] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/80 backdrop-blur-md border border-slate-200 shadow-xl rounded-2xl p-6 text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
            <Lock size={24} />
          </div>
          <h1 className="text-lg font-black text-slate-900 mb-2">
            {isBanned ? "Tài khoản đã bị khóa" : "Quyền truy cập bị từ chối"}
          </h1>
          <p className="text-sm font-semibold text-slate-500 mb-6 leading-relaxed">
            {isBanned
              ? "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên để biết thêm chi tiết."
              : "Bạn không có quyền truy cập nhóm chat này. Chỉ quản trị viên và thành viên đã tham gia mới có quyền truy cập."}
          </p>
          <Link
            to={isBanned ? "/" : "/campaigns/$id"}
            params={isBanned ? undefined : { id }}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-4 text-xs font-black text-white shadow-md hover:bg-blue-700 transition"
          >
            {isBanned ? "Về trang chủ" : "Quay lại trang chi tiết"}
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

  const isCampaignEndedOrCancelled =
    campaign?.status === "ended" ||
    campaign?.status === "completed" ||
    campaign?.status === "cancelled";
  const isInputDisabled =
    (announcementMode && !campaign?.canManage) ||
    (isCampaignEndedOrCancelled && !campaign?.canManage);

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
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <span>
                    {memberCount}/{target || "?"} thành viên
                  </span>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {pinnedMessages.length > 0 && (
                <PinnedMessagesDropdown
                  pinnedMessages={pinnedMessages}
                  canManage={!!campaign.canManage}
                  onUnpin={(msgId) => unpinMutation.mutate(msgId)}
                  onJumpTo={(msgId) => {
                    const el = document.querySelector(`[data-message-id="${msgId}"]`);
                    if (el) {
                      el.scrollIntoView({ behavior: "smooth", block: "center" });
                      el.classList.add("bg-amber-100/50");
                      setTimeout(() => {
                        el.classList.remove("bg-amber-100/50");
                      }, 2000);
                    } else {
                      toast.error("Không tìm thấy tin nhắn hoặc tin nhắn chưa được tải.");
                    }
                  }}
                />
              )}
              <IconButton label="Tìm kiếm tin nhắn" icon={<Search size={18} />} />
              <IconButton label="Danh sách thành viên" icon={<Users size={18} />} />
              <CampaignChatMenu
                campaignId={id}
                canManage={!!campaign?.canManage}
                chatMessages={formattedMessages}
                announcementMode={announcementMode}
                setAnnouncementMode={(val) => announcementMutation.mutate(val)}
                onUnpin={(msgId) => unpinMutation.mutate(msgId)}
              />
            </div>
          </header>

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

          {withinConfirmWindow && (currentStatus === "PENDING" || currentStatus === "MAYBE") && (
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

          <div
            className="flex-1 overflow-y-auto bg-[#F5F7FA] px-4 py-5 md:px-8"
            ref={scrollContainerRef}
          >
            <div className="mx-auto flex max-w-3xl flex-col gap-4">
              {hasNextPage && (
                <div ref={loaderRef} className="flex justify-center py-2 shrink-0">
                  {isFetchingNextPage ? (
                    <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                  ) : (
                    <span className="text-[11px] text-slate-400 font-bold select-none cursor-pointer hover:underline">
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
                  className="transition-all duration-500 rounded-xl"
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
                  />
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <footer className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 md:px-6">
            {attachments.length > 0 && (
              <div className="mx-auto max-w-3xl mb-3 flex flex-wrap gap-3 bg-slate-50 border border-slate-200/60 p-2.5 rounded-xl animate-fade-in animate-[chatSlideUp_0.15s_ease]">
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="relative h-16 w-16 overflow-hidden rounded-lg border border-slate-250/80 shadow-sm bg-white shrink-0 group"
                  >
                    <img
                      src={att.preview}
                      alt="Xem trước ảnh"
                      className="h-full w-full object-cover"
                    />
                    {att.isUploading && (
                      <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center">
                        <Loader2 className="animate-spin text-white h-5 w-5" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => handleCancelAttachment(att.id)}
                      className="absolute top-1 right-1 bg-black/60 hover:bg-rose-600 text-white rounded-full p-0.5 transition shadow"
                      title="Xóa ảnh"
                    >
                      <X size={10} />
                    </button>
                    {att.error && (
                      <div
                        className="absolute inset-0 bg-rose-500/20 flex items-center justify-center"
                        title={att.error}
                      >
                        <span className="text-[9px] font-black text-rose-700 bg-white/90 px-1 rounded">
                          Lỗi
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {isCampaignEndedOrCancelled && !campaign?.canManage ? (
              <div className="mx-auto max-w-3xl flex flex-col gap-2 py-3.5 px-5 rounded-xl bg-slate-100 border border-slate-200 text-sm text-slate-650 shadow-sm animate-fade-in">
                <div className="flex items-center gap-3">
                  <Info className="h-5 w-5 text-slate-500 shrink-0" />
                  <span className="leading-relaxed font-medium text-slate-700">
                    Chiến dịch này đã {campaign?.status === "cancelled" ? "bị hủy" : "kết thúc"}.
                    Nhóm chat hiện ở chế độ chỉ đọc.
                  </span>
                </div>
                {campaign?.status === "cancelled" && campaign?.cancellationReason && (
                  <div className="text-[11px] font-semibold text-rose-500 italic bg-rose-50/50 p-2 rounded-lg border border-rose-100 leading-relaxed text-left ml-8">
                    Lý do hủy: {campaign.cancellationReason}
                  </div>
                )}
              </div>
            ) : isInputDisabled ? (
              <div className="mx-auto max-w-3xl flex items-center gap-3 py-3.5 px-5 rounded-xl bg-[#F0F7FF] border border-[#D0E7FF] text-sm text-slate-650 shadow-sm animate-fade-in">
                <Info className="h-5 w-5 text-[#007AFF] shrink-0" />
                <span className="leading-relaxed font-medium text-slate-700">
                  Chỉ <span className="text-[#007AFF] font-bold">quản trị viên cộng đồng</span> được
                  gửi tin nhắn vào cộng đồng.{" "}
                  <button
                    type="button"
                    onClick={() => {
                      toast.info("Chế độ chỉ quản trị viên", {
                        description:
                          "Chỉ trưởng nhóm và cán bộ phụ trách mới có quyền gửi tin nhắn trong chế độ này để hạn chế trôi tin quan trọng.",
                      });
                    }}
                    className="text-[#007AFF] font-bold hover:underline inline-block focus:outline-none"
                  >
                    Tìm hiểu thêm
                  </button>
                </span>
              </div>
            ) : (
              <div className="mx-auto flex max-w-3xl items-center gap-2">
                <IconButton
                  label="Đính kèm"
                  icon={<Paperclip size={19} />}
                  onClick={handleAttachmentClick}
                  disabled={isInputDisabled}
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageSelect}
                  disabled={isInputDisabled}
                />
                <IconButton label="Emoji" icon={<Smile size={19} />} disabled={isInputDisabled} />
                <input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") handleSendMessage();
                  }}
                  disabled={isInputDisabled}
                  placeholder={
                    isInputDisabled
                      ? "Chỉ cán bộ phường mới được gửi tin nhắn trong nhóm này"
                      : "Nhắn tin cho nhóm..."
                  }
                  className={`h-11 min-w-0 flex-1 rounded-full px-4 text-sm font-semibold outline-none ring-1 ring-transparent transition placeholder:text-slate-400 focus:bg-white focus:ring-[#3B82F6]/30 bg-[#F3F4F6] text-slate-800`}
                />
                <button
                  type="button"
                  onClick={handleSendMessage}
                  disabled={
                    (!draft.trim() && attachments.filter((a) => a.url).length === 0) ||
                    attachments.some((a) => a.isUploading)
                  }
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
            aria-label="Đóng thông báo"
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

      {selectedUserId && (
        <CitizenProfileModal userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
      )}
    </main>
  );
}

function IconButton({
  label,
  icon,
  onClick,
  disabled,
}: {
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="grid h-10 w-10 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-[#3B82F6] disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-slate-500 cursor-pointer"
      aria-label={label}
      title={label}
    >
      {icon}
    </button>
  );
}
