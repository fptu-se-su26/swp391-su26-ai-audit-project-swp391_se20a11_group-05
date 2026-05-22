import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { ragApi, ApiError } from "@/lib/api";
import ReactMarkdown from "react-markdown";
import { Bot, Phone, Send, User, Loader2, ChevronDown } from "lucide-react";

export const Route = createFileRoute("/assistant")({
  head: () => ({
    meta: [
      { title: "Trợ lý AI Khẩn cấp — Đà Nẵng Lắng Nghe" },
      { name: "description", content: "Hỏi đáp về tình huống khẩn cấp, quy trình hành chính, đường dây nóng tại Đà Nẵng." },
    ],
  }),
  component: AssistantPage,
});

interface Msg {
  role: "user" | "bot";
  text: string;
  provider?: string;
  latency?: number;
  hotlines?: { label: string; tel: string }[];
  isLoading?: boolean;
}

const SUGGESTED_QUESTIONS = [
  { vi: "Số điện thoại khẩn cấp?", en: "Emergency numbers?" },
  { vi: "Làm sao báo ổ gà?", en: "How to report pothole?" },
  { vi: "Quy trình xử lý phản ánh?", en: "Report processing flow?" },
  { vi: "Đường dây nóng 1022", en: "Hotline 1022" },
];

