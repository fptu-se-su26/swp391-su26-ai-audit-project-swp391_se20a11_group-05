/**
 * _auth.ward.tsx — Ward Staff Dashboard
 *
 * Protected by TWO independent guards:
 *   1. _auth.tsx layout → checks user is authenticated + is an AUTHORITY role
 *   2. This route's beforeLoad → checks specifically for WARD_STAFF
 *
 * Any other authority role (POLICE, SUPER_ADMIN) navigating here gets
 * redirected to /login — they cannot view ward operations.
 */

import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { useFeedbacks, useChangeFeedbackStatus } from "@/lib/hooks";
import { reports as mockReports, type ReportStatus } from "@/lib/mock-data";
import { StatusBadge } from "@/components/site/StatusBadge";
import { StaffShell } from "@/components/site/StaffShell";
import { Role } from "@/lib/roles";
import { mapStatus } from "@/lib/status";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Check, MapPin, MessageSquare, X, Loader2, RefreshCw,
  Clock, ChevronRight, Calendar, User, Tag, FileText,
  CheckCircle2, AlertCircle, PlayCircle, XCircle, Search,
  ArrowRight, InboxIcon, Activity,
} from "lucide-react";
import type { FeedbackResponse } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/_auth/ward")({
  beforeLoad: ({ context }) => {
    const { currentUser } = context as { currentUser: { name: string; role: string; org: string } };
    if (currentUser.role !== Role.WARD_STAFF) {
      throw redirect({ to: "/login", search: { redirect: undefined, error: "forbidden" } });
    }
  },
  head: () => ({
    meta: [
      { title: "Cổng cán bộ phường — UBND Hải Châu I" },
      { name: "description", content: "Bảng điều khiển dành cho cán bộ phường: tiếp nhận, xử lý, hoàn thành phản ánh." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: WardDashboard,
});

// ─── Types & Helpers ──────────────────────────────────────────

type FilterTab = "all" | "PENDING" | "IN_PROGRESS" | "RESOLVED" | "REJECTED";

const TAB_CONFIG: { id: FilterTab; label: string; icon: typeof InboxIcon; color: string }[] = [
  { id: "all",         label: "Tất cả",        icon: InboxIcon,      color: "text-slate-600" },
  { id: "PENDING",     label: "Chờ tiếp nhận", icon: Clock,          color: "text-amber-600" },
  { id: "IN_PROGRESS", label: "Đang xử lý",    icon: PlayCircle,     color: "text-blue-600" },
  { id: "RESOLVED",    label: "Đã xử lý",      icon: CheckCircle2,   color: "text-emerald-600" },
  { id: "REJECTED",    label: "Từ chối",        icon: XCircle,        color: "text-red-600" },
];

const STATUS_NEXT_ACTIONS: Record<string, { label: string; nextStatus: string; style: string; icon: typeof Check }[]> = {
  PENDING:     [{ label: "Tiếp nhận",   nextStatus: "IN_PROGRESS", style: "bg-blue-600 text-white hover:bg-blue-700",    icon: PlayCircle }],
  ASSIGNED:    [{ label: "Bắt đầu xử lý", nextStatus: "IN_PROGRESS", style: "bg-blue-600 text-white hover:bg-blue-700", icon: PlayCircle }],
  IN_PROGRESS: [
    { label: "Hoàn thành", nextStatus: "RESOLVED", style: "bg-emerald-600 text-white hover:bg-emerald-700", icon: Check },
    { label: "Từ chối",    nextStatus: "REJECTED",  style: "bg-red-500 text-white hover:bg-red-600",        icon: XCircle },
  ],
  WAITING_INFO: [{ label: "Tiếp tục xử lý", nextStatus: "IN_PROGRESS", style: "bg-blue-600 text-white hover:bg-blue-700", icon: PlayCircle }],
  RESOLVED:    [],
  REJECTED:    [],
};

// ─── Sub-components ───────────────────────────────────────────

function KpiCard({ icon: Icon, label, value, color, bg, loading }: {
  icon: typeof Clock; label: string; value: number; color: string; bg: string; loading: boolean;
}) {
  return (
    <div className={`rounded-2xl p-5 ${bg} flex items-center gap-4 border border-white/60`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color} bg-white/60`}>
        <Icon size={22} />
      </div>
      <div>
        <div className="text-xs font-bold uppercase tracking-wider opacity-70 mb-0.5">{label}</div>
        {loading
          ? <Skeleton className="h-8 w-16 rounded" />
          : <div className="text-2xl font-bold">{value.toLocaleString()}</div>}
      </div>
    </div>
  );
}

function ReportListItem({ report, selected, onClick, locale }: {
  report: FeedbackResponse | typeof mockReports[0];
  selected: boolean;
  onClick: () => void;
  locale: string;
}) {
  const isApi = "trackingCode" in report;
  const title = isApi ? (report as FeedbackResponse).title : (report as typeof mockReports[0]).title[locale as "vi" | "en"];
  const status = isApi ? mapStatus((report as FeedbackResponse).status) : (report as typeof mockReports[0]).status;
  const address = isApi
    ? ((report as FeedbackResponse).addressDetails ?? "—")
    : (report as typeof mockReports[0]).address[locale as "vi" | "en"];
  const createdAt = isApi ? new Date((report as FeedbackResponse).createdAt).toLocaleString("vi-VN") : (report as typeof mockReports[0]).createdAt;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border transition-all duration-150 group ${
        selected
          ? "border-gov-blue bg-blue-50 shadow-md"
          : "border-slate-100 bg-white hover:border-gov-blue/30 hover:bg-slate-50 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <StatusBadge status={status} />
        <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full ${selected ? "bg-gov-blue/10 text-gov-blue" : "bg-slate-100 text-slate-500"}`}>
          {isApi ? (report as FeedbackResponse).trackingCode : (report as typeof mockReports[0]).id}
        </span>
      </div>
      <h3 className="font-semibold text-ink text-sm leading-snug mb-1.5 line-clamp-2">{title}</h3>
      <div className="flex items-center gap-1 text-xs text-ink-soft">
        <MapPin size={11} className="shrink-0" />
        <span className="truncate">{address}</span>
      </div>
      <div className="flex items-center gap-1 text-xs text-ink-soft mt-1">
        <Clock size={11} className="shrink-0" />
        <span>{createdAt}</span>
      </div>
      {selected && (
        <div className="mt-2 flex items-center gap-1 text-xs font-semibold text-gov-blue">
          Đang xem <ChevronRight size={12} />
        </div>
      )}
    </button>
  );
}

function ReportDetail({ report, locale, onStatusChange, changing }: {
  report: FeedbackResponse | typeof mockReports[0] | undefined;
  locale: string;
  onStatusChange: (id: number | string, status: string) => void;
  changing: boolean;
}) {
  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-ink-soft text-sm gap-3">
        <FileText size={40} className="opacity-30" />
        <p>Chọn một phản ánh để xem chi tiết</p>
      </div>
    );
  }

  const isApi = "trackingCode" in report;
  const title = isApi ? (report as FeedbackResponse).title : (report as typeof mockReports[0]).title[locale as "vi" | "en"];
  const description = isApi ? (report as FeedbackResponse).description : (report as typeof mockReports[0]).description[locale as "vi" | "en"];
  const status = isApi ? (report as FeedbackResponse).status : (report as typeof mockReports[0]).status.toUpperCase();
  const frontStatus = mapStatus(status);
  const address = isApi ? ((report as FeedbackResponse).addressDetails ?? "—") : (report as typeof mockReports[0]).address[locale as "vi" | "en"];
  const reporter = isApi ? ((report as FeedbackResponse).citizenName ?? "Ẩn danh") : (report as typeof mockReports[0]).reporter;
  const category = isApi ? ((report as FeedbackResponse).categoryName ?? "—") : (report as typeof mockReports[0]).category;
  const id = report.id;
  const actions = STATUS_NEXT_ACTIONS[status] ?? [];
  const timeline = isApi ? null : (report as typeof mockReports[0]).timeline;
  const image = isApi ? null : (report as typeof mockReports[0]).image;

  return (
    <div className="animate-fade-in space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <StatusBadge status={frontStatus} />
          <h2 className="text-xl font-bold text-ink mt-2 leading-snug">{title}</h2>
        </div>
        <span className="font-mono text-xs bg-slate-100 text-slate-500 px-2.5 py-1 rounded-lg shrink-0">
          {isApi ? (report as FeedbackResponse).trackingCode : id}
        </span>
      </div>

      {/* Image (mock only) */}
      {image && (
        <div className="rounded-xl overflow-hidden border border-slate-100">
          <img src={image} alt={title} className="w-full h-44 object-cover" loading="lazy" />
        </div>
      )}

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-slate-50 rounded-xl p-3">
          <div className="text-xs text-ink-soft mb-1 flex items-center gap-1"><User size={11} /> Người phản ánh</div>
          <div className="font-semibold text-ink">{reporter}</div>
        </div>
        <div className="bg-slate-50 rounded-xl p-3">
          <div className="text-xs text-ink-soft mb-1 flex items-center gap-1"><Tag size={11} /> Danh mục</div>
          <div className="font-semibold text-ink capitalize">{category}</div>
        </div>
        <div className="bg-slate-50 rounded-xl p-3 col-span-2">
          <div className="text-xs text-ink-soft mb-1 flex items-center gap-1"><MapPin size={11} /> Địa điểm</div>
          <div className="font-semibold text-ink">{address}</div>
        </div>
      </div>

      {/* Description */}
      <div className="bg-slate-50 rounded-xl p-4">
        <div className="text-xs text-ink-soft mb-2 font-bold uppercase tracking-wider flex items-center gap-1.5">
          <MessageSquare size={12} /> Mô tả chi tiết
        </div>
        <p className="text-sm text-ink leading-relaxed">{description}</p>
      </div>

      {/* Timeline (mock only) */}
      {timeline && timeline.length > 0 && (
        <div>
          <div className="text-xs text-ink-soft mb-3 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Activity size={12} /> Lịch sử xử lý
          </div>
          <ol className="relative border-l-2 border-slate-200 ml-2 space-y-4">
            {timeline.map((step, i) => (
              <li key={i} className="ml-5">
                <div className={`absolute w-3.5 h-3.5 rounded-full -left-[7px] border-2 border-white ${
                  step.status === "resolved" ? "bg-emerald-500" :
                  step.status === "urgent" ? "bg-red-500" :
                  step.status === "inProgress" ? "bg-blue-500" : "bg-amber-500"
                }`} />
                <div className="text-xs font-semibold text-ink">{step.label[locale as "vi" | "en"]}</div>
                <div className="text-[11px] text-ink-soft">{step.at}</div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Action buttons */}
      {actions.length > 0 && (
        <div className="pt-2 border-t border-slate-100">
          <div className="text-xs text-ink-soft mb-3 font-bold uppercase tracking-wider">Hành động</div>
          <div className="flex flex-col gap-2">
            {actions.map((a) => (
              <button
                key={a.nextStatus}
                onClick={() => onStatusChange(id, a.nextStatus)}
                disabled={changing}
                className={`flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl font-bold text-sm transition-all ${a.style} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {changing ? <Loader2 size={16} className="animate-spin" /> : <a.icon size={16} />}
                {a.label}
              </button>
            ))}
            <button className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl font-bold text-sm border-2 border-slate-200 text-ink-soft hover:border-slate-300 hover:bg-slate-50 transition-all">
              <MessageSquare size={16} /> Yêu cầu thêm thông tin
            </button>
          </div>
        </div>
      )}

      {(status === "RESOLVED") && (
        <div className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
          <p className="text-sm text-emerald-800 font-medium">Phản ánh đã được xử lý hoàn tất.</p>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────

function WardDashboard() {
  const { locale } = useI18n();
  const { data: feedbacksPage, isLoading, isFetching, refetch } = useFeedbacks(0, 50);
  const { mutate: changeStatus, isPending: changing } = useChangeFeedbackStatus();

  const [selectedId, setSelectedId] = useState<string | number | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const hasApiData = !!feedbacksPage && feedbacksPage.content.length > 0;
  const apiFeedbacks = feedbacksPage?.content ?? [];

  // Filter logic
  const sourceList = hasApiData ? apiFeedbacks : mockReports;
  const filteredList = (sourceList as (FeedbackResponse | typeof mockReports[0])[]).filter((r) => {
    const status = "trackingCode" in r ? (r as FeedbackResponse).status : (r as typeof mockReports[0]).status.toUpperCase();
    const title = "trackingCode" in r ? (r as FeedbackResponse).title : (r as typeof mockReports[0]).title[locale as "vi" | "en"];
    const matchTab = activeTab === "all" || status === activeTab;
    const matchSearch = !searchQuery || title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchTab && matchSearch;
  });

  // Auto-select first item
  useEffect(() => {
    if (selectedId !== null) return;
    if (filteredList.length > 0) {
      setSelectedId(filteredList[0].id);
    }
  }, [hasApiData, filteredList.length]);

  // Reset selection when filter changes
  useEffect(() => {
    if (filteredList.length > 0) {
      setSelectedId(filteredList[0].id);
    } else {
      setSelectedId(null);
    }
  }, [activeTab, searchQuery]);

  const selected = filteredList.find((r) => r.id === selectedId);

  // KPI counts
  const total     = hasApiData ? apiFeedbacks.length : mockReports.length;
  const pending   = hasApiData ? apiFeedbacks.filter(f => f.status === "PENDING" || f.status === "ASSIGNED").length : mockReports.filter(r => r.status === "pending").length;
  const inProg    = hasApiData ? apiFeedbacks.filter(f => f.status === "IN_PROGRESS").length : mockReports.filter(r => r.status === "inProgress").length;
  const resolved  = hasApiData ? apiFeedbacks.filter(f => f.status === "RESOLVED").length : mockReports.filter(r => r.status === "resolved").length;

  const handleStatusChange = (id: number | string, status: string) => {
    if (!hasApiData) {
      toast.info("Demo mode — backend không kết nối.");
      return;
    }
    changeStatus({ id: id as number, status }, {
      onSuccess: () => toast.success("Đã cập nhật trạng thái phản ánh!"),
      onError: () => toast.error("Lỗi cập nhật. Vui lòng thử lại."),
    });
  };

  return (
    <StaffShell
      accent="blue"
      eyebrow={locale === "vi" ? "Cổng cán bộ phường" : "Ward officer portal"}
      title="Quản lý Phản ánh"
      org="UBND Phường Hải Châu I · Quận Hải Châu"
    >
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KpiCard icon={InboxIcon}    label="Tổng phản ánh"   value={total}   color="text-gov-blue"    bg="bg-blue-50"    loading={isLoading} />
        <KpiCard icon={Clock}        label="Chờ tiếp nhận"   value={pending}  color="text-amber-600"   bg="bg-amber-50"   loading={isLoading} />
        <KpiCard icon={Activity}     label="Đang xử lý"      value={inProg}   color="text-blue-600"    bg="bg-sky-50"     loading={isLoading} />
        <KpiCard icon={CheckCircle2} label="Đã hoàn thành"   value={resolved} color="text-emerald-600" bg="bg-emerald-50" loading={isLoading} />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm phản ánh..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border-2 border-slate-200 text-sm focus:border-gov-blue outline-none bg-white transition-colors"
          />
        </div>

        {/* Refresh */}
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="btn-civic btn-civic-ghost text-sm !px-4 !py-2.5 !min-h-0"
        >
          {isFetching ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
          {locale === "vi" ? "Làm mới" : "Refresh"}
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-1.5 mb-5 flex-wrap">
        {TAB_CONFIG.map((tab) => {
          const count = tab.id === "all" ? total
            : (sourceList as (FeedbackResponse | typeof mockReports[0])[]).filter(r => {
                const s = "trackingCode" in r ? (r as FeedbackResponse).status : (r as typeof mockReports[0]).status.toUpperCase();
                return s === tab.id;
              }).length;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border-2 transition-all duration-150 ${
                isActive
                  ? "border-gov-blue bg-gov-blue text-white shadow-sm"
                  : "border-slate-200 bg-white text-ink-soft hover:border-gov-blue/30"
              }`}
            >
              <tab.icon size={13} />
              {tab.label}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Master-Detail Layout */}
      <div className="grid lg:grid-cols-5 gap-5 min-h-[520px]">

        {/* Left: Report List (2/5 width) */}
        <div className="lg:col-span-2 space-y-2 overflow-y-auto max-h-[calc(100vh-22rem)] pr-1 pb-2">
          {isLoading && (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className="p-4 rounded-xl border border-slate-100 space-y-2 bg-white">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-4 w-3/4 rounded" />
                  <Skeleton className="h-3 w-1/2 rounded" />
                </div>
              ))}
            </div>
          )}

          {!isLoading && filteredList.length === 0 && (
            <div className="flex flex-col items-center justify-center h-52 text-ink-soft text-sm gap-3">
              <InboxIcon size={36} className="opacity-25" />
              <p>Không có phản ánh nào</p>
            </div>
          )}

          {!isLoading && filteredList.map((r, idx) => (
            <div
              key={r.id}
              className={`animate-fade-in-up stagger-${(idx % 4) + 1}`}
            >
              <ReportListItem
                report={r}
                selected={selectedId === r.id}
                onClick={() => setSelectedId(r.id)}
                locale={locale}
              />
            </div>
          ))}
        </div>

        {/* Right: Detail Panel (3/5 width) */}
        <div className="lg:col-span-3">
          <div className="card-civic p-5 h-full">
            <ReportDetail
              report={selected}
              locale={locale}
              onStatusChange={handleStatusChange}
              changing={changing}
            />
          </div>
        </div>
      </div>

      {/* Footer stats */}
      {!isLoading && (
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs text-ink-soft">
          <span>Hiển thị <strong className="text-ink">{filteredList.length}</strong> / {total} phản ánh</span>
          {!hasApiData && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 text-amber-700 font-medium border border-amber-200">
              ⚠ Đang dùng dữ liệu demo — backend chưa kết nối
            </span>
          )}
          {isFetching && (
            <span className="flex items-center gap-1">
              <Loader2 size={11} className="animate-spin" /> Đang tải...
            </span>
          )}
        </div>
      )}
    </StaffShell>
  );
}
