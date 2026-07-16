import { createFileRoute as routerCreateFileRoute, Link } from "@tanstack/react-router";
import { useNewsDetail } from "@/hooks/useNews";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Calendar, Eye, ArrowLeft, User } from "lucide-react";
import { sanitizeNewsHtml } from "@/lib/sanitizeHtml";

export const Route = routerCreateFileRoute("/tin-tuc/$id")({
  component: NewsDetailComponent,
});

function NewsDetailComponent() {
  const { id } = Route.useParams();
  const { data: news, isLoading, error } = useNewsDetail(id);

  if (isLoading) {
    return (
      <div className="w-full min-h-screen bg-[#F8FAFD] flex items-center justify-center">
        <div className="text-gray-500">Đang tải chi tiết tin tức...</div>
      </div>
    );
  }

  if (error || !news) {
    return (
      <div className="w-full min-h-screen bg-[#F8FAFD] flex items-center justify-center">
        <div className="text-red-500">Không tìm thấy tin tức.</div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#F4F7FA] font-sans pb-20">
      <div className="bg-[#0B2545] pt-[120px] pb-[100px] relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
          <div
            className="absolute top-0 right-0 w-full h-full"
            style={{
              backgroundImage:
                "radial-gradient(circle at 100% 0%, #ffffff 0%, transparent 50%)",
            }}
          ></div>
        </div>

        <div className="container mx-auto px-4 md:px-6 relative z-10 max-w-[900px]">
          <Link
            to="/tin-tuc"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-6 text-sm font-semibold uppercase tracking-wider"
          >
            <ArrowLeft size={16} />
            Quay lại danh sách
          </Link>

          <div className="mb-5">
            <span className="bg-[#0F5BD8] text-white px-3.5 py-1.5 rounded-md text-xs font-bold uppercase tracking-widest shadow-sm">
              {news.category}
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-[42px] font-extrabold text-white leading-[1.25] mb-6 font-sans">
            {news.title}
          </h1>

          <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-white/70 text-sm font-medium">
            <span className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
              <User size={16} />
              {news.authorName}
            </span>
            <span className="flex items-center gap-2">
              <Calendar size={16} />
              {news.createdAt ? format(new Date(news.createdAt), "dd/MM/yyyy HH:mm", { locale: vi }) : ""}
            </span>
            <span className="flex items-center gap-2">
              <Eye size={16} />
              {news.views?.toLocaleString("vi-VN") || 0} lượt xem
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 -mt-[60px] relative z-20 max-w-[900px]">
        <div className="bg-white rounded-2xl shadow-xl shadow-[#0B2545]/5 overflow-hidden border border-[#E4EAF2]">
          {news.imageUrl && (
            <div className="w-full aspect-video md:aspect-[21/9] relative bg-slate-50 group">
              <img
                src={news.imageUrl}
                alt={news.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-6 md:p-10 lg:p-14">
            {/* Tóm tắt */}
            {news.summary && (
              <div className="mb-8 p-6 bg-slate-50 border-l-4 border-[#0F5BD8] rounded-r-xl">
                <p className="text-[#0B2545] font-semibold text-lg leading-relaxed">
                  {news.summary}
                </p>
              </div>
            )}

            {/* Content */}
            <div className="prose prose-slate max-w-none prose-lg prose-headings:text-[#0B2545] prose-headings:font-extrabold prose-a:text-[#0F5BD8] hover:prose-a:text-[#0B4FC4] prose-img:rounded-xl prose-p:leading-loose prose-p:text-slate-700">
              <div dangerouslySetInnerHTML={{ __html: sanitizeNewsHtml(news.content || news.summary) }} />
            </div>
            
            {/* End of article marker */}
            <div className="mt-12 flex justify-center">
              <div className="w-16 h-1 bg-slate-200 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
