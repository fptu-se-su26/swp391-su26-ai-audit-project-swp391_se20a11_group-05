import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { feedbackApi, type FeedbackResponse } from "@/lib/api";
import { reports as mockReports } from "@/lib/mock-data";
import { StatusBadge } from "@/components/site/StatusBadge";
import { ArrowLeft, Check, Clock, MapPin, User, Loader2 } from "lucide-react";

export const Route = createFileRoute("/my-reports/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Phản ánh ${params.id} — Đà Nẵng Lắng Nghe` },
      { name: "description", content: `Trạng thái phản ánh ${params.id} và lịch sử xử lý.` },
    ],
  }),
  component: ReportDetail,
});

/** Map backend status → frontend timeline stage */
function mapTimelineStage(backendStatus: string) {
  const m: Record<string, "pending" | "inProgress" | "resolved" | "urgent"> = {
    PENDING: "pending",
    ASSIGNED: "inProgress",
    IN_PROGRESS: "inProgress",
    WAITING_INFO: "pending",
    RESOLVED: "resolved",
    REJECTED: "urgent",
  };
  return m[backendStatus] || "pending";
}

function ReportDetail() {
  const { id } = Route.useParams();
  const { t, locale } = useI18n();

  const [apiReport, setApiReport] = useState<FeedbackResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Try API first
    feedbackApi.getById(id)
      .then(data => {
        setApiReport(data);
        setLoading(false);
      })
      .catch(() => {
        // Fallback to mock data if API fails or report not found in API
        setLoading(false);
        setError(true);
      });
  }, [id]);

  const stages = ["pending", "inProgress", "resolved"] as const;
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <Loader2 size={48} className="animate-spin text-gov-blue" />
      </div>
    );
  }

  // If we have API report, use it. Otherwise, look up in mock data.
  const mockReport = mockReports.find(r => r.id === id);
  const isApi = !!apiReport;
  
  if (!isApi && !mockReport) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-heading text-gov-blue mb-3">Không tìm thấy phản ánh</h1>
        <p className="text-ink-soft mb-6">The report you're looking for doesn't exist.</p>
        <Link to="/my-reports" className="btn-civic btn-civic-primary">Quay lại danh sách</Link>
      </div>
    );
  }

  const currentStage = isApi ? mapTimelineStage(apiReport.status) : mockReport!.status;
  const currentIdx = stages.indexOf(currentStage as typeof stages[number]);

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-10 md:py-14">
      <Link to="/my-reports" className="inline-flex items-center gap-2 text-gov-blue font-semibold mb-6 hover:underline">
        <ArrowLeft size={18} /> {t("my.title")}
      </Link>

      {/* Warning for mock data */}
      {!isApi && (
        <div className="mb-6 px-4 py-3 rounded-xl border border-amber-300 bg-amber-50 text-amber-800 text-sm flex items-center gap-2">
          ⚠️ {locale === "vi" ? "Đang hiển thị dữ liệu demo — chưa kết nối Backend." : "Showing demo data — Backend not connected."}
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <StatusBadge status={currentStage} />
        <span className="font-mono text-sm text-ink-soft">{isApi ? apiReport.trackingCode : mockReport!.id}</span>
      </div>

      <h1 className="font-heading text-3xl md:text-4xl text-gov-blue mb-4">
        {isApi ? apiReport.title : mockReport!.title[locale]}
      </h1>
      <p className="text-lg text-ink-soft mb-8 leading-relaxed">
        {isApi ? apiReport.description : mockReport!.description[locale]}
      </p>

      <div className="grid md:grid-cols-2 gap-6 mb-10">
        <img
          src={isApi ? "https://placehold.co/800x800/e2e8f0/475569?text=No+Image" : mockReport!.image}
          alt={isApi ? apiReport.title : mockReport!.title[locale]}
          loading="lazy"
          width={800}
          height={800}
          className="w-full aspect-square object-cover rounded-2xl card-civic p-0"
        />
        <div className="card-civic p-6 space-y-3">
          <div className="flex items-start gap-3">
            <MapPin className="text-gov-blue mt-1" size={20} />
            <div>
              <div className="text-xs uppercase font-bold text-ink-soft tracking-wider">Vị trí</div>
              <div className="text-base text-ink">
                {isApi ? (apiReport.addressDetails || "Chưa cung cấp") : mockReport!.address[locale]}
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <User className="text-gov-blue mt-1" size={20} />
            <div>
              <div className="text-xs uppercase font-bold text-ink-soft tracking-wider">Người gửi</div>
              <div className="text-base text-ink">
                {isApi ? (apiReport.citizenName || "Ẩn danh") : mockReport!.reporter}
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock className="text-gov-blue mt-1" size={20} />
            <div>
              <div className="text-xs uppercase font-bold text-ink-soft tracking-wider">Thời gian</div>
              <div className="text-base text-ink">
                {isApi ? apiReport.createdAt?.slice(0, 16).replace('T', ' ') : mockReport!.createdAt}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <h2 className="text-2xl mb-5">Tiến trình xử lý / Resolution timeline</h2>
      <ol className="relative border-l-4 border-slate-200 pl-6 space-y-6">
        {stages.map((stage, i) => {
          const reached = i <= currentIdx || currentStage === "urgent";
          
          let stageLabel = "";
          let stageTime = "";
          
          if (!isApi) {
            const entry = mockReport!.timeline.find(te => te.status === stage);
            if (entry) {
              stageLabel = entry.label[locale];
              stageTime = entry.at;
            }
          } else {
            // Very simple timeline for API for now since we don't have full audit history yet
            if (stage === "pending" && apiReport.createdAt) {
              stageLabel = locale === "vi" ? "Tiếp nhận hệ thống" : "Received by system";
              stageTime = apiReport.createdAt.slice(0, 16).replace('T', ' ');
            } else if (stage === currentStage) {
              stageLabel = locale === "vi" ? "Trạng thái hiện tại" : "Current status";
              stageTime = apiReport.updatedAt?.slice(0, 16).replace('T', ' ') || "";
            }
          }

          const label =
            stage === "pending" ? t("my.timeline.submitted")
            : stage === "inProgress" ? t("my.timeline.inProgress")
            : t("my.timeline.resolved");

          return (
            <li key={stage} className="relative">
              <span
                className={`absolute -left-[34px] w-7 h-7 rounded-full grid place-items-center border-4 ${
                  reached ? "bg-[var(--status-success)] border-white" : "bg-slate-200 border-white"
                }`}
              >
                {reached && <Check size={14} className="text-white" />}
              </span>
              <div className={`font-bold text-lg ${reached ? "text-ink" : "text-ink-soft"}`}>{label}</div>
              {stageLabel && (
                <div className="text-sm text-ink-soft">{stageLabel} {stageTime ? `· ${stageTime}` : ""}</div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
