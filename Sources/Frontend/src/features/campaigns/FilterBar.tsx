import { RotateCcw, Search } from "lucide-react";

export interface CampaignFilters {
  keyword: string;
  category: string;
  ward: string;
  status: string;
  time: string;
}

export const DEFAULT_FILTERS: CampaignFilters = {
  keyword: "",
  category: "all",
  ward: "all",
  status: "all",
  time: "all",
};

export interface FilterOption {
  value: string;
  label: string;
}

const inputClass =
  "h-11 w-full rounded-lg border border-[#E6ECF5] bg-white px-3 text-sm text-[#182230] outline-none transition focus:border-[#2E6AE6] focus:ring-2 focus:ring-[#2E6AE6]/15";

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-[#64748B]">{label}</span>
      {children}
    </div>
  );
}

export function FilterBar({
  filters,
  categoryOptions,
  wardOptions,
  statusOptions,
  timeOptions,
  onChange,
  onReset,
  onSubmit,
}: {
  filters: CampaignFilters;
  categoryOptions: FilterOption[];
  wardOptions: FilterOption[];
  statusOptions: FilterOption[];
  timeOptions: FilterOption[];
  onChange: (next: Partial<CampaignFilters>) => void;
  onReset: () => void;
  onSubmit?: () => void;
}) {
  const selects: {
    key: keyof CampaignFilters;
    label: string;
    options: FilterOption[];
  }[] = [
    { key: "category", label: "Lĩnh vực", options: categoryOptions },
    { key: "ward", label: "Địa phương", options: wardOptions },
    { key: "status", label: "Trạng thái", options: statusOptions },
    { key: "time", label: "Thời gian", options: timeOptions },
  ];

  return (
    <form
      role="search"
      aria-label="Bộ lọc chiến dịch"
      className="rounded-[16px] border border-[#E6ECF5] bg-white p-5 shadow-[0_1px_3px_rgba(16,42,83,0.06)] md:p-6"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit?.();
      }}
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(220px,1.4fr)_repeat(4,minmax(150px,1fr))_auto] lg:items-end">
        <FilterField label="Tìm kiếm">
          <label className="relative block">
            <span className="sr-only">Tìm kiếm chiến dịch</span>
            <Search
              size={17}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]"
              aria-hidden
            />
            <input
              type="search"
              value={filters.keyword}
              onChange={(event) => onChange({ keyword: event.target.value })}
              placeholder="Nhập tên chiến dịch, từ khóa..."
              className={`${inputClass} pl-10`}
            />
          </label>
        </FilterField>

        {selects.map((select) => (
          <FilterField key={select.key} label={select.label}>
            <select
              aria-label={select.label}
              value={filters[select.key]}
              onChange={(event) => onChange({ [select.key]: event.target.value })}
              className={inputClass}
            >
              {select.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FilterField>
        ))}

        <div className="flex gap-3">
          <button
            type="submit"
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#0A4DA2] px-5 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-[#08408A] focus-visible:outline-none"
          >
            <Search size={16} aria-hidden />
            Tìm kiếm
          </button>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-[#E6ECF5] bg-white px-4 text-sm font-semibold text-[#0A4DA2] transition-colors duration-200 hover:bg-[#F5F7FB]"
          >
            <RotateCcw size={15} aria-hidden />
            Đặt lại
          </button>
        </div>
      </div>
    </form>
  );
}
