import { useEffect, useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { useNewsList, useCreateNews, useUpdateNews, useDeleteNews } from "@/hooks/useNews";
import type { NewsResponse } from "@/lib/api";
import { sanitizeNewsHtml } from "@/lib/sanitizeHtml";
import { useAuth } from "@/lib/auth";
import {
  Plus,
  Edit2,
  Trash2,
  Image as ImageIcon,
  FileText,
  Search,
  Filter,
  Eye,
  Code,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { CreateNewsModal } from "./CreateNewsModal";

const API_BASE: string =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE) || "";

export function NewsManagement() {
  const { user } = useAuth();
  const [page, setPage] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<NewsResponse | null>(null);
  const [viewingNews, setViewingNews] = useState<NewsResponse | null>(null);

  // Debounce từ khóa tìm kiếm để tránh gọi API theo từng phím gõ
  useEffect(() => {
    const timer = setTimeout(() => {
      setKeyword(searchInput);
      setPage(0);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: newsData, isLoading } = useNewsList(
    page,
    10,
    selectedCategory || undefined,
    keyword || undefined,
  );
  
  // Debug logging
  useEffect(() => {
    console.log("[NewsManagement] newsData:", newsData);
    console.log("[NewsManagement] isLoading:", isLoading);
  }, [newsData, isLoading]);
  const createMutation = useCreateNews();
  const updateMutation = useUpdateNews();
  const deleteMutation = useDeleteNews();

  // Kéo về trang cuối còn dữ liệu khi trang hiện tại vượt quá tổng số trang
  // (ví dụ: xóa tin cuối cùng của trang cuối)
  useEffect(() => {
    if (newsData && page > 0 && page >= newsData.totalPages) {
      setPage(Math.max(0, newsData.totalPages - 1));
    }
  }, [newsData, page]);

  const isPolice = user?.role === "POLICE";
  const categories = useMemo(() => isPolice
    ? ["An ninh - Trật tự", "Thông báo"]
    : [
        "Thông báo",
        "Chính sách",
        "Hoạt động",
        "Hạ tầng - Đô thị",
        "Kinh tế - Xã hội",
        "An ninh - Trật tự",
        "Hướng dẫn",
        "Tin tức",
      ], [isPolice]);
  const handleOpenModal = (news?: NewsResponse) => {
    setEditingNews(news || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingNews(null);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bản tin này?")) {
      return;
    }
    
    try {
      await deleteMutation.mutateAsync(id);
      // Nếu trang hiện tại không còn dữ liệu sau khi xóa, quay về trang trước
      if (newsData && newsData.content.length === 1 && page > 0) {
        setPage(page - 1);
      }
    } catch (error) {
      console.error("Lỗi khi xóa tin tức:", error);
      alert("Không thể xóa tin tức. Vui lòng thử lại.");
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#E4EAF2] flex flex-col h-full min-h-[500px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 border-b border-[#E4EAF2] shrink-0">
        <div>
          <h2 className="text-xl font-extrabold text-[#0B2545]">Quản lý Tin tức</h2>
          <p className="text-sm text-slate-500 mt-1">
            Cập nhật và quản lý các thông báo, tin tức gửi đến người dân.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-[#0F5BD8] hover:bg-[#0B4FC4] text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm shadow-blue-500/20 active:scale-95"
        >
          <Plus size={18} />
          Thêm tin tức
        </button>
      </div>

      <div className="px-6 py-4 border-b border-[#E4EAF2] flex flex-col md:flex-row gap-4 shrink-0 bg-slate-50/50">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Tìm kiếm theo tiêu đề hoặc nội dung..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-[#E4EAF2] rounded-xl text-sm focus:border-[#0F5BD8] focus:ring-1 focus:ring-[#0F5BD8] outline-none transition-all placeholder:text-slate-400 bg-white"
          />
        </div>

        <div className="relative w-full md:w-[250px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Filter size={18} />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(0);
            }}
            className="w-full pl-10 pr-10 py-2 border border-[#E4EAF2] rounded-xl text-sm appearance-none focus:border-[#0F5BD8] focus:ring-1 focus:ring-[#0F5BD8] outline-none bg-white transition-all font-medium text-slate-700"
          >
            <option value="">Tất cả chuyên mục</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-3 py-12">
            <div className="w-8 h-8 border-4 border-[#0F5BD8] border-t-transparent rounded-full animate-spin"></div>
            <p className="font-medium text-sm">Đang tải dữ liệu...</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            <div className="overflow-x-auto rounded-xl border border-[#E4EAF2] bg-white">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-[#E4EAF2]">
                    <th className="p-4 font-bold text-slate-600 text-[13px] uppercase tracking-wider">
                      Tiêu đề & Tóm tắt
                    </th>
                    <th className="p-4 font-bold text-slate-600 text-[13px] uppercase tracking-wider w-[150px]">
                      Chuyên mục
                    </th>
                    <th className="p-4 font-bold text-slate-600 text-[13px] uppercase tracking-wider w-[120px]">
                      Lượt xem
                    </th>
                    <th className="p-4 font-bold text-slate-600 text-[13px] uppercase tracking-wider w-[150px]">
                      Ngày đăng
                    </th>
                    <th className="p-4 font-bold text-slate-600 text-[13px] uppercase tracking-wider w-[100px] text-center">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4EAF2]">
                  {newsData?.content.map((item) => (
                    <tr key={item.id} className="hover:bg-[#F8FAFD] transition-colors group">
                      <td className="p-4 flex gap-4 items-center">
                        {item.imageUrl ? (
                          <div className="w-16 h-12 rounded-lg overflow-hidden border border-slate-200 shrink-0 hidden sm:block">
                            <img
                              src={item.imageUrl}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-12 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0 hidden sm:flex text-slate-300">
                            <ImageIcon size={20} />
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-[#0B2545] line-clamp-1 mb-1 group-hover:text-[#0F5BD8] transition-colors">
                            {item.title}
                          </div>
                          <div className="text-xs text-slate-500 line-clamp-1">{item.summary}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${
                            item.category === "Thông báo"
                              ? "bg-amber-50 text-amber-600 border-amber-200"
                              : item.category === "An ninh - Trật tự"
                                ? "bg-red-50 text-red-600 border-red-200"
                                : "bg-[#EFF6FF] text-[#0F5BD8] border-[#BFDBFE]"
                          }`}
                        >
                          {item.category}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                          {item.views?.toLocaleString("vi-VN") || 0}
                        </span>
                      </td>
                      <td className="p-4 text-sm font-medium text-slate-600">
                        {item.createdAt
                          ? format(new Date(item.createdAt), "dd/MM/yyyy HH:mm", { locale: vi })
                          : ""}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setViewingNews(item)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Xem chi tiết tin tức"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => handleOpenModal(item)}
                            className="p-1.5 text-slate-400 hover:text-[#0F5BD8] hover:bg-blue-50 rounded-lg transition-colors"
                            title="Chỉnh sửa tin tức"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Xóa tin tức"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(!newsData?.content || newsData.content.length === 0) && (
                    <tr>
                      <td colSpan={5} className="p-12 text-center">
                        <div className="flex flex-col items-center justify-center text-slate-400">
                          <FileText size={48} className="mb-3 opacity-20" />
                          <p className="font-medium">Chưa có bản tin nào.</p>
                          <p className="text-sm mt-1">
                            Hãy thử đổi từ khóa hoặc bấm "Thêm tin tức" để tạo bài viết mới.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {newsData && newsData.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 shrink-0">
                <span className="text-sm text-slate-500 font-medium">
                  Hiển thị trang <span className="font-bold text-slate-700">{page + 1}</span> /{" "}
                  {newsData.totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={page === 0}
                    onClick={() => setPage((p) => p - 1)}
                    className="px-4 py-2 border border-[#E4EAF2] rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Trang trước
                  </button>
                  <button
                    disabled={page >= newsData.totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-4 py-2 border border-[#E4EAF2] rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Trang sau
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <CreateNewsModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        editingNews={editingNews} 
        categories={categories} 
      />

      {viewingNews && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-[#E4EAF2] flex items-center justify-between shrink-0 bg-slate-50 rounded-t-2xl">
              <div>
                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-[#EFF6FF] text-[#0F5BD8] mb-1">
                  {viewingNews.category}
                </span>
                <h3 className="text-lg font-extrabold text-[#0B2545] line-clamp-1">
                  {viewingNews.title}
                </h3>
              </div>
              <button
                onClick={() => setViewingNews(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              <div className="bg-white max-w-2xl mx-auto">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-slate-500 text-xs font-semibold mb-6 pb-4 border-b border-slate-100">
                  <span className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-700">Tác giả:</span>{" "}
                    {viewingNews.authorName || "Ban quản trị"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-700">Ngày đăng:</span>{" "}
                    {viewingNews.createdAt
                      ? format(new Date(viewingNews.createdAt), "dd/MM/yyyy HH:mm", { locale: vi })
                      : ""}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-700">Lượt xem:</span>{" "}
                    {viewingNews.views?.toLocaleString("vi-VN") || 0}
                  </span>
                </div>

                {viewingNews.summary && (
                  <p className="text-slate-600 font-semibold mb-6 text-[15px] border-l-4 border-indigo-500 pl-4 leading-relaxed bg-slate-50 py-3 pr-3 rounded-r-xl">
                    {viewingNews.summary}
                  </p>
                )}

                {viewingNews.imageUrl && (
                  <div className="w-full aspect-video rounded-xl overflow-hidden mb-8 border border-slate-100 shadow-sm">
                    <img
                      src={viewingNews.imageUrl}
                      alt={viewingNews.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div
                  className="prose prose-slate prose-indigo max-w-none prose-img:rounded-xl prose-headings:text-[#0B2545] prose-a:text-[#0F5BD8] text-[15px] leading-relaxed text-slate-700"
                  dangerouslySetInnerHTML={{
                    __html: viewingNews.content
                      ? sanitizeNewsHtml(viewingNews.content)
                      : "<p class='text-slate-400 italic'>Không có nội dung chi tiết bài viết.</p>",
                  }}
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[#E4EAF2] flex justify-end shrink-0 bg-slate-50 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setViewingNews(null)}
                className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all active:scale-95 shadow-sm min-w-[100px]"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
