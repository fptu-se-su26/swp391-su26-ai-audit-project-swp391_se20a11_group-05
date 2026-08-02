import { clientOnly } from "@/components/ClientOnly";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  CircleDot,
  Clock,
  FileText,
  Image as ImageIcon,
  Loader2,
  MapPin,
  MessageSquareText,
  SearchX,
  Star,
  UserRound,
  Video,
  XCircle,
  Share2,
  Download,
  Bell,
  Trash2,
  Plus,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Shield,
  Users,
  Check,
  Map,
  Flag,
  CalendarDays,
  X,
  Camera,
  Send,
  ClipboardCheck,
  Search,
  HelpCircle,
  Wrench,
} from "lucide-react";
import { lazy, Suspense, useState, useMemo, useEffect, useRef } from "react";
import { EmptyState, ErrorState } from "@/components/site/EmptyState";
import { StatusBadge, getStatusLabel } from "@/components/site/StatusBadge";
import {
  usePublicFeedbackDetail,
  useFeedbackStatuses,
  useChangeFeedbackStatus,
  useSupplementFeedbackInfo,
  usePublicFeedbacks,
  useCancelFeedback,
} from "@/lib/hooks";
import { useI18n } from "@/lib/i18n";
import { useCreateCampaign } from "@/hooks/useCampaigns";
import { getCampaignByFeedbackId, onCampaignsChanged } from "@/lib/campaignStore";
import type { CampaignCategory } from "@/lib/campaignStore";
import {
  type FeedbackAttachmentResponse,
  type FeedbackLogResponse,
  type FeedbackStatus,
  getToken,
} from "@/lib/api";
import { mapStatus } from "@/lib/status";
import { Role } from "@/lib/roles";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

// Lazy load CivicMap to prevent SSR issues with Leaflet
const CivicMap = clientOnly(
  () => import("@/components/site/CivicMap").then((m) => ({ default: m.CivicMap })) as any,
) as any;

const API_BASE: string =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE) || "";

export const Route = createFileRoute("/my-reports/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Chi tiết phản ánh #${params.id} - Đà Nẵng Kết Nối` },
      { name: "description", content: `Chi tiết phản ánh #${params.id}.` },
    ],
  }),
  component: ReportDetail,
});