function AssistantPage() {
  const { t, locale } = useI18n();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "bot",
      text: locale === "vi"
        ? "Xin chào! Tôi là Trợ lý AI của Đà Nẵng Lắng Nghe. Tôi có thể hỗ trợ bạn giải đáp thắc mắc về thủ tục hành chính, phản ánh đô thị và tình huống khẩn cấp. Bạn cần hỗ trợ gì hôm nay?"
        : "Hello! I'm Da Nang's AI Assistant. I can help you with civic procedures, urban reports, and emergencies. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  // Only the initial greeting — show suggested chips
  const isNewConversation = messages.length === 1 && messages[0].role === "bot" && !messages[0].isLoading;

  // Auto-scroll khi có tin nhắn mới
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load saved messages from sessionStorage on mount
  useEffect(() => {
    const saved = sessionStorage.getItem("assistant_messages");
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch {
        // ignore invalid JSON
      }
    }
  }, []);

  // Persist messages to sessionStorage on each update
  useEffect(() => {
    if (messages.length > 1) {
      sessionStorage.setItem("assistant_messages", JSON.stringify(messages));
    }
  }, [messages]);

  // Track scroll position for scroll-to-bottom button
  const handleScroll = () => {
    const el = chatContainerRef.current;
    if (!el) return;
    const threshold = 100;
    setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > threshold);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const send = async (text?: string) => {
    const userText = (text ?? input).trim();
    if (!userText || sending) return;

    // Add user message
    setMessages((m: Msg[]) => [...m, { role: "user", text: userText }]);
    if (!text) setInput("");
    setSending(true);

    // Add loading indicator
    setMessages((m: Msg[]) => [...m, { role: "bot", text: "", isLoading: true }]);

    try {
      // Lấy token nếu có
      const token = typeof window !== "undefined" ? localStorage.getItem("dn_jwt_token") : null;
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      // Đổi API endpoint sang /api/rag/stream
      const response = await fetch(`/api/rag/stream?q=${encodeURIComponent(userText)}&userId=1`, {
        method: "GET",
        headers: headers
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Xóa loading và chuẩn bị khung tin nhắn trống cho bot
      setMessages((m: Msg[]) => {
        const filtered = m.filter((msg: Msg) => !msg.isLoading);
        return [
          ...filtered,
          {
            role: "bot",
            text: "",
            provider: "GROQ Stream (RAG)",
          },
        ];
      });

      // Stream data (Hiệu ứng gõ phím)
      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");

      if (reader) {
        let done = false;
        let accumulatedText = "";

        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;

          if (value) {
            // Decode phần raw byte thành chuỗi
            let chunkStr = decoder.decode(value, { stream: true });

            // Lọc các tiền tố "data: " của SSE (Spring WebFlux đôi lúc trả ra data:)
            chunkStr = chunkStr.replace(/^data:/gm, "").trim();

            if (chunkStr) {
              accumulatedText += chunkStr + " ";

              // Cập nhật text liên tục cho tin nhắn cuối cùng
              setMessages((m: Msg[]) => {
                const newArr = [...m];
                newArr[newArr.length - 1].text = accumulatedText;
                return newArr;
              });
            }
          }
        }
      }
    } catch (err) {
      // Remove loading indicator
      setMessages((m: Msg[]) => m.filter((msg: Msg) => !msg.isLoading));

      setMessages((m: Msg[]) => [
        ...m,
        {
          role: "bot",
          text: locale === "vi"
            ? `⚠️ Lỗi kết nối tới AI. Hệ thống đang bận. Vui lòng thử lại sau.`
            : `⚠️ AI connection error. System is busy. Please try later.`,
        },
      ]);
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-10 md:py-14">
      <div className="animate-scale-in flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-full bg-gov-blue grid place-items-center text-white">
          <Bot size={28} />
        </div>
        <div>
          <h1 className="font-heading text-3xl md:text-4xl text-gov-blue">{t("assistant.title")}</h1>
          <p className="text-ink-soft">{t("assistant.subtitle")}</p>
        </div>
      </div>

      {/* Chat Messages */}
      <div
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="animate-fade-in card-civic p-5 md:p-6 min-h-[400px] max-h-[60vh] overflow-y-auto space-y-4 mb-4 relative"
      >
        {messages.map((m: Msg, i: number) => (
          <div
            key={i}
            className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""} ${
              m.role === "bot" ? "animate-fade-in-up" : "animate-slide-in-right"
            }`}
          >
            <div className={`w-10 h-10 rounded-full grid place-items-center shrink-0 ${m.role === "user" ? "bg-gov-gold text-gov-blue-deep" : "bg-gov-blue text-white"}`}>
              {m.role === "user" ? <User size={20} /> : <Bot size={20} />}
            </div>
            <div className={`max-w-[80%] p-4 rounded-2xl text-base leading-relaxed ${m.role === "user" ? "bg-gov-blue text-white rounded-tr-sm" : "bg-slate-100 text-ink rounded-tl-sm"}`}>
              {m.isLoading ? (
                <div className="flex items-center gap-1.5 text-ink-soft">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-gov-blue/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-gov-blue/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-gov-blue/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  <span className="text-sm">{locale === "vi" ? "AI đang xử lý..." : "AI is thinking..."}</span>
                </div>
              ) : (
                <>
                  {m.text && (
                    <div className="prose prose-sm max-w-none prose-headings:text-ink prose-p:text-ink prose-a:text-gov-blue prose-strong:text-ink">
                      <ReactMarkdown
                        components={{
                          code({ className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || "");
                            const isInline = !match;
                            return isInline ? (
                              <code className="bg-slate-200 text-ink px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                                {children}
                              </code>
                            ) : (
                              <pre className="bg-slate-800 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm font-mono my-2">
                                <code {...props}>{children}</code>
                              </pre>
                            );
                          },
                        }}
                      >
                        {m.text}
                      </ReactMarkdown>
                    </div>
                  )}
                  {/* Provider/latency badge */}
                  {m.provider && (
                    <div className="mt-2 flex items-center gap-2 text-xs">
                      <span className="bg-gov-blue/10 text-gov-blue-dark px-2 py-0.5 rounded font-medium dark:bg-gov-blue/20 dark:text-blue-300">
                        {m.provider}
                      </span>
                      {m.latency && (
                        <span className="text-ink-soft/60">{m.latency}ms</span>
                      )}
                    </div>
                  )}
                  {/* Hotline buttons */}
                  {m.hotlines && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {m.hotlines.map((h: { label: string; tel: string }) => (
                        <a
                          key={h.tel}
                          href={`tel:${h.tel}`}
                          className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-md bg-[var(--status-danger)] text-white font-bold text-sm hover:brightness-110"
                        >
                          <Phone size={16} /> {h.label} — {h.tel}
                        </a>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollBtn && (
        <button
          onClick={scrollToBottom}
          className="animate-fade-in fixed bottom-36 right-8 z-10 w-12 h-12 rounded-full bg-gov-blue text-white shadow-lg grid place-items-center hover:bg-gov-blue-dark transition-colors"
          aria-label="Scroll to bottom"
        >
          <ChevronDown size={24} />
        </button>
      )}

      {/* Suggested questions chips */}
      {isNewConversation && (
        <div className="animate-fade-in-up mb-4 flex flex-wrap gap-2">
          {SUGGESTED_QUESTIONS.map((q, i) => (
            <button
              key={i}
              onClick={() => send(q[locale as keyof typeof q] || q.en)}
              className="px-4 py-2 rounded-full border border-gov-blue/30 text-sm text-gov-blue bg-white hover:bg-gov-blue/10 hover:border-gov-blue transition-colors"
            >
              {q[locale as keyof typeof q] || q.en}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={(e: React.FormEvent) => { e.preventDefault(); send(); }}
        className="flex gap-3"
      >
        <input
          value={input}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
          placeholder={t("assistant.placeholder")}
          disabled={sending}
          className="flex-1 min-h-[52px] px-4 rounded-lg border-2 border-slate-200 text-base focus:border-gov-blue outline-none bg-white disabled:opacity-50"
          aria-label="Message"
        />
        <button type="submit" disabled={sending || !input.trim()} className="btn-civic btn-civic-primary disabled:opacity-50">
          {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          {t("assistant.send")}
        </button>
      </form>
    </div>
  );
}
