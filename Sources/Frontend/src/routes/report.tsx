import { clientOnly } from "@/components/ClientOnly";
import type { ReportMapProps } from "@/components/site/ReportMap";
import { createFileRoute, Link, redirect, useLocation } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, lazy, Suspense } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useProfile } from "@/hooks";
import { useCategories, useCreateFeedbackWithMedia } from "@/lib/hooks";
import { ApiError, wardApi, getToken } from "@/lib/api";
import { getVideoDurationSeconds } from "@/lib/citizenFeedbackMediaApi";
import { compressImageIfNeeded } from "@/lib/imageCompression";
import {
  clearGpsLocation,
  getStoredGpsLocation,
  requestCurrentGpsLocation,
  storeGpsLocation,
} from "@/lib/location";
import { toast } from "sonner";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Building2,
  Camera,
  Car,
  Check,
  Flame,
  HardHat,
  Loader2,
  LocateFixed,
  MapPin,
  ShieldCheck,
  TreePine,
  Upload,
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  FileText,
  User,
  Phone,
  Mail,
  Map,
  ClipboardList,
  CheckSquare,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/report")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    const token = getToken();
    const raw = localStorage.getItem("dn_auth_user_v2");
    if (!token || !raw) {
      throw redirect({
        to: "/login",
        search: {
          redirect: "/report",
          error: "login_required",
        },
      });
    }
  },
  head: () => ({
    meta: [
      { title: "Gửi phản ánh mới - Đà Nẵng Kết Nối" },
      {
        name: "description",
        content: "Gửi phản ánh sự cố đô thị kèm ảnh/video, mô tả và vị trí GPS hiện tại.",
      },
    ],
  }),
  component: ReportPage,
});

const ReportMap = clientOnly<ReportMapProps>(() =>
  import("@/components/site/ReportMap").then((m) => ({ default: m.ReportMap })),
);

const API_BASE: string =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE) || "";

const DEFAULT_MAP_CENTER: [number, number] = [16.0544, 108.2022];
const CURRENT_LOCATION_ZOOM = 17;

const OFFICIAL_CATEGORY_CODES = [
  "TRAFFIC",
  "URBAN_INFRASTRUCTURE",
  "ENVIRONMENT",
  "PUBLIC_SECURITY",
  "CONSTRUCTION",
  "FIRE_SAFETY",
] as const;

const OFFICIAL_CATEGORY_CONTENT: Record<
  (typeof OFFICIAL_CATEGORY_CODES)[number],
  { vi: string; en: string; descriptionVi: string; descriptionEn: string }
> = {
  TRAFFIC: {
    vi: "Giao thông",
    en: "Traffic",
    descriptionVi: "Đường sá, ùn tắc, biển báo và an toàn giao thông",
    descriptionEn: "Road issues, congestion, signs, and traffic safety",
  },
  URBAN_INFRASTRUCTURE: {
    vi: "Hạ tầng đô thị",
    en: "Urban Infrastructure",
    descriptionVi: "Đèn chiếu sáng, cống thoát nước, vỉa hè và hạ tầng công cộng",
    descriptionEn: "Lighting, drainage, sidewalks, and public infrastructure",
  },
  ENVIRONMENT: {
    vi: "Môi trường",
    en: "Environment",
    descriptionVi: "Rác thải, ô nhiễm, cây xanh và vệ sinh đô thị",
    descriptionEn: "Waste, pollution, greenery, and urban sanitation",
  },
  PUBLIC_SECURITY: {
    vi: "An ninh trật tự",
    en: "Public Security",
    descriptionVi: "Mất trật tự, gây rối và nguy cơ an ninh",
    descriptionEn: "Disorder, disturbance, and public security risks",
  },
  CONSTRUCTION: {
    vi: "Xây dựng",
    en: "Construction",
    descriptionVi: "Xây dựng trái phép, che chắn và an toàn thi công",
    descriptionEn: "Illegal construction, site obstruction, and construction safety",
  },
  FIRE_SAFETY: {
    vi: "Phòng cháy chữa cháy",
    en: "Fire Safety",
    descriptionVi: "Nguy cơ cháy nổ, lối thoát hiểm và thiết bị PCCC",
    descriptionEn: "Fire hazards, emergency exits, and fire safety equipment",
  },
};

const OFFICIAL_CATEGORY_TEMPLATES: Record<string, string> = {
  TRAFFIC: `1. Loại sự cố giao thông (Ổ gà, biển hiệu hỏng, xe đỗ trái phép...): 
2. Vị trí/Làn đường cụ thể xảy ra sự việc: 
3. Mức độ cản trở, ảnh hưởng giao thông: 
4. Đề xuất khắc phục của người dân: `,

  URBAN_INFRASTRUCTURE: `1. Hiện trạng sự cố hạ tầng (Mất điện chiếu sáng, cống tràn, sụt lún vỉa hè...): 
2. Mức độ nguy hiểm hoặc bất tiện cho người dân: 
3. Đề xuất kiểm tra, khắc phục: `,

  ENVIRONMENT: `1. Loại ô nhiễm/sự cố (Rác thải bừa bãi, xả nước thải bẩn, cây đổ, tiếng ồn...): 
2. Phạm vi và mức độ ảnh hưởng đến khu dân cư: 
3. Đề xuất thu gom, dọn dẹp hoặc xử lý vi phạm: `,

  PUBLIC_SECURITY: `1. Hành vi vi phạm trật tự (Gây rối trật tự, lấn chiếm lòng đường, trộm cắp...): 
2. Thời gian hoặc đối tượng thường xuyên xảy ra sự việc: 
3. Đề xuất lực lượng chức năng kiểm tra/tuần tra: `,

  CONSTRUCTION: `1. Hiện trạng công trình (Xây dựng không phép, không rào chắn, gây cát bụi/tiếng ồn...): 
2. Mức độ ảnh hưởng đến an toàn của các hộ lân cận: 
3. Đề xuất cơ quan chức năng kiểm tra kiểm soát: `,

  FIRE_SAFETY: `1. Nguy cơ cháy nổ phát hiện (Lối thoát hiểm bị bịt kín, thiết bị PCCC hỏng/thiếu...): 
2. Địa điểm cụ thể trong khu dân cư/tòa nhà: 
3. Đề xuất kiểm tra PCCC khẩn cấp: `,
};

interface NominatimReverseResponse {
  display_name?: string;
}

