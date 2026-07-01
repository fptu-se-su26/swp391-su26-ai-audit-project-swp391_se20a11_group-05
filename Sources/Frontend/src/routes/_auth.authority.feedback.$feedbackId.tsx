import { clientOnly } from "@/components/ClientOnly";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  FileText,
  MapPin,
  Mail,
  Phone,
  User,
  XCircle,
  AlertTriangle,
  Play,
  ChevronDown,
  ChevronUp,
  Plus,
  Loader2,
  Bookmark,
  Users,
  Compass,
  Rocket,
  Eye,
  Clock,
  type LucideIcon,
} from "lucide-react";
import { useState, useMemo, useEffect, Suspense } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { Role } from "@/lib/roles";
import { useFeedbackDetail, useChangeFeedbackStatus } from "@/hooks";
import { useCreateCampaign } from "@/hooks/useCampaigns";
import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { campaignApi, type FeedbackStatus, type FeedbackLogResponse } from "@/lib/api";
import { uploadResolutionEvidence } from "@/lib/citizenFeedbackMediaApi";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// Lazy load CivicMap to prevent SSR issues with Leaflet
const CivicMap = clientOnly(() =>
  import("@/components/site/CivicMap").then((m) => ({ default: m.CivicMap })) as any,
) as any;

