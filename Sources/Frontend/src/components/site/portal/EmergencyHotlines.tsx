import { PhoneCall, ShieldAlert, Flame, Stethoscope, Headset } from "lucide-react";

export function EmergencyHotlines() {
  const hotlines = [
    {
      id: 1,
      name: "Cảnh sát (An ninh trật tự)",
      number: "113",
      icon: <ShieldAlert className="text-[#00387b]" size={28} />,
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      textColor: "text-[#00387b]",
    },
    {
      id: 2,
      name: "Cứu hỏa (Phòng cháy chữa cháy)",
      number: "114",
      icon: <Flame className="text-[#cc0000]" size={28} />,
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      textColor: "text-[#cc0000]",
    },
    {
      id: 3,
      name: "Cấp cứu y tế",
      number: "115",
      icon: <Stethoscope className="text-emerald-700" size={28} />,
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      textColor: "text-emerald-700",
    },
    {
      id: 4,
      name: "Tổng đài Dịch vụ công (Phản ánh)",
      number: "1022",
      icon: <Headset className="text-[#d4af37]" size={28} />,
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      textColor: "text-[#b08d20]",
    },
  ];

  return (
    <section className="bg-white rounded-2xl border border-[#E4EAF2] p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-1.5 h-6 bg-[#cc0000] rounded-sm" />
        <h2 className="text-[#cc0000] font-bold text-lg md:text-xl font-heading uppercase tracking-wide">
          Đường dây nóng khẩn cấp
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {hotlines.map((hotline) => (
          <a
            key={hotline.id}
            href={`tel:${hotline.number}`}
            className={`flex items-center gap-4 p-4 rounded-xl border ${hotline.bgColor} ${hotline.borderColor} hover:shadow-md transition-shadow group`}
          >
            <div className="flex-shrink-0 bg-white p-3 rounded-full shadow-sm group-hover:scale-110 transition-transform">
              {hotline.icon}
            </div>
            <div>
              <div className={`text-2xl font-bold font-heading ${hotline.textColor}`}>
                {hotline.number}
              </div>
              <div className="text-xs md:text-sm text-slate-600 font-medium">
                {hotline.name}
              </div>
            </div>
            
            <div className={`ml-auto opacity-0 group-hover:opacity-100 transition-opacity ${hotline.textColor}`}>
              <PhoneCall size={20} className="animate-pulse" />
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
