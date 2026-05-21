import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { feedbackApi, type FeedbackResponse } from "@/lib/api";
import { StatusBadge } from "@/components/site/StatusBadge";
import { MapPin, RefreshCw, Loader2, LogIn } from "lucide-react";
import { reports as mockReports, type ReportStatus } from "@/lib/mock-data";

export const Route = createFileRoute("/my-reports/")(({
  head: () => ({
    meta: [
      { title: "Báo cáo của tôi — Đà Nẵng Lắng Nghe" },
      { name: "description", content: "Theo dõi tất cả phản ánh bạn đã gửi." },
    ],
  }),
  component: MyReports,
}));

/** Map backend status → màu StatusBadge */
function mapStatus(s: string): ReportStatus {
  const m: Record<string, ReportStatus> = {
    PENDING: "pending",
    ASSIGNED: "inProgress",
    IN_PROGRESS: "inProgress",
    WAITING_INFO: "pending",
    RESOLVED: "resolved",
    REJECTED: "urgent",
  };
  return m[s] || "pending";
}

function MyReports() {
  const { t, locale } = useI18n();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [apiFeedbacks, setApiFeedbacks] = useState<FeedbackResponse[]>([]);
  const [apiLoaded, setApiLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadFeedbacks();
  }, []);

  const loadFeedbacks = async () => {
    setLoading(true);
    try {
      const data = await feedbackApi.getAll();
      setApiFeedbacks(data);
      setApiLoaded(true);
    } catch {
      setApiLoaded(false);
    } finally {
      setLoading(false);
    }
  };

  // Nếu chưa đăng nhập → hiện thông báo
  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <LogIn size={48} className="mx-auto mb-4 text-gov-blue" />
        <h1 className="font-heading text-3xl text-gov-blue mb-3">
          {locale === "vi" ? "Vui lòng đăng nhập" : "Please log in"}
        </h1>
        <p className="text-ink-soft mb-6">
          {locale === "vi"
            ? "Bạn cần đăng nhập để xem các phản ánh của mình."
            : "You need to log in to view your reports."}
        </p>
        <Link to={"/login" as any} className="btn-civic btn-civic-primary">
          {locale === "vi" ? "Đăng nhập ngay" : "Log in"}
        </Link>
      </div>
    );
  }

  // Dữ liệu hiển thị: API nếu có, fallback mock
  const displayItems = apiLoaded ? apiFeedbacks : mockReports;
  const isUsingMock = !apiLoaded;

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-10 md:py-14">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-4xl md:text-5xl text-gov-blue mb-2">{t("my.title")}</h1>
          <p className="text-lg text-ink-soft">{t("my.subtitle")}</p>
          {user && (
            <p className="text-sm text-ink-soft mt-1">
              👤 {user.name} · {locale === "vi" ? "Đang hiển thị phản ánh của bạn" : "Showing your reports"}
            </p>
          )}
        </div>
        <button
          onClick={loadFeedbacks}
          disabled={loading}
          className="btn-civic btn-civic-ghost flex items-center gap-2 min-h-[44px]"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
          {locale === "vi" ? "Làm mới" : "Refresh"}
        </button>
      </div>

      {/* Trạng thái kết nối */}
      {isUsingMock && (
        <div className="mb-6 px-4 py-3 rounded-xl border border-amber-300 bg-amber-50 text-amber-800 text-sm flex items-center gap-2">
          ⚠️ {locale === "vi"
            ? "Đang hiển thị dữ liệu demo — chưa kết nối Backend."
            : "Showing demo data — Backend not connected."}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={40} className="animate-spin text-gov-blue" />
        </div>
      )}

      {!loading && displayItems.length === 0 && (
        <div className="text-center py-20">
          <p className="text-ink-soft text-lg mb-4">
            {locale === "vi" ? "Chưa có phản ánh nào." : "No reports yet."}
          </p>
          <Link to="/report" className="btn-civic btn-civic-primary">
            {locale === "vi" ? "Gửi phản ánh đầu tiên" : "Submit your first report"}
          </Link>
        </div>
      )}

      <div className="space-y-4">
        {!loading && apiLoaded && apiFeedbacks.map((r) => (
          <div
            key={r.id}
            className="card-civic p-5 md:p-6 flex flex-col sm:flex-row gap-5"
          >
            <div className="flex-1">
              <div className="flex flex-wrap items-start gap-2 mb-2">
                <StatusBadge status={mapStatus(r.status)} />
                <span className="text-ink-soft text-sm ml-auto font-mono">{r.trackingCode}</span>
              </div>
              <h2 className="text-xl font-bold text-ink font-sans mb-1">{r.title}</h2>
              <p className="text-ink-soft mb-3 line-clamp-2">{r.description}</p>
              <div className="flex flex-wrap gap-4 text-sm text-ink-soft">
                {r.addressDetails && (
                  <span className="flex items-center gap-1.5">
                    <MapPin size={16} /> {r.addressDetails}
                  </span>
                )}
                <span className="text-xs text-ink-soft">{r.createdAt?.slice(0, 10)}</span>
              </div>
            </div>
          </div>
        ))}

        {/* Fallback mock items khi chưa kết nối */}
        {!loading && !apiLoaded && mockReports.map((r) => (
          <Link
            key={r.id}
            to="/my-reports/$id"
            params={{ id: r.id }}
            className="card-civic p-5 md:p-6 flex flex-col sm:flex-row gap-5 hover:shadow-md transition-shadow"
          >
            <img
              src={r.image}
              alt={r.title[locale]}
              loading="lazy"
              width={400}
              height={400}
              className="w-full sm:w-40 h-40 object-cover rounded-lg"
            />
            <div className="flex-1">
              <div className="flex flex-wrap items-start gap-2 mb-2">
                <StatusBadge status={r.status} />
                <span className="text-ink-soft text-sm ml-auto">{r.createdAt}</span>
              </div>
              <h2 className="text-xl font-bold text-ink font-sans mb-1">{r.title[locale]}</h2>
              <p className="text-ink-soft mb-3 line-clamp-2">{r.description[locale]}</p>
              <div className="flex flex-wrap gap-4 text-sm text-ink-soft">
                <span className="flex items-center gap-1.5"><MapPin size={16} /> {r.address[locale]}</span>
                <span className="font-mono text-xs">{r.id}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
