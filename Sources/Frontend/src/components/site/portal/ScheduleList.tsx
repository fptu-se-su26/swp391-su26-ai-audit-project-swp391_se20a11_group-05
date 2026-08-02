import React from "react";
import { CalendarClock } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function ScheduleList() {
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
    {
      id: 4,
      title: "Lịch công tác tuần 28 năm 2026 của Lãnh đạo UBND thành phố",
      time: "07:50 | 06/07/2026",
    },
    {
      id: 5,
      title: "Lịch công tác tuần 27 năm 2026 của Lãnh đạo UBND thành phố",
      time: "07:23 | 29/06/2026",
    },
  ];

  return (
    <div className="bg-white border border-[#0B4FC4] rounded-xl overflow-hidden shadow-sm flex flex-col h-full mt-6">
      <div className="bg-white p-4 flex items-center justify-center border-b border-[#E4EAF2]">
        <h3 className="text-[#0B4FC4] font-bold font-sans text-xl uppercase tracking-wide">
          Lịch làm việc
        </h3>
      </div>
      
      <div className="p-0 flex-1">
        <ul className="divide-y divide-[#e2e8f0]">
          {schedules.map((item) => (
            <li key={item.id} className="group flex gap-3 p-4 hover:bg-[#f8fafc] transition-colors cursor-pointer">
              <div className="mt-1.5 flex-shrink-0">
                 <div className="w-4 h-4 rounded-full border-[3px] border-[#0B4FC4] flex items-center justify-center">
                    <div className="w-1 h-1 rounded-full bg-[#0B4FC4]" />
                 </div>
              </div>
              <div>
                <Link to="#" className="text-[#1e293b] text-[15px] font-bold group-hover:text-[#0B4FC4] leading-snug transition-colors line-clamp-2 block mb-1 font-sans">
                  {item.title}
                </Link>
                <span className="text-xs text-slate-500 font-sans">{item.time}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
