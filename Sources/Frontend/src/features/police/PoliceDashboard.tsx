import { lazy, Suspense } from "react";
import { useI18n } from "@/lib/i18n";
import { usePoliceAssignedFeedbacks, useRejectFeedback, useRequestMoreInfo, useHotspots } from "@/hooks";
import { reports as mockReports } from "@/lib/mock-data";
import { StaffShell } from "@/components/site/StaffShell";
import { Sparkline, textClassToHex } from "@/components/site/KpiChart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { AlertTriangle, Megaphone, ScanLine, Video, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ReportCard } from "@/features/shared/ReportCard";

const HeatmapMap = lazy(() =>
  import("@/components/site/HeatmapMap").then((m) => ({ default: m.HeatmapMap })),
);

export function PoliceDashboard() {
  const { t, locale } = useI18n();

  const { data: apiFeedbacks, isLoading } = usePoliceAssignedFeedbacks();
  const { data: hotspots } = useHotspots();
  const rejectMutation = useRejectFeedback();
  const requestInfoMutation = useRequestMoreInfo();

  // Cố gắng sử dụng dữ liệu từ API nếu có, nếu không thì dùng mock
  const hasApiData = !!apiFeedbacks && apiFeedbacks.length > 0;
  
  // Chúng ta không cần lọc lại nữa vì API getAssignedFeedbacks đã lọc sẵn theo assignee_id (Cán bộ Công an)
  const filteredApi = apiFeedbacks || [];

  const handleReject = (id: string | number) => {
    const reason = window.prompt("Nhập lý do từ chối hoặc yêu cầu chuyển tiếp:");
    if (reason) {
      rejectMutation.mutate({ id, reason });
    }
  };

  const handleRequestInfo = (id: string | number) => {
    const reason = window.prompt("Nhập nội dung yêu cầu người dân bổ sung:");
    if (reason) {
      requestInfoMutation.mutate({ id, reason });
    }
  };

  const trafficReports = mockReports.filter(
    (r) => r.category === "traffic" || r.status === "urgent" || r.category === "safety",
  );

  return (
    <StaffShell
      accent="red"
      eyebrow={locale === "vi" ? "Lực lượng phản ứng nhanh" : "Emergency forces"}
      title={t("police.title")}
      org="Công an Thành phố Đà Nẵng"
    >
      <div className="flex justify-end mb-6">
        <button
          className="btn-civic btn-civic-primary"
          style={{ background: "var(--status-danger)" }}
        >
          <Megaphone size={20} /> {t("police.broadcast")}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {[
          {
            icon: AlertTriangle,
            label: "Khẩn cấp đang xử lý",
            val: hasApiData ? filteredApi.filter((f) => f.status === "REJECTED").length : 4,
            color: "text-[var(--status-danger)]",
            border: "border-[var(--status-danger)]",
            spark: [6, 8, 4, 7, 5, 9, 3, 6, 8, 4, 7, 5],
          },
          {
            icon: Video,
            label: "Video chờ thẩm tra",
            val: 12,
            color: "text-gov-blue",
            border: "border-gov-blue",
            spark: [15, 12, 18, 10, 14, 16, 11, 13, 9, 17, 12, 14],
          },
          {
            icon: ScanLine,
            label: "Biển số đã OCR (24h)",
            val: 38,
            color: "text-[var(--status-pending)]",
            border: "border-[var(--status-pending)]",
            spark: [28, 35, 32, 40, 38, 42, 36, 44, 38, 41, 37, 43],
          },
        ].map((c, idx) => (
          <div
            key={c.label}
            className={`card-civic p-5 border-l-4 ${c.border} flex flex-col hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 animate-fade-in-up stagger-${(idx % 4) + 1}`}
          >
            <div className="flex items-center gap-4 mb-1">
              <c.icon className={c.color} size={36} />
              <div className="flex-1">
                <div className="text-xs uppercase font-bold text-ink-soft tracking-wider">
                  {c.label}
                </div>
                <div className={`text-3xl font-bold ${c.color}`}>
                  {isLoading ? <Loader2 size={24} className="animate-spin inline" /> : c.val}
                </div>
              </div>
            </div>
            <Sparkline data={c.spark} color={textClassToHex(c.color)} height={32} />
          </div>
        ))}
      </div>

      <div className="mb-10">
        <h2 className="text-2xl mb-4 font-bold flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500">
            📍
          </span>
          Bản đồ Điểm nóng vi phạm (Heatmap)
        </h2>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <Suspense fallback={<div className="h-[400px] w-full bg-slate-100 animate-pulse rounded-lg" />}>
            <HeatmapMap hotspots={hotspots || []} />
          </Suspense>
        </div>
      </div>

      <h2 className="text-2xl mb-4">Phản ánh ưu tiên / Priority queue</h2>

      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="card-civic p-5 md:p-6 grid md:grid-cols-12 gap-5">
              <div className="md:col-span-3">
                <Skeleton className="w-full aspect-video md:aspect-square rounded-lg" />
              </div>
              <div className="md:col-span-6 space-y-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-16 rounded" />
                  <Skeleton className="h-6 w-24 rounded ml-auto" />
                </div>
                <Skeleton className="h-6 w-3/4 rounded" />
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-4 w-1/2 rounded" />
              </div>
              <div className="md:col-span-3 flex flex-col gap-2">
                <Skeleton className="h-10 w-full rounded" />
                <Skeleton className="h-10 w-full rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-4">
        {/* API Data */}
        {!isLoading &&
          filteredApi.map((r) => (
            <ReportCard
              key={r.id}
              report={r}
              isApi={true}
              locale={locale}
              policeView={true}
              onReject={handleReject}
              onRequestInfo={handleRequestInfo}
              isLoading={rejectMutation.isPending || requestInfoMutation.isPending}
            />
          ))}

        {/* Fallback Mock Data */}
        {!isLoading &&
          trafficReports.map((r) => (
            <ReportCard
              key={r.id}
              report={r}
              isApi={false}
              locale={locale}
              policeView={true}
              onReject={handleReject}
              onRequestInfo={handleRequestInfo}
              isLoading={rejectMutation.isPending || requestInfoMutation.isPending}
            />
          ))}
      </div>

      {/* Daily report counts bar chart */}
      <div className="mt-8 card-civic p-6 animate-fade-in">
        <h2 className="text-xl font-bold text-ink mb-1">Phản ánh theo ngày / Daily reports</h2>
        <p className="text-sm text-ink-soft mb-5">7 ngày gần đây</p>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={[
                { day: "T2", count: 24 },
                { day: "T3", count: 18 },
                { day: "T4", count: 31 },
                { day: "T5", count: 27 },
                { day: "T6", count: 35 },
                { day: "T7", count: 22 },
                { day: "CN", count: 15 },
              ]}
              margin={{ top: 8, right: 16, bottom: 0, left: -16 }}
            >
              <XAxis
                dataKey="day"
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  fontSize: 13,
                }}
              />
              <Bar dataKey="count" fill="#ef4444" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </StaffShell>
  );
}
