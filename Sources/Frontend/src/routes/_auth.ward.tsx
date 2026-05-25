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
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useFeedbacks } from "@/lib/hooks";
import { reports as mockReports, type ReportStatus } from "@/lib/mock-data";
import { StatusBadge } from "@/components/site/StatusBadge";
import { StaffShell } from "@/components/site/StaffShell";
import { Role } from "@/lib/roles";
import danangMap from "@/assets/danang-map.jpg";
import { Check, MapPin, MessageSquare, X } from "lucide-react";

export const Route = createFileRoute("/_auth/ward")({
  beforeLoad: ({ context }) => {
    // context.currentUser is set by _auth.tsx layout — always present here
    const { currentUser } = context as { currentUser: { name: string; role: string; org: string } };

    // SECURITY: Narrow check — only WARD_STAFF may access this route
    if (currentUser.role !== Role.WARD_STAFF) {
      throw redirect({ to: "/login", search: { error: "forbidden" } });
    }
  },
  head: () => ({
    meta: [
      { title: "Cổng cán bộ phường — UBND Hải Châu I" },
      { name: "description", content: "Bảng điều khiển dành cho cán bộ phường: tiếp nhận, xử lý, hoàn thành phản ánh." },
      // SECURITY: Prevent indexing of staff portals
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: WardDashboard,
});

function mapStatus(s: string): ReportStatus {
  const m: Record<string, ReportStatus> = {
    PENDING: "pending", ASSIGNED: "inProgress", IN_PROGRESS: "inProgress",
    WAITING_INFO: "pending", RESOLVED: "resolved", REJECTED: "urgent",
  };
  return m[s] || "pending";
}

import type { FeedbackResponse } from "@/lib/api";

function WardDashboard() {
  const { t, locale } = useI18n();
  const { data: feedbacksPage, isLoading, isFetching, refetch } = useFeedbacks(0, 50);

  const [selectedId, setSelectedId] = useState<string | number | null>(null);

  const hasApiData = !!feedbacksPage && feedbacksPage.content.length > 0;
  const apiFeedbacks = feedbacksPage?.content ?? [];

  // Auto-select first item when data loads
  useEffect(() => {
    if (selectedId !== null) return;
    if (hasApiData && apiFeedbacks.length > 0) {
      setSelectedId(apiFeedbacks[0].id);
    } else if (!hasApiData && mockReports.length > 0) {
      setSelectedId(mockReports[0].id);
    }
  }, [hasApiData, apiFeedbacks, selectedId]);

  const selected = hasApiData
    ? apiFeedbacks.find((r) => r.id === selectedId)
    : mockReports.find((r) => r.id === selectedId);

  return (
    <StaffShell
      accent="blue"
      eyebrow={locale === "vi" ? "Cổng cán bộ phường" : "Ward officer portal"}
      title={t("ward.title")}
      org="UBND Phường Hải Châu I · Quận Hải Châu"
    >
      <div className="flex flex-wrap items-end justify-end gap-2 mb-6">
        {["Hôm nay", "Tuần này", "Tháng này"].map((p, i) => (
          <button
            key={p}
            className={`min-h-[44px] px-4 rounded-md font-semibold text-sm border ${
              i === 0 ? "bg-gov-blue text-white border-gov-blue" : "bg-white border-slate-200"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-end justify-between gap-2 mb-6">
          <div className="flex gap-2">
            {["Hôm nay", "Tuần này", "Tháng này"].map((p, i) => (
              <button
                key={p}
                className={`min-h-[44px] px-4 rounded-md font-semibold text-sm border ${
                  i === 0 ? "bg-gov-blue text-white border-gov-blue" : "bg-white border-slate-200"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => refetch()} disabled={isFetching} className="btn-civic btn-civic-ghost flex items-center gap-2">
              {isFetching ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              {locale === "vi" ? "Làm mới" : "Refresh"}
            </button>
          </div>
        </aside>
      </div>
    </StaffShell>
  );
}
