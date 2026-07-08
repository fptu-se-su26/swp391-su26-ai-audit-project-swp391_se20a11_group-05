import { useState } from "react";
import { User, Bot, Phone, BookOpen, ThumbsUp, ThumbsDown, ExternalLink, MapPin, Clock, Tag, CheckCircle, AlertCircle, Loader2, Pencil } from "lucide-react";
import type { Citation } from "@/types/api";
import { ragApi } from "@/lib/api";

export interface Msg {
  role: "user" | "bot";
  text: string;
  provider?: string;
  latency?: number;
  hotlines?: { label: string; tel: string }[];
  citations?: Citation[];
  isLoading?: boolean;
  // Enhanced fields from backend
  intent?: string;
  emotion?: string;
  action?: string;
  navigateTo?: string;
  messageId?: string;
  suggestedFollowUps?: string[];
  // Feedback lookup metadata
  trackingCode?: string;
  feedbackStatus?: string;
  feedbackCategory?: string;
  feedbackAddress?: string;
  feedbackDescription?: string;
  feedbackCreatedAt?: string;
}

interface ChatMessageProps {
  msg: Msg;
  locale: "vi" | "en";
  onSuggestedClick?: (text: string) => void;
  onNavigate?: (path: string) => void;
  onOpenFeedbackForm?: (data?: Record<string, unknown>) => void;
  onEditMessage?: (text: string) => void; // Feature 2: chỉnh sửa tin nhắn
}

