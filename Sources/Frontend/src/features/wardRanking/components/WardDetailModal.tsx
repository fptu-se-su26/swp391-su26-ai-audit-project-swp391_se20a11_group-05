import React, { useEffect, useState, useRef } from "react";
import { wardRankingApi, WardRankingDetail } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Download, Share2, Award, Zap, ShieldCheck, Heart, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import html2canvas from "html2canvas";

interface WardDetailModalProps {
  wardId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export function WardDetailModal({ wardId, isOpen, onClose }: WardDetailModalProps) {
  const [detail, setDetail] = useState<WardRankingDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && wardId) {
      setLoading(true);
      wardRankingApi
        .getWardDetail(wardId)
        .then((res) => {
          setDetail(res);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, wardId]);

  const handleShare = async () => {
    if (cardRef.current) {
      try {
        const canvas = await html2canvas(cardRef.current, { scale: 2, useCORS: true });
        const dataUrl = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `kpi-${detail?.wardName || "ward"}.png`;
        a.click();
      } catch (err) {
        console.error("Failed to capture image", err);
      }
    }
  };

  const handleDownloadPdf = () => {
    if (wardId) {
      window.open(wardRankingApi.getPdfReportUrl(wardId), "_blank");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl bg-white dark:bg-slate-900 overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center justify-between">
            <span>Chi tiết đánh giá phường/xã</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" /> Share
              </Button>
              <Button variant="default" size="sm" onClick={handleDownloadPdf}>
                <Download className="w-4 h-4 mr-2" /> PDF
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : detail ? (
          <div className="space-y-6" ref={cardRef}>
            {/* Header Card */}
            <div className="p-6 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-20">
                <Award className="w-32 h-32" />
              </div>
              <div className="relative z-10">
                <h2 className="text-3xl font-black mb-2">{detail.wardName}</h2>
                <div className="flex items-end gap-4">
                  <div>
                    <div className="text-blue-100 text-sm uppercase tracking-wider font-semibold">Điểm tổng hợp</div>
                    <div className="text-5xl font-black">{detail.currentScore}</div>
                  </div>
                  <div className="pb-1">
                    <div className="inline-flex items-center justify-center bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm text-sm font-bold">
                      Hạng #{detail.currentRank}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Badges */}
            {detail.achievements && detail.achievements.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {detail.achievements.map((a, i) => (
                  <div key={i} className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-3 py-1.5 rounded-full text-sm font-semibold border border-amber-200 dark:border-amber-800">
                    <Award className="w-4 h-4" />
                    {a.badgeLabel}
                  </div>
                ))}
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={<Zap className="w-5 h-5 text-blue-500" />} title="Tốc độ xử lý" value={`${detail.speedScore}`} desc="SLA 48h (35%)" />
              <StatCard icon={<ShieldCheck className="w-5 h-5 text-green-500" />} title="Môi trường" value={`${detail.lowIncidenceScore}`} desc="Ít phát sinh (30%)" />
              <StatCard icon={<Heart className="w-5 h-5 text-red-500" />} title="Hài lòng" value={`${detail.satisfactionScore}`} desc="Đánh giá (20%)" />
              <StatCard icon={<TrendingUp className="w-5 h-5 text-purple-500" />} title="Xu hướng" value={`${detail.trendScore}`} desc="Cải thiện (15%)" />
            </div>

            {/* Details */}
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-5 border border-slate-100 dark:border-slate-700">
              <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-100">Thông số thực tế</h3>
              <div className="grid grid-cols-2 gap-y-4 text-sm">
                <div>
                  <div className="text-slate-500 dark:text-slate-400">Tổng phản ánh</div>
                  <div className="font-semibold text-lg">{detail.totalFeedbacks}</div>
                </div>
                <div>
                  <div className="text-slate-500 dark:text-slate-400">Đã xử lý</div>
                  <div className="font-semibold text-lg text-emerald-600 dark:text-emerald-400">{detail.resolvedCount} ({detail.resolutionRate}%)</div>
                </div>
                <div>
                  <div className="text-slate-500 dark:text-slate-400">Tốc độ trung bình</div>
                  <div className="font-semibold text-lg">{detail.avgResolutionHours} giờ</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500">Không tải được dữ liệu</div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function StatCard({ icon, title, value, desc }: { icon: React.ReactNode, title: string, value: string, desc: string }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        {icon}
      </div>
      <div className="text-2xl font-black text-slate-800 dark:text-slate-100">{value}</div>
      <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-1">{title}</div>
      <div className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">{desc}</div>
    </div>
  );
}