async function reverseGeocodeAddress(
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<string> {
  const params = new URLSearchParams({
    format: "jsonv2",
    lat: String(latitude),
    lon: String(longitude),
    zoom: "18",
    addressdetails: "1",
    "accept-language": "vi",
  });

  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, {
    signal,
  });

  if (!response.ok) {
    throw new Error("REVERSE_GEOCODING_FAILED");
  }

  const data = (await response.json()) as NominatimReverseResponse;
  if (!data.display_name) {
    throw new Error("REVERSE_GEOCODING_EMPTY");
  }

  return data.display_name;
}

function getWardNameFromAddress(readableAddress: string): string {
  return (
    readableAddress
      .split(",")
      .map((part) => part.trim())
      .find((part) => ["Phường ", "Xã ", "Thị trấn "].some((prefix) => part.startsWith(prefix))) ||
    ""
  );
}

function getGpsErrorMessage(error: unknown, t: ReturnType<typeof useI18n>["t"]): string {
  const code =
    typeof error === "object" && error && "code" in error ? Number(error.code) : undefined;

  if (error instanceof Error && error.message === "GEOLOCATION_UNSUPPORTED") {
    return t("report.gps.unsupported");
  }

  if (code === 1) {
    return t("report.gps.denied");
  }

  if (code === 2) {
    return t("report.gps.unavailable");
  }

  if (code === 3) {
    return t("report.gps.timeout");
  }

  return t("report.gps.generic");
}

function isWithinVietnam(lat: number, lng: number): boolean {
  return lat >= 8.0 && lat <= 24.0 && lng >= 102.0 && lng <= 110.0;
}

// ─── PII Guard — Tầng 1 Frontend ────────────────────────────────────
// Phát hiện SĐT Việt Nam (0xxxxxxxxx) và CCCD mới 2021+ (12 số)
// Tương thích đa trình duyệt (kể cả Safari cũ < 16.4 do không dùng negative lookbehind)
const PII_PHONE_RE = /(?:^|[^\d])0\d{9}(?=[^\d]|$)/;
const PII_CCCD_RE = /(?:^|[^\d])\d{12}(?=[^\d]|$)/;

function detectPii(text: string): boolean {
  return PII_PHONE_RE.test(text) || PII_CCCD_RE.test(text);
}

interface SignaturePadProps {
  onSave: (dataUrl: string | null) => void;
}