/** Hiển thị status badge với màu tương ứng */
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string }> = {
    SUBMITTED:    { label: "Đã gửi",       color: "bg-blue-100 text-blue-700" },
    PENDING:      { label: "Chờ xử lý",    color: "bg-yellow-100 text-yellow-700" },
    ASSIGNED:     { label: "Đã phân công", color: "bg-indigo-100 text-indigo-700" },
    IN_PROGRESS:  { label: "Đang xử lý",   color: "bg-orange-100 text-orange-700" },
    RESOLVED:     { label: "Đã giải quyết", color: "bg-green-100 text-green-700" },
    REJECTED:     { label: "Từ chối",       color: "bg-red-100 text-red-700" },
  };
  const c = config[status] ?? { label: status, color: "bg-gray-100 text-gray-600" };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${c.color}`}>
      {status === "RESOLVED" ? <CheckCircle size={11} /> : <AlertCircle size={11} />}
      {c.label}
    </span>
  );
}

/** Card hiển thị thông tin phản ánh sau khi tra cứu */
function FeedbackLookupCard({ msg }: { msg: Msg }) {
  if (!msg.feedbackStatus && !msg.trackingCode) return null;
  return (
    <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-bold text-blue-800 text-sm font-mono">{msg.trackingCode}</span>
        {msg.feedbackStatus && <StatusBadge status={msg.feedbackStatus} />}
      </div>
      {msg.feedbackCategory && (
        <div className="flex items-center gap-1.5 text-xs text-gray-600">
          <Tag size={12} />
          <span>{msg.feedbackCategory}</span>
        </div>
      )}
      {msg.feedbackAddress && (
        <div className="flex items-center gap-1.5 text-xs text-gray-600">
          <MapPin size={12} />
          <span>{msg.feedbackAddress}</span>
        </div>
      )}
      {msg.feedbackCreatedAt && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Clock size={12} />
          <span>{new Date(msg.feedbackCreatedAt).toLocaleDateString("vi-VN")}</span>
        </div>
      )}
    </div>
  );
}

/** Nút hành động khi bot đề xuất mở form tạo phản ánh / điều hướng */
function ActionButton({
  action,
  navigateTo,
  onNavigate,
  onOpenFeedbackForm,
  msg,
}: {
  action?: string;
  navigateTo?: string;
  onNavigate?: (path: string) => void;
  onOpenFeedbackForm?: (data?: Record<string, unknown>) => void;
  msg: Msg;
}) {
  if (!action) return null;

  if (action === "OPEN_FEEDBACK_FORM") {
    return (
      <button
        onClick={() => onOpenFeedbackForm?.({ intent: msg.intent })}
        className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
      >
        <ExternalLink size={16} />
        📋 Mở Form Tạo Phản Ánh
      </button>
    );
  }

  if (action === "NAVIGATE" && navigateTo) {
    return (
      <button
        onClick={() => onNavigate?.(navigateTo)}
        className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold text-sm hover:from-green-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
      >
        <ExternalLink size={16} />
        Đến trang này →
      </button>
    );
  }

  return null;
}

/** Nút reactions (👍/👎) */
function ReactionButtons({ messageId, locale }: { messageId?: string; locale: string }) {
  const [rated, setRated] = useState<1 | -1 | null>(null);
  const [loading, setLoading] = useState(false);

  if (!messageId) return null;

  const handleRate = async (rating: 1 | -1) => {
    if (rated !== null || loading) return;
    setLoading(true);
    try {
      await ragApi.rateMessage(messageId, rating);
      setRated(rating);
    } catch {
      // silent fail — rating is non-critical
    } finally {
      setLoading(false);
    }
  };

  if (rated !== null) {
    return (
      <span className="text-xs text-green-600 font-medium">
        {locale === "vi" ? "✅ Cảm ơn phản hồi!" : "✅ Thanks for the feedback!"}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1.5 mt-2">
      <span className="text-xs text-gray-400 mr-1">
        {locale === "vi" ? "Câu trả lời có hữu ích?" : "Was this helpful?"}
      </span>
      <button
        onClick={() => handleRate(1)}
        disabled={loading}
        className="p-1.5 rounded-lg hover:bg-green-100 text-gray-400 hover:text-green-600 transition-colors disabled:opacity-50"
        title="Hữu ích"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <ThumbsUp size={14} />}
      </button>
      <button
        onClick={() => handleRate(-1)}
        disabled={loading}
        className="p-1.5 rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
        title="Không hữu ích"
      >
        <ThumbsDown size={14} />
      </button>
    </div>
  );
}

/** Hiển thị text với markdown đơn giản (bold, newline) */
function MarkdownText({ text, isUser }: { text: string; isUser: boolean }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        // Bold: **text**
        const parts = line.split(/\*\*(.*?)\*\*/g);
        return (
          <p key={i} className={line === "" ? "h-2" : ""}>
            {parts.map((part, j) =>
              j % 2 === 1 ? (
                <strong key={j} className={isUser ? "text-white" : "text-gray-900"}>
                  {part}
                </strong>
              ) : (
                part
              )
            )}
          </p>
        );
      })}
    </div>
  );
}

/** Màu bubble theo emotion */
function getBubbleStyle(emotion?: string, isUser?: boolean) {
  if (isUser) return "bg-gov-blue text-white rounded-tr-sm";
  switch (emotion) {
    case "NEGATIVE":
      return "bg-red-50 border border-red-200 text-gray-800 rounded-tl-sm";
    case "POSITIVE":
      return "bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 text-gray-800 rounded-tl-sm";
    default:
      return "bg-slate-100 text-gray-800 rounded-tl-sm";
  }
}

/** Intent label badge */
function IntentBadge({ intent }: { intent?: string }) {
  if (!intent || intent === "GENERAL") return null;
  const labels: Record<string, { label: string; color: string }> = {
    LOOKUP_FEEDBACK:  { label: "🔍 Tra cứu",       color: "bg-blue-100 text-blue-700" },
    CREATE_FEEDBACK:  { label: "📋 Phản ánh mới",   color: "bg-orange-100 text-orange-700" },
    QA_LEGAL:         { label: "⚖️ Pháp lý",        color: "bg-purple-100 text-purple-700" },
    STATISTICS:       { label: "📊 Thống kê",        color: "bg-green-100 text-green-700" },
    REPORT_COPILOT:   { label: "🤖 AI Copilot",     color: "bg-indigo-100 text-indigo-700" },
    DISCOVER_CAMPAIGN: { label: "🎯 Chiến dịch",    color: "bg-yellow-100 text-yellow-800" },
    NAVIGATION_GUIDE: { label: "🗺️ Hướng dẫn",     color: "bg-teal-100 text-teal-700" },
  };
  const config = labels[intent];
  if (!config) return null;
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${config.color}`}>
      {config.label}
    </span>
  );
}