function getInitials(name?: string | null) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export const Route = createFileRoute("/_auth/authority/feedback/$feedbackId")({
  head: ({ params }) => ({
    meta: [
      { title: `Chi tiết xử lý phản ánh #${params.feedbackId} - Cổng Cán Bộ` },
      { name: "description", content: "Trang chi tiết xử lý phản ánh dành cho cán bộ quản lý." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: FeedbackDetailPage,
});

function FeedbackDetailPage() {
  const { feedbackId } = Route.useParams();
  return <FeedbackDetailPageComponent feedbackId={feedbackId} />;
}

const VALID_TRANSITIONS: Record<FeedbackStatus, FeedbackStatus[]> = {
  SUBMITTED: ["PENDING_RECEIVE", "IN_PROGRESS", "REJECTED"],
  PENDING_RECEIVE: ["IN_PROGRESS", "REJECTED"],
  PENDING: ["IN_PROGRESS", "REJECTED"],
  NEED_LOCATION_REVIEW: ["PENDING_RECEIVE", "REJECTED"],
  ASSIGNED: ["IN_PROGRESS", "RESOLVED", "REJECTED"],
  IN_PROGRESS: ["WAITING_INFO", "RESOLVED", "REJECTED"],
  WAITING_INFO: ["IN_PROGRESS", "RESOLVED", "REJECTED"],
  RESOLVED: [],
  REJECTED: [],
  PRE_EMPTIVE: [],
};

const TARGET_STATUS_DETAILS: Record<
  FeedbackStatus,
  { label: string; btnLabel: string; colorClass: string; activeColorClass: string; icon: LucideIcon }
> = {
  PENDING: {
    label: "Chờ xử lý",
    btnLabel: "Chờ xử lý",
    colorClass: "border-orange-200 text-orange-700 bg-orange-50 hover:bg-orange-100",
    activeColorClass: "bg-orange-600 text-white border-orange-600 shadow-sm",
    icon: Clock,
  },
  PENDING_RECEIVE: {
    label: "Chờ tiếp nhận",
    btnLabel: "Chờ tiếp nhận",
    colorClass: "border-orange-200 text-orange-700 bg-orange-50 hover:bg-orange-100",
    activeColorClass: "bg-orange-600 text-white border-orange-600 shadow-sm",
    icon: Clock,
  },
  IN_PROGRESS: {
    label: "Đang xử lý",
    btnLabel: "Tiếp nhận xử lý",
    colorClass: "border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100",
    activeColorClass: "bg-blue-600 text-white border-blue-600 shadow-sm",
    icon: Play,
  },
  WAITING_INFO: {
    label: "Yêu cầu bổ sung thông tin",
    btnLabel: "Yêu cầu bổ sung",
    colorClass: "border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100",
    activeColorClass: "bg-amber-500 text-white border-amber-500 shadow-sm",
    icon: AlertTriangle,
  },
  RESOLVED: {
    label: "Đã xử lý",
    btnLabel: "Hoàn tất xử lý",
    colorClass: "border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100",
    activeColorClass: "bg-emerald-600 text-white border-emerald-600 shadow-sm",
    icon: CheckCircle2,
  },
  REJECTED: {
    label: "Từ chối xử lý",
    btnLabel: "Từ chối",
    colorClass: "border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100",
    activeColorClass: "bg-rose-600 text-white border-rose-600 shadow-sm",
    icon: XCircle,
  },
  SUBMITTED: {
    label: "Đã gửi",
    btnLabel: "Đã gửi",
    colorClass: "",
    activeColorClass: "",
    icon: FileText,
  },
  NEED_LOCATION_REVIEW: {
    label: "Cần xác minh vị trí",
    btnLabel: "Cần xác minh vị trí",
    colorClass: "",
    activeColorClass: "",
    icon: AlertTriangle,
  },
  ASSIGNED: {
    label: "Đã phân công",
    btnLabel: "Đã phân công",
    colorClass: "",
    activeColorClass: "",
    icon: User,
  },
  PRE_EMPTIVE: {
    label: "Xử lý trước",
    btnLabel: "Xử lý trước",
    colorClass: "",
    activeColorClass: "",
    icon: Rocket,
  },
};

export function FeedbackDetailPageComponent({
  feedbackId,
  onBack,
}: {
  feedbackId: string;
  onBack?: () => void;
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: report, isLoading, isError, error } = useFeedbackDetail(feedbackId);
  const changeStatusMutation = useChangeFeedbackStatus();
  const { submit: createCampaign, isLoading: isCreatingCampaign } = useCreateCampaign();

  // Selected status in the update form
  const [selectedStatus, setSelectedStatus] = useState<FeedbackStatus | "">("");
  const [statusNote, setStatusNote] = useState("");
  const [requestMessage, setRequestMessage] = useState("");
  const [responseDeadline, setResponseDeadline] = useState("");
  const [sendCitizenNotification, setSendCitizenNotification] = useState(true);
  const [resolutionFiles, setResolutionFiles] = useState<File[]>([]);
  const [isUploadingEvidence, setIsUploadingEvidence] = useState(false);

  useEffect(() => {
    setResolutionFiles([]);
  }, [selectedStatus]);

  const targetTransitions = useMemo(() => {
    if (!report || !report.status) return [];
    return VALID_TRANSITIONS[report.status as FeedbackStatus] || [];
  }, [report]);

  // Campaign Dialog state
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);

  // Campaign creation form state
  const [campaignTitle, setCampaignTitle] = useState("");
  const [campaignDesc, setCampaignDesc] = useState("");
  const [campaignCategory, setCampaignCategory] = useState("environment");
  const [campaignLocation, setCampaignLocation] = useState("");
  const [campaignOrganizer, setCampaignOrganizer] = useState("");
  const [campaignParticipants, setCampaignParticipants] = useState("20");
  const [campaignTools, setCampaignTools] = useState("");
  const [campaignExpectedResult, setCampaignExpectedResult] = useState("");
  const [campaignStartDate, setCampaignStartDate] = useState("");
  const [campaignStartHour, setCampaignStartHour] = useState("08");
  const [campaignStartMinute, setCampaignStartMinute] = useState("00");
  const [campaignEndDate, setCampaignEndDate] = useState("");
  const [campaignEndHour, setCampaignEndHour] = useState("17");
  const [campaignEndMinute, setCampaignEndMinute] = useState("00");

  const campaignStart = useMemo(() => {
    if (!campaignStartDate) return "";
    return `${campaignStartDate}T${campaignStartHour}:${campaignStartMinute}`;
  }, [campaignStartDate, campaignStartHour, campaignStartMinute]);

  const campaignEnd = useMemo(() => {
    if (!campaignEndDate) return "";
    return `${campaignEndDate}T${campaignEndHour}:${campaignEndMinute}`;
  }, [campaignEndDate, campaignEndHour, campaignEndMinute]);

  const todayStr = useMemo(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  // Query all campaigns to find if this feedback is already linked to one
  const { data: campaignsData } = useQuery({
    queryKey: ["campaigns", "all"],
    queryFn: () => campaignApi.getAll(0, 500),
    staleTime: 10_000,
  });

  const linkedCampaign = useMemo(() => {
    if (!campaignsData?.content) return null;
    return campaignsData.content.find((c) => c.linkedFeedbackId === Number(feedbackId));
  }, [campaignsData, feedbackId]);

  // Set default values when report is loaded
  useEffect(() => {
    if (report) {
      setSelectedStatus("");
      setCampaignTitle(`Chiến dịch dọn dẹp: ${report.title}`);
      setCampaignDesc("");
      setCampaignLocation(report.addressDetails || report.address || "");
      setCampaignOrganizer(
        user?.name ? `${user.name} - UBND ${user.wardName || "phường"}` : "UBND Phường",
      );
      setCampaignExpectedResult(
        `Hoan tat xu ly phan anh ${report.trackingCode || report.code || report.id}`,
      );

      // Set category default based on report category code
      const catCode = report.categoryCode || report.category || "";
      if (catCode === "ENVIRONMENT") setCampaignCategory("environment");
      else if (catCode === "URBAN_INFRASTRUCTURE") setCampaignCategory("infrastructure");
      else if (catCode === "PUBLIC_SECURITY") setCampaignCategory("public_safety");
      else if (catCode === "CONSTRUCTION") setCampaignCategory("construction");
      else if (catCode === "FIRE_SAFETY") setCampaignCategory("fire_safety");
    }
  }, [report, user]);

  // Check if current user is Ward Staff or Police and belongs to the same ward
  const hasWriteAccess = useMemo(() => {
    if (!user || !report) return false;
    if (report.wardId !== user.wardId) return false;
    
    const catCode = report.categoryCode || report.category || report.categoryName;
    
    if (user.role === Role.WARD_STAFF) {
      return isWardStaffCategory(catCode);
    }
    
    if (user.role === Role.POLICE) {
      return isPoliceCategory(catCode);
    }
    
    return false;
  }, [user, report]);

  const canCreateCampaign = useMemo(() => {
    if (!user || !report) return false;
    if (user.role !== Role.WARD_STAFF) return false;
    if (report.wardId !== user.wardId) return false;
    if (report.status === "REJECTED") return false;
    const catCode = (report.categoryCode || report.category || "").toUpperCase();
    return ["URBAN_INFRASTRUCTURE", "ENVIRONMENT", "CONSTRUCTION"].includes(catCode);
  }, [user, report]);

  const resolutionAttachments = useMemo(() => {
    if (!report || !report.attachments) return [];
    return report.attachments.filter((a) => a.attachmentPurpose === "RESOLUTION_EVIDENCE");
  }, [report]);

  // Media Gallery state
  const mediaList = useMemo(() => {
    if (!report) return [];
    const attachments = report.attachments || [];
    const mediaUrls = report.mediaUrls || [];

    const list: Array<{ url: string; type: "image" | "video" }> = [];

    // Prioritize attachments
    attachments.forEach((att) => {
      if (att.attachmentPurpose === "RESOLUTION_EVIDENCE") return;
      const isVideo = att.fileType?.startsWith("video/") || att.fileUrl.endsWith(".mp4");
      list.push({
        url: att.fileUrl,
        type: isVideo ? "video" : "image",
      });
    });

    // Fallback or additional mediaUrls
    mediaUrls.forEach((url) => {
      if (!list.some((item) => item.url === url)) {
        const isVideo = url.endsWith(".mp4");
        list.push({
          url,
          type: isVideo ? "video" : "image",
        });
      }
    });

    if (report.videoUrl && !list.some((item) => item.url === report.videoUrl)) {
      list.push({
        url: report.videoUrl,
        type: "video",
      });
    }

    return list;
  }, [report]);

  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const activeMedia = mediaList[activeMediaIndex];

  const [, setIsPlaying] = useState(false);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!report || !selectedStatus) return;

    if (selectedStatus === "WAITING_INFO") {
      if (!requestMessage.trim()) {
        toast.error("Vui lòng nhập nội dung yêu cầu bổ sung thông tin.");
        return;
      }
      if (responseDeadline && new Date(responseDeadline).getTime() < Date.now()) {
        toast.error("Hạn phản hồi không được ở quá khứ.");
        return;
      }
    }

    // Validation for notes in specific statuses
    if (selectedStatus === "RESOLVED") {
      if (resolutionFiles.length === 0) {
        toast.error("Vui lòng tải lên ít nhất 1 hình ảnh hoặc video bằng chứng kết quả xử lý.");
        return;
      }
      if (!statusNote.trim()) {
        toast.error("Vui lòng nhập ghi chú kết quả xử lý.");
        return;
      }
    }

    if (selectedStatus === "REJECTED" && !statusNote.trim()) {
      toast.error("Vui lòng nhập lý do từ chối xử lý.");
      return;
    }

    try {
      if (selectedStatus === "RESOLVED") {
        setIsUploadingEvidence(true);
        const uploadToastId = toast.loading("Đang tải lên các tệp bằng chứng xử lý...");
        try {
          await Promise.all(
            resolutionFiles.map((file) => uploadResolutionEvidence(report.id, file))
          );
          toast.success("Tải lên bằng chứng xử lý thành công.", { id: uploadToastId });
        } catch (uploadErr) {
          const errMsg = uploadErr instanceof Error ? uploadErr.message : String(uploadErr);
          toast.error("Lỗi tải lên bằng chứng: " + errMsg, { id: uploadToastId });
          setIsUploadingEvidence(false);
          return;
        }
        setIsUploadingEvidence(false);
      }

      const waitingInfoNote = responseDeadline
        ? `${requestMessage.trim()}\nHan phan hoi: ${new Date(responseDeadline).toLocaleString("vi-VN")}`
        : requestMessage.trim();
      await changeStatusMutation.mutateAsync({
        id: report.id,
        status: selectedStatus,
        note: selectedStatus === "WAITING_INFO" ? waitingInfoNote : statusNote.trim() || undefined,
        requestMessage: selectedStatus === "WAITING_INFO" ? requestMessage.trim() : undefined,
        responseDeadline:
          selectedStatus === "WAITING_INFO" && responseDeadline
            ? new Date(responseDeadline).toISOString()
            : undefined,
        sendNotification: selectedStatus === "WAITING_INFO" ? sendCitizenNotification : undefined,
      });
      toast.success("Cập nhật trạng thái phản ánh thành công.");
      setStatusNote("");
      setRequestMessage("");
      setResponseDeadline("");
      setSendCitizenNotification(true);
      setResolutionFiles([]);
      invalidateFeedbackSyncQueries(queryClient, report.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Cập nhật trạng thái thất bại.");
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!report) return;

    if (!canCreateCampaign) {
      toast.error("Bạn không có quyền thực hiện thao tác này.");
      return;
    }

    if (!campaignTitle.trim()) {
      toast.error("Vui lòng nhập tiêu đề chiến dịch.");
      return;
    }
    if (!campaignDesc.trim()) {
      toast.error("Vui lòng nhập mô tả chiến dịch.");
      return;
    }
    if (!campaignLocation.trim()) {
      toast.error("Vui lòng nhập địa điểm diễn ra chiến dịch.");
      return;
    }
    if (!campaignTools.trim()) {
      toast.error("Vui lòng nhập dụng cụ hỗ trợ cần thiết.");
      return;
    }
    if (!campaignOrganizer.trim()) {
      toast.error("Vui lòng nhập đơn vị đứng ra tổ chức.");
      return;
    }
    if (!campaignStart || !campaignEnd) {
      toast.error("Vui lòng chọn thời gian bắt đầu và kết thúc.");
      return;
    }
    if (new Date(campaignStart) >= new Date(campaignEnd)) {
      toast.error("Thời gian kết thúc phải sau thời gian bắt đầu.");
      return;
    }

    try {
      await createCampaign({
        title: campaignTitle.trim(),
        description: campaignDesc.trim(),
        category: campaignCategory as any,
        locationText: campaignLocation.trim(),
        privateLocationText: campaignLocation.trim(),
        requiredTools: campaignTools.trim(),
        organizerContact: campaignOrganizer.trim(),
        maxParticipants: campaignParticipants,
        startTime: new Date(campaignStart).toISOString(),
        endTime: new Date(campaignEnd).toISOString(),
        linkedFeedbackId: report.id,
        linkedFeedbackCode: report.trackingCode || report.code || String(report.id),
        linkedFeedbackTitle: report.title,
        wardId: user?.wardId ?? undefined,
        wardName: report.wardName || user?.wardName || undefined,
        latitude: report.latitude ?? undefined,
        longitude: report.longitude ?? undefined,
      });

      toast.success("Tạo chiến dịch liên kết thành công!");
      setIsCampaignModalOpen(false);
      invalidateFeedbackSyncQueries(queryClient, report.id);
      void queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Tạo chiến dịch thất bại.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-blue-600" />
          <p className="text-sm font-semibold text-slate-500">Đang tải chi tiết phản ánh...</p>
        </div>
      </div>
    );
  }

  if (isError || !report) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-md p-6 text-center space-y-4">
          <XCircle className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="text-lg font-bold text-slate-900">Không thể tải phản ánh</h2>
          <p className="text-sm text-slate-600">
            {error instanceof Error
              ? error.message
              : "Đã có lỗi xảy ra hoặc phản ánh không tồn tại."}
          </p>
          <button
            onClick={() => navigate({ to: "/ward" })}
            className="w-full inline-flex justify-center items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft size={16} /> Quay lại trang chủ
          </button>
        </div>
      </div>
    );
  }

  const logs: FeedbackLogResponse[] = report.timeline || report.logs || [];
  const sortedLogs = [...logs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12 font-sans">
      {/* Top Banner Navigation */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200/80 px-4 md:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => (onBack ? onBack() : window.history.back())}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            title="Quay lại"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">
                {report.trackingCode || report.code || `#${report.id}`}
              </span>
              <span className="text-xs text-slate-400">|</span>
              <span className="text-xs text-slate-500 font-medium">
                Gửi lúc: {formatDateTime(report.submittedAt || report.createdAt)}
              </span>
            </div>
            <h1 className="text-base md:text-lg font-bold text-slate-900 line-clamp-1 mt-0.5">
              {report.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <PriorityBadge value={report.priority} />
          <StatusBadge status={report.status} />
          {linkedCampaign ? (
            <Link
              to="/campaigns/$id"
              params={{ id: String(linkedCampaign.id) }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-sm"
            >
              <Eye size={14} />
              Xem chiến dịch
            </Link>
          ) : (
            canCreateCampaign && (
              <button
                type="button"
                onClick={() => setIsCampaignModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-sm"
              >
                <Plus size={14} />
                Tạo chiến dịch
              </button>
            )
          )}
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 md:px-8 mt-6">
        {/* Read-Only warning warning banner */}
        {!hasWriteAccess && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-900">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold">Chế độ xem chi tiết (Chỉ đọc)</p>
              <p className="text-xs text-amber-800/90 mt-0.5">
                Tài khoản của bạn chỉ được phép xem phản ánh này. Có thể bạn không thuộc{" "}
                {report.wardName || "phường quản lý"} hoặc lĩnh vực này không thuộc thẩm quyền xử lý của bạn.
              </p>
            </div>
          </div>
        )}

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-[40%_60%] lg:grid-cols-[45%_55%] gap-6 items-start">
          {/* LEFT COLUMN: Media Gallery & Map Location */}
          <div className="space-y-6">
            {/* Interactive Media Gallery */}
            <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm space-y-4">
              <h2 className="sticky top-[68px] z-10 bg-white/95 backdrop-blur-sm -mx-5 px-5 -mt-5 pt-5 pb-3 border-b border-slate-100 rounded-t-2xl text-sm font-bold text-slate-900 uppercase tracking-wide">
                Hình ảnh & Video hiện trường
              </h2>

              {mediaList.length === 0 ? (
                <div className="aspect-[4/3] bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                  <FileText className="h-10 w-10 text-slate-300 mb-2" />
                  <p className="text-sm font-semibold text-slate-500">
                    No images or videos uploaded.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Large Preview Box */}
                  <div className="relative aspect-[4/3] w-full bg-slate-950 rounded-xl overflow-hidden shadow-inner flex items-center justify-center group border border-slate-800">
                    {activeMedia.type === "video" ? (
                      <div className="relative w-full h-full">
                        <video
                          id={`feedback-detail-video-${activeMediaIndex}`}
                          src={activeMedia.url}
                          className="w-full h-full object-contain"
                          controls
                          playsInline
                        />
                      </div>
                    ) : (
                      <div className="relative w-full h-full group/img cursor-zoom-in">
                        <img
                          src={activeMedia.url}
                          alt="Feedback evidence preview"
                          className="w-full h-full object-contain transition-transform duration-300 hover:scale-105"
                          onClick={() => {
                            window.open(activeMedia.url, "_blank");
                          }}
                        />
                        <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-md pointer-events-none opacity-0 group-hover/img:opacity-100 transition-opacity">
                          Click để xem ảnh gốc
                        </div>
                      </div>
                    )}

                    {/* Media Type Label */}
                    <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded-lg text-white text-[10px] font-bold flex items-center gap-1.5 pointer-events-none">
                      {activeMedia.type === "video" ? (
                        <>
                          <Play size={10} className="fill-white" /> VIDEO HIỆN TRƯỜNG
                        </>
                      ) : (
                        <>
                          <Compass size={10} /> HÌNH ẢNH MINH HỌA
                        </>
                      )}
                    </div>
                  </div>

                  {/* Thumbnail Row */}
                  {mediaList.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                      {mediaList.map((media, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => {
                            setActiveMediaIndex(index);
                            setIsPlaying(false);
                          }}
                          className={`relative h-14 w-20 shrink-0 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                            index === activeMediaIndex
                              ? "border-blue-600 scale-[0.98] ring-2 ring-blue-100"
                              : "border-transparent hover:border-slate-300"
                          }`}
                        >
                          <img
                            src={
                              media.type === "video"
                                ? "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=120&auto=format&fit=crop&q=60"
                                : media.url
                            }
                            alt=""
                            className="w-full h-full object-cover"
                          />
                          {media.type === "video" && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <Play size={14} className="text-white fill-white" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Map Location */}
            {report.latitude && report.longitude && (
              <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm space-y-4">
                <h2 className="sticky top-[68px] z-10 bg-white/95 backdrop-blur-sm -mx-5 px-5 -mt-5 pt-5 pb-3 border-b border-slate-100 rounded-t-2xl text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Bản đồ vị trí sự cố
                </h2>
                <div className="h-[400px] rounded-xl overflow-hidden border border-slate-200 shadow-sm relative">
                  <Suspense
                    fallback={
                      <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-400 text-xs font-semibold">
                        Đang tải bản đồ...
                      </div>
                    }
                  >
                    <CivicMap
                      center={[report.latitude, report.longitude]}
                      zoom={16}
                      markers={[
                        {
                          id: report.id,
                          position: [report.latitude, report.longitude],
                          title: report.title,
                          description: report.description,
                          status: report.status,
                        },
                      ]}
                      height="100%"
                      interactive={true}
                    />
                  </Suspense>
                </div>

                {/* Details Underneath */}
                <div className="pt-2 space-y-3.5 text-xs text-slate-600 font-medium">
                  <div className="flex items-start gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <MapPin size={16} className="text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        📍 Địa chỉ
                      </p>
                      <p className="text-sm font-semibold text-slate-800 mt-0.5">
                        {report.addressDetails || report.address || "Không rõ địa chỉ"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <DetailField label="Vĩ độ (Latitude)" value={report.latitude.toFixed(6)} />
                    <DetailField label="Kinh độ (Longitude)" value={report.longitude.toFixed(6)} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {report.wardName && report.wardName !== "-" && (
                      <DetailField label="Phường / Xã" value={report.wardName} />
                    )}
                    <DetailField
                      label="Thành phố"
                      value={
                        report.cityName && report.cityName !== "-" ? report.cityName : "Đà Nẵng"
                      }
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Feedback Info, Sender Info, Actions, History */}
          <div className="space-y-6">
            {/* Card 1: Feedback Information */}
            <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm space-y-4">
              <h2 className="sticky top-[68px] z-10 bg-white/95 backdrop-blur-sm -mx-5 px-5 -mt-5 pt-5 pb-3 border-b border-slate-100 rounded-t-2xl text-sm font-bold text-slate-900 uppercase tracking-wide">
                Thông tin phản ánh
              </h2>
              <div className="grid grid-cols-2 gap-3 text-xs md:grid-cols-3">
                <DetailField label="Mã tra cứu" value={report.trackingCode || report.code || "-"} />
                <DetailField
                  label="Trạng thái hiện tại"
                  value={getOfficerStatusInfo(report.status).label}
                />
                <DetailField label="Mức độ ưu tiên" value={translatePriority(report.priority)} />
                <DetailField
                  label="Lĩnh vực"
                  value={
                    report.categoryName ||
                    officialCategoryName(report.categoryCode || report.category || "")
                  }
                />
                <DetailField
                  label="Thời gian tạo"
                  value={formatDateTime(report.submittedAt || report.createdAt)}
                />
                <DetailField
                  label="Cập nhật lần cuối"
                  value={formatDateTime(report.updatedAt || report.createdAt)}
                />
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-4">
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                    Tiêu đề
                  </p>
                  <p className="text-sm font-bold text-slate-800 mt-1">{report.title}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                    Nội dung chi tiết
                  </p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed mt-1.5 bg-slate-50 p-3.5 rounded-xl border border-slate-100 font-medium">
                    {report.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Card 2: Sender Information */}
            <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm space-y-4">
              <h2 className="sticky top-[68px] z-10 bg-white/95 backdrop-blur-sm -mx-5 px-5 -mt-5 pt-5 pb-3 border-b border-slate-100 rounded-t-2xl text-sm font-bold text-slate-900 uppercase tracking-wide">
                Thông tin người gửi
              </h2>
              <div className="flex items-center gap-4 py-2">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-md">
                  {getInitials(report.citizenName || "Người dân ẩn danh")}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    {report.citizenName || "Người dân ẩn danh"}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Citizen</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4 text-xs font-semibold">
                <DetailField
                  label="Số điện thoại"
                  value={report.citizenPhone || "Không cung cấp"}
                />
                {report.citizenEmail && (
                  <DetailField label="Email liên hệ" value={report.citizenEmail} />
                )}
                <DetailField label="Phường / Xã" value={report.wardName || "-"} />
                <DetailField
                  label="Thời gian gửi"
                  value={formatDateTime(report.submittedAt || report.createdAt)}
                />
              </div>
            </div>

            {/* Card 3: Processing Actions */}
            <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm space-y-4">
              <h2 className="sticky top-[68px] z-10 bg-white/95 backdrop-blur-sm -mx-5 px-5 -mt-5 pt-5 pb-3 border-b border-slate-100 rounded-t-2xl text-sm font-bold text-slate-900 uppercase tracking-wide">
                Cập nhật xử lý phản ánh
              </h2>

              {targetTransitions.length === 0 ? (
                <div className="text-center py-6 bg-slate-50 border border-slate-200/60 rounded-xl space-y-2">
                  <CheckCircle2 className="mx-auto h-8 w-8 text-slate-400" />
                  <p className="text-xs font-bold text-slate-500">Trạng thái phản ánh đã kết thúc</p>
                </div>
              ) : (
                <form onSubmit={handleUpdateStatus} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                      Lựa chọn hành động xử lý
                    </label>
                    <div className="flex flex-wrap gap-2.5">
                      {targetTransitions.map((target) => {
                        const details = TARGET_STATUS_DETAILS[target];
                        if (!details) return null;
                        const IconComponent = details.icon;
                        const isActive = selectedStatus === target;

                        return (
                          <button
                            key={target}
                            type="button"
                            disabled={!hasWriteAccess}
                            onClick={() => {
                              setSelectedStatus(target);
                              // Reset sub-form fields when switching actions
                              setStatusNote("");
                              setRequestMessage("");
                              setResponseDeadline("");
                            }}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                              isActive ? details.activeColorClass : details.colorClass
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            <IconComponent size={14} />
                            <span>{details.btnLabel}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Conditional Sub-form inputs based on selected state */}
                  {selectedStatus && (
                    <div className="space-y-4 pt-1">
                      {selectedStatus === "WAITING_INFO" && (
                        <div className="p-3.5 bg-blue-50 border border-blue-200/70 rounded-xl space-y-2 animate-fadeIn">
                          <label className="block text-xs font-bold text-blue-900 uppercase">
                            Nội dung yêu cầu người dân cung cấp thêm
                          </label>
                          <textarea
                            disabled={!hasWriteAccess}
                            value={requestMessage}
                            onChange={(e) => setRequestMessage(e.target.value)}
                            placeholder="Mô tả cụ thể thông tin/hình ảnh cần người dân bổ sung..."
                            rows={4}
                            className="w-full border border-blue-200 rounded-lg p-2.5 text-xs bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none placeholder-blue-300 font-semibold"
                          />
                          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                            <label className="block text-xs font-bold text-blue-900 uppercase">
                              Han phan hoi
                              <input
                                type="datetime-local"
                                disabled={!hasWriteAccess}
                                value={responseDeadline}
                                onChange={(e) => setResponseDeadline(e.target.value)}
                                className="mt-1 h-9 w-full rounded-lg border border-blue-200 bg-white px-2 text-xs font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                              />
                            </label>
                            <label className="flex items-center gap-2 self-end rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-bold text-blue-900">
                              <input
                                type="checkbox"
                                disabled={!hasWriteAccess}
                                checked={sendCitizenNotification}
                                onChange={(e) => setSendCitizenNotification(e.target.checked)}
                                className="h-4 w-4"
                              />
                              Gui thong bao cho cong dan
                            </label>
                          </div>
                          <p className="text-[10px] text-blue-800/80 font-medium">
                            * Yêu cầu này sẽ hiển thị trực tiếp trên tài khoản ứng dụng di động của người dân.
                          </p>
                        </div>
                      )}

                      {selectedStatus === "RESOLVED" && (
                        <div className="p-3.5 bg-green-50 border border-green-200/70 rounded-xl space-y-3 animate-fadeIn">
                          <label className="block text-xs font-bold text-green-900 uppercase">
                            Báo cáo kết quả xử lý thực tế
                          </label>
                          <textarea
                            disabled={!hasWriteAccess || isUploadingEvidence}
                            value={statusNote}
                            onChange={(e) => setStatusNote(e.target.value)}
                            placeholder="Nhập chi tiết biện pháp khắc phục và kết quả xử lý sự cố..."
                            rows={4}
                            className="w-full border border-green-200 rounded-lg p-2.5 text-xs bg-white focus:ring-2 focus:ring-green-100 focus:border-green-500 outline-none placeholder-green-300 font-semibold"
                          />

                          <div className="space-y-2">
                            <label className="block text-xs font-bold text-green-900 uppercase">
                              Hình ảnh / Video bằng chứng xử lý <span className="text-red-500">*</span>
                            </label>
                            
                            {resolutionFiles.length > 0 && (
                              <div className="flex flex-wrap gap-2 pb-1">
                                {resolutionFiles.map((file, idx) => {
                                  const isVideo = file.type.startsWith("video/");
                                  return (
                                    <div key={idx} className="relative h-16 w-20 shrink-0 rounded-lg overflow-hidden border border-green-205 group bg-white shadow-sm">
                                      {isVideo ? (
                                        <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                                          <Play size={16} className="text-white fill-white" />
                                        </div>
                                      ) : (
                                        <img
                                          src={URL.createObjectURL(file)}
                                          alt=""
                                          className="w-full h-full object-cover"
                                        />
                                      )}
                                      <button
                                        type="button"
                                        disabled={isUploadingEvidence}
                                        onClick={() => {
                                          setResolutionFiles(prev => prev.filter((_, i) => i !== idx));
                                        }}
                                        className="absolute top-0.5 right-0.5 bg-red-500/80 hover:bg-red-600 text-white rounded-full p-0.5 shadow transition-colors cursor-pointer"
                                      >
                                        <XCircle size={12} className="fill-white" />
                                      </button>
                                      <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[8px] text-white text-center py-0.5 truncate px-1 font-bold">
                                        {file.name}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            <div
                              onClick={() => {
                                if (!isUploadingEvidence && hasWriteAccess) {
                                  document.getElementById("resolution-evidence-file-input")?.click();
                                }
                              }}
                              className={`border-2 border-dashed border-green-300 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-green-100/50 hover:border-green-400 transition-all text-green-700 bg-white/70 shadow-inner ${isUploadingEvidence ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                              <Plus className="h-6 w-6 text-green-600 mb-1.5" />
                              <p className="text-xs font-bold text-green-800">
                                Kéo thả hoặc click để tải lên bằng chứng
                              </p>
                              <p className="text-[10px] text-green-655 font-semibold mt-0.5">
                                Cho phép hình ảnh (PNG, JPG, WEBP) hoặc video (MP4)
                              </p>
                              <input
                                id="resolution-evidence-file-input"
                                type="file"
                                multiple
                                accept="image/*,video/*"
                                className="hidden"
                                disabled={isUploadingEvidence || !hasWriteAccess}
                                onChange={(e) => {
                                  if (e.target.files) {
                                    const selected = Array.from(e.target.files);
                                    const invalid = selected.filter(f => !f.type.startsWith("image/") && !f.type.startsWith("video/"));
                                    if (invalid.length > 0) {
                                      toast.error("Chỉ chấp nhận file hình ảnh hoặc video.");
                                      return;
                                    }
                                    setResolutionFiles(prev => [...prev, ...selected]);
                                  }
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedStatus === "REJECTED" && (
                        <div className="p-3.5 bg-red-50 border border-red-200/70 rounded-xl space-y-2 animate-fadeIn">
                          <label className="block text-xs font-bold text-red-900 uppercase">
                            Lý do từ chối giải quyết
                          </label>
                          <textarea
                            disabled={!hasWriteAccess}
                            value={statusNote}
                            onChange={(e) => setStatusNote(e.target.value)}
                            placeholder="Nêu rõ lý do không xử lý phản ánh (Không thuộc thẩm quyền, thông tin giả mạo...)"
                            rows={4}
                            className="w-full border border-red-200 rounded-lg p-2.5 text-xs bg-white focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none placeholder-red-300 font-semibold"
                          />
                        </div>
                      )}

                      {["IN_PROGRESS", "PENDING_RECEIVE"].includes(selectedStatus) && (
                        <div className="p-3.5 bg-blue-50/50 border border-blue-200/50 rounded-xl space-y-2 animate-fadeIn">
                          <label className="block text-xs font-bold text-blue-900 uppercase">
                            Ghi chú / Ý kiến tiếp nhận (Không bắt buộc)
                          </label>
                          <textarea
                            disabled={!hasWriteAccess}
                            value={statusNote}
                            onChange={(e) => setStatusNote(e.target.value)}
                            placeholder="Nhập ghi chú tiếp nhận xử lý (nếu có)..."
                            rows={3}
                            className="w-full border border-blue-250 rounded-lg p-2.5 text-xs bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none placeholder-blue-300 font-semibold"
                          />
                        </div>
                      )}

                      {/* Submit action */}
                       <button
                        type="submit"
                        disabled={
                          !hasWriteAccess ||
                          changeStatusMutation.isPending ||
                          isUploadingEvidence ||
                          (selectedStatus === "RESOLVED" && resolutionFiles.length === 0)
                        }
                        className="w-full h-10 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                      >
                        {changeStatusMutation.isPending || isUploadingEvidence ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />{" "}
                            {isUploadingEvidence ? "Đang tải bằng chứng..." : "Đang cập nhật..."}
                          </>
                        ) : (
                          `Xác nhận chuyển sang: ${TARGET_STATUS_DETAILS[selectedStatus]?.label || selectedStatus}`
                        )}
                      </button>
                    </div>
                  )}
                </form>
              )}
            </div>

            {/* Card 4: Processing History */}
            <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm space-y-4">
              <h2 className="sticky top-[68px] z-10 bg-white/95 backdrop-blur-sm -mx-5 px-5 -mt-5 pt-5 pb-3 border-b border-slate-100 rounded-t-2xl text-sm font-bold text-slate-900 uppercase tracking-wide">
                Lịch sử xử lý phản ánh
              </h2>

              {sortedLogs.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 font-semibold">
                  Chưa có lịch sử cập nhật.
                </div>
              ) : (
                <div className="relative pl-2 space-y-6 py-2">
                  {/* Timeline vertical line connector */}
                  <div className="absolute left-[20px] top-6 bottom-6 w-0.5 bg-slate-100" />

                  {sortedLogs.slice(0, isHistoryExpanded ? sortedLogs.length : 3).map((log) => {
                    let statusInfo = getOfficerStatusInfo(log.newStatus || log.status || "");
                    if (log.action === "PROVIDE_INFO") {
                      statusInfo = {
                        label: "Đã bổ sung thông tin",
                        className: "bg-blue-50 text-blue-700 border-blue-200"
                      };
                    }
                    const actorName = log.actorName || log.actionByName || "Hệ thống";

                    return (
                      <div key={log.id} className="flex gap-4 relative group text-left items-start">
                        {/* Officer Avatar */}
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 text-white flex items-center justify-center font-bold text-sm shrink-0 border-2 border-white shadow-sm z-10">
                          {getInitials(actorName)}
                        </div>

                        {/* Log Details */}
                        <div className="flex-1 space-y-1.5 min-w-0">
                          <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-800 truncate max-w-[150px] md:max-w-none">
                                {actorName}
                              </span>
                              <span className="px-2 py-0.5 text-[10px] font-extrabold tracking-wide uppercase rounded-md bg-slate-100 text-slate-500 border border-slate-200">
                                {translateRole(log.actorRole || (log as any).actionByRole)}
                              </span>
                            </div>
                            <span className="text-[10px] font-medium text-slate-400 shrink-0">
                              {formatDateTime(log.createdAt)}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusInfo.className}`}>
                              {statusInfo.label}
                            </span>
                            {log.action && (
                              <span className="text-[10px] font-medium text-slate-400 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-md">
                                Hành động: {translateAction(log.action)}
                              </span>
                            )}
                          </div>

                            {log.note && (
                             <div className="mt-1.5 p-2.5 bg-slate-50 border border-slate-150 rounded-lg text-xs font-medium text-slate-600 whitespace-pre-wrap leading-relaxed shadow-sm">
                               {log.note}
                               {((log.newStatus === "RESOLVED") || (log.action === "RESOLVE")) && resolutionAttachments.length > 0 && (
                                 <div className="mt-3 space-y-2 border-t border-slate-200/60 pt-2.5">
                                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                     📸 Bằng chứng xử lý từ cán bộ:
                                   </p>
                                   <div className="flex flex-wrap gap-2 pt-1">
                                     {resolutionAttachments.map((att) => {
                                       const isVideo = att.fileType?.startsWith("video/") || att.fileUrl.endsWith(".mp4");
                                       return (
                                         <div key={att.id} className="relative h-16 w-20 shrink-0 rounded-lg overflow-hidden border border-slate-200 bg-slate-950 shadow-sm">
                                           {isVideo ? (
                                             <video src={att.fileUrl} className="w-full h-full object-cover" controls />
                                           ) : (
                                             <img
                                               src={att.fileUrl}
                                               alt=""
                                               className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                                               onClick={() => window.open(att.fileUrl, "_blank")}
                                             />
                                           )}
                                         </div>
                                       );
                                     })}
                                   </div>
                                 </div>
                               )}

                               {(() => {
                                 if (log.action !== "PROVIDE_INFO" || !report.attachments) return null;
                                 const suppAtts = report.attachments.filter((att) => {
                                   if (att.attachmentPurpose !== "SUPPLEMENTARY_EVIDENCE") return false;
                                   const logTime = new Date(log.createdAt).getTime();
                                   const uploadTime = new Date(att.uploadedAt || "").getTime();
                                   return Math.abs(uploadTime - logTime) < 60000;
                                 });
                                 if (suppAtts.length === 0) return null;
                                 return (
                                   <div className="mt-3 space-y-2 border-t border-slate-200/60 pt-2.5">
                                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                       📸 Hình ảnh bổ sung từ người dân:
                                     </p>
                                     <div className="flex flex-wrap gap-2 pt-1">
                                       {suppAtts.map((att) => {
                                         const isVideo = att.fileType?.startsWith("video/") || att.fileUrl.endsWith(".mp4");
                                         return (
                                           <div key={att.id} className="relative h-16 w-20 shrink-0 rounded-lg overflow-hidden border border-slate-200 bg-slate-950 shadow-sm">
                                             {isVideo ? (
                                               <video src={att.fileUrl} className="w-full h-full object-cover" controls />
                                             ) : (
                                               <img
                                                 src={att.fileUrl}
                                                 alt=""
                                                 className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                                                 onClick={() => window.open(att.fileUrl, "_blank")}
                                               />
                                             )}
                                           </div>
                                         );
                                       })}
                                     </div>
                                   </div>
                                 );
                               })()}
                             </div>
                           )}
                        </div>
                      </div>
                    );
                  })}
                  
                  {sortedLogs.length > 3 && (
                    <div className="flex justify-center pt-2 border-t border-slate-100 -mx-5 px-5">
                      <button
                        type="button"
                        onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                        className="inline-flex items-center justify-center gap-1.5 w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
                      >
                        {isHistoryExpanded ? (
                          <>
                            <ChevronUp size={14} />
                            Thu gọn lịch sử
                          </>
                        ) : (
                          <>
                            <ChevronDown size={14} />
                            Xem thêm lịch sử ({sortedLogs.length - 3} mục khác)
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Campaign Dialog Modal */}
      <Dialog open={isCampaignModalOpen} onOpenChange={setIsCampaignModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-lg border border-slate-200 p-6">
          <DialogHeader className="border-b border-slate-100 pb-3 mb-4">
            <DialogTitle className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Rocket className="text-emerald-600 h-5 w-5" />
              Tạo chiến dịch liên kết phản ánh
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 font-medium">
              Thiết lập chiến dịch cộng đồng liên kết với phản ánh này để cùng người dân xử lý sự
              cố.
            </DialogDescription>
          </DialogHeader>

          {/* Form */}
          <form onSubmit={handleCreateCampaign} className="space-y-4">
            {/* Read-Only Prefilled Section */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Thông tin pre-fill từ phản ánh
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold">Mã tra cứu:</span>{" "}
                  <span className="text-slate-800 font-bold">
                    {report.trackingCode || report.code || report.id}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold">Mức độ ưu tiên:</span>{" "}
                  <span className="text-slate-800 font-bold uppercase">{report.priority}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold">Phường/Xã:</span>{" "}
                  <span className="text-slate-800 font-bold">{report.wardName || "-"}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold">Vĩ độ:</span>{" "}
                  <span className="text-slate-800 font-bold">{report.latitude}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold">Kinh độ:</span>{" "}
                  <span className="text-slate-800 font-bold">{report.longitude}</span>
                </div>
              </div>
              <div>
                <span className="text-xs text-slate-400 font-semibold">Địa chỉ:</span>{" "}
                <span className="text-xs text-slate-800 font-bold block mt-0.5">
                  {report.addressDetails || report.address}
                </span>
              </div>
            </div>

            {/* Editable Fields */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Tiêu đề chiến dịch
              </label>
              <input
                type="text"
                value={campaignTitle}
                onChange={(e) => setCampaignTitle(e.target.value)}
                placeholder="Nhập tiêu đề chiến dịch kêu gọi..."
                className="w-full h-9 border border-slate-250 rounded-lg px-3 text-xs font-semibold outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Mô tả mục tiêu hoạt động
              </label>
              <textarea
                value={campaignDesc}
                onChange={(e) => setCampaignDesc(e.target.value)}
                placeholder="Mô tả cụ thể hoạt động dọn dẹp, xử lý..."
                rows={3}
                className="w-full border border-slate-250 rounded-lg p-2.5 text-xs font-semibold outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Lĩnh vực
                </label>
                <select
                  value={campaignCategory}
                  onChange={(e) => setCampaignCategory(e.target.value)}
                  className="w-full h-9 border border-slate-250 bg-white rounded-lg px-2 text-xs font-semibold outline-none"
                >
                  <option value="environment">Môi trường</option>
                  <option value="infrastructure">Hạ tầng đô thị</option>
                  <option value="public_safety">An ninh trật tự</option>
                  <option value="construction">Xây dựng</option>
                  <option value="fire_safety">Phòng cháy chữa cháy</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Số lượng tối đa tham gia
                </label>
                <input
                  type="number"
                  value={campaignParticipants}
                  onChange={(e) => setCampaignParticipants(e.target.value)}
                  min={5}
                  className="w-full h-9 border border-slate-250 rounded-lg px-3 text-xs font-semibold outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Địa điểm diễn ra <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={campaignLocation}
                onChange={(e) => setCampaignLocation(e.target.value)}
                className="w-full h-9 border border-slate-250 rounded-lg px-3 text-xs font-semibold outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <span className="block text-xs font-bold text-slate-700 uppercase">
                  Thời gian bắt đầu
                </span>
                <div className="flex gap-2">
                  <input
                    type="date"
                    min={todayStr}
                    value={campaignStartDate}
                    onChange={(e) => setCampaignStartDate(e.target.value)}
                    className="flex-[2] h-9 border border-slate-250 rounded-lg px-2 text-xs font-semibold outline-none focus:border-blue-500"
                  />
                  <select
                    value={campaignStartHour}
                    onChange={(e) => setCampaignStartHour(e.target.value)}
                    className="flex-1 h-9 border border-slate-250 bg-white rounded-lg px-1.5 text-xs font-semibold outline-none focus:border-blue-500"
                  >
                    {Array.from({ length: 24 }).map((_, i) => {
                      const val = String(i).padStart(2, "0");
                      return (
                        <option key={val} value={val}>
                          {val} giờ
                        </option>
                      );
                    })}
                  </select>
                  <select
                    value={campaignStartMinute}
                    onChange={(e) => setCampaignStartMinute(e.target.value)}
                    className="flex-1 h-9 border border-slate-250 bg-white rounded-lg px-1.5 text-xs font-semibold outline-none focus:border-blue-500"
                  >
                    {Array.from({ length: 60 }).map((_, i) => {
                      const val = String(i).padStart(2, "0");
                      return (
                        <option key={val} value={val}>
                          {val} phút
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="block text-xs font-bold text-slate-700 uppercase">
                  Thời gian kết thúc
                </span>
                <div className="flex gap-2">
                  <input
                    type="date"
                    min={campaignStartDate || todayStr}
                    value={campaignEndDate}
                    onChange={(e) => setCampaignEndDate(e.target.value)}
                    className="flex-[2] h-9 border border-slate-250 rounded-lg px-2 text-xs font-semibold outline-none focus:border-blue-500"
                  />
                  <select
                    value={campaignEndHour}
                    onChange={(e) => setCampaignEndHour(e.target.value)}
                    className="flex-1 h-9 border border-slate-250 bg-white rounded-lg px-1.5 text-xs font-semibold outline-none focus:border-blue-500"
                  >
                    {Array.from({ length: 24 }).map((_, i) => {
                      const val = String(i).padStart(2, "0");
                      return (
                        <option key={val} value={val}>
                          {val} giờ
                        </option>
                      );
                    })}
                  </select>
                  <select
                    value={campaignEndMinute}
                    onChange={(e) => setCampaignEndMinute(e.target.value)}
                    className="flex-1 h-9 border border-slate-250 bg-white rounded-lg px-1.5 text-xs font-semibold outline-none focus:border-blue-500"
                  >
                    {Array.from({ length: 60 }).map((_, i) => {
                      const val = String(i).padStart(2, "0");
                      return (
                        <option key={val} value={val}>
                          {val} phút
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Dụng cụ hỗ trợ cần thiết <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={campaignTools}
                onChange={(e) => setCampaignTools(e.target.value)}
                placeholder="Bao tay, xẻng, chổi..."
                className="w-full h-9 border border-slate-250 rounded-lg px-3 text-xs font-semibold outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Đơn vị đứng ra tổ chức <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={campaignOrganizer}
                onChange={(e) => setCampaignOrganizer(e.target.value)}
                className="w-full h-9 border border-slate-250 rounded-lg px-3 text-xs font-semibold outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCampaignModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={isCreatingCampaign}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {isCreatingCampaign ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Đang tạo...
                  </>
                ) : (
                  <>
                    <Plus size={14} /> Tạo chiến dịch
                  </>
                )}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Sub-component badges to keep code clean and modular
function PriorityBadge({ value }: { value?: string | null }) {
  const normalized = (value || "MEDIUM").toUpperCase();
  const info =
    normalized === "URGENT" || normalized === "CRITICAL"
      ? { label: "Mức độ: Khẩn cấp", className: "bg-rose-50 text-rose-700 border border-rose-200" }
      : normalized === "HIGH"
        ? {
            label: "Mức độ: Cao",
            className: "bg-rose-50 text-rose-700 border border-rose-200",
          }
        : normalized === "LOW"
          ? {
              label: "Mức độ: Thấp",
              className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
            }
          : {
              label: "Mức độ: Trung bình",
              className: "bg-amber-50 text-amber-700 border border-amber-200",
            };
  return (
    <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded-md ${info.className}`}>
      {info.label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const info = getOfficerStatusInfo(status);
  return (
    <span
      className={`inline-flex px-2.5 py-1 text-xs font-bold rounded-lg border ${info.className.replace("bg-", "bg-").replace("text-", "text-")} shadow-sm`}
    >
      {info.label}
    </span>
  );
}

function DetailField({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 p-2">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-0.5 break-words text-xs font-bold text-slate-800">{value ?? "-"}</p>
    </div>
  );
}

function isWardStaffCategory(value?: string | null) {
  const normalized = (value || "").toUpperCase();
  if (["URBAN_INFRASTRUCTURE", "ENVIRONMENT", "CONSTRUCTION"].includes(normalized)) {
    return true;
  }
  const text = normalized.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return text.includes("MOI TRUONG") || text.includes("XAY DUNG") || text.includes("HA TANG");
}

function isPoliceCategory(value?: string | null) {
  const normalized = (value || "").toUpperCase();
  if (["PUBLIC_SECURITY", "FIRE_SAFETY", "TRAFFIC"].includes(normalized)) {
    return true;
  }
  const text = normalized.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return text.includes("AN NINH") || text.includes("PCCC") || text.includes("GIAO THONG") || text.includes("CHAY NO");
}

function invalidateFeedbackSyncQueries(queryClient: QueryClient, feedbackId?: string | number) {
  void queryClient.invalidateQueries({ queryKey: ["feedbacks"] });
  if (feedbackId) {
    void queryClient.invalidateQueries({ queryKey: ["feedbacks", feedbackId] });
  }
  void queryClient.invalidateQueries({ queryKey: ["ward-staff-dashboard-statistics"] });
  void queryClient.invalidateQueries({ queryKey: ["notifications"] });
  void queryClient.invalidateQueries({ queryKey: ["campaigns"] });
}

function getOfficerStatusInfo(status: string) {
  const upper = (status || "").toUpperCase();
  if (upper === "RESOLVED") {
    return { label: "Đã xử lý", className: "bg-green-50 text-green-700 border-green-200" };
  }
  if (upper === "REJECTED") {
    return { label: "Từ chối xử lý", className: "bg-red-50 text-red-700 border-red-200" };
  }
  if (upper === "SUBMITTED") {
    return { label: "Đã gửi", className: "bg-slate-100 text-slate-700 border-slate-200" };
  }
  if (upper === "PENDING_RECEIVE") {
    return { label: "Chờ tiếp nhận", className: "bg-orange-50 text-orange-700 border-orange-200" };
  }
  if (upper === "WAITING_INFO" || upper === "NEED_MORE_INFO") {
    return {
      label: "Yêu cầu bổ sung thông tin",
      className: "bg-amber-50 text-amber-700 border-amber-200",
    };
  }
  if (upper === "TRANSFERRED") {
    return {
      label: "Đã chuyển xử lý",
      className: "bg-purple-50 text-purple-700 border-purple-200",
    };
  }
  if (upper === "PENDING") {
    return { label: "Đang chờ xử lý", className: "bg-sky-50 text-sky-700 border-sky-200" };
  }
  if (upper === "ASSIGNED") {
    return { label: "Đã phân công", className: "bg-teal-50 text-teal-700 border-teal-200" };
  }
  if (upper === "NEED_LOCATION_REVIEW") {
    return { label: "Cần xác minh vị trí", className: "bg-pink-50 text-pink-700 border-pink-200" };
  }
  if (upper === "PRE_EMPTIVE") {
    return { label: "Xử lý trước", className: "bg-violet-50 text-violet-700 border-violet-200" };
  }
  // Default for IN_PROGRESS and fallback
  return { label: "Đang xử lý", className: "bg-blue-50 text-blue-700 border-blue-200" };
}

function translatePriority(value?: string | null): string {
  const normalized = (value || "MEDIUM").toUpperCase();
  if (normalized === "URGENT" || normalized === "CRITICAL") return "Khẩn cấp";
  if (normalized === "HIGH") return "Cao";
  if (normalized === "LOW") return "Thấp";
  return "Trung bình";
}

function translateRole(role?: string | null): string {
  if (!role) return "";
  const upper = role.toUpperCase();
  switch (upper) {
    case "WARD_STAFF":
      return "Cán bộ phường";
    case "CITIZEN":
      return "Người dân";
    case "POLICE":
      return "Công an";
    case "SUPER_ADMIN":
      return "Quản trị viên";
    default:
      return role;
  }
}

function translateAction(action?: string | null): string {
  if (!action) return "";
  const upper = action.toUpperCase();
  switch (upper) {
    case "SUBMIT":
      return "Gửi phản ánh";
    case "UPDATE_STATUS":
      return "Cập nhật trạng thái";
    case "REQUEST_INFO":
      return "Yêu cầu bổ sung thông tin";
    case "REJECT":
      return "Từ chối xử lý";
    case "PROVIDE_INFO":
      return "Bổ sung thông tin";
    default:
      return action;
  }
}

function officialCategoryName(code: string) {
  switch (code) {
    case "URBAN_INFRASTRUCTURE":
      return "Hạ tầng đô thị";
    case "ENVIRONMENT":
      return "Môi trường";
    case "CONSTRUCTION":
      return "Xây dựng";
    case "TRAFFIC":
      return "Giao thông";
    case "PUBLIC_SECURITY":
      return "An ninh trật tự";
    case "FIRE_SAFETY":
      return "An toàn PCCC";
    default:
      return code || "Khác";
  }
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
