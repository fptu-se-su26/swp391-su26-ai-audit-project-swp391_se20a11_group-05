import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { AuthUser } from "@/lib/auth";
import { Role } from "@/lib/roles";
import { userApi, wardApi, type UserProfile } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Bell,
  BellRing,
  Building2,
  Camera,
  IdCard,
  Languages,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Save,
  Shield,
  Smartphone,
  User,
  UserCheck,
  type LucideIcon,
} from "lucide-react";

type WardProfileConfigPageProps = {
  user: AuthUser | null;
  authorityUnitName: string;
  authorityUnitLabel: string;
  onProfileUpdated?: (profile: UserProfile) => void;
};

type ProfileFormState = {
  fullName: string;
  phoneNumber: string;
  email: string;
};

const emptyForm: ProfileFormState = {
  fullName: "",
  phoneNumber: "",
  email: "",
};

export function WardProfileConfigPage({
  user,
  authorityUnitName,
  authorityUnitLabel,
  onProfileUpdated,
}: WardProfileConfigPageProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ProfileFormState>(emptyForm);

  const profileQuery = useQuery({
    queryKey: ["user", "profile"],
    queryFn: userApi.profile,
  });

  const wardsQuery = useQuery({
    queryKey: ["wards"],
    queryFn: wardApi.getAll,
    staleTime: 5 * 60 * 1000,
  });

  const profile = profileQuery.data;

  useEffect(() => {
    if (!profile) return;
    setForm({
      fullName: profile.fullName || "",
      phoneNumber: profile.phoneNumber || "",
      email: profile.email || "",
    });
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: userApi.updateProfile,
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(["user", "profile"], updatedProfile);
      queryClient.invalidateQueries({ queryKey: ["user", "profile"] });
      onProfileUpdated?.(updatedProfile);
      toast.success("Đã cập nhật thông tin tài khoản");
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Không thể cập nhật thông tin";
      toast.error(message);
    },
  });

  const wardName = useMemo(() => {
    const wardId = profile?.wardId ?? user?.wardId;
    const wardFromList = wardsQuery.data?.find((ward) => ward.id === wardId);
    return profile?.wardName || wardFromList?.name || user?.wardName || authorityUnitName;
  }, [authorityUnitName, profile, user, wardsQuery.data]);

  const userName = form.fullName || profile?.fullName || user?.name || "Cán bộ phường";
  const role = profile?.role || user?.role;
  const roleLabel = role === Role.WARD_STAFF ? "Cán bộ phường" : "Cán bộ đơn vị";
  const initials = userName
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const originalForm = useMemo<ProfileFormState>(
    () => ({
      fullName: profile?.fullName || "",
      phoneNumber: profile?.phoneNumber || "",
      email: profile?.email || "",
    }),
    [profile],
  );

  const isDirty =
    form.fullName !== originalForm.fullName ||
    form.phoneNumber !== originalForm.phoneNumber ||
    form.email !== originalForm.email;

  const isSaving = updateProfileMutation.isPending;
  const isLoading = profileQuery.isLoading;

  const handleChange = (field: keyof ProfileFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleReset = () => {
    setForm(originalForm);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const fullName = form.fullName.trim();
    if (!fullName) {
      toast.error("Vui lòng nhập họ và tên");
      return;
    }

    updateProfileMutation.mutate({
      fullName,
      phoneNumber: form.phoneNumber.trim() || undefined,
      email: form.email.trim() || undefined,
    });
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <section className="rounded-2xl border border-[#E4EAF2] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0F5BD8]">
              Thiết lập tài khoản
            </p>
            <h1 className="mt-2 text-2xl font-extrabold text-[#0B2545]">
              Cấu hình cá nhân
            </h1>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Dữ liệu được đồng bộ theo tài khoản đang đăng nhập và lưu trực tiếp về hệ thống.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleReset}
              disabled={!isDirty || isSaving}
              className="h-10 rounded-xl border border-[#E4EAF2] bg-white px-4 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!isDirty || isSaving || isLoading}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#0F5BD8] px-4 text-xs font-bold text-white shadow-sm transition hover:bg-[#0B4BB8] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />}
              Lưu thay đổi
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <div className="rounded-2xl border border-[#E4EAF2] bg-white p-6 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-blue-50 bg-[#0F5BD8] text-2xl font-extrabold text-white shadow-sm">
                  {initials || "CB"}
                </div>
                <button
                  type="button"
                  aria-label="Đổi ảnh đại diện"
                  className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border border-[#E4EAF2] bg-white text-[#0F5BD8] shadow-sm transition hover:bg-blue-50"
                >
                  <Camera size={16} />
                </button>
              </div>
              <h2 className="mt-4 text-base font-extrabold text-[#0B2545]">{userName}</h2>
              <p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-400">
                {authorityUnitLabel}
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-[#0F5BD8]">
                <Shield size={14} />
                {roleLabel}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#E4EAF2] bg-white p-5 shadow-sm">
            <h3 className="text-sm font-extrabold text-[#0B2545]">Trạng thái tài khoản</h3>
            <div className="mt-4 space-y-3">
              <StatusRow
                label="Hồ sơ"
                value={profile?.active === false ? "Đang khóa" : "Đang hoạt động"}
                tone={profile?.active === false ? "slate" : "green"}
              />
              <StatusRow
                label="Bảo mật"
                value={profile?.mfaEnabled ? "Đã bật MFA" : "Chưa bật MFA"}
                tone={profile?.mfaEnabled ? "blue" : "slate"}
              />
              <StatusRow label="Đồng bộ" value={profileQuery.isFetching ? "Đang tải" : "Đã cập nhật"} tone="blue" />
            </div>
          </div>
        </aside>

        <div className="space-y-6">
          <div className="rounded-2xl border border-[#E4EAF2] bg-white shadow-sm">
            <div className="flex flex-wrap gap-2 border-b border-[#E4EAF2] px-5 py-4">
              {["Thông tin tài khoản", "Thông tin đơn vị", "Liên hệ", "Bảo mật", "Thông báo"].map(
                (tab, index) => (
                  <button
                    key={tab}
                    type="button"
                    className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
                      index === 0
                        ? "bg-[#0F5BD8] text-white shadow-sm"
                        : "text-slate-500 hover:bg-slate-50 hover:text-[#0B2545]"
                    }`}
                  >
                    {tab}
                  </button>
                ),
              )}
            </div>

            <div className="p-5 md:p-6">
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <ConfigField
                  icon={User}
                  label="Họ và tên"
                  value={form.fullName}
                  onChange={(value) => handleChange("fullName", value)}
                  loading={isLoading}
                />
                <ConfigField icon={IdCard} label="Tên đăng nhập" value={profile?.username || ""} readOnly />
                <ConfigField
                  icon={Mail}
                  label="Email công vụ"
                  value={form.email}
                  type="email"
                  onChange={(value) => handleChange("email", value)}
                  loading={isLoading}
                />
                <ConfigField
                  icon={Phone}
                  label="Số điện thoại"
                  value={form.phoneNumber}
                  type="tel"
                  onChange={(value) => handleChange("phoneNumber", value)}
                  loading={isLoading}
                />
                <ConfigField icon={Building2} label="Đơn vị công tác" value={authorityUnitLabel} readOnly />
                <ConfigField icon={UserCheck} label="Chức vụ / vai trò" value={roleLabel} readOnly />
                <ConfigField icon={MapPin} label="Phường / xã" value={wardName} readOnly />
                <ConfigField icon={Building2} label="Quận / huyện" value="Ngũ Hành Sơn" readOnly />
                <ConfigField
                  icon={MapPin}
                  label="Địa chỉ cơ quan"
                  value={`UBND ${wardName}, thành phố Đà Nẵng`}
                  className="lg:col-span-2"
                  readOnly
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ConfigPanel
              icon={LockKeyhole}
              title="Bảo mật"
              description="Các trạng thái bảo mật được đọc từ tài khoản hiện tại."
            >
              <ConfigField label="Mật khẩu" value="************" compact readOnly />
              <ConfigField
                label="Xác thực hai lớp"
                value={profile?.mfaEnabled ? "Đã kích hoạt" : "Chưa kích hoạt"}
                compact
                readOnly
              />
              <button
                type="button"
                className="mt-1 inline-flex h-9 items-center justify-center rounded-xl border border-[#E4EAF2] px-3 text-xs font-bold text-[#0F5BD8] transition hover:bg-blue-50"
              >
                Cập nhật bảo mật
              </button>
            </ConfigPanel>

            <ConfigPanel
              icon={BellRing}
              title="Thông báo"
              description="Cấu hình hiển thị cục bộ; dữ liệu thông báo vẫn lấy theo tài khoản đăng nhập."
            >
              <ToggleRow icon={Bell} label="Thông báo trên hệ thống" enabled />
              <ToggleRow icon={Mail} label="Thông báo qua email" enabled={Boolean(form.email)} />
              <ToggleRow icon={Smartphone} label="Thông báo qua SMS" enabled={Boolean(form.phoneNumber)} />
            </ConfigPanel>
          </div>

          <ConfigPanel
            icon={Languages}
            title="Ngôn ngữ và khu vực"
            description="Thiết lập hiển thị phù hợp với môi trường làm việc của đơn vị."
          >
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <ConfigField label="Ngôn ngữ" value="Tiếng Việt" compact readOnly />
              <ConfigField label="Múi giờ" value="Asia/Ho_Chi_Minh" compact readOnly />
            </div>
          </ConfigPanel>
        </div>
      </section>
    </form>
  );
}

function ConfigPanel({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#E4EAF2] bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#0F5BD8]">
          <Icon size={18} />
        </div>
        <div>
          <h3 className="text-sm font-extrabold text-[#0B2545]">{title}</h3>
          <p className="mt-1 text-xs font-medium leading-relaxed text-slate-500">{description}</p>
        </div>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function ConfigField({
  icon: Icon,
  label,
  value,
  type = "text",
  compact = false,
  readOnly = false,
  loading = false,
  className = "",
  onChange,
}: {
  icon?: LucideIcon;
  label: string;
  value: string;
  type?: string;
  compact?: boolean;
  readOnly?: boolean;
  loading?: boolean;
  className?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
        {label}
      </span>
      <div
        className={`flex items-center gap-3 rounded-xl border border-[#E4EAF2] bg-slate-50/70 px-3 ${
          compact ? "h-10" : "h-12"
        } ${readOnly ? "" : "focus-within:border-[#0F5BD8] focus-within:bg-white"}`}
      >
        {Icon && <Icon size={16} className="shrink-0 text-slate-400" />}
        {loading ? (
          <div className="h-3.5 w-28 animate-pulse rounded bg-slate-200" />
        ) : (
          <input
            type={type}
            value={value}
            readOnly={readOnly}
            onChange={(event) => onChange?.(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#0B2545] outline-none read-only:cursor-default"
          />
        )}
      </div>
    </label>
  );
}

function ToggleRow({
  icon: Icon,
  label,
  enabled = false,
}: {
  icon: LucideIcon;
  label: string;
  enabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-[#E4EAF2] bg-slate-50/70 px-3 py-2.5">
      <span className="flex items-center gap-2 text-xs font-bold text-slate-600">
        <Icon size={15} className="text-slate-400" />
        {label}
      </span>
      <span
        className={`relative h-5 w-9 rounded-full transition ${
          enabled ? "bg-[#0F5BD8]" : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${
            enabled ? "left-4" : "left-0.5"
          }`}
        />
      </span>
    </div>
  );
}

function StatusRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "green" | "blue" | "slate";
}) {
  const toneClass =
    tone === "green"
      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
      : tone === "blue"
        ? "bg-blue-50 text-blue-700 border-blue-100"
        : "bg-slate-50 text-slate-600 border-slate-200";

  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="font-semibold text-slate-500">{label}</span>
      <span className={`rounded-full border px-2.5 py-1 font-bold ${toneClass}`}>{value}</span>
    </div>
  );
}
