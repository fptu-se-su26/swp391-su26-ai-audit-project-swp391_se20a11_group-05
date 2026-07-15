import { useState, useRef, useEffect, useCallback } from "react";
import { useI18n } from "@/lib/i18n";
import { ragApi, ApiError } from "@/lib/api";
import { Bot, Send, Loader2, ChevronDown, Mic, MicOff, X, Square, Plus, MessageSquare, Menu, History } from "lucide-react";
import { ChatMessage, type Msg } from "./ChatMessage";
import { useNavigate } from "@tanstack/react-router";

// ─── Onboarding messages (hiển thị lần đầu) ───────────────────
const ONBOARDING_STEPS_VI = [
  "🐉 Xin chào! Tôi là **Bé Rồng** — Trợ lý AI của Đà Nẵng Kết Nối.\n\nTôi có thể giúp cô chú:",
  "📋 **Gửi phản ánh** sự cố đường phố, vỉa hè, môi trường...\n🔍 **Tra cứu trạng thái** phản ánh bằng mã FB-...\n⚖️ **Hỏi quy định** pháp luật đô thị Đà Nẵng\n📊 **Xem thống kê** sự cố cộng đồng\n🎯 **Khám phá chiến dịch** tình nguyện",
  "💡 Thử hỏi tôi: **'Tôi muốn báo ổ gà đường Nguyễn Văn Linh'** hoặc **'tra cứu FB-001'** nhé!"
];
const ONBOARDING_STEPS_EN = [
  "🐉 Hello! I'm **Baby Dragon** — Da Nang Connect's AI assistant.",
  "📋 **Submit reports** for potholes, sidewalks, environment...\n🔍 **Track status** of your reports using FB-... codes\n⚖️ **Ask about laws** and urban regulations\n📊 **View statistics** on community issues\n🎯 **Discover volunteer** campaigns",
  "💡 Try asking: **'I want to report a pothole on Nguyen Van Linh'** or **'track FB-001'**"
];

// ─── Loading steps (multi-phase indicator) ─────────────────────
const LOADING_STEPS_VI = [
  "🔍 Đang phân tích câu hỏi...",
  "📚 Đang tìm kiếm thông tin...",
  "✍️ Đang soạn câu trả lời...",
];
const LOADING_STEPS_EN = [
  "🔍 Analyzing your question...",
  "📚 Searching for information...",
  "✍️ Composing the answer...",
];

// ─── Autocomplete suggestions pool ──────────────────────────────
const AUTOCOMPLETE_POOL_VI = [
  "Tôi muốn báo ổ gà",
  "Tôi muốn báo ngập lụt",
  "Tôi muốn báo đèn đường hỏng",
  "Tôi muốn báo vỉa hè bị lấn chiếm",
  "Tôi muốn báo rác thải bừa bãi",
  "Tra cứu phản ánh FB-",
  "Quy định về",
  "Thống kê sự cố",
  "Chiến dịch tình nguyện",
  "Hướng dẫn gửi phản ánh",
  "Đường dây nóng",
  "Luật giao thông",
  "Phí xử lý rác thải",
  "Thủ tục cấp giấy phép",
];
const AUTOCOMPLETE_POOL_EN = [
  "I want to report a pothole",
  "I want to report flooding",
  "I want to report a broken street light",
  "Track my report FB-",
  "Regulations about",
  "Community statistics",
  "Volunteer campaigns",
  "How to submit a report",
];

const ONBOARDING_KEY = "dn_chatbot_onboarded_v2";

