import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  CircleDot,
  Clock,
  FileText,
  Image,
  Loader2,
  MapPin,
  MessageSquareText,
  SearchX,
  Star,
  UserRound,
  Video,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { EmptyState, ErrorState } from "@/components/site/EmptyState";
import { StatusBadge } from "@/components/site/StatusBadge";
import { useFeedbackDetail } from "@/lib/hooks";
import { useI18n } from "@/lib/i18n";
import {
  getToken,
  type FeedbackAttachmentResponse,
  type FeedbackLogResponse,
  type FeedbackStatus,
} from "@/lib/api";
import { mapStatus } from "@/lib/status";
import { AUTHORITY_ROLES, parseBackendRole, Role } from "@/lib/roles";

export const Route = createFileRoute("/my-reports/$id")({
  beforeLoad: async ({ params }) => {
    const token = typeof window !== "undefined" ? getToken() : null;
    const raw = typeof window !== "undefined" ? localStorage.getItem("dn_auth_user_v2") : null;

    if (!token || !raw) {
      throw redirect({
        to: "/login",
        search: { redirect: `/my-reports/${params.id}`, error: undefined },
      });
    }

    let user: { role: string } | null = null;
    try {
      user = JSON.parse(raw);
    } catch {
      /* ignore */
    }

    if (!user) throw redirect({ to: "/login" });

    const role = parseBackendRole(user.role);
    if (AUTHORITY_ROLES.has(role) || role !== Role.CITIZEN) {
      throw redirect({ to: "/login" });
    }
  },
  head: ({ params }) => ({
    meta: [
      { title: `Phản ánh ${params.id} - Đà Nẵng Kết Nối` },
      { name: "description", content: `Chi tiết phản ánh ${params.id}.` },
    ],
  }),
  component: ReportDetail,
});

