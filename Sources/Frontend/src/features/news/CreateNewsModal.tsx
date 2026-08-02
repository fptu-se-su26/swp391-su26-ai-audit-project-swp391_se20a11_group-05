import React, { useState, useEffect } from "react";
import { useCreateNews, useUpdateNews } from "@/hooks/useNews";
import { API_BASE, getToken, type NewsResponse } from "@/lib/api";
import { sanitizeNewsHtml } from "@/lib/sanitizeHtml";
import { compressImageIfNeeded } from "@/lib/imageCompression";
import { toast } from "sonner";
import {
  FileText,
  X,
  Image as ImageIcon,
  Upload,
  Paperclip,
  CheckCircle,
  LayoutTemplate,
  ChevronDown
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

const TEMPLATES = [
  {
    id: "thong_bao",
    name: "Thông báo kết luận cuộc họp",
    content: `<p style="text-align: center;"><strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong></p><p style="text-align: center;"><strong>Độc lập - Tự do - Hạnh phúc</strong></p><p style="text-align: center;">---------------</p><p style="text-align: center;"><strong>[TÊN CƠ QUAN CHỦ QUẢN] - [TÊN CƠ QUAN BAN HÀNH]</strong></p><p style="text-align: center;">Số: .... /TB-UBND</p><p style="text-align: right;"><em>....., ngày ... tháng ... năm 20...</em></p><h2 style="text-align: center;"><strong>THÔNG BÁO</strong></h2><h3 style="text-align: center;"><strong>Kết luận của đồng chí Chủ tịch UBND tại cuộc họp...</strong></h3><p>Ngày [Ngày], tại Phòng họp số [X], đồng chí Chủ tịch UBND đã chủ trì cuộc họp về việc [Chủ đề]. Tham dự cuộc họp có đại diện lãnh đạo các đơn vị: [Danh sách].</p><p>Sau khi nghe báo cáo và ý kiến phát biểu của các đại biểu, đồng chí Chủ tịch UBND kết luận và chỉ đạo như sau:</p><p><strong>1. Đánh giá chung:</strong></p><p>[Nội dung đánh giá tình hình...]</p><p><strong>2. Nhiệm vụ trọng tâm trong thời gian tới:</strong></p><ul><li>Giao [Đơn vị 1]: Chủ trì, phối hợp với các cơ quan liên quan triển khai... Thời hạn hoàn thành trước ngày [Ngày].</li><li>Giao [Đơn vị 2]: Khẩn trương kiểm tra, rà soát và xử lý...</li></ul><p>Yêu cầu các cơ quan, đơn vị nghiêm túc triển khai thực hiện./.</p><p><br></p><p style="text-align: right;"><strong>TM. ỦY BAN NHÂN DÂN</strong></p><p style="text-align: right;"><strong>KT. CHỦ TỊCH / PHÓ CHỦ TỊCH</strong></p><p style="text-align: right;"><em>(Ký, đóng dấu và ghi rõ họ tên)</em></p><p style="text-align: right;"><strong>[Họ và tên]</strong></p><p><strong><em>Nơi nhận:</em></strong></p><p>- Như trên;</p><p>- Lưu: VT, ...</p><p><br></p>`
  },
  {
    id: "bao_cao",
    name: "Báo cáo xử lý phản ánh",
    content: `<p style="text-align: center;"><strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong></p><p style="text-align: center;"><strong>Độc lập - Tự do - Hạnh phúc</strong></p><p style="text-align: center;">---------------</p><p style="text-align: center;"><strong>ỦY BAN NHÂN DÂN THÀNH PHỐ...</strong></p><p style="text-align: center;">Số: .... /BC-UBND</p><p style="text-align: right;"><em>....., ngày ... tháng ... năm 20...</em></p><h2 style="text-align: center;"><strong>BÁO CÁO</strong></h2><h3 style="text-align: center;"><strong>Tình hình tiếp nhận và xử lý phản ánh, kiến nghị của người dân</strong></h3><p><strong>Kính gửi:</strong> UBND Thành phố / Lãnh đạo cấp trên...</p><p>Thực hiện ý kiến chỉ đạo tại văn bản số [Số văn bản] ngày [Ngày] về việc giải quyết phản ánh của người dân trên Cổng thông tin, [Tên đơn vị] báo cáo kết quả như sau:</p><p><strong>I. TÌNH HÌNH CHUNG:</strong></p><p>Từ ngày [Ngày] đến ngày [Ngày], đơn vị đã tiếp nhận tổng cộng [Số lượng] phản ánh. Trong đó:</p><ul><li>Lĩnh vực trật tự đô thị: [Số lượng] vụ việc.</li><li>Lĩnh vực vệ sinh môi trường: [Số lượng] vụ việc.</li><li>Lĩnh vực khác: [Số lượng] vụ việc.</li></ul><p><strong>II. KẾT QUẢ XỬ LÝ:</strong></p><p>1. Đã giải quyết dứt điểm: [Số lượng] vụ việc (đạt tỷ lệ [X]%).</p><p>2. Đang trong quá trình giải quyết: [Số lượng] vụ việc.</p><p>3. Các trường hợp điển hình đã xử lý:</p><ul><li>Phản ánh về việc lấn chiếm vỉa hè tại [Địa điểm]: Đã lập biên bản xử phạt.</li><li>Phản ánh về bãi rác tự phát tại [Địa điểm]: Đã thu gom và đặt biển cấm.</li></ul><p><strong>III. KIẾN NGHỊ, ĐỀ XUẤT:</strong></p><p>[Nêu các khó khăn, vướng mắc và kiến nghị...]</p><p>Trên đây là báo cáo kết quả xử lý phản ánh, [Tên đơn vị] trân trọng báo cáo./.</p><p><br></p><p style="text-align: right;"><strong>THỦ TRƯỞNG ĐƠN VỊ</strong></p><p style="text-align: right;"><em>(Ký, đóng dấu và ghi rõ họ tên)</em></p><p style="text-align: right;"><strong>[Họ và tên]</strong></p><p><strong><em>Nơi nhận:</em></strong></p><p>- Như trên;</p><p>- Lưu: VT, ...</p><p><br></p>`
  },
  {
    id: "cong_van",
    name: "Công văn chỉ đạo điều hành",
    content: `<p style="text-align: center;"><strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong></p><p style="text-align: center;"><strong>Độc lập - Tự do - Hạnh phúc</strong></p><p style="text-align: center;">---------------</p><p style="text-align: center;"><strong>ỦY BAN NHÂN DÂN THÀNH PHỐ...</strong></p><p style="text-align: center;">Số: .... /UBND-VP</p><p style="text-align: center;">V/v: [Trích yếu nội dung]</p><p style="text-align: right;"><em>....., ngày ... tháng ... năm 20...</em></p><p><strong>Kính gửi:</strong></p><ul><li>Thủ trưởng các Sở, ban, ngành;</li><li>Chủ tịch UBND các quận, huyện.</li></ul><p>Thực hiện [Căn cứ chỉ đạo], Ủy ban nhân dân Thành phố có ý kiến chỉ đạo như sau:</p><p><strong>1. Đối với [Đơn vị 1]:</strong></p><p>[Nội dung chỉ đạo cụ thể...]</p><p><strong>2. Đối với [Đơn vị 2]:</strong></p><p>[Nội dung chỉ đạo cụ thể...]</p><p>Yêu cầu Thủ trưởng các cơ quan, đơn vị khẩn trương tổ chức thực hiện và báo cáo kết quả về UBND Thành phố (qua Văn phòng UBND) trước ngày [Ngày]./.</p><p><br></p><p style="text-align: right;"><strong>TM. ỦY BAN NHÂN DÂN</strong></p><p style="text-align: right;"><strong>KT. CHỦ TỊCH / PHÓ CHỦ TỊCH</strong></p><p style="text-align: right;"><em>(Ký, đóng dấu và ghi rõ họ tên)</em></p><p style="text-align: right;"><strong>[Họ và tên]</strong></p><p><strong><em>Nơi nhận:</em></strong></p><p>- Như trên;</p><p>- Lưu: VT, ...</p><p><br></p>`
  },
  {
    id: "quyet_dinh",
    name: "Quyết định xử phạt hành chính",
    content: `<p style="text-align: center;"><strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong></p><p style="text-align: center;"><strong>Độc lập - Tự do - Hạnh phúc</strong></p><p style="text-align: center;">---------------</p><p style="text-align: center;"><strong>ỦY BAN NHÂN DÂN THÀNH PHỐ...</strong></p><p style="text-align: center;">Số: .... /QĐ-UBND</p><p style="text-align: right;"><em>....., ngày ... tháng ... năm 20...</em></p><h2 style="text-align: center;"><strong>QUYẾT ĐỊNH</strong></h2><h3 style="text-align: center;"><strong>Xử phạt vi phạm hành chính</strong></h3><p style="text-align: center;"><strong>CHỦ TỊCH ỦY BAN NHÂN DÂN THÀNH PHỐ</strong></p><p><em>Căn cứ Luật Tổ chức chính quyền địa phương ngày 19/6/2015;<br>Căn cứ Luật Xử lý vi phạm hành chính ngày 20/6/2012;<br>Căn cứ Biên bản vi phạm hành chính số [...] lập ngày [...];<br>Theo đề nghị của [Cơ quan tham mưu].</em></p><p style="text-align: center;"><strong>QUYẾT ĐỊNH:</strong></p><p><strong>Điều 1.</strong> Xử phạt vi phạm hành chính đối với:</p><p>- Ông/Bà (Tổ chức): [Tên người/Tổ chức vi phạm]</p><p>- Địa chỉ: [Địa chỉ]</p><p>- Đã có hành vi vi phạm: [Mô tả hành vi vi phạm].</p><p><strong>Điều 2.</strong> Hình thức xử phạt và biện pháp khắc phục hậu quả:</p><p>1. Phạt tiền: [Số tiền] đồng (Bằng chữ: ...).</p><p>2. Biện pháp khắc phục: Buộc khôi phục lại tình trạng ban đầu / Buộc tháo dỡ công trình vi phạm...</p><p><strong>Điều 3.</strong> Quyết định này có hiệu lực kể từ ngày ký. Ông/Bà [Tên] phải nghiêm chỉnh chấp hành Quyết định xử phạt này. Nếu quá thời hạn mà không tự nguyện chấp hành thì sẽ bị cưỡng chế thi hành theo quy định của pháp luật.</p><p><br></p><p style="text-align: right;"><strong>TM. ỦY BAN NHÂN DÂN</strong></p><p style="text-align: right;"><strong>CHỦ TỊCH</strong></p><p style="text-align: right;"><em>(Ký, đóng dấu và ghi rõ họ tên)</em></p><p style="text-align: right;"><strong>[Họ và tên]</strong></p><p><strong><em>Nơi nhận:</em></strong></p><p>- Như Điều 3;</p><p>- Kho bạc Nhà nước... (để thu tiền phạt);</p><p>- Lưu: VT, ...</p><p><br></p>`
  },
  {
    id: "giay_moi",
    name: "Giấy mời họp",
    content: `<p style="text-align: center;"><strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong></p><p style="text-align: center;"><strong>Độc lập - Tự do - Hạnh phúc</strong></p><p style="text-align: center;">---------------</p><p style="text-align: center;"><strong>ỦY BAN NHÂN DÂN THÀNH PHỐ...</strong></p><p style="text-align: center;">Số: .... /GM-UBND</p><p style="text-align: right;"><em>....., ngày ... tháng ... năm 20...</em></p><h2 style="text-align: center;"><strong>GIẤY MỜI</strong></h2><h3 style="text-align: center;"><strong>Họp về việc [Nội dung cuộc họp]</strong></h3><p>Ủy ban nhân dân Thành phố kính mời: <strong>[Tên Cơ quan/Đại biểu được mời]</strong></p><p>Tới dự cuộc họp về việc [Chủ đề cuộc họp].</p><p><strong>1. Chủ trì:</strong> Đồng chí [Họ tên, Chức vụ].</p><p><strong>2. Thời gian:</strong> [Giờ] ngày [Ngày] tháng [Tháng] năm 20[Năm].</p><p><strong>3. Địa điểm:</strong> Phòng họp số [X], Trụ sở UBND Thành phố.</p><p><strong>4. Thành phần tham dự:</strong></p><ul><li>Đại diện Lãnh đạo [Đơn vị 1];</li><li>Đại diện Lãnh đạo [Đơn vị 2];</li></ul><p><strong>5. Chuẩn bị tài liệu:</strong> Đề nghị [Đơn vị chuẩn bị] báo cáo và gửi tài liệu cho các đại biểu trước ngày họp.</p><p>Đề nghị các đại biểu sắp xếp thời gian tham dự đúng giờ./.</p><p><br></p><p style="text-align: right;"><strong>TL. CHỦ TỊCH</strong></p><p style="text-align: right;"><strong>CHÁNH VĂN PHÒNG</strong></p><p style="text-align: right;"><em>(Ký, đóng dấu và ghi rõ họ tên)</em></p><p style="text-align: right;"><strong>[Họ và tên]</strong></p><p><strong><em>Nơi nhận:</em></strong></p><p>- Như trên;</p><p>- Lưu: VT, ...</p><p><br></p>`
  },
  {
    id: "tin_tuc",
    name: "Tin tức sự kiện",
    content: `<p><strong>(Cổng TTĐT) - Sáng ngày [Ngày], tại [Địa điểm], UBND Thành phố đã long trọng tổ chức sự kiện [Tên sự kiện]. Tới dự có đồng chí [Tên đại biểu 1] - [Chức vụ 1] và đồng chí [Tên đại biểu 2] - [Chức vụ 2].</strong></p><p style="text-align: center;"><em>[Chèn Ảnh Sự Kiện Tại Đây]</em><br><em>(Quang cảnh sự kiện)</em></p><p>Phát biểu tại buổi lễ, đồng chí [Tên] nhấn mạnh tầm quan trọng của việc [Chủ đề sự kiện]. Trong thời gian qua, các cấp, các ngành đã nỗ lực thực hiện đồng bộ nhiều giải pháp và đạt được những kết quả đáng khích lệ...</p><p>Cũng tại sự kiện, Ban tổ chức đã tiến hành trao quyết định cho các tập thể, cá nhân có thành tích xuất sắc. Đại diện các đơn vị cũng đã cùng nhau ký kết biên bản ghi nhớ hợp tác nhằm thúc đẩy phong trào thi đua trong thời gian tới.</p><p>Sự kiện đã khép lại thành công tốt đẹp, thể hiện quyết tâm cao của Đảng bộ và chính quyền trong việc hoàn thành xuất sắc nhiệm vụ năm 20[xx]./.</p><p style="text-align: right;"><strong>Thực hiện: [Tên Tác giả]</strong></p><p><br></p>`
  }
];


interface CreateNewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingNews?: NewsResponse | null;
  categories: string[];
}

