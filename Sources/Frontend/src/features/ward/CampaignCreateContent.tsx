import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ElementType, FormEvent, ReactNode } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Camera,
  ClipboardList,
  Eye,
  Layers,
  Lightbulb,
  Lock,
  MapPin,
  Package,
  Search,
  Send,
  ShieldCheck,
  Users,
  HelpCircle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { useCreateCampaign } from "@/hooks/useCampaigns";
import { Role, useAuth } from "@/lib/auth";
import type { CampaignCategory } from "@/lib/campaignStore";
import { getToken } from "@/lib/api";

const API_BASE: string =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE) || "";


const categories: { value: CampaignCategory; label: string }[] = [
  { value: "environment", label: "Môi trường" },
  { value: "infrastructure", label: "Hạ tầng" },
  { value: "public_safety", label: "An toàn cộng đồng" },
  { value: "construction", label: "Xây dựng" },
  { value: "fire_safety", label: "Phòng cháy chữa cháy" },
];

const categoryImages: Record<CampaignCategory, string> = {
  environment:
    "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&auto=format&fit=crop&q=80",
  infrastructure:
    "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80",
  public_safety:
    "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=600&auto=format&fit=crop&q=80",
  construction:
    "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&auto=format&fit=crop&q=80",
  fire_safety:
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&auto=format&fit=crop&q=80",
};

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/15";

interface CampaignCreateContentProps {
  onBack?: () => void;
  onSuccess?: (campaignId: string) => void;
}

