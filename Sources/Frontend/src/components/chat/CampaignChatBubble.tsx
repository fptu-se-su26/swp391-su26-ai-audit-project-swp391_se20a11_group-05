import { Crown, Pin, RefreshCw, Trash2 } from "lucide-react";
import type { ChatMessage } from "./CampaignChatHelpers";
import { CampaignImageGrid } from "./CampaignImageGrid";

export function CampaignChatBubble({
  message,
  canManage,
  onPin,
  onUnpin,
  onResend,
  onAvatarClick,
  onDelete,
  highlightQuery,
}: {
  message: ChatMessage;
  canManage: boolean;
  onPin: (id: string) => void;
  onUnpin: (id: string) => void;
  onResend?: (message: ChatMessage) => void;
  onAvatarClick?: (userId: number) => void;
  onDelete?: (id: string) => void;
  highlightQuery?: string;
}) {
  const isFailed = message.status === "failed";
  const isSending = Number(message.id) < 0 && !isFailed;

  const renderText = (text: string) => {
    if (!highlightQuery || !highlightQuery.trim()) {
      return <p className="text-sm font-medium leading-6">{text}</p>;
    }
    const parts = text.split(
      new RegExp(`(${highlightQuery.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")})`, "gi"),
    );
    return (
      <p className="text-sm font-medium leading-6">
        {parts.map((part, index) =>
          part.toLowerCase() === highlightQuery.toLowerCase() ? (
            <mark
              key={index}
              className="bg-amber-300 text-slate-900 rounded-[2px] px-[2px] font-bold"
            >
              {part}
            </mark>
          ) : (
            part
          ),
        )}
      </p>
    );
  };

  if (message.role === "me") {
    return (
      <div
        className={`flex justify-end items-center gap-2 group ${isSending ? "opacity-70" : ""} ${isFailed ? "mb-1" : ""}`}
        style={{ animation: "chatSlideUp 0.2s ease" }}
      >
        {isFailed && onResend && (
          <button
            onClick={() => onResend(message)}
            className="flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 border border-rose-200 px-2 py-1 rounded-full cursor-pointer hover:bg-rose-100 hover:scale-105 active:scale-95 transition-all duration-200 shrink-0"
            title="Gửi lại tin nhắn này"
          >
            <RefreshCw
              size={11}
              className="transition-transform duration-300 group-hover:rotate-180"
            />
            Thử lại
          </button>
        )}
        {canManage && !isSending && !isFailed && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 shrink-0">
            <button
              onClick={() => (message.pinned ? onUnpin(message.id) : onPin(message.id))}
              className="p-1.5 rounded-full hover:bg-slate-250/80 bg-slate-100/50 text-slate-400 hover:text-amber-500 transition-all duration-200 shadow-sm border border-slate-200/50 cursor-pointer"
              title={message.pinned ? "Bỏ ghim tin nhắn" : "Ghim tin nhắn"}
            >
              <Pin size={13} className={message.pinned ? "fill-amber-500 text-amber-500" : ""} />
            </button>
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(message.id)}
                className="p-1.5 rounded-full hover:bg-rose-50 bg-slate-100/50 text-slate-400 hover:text-rose-600 transition-all duration-200 shadow-sm border border-slate-200/50 cursor-pointer"
                title="Xóa tin nhắn"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        )}
        <div
          className={`max-w-[78%] rounded-[12px_0_12px_12px] bg-[#3B82F6] px-4 py-2.5 text-white shadow-sm relative ${message.pinned ? "border-t-[3px] border-t-amber-400" : ""} ${isFailed ? "bg-slate-400" : ""}`}
        >
          {message.pinned && (
            <div
              className="absolute -top-2 -right-1 bg-amber-400 text-white rounded-full p-0.5 shadow-sm"
              title="Đã ghim"
            >
              <Pin size={9} className="fill-current" />
            </div>
          )}
          {message.imageUrls && message.imageUrls.length > 0 && (
            <CampaignImageGrid urls={message.imageUrls} />
          )}
          {message.text && renderText(message.text)}
          <div className="mt-1 flex items-center justify-end gap-1 text-[10px] font-bold text-blue-100">
            <span>{message.time}</span>
            <span>
              {isFailed ? (
                <span className="text-red-100 bg-rose-500/30 px-1 rounded">Lỗi gửi</span>
              ) : isSending ? (
                "Đang gửi..."
              ) : message.status === "seen" ? (
                "✓✓"
              ) : (
                "✓"
              )}
            </span>
          </div>
        </div>
      </div>
    );
  }

  const host = message.role === "host";
  const hasSenderId = message.senderId !== undefined;

  const count = message.pastCampaignCount || 0;
  let borderStyle = "";
  let badgeIcon = "";
  let badgeTitle = "";

  if (!host) {
    if (count >= 10) {
      borderStyle =
        "ring-2 ring-amber-400 ring-offset-1 ring-offset-white shadow-[0_0_8px_rgba(245,158,11,0.5)]";
      badgeIcon = "🏆";
      badgeTitle = "Đại sứ Vì cộng đồng (10+ Chiến dịch)";
    } else if (count >= 5) {
      borderStyle =
        "ring-2 ring-cyan-400 ring-offset-1 ring-offset-white shadow-[0_0_8px_rgba(34,211,238,0.4)]";
      badgeIcon = "🏛️";
      badgeTitle = "Trụ cột Cộng đồng (5-9 Chiến dịch)";
    } else if (count >= 1) {
      borderStyle =
        "ring-2 ring-emerald-400 ring-offset-1 ring-offset-white shadow-[0_0_6px_rgba(16,185,129,0.3)]";
      badgeIcon = "⚡";
      badgeTitle = "Thành viên Năng nổ (1-4 Chiến dịch)";
    } else {
      borderStyle = "ring-2 ring-slate-300 ring-offset-1 ring-offset-white shadow-sm";
      badgeIcon = "🌱";
      badgeTitle = "Tình nguyện viên Mới (0 Chiến dịch)";
    }
  }

  const avatarContent = message.senderAvatar ? (
    <img
      src={message.senderAvatar}
      alt={message.sender}
      className={`h-8 w-8 rounded-full object-cover shrink-0 select-none ${borderStyle} ${
        canManage && hasSenderId
          ? "hover:scale-105 active:scale-95 transition-transform duration-200"
          : ""
      }`}
    />
  ) : (
    <span
      className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-black select-none ${borderStyle} ${
        canManage && hasSenderId
          ? "hover:scale-105 active:scale-95 transition-transform duration-200"
          : ""
      } ${host ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}
    >
      {host ? "CB" : message.sender.split(" ").at(-1)?.[0] || "A"}
    </span>
  );

  return (
    <div className="flex items-start gap-2 group" style={{ animation: "chatSlideUp 0.2s ease" }}>
      <div
        className="relative shrink-0 select-none"
        onClick={() =>
          canManage && hasSenderId && onAvatarClick && onAvatarClick(message.senderId!)
        }
        style={{ cursor: canManage && hasSenderId ? "pointer" : "default" }}
        title={
          badgeTitle
            ? `${badgeTitle}${canManage && hasSenderId ? " - Click để xem thông tin & Điều trị" : ""}`
            : canManage && hasSenderId
              ? "Xem thông tin & Điều trị thành viên"
              : undefined
        }
      >
        {avatarContent}
        {badgeIcon && (
          <span className="absolute -bottom-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-white text-[9px] shadow-[0_1px_3px_rgba(0,0,0,0.15)] border border-slate-100 select-none">
            {badgeIcon}
          </span>
        )}
      </div>
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
        <p
          onClick={() =>
            canManage && hasSenderId && onAvatarClick && onAvatarClick(message.senderId!)
          }
          className={`mb-1 text-xs font-black ${
            canManage && hasSenderId ? "cursor-pointer hover:underline" : ""
          } ${host ? "text-amber-700" : "text-[#2563EB]"}`}
          title={canManage && hasSenderId ? "Xem thông tin & Điều trị thành viên" : undefined}
        >
          {host && <Crown size={13} className="mr-1 inline text-amber-500" />}
          {message.sender}
        </p>
        {message.imageUrls && message.imageUrls.length > 0 && (
          <CampaignImageGrid urls={message.imageUrls} />
        )}
        {message.text && renderText(message.text)}
        <p className="mt-1 text-[10px] font-bold text-slate-400">{message.time}</p>
      </div>
      {canManage && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 self-center shrink-0">
          <button
            onClick={() => (message.pinned ? onUnpin(message.id) : onPin(message.id))}
            className="p-1.5 rounded-full hover:bg-slate-250/80 bg-slate-100/50 text-slate-400 hover:text-amber-500 transition-all duration-200 shadow-sm border border-slate-200/50 cursor-pointer"
            title={message.pinned ? "Bỏ ghim tin nhắn" : "Ghim tin nhắn"}
          >
            <Pin size={13} className={message.pinned ? "fill-amber-500 text-amber-500" : ""} />
          </button>
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(message.id)}
              className="p-1.5 rounded-full hover:bg-rose-50 bg-slate-100/50 text-slate-400 hover:text-rose-600 transition-all duration-200 shadow-sm border border-slate-200/50 cursor-pointer"
              title="Xóa tin nhắn"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
