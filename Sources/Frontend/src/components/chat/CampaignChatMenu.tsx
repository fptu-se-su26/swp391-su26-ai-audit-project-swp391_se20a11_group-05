import { useEffect, useRef, useState } from "react";
import {
  MoreVertical,
  Volume2,
  VolumeX,
  Pin,
  Image as ImageIcon,
  MessageSquareOff,
  MessageSquare,
  LogOut,
  X,
  FileText,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import type { ChatMessage } from "./CampaignChatHelpers";

interface CampaignChatMenuProps {
  campaignId: string;
  canManage: boolean;
  chatMessages: ChatMessage[];
  announcementMode: boolean;
  setAnnouncementMode: (val: boolean) => void;
  onUnpin?: (id: string) => void;
  onShowMembers?: () => void;
}

export function CampaignChatMenu({
  campaignId,
  canManage,
  chatMessages,
  announcementMode,
  setAnnouncementMode,
  onUnpin,
  onShowMembers,
}: CampaignChatMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [pinnedModalOpen, setPinnedModalOpen] = useState(false);
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Initialize Mute state from localStorage
  useEffect(() => {
    const muted = localStorage.getItem(`mute_chat_${campaignId}`) === "true";
    setIsMuted(muted);
  }, [campaignId]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    localStorage.setItem(`mute_chat_${campaignId}`, String(nextMuted));
    setIsOpen(false);
    if (nextMuted) {
      toast.success("Đã tắt thông báo nhóm chat này.");
    } else {
      toast.success("Đã bật thông báo nhóm chat này.");
    }
  };

  const handleToggleAnnouncement = () => {
    const nextMode = !announcementMode;
    setAnnouncementMode(nextMode);
    setIsOpen(false);
    if (nextMode) {
      toast.success("Đã kích hoạt chế độ chỉ Cán bộ được nhắn tin.");
    } else {
      toast.success("Đã tắt chế độ chỉ Cán bộ được nhắn tin. Người dân có thể chat lại.");
    }
  };

  const handleLeaveGroup = () => {
    setIsOpen(false);
    if (window.confirm("Bạn có chắc chắn muốn rời khỏi nhóm chat chiến dịch này không?")) {
      toast.info("Yêu cầu rời nhóm đã được gửi lên hệ thống.");
    }
  };

  const pinnedMessages = chatMessages.filter((msg) => msg.pinned);
  const mediaUrls = chatMessages.flatMap((msg) => msg.imageUrls || []).filter(Boolean);

  return (
    <div className="relative" ref={menuRef}>
      {/* 3-dots trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="grid h-10 w-10 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-[#3B82F6] active:scale-95 cursor-pointer"
        aria-label="Menu thêm"
        title="Menu thêm"
      >
        <MoreVertical size={18} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-60 z-30 origin-top-right rounded-2xl border border-slate-150/70 bg-white p-2 shadow-xl ring-1 ring-black/5 animate-[chatSlideUp_0.15s_ease] backdrop-blur-md">
          <div className="space-y-1">
            {/* Mute notifications */}
            <button
              onClick={handleToggleMute}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition duration-150 cursor-pointer"
            >
              {isMuted ? (
                <>
                  <Volume2 size={15} className="text-slate-400" />
                  Bật thông báo nhóm
                </>
              ) : (
                <>
                  <VolumeX size={15} className="text-slate-400" />
                  Tắt thông báo nhóm
                </>
              )}
            </button>

            {/* View Pinned Messages */}
            <button
              onClick={() => {
                setPinnedModalOpen(true);
                setIsOpen(false);
              }}
              className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition duration-150 cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                <Pin size={15} className="text-slate-400 rotate-45" />
                Tin nhắn đã ghim
              </span>
              {pinnedMessages.length > 0 && (
                <span className="grid h-4 min-w-4 place-items-center rounded-full bg-amber-100 px-1 text-[9px] font-black text-amber-700">
                  {pinnedMessages.length}
                </span>
              )}
            </button>

            {/* Shared Media */}
            <button
              onClick={() => {
                setMediaModalOpen(true);
                setIsOpen(false);
              }}
              className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition duration-150 cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                <ImageIcon size={15} className="text-slate-400" />
                Thư viện ảnh & file
              </span>
              {mediaUrls.length > 0 && (
                <span className="grid h-4 min-w-4 place-items-center rounded-full bg-blue-100 px-1 text-[9px] font-black text-blue-700">
                  {mediaUrls.length}
                </span>
              )}
            </button>

            {/* Group Members List */}
            <button
              onClick={() => {
                onShowMembers?.();
                setIsOpen(false);
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition duration-150 cursor-pointer"
            >
              <Users size={15} className="text-slate-400" />
              Thành viên nhóm
            </button>

            {/* Admin section divider */}
            {canManage && <div className="my-1.5 h-px bg-slate-100" />}

            {/* Announcement Mode (Staff only) */}
            {canManage && (
              <button
                onClick={handleToggleAnnouncement}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition duration-150 cursor-pointer"
              >
                {announcementMode ? (
                  <>
                    <MessageSquare size={15} className="text-blue-500" />
                    <span className="text-blue-600 font-bold">Mở chat cho người dân</span>
                  </>
                ) : (
                  <>
                    <MessageSquareOff size={15} className="text-amber-500" />
                    <span className="text-amber-600 font-bold">Chỉ Admin được nhắn</span>
                  </>
                )}
              </button>
            )}

            {/* Danger zone divider & Leave group - Citizens only */}
            {!canManage && (
              <>
                <div className="my-1.5 h-px bg-slate-100" />
                <button
                  onClick={handleLeaveGroup}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition duration-150 cursor-pointer"
                >
                  <LogOut size={15} />
                  Rời khỏi nhóm chat
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Pinned Messages Modal */}
      {pinnedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl animate-[chatSlideUp_0.2s_ease]">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-2 text-amber-700 font-black text-sm uppercase tracking-wider">
                <Pin size={15} className="rotate-45 fill-current" />
                Tin nhắn đã ghim ({pinnedMessages.length})
              </div>
              <button
                onClick={() => setPinnedModalOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X size={18} />
              </button>
            </div>
            <div className="max-h-[360px] overflow-y-auto p-5 space-y-3">
              {pinnedMessages.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs font-bold">
                  Không có tin nhắn nào được ghim.
                </div>
              ) : (
                pinnedMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className="flex flex-col gap-1.5 rounded-xl border border-slate-100 bg-slate-50/50 p-4 relative group"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-black text-blue-600">{msg.sender}</span>
                      <span className="text-[10px] font-bold text-slate-400">{msg.time}</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-700 leading-relaxed">
                      {msg.text}
                    </p>
                    {canManage && onUnpin && (
                      <button
                        onClick={() => onUnpin(msg.id)}
                        className="absolute right-3 bottom-3 opacity-0 group-hover:opacity-100 text-[10px] font-black text-rose-600 hover:underline cursor-pointer transition-opacity"
                      >
                        Bỏ ghim
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Media Library Modal */}
      {mediaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl animate-[chatSlideUp_0.2s_ease]">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-2 text-blue-700 font-black text-sm uppercase tracking-wider">
                <ImageIcon size={15} />
                Thư viện ảnh chiến dịch ({mediaUrls.length})
              </div>
              <button
                onClick={() => setMediaModalOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X size={18} />
              </button>
            </div>
            <div className="max-h-[400px] overflow-y-auto p-5">
              {mediaUrls.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs font-bold">
                  Chưa có hình ảnh nào được chia sẻ trong nhóm.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                  {mediaUrls.map((url, index) => (
                    <a
                      key={index}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative aspect-square overflow-hidden rounded-xl bg-slate-50 border border-slate-100 hover:opacity-90 transition duration-200"
                    >
                      <img
                        src={url}
                        alt={`Ảnh thư viện ${index + 1}`}
                        className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
