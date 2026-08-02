import { BarChart3, TrendingUp } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function SocioEconomicReports() {
  const reports = [
    {
      id: 1,
      title: "Tình hình phát triển kinh tế - xã hội, quốc phòng - an ninh 6 tháng đầu năm, nhiệm vụ 6 tháng cuối năm 2026",
      date: "05/07/2026",
    },
    {
      id: 2,
      title: "Công tác chỉ đạo, điều hành của UBND thành phố và tình hình kinh tế - xã hội tháng 5 năm 2026",
      date: "02/06/2026",
    },
    {
      id: 3,
      title: "Tình hình phát triển kinh tế - xã hội, quốc phòng - an ninh quý I, nhiệm vụ trọng tâm quý II",
      date: "10/04/2026",
    },
    {
      id: 4,
      title: "Báo cáo tình hình, kết quả nổi bật về công tác phát triển kinh tế, văn hóa, xã hội tháng 02 năm 2026",
      date: "05/03/2026",
    },
    {
      id: 5,
      title: "Báo cáo công tác chỉ đạo, điều hành của UBND thành phố và tình hình kinh tế - xã hội tháng 01 năm 2026",
      date: "06/02/2026",
    },
  ];

  return (
    <div className="bg-white border border-[#d9e2ec] rounded-xl overflow-hidden shadow-sm flex flex-col h-full">
      <div className="bg-[#00387b] border-b border-[#001f46] p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="text-white" size={20} />
          <h3 className="text-white font-bold font-heading text-lg uppercase tracking-wide">
            Kinh tế - Xã hội
          </h3>
        </div>
      </div>
      
      <div className="p-0 flex-1 bg-white">
        <ul className="divide-y divide-[#e2e8f0]">
          {reports.map((item) => (
            <li key={item.id} className="group p-4 hover:bg-[#f0f7ff] transition-colors cursor-pointer flex gap-3 items-start">
              <TrendingUp className="text-[#00387b] mt-0.5 flex-shrink-0" size={16} />
              <div>
                <Link to="#" className="text-[#1e293b] text-sm md:text-base font-medium group-hover:text-[#00387b] leading-snug transition-colors line-clamp-2 mb-1 block">
                  {item.title}
                </Link>
                <span className="text-xs text-slate-500 font-sans">{item.date}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
      
      <div className="p-3 border-t border-[#d9e2ec] bg-[#f8fafc] text-center">
        <Link to="#" className="text-sm font-semibold text-[#00387b] hover:underline">
          Xem tất cả báo cáo »
        </Link>
      </div>
    </div>
  );
}
