import { useI18n } from "@/lib/i18n";
import type { ReportStatus } from "@/lib/mock-data";

const styles: Record<ReportStatus, string> = {
  pending: "bg-amber-100 text-amber-900",
  inProgress: "bg-amber-100 text-amber-900",
  resolved: "bg-green-100 text-green-900",
  urgent: "bg-red-100 text-red-900",
};
const labels: Record<ReportStatus, "status.pending" | "status.inProgress" | "status.resolved" | "status.urgent"> = {
  pending: "status.pending",
  inProgress: "status.inProgress",
  resolved: "status.resolved",
  urgent: "status.urgent",
};

export function StatusBadge({ status }: { status: ReportStatus }) {
  const { t } = useI18n();
  return (
    <span className={`px-3 py-1 text-xs font-bold rounded uppercase tracking-wide ${styles[status]}`}>
      {t(labels[status])}
    </span>
  );
}