export function CampaignCreateContent({ onBack, onSuccess }: CampaignCreateContentProps) {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { submit, isLoading } = useCreateCampaign();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<CampaignCategory>("environment");
  const [locationText, setLocationText] = useState("");
  const [radiusText, setRadiusText] = useState("200");
  const [description, setDescription] = useState("");
  const [privateLocationText, setPrivateLocationText] = useState("");
  const [requiredTools, setRequiredTools] = useState("");
  const [organizerContact, setOrganizerContact] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startHour, setStartHour] = useState("08");
  const [startMinute, setStartMinute] = useState("00");
  const [endDate, setEndDate] = useState("");
  const [endHour, setEndHour] = useState("17");
  const [endMinute, setEndMinute] = useState("00");

  const startClock = useMemo(() => `${startHour}:${startMinute}`, [startHour, startMinute]);
  const endClock = useMemo(() => `${endHour}:${endMinute}`, [endHour, endMinute]);

  const todayStr = useMemo(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);
  const [maxParticipants, setMaxParticipants] = useState("30");
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedCoordinates, setSelectedCoordinates] = useState<{
    lat: number;
    lng: number;
    zoom: number;
  }>(() => {
    return { lat: 16.0544, lng: 108.2022, zoom: 13 };
  });

  const lastResolvedAddressRef = useRef("");

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [createdCampaignId, setCreatedCampaignId] = useState<number | string | null>(null);

  useEffect(() => {
    const trimmed = locationText.trim();
    if (!trimmed) {
      setSelectedCoordinates({ lat: 16.0544, lng: 108.2022, zoom: 13 });
      return;
    }

    if (trimmed === lastResolvedAddressRef.current) {
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const query = encodeURIComponent(`${trimmed}, Đà Nẵng, Việt Nam`);
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${query}`
        );
        const results = await response.json();
        if (results && results[0]) {
          const lat = Number(results[0].lat);
          const lng = Number(results[0].lon);
          if (Number.isFinite(lat) && Number.isFinite(lng)) {
            setSelectedCoordinates({ lat, lng, zoom: 16 });
          }
        }
      } catch (e) {
        // ignore
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [locationText]);

  const canCreate = isAuthenticated && user?.role === Role.WARD_STAFF;
  const startTime = combineDateTime(startDate, startClock);
  const endTime = combineDateTime(endDate, endClock);

  const durationText = useMemo(() => {
    if (!startTime || !endTime) return null;
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
    const diffMs = end.getTime() - start.getTime();
    if (diffMs <= 0) return "Thời gian kết thúc phải diễn ra sau thời gian bắt đầu";
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    const remainingHours = diffHours % 24;
    if (diffDays > 0)
      return `Thời gian diễn ra: ${diffDays} ngày ${remainingHours > 0 ? `${remainingHours} giờ` : ""}`;
    return `Thời gian diễn ra: ${diffHours} giờ`;
  }, [startTime, endTime]);

  const isDurationError = !!(durationText && durationText.includes("phải diễn ra sau"));
  const previewImage = photoPreviews.length > 0 ? photoPreviews[0] : categoryImages[category];

  const handlePhotosUpload = (files: FileList | null) => {
    if (!files) return;
    const validFiles: File[] = [];

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error(`File "${file.name}" không phải là ảnh hợp lệ.`);
        return;
      }
      validFiles.push(file);
    });

    if (validFiles.length === 0) return;

    if (selectedPhotos.length + validFiles.length > 5) {
      toast.warning("Chỉ cho phép tải lên tối đa 5 ảnh.");
    }

    const filesToAppend = validFiles.slice(0, 5 - selectedPhotos.length);
    if (filesToAppend.length === 0) return;

    setSelectedPhotos((prev) => [...prev, ...filesToAppend]);

    filesToAppend.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoPreviews((prev) => [...prev, String(reader.result)]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setSelectedPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!title.trim()) {
      toast.error("Vui lòng nhập tên chiến dịch.");
      return;
    }
    if (!locationText.trim()) {
      toast.error("Vui lòng nhập khu vực công khai.");
      return;
    }
    if (!description.trim()) {
      toast.error("Vui lòng nhập mô tả công khai.");
      return;
    }
    if (!privateLocationText.trim()) {
      toast.error("Vui lòng nhập điểm tập kết nội bộ.");
      return;
    }
    if (!requiredTools.trim()) {
      toast.error("Vui lòng nhập danh sách dụng cụ cần thiết.");
      return;
    }
    if (!organizerContact.trim()) {
      toast.error("Vui lòng nhập thông tin liên hệ ban tổ chức.");
      return;
    }
    if (!startTime) {
      toast.error("Vui lòng chọn thời gian bắt đầu chiến dịch.");
      return;
    }
    if (!endTime) {
      toast.error("Vui lòng chọn thời gian kết thúc chiến dịch.");
      return;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();

    if (start < new Date(now.getTime() - 5 * 60 * 1000)) {
      toast.error("Thời gian bắt đầu không thể ở trong quá khứ.");
      return;
    }
    if (end <= start) {
      toast.error("Thời gian kết thúc phải diễn ra sau thời gian bắt đầu.");
      return;
    }

    const maxPartNum = Number.parseInt(maxParticipants, 10);
    if (Number.isNaN(maxPartNum) || maxPartNum <= 0) {
      toast.error("Số lượng tình nguyện viên tối đa phải là số nguyên dương.");
      return;
    }

    setShowConfirmDialog(true);
  };

  const performSubmit = async () => {
    setShowConfirmDialog(false);
    setIsUploading(true);
    const radiusVal = Number(radiusText) || 0;
    const boundaryGeojson = radiusVal > 0 
      ? createGeoJsonCircle(selectedCoordinates, radiusVal)
      : undefined;

    const uploadToastId = toast.loading("Đang tải lên các hình ảnh...");
    const uploadedUrls: string[] = [];

    try {
      const token = getToken();
      for (const file of selectedPhotos) {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch(`${API_BASE}/api/files/upload`, {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });

        if (!res.ok) {
          throw new Error(`Tải lên ảnh ${file.name} thất bại.`);
        }

        const data = await res.json();
        if (data && data.fileUrl) {
          uploadedUrls.push(data.fileUrl);
        } else {
          throw new Error(`Không nhận được phản hồi URL cho ảnh ${file.name}.`);
        }
      }

      if (selectedPhotos.length > 0) {
        toast.success("Tải lên hình ảnh thành công.", { id: uploadToastId });
      } else {
        toast.dismiss(uploadToastId);
      }

      const coverImageUrl = uploadedUrls.length > 0 ? uploadedUrls[0] : undefined;

      const campaign = await submit({
        title: title.trim(),
        category,
        description: description.trim(),
        locationText: locationText.trim(),
        privateLocationText: privateLocationText.trim(),
        requiredTools: requiredTools.trim(),
        organizerContact: organizerContact.trim(),
        startTime,
        endTime,
        maxParticipants,
        wardName: user?.org,
        latitude: selectedCoordinates.lat,
        longitude: selectedCoordinates.lng,
        boundaryGeojson,
        coverImageUrl,
        imageUrls: uploadedUrls,
      });

      setCreatedCampaignId(campaign.id);
      setShowSuccessDialog(true);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể gửi chiến dịch để phê duyệt.",
        { id: uploadToastId }
      );
    } finally {
      setIsUploading(false);
    }
  };

  if (!canCreate) {
    return (
      <section className="mx-auto max-w-2xl rounded-2xl border border-violet-100 bg-white p-8 shadow-md text-left">
        <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-red-50 text-red-600">
          <Lock size={22} />
        </div>
        <h1 className="text-2xl font-black text-slate-900">Quyền truy cập bị giới hạn</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Chỉ có cán bộ địa phương phụ trách được cấp quyền tạo các chiến dịch cộng đồng mới.
          Người dân có thể đăng ký tham gia các chiến dịch khi đã được phê duyệt chính thức.
        </p>
        <Link
          to="/campaigns"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#7C3AED] px-4 py-2 text-sm font-bold text-white transition hover:brightness-110"
        >
          <ArrowLeft size={16} />
          Quay lại danh sách
        </Link>
      </section>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="mx-auto max-w-[1280px]">
      <header className="mb-8 text-left">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-sm font-bold text-slate-500">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="transition hover:text-[#7C3AED] cursor-pointer"
            >
              Chiến dịch
            </button>
          ) : (
            <Link to="/campaigns" className="transition hover:text-[#7C3AED]">
              Chiến dịch
            </Link>
          )}
          <span>/</span>
          <span className="text-[#7C3AED]">Tạo chiến dịch mới</span>
      </div>
      <h1 className="flex items-center gap-3 text-3xl font-black tracking-tight text-slate-950">
        Tạo chiến dịch mới
      </h1>
    </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,60fr)_minmax(320px,40fr)] text-left">
        <div className="space-y-6">
          <section className="rounded-2xl border border-violet-100 bg-white p-7 shadow-md">
            <SectionTitle
              number="1"
              title="Thông tin chung"
              subtitle="Hiển thị công khai cho người dân khi tìm kiếm chiến dịch."
            />

            <div className="mt-5">
              <span className="mb-2 flex items-center gap-2 text-sm font-black text-slate-800">
                <Camera size={15} className="text-[#7C3AED]" />
                Hình ảnh chiến dịch (Tối đa 5 ảnh, ảnh đầu tiên làm ảnh bìa)
              </span>
              
              {photoPreviews.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
                  {photoPreviews.map((preview, index) => (
                    <div key={index} className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm">
                      <img src={preview} alt={`Preview ${index}`} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                      
                      {index === 0 && (
                        <span className="absolute left-2 top-2 rounded-lg bg-[#7C3AED] px-2 py-0.5 text-[10px] font-extrabold text-white shadow-md">
                          Ảnh bìa
                        </span>
                      )}
                      
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900/70 text-white opacity-0 transition duration-200 hover:bg-slate-900 group-hover:opacity-100 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  
                  {photoPreviews.length < 5 && (
                    <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-violet-200 bg-[#F8F7FF] transition hover:border-[#7C3AED] hover:bg-[#F3F0FF]">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="sr-only"
                        onChange={(event) => handlePhotosUpload(event.target.files)}
                      />
                      <Camera size={20} className="text-[#7C3AED] mb-1" />
                      <span className="text-[11px] font-black text-slate-700">Thêm ảnh</span>
                    </label>
                  )}
                </div>
              ) : (
                <label
                  className="block cursor-pointer rounded-2xl border-2 border-dashed border-violet-200 bg-[#F8F7FF] p-6 transition hover:border-[#7C3AED]"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    handlePhotosUpload(event.dataTransfer.files);
                  }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="sr-only"
                    onChange={(event) => handlePhotosUpload(event.target.files)}
                  />
                  <div className="grid aspect-[16/9] place-items-center rounded-xl bg-white text-center">
                    <div>
                      <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-[#F3F0FF] text-[#7C3AED]">
                        <Camera size={22} />
                      </div>
                      <p className="mt-3 text-sm font-black text-slate-800">
                        Kéo thả hoặc click để upload các ảnh chiến dịch
                      </p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        Hỗ trợ tối đa 5 ảnh. Khuyến nghị tỉ lệ 16:9, ảnh rõ chủ đề chiến dịch.
                      </p>
                    </div>
                  </div>
                </label>
              )}
            </div>

            <div className="mt-6 space-y-5">
              <Field icon={ClipboardList} label="Tên chiến dịch" required>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className={inputClass}
                  placeholder="Ví dụ: Dọn rác bãi biển Mỹ Khê chủ nhật xanh"
                />
              </Field>

              <div className="grid gap-4 md:grid-cols-2">
                <Field icon={Package} label="Lĩnh vực">
                  <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value as CampaignCategory)}
                    className={inputClass}
                  >
                    {categories.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field icon={Users} label="Tình nguyện viên cần tuyển">
                  <input
                    value={maxParticipants}
                    onChange={(event) => setMaxParticipants(event.target.value)}
                    className={inputClass}
                    type="number"
                    min="1"
                    placeholder="30"
                  />
                </Field>
              </div>

              <Field icon={ClipboardList} label="Mô tả chi tiết chiến dịch" required>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value.slice(0, 500))}
                  className={`${inputClass} min-h-32 resize-y py-3`}
                  placeholder="Mục đích, thông điệp truyền tải, quyền lợi và nội dung hoạt động..."
                />
                <div className="mt-1 text-right text-xs font-semibold text-slate-400">
                  {description.length}/500 ký tự
                </div>
              </Field>
            </div>
          </section>

          <section className="rounded-2xl border border-violet-100 bg-white p-7 shadow-md">
            <SectionTitle
              number="2"
              title="Lịch và địa điểm"
              subtitle="Thời gian, địa chỉ và bản đồ vị trí hoạt động."
            />

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field icon={CalendarDays} label="Ngày bắt đầu" required>
                <input
                  type="date"
                  min={todayStr}
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field icon={CalendarDays} label="Giờ bắt đầu" required>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <select
                      value={startHour}
                      onChange={(e) => setStartHour(e.target.value)}
                      className={`${inputClass} appearance-none pr-8`}
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
                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">
                      ▼
                    </div>
                  </div>
                  <span className="text-slate-300 font-bold">:</span>
                  <div className="relative flex-1">
                    <select
                      value={startMinute}
                      onChange={(e) => setStartMinute(e.target.value)}
                      className={`${inputClass} appearance-none pr-8`}
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
                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">
                      ▼
                    </div>
                  </div>
                </div>
              </Field>
              <Field icon={CalendarDays} label="Ngày kết thúc" required>
                <input
                  type="date"
                  min={startDate || todayStr}
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field icon={CalendarDays} label="Giờ kết thúc" required>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <select
                      value={endHour}
                      onChange={(e) => setEndHour(e.target.value)}
                      className={`${inputClass} appearance-none pr-8`}
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
                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">
                      ▼
                    </div>
                  </div>
                  <span className="text-slate-300 font-bold">:</span>
                  <div className="relative flex-1">
                    <select
                      value={endMinute}
                      onChange={(e) => setEndMinute(e.target.value)}
                      className={`${inputClass} appearance-none pr-8`}
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
                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">
                      ▼
                    </div>
                  </div>
                </div>
              </Field>
            </div>

            {durationText && (
              <div
                className={`mt-4 flex items-center gap-2 rounded-xl border px-4 py-3 text-xs font-bold ${
                  isDurationError
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-emerald-200 bg-emerald-50 text-emerald-800"
                }`}
              >
                <CalendarDays size={15} />
                <span>{durationText}</span>
              </div>
            )}

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <Field icon={MapPin} label="Địa chỉ cụ thể" required>
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    value={locationText}
                    onChange={(event) => setLocationText(event.target.value)}
                    className={`${inputClass} pl-9`}
                    placeholder="Nhập địa chỉ, phường hoặc quận tại Đà Nẵng"
                  />
                </div>
              </Field>

              <Field icon={Search} label="Bán kính hoạt động (mét)" required>
                <input
                  type="number"
                  min="0"
                  value={radiusText}
                  onChange={(event) => setRadiusText(event.target.value)}
                  className={inputClass}
                  placeholder="VD: 200"
                />
              </Field>
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-violet-100">
              <CampaignLocationPicker
                coordinates={selectedCoordinates}
                radius={Number(radiusText) || 0}
                onLocationSelect={(lat, lng) => {
                  setSelectedCoordinates({ lat, lng, zoom: 16 });
                }}
                onAddressSelect={(address) => {
                  lastResolvedAddressRef.current = address;
                  setLocationText(address);
                }}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-amber-200 bg-[#FFFBF0] p-7 shadow-md">
            <SectionTitle
              number="3"
              title="Thông tin nội bộ"
              subtitle="Chỉ tình nguyện viên được duyệt mới thấy thông tin này."
              icon={Lock}
            />

            <div className="mt-5 grid gap-5">
              <Field label="Điểm tập trung / Hẹn gặp" required>
                <textarea
                  value={privateLocationText}
                  onChange={(event) => setPrivateLocationText(event.target.value)}
                  className={`${inputClass} min-h-24 resize-y py-3`}
                  placeholder="VD: Cổng trường Tiểu học Trần Cao Vân, số 23 Lê Duẩn"
                />
              </Field>
              <Field label="Công cụ cần mang theo" required>
                <textarea
                  value={requiredTools}
                  onChange={(event) => setRequiredTools(event.target.value)}
                  className={`${inputClass} min-h-24 resize-y py-3`}
                  placeholder="VD: Mang theo găng tay cao su, mũ tai bèo, nước cá nhân"
                />
              </Field>
              <Field label="Người phụ trách / SĐT" required>
                <input
                  value={organizerContact}
                  onChange={(event) => setOrganizerContact(event.target.value)}
                  className={inputClass}
                  placeholder="VD: Anh Hải (0905.xxx.xxx) - Bí thư chi đoàn"
                />
              </Field>
            </div>
          </section>

          <footer className="flex rounded-2xl border border-violet-100 bg-white p-4 shadow-md justify-end">
            <button
              type="submit"
              disabled={isLoading || isUploading || isDurationError}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-5 text-sm font-black text-white shadow-md transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              <Send size={16} />
              {isLoading || isUploading ? "Đang gửi..." : "Gửi phê duyệt"}
            </button>
          </footer>
          <p className="text-right text-xs font-semibold text-slate-500">
            Chiến dịch sẽ được chuyển đến Ủy ban Thành phố để phê duyệt.
          </p>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <HelperCard title="Quy trình" icon={ShieldCheck}>
            <div className="space-y-3">
              <ProcessStep
                color="bg-[#7C3AED]"
                label="Tạo & gửi"
                text="Hoàn thành biểu mẫu và gửi phê duyệt."
              />
              <ProcessStep
                color="bg-[#3B82F6]"
                label="Lãnh đạo duyệt"
                text="Ủy ban Thành phố đánh giá mức phù hợp."
              />
              <ProcessStep
                color="bg-[#10B981]"
                label="Mở đăng ký"
                text="Chiến dịch được công khai cho người dân."
              />
            </div>
          </HelperCard>

          <HelperCard title="Mẹo tạo chiến dịch hiệu quả" icon={Lightbulb}>
            <ul className="space-y-3 text-sm font-semibold leading-6 text-slate-600">
              <li>Đặt tên rõ mục tiêu và địa điểm.</li>
              <li>Mô tả đầy đủ quyền lợi của tình nguyện viên.</li>
              <li>Đặt số lượng người tham gia thực tế.</li>
              <li>Ghi rõ dụng cụ, thời gian và người phụ trách.</li>
            </ul>
          </HelperCard>

          <HelperCard title="Xem trước" icon={Eye}>
            <div className="overflow-hidden rounded-xl border border-violet-100 bg-white shadow-sm">
              <div className="relative aspect-video bg-slate-100">
                <img
                  src={previewImage}
                  alt="Preview campaign"
                  className="h-full w-full object-cover"
                />
                <span className="absolute left-3 top-3 rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                  Chờ duyệt
                </span>
              </div>
              <div className="p-4">
                <p className="line-clamp-2 text-base font-black text-slate-950">
                  {title.trim() || "Tên chiến dịch sẽ hiển thị tại đây"}
                </p>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                  {description.trim() ||
                    "Mô tả ngắn của chiến dịch sẽ được cập nhật realtime khi bạn nhập nội dung."}
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <MapPin size={14} />
                  {locationText.trim() || "Địa điểm hoạt động"}
                </div>
                <div className="mt-4 h-1.5 rounded-full bg-slate-100">
                  <div className="h-full w-0 rounded-full bg-[#10B981]" />
                </div>
              </div>
            </div>
          </HelperCard>
        </aside>
      </div>
      </form>

      {/* Confirmation Modal */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setShowConfirmDialog(false)}
          />
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 shadow-2xl border border-violet-100 animate-in fade-in zoom-in-95 duration-200 text-left animate-fade-in">
            <div className="flex flex-col items-center text-center">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-violet-50 text-[#7C3AED] mb-4">
                <HelpCircle size={28} />
              </div>
              <h3 className="text-lg font-black text-slate-900">Xác nhận gửi phê duyệt</h3>
              <p className="mt-2 text-sm font-semibold text-slate-500 leading-relaxed">
                Bạn có chắc chắn muốn gửi chiến dịch này lên Ủy ban Thành phố để phê duyệt? 
                Sau khi gửi, thông tin sẽ được xem xét và duyệt trước khi công khai.
              </p>
            </div>
            
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowConfirmDialog(false)}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={performSubmit}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-[#7C3AED] px-5 text-sm font-black text-white shadow-md transition hover:brightness-110 cursor-pointer"
              >
                Đồng ý xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessDialog && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white p-7 shadow-2xl border border-emerald-100 animate-in fade-in zoom-in-95 duration-200 text-left animate-fade-in">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-4">
                <div className="grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-emerald-500">
                  <CheckCircle2 size={36} />
                </div>
                <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-amber-400 animate-ping opacity-75" />
              </div>
              
              <h3 className="text-xl font-black text-slate-900">Gửi phê duyệt thành công!</h3>
              
              <div className="mt-3 rounded-xl bg-slate-50 p-4 border border-slate-100 w-full text-left space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Trạng thái đơn</p>
                <div className="flex items-center gap-2 text-amber-600 font-extrabold text-sm">
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                  Đang chờ phê duyệt từ Thành phố
                </div>
                <p className="text-xs font-semibold leading-relaxed text-slate-500">
                  Chiến dịch đã được đưa vào hàng đợi kiểm duyệt. Bạn có thể theo dõi tiến độ trong tab quản lý chiến dịch của phường.
                </p>
              </div>
            </div>
            
            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row w-full">
              <button
                type="button"
                onClick={() => {
                  setShowSuccessDialog(false);
                  if (onBack) {
                    onBack();
                  } else {
                    navigate({ to: "/ward", search: { tab: "campaign" } });
                  }
                }}
                className="flex-1 inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 text-sm font-bold text-slate-700 transition hover:bg-slate-50 cursor-pointer order-2 sm:order-1"
              >
                Thoát
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSuccessDialog(false);
                  if (createdCampaignId) {
                    if (onSuccess) {
                      onSuccess(String(createdCampaignId));
                    } else {
                      navigate({ to: "/campaigns/$id", params: { id: String(createdCampaignId) } });
                    }
                  }
                }}
                className="flex-1 inline-flex h-11 items-center justify-center rounded-xl bg-[#7C3AED] text-sm font-black text-white shadow-md transition hover:brightness-110 cursor-pointer order-1 sm:order-2"
              >
                Xem chi tiết
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SectionTitle({
  number,
  title,
  subtitle,
  icon: Icon,
}: {
  number: string;
  title: string;
  subtitle: string;
  icon?: ElementType;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-slate-100 pb-4">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#F3F0FF] text-sm font-black text-[#7C3AED]">
        {Icon ? <Icon size={17} /> : number}
      </div>
      <div>
        <h2 className="text-lg font-black text-slate-900">{title}</h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}

function HelperCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: ElementType;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-violet-100 bg-white p-6 shadow-lg">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-slate-500">
        <Icon size={17} className="text-[#7C3AED]" />
        {title}
      </h3>
      {children}
    </section>
  );
}

function ProcessStep({ color, label, text }: { color: string; label: string; text: string }) {
  return (
    <div className="flex gap-3">
      <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${color}`} />
      <div>
        <p className="text-sm font-black text-slate-900">{label}</p>
        <p className="text-sm leading-6 text-slate-600">{text}</p>
      </div>
    </div>
  );
}


