import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { feedbackApi, type FeedbackResponse } from "@/lib/api";
import { mapStatus } from "@/lib/status";
import {
  X,
  FileText,
  MapPin,
  Calendar,
  Clock,
  Eye,
  Flag,
  Copy,
  Download,
  Share2,
  MessageSquare,
  Expand,
  User,
  CheckCircle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface Props {
  feedbackId: number | null;
  onClose: () => void;
}

export function FeedbackDetailModal({ feedbackId, onClose }: Props) {
  const [activeImg, setActiveImg] = useState(0);

  const { data: fbFromApi, isLoading: isLoadingApi } = useQuery<FeedbackResponse>({
    queryKey: ["admin", "feedback", "detail", feedbackId],
    queryFn: () => feedbackApi.getById(feedbackId!),
    enabled: feedbackId !== null,
    staleTime: 30_000,
    retry: false,
  });

  const fb = useMemo(() => {
    if (feedbackId === null) return null;
    return fbFromApi ?? null;
  }, [feedbackId, fbFromApi]);

  const isLoading = isLoadingApi;

  if (feedbackId === null) return null;

  const attachments = fb?.attachments ?? [];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Đã sao chép ID phản ánh");
  };

  // Priority display helper for pills
  const getPriorityDisplay = (priority: string | undefined | null) => {
    switch (priority) {
      case "HIGH":
        return { text: "QUAN TRỌNG", color: "text-[#DC2626]", border: "border-[#DC2626]" };
      case "MEDIUM":
        return { text: "TRUNG BÌNH", color: "text-[#F59E0B]", border: "border-[#F59E0B]" };
      case "LOW":
        return { text: "THÔNG THƯỜNG", color: "text-[#16A34A]", border: "border-[#16A34A]" };
      default:
        return { text: "QUAN TRỌNG", color: "text-[#DC2626]", border: "border-[#DC2626]" }; // Default per mockup
    }
  };

  const statusDisplay = mapStatus(fb?.status || "PENDING").toUpperCase();

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 font-sans"
      style={{ backgroundColor: "rgba(18,24,38,0.45)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#FFFFFF] rounded-[16px] shadow-2xl w-full max-w-[1100px] max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* ======================================================
            HEADER & SECOND ROW (Fixed Top)
            ====================================================== */}
        <div className="shrink-0 px-8 pt-8 pb-6 border-b border-[#E5E7EB]">
          {/* Top Row */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-[#FAFAFA] border border-[#E5E7EB] flex items-center justify-center mt-1">
                <FileText size={20} className="text-[#1D4ED8]" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-[#111827]">
                  {isLoading ? <Skeleton className="h-8 w-48" /> : fb?.trackingCode || `#${feedbackId}`}
                </h2>
                <p className="text-sm font-medium text-[#6B7280] mt-1">Chi tiết phản ánh</p>
                
                {/* Second Row inside Header */}
                <div className="flex items-center gap-6 mt-6">
                  <div className="flex items-center gap-2 text-sm font-medium text-[#6B7280]">
                    <Calendar size={16} />
                    <span>Gửi lúc {fb?.createdAt ? new Date(fb?.createdAt).toLocaleString("vi-VN", { hour: '2-digit', minute:'2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : "—"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium text-[#6B7280]">
                    <Eye size={16} />
                    <span>159 lượt xem</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-6">
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center hover:bg-[#FAFAFA] rounded-md transition-colors"
              >
                <X size={24} className="text-[#6B7280]" />
              </button>
              
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-[#6B7280] mr-2">Trạng thái</span>
                <span className="px-3 py-1.5 rounded-full text-xs font-bold uppercase border border-[#F59E0B] text-[#F59E0B] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]"></span>
                  {statusDisplay}
                </span>
                <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase border flex items-center gap-1.5 ${getPriorityDisplay(fb?.priority).border} ${getPriorityDisplay(fb?.priority).color}`}>
                  <Flag size={12} />
                  {getPriorityDisplay(fb?.priority).text}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================
            BODY LAYOUT
            ====================================================== */}
        <div className="flex-1 overflow-y-auto bg-[#FAFAFA] p-8">
          {isLoading ? (
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 lg:col-span-8 space-y-6">
                <Skeleton className="h-[400px] w-full rounded-[12px]" />
                <Skeleton className="h-32 w-full rounded-md" />
              </div>
              <div className="col-span-12 lg:col-span-4 space-y-6">
                <Skeleton className="h-48 w-full rounded-md" />
                <Skeleton className="h-48 w-full rounded-md" />
                <Skeleton className="h-48 w-full rounded-md" />
              </div>
            </div>
          ) : !fb ? (
            <div className="p-12 text-center text-[#6B7280]">
              Không tìm thấy phản ánh
            </div>
          ) : (
            <div className="grid grid-cols-12 gap-6 max-w-[1336px] mx-auto">
              
              {/* ======================================================
                  LEFT COLUMN (65% = 8 cols)
                  ====================================================== */}
              <div className="col-span-12 lg:col-span-8 space-y-6">
                
                {/* Section 1: Hình ảnh đính kèm */}
                <div className="bg-[#FFFFFF] p-6 rounded-lg border border-[#E5E7EB]">
                  <h3 className="text-sm font-bold text-[#111827] uppercase mb-4">
                    HÌNH ẢNH ĐÍNH KÈM ({attachments.length})
                  </h3>
                  
                  {attachments.length > 0 ? (
                    <div className="space-y-4">
                      {/* Large Preview */}
                      <div className="relative aspect-video rounded-[12px] overflow-hidden bg-[#FAFAFA] border border-[#E5E7EB]">
                        <img
                          src={attachments[activeImg]?.fileUrl}
                          alt="Attachment preview"
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).onerror = null;
                            (e.target as HTMLImageElement).src = "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22100%25%22%20height%3D%22100%25%22%20viewBox%3D%220%200%20100%20100%22%20preserveAspectRatio%3D%22none%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20fill%3D%22%23F3F4F6%22%2F%3E%3Ctext%20x%3D%2250%22%20y%3D%2250%22%20font-family%3D%22sans-serif%22%20font-size%3D%2214%22%20font-weight%3D%22bold%22%20fill%3D%22%239CA3AF%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%3EL%E1%BB%97i%20t%E1%BA%A3i%20%E1%BA%A3nh%3C%2Ftext%3E%3C%2Fsvg%3E";
                          }}
                        />
                        <button
                          onClick={() => window.open(attachments[activeImg].fileUrl, "_blank")}
                          className="absolute top-4 right-4 w-10 h-10 bg-[#FFFFFF] rounded-md flex items-center justify-center border border-[#E5E7EB] hover:bg-[#FAFAFA] transition-colors shadow-sm"
                        >
                          <Expand size={20} className="text-[#111827]" />
                        </button>
                        <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-[#FFFFFF] text-[#111827] text-sm font-bold rounded-md border border-[#E5E7EB] shadow-sm">
                          {activeImg + 1} / {attachments.length}
                        </div>
                      </div>

                      {/* Thumbnails */}
                      {attachments.length > 1 && (
                        <div className="flex gap-3 overflow-x-auto">
                          {attachments.map((att, idx) => {
                            if (idx > 4) return null; // limit thumbnails
                            if (idx === 4 && attachments.length > 5) {
                              return (
                                <div key="more" className="w-[100px] h-[72px] rounded-md bg-[#FAFAFA] border border-[#E5E7EB] flex items-center justify-center text-[#111827] font-bold shrink-0">
                                  +{attachments.length - 4}
                                </div>
                              );
                            }
                            return (
                              <button
                                key={idx}
                                onClick={() => setActiveImg(idx)}
                                className={`w-[100px] h-[72px] rounded-md overflow-hidden shrink-0 border-2 transition-colors ${
                                  idx === activeImg ? "border-[#1D4ED8]" : "border-[#E5E7EB]"
                                }`}
                              >
                                <img 
                                  src={att.fileUrl} 
                                  alt="Thumbnail" 
                                  className="w-full h-full object-cover" 
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).onerror = null;
                                    (e.target as HTMLImageElement).src = "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22100%25%22%20height%3D%22100%25%22%20viewBox%3D%220%200%20100%20100%22%20preserveAspectRatio%3D%22none%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20fill%3D%22%23F3F4F6%22%2F%3E%3Ctext%20x%3D%2250%22%20y%3D%2250%22%20font-family%3D%22sans-serif%22%20font-size%3D%2214%22%20font-weight%3D%22bold%22%20fill%3D%22%239CA3AF%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%3EL%E1%BB%97i%3C%2Ftext%3E%3C%2Fsvg%3E";
                                  }}
                                />
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="aspect-video bg-[#FAFAFA] rounded-[12px] border border-[#E5E7EB] flex items-center justify-center text-[#6B7280]">
                      Không có hình ảnh đính kèm
                    </div>
                  )}
                </div>

                {/* Section 2: Nội dung phản ánh */}
                <div className="bg-[#FFFFFF] p-6 rounded-lg border border-[#E5E7EB]">
                  <h3 className="text-sm font-bold text-[#111827] uppercase mb-4">
                    NỘI DUNG PHẢN ÁNH
                  </h3>
                  <div className="p-4 border border-[#E5E7EB] rounded-md bg-[#FAFAFA]">
                    <p className="text-[15px] leading-relaxed text-[#111827] whitespace-pre-wrap">
                      {fb.description || fb.content || "Không có nội dung."}
                    </p>
                  </div>
                </div>
                
              </div>

              {/* ======================================================
                  RIGHT COLUMN (35% = 4 cols)
                  ====================================================== */}
              <div className="col-span-12 lg:col-span-4 space-y-6">
                
                {/* Card 1: Thông thông người gửi */}
                <div className="bg-[#FFFFFF] p-6 rounded-lg border border-[#E5E7EB]">
                  <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2 mb-6">
                    <User size={18} className="text-[#1D4ED8]" />
                    THÔNG TIN NGƯỜI GỬI
                  </h3>
                  <div className="space-y-4 text-[14px]">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-[#6B7280] col-span-1">Họ tên</div>
                      <div className="text-[#111827] font-medium col-span-2">{fb.citizenName || "—"}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-[#6B7280] col-span-1">Số điện thoại</div>
                      <div className="text-[#111827] font-medium col-span-2">{fb.citizenPhone || "—"}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-[#6B7280] col-span-1">Email</div>
                      <div className="text-[#111827] font-medium col-span-2 break-all">{fb.citizenEmail || "—"}</div>
                    </div>
                  </div>
                </div>

                {/* Card 2: Địa điểm */}
                <div className="bg-[#FFFFFF] p-6 rounded-lg border border-[#E5E7EB]">
                  <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2 mb-6">
                    <MapPin size={18} className="text-[#1D4ED8]" />
                    ĐỊA ĐIỂM
                  </h3>
                  <div className="space-y-4 text-[14px]">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-[#6B7280] col-span-1">Quận/Phường</div>
                      <div className="text-[#111827] font-medium col-span-2">{fb.wardName || "—"}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-[#6B7280] col-span-1">Địa chỉ cụ thể</div>
                      <div className="text-[#111827] font-medium col-span-2">{fb.addressDetails || fb.address || "—"}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-[#6B7280] col-span-1">Tọa độ GPS</div>
                      <div className="text-[#111827] font-medium col-span-2">
                        {fb.latitude && fb.longitude ? `${fb.latitude.toFixed(6)}, ${fb.longitude.toFixed(6)}` : "—"}
                      </div>
                    </div>
                    {fb.latitude && fb.longitude && (
                      <div className="pt-2">
                        <button
                          onClick={() => window.open(`https://maps.google.com/?q=${fb.latitude},${fb.longitude}`)}
                          className="flex items-center gap-2 text-sm font-bold text-[#1D4ED8] hover:underline"
                        >
                          <MapPin size={16} />
                          Xem trên bản đồ
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card 3: Phân loại */}
                <div className="bg-[#FFFFFF] p-6 rounded-lg border border-[#E5E7EB]">
                  <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2 mb-6">
                    <CheckCircle size={18} className="text-[#1D4ED8]" />
                    PHÂN LOẠI
                  </h3>
                  <div className="space-y-4 text-[14px]">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-[#6B7280] col-span-1">Lĩnh vực</div>
                      <div className="text-[#111827] font-medium col-span-2">{fb.categoryName || "—"}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-[#6B7280] col-span-1">Danh mục</div>
                      <div className="text-[#111827] font-medium col-span-2">{fb.category || fb.categoryName || "—"}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 items-center">
                      <div className="text-[#6B7280] col-span-1">Mức độ ưu tiên</div>
                      <div className="col-span-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${getPriorityDisplay(fb?.priority).color} bg-slate-50 border ${getPriorityDisplay(fb?.priority).border}`}>
                          {getPriorityDisplay(fb?.priority).text}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-[#6B7280] col-span-1">Ngày gửi</div>
                      <div className="text-[#111827] font-medium col-span-2">
                        {fb.createdAt ? new Date(fb.createdAt).toLocaleString("vi-VN") : "—"}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-[#6B7280] col-span-1">Cập nhật lần cuối</div>
                      <div className="text-[#111827] font-medium col-span-2">
                        {fb.updatedAt ? new Date(fb.updatedAt).toLocaleString("vi-VN") : "—"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 4: Trạng thái xử lý (Progress) */}
                <div className="bg-[#FFFFFF] p-6 rounded-lg border border-[#E5E7EB]">
                  <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2 mb-6">
                    <CheckCircle size={18} className="text-[#1D4ED8]" />
                    TIẾN ĐỘ XỬ LÝ
                  </h3>
                  
                  <div className="space-y-6">
                    <div className="flex flex-col gap-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${['SUBMITTED', 'PENDING_RECEIVE', 'PENDING', 'IN_PROGRESS', 'RESOLVED'].includes(fb.status) ? 'bg-[#1D4ED8] text-white' : 'bg-[#E5E7EB] text-[#6B7280]'}`}>
                          <span className="text-sm font-bold">1</span>
                        </div>
                        <div className="flex-1">
                          <p className={`font-bold ${['SUBMITTED', 'PENDING_RECEIVE', 'PENDING', 'IN_PROGRESS', 'RESOLVED'].includes(fb.status) ? 'text-[#111827]' : 'text-[#6B7280]'}`}>Tiếp nhận</p>
                        </div>
                      </div>
                      
                      <div className="w-0.5 h-6 bg-[#E5E7EB] ml-4 -my-4 relative z-0"></div>

                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${['IN_PROGRESS', 'RESOLVED'].includes(fb.status) ? 'bg-[#1D4ED8] text-white' : 'bg-[#E5E7EB] text-[#6B7280]'}`}>
                          <span className="text-sm font-bold">2</span>
                        </div>
                        <div className="flex-1">
                          <p className={`font-bold ${['IN_PROGRESS', 'RESOLVED'].includes(fb.status) ? 'text-[#111827]' : 'text-[#6B7280]'}`}>Đang xử lý</p>
                        </div>
                      </div>

                      <div className="w-0.5 h-6 bg-[#E5E7EB] ml-4 -my-4 relative z-0"></div>

                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${['RESOLVED'].includes(fb.status) ? 'bg-[#1D4ED8] text-white' : 'bg-[#E5E7EB] text-[#6B7280]'}`}>
                          <span className="text-sm font-bold">3</span>
                        </div>
                        <div className="flex-1">
                          <p className={`font-bold ${['RESOLVED'].includes(fb.status) ? 'text-[#111827]' : 'text-[#6B7280]'}`}>Hoàn thành</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>

        {/* ======================================================
            BOTTOM ACTION BAR (Sticky Footer)
            ====================================================== */}
        <div className="shrink-0 bg-[#FFFFFF] border-t border-[#E5E7EB] px-8 py-4 flex items-center justify-between h-[80px]">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[#6B7280]">ID phản ánh:</span>
            <span className="text-sm font-bold text-[#111827]">{fb?.trackingCode || `#${feedbackId}`}</span>
            <button
              onClick={() => copyToClipboard(fb?.trackingCode || `#${feedbackId}`)}
              className="ml-1 p-1.5 text-[#6B7280] hover:text-[#111827] transition-colors"
            >
              <Copy size={16} />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => toast.info("Tính năng Thêm ghi chú đang được phát triển")}
              className="flex items-center gap-2 px-4 py-2 border border-[#E5E7EB] text-[#111827] text-sm font-semibold rounded-[8px] hover:bg-[#FAFAFA] transition"
            >
              <MessageSquare size={18} />
              Thêm ghi chú
            </button>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success("Đã sao chép liên kết chia sẻ");
              }}
              className="flex items-center gap-2 px-4 py-2 border border-[#E5E7EB] text-[#111827] text-sm font-semibold rounded-[8px] hover:bg-[#FAFAFA] transition"
            >
              <Share2 size={18} />
              Chia sẻ
            </button>
            
            <div className="w-px h-6 bg-[#E5E7EB] mx-2"></div>
            
            <button 
              onClick={() => toast.info("Tính năng Cập nhật trạng thái đang được xây dựng (Sắp ra mắt)")}
              className="flex items-center justify-center px-6 h-[48px] bg-[#1D4ED8] text-white text-sm font-bold rounded-[10px] hover:bg-[#1e40af] transition"
            >
              Cập nhật trạng thái
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
