import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { CalendarDays, Eye } from "lucide-react";
import type { NewsResponse } from "@/lib/api";
import { CATEGORY_COLORS, NEWS_FALLBACK_IMAGE } from "./newsCategories";

function CategoryBadge({ category }: { category: string }) {
  const style = CATEGORY_COLORS[category] ?? { text: "text-[#4B5563]", bg: "bg-[#F3F4F6]" };
  return (
    <span
      className={`inline-flex rounded-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${style.bg} ${style.text}`}
    >
      {category}
    </span>
  );
}

function NewsMeta({ item }: { item: NewsResponse }) {
  return (
    <div className="flex items-center gap-3 text-xs font-medium text-[#64748B]">
      <span className="inline-flex items-center gap-1.5 rounded-md border border-[#E7ECF3] bg-white px-2 py-1">
        <CalendarDays size={13} aria-hidden />
        <time dateTime={item.createdAt}>
          {item.createdAt ? format(new Date(item.createdAt), "dd/MM/yyyy") : ""}
        </time>
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-md border border-[#E7ECF3] bg-white px-2 py-1">
        <Eye size={13} aria-hidden />
        {(item.views ?? 0).toLocaleString("vi-VN")} lượt xem
      </span>
    </div>
  );
}

/**
 * Thẻ tin tức dùng chung — variant "featured" (tin đầu trang, ảnh lớn kèm tóm
 * tắt) và "row" (các tin còn lại, gọn hơn).
 */
export function NewsCard({
  item,
  variant = "row",
}: {
  item: NewsResponse;
  variant?: "featured" | "row";
}) {
  const image = item.imageUrl || NEWS_FALLBACK_IMAGE;
  const featured = variant === "featured";

  return (
    <article
      className={`group grid items-start gap-5 ${
        featured
          ? "md:grid-cols-[minmax(220px,270px)_1fr]"
          : "md:grid-cols-[minmax(160px,190px)_1fr]"
      }`}
    >
      <Link
        to="/tin-tuc/$id"
        params={{ id: String(item.id) }}
        tabIndex={-1}
        aria-hidden
        className={`block overflow-hidden rounded-xl border border-[#E7ECF3] bg-[#F5F7FB] ${
          featured ? "aspect-[16/10]" : "aspect-[16/10]"
        }`}
      >
        <img
          src={image}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </Link>

      <div className="flex flex-col gap-2">
        <div>
          <CategoryBadge category={item.category} />
        </div>
        <h3
          className={`font-sans font-bold leading-snug ${
            featured ? "text-lg md:text-xl" : "text-[15px] md:text-base"
          }`}
        >
          <Link
            to="/tin-tuc/$id"
            params={{ id: String(item.id) }}
            className="line-clamp-2 text-[#0A4DA2] transition-colors duration-200 hover:text-[#08326B] hover:underline"
          >
            {item.title}
          </Link>
        </h3>
        {featured && (
          <p className="line-clamp-2 text-sm leading-[1.6] text-[#64748B]">{item.summary}</p>
        )}
        <div className="pt-1">
          <NewsMeta item={item} />
        </div>
      </div>
    </article>
  );
}