const QUILL_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ color: [] }, { background: [] }],
    ["blockquote"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ align: [] }],
    ["link", "image", "video"],
    ["clean"],
  ],
};

export function CreateNewsModal({
  isOpen,
  onClose,
  editingNews,
  categories,
}: CreateNewsModalProps) {
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [isUploading, setIsUploading] = useState(false);
  const [editorKey, setEditorKey] = useState(0);

  const [formData, setFormData] = useState({
    title: "",
    summary: "",
    content: "",
    category: "",
    imageUrl: "",
  });

  const createMutation = useCreateNews();
  const updateMutation = useUpdateNews();

  useEffect(() => {
    if (isOpen) {
      if (editingNews) {
        setFormData({
          title: editingNews.title,
          summary: editingNews.summary || "",
          content: editingNews.content,
          category: editingNews.category,
          imageUrl: editingNews.imageUrl || "",
        });
      } else {
        setFormData({
          title: "",
          summary: "",
          content: "",
          category: categories[0] || "",
          imageUrl: "",
        });
      }
      setActiveTab("edit");
    }
  }, [isOpen, editingNews, categories]);

  if (!isOpen) return null;

  const MAX_IMAGE_SIZE_MB = 5;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
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

    const token = getToken();
    const formDataObj = new FormData();
    const compressedFile = await compressImageIfNeeded(file);
    // Truyền rõ tên file gốc vào tham số thứ 3 để Backend Spring Boot có thể nhận diện được OriginalFilename
    formDataObj.append("file", compressedFile, file.name);

    setIsUploading(true);
    try {
      const response = await fetch(`${API_BASE}/api/files/upload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
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

  const isContentEmpty = (html: string) =>
    !html || (html.replace(/<[^>]*>/g, "").trim() === "" && !/<(img|iframe|video)\b/i.test(html));

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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

    if (editingNews?.id) {
      updateMutation.mutate({ id: editingNews.id, data: payload }, { onSuccess: onClose });
    } else {
      createMutation.mutate(payload, { onSuccess: onClose });
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 flex items-center justify-center z-[9999] p-6 animate-in fade-in duration-200 backdrop-blur-sm">
      <div className="bg-white rounded-[8px] shadow-sm w-full max-w-[1450px] flex flex-col h-[90vh] animate-in zoom-in-95 duration-200 border border-slate-200 overflow-hidden">
        
        {/* HEADER */}
        <div className="px-6 h-[72px] border-b border-[#E5E7EB] flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#EFF6FF] rounded flex items-center justify-center text-[#1E4ED8]">
              <FileText size={22} />
            </div>
            <div>
              <h2 className="text-[18px] font-bold text-[#111827] leading-tight font-sans tracking-tight uppercase">
                Đăng tải tin tức
              </h2>
              <p className="text-[13px] text-[#6B7280] mt-0.5 font-medium font-sans">
                Tạo bài viết mới cho Cổng thông tin phản ánh hiện trường
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* CONTENT TABS OR PREVIEW */}
        {activeTab === "preview" ? (
          <div className="flex-1 overflow-y-auto bg-slate-50 p-6 md:p-10 custom-scrollbar">
            <div className="max-w-[850px] mx-auto bg-white shadow-md border border-slate-200 rounded-xl p-8 md:p-14 mb-10">
              <button 
                onClick={() => setActiveTab("edit")}
                className="mb-8 flex items-center gap-2 text-sm font-semibold text-[#1E4ED8] hover:text-[#1e3a8a] transition-colors bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-full w-fit"
              >
                ← Quay lại chỉnh sửa
              </button>
              
              <div className="mb-6 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-3 text-[13px] font-semibold text-slate-500 mb-4">
                  <span className="uppercase text-[#1E4ED8] bg-blue-50 px-2.5 py-1 rounded-sm tracking-wide">{formData.category}</span>
                  <span>•</span>
                  <span>{format(new Date(), "EEEE, dd/MM/yyyy HH:mm", { locale: vi })}</span>
                </div>
                
                <h1 className="text-[28px] md:text-[34px] font-extrabold text-[#111827] leading-[1.35] font-sans tracking-tight">
                  {formData.title || "Tiêu đề bài viết sẽ hiển thị ở đây"}
                </h1>
              </div>
              
              {formData.summary && (
                <div className="mb-8 pl-4 border-l-4 border-[#1E4ED8] bg-[#F8FAFC] py-3 pr-4 rounded-r-md">
                  <p className="text-[16px] font-medium text-[#4B5563] leading-[1.7] italic">
                    {formData.summary}
                  </p>
                </div>
              )}

              {formData.imageUrl && (
                <div className="w-full mb-10 rounded-lg overflow-hidden border border-slate-100 shadow-sm">
                  <img
                    src={formData.imageUrl}
                    alt="cover"
                    className="w-full object-cover max-h-[450px]"
                  />
                  <p className="text-center text-sm text-slate-500 py-3 bg-slate-50 italic border-t border-slate-100">Ảnh minh họa</p>
                </div>
              )}

              <div
                className="prose prose-slate max-w-none prose-headings:text-[#111827] prose-headings:font-bold prose-a:text-[#1E4ED8] prose-p:leading-[1.7] prose-p:text-[#374151] prose-p:text-[16px] prose-img:mx-auto prose-img:rounded-md shadow-none break-words"
                dangerouslySetInnerHTML={{
                  __html: formData.content
                    ? sanitizeNewsHtml(formData.content)
                    : "<p class='text-slate-400 italic'>Nội dung bài viết sẽ hiển thị ở đây...</p>",
                }}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden bg-[#F8FAFC]">
            {/* TWO COLUMN LAYOUT */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              <div className="flex gap-[24px] max-w-[1400px] mx-auto">
                
                {/* LEFT COLUMN - 70% */}
                <div className="flex-[7] flex flex-col gap-6">
                  
                  {/* SECTION 1: NỘI DUNG BÀI VIẾT */}
                  <div className="bg-white border border-[#E5E7EB] rounded-[8px] p-6 shadow-sm">
                    <h3 className="text-[14px] font-bold text-[#111827] uppercase tracking-wider mb-6 pb-4 border-b border-[#E5E7EB] flex items-center gap-2">
                      <LayoutTemplate size={18} className="text-[#1E4ED8]" />
                      Nội dung bài viết
                    </h3>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="block text-[13px] font-bold text-[#374151] mb-2 uppercase tracking-wide">
                          Tiêu đề <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.title}
                          onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                          className="w-full border border-[#E5E7EB] rounded-[4px] px-4 py-3 text-[18px] font-bold text-[#111827] focus:border-[#1E4ED8] focus:ring-1 focus:ring-[#1E4ED8] outline-none transition-all placeholder:font-normal placeholder:text-slate-400"
                          placeholder="Nhập tiêu đề tin tức..."
                        />
                      </div>

                      <div>
                        <label className="block text-[13px] font-bold text-[#374151] mb-2 uppercase tracking-wide">
                          Tóm tắt ngắn (Sapo) <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          required
                          rows={3}
                          value={formData.summary}
                          onChange={(e) => setFormData((prev) => ({ ...prev, summary: e.target.value }))}
                          className="w-full border border-[#E5E7EB] rounded-[4px] px-4 py-3 text-[15px] text-[#374151] focus:border-[#1E4ED8] focus:ring-1 focus:ring-[#1E4ED8] outline-none transition-all placeholder:text-slate-400 resize-none font-medium"
                          placeholder="Nhập đoạn tóm tắt ngắn..."
                        />
                      </div>

                      <div className="flex flex-col">
                        <div className="flex justify-between items-end mb-2">
                          <label className="block text-[13px] font-bold text-[#374151] uppercase tracking-wide">
                            Nội dung chi tiết <span className="text-red-500">*</span>
                          </label>
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] font-medium text-slate-500 flex items-center">Chèn mẫu:</span>
                            <select 
                              onChange={(e) => {
                                const templateId = e.target.value;
                                console.log('[Template] Selected:', templateId);
                                if (!templateId) return;
                                const template = TEMPLATES.find(t => t.id === templateId);
                                if (template) {
                                  console.log('[Template] Found template, content length:', template.content.length);
                                  const newContent = formData.content ? formData.content + "<br><br>" + template.content : template.content;
                                  console.log('[Template] New content length:', newContent.length);
                                  setFormData(prev => ({
                                    ...prev,
                                    content: newContent
                                  }));
                                  setEditorKey(prev => {
                                    const newKey = prev + 1;
                                    console.log('[Template] New editor key:', newKey);
                                    return newKey;
                                  });
                                } else {
                                  console.log('[Template] Template not found!');
                                }
                                e.target.value = "";
                              }}
                              value=""
                              className="text-[13px] border border-[#E5E7EB] rounded-[4px] px-3 py-1.5 focus:border-[#1E4ED8] focus:ring-1 focus:ring-[#1E4ED8] outline-none bg-white text-[#374151] font-medium cursor-pointer shadow-sm hover:border-slate-300 transition-colors"
                            >
                              <option value="" disabled>-- Chọn mẫu văn bản --</option>
                              {TEMPLATES.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="bg-white overflow-hidden rounded-[4px] border border-[#E5E7EB]">
                          <textarea
                            key={editorKey}
                            value={formData.content}
                            onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                            className="w-full min-h-[450px] px-4 py-3 text-[14px] text-[#374151] focus:border-[#1E4ED8] focus:ring-1 focus:ring-[#1E4ED8] outline-none transition-all placeholder:text-slate-400 resize-y font-mono leading-relaxed"
                            placeholder="Soạn thảo nội dung (hỗ trợ HTML)..."
                          />
                          <div className="px-4 py-2 bg-slate-50 border-t border-[#E5E7EB] text-[11px] text-slate-500">
                            💡 Mẹo: Chọn mẫu văn bản ở dropdown trên để tự động chèn nội dung có sẵn
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* RIGHT COLUMN - 30% */}
                <div className="flex-[3] flex flex-col gap-6 pb-12">
                  
                  {/* 1. THÔNG TIN BÀI VIẾT */}
                  <div className="bg-white border border-[#E5E7EB] rounded-[8px] p-5 shadow-sm">
                    <h3 className="text-[13px] font-bold text-[#111827] uppercase tracking-wider mb-4 pb-3 border-b border-[#E5E7EB]">
                      Thông tin bài viết
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[12px] font-bold text-[#4B5563] mb-1.5">Chuyên mục chính</label>
                        <div className="relative">
                          <select
                            value={formData.category}
                            onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                            className="w-full border border-[#E5E7EB] rounded-[4px] px-3 py-2 text-[13px] appearance-none focus:border-[#1E4ED8] outline-none bg-white text-[#111827]"
                          >
                            {categories.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2. ẢNH ĐẠI DIỆN */}
                  <div className="bg-white border border-[#E5E7EB] rounded-[8px] p-5 shadow-sm">
                    <h3 className="text-[13px] font-bold text-[#111827] uppercase tracking-wider mb-4 pb-3 border-b border-[#E5E7EB]">
                      Ảnh đại diện
                    </h3>
                    
                    {formData.imageUrl ? (
                      <div className="relative group">
                        <div className="aspect-[16/9] w-full bg-slate-100 rounded border border-[#E5E7EB] overflow-hidden">
                          <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                          <label className="px-3 py-1.5 bg-white text-[#111827] text-[12px] font-bold rounded cursor-pointer hover:bg-slate-100">
                            Thay ảnh
                            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                          </label>
                          <button 
                            type="button" 
                            onClick={() => setFormData(p => ({ ...p, imageUrl: "" }))}
                            className="px-3 py-1.5 bg-red-600 text-white text-[12px] font-bold rounded hover:bg-red-700"
                          >
                            Xóa ảnh
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full aspect-[16/9] border-2 border-dashed border-[#E5E7EB] rounded bg-[#F8FAFC] cursor-pointer hover:bg-slate-50 transition-colors">
                        {isUploading ? (
                          <span className="text-[13px] font-semibold text-[#1E4ED8]">Đang tải lên...</span>
                        ) : (
                          <>
                            <Upload size={24} className="text-slate-400 mb-2" />
                            <span className="text-[13px] font-semibold text-[#374151]">Chọn ảnh đại diện (16:9)</span>
                            <span className="text-[11px] text-slate-500 mt-1">JPEG, PNG max 5MB</span>
                          </>
                        )}
                        <input type="file" className="hidden" accept="image/*" disabled={isUploading} onChange={handleFileChange} />
                      </label>
                    )}
                  </div>

                </div>
              </div>
            </div>
          </div>
        )}

        {/* BOTTOM STICKY TOOLBAR */}
        <div className="h-[72px] bg-white border-t border-[#E5E7EB] flex items-center justify-between px-6 shrink-0 shadow-[0_-2px_4px_rgba(0,0,0,0.02)] z-10">
          <div className="flex items-center gap-2 text-[13px] text-slate-500 font-medium">
            <CheckCircle size={16} className="text-emerald-600" />
            Đã lưu tự động lúc {format(new Date(), "HH:mm")}
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-5 py-2 border border-[#E5E7EB] bg-white rounded-[4px] text-[14px] font-bold text-[#374151] hover:bg-slate-50 shadow-sm transition-colors"
            >
              Hủy bỏ
            </button>
            <button 
              type="button"
              className="px-5 py-2 border border-[#E5E7EB] bg-white rounded-[4px] text-[14px] font-bold text-[#374151] hover:bg-slate-50 shadow-sm transition-colors"
            >
              Lưu bản nháp
            </button>
            
            {activeTab === "edit" ? (
              <button 
                type="button"
                onClick={() => setActiveTab("preview")}
                className="px-5 py-2 border border-[#E5E7EB] bg-white rounded-[4px] text-[14px] font-bold text-[#1E4ED8] hover:bg-blue-50 shadow-sm transition-colors"
              >
                Xem trước
              </button>
            ) : (
              <button 
                type="button"
                onClick={() => setActiveTab("edit")}
                className="px-5 py-2 border border-[#E5E7EB] bg-white rounded-[4px] text-[14px] font-bold text-[#1E4ED8] hover:bg-blue-50 shadow-sm transition-colors"
              >
                Tiếp tục chỉnh sửa
              </button>
            )}

            <button 
              type="button"
              onClick={() => handleSubmit()}
              disabled={createMutation.isPending || updateMutation.isPending || isUploading}
              className="px-6 py-2 bg-[#1E4ED8] hover:bg-[#1d40af] text-white rounded-[4px] text-[14px] font-bold shadow-sm transition-colors disabled:opacity-50 min-w-[120px] flex items-center justify-center gap-2"
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <Upload size={16} />
                  {editingNews ? "Cập nhật" : "Xuất bản"}
                </>
              )}
            </button>
          </div>
        </div>

      </div>
      
    </div>
  );
}