export function ChatMessage({ msg, locale, onSuggestedClick, onNavigate, onOpenFeedbackForm, onEditMessage }: ChatMessageProps) {
  const isUser = msg.role === "user";
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""} ${
        isUser ? "animate-slide-in-right" : "animate-fade-in-up"
      }`}
    >
      {/* Avatar */}
      <div
        className={`w-10 h-10 rounded-full grid place-items-center shrink-0 shadow-sm ${
          isUser
            ? "bg-gov-gold text-gov-blue-deep"
            : "bg-gradient-to-br from-blue-600 to-indigo-700 text-white"
        }`}
      >
        {isUser ? <User size={20} /> : <Bot size={20} />}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[80%] flex flex-col ${isUser ? "items-end" : "items-start"}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className={`p-4 rounded-2xl text-base leading-relaxed shadow-sm ${getBubbleStyle(
            msg.emotion,
            isUser
          )}`}
        >
          {/* Loading indicator */}
          {msg.isLoading ? (
            <div className="flex items-center gap-2 text-gray-500 py-1">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              <span className="text-sm">
                {locale === "vi" ? "Bé Rồng đang suy nghĩ..." : "AI is thinking..."}
              </span>
            </div>
          ) : (
            <>
              {/* Intent badge (chỉ cho bot) */}
              {!isUser && msg.intent && (
                <div className="mb-2">
                  <IntentBadge intent={msg.intent} />
                </div>
              )}

              {/* Main text */}
              <MarkdownText text={msg.text} isUser={isUser} />

              {/* Feedback Lookup Card */}
              {!isUser && msg.intent === "LOOKUP_FEEDBACK" && (
                <FeedbackLookupCard msg={msg} />
              )}

              {/* Action buttons */}
              {!isUser && (
                <ActionButton
                  action={msg.action}
                  navigateTo={msg.navigateTo}
                  onNavigate={onNavigate}
                  onOpenFeedbackForm={onOpenFeedbackForm}
                  msg={msg}
                />
              )}

              {/* Provider + Latency badge */}
              {msg.provider && (
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">
                    {msg.provider}
                  </span>
                  {msg.latency && (
                    <span className="text-gray-400">{msg.latency}ms</span>
                  )}
                </div>
              )}

              {/* Citations */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-3">
                  <details className="group">
                    <summary className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 cursor-pointer hover:text-blue-600 transition-colors">
                      <BookOpen size={14} />
                      {msg.citations.length}{" "}
                      {locale === "vi" ? "nguồn tham khảo" : "citations"}
                    </summary>
                    <ul className="mt-2 space-y-1.5">
                      {msg.citations.map((c, ci) => (
                        <li
                          key={ci}
                          className="text-xs text-gray-600 bg-white/50 rounded p-2 border border-gray-100"
                        >
                          <span className="font-medium text-blue-600">{c.source}</span>
                          <p className="mt-0.5 line-clamp-2">{c.content}</p>
                        </li>
                      ))}
                    </ul>
                  </details>
                </div>
              )}

              {/* Hotline buttons */}
              {msg.hotlines && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {msg.hotlines.map((h) => (
                    <a
                      key={h.tel}
                      href={`tel:${h.tel}`}
                      className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition-colors shadow-sm"
                    >
                      <Phone size={16} /> {h.label} — {h.tel}
                    </a>
                  ))}
                </div>
              )}

              {/* Reaction buttons (chỉ cho bot, khi có messageId) */}
              {!isUser && (
                <ReactionButtons messageId={msg.messageId} locale={locale} />
              )}
            </>
          )}
        </div>

        {/* Edit button — hiện khi hover vào tin nhắn user (Feature 2) */}
        {isUser && onEditMessage && isHovered && !msg.isLoading && (
          <button
            onClick={() => onEditMessage(msg.text)}
            className="mt-1 flex items-center gap-1 text-[11px] text-gray-400 hover:text-blue-500 transition-colors"
            title={locale === "vi" ? "Sửa và hỏi lại" : "Edit and resend"}
          >
            <Pencil size={11} />
            {locale === "vi" ? "Sửa" : "Edit"}
          </button>
        )}

        {/* Suggested follow-up chips (bên dưới bubble, không trong bubble) */}
        {!isUser && !msg.isLoading && msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5 max-w-full">
            {msg.suggestedFollowUps.map((q, i) => (
              <button
                key={i}
                onClick={() => onSuggestedClick?.(q)}
                className="px-3 py-1.5 text-xs rounded-full border border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100 hover:border-blue-400 transition-all active:scale-95"
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