function ReportDetail() {
  const { id } = Route.useParams();
  const { locale, t } = useI18n();
  const { data: report, isLoading, isError, error, refetch } = useFeedbackDetail(id);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 min-h-[55vh] grid place-items-center">
        <div className="flex items-center gap-3 text-gov-blue font-semibold">
          <Loader2 className="animate-spin" size={28} />
          {locale === "vi" ? "Đang tải chi tiết phản ánh..." : "Loading report detail..."}
        </div>
      </div>
    );
  }

  if (isError || !report) {
    return (
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
        <ErrorState
          message={
            error instanceof Error
              ? error.message
              : locale === "vi"
                ? "Phản ánh không tồn tại hoặc bạn không có quyền xem."
                : "The report does not exist or you do not have permission to view it."
          }
          onRetry={() => refetch()}
        />
        <Link to="/my-reports" className="btn-civic btn-civic-ghost mx-auto w-fit">
          <ArrowLeft size={18} />
          {locale === "vi" ? "Quay lại báo cáo của tôi" : "Back to my reports"}
        </Link>
      </div>
    );
  }

  const attachments = report.attachments ?? [];
  const timeline = buildTimeline(report.timeline ?? [], report.status);
  const status = mapStatus(report.status);

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8 animate-fade-in-up">
      <section className="mb-5 md:mb-6">
        <Link
          to="/my-reports"
          className="inline-flex items-center gap-2 text-gov-blue font-semibold mb-4 hover:underline"
        >
          <ArrowLeft size={18} />
          {t("my.title")}
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <StatusBadge status={status} />
          <span className="font-mono text-sm text-ink-soft">
            {report.code || report.trackingCode || `#${report.id}`}
          </span>
        </div>

        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase text-ink-soft mb-2">
            {report.category ||
              report.categoryName ||
              (locale === "vi" ? "Chưa phân loại" : "Uncategorized")}
          </p>
          <h1 className="font-heading text-3xl md:text-4xl text-gov-blue mb-3">{report.title}</h1>
          <p className="text-base md:text-lg text-ink-soft leading-relaxed">
            {report.content || report.description}
          </p>
        </div>
      </section>

      <section className="grid lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.8fr)] gap-5 md:gap-6 mb-8">
        <div className="space-y-5">
          <InfoPanel title={locale === "vi" ? "HÌNH ẢNH / VIDEO" : "Uploaded Media"} icon={Image}>
            {attachments.length === 0 ? (
              <EmptyState
                icon={SearchX}
                title={locale === "vi" ? "Không có tệp đính kèm" : "No media uploaded"}
                compact
              />
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {attachments.map((attachment) => (
                  <a
                    key={attachment.id}
                    href={attachment.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="group relative aspect-video overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
                  >
                    {isVideoAttachment(attachment) ? (
                      <video
                        src={attachment.fileUrl}
                        className="w-full h-full object-cover bg-black"
                        muted
                        preload="metadata"
                      />
                    ) : (
                      <img
                        src={attachment.fileUrl}
                        alt={attachment.fileName || report.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    )}
                    <span className="absolute left-2 bottom-2 inline-flex items-center gap-1 rounded-md bg-white/95 px-2 py-1 text-xs font-semibold text-ink shadow-sm">
                      {isVideoAttachment(attachment) ? <Video size={13} /> : <Image size={13} />}
                      {isVideoAttachment(attachment) ? "Video" : "Image"}
                    </span>
                  </a>
                ))}
              </div>
            )}
          </InfoPanel>

          <InfoPanel
            title={locale === "vi" ? "TIẾN TRÌNH XỬ LÝ" : "Processing Timeline"}
            icon={Clock}
          >
            {timeline.length === 0 ? (
              <p className="text-sm text-ink-soft">
                {locale === "vi" ? "Chưa có lịch sử xử lý." : "No processing history yet."}
              </p>
            ) : (
              <ol className="relative space-y-4 before:absolute before:left-[15px] before:top-4 before:bottom-4 before:w-1 before:rounded-full before:bg-gov-blue/25">
                {timeline.map((entry, index) => (
                  <TimelineItem key={`${entry.createdAt}-${entry.title}-${index}`} entry={entry} />
                ))}
              </ol>
            )}
          </InfoPanel>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 self-start">
          <InfoPanel
            title={locale === "vi" ? "THÔNG TIN PHẢN ÁNH" : "Report Information"}
            icon={FileText}
          >
            <DetailRow
              icon={MapPin}
              label={locale === "vi" ? "ĐỊA CHỈ" : "Address"}
              value={report.address || report.addressDetails || report.wardName}
            />
            <DetailRow
              icon={UserRound}
              label={locale === "vi" ? "ĐƠN VỊ PHỤ TRÁCH" : "Assigned authority"}
              value={report.assignedAuthorityName || report.wardName || report.assigneeName}
            />
            <DetailRow
              icon={CalendarClock}
              label={locale === "vi" ? "NGÀY TẠO" : "Created"}
              value={formatDateTime(report.createdAt)}
            />
            <DetailRow
              icon={CalendarClock}
              label={locale === "vi" ? "CẬP NHẬT" : "Updated"}
              value={formatDateTime(report.updatedAt)}
            />
          </InfoPanel>

          {report.rejectionReason && (
            <InfoPanel
              title={locale === "vi" ? "LÝ DO TỪ CHỐI" : "Rejection Reason"}
              icon={MessageSquareText}
            >
              <p className="text-sm text-ink-soft leading-relaxed">{report.rejectionReason}</p>
            </InfoPanel>
          )}

          {report.resultContent && (
            <InfoPanel
              title={locale === "vi" ? "KẾT QUẢ XỬ LÝ" : "Processing Result"}
              icon={MessageSquareText}
            >
              <p className="text-sm text-ink-soft leading-relaxed">{report.resultContent}</p>
            </InfoPanel>
          )}

          {report.status === "RESOLVED" && (
            <button type="button" className="btn-civic btn-civic-primary w-full justify-center">
              <Star size={18} />
              {locale === "vi" ? "Đánh giá kết quả" : "Rate result"}
            </button>
          )}
        </aside>
      </section>
    </div>
  );
}

