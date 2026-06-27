import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import type { ElementType, ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Camera,
  CheckCircle2,
  Clock3,
  Copy,
  Facebook,
  Heart,
  Lock,
  Map,
  MapPin,
  MessageCircle,
  MessageSquare,
  MoreHorizontal,
  Package,
  Send,
  ShieldCheck,
  X,
  Users,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import {
  useApproveCampaignParticipant,
  useCampaignChat,
  useCampaignComments,
  useCampaignDetail,
  useCampaignParticipants,
  useJoinCampaign,
  useRejectCampaignParticipant,
  useCampaignThumbnail,
  useEndCampaign,
  useUpdateCampaign,
} from "@/hooks/useCampaigns";
import { getToken, type CampaignParticipantResponse } from "@/lib/api";
import { Role, useAuth } from "@/lib/auth";
import type { Campaign } from "@/lib/campaignStore";
import {
  buildGoogleMapsEmbedUrl,
  buildGoogleMapsSearchUrl,
  resolveCampaignCoordinates,
} from "@/lib/campaignLocation";
import { SingleCampaignMap } from "@/components/site/SingleCampaignMap";

export const Route = createFileRoute("/campaigns/$id")({
  head: () => ({
    meta: [
      { title: "Chi tiết chiến dịch - Đà Nẵng Kết Nối" },
      {
        name: "description",
        content: "Thông tin chi tiết chiến dịch cộng đồng.",
      },
    ],
  }),
  component: CampaignDetailPage,
});

const defaultHeroImage =
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&auto=format&fit=crop&q=85";

const API_BASE: string =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE) || "";

function CampaignDetailPage() {
  const { id } = Route.useParams();
  const isGroupChatRoute = useRouterState({
    select: (state) => state.location.pathname.endsWith("/group-chat"),
  });

  if (isGroupChatRoute) {
    return <Outlet />;
  }

  return <CampaignDetailPageComponent campaignId={id} />;
}

