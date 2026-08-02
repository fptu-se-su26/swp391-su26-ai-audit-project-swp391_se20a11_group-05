import React from "react";

export function ActionBanner() {
  return (
    <div className="w-full relative overflow-hidden rounded shadow-sm border border-[#f0c14b]/30" style={{
      background: "linear-gradient(90deg, #fcd55c 0%, #f7a42b 40%, #e74c3c 100%)",
    }}>
      {/* Background wavy stripes pattern - simulated using repeating linear gradient */}
      <div 
        className="absolute inset-0 opacity-20 mix-blend-overlay"
        style={{
          background: "repeating-linear-gradient(-45deg, transparent, transparent 20px, rgba(255,0,0,0.3) 20px, rgba(255,0,0,0.3) 40px)"
        }}
      />
      
      <div className="relative z-10 px-4 py-3 md:py-6 flex flex-col md:flex-row items-center justify-start gap-4 md:gap-10 h-full min-h-[140px]">
        {/* Left Flags Group */}
        <div className="shrink-0 flex items-center justify-center relative w-[180px] h-[100px] md:ml-8 mt-2 md:mt-0">
          {/* We'll simulate the fluttering flag shape with SVGs */}
          {/* Communist Party Flag */}
          <div className="absolute left-0 top-2 transform -rotate-6 shadow-[0_4px_10px_rgba(0,0,0,0.3)] bg-[#DA251D] border-2 border-white rounded-sm w-[90px] h-[65px] flex items-center justify-center overflow-hidden" style={{ borderRadius: '4px 8px 12px 4px / 4px 12px 8px 4px' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="#FFFF00">
               {/* Hammer and Sickle simplified shape */}
               <path d="M14.5,10.2c-0.2,0.2-0.5,0.2-0.7,0C13.2,9.6,12.5,9.3,11.8,9.3C11,9.3,10.3,9.5,9.7,10c-1.3,1.1-1.6,3-0.7,4.4 c0.8,1.3,2.5,1.7,3.9,0.9c0.2-0.1,0.5-0.1,0.6,0.1c0.1,0.2,0.1,0.5-0.1,0.6c-1.7,1-3.9,0.5-5-1.1c-1.1-1.7-0.7-4,0.9-5.3 c0.9-0.7,2-1,3.1-1C13.4,8.5,14.3,8.9,15,9.5C15.2,9.7,15.2,10,14.5,10.2z"/>
               <path d="M12.9,13.2l-3-3C9.7,10,9.5,10,9.5,10.2l3,3C12.7,13.4,12.9,13.4,12.9,13.2z"/>
               <circle cx="12.3" cy="12.7" r="1" fill="#FFFF00"/>
            </svg>
          </div>
          {/* Vietnam Flag */}
          <div className="absolute right-0 bottom-1 transform rotate-6 z-10 shadow-[0_4px_10px_rgba(0,0,0,0.3)] bg-[#DA251D] border-2 border-white rounded-sm w-[95px] h-[70px] flex items-center justify-center overflow-hidden" style={{ borderRadius: '8px 4px 4px 12px / 12px 4px 4px 8px' }}>
            <svg width="46" height="46" viewBox="0 0 24 24" fill="#FFFF00">
              <polygon points="12,4 14.5,9.5 20.5,9.5 15.6,13.1 17.5,19 12,15.3 6.5,19 8.4,13.1 3.5,9.5 9.5,9.5" />
            </svg>
          </div>
        </div>

        {/* Text Group */}
        <div className="flex flex-col items-center justify-center flex-1 pr-4 md:pr-10">
          <h2 className="text-white text-center text-xl md:text-3xl lg:text-[2.2rem] font-bold font-sans uppercase leading-tight md:leading-snug tracking-wide"
              style={{
                textShadow: "2px 2px 0 #cc0000, -2px -2px 0 #cc0000, 2px -2px 0 #cc0000, -2px 2px 0 #cc0000, 0px 4px 10px rgba(0,0,0,0.3)"
              }}>
            THỐNG NHẤT HÀNH ĐỘNG VÌ THÀNH PHỐ ĐÀ NẴNG
          </h2>
          <h2 className="text-white text-center text-xl md:text-3xl lg:text-[2.2rem] font-bold font-sans uppercase leading-tight md:leading-snug tracking-wide"
              style={{
                textShadow: "2px 2px 0 #cc0000, -2px -2px 0 #cc0000, 2px -2px 0 #cc0000, -2px 2px 0 #cc0000, 0px 4px 10px rgba(0,0,0,0.3)"
              }}>
            HIỆN ĐẠI, ĐÁNG SỐNG VÀ GIÀU BẢN SẮC
          </h2>
        </div>
      </div>
    </div>
  );
}
