import { BellRing, ChevronRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function CityAnnouncements() {
  const announcements = [
    {
      id: 1,
      title: "Thông báo chủ động ứng phó với mưa dông, lốc, sét, mưa đá, lũ quét, gió mạnh trên biển",
      isUrgent: true,
      date: "01/08/2026",
    },
    {
      id: 2,
      title: "Thông báo tiếp nhận, giải quyết thủ tục hành chính về cấp, cấp lại, gia hạn, thu hồi giấy phép lao động",
      isUrgent: false,
      date: "31/07/2026",
    },
    {
      id: 3,
      title: "Công khai Danh sách đơn vị chậm đóng, trốn đóng BHXH, BHYT, BHTN tháng 6 năm 2026",
      isUrgent: false,
      date: "30/07/2026",
    },
    {
      id: 4,
      title: "Thông báo nhu cầu cần thuê xe thực hiện cắt tỉa cây xanh phục vụ công tác cắt tỉa cây xanh PCLB năm 2026",
      isUrgent: false,
      date: "28/07/2026",
    },
    {
      id: 5,
      title: "Thông báo và hướng dẫn thực hiện thủ tục giải thể doanh nghiệp",
      isUrgent: false,
      date: "25/07/2026",
    },
  ];

  return (
    <div className="bg-white border border-[#d9e2ec] rounded-xl overflow-hidden shadow-sm flex flex-col h-full">
      <div className="bg-[#cc0000] border-b border-[#a30000] p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BellRing className="text-white animate-pulse" size={20} />
          <h3 className="text-white font-bold font-heading text-lg uppercase tracking-wide">
            Thông báo
          </h3>
        </div>
      </div>
      
      <div className="p-0 flex-1 bg-white">
        <ul className="divide-y divide-[#e2e8f0]">
          {announcements.map((item) => (
            <li key={item.id} className="group p-4 hover:bg-[#fff9e6] transition-colors cursor-pointer flex gap-3 items-start">
              <ChevronRight className="text-[#cc0000] mt-0.5 flex-shrink-0" size={18} />
              <div>
                <Link to="#" className={`text-sm md:text-base font-medium leading-snug transition-colors line-clamp-2 mb-1 block ${item.isUrgent ? 'text-[#cc0000] group-hover:text-[#a30000] font-bold' : 'text-[#1e293b] group-hover:text-[#00387b]'}`}>
                  {item.title}
                  {item.isUrgent && <span className="ml-2 inline-block px-2 py-0.5 bg-red-100 text-[#cc0000] text-[10px] rounded-full uppercase tracking-wider animate-pulse font-bold">Khẩn</span>}
                </Link>
                <span className="text-xs text-slate-500 font-sans">{item.date}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
      
      <div className="p-3 border-t border-[#d9e2ec] bg-[#f8fafc] text-center">
        <Link to="#" className="text-sm font-semibold text-[#00387b] hover:underline">
          Xem tất cả »
        </Link>
      </div>
    </div>
  );
}
