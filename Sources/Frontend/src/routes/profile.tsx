import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { FormEvent, useEffect, useState, useRef } from "react";
import {
  Loader2,
  Save,
  User,
  Mail,
  Phone,
  ShieldAlert,
  Trash2,
  LogOut,
  Award,
  Settings,
  AlertCircle,
  CheckCircle,
  Frown,
  Calendar,
  MapPin,
  Camera,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  Send,
  Clock,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { useAuth, Role } from "@/lib/auth";
import { getToken, API_BASE, wardApi } from "@/lib/api";
import {
  useProfile,
  useUpdateProfileMutation,
  useDeleteOwnProfileMutation,
  useChangePasswordMutation,
  useSendChangePasswordOtp,
} from "@/hooks";
import { useI18n } from "@/lib/i18n";
import { CampaignAppealPanel } from "@/components/site/CampaignAppealPanel";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

export const Route = createFileRoute("/profile")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    if (!getToken() || !localStorage.getItem("dn_auth_user_v2")) {
      throw redirect({ to: "/login", search: { redirect: "/profile", error: undefined } });
    }
  },
  component: ProfilePage,
});

const getRoleBadge = (role: string, locale: string) => {
  switch (role) {
    case "CITIZEN":
      return {
        label: locale === "vi" ? "Người dân" : "Citizen",
        className:
          "bg-[#F5F9FF] text-[#0B4FC4] dark:bg-blue-950/30 dark:text-blue-400 border border-[#E4EAF2] dark:border-blue-900/30",
      };
    case "WARD_STAFF":
      return {
        label: locale === "vi" ? "Cán bộ Phường" : "Ward Staff",
        className:
          "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-400",
      };
    case "POLICE":
      return {
        label: locale === "vi" ? "Công an địa phương" : "Local Police",
        className:
          "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-400",
      };
    case "CITY_ADMIN":
      return {
        label: locale === "vi" ? "Quản trị viên Thành phố" : "City Admin",
        className:
          "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400",
      };
    case "SUPER_ADMIN":
      return {
        label: locale === "vi" ? "Quản trị viên cấp cao" : "Super Admin",
        className:
          "bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/30 dark:text-purple-400",
      };
    default:
      return {
        label: role,
        className:
          "bg-slate-50 text-slate-700 dark:bg-slate-950/30 dark:text-slate-400 border border-slate-200/50",
      };
  }
};

const getAvatarAuraClass = (badge?: string) => {
  if (!badge) return "";
  switch (badge) {
    case "Đại sứ Vì cộng đồng":
      return "ring-4 ring-amber-400 dark:ring-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)] ring-offset-2 ring-offset-white dark:ring-offset-slate-900";
    case "Trụ cột Cộng đồng":
      return "ring-4 ring-cyan-400 dark:ring-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.4)] ring-offset-2 ring-offset-white dark:ring-offset-slate-900";
    case "Thành viên Năng nổ":
      return "ring-4 ring-emerald-400 dark:ring-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)] ring-offset-2 ring-offset-white dark:ring-offset-slate-900";
    default:
      return "ring-2 ring-slate-300 dark:ring-slate-700 ring-offset-2 ring-offset-white dark:ring-offset-slate-900";
  }
};

const getReputationBadgeStyle = (badge: string) => {
  switch (badge) {
    case "Đại sứ Vì cộng đồng":
      return "bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500 text-white shadow-[0_0_12px_rgba(245,158,11,0.6)] border border-yellow-400/40 px-3.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-full";
    case "Trụ cột Cộng đồng":
      return "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-[0_0_10px_rgba(6,182,212,0.5)] border border-cyan-500/30 px-3.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-full";
    case "Thành viên Năng nổ":
      return "bg-gradient-to-r from-emerald-600 to-emerald-400 text-white shadow-[0_0_8px_rgba(16,185,129,0.4)] border border-emerald-400/30 px-3.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-full";
    default:
      return "bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700 px-3 py-0.5 text-xs font-bold rounded-full";
  }
};