function Field({
  icon: Icon,
  label,
  required,
  children,
}: {
  icon?: ElementType;
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-sm font-black text-slate-800">
        {Icon && <Icon size={15} className="text-[#7C3AED]" />}
        {label}
        {required && <span className="text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}

function CampaignLocationPicker({
  coordinates,
  radius,
  onLocationSelect,
  onAddressSelect,
}: {
  coordinates: { lat: number; lng: number; zoom: number };
  radius: number;
  onLocationSelect: (lat: number, lng: number) => void;
  onAddressSelect: (address: string) => void;
}) {
  const [leafletComponents, setLeafletComponents] = useState<{
    MapContainer: any;
    TileLayer: any;
    Marker: any;
    Circle: any;
    useMap: any;
    useMapEvents: any;
  } | null>(null);

  const [mapLayerType, setMapLayerType] = useState<"osm" | "satellite">("osm");
  const [isLayersOpen, setIsLayersOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      import("react-leaflet"),
      import("leaflet"),
      import("leaflet/dist/leaflet.css"),
    ]).then(([rl, LMod]) => {
      if (!mounted) return;
      const L = LMod.default;
      const markerIcon = new L.Icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });
      L.Marker.prototype.options.icon = markerIcon;

      setLeafletComponents({
        MapContainer: rl.MapContainer,
        TileLayer: rl.TileLayer,
        Marker: rl.Marker,
        Circle: rl.Circle,
        useMap: rl.useMap,
        useMapEvents: rl.useMapEvents,
      });
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsLayersOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  if (!leafletComponents) {
    return (
      <div className="grid h-[340px] w-full place-items-center bg-slate-50 text-sm font-semibold text-slate-500">
        Đang tải bản đồ...
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } = leafletComponents;
  const position: [number, number] = [coordinates.lat, coordinates.lng];

  function MapSync() {
    const map = useMap();
    useEffect(() => {
      map.setView(position, coordinates.zoom, { animate: true });
      const timer = setTimeout(() => map.invalidateSize(), 100);
      return () => clearTimeout(timer);
    }, [map, coordinates.lat, coordinates.lng, coordinates.zoom]);
    return null;
  }

  async function handlePositionChange(lat: number, lng: number) {
    onLocationSelect(lat, lng);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      const address = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      onAddressSelect(address);
    } catch {
      onAddressSelect(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    }
  }

  function ClickHandler() {
    useMapEvents({
      click: async (event: any) => {
        await handlePositionChange(event.latlng.lat, event.latlng.lng);
      },
    });
    return null;
  }

  return (
    <div className="relative h-[340px] w-full bg-slate-100">
      {/* Floating Layer Controls */}
      <div
        ref={dropdownRef}
        className="absolute top-3 right-3 flex flex-col items-end gap-2 text-xs"
        style={{ zIndex: 1000 }}
      >
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsLayersOpen(!isLayersOpen)}
            className="w-10 h-10 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-md flex items-center justify-center cursor-pointer transition text-slate-600"
            title="Lớp bản đồ"
          >
            <Layers size={18} />
          </button>

          {isLayersOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-[1100] text-left">
              <button
                type="button"
                onClick={() => {
                  setMapLayerType("osm");
                  setIsLayersOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs transition ${
                  mapLayerType === "osm"
                    ? "bg-violet-50 text-[#7C3AED] font-extrabold"
                    : "text-slate-700 hover:bg-slate-50 font-semibold"
                }`}
              >
                🗺️ Bản đồ
              </button>
              <button
                type="button"
                onClick={() => {
                  setMapLayerType("satellite");
                  setIsLayersOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs transition ${
                  mapLayerType === "satellite"
                    ? "bg-violet-50 text-[#7C3AED] font-extrabold"
                    : "text-slate-700 hover:bg-slate-50 font-semibold"
                }`}
              >
                🛰️ Vệ tinh
              </button>
            </div>
          )}
        </div>
      </div>

      <MapContainer
        center={position}
        zoom={coordinates.zoom}
        scrollWheelZoom
        zoomControl={false}
        attributionControl={false}
        className="h-full w-full"
      >
        <TileLayer
          url={
            mapLayerType === "osm"
              ? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          }
        />
        <MapSync />
        <ClickHandler />
        <Marker
          position={position}
          draggable
          eventHandlers={{
            dragend: async (event: any) => {
              const nextPosition = event.target.getLatLng();
              await handlePositionChange(nextPosition.lat, nextPosition.lng);
            },
          }}
        />
        {radius > 0 && (
          <Circle
            center={position}
            radius={radius}
            pathOptions={{
              color: "#7C3AED",
              weight: 2.5,
              fillColor: "#7C3AED",
              fillOpacity: 0.12,
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}

function createGeoJsonCircle(center: { lat: number; lng: number }, radiusMeters: number, points = 64) {
  const coords = [];
  const km = radiusMeters / 1000;
  const latitude = center.lat;
  const longitude = center.lng;
  const earthRadius = 6378.1;
  const latRad = (latitude * Math.PI) / 180;
  const lngRad = (longitude * Math.PI) / 180;
  const dDivR = km / earthRadius;

  for (let i = 0; i <= points; i++) {
    const angle = (i * 2 * Math.PI) / points;
    const pointLatRad = Math.asin(
      Math.sin(latRad) * Math.cos(dDivR) +
        Math.cos(latRad) * Math.sin(dDivR) * Math.cos(angle)
    );
    const pointLngRad =
      lngRad +
      Math.atan2(
        Math.sin(angle) * Math.sin(dDivR) * Math.cos(latRad),
        Math.cos(dDivR) - Math.sin(latRad) * Math.sin(pointLatRad)
      );

    const pointLat = (pointLatRad * 180) / Math.PI;
    const pointLng = (pointLngRad * 180) / Math.PI;
    coords.push([pointLng, pointLat]);
  }

  return JSON.stringify({
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [coords],
    },
    properties: {
      radius: radiusMeters,
    },
  });
}

function combineDateTime(date: string, time: string) {
  if (!date || !time) return "";
  return `${date}T${time}`;
}
