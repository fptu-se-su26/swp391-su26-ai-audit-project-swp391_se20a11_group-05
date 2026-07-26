import { useEffect, useState } from "react";
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
import { toast } from "sonner";
import { compressImageIfNeeded } from "@/lib/imageCompression";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

const API_BASE: string =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE) || "";

export function NewsManagement() {
  const { user } = useAuth();
  const [page, setPage] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [isUploading, setIsUploading] = useState(false);
  const [viewingNews, setViewingNews] = useState<NewsResponse | null>(null);

  // Debounce từ khóa tìm kiếm để tránh gọi API theo từng phím gõ
  useEffect(() => {
    const timer = setTimeout(() => {
      setKeyword(searchInput);
      setPage(0);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const [formData, setFormData] = useState({
    title: "",
    summary: "",
    content: "",
    category: "",
    imageUrl: "",
  });

  const { data: newsData, isLoading } = useNewsList(
    page,
    10,
    selectedCategory || undefined,
    keyword || undefined,
  );
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
  const categories = isPolice
    ? ["An ninh - Trật tự", "Thông báo"]
    : [
        "Thông báo",
        "Chính sách",
        "Hoạt động",
        "Hạ tầng - Đô thị",
        "Kinh tế - Xã hội",
        "An ninh - Trật tự",
        "Khác",
        "Hướng dẫn",
        "Tin tức",
      ];

  const handleOpenModal = (news?: NewsResponse, tab: "edit" | "preview" = "edit") => {
    setActiveTab(tab);
    if (news) {
      setEditingId(news.id);
      setFormData({
        title: news.title,
        summary: news.summary || "",
        content: news.content,
        category: news.category,
        imageUrl: news.imageUrl || "",
      });
    } else {
      setEditingId(null);
      setFormData({
        title: "",
        summary: "",
        content: "",
        category: categories[0],
        imageUrl: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const MAX_IMAGE_SIZE_MB = 5;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset để chọn lại cùng một file vẫn kích hoạt onChange
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn tệp hình ảnh");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      toast.error(`Ảnh vượt quá dung lượng cho phép (${MAX_IMAGE_SIZE_MB}MB)`);
      return;
    }

    const token = localStorage.getItem("dn_jwt_token");
    const formDataObj = new FormData();
    const compressedFile = await compressImageIfNeeded(file);
    formDataObj.append("file", compressedFile);

    setIsUploading(true);
    try {
      const response = await fetch(`${API_BASE}/api/files/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataObj,
      });

      if (!response.ok) throw new Error("Upload failed");
      const data = await response.json();
      const fileUrl = data.data?.fileUrl || data.fileUrl;

      if (fileUrl) {
        setFormData((prev) => ({ ...prev, imageUrl: fileUrl }));
        toast.success("Upload ảnh thành công");
      } else {
        toast.error("Máy chủ không trả về đường dẫn ảnh");
      }
    } catch (error) {
      toast.error("Lỗi khi upload ảnh");
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  // Nội dung Quill coi là rỗng khi bỏ hết thẻ HTML không còn chữ nào
  // và cũng không nhúng ảnh/video
  const isContentEmpty = (html: string) =>
    !html || (html.replace(/<[^>]*>/g, "").trim() === "" && !/<(img|iframe|video)\b/i.test(html));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploading) {
      toast.error("Vui lòng chờ upload ảnh hoàn tất");
      return;
    }
    const payload = {
      ...formData,
      title: formData.title.trim(),
      summary: formData.summary.trim(),
    };
    if (!payload.title) {
      toast.error("Vui lòng nhập tiêu đề tin tức");
      return;
    }
    if (isContentEmpty(payload.content)) {
      toast.error("Vui lòng nhập nội dung chi tiết");
      return;
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload }, { onSuccess: handleCloseModal });
    } else {
      createMutation.mutate(payload, { onSuccess: handleCloseModal });
    }
  };

  const handleDelete = (id: number | string) => {
    if (confirm("Bạn có chắc chắn muốn xóa tin tức này?")) {
      deleteMutation.mutate(id);
    }
  };

  const quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link", "image"],
      ["clean"],
    ],
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
                            onClick={() => handleOpenModal(item, "edit")}
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-[#E4EAF2] flex items-center justify-between shrink-0 bg-slate-50 rounded-t-2xl">
              <div>
                <h3 className="text-lg font-extrabold text-[#0B2545]">
                  {editingId ? "Chỉnh sửa tin tức" : "Đăng tải tin tức mới"}
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Vui lòng điền đầy đủ các thông tin bắt buộc (*)
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="px-6 pt-4 border-b border-[#E4EAF2] flex gap-4 shrink-0">
              <button
                onClick={() => setActiveTab("edit")}
                className={`flex items-center gap-2 pb-3 font-bold text-sm border-b-2 transition-colors ${
                  activeTab === "edit"
                    ? "border-[#0F5BD8] text-[#0F5BD8]"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <Code size={16} />
                Soạn thảo
              </button>
              <button
                onClick={() => setActiveTab("preview")}
                className={`flex items-center gap-2 pb-3 font-bold text-sm border-b-2 transition-colors ${
                  activeTab === "preview"
                    ? "border-[#0F5BD8] text-[#0F5BD8]"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <Eye size={16} />
                Xem trước
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              {activeTab === "edit" ? (
                <form id="news-form" onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-[#0B2545] mb-1.5">
                      Tiêu đề tin tức <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                      className="w-full border border-[#E4EAF2] rounded-xl px-4 py-2.5 text-sm focus:border-[#0F5BD8] focus:ring-1 focus:ring-[#0F5BD8] outline-none transition-all placeholder:text-slate-400"
                      placeholder="Nhập tiêu đề rõ ràng, súc tích..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-slate-50 rounded-xl border border-slate-100">
                    <div>
                      <label className="block text-sm font-bold text-[#0B2545] mb-1.5">
                        Chuyên mục <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          required
                          value={formData.category}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, category: e.target.value }))
                          }
                          className="w-full border border-[#E4EAF2] rounded-xl px-4 py-2.5 text-sm appearance-none focus:border-[#0F5BD8] focus:ring-1 focus:ring-[#0F5BD8] outline-none bg-white transition-all font-medium text-slate-700"
                        >
                          {!formData.category && (
                            <option value="" disabled>
                              -- Chọn chuyên mục --
                            </option>
                          )}
                          {/* Giữ chuyên mục hiện tại của bài viết nếu nằm ngoài danh sách được phép (vd: Công an sửa tin cũ) */}
                          {formData.category && !categories.includes(formData.category) && (
                            <option value={formData.category}>{formData.category}</option>
                          )}
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

                    <div>
                      <label className="block text-sm font-bold text-[#0B2545] mb-1.5">
                        Ảnh đại diện
                      </label>
                      <div className="flex items-center gap-3">
                        <label
                          className={`bg-white border border-[#E4EAF2] text-[#0F5BD8] rounded-xl px-4 py-2.5 flex items-center justify-center gap-2 text-sm font-bold transition-all w-full md:w-auto shadow-sm ${
                            isUploading
                              ? "cursor-wait opacity-60"
                              : "cursor-pointer hover:bg-blue-50 hover:border-blue-200"
                          }`}
                        >
                          {isUploading ? (
                            <div className="w-4 h-4 border-2 border-[#0F5BD8]/30 border-t-[#0F5BD8] rounded-full animate-spin" />
                          ) : (
                            <ImageIcon size={18} />
                          )}
                          <span>{isUploading ? "Đang tải ảnh..." : "Tải ảnh lên"}</span>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            disabled={isUploading}
                            onChange={handleFileChange}
                          />
                        </label>
                        {formData.imageUrl && (
                          <div className="relative w-11 h-11 rounded-lg overflow-hidden border border-slate-200 shadow-sm shrink-0 group">
                            <img
                              src={formData.imageUrl}
                              alt="preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#0B2545] mb-1.5">
                      Tóm tắt ngắn <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={formData.summary}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, summary: e.target.value }))
                      }
                      className="w-full border border-[#E4EAF2] rounded-xl px-4 py-3 text-sm focus:border-[#0F5BD8] focus:ring-1 focus:ring-[#0F5BD8] outline-none transition-all placeholder:text-slate-400 resize-none"
                      placeholder="Nhập 1-2 câu tóm tắt nội dung chính để hiển thị trên danh sách..."
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="block text-sm font-bold text-[#0B2545] mb-1.5 flex justify-between items-end">
                      <span>
                        Nội dung chi tiết <span className="text-red-500">*</span>
                      </span>
                      <span className="text-xs font-normal text-slate-400">
                        Hỗ trợ định dạng Rich Text
                      </span>
                    </label>
                    <div className="border border-[#E4EAF2] rounded-xl overflow-hidden focus-within:border-[#0F5BD8] focus-within:ring-1 focus-within:ring-[#0F5BD8] transition-all bg-white min-h-[300px]">
                      <ReactQuill
                        theme="snow"
                        value={formData.content}
                        onChange={(content: string) =>
                          setFormData((prev) => ({ ...prev, content }))
                        }
                        modules={quillModules}
                        className="h-full border-none"
                        placeholder="Nhập nội dung bài viết phong phú tại đây..."
                      />
                    </div>
                  </div>
                </form>
              ) : (
                <div className="bg-white border border-[#E4EAF2] rounded-2xl p-6 md:p-10 shadow-sm max-w-3xl mx-auto">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#EFF6FF] text-[#0F5BD8] mb-4">
                    {formData.category || "Chuyên mục"}
                  </span>
                  <h1 className="text-2xl md:text-3xl font-extrabold text-[#0B2545] mb-4 leading-tight">
                    {formData.title || "Tiêu đề bài viết sẽ hiển thị ở đây"}
                  </h1>
                  <p className="text-slate-500 font-medium mb-6 text-lg border-l-4 border-[#E4EAF2] pl-4">
                    {formData.summary || "Tóm tắt bài viết sẽ hiển thị ở đây."}
                  </p>

                  {formData.imageUrl && (
                    <div className="w-full aspect-video rounded-xl overflow-hidden mb-8">
                      <img
                        src={formData.imageUrl}
                        alt="cover"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div
                    className="prose prose-slate prose-blue max-w-none prose-img:rounded-xl prose-headings:text-[#0B2545] prose-a:text-[#0F5BD8]"
                    dangerouslySetInnerHTML={{
                      __html: formData.content
                        ? sanitizeNewsHtml(formData.content)
                        : "<p class='text-slate-400 italic'>Nội dung bài viết sẽ hiển thị ở đây...</p>",
                    }}
                  />
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-[#E4EAF2] flex justify-end gap-3 shrink-0 bg-slate-50 rounded-b-2xl">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-5 py-2.5 border border-[#E4EAF2] bg-white rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-800 font-bold transition-colors"
              >
                Hủy bỏ
              </button>
              {activeTab === "edit" && (
                <button
                  type="submit"
                  form="news-form"
                  disabled={createMutation.isPending || updateMutation.isPending || isUploading}
                  className="px-6 py-2.5 bg-[#0F5BD8] hover:bg-[#0B4FC4] text-white rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center justify-center min-w-[120px]"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : editingId ? (
                    "Cập nhật"
                  ) : (
                    "Đăng tin tức"
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

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

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .ql-toolbar.ql-snow {
          border: none !important;
          border-bottom: 1px solid #E4EAF2 !important;
          background-color: #F8FAFD;
          border-radius: 0.75rem 0.75rem 0 0;
          padding: 12px !important;
        }
        .ql-container.ql-snow {
          border: none !important;
          font-family: inherit !important;
          font-size: 0.875rem !important;
        }
        .ql-editor {
          min-height: 250px;
          padding: 1rem !important;
        }
      `,
        }}
      />
    </div>
  );
}
