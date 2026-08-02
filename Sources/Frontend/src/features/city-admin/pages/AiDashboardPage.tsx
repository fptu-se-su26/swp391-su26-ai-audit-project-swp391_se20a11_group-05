import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Zap, Clock, Coins, ShieldAlert, BadgeCheck, FileWarning, Search, Info, Filter } from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

// Types
interface AiStats {
  totalLogs: number;
  averageTrustScore: number;
  totalTokens: number;
  estimatedCostUsd: number;
}

interface AiLog {
  id: number;
  feedbackId: number;
  trustScore: number;
  isToxic: boolean;
  domain: string;
  priority: string;
  tokensUsedInput: number;
  tokensUsedOutput: number;
  latencyMs: number;
  modelName: string;
  createdAt: string;
  reason: string;
  assignedDepartment: string;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export function AiDashboardPage() {
  const [stats, setStats] = useState<AiStats | null>(null);
  const [logs, setLogs] = useState<AiLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState("ALL");
  const [filterDomain, setFilterDomain] = useState("ALL");

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("dn_jwt_token") || sessionStorage.getItem("dn_jwt_token") || "";
        const headers = {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        };
        
        const statsRes = await fetch("/api/admin/ai/dashboard/stats", { headers });
        const logsRes = await fetch("/api/admin/ai/dashboard/logs", { headers });
        
        if (statsRes.ok && logsRes.ok) {
          const statsData = await statsRes.json();
          const logsData = await logsRes.json();
          setStats(statsData.data);
          setLogs(logsData.data);
        }
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu AI", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0647A5]"></div>
      </div>
    );
  }

  // 1. Dữ liệu biểu đồ Thời gian / Token
  const chartData = logs.reduce((acc: any[], log) => {
    const date = new Date(log.createdAt);
    const hourLabel = `${date.getHours()}:00`;
    
    const existing = acc.find(item => item.time === hourLabel);
    if (existing) {
      existing.count += 1;
      existing.tokens += (log.tokensUsedInput + log.tokensUsedOutput);
      existing.latency = Math.max(existing.latency, log.latencyMs);
    } else {
      acc.push({ 
        time: hourLabel, 
        count: 1, 
        tokens: (log.tokensUsedInput + log.tokensUsedOutput),
        latency: log.latencyMs
      });
    }
    return acc;
  }, []).reverse(); 

  // 2. Dữ liệu biểu đồ Mô hình (Model Distribution)
  const modelDistribution = logs.reduce((acc: any, log) => {
    const name = log.modelName || "Unknown";
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});
  const pieData = Object.keys(modelDistribution).map(key => ({
    name: key,
    value: modelDistribution[key]
  }));

  // Lọc Log Table
  const uniqueDomains = Array.from(new Set(logs.map(l => l.domain)));
  
  const filteredLogs = logs.filter(log => {
    let match = true;
    if (filterPriority !== "ALL" && log.priority !== filterPriority) match = false;
    if (filterDomain !== "ALL" && log.domain !== filterDomain) match = false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const textMatch = 
        log.feedbackId.toString().includes(q) || 
        (log.domain && log.domain.toLowerCase().includes(q)) ||
        (log.assignedDepartment && log.assignedDepartment.toLowerCase().includes(q));
      if (!textMatch) match = false;
    }
    return match;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#0647A5]">AI Auto-Dispatch Dashboard</h2>
          <p className="text-sm text-slate-500 mt-1">Giám sát hiệu suất, độ tin cậy và phân bổ mô hình.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 text-sm font-semibold shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          AI Dual-Engine Online
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Tổng Số Xử Lý</CardTitle>
            <Bot className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">{stats?.totalLogs || 0}</div>
            <p className="text-xs text-slate-500 mt-1 font-medium text-blue-600">lượt phân loại tự động</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Độ Chính Xác (Avg)</CardTitle>
            <BadgeCheck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">{stats?.averageTrustScore || 0}%</div>
            <p className="text-xs text-slate-500 mt-1 font-medium text-emerald-600">điểm tin cậy dự đoán</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Token Đã Dùng</CardTitle>
            <Zap className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">
              {new Intl.NumberFormat('vi-VN').format(stats?.totalTokens || 0)}
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium text-amber-600">input & output</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Chi Phí (Gemini)</CardTitle>
            <Coins className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">${stats?.estimatedCostUsd?.toFixed(4) || 0}</div>
            <p className="text-xs text-slate-500 mt-1 font-medium text-purple-600">chi phí API ước tính</p>
          </CardContent>
        </Card>
      </div>

      {/* 3 Charts in a row (or stacked) */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Chart 1: Model Distribution */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base text-slate-800 flex items-center gap-2">
              Tỷ Trọng Mô Hình
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center items-center h-[220px]">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-400 text-sm">Chưa có dữ liệu</div>
            )}
          </CardContent>
        </Card>

        {/* Chart 2: Usage Bar */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base text-slate-800">Lượt Xử Lý Theo Giờ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                  <Tooltip cursor={{fill: '#F1F5F9'}} />
                  <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Lượt xử lý" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Chart 3: Latency Line */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base text-slate-800">Độ Trễ Phản Hồi (ms)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                  <Tooltip />
                  <Line type="monotone" dataKey="latency" stroke="#EF4444" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} name="Độ trễ max (ms)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table & Filters */}
      <Card className="shadow-sm border-0 overflow-hidden">
        <CardHeader className="bg-white border-b px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
              Nhật Ký Điều Phối Tự Động
            </CardTitle>
            
            {/* Bộ Lọc */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm..." 
                  className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-full md:w-48 focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-slate-50"
                />
              </div>

              <select 
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="py-2 px-3 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none text-slate-600"
              >
                <option value="ALL">Mức độ (Tất cả)</option>
                <option value="KHAN_CAP">Khẩn cấp</option>
                <option value="CAO">Cao</option>
                <option value="TRUNG_BINH">Trung bình</option>
                <option value="THAP">Thấp</option>
              </select>

              <select 
                value={filterDomain}
                onChange={(e) => setFilterDomain(e.target.value)}
                className="py-2 px-3 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none text-slate-600"
              >
                <option value="ALL">Lĩnh vực (Tất cả)</option>
                {uniqueDomains.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b">
              <tr>
                <th className="px-6 py-4 font-semibold">Mã PA</th>
                <th className="px-6 py-4 font-semibold">Lĩnh Vực</th>
                <th className="px-6 py-4 font-semibold">Mức Độ</th>
                <th className="px-6 py-4 font-semibold">Nơi Tiếp Nhận</th>
                <th className="px-6 py-4 font-semibold text-center">Tin Cậy</th>
                <th className="px-6 py-4 font-semibold text-right">Mô Hình & Token</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id} className="bg-white border-b hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4 font-medium text-blue-600">
                    #{log.feedbackId}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-medium border border-slate-200">
                      {log.domain}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold shadow-sm inline-flex items-center gap-1
                      ${log.priority === 'KHAN_CAP' ? 'bg-red-100 text-red-700 border border-red-200' : 
                        log.priority === 'CAO' ? 'bg-orange-100 text-orange-700 border border-orange-200' : 
                        'bg-blue-100 text-blue-700 border border-blue-200'}`}
                    >
                      {log.priority === 'KHAN_CAP' && <FileWarning className="w-3 h-3" />}
                      {log.priority.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-slate-700 block">
                      {log.assignedDepartment || "Chưa phân bổ"}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {new Date(log.createdAt).toLocaleString('vi-VN')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className={`font-bold ${log.trustScore > 80 ? 'text-emerald-600' : log.trustScore > 60 ? 'text-amber-600' : 'text-red-600'}`}>
                        {log.trustScore}%
                      </span>
                      <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${log.trustScore > 80 ? 'bg-emerald-500' : log.trustScore > 60 ? 'bg-amber-500' : 'bg-red-500'}`} 
                          style={{ width: `${log.trustScore}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="font-bold text-slate-700 flex items-center justify-end gap-1.5">
                      <Bot className="w-3.5 h-3.5 text-blue-500" />
                      {log.modelName}
                    </div>
                    <div className="text-[10px] font-medium text-slate-400 mt-1 flex items-center justify-end gap-1">
                      <Zap className="w-3 h-3" />
                      {(log.tokensUsedInput + log.tokensUsedOutput).toLocaleString('vi-VN')} tk • {log.latencyMs}ms
                    </div>
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <Filter className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                    <p>Không tìm thấy bản ghi nào phù hợp với bộ lọc.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
