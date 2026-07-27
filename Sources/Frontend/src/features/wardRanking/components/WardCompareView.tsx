import React, { useState, useEffect } from "react";
import { wardRankingApi, aiApi, WardRankingEntry, WardRankingDetail } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, ArrowRightLeft, Sparkles } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ReactMarkdown from "react-markdown";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  allWards: WardRankingEntry[];
  initialWardId1?: number;
  year?: number;
  month?: number;
}

export function WardCompareView({ isOpen, onClose, allWards, initialWardId1, year, month }: Props) {
  const [wardId1, setWardId1] = useState<number | undefined>(initialWardId1);
  const [wardId2, setWardId2] = useState<number | undefined>();
  
  const [detail1, setDetail1] = useState<WardRankingDetail | null>(null);
  const [detail2, setDetail2] = useState<WardRankingDetail | null>(null);
  const [loading, setLoading] = useState(false);

  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (initialWardId1) setWardId1(initialWardId1);
  }, [initialWardId1]);

  useEffect(() => {
    setAiAnalysis(null); // Reset AI analysis when changing wards
  }, [wardId1, wardId2]);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!isOpen) return;
      setLoading(true);
      try {
        const [res1, res2] = await Promise.all([
          wardId1 ? wardRankingApi.getWardDetail(wardId1, year, month) : Promise.resolve(null),
          wardId2 ? wardRankingApi.getWardDetail(wardId2, year, month) : Promise.resolve(null)
        ]);
        setDetail1(res1);
        setDetail2(res2);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [wardId1, wardId2, isOpen, year, month]);

  const handleAnalyze = async () => {
    if (!detail1 || !detail2) return;
    setAnalyzing(true);
    
    const prompt = `So sánh năng lực xử lý phản ánh của 2 phường:
- Phường 1: ${detail1.wardName} (Điểm tổng: ${detail1.currentScore}, Hạng: ${detail1.currentRank}, Tốc độ xử lý: ${detail1.speedScore}, Môi trường: ${detail1.lowIncidenceScore}, Hài lòng: ${detail1.satisfactionScore}, Tổng phản ánh: ${detail1.totalFeedbacks}, Đã xử lý: ${detail1.resolvedCount}, Tỷ lệ hoàn thành: ${detail1.resolutionRate}%, Thời gian xử lý trung bình: ${detail1.avgResolutionHours}h)
- Phường 2: ${detail2.wardName} (Điểm tổng: ${detail2.currentScore}, Hạng: ${detail2.currentRank}, Tốc độ xử lý: ${detail2.speedScore}, Môi trường: ${detail2.lowIncidenceScore}, Hài lòng: ${detail2.satisfactionScore}, Tổng phản ánh: ${detail2.totalFeedbacks}, Đã xử lý: ${detail2.resolvedCount}, Tỷ lệ hoàn thành: ${detail2.resolutionRate}%, Thời gian xử lý trung bình: ${detail2.avgResolutionHours}h)

Dựa vào các số liệu trên, hãy phân tích chuyên sâu và trả về kết quả theo từng dòng rõ ràng (sử dụng bullet points). Yêu cầu:
- **Đánh giá trực diện:** Phường nào đang làm tốt hơn ở khía cạnh nào (ví dụ: tốc độ xử lý nhanh hơn, giải quyết triệt để hơn).
- **Phân tích điểm yếu:** Chỉ ra vấn đề thực tế (ví dụ: tỷ lệ xử lý chậm, môi trường phát sinh nhiều).
- **Lời khuyên cạnh tranh:** Đề xuất cụ thể để từng phường có thể cải thiện và vượt lên trong tháng tới.
Trình bày bằng Markdown, dùng in đậm cho các chỉ số và từ khóa quan trọng để người dân dễ đọc.`;

    try {
      // Create a persistent unique session ID for the user to avoid rate-limiting all users together
      let aiUserId = localStorage.getItem("ai_session_id");
      if (!aiUserId) {
        aiUserId = "user-" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
        localStorage.setItem("ai_session_id", aiUserId);
      }
      
      const res = await aiApi.router(prompt, aiUserId);
      
      // Response trả về là một object { data: { answer: ... } } (do api.ts wrap) hoặc { answer: ... }
      const answer = (res as any).answer || res;
      setAiAnalysis(typeof answer === "string" ? answer : JSON.stringify(answer));
    } catch (err) {
      setAiAnalysis("Đã có lỗi xảy ra khi gọi AI. Vui lòng thử lại sau.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-3">
            <ArrowRightLeft className="w-6 h-6 text-blue-500" />
            So sánh đánh giá Phường / Xã
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 mt-4">
          {/* Column 1 */}
          <div className="space-y-4">
            <Select value={wardId1?.toString()} onValueChange={(v) => setWardId1(Number(v))}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn phường 1..." />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {allWards.map(w => (
                  <SelectItem key={w.wardId} value={w.wardId.toString()}>{w.wardName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {detail1 && <DetailColumn detail={detail1} />}
          </div>

          {/* Column 2 */}
          <div className="space-y-4">
            <Select value={wardId2?.toString()} onValueChange={(v) => setWardId2(Number(v))}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn phường 2..." />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {allWards.map(w => (
                  <SelectItem key={w.wardId} value={w.wardId.toString()}>{w.wardName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {detail2 && <DetailColumn detail={detail2} />}
          </div>
        </div>

        {/* AI Analysis Section */}
        {detail1 && detail2 && (
          <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-6">
            {!aiAnalysis && !analyzing && (
              <div className="flex justify-center">
                <button
                  onClick={handleAnalyze}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all"
                >
                  <Sparkles className="w-5 h-5" />
                  Phân tích dữ liệu với AI
                </button>
              </div>
            )}
            
            {analyzing && (
              <div className="flex flex-col items-center justify-center space-y-3 py-4">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <span className="text-sm font-semibold text-slate-500 animate-pulse">
                  AI đang phân tích và tổng hợp dữ liệu...
                </span>
              </div>
            )}

            {aiAnalysis && !analyzing && (
              <div className="relative p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 shadow-inner">
                <div className="absolute -top-3 left-6 px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-black rounded-full shadow-md flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> AI NHẬN XÉT
                </div>
                <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed mt-2">
                  <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 flex items-center justify-center backdrop-blur-[1px] rounded-xl z-50">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DetailColumn({ detail }: { detail: WardRankingDetail }) {

  return (
    <div className="space-y-4">
      <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-xl text-center border border-slate-100 dark:border-slate-700">
        <div className="text-4xl font-black text-blue-600 dark:text-blue-400">{detail.currentScore}</div>
        <div className="text-slate-500 font-semibold mt-1">Hạng #{detail.currentRank}</div>
      </div>
      
      <div className="space-y-3">
        <CompareRow label="Tốc độ xử lý" value={`${detail.speedScore}`} />
        <CompareRow label="Môi trường" value={`${detail.lowIncidenceScore}`} />
        <CompareRow label="Hài lòng" value={`${detail.satisfactionScore}`} />
        <CompareRow label="Xu hướng" value={`${detail.trendScore}`} />
        <div className="h-px bg-slate-200 dark:bg-slate-700 my-2" />
        <CompareRow label="Tổng phản ánh" value={`${detail.totalFeedbacks}`} />
        <CompareRow label="Đã xử lý" value={`${detail.resolvedCount}`} />
        <CompareRow label="Tỷ lệ xử lý" value={`${detail.resolutionRate}%`} />
        <CompareRow label="TG xử lý TB" value={`${detail.avgResolutionHours}h`} />
      </div>
    </div>
  );
}

function CompareRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-slate-600 dark:text-slate-400">{label}</span>
      <span className="font-bold text-slate-900 dark:text-slate-100">{value}</span>
    </div>
  );
}