export function AssistantPage() {
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceSupported] = useState(
    typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
  );

  // ─── Feature 4: Session History States ───────────────────────
  const [sessions, setSessions] = useState<Array<{ sessionId: string; sessionName: string; lastMessage: string; messageCount: number }>>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false); // Collapsible on mobile

  // ─── Abort controller (Feature 2: Stop) ──────────────────────
  const abortControllerRef = useRef<AbortController | null>(null);

  // ─── Autocomplete (Feature 1) ─────────────────────────────────
  const [acSuggestions, setAcSuggestions] = useState<string[]>([]);
  const [acIndex, setAcIndex] = useState(-1);
  const autocompletePool = locale === "vi" ? AUTOCOMPLETE_POOL_VI : AUTOCOMPLETE_POOL_EN;

  const filterSuggestions = useCallback((text: string) => {
    if (!text.trim() || text.length < 2) { setAcSuggestions([]); return; }
    const lastBotFollowUps = [...messages].reverse()
      .find(m => m.role === "bot" && m.suggestedFollowUps?.length)?.suggestedFollowUps ?? [];
    const combined = [...autocompletePool, ...lastBotFollowUps];
    const lower = text.toLowerCase();
    const filtered = combined
      .filter(s => s.toLowerCase().includes(lower) && s.toLowerCase() !== lower)
      .slice(0, 5);
    setAcSuggestions(filtered);
    setAcIndex(-1);
  }, [messages, autocompletePool]);

  // ─── Edit message (Feature 2) ─────────────────────────────────
  const handleEditMessage = (text: string) => {
    setInput(text);
    setAcSuggestions([]);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  // ─── Onboarding ───────────────────────────────────────────────
  const [onboardingPhase, setOnboardingPhase] = useState(0);
  const [isOnboarding, setIsOnboarding] = useState(false);

  const runOnboarding = useCallback((loc: string) => {
    const steps = loc === "vi" ? ONBOARDING_STEPS_VI : ONBOARDING_STEPS_EN;
    setMessages([]);
    setIsOnboarding(true);

    steps.forEach((text, i) => {
      setTimeout(() => {
        setMessages((prev) => [...prev, { role: "bot", text }]);
        setOnboardingPhase(i + 1);
        if (i === steps.length - 1) {
          setIsOnboarding(false);
          localStorage.setItem(ONBOARDING_KEY, "true");
        }
      }, i * 1400);
    });
  }, []);

  // ─── Load sessions list from backend ──────────────────────────
  const loadSessions = useCallback(async () => {
    try {
      const data = await ragApi.getSessions(1); // User ID: 1
      setSessions(data);
    } catch (err) {
      console.error("Error loading chat sessions:", err);
    }
  }, []);

  // ─── Switch active session ────────────────────────────────────
  const handleSelectSession = useCallback(async (sessionId: string) => {
    setActiveSessionId(sessionId);
    sessionStorage.setItem("dn_active_session_id", sessionId);
    setAcSuggestions([]);
    setShowSidebar(false);
    try {
      const dbMsgs = await ragApi.getSessionMessages(sessionId, 1);
      const mappedMsgs: Msg[] = dbMsgs.map(m => ({
        role: m.question ? "user" : "bot",
        text: m.question ? m.question : m.answer,
        messageId: m.messageId,
        provider: m.provider,
        latency: m.latencyMs,
        intent: m.intent,
      }));

      // if a message contains both question and answer in history, we parse it as 2 messages
      const finalMsgs: Msg[] = [];
      dbMsgs.forEach(m => {
        if (m.question) {
          finalMsgs.push({
            role: "user",
            text: m.question,
          });
        }
        if (m.answer) {
          finalMsgs.push({
            role: "bot",
            text: m.answer,
            messageId: m.messageId,
            provider: m.provider,
            latency: m.latencyMs,
            intent: m.intent,
          });
        }
      });

      setMessages(finalMsgs);
    } catch (err) {
      console.error("Error loading session messages:", err);
    }
  }, []);

  // ─── Start new session (without clearing sessionStorage unless empty) ───
  const handleNewSession = useCallback(() => {
    const savedId = sessionStorage.getItem("dn_active_session_id");
    const newId = savedId || crypto.randomUUID();
    if (!savedId) {
      sessionStorage.setItem("dn_active_session_id", newId);
    }
    setActiveSessionId(newId);
    setMessages([{
      role: "bot",
      text: locale === "vi"
        ? "Xin chào! 🐉 Bé Rồng đây. Hôm nay cô chú cần hỗ trợ gì ạ?"
        : "Hello! 🐉 Baby Dragon here. How can I help you today?"
    }]);
    setAcSuggestions([]);
    setShowSidebar(false);
  }, [locale]);

  // ─── Force start a brand new session (via button click) ────────
  const handleCreateNewSession = useCallback(() => {
    sessionStorage.removeItem("dn_active_session_id");
    const newId = crypto.randomUUID();
    sessionStorage.setItem("dn_active_session_id", newId);
    setActiveSessionId(newId);
    setMessages([{
      role: "bot",
      text: locale === "vi"
        ? "Xin chào! 🐉 Bé Rồng đây. Hôm nay cô chú cần hỗ trợ gì ạ?"
        : "Hello! 🐉 Baby Dragon here. How can I help you today?"
    }]);
    setAcSuggestions([]);
    setShowSidebar(false);
  }, [locale]);

  // ─── Initial Load ─────────────────────────────────────────────
  useEffect(() => {
    loadSessions();
    const hasOnboarded = localStorage.getItem(ONBOARDING_KEY);
    if (!hasOnboarded) {
      runOnboarding(locale);
    } else {
      const savedId = sessionStorage.getItem("dn_active_session_id");
      if (savedId) {
        handleSelectSession(savedId);
      } else {
        handleNewSession();
      }
    }
  }, [locale, runOnboarding, loadSessions, handleNewSession, handleSelectSession]);

  // ─── Auto-scroll ──────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ─── Loading step rotation ────────────────────────────────────
  useEffect(() => {
    if (!sending) return;
    const interval = setInterval(() => {
      setLoadingStep((s) => (s + 1) % 3);
    }, 1500);
    return () => clearInterval(interval);
  }, [sending]);

  const handleScroll = () => {
    const el = chatContainerRef.current;
    if (!el) return;
    setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 100);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // ─── Abort / Stop generation (Feature 2) ─────────────────────
  const stopSending = () => {
    abortControllerRef.current?.abort();
    setSending(false);
    setMessages(m => m.filter(msg => !msg.isLoading));
  };

  // ─── Voice Input ──────────────────────────────────────────────
  const handleVoiceInput = () => {
    if (!voiceSupported) return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = locale === "vi" ? "vi-VN" : "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsVoiceActive(true);
    recognition.onend = () => setIsVoiceActive(false);
    recognition.onerror = () => setIsVoiceActive(false);
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      inputRef.current?.focus();
    };
    recognition.start();
  };

  // ─── Clear chat ───────────────────────────────────────────────
  const clearChat = () => {
    localStorage.removeItem(ONBOARDING_KEY);
    runOnboarding(locale);
  };

  // ─── Navigate handler ─────────────────────────────────────────
  const handleNavigate = (path: string) => {
    navigate({ to: path as any });
  };

  // ─── Open feedback form ───────────────────────────────────────
  const handleOpenFeedbackForm = () => {
    navigate({ to: "/feedback/create" as any });
  };

  // ─── Send message ─────────────────────────────────────────────
  const send = async (text?: string) => {
    const userText = (text ?? input).trim();
    if (!userText || sending || isOnboarding) return;

    setMessages((m) => [...m, { role: "user", text: userText }]);
    setInput("");
    setAcSuggestions([]);
    setSending(true);
    setLoadingStep(0);

    // Add loading placeholder
    setMessages((m) => [...m, { role: "bot", text: "", isLoading: true }]);

    // Reset abort controller
    abortControllerRef.current = new AbortController();

    try {
      const currentSessionId = activeSessionId || crypto.randomUUID();
      if (!activeSessionId) {
        setActiveSessionId(currentSessionId);
      }

      const result = await ragApi.chatbot(userText, 1, currentSessionId);

      const reply = (result as any).reply || result.answer || "";
      const intent = (result as any).intent;
      const emotion = (result as any).emotion;
      const action = (result as any).action;
      const navigateTo = (result as any).navigateTo;
      const messageId = (result as any).messageId;
      const suggestedFollowUps = (result as any).suggestedFollowUps as string[] | undefined;

      setMessages((m) => {
        const filtered = m.filter((msg) => !msg.isLoading);
        return [
          ...filtered,
          {
            role: "bot",
            text: reply,
            provider: result.provider,
            latency: result.latencyMs,
            intent,
            emotion,
            action,
            navigateTo,
            messageId,
            suggestedFollowUps,
            trackingCode: (result as any).trackingCode,
            feedbackStatus: (result as any).feedbackStatus,
            feedbackCategory: (result as any).feedbackCategory,
            feedbackAddress: (result as any).feedbackAddress,
            feedbackDescription: (result as any).feedbackDescription,
            feedbackCreatedAt: (result as any).feedbackCreatedAt,
          } as Msg,
        ];
      });

      // Reload sessions list to update names
      loadSessions();

    } catch (err) {
      setMessages((m) => m.filter((msg) => !msg.isLoading));

      if (err instanceof ApiError) {
        setMessages((m) => [
          ...m,
          {
            role: "bot",
            text:
              locale === "vi"
                ? `⚠️ Lỗi kết nối tới AI (${err.status}). Vui lòng thử lại sau.`
                : `⚠️ AI connection error (${err.status}). Please try again later.`,
          },
        ]);
      } else {
        setMessages((m) => [
          ...m,
          {
            role: "bot",
            text:
              locale === "vi"
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

  const loadingSteps = locale === "vi" ? LOADING_STEPS_VI : LOADING_STEPS_EN;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 flex gap-6 min-h-[85vh]">
      {/* ─── Sidebar (Feature 4) ─────────────────────────────────── */}
      <aside className={`w-80 border-r border-slate-200 pr-6 flex flex-col gap-4 shrink-0 transition-all md:flex ${
        showSidebar ? "fixed inset-0 bg-white z-40 p-6 flex" : "hidden"
      }`}>
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold text-gov-blue flex items-center gap-2">
            <History size={18} />
            {locale === "vi" ? "Lịch sử trò chuyện" : "Chat History"}
          </h2>
          {showSidebar && (
            <button onClick={() => setShowSidebar(false)} className="md:hidden p-1.5 rounded-lg hover:bg-slate-100">
              <X size={18} />
            </button>
          )}
        </div>

        <button
          onClick={handleCreateNewSession}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-slate-300 hover:border-gov-blue text-slate-600 hover:text-gov-blue font-medium transition-all"
        >
          <Plus size={16} />
          {locale === "vi" ? "Phiên trò chuyện mới" : "New Chat"}
        </button>

        <div className="flex-1 overflow-y-auto space-y-2">
          {sessions.length === 0 ? (
            <div className="text-center text-xs text-slate-400 py-10">
              {locale === "vi" ? "Chưa có cuộc hội thoại nào" : "No conversation history"}
            </div>
          ) : (
            sessions.map((s) => (
              <button
                key={s.sessionId}
                onClick={() => handleSelectSession(s.sessionId)}
                className={`w-full text-left p-3 rounded-xl transition-all border flex flex-col gap-1 hover:bg-slate-50 ${
                  activeSessionId === s.sessionId
                    ? "border-gov-blue/30 bg-gov-blue/5 text-gov-blue font-medium"
                    : "border-transparent text-slate-700"
                }`}
              >
                <div className="flex items-center gap-2 font-semibold text-sm line-clamp-1">
                  <MessageSquare size={14} className="shrink-0" />
                  <span className="truncate">{s.sessionName}</span>
                </div>
                <div className="text-[11px] text-slate-400 flex justify-between">
                  <span>{s.messageCount} {locale === "vi" ? "tin nhắn" : "msgs"}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* ─── Main Chat Space ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        {/* Header toolbar */}
        <div className="animate-scale-in flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSidebar(true)}
              className="md:hidden p-2.5 bg-slate-100 rounded-xl hover:bg-slate-200 text-slate-600 transition-colors"
              title="Menu"
            >
              <Menu size={20} />
            </button>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 grid place-items-center text-white shadow-lg shrink-0">
              <Bot size={24} />
            </div>
            <div>
              <h1 className="font-heading text-2xl md:text-3xl text-gov-blue">
                {t("assistant.title")}
              </h1>
              <p className="text-xs text-ink-soft flex items-center gap-2">
                {t("assistant.subtitle")}
                <span className="inline-flex items-center gap-1 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  {locale === "vi" ? "Trực tuyến" : "Online"}
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={clearChat}
            title={locale === "vi" ? "Bắt đầu lại" : "Start over"}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Chat Messages */}
        <div
          ref={chatContainerRef}
          onScroll={handleScroll}
          className="animate-fade-in card-civic p-5 md:p-6 flex-1 min-h-[450px] max-h-[62vh] overflow-y-auto space-y-5 mb-4 relative scroll-smooth bg-white/70 backdrop-blur-sm"
        >
          {messages.map((m, i) => (
            <ChatMessage
              key={i}
              msg={m}
              locale={locale}
              onSuggestedClick={(text) => send(text)}
              onNavigate={handleNavigate}
              onOpenFeedbackForm={handleOpenFeedbackForm}
              onEditMessage={m.role === "user" ? handleEditMessage : undefined}
            />
          ))}

          {/* Multi-phase loading indicator */}
          {sending && (
            <div className="flex gap-3 animate-fade-in-up">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 grid place-items-center text-white shrink-0">
                <Bot size={20} />
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <Loader2 size={14} className="animate-spin" />
                  <span className="animate-pulse">{loadingSteps[loadingStep]}</span>
                </div>
              </div>
            </div>
          )}

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

        {/* Input area */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="relative flex gap-2 items-center"
        >
          {/* Autocomplete Dropdown (Feature 1) */}
          {acSuggestions.length > 0 && (
            <div className="absolute bottom-full mb-2 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-20 animate-fade-in-up">
              {acSuggestions.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); setInput(s); setAcSuggestions([]); inputRef.current?.focus(); }}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 hover:text-blue-700 transition-colors flex items-center gap-2 ${
                    i === acIndex ? "bg-blue-50 text-blue-700" : "text-slate-700"
                  }`}
                >
                  <span className="text-blue-400 text-xs">↳</span>
                  <span dangerouslySetInnerHTML={{
                    __html: s.replace(
                      new RegExp(input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'),
                      (match) => `<strong class="text-blue-600">${match}</strong>`
                    )
                  }} />
                </button>
              ))}
              <div className="px-4 py-1.5 text-[10px] text-slate-400 border-t border-slate-100 flex items-center gap-1">
                <kbd className="bg-slate-100 px-1 rounded text-[9px]">Tab</kbd> để chọn
                <span className="mx-1">·</span>
                <kbd className="bg-slate-100 px-1 rounded text-[9px]">Esc</kbd> để đóng
              </div>
            </div>
          )}

          {/* Voice input button */}
          {voiceSupported && (
            <button
              type="button"
              onClick={handleVoiceInput}
              disabled={sending || isOnboarding}
              className={`shrink-0 w-12 h-12 rounded-xl grid place-items-center transition-all ${
                isVoiceActive
                  ? "bg-red-500 text-white shadow-lg shadow-red-200 animate-pulse"
                  : "bg-gray-100 text-gray-500 hover:bg-blue-100 hover:text-blue-600"
              } disabled:opacity-40`}
              title={locale === "vi" ? "Nhập bằng giọng nói" : "Voice input"}
            >
              {isVoiceActive ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
          )}

          <input
            ref={inputRef}
            value={input}
            onChange={(e) => { setInput(e.target.value); filterSuggestions(e.target.value); }}
            onKeyDown={(e) => {
              if (e.key === "Tab" && acSuggestions.length > 0) {
                e.preventDefault();
                const pick = acIndex >= 0 ? acSuggestions[acIndex] : acSuggestions[0];
                setInput(pick); setAcSuggestions([]);
              } else if (e.key === "ArrowDown") {
                e.preventDefault();
                setAcIndex(i => Math.min(i + 1, acSuggestions.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setAcIndex(i => Math.max(i - 1, 0));
              } else if (e.key === "Escape") {
                setAcSuggestions([]);
              }
            }}
            placeholder={
              isOnboarding
                ? (locale === "vi" ? "Đợi giới thiệu xong nhé..." : "Wait for the intro...")
                : t("assistant.placeholder")
            }
            disabled={sending || isOnboarding}
            className="flex-1 min-h-[52px] px-4 rounded-xl border-2 border-slate-200 text-base focus:border-gov-blue outline-none bg-white disabled:opacity-50 transition-colors"
            aria-label="Message"
            autoComplete="off"
          />

          {/* Stop button (Feature 2) — xuất hiện khi đang gửi */}
          {sending ? (
            <button
              type="button"
              onClick={stopSending}
              className="btn-civic shrink-0 min-h-[52px] rounded-xl bg-red-500 hover:bg-red-600 text-white flex items-center gap-2 px-4"
            >
              <Square size={16} fill="white" />
              {locale === "vi" ? "Dừng" : "Stop"}
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim() || isOnboarding}
              className="btn-civic btn-civic-primary disabled:opacity-50 shrink-0 min-h-[52px] rounded-xl"
            >
              <Send size={20} />
              {t("assistant.send")}
            </button>
          )}
        </form>

        {/* Onboarding progress indicator */}
        {isOnboarding && (
          <div className="mt-3 flex items-center justify-center gap-2">
            {ONBOARDING_STEPS_VI.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all ${
                  i < onboardingPhase ? "bg-blue-500" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
