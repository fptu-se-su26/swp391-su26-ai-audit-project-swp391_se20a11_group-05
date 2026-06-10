import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useFeedbacks, useFeedbackStatuses } from "@/lib/hooks";
import { StatusBadge } from "@/components/site/StatusBadge";
import { EmptyState, ErrorState, NotLoggedIn } from "@/components/site/EmptyState";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Image,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Video,
  X,
} from "lucide-react";
import { mapStatus } from "@/lib/status";
import { toast } from "sonner";
import { Role, AUTHORITY_ROLES, parseBackendRole } from "@/lib/roles";
import { getToken, type FeedbackAttachmentResponse, type FeedbackStatus } from "@/lib/api";

export const Route = createFileRoute("/my-reports/")({
  beforeLoad: async () => {
    const token = typeof window !== "undefined" ? getToken() : null;
    const raw = typeof window !== "undefined" ? localStorage.getItem("dn_auth_user_v2") : null;

    if (!token || !raw) {
      throw redirect({ to: "/login", search: { redirect: "/my-reports" } });
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
  head: () => ({
    meta: [
      { title: "Bao cao cua toi - Da Nang Ket Noi" },
      { name: "description", content: "Theo doi tat ca phan anh ban da gui." },
    ],
  }),
  component: MyReports,
});

const PAGE_SIZE = 3;

function MyReports() {
  const { t, locale } = useI18n();
  const { user, isAuthenticated } = useAuth();
  const [page, setPage] = useState(0);
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<FeedbackStatus | "">("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [activeMedia, setActiveMedia] = useState<FeedbackAttachmentResponse | null>(null);

  const filters = useMemo(
    () => ({ keyword, status, fromDate, toDate }),
    [keyword, status, fromDate, toDate],
  );
  const { data: feedbacksPage, isLoading, isFetching, refetch, error, isError } = useFeedbacks(
    page,
    PAGE_SIZE,
    filters,
  );
  const { data: statuses = [] } = useFeedbackStatuses();

  useEffect(() => {
    if (isError && error) {
      toast.error(error instanceof Error ? error.message : "Failed to load reports", {
        id: "reports-error",
      });
    }
  }, [isError, error]);

  useEffect(() => {
    setExpandedIds(new Set());
  }, [page, keyword, status, fromDate, toDate]);

  if (!isAuthenticated) {
    return <NotLoggedIn />;
  }

  const feedbacks = feedbacksPage?.content ?? [];
  const totalPages = feedbacksPage?.totalPages ?? 0;
  const isFiltered = Boolean(keyword || status || fromDate || toDate);

  const runSearch = () => {
    setPage(0);
    setKeyword(keywordInput.trim());
  };

  const clearFilters = () => {
    const shouldRefetchCurrentList = !isFiltered && page === 0;
    setPage(0);
    setKeyword("");
    setKeywordInput("");
    setStatus("");
    setFromDate("");
    setToDate("");
    if (shouldRefetchCurrentList) {
      void refetch();
    }
  };

  const handleRefresh = () => {
    void refetch();
  };

  const setFilterPageStart = (action: () => void) => {
    setPage(0);
    action();
  };

  const pageButtons = getVisiblePageIndexes(page, totalPages);

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-10 md:py-14">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading text-4xl md:text-5xl text-gov-blue mb-2">{t("my.title")}</h1>
          <p className="text-lg text-ink-soft">{t("my.subtitle")}</p>
          {user && (
            <p className="text-sm text-ink-soft mt-1">
              {user.name} - {locale === "vi" ? "Dang hien thi phan anh cua ban" : "Showing your reports"}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isFetching}
          className="btn-civic btn-civic-ghost flex items-center gap-2 min-h-[44px]"
        >
          {isFetching ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
          {locale === "vi" ? "Lam moi" : "Refresh"}
        </button>
      </div>

      <section className="rounded-xl border border-slate-200 bg-blue-50/80 p-4 md:p-5 mb-6 shadow-sm">
        <div className="grid grid-cols-[44px_minmax(0,1fr)] lg:grid-cols-[44px_minmax(0,1fr)_auto] gap-3">
          <button
            type="button"
            onClick={() => setFiltersOpen((open) => !open)}
            className={`min-h-[44px] rounded-lg border grid place-items-center transition-colors ${
              filtersOpen
                ? "border-gov-blue bg-gov-blue text-white"
                : "border-slate-200 bg-white text-gov-blue hover:bg-gov-blue/5"
            }`}
            aria-label={filtersOpen ? "Hide filters" : "Show filters"}
            aria-expanded={filtersOpen}
            title={filtersOpen ? "Hide filters" : "Show filters"}
          >
            <SlidersHorizontal size={19} />
          </button>
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
            <input
              type="search"
              value={keywordInput}
              onChange={(event) => setKeywordInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") runSearch();
              }}
              placeholder="Search by tracking code, title, content, location, ward..."
              className="w-full min-h-[44px] rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-gov-blue"
            />
          </div>
          <button
            type="button"
            onClick={runSearch}
            disabled={isFetching}
            className="btn-civic btn-civic-primary min-h-[44px] col-span-2 lg:col-span-1"
          >
            {isFetching ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
            {locale === "vi" ? "Tim kiem" : "Search"}
          </button>
        </div>

        <div
          className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
            filtersOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-3 mt-4 border-t border-slate-200/80 pt-4">
              <select
                value={status}
                onChange={(event) =>
                  setFilterPageStart(() => setStatus(event.target.value as FeedbackStatus | ""))
                }
                className="min-h-[44px] rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-gov-blue"
              >
                <option value="">{locale === "vi" ? "Tat ca trang thai" : "All Statuses"}</option>
                {statuses.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <label className="grid grid-cols-[52px_minmax(0,1fr)] items-center gap-2">
                <span className="text-sm font-semibold text-ink-soft">From</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(event) => setFilterPageStart(() => setFromDate(event.target.value))}
                  aria-label={locale === "vi" ? "Tu ngay" : "From date"}
                  className="min-h-[44px] rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-gov-blue"
                />
              </label>

              <label className="grid grid-cols-[52px_minmax(0,1fr)] items-center gap-2">
                <span className="text-sm font-semibold text-ink-soft">To</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(event) => setFilterPageStart(() => setToDate(event.target.value))}
                  aria-label={locale === "vi" ? "Den ngay" : "To date"}
                  className="min-h-[44px] rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-gov-blue"
                />
              </label>

              <button
                type="button"
                onClick={clearFilters}
                className="btn-civic btn-civic-ghost min-h-[44px] whitespace-nowrap"
              >
                <X size={18} />
                {locale === "vi" ? "Xoa bo loc" : "Clear Filters"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {isError && !isLoading && (
        <ErrorState
          message={
            error instanceof Error
              ? error.message
              : locale === "vi"
                ? "Khong the tai du lieu tu may chu"
                : "Failed to load data from server"
          }
          onRetry={() => refetch()}
          compact
        />
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={40} className="animate-spin text-gov-blue" />
        </div>
      )}

      {!isLoading && !isError && feedbacks.length === 0 && (
        <EmptyState
          title={isFiltered ? (locale === "vi" ? "Khong tim thay phan anh" : "No matching reports") : locale === "vi" ? "Chua co phan anh nao" : "No reports yet"}
          description={
            isFiltered
              ? locale === "vi"
                ? "Thu doi tu khoa, trang thai hoac khoang ngay."
                : "Try changing the keyword, status, or date range."
              : locale === "vi"
                ? "Hay gui phan anh dau tien cua ban ve cac van de do thi tai Da Nang."
                : "Submit your first report about urban issues in Da Nang."
          }
          action={
            !isFiltered ? (
              <Link to="/report" className="btn-civic btn-civic-primary">
                {locale === "vi" ? "Gui phan anh dau tien" : "Submit your first report"}
              </Link>
            ) : null
          }
        />
      )}

      <div className="space-y-4">
        {!isLoading &&
          feedbacks.map((report, idx) => {
            const attachments = report.attachments ?? [];
            const expanded = expandedIds.has(report.id);
            return (
              <article
                key={report.id}
                className={`card-civic p-5 md:p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 animate-fade-in-up stagger-${Math.min(idx + 1, 4)}`}
              >
                <div className="flex items-start gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start gap-2 mb-2">
                      <StatusBadge status={mapStatus(report.status)} />
                      <span className="text-ink-soft text-sm ml-auto font-mono">{report.trackingCode}</span>
                    </div>
                    <h2 className="text-xl font-bold text-ink font-sans mb-1">{report.title}</h2>
                    <p className="text-ink-soft mb-3 line-clamp-2">{report.description}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-ink-soft">
                      {(report.addressDetails || report.wardName) && (
                        <span className="flex items-center gap-1.5">
                          <MapPin size={16} /> {report.addressDetails || report.wardName}
                        </span>
                      )}
                      <span className="text-xs text-ink-soft">{report.createdAt?.slice(0, 10)}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleExpanded(report.id, setExpandedIds)}
                    className="w-10 h-10 rounded-lg border border-slate-200 grid place-items-center text-gov-blue hover:bg-gov-blue/5 shrink-0"
                    aria-label={expanded ? "Collapse attachments" : "Expand attachments"}
                    title={expanded ? "Collapse attachments" : "Expand attachments"}
                  >
                    {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                </div>

                {expanded && (
                  <div className="mt-5 border-t border-slate-100 pt-4">
                    {attachments.length === 0 ? (
                      <p className="text-sm text-ink-soft">{locale === "vi" ? "Khong co tep dinh kem" : "No attachments"}</p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {attachments.map((attachment) => (
                          <button
                            key={attachment.id}
                            type="button"
                            onClick={() => setActiveMedia(attachment)}
                            className="group relative aspect-video overflow-hidden rounded-lg border border-slate-200 bg-slate-100 text-left"
                          >
                            {isVideoAttachment(attachment) ? (
                              <video src={attachment.fileUrl} className="w-full h-full object-cover bg-black" muted />
                            ) : (
                              <img src={attachment.fileUrl} alt={attachment.fileName || ""} className="w-full h-full object-cover" loading="lazy" />
                            )}
                            <span className="absolute left-2 bottom-2 inline-flex items-center gap-1 rounded-md bg-white/95 px-2 py-1 text-xs font-semibold text-ink shadow-sm">
                              {isVideoAttachment(attachment) ? <Video size={13} /> : <Image size={13} />}
                              {isVideoAttachment(attachment) ? "Video" : "Image"}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
      </div>

      {!isLoading && !isError && totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(0, current - 1))}
            disabled={feedbacksPage?.first}
            className="btn-civic btn-civic-ghost disabled:opacity-30"
          >
            <ChevronLeft size={18} />
          </button>
          {pageButtons.map((pageIndex) => (
            <button
              key={pageIndex}
              type="button"
              onClick={() => setPage(pageIndex)}
              className={`min-w-[40px] min-h-[40px] rounded-lg font-semibold text-sm border transition-all ${
                pageIndex === page
                  ? "bg-gov-blue text-white border-gov-blue"
                  : "bg-white border-slate-200 hover:border-gov-blue"
              }`}
            >
              {pageIndex + 1}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
            disabled={feedbacksPage?.last}
            className="btn-civic btn-civic-ghost disabled:opacity-30"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {activeMedia && (
        <div className="fixed inset-0 z-[1000] bg-black/70 p-4 flex items-center justify-center" role="dialog" aria-modal="true">
          <button
            type="button"
            onClick={() => setActiveMedia(null)}
            className="absolute right-4 top-4 w-10 h-10 rounded-lg bg-white text-ink grid place-items-center"
            aria-label="Close media preview"
          >
            <X size={20} />
          </button>
          <div className="w-full max-w-4xl max-h-[85vh]">
            {isVideoAttachment(activeMedia) ? (
              <video src={activeMedia.fileUrl} className="max-h-[85vh] w-full rounded-lg bg-black" controls autoPlay />
            ) : (
              <img src={activeMedia.fileUrl} alt={activeMedia.fileName || ""} className="max-h-[85vh] w-full object-contain rounded-lg bg-white" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function toggleExpanded(id: number, setExpandedIds: Dispatch<SetStateAction<Set<number>>>) {
  setExpandedIds((current) => {
    const next = new Set(current);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    return next;
  });
}

function getVisiblePageIndexes(currentPage: number, totalPages: number) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index);
  }

  const start = Math.max(0, Math.min(currentPage - 2, totalPages - 5));
  return Array.from({ length: 5 }, (_, index) => start + index);
}

function isVideoAttachment(attachment: FeedbackAttachmentResponse) {
  const type = attachment.fileType?.toLowerCase() || "";
  const url = attachment.fileUrl?.toLowerCase() || "";
  return type.includes("video") || /\.(mp4|webm|mov|avi|m4v)(\?|$)/.test(url);
}