function ProfilePage() {
  const { locale } = useI18n();
  const navigate = useNavigate();
  const { login, logout } = useAuth();
  const { data: profile, isLoading, isError, refetch } = useProfile();
  const updateProfile = useUpdateProfileMutation();
  const deleteOwnProfile = useDeleteOwnProfileMutation();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<"details" | "settings">("details");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [wardId, setWardId] = useState<number | undefined>(undefined);
  const [wardSearch, setWardSearch] = useState("");
  const [showWardDropdown, setShowWardDropdown] = useState(false);
  const wardDropdownRef = useRef<HTMLDivElement>(null);

  const { data: wards } = useQuery({
    queryKey: ["wards"],
    queryFn: () => wardApi.getAll(),
  });

  // Password change states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const changePasswordMutation = useChangePasswordMutation();
  const sendOtpMutation = useSendChangePasswordOtp();

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSendOtp = async () => {
    try {
      await sendOtpMutation.mutateAsync();
      toast.success(
        locale === "vi"
          ? "Đã gửi mã OTP thành công. Vui lòng kiểm tra email!"
          : "OTP sent successfully. Please check your email!",
      );
      setCountdown(60);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : (locale === "vi" ? "Gửi mã OTP thất bại!" : "Failed to send OTP!"),
      );
    }
  };

  // Deactivate account state
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wardDropdownRef.current && !wardDropdownRef.current.contains(event.target as Node)) {
        setShowWardDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.fullName || "");
    setPhoneNumber(profile.phoneNumber || "");
    setEmail(profile.email || "");
    setAvatarUrl(profile.avatarUrl || "");
    setWardId(profile.wardId ?? undefined);
  }, [profile]);

  useEffect(() => {
    if (wardId && wards) {
      const match = wards.find((w) => w.id === wardId);
      if (match) {
        setWardSearch(match.name);
      }
    } else {
      setWardSearch("");
    }
  }, [wardId, wards]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error(locale === "vi" ? "Chỉ hỗ trợ tệp hình ảnh!" : "Only image files are supported!");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    const toastId = toast.loading(
      locale === "vi" ? "Đang tải lên ảnh đại diện..." : "Uploading profile image...",
    );
    setIsUploading(true);

    try {
      const response = await fetch(`${API_BASE}/api/files/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const resData = await response.json();
      if (resData.error) {
        throw new Error(resData.error);
      }

      setAvatarUrl(resData.fileUrl);
      toast.success(
        locale === "vi"
          ? "Đã tải ảnh lên. Hãy nhấn Lưu để cập nhật!"
          : "Image uploaded. Press Save to update!",
        { id: toastId },
      );
    } catch (err) {
      toast.error(
        locale === "vi"
          ? "Tải lên thất bại. Vui lòng thử lại!"
          : "Upload failed. Please try again!",
        { id: toastId },
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (wardSearch.trim() && !wardId) {
      toast.error(
        locale === "vi"
          ? "Vui lòng chọn một Phường/Xã hợp lệ từ danh sách gợi ý!"
          : "Please select a valid Ward from the suggestion list!",
      );
      return;
    }
    try {
      const updated = await updateProfile.mutateAsync({
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
        email: email.trim() || undefined,
        avatarUrl: avatarUrl || undefined,
        wardId: wardId ?? null,
      });
      if (profile) {
        login({
          name: updated.fullName || profile.fullName,
          role: profile.role,
          org: updated.wardName || profile.wardName || "",
          wardName: updated.wardName || profile.wardName,
          wardType: updated.wardType || profile.wardType,
          wardId: updated.wardId !== undefined ? updated.wardId : profile.wardId,
          avatarUrl: updated.avatarUrl || avatarUrl || undefined,
          token: getToken() || undefined,
        });
      }
      toast.success(
        locale === "vi" ? "Đã cập nhật hồ sơ thành công" : "Profile updated successfully",
      );
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== profile?.username) {
      toast.error(locale === "vi" ? "Tên tài khoản không khớp!" : "Username does not match!");
      return;
    }

    const toastId = toast.loading(
      locale === "vi" ? "Đang xóa tài khoản..." : "Deleting account...",
    );
    try {
      await deleteOwnProfile.mutateAsync();
      toast.success(
        locale === "vi" ? "Xóa tài khoản thành công!" : "Account deleted successfully!",
        {
          id: toastId,
        },
      );
      logout();
      navigate({ to: "/" });
    } catch (err) {
      toast.error(
        locale === "vi"
          ? "Lỗi xóa tài khoản. Vui lòng thử lại!"
          : "Error deleting account. Try again!",
        { id: toastId },
      );
    }
  };

  const handlePasswordChange = async (event: FormEvent) => {
    event.preventDefault();
    if (!currentPassword) {
      toast.error(
        locale === "vi"
          ? "Vui lòng nhập mật khẩu hiện tại!"
          : "Please enter your current password!",
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(
        locale === "vi" ? "Mật khẩu xác nhận không khớp!" : "Confirm password does not match!",
      );
      return;
    }
    if (newPassword.length < 8) {
      toast.error(
        locale === "vi"
          ? "Mật khẩu phải có ít nhất 8 ký tự!"
          : "Password must be at least 8 characters!",
      );
      return;
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/.test(newPassword)) {
      toast.error(
        locale === "vi"
          ? "Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số!"
          : "Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number!",
      );
      return;
    }

    if (!otpCode) {
      toast.error(locale === "vi" ? "Vui lòng nhập mã OTP xác thực!" : "Please enter the OTP verification code!");
      return;
    }

    try {
      await changePasswordMutation.mutateAsync({ currentPassword, newPassword, confirmPassword, otpCode });
      toast.success(locale === "vi" ? "Đổi mật khẩu thành công!" : "Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setOtpCode("");
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : locale === "vi"
            ? "Đổi mật khẩu thất bại!"
            : "Password change failed!",
      );
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const hrs = String(d.getHours()).padStart(2, "0");
    const mins = String(d.getMinutes()).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const yr = d.getFullYear();
    return `${hrs}:${mins} ${day}/${month}/${yr}`;
  };

  const filteredWards =
    wards
      ?.filter((ward) => ward.name.toLowerCase().includes(wardSearch.toLowerCase()))
      .slice(0, 10) || [];

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col justify-center items-center gap-4">
        <Loader2 className="animate-spin text-[#0B4FC4] dark:text-blue-400" size={48} />
        <p className="text-sm font-semibold text-slate-500">
          {locale === "vi" ? "Đang tải thông tin cá nhân..." : "Loading profile..."}
        </p>
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="max-w-2xl mx-auto px-4 md:px-8 py-12">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center shadow-lg">
          <AlertTriangle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-3">
            {locale === "vi" ? "Không tải được hồ sơ" : "Could not load profile"}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            {locale === "vi"
              ? "Hệ thống gặp lỗi khi truy xuất dữ liệu cá nhân của bạn."
              : "The system encountered an error fetching your personal data."}
          </p>
          <button onClick={() => refetch()} className="btn-civic btn-civic-primary px-6 py-2.5">
            {locale === "vi" ? "Thử lại" : "Try again"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-8 py-10 md:py-16">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[350px] bg-gradient-to-b from-[#F5F9FF]/50 to-transparent dark:from-slate-800/15 pointer-events-none -z-10 rounded-b-[40px]" />

      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-extrabold text-4xl md:text-5xl text-slate-800 dark:text-slate-50 tracking-tight mb-2">
            {locale === "vi" ? "Thông tin cá nhân" : "Personal Profile"}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            {locale === "vi"
              ? "Quản lý dữ liệu cá nhân, xem thành tựu và cấu hình bảo mật tài khoản."
              : "Manage your personal records, track milestones, and configure account security."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left column: Card display, Stats & Badge */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-[#E4EAF2] dark:border-slate-800/80 rounded-2xl shadow-md p-6 flex flex-col items-center text-center relative overflow-hidden transition-all duration-300">
            {/* Soft decorative background circles */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#0B4FC4]/5 rounded-full blur-2xl" />
            <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-emerald-500/5 rounded-full blur-2xl" />

            {/* Avatar Upload Container */}
            <div className="relative group cursor-pointer mb-5" onClick={handleAvatarClick}>
              <div
                className={`w-28 h-28 rounded-full overflow-hidden flex items-center justify-center text-3xl font-black bg-[#F5F9FF] dark:bg-slate-800 transition-all duration-300 relative ${
                  profile.role === "CITIZEN"
                    ? getAvatarAuraClass(profile.reputationBadge)
                    : "ring-4 ring-slate-100"
                }`}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[#0B4FC4] dark:text-blue-400">
                    {profile.fullName.split(" ").at(-1)?.[0] || "U"}
                  </span>
                )}

                {/* Edit overlay */}
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex flex-col justify-center items-center gap-1.5 transition-all duration-200 rounded-full">
                  <Camera className="h-6 w-6 text-white" />
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                    {locale === "vi" ? "Thay đổi" : "Change"}
                  </span>
                </div>

                {isUploading && (
                  <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center rounded-full">
                    <Loader2 className="animate-spin text-white h-8 w-8" />
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
                disabled={isUploading}
              />
            </div>

            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-50 line-clamp-1">
              {profile.fullName}
            </h2>

            <div className="mt-3.5 flex flex-wrap gap-2 justify-center">
              <span
                className={`inline-flex px-3 py-1 rounded-full text-xs font-black ${getRoleBadge(profile.role, locale).className}`}
              >
                {getRoleBadge(profile.role, locale).label}
              </span>
            </div>

            {profile.role === "CITIZEN" && profile.reputationBadge && (
              <div className="mt-4">
                <span className={getReputationBadgeStyle(profile.reputationBadge)}>
                  {profile.reputationBadge}
                </span>
              </div>
            )}

            {/* Ward Details */}
            {profile.wardName && (
              <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800 w-full flex items-center justify-center gap-2 text-sm text-slate-550 dark:text-slate-400 font-medium">
                <MapPin className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                <span>
                  {profile.wardType || ""} {profile.wardName}
                </span>
              </div>
            )}
          </div>

          {/* Quick Info & Stats */}
          {profile.role === "CITIZEN" && (
            <div className="bg-white dark:bg-slate-900 border border-[#E4EAF2] dark:border-slate-800/80 rounded-2xl shadow-md p-6 space-y-5">
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
                {locale === "vi" ? "Thống kê hoạt động" : "Activity Stats"}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {/* Completed campaigns */}
                <div className="bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100/75 dark:border-emerald-900/30 rounded-xl p-3.5 text-center transition-all duration-200">
                  <Award className="h-6 w-6 text-emerald-600 dark:text-emerald-400 mx-auto mb-1.5" />
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {locale === "vi" ? "Hoàn thành" : "Completed"}
                  </span>
                  <span className="block text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1">
                    {profile.completedCampaignCount ?? 0}
                  </span>
                </div>

                {/* Absent Campaigns */}
                <div
                  className={`border rounded-xl p-3.5 text-center transition-all duration-200 ${
                    (profile.noShowCampaignCount ?? 0) > 0
                      ? "bg-rose-50/50 border-rose-100/75 dark:bg-rose-950/10 dark:border-rose-900/30"
                      : "bg-slate-50 border-slate-100 dark:bg-slate-800/20 dark:border-slate-800"
                  }`}
                >
                  <Frown
                    className={`h-6 w-6 mx-auto mb-1.5 ${(profile.noShowCampaignCount ?? 0) > 0 ? "text-rose-600" : "text-slate-400"}`}
                  />
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {locale === "vi" ? "Vắng mặt" : "No-Show"}
                  </span>
                  <span
                    className={`block text-2xl font-black mt-1 ${(profile.noShowCampaignCount ?? 0) > 0 ? "text-rose-700 dark:text-rose-400" : "text-slate-700 dark:text-slate-300"}`}
                  >
                    {profile.noShowCampaignCount ?? 0}
                  </span>
                </div>
              </div>

              {profile.warningCount !== undefined && profile.warningCount > 0 && (
                <div className="flex gap-3 p-3.5 border border-amber-200 bg-amber-50 rounded-xl text-amber-800 dark:bg-amber-950/10 dark:border-amber-900/30 dark:text-amber-300">
                  <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider">
                      {locale === "vi" ? "Cảnh cáo hoạt động" : "Activity Warning"}
                    </h4>
                    <p className="text-xs mt-1 leading-normal font-medium text-amber-850 dark:text-amber-300">
                      {locale === "vi"
                        ? `Tài khoản đã nhận ${profile.warningCount}/3 cảnh cáo vì vắng mặt không lý do. Vui lòng tham gia đầy đủ.`
                        : `Account received ${profile.warningCount}/3 warning points for absenteeism. Please avoid no-shows.`}
                    </p>
                  </div>
                </div>
              )}

              {(profile.campaignBanned || profile.status === "BANNED") && (
                <CampaignAppealPanel locale={locale} isGlobalBan={profile.status === "BANNED"} />
              )}
            </div>
          )}
        </div>

        {/* Right column: Dynamic Tabs & Action Area */}
        <div className="lg:col-span-8 space-y-6">
          {/* Tab Navigation header */}
          <div className="bg-white dark:bg-slate-900 border border-[#E4EAF2] dark:border-slate-800/80 rounded-2xl shadow-sm p-1.5 flex gap-1.5">
            <button
              onClick={() => setActiveTab("details")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-extrabold transition-all duration-200 cursor-pointer ${
                activeTab === "details"
                  ? "bg-[#0B4FC4] text-white shadow-md shadow-[#0B4FC4]/15"
                  : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <User size={16} />
              {locale === "vi" ? "Thông tin cá nhân" : "Personal Info"}
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-extrabold transition-all duration-200 cursor-pointer ${
                activeTab === "settings"
                  ? "bg-[#0B4FC4] text-white shadow-md shadow-[#0B4FC4]/15"
                  : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <Settings size={16} />
              {locale === "vi" ? "Cấu hình bảo mật" : "Security Settings"}
            </button>
          </div>

          {/* Tab 1: Profile Details Form */}
          {activeTab === "details" && (
            <div className="bg-white dark:bg-slate-900 border border-[#E4EAF2] dark:border-slate-800/80 rounded-2xl shadow-md p-6 md:p-8 animate-fade-in">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100 dark:border-slate-800/60">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-50 flex items-center gap-2">
                  <User className="text-[#0B4FC4]" size={20} />
                  {locale === "vi" ? "Chỉnh sửa thông tin liên hệ" : "Edit Contact Details"}
                </h3>
                <button
                  type="submit"
                  form="profile-details-form"
                  disabled={updateProfile.isPending}
                  className="flex items-center gap-2 bg-[#0B4FC4] hover:bg-[#083CA5] text-white font-bold py-2.5 px-5 rounded-xl shadow-md shadow-[#0B4FC4]/15 disabled:opacity-50 hover:scale-[1.02] transition-all duration-200 cursor-pointer text-sm"
                >
                  {updateProfile.isPending ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Save size={16} />
                  )}
                  {locale === "vi" ? "Lưu thay đổi" : "Save Changes"}
                </button>
              </div>

              <form id="profile-details-form" onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    {locale === "vi" ? "Họ và tên" : "Full Name"}{" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
                    <input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="w-full min-h-[48px] pl-11 pr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:border-[#0B4FC4] focus:ring-1 focus:ring-[#0B4FC4] focus:outline-none text-sm font-semibold transition-all duration-200"
                      placeholder={locale === "vi" ? "Họ và tên đầy đủ" : "Your full name"}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      {locale === "vi" ? "Số điện thoại" : "Phone Number"}
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
                      <input
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full min-h-[48px] pl-11 pr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:border-[#0B4FC4] focus:ring-1 focus:ring-[#0B4FC4] focus:outline-none text-sm font-semibold transition-all duration-200"
                        placeholder={
                          locale === "vi" ? "Chưa cập nhật số điện thoại" : "Not configured"
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
                      <input
                        value={email}
                        type="email"
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full min-h-[48px] pl-11 pr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:border-[#0B4FC4] focus:ring-1 focus:ring-[#0B4FC4] focus:outline-none text-sm font-semibold transition-all duration-200"
                        placeholder={
                          locale === "vi" ? "Chưa cập nhật địa chỉ email" : "Not configured"
                        }
                      />
                    </div>
                  </div>

                  <div ref={wardDropdownRef} className="relative">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      {locale === "vi" ? "Phường/Xã cư trú" : "Registered Ward"}
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-[15px] h-4.5 w-4.5 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        value={wardSearch}
                        onFocus={() => setShowWardDropdown(true)}
                        onChange={(e) => {
                          const val = e.target.value;
                          setWardSearch(val);
                          // Try to match ward immediately
                          const match = wards?.find((w) => w.name.toLowerCase() === val.trim().toLowerCase());
                          if (match) {
                            setWardId(match.id);
                          } else {
                            setWardId(undefined);
                          }
                        }}
                        placeholder={locale === "vi" ? "Nhập để tìm Phường/Xã..." : "Type to search ward..."}
                        disabled={profile.role !== "CITIZEN"}
                        className="w-full min-h-[48px] pl-11 pr-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:border-[#0B4FC4] focus:ring-1 focus:ring-[#0B4FC4] focus:outline-none text-sm font-semibold transition-all duration-200 disabled:opacity-75 disabled:cursor-not-allowed"
                      />
                      {wardSearch && profile.role === "CITIZEN" && (
                        <button
                          type="button"
                          onClick={() => {
                            setWardSearch("");
                            setWardId(undefined);
                          }}
                          className="absolute right-3 top-[14px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          <XCircle className="h-5 w-5" />
                        </button>
                      )}
                    </div>

                    {showWardDropdown && profile.role === "CITIZEN" && (
                      <div className="absolute z-50 w-full mt-1.5 max-h-60 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 shadow-lg scrollbar-thin">
                        {filteredWards.length > 0 ? (
                          filteredWards.map((ward) => (
                            <button
                              key={ward.id}
                              type="button"
                              onClick={() => {
                                setWardId(ward.id);
                                setWardSearch(ward.name);
                                setShowWardDropdown(false);
                              }}
                              className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-900 text-sm font-semibold text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-2"
                            >
                              <MapPin className="h-4 w-4 text-slate-400" />
                              <span>{ward.name}</span>
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-sm text-slate-500 text-center font-medium">
                            {locale === "vi" ? "Không tìm thấy Phường/Xã nào" : "No wards found"}
                          </div>
                        )}
                      </div>
                    )}
                    {profile.role !== "CITIZEN" && (
                      <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                        {locale === "vi"
                          ? "Cán bộ không tự thay đổi phường trực thuộc"
                          : "Staff cannot change their assigned ward"}
                      </p>
                    )}
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Tab 3: Security & Account Settings */}
          {activeTab === "settings" && (
            <div className="bg-white dark:bg-slate-900 border border-[#E4EAF2] dark:border-slate-800/80 rounded-2xl shadow-md p-6 md:p-8 space-y-8 animate-fade-in">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-50 mb-4 flex items-center gap-2">
                <Settings className="text-[#0B4FC4]" size={20} />
                {locale === "vi" ? "Cấu hình và Bảo mật" : "Config & Security"}
              </h3>

              {/* Đổi mật khẩu */}
              <div className="p-5 md:p-6 rounded-2xl border border-[#E4EAF2] dark:border-slate-800 space-y-5">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <Lock size={15} className="text-[#0B4FC4]" />
                    {locale === "vi" ? "Đổi mật khẩu" : "Change Password"}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                    {locale === "vi"
                      ? "Cập nhật mật khẩu tài khoản của bạn để duy trì bảo mật nâng cao."
                      : "Update your account password to maintain advanced security."}
                  </p>
                </div>

                <form onSubmit={handlePasswordChange} className="space-y-4 pt-2">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                        {locale === "vi" ? "Mật khẩu hiện tại" : "Current Password"}{" "}
                        <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          required
                          className="w-full min-h-[44px] pl-3.5 pr-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:border-[#0B4FC4] focus:ring-1 focus:ring-[#0B4FC4] focus:outline-none text-sm font-semibold transition-all duration-200"
                          placeholder={
                            locale === "vi" ? "Nhập mật khẩu hiện tại" : "Enter current password"
                          }
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-450 hover:text-slate-650 dark:hover:text-slate-300 transition-colors duration-150 cursor-pointer"
                        >
                          {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                          {locale === "vi" ? "Mật khẩu mới" : "New Password"}{" "}
                          <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type={showNewPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            className="w-full min-h-[44px] pl-3.5 pr-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:border-[#0B4FC4] focus:ring-1 focus:ring-[#0B4FC4] focus:outline-none text-sm font-semibold transition-all duration-200"
                            placeholder={
                              locale === "vi" ? "Nhập mật khẩu mới" : "Enter new password"
                            }
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-450 hover:text-slate-650 dark:hover:text-slate-300 transition-colors duration-150 cursor-pointer"
                          >
                            {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                          {locale === "vi" ? "Xác nhận mật khẩu mới" : "Confirm New Password"}{" "}
                          <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="w-full min-h-[44px] pl-3.5 pr-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:border-[#0B4FC4] focus:ring-1 focus:ring-[#0B4FC4] focus:outline-none text-sm font-semibold transition-all duration-200"
                            placeholder={
                              locale === "vi" ? "Xác nhận mật khẩu mới" : "Confirm new password"
                            }
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-450 hover:text-slate-650 dark:hover:text-slate-300 transition-colors duration-150 cursor-pointer"
                          >
                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>
                    </div>
                    {/* Mã xác nhận OTP */}
                    <div className="pt-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                        {locale === "vi" ? "Mã xác thực OTP (Email)" : "OTP Verification Code (Email)"} <span className="text-rose-500">*</span>
                      </label>
                      <div className="flex gap-3">
                        <InputOTP
                          maxLength={6}
                          value={otpCode}
                          onChange={setOtpCode}
                        >
                          <InputOTPGroup>
                            <InputOTPSlot index={0} className="w-10 h-11 text-base font-bold bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800" />
                            <InputOTPSlot index={1} className="w-10 h-11 text-base font-bold bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800" />
                            <InputOTPSlot index={2} className="w-10 h-11 text-base font-bold bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800" />
                            <InputOTPSlot index={3} className="w-10 h-11 text-base font-bold bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800" />
                            <InputOTPSlot index={4} className="w-10 h-11 text-base font-bold bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800" />
                            <InputOTPSlot index={5} className="w-10 h-11 text-base font-bold bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800" />
                          </InputOTPGroup>
                        </InputOTP>
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={countdown > 0 || sendOtpMutation.isPending}
                          className="px-4 py-2 bg-[#F5F9FF] hover:bg-[#E4EAF2] disabled:bg-slate-50 text-[#0B4FC4] disabled:text-slate-400 font-bold rounded-xl text-sm border border-[#E4EAF2] dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-850 transition-all duration-200 shrink-0 min-w-[120px] flex items-center justify-center cursor-pointer"
                        >
                          {sendOtpMutation.isPending ? (
                            <Loader2 className="animate-spin h-4 w-4" />
                          ) : countdown > 0 ? (
                            `${countdown}s`
                          ) : (
                            locale === "vi" ? "Gửi mã OTP" : "Send OTP"
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={changePasswordMutation.isPending}
                      className="flex items-center gap-2 bg-[#0B4FC4] hover:bg-[#083CA5] text-white font-bold py-2.5 px-5 rounded-xl text-sm shadow-md shadow-[#0B4FC4]/15 disabled:opacity-50 transition-all duration-200 cursor-pointer"
                    >
                      {changePasswordMutation.isPending ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        <Save size={16} />
                      )}
                      {locale === "vi" ? "Đổi mật khẩu" : "Update Password"}
                    </button>
                  </div>
                </form>
              </div>

              {/* Danger Zone: Delete Account */}
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                <div className="bg-rose-50/50 dark:bg-rose-950/10 border border-rose-200 dark:border-rose-900/30 rounded-2xl p-5 md:p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-6 w-6 text-rose-600 shrink-0" />
                    <div>
                      <h4 className="text-base font-bold text-rose-700 dark:text-rose-400 leading-normal">
                        {locale === "vi"
                          ? "Khu vực nguy hiểm: Vô hiệu hóa tài khoản"
                          : "Danger Zone: Deactivate Account"}
                      </h4>
                      <p className="text-xs text-rose-700/80 dark:text-rose-450 leading-relaxed font-semibold mt-1">
                        {locale === "vi"
                          ? "Việc xóa tài khoản sẽ ẩn toàn bộ thông tin cá nhân của bạn khỏi cổng thông tin SmartCity. Bạn sẽ không thể đăng nhập hoặc tham gia các chiến dịch tương lai bằng tài khoản này."
                          : "Deleting your profile will soft-delete your PII from the system. You will immediately be logged out and cannot reactivate this username."}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => setIsConfirmDeleteOpen(true)}
                      className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 px-5 rounded-xl text-sm shadow-md shadow-rose-600/10 transition-all duration-200 cursor-pointer"
                    >
                      <Trash2 size={16} />
                      {locale === "vi" ? "Yêu cầu xóa tài khoản" : "Delete My Account"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal for Delete Account */}
      {isConfirmDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 relative overflow-hidden animate-scale-up">
            <div className="flex items-center gap-2 text-rose-600 mb-4">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-lg font-extrabold">
                {locale === "vi"
                  ? "Bạn chắc chắn muốn xóa tài khoản?"
                  : "Confirm Account Deletion?"}
              </h3>
            </div>

            <p className="text-xs font-semibold text-slate-550 dark:text-slate-400 leading-relaxed mb-5">
              {locale === "vi"
                ? `Hành động này sẽ vô hiệu hóa hoàn toàn tài khoản của bạn. Vui lòng nhập tên tài khoản của bạn `
                : `This action is irreversible and will deactivate your records. Please enter your username `}
              <strong className="text-slate-800 dark:text-slate-100 font-black">
                {profile?.username}
              </strong>{" "}
              {locale === "vi" ? "để xác nhận." : "to confirm."}
            </p>

            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder={profile?.username}
              className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm font-bold focus:border-rose-500 focus:ring-1 focus:ring-rose-500 focus:outline-none mb-6 text-center"
            />

            <div className="flex gap-2 justify-end pt-2 border-t border-slate-100 dark:border-slate-850">
              <button
                onClick={() => {
                  setIsConfirmDeleteOpen(false);
                  setDeleteConfirmText("");
                }}
                className="px-4 py-2 rounded-xl text-sm font-extrabold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors cursor-pointer"
              >
                {locale === "vi" ? "Hủy bỏ" : "Cancel"}
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== profile?.username || deleteOwnProfile.isPending}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-black text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
              >
                {deleteOwnProfile.isPending && <Loader2 className="animate-spin h-4 w-4" />}
                {locale === "vi" ? "Tôi hiểu, hãy xóa tài khoản" : "Yes, Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
