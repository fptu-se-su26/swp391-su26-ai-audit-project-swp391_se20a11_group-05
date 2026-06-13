import { Link, useRouterState } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { ROLE_LABEL, Role } from "@/lib/roles";
import { Menu, X, LogOut, Bell, User, ChevronDown } from "lucide-react";
import { useState } from "react";
import logoUrl from "@/assets/logo.png";

export function Header() {
  const { locale, setLocale, t } = useI18n();
  const { user, logout, hasRole } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  // Core citizen menu items from Image 1
  const menuItems = [
    { to: "/", label: "Trang chủ" },
    { to: "/my-reports", label: "Phản ánh của tôi" },
    { to: "/my-reports", label: "Tra cứu" },
    { to: "/notifications", label: "Thông báo" },
    { to: "/my-reports", label: "Hướng dẫn" },
    { to: "/", label: "Về chúng tôi" },
  ];

  const staffItemsAll = [
    { to: "/ward",       label: t("nav.ward"),      roles: [Role.WARD_STAFF, Role.SUPER_ADMIN] as const },
    { to: "/police",     label: t("nav.police"),    roles: [Role.POLICE, Role.SUPER_ADMIN] as const },
    { to: "/city-admin", label: t("nav.cityAdmin"), roles: [Role.SUPER_ADMIN] as const },
  ];
  const staffItems = staffItemsAll.filter((i) => hasRole(...i.roles));

  // Determine active item based on pathname and label
  const isItemActive = (item: typeof menuItems[0]) => {
    if (typeof window === "undefined") {
      if (item.label === "Trang chủ") return path === "/";
      if (item.label === "Phản ánh của tôi") return path === "/my-reports";
      return false;
    }
    const searchString = window.location.search;
    if (item.label === "Trang chủ") return path === "/";
    if (item.label === "Phản ánh của tôi") return path === "/my-reports" && !searchString.includes("q=");
    if (item.label === "Tra cứu") return path === "/my-reports" && searchString.includes("q=");
    if (item.label === "Thông báo") return path === "/notifications";
    return false;
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#E4EAF2] shadow-sm">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 h-[76px] flex items-center justify-between">
        
        {/* Left: Brand logo & text */}
        <Link to="/" className="flex items-center gap-2.5 group shrink-0">
          <img src={logoUrl} alt="Đà Nẵng Kết Nối" className="h-10 w-auto object-contain" />
          <div className="flex flex-col leading-none">
            <span className="text-base font-extrabold tracking-tight text-[#0B4FC4] uppercase font-sans">
              ĐÀ NẴNG KẾT NỐI
            </span>
            <span className="text-[9px] text-[#667085] font-bold uppercase tracking-wider mt-0.5 font-sans">
              CỔNG THÔNG TIN PHẢN ÁNH HIỆN TRƯỜNG
            </span>
          </div>
        </Link>

        {/* Center: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2 h-full" aria-label="Main">
          <ul className="flex items-center gap-5 xl:gap-7 h-full">
            {menuItems.map((item, index) => {
              const active = isItemActive(item);
              return (
                <li key={index} className="h-full flex items-center">
                  <Link
                    to={item.to as any}
                    className={`relative py-2 text-sm font-semibold transition-all font-sans ${
                      active 
                        ? "text-[#0B4FC4] border-b-2 border-[#0B4FC4] pt-2" 
                        : "text-[#123E8A] hover:text-[#0B4FC4]"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
            
            {/* Staff access links if user is authority */}
            {staffItems.map((item, index) => (
              <li key={`staff-${index}`} className="h-full flex items-center">
                <Link
                  to={item.to as any}
                  className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded text-xs font-bold border border-amber-200 hover:bg-amber-100 transition font-sans"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Right: Controls & Account */}
        <div className="hidden md:flex items-center gap-4 lg:gap-6">
          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center gap-1.5 text-sm font-semibold text-[#123E8A] hover:text-[#0B4FC4] transition min-h-[40px] px-2"
              aria-label="Select Language"
              aria-expanded={langOpen}
            >
              <span className="text-base">🇻🇳</span>
              <span className="font-sans">VI</span>
              <ChevronDown size={14} className="text-[#667085]" />
            </button>
            
            {langOpen && (
              <div className="absolute right-0 mt-1 w-28 bg-white border border-[#E4EAF2] rounded-lg shadow-lg py-1 z-50">
                <button
                  onClick={() => { setLocale("vi"); setLangOpen(false); }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-[#123E8A] hover:bg-slate-50 transition flex items-center gap-2 font-sans"
                >
                  <span>🇻🇳</span> Tiếng Việt
                </button>
                <button
                  onClick={() => { setLocale("en"); setLangOpen(false); }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-[#123E8A] hover:bg-slate-50 transition flex items-center gap-2 font-sans"
                >
                  <span>🇬🇧</span> English
                </button>
              </div>
            )}
          </div>

          {/* Notification bell */}
          <Link
            to="/notifications"
            className="relative p-2 text-[#123E8A] hover:text-[#0B4FC4] transition rounded-full hover:bg-slate-50"
            aria-label="Notifications"
          >
            <Bell size={20} />
            <span className="absolute top-0 right-0 w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border border-white font-sans">
              3
            </span>
          </Link>

          {/* Authentication Action */}
          {user ? (
            <div className="flex items-center gap-3 border-l border-[#E4EAF2] pl-4 lg:pl-6">
              <div className="text-right leading-tight">
                <div className="text-sm font-bold text-[#123E8A] font-sans">{user.name}</div>
                <div className="text-[10px] uppercase tracking-widest text-[#667085] font-extrabold font-sans">
                  {ROLE_LABEL[user.role][locale]}
                </div>
              </div>
              <button
                onClick={logout}
                className="p-2 text-slate-400 hover:text-red-500 rounded-md border border-[#E4EAF2] hover:bg-red-50/50 transition"
                aria-label="Đăng xuất"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="px-4 py-2 bg-[#0B4FC4] text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition flex items-center gap-2 shadow-sm font-sans"
            >
              <User size={16} />
              Đăng nhập / Đăng ký
            </Link>
          )}
        </div>

        {/* Mobile menu trigger */}
        <button
          className="lg:hidden min-w-[44px] min-h-[44px] grid place-items-center text-[#123E8A] hover:text-[#0B4FC4]"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
          aria-expanded={open}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>

      </div>

      {/* Mobile Menu */}
      {open && (
        <nav className="lg:hidden bg-white border-t border-[#E4EAF2] py-4 px-4 space-y-1 animate-fade-in" aria-label="Mobile">
          {menuItems.map((item, index) => (
            <Link
              key={index}
              to={item.to as any}
              onClick={() => setOpen(false)}
              className={`block min-h-[48px] px-4 py-3 rounded-md font-semibold transition-all font-sans ${
                path === item.to ? "bg-[#F5F9FF] text-[#0B4FC4]" : "text-[#123E8A] hover:bg-slate-50"
              }`}
            >
              {item.label}
            </Link>
          ))}
          
          {staffItems.length > 0 && (
            <>
              <div className="pt-2 pb-1 px-4 text-[10px] uppercase tracking-widest text-[#667085] font-extrabold font-sans">
                Khu vực cán bộ
              </div>
              {staffItems.map((item, index) => (
                <Link
                  key={`mobile-staff-${index}`}
                  to={item.to as any}
                  onClick={() => setOpen(false)}
                  className="block min-h-[48px] px-4 py-3 rounded-md text-amber-700 bg-amber-50 border border-amber-100 font-bold font-sans"
                >
                  {item.label}
                </Link>
              ))}
            </>
          )}
          
          {/* Mobile Utility Actions */}
          <div className="pt-3 mt-3 border-t border-[#E4EAF2] flex flex-col gap-3">
            <div className="flex items-center justify-between px-4">
              <span className="text-sm font-semibold text-[#123E8A] font-sans">Ngôn ngữ / Language:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => { setLocale("vi"); setOpen(false); }}
                  className={`px-3 py-1 rounded text-xs font-bold border ${locale === "vi" ? "bg-[#0B4FC4] text-white border-[#0B4FC4]" : "border-[#E4EAF2] text-[#123E8A]"}`}
                >
                  VI
                </button>
                <button
                  onClick={() => { setLocale("en"); setOpen(false); }}
                  className={`px-3 py-1 rounded text-xs font-bold border ${locale === "en" ? "bg-[#0B4FC4] text-white border-[#0B4FC4]" : "border-[#E4EAF2] text-[#123E8A]"}`}
                >
                  EN
                </button>
              </div>
            </div>

            {user ? (
              <button
                onClick={() => { logout(); setOpen(false); }}
                className="w-full text-left min-h-[48px] px-4 py-3 rounded-md hover:bg-red-50 text-red-600 font-semibold inline-flex items-center gap-2 transition-all font-sans"
              >
                <LogOut size={18} /> Đăng xuất ({user.name})
              </button>
            ) : (
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="block min-h-[48px] px-4 py-3 rounded-lg bg-[#0B4FC4] text-white font-bold text-center font-sans"
              >
                Đăng nhập / Đăng ký
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
