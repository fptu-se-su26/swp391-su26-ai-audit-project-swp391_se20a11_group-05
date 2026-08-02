import { FileText, CalendarClock } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function DirectivesAndSchedule() {
  const directives = [
    {
      id: 1,
      title: "Chỉ đạo, điều hành nổi bật của UBND, Chủ tịch và các Phó Chủ tịch UBND thành phố tháng 07-2026",
      date: "01/08/2026",
    },
    {
      id: 2,
      title: "Chỉ đạo, điều hành nổi bật của UBND, Chủ tịch và các Phó Chủ tịch UBND thành phố từ ngày 27-7 đến ngày 31-7",
      date: "31/07/2026",
    },
    {
      id: 3,
      title: "Thành lập Ban tổ chức Cuộc thi khởi nghiệp đổi mới sáng tạo thành phố Đà Nẵng - SURF 2026",
      date: "28/07/2026",
    },
  ];

  const schedules = [
    {
      id: 1,
      title: "Lịch công tác tuần 31 năm 2026 của Lãnh đạo UBND thành phố",
      time: "07:38 | 27/07/2026",
    },
    {
      id: 2,
      title: "Lịch công tác tuần 30 năm 2026 của Lãnh đạo UBND thành phố",
      time: "07:43 | 20/07/2026",
    },
    {
      id: 3,
      title: "Lịch công tác tuần 29 năm 2026 của Lãnh đạo UBND thành phố",
      time: "07:30 | 13/07/2026",
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      {/* Left Column - Directives */}
      <div className="bg-[#fcfdfa] border border-[#d9e2ec] rounded-xl overflow-hidden shadow-sm flex flex-col">
        <div className="bg-[#eef2f6] border-b border-[#d9e2ec] p-4 flex items-center gap-2">
          <FileText className="text-[#00387b]" size={20} />
          <h3 className="text-[#00387b] font-bold font-heading text-lg uppercase tracking-wide">
            Chỉ đạo, điều hành của UBND
          </h3>
        </div>
        
        <div className="p-0 flex-1 bg-gradient-to-b from-[#f9f5f0] to-transparent opacity-95">
          <ul className="divide-y divide-[#e2e8f0]/50">
            {directives.map((item, idx) => (
              <li key={item.id} className={`group flex gap-4 p-4 hover:bg-white transition-colors cursor-pointer ${idx % 2 === 0 ? 'bg-[#f4ebe1]/30' : 'bg-transparent'}`}>
                <div className="mt-1">
                   <div className="bg-slate-200 p-2 rounded text-slate-500">
                     <FileText size={16} />
                   </div>
                </div>
                <div>
                  <Link to="#" className="text-[#1e293b] text-sm md:text-base font-medium group-hover:text-[#00387b] leading-snug transition-colors line-clamp-2">
                    {item.title}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="p-3 border-t border-[#d9e2ec] bg-white text-center">
          <Link to="#" className="text-sm font-semibold text-[#00387b] hover:underline">
            Xem tất cả »
          </Link>
        </div>
      </div>

      {/* Right Column - Schedule */}
      <div className="bg-white border border-[#d9e2ec] rounded-xl overflow-hidden shadow-sm flex flex-col">
        <div className="bg-[#eef2f6] border-b border-[#d9e2ec] p-4 flex items-center gap-2">
          <CalendarClock className="text-[#00387b]" size={20} />
          <h3 className="text-[#00387b] font-bold font-heading text-lg uppercase tracking-wide">
            Lịch làm việc
          </h3>
        </div>
        
        <div className="p-0 flex-1">
          <ul className="divide-y divide-[#e2e8f0]">
            {schedules.map((item) => (
              <li key={item.id} className="group flex gap-4 p-4 hover:bg-[#f8fafc] transition-colors cursor-pointer">
                <div className="mt-1.5 flex-shrink-0">
                   <div className="w-2 h-2 rounded-full bg-[#00387b] ring-4 ring-[#e0e7ff]" />
                </div>
                <div>
                  <Link to="#" className="text-[#1e293b] text-sm md:text-base font-medium group-hover:text-[#00387b] leading-snug transition-colors line-clamp-2 block mb-1">
                    {item.title}
                  </Link>
                  <span className="text-xs text-slate-500 font-sans">{item.time}</span>
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
    </div>
  );
}
