import { PartyPopper } from "lucide-react";

export function CityBanner() {
  return (
    <div className="w-full bg-gradient-to-r from-[#cc0000] via-[#e60000] to-[#cc0000] overflow-hidden relative shadow-md mt-6 rounded-xl border-2 border-yellow-500/20">
      {/* Background patterns */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-300 via-transparent to-transparent bg-[length:20px_20px]" />
      
      <div className="relative z-10 px-4 md:px-8 py-5 md:py-8 flex flex-col items-center justify-center text-center max-w-[1200px] mx-auto gap-4">
        {/* Emblem placeholder / Icon */}
        <div className="text-[#ffed4a] mb-2 drop-shadow-md">
          <svg width="60" height="60" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l2.4 7.4h7.6l-6.2 4.5 2.4 7.4-6.2-4.5-6.2 4.5 2.4-7.4-6.2-4.5h7.6z" />
          </svg>
        </div>

        <div>
          <h2 className="text-[#ffed4a] text-xl md:text-3xl lg:text-4xl font-bold font-heading uppercase tracking-wide drop-shadow-sm mb-2">
            Nghiên cứu, học tập, quán triệt, tuyên truyền
          </h2>
          <h2 className="text-white text-lg md:text-2xl lg:text-3xl font-bold font-heading uppercase tracking-wide drop-shadow-sm">
            Và triển khai thực hiện nghị quyết đại hội XIV của Đảng
          </h2>
        </div>

        <div className="mt-2 inline-block">
          <span className="text-[#ffed4a] text-lg md:text-2xl font-bold font-heading italic px-4 py-1 border-t border-b border-[#ffed4a]/50">
            "Hiểu sâu — Hành động đúng — Làm đến cùng"
          </span>
        </div>
      </div>
    </div>
  );
}
