import { NEWS_CATEGORIES } from "./newsCategories";

export function CategoryFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (category: string) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Lọc tin tức theo danh mục"
      className="scrollbar-hide -mx-1 overflow-x-auto px-1 py-1"
    >
      <div className="flex min-w-max items-center gap-2.5">
        {NEWS_CATEGORIES.map((category) => {
          const isActive = value === category;
          return (
            <button
              key={category}
              type="button"
              aria-pressed={isActive}
              onClick={() => onChange(category)}
              className={`rounded-lg border px-4 py-2 text-[13px] font-semibold transition-colors duration-200 ${
                isActive
                  ? "border-[#0A4DA2] bg-[#0A4DA2] text-white shadow-sm"
                  : "border-[#D5E0F0] bg-white text-[#172B4D] hover:border-[#0A4DA2] hover:text-[#0A4DA2]"
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>
    </div>
  );
}
