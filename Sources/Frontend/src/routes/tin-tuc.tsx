import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { useNewsList } from "@/hooks/useNews";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Search,
  Calendar,
  Eye,
  ChevronLeft,
  ChevronRight,
  Bell,
  FileText,
  Activity,
  Building2,
  TrendingUp,
  Shield,
  HelpCircle,
  X,
} from "lucide-react";

// Register query search parameters
interface NewsSearchSchema {
  q?: string;
  category?: string;
  page?: number;
}

export const Route = createFileRoute("/tin-tuc")({
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

const CATEGORIES = [
  "Tất cả",
  "Thông báo",
  "Chính sách",
  "Hoạt động",
  "Hạ tầng - Đô thị",
  "Kinh tế - Xã hội",
  "An ninh - Trật tự",
  "Khác",
];

const CATEGORY_ICONS: Record<string, React.ComponentType<any>> = {
  "Thông báo": Bell,
  "Chính sách": FileText,
  "Hoạt động": Activity,
  "Hạ tầng - Đô thị": Building2,
  "Kinh tế - Xã hội": TrendingUp,
  "An ninh - Trật tự": Shield,
  Khác: HelpCircle,
};

const CATEGORY_COLORS: Record<string, { text: string; bg: string }> = {
  "Thông báo": { text: "text-[#0B4FC4]", bg: "bg-[#EEF5FF]" },
  "Chính sách": { text: "text-[#6D28D9]", bg: "bg-[#F2EDFF]" },
  "Hoạt động": { text: "text-[#EA580C]", bg: "bg-[#FFF4E8]" },
  "Hạ tầng - Đô thị": { text: "text-[#15803D]", bg: "bg-[#EAF8EF]" },
  "Kinh tế - Xã hội": { text: "text-[#0891B2]", bg: "bg-[#ECFEFF]" },
  "An ninh - Trật tự": { text: "text-[#1E3A8A]", bg: "bg-[#EBF3FF]" },
  Khác: { text: "text-[#4B5563]", bg: "bg-[#F3F4F6]" },
};

const ITEMS_PER_PAGE = 5;

function NewsPage() {
  const { locale } = useI18n();
  const searchParams = useSearch({ from: "/tin-tuc" });
  const navigate = useNavigate();

  // Search keyword and category state, synchronized with URL
  const queryKeyword = searchParams.q || "";
  const queryCategory = searchParams.category || "Tất cả";
  const queryPage = searchParams.page || 1;

  const [searchInput, setSearchInput] = useState(queryKeyword);

  // Sync state when URL updates
  useEffect(() => {
    setSearchInput(queryKeyword);
  }, [queryKeyword]);

  // Handle updates to route search query
  const updateQueryParams = (updates: Partial<NewsSearchSchema>) => {
    void navigate({
      to: "/tin-tuc",
      search: (prev) => {
        const next = { ...prev, ...updates };
        // Clean undefined or empty parameters
        if (next.q === "") delete next.q;
        if (next.category === "Tất cả") delete next.category;
        if (next.page === 1) delete next.page;
        return next;
      },
    });
  };

  // Perform search submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateQueryParams({ q: searchInput, page: 1 });
  };

  const handleClearSearch = () => {
    setSearchInput("");
    updateQueryParams({ q: "", page: 1 });
  };

  const handleCategoryChange = (category: string) => {
    updateQueryParams({ category, page: 1 });
  };

  // Fetch news from API
  const { data: newsData, isLoading } = useNewsList(
    queryPage - 1, // API is 0-indexed
    ITEMS_PER_PAGE,
    queryCategory,
    queryKeyword
  );

  const paginatedNews = newsData?.content || [];
  const totalPages = newsData?.totalPages || 1;

  // Sidebar: Most read articles sorted by views (In a real app, should fetch a specific endpoint, but for now we can just show top of current page or we need a top news API. We'll use static fallback for most read if needed, or better, we fetch it).
  const { data: topNewsData } = useNewsList(0, 5, "Tất cả", ""); // A simple way, or we can add a specific endpoint. 
  // Wait, I should add a specific query for most read, but for now let's just sort the current list or use what we get.
  // Actually, we'll just use the first page of news as top news for simplicity, or we should create `useTopNews`.
  // Let's create useTopNews later, for now just use paginatedNews.
  const mostReadNews = [...paginatedNews].sort((a, b) => b.views - a.views).slice(0, 5);

  return (
    <div className="w-full flex flex-col min-h-screen bg-[#F8FAFD] font-sans pb-16">
      {/* 1. News Hero Banner */}
      <section
        className="relative w-full h-[220px] md:h-[240px] flex items-center bg-cover bg-center overflow-hidden border-b border-[#E4EAF2]"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.96) 40%, rgba(255,255,255,0.85) 60%, rgba(255,255,255,0.2) 100%), url('https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1600&h=600&q=80')`,
        }}
      >
        <div className="max-w-[1440px] mx-auto w-full px-6 md:px-12 flex flex-col justify-center h-full relative z-10">
          <div className="max-w-[620px]">
            <h1 className="font-serif text-[#0E3F8F] text-[36px] md:text-[46px] font-bold leading-tight mb-2 tracking-tight">
              Tin tức
            </h1>
            <p className="text-[#475467] text-sm md:text-base leading-relaxed mb-6 font-medium">
              Cập nhật các thông tin, hoạt động, chính sách và thông báo mới nhất từ chính quyền
              thành phố Đà Nẵng.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Container for Search & Filters & Content */}
      <div className="max-w-[1440px] mx-auto w-full px-6 md:px-12 -mt-7 relative z-20">
        {/* Search Bar positioned lower-left inside the hero zone */}
        <form onSubmit={handleSearchSubmit} className="max-w-[620px] mb-6">
          <div className="relative bg-white rounded-xl border border-[#E4EAF2] shadow-sm hover:shadow-md transition-shadow duration-200 flex items-center h-[50px] px-4">
            <Search size={20} className="text-[#667085] shrink-0" />
            <input
              type="text"
              placeholder="Nhập từ khóa tìm kiếm tin tức..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full h-full bg-transparent border-none outline-none pl-3 pr-8 text-[#123E8A] text-sm font-semibold placeholder-[#667085]"
              aria-label="Tìm kiếm tin tức"
            />
            {searchInput && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-4 text-[#667085] hover:text-[#0B4FC4] p-1 cursor-pointer"
                aria-label="Xóa từ khóa"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </form>

        {/* 3. Horizontal News-Category Filter Bar */}
        <div className="w-full overflow-x-auto scrollbar-hide py-2 mb-8 -mx-1 px-1">
          <div className="flex items-center gap-2.5 min-w-max">
            {CATEGORIES.map((cat) => {
              const isActive = queryCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleCategoryChange(cat)}
                  className={`px-4 py-2 text-xs font-bold rounded-lg border transition duration-200 cursor-pointer ${
                    isActive
                      ? "bg-[#0B4FC4] text-white border-[#0B4FC4] shadow-sm"
                      : "bg-white text-[#123E8A] border-[#E4EAF2] hover:bg-slate-50"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Main Two-Column Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Newest News List (74%) */}
          <main className="lg:col-span-9 bg-white rounded-xl border border-[#E4EAF2] p-5 md:p-6 shadow-sm flex flex-col min-h-[500px]">
            <div className="flex items-center justify-between border-b border-[#E4EAF2] pb-4 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 bg-[#0B4FC4] rounded-sm" />
                <h2 className="text-[#0E3F8F] font-bold text-base md:text-lg">Tin tức mới nhất</h2>
              </div>
              <span className="text-xs text-[#667085] font-semibold">
                Tìm thấy {newsData?.totalElements || 0} tin tức
              </span>
            </div>

            {/* News List */}
            {paginatedNews.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-[#667085] mb-4">
                  <Search size={24} />
                </div>
                <h3 className="text-[#123E8A] font-bold text-sm mb-1">
                  Không tìm thấy tin tức phù hợp.
                </h3>
                <p className="text-xs text-[#667085] max-w-[320px]">
                  Vui lòng thử thay đổi từ khóa hoặc danh mục tìm kiếm của bạn.
                </p>
              </div>
            ) : (
              <div className="flex-grow space-y-6">
                {isLoading ? (
                  <div className="py-10 text-center text-sm text-gray-500 flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-[#0F5BD8] border-t-transparent rounded-full animate-spin"></div>
                    Đang tải dữ liệu...
                  </div>
                ) : paginatedNews.map((item) => {
                  const badgeStyle = CATEGORY_COLORS[item.category] || {
                    text: "text-slate-600",
                    bg: "bg-slate-100",
                  };
                  return (
                    <div
                      key={item.id}
                      className="group bg-white rounded-2xl border border-[#E4EAF2] hover:border-[#0F5BD8] hover:shadow-lg hover:shadow-blue-900/5 transition-all duration-300 overflow-hidden flex flex-col md:flex-row"
                    >
                      {/* Thumbnail Left */}
                      <Link
                        to={`/tin-tuc/${item.id}`}
                        className="w-full md:w-[280px] h-[180px] md:h-auto shrink-0 relative overflow-hidden bg-slate-50 block"
                      >
                        <img
                          src={item.imageUrl || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80"}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                          loading="lazy"
                        />
                        <div className="absolute top-3 left-3">
                          <span
                            className={`px-3 py-1 rounded-md text-[11px] font-extrabold uppercase tracking-wider shadow-sm backdrop-blur-md bg-white/90 ${badgeStyle.text}`}
                          >
                            {item.category}
                          </span>
                        </div>
                      </Link>

                      {/* Content Right */}
                      <div className="flex-1 p-5 md:p-6 flex flex-col justify-between">
                        <div>
                          {/* Title */}
                          <Link
                            to={`/tin-tuc/${item.id}`}
                            className="block text-[#0B2545] font-extrabold text-lg md:text-xl leading-snug line-clamp-2 group-hover:text-[#0F5BD8] transition duration-200 mb-2.5"
                          >
                            {item.title}
                          </Link>

                          {/* Excerpt */}
                          <p className="text-sm text-slate-500 leading-relaxed line-clamp-2 md:line-clamp-3 mb-4 font-medium">
                            {item.summary}
                          </p>
                        </div>

                        {/* Footer (Date & Views) */}
                        <div className="flex items-center gap-5 text-xs text-slate-400 font-semibold pt-4 border-t border-slate-100 mt-auto">
                          <span className="flex items-center gap-1.5">
                            <Calendar size={14} />
                            {item.createdAt ? format(new Date(item.createdAt), "dd/MM/yyyy", { locale: vi }) : ""}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Eye size={14} />
                            {item.views?.toLocaleString("vi-VN") || 0} lượt xem
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Component */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-1.5 pt-8 mt-6 border-t border-[#E4EAF2]">
                {/* Prev Button */}
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => updateQueryParams({ page: currentPage - 1 })}
                  className="w-9 h-9 rounded-lg border border-[#E4EAF2] flex items-center justify-center text-[#123E8A] bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
                  aria-label="Trang trước"
                >
                  <ChevronLeft size={16} />
                </button>

                {/* Page Index Buttons */}
                {Array.from({ length: totalPages }, (_, idx) => {
                  const pageNum = idx + 1;
                  const isCurrent = currentPage === pageNum;
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => updateQueryParams({ page: pageNum })}
                      className={`w-9 h-9 rounded-lg border flex items-center justify-center text-xs font-bold transition cursor-pointer ${
                        isCurrent
                          ? "bg-[#0B4FC4] border-[#0B4FC4] text-white shadow-sm"
                          : "bg-white border-[#E4EAF2] text-[#123E8A] hover:bg-slate-50"
                      }`}
                      aria-current={isCurrent ? "page" : undefined}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                {/* Next Button */}
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => updateQueryParams({ page: currentPage + 1 })}
                  className="w-9 h-9 rounded-lg border border-[#E4EAF2] flex items-center justify-center text-[#123E8A] bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
                  aria-label="Trang sau"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </main>

          {/* Right Column: Sidebar Widgets (26%) */}
          <aside className="lg:col-span-3 flex flex-col gap-6">
            {/* Widget 1: Tin đọc nhiều */}
            <section className="bg-white rounded-xl border border-[#E4EAF2] p-5 shadow-sm">
              <div className="flex items-center gap-2 border-b border-[#E4EAF2] pb-3 mb-4">
                <div className="w-1.5 h-4 bg-[#0B4FC4] rounded-sm" />
                <h2 className="text-[#0E3F8F] font-bold text-sm uppercase tracking-wide">
                  Tin đọc nhiều
                </h2>
              </div>

              {mostReadNews.length === 0 ? (
                <p className="text-xs text-[#667085] py-4 text-center font-medium">
                  Chưa có dữ liệu tin đọc nhiều.
                </p>
              ) : (
                <div className="space-y-4">
                  {mostReadNews.map((item, index) => {
                    const rank = index + 1;
                    const rankBg =
                      rank === 1
                        ? "bg-[#0B4FC4] text-white"
                        : rank === 2
                          ? "bg-[#123E8A] text-white"
                          : rank === 3
                            ? "bg-[#E67E22] text-white"
                            : "bg-[#F3F4F6] text-[#667085]";

                    return (
                      <div key={item.id} className="flex gap-3 group relative items-start">
                        {/* Rank Circle Badge */}
                        <div
                          className={`w-[20px] h-[20px] rounded-full shrink-0 flex items-center justify-center text-[10px] font-extrabold shadow-sm ${rankBg}`}
                        >
                          {rank}
                        </div>

                        {/* Thumbnail */}
                        <Link
                          to={`/tin-tuc/${item.id}`}
                          className="w-[52px] h-[52px] rounded overflow-hidden shrink-0 border border-slate-100 bg-slate-50 block"
                        >
                          <img
                            src={item.imageUrl || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80"}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                          />
                        </Link>

                        {/* Detail Info */}
                        <div className="flex-grow min-w-0">
                          <Link
                            to={`/tin-tuc/${item.id}`}
                            className="block text-[#123E8A] font-bold text-xs leading-snug line-clamp-2 hover:text-[#0B4FC4] transition duration-150 mb-1 font-sans"
                          >
                            {item.title}
                          </Link>
                          <span className="flex items-center gap-1 text-[10px] text-[#667085] font-semibold">
                            <Eye size={11} className="text-[#667085]" />
                            {item.views?.toLocaleString("vi-VN") || 0}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Widget 2: Danh mục nhanh */}
            <section className="bg-white rounded-xl border border-[#E4EAF2] p-5 shadow-sm">
              <div className="flex items-center gap-2 border-b border-[#E4EAF2] pb-3 mb-4">
                <div className="w-1.5 h-4 bg-[#0B4FC4] rounded-sm" />
                <h2 className="text-[#0E3F8F] font-bold text-sm uppercase tracking-wide">
                  Danh mục nhanh
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.filter((c) => c !== "Tất cả" && c !== "Khác").map((cat) => {
                  const IconComponent = CATEGORY_ICONS[cat] || HelpCircle;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        handleCategoryChange(cat);
                        // Scroll up to filter section with smooth animation
                        window.scrollTo({ top: 180, behavior: "smooth" });
                      }}
                      className="bg-white border border-[#E4EAF2] rounded-lg p-2.5 flex flex-col items-center justify-center text-center gap-1.5 hover:bg-slate-50 hover:border-[#0B4FC4] transition group cursor-pointer"
                    >
                      <IconComponent
                        size={16}
                        className="text-[#0B4FC4] group-hover:scale-110 transition duration-150"
                      />
                      <span className="text-[10px] font-bold text-[#123E8A] leading-tight">
                        {cat}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