function SignaturePad({ onSave }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const lastX = useRef(0);
  const lastY = useRef(0);

  const getCoordinates = (e: MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ("touches" in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    if (e.cancelable) e.preventDefault();
    const { x, y } = getCoordinates(e.nativeEvent);
    lastX.current = x;
    lastY.current = y;
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    if (e.cancelable) e.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const { x, y } = getCoordinates(e.nativeEvent);

    ctx.beginPath();
    ctx.moveTo(lastX.current, lastY.current);
    ctx.lineTo(x, y);
    ctx.strokeStyle = "#0b5ed7";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();

    lastX.current = x;
    lastY.current = y;
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const canvas = canvasRef.current;
    if (canvas) {
      onSave(canvas.toDataURL("image/png"));
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      onSave(null);
    }
  };

  return (
    <div className="space-y-2">
      <div className="relative border border-slate-200 rounded-xl overflow-hidden bg-white shadow-inner max-w-[320px]">
        <canvas
          ref={canvasRef}
          width={320}
          height={140}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full cursor-crosshair touch-none"
        />
        <button
          type="button"
          onClick={clearCanvas}
          className="absolute right-2 bottom-2 text-[10px] font-bold text-slate-400 hover:text-slate-600 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg shadow-sm cursor-pointer"
        >
          Xóa chữ ký
        </button>
      </div>
      <p className="text-[10px] text-slate-400 font-medium">
        Vẽ trực tiếp bằng ngón tay hoặc chuột lên khung trên để ký tên.
      </p>
    </div>
  );
}

function ReportPage() {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const location = useLocation();
  const state = location.state as
    | {
        initialTitle?: string;
        initialDescription?: string;
        initialCategoryCode?: string;
        initialLatitude?: number;
        initialLongitude?: number;
        initialAddressDetails?: string;
        initialAttachments?: Array<{ fileUrl: string; fileName: string; fileType: string }>;
      }
    | undefined;

  const [submitted, setSubmitted] = useState(false);
  const [trackingCode, setTrackingCode] = useState("");
  const [piiError, setPiiError] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const { data: profile } = useProfile();
  const [isAgreed, setIsAgreed] = useState(false);
  const [contactAddress, setContactAddress] = useState("");
  const [isOpenMapModal, setIsOpenMapModal] = useState(false);
  const [incidentAddress, setIncidentAddress] = useState(state?.initialAddressDetails || "");
  const [signatureMode, setSignatureMode] = useState<"auto" | "draw">("auto");
  const [customSignature, setCustomSignature] = useState<string | null>(null);

  const { data: categories } = useCategories();
  const [categoryCode, setCategoryCode] = useState<string | undefined>(
    state?.initialCategoryCode || undefined,
  );
  const createFeedback = useCreateFeedbackWithMedia();

  const storedLocation = getStoredGpsLocation();
  const initialLat =
    state?.initialLatitude !== undefined
      ? state.initialLatitude
      : storedLocation && isWithinVietnam(storedLocation.latitude, storedLocation.longitude)
        ? storedLocation.latitude
        : null;
  const initialLng =
    state?.initialLongitude !== undefined
      ? state.initialLongitude
      : storedLocation && isWithinVietnam(storedLocation.latitude, storedLocation.longitude)
        ? storedLocation.longitude
        : null;

  const [title, setTitle] = useState(state?.initialTitle || "");
  const [description, setDescription] = useState(state?.initialDescription || "");
  const [latitude, setLatitude] = useState<number | null>(initialLat);
  const [longitude, setLongitude] = useState<number | null>(initialLng);
  const [locationLoading, setLocationLoading] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [address, setAddress] = useState(state?.initialAddressDetails || "");
  const [addressError, setAddressError] = useState("");
  const [detectedWard, setDetectedWard] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [videos, setVideos] = useState<File[]>([]);
  const [videoPreviews, setVideoPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [downloadingAttachments, setDownloadingAttachments] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const geocodeAbortRef = useRef<AbortController | null>(null);

  const hasLocation = latitude !== null && longitude !== null;
  const markerDisplayed = hasLocation && !locationLoading;
  const expectedWard = detectedWard || getWardNameFromAddress(address);
  const mapCenter = useMemo<[number, number]>(
    () => (hasLocation ? [latitude, longitude] : DEFAULT_MAP_CENTER),
    [hasLocation, latitude, longitude],
  );
  const categoryOptions = useMemo(
    () =>
      OFFICIAL_CATEGORY_CODES.map((code) => {
        const apiCategory = categories?.find((category) => category.code === code);
        const content = OFFICIAL_CATEGORY_CONTENT[code];
        return {
          id: apiCategory?.id,
          code,
          name: locale === "vi" ? content.vi : content.en,
          description:
            locale === "vi"
              ? apiCategory?.descriptionVi || content.descriptionVi
              : apiCategory?.descriptionEn || content.descriptionEn,
        };
      }),
    [categories, locale],
  );
  const canSubmit =
    !!categoryCode &&
    title.trim().length > 0 &&
    photos.length > 0 &&
    videos.length > 0 &&
    description.trim().length > 0 &&
    hasLocation &&
    isAgreed &&
    (signatureMode === "auto" || !!customSignature) &&
    !locationLoading &&
    !createFeedback.isPending &&
    !uploading;

  useEffect(() => {
    if (categoryCode === undefined) {
      setCategoryCode(OFFICIAL_CATEGORY_CODES[0]);
    }
  }, [categoryCode]);

  useEffect(() => {
    if (state?.initialLatitude !== undefined && state?.initialLongitude !== undefined) {
      // Already has prefilled location, no need to detect or load address
      if (!state.initialAddressDetails) {
        void loadAddress(state.initialLatitude, state.initialLongitude);
      }
    } else if (
      storedLocation &&
      isWithinVietnam(storedLocation.latitude, storedLocation.longitude)
    ) {
      void loadAddress(storedLocation.latitude, storedLocation.longitude);
    } else {
      detectLocation();
    }
    // Auto GPS runs once on page open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (state?.initialAttachments && state.initialAttachments.length > 0) {
      const initialAtts = state.initialAttachments;
      const loadAttachments = async () => {
        setDownloadingAttachments(true);
        const fetchedPhotos: File[] = [];
        const fetchedVideos: File[] = [];
        const photoUrls: string[] = [];
        const videoUrls: string[] = [];

        const toastId = toast.loading(
          locale === "vi"
            ? "Đang tải dữ liệu hình ảnh, video cũ..."
            : "Loading previous media files...",
        );

        for (const att of initialAtts) {
          try {
            const response = await fetch(att.fileUrl);
            const blob = await response.blob();
            const file = new File([blob], att.fileName || "attachment", {
              type: blob.type || att.fileType,
            });

            const isVideo =
              (att.fileType || "").toLowerCase().includes("video") ||
              (att.fileUrl || "").toLowerCase().endsWith(".mp4") ||
              (att.fileUrl || "").toLowerCase().endsWith(".mov") ||
              (att.fileUrl || "").toLowerCase().endsWith(".webm");

            if (isVideo) {
              fetchedVideos.push(file);
              videoUrls.push(att.fileUrl);
            } else {
              fetchedPhotos.push(file);
              photoUrls.push(att.fileUrl);
            }
          } catch (error) {
            console.error("Error downloading attachment:", att.fileUrl, error);
          }
        }

        if (fetchedPhotos.length > 0) {
          setPhotos((prev) => [...prev, ...fetchedPhotos]);
          setPhotoPreviews((prev) => [...prev, ...photoUrls]);
        }
        if (fetchedVideos.length > 0) {
          setVideos((prev) => [...prev, ...fetchedVideos]);
          setVideoPreviews((prev) => [...prev, ...videoUrls]);
        }
        setDownloadingAttachments(false);
        toast.dismiss(toastId);
        toast.success(
          locale === "vi"
            ? "Tải dữ liệu hình ảnh, video cũ thành công!"
            : "Loaded previous media files successfully!",
        );
      };

      void loadAttachments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.initialAttachments]);

  const getCategoryIcon = (code: string) => {
    if (code === "TRAFFIC") return <Car size={24} />;
    if (code === "URBAN_INFRASTRUCTURE") return <Building2 size={24} />;
    if (code === "ENVIRONMENT") return <TreePine size={24} />;
    if (code === "PUBLIC_SECURITY") return <ShieldCheck size={24} />;
    if (code === "CONSTRUCTION") return <HardHat size={24} />;
    if (code === "FIRE_SAFETY") return <Flame size={24} />;
    return <Building2 size={24} />;
  };

  const handleFilesSelected = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files);
    const validFiles = newFiles.filter((file) => {
      const validType = file.type.startsWith("image/") || file.type.startsWith("video/");
      const validSize = file.size <= 10 * 1024 * 1024;

      if (!validType) {
        toast.error(`${file.name} không phải ảnh hoặc video.`);
      }
      if (!validSize) {
        toast.error(`${file.name} vượt quá 10MB.`);
      }

      return validType && validSize;
    });

    setPhotos((prev) => [...prev, ...validFiles]);
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotoPreviews((prev) => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handlePhotoFilesSelected = (files: FileList | null) => {
    if (!files) {
      if (photoInputRef.current) photoInputRef.current.value = "";
      return;
    }
    const newFiles = Array.from(files);
    const validFiles = newFiles.filter((file) => {
      const validType = file.type.startsWith("image/");
      const validSize = file.size <= 10 * 1024 * 1024;

      if (!validType) {
        toast.error(`${file.name} không phải file ảnh.`);
      }
      if (!validSize) {
        toast.error(`${file.name} vượt quá 10MB.`);
      }

      return validType && validSize;
    });

    const availableSlots = Math.max(0, 5 - photos.length);
    const acceptedFiles = validFiles.slice(0, availableSlots);
    if (validFiles.length > availableSlots) {
      toast.error("Chỉ được upload tối đa 5 ảnh.");
    }

    setPhotos((prev) => [...prev, ...acceptedFiles]);
    acceptedFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotoPreviews((prev) => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
    if (photoInputRef.current) photoInputRef.current.value = "";
  };

  const handleVideoFileSelected = (files: FileList | null) => {
    if (!files) {
      if (videoInputRef.current) videoInputRef.current.value = "";
      return;
    }
    const file = Array.from(files)[0];
    if (!file) {
      if (videoInputRef.current) videoInputRef.current.value = "";
      return;
    }

    if (!file.type.startsWith("video/")) {
      toast.error(`${file.name} không phải file video.`);
      if (videoInputRef.current) videoInputRef.current.value = "";
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error(`${file.name} vượt quá 50MB.`);
      if (videoInputRef.current) videoInputRef.current.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setVideos([file]);
        setVideoPreviews([event.target.result as string]);
      }
    };
    reader.readAsDataURL(file);
    if (videoInputRef.current) videoInputRef.current.value = "";
  };

  const removePhoto = (idx: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== idx));
    if (photoInputRef.current) photoInputRef.current.value = "";
  };

  const removeVideo = () => {
    setVideos([]);
    setVideoPreviews([]);
    if (videoInputRef.current) videoInputRef.current.value = "";
  };

  const uploadPhotos = async (feedbackId: number): Promise<string[]> => {
    const selectedMedia = [...photos, ...videos];
    if (selectedMedia.length === 0) return [];
    const token = getToken();
    const urls: string[] = [];
    setUploading(true);

    try {
      for (const photo of selectedMedia) {
        const formData = new FormData();
        const compressedPhoto = await compressImageIfNeeded(photo);
        formData.append("file", compressedPhoto);
        const res = await fetch(`${API_BASE}/api/files/upload/${feedbackId}`, {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });

        const data = await res.json().catch(() => null);
        if (!res.ok) {
          const message =
            data?.message ||
            data?.error ||
            `Upload ${photo.name} thất bại với mã lỗi ${res.status}`;
          throw new Error(message);
        }

        urls.push(data.fileUrl);
      }
      return urls;
    } finally {
      setUploading(false);
    }
  };

  const loadAddress = async (nextLatitude: number, nextLongitude: number) => {
    geocodeAbortRef.current?.abort();
    const controller = new AbortController();
    geocodeAbortRef.current = controller;

    setAddress("");
    setAddressError("");
    setAddressLoading(true);

    try {
      const resolvedAddress = await reverseGeocodeAddress(
        nextLatitude,
        nextLongitude,
        controller.signal,
      );
      setAddress(resolvedAddress);
      setIncidentAddress(resolvedAddress);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      setAddressError(t("report.err.geocodeFailed"));
    } finally {
      if (geocodeAbortRef.current === controller) {
        geocodeAbortRef.current = null;
        setAddressLoading(false);
      }
    }
  };

  const applyLocation = async (nextLatitude: number, nextLongitude: number) => {
    setLatitude(nextLatitude);
    setLongitude(nextLongitude);
    setLocationError("");
    storeGpsLocation({ latitude: nextLatitude, longitude: nextLongitude });
    void loadAddress(nextLatitude, nextLongitude);

    try {
      const ward = await wardApi.locate(nextLatitude, nextLongitude);
      setDetectedWard(ward.name);
    } catch {
      setDetectedWard("");
    }
  };

  async function detectLocation() {
    setLocationLoading(true);
    setLocationError("");
    setDetectedWard("");

    try {
      const location = await requestCurrentGpsLocation();
      if (!isWithinVietnam(location.latitude, location.longitude)) {
        const [defaultLat, defaultLng] = DEFAULT_MAP_CENTER;
        await applyLocation(defaultLat, defaultLng);
        toast.warning(
          locale === "vi"
            ? "Tọa độ định vị GPS không chính xác (nằm ngoài Việt Nam). Đã chuyển về vị trí mặc định tại Đà Nẵng, vui lòng kéo ghim hoặc click trên bản đồ để chỉnh sửa."
            : "Inaccurate GPS coordinates detected. Reset to default location in Da Nang, please drag the pin or click on the map to adjust.",
        );
      } else {
        await applyLocation(location.latitude, location.longitude);
        toast.success(t("report.loc.gpsSuccess"));
      }
    } catch (err) {
      const message = getGpsErrorMessage(err, t);
      clearGpsLocation();
      setLatitude(null);
      setLongitude(null);
      setAddress("");
      setIncidentAddress("");
      setAddressError("");
      setLocationError(message);
      toast.error(message);
    } finally {
      setLocationLoading(false);
    }
  }

  const validateBeforeSubmit = () => {
    if (!user) {
      toast.error(t("report.err.login"));
      return false;
    }
    if (!categoryCode) {
      toast.error(t("report.err.category"));
      return false;
    }
    if (!title.trim()) {
      toast.error(
        locale === "vi" ? "Vui lòng nhập tiêu đề phản ánh." : "Please enter a report title.",
      );
      return false;
    }
    if (photos.length === 0) {
      toast.error(t("report.err.photo"));
      return false;
    }
    if (videos.length === 0) {
      toast.error(t("report.err.video"));
      return false;
    }
    if (!description.trim()) {
      toast.error(t("report.err.description"));
      return false;
    }
    if (!hasLocation) {
      toast.error(t("report.err.gps"));
      return false;
    }
    // [PII Guard — Tầng 1] Kiểm tra SĐT / CCCD trong tiêu đề và mô tả
    const hasPii = detectPii(title) || detectPii(description);
    if (hasPii) {
      const msg =
        locale === "vi"
          ? "Vui lòng xoá số điện thoại hoặc CCCD/CMND khỏi nội dung trước khi gửi để bảo vệ thông tin cá nhân của bạn."
          : "Please remove phone numbers or ID numbers from your report to protect your personal information.";
      setPiiError(msg);
      toast.error(msg);
      return false;
    }
    if (!isAgreed) {
      toast.error(
        locale === "vi"
          ? "Vui lòng cam đoan thông tin phản ánh là đúng sự thật."
          : "Please confirm that the reported information is true.",
      );
      return false;
    }
    setPiiError("");
    return true;
  };

  const handleSubmit = async () => {
    if (!validateBeforeSubmit() || latitude === null || longitude === null || !categoryCode) {
      return;
    }

    try {
      const videoDurationsSeconds = await Promise.all(videos.map(getVideoDurationSeconds));
      const result = await createFeedback.mutateAsync({
        data: {
          title: title.trim(),
          description: description.trim(),
          latitude,
          longitude,
          addressDetails: incidentAddress || address || detectedWard || `${latitude}, ${longitude}`,
          categoryCode,
          videoDurationsSeconds,
          publicVisible: !isPrivate,
        },
        files: [...photos, ...videos],
      });

      setTrackingCode(result.trackingCode || "FB-XXXXXXXX");
      setSubmitted(true);
      toast.success(t("report.success.toast"));
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error(t("report.err.generic"));
      }
    }
  };

  const sections = [
    {
      id: "section-1",
      num: 1,
      label: locale === "vi" ? "Thông tin cá nhân" : "Personal Info",
      desc: locale === "vi" ? "Thông tin người phản ánh" : "Reporter profile info",
    },
    {
      id: "section-2",
      num: 2,
      label: locale === "vi" ? "Nội dung phản ánh" : "Incident Fields",
      desc: locale === "vi" ? "Tiêu đề và Lĩnh vực sự cố" : "Specify title & category",
    },
    {
      id: "section-3",
      num: 3,
      label: locale === "vi" ? "Chi tiết phản ánh" : "Incident Details",
      desc: locale === "vi" ? "Địa điểm và mô tả chi tiết" : "Location and description",
    },
    {
      id: "section-4",
      num: 4,
      label: locale === "vi" ? "Tài liệu đính kèm" : "Attachments",
      desc: locale === "vi" ? "Thêm hình ảnh, video minh chứng" : "Upload photos and videos",
    },
    {
      id: "section-5",
      num: 5,
      label: locale === "vi" ? "Xác nhận & gửi đơn" : "Review & Sign",
      desc: locale === "vi" ? "Cam đoan và ký xác nhận" : "Terms & signature",
    },
  ];

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 md:px-8 py-16 text-center animate-fade-in">
        <div className="w-24 h-24 rounded-full bg-[var(--status-success)] grid place-items-center mx-auto mb-6 text-white">
          <Check size={56} strokeWidth={3} />
        </div>
        <h1 className="text-3xl md:text-4xl font-heading text-gov-blue mb-4">
          {t("report.submitted")}
        </h1>
        <p className="text-lg text-ink-soft mb-2">{t("report.success.codeLabel")}</p>
        <p className="text-2xl font-mono font-bold mb-8">{trackingCode}</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link to="/my-reports" className="btn-civic btn-civic-primary">
            {t("report.success.viewReports")}
          </Link>
          <Link to="/" className="btn-civic btn-civic-ghost">
            {t("report.success.goHome")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 transition-colors duration-300"
      style={{
        backgroundColor: "#F4EDE4",
        backgroundImage: "radial-gradient(#E8E0D5 1.5px, transparent 1.5px)",
        backgroundSize: "24px 24px",
      }}
    >
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl md:text-4xl text-gov-blue font-extrabold tracking-tight">
              {t("report.title")}
            </h1>
            <p className="text-sm text-slate-650 mt-1 font-sans">
              {locale === "vi"
                ? "Mẫu đơn phản ánh hiện trường trực tuyến"
                : "Online field petition form"}
            </p>
          </div>
          <Link
            to="/"
            className="btn-civic btn-civic-ghost bg-white hover:bg-slate-50 border border-slate-200 self-start text-xs font-bold uppercase tracking-wider py-2"
          >
            <ChevronLeft size={16} /> {locale === "vi" ? "Quay lại Trang chủ" : "Home"}
          </Link>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <aside className="lg:col-span-3 lg:sticky lg:top-[96px] bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 md:p-5">
            <div className="mb-4">
              <h2 className="text-sm font-black uppercase text-gov-blue tracking-tight">
                ĐƠN PHẢN ÁNH HIỆN TRƯỜNG
              </h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">
                Mỗi ý kiến của bạn là sự thay đổi cho thành phố tốt hơn
              </p>
            </div>

            <div className="w-full h-[1px] bg-slate-100 my-4" />

            <div className="hidden lg:flex flex-col gap-4 relative">
              <div className="absolute left-4.5 top-3 bottom-3 w-[2px] bg-slate-100 -z-10" />

              {sections.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => scrollToSection(s.id)}
                  className="flex items-start gap-4 text-left transition-all duration-200 cursor-pointer hover:translate-x-1"
                >
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 border-2 font-bold text-sm bg-white border-slate-200 text-slate-400 hover:border-gov-blue hover:text-gov-blue transition-colors shadow-sm">
                    {s.num}
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-slate-650 leading-tight hover:text-gov-blue transition-colors">
                      {s.label}
                    </p>
                    <p className="text-[9px] text-slate-400 mt-0.5 leading-normal">{s.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex lg:hidden overflow-x-auto gap-4 py-1 -mx-2 px-2 scrollbar-none snap-x">
              {sections.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => scrollToSection(s.id)}
                  className="flex items-center gap-2 shrink-0 snap-center pb-1 text-slate-400 hover:text-gov-blue"
                >
                  <div className="w-6.5 h-6.5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 bg-slate-100 text-slate-400">
                    {s.num}
                  </div>
                  <span className="text-xs font-extrabold">{s.label}</span>
                </button>
              ))}
            </div>
          </aside>

          <main className="lg:col-span-9 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-[#E2DFD6] rounded-[24px] p-6 md:p-12 relative overflow-hidden animate-fade-in-up">
            <div className="hidden md:block">
              <svg
                className="absolute -top-5 right-12 w-8 h-20 text-slate-400/90 drop-shadow-md z-20 transform rotate-6 pointer-events-none"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
            </div>

            <div className="space-y-10 relative z-10 font-sans text-slate-800">
              <div className="text-center space-y-1 pb-6 border-b-2 border-slate-900/10 font-serif">
                <h3 className="font-extrabold tracking-wider text-xs md:text-sm uppercase text-slate-850">
                  CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                </h3>
                <h4 className="font-bold text-[10px] md:text-xs text-slate-700">
                  Độc lập - Tự do - Hạnh phúc
                </h4>
                <div className="w-24 h-[1px] bg-slate-400 mx-auto my-1.5" />
                <h1 className="text-lg md:text-2xl font-black text-gov-blue tracking-tight uppercase font-sans mt-4">
                  ĐƠN PHẢN ÁNH, KIẾN NGHỊ HIỆN TRƯỜNG
                </h1>
                <p className="text-[10px] md:text-xs text-slate-500 font-semibold italic mt-1 font-sans">
                  Kính gửi: Ủy ban Nhân dân và các Cơ quan chức năng Thành phố Đà Nẵng
                </p>
              </div>

              <section id="section-1" className="space-y-4 pt-2 scroll-mt-24">
                <h3 className="font-extrabold text-sm md:text-base uppercase text-gov-blue tracking-wider flex items-center gap-2 border-b border-slate-200/80 pb-2">
                  <span className="bg-gov-blue text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">
                    1
                  </span>
                  I. THÔNG TIN NGƯỜI PHẢN ÁNH
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                      Họ và tên
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 text-slate-400" size={18} />
                      <input
                        type="text"
                        readOnly
                        value={profile?.fullName || user?.name || "---"}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-650 font-bold focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                      Số điện thoại
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 text-slate-400" size={18} />
                      <input
                        type="text"
                        readOnly
                        value={profile?.phoneNumber || "---"}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-650 font-mono font-bold focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                      Địa chỉ Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                      <input
                        type="text"
                        readOnly
                        value={profile?.email || "---"}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-650 font-mono font-bold focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block flex justify-between items-center">
                      <span>Địa chỉ liên hệ chính xác</span>
                      <span className="text-[10px] text-slate-400 lowercase font-medium">
                        không bắt buộc
                      </span>
                    </label>
                    <input
                      type="text"
                      value={contactAddress}
                      onChange={(e) => setContactAddress(e.target.value)}
                      placeholder="Nhập địa chỉ nhà riêng hoặc địa chỉ liên lạc thường trú của bạn..."
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:border-gov-blue focus:ring-1 focus:ring-gov-blue/20 outline-none text-slate-805 text-sm font-medium"
                    />
                  </div>
                </div>
              </section>

              <section id="section-2" className="space-y-4 pt-2 scroll-mt-24">
                <h3 className="font-extrabold text-sm md:text-base uppercase text-gov-blue tracking-wider flex items-center gap-2 border-b border-slate-200/80 pb-2">
                  <span className="bg-gov-blue text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">
                    2
                  </span>
                  II. LĨNH VỰC & TIÊU ĐỀ PHẢN ÁNH
                </h3>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      Tiêu đề đơn phản ánh
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm focus:border-gov-blue focus:ring-1 focus:ring-gov-blue/20 outline-none bg-white font-bold text-slate-800"
                      placeholder={t("report.form.titlePlaceholder")}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      Tôi xin phản ánh về lĩnh vực sự cố
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {categoryOptions.map((category) => {
                        const selected = categoryCode === category.code;
                        return (
                          <button
                            key={category.code}
                            type="button"
                            onClick={() => setCategoryCode(category.code)}
                            className={`relative p-3.5 rounded-xl border text-left transition-all duration-205 cursor-pointer ${
                              selected
                                ? "border-[var(--status-success)] bg-[var(--status-success)]/5 shadow-sm ring-2 ring-[var(--status-success)]/20"
                                : "border-slate-200 bg-white hover:border-gov-blue/40 hover:shadow-sm"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <span className="text-gov-blue shrink-0">
                                {getCategoryIcon(category.code)}
                              </span>
                              {selected && (
                                <span className="w-5 h-5 rounded-full bg-[var(--status-success)] text-white grid place-items-center shrink-0 animate-scale-in">
                                  <Check size={11} strokeWidth={3} />
                                </span>
                              )}
                            </div>
                            <div className="mt-1.5 font-bold text-xs text-slate-800">
                              {category.name}
                            </div>
                            <p className="mt-0.5 text-[10px] leading-4 text-slate-400 font-medium">
                              {category.description}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </section>

              <section id="section-3" className="space-y-4 pt-2 scroll-mt-24">
                <h3 className="font-extrabold text-sm md:text-base uppercase text-gov-blue tracking-wider flex items-center gap-2 border-b border-slate-200/80 pb-2">
                  <span className="bg-gov-blue text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">
                    3
                  </span>
                  III. ĐỊA ĐIỂM & MÔ TẢ CHI TIẾT SỰ VIỆC
                </h3>

                <div className="space-y-4">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                      <div>
                        <p className="font-bold text-slate-850 text-xs uppercase tracking-wider">
                          Địa điểm xảy ra sự cố
                        </p>
                        <p
                          className={`text-[10px] font-bold mt-0.5 ${
                            locationLoading
                              ? "text-slate-450 animate-pulse"
                              : hasLocation
                                ? "text-[var(--status-success)]"
                                : "text-[var(--status-danger)]"
                          }`}
                        >
                          {locationLoading
                            ? t("report.loc.loading")
                            : hasLocation
                              ? t("report.loc.confirmed")
                              : t("report.loc.none")}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={detectLocation}
                          disabled={locationLoading}
                          className="btn-civic btn-civic-ghost bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold py-1.5 px-3 flex items-center gap-1.5 cursor-pointer"
                        >
                          {locationLoading ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <LocateFixed size={14} />
                          )}
                          GPS
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsOpenMapModal(true)}
                          className="btn-civic bg-gov-blue hover:brightness-95 text-white rounded-lg text-xs font-bold py-1.5 px-3 flex items-center gap-1.5 cursor-pointer"
                        >
                          <Map size={14} />
                          {locale === "vi" ? "Xem trên bản đồ" : "Map View"}
                        </button>
                      </div>
                    </div>

                    <div className="relative">
                      <MapPin className="absolute left-3 top-3.5 text-gov-blue" size={18} />
                      <textarea
                        value={incidentAddress}
                        onChange={(e) => setIncidentAddress(e.target.value)}
                        placeholder="Nhập thủ công hoặc kéo ghim bản đồ để điền địa chỉ xảy ra sự cố..."
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:border-gov-blue outline-none text-slate-700 text-sm bg-white font-medium min-h-[60px]"
                      />
                    </div>
                    {expectedWard && (
                      <p className="mt-2 text-xs font-bold text-gov-blue">
                        🧭 {t("report.loc.expectedWard")} {expectedWard}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                        Mô tả chi tiết nội dung sự việc
                      </label>
                      {categoryCode && OFFICIAL_CATEGORY_TEMPLATES[categoryCode] && (
                        <button
                          type="button"
                          onClick={() => {
                            const template = OFFICIAL_CATEGORY_TEMPLATES[categoryCode];
                            setDescription(template);
                            toast.info(
                              locale === "vi"
                                ? "Đã áp dụng mẫu mô tả gợi ý."
                                : "Description template applied.",
                            );
                          }}
                          className="text-[10px] font-bold text-gov-blue hover:underline cursor-pointer bg-blue-50 border border-blue-100 rounded px-2 py-0.5 flex items-center gap-1"
                        >
                          📝 {locale === "vi" ? "Áp dụng mẫu mô tả" : "Apply template"}
                        </button>
                      )}
                    </div>

                    <div className="relative rounded-xl border border-slate-200 overflow-hidden bg-slate-50/50 p-2">
                      <textarea
                        value={description}
                        onChange={(e) => {
                          setDescription(e.target.value);
                          if (piiError) setPiiError("");
                        }}
                        className={`w-full min-h-[220px] px-6 pt-2 pb-2 outline-none text-base bg-transparent font-sans leading-relaxed text-slate-800 resize-none ${
                          piiError ? "border-red-400" : "border-transparent"
                        }`}
                        style={{
                          backgroundImage: "linear-gradient(transparent 96%, #cbd5e1 96%)",
                          backgroundSize: "100% 2.2rem",
                          backgroundPosition: "0 0.5rem",
                          lineHeight: "2.2rem",
                        }}
                        placeholder={t("report.form.contentPlaceholder")}
                      />
                    </div>
                    {piiError && (
                      <div className="mt-2 flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 animate-fade-in">
                        <span className="text-lg leading-none">🔒</span>
                        <span>{piiError}</span>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <section id="section-4" className="space-y-4 pt-2 scroll-mt-24">
                <h3 className="font-extrabold text-sm md:text-base uppercase text-gov-blue tracking-wider flex items-center gap-2 border-b border-slate-200/80 pb-2">
                  <span className="bg-gov-blue text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">
                    4
                  </span>
                  IV. TÀI LIỆU ĐÍNH KÈM MINH CHỨNG
                </h3>

                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-gov-blue/50 rounded-xl p-6 min-h-[120px] flex flex-col items-center justify-center gap-2 text-gov-blue hover:bg-gov-blue/5 transition-all duration-200 cursor-pointer"
                    >
                      <Camera size={32} />
                      <span className="font-bold text-sm">{t("report.form.uploadPhoto")}</span>
                      <span className="text-[10px] text-slate-400 lowercase font-medium">
                        tối đa 5 ảnh, dưới 10MB
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => videoInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-[var(--status-pending)]/50 rounded-xl p-6 min-h-[120px] flex flex-col items-center justify-center gap-2 text-[var(--status-pending)] hover:bg-[var(--status-pending)]/5 transition-all duration-200 cursor-pointer"
                    >
                      <Upload size={32} />
                      <span className="font-bold text-sm">{t("report.form.uploadVideo")}</span>
                      <span className="text-[10px] text-slate-400 lowercase font-medium">
                        tối đa 1 video, dưới 50MB
                      </span>
                    </button>
                  </div>

                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => handlePhotoFilesSelected(e.target.files)}
                    multiple
                  />
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => handleVideoFileSelected(e.target.files)}
                  />

                  {photoPreviews.length > 0 && (
                    <div className="mt-3">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                        Hình ảnh đã chọn ({photos.length})
                      </label>
                      <div className="flex flex-wrap gap-2.5">
                        {photoPreviews.map((preview, idx) => (
                          <div
                            key={`${preview}-${idx}`}
                            className="relative group w-16 h-16 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shadow-sm shrink-0"
                          >
                            <img src={preview} alt="" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => removePhoto(idx)}
                              className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-650/95 text-white rounded-full grid place-items-center shadow-md hover:bg-red-750 transition-colors cursor-pointer animate-scale-in"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {videoPreviews.length > 0 && (
                    <div className="mt-3">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                        Video đã chọn ({videos.length})
                      </label>
                      <div className="relative group aspect-video max-w-sm overflow-hidden rounded-xl border border-slate-200 bg-black shadow-md">
                        <video
                          src={videoPreviews[0]}
                          className="w-full h-full object-cover"
                          muted
                          controls
                        />
                        <button
                          type="button"
                          onClick={removeVideo}
                          className="absolute top-2 right-2 w-7 h-7 bg-red-650/90 text-white rounded-full grid place-items-center shadow-md hover:bg-red-750 transition-colors cursor-pointer animate-scale-in"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              <section id="section-5" className="space-y-6 pt-2 scroll-mt-24">
                <h3 className="font-extrabold text-sm md:text-base uppercase text-gov-blue tracking-wider flex items-center gap-2 border-b border-slate-200/80 pb-2">
                  <span className="bg-gov-blue text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">
                    5
                  </span>
                  V. XÁC NHẬN & CAM KẾT PHÁP LÝ
                </h3>

                {/* Chọn hình thức ký tên */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                        Hình thức ký đơn
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                        Chọn ký tay trực tiếp hoặc chữ ký số tự động
                      </p>
                    </div>
                    <div className="flex bg-slate-200 p-0.5 rounded-lg text-xs self-start sm:self-auto select-none">
                      <button
                        type="button"
                        onClick={() => setSignatureMode("auto")}
                        className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
                          signatureMode === "auto"
                            ? "bg-white text-gov-blue shadow-sm"
                            : "text-slate-500 hover:text-slate-850"
                        }`}
                      >
                        Ký số tự động
                      </button>
                      <button
                        type="button"
                        onClick={() => setSignatureMode("draw")}
                        className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
                          signatureMode === "draw"
                            ? "bg-white text-gov-blue shadow-sm"
                            : "text-slate-500 hover:text-slate-850"
                        }`}
                      >
                        Tự tay ký
                      </button>
                    </div>
                  </div>

                  {signatureMode === "draw" && (
                    <div className="pt-2 animate-fade-in">
                      <SignaturePad onSave={setCustomSignature} />
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 hover:shadow-sm transition-all select-none">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAgreed}
                      onChange={(e) => setIsAgreed(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded text-gov-blue border-slate-300 focus:ring-gov-blue cursor-pointer"
                    />
                    <div className="text-xs md:text-sm font-semibold text-slate-700 leading-normal">
                      Tôi xin cam đoan các thông tin phản ánh trên là đúng sự thật và chịu trách
                      nhiệm trước pháp luật về nội dung phản ánh.
                    </div>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-900/10 items-center">
                  <div className="flex items-center justify-center relative">
                    <div className="relative w-24 h-24 border-4 border-red-500/70 rounded-full flex items-center justify-center p-1 select-none pointer-events-none opacity-80 transform -rotate-12 scale-90 sm:scale-100">
                      <div className="absolute inset-1.5 border border-dashed border-red-500/70 rounded-full" />
                      <div className="text-center font-bold text-red-500/80 leading-tight uppercase font-sans text-[7px] flex flex-col items-center justify-center">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg className="w-full h-full" viewBox="0 0 100 100">
                            <path
                              id="stamp-text-path-sub"
                              d="M 50,50 m -36,0 a 36,36 0 1,1 72,0 a 36,36 0 1,1 -72,0"
                              fill="none"
                            />
                            <text className="fill-red-500/85 font-extrabold text-[7.5px] uppercase tracking-widest font-sans">
                              <textPath
                                href="#stamp-text-path-sub"
                                startOffset="50%"
                                textAnchor="middle"
                              >
                                UY BAN NHAN DAN TP DA NANG •
                              </textPath>
                            </text>
                          </svg>
                        </div>
                        <div className="text-[9px] font-black border-y border-red-500/70 px-1 py-0.5 z-10">
                          DA NANG
                        </div>
                        <div className="text-[7.5px] font-bold mt-0.5 z-10">KET NOI</div>
                      </div>
                    </div>
                  </div>

                  <div className="text-center font-serif flex flex-col items-center justify-center">
                    <p className="text-[9px] md:text-xs text-slate-500 italic">
                      Đà Nẵng,{" "}
                      {format(new Date(), "eeee, 'ngày' dd 'tháng' MM 'năm' yyyy", { locale: vi })
                        .replace("Thứ Bảy", "ngày")
                        .replace("Thứ", "ngày")}
                    </p>
                    <p className="text-xs md:text-sm font-extrabold text-slate-800 mt-1 uppercase font-sans">
                      Người làm đơn
                    </p>
                    <p className="text-[9px] text-slate-450 italic mt-0.5 font-sans">
                      (Ký và ghi rõ họ tên)
                    </p>
                    {signatureMode === "draw" && customSignature ? (
                      <div className="h-16 flex items-center justify-center my-1 select-none pointer-events-none">
                        <img
                          src={customSignature}
                          alt="Chữ ký"
                          className="max-h-full max-w-[150px] object-contain opacity-90"
                        />
                      </div>
                    ) : (
                      <div
                        className="text-center select-none pointer-events-none italic text-2xl tracking-wide opacity-85 text-sky-805 my-2 h-16 flex items-center justify-center"
                        style={{
                          fontFamily: "'Caveat', 'Great Vibes', 'Brush Script MT', cursive",
                        }}
                      >
                        {profile?.fullName || user?.name || "Binh"}
                      </div>
                    )}
                    <p className="text-xs md:text-sm font-extrabold text-slate-755 font-sans">
                      {profile?.fullName || user?.name || "---"}
                    </p>
                  </div>
                </div>
              </section>

              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 flex items-start justify-between gap-4 transition-all hover:shadow-sm">
                <div className="flex gap-3">
                  <span className="text-xl leading-none text-gov-blue shrink-0 mt-0.5">🔒</span>
                  <div>
                    <label
                      htmlFor="private-toggle"
                      className="font-bold text-slate-800 cursor-pointer block select-none text-sm"
                    >
                      {t("report.form.privateLabel")}
                    </label>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {t("report.form.privateHint")}
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                  <input
                    id="private-toggle"
                    type="checkbox"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gov-blue"></div>
                </label>
              </div>

              <div className="rounded-xl border-2 border-amber-200/60 bg-amber-50/20 p-4 text-xs font-semibold text-slate-750 space-y-2">
                <h4 className="font-extrabold text-gov-blue uppercase flex items-center gap-1.5 border-b border-amber-200/85 pb-1">
                  <span>⚖️</span>
                  Căn cứ pháp lý & Trách nhiệm phản ánh
                </h4>
                <p className="leading-relaxed text-slate-650">
                  Khi gửi đơn phản ánh, công dân chịu trách nhiệm trước pháp luật về tính trung thực
                  của các thông tin và tài liệu đính kèm. Hành vi cố ý vu khống sẽ bị xử lý nghiêm
                  theo quy định của Luật Tiếp công dân và Bộ luật Hình sự.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end border-t border-slate-100 pt-6 mt-8">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="btn-civic bg-[var(--status-success)] text-white shadow-lg hover:brightness-90 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none w-full sm:w-auto font-bold py-3 px-10 rounded-xl flex items-center justify-center gap-2 cursor-pointer text-base"
              >
                {createFeedback.isPending ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Check size={20} />
                )}
                {createFeedback.isPending ? t("report.form.submitting") : t("report.submit")}
              </button>
            </div>
          </main>
        </div>
      </div>

      <Dialog open={isOpenMapModal} onOpenChange={setIsOpenMapModal}>
        <DialogContent className="max-w-4xl h-[90vh] md:h-[80vh] overflow-hidden bg-white rounded-2xl shadow-2xl border-0 p-0 flex flex-col z-[10000]">
          <DialogHeader className="p-4 md:p-6 border-b border-slate-100 flex flex-col items-start justify-center shrink-0">
            <DialogTitle className="text-xl font-bold text-gov-blue">
              Bản đồ vị trí sự cố
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-1">
              Kéo ghim đỏ hoặc nhấp trực tiếp trên bản đồ để xác định chính xác vị trí xảy ra sự cố.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 relative bg-slate-50">
            <Suspense
              fallback={
                <div className="w-full h-full flex items-center justify-center text-[#667085] font-sans">
                  <Loader2 className="animate-spin text-gov-blue mr-2" size={20} />
                  {t("report.loc.loadingMap")}
                </div>
              }
            >
              <ReportMap
                mapCenter={mapCenter}
                hasLocation={hasLocation}
                markerDisplayed={markerDisplayed}
                latitude={latitude}
                longitude={longitude}
                address={address}
                locationLoading={locationLoading}
                onChangeLocation={applyLocation}
              />
            </Suspense>
          </div>
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
            <p className="text-xs font-semibold text-slate-600 min-w-0 max-w-[70%] truncate">
              📍 Vị trí hiện tại:{" "}
              <span className="font-bold text-slate-800">
                {incidentAddress || address || "Chưa ghim vị trí"}
              </span>
            </p>
            <button
              onClick={() => setIsOpenMapModal(false)}
              className="bg-gov-blue hover:brightness-95 text-white font-bold text-xs py-2 px-5 rounded-lg cursor-pointer"
            >
              Xác nhận vị trí
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