function InfoPanel({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <section className="card-civic p-4 md:p-5">
      <h2 className="flex items-center gap-2 text-lg font-bold text-gov-blue mb-4">
        <Icon size={20} />
        {title}
      </h2>
      {children}
    </section>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-b-0">
      <Icon className="text-gov-blue mt-0.5 shrink-0" size={18} />
      <div className="min-w-0">
        <div className="text-xs uppercase font-bold text-ink-soft">{label}</div>
        <div className="text-sm text-ink leading-relaxed">{value || "N/A"}</div>
      </div>
    </div>
  );
}

type TimelineTone = "completed" | "pending" | "rejected";

interface TimelineEntry {
  title: string;
  action?: string | null;
  note?: string | null;
  actorName?: string | null;
  actorRole?: string | null;
  authorityName?: string | null;
  assignedToName?: string | null;
  deadline?: string | null;
  createdAt?: string | null;
  tone: TimelineTone;
}

function TimelineItem({ entry }: { entry: TimelineEntry }) {
  const nodeClass = {
    completed: "bg-gov-blue text-white ring-gov-blue/15",
    pending: "bg-gov-gold text-gov-blue-deep ring-gov-gold/20",
    rejected: "bg-red-600 text-white ring-red-100",
  }[entry.tone];
  const Icon =
    entry.tone === "rejected" ? XCircle : entry.tone === "pending" ? CircleDot : CheckCircle2;
  const actor = entry.actorName || entry.authorityName || "Hệ thống";
  const action = timelineActionText(entry);

  return (
    <li className="relative grid grid-cols-[34px_minmax(0,1fr)] gap-4">
      <span
        className={`relative z-10 mt-3 w-8 h-8 rounded-full grid place-items-center border-4 border-white shadow-sm ring-8 ${nodeClass}`}
      >
        <Icon size={15} strokeWidth={3} />
      </span>
      <div
        className={`min-w-0 rounded-2xl border bg-white p-4 shadow-sm ${
          entry.tone === "rejected"
            ? "border-red-100"
            : entry.tone === "pending"
              ? "border-amber-100"
              : "border-slate-100"
        }`}
      >
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="font-bold text-gov-blue">{actor}</span>
          {entry.actorRole && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold uppercase text-ink-soft">
              {roleLabel(entry.actorRole)}
            </span>
          )}
          <span className={entry.tone === "rejected" ? "text-red-700 font-semibold" : "text-ink"}>
            {action}
          </span>
        </div>

        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-[120px_minmax(0,1fr)]">
          <span className="text-ink-soft">Thời gian</span>
          <span className="font-semibold text-ink">{formatTimelineDate(entry.createdAt)}</span>
          <span className="text-ink-soft">Hạn xử lý</span>
          <span className="font-semibold text-ink">
            {entry.deadline ? formatTimelineDate(entry.deadline) : "Không có hạn"}
          </span>
          {entry.assignedToName && (
            <>
              <span className="text-ink-soft">Chuyển đến</span>
              <span className="font-semibold text-ink">{entry.assignedToName}</span>
            </>
          )}
        </div>

        {entry.note && (
          <p
            className={`mt-3 rounded-xl px-3 py-2 text-sm ${
              entry.tone === "rejected" ? "bg-red-50 text-red-800" : "bg-slate-50 text-ink-soft"
            }`}
          >
            {entry.note}
          </p>
        )}
      </div>
    </li>
  );
}

