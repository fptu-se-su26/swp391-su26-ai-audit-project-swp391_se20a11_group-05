import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useNewsList } from "@/hooks/useNews";
import { NewsHero } from "@/features/news/NewsHero";
import { CategoryFilter } from "@/features/news/CategoryFilter";
import { NewsCard } from "@/features/news/NewsCard";
import { NewsSidebar } from "@/features/news/NewsSidebar";

interface NewsSearchSchema {
  q?: string;
  category?: string;
  page?: number;
}

export const Route = createFileRoute("/tin-tuc/")({
  validateSearch: (search: Record<string, unknown>): NewsSearchSchema => ({
    q: typeof search.q === "string" ? search.q : undefined,
    category: typeof search.category === "string" ? search.category : undefined,
    page: typeof search.page === "number" ? search.page : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Tin tức & Thông báo — Đà Nẵng Kết Nối" },
      {
        name: "description",
        content:
          "Cập nhật các thông tin, hoạt động, chính sách và thông báo mới nhất từ chính quyền thành phố Đà Nẵng.",
      },
    ],
  }),
  component: NewsPage,
});

const ITEMS_PER_PAGE = 5;

function getPageItems(current: number, total: number): (number | "...")[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i);
  const items: (number | "...")[] = [0];
  if (current > 2) items.push("...");
  for (let i = Math.max(1, current - 1); i <= Math.min(total - 2, current + 1); i++) items.push(i);
  if (current < total - 3) items.push("...");
  items.push(total - 1);
  return items;
}

