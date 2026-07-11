import React, { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { PieChart as PieIcon, MapPin, TrendingUp, AlertCircle, Filter, Calendar } from 'lucide-react';

const PIE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];

export function PoliceStatisticalReports({ feedbacks }: { feedbacks: any[] }) {
  const [timeRange, setTimeRange] = useState('ALL'); // 'ALL', '30', '7'

  // Lọc dữ liệu theo thời gian
  const filteredFeedbacks = useMemo(() => {
    if (!feedbacks) return [];
    if (timeRange === 'ALL') return feedbacks;
    
    const now = new Date();
    const daysToSubtract = parseInt(timeRange);
    const thresholdDate = new Date(now.getTime() - daysToSubtract * 24 * 60 * 60 * 1000);
    
    return feedbacks.filter(f => new Date(f.createdAt) >= thresholdDate);
  }, [feedbacks, timeRange]);

  // 1. Phân tích loại vấn đề
  const categoryStats = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredFeedbacks.forEach(f => {
      const cat = f.categoryName || 'Khác';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredFeedbacks]);

  // 2. Phân tích khu vực (địa chỉ)
  const areaStats = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredFeedbacks.forEach(f => {
      const address = f.addressDetails || 'Chưa xác định';
      let area = address.split(',')[0].trim();
      if (area.length > 25) {
        area = area.substring(0, 25) + '...';
      }
      counts[area] = (counts[area] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 7); // Top 7 for better spacing
  }, [filteredFeedbacks]);

  // 3. Phân tích xu hướng theo thời gian (Line/Area Chart)
  const trendStats = useMemo(() => {
    if (filteredFeedbacks.length === 0) {
      // Fake data just to show an empty chart if no data
      return [
        { date: 'N/A', value: 0 },
        { date: 'N/A ', value: 0 }
      ];
    }

    const counts: Record<string, number> = {};
    let minTime = new Date().getTime();
    let maxTime = new Date().getTime();

    filteredFeedbacks.forEach(f => {
      const d = new Date(f.createdAt);
      const t = d.getTime();
      if (t < minTime) minTime = t;
      
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      counts[key] = (counts[key] || 0) + 1;
    });

    const result = [];
    let startD = new Date(minTime);
    startD.setHours(0,0,0,0);
    const endD = new Date(maxTime);
    endD.setHours(0,0,0,0);
    
    // Đảm bảo luôn có ít nhất 4 ngày (3 ngày trước + hôm nay) để biểu đồ vẽ thành đường Area
    if (endD.getTime() - startD.getTime() < 3 * 24 * 60 * 60 * 1000) {
       startD = new Date(endD.getTime() - 3 * 24 * 60 * 60 * 1000);
    }
    
    // Giới hạn tối đa 30 ngày để biểu đồ không bị quá dày
    if (endD.getTime() - startD.getTime() > 30 * 24 * 60 * 60 * 1000) {
       startD = new Date(endD.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    let curr = new Date(startD);
    while (curr <= endD) {
      const key = `${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, '0')}-${String(curr.getDate()).padStart(2, '0')}`;
      const displayDate = `${String(curr.getDate()).padStart(2, '0')}/${String(curr.getMonth() + 1).padStart(2, '0')}`;
      result.push({ date: displayDate, value: counts[key] || 0 });
      curr.setDate(curr.getDate() + 1);
    }

    return result;
  }, [filteredFeedbacks]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-xl border border-slate-100">
          <p className="font-bold text-slate-800 mb-1">{label || payload[0].payload.name || payload[0].payload.date}</p>
          <p className="text-sm font-semibold text-blue-600">
            Số lượng: <span className="text-lg ml-1">{payload[0].value}</span> phản ánh
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 md:p-8 h-full flex flex-col gap-8 max-w-[1600px] mx-auto w-full overflow-y-auto bg-slate-50/50">
      
      {/* Header & Filters */}
      <div className="shrink-0 bg-gradient-to-br from-[#0B2545] to-[#1e5c9b] p-8 md:p-10 rounded-[24px] shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-10 w-40 h-40 bg-blue-400/20 rounded-full blur-2xl translate-y-1/2"></div>
        
        <div className="relative z-10">
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
              <TrendingUp className="text-blue-300" size={32} strokeWidth={2.5} />
            </div>
            Trung tâm Phân tích Dữ liệu
          </h2>
          <p className="text-blue-100/90 mt-4 text-[15px] md:text-[16px] font-medium max-w-2xl leading-relaxed">
            Hệ thống tự động tổng hợp và vẽ biểu đồ biến động tình hình an ninh trật tự, giúp nhận diện sớm các điểm nóng trên địa bàn phường.
          </p>
        </div>
        
        {/* Lọc thời gian */}
        <div className="relative z-10 flex flex-col gap-2 bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10 shadow-lg min-w-[200px]">
          <span className="text-blue-200 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
            <Filter size={14}/> Lọc theo thời gian
          </span>
          <div className="flex bg-white/20 p-1 rounded-xl">
            <button 
              onClick={() => setTimeRange('7')}
              className={`flex-1 text-xs font-bold py-2 px-3 rounded-lg transition-all ${timeRange === '7' ? 'bg-white text-blue-900 shadow-sm' : 'text-white hover:bg-white/10'}`}
            >
              7 Ngày
            </button>
            <button 
              onClick={() => setTimeRange('30')}
              className={`flex-1 text-xs font-bold py-2 px-3 rounded-lg transition-all ${timeRange === '30' ? 'bg-white text-blue-900 shadow-sm' : 'text-white hover:bg-white/10'}`}
            >
              30 Ngày
            </button>
            <button 
              onClick={() => setTimeRange('ALL')}
              className={`flex-1 text-xs font-bold py-2 px-3 rounded-lg transition-all ${timeRange === 'ALL' ? 'bg-white text-blue-900 shadow-sm' : 'text-white hover:bg-white/10'}`}
            >
              Tất cả
            </button>
          </div>
        </div>
      </div>

      {/* Chart 3: Xu hướng thời gian (Area Chart) */}
      <div className="bg-white p-8 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col transition-all hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)] group min-h-[400px]">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-2xl group-hover:scale-110 transition-transform group-hover:bg-blue-100">
              <Calendar className="text-blue-600" size={28} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">Biến động Số lượng Phản ánh</h3>
              <p className="text-[15px] text-slate-500 font-medium mt-0.5">Theo dõi lượng sự cố được gửi lên theo từng ngày</p>
            </div>
          </div>
          <div className="text-right">
             <div className="text-3xl font-black text-blue-600">{filteredFeedbacks.length}</div>
             <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Tổng cộng kỳ này</div>
          </div>
        </div>
        
        <div className="flex-1 min-h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendStats} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="date" tick={{fill: '#94A3B8', fontSize: 13, fontWeight: 600}} axisLine={false} tickLine={false} dy={10} />
              <YAxis allowDecimals={false} tick={{fill: '#94A3B8', fontSize: 13, fontWeight: 600}} axisLine={false} tickLine={false} dx={-10} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" animationDuration={2000} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-[500px]">
        {/* Chart 1: Donut Chart for Categories */}
        <div className="bg-white p-8 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col transition-all hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)] group">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-indigo-50 rounded-2xl group-hover:scale-110 transition-transform group-hover:bg-indigo-100">
              <PieIcon className="text-indigo-600" size={28} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">Tỷ trọng Vấn đề Phản ánh</h3>
              <p className="text-[15px] text-slate-500 font-medium mt-0.5">Phân bố tỷ lệ theo nhóm danh mục sự cố</p>
            </div>
          </div>
          
          <div className="flex-1 min-h-[350px] relative w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={110}
                  outerRadius={150}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {categoryStats.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={PIE_COLORS[index % PIE_COLORS.length]} 
                      className="hover:opacity-80 transition-opacity drop-shadow-sm cursor-pointer"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ fontSize: '14px', fontWeight: 600, color: '#475569', paddingTop: '20px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <div className="text-5xl font-black text-slate-800 tracking-tighter drop-shadow-sm">{filteredFeedbacks.length}</div>
              <div className="text-sm font-extrabold text-slate-400 uppercase tracking-widest mt-1">Tổng sự cố</div>
            </div>
          </div>
        </div>

        {/* Chart 2: Bar Chart for Areas */}
        <div className="bg-white p-8 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col transition-all hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)] group">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-rose-50 rounded-2xl group-hover:scale-110 transition-transform group-hover:bg-rose-100">
              <MapPin className="text-rose-600" size={28} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">Khu vực Trọng điểm</h3>
              <p className="text-[15px] text-slate-500 font-medium mt-0.5">Top các tuyến đường có nhiều phản ánh nhất</p>
            </div>
          </div>

          <div className="flex-1 min-h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={areaStats}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="4 4" horizontal={true} vertical={false} stroke="#F1F5F9" />
                <XAxis type="number" allowDecimals={false} tick={{fill: '#94A3B8', fontSize: 13, fontWeight: 600}} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" width={160} tick={{fontSize: 13, fill: '#334155', fontWeight: 600}} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{fill: '#F8FAFC'}} />
                <Bar 
                  dataKey="value" 
                  name="Số lượng" 
                  radius={[0, 8, 8, 0]} 
                  barSize={32}
                  animationDuration={1500}
                >
                  {areaStats.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index === 0 ? '#EF4444' : index === 1 ? '#F97316' : index === 2 ? '#F59E0B' : '#3B82F6'} 
                      className="hover:brightness-110 transition-all cursor-pointer"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