function buildTimeline(
  logs: FeedbackLogResponse[],
  currentStatus: FeedbackStatus,
): TimelineEntry[] {
  const orderedLogs = [...logs].sort((a, b) =>
    (a.createdAt || "").localeCompare(b.createdAt || ""),
  );
  const rejectedIndex = orderedLogs.findIndex(
    (log) => log.status === "REJECTED" || log.newStatus === "REJECTED",
  );
  const visibleLogs = rejectedIndex >= 0 ? orderedLogs.slice(0, rejectedIndex + 1) : orderedLogs;

  const entries = visibleLogs.map((log) => {
    const status = log.status || log.newStatus || log.oldStatus;
    const rejected = status === "REJECTED";
    return {
      title: log.title || statusTitle(status),
      action: log.action,
      note: log.note,
      actorName: log.actorName || log.actionByName,
      actorRole: log.actorRole,
      authorityName: log.authorityName,
      assignedToName: log.assignedToName,
      deadline: log.deadline,
      createdAt: log.createdAt,
      tone: rejected ? ("rejected" as const) : ("completed" as const),
    };
  });

  if (rejectedIndex >= 0 || currentStatus === "REJECTED" || currentStatus === "RESOLVED") {
    return entries;
  }

  const pendingTitle = nextPendingTitle(currentStatus, entries);
  if (pendingTitle) {
    entries.push({
      title: pendingTitle,
      tone: "pending",
    });
  }

  return entries;
}

function nextPendingTitle(status: FeedbackStatus, entries: TimelineEntry[]) {
  const completedTitles = new Set(entries.map((entry) => entry.title));
  if (status === "PENDING" && !completedTitles.has("Đã tiếp nhận phản ánh"))
    return "Đã tiếp nhận phản ánh";
  if (status === "IN_PROGRESS" && !completedTitles.has("Đã hoàn thành xử lý"))
    return "Đã hoàn thành xử lý";
  if (status === "WAITING_INFO") return "Chờ công dân bổ sung thông tin";
  return null;
}

function timelineActionText(entry: TimelineEntry) {
  if (entry.tone === "rejected") return "từ chối phản ánh";
  if (entry.action === "ASSIGN") {
    return `chuyển xử lý đến ${entry.assignedToName || entry.authorityName || "đơn vị phụ trách"}`;
  }
  if (entry.title === "Đã gửi phản ánh") return "đã gửi phản ánh";
  if (entry.title === "Đã tiếp nhận phản ánh") return "đã tiếp nhận phản ánh";
  if (entry.title === "Đang xử lý") return "đang xử lý phản ánh";
  if (entry.title === "Đã cập nhật kết quả xử lý") return "đã cập nhật kết quả xử lý";
  if (entry.title === "Đã hoàn thành xử lý") return "đã hoàn thành xử lý";
  if (entry.title === "Đã đóng phản ánh") return "đã đóng phản ánh";
  return entry.title.charAt(0).toLowerCase() + entry.title.slice(1);
}

function roleLabel(role: string) {
  const labels: Record<string, string> = {
    CITIZEN: "Người dân",
    WARD_STAFF: "Cán bộ phường",
    POLICE: "Công an",
    SUPER_ADMIN: "Quản trị",
  };
  return labels[role] || role;
}

function statusTitle(status: string | null | undefined) {
  const labels: Record<string, string> = {
    PENDING: "Đã gửi phản ánh",
    IN_PROGRESS: "Đang xử lý",
    WAITING_INFO: "Cần bổ sung thông tin",
    RESOLVED: "Đã hoàn thành xử lý",
    REJECTED: "Phản ánh bị từ chối",
  };
  return status ? labels[status] || status : "Đã cập nhật phản ánh";
}

function formatDateTime(value?: string | null) {
  if (!value) return "N/A";
  return value.slice(0, 16).replace("T", " ");
}

function formatTimelineDate(value?: string | null) {
  if (!value) return "N/A";
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return formatDateTime(value);
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function isVideoAttachment(attachment: FeedbackAttachmentResponse) {
  const type = attachment.fileType?.toLowerCase() || "";
  const url = attachment.fileUrl?.toLowerCase() || "";
  return type.includes("video") || /\.(mp4|webm|mov|avi|m4v)(\?|$)/.test(url);
}
