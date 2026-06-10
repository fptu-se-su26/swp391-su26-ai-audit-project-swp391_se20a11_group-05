import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useCategories, useCreateFeedback } from "@/lib/hooks";
import { ApiError, getToken, wardApi } from "@/lib/api";
import {
  clearGpsLocation,
  getStoredGpsLocation,
  requestCurrentGpsLocation,
  storeGpsLocation,
} from "@/lib/location";
import { toast } from "sonner";
import {
  Building2,
  Camera,
  Car,
  Check,
  Loader2,
  LocateFixed,
  MapPin,
  ShieldCheck,
  TreePine,
  Upload,
  X,
} from "lucide-react";

export const Route = createFileRoute("/report")({
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

const API_BASE: string =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE) || "";

const DEFAULT_MAP_CENTER: [number, number] = [16.0544, 108.2022];

const currentLocationIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      width: 34px;
      height: 34px;
      border-radius: 9999px;
      background: #00387b;
      border: 4px solid #ffffff;
      box-shadow: 0 10px 24px rgba(0, 56, 123, 0.35);
      display: grid;
      place-items: center;
    ">
      <div style="width: 10px; height: 10px; border-radius: 9999px; background: #d4af37;"></div>
    </div>
  `,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

function MapViewUpdater({ center }: { center: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, 17, { animate: true });
  }, [center, map]);

  return null;
}

function getVietnameseGpsErrorMessage(error: unknown): string {
  const code =
    typeof error === "object" && error && "code" in error ? Number(error.code) : undefined;

  if (error instanceof Error && error.message === "GEOLOCATION_UNSUPPORTED") {
    return "Trình duyệt của bạn không hỗ trợ GPS.";
  }

  if (code === 1) {
    return "Bạn đã từ chối quyền truy cập vị trí. Vui lòng cấp quyền GPS để gửi phản ánh.";
  }

  if (code === 2) {
    return "Không thể xác định vị trí hiện tại. Vui lòng kiểm tra GPS hoặc kết nối mạng.";
  }

  if (code === 3) {
    return "Yêu cầu lấy vị trí đã hết thời gian chờ. Vui lòng thử lại.";
  }

  return "Không thể lấy vị trí hiện tại. Vui lòng thử lại.";
}

function ReportPage() {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [trackingCode, setTrackingCode] = useState("");

  const { data: categories } = useCategories();
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const createFeedback = useCreateFeedback();

  const storedLocation = getStoredGpsLocation();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [latitude, setLatitude] = useState<number | null>(storedLocation?.latitude ?? null);
  const [longitude, setLongitude] = useState<number | null>(storedLocation?.longitude ?? null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [detectedWard, setDetectedWard] = useState("");
  const [locationConfirmed, setLocationConfirmed] = useState(!!storedLocation);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const hasLocation = latitude !== null && longitude !== null;
  const markerDisplayed = hasLocation && !locationLoading;
  const mapCenter = useMemo<[number, number]>(
    () => (hasLocation ? [latitude, longitude] : DEFAULT_MAP_CENTER),
    [hasLocation, latitude, longitude],
  );
  const canSubmit =
    photos.length > 0 &&
    description.trim().length > 0 &&
    hasLocation &&
    markerDisplayed &&
    locationConfirmed &&
    !createFeedback.isPending &&
    !uploading;

  useEffect(() => {
    if (categories && categories.length > 0 && categoryId === undefined) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId]);

  useEffect(() => {
    if (!storedLocation) {
      detectLocation();
    }
    // Auto GPS runs once on page open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getCategoryIcon = (name: string) => {
    const n = name.toLowerCase();
    if (
      n.includes("infrastructure") ||
      n.includes("hạ tầng") ||
      n.includes("ha tang") ||
      n.includes("infra")
    )
      return <Building2 size={24} />;
    if (
      n.includes("environment") ||
      n.includes("môi trường") ||
      n.includes("moi truong") ||
      n.includes("env")
    )
      return <TreePine size={24} />;
    if (n.includes("traffic") || n.includes("giao thông") || n.includes("giao thong"))
      return <Car size={24} />;
    if (n.includes("safety") || n.includes("security") || n.includes("an ninh"))
      return <ShieldCheck size={24} />;
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

  const removePhoto = (idx: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const uploadPhotos = async (feedbackId: number): Promise<string[]> => {
    if (photos.length === 0) return [];
    const token = getToken();
    const urls: string[] = [];
    setUploading(true);

    try {
      for (const photo of photos) {
        const formData = new FormData();
        formData.append("file", photo);
        const res = await fetch(`${API_BASE}/api/files/upload/${feedbackId}`, {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          urls.push(data.fileUrl);
        }
      }
    } finally {
      setUploading(false);
    }

    return urls;
  };

  const applyLocation = async (nextLatitude: number, nextLongitude: number) => {
    setLatitude(nextLatitude);
    setLongitude(nextLongitude);
    setLocationError("");
    setLocationConfirmed(false);
    storeGpsLocation({ latitude: nextLatitude, longitude: nextLongitude });

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
    setLocationConfirmed(false);

    try {
      const location = await requestCurrentGpsLocation();
      await applyLocation(location.latitude, location.longitude);
      toast.success("Đã lấy vị trí GPS hiện tại.");
    } catch (err) {
      const message = getVietnameseGpsErrorMessage(err);
      clearGpsLocation();
      setLatitude(null);
      setLongitude(null);
      setLocationError(message);
      toast.error(message);
    } finally {
      setLocationLoading(false);
    }
  }

  const validateBeforeSubmit = () => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để gửi phản ánh.");
      return false;
    }
    if (!categoryId) {
      toast.error("Vui lòng chọn loại phản ánh.");
      return false;
    }
    if (photos.length === 0) {
      toast.error("Vui lòng tải lên ít nhất một ảnh hoặc video.");
      return false;
    }
    if (!description.trim()) {
      toast.error("Vui lòng nhập nội dung phản ánh.");
      return false;
    }
    if (!hasLocation) {
      toast.error("Chưa có tọa độ GPS. Vui lòng bấm Lấy lại vị trí.");
      return false;
    }
    if (!markerDisplayed) {
      toast.error("Bản đồ chưa hiển thị ghim vị trí. Vui lòng đợi bản đồ tải xong.");
      return false;
    }
    if (!locationConfirmed) {
      toast.error("Vui lòng xác nhận vị trí trên bản đồ trước khi gửi.");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateBeforeSubmit() || latitude === null || longitude === null || !categoryId) {
      return;
    }

    try {
      const result = await createFeedback.mutateAsync({
        title: title.trim() || (locale === "vi" ? "Phản ánh mới" : "New report"),
        description: description.trim(),
        latitude,
        longitude,
        addressDetails: detectedWard
          ? `${detectedWard} (${latitude}, ${longitude})`
          : `${latitude}, ${longitude}`,
        categoryId,
      });

      if (photos.length > 0 && result.id) {
        await uploadPhotos(result.id);
      }

      setTrackingCode(result.trackingCode || "FB-XXXXXXXX");
      setSubmitted(true);
      toast.success("Gửi phản ánh thành công!");
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Không thể gửi phản ánh. Vui lòng thử lại.");
      }
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
        <p className="text-lg text-ink-soft mb-2">Mã phản ánh / Report ID:</p>
        <p className="text-2xl font-mono font-bold mb-8">{trackingCode}</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link to="/my-reports" className="btn-civic btn-civic-primary">
            Xem báo cáo của tôi
          </Link>
          <Link to="/" className="btn-civic btn-civic-ghost">
            Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
      <h1 className="font-heading text-4xl md:text-5xl text-gov-blue mb-6">{t("report.title")}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.9fr)] gap-6 lg:gap-8 items-start">
        <section className="card-civic p-5 md:p-8 animate-fade-in-up">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold mb-2">Tiêu đề phản ánh</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full min-h-[48px] px-4 rounded-lg border-2 border-slate-200 text-base focus:border-gov-blue outline-none bg-white"
                placeholder="VD: Ổ gà lớn trên đường Hùng Vương"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Loại phản ánh</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(categories && categories.length > 0
                  ? categories.map((category) => ({ id: category.id, name: category.name }))
                  : [
                      { id: 1, name: "Hạ tầng" },
                      { id: 2, name: "Môi trường" },
                      { id: 3, name: "Giao thông" },
                      { id: 4, name: "An ninh" },
                    ]
                ).map((category) => {
                  const selected = categoryId === category.id;
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setCategoryId(category.id)}
                      className={`relative p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                        selected
                          ? "border-gov-blue bg-gov-blue/5 shadow-sm ring-2 ring-gov-blue/20"
                          : "border-slate-200 bg-white hover:border-gov-blue/40 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-gov-blue shrink-0">
                          {getCategoryIcon(category.name)}
                        </span>
                        {selected && (
                          <span className="w-6 h-6 rounded-full bg-gov-blue text-white grid place-items-center shrink-0 animate-scale-in">
                            <Check size={14} strokeWidth={3} />
                          </span>
                        )}
                      </div>
                      <div className="mt-2 font-semibold text-sm">{category.name}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Ảnh / Video</label>
              <div className="grid sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gov-blue rounded-lg p-8 min-h-[148px] flex flex-col items-center justify-center gap-3 text-gov-blue hover:bg-gov-blue/5 transition-all duration-200"
                >
                  <Camera size={42} />
                  <span className="font-bold text-base">Chụp ảnh/quay video</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-[var(--status-pending)] rounded-lg p-8 min-h-[148px] flex flex-col items-center justify-center gap-3 text-[var(--status-pending)] hover:bg-[var(--status-pending)]/5 transition-all duration-200"
                >
                  <Upload size={42} />
                  <span className="font-bold text-base">Chọn từ thư viện</span>
                </button>
              </div>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*,video/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handleFilesSelected(e.target.files)}
                multiple
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => handleFilesSelected(e.target.files)}
                multiple
              />
              {photoPreviews.length > 0 && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {photoPreviews.map((preview, idx) => (
                    <div key={`${preview}-${idx}`} className="relative group aspect-square">
                      {photos[idx]?.type.startsWith("video/") ? (
                        <video
                          src={preview}
                          className="w-full h-full object-cover rounded-lg border border-slate-200 bg-black"
                          muted
                        />
                      ) : (
                        <img
                          src={preview}
                          alt=""
                          className="w-full h-full object-cover rounded-lg border border-slate-200"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        className="absolute top-1 right-1 w-7 h-7 bg-red-600 text-white rounded-full grid place-items-center opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Xóa tệp đã chọn"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Nội dung phản ánh</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full min-h-[150px] p-4 rounded-lg border-2 border-slate-200 text-base focus:border-gov-blue outline-none bg-white"
                placeholder="Mô tả rõ sự cố, mức độ ảnh hưởng và thông tin cần cơ quan chức năng biết..."
              />
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="font-bold text-ink">Xác nhận vị trí</p>
                  <p
                    className={`text-sm font-semibold ${hasLocation ? "text-[var(--status-success)]" : "text-[var(--status-danger)]"}`}
                  >
                    {hasLocation ? "Đã lấy vị trí" : "Chưa có vị trí"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={detectLocation}
                  disabled={locationLoading}
                  className="btn-civic btn-civic-ghost disabled:opacity-50"
                >
                  {locationLoading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <LocateFixed size={20} />
                  )}
                  Lấy lại vị trí
                </button>
              </div>

              <div className="mt-4 grid sm:grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-white border border-slate-200 p-3">
                  <span className="block text-ink-soft mb-1">Latitude</span>
                  <span className="font-mono font-bold">
                    {latitude !== null ? latitude.toFixed(6) : "Chưa có"}
                  </span>
                </div>
                <div className="rounded-lg bg-white border border-slate-200 p-3">
                  <span className="block text-ink-soft mb-1">Longitude</span>
                  <span className="font-mono font-bold">
                    {longitude !== null ? longitude.toFixed(6) : "Chưa có"}
                  </span>
                </div>
              </div>

              {detectedWard && (
                <p className="mt-3 text-sm font-semibold text-gov-blue">
                  Phường/Xã xử lý dự kiến: {detectedWard}
                </p>
              )}
              {locationLoading && (
                <p className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-ink-soft">
                  <Loader2 size={16} className="animate-spin" />
                  Đang lấy vị trí GPS hiện tại...
                </p>
              )}
              {locationError && (
                <p className="mt-3 text-sm font-semibold text-[var(--status-danger)]">
                  {locationError}
                </p>
              )}

              <label className="mt-4 flex items-start gap-3 text-sm font-semibold text-ink">
                <input
                  type="checkbox"
                  checked={locationConfirmed}
                  onChange={(e) => setLocationConfirmed(e.target.checked)}
                  disabled={!markerDisplayed}
                  className="mt-1 h-4 w-4 accent-[var(--gov-blue)] disabled:opacity-50"
                />
                Tôi đã kiểm tra ghim trên bản đồ và xác nhận vị trí phản ánh là chính xác.
              </label>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="btn-civic bg-status-success text-white shadow-lg hover:brightness-90 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none w-full sm:w-auto"
            >
              {createFeedback.isPending || uploading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Check size={20} />
              )}
              {uploading ? "Đang tải tệp..." : t("report.submit")}
            </button>
          </div>
        </section>

        <aside className="card-civic p-4 md:p-5 lg:sticky lg:top-24 animate-fade-in-up">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h2 className="text-2xl font-heading text-gov-blue">Bản đồ vị trí</h2>
              <p className="text-sm text-ink-soft mt-1">
                Kiểm tra ghim vị trí hiện tại trước khi gửi.
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${markerDisplayed ? "bg-green-50 text-[var(--status-success)]" : "bg-red-50 text-[var(--status-danger)]"}`}
            >
              {markerDisplayed ? "Có ghim" : "Chưa có ghim"}
            </span>
          </div>

          <div className="relative h-[360px] sm:h-[420px] lg:h-[560px] overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
            <MapContainer
              center={mapCenter}
              zoom={hasLocation ? 17 : 13}
              className="w-full h-full"
              scrollWheelZoom
            >
              <MapViewUpdater center={mapCenter} />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {markerDisplayed && latitude !== null && longitude !== null && (
                <Marker position={[latitude, longitude]} icon={currentLocationIcon}>
                  <Popup>
                    <strong>Vị trí hiện tại</strong>
                    <p className="text-sm mt-1">
                      {latitude.toFixed(6)}, {longitude.toFixed(6)}
                    </p>
                  </Popup>
                </Marker>
              )}
            </MapContainer>

            {!markerDisplayed && (
              <div className="absolute inset-x-4 top-4 rounded-lg border border-white/70 bg-white/95 p-4 shadow-sm z-[500]">
                <div className="flex items-start gap-3">
                  <MapPin className="text-gov-blue shrink-0 mt-0.5" size={22} />
                  <div>
                    <p className="font-bold text-ink">Đang chờ vị trí</p>
                    <p className="text-sm text-ink-soft">
                      {locationLoading
                        ? "Hệ thống đang xin quyền GPS..."
                        : "Bấm Lấy lại vị trí để hiển thị ghim trên bản đồ."}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
