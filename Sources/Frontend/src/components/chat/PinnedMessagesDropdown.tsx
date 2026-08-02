import { useEffect, useRef, useState } from "react";
import { Pin, ChevronDown, Trash2, ArrowUpRight } from "lucide-react";
import type { ChatMessage } from "./CampaignChatHelpers";

interface PinnedMessagesDropdownProps {
  pinnedMessages: ChatMessage[];
  canManage: boolean;
  onUnpin: (id: string) => void;
  onJumpTo: (id: string) => void;
}

export function PinnedMessagesDropdown({
  pinnedMessages,
  canManage,
  onUnpin,
  onJumpTo,
}: PinnedMessagesDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative shrink-0" ref={containerRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3.5 py-1.5 text-xs font-black text-amber-800 shadow-sm transition hover:bg-amber-100/80 hover:border-amber-300 active:scale-95 cursor-pointer select-none"
        title="Danh sách tin nhắn đã ghim"
      >
        <Pin size={13} className="text-amber-500 fill-amber-500 rotate-45 shrink-0" />
        <span>Ghim ({pinnedMessages.length})</span>
        <ChevronDown
          size={13}
          className={`transition-transform duration-200 shrink-0 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-2 shadow-lg animate-fade-in animate-[chatSlideUp_0.15s_ease]">
          <div className="flex items-center justify-between border-b border-slate-150/80 px-2.5 pb-2 pt-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              Tin nhắn đã ghim ({pinnedMessages.length})
            </span>
          </div>

          <div className="mt-1.5 max-h-60 overflow-y-auto flex flex-col gap-1">
            {pinnedMessages.map((msg) => (
              <div
                key={msg.id}
                onClick={() => {
                  onJumpTo(msg.id);
                  setIsOpen(false);
                }}
                className="group/item flex flex-col gap-1 rounded-lg p-2 hover:bg-slate-50 transition cursor-pointer border border-transparent hover:border-slate-100 relative pr-10"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-600 truncate max-w-[150px]">
                    {msg.sender}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">{msg.time}</span>
                </div>
                <p className="text-xs text-slate-600 font-medium line-clamp-2 pr-2">
                  {msg.text || "[Hình ảnh]"}
                </p>

                {/* Jump & Unpin buttons */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                  {canManage && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUnpin(msg.id);
                      }}
                      className="p-1 rounded bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 transition shadow-sm cursor-pointer"
                      title="Bỏ ghim"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                  <div
                    className="p-1 rounded bg-white text-slate-400 border border-slate-200 transition shadow-sm cursor-pointer"
                    title="Đi tới tin nhắn"
                  >
                    <ArrowUpRight size={12} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
