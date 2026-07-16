import { Search, X } from "lucide-react";
import trongdongImg from "@/assets/trongdong.png";

/**
 * Hero trang tin tức: nền họa tiết trống đồng Đông Sơn mờ + tiêu đề + ô tìm kiếm.
 */
export function NewsHero({
  searchInput,
  onSearchChange,
  onSubmit,
  onClear,
}: {
  searchInput: string;
  onSearchChange: (value: string) => void;
  onSubmit: () => void;
  onClear: () => void;
}) {
  return (
    <section
      aria-labelledby="news-page-title"
      className="relative overflow-hidden border-b border-[#E7ECF3] bg-gradient-to-r from-[#FBF9F3] via-[#F8F7F2] to-[#EFF3FA]"
    >
      {/* Nền trống đồng Đông Sơn (ảnh đã gồm cầu + sóng + hoa văn, tông be nhạt) */}
      <div
        aria-hidden
        className="absolute inset-0 bg-cover"
        style={{ backgroundImage: `url(${trongdongImg})`, backgroundPosition: "right top" }}
      />
      {/* Lớp phủ trắng nhẹ bên trái giữ tương phản cho chữ và ô tìm kiếm */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-white/75 via-white/25 to-transparent"
      />

      <div className="relative mx-auto max-w-[1360px] px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-[640px]">
          <h1
            id="news-page-title"
            className="font-sans text-[40px] font-bold leading-tight tracking-tight text-[#172B4D] md:text-[48px]"
          >
            Tin tức
          </h1>
          <p className="mt-3 max-w-[520px] text-[15px] leading-[1.6] text-[#64748B]">
            Cập nhật kịp thời các thông tin, hoạt động, chính sách và thông báo mới nhất từ chính
            quyền thành phố Đà Nẵng.
          </p>

          <form
            role="search"
            className="mt-7 flex max-w-[560px] gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              onSubmit();
            }}
          >
            <label className="relative flex h-[52px] flex-1 items-center rounded-xl border border-[#E7ECF3] bg-white shadow-[0_1px_3px_rgba(16,42,83,0.06)] transition focus-within:border-[#2F6BFF] focus-within:ring-2 focus-within:ring-[#2F6BFF]/15">
              <span className="sr-only">Tìm kiếm tin tức</span>
              <Search size={18} className="ml-4 shrink-0 text-[#94A3B8]" aria-hidden />
              <input
                type="search"
                value={searchInput}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Nhập từ khóa tìm kiếm tin tức..."
                className="h-full w-full bg-transparent px-3 text-sm font-medium text-[#172B4D] outline-none placeholder:text-[#94A3B8]"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={onClear}
                  aria-label="Xóa từ khóa"
                  className="mr-3 rounded-full p-1 text-[#94A3B8] transition-colors hover:text-[#0A4DA2]"
                >
                  <X size={15} aria-hidden />
                </button>
              )}
            </label>
            <button
              type="submit"
              aria-label="Tìm kiếm"
              className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-xl bg-[#0A4DA2] text-white shadow-sm transition-all duration-200 hover:bg-[#08408A] active:scale-95"
            >
              <Search size={19} aria-hidden />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
