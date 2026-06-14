import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, lazy, Suspense } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useCategories, useCreateFeedbackWithMedia } from "@/lib/hooks";
import { ApiError, wardApi } from "@/lib/api";
import { getVideoDurationSeconds } from "@/lib/citizenFeedbackMediaApi";
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

const ReportMap = lazy(() =>
  import("@/components/site/ReportMap").then((m) => ({ default: m.ReportMap })),
);

const API_BASE: string =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE) || "";

const DEFAULT_MAP_CENTER: [number, number] = [16.0544, 108.2022];
const CURRENT_LOCATION_ZOOM = 17;

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

function ReportPage() {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [trackingCode, setTrackingCode] = useState("");

  const { data: categories } = useCategories();
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const createFeedback = useCreateFeedbackWithMedia();

  const storedLocation = getStoredGpsLocation();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [latitude, setLatitude] = useState<number | null>(storedLocation?.latitude ?? null);
  const [longitude, setLongitude] = useState<number | null>(storedLocation?.longitude ?? null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [address, setAddress] = useState("");
  const [addressError, setAddressError] = useState("");
  const [detectedWard, setDetectedWard] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [videos, setVideos] = useState<File[]>([]);
  const [videoPreviews, setVideoPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
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
  const canSubmit =
    photos.length > 0 &&
    videos.length > 0 &&
    description.trim().length > 0 &&
    hasLocation &&
    !locationLoading &&
    !createFeedback.isPending &&
    !uploading;

  useEffect(() => {
    if (categories && categories.length > 0 && categoryId === undefined) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId]);

  useEffect(() => {
    if (storedLocation) {
      void loadAddress(storedLocation.latitude, storedLocation.longitude);
    } else {
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
        formData.append("file", photo);
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
      await applyLocation(location.latitude, location.longitude);
      toast.success(t("report.loc.gpsSuccess"));
    } catch (err) {
      const message = getGpsErrorMessage(err, t);
      clearGpsLocation();
      setLatitude(null);
      setLongitude(null);
      setAddress("");
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
    if (!categoryId) {
      toast.error(t("report.err.category"));
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
    return true;
  };

  const handleSubmit = async () => {
    if (!validateBeforeSubmit() || latitude === null || longitude === null || !categoryId) {
      return;
    }

    try {
      const videoDurationsSeconds = await Promise.all(videos.map(getVideoDurationSeconds));
      const result = await createFeedback.mutateAsync({
        data: {
          title: title.trim() || (locale === "vi" ? "Phản ánh mới" : "New report"),
          description: description.trim(),
          latitude,
          longitude,
          addressDetails: address || detectedWard || `${latitude}, ${longitude}`,
          categoryId,
          videoDurationsSeconds,
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
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
      <h1 className="font-heading text-4xl md:text-5xl text-gov-blue mb-6">{t("report.title")}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.9fr)] gap-6 lg:gap-8 items-start">
        <section className="card-civic p-5 md:p-8 animate-fade-in-up">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold mb-2">{t("report.form.titleLabel")}</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full min-h-[48px] px-4 rounded-lg border-2 border-slate-200 text-base focus:border-gov-blue outline-none bg-white"
                placeholder={t("report.form.titlePlaceholder")}
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">{t("report.form.category")}</label>
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
              <label className="block text-sm font-bold mb-2">{t("report.form.media")}</label>
              <div className="grid sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gov-blue rounded-lg p-8 min-h-[148px] flex flex-col items-center justify-center gap-3 text-gov-blue hover:bg-gov-blue/5 transition-all duration-200"
                >
                  <Camera size={42} />
                  <span className="font-bold text-base">{t("report.form.uploadPhoto")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-[var(--status-pending)] rounded-lg p-8 min-h-[148px] flex flex-col items-center justify-center gap-3 text-[var(--status-pending)] hover:bg-[var(--status-pending)]/5 transition-all duration-200"
                >
                  <Upload size={42} />
                  <span className="font-bold text-base">{t("report.form.uploadVideo")}</span>
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
                        aria-label={t("report.err.removeFile")}
                      >
                        <X size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {videoPreviews.length > 0 && (
                <div className="mt-4">
                  <div className="relative group aspect-video max-w-xl overflow-hidden rounded-lg border border-slate-200 bg-black">
                    <video
                      src={videoPreviews[0]}
                      className="w-full h-full object-cover"
                      muted
                      controls
                    />
                    <button
                      type="button"
                      onClick={removeVideo}
                      className="absolute top-2 right-2 w-8 h-8 bg-red-600 text-white rounded-full grid place-items-center opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label={t("report.err.removeVideo")}
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">{t("report.form.content")}</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full min-h-[150px] p-4 rounded-lg border-2 border-slate-200 text-base focus:border-gov-blue outline-none bg-white"
                placeholder={t("report.form.contentPlaceholder")}
              />
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-ink">{t("report.loc.title")}</p>
                  <p
                    className={`text-sm font-semibold ${
                      locationLoading
                        ? "text-ink-soft"
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
                  {t("report.loc.refresh")}
                </button>
              </div>

              <div className="mt-4 rounded-lg bg-white border border-slate-200 p-4 text-sm">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 shrink-0 text-gov-blue" size={20} />
                  <p className="min-w-0 leading-6 text-ink">
                    {locationLoading
                      ? t("report.loc.gpsRequest")
                      : addressLoading
                        ? t("report.loc.addressLoading")
                        : address ||
                          addressError ||
                          (hasLocation
                            ? t("report.loc.noAddress")
                            : t("report.loc.clickRefresh"))}
                  </p>
                </div>
              </div>

              {expectedWard && (
                <p className="mt-3 text-sm font-semibold text-gov-blue">
                  {t("report.loc.expectedWard")} {expectedWard}
                </p>
              )}
              {locationLoading && (
                <p className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-ink-soft">
                  <Loader2 size={16} className="animate-spin" />
                  {t("report.loc.gpsLoading")}
                </p>
              )}
              {locationError && (
                <p className="mt-3 text-sm font-semibold text-[var(--status-danger)]">
                  {locationError}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="btn-civic bg-status-success text-white shadow-lg hover:brightness-90 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none w-full sm:w-auto"
            >
              {createFeedback.isPending ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Check size={20} />
              )}
              {createFeedback.isPending ? t("report.form.submitting") : t("report.submit")}
            </button>
          </div>
        </section>

        <aside className="card-civic p-4 md:p-5 animate-fade-in-up lg:sticky lg:top-[120px] lg:self-start">
          <div className="mb-4">
            <div>
              <h2 className="text-2xl font-heading text-gov-blue">{t("report.loc.mapTitle")}</h2>
              <p className="text-sm text-ink-soft mt-1">
                {t("report.loc.mapHint")}
              </p>
            </div>
          </div>

          <div className="relative h-[300px] sm:h-[360px] lg:h-[520px] overflow-hidden rounded-[20px] border border-slate-200 bg-slate-100">
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
              />
            </Suspense>
          </div>
        </aside>
      </div>
    </div>
  );
}
