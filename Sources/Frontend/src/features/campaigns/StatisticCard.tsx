import type { LucideIcon } from "lucide-react";

export type StatisticTone = "blue" | "green" | "amber" | "indigo";

const toneStyles: Record<StatisticTone, { circle: string; icon: string }> = {
  blue: { circle: "bg-[#E8F0FC]", icon: "text-[#0A4DA2]" },
  green: { circle: "bg-[#E6F4EC]", icon: "text-[#2E9E57]" },
  amber: { circle: "bg-[#FDF3E0]", icon: "text-[#F4A100]" },
  indigo: { circle: "bg-[#ECEFFC]", icon: "text-[#2E6AE6]" },
};

export function StatisticCard({
  icon: Icon,
  value,
  label,
  tone = "blue",
}: {
  icon: LucideIcon;
  value: string | number;
  label: string;
  tone?: StatisticTone;
}) {
  const styles = toneStyles[tone];
  return (
    <div className="flex items-center gap-4 rounded-[16px] border border-[#E6ECF5] bg-white p-5 shadow-[0_1px_3px_rgba(16,42,83,0.06)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(16,42,83,0.10)]">
      <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${styles.circle}`}>
        <Icon size={22} className={styles.icon} aria-hidden />
      </div>
      <div>
        <p className="text-2xl font-bold leading-tight text-[#182230]">{value}</p>
        <p className="mt-0.5 text-sm font-medium text-[#64748B]">{label}</p>
      </div>
    </div>
  );
}