function ReportDetail() {
  const { id } = Route.useParams();
  const { locale, t } = useI18n();
  const isVi = locale === "vi";
  const { user } = useAuth();
  const { data: report, isLoading, isError, error, refetch } = usePublicFeedbackDetail(id);
  const canManageCampaignFromReport = user?.role === Role.WARD_STAFF;
  const isCancelledByCitizen = useMemo(() => {
    return (
      report?.timeline?.some((log: { action?: string | null }) => log.action === "CANCEL") || false
    );
  }, [report?.timeline]);

  // Fetch public feedbacks in the same ward to find similar/nearby reports
  const { data: nearbyFeedbacksData } = usePublicFeedbacks(
    0,
    15,
    {
      wardId: report?.wardId || undefined,
    },
    { enabled: !!report?.id && !!report?.wardId },
  );

  const similarFeedbacks = useMemo(() => {
    if (!nearbyFeedbacksData?.content || !report) return [];

    const otherFeedbacks = nearbyFeedbacksData.content.filter((item) => item.id !== report.id);

    // Sort so that feedbacks of the same category come first
    const sorted = [...otherFeedbacks].sort((a, b) => {
      const aSameCategory =
        (a.categoryCode || a.category) === (report.categoryCode || report.category);
      const bSameCategory =
        (b.categoryCode || b.category) === (report.categoryCode || report.category);
      if (aSameCategory && !bSameCategory) return -1;
      if (!aSameCategory && bSameCategory) return 1;
      return 0;
    });

    return sorted.slice(0, 3).map((item) => {
      // Calculate distance if coordinates are present
      let distStr = "200m";
      if (report.latitude && report.longitude && item.latitude && item.longitude) {
        const R = 6371e3; // metres
        const phi1 = (report.latitude * Math.PI) / 180;
        const phi2 = (item.latitude * Math.PI) / 180;
        const deltaPhi = ((item.latitude - report.latitude) * Math.PI) / 180;
        const deltaLambda = ((item.longitude - report.longitude) * Math.PI) / 180;

        const a =
          Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
          Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        const d = R * c; // in metres
        distStr = d < 1000 ? `${Math.round(d)}m` : `${(d / 1000).toFixed(1)}km`;
      } else {
        distStr = `${150 + (Math.abs(Number(item.id) - Number(report.id)) % 7) * 80}m`;
      }

      return {
        id: item.id,
        title: item.title,
        dist: distStr,
        status: item.status,
      };
    });
  }, [nearbyFeedbacksData?.content, report, report?.latitude, report?.longitude]);

  const changeStatusMutation = useChangeFeedbackStatus();
  const supplementMutation = useSupplementFeedbackInfo();
  const cancelMutation = useCancelFeedback();
  const { data: statuses = [] } = useFeedbackStatuses();
  const [selectedStatus, setSelectedStatus] = useState<FeedbackStatus | "">("");

  useEffect(() => {
    if (report) {
      setSelectedStatus(report.status);
    }
  }, [report?.status]);

  const handleUpdateStatus = () => {
    if (!report || !selectedStatus || selectedStatus === report.status) return;

    changeStatusMutation.mutate(
      {
        id: report.id,
        status: selectedStatus,
        note: isVi ? "Cập nhật trạng thái bởi Cán bộ Phường" : "Status updated by Ward Staff",
      },
      {
        onSuccess: () => {
          toast.success("Feedback status updated successfully.");
          refetch();
        },
        onError: (err) => {
          console.error(err);
          toast.error("Unable to update feedback status.");
          setSelectedStatus(report.status);
        },
      },
    );
  };

  // Local state for UI interactions
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [rating, setRating] = useState(4);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [isFollowing, setIsFollowing] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showAddInfoModal, setShowAddInfoModal] = useState(false);
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [supplementPhotos, setSupplementPhotos] = useState<File[]>([]);
  const [supplementPreviews, setSupplementPreviews] = useState<string[]>([]);
  const [supplementUploading, setSupplementUploading] = useState(false);
  const supplementPhotoInputRef = useRef<HTMLInputElement>(null);
  const [infoList, setInfoList] = useState<string[]>([]);

  // Campaign creation modal state
  const [showCreateCampaignModal, setShowCreateCampaignModal] = useState(false);
  const { submit: submitCampaign, isLoading: campaignSubmitting } = useCreateCampaign();
  const [campaignForm, setCampaignForm] = useState({
    title: "",
    description: "",
    locationText: "",
    maxParticipants: "",
    startTime: "",
    endTime: "",
    category: "environment" as CampaignCategory,
  });

  // Linked campaign — đọc từ store theo feedbackId, tự cập nhật khi store thay đổi
  const [linkedCampaign, setLinkedCampaign] = useState<null | {
    id: string;
    title: string;
    status: string;
    participants: number;
    progress: number;
  }>(null);

  // Đọc từ store ngay sau khi report load xong
  useEffect(() => {
    if (!report?.id) return;
    const found = getCampaignByFeedbackId(report.id);
    if (found) {
      setLinkedCampaign({
        id: found.id,
        title: found.name,
        status:
          found.status === "recruiting"
            ? isVi
              ? "Đang tuyển"
              : "Recruiting"
            : found.status === "completed"
              ? isVi
                ? "Đã hoàn thành"
                : "Completed"
              : isVi
                ? "Đang tiến hành"
                : "In Progress",
        participants: found.participants,
        progress: found.progress,
      });
    }

    // Subscribe để cập nhật khi store thay đổi (ngay sau khi tạo campaign)
    const unsub = onCampaignsChanged(() => {
      const updated = getCampaignByFeedbackId(report.id);
      if (updated) {
        setLinkedCampaign({
          id: updated.id,
          title: updated.name,
          status:
            updated.status === "recruiting"
              ? isVi
                ? "Đang tuyển"
                : "Recruiting"
              : updated.status === "completed"
                ? isVi
                  ? "Đã hoàn thành"
                  : "Completed"
                : isVi
                  ? "Đang tiến hành"
                  : "In Progress",
          participants: updated.participants,
          progress: updated.progress,
        });
      }
    });
    return unsub;
  }, [report?.id, isVi]);

  // Automatically reset image index when report changes
  useEffect(() => {
    setActiveImageIndex(0);
  }, [id]);

  const defaultImages = useMemo(
    () => [
      {
        id: "d1",
        fileUrl:
          "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=1000&q=80",
        fileType: "image/jpeg",
        fileName: "sidewalk_trash_1.jpg",
      },
      {
        id: "d2",
        fileUrl:
          "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=1000&q=80",
        fileType: "image/jpeg",
        fileName: "sidewalk_trash_2.jpg",
      },
      {
        id: "d3",
        fileUrl:
          "https://images.unsplash.com/photo-1605600611284-6f52f6d2780e?auto=format&fit=crop&w=1000&q=80",
        fileType: "image/jpeg",
        fileName: "sidewalk_trash_3.jpg",
      },
      {
        id: "d4",
        fileUrl:
          "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1000&q=80",
        fileType: "image/jpeg",
        fileName: "sidewalk_trash_4.jpg",
      },
      {
        id: "d5",
        fileUrl:
          "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=1000&q=80",
        fileType: "image/jpeg",
        fileName: "sidewalk_trash_5.jpg",
      },
    ],
    [],
  );

  const attachments = report?.attachments ?? [];

  const resolutionAttachments = useMemo(() => {
    return attachments.filter((a) => a.attachmentPurpose === "RESOLUTION_EVIDENCE");
  }, [attachments]);

  const galleryItems = useMemo(() => {
    const originalAttachments = attachments.filter(
      (a) => a.attachmentPurpose !== "RESOLUTION_EVIDENCE",
    );
    return originalAttachments.length > 0 ? originalAttachments : defaultImages;
  }, [attachments, defaultImages]);

  // Highlight steps according to status
  const currentStatusIndex = (() => {
    switch (report?.status as any) {
      case "PENDING":
      case "PENDING_RECEIVE":
      case "SUBMITTED":
        return 1;
      case "NEED_LOCATION_REVIEW":
      case "ASSIGNED":
        return 2;
      case "IN_PROGRESS":
        return 3;
      case "RESOLVED":
        return 4;
      case "CLOSED":
        return 6;
      default:
        return 3;
    }
  })();

  const staticTimelineSteps = useMemo(() => {
    const baseDate = report?.createdAt ? new Date(report.createdAt) : new Date();

    const addTime = (minutes: number) => {
      const d = new Date(baseDate.getTime() + minutes * 60 * 1000);
      return formatDateTime(d.toISOString(), locale);
    };

    return [
      {
        title: isVi ? "Đã tiếp nhận" : "Submitted",
        time: addTime(0),
        actor: isVi ? "Hệ thống" : "System",
        note: isVi
          ? "Phản ánh của bạn đã được hệ thống tiếp nhận."
          : "Your report has been received by the system.",
        tone: "completed" as const,
      },
      {
        title: isVi ? "Phường Hòa Xuân đã tiếp nhận" : "Authority Received",
        time: addTime(10),
        actor: `Lê Văn C (${isVi ? "Cán bộ Phường" : "Ward Officer"})`,
        note: isVi
          ? "Phản ánh đã được chuyển đến UBND phường Hòa Xuân."
          : "Report has been forwarded to Hoa Xuan Ward People's Committee.",
        tone: "completed" as const,
      },
      {
        title: isVi ? "Đã phân công xử lý" : "Assigned",
        time: addTime(75),
        actor: `Trần Thị B (${isVi ? "Cán bộ Phường" : "Ward Officer"})`,
        note: isVi
          ? "Phản ánh được phân công cho Tổ quản lý đô thị số 3."
          : "Assigned to Urban Management Team No. 3.",
        tone: "completed" as const,
      },
      {
        title: isVi ? "Đang xử lý" : "In Progress",
        time: addTime(2 * 24 * 60), // 2 days
        actor: `Nguyễn Văn D (${isVi ? "Cán bộ Phường" : "Ward Officer"})`,
        note: isVi
          ? "Đơn vị phụ trách đang xử lý hiện trường."
          : "Responsible unit is processing the site.",
        tone: currentStatusIndex >= 3 ? ("completed" as const) : ("pending" as const),
      },
      {
        title: isVi ? "Đã xử lý xong" : "Resolved",
        time: addTime(4 * 24 * 60), // 4 days
        actor: `Nguyễn Văn D (${isVi ? "Cán bộ Phường" : "Ward Officer"})`,
        note: isVi ? "Vấn đề đã được xử lý hoàn tất." : "The issue has been completely resolved.",
        tone: currentStatusIndex >= 4 ? ("completed" as const) : ("pending" as const),
      },
      {
        title: isVi ? "Chờ đánh giá của bạn" : "Waiting for Rating",
        time: addTime(4 * 24 * 60 + 5), // 4 days + 5 min
        actor: isVi ? "Hệ thống" : "System",
        note: isVi ? "Mời bạn đánh giá kết quả xử lý." : "Please rate the processing result.",
        tone: currentStatusIndex >= 5 ? ("completed" as const) : ("pending" as const),
      },
      {
        title: isVi ? "Đã đóng" : "Closed",
        time: addTime(4 * 24 * 60 + 10), // 4 days + 10 min
        actor: isVi ? "Hệ thống" : "System",
        note: isVi
          ? "Cảm ơn bạn đã phản ánh. Báo cáo đã được đóng."
          : "Thank you for reporting. The report is closed.",
        tone: currentStatusIndex >= 6 ? ("completed" as const) : ("pending" as const),
      },
    ];
  }, [report?.createdAt, locale, isVi, currentStatusIndex]);

  const slaInfo = useMemo(() => {
    if (!report?.createdAt) {
      return {
        targetDateStr: "N/A",
        remainingStr: "N/A",
        durationStr: isVi ? "4 ngày" : "4 days",
        isOverdue: false,
        statusText: isVi ? "Đang tiến hành đúng hạn" : "On schedule",
        statusColor: "text-slate-400",
      };
    }

    const created = new Date(report.createdAt);
    const durationDays = 4;
    const target = new Date(created.getTime() + durationDays * 24 * 60 * 60 * 1000);

    const targetDateStr = new Intl.DateTimeFormat(isVi ? "vi-VN" : "en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(target);

    const now = new Date();
    const isCompleted = report?.status === "RESOLVED" || (report?.status as string) === "CLOSED";

    if (isCompleted) {
      const resolvedAtDate = report.resolvedAt ? new Date(report.resolvedAt) : now;
      const isMetSLA = resolvedAtDate.getTime() <= target.getTime();
      return {
        targetDateStr,
        remainingStr: isVi ? "Đã xử lý xong" : "Processed",
        durationStr: isVi ? `${durationDays} ngày` : `${durationDays} days`,
        isOverdue: !isMetSLA,
        statusText: isMetSLA
          ? isVi
            ? "Hoàn thành đúng hạn"
            : "Completed on time"
          : isVi
            ? "Hoàn thành quá hạn"
            : "Completed late",
        statusColor: isMetSLA ? "text-emerald-500" : "text-rose-500",
      };
    }

    const diffMs = target.getTime() - now.getTime();
    const isOverdue = diffMs < 0;

    if (isOverdue) {
      const absDiff = Math.abs(diffMs);
      const diffDays = Math.floor(absDiff / (24 * 60 * 60 * 1000));
      const diffHours = Math.floor((absDiff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
      const remainingStr = isVi
        ? `Trễ ${diffDays} ngày ${diffHours} giờ`
        : `${diffDays}d ${diffHours}h late`;
      return {
        targetDateStr,
        remainingStr,
        durationStr: isVi ? `${durationDays} ngày` : `${durationDays} days`,
        isOverdue,
        statusText: isVi ? "Đã quá hạn xử lý!" : "Overdue!",
        statusColor: "text-rose-500 font-extrabold animate-pulse",
      };
    } else {
      const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
      const diffHours = Math.floor((diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
      const remainingStr = isVi
        ? `${diffDays} ngày ${diffHours} giờ`
        : `${diffDays}d ${diffHours}h`;
      return {
        targetDateStr,
        remainingStr,
        durationStr: isVi ? `${durationDays} ngày` : `${durationDays} days`,
        isOverdue,
        statusText: isVi ? "Đang tiến hành đúng hạn" : "On schedule",
        statusColor: "text-emerald-500",
      };
    }
  }, [report?.createdAt, report?.status, report?.resolvedAt, isVi]);

  if (isLoading) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-16 min-h-[60vh] grid place-items-center">
        <div className="flex flex-col items-center gap-4 text-[#0B4FC4]">
          <Loader2 className="animate-spin text-[#0B4FC4]" size={36} />
          <span className="font-semibold text-slate-600 text-sm">
            {locale === "vi" ? "Đang tải thông tin chi tiết..." : "Loading report details..."}
          </span>
        </div>
      </div>
    );
  }

  if (isError || !report) {
    return (
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-12">
        <ErrorState
          message={
            error instanceof Error
              ? error.message
              : locale === "vi"
                ? "Không tìm thấy thông tin phản ánh này."
                : "Report not found or permission denied."
          }
          onRetry={() => refetch()}
        />
        <div className="flex justify-center mt-6">
          <Link to="/my-reports" search={{ q: "" }} className="btn-civic btn-civic-ghost">
            <ArrowLeft size={18} />
            {locale === "vi" ? "Quay lại danh sách" : "Back to list"}
          </Link>
        </div>
      </div>
    );
  }

  const statusInfo = mapStatus(report.status);
  const mockCode = report.trackingCode || report.code || `#DN-2026-0615-${report.id}`;

  // 1. Breadcrumbs helper
  const breadcrumbs = [
    { label: isVi ? "Trang chủ" : "Home", path: "/" },
    { label: isVi ? "Báo cáo của tôi" : "My Reports", path: "/my-reports" },
    { label: isVi ? "Chi tiết phản ánh" : "Report Detail", path: undefined },
  ];

  // 3. Map details
  const reportLat = report.latitude || 16.0544;
  const reportLng = report.longitude || 108.2022;
  const mapCenter: [number, number] = [reportLat, reportLng];

  const mapMarkers = [
    {
      position: mapCenter,
      title: report.title,
      description: report.description || report.content,
      status: report.status,
    },
  ];

  // 4. Processing Timeline (preserves dynamic logs and enriches them with photos/details)
  const dynamicTimeline = buildTimeline(report.timeline ?? [], report.status, locale);

  // Merge database logs if present, otherwise use realistic timeline from the screenshot
  const timelineSteps = (() => {
    if (report.timeline && report.timeline.length > 0) {
      // Convert database timeline log to our display format
      return dynamicTimeline.map((item, idx) => {
        // Find if we have predefined images or metadata for matching statuses
        const matchingStatic = staticTimelineSteps.find(
          (s) => s.title.toLowerCase() === item.title.toLowerCase(),
        );
        const isResolvedStep =
          item.title === "Đã xử lý xong" ||
          item.title === "Resolved" ||
          item.title === "Đã giải quyết" ||
          item.title.toLowerCase().includes("resolve");
        const isProvideInfoStep =
          item.action === "PROVIDE_INFO" ||
          item.title === "Bổ sung thông tin" ||
          item.title === "Provided info";

        const stepImages =
          isResolvedStep && resolutionAttachments.length > 0
            ? resolutionAttachments.map((a) => a.fileUrl)
            : isProvideInfoStep
              ? attachments
                  .filter((a) => {
                    if (a.attachmentPurpose !== "SUPPLEMENTARY_EVIDENCE") return false;
                    const logTime = new Date(item.createdAt || "").getTime();
                    const uploadTime = new Date(a.uploadedAt || "").getTime();
                    return Math.abs(uploadTime - logTime) < 60000; // within 1 minute
                  })
                  .map((a) => a.fileUrl)
              : undefined;

        let actorText = item.actorName || item.authorityName || (isVi ? "Cán bộ" : "Officer");
        if (item.actorName) {
          const r = (item.actorRole || "").toUpperCase();
          if (r === "CITIZEN") {
            actorText = `${item.actorName} (${isVi ? "Người dân" : "Citizen"})`;
          } else if (r === "WARD_STAFF") {
            actorText = `${item.actorName} (${isVi ? "Cán bộ Phường" : "Ward Officer"})`;
          } else if (r === "POLICE_OFFICER") {
            actorText = `${item.actorName} (${isVi ? "Công an" : "Police"})`;
          } else {
            actorText = `${item.actorName} (${isVi ? "Cán bộ" : "Officer"})`;
          }
        }

        return {
          title: item.title,
          time: item.createdAt ? formatDateTime(item.createdAt, locale) : "N/A",
          actor: actorText,
          note: translateNote(item.note, isVi),
          tone: item.tone,
          images: stepImages,
        };
      });
    }
    return staticTimelineSteps.map((s) => {
      const isResolvedStep = s.title === "Đã xử lý xong" || s.title === "Resolved";
      return {
        ...s,
        images:
          isResolvedStep && resolutionAttachments.length > 0
            ? resolutionAttachments.map((a) => a.fileUrl)
            : undefined,
      };
    });
  })();

  // 5. Processing History logs (condensed decision list in sidebar)
  const historyEvents = (() => {
    if (report.timeline && report.timeline.length > 0) {
      return report.timeline.map((log) => {
        let roleSuffix = "";
        if (log.actorName || log.actionByName) {
          const r = (log.actorRole || "").toUpperCase();
          if (r === "CITIZEN") {
            roleSuffix = ` (${isVi ? "Người dân" : "Citizen"})`;
          } else if (r === "WARD_STAFF") {
            roleSuffix = ` (${isVi ? "Cán bộ Phường" : "Ward Officer"})`;
          } else if (r === "POLICE_OFFICER") {
            roleSuffix = ` (${isVi ? "Công an" : "Police"})`;
          } else {
            roleSuffix = ` (${isVi ? "Cán bộ" : "Officer"})`;
          }
        }
        return {
          time: formatDateTime(log.createdAt, locale),
          text: log.title || statusTitle(log.status || log.newStatus, locale),
          actor:
            log.actorName || log.actionByName
              ? `${log.actorName || log.actionByName}${roleSuffix}`
              : isVi
                ? "Hệ thống"
                : "System",
        };
      });
    }

    const baseDate = report.createdAt ? new Date(report.createdAt) : new Date();
    const addTime = (minutes: number) => {
      const d = new Date(baseDate.getTime() + minutes * 60 * 1000);
      return formatDateTime(d.toISOString(), locale);
    };

    return [
      {
        time: addTime(10),
        text: isVi ? "Tiếp nhận bởi UBND phường Hòa Xuân" : "Received by Hoa Xuan Ward",
        actor: `Lê Văn C (${isVi ? "Cán bộ Phường" : "Ward Officer"})`,
      },
      {
        time: addTime(75),
        text: isVi ? "Phân công cho Tổ quản lý đô thị số 3" : "Assigned to Urban Management Team 3",
        actor: `Trần Thị B (${isVi ? "Cán bộ Phường" : "Ward Officer"})`,
      },
      {
        time: addTime(2 * 24 * 60),
        text: isVi ? "Cập nhật: Đang xử lý" : "Status: In Progress",
        actor: `Nguyễn Văn D (${isVi ? "Cán bộ Phường" : "Ward Officer"})`,
      },
      {
        time: addTime(4 * 24 * 60),
        text: isVi ? "Cập nhật: Đã xử lý xong" : "Status: Resolved",
        actor: `Nguyễn Văn D (${isVi ? "Cán bộ Phường" : "Ward Officer"})`,
      },
    ];
  })();

  // 6. SLA status details & dynamic calculations
  const slaPercentage = (() => {
    switch (report.status as any) {
      case "RESOLVED":
      case "CLOSED":
        return 100;
      case "IN_PROGRESS":
        return 80;
      case "ASSIGNED":
        return 40;
      case "PENDING":
      case "PENDING_RECEIVE":
      case "SUBMITTED":
        return 15;
      default:
        return 80;
    }
  })();

  // Rating stars subtext
  const ratingTexts = [
    isVi ? "Rất không hài lòng" : "Very dissatisfied",
    isVi ? "Không hài lòng" : "Dissatisfied",
    isVi ? "Bình thường" : "Neutral",
    isVi ? "Hài lòng" : "Satisfied",
    isVi ? "Rất hài lòng" : "Very satisfied",
  ];

  // Quick action triggers
  const handleFollowProgress = () => {
    setIsFollowing(!isFollowing);
    toast.success(
      isFollowing
        ? isVi
          ? "Đã hủy theo dõi phản ánh này."
          : "Unfollowed this report."
        : isVi
          ? "Đã bật theo dõi tiến trình phản ánh!"
          : "Followed report progress successfully!",
    );
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast.success(
        isVi ? "Đã sao chép liên kết phản ánh vào bộ nhớ tạm!" : "Report link copied to clipboard!",
      );
    }
  };

  const handleDownloadPDF = () => {
    toast.loading(isVi ? "Đang xuất bản PDF..." : "Exporting PDF...", { duration: 1500 });
    setTimeout(() => {
      if (typeof window !== "undefined") {
        window.print();
      }
    }, 1500);
  };

  const handleCancelRequest = async () => {
    if (!report?.id) return;
    setShowCancelModal(false);

    const loadingToast = toast.loading(
      isVi ? "Đang gửi yêu cầu hủy..." : "Sending cancel request...",
    );
    try {
      await cancelMutation.mutateAsync(report.id);
      toast.dismiss(loadingToast);
      toast.success(isVi ? "Đã hủy phản ánh thành công!" : "Report cancelled successfully!");
    } catch (err: any) {
      toast.dismiss(loadingToast);
      toast.error(
        isVi ? err.message || "Lỗi khi hủy phản ánh." : err.message || "Error cancelling report.",
      );
    }
  };

  const handleSupplementPhotoSelected = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files);
    const validFiles = newFiles.filter((file) => {
      const validType = file.type.startsWith("image/");
      const validSize = file.size <= 10 * 1024 * 1024;

      if (!validType) {
        toast.error(
          isVi ? `${file.name} không phải file ảnh.` : `${file.name} is not an image file.`,
        );
      }
      if (!validSize) {
        toast.error(isVi ? `${file.name} vượt quá 10MB.` : `${file.name} exceeds 10MB.`);
      }

      return validType && validSize;
    });

    const availableSlots = Math.max(0, 5 - supplementPhotos.length);
    const acceptedFiles = validFiles.slice(0, availableSlots);
    if (validFiles.length > availableSlots) {
      toast.error(
        isVi
          ? "Chỉ được upload tối đa 5 ảnh bổ sung."
          : "Only up to 5 supplemental images can be uploaded.",
      );
    }

    setSupplementPhotos((prev) => [...prev, ...acceptedFiles]);
    acceptedFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSupplementPreviews((prev) => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
    if (supplementPhotoInputRef.current) supplementPhotoInputRef.current.value = "";
  };

  const removeSupplementPhoto = (idx: number) => {
    setSupplementPhotos((prev) => prev.filter((_, i) => i !== idx));
    setSupplementPreviews((prev) => prev.filter((_, i) => i !== idx));
    if (supplementPhotoInputRef.current) supplementPhotoInputRef.current.value = "";
  };

  const handleAddInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!report) return;
    if (!additionalInfo.trim() && supplementPhotos.length === 0) {
      toast.error(
        isVi
          ? "Vui lòng nhập nội dung hoặc chọn ít nhất một hình ảnh."
          : "Please enter content or select at least one image.",
      );
      return;
    }

    setSupplementUploading(true);
    try {
      // 1. Upload files first if there are any
      const imageUrls: string[] = [];
      const token = getToken();

      for (const file of supplementPhotos) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(`${API_BASE}/api/files/upload?folder=feedback/${id}`, {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });

        const data = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(data?.message || data?.error || `Upload ${file.name} failed`);
        }
        imageUrls.push(data.fileUrl);
      }

      // 2. Call supplement API
      await supplementMutation.mutateAsync({
        id: report.id,
        content: additionalInfo.trim() || undefined,
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      });

      // 3. Clear states
      setAdditionalInfo("");
      setSupplementPhotos([]);
      setSupplementPreviews([]);
      setShowAddInfoModal(false);
      toast.success(
        isVi ? "Bổ sung thông tin thành công!" : "Additional information submitted successfully!",
      );
      refetch();
    } catch (err: any) {
      console.error(err);
      toast.error(
        isVi
          ? err.message || "Không thể bổ sung thông tin."
          : err.message || "Unable to submit additional information.",
      );
    } finally {
      setSupplementUploading(false);
    }
  };

  const handleCreateCampaignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageCampaignFromReport) {
      toast.error(
        isVi
          ? "Chỉ cán bộ phường mới được tạo chiến dịch từ phản ánh."
          : "Only ward staff can create campaigns from reports.",
      );
      setShowCreateCampaignModal(false);
      return;
    }
    if (!campaignForm.title.trim() || !campaignForm.description.trim()) return;

    submitCampaign({
      title: campaignForm.title,
      description: campaignForm.description,
      category: campaignForm.category,
      locationText: campaignForm.locationText,
      maxParticipants: campaignForm.maxParticipants,
      startTime: campaignForm.startTime,
      endTime: campaignForm.endTime,
      linkedFeedbackId: report?.id,
      linkedFeedbackCode: report?.trackingCode,
      linkedFeedbackTitle: report?.title,
      wardId: user?.wardId ?? undefined,
      wardName: report?.wardName ?? undefined,
      latitude: report?.latitude ?? undefined,
      longitude: report?.longitude ?? undefined,
    }).then(() => {
      setShowCreateCampaignModal(false);
      // linkedCampaign sẽ tự cập nhật qua useEffect + onCampaignsChanged
      setCampaignForm({
        title: "",
        description: "",
        locationText: "",
        maxParticipants: "",
        startTime: "",
        endTime: "",
        category: "environment",
      });
      toast.success(
        isVi
          ? "🎉 Chiến dịch đã được tạo! Bạn có thể xem trong trang Chiến dịch."
          : "🎉 Campaign created! You can view it on the Campaigns page.",
      );
    });
  };

  const handleRatingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRatingSubmitted(true);
    toast.success(
      isVi ? "Cảm ơn bạn đã đánh giá chất lượng dịch vụ!" : "Thank you for rating our service!",
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 pt-8">
        {/* Title and Header Banner */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl md:text-4xl font-extrabold text-[#0B2545]">
              {isVi ? "Chi tiết phản ánh" : "Report Detail"}
            </h1>
            <p className="text-slate-500 text-sm font-semibold mt-1">
              {isVi
                ? "Cổng phản ánh chính thức thành phố Đà Nẵng"
                : "Official reporting portal of Da Nang city"}
            </p>
          </div>
        </div>

        {/* ── REJECTED Banner ── */}
        {report.status === "REJECTED" && user && user.id === report.citizenId && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-5 flex flex-col sm:flex-row sm:items-start gap-4 animate-fade-in">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 grid place-items-center">
              <XCircle size={26} className="text-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-red-700 text-base mb-1">
                {locale === "vi" ? "Phản ánh chưa được tiếp nhận" : "Report not accepted"}
              </p>
              <p className="text-sm text-red-600 leading-relaxed">
                {report.rejectionReason ||
                  (locale === "vi"
                    ? "Phản ánh của bạn chưa đáp ứng yêu cầu xét duyệt. Vui lòng xem lý do bên dưới và gửi lại."
                    : "Your report did not meet the review requirements. Please check the reason below and resubmit.")}
              </p>
              <Link
                to="/report"
                state={
                  {
                    initialTitle: report.title,
                    initialDescription: (report as any).content || report.description,
                    initialCategoryCode: report.categoryCode || report.category,
                    initialLatitude: report.latitude,
                    initialLongitude: report.longitude,
                    initialAddressDetails: report.addressDetails,
                    initialAttachments: (report.attachments ?? [])
                      .filter((a: any) => a.attachmentPurpose !== "RESOLUTION_EVIDENCE")
                      .map((a: any) => ({
                        fileUrl: a.fileUrl,
                        fileName: a.fileName,
                        fileType: a.fileType,
                      })),
                  } as any
                }
                className="inline-flex items-center gap-2 mt-3 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 transition-colors"
              >
                ↩ {locale === "vi" ? "Gửi lại phản ánh" : "Resubmit report"}
              </Link>
            </div>
          </div>
        )}

        {/* ── RESOLVED Banner ── */}
        {report.status === "RESOLVED" && (
          <div className="mb-5 rounded-2xl border border-green-200 bg-green-50 p-5 flex flex-col sm:flex-row sm:items-start gap-4 animate-fade-in">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-100 grid place-items-center">
              <CheckCircle2 size={26} className="text-green-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-green-700 text-base mb-1">
                {locale === "vi" ? "Phản ánh đã được xử lý hoàn tất" : "Report has been resolved"}
              </p>
              <p className="text-sm text-green-600 leading-relaxed whitespace-pre-wrap">
                {report.resultContent ||
                  (locale === "vi"
                    ? "Phản ánh của bạn đã được cơ quan chức năng xử lý hoàn tất."
                    : "Your report has been completely resolved by the authorities.")}
              </p>
            </div>
          </div>
        )}

        {/* 3. Report Overview Card */}
        <div className="bg-white rounded-[20px] border border-[#E2E8F0] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] mb-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            {/* ID */}
            <div className="flex flex-col gap-1.5 md:px-2 pt-4 md:pt-0 border-t border-slate-100 md:border-t-0 first:border-t-0">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                {isVi ? "Mã phản ánh" : "Report ID"}
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-slate-800 break-all">
                  {mockCode}
                </span>
              </div>
            </div>
            {/* Category */}
            <div className="flex flex-col gap-1.5 md:pl-6 pt-4 md:pt-0">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                {isVi ? "Danh mục" : "Category"}
              </span>
              <span className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                <Shield size={14} className="text-[#0B4FC4]" />
                {report.categoryName ||
                  report.category ||
                  (isVi ? "Môi trường - Rác thải" : "Environment - Waste")}
              </span>
            </div>
            {/* Current Status */}
            <div className="flex flex-col gap-1.5 md:pl-6 pt-4 md:pt-0">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                {isVi ? "Trạng thái hiện tại" : "Current Status"}
              </span>
              {user?.role === Role.WARD_STAFF ? (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-1">
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as FeedbackStatus)}
                    disabled={changeStatusMutation.isPending}
                    className="min-h-[36px] px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700 outline-none focus:border-[#0B4FC4] cursor-pointer"
                  >
                    {statuses.length === 0 ? (
                      <option value={report.status}>
                        {getStatusLabel(report.status as any, locale)}
                      </option>
                    ) : (
                      statuses.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {getStatusLabel(opt.value as any, locale)}
                        </option>
                      ))
                    )}
                  </select>
                  <button
                    onClick={handleUpdateStatus}
                    disabled={selectedStatus === report.status || changeStatusMutation.isPending}
                    className="min-h-[36px] px-3 bg-[#0B4FC4] hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {changeStatusMutation.isPending && (
                      <Loader2 className="animate-spin" size={12} />
                    )}
                    {isVi ? "Cập nhật" : "Update"}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {isCancelledByCitizen ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full tracking-wide bg-slate-100 text-slate-600 border border-slate-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      {isVi ? "Đã hủy" : "Cancelled"}
                    </span>
                  ) : (
                    <StatusBadge status={statusInfo} />
                  )}
                </div>
              )}
            </div>
            {/* Priority */}
            <div className="flex flex-col gap-1.5 md:pl-6 pt-4 md:pt-0">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                {isVi ? "Mức độ ưu tiên" : "Priority"}
              </span>
              <span className="text-sm font-extrabold text-amber-600 flex items-center gap-1.5">
                <AlertTriangle size={14} />
                {isVi ? "Trung bình" : "Medium"}
              </span>
            </div>
            {/* Submission Time */}
            <div className="flex flex-col gap-1.5 md:pl-6 pt-4 md:pt-0">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                {isVi ? "Thời gian gửi" : "Submission Time"}
              </span>
              <span className="text-sm font-semibold text-slate-700">
                {formatDateTime(report.createdAt, locale)}
              </span>
            </div>
          </div>
        </div>

        {/* main container */}
        <div className="grid lg:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.85fr)] gap-8 items-start">
          {/* left column */}
          <div className="space-y-8">
            {/* 4. Media Section & Map Section side-by-side on desktop */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Media Card */}
              <div className="bg-white rounded-[20px] border border-[#E2E8F0] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col justify-between min-h-[380px]">
                <div>
                  <h3 className="flex items-center gap-2 text-base font-extrabold text-[#0B2545] border-b border-slate-50 pb-3 mb-4">
                    <ImageIcon size={18} className="text-[#0B4FC4]" />
                    {isVi ? "Hình ảnh / Video" : "Media Attachment"}
                  </h3>

                  <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-100 group shadow-inner">
                    {/* Active media rendering */}
                    {isVideoAttachment(galleryItems[activeImageIndex]) ? (
                      <video
                        src={galleryItems[activeImageIndex].fileUrl}
                        className="w-full h-full object-contain"
                        controls
                        muted
                        preload="metadata"
                      />
                    ) : (
                      <img
                        src={galleryItems[activeImageIndex].fileUrl}
                        alt={galleryItems[activeImageIndex].fileName || "Report Attachment"}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    )}

                    {/* Navigation overlay */}
                    {galleryItems.length > 1 && (
                      <>
                        <button
                          onClick={() =>
                            setActiveImageIndex((prev) =>
                              prev === 0 ? galleryItems.length - 1 : prev - 1,
                            )
                          }
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 shadow cursor-pointer"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <button
                          onClick={() =>
                            setActiveImageIndex((prev) =>
                              prev === galleryItems.length - 1 ? 0 : prev + 1,
                            )
                          }
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 shadow cursor-pointer"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </>
                    )}

                    {/* Slide counter badge */}
                    <span className="absolute right-3.5 bottom-3.5 px-2.5 py-1 bg-black/75 backdrop-blur-sm text-white text-[10px] font-extrabold rounded-full shadow-sm">
                      {activeImageIndex + 1}/{galleryItems.length}
                    </span>
                  </div>
                </div>

                {/* Thumbnails list */}
                {galleryItems.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pt-4 scrollbar-hide">
                    {galleryItems.map((item, idx) => {
                      const isActive = idx === activeImageIndex;
                      return (
                        <button
                          key={item.id || idx}
                          onClick={() => setActiveImageIndex(idx)}
                          className={`relative w-[60px] h-[45px] rounded-md overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                            isActive
                              ? "border-[#0B4FC4] scale-95 shadow-sm"
                              : "border-slate-200 hover:border-slate-300 opacity-70"
                          }`}
                        >
                          {isVideoAttachment(item) ? (
                            <div className="w-full h-full bg-slate-800 flex items-center justify-center text-white relative">
                              <Video size={12} className="relative z-10" />
                              <div className="absolute inset-0 bg-black/20" />
                            </div>
                          ) : (
                            <img
                              src={item.fileUrl}
                              className="w-full h-full object-cover"
                              alt="Thumb"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Map Card (MAJOR IMPROVEMENT A: Larger Map, Google Tiles, Boundary & Markers) */}
              <div className="bg-white rounded-[20px] border border-[#E2E8F0] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col justify-between min-h-[380px]">
                <div>
                  <h3 className="flex items-center gap-2 text-base font-extrabold text-[#0B2545] border-b border-slate-50 pb-3 mb-4">
                    <Map size={18} className="text-[#0B4FC4]" />
                    {isVi ? "Bản đồ vị trí sự cố" : "Incident Map Location"}
                  </h3>

                  <div className="relative z-0 rounded-xl overflow-hidden border border-slate-100 flex-1 h-[240px] md:h-[260px] shadow-sm">
                    <Suspense
                      fallback={
                        <div className="w-full h-full bg-slate-50 animate-pulse flex items-center justify-center text-slate-400 text-xs font-semibold">
                          {isVi ? "Đang tải bản đồ..." : "Loading Map..."}
                        </div>
                      }
                    >
                      <CivicMap
                        center={mapCenter}
                        zoom={15}
                        markers={mapMarkers}
                        height="100%"
                        showBoundary={true}
                        boundaryRadius={450}
                      />
                    </Suspense>
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${reportLat},${reportLng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-extrabold text-[#0B4FC4] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {isVi ? "Xem trên Google Maps" : "View on Google Maps"}
                    <ArrowLeft size={12} className="rotate-180" />
                  </a>
                </div>
              </div>
            </div>

            {/* 6. Citizen Description */}
            <div className="bg-white rounded-[20px] border border-[#E2E8F0] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
              <h3 className="text-base font-extrabold text-[#0B2545] border-b border-slate-50 pb-3 mb-4">
                {isVi ? "Mô tả phản ánh của người dân" : "Citizen Description"}
              </h3>
              <div className="text-slate-700 leading-relaxed font-medium bg-slate-50/50 border border-slate-100/50 p-4 rounded-xl text-sm md:text-base">
                <p className="whitespace-pre-wrap">{report.description || report.content}</p>
              </div>

              {/* Render additional info if any */}
              {infoList.length > 0 && (
                <div className="mt-4 pt-4 border-t border-dashed border-slate-200">
                  <h4 className="text-xs font-bold text-[#0B4FC4] uppercase tracking-wider mb-2">
                    {isVi ? "Thông tin bổ sung từ công dân" : "Additional Citizen Information"}
                  </h4>
                  <div className="space-y-2.5">
                    {infoList.map((info, idx) => (
                      <div
                        key={idx}
                        className="bg-blue-50/40 border border-blue-100 p-3 rounded-lg text-xs md:text-sm text-slate-700 font-medium"
                      >
                        {info}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 7. Processing Timeline */}
            <div className="bg-white rounded-[20px] border border-[#E2E8F0] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
              <h3 className="text-base font-extrabold text-[#0B2545] border-b border-slate-50 pb-3 mb-6">
                {isVi ? "Tiến trình xử lý" : "Processing Timeline"}
              </h3>

              <div className="relative pl-6 sm:pl-8">
                <ul className="space-y-8 relative">
                  {timelineSteps.map((step, index) => {
                    const isCompleted = step.tone === "completed";
                    const isRejected = step.tone === "rejected";
                    const isActive =
                      isCompleted &&
                      (index === timelineSteps.length - 1 ||
                        timelineSteps[index + 1].tone === "pending");

                    const StepIcon = getTimelineStepIcon(step.title);

                    return (
                      <li key={index} className="relative group">
                        {/* Connector Line Segment between steps */}
                        {index < timelineSteps.length - 1 && (
                          <div
                            className={`absolute left-[-14.5px] sm:left-[-17.5px] top-8 sm:top-10 bottom-[-36px] w-0.5 z-0 ${
                              isCompleted && timelineSteps[index + 1].tone === "completed"
                                ? "bg-gradient-to-b from-emerald-500 to-green-500"
                                : "bg-slate-200"
                            }`}
                          />
                        )}

                        {/* Timeline Bullet Node */}
                        <div
                          className={`absolute -left-[28px] sm:-left-[35px] top-1.5 w-7 h-7 sm:w-9 sm:h-9 rounded-full border-2 border-white shadow flex items-center justify-center z-10 transition-all ${
                            isCompleted
                              ? isActive
                                ? "bg-[#0B4FC4] text-white ring-4 ring-blue-100/70"
                                : "bg-[#22C55E] text-white shadow-[0_3px_8px_rgba(34,197,94,0.25)]"
                              : isRejected
                                ? "bg-[#EF4444] text-white shadow-[0_3px_8px_rgba(239,68,68,0.25)]"
                                : "bg-slate-50 text-slate-400 border border-slate-200 shadow-inner"
                          }`}
                        >
                          <StepIcon size={13} className="sm:w-4 sm:h-4 stroke-[2.5]" />
                        </div>

                        {/* Card panel */}
                        <div
                          className={`rounded-2xl border p-5 transition-all duration-200 ${
                            isActive
                              ? "bg-blue-50/20 border-[#BFDBFE] shadow-sm"
                              : isCompleted
                                ? "bg-white border-slate-100"
                                : isRejected
                                  ? "bg-red-50/10 border-red-200 shadow-sm"
                                  : "bg-slate-50/50 border-slate-100 opacity-60"
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-50 pb-2 mb-3">
                            <h4
                              className={`text-sm font-extrabold ${
                                isActive
                                  ? "text-[#0B4FC4]"
                                  : isCompleted
                                    ? "text-slate-800"
                                    : isRejected
                                      ? "text-red-600"
                                      : "text-slate-400"
                              }`}
                            >
                              {step.title}
                            </h4>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                              <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                                {step.actor}
                              </span>
                              <span>{step.time}</span>
                            </div>
                          </div>

                          <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                            {step.note}
                          </p>

                          {/* Large inline images if present */}
                          {step.images && step.images.length > 0 && (
                            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {step.images.map((imgUrl: string, imgIdx: number) => (
                                <a
                                  key={imgIdx}
                                  href={imgUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="group relative aspect-video rounded-xl overflow-hidden border border-slate-150 shadow-sm transition-all duration-200 hover:shadow"
                                >
                                  <img
                                    src={imgUrl}
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    alt="Process progress"
                                  />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center">
                                    <span className="bg-black/70 backdrop-blur-sm text-white px-2.5 py-1 text-[9px] font-bold rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                                      {isVi ? "Xem ảnh" : "Zoom"}
                                    </span>
                                  </div>
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>

          {/* right column (sidebar) */}
          <div className="space-y-6">
            {/* 5. Report Information Card */}
            <div className="bg-white rounded-[20px] border border-[#E2E8F0] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
              <h3 className="flex items-center gap-2 text-sm font-extrabold text-[#0B2545] border-b border-slate-50 pb-3 mb-3">
                <FileText size={16} className="text-[#0B4FC4]" />
                {isVi ? "Thông tin phản ánh" : "Report Information"}
              </h3>

              <div className="divide-y divide-slate-100">
                <DetailRow
                  icon={FileText}
                  label={isVi ? "Mã phản ánh" : "Report ID"}
                  value={mockCode}
                />
                <DetailRow
                  icon={Shield}
                  label={isVi ? "Danh mục" : "Category"}
                  value={report.categoryName || report.category}
                />
                <DetailRow
                  icon={MapPin}
                  label={isVi ? "Phường/Xã phụ trách" : "Responsible Ward"}
                  value={report.wardName || (isVi ? "Hòa Xuân" : "Hoa Xuan")}
                />
                <DetailRow
                  icon={MapPin}
                  label={isVi ? "Tọa độ" : "Coordinates"}
                  value={`${reportLat.toFixed(5)}° N, ${reportLng.toFixed(5)}° E`}
                />
                <DetailRow
                  icon={MapPin}
                  label={isVi ? "Địa chỉ" : "Address"}
                  value={
                    report.address ||
                    report.addressDetails ||
                    (isVi
                      ? "15 Nguyễn Văn Linh, Hòa Xuân, Đà Nẵng"
                      : "15 Nguyen Van Linh, Hoa Xuan, Da Nang")
                  }
                />
                <DetailRow
                  icon={UserRound}
                  label={isVi ? "Đơn vị phụ trách" : "Responsible Unit"}
                  value={
                    report.assignedUnitName ||
                    (isVi ? "UBND phường Hòa Xuân" : "Hoa Xuan Ward People's Committee")
                  }
                />
              </div>
            </div>

            {/* 9. Processing History */}
            <div className="bg-white rounded-[20px] border border-[#E2E8F0] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
              <h3 className="flex items-center gap-2 text-sm font-extrabold text-[#0B2545] border-b border-slate-50 pb-3 mb-4">
                <Clock size={16} className="text-[#0B4FC4]" />
                {isVi ? "Lịch sử xử lý / Quyết định" : "Processing History"}
              </h3>

              <div className="relative pl-4 border-l border-slate-100 space-y-4">
                {historyEvents.map((evt, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-[20.5px] top-1 w-2.5 h-2.5 rounded-full bg-slate-200 border-2 border-white" />
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      {evt.time}
                    </div>
                    <div className="text-xs font-extrabold text-slate-800 mt-0.5">{evt.text}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5 font-semibold">
                      {evt.actor}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 10. Community Campaign Section */}
            {linkedCampaign ? (
              /* State B: Has linked campaign */
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50/20 rounded-[20px] border border-emerald-100 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow transition-shadow animate-fade-in">
                <div className="flex items-center justify-between border-b border-emerald-100/50 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <h3 className="text-sm font-extrabold text-emerald-800">
                      {isVi ? "Chiến dịch cộng đồng liên quan" : "Community Campaign"}
                    </h3>
                  </div>
                </div>

                <div className="flex gap-3 items-start mb-4">
                  <div className="w-14 h-14 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0">
                    <Flag size={22} className="text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-extrabold text-emerald-900 leading-snug truncate">
                      {linkedCampaign.title}
                    </h4>
                    <div className="flex gap-2 items-center mt-1.5 flex-wrap">
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 border border-amber-200 text-[9px] font-extrabold rounded-full uppercase tracking-wider">
                        {linkedCampaign.status}
                      </span>
                      <span className="text-[10px] text-emerald-700/80 font-bold flex items-center gap-1">
                        <Users size={11} />
                        {linkedCampaign.participants} {isVi ? "tham gia" : "joined"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 mb-4">
                  <div className="flex justify-between text-[10px] font-extrabold text-emerald-800">
                    <span>{isVi ? "Tiến độ đạt" : "Progress reached"}</span>
                    <span>{linkedCampaign.progress}%</span>
                  </div>
                  <div className="w-full bg-emerald-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#22C55E] h-full rounded-full transition-all"
                      style={{ width: `${linkedCampaign.progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link
                    to={`/campaigns/${linkedCampaign.id}` as any}
                    className="flex-1 px-3 py-2 bg-[#22C55E] hover:bg-green-600 text-white font-extrabold text-[11px] rounded-lg transition-all shadow-sm cursor-pointer min-h-[36px] flex items-center justify-center gap-1.5"
                  >
                    {isVi ? "Xem chiến dịch" : "View Campaign"}
                  </Link>
                  {canManageCampaignFromReport && (
                    <button
                      onClick={() => setShowCreateCampaignModal(true)}
                      className="px-3 py-2 border border-emerald-200 bg-white hover:bg-emerald-50 text-emerald-800 font-bold text-[11px] rounded-lg transition-all cursor-pointer min-h-[36px] flex items-center gap-1.5"
                    >
                      <Plus size={12} />
                      {isVi ? "Tạo thêm" : "Add"}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* State A: No linked campaign — only show for Ward Staff to create */
              canManageCampaignFromReport && (
                <div className="rounded-[20px] border-2 border-dashed border-emerald-200 bg-emerald-50/30 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:border-emerald-300 hover:bg-emerald-50/50 transition-all animate-fade-in">
                  <div className="flex items-center gap-2 mb-4">
                    <Flag size={16} className="text-emerald-500" />
                    <h3 className="text-sm font-extrabold text-emerald-800">
                      {isVi ? "Chiến dịch cộng đồng" : "Community Campaign"}
                    </h3>
                  </div>

                  <div className="flex flex-col items-center text-center py-4 px-2 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center mb-3">
                      <Flag size={26} className="text-emerald-400" />
                    </div>
                    <p className="text-xs font-extrabold text-emerald-800 mb-1">
                      {isVi ? "Chưa có chiến dịch nào" : "No campaign yet"}
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed max-w-[200px]">
                      {isVi
                        ? "Tạo chiến dịch cộng đồng để huy động tình nguyện viên cùng giải quyết vấn đề này."
                        : "Create a community campaign to mobilize volunteers to address this issue together."}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[
                      { icon: Users, label: isVi ? "Huy động cộng đồng" : "Mobilize community" },
                      { icon: Flag, label: isVi ? "Hành động tập thể" : "Collective action" },
                      {
                        icon: CheckCircle2,
                        label: isVi ? "Giải quyết nhanh hơn" : "Faster resolution",
                      },
                    ].map(({ icon: Icon, label }) => (
                      <div
                        key={label}
                        className="flex flex-col items-center gap-1 bg-white border border-emerald-100 rounded-xl p-2 text-center"
                      >
                        <Icon size={14} className="text-emerald-500" />
                        <span className="text-[9px] font-bold text-slate-600 leading-tight">
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => setShowCreateCampaignModal(true)}
                    className="w-full px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] rounded-xl transition-all shadow-sm cursor-pointer min-h-[40px] flex items-center justify-center gap-2"
                  >
                    <Flag size={13} />
                    {isVi ? "Tạo chiến dịch ngay" : "Create Campaign Now"}
                  </button>
                </div>
              )
            )}

            {/* 12. Quick Actions */}
            <div className="bg-white rounded-[20px] border border-[#E2E8F0] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
              <h3 className="flex items-center gap-2 text-sm font-extrabold text-[#0B2545] border-b border-slate-50 pb-3 mb-4">
                {isVi ? "Thao tác nhanh" : "Quick Actions"}
              </h3>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setShowAddInfoModal(true)}
                  disabled={report?.status !== "WAITING_INFO"}
                  className="px-3.5 py-3 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-[11px] rounded-xl flex flex-col items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer min-h-[70px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus size={16} className="text-[#0B4FC4]" />
                  {isVi ? "Bổ sung thông tin" : "Add Info"}
                </button>
                <button
                  onClick={handleFollowProgress}
                  className="px-3.5 py-3 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-[11px] rounded-xl flex flex-col items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer min-h-[70px]"
                >
                  <Bell size={16} className="text-[#0B4FC4]" />
                  {isVi ? "Theo dõi tiến trình" : "Follow Progress"}
                </button>
                <button
                  onClick={handleShare}
                  className="px-3.5 py-3 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-[11px] rounded-xl flex flex-col items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer min-h-[70px]"
                >
                  <Share2 size={16} className="text-[#0B4FC4]" />
                  {isVi ? "Chia sẻ phản ánh" : "Share"}
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="px-3.5 py-3 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-[11px] rounded-xl flex flex-col items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer min-h-[70px]"
                >
                  <Download size={16} className="text-[#0B4FC4]" />
                  {isVi ? "Tải về PDF" : "Download PDF"}
                </button>
              </div>

              {report &&
                ["SUBMITTED", "PENDING", "PENDING_RECEIVE", "NEED_LOCATION_REVIEW"].includes(
                  report.status,
                ) && (
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="w-full mt-3 px-3.5 py-3 border border-red-200 bg-red-50/20 hover:bg-red-50 text-red-600 font-bold text-[11px] rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer min-h-[44px]"
                  >
                    <Trash2 size={15} />
                    {isVi ? "Yêu cầu hủy phản ánh" : "Cancel Request"}
                  </button>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* dialogs & modals */}
      {/* 1. Add Info Dialog */}
      {showAddInfoModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-[20px] max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-scale-in">
            <h3 className="text-lg font-extrabold text-[#0B2545] border-b border-slate-100 pb-3 mb-4">
              {isVi ? "Bổ sung thông tin phản ánh" : "Add Additional Information"}
            </h3>
            <form onSubmit={handleAddInfoSubmit} className="space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                {isVi
                  ? "Bạn có thể gửi thêm hình ảnh hoặc mô tả chi tiết hơn về sự cố tại hiện trường."
                  : "You can submit more images or detailed description of the incident at the site."}
              </p>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                  {isVi ? "Nội dung bổ sung" : "Additional text info"}
                </label>
                <textarea
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  placeholder={isVi ? "Nhập thêm chi tiết..." : "Enter additional details..."}
                  className="w-full min-h-[100px] border border-slate-200 rounded-xl p-3.5 text-sm outline-none focus:border-[#0B4FC4] bg-slate-50/50 resize-none font-medium"
                />
              </div>

              {/* Image upload section */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center justify-between">
                  <span>
                    {isVi ? "Hình ảnh đính kèm (không bắt buộc)" : "Attached Images (optional)"}
                  </span>
                  <span className="text-slate-300 font-semibold">{supplementPhotos.length}/5</span>
                </label>
                <div className="flex flex-wrap gap-2.5 items-center">
                  {supplementPreviews.map((preview, idx) => (
                    <div
                      key={`${preview}-${idx}`}
                      className="relative group w-16 h-16 rounded-xl overflow-hidden border border-slate-200 shadow-sm transition-transform hover:scale-102"
                    >
                      <img src={preview} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeSupplementPhoto(idx)}
                        className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-600/90 text-white rounded-full flex items-center justify-center hover:bg-red-700 transition shadow cursor-pointer"
                        aria-label="Remove image"
                      >
                        <X size={10} strokeWidth={3} />
                      </button>
                    </div>
                  ))}

                  {supplementPhotos.length < 5 && (
                    <button
                      type="button"
                      onClick={() => supplementPhotoInputRef.current?.click()}
                      className="w-16 h-16 border-2 border-dashed border-slate-200 hover:border-[#0B4FC4] text-slate-400 hover:text-[#0B4FC4] rounded-xl flex flex-col items-center justify-center gap-1 bg-slate-50/50 hover:bg-blue-50/20 transition-all cursor-pointer shadow-sm"
                    >
                      <Camera size={18} />
                      <span className="text-[9px] font-bold">{isVi ? "Chọn ảnh" : "Add"}</span>
                    </button>
                  )}
                </div>
                <input
                  ref={supplementPhotoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleSupplementPhotoSelected(e.target.files)}
                  multiple
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setAdditionalInfo("");
                    setSupplementPhotos([]);
                    setSupplementPreviews([]);
                    setShowAddInfoModal(false);
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer min-h-[38px]"
                >
                  {isVi ? "Hủy" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={supplementMutation.isPending || supplementUploading}
                  className="px-4 py-2 bg-[#0B4FC4] text-white font-bold text-xs rounded-lg hover:bg-blue-700 transition shadow-sm cursor-pointer min-h-[38px] disabled:opacity-50 flex items-center gap-1.5 justify-center"
                >
                  {(supplementMutation.isPending || supplementUploading) && (
                    <Loader2 className="animate-spin" size={14} />
                  )}
                  {isVi ? "Gửi thông tin" : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Cancel Confirm Dialog */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-[20px] max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-scale-in">
            <h3 className="text-lg font-extrabold text-red-600 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
              <Trash2 size={20} />
              {isVi ? "Hủy phản ánh?" : "Cancel reporting request?"}
            </h3>
            <p className="text-sm text-slate-600 font-semibold leading-relaxed mb-6">
              {isVi
                ? "Bạn có chắc chắn muốn hủy phản ánh này? Phản ánh sẽ lập tức dừng và không còn hiển thị công khai nữa."
                : "Are you sure you want to cancel this report? It will stop immediately and will no longer be visible publicly."}
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer min-h-[38px]"
              >
                {isVi ? "Quay lại" : "Back"}
              </button>
              <button
                onClick={handleCancelRequest}
                className="px-4 py-2 bg-red-600 text-white font-bold text-xs rounded-lg hover:bg-red-700 transition shadow-sm cursor-pointer min-h-[38px]"
              >
                {isVi ? "Xác nhận hủy" : "Confirm Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Create Campaign Dialog */}
      {canManageCampaignFromReport && showCreateCampaignModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-[24px] max-w-xl w-full shadow-2xl border border-slate-100 animate-scale-in flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                  <Flag size={20} className="text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#0B2545]">
                    {isVi ? "Tạo chiến dịch cộng đồng" : "Create Community Campaign"}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                    {isVi
                      ? "Liên kết chiến dịch với phản ánh này để huy động cộng đồng"
                      : "Link a campaign to this report to mobilize the community"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateCampaignModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Linked report badge */}
            <div className="mx-6 mt-4 shrink-0">
              <div className="flex items-center gap-2.5 bg-blue-50/60 border border-blue-100 rounded-xl px-3.5 py-2.5">
                <FileText size={14} className="text-[#0B4FC4] shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
                    {isVi ? "Phản ánh liên kết" : "Linked report"}
                  </span>
                  <span className="text-xs font-extrabold text-[#0B4FC4] truncate block">
                    {mockCode} — {report.title}
                  </span>
                </div>
              </div>
            </div>

            {/* Scrollable form body */}
            <form
              onSubmit={handleCreateCampaignSubmit}
              className="overflow-y-auto flex-1 px-6 py-4 space-y-4"
            >
              {/* Title */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                  {isVi ? "Tên chiến dịch" : "Campaign title"}{" "}
                  <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={campaignForm.title}
                  onChange={(e) => setCampaignForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder={
                    isVi
                      ? "Vd: Vì một Hòa Xuân xanh - sạch - đẹp"
                      : "e.g. For a Clean & Green Hoa Xuan"
                  }
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium outline-none focus:border-[#0B4FC4] focus:ring-2 focus:ring-blue-50 bg-slate-50/40 transition placeholder:text-slate-300"
                  required
                />
              </div>

              {/* Category */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                  {isVi ? "Loại chiến dịch" : "Category"} <span className="text-red-400">*</span>
                </label>
                <select
                  value={campaignForm.category}
                  onChange={(e) =>
                    setCampaignForm((f) => ({ ...f, category: e.target.value as CampaignCategory }))
                  }
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium outline-none focus:border-[#0B4FC4] focus:ring-2 focus:ring-blue-50 bg-slate-50/40 transition cursor-pointer"
                >
                  <option value="environment">{isVi ? "Môi trường" : "Environment"}</option>
                  <option value="infrastructure">
                    {isVi ? "Hạ tầng đô thị" : "Infrastructure"}
                  </option>
                  <option value="public_safety">
                    {isVi ? "An toàn cộng đồng" : "Public Safety"}
                  </option>
                  <option value="construction">
                    {isVi ? "Xây dựng & Quy hoạch" : "Construction & Planning"}
                  </option>
                  <option value="fire_safety">
                    {isVi ? "Phòng cháy chữa cháy" : "Fire Safety"}
                  </option>
                </select>
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                  {isVi ? "Mô tả chiến dịch" : "Description"}{" "}
                  <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={campaignForm.description}
                  onChange={(e) => setCampaignForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder={
                    isVi
                      ? "Mô tả mục tiêu, hoạt động và lợi ích của chiến dịch..."
                      : "Describe the goals, activities and benefits of the campaign..."
                  }
                  className="w-full min-h-[90px] border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium outline-none focus:border-[#0B4FC4] focus:ring-2 focus:ring-blue-50 bg-slate-50/40 resize-none transition placeholder:text-slate-300"
                  required
                />
              </div>

              {/* Location */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                  {isVi ? "Địa điểm tổ chức" : "Location"}
                </label>
                <input
                  type="text"
                  value={campaignForm.locationText}
                  onChange={(e) => setCampaignForm((f) => ({ ...f, locationText: e.target.value }))}
                  placeholder={
                    report.addressDetails ||
                    (isVi
                      ? "Vd: UBND phường Hòa Xuân, Đà Nẵng"
                      : "e.g. Hoa Xuan Ward Office, Da Nang")
                  }
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium outline-none focus:border-[#0B4FC4] focus:ring-2 focus:ring-blue-50 bg-slate-50/40 transition placeholder:text-slate-300"
                />
              </div>

              {/* Start / End time */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <CalendarDays size={11} />
                    {isVi ? "Ngày bắt đầu" : "Start date"}
                  </label>
                  <input
                    type="date"
                    value={campaignForm.startTime}
                    onChange={(e) => setCampaignForm((f) => ({ ...f, startTime: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium outline-none focus:border-[#0B4FC4] focus:ring-2 focus:ring-blue-50 bg-slate-50/40 transition cursor-pointer"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <CalendarDays size={11} />
                    {isVi ? "Ngày kết thúc" : "End date"}
                  </label>
                  <input
                    type="date"
                    value={campaignForm.endTime}
                    onChange={(e) => setCampaignForm((f) => ({ ...f, endTime: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium outline-none focus:border-[#0B4FC4] focus:ring-2 focus:ring-blue-50 bg-slate-50/40 transition cursor-pointer"
                  />
                </div>
              </div>

              {/* Max participants */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <Users size={11} />
                  {isVi ? "Số người tham gia tối đa" : "Max participants"}
                </label>
                <input
                  type="number"
                  min={1}
                  value={campaignForm.maxParticipants}
                  onChange={(e) =>
                    setCampaignForm((f) => ({ ...f, maxParticipants: e.target.value }))
                  }
                  placeholder={isVi ? "Vd: 50" : "e.g. 50"}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium outline-none focus:border-[#0B4FC4] focus:ring-2 focus:ring-blue-50 bg-slate-50/40 transition placeholder:text-slate-300"
                />
              </div>

              {/* Info note */}
              <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-xl p-3 text-[11px] text-amber-800 font-semibold leading-relaxed">
                <AlertTriangle size={14} className="shrink-0 mt-0.5 text-amber-500" />
                {isVi
                  ? "Chiến dịch sau khi tạo sẽ được chuyển đến cơ quan chức năng xét duyệt trước khi công bố công khai."
                  : "Campaigns are submitted for authority review before being publicly published."}
              </div>

              {/* Action buttons — pinned inside form so they scroll with content */}
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateCampaignModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-lg transition cursor-pointer min-h-[38px]"
                >
                  {isVi ? "Hủy" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={campaignSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-extrabold text-xs rounded-xl transition shadow-sm cursor-pointer min-h-[38px] flex items-center gap-2"
                >
                  {campaignSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      {isVi ? "Đang tạo..." : "Creating..."}
                    </>
                  ) : (
                    <>
                      <Flag size={14} />
                      {isVi ? "Tạo chiến dịch" : "Create Campaign"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── HELPER COMPONENTS & FUNCTIONS ───────────────────────────

function getSimilarStatusStyle(status: string) {
  const upper = (status || "").toUpperCase();
  switch (upper) {
    case "RESOLVED":
      return "bg-[#EAF8EF] text-[#16A34A] border-[#BBF7D0]";
    case "REJECTED":
      return "bg-[#FDECEC] text-[#DC2626] border-[#FECACA]";
    case "IN_PROGRESS":
    case "ASSIGNED":
      return "bg-[#FFF4E8] text-[#F97316] border-[#FFEDD5]";
    case "PENDING_RECEIVE":
      return "bg-[#F3E8FF] text-[#9333EA] border-[#E9D5FF]";
    case "NEED_LOCATION_REVIEW":
    case "WAITING_INFO":
      return "bg-[#FFF7D6] text-[#A16207] border-[#FEF3C7]";
    default:
      return "bg-[#EAF2FF] text-[#0B4FC4] border-[#BFDBFE]";
  }
}

function getSimilarStatusLabel(status: string, isVi: boolean) {
  const upper = (status || "").toUpperCase();
  switch (upper) {
    case "RESOLVED":
      return isVi ? "Đã xử lý" : "Resolved";
    case "REJECTED":
      return isVi ? "Từ chối" : "Rejected";
    case "IN_PROGRESS":
    case "ASSIGNED":
      return isVi ? "Đang xử lý" : "In Progress";
    case "PENDING_RECEIVE":
      return isVi ? "Chờ tiếp nhận" : "Awaiting";
    case "NEED_LOCATION_REVIEW":
      return isVi ? "Chờ xác minh" : "Reviewing";
    case "WAITING_INFO":
      return isVi ? "Chờ bổ sung" : "Need Info";
    default:
      return isVi ? "Chờ duyệt" : "Pending";
  }
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex items-start gap-3 py-3 last:pb-0">
      <Icon className="text-[#0B4FC4] mt-0.5 shrink-0" size={16} />
      <div className="min-w-0">
        <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
          {label}
        </div>
        <div className="text-sm font-semibold text-slate-700 leading-relaxed mt-0.5">
          {value || "N/A"}
        </div>
      </div>
    </div>
  );
}

type TimelineTone = "completed" | "pending" | "rejected";

interface TimelineEntry {
  title: string;
  action?: string | null;
  note?: string | null;
  actorName?: string | null;
  actorRole?: string | null;
  authorityName?: string | null;
  assignedToName?: string | null;
  deadline?: string | null;
  createdAt?: string | null;
  tone: TimelineTone;
}

function buildTimeline(
  logs: FeedbackLogResponse[],
  currentStatus: FeedbackStatus,
  locale: string,
): TimelineEntry[] {
  const orderedLogs = [...logs].sort((a, b) =>
    (a.createdAt || "").localeCompare(b.createdAt || ""),
  );
  const rejectedIndex = orderedLogs.findIndex(
    (log) => log.status === "REJECTED" || log.newStatus === "REJECTED",
  );
  const visibleLogs = rejectedIndex >= 0 ? orderedLogs.slice(0, rejectedIndex + 1) : orderedLogs;

  const entries: TimelineEntry[] = visibleLogs.map((log) => {
    const status = log.status || log.newStatus || log.oldStatus;
    const rejected = status === "REJECTED";
    return {
      title: log.title || statusTitle(status, locale),
      action: log.action,
      note: log.note,
      actorName: log.actorName || log.actionByName,
      actorRole: log.actorRole,
      authorityName: log.authorityName,
      assignedToName: log.assignedToName,
      deadline: log.deadline,
      createdAt: log.createdAt,
      tone: rejected ? ("rejected" as const) : ("completed" as const),
    };
  });

  if (rejectedIndex >= 0 || currentStatus === "REJECTED" || currentStatus === "RESOLVED") {
    return entries;
  }

  const pendingTitle = nextPendingTitle(currentStatus, entries, locale);
  if (pendingTitle) {
    entries.push({
      title: pendingTitle,
      tone: "pending",
    });
  }

  return entries;
}

function nextPendingTitle(status: FeedbackStatus, entries: TimelineEntry[], locale: string) {
  const completedTitles = new Set(entries.map((entry) => entry.title));
  const recv = locale === "vi" ? "Đã tiếp nhận phản ánh" : "Report received";
  const done = locale === "vi" ? "Đã hoàn thành xử lý" : "Processing completed";
  const wait = locale === "vi" ? "Chờ công dân bổ sung thông tin" : "Awaiting citizen info";

  if (status === "PENDING" && !completedTitles.has(recv)) return recv;
  if (status === "IN_PROGRESS" && !completedTitles.has(done)) return done;
  if (status === "WAITING_INFO") return wait;
  return null;
}

function statusTitle(status: string | null | undefined, locale: string) {
  const isVi = locale === "vi";
  if (!status) return isVi ? "Đã cập nhật phản ánh" : "Report updated";

  const upper = status.toUpperCase();
  const labels: Record<string, string> = {
    SUBMITTED: isVi ? "Đã gửi phản ánh" : "Report submitted",
    PENDING_RECEIVE: isVi ? "Chờ tiếp nhận" : "Awaiting review",
    NEED_LOCATION_REVIEW: isVi ? "Chờ xác minh vị trí" : "Location review",
    ASSIGNED: isVi ? "Đã tiếp nhận" : "Report received",
    IN_PROGRESS: isVi ? "Đang tiến hành xử lý" : "Processing",
    WAITING_INFO: isVi ? "Chờ bổ sung thông tin" : "Info required",
    RESOLVED: isVi ? "Đã hoàn thành xử lý" : "Processing completed",
    REJECTED: isVi ? "Phản ánh bị từ chối" : "Report rejected",
    PENDING: isVi ? "Đã tiếp nhận" : "Report submitted",
    PRE_EMPTIVE: isVi ? "Xử lý trước" : "Pre-emptive processing",
  };
  return labels[upper] || status;
}

function translateNote(note: string | null | undefined, isVi: boolean): string {
  if (!note) return "";
  if (!isVi) return note;

  const trimmed = note.trim();
  if (trimmed === "Citizen submitted feedback") {
    return "Phản ánh đã được gửi thành công lên hệ thống.";
  }
  if (trimmed === "Status updated by Ward Staff") {
    return "Trạng thái phản ánh được cập nhật bởi Cán bộ Phường.";
  }
  if (trimmed.startsWith("Status updated to")) {
    return trimmed.replace("Status updated to", "Trạng thái được cập nhật thành");
  }

  return note;
}

function getTimelineStepIcon(title: string, action?: string | null) {
  const t = (title || "").toLowerCase();
  const act = (action || "").toUpperCase();

  if (act === "SUBMIT" || t.includes("gửi") || t.includes("submitted")) {
    return Send;
  }
  if (t.includes("tiếp nhận") || t.includes("received") || t.includes("assigned")) {
    return ClipboardCheck;
  }
  if (t.includes("xác minh") || t.includes("location") || t.includes("review")) {
    return Search;
  }
  if (t.includes("bổ sung") || t.includes("info") || t.includes("yêu cầu")) {
    return HelpCircle;
  }
  if (
    t.includes("đang") ||
    t.includes("xử lý") ||
    t.includes("processing") ||
    t.includes("in_progress")
  ) {
    return Wrench;
  }
  if (
    t.includes("xong") ||
    t.includes("resolved") ||
    t.includes("hoàn thành") ||
    t.includes("giải quyết")
  ) {
    return CheckCircle2;
  }
  if (t.includes("từ chối") || t.includes("rejected")) {
    return XCircle;
  }
  if (t.includes("đóng") || t.includes("closed")) {
    return Clock;
  }
  return UserRound;
}

function formatDateTime(value?: string | null, locale = "vi") {
  if (!value) return "N/A";
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function isVideoAttachment(attachment: any) {
  if (!attachment) return false;
  const type = attachment.fileType?.toLowerCase() || "";
  const url = attachment.fileUrl?.toLowerCase() || "";
  return type.includes("video") || /\.(mp4|webm|mov|avi|m4v)(\?|$)/.test(url);
}