export function CampaignDetailPageComponent({
  campaignId,
  onBack,
  initialEditMode,
}: {
  campaignId: string;
  onBack?: () => void;
  initialEditMode?: boolean;
}) {
  const campaign = useCampaignDetail(campaignId);
  const image = useCampaignThumbnail(campaign);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const [isEditing, setIsEditing] = useState(initialEditMode || false);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState<any>("environment");
  const [editTarget, setEditTarget] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editLocationText, setEditLocationText] = useState("");
  const [editPrivateLocationText, setEditPrivateLocationText] = useState("");
  const [editRequiredTools, setEditRequiredTools] = useState("");
  const [editOrganizerContact, setEditOrganizerContact] = useState("");
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");
  const [editLatitude, setEditLatitude] = useState<number | null>(null);
  const [editLongitude, setEditLongitude] = useState<number | null>(null);
  const [editImageUrls, setEditImageUrls] = useState<string[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  const hasInitializedRef = useRef(false);

  useEffect(() => {
    hasInitializedRef.current = false;
  }, [campaignId]);

  useEffect(() => {
    if (campaign && (!hasInitializedRef.current || !isEditing)) {
      setEditTitle(campaign.name || "");
      setEditCategory(campaign.category || "environment");
      setEditTarget(String(campaign.target || 30));
      setEditDescription(campaign.desc || "");
      setEditLocationText(campaign.locationText || "");
      setEditPrivateLocationText(campaign.privateLocationText || "");
      setEditRequiredTools(campaign.requiredTools || "");
      setEditOrganizerContact(campaign.organizerContact || "");
      setEditStartTime(campaign.startTime ? campaign.startTime.slice(0, 16) : "");
      setEditEndTime(campaign.endTime ? campaign.endTime.slice(0, 16) : "");
      setEditLatitude(campaign.latitude ?? null);
      setEditLongitude(campaign.longitude ?? null);
      const currentImageUrls = campaign.imageUrls?.filter((url) => url?.trim()) ?? [];
      setEditImageUrls(
        currentImageUrls.length > 0
          ? currentImageUrls
          : campaign.coverImageUrl?.trim()
            ? [campaign.coverImageUrl]
            : [],
      );
      setNewImageFiles([]);
      setNewImagePreviews([]);
      hasInitializedRef.current = true;
    }
  }, [campaign, isEditing]);

  useEffect(() => {
    if (!campaign?.imageUrls || campaign.imageUrls.length <= 1) {
      return;
    }
    const interval = setInterval(() => {
      setActiveImageIndex((prev) => (prev + 1) % campaign.imageUrls!.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [campaign?.imageUrls]);

  const { user, isAuthenticated } = useAuth();
  const joinCampaign = useJoinCampaign();
  const endCampaign = useEndCampaign();
  const updateCampaign = useUpdateCampaign();

  const handleEditImagesUpload = (files: FileList | null) => {
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

    const availableSlots = 5 - editImageUrls.length - newImageFiles.length;
    if (availableSlots <= 0) {
      toast.warning("Chỉ cho phép tối đa 5 ảnh cho một chiến dịch.");
      return;
    }

    if (validFiles.length > availableSlots) {
      toast.warning("Chỉ cho phép tối đa 5 ảnh cho một chiến dịch.");
    }

    const filesToAppend = validFiles.slice(0, availableSlots);
    setNewImageFiles((prev) => [...prev, ...filesToAppend]);

    filesToAppend.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setNewImagePreviews((prev) => [...prev, String(reader.result)]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeExistingImage = (index: number) => {
    setEditImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setNewImageFiles((prev) => prev.filter((_, i) => i !== index));
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadNewCampaignImages = async () => {
    if (newImageFiles.length === 0) return [];

    setIsUploadingImages(true);
    const uploadedUrls: string[] = [];
    const token = getToken();

    try {
      for (const file of newImageFiles) {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(`${API_BASE}/api/files/upload`, {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Tải lên ảnh ${file.name} thất bại.`);
        }

        const data = await response.json();
        if (!data?.fileUrl) {
          throw new Error(`Không nhận được URL cho ảnh ${file.name}.`);
        }
        uploadedUrls.push(data.fileUrl);
      }

      return uploadedUrls;
    } finally {
      setIsUploadingImages(false);
    }
  };

  const handleSave = async () => {
    if (!editTitle.trim()) {
      toast.error("Vui lòng nhập tên chiến dịch.");
      return;
    }
    if (!editLocationText.trim()) {
      toast.error("Vui lòng nhập địa chỉ cụ thể.");
      return;
    }
    if (!editDescription.trim()) {
      toast.error("Vui lòng nhập mô tả chi tiết chiến dịch.");
      return;
    }
    if (!editPrivateLocationText.trim()) {
      toast.error("Vui lòng nhập điểm tập trung nội bộ.");
      return;
    }
    if (!editRequiredTools.trim()) {
      toast.error("Vui lòng nhập dụng cụ cần mang theo.");
      return;
    }
    if (!editOrganizerContact.trim()) {
      toast.error("Vui lòng nhập thông tin liên hệ ban tổ chức.");
      return;
    }
    if (!editStartTime) {
      toast.error("Vui lòng chọn thời gian bắt đầu.");
      return;
    }
    if (!editEndTime) {
      toast.error("Vui lòng chọn thời gian kết thúc.");
      return;
    }

    const start = new Date(editStartTime);
    const end = new Date(editEndTime);
    if (end <= start) {
      toast.error("Thời gian kết thúc phải diễn ra sau thời gian bắt đầu.");
      return;
    }

    const maxPartNum = Number.parseInt(editTarget, 10);
    if (Number.isNaN(maxPartNum) || maxPartNum <= 0) {
      toast.error("Số lượng tình nguyện viên tối đa phải là số nguyên dương.");
      return;
    }

    try {
      const uploadedImageUrls = await uploadNewCampaignImages();
      const nextImageUrls = [...editImageUrls, ...uploadedImageUrls];

      await updateCampaign.mutateAsync({
        id: campaignId,
        data: {
          title: editTitle.trim(),
          category: editCategory,
          description: editDescription.trim(),
          locationText: editLocationText.trim(),
          privateLocationText: editPrivateLocationText.trim(),
          requiredTools: editRequiredTools.trim(),
          organizerContact: editOrganizerContact.trim(),
          maxParticipants: maxPartNum,
          startTime: editStartTime || undefined,
          endTime: editEndTime || undefined,
          latitude: editLatitude ?? undefined,
          longitude: editLongitude ?? undefined,
          boundaryGeojson: campaign?.boundaryGeojson ?? undefined,
          coverImageUrl: nextImageUrls[0] || undefined,
          imageUrls: nextImageUrls,
        },
      });
      toast.success("Cập nhật chiến dịch thành công.");
      setActiveImageIndex(0);
      setIsEditing(false);
    } catch (err) {
      toast.error("Lỗi khi cập nhật chiến dịch: " + (err instanceof Error ? err.message : "Lỗi hệ thống"));
    }
  };

  const handleEndCampaign = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn kết thúc sớm chiến dịch này? Hành động này sẽ khóa đơn đăng ký và dừng tuyển quân.")) {
      return;
    }
    try {
      await endCampaign.mutateAsync(campaignId);
      toast.success("Đã kết thúc chiến dịch thành công.");
    } catch (err) {
      toast.error(
        "Không thể kết thúc chiến dịch: " + (err instanceof Error ? err.message : "Lỗi hệ thống"),
      );
    }
  };

  const isUnauthorizedOfficer = user?.role === "WARD_STAFF" && campaign && !campaign.canManage;

  if (!campaign) {
    return (
      <main className="min-h-screen bg-[#F8F7FF] px-4 py-10">
        <section className="mx-auto max-w-3xl rounded-2xl border border-violet-100 bg-white p-8 text-center shadow-md">
          <h1 className="text-2xl font-black text-slate-900">Không tìm thấy chiến dịch</h1>
          {onBack ? (
            <button
              onClick={onBack}
              className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#7C3AED] hover:underline bg-transparent border-0 cursor-pointer"
            >
              <ArrowLeft size={16} />
              Quay lại danh sách
            </button>
          ) : (
            <Link
              to="/campaigns"
              className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#7C3AED]"
            >
              <ArrowLeft size={16} />
              Quay lại danh sách
            </Link>
          )}
        </section>
      </main>
    );
  }

  const progressPercent =
    campaign.target > 0
      ? Math.min(100, Math.round((campaign.participants / campaign.target) * 100))
      : 0;
  const approvedStatus = campaign.currentUserJoinStatus === "APPROVED";

  const handleJoin = async () => {
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để tham gia chiến dịch.");
      return;
    }
    if (!campaign.canJoin) {
      toast.error("Chiến dịch hiện không mở đăng ký.");
      return;
    }
    await joinCampaign.mutateAsync(campaign.id);
    toast.success("Đã gửi yêu cầu tham gia, vui lòng chờ người quản lý duyệt.");
  };

  return (
    <main className="min-h-screen bg-[#F8F7FF] pb-16 text-slate-950">
      <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-center justify-between gap-4">
          {onBack ? (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 text-sm font-black text-slate-600 transition hover:text-[#6D28D9] bg-transparent border-0 cursor-pointer"
            >
              <ArrowLeft size={16} />
              Quay lại danh sách
            </button>
          ) : (
            <Link
              to="/campaigns"
              className="inline-flex items-center gap-2 text-sm font-black text-slate-600 transition hover:text-[#6D28D9]"
            >
              <ArrowLeft size={16} />
              Chiến dịch
            </Link>
          )}
          <div className="flex items-center gap-2">
            {campaign.canManage && (
              <>
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSave}
                      disabled={updateCampaign.isPending || isUploadingImages}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-black text-white hover:bg-emerald-700 transition cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 size={13} />
                      {isUploadingImages || updateCampaign.isPending ? "Đang lưu" : "Lưu"}
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="inline-flex items-center gap-1 rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-black text-slate-700 hover:bg-slate-300 transition cursor-pointer"
                    >
                      Hủy
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-1 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-black text-white hover:bg-violet-700 transition cursor-pointer"
                  >
                    Chỉnh sửa
                  </button>
                )}
              </>
            )}
            <StatusBadge status={campaign.status} />
          </div>
        </div>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,65fr)_minmax(320px,35fr)]">
          <article className="space-y-6">
            {isEditing ? (
              <div className="space-y-6">
                <section className="rounded-2xl border border-violet-100 bg-white p-7 shadow-md">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-black text-slate-950">Hình ảnh chiến dịch</h2>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        Ảnh đầu tiên sẽ được dùng làm ảnh bìa.
                      </p>
                    </div>
                    <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-[#7C3AED] px-4 text-sm font-black text-white transition hover:bg-[#6D28D9]">
                      <Camera size={16} />
                      Thêm ảnh
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="sr-only"
                        onChange={(event) => {
                          handleEditImagesUpload(event.target.files);
                          event.target.value = "";
                        }}
                      />
                    </label>
                  </div>

                  {editImageUrls.length + newImagePreviews.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                      {editImageUrls.map((url, index) => (
                        <div key={`${url}-${index}`} className="group relative aspect-video overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                          <img src={url} alt={`Ảnh chiến dịch ${index + 1}`} className="h-full w-full object-cover" />
                          {index === 0 && (
                            <span className="absolute left-2 top-2 rounded-lg bg-[#7C3AED] px-2 py-0.5 text-[10px] font-extrabold text-white shadow-md">
                              Ảnh bìa
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => removeExistingImage(index)}
                            className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-slate-950/70 text-white opacity-0 transition hover:bg-red-600 group-hover:opacity-100"
                            title="Xóa ảnh"
                          >
                            <X size={15} />
                          </button>
                        </div>
                      ))}

                      {newImagePreviews.map((url, index) => {
                        const absoluteIndex = editImageUrls.length + index;
                        return (
                          <div key={`${url}-${index}`} className="group relative aspect-video overflow-hidden rounded-xl border border-violet-200 bg-slate-50">
                            <img src={url} alt={`Ảnh mới ${index + 1}`} className="h-full w-full object-cover" />
                            {absoluteIndex === 0 && (
                              <span className="absolute left-2 top-2 rounded-lg bg-[#7C3AED] px-2 py-0.5 text-[10px] font-extrabold text-white shadow-md">
                                Ảnh bìa
                              </span>
                            )}
                            <span className="absolute bottom-2 left-2 rounded-lg bg-white/90 px-2 py-0.5 text-[10px] font-extrabold text-[#7C3AED] shadow-sm">
                              Ảnh mới
                            </span>
                            <button
                              type="button"
                              onClick={() => removeNewImage(index)}
                              className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-slate-950/70 text-white opacity-0 transition hover:bg-red-600 group-hover:opacity-100"
                              title="Xóa ảnh"
                            >
                              <X size={15} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <label className="grid aspect-[21/9] cursor-pointer place-items-center rounded-2xl border-2 border-dashed border-violet-200 bg-[#F8F7FF] text-center transition hover:border-[#7C3AED]">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="sr-only"
                        onChange={(event) => {
                          handleEditImagesUpload(event.target.files);
                          event.target.value = "";
                        }}
                      />
                      <div>
                        <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-[#F3F0FF] text-[#7C3AED]">
                          <Camera size={22} />
                        </div>
                        <p className="mt-3 text-sm font-black text-slate-800">
                          Thêm ảnh cho chiến dịch
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          Tối đa 5 ảnh, ảnh đầu tiên sẽ là ảnh bìa.
                        </p>
                      </div>
                    </label>
                  )}
                </section>

                <section className="rounded-2xl border border-violet-100 bg-white p-7 shadow-md">
                  <h2 className="mb-4 text-xl font-black text-slate-950">Thông tin chung</h2>
                  <div className="space-y-5">
                    <div>
                      <label className="mb-1 block text-sm font-black text-[#0B2545]">Tên chiến dịch</label>
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/15"
                        placeholder="Nhập tên chiến dịch"
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm font-black text-[#0B2545]">Lĩnh vực</label>
                        <select
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/15"
                        >
                          <option value="environment">Môi trường</option>
                          <option value="infrastructure">Hạ tầng</option>
                          <option value="public_safety">An toàn cộng đồng</option>
                          <option value="construction">Xây dựng</option>
                          <option value="fire_safety">Phòng cháy chữa cháy</option>
                        </select>
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-black text-[#0B2545]">Tình nguyện viên cần tuyển</label>
                        <input
                          value={editTarget}
                          onChange={(e) => setEditTarget(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/15"
                          type="number"
                          min="1"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-black text-[#0B2545]">Mô tả chi tiết chiến dịch</label>
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/15 min-h-32"
                        placeholder="Mục đích, thông điệp truyền tải..."
                      />
                    </div>
                  </div>
                </section>

                <section className="rounded-2xl border border-violet-100 bg-white p-7 shadow-md">
                  <h2 className="mb-4 text-xl font-black text-slate-950">Lịch và địa điểm</h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-black text-[#0B2545]">Thời gian bắt đầu</label>
                      <input
                        type="datetime-local"
                        value={editStartTime}
                        onChange={(e) => setEditStartTime(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/15"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-black text-[#0B2545]">Thời gian kết thúc</label>
                      <input
                        type="datetime-local"
                        value={editEndTime}
                        onChange={(e) => setEditEndTime(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/15"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="mb-1 block text-sm font-black text-[#0B2545]">Địa chỉ cụ thể (Địa điểm)</label>
                    <input
                      value={editLocationText}
                      onChange={(e) => setEditLocationText(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/15"
                      placeholder="Nhập địa chỉ, phường hoặc quận tại Đà Nẵng"
                    />
                  </div>
                </section>

                <section className="rounded-2xl border border-amber-200 bg-[#FFFBF0] p-7 shadow-md">
                  <h2 className="mb-4 text-xl font-black text-slate-950">Thông tin nội bộ</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1 block text-sm font-black text-[#0B2545]">Điểm tập trung / Hẹn gặp</label>
                      <textarea
                        value={editPrivateLocationText}
                        onChange={(e) => setEditPrivateLocationText(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/15 min-h-24"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-black text-[#0B2545]">Công cụ cần mang theo</label>
                      <textarea
                        value={editRequiredTools}
                        onChange={(e) => setEditRequiredTools(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/15 min-h-24"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-black text-[#0B2545]">Người phụ trách / SĐT</label>
                      <input
                        value={editOrganizerContact}
                        onChange={(e) => setEditOrganizerContact(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/15"
                      />
                    </div>
                  </div>
                </section>
              </div>
            ) : (
              <>
                {(() => {
                  const hasMultipleImages = !!(campaign.imageUrls && campaign.imageUrls.length > 1);
                  const galleryImages = campaign.imageUrls && campaign.imageUrls.length > 0 
                    ? campaign.imageUrls 
                    : [image];
                  const displayImage = galleryImages[activeImageIndex] || image;
                  
                  return (
                    <div className="space-y-3">
                      <div className="relative aspect-[21/9] overflow-hidden rounded-2xl shadow-lg group">
                        <img 
                          src={displayImage} 
                          alt={campaign.name} 
                          className="h-full w-full object-cover transition-all duration-500 hover:scale-[1.02]" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent pointer-events-none" />
                        <h1 className="absolute bottom-6 left-6 right-6 text-2xl font-black leading-tight text-white md:text-[28px] pointer-events-none">
                          {campaign.name}
                        </h1>
                        
                        {hasMultipleImages && (
                          <>
                            <button
                              type="button"
                              onClick={() => setActiveImageIndex((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1))}
                              className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/60 cursor-pointer select-none opacity-0 group-hover:opacity-100 duration-200 text-xl font-bold"
                            >
                              &lsaquo;
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveImageIndex((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1))}
                              className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/60 cursor-pointer select-none opacity-0 group-hover:opacity-100 duration-200 text-xl font-bold"
                            >
                              &rsaquo;
                            </button>
                          </>
                        )}
                      </div>
                      
                      {hasMultipleImages && (
                        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
                          {galleryImages.map((imgUrl, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setActiveImageIndex(idx)}
                              className={`relative aspect-video w-24 flex-shrink-0 overflow-hidden rounded-lg border-2 shadow-sm transition duration-200 hover:brightness-110 cursor-pointer ${
                                idx === activeImageIndex ? "border-[#7C3AED] scale-[1.02] shadow-md" : "border-transparent opacity-75 hover:opacity-100"
                              }`}
                            >
                              <img src={imgUrl} alt={`Thumbnail ${idx}`} className="h-full w-full object-cover" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}

                <section className="rounded-2xl border border-violet-100 bg-white p-7 shadow-md">
                  <div className="grid gap-3 md:grid-cols-3">
                    <InfoTile
                      icon={MapPin}
                      label="Khu vực"
                      value={campaign.locationText || campaign.ward}
                    />
                    <InfoTile
                      icon={Users}
                      label="Người tham gia"
                      value={`${campaign.participants}/${campaign.target}`}
                    />
                    <InfoTile icon={CalendarDays} label="Thời gian" value={dateRange(campaign)} />
                  </div>

                  <div className="mt-7 rounded-xl bg-[#F3F0FF] p-5">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-black text-slate-900">Tiến độ tuyển quân</p>
                        <p className="text-xs font-semibold text-slate-500">
                          Cập nhật theo số lượng người được duyệt tham gia.
                        </p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#7C3AED] shadow-sm">
                        {campaign.participants}/{campaign.target} ({progressPercent}%)
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-white">
                      <div
                        className="h-full rounded-full bg-[#10B981] transition-all duration-700"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </section>

                {campaign.desc && (
                  <Panel title="Mô tả chi tiết chiến dịch" icon={ListIcon}>
                    <p className="text-sm leading-7 text-slate-600 whitespace-pre-wrap">
                      {campaign.desc}
                    </p>
                  </Panel>
                )}

                {campaign.privateDetailsVisible ? (
                  <PrivateDetails campaign={campaign} />
                ) : (
                  <section className="rounded-2xl border border-dashed border-amber-200 bg-[#FFFBF0] p-6 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700">
                        <Lock size={20} />
                      </div>
                      <div>
                        <h2 className="font-black text-slate-900">Thông tin nội bộ được bảo mật</h2>
                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          Vị trí tập trung cụ thể, dụng cụ, liên hệ ban tổ chức và group chat chỉ hiển
                          thị cho người đã được duyệt tham gia hoặc người quản lý chiến dịch.
                        </p>
                      </div>
                    </div>
                  </section>
                )}
              </>
            )}

            <MapPanel campaign={campaign} />
            <DiscussionPanel campaign={campaign} />
          </article>

          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <section className="rounded-2xl border border-violet-100 bg-white p-6 shadow-lg">
              <h2 className="mb-4 text-sm font-black uppercase tracking-wider text-slate-500">
                Hành động
              </h2>
              {(campaign.status === "active" || campaign.status === "recruiting") && user?.role !== "WARD_STAFF" && (
                <button
                  onClick={handleJoin}
                  disabled={joinCampaign.isPending || !campaign.canJoin || isUnauthorizedOfficer}
                  className="h-12 w-full rounded-xl bg-[#7C3AED] text-sm font-black text-white shadow-md transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {campaign.currentUserJoinStatus === "PENDING"
                    ? "Đang chờ duyệt"
                    : "Đăng ký tham gia"}
                </button>
              )}

              {campaign.canManage && (campaign.status === "active" || campaign.status === "recruiting") && (
                <button
                  onClick={handleEndCampaign}
                  disabled={endCampaign.isPending}
                  className="h-12 w-full rounded-xl bg-red-600 text-sm font-black text-white shadow-md transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 mb-3"
                >
                  {endCampaign.isPending ? "Đang xử lý..." : "Kết thúc chiến dịch"}
                </button>
              )}

              {campaign.currentUserJoinStatus && (
                <div className="mt-4 inline-flex w-full items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">
                  <CheckCircle2 size={16} />
                  Trạng thái: {joinLabel(campaign.currentUserJoinStatus)}
                </div>
              )}

              <div className="mt-4 inline-flex w-full items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm font-black text-amber-700">
                <Clock3 size={16} />
                {campaign.daysLeft > 0
                  ? `Còn ${campaign.daysLeft} ngày để đăng ký`
                  : "Đợt đăng ký đã kết thúc"}
              </div>

              {!isAuthenticated && (
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  Đăng nhập để đăng ký tham gia, bình luận và truy cập group chat khi được duyệt.
                </p>
              )}
            </section>

            {campaign.canManage && <ParticipantReviewPanel campaignId={campaign.id} />}

            <section className="rounded-2xl border border-violet-100 bg-white p-6 shadow-lg">
              <h2 className="mb-4 text-sm font-black uppercase tracking-wider text-slate-500">
                Người phụ trách
              </h2>
              <div className="flex items-center gap-3">
                <div className="grid h-14 w-14 place-items-center rounded-full bg-[#F3F0FF] text-lg font-black text-[#7C3AED]">
                  CB
                </div>
                <div>
                  <p className="font-black text-slate-900">{campaign.createdBy}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-500">{campaign.ward}</p>
                </div>
              </div>

            </section>

            <GroupChatNavigationCard campaign={campaign} approvedStatus={approvedStatus} />
            <ShareCard />
          </aside>
        </section>
      </div>
    </main>
  );
}

function ParticipantReviewPanel({ campaignId }: { campaignId: string }) {
  const participantsQuery = useCampaignParticipants(campaignId);
  const approveParticipant = useApproveCampaignParticipant(campaignId);
  const rejectParticipant = useRejectCampaignParticipant(campaignId);
  const participants = participantsQuery.data ?? [];
  const pendingParticipants = participants.filter(
    (participant) => participant.joinStatus === "PENDING",
  );

  const handleApprove = async (participant: CampaignParticipantResponse) => {
    await approveParticipant.mutateAsync(participant.id);
    toast.success(`Đã duyệt ${participant.citizenName} vào chiến dịch.`);
  };

  const handleReject = async (participant: CampaignParticipantResponse) => {
    const reason = window.prompt("Nhập lý do từ chối yêu cầu tham gia:", "");
    if (reason === null) return;

    await rejectParticipant.mutateAsync({
      participantId: participant.id,
      reason: reason.trim() || undefined,
    });
    toast.success(`Đã từ chối yêu cầu của ${participant.citizenName}.`);
  };

  return (
    <section className="rounded-2xl border border-violet-100 bg-white p-5 shadow-lg">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-black uppercase tracking-wider text-slate-500">
          Yêu cầu tham gia
        </h2>
        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
          {pendingParticipants.length} chờ duyệt
        </span>
      </div>

      {participantsQuery.isLoading ? (
        <p className="rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-500">
          Đang tải yêu cầu...
        </p>
      ) : pendingParticipants.length === 0 ? (
        <p className="rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-500">
          Chưa có yêu cầu tham gia đang chờ duyệt.
        </p>
      ) : (
        <div className="space-y-3">
          {pendingParticipants.map((participant) => (
            <div key={participant.id} className="rounded-xl border border-slate-200 p-3">
              <div className="mb-3">
                <p className="font-black text-slate-900">{participant.citizenName}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  Gửi lúc {formatDateTime(participant.createdAt)}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleReject(participant)}
                  disabled={rejectParticipant.isPending || approveParticipant.isPending}
                  className="h-9 rounded-lg border border-red-200 bg-red-50 text-xs font-black text-red-700 disabled:opacity-50"
                >
                  Từ chối
                </button>
                <button
                  type="button"
                  onClick={() => handleApprove(participant)}
                  disabled={approveParticipant.isPending || rejectParticipant.isPending}
                  className="h-9 rounded-lg bg-emerald-600 text-xs font-black text-white disabled:opacity-50"
                >
                  Duyệt
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function PrivateDetails({ campaign }: { campaign: Campaign }) {
  return (
    <section className="rounded-2xl border border-amber-300 bg-[#FFFBF0] p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2 text-lg font-black text-slate-950">
        <Lock size={18} className="text-amber-600" />
        Thông tin nội bộ
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <InfoTile
          icon={MapPin}
          label="Điểm tập kết"
          value={campaign.privateLocationText || "Chưa cập nhật"}
        />
        <InfoTile
          icon={Package}
          label="Dụng cụ"
          value={campaign.requiredTools || "Chưa cập nhật"}
        />
        <InfoTile
          icon={Users}
          label="Liên hệ"
          value={campaign.organizerContact || "Chưa cập nhật"}
        />
      </div>
    </section>
  );
}

function MapPanel({ campaign }: { campaign: Campaign }) {
  const coordinates = resolveCampaignCoordinates(campaign);
  const displayLocation = campaign.locationText || coordinates.label;

  return (
    <Panel title="Vị trí hoạt động" icon={MapPin}>
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <SingleCampaignMap campaign={campaign} height="320px" staticMode={false} />
        <div className="flex flex-col gap-3 border-t border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-slate-600">{displayLocation}</p>
          <a
            href={buildGoogleMapsSearchUrl(coordinates)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-violet-200 px-4 text-sm font-black text-[#7C3AED] transition hover:bg-[#F3F0FF]"
          >
            <Map size={16} />
            Xem trên Google Maps
          </a>
        </div>
      </div>
    </Panel>
  );
}
function DiscussionPanel({ campaign }: { campaign: Campaign }) {
  const { user } = useAuth();
  const isUnauthorizedOfficer = user?.role === "WARD_STAFF" && !campaign.canManage;
  const comments = useCampaignComments(campaign.id);
  const [commentText, setCommentText] = useState("");
  const fallbackComments = [
    {
      id: "mock-1",
      authorName: "Nguyễn Văn A",
      createdAt: "10:30",
      content: "Mình đã đăng ký rồi, rất mong được tham gia!",
    },
    {
      id: "mock-2",
      authorName: "Trần Thị B",
      createdAt: "11:15",
      content: "Chiến dịch ý nghĩa quá, ủng hộ 100%!",
    },
    {
      id: "mock-3",
      authorName: "Lê Văn C",
      createdAt: "14:00",
      content: "Cho mình hỏi có cần mang theo đồ ăn không ạ?",
    },
  ];
  const visibleComments = comments.data?.length ? comments.data : fallbackComments;

  const submitComment = async () => {
    if (!commentText.trim()) return;
    await comments.addComment.mutateAsync(commentText.trim());
    setCommentText("");
  };

  return (
    <Panel title="Bình luận chiến dịch" icon={MessageCircle}>
      <div className="mb-4 space-y-3">
        {visibleComments.map((comment) => (
          <div
            key={comment.id}
            className="flex gap-3 rounded-xl border border-slate-100 bg-white p-4"
          >
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#F3F0FF] text-xs font-black text-[#7C3AED]">
              {comment.authorName.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-black text-slate-900">{comment.authorName}</p>
                <span className="text-xs font-semibold text-slate-400">
                  {comment.createdAt ? formatDisplayTime(comment.createdAt) : ""}
                </span>
              </div>
              <p className="mt-1 text-sm leading-6 text-slate-600">{comment.content}</p>
              <button
                type="button"
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-black text-slate-500 transition hover:text-[#7C3AED]"
              >
                <Heart size={14} />
                Like
              </button>
            </div>
          </div>
        ))}
      </div>
      {campaign.canComment && !isUnauthorizedOfficer && (
        <Composer
          value={commentText}
          onChange={setCommentText}
          onSubmit={submitComment}
          disabled={comments.addComment.isPending}
          placeholder="Nhập bình luận..."
        />
      )}
    </Panel>
  );
}

function GroupChatNavigationCard({
  campaign,
  approvedStatus,
}: {
  campaign: Campaign;
  approvedStatus: boolean;
}) {
  const { user } = useAuth();
  const chat = useCampaignChat(campaign.id);
  const isUnauthorizedOfficer = user?.role === "WARD_STAFF" && !campaign.canManage;
  if (isUnauthorizedOfficer || !campaign.privateDetailsVisible) {
    return null;
  }
  const memberCount = Math.max(1, campaign.participants || 0);
  const latest = chat.data?.at(-1);
  const latestPreview = latest
    ? `${latest.senderName}: ${latest.message}`
    : `${campaign.createdBy || "Người chủ trì"}: Chiến dịch sẽ bắt đầu lúc 6h sáng 19/6.`;
  const avatars = [campaign.createdBy ? campaign.createdBy.split(" ").at(-1)?.[0] || "H" : "CB", "A", "B"];

  return (
    <section className="rounded-2xl border border-violet-100 bg-white p-6 shadow-lg">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-black text-slate-950">
          <MessageSquare size={17} className="text-[#7C3AED]" />
          Nhóm chat chiến dịch
        </h2>
        {approvedStatus && (
          <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-black text-red-600">
            Tin mới
          </span>
        )}
      </div>
      <div className="flex -space-x-2">
        {avatars.map((avatar) => (
          <span
            key={avatar}
            className="grid h-9 w-9 place-items-center rounded-full border-2 border-white bg-[#F3F0FF] text-xs font-black text-[#7C3AED] shadow-sm"
          >
            {avatar}
          </span>
        ))}
      </div>
      <p className="mt-4 text-sm font-black text-slate-900">
        {memberCount} thành viên đang trong nhóm
      </p>
      <p className="mt-1 truncate text-sm font-semibold text-slate-500">{latestPreview}</p>
      <Link
        to="/campaigns/$id/group-chat"
        params={{ id: campaign.id }}
        className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-4 text-sm font-black text-white shadow-sm transition hover:brightness-110"
      >
        Vào nhóm chat
        <ArrowRight size={16} />
      </Link>
    </section>
  );
}

function ShareCard() {
  return (
    <section className="rounded-2xl border border-violet-100 bg-white p-6 shadow-lg">
      <h2 className="mb-4 text-sm font-black uppercase tracking-wider text-slate-500">
        Chia sẻ chiến dịch
      </h2>
      <div className="grid grid-cols-3 gap-3">
        <IconButton label="Facebook" icon={Facebook} />
        <IconButton label="Zalo" text="Z" />
        <IconButton label="Copy link" icon={Copy} />
      </div>
    </section>
  );
}

function IconButton({
  label,
  icon: Icon,
  text,
}: {
  label: string;
  icon?: ElementType;
  text?: string;
}) {
  return (
    <button
      type="button"
      className="grid h-11 place-items-center rounded-xl border border-violet-100 bg-[#F8F7FF] text-sm font-black text-[#7C3AED] transition hover:bg-[#F3F0FF]"
      aria-label={label}
      title={label}
    >
      {Icon ? <Icon size={18} /> : text}
    </button>
  );
}

function Panel({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: ElementType;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-violet-100 bg-white p-6 shadow-md">
      <h2 className="mb-4 flex items-center gap-2 text-xl font-black text-slate-950">
        <Icon size={20} className="text-[#7C3AED]" />
        {title}
      </h2>
      {children}
    </section>
  );
}

function Composer({
  value,
  onChange,
  onSubmit,
  disabled,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  placeholder: string;
}) {
  return (
    <div className="flex gap-2">
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/15"
        placeholder={placeholder}
      />
      <button
        type="button"
        onClick={onSubmit}
        disabled={disabled}
        className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#7C3AED] text-white transition hover:brightness-110 disabled:opacity-50"
      >
        <Send size={17} />
      </button>
    </div>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
}: {
  icon: ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-violet-100 bg-[#F3F0FF] p-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#7C3AED]">
        <Icon size={15} />
        {label}
      </div>
      <p className="text-sm font-bold leading-6 text-slate-900">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: Campaign["status"] }) {
  const meta = {
    pending_review: {
      label: "Chờ duyệt",
      className: "border-slate-200 bg-slate-100 text-slate-600",
    },
    recruiting: {
      label: "Đang hoạt động",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
    inProgress: { label: "Đang hoạt động", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
    completed: { label: "Đã kết thúc", className: "border-red-200 bg-red-50 text-red-700" },
    active: {
      label: "Đang hoạt động",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
    ended: {
      label: "Đã kết thúc",
      className: "border-red-200 bg-red-50 text-red-700",
    },
  }[status] ?? {
    label: "Đang hoạt động",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-black shadow-sm ${meta.className}`}
    >
      <CheckCircle2 size={13} />
      {meta.label}
    </span>
  );
}

function ListIcon(props: React.ComponentProps<typeof MoreHorizontal>) {
  return <MoreHorizontal {...props} />;
}

function dateRange(campaign: Campaign) {
  const start = campaign.startTime
    ? new Date(campaign.startTime).toLocaleDateString("vi-VN")
    : "Chưa đặt";
  const end = campaign.endTime
    ? new Date(campaign.endTime).toLocaleDateString("vi-VN")
    : "Chưa đặt";
  return `${start} - ${end}`;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDisplayTime(value: string) {
  if (/^\d{2}:\d{2}$/.test(value)) return value;
  return formatDateTime(value);
}

function joinLabel(status: NonNullable<Campaign["currentUserJoinStatus"]>) {
  if (status === "APPROVED") return "Đã được duyệt";
  if (status === "PENDING") return "Chờ duyệt";
  if (status === "REJECTED") return "Bị từ chối";
  return "Đã hủy";
}
