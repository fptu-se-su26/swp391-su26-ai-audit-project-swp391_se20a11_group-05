/**
 * FloatingChatbot — Nút chat nổi góc dưới phải, truy cập chatbot từ bất kỳ trang nào.
 *
 * Features:
 * - Floating button với animation pulse khi chưa mở
 * - Mini chat window mà không cần điều hướng sang trang /assistant
 * - Quick replies và suggested chips
 * - Badge thông báo khi có tin nhắn mới
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { Bot, X, Send, Loader2, Maximize2, ChevronDown } from "lucide-react";
import { ragApi, ApiError } from "@/lib/api";
import { useNavigate } from "@tanstack/react-router";

interface MiniMsg {
  role: "user" | "bot";
  text: string;
  isLoading?: boolean;
  action?: string;
  navigateTo?: string;
  suggestedFollowUps?: string[];
}

const QUICK_SUGGESTIONS_VI = ["App có gì?", "Gửi phản ánh sự cố", "Tra cứu phản ánh"];
const QUICK_SUGGESTIONS_EN = ["What can you do?", "Submit a report", "Track my report"];

const FLOATING_SESSION_KEY = "dn_floating_chat_v1";

export function FloatingChatbot() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewMsg, setHasNewMsg] = useState(false);
  const [sessionId, setSessionId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("dn_active_session_id");
      if (saved) return saved;
      const newId = crypto.randomUUID();
      sessionStorage.setItem("dn_active_session_id", newId);
      return newId;
    }
    return crypto.randomUUID();
  });

  const [messages, setMessages] = useState<MiniMsg[]>([
    {
      role: "bot",
      text: "🐉 Xin chào! Tôi là Bé Rồng. Tôi có thể giúp gì cho cô chú?",
      suggestedFollowUps: QUICK_SUGGESTIONS_VI,
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem(FLOATING_SESSION_KEY);
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch {
        /* ignore */
      }
    }
  }, []);

  useEffect(() => {
    if (messages.length > 1) {
      sessionStorage.setItem(FLOATING_SESSION_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setHasNewMsg(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, messages]);

  const send = useCallback(
    async (text?: string) => {
      const userText = (text ?? input).trim();
      if (!userText || sending) return;

      setMessages((m) => [...m, { role: "user", text: userText }]);
      setInput("");
      setSending(true);
      setMessages((m) => [...m, { role: "bot", text: "", isLoading: true }]);

      try {
        const result = await ragApi.chatbot(userText, 1, sessionId);
        const reply = (result as any).reply || result.answer || "";
        const action = (result as any).action;
        const navigateTo = (result as any).navigateTo;
        const suggestedFollowUps = (result as any).suggestedFollowUps as string[] | undefined;

        setMessages((m) => {
          const filtered = m.filter((msg) => !msg.isLoading);
          return [
            ...filtered,
            { role: "bot", text: reply, action, navigateTo, suggestedFollowUps },
          ];
        });

        if (!isOpen) {
          setHasNewMsg(true);
        }
      } catch (err) {
        setMessages((m) => m.filter((msg) => !msg.isLoading));
        const errText =
          err instanceof ApiError
            ? `⚠️ Lỗi ${err.status}. Thử lại sau nhé!`
            : "⚠️ Backend chưa kết nối. Gọi 1022 để hỗ trợ khẩn cấp.";
        setMessages((m) => [...m, { role: "bot", text: errText }]);
      } finally {
        setSending(false);
      }
    },
    [input, sending, isOpen, sessionId],
  );

  const openFullChat = () => {
    // Lưu session ID hiện tại để AssistantPage có thể đọc và đồng bộ tiếp
    sessionStorage.setItem("dn_active_session_id", sessionId);
    navigate({ to: "/assistant" as any });
    setIsOpen(false);
  };

  return (
    <>
      {/* ─── Floating Button ─── */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {/* Unread badge */}
        {hasNewMsg && !isOpen && (
          <div className="animate-bounce bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full self-end mr-1">
            Tin mới!
          </div>
        )}

        <button
          onClick={() => {
            setIsOpen((o) => !o);
            setHasNewMsg(false);
          }}
          aria-label={isOpen ? "Đóng chatbot" : "Mở chatbot"}
          className={`w-14 h-14 rounded-full shadow-xl grid place-items-center transition-all duration-300 text-white ${
            isOpen
              ? "bg-gray-700 hover:bg-gray-800 rotate-0"
              : "bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 hover:scale-110"
          }`}
        >
          {isOpen ? <X size={24} /> : <Bot size={26} />}
          {/* Pulse ring when closed */}
          {!isOpen && (
            <span className="absolute w-14 h-14 rounded-full border-2 border-blue-400 opacity-60 animate-ping pointer-events-none" />
          )}
        </button>
      </div>

      {/* ─── Mini Chat Window ─── */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 z-50 w-80 md:w-96 rounded-2xl shadow-2xl border border-gray-200 bg-white flex flex-col overflow-hidden"
          style={{ maxHeight: "min(520px, 70vh)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
            <div className="flex items-center gap-2">
              <Bot size={20} />
              <div>
                <p className="font-semibold text-sm">Bé Rồng 🐉</p>
                <p className="text-xs text-blue-200">Trợ lý AI Đà Nẵng</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={openFullChat}
                title="Mở trang chat đầy đủ"
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
              >
                <Maximize2 size={16} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
              >
                <ChevronDown size={18} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                {m.role === "bot" && (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white grid place-items-center shrink-0">
                    <Bot size={14} />
                  </div>
                )}
                <div
                  className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-blue-600 text-white rounded-tr-sm"
                      : "bg-white text-gray-800 border border-gray-200 shadow-sm rounded-tl-sm"
                  }`}
                >
                  {m.isLoading ? (
                    <div className="flex gap-1 py-1">
                      {[0, 150, 300].map((d) => (
                        <span
                          key={d}
                          className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce"
                          style={{ animationDelay: `${d}ms` }}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{m.text}</p>
                  )}
                </div>
              </div>
            ))}

            {/* Suggested chips for latest bot message */}
            {(() => {
              const lastBot = [...messages].reverse().find((m) => m.role === "bot" && !m.isLoading);
              if (!lastBot?.suggestedFollowUps?.length) return null;
              return (
                <div className="flex flex-wrap gap-1.5 pl-9">
                  {lastBot.suggestedFollowUps.slice(0, 3).map((q, i) => (
                    <button
                      key={i}
                      onClick={() => send(q)}
                      className="text-xs px-2.5 py-1 rounded-full border border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              );
            })()}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex gap-2 p-3 bg-white border-t border-gray-100"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập tin nhắn..."
              disabled={sending}
              className="flex-1 text-sm px-3 py-2 rounded-xl border border-gray-200 focus:border-blue-400 outline-none bg-gray-50 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="w-9 h-9 rounded-xl bg-blue-600 text-white grid place-items-center hover:bg-blue-700 disabled:opacity-40 transition-colors shrink-0"
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
