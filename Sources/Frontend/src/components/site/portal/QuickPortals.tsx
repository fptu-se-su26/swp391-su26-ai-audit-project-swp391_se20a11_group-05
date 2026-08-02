import { Building2, Landmark, ShieldCheck } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function QuickPortals() {
  const portals = [
    {
      title: "CỔNG THÔNG TIN ĐIỆN TỬ CHÍNH PHỦ",
      icon: <Building2 size={36} className="text-[#cc0000]" />,
      link: "#",
    },
    {
      title: "CỔNG DỊCH VỤ CÔNG TRỰC TUYẾN",
      icon: <ShieldCheck size={36} className="text-[#cc0000]" />,
      link: "#",
    },
    {
      title: "CÔNG BÁO THÀNH PHỐ",
      icon: <Landmark size={36} className="text-[#cc0000]" />,
      link: "#",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mt-6">
      {portals.map((portal, idx) => (
        <Link
          key={idx}
          to={portal.link}
          className="group relative overflow-hidden bg-gradient-to-br from-white to-[#fff9e6] rounded-xl border border-[#e5d4a1] shadow-sm hover:shadow-md transition-all duration-300 p-6 flex flex-col items-center justify-center text-center h-32 md:h-40"
        >
          {/* Subtle background star pattern on hover */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-500 via-transparent to-transparent bg-[length:15px_15px]" />
          
          <div className="mb-3 transform group-hover:scale-110 transition-transform duration-300 drop-shadow-sm">
            {/* Using an emblem container */}
            <div className="relative">
              <div className="absolute inset-0 bg-yellow-200/50 rounded-full blur-md" />
              <div className="relative bg-white rounded-full p-2 border border-yellow-300 shadow-sm">
                 {portal.icon}
              </div>
            </div>
          </div>
          
          <h3 className="text-[#cc0000] font-bold font-heading text-sm md:text-base leading-snug group-hover:text-[#a30000] transition-colors relative z-10">
            {portal.title}
          </h3>
        </Link>
      ))}
    </div>
  );
}
