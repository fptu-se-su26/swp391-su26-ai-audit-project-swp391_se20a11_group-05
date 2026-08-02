import React from "react";
import { Link } from "@tanstack/react-router";

export function FourColumnInfo() {
  const columns = [
    {
      id: "ktxh",
      title: "KINH TẾ - XÃ HỘI",
      headerBg: "bg-[#5b877a]", // Greenish
      items: [
        "Tình hình phát triển kinh tế - xã hội, quốc phòng - an ninh 6 tháng đầu năm, nhiệm vụ 6 tháng cuối năm 2026 thành phố Đà Nẵng",
        "Công tác chỉ đạo, điều hành của UBND thành phố và tình hình kinh tế - xã hội tháng 5 năm 2026",
        "Tình hình, kết quả nổi bật về phát triển kinh tế - xã hội tháng 4 năm 2026",
      ]
    },
    {
      id: "kgdt",
      title: "KÊU GỌI ĐẦU TƯ",
      headerBg: "bg-[#c5a859]", // Gold
      items: [
        "Thông báo tiếp nhận Hồ sơ đề nghị chấp thuận chủ trương đầu tư đồng thời với chấp thuận nhà đầu tư dự án Nhà máy xử lý rác thải và phát điện, khu xử lý chất thải rắn Nam Quảng Nam tại xã Núi Thành, thành phố Đà Nẵng",
        "Dự án đầu tư hạ tầng kỹ thuật Cụm công nghiệp Bình An tại xã Đồng",
      ]
    },
    {
      id: "dtms",
      title: "ĐẤU THẦU, MUA SẮM CÔNG",
      headerBg: "bg-[#507d9f]", // Blue
      items: [
        "Công khai tham gia tư vấn khảo sát, lập Báo cáo Kinh tế kỹ thuật dự án Triển khai Bãi xe thông minh tại Nhà làm việc các Ban Quản lý dự án và các đơn vị sự nghiệp trực thuộc và Bãi xe phía Tây Tòa nhà Trung tâm Hành chính thành phố",
        "Thông báo mời gửi báo giá dự toán mua sắm Kệ sắt phục vụ công tác lưu trữ",
      ]
    },
    {
      id: "khcn",
      title: "KHOA HỌC - CÔNG NGHỆ",
      headerBg: "bg-[#9a4b44]", // Red/Brown
      items: [
        "Giao quyền sở hữu đề tài cấp thành phố \"Di thực một số loại tre, trúc phục vụ cho Công viên văn hoá chuyên đề Tre Việt\"",
        "Đánh giá thực trạng nhu cầu sử dụng và hiệu quả của hệ thống chăm sóc sức khoẻ từ xa trong quản lý, điều trị và chăm sóc người bệnh tâm thần phân liệt tại tuyến y tế cơ sở",
      ]
    }
  ];

  // Skyline SVG as a data URI for background
  const skylineSvg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1000 100' preserveAspectRatio='none'%3E%3Cpath fill='%23a1aab6' opacity='0.7' d='M0,100 L0,80 L20,80 L20,60 L40,60 L40,75 L60,75 L60,50 L80,50 L80,70 L95,70 L95,45 L115,45 L115,80 L130,80 L130,55 L150,55 L150,85 L180,85 L180,65 L200,65 L200,40 L230,40 L230,70 L250,70 L250,30 L280,30 L280,60 L300,60 L300,80 L330,80 L330,45 L360,45 L360,75 L380,75 L380,50 L410,50 L410,85 L440,85 L440,60 L460,60 L460,35 L490,35 L490,70 L510,70 L510,55 L540,55 L540,80 L570,80 L570,45 L600,45 L600,75 L630,75 L630,40 L650,40 L650,65 L680,65 L680,30 L710,30 L710,70 L730,70 L730,50 L760,50 L760,85 L790,85 L790,60 L810,60 L810,40 L840,40 L840,75 L860,75 L860,55 L890,55 L890,80 L920,80 L920,45 L950,45 L950,70 L970,70 L970,50 L1000,50 L1000,100 Z'/%3E%3C/svg%3E")`;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[2px] mt-2 bg-[#d1d5db] border border-[#d1d5db]">
      {columns.map((col) => (
        <div key={col.id} className="bg-white flex flex-col h-full min-h-[350px] relative">
          {/* Header */}
          <div className={`${col.headerBg} p-3 text-center flex items-center justify-center relative overflow-hidden min-h-[48px]`}>
             {/* Subtle overlay pattern on header */}
             <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent bg-[length:10px_10px]" />
             <h3 className="text-white font-bold font-sans text-sm md:text-base uppercase tracking-wider relative z-10">
               {col.title}
             </h3>
          </div>
          
          {/* Content List */}
          <div className="p-4 flex-1 pb-16 z-10 relative">
            <ul className="space-y-4">
              {col.items.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 group">
                  <div className="mt-1.5 w-1.5 h-1.5 bg-[#0B4FC4] shrink-0" /> {/* Blue square bullet */}
                  <Link to="#" className="text-[#334155] text-[13px] md:text-sm font-medium leading-relaxed group-hover:text-[#0B4FC4] transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Skyline Bottom Background */}
          <div 
            className="absolute bottom-0 left-0 w-full h-[60px] bg-repeat-x bg-bottom z-0"
            style={{ 
              backgroundImage: skylineSvg,
              backgroundSize: '300px 100%'
            }}
          />
        </div>
      ))}
    </div>
  );
}
