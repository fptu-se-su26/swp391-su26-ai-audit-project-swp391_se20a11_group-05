import { useMemo } from "react";
import type { AuthUser } from "@/lib/auth";
import { Role } from "@/lib/roles";
import { userApi, wardApi, type UserProfile } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  IdCard,
  Mail,
  MapPin,
  Phone,
  Shield,
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

export function WardProfileConfigPage({
  user,
  authorityUnitName,
  authorityUnitLabel,
  onProfileUpdated,
}: WardProfileConfigPageProps) {
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
  const isLoading = profileQuery.isLoading;

  const wardName = useMemo(() => {
    const wardId = profile?.wardId ?? user?.wardId;
    const wardFromList = wardsQuery.data?.find((ward) => ward.id === wardId);
    return profile?.wardName || wardFromList?.name || user?.wardName || authorityUnitName;
  }, [authorityUnitName, profile, user, wardsQuery.data]);

  const userName = profile?.fullName || user?.name || "Cán bộ phường";
  const role = profile?.role || user?.role;
  const roleLabel = role === Role.WARD_STAFF ? "Cán bộ phường" : "Cán bộ đơn vị";
  const initials = userName
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 font-mono">
              Thiết lập tài khoản
            </p>
            <h1 className="mt-2 text-2xl font-extrabold text-slate-800 tracking-tight">
              Cấu hình cá nhân
            </h1>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Dữ liệu được đồng bộ theo tài khoản đang đăng nhập và lưu trực tiếp về hệ thống.
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-indigo-50/50 bg-indigo-600 text-2xl font-extrabold text-white shadow-sm">
                  {initials || "CB"}
                </div>
              </div>
              <h2 className="mt-4 text-base font-extrabold text-slate-800">{userName}</h2>
              <p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-400">
                {authorityUnitLabel}
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50/50 px-3 py-1 text-xs font-bold text-indigo-700">
                <Shield size={14} />
                {roleLabel}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-extrabold text-slate-800">Trạng thái tài khoản</h3>
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
              <StatusRow
                label="Đồng bộ"
                value={profileQuery.isFetching ? "Đang tải" : "Đã cập nhật"}
                tone="blue"
              />
            </div>
          </div>
        </aside>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
            <div className="p-5 md:p-6">
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <ConfigField
                  icon={User}
                  label="Họ và tên"
                  value={profile?.fullName || ""}
                  readOnly
                  loading={isLoading}
                />
                <ConfigField
                  icon={IdCard}
                  label="Tên đăng nhập"
                  value={profile?.username || ""}
                  readOnly
                />
                <ConfigField
                  icon={Mail}
                  label="Email công vụ"
                  value={profile?.email || ""}
                  type="email"
                  readOnly
                  loading={isLoading}
                />
                <ConfigField
                  icon={Phone}
                  label="Số điện thoại"
                  value={profile?.phoneNumber || ""}
                  type="tel"
                  readOnly
                  loading={isLoading}
                />
                <ConfigField
                  icon={Building2}
                  label="Đơn vị công tác"
                  value={authorityUnitLabel}
                  readOnly
                />
                <ConfigField
                  icon={UserCheck}
                  label="Chức vụ / vai trò"
                  value={roleLabel}
                  readOnly
                />
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
        </div>
      </section>
    </div>
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
    <label className={`block group ${className}`}>
      <span className="mb-2 block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 group-focus-within:text-[#0F5BD8] transition-colors">
        {label}
      </span>
      <div
        className={`flex items-center gap-3 rounded-xl border border-[#E4EAF2] bg-slate-50/70 px-3 transition-all duration-200 ${
          compact ? "h-10" : "h-12"
        } ${
          readOnly
            ? "opacity-80"
            : "hover:bg-white hover:border-slate-300 focus-within:border-[#0F5BD8] focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(15,91,216,0.1)]"
        }`}
      >
        {Icon && (
          <Icon
            size={16}
            className={`shrink-0 transition-colors ${
              readOnly
                ? "text-slate-400"
                : "text-slate-400 group-focus-within:text-[#0F5BD8]"
            }`}
          />
        )}
        {loading ? (
          <div className="h-3.5 w-28 animate-pulse rounded bg-slate-200" />
        ) : (
          <input
            type={type}
            value={value}
            readOnly={readOnly}
            onChange={(event) => onChange?.(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#0B2545] outline-none read-only:cursor-default placeholder:text-slate-400"
          />
        )}
      </div>
    </label>
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
      ? "bg-emerald-50/50 text-emerald-700 border-emerald-100"
      : tone === "blue"
        ? "bg-indigo-50/50 text-indigo-700 border-indigo-100"
        : "bg-slate-50 text-slate-600 border-slate-200";

  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="font-semibold text-slate-500">{label}</span>
      <span
        className={`rounded-lg border px-2.5 py-0.5 font-bold uppercase tracking-wider text-[10px] ${toneClass}`}
      >
        {value}
      </span>
    </div>
  );
}
