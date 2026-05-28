import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { chatbotApi, ApiError } from "@/lib/api";
import { Bot, Phone, Send, User, Loader2 } from "lucide-react";

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

function AssistantPage() {
  const { t, locale } = useI18n();
  const messagesEndRef = useRef<HTMLDivElement>(null);
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

  // Auto-scroll khi có tin nhắn mới
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || sending) return;
    const userText = input.trim();

    // Add user message
    setMessages((m) => [...m, { role: "user", text: userText }]);
    setInput("");
    setSending(true);

    // Add loading indicator
    setMessages((m) => [...m, { role: "bot", text: "", isLoading: true }]);

    try {
      // Gọi API thực: GET /api/rag/chatbot?q=...&userId=1
      const result = await chatbotApi.ask(userText, 1);

      // Remove loading and add real response
      setMessages((m) => {
        const filtered = m.filter((msg) => !msg.isLoading);
        return [
          ...filtered,
          {
            role: "bot",
            text: result.answer,
            provider: result.provider,
            latency: result.latencyMs,
          },
        ];
      });
    } catch (err) {
      // Remove loading indicator
      setMessages((m) => m.filter((msg) => !msg.isLoading));

      if (err instanceof ApiError) {
        setMessages((m) => [
          ...m,
          {
            role: "bot",
            text: locale === "vi"
              ? `⚠️ Lỗi kết nối tới AI (${err.status}). Vui lòng thử lại sau.`
              : `⚠️ AI connection error (${err.status}). Please try again later.`,
          },
        ]);
      } else {
        // Fallback mock when backend is offline
        setMessages((m) => [
          ...m,
          {
            role: "bot",
            text: locale === "vi"
              ? "⚠️ Backend chưa kết nối. Đây là chế độ demo.\n\nNếu bạn cần hỗ trợ khẩn cấp, vui lòng gọi đường dây nóng 1022."
              : "⚠️ Backend is not connected. This is demo mode.\n\nFor emergencies, please call hotline 1022.",
            hotlines: [
              { label: locale === "vi" ? "Đường dây nóng 1022" : "Hotline 1022", tel: "1022" },
              { label: locale === "vi" ? "PCCC / Cứu hỏa" : "Fire/Rescue", tel: "114" },
            ],
          },
        ]);
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-10 md:py-14">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-full bg-gov-blue grid place-items-center text-white">
          <Bot size={28} />
        </div>
        <div>
          <h1 className="font-heading text-3xl md:text-4xl text-gov-blue">{t("assistant.title")}</h1>
          <p className="text-ink-soft">{t("assistant.subtitle")}</p>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="card-civic p-5 md:p-6 min-h-[400px] max-h-[60vh] overflow-y-auto space-y-4 mb-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`w-10 h-10 rounded-full grid place-items-center shrink-0 ${m.role === "user" ? "bg-gov-gold text-gov-blue-deep" : "bg-gov-blue text-white"}`}>
              {m.role === "user" ? <User size={20} /> : <Bot size={20} />}
            </div>
            <div className={`max-w-[80%] p-4 rounded-2xl text-base leading-relaxed ${m.role === "user" ? "bg-gov-blue text-white rounded-tr-sm" : "bg-slate-100 text-ink rounded-tl-sm"}`}>
              {m.isLoading ? (
                <div className="flex items-center gap-2 text-ink-soft">
                  <Loader2 size={18} className="animate-spin" />
                  <span>{locale === "vi" ? "AI đang xử lý..." : "AI is thinking..."}</span>
                </div>
              ) : (
                <>
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  {/* Provider/latency badge */}
                  {m.provider && (
                    <div className="mt-2 flex items-center gap-2 text-xs opacity-60">
                      <span className="bg-black/10 px-2 py-0.5 rounded">🤖 {m.provider}</span>
                      {m.latency && <span>{m.latency}ms</span>}
                    </div>
                  )}
                  {/* Hotline buttons */}
                  {m.hotlines && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {m.hotlines.map((h) => (
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

      {/* Input */}
      <form
        onSubmit={(e) => { e.preventDefault(); send(); }}
        className="flex gap-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
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