function NewsSkeleton() {
  return (
    <div className="space-y-8" aria-hidden>
      {[0, 1, 2].map((i) => (
        <div key={i} className={`grid animate-pulse gap-5 ${i === 0 ? "md:grid-cols-[340px_1fr]" : "md:grid-cols-[220px_1fr]"}`}>
          <div className={`rounded-xl bg-[#EEF2F8] ${i === 0 ? "aspect-[16/9]" : "aspect-[16/10] max-h-[150px]"}`} />
          <div className="space-y-3 py-1">
            <div className="h-5 w-24 rounded bg-[#EEF2F8]" />
            <div className="h-5 w-4/5 rounded bg-[#EEF2F8]" />
            <div className="h-4 w-3/5 rounded bg-[#EEF2F8]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function NewsPage() {
  const searchParams = useSearch({ from: "/tin-tuc/" });
  const navigate = useNavigate();

  const queryKeyword = searchParams.q || "";
  const queryCategory = searchParams.category || "Tất cả";
  const queryPage = searchParams.page || 1;

  const [searchInput, setSearchInput] = useState(queryKeyword);

  useEffect(() => {
    setSearchInput(queryKeyword);
  }, [queryKeyword]);

  const updateQueryParams = (updates: Partial<NewsSearchSchema>) => {
    void navigate({
      to: "/tin-tuc",
      search: (prev: NewsSearchSchema) => {
        const next = { ...prev, ...updates };
        if (next.q === "") delete next.q;
        if (next.category === "Tất cả") delete next.category;
        if (next.page === 1) delete next.page;
        return next;
      },
    });
  };

  const handleCategoryChange = (category: string) => {
    updateQueryParams({ category, page: 1 });
    document.getElementById("news-list")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const goToPage = (page: number) => {
    updateQueryParams({ page });
    document.getElementById("news-list")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const { data: newsData, isLoading } = useNewsList(
    queryPage - 1, // API đánh số trang từ 0
    ITEMS_PER_PAGE,
    queryCategory,
    queryKeyword,
  );
  const news = newsData?.content || [];
  const totalPages = newsData?.totalPages || 1;
  const [featured, ...secondary] = news;

  // Tin nổi bật: lấy 20 tin gần nhất (mọi danh mục) rồi xếp theo lượt xem
  const { data: topNewsData } = useNewsList(0, 20, "Tất cả", "");
  const topNews = useMemo(
    () =>
      [...(topNewsData?.content ?? [])]
        .sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
        .slice(0, 5),
    [topNewsData],
  );

  return (
    <div className="min-h-screen bg-[#F5F7FB] pb-16">
      <NewsHero
        searchInput={searchInput}
        onSearchChange={setSearchInput}
        onSubmit={() => updateQueryParams({ q: searchInput, page: 1 })}
        onClear={() => {
          setSearchInput("");
          updateQueryParams({ q: "", page: 1 });
        }}
      />

      <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8">
        <div id="news-list" className="scroll-mt-24 pt-6">
          <CategoryFilter value={queryCategory} onChange={handleCategoryChange} />
        </div>

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_340px]">
          {/* ── Cột trái: danh sách tin ── */}
          <main className="rounded-[18px] border border-[#E7ECF3] bg-white p-5 shadow-[0_1px_3px_rgba(16,42,83,0.06)] md:p-7">
            <div className="mb-6 flex items-center justify-between border-b border-[#E7ECF3] pb-4">
              <div className="flex items-center gap-2">
                <span aria-hidden className="h-5 w-1.5 rounded-sm bg-[#0A4DA2]" />
                <h2 className="font-sans text-base font-bold uppercase tracking-wide text-[#172B4D]">
                  Tin tức mới nhất
                </h2>
              </div>
              <span className="text-[13px] font-medium text-[#64748B]">
                {newsData?.totalElements ?? 0} tin tức
              </span>
            </div>

            {isLoading ? (
              <NewsSkeleton />
            ) : news.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="grid h-16 w-16 place-items-center rounded-full bg-[#F5F7FB] text-[#94A3B8]">
                  <Search size={24} aria-hidden />
                </div>
                <h3 className="font-sans mt-4 text-sm font-bold text-[#172B4D]">
                  Không tìm thấy tin tức phù hợp
                </h3>
                <p className="mt-1 max-w-[320px] text-[13px] leading-relaxed text-[#64748B]">
                  Vui lòng thử thay đổi từ khóa hoặc danh mục tìm kiếm của bạn.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#EEF2F8]">
                {featured && (
                  <div className="pb-6">
                    <NewsCard item={featured} variant="featured" />
                  </div>
                )}
                {secondary.map((item) => (
                  <div key={item.id} className="py-5 last:pb-0">
                    <NewsCard item={item} />
                  </div>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <nav
                aria-label="Phân trang tin tức"
                className="mt-8 flex items-center justify-center gap-1.5 border-t border-[#E7ECF3] pt-7"
              >
                <button
                  type="button"
                  disabled={queryPage === 1}
                  onClick={() => goToPage(queryPage - 1)}
                  aria-label="Trang trước"
                  className="grid h-10 w-10 place-items-center rounded-lg border border-[#E7ECF3] bg-white text-[#64748B] transition-colors hover:bg-[#F5F7FB] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white"
                >
                  <ChevronLeft size={16} aria-hidden />
                </button>
                {getPageItems(queryPage - 1, totalPages).map((item, i) =>
                  item === "..." ? (
                    <span key={`ellipsis-${i}`} className="px-1 text-sm text-[#64748B]">
                      ...
                    </span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      onClick={() => goToPage(item + 1)}
                      aria-current={item + 1 === queryPage ? "page" : undefined}
                      className={`grid h-10 w-10 place-items-center rounded-lg text-sm font-semibold transition-colors ${
                        item + 1 === queryPage
                          ? "bg-[#0A4DA2] text-white shadow-sm"
                          : "border border-[#E7ECF3] bg-white text-[#172B4D] hover:bg-[#F5F7FB]"
                      }`}
                    >
                      {item + 1}
                    </button>
                  ),
                )}
                <button
                  type="button"
                  disabled={queryPage === totalPages}
                  onClick={() => goToPage(queryPage + 1)}
                  className="inline-flex h-10 items-center gap-1 rounded-lg border border-[#E7ECF3] bg-white px-3.5 text-[13px] font-semibold text-[#172B4D] transition-colors hover:bg-[#F5F7FB] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white"
                >
                  Tiếp theo
                  <ChevronRight size={15} aria-hidden />
                </button>
              </nav>
            )}
          </main>

          <NewsSidebar topNews={topNews} onSelectCategory={handleCategoryChange} />
        </div>
      </div>
    </div>
  );
}
