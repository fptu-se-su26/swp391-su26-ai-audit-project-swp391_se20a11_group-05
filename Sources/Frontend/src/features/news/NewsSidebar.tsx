import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { ArrowRight, CalendarDays } from "lucide-react";
import type { NewsResponse } from "@/lib/api";
import { CATEGORY_ICONS, NEWS_CATEGORIES, NEWS_FALLBACK_IMAGE } from "./newsCategories";

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-2 border-b border-[#E7ECF3] pb-3">
      <span aria-hidden className="h-4 w-1.5 rounded-sm bg-[#0A4DA2]" />
      <h2 className="font-sans text-sm font-bold uppercase tracking-wide text-[#172B4D]">
        {children}
      </h2>
    </div>
  );
}

const rankStyle = (rank: number) =>
  rank === 1 ? "bg-[#0A4DA2] text-white" : "bg-[#2F6BFF] text-white";

/**
 * Sidebar trang tin tức: Tin nổi bật (top 5 theo lượt xem) + Danh mục nhanh.
 */
export function NewsSidebar({
  topNews,
  onSelectCategory,
}: {
  topNews: NewsResponse[];
  onSelectCategory: (category: string) => void;
}) {
  return (
    <aside aria-label="Thông tin bổ sung" className="flex flex-col gap-6">
      <section className="rounded-[16px] border border-[#E7ECF3] bg-white p-5 shadow-[0_1px_3px_rgba(16,42,83,0.06)]">
        <SectionHeading>Tin nổi bật</SectionHeading>
        {topNews.length === 0 ? (
          <p className="py-4 text-center text-[13px] font-medium text-[#64748B]">
            Chưa có dữ liệu tin nổi bật.
          </p>
        ) : (
          <ol className="space-y-4">
            {topNews.map((item, index) => (
              <li key={item.id} className="group flex items-start gap-3">
                <span
                  aria-label={`Hạng ${index + 1}`}
                  className={`grid h-6 w-6 shrink-0 place-items-center rounded-md text-[11px] font-bold ${rankStyle(index + 1)}`}
                >
                  {index + 1}
                </span>
                <Link
                  to="/tin-tuc/$id"
                  params={{ id: String(item.id) }}
                  tabIndex={-1}
                  aria-hidden
                  className="block h-[52px] w-[68px] shrink-0 overflow-hidden rounded-lg border border-[#E7ECF3] bg-[#F5F7FB]"
                >
                  <img
                    src={item.imageUrl || NEWS_FALLBACK_IMAGE}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </Link>
                <div className="min-w-0">
                  <Link
                    to="/tin-tuc/$id"
                    params={{ id: String(item.id) }}
                    className="font-sans line-clamp-2 text-[13px] font-semibold leading-snug text-[#0A4DA2] transition-colors duration-150 hover:text-[#08326B] hover:underline"
                  >
                    {item.title}
                  </Link>
                  <span className="mt-1 flex items-center gap-1 text-[11px] font-medium text-[#64748B]">
                    <CalendarDays size={11} aria-hidden />
                    {item.createdAt ? format(new Date(item.createdAt), "dd/MM/yyyy") : ""}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="rounded-[16px] border border-[#E7ECF3] bg-white p-5 shadow-[0_1px_3px_rgba(16,42,83,0.06)]">
        <SectionHeading>Danh mục nhanh</SectionHeading>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {NEWS_CATEGORIES.filter((c) => c !== "Tất cả" && c !== "Khác").map((category) => {
            const Icon = CATEGORY_ICONS[category];
            return (
              <button
                key={category}
                type="button"
                onClick={() => onSelectCategory(category)}
                className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-[#E7ECF3] bg-white p-3 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-[#0A4DA2] hover:shadow-[0_4px_12px_rgba(16,42,83,0.08)]"
              >
                <Icon size={17} className="text-[#0A4DA2]" aria-hidden />
                <span className="text-[11px] font-semibold leading-tight text-[#172B4D]">
                  {category}
                </span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => onSelectCategory("Tất cả")}
          className="mt-4 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-[#D5E0F0] bg-white text-[13px] font-semibold text-[#0A4DA2] transition-colors duration-200 hover:bg-[#EDF3FC]"
        >
          Xem tất cả danh mục
          <ArrowRight size={14} aria-hidden />
        </button>
      </section>
    </aside>
  );
}
