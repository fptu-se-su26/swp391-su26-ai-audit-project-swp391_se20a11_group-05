import { useI18n } from "@/lib/i18n";

export function Footer() {
  const { locale } = useI18n();
  return (
    <footer className="bg-slate-900 text-slate-400 pt-16 pb-10 px-6 md:px-8 mt-20 border-t-4 border-gov-gold">
      <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-10 mb-10">
        <div className="animate-fade-in">
          <div className="text-lg font-bold text-white mb-4 uppercase tracking-tight font-heading">
            Cổng Thông Tin Phản Ánh Đà Nẵng
          </div>
          <p className="text-sm leading-relaxed text-slate-400">
            {locale === "vi"
              ? "Hệ thống phản ánh hiện trạng đô thị — kết nối người dân với chính quyền Thành phố Đà Nẵng."
              : "Urban issue reporting system — connecting citizens with Da Nang city authorities."}
          </p>
        </div>
        <div className="animate-fade-in-up stagger-1 space-y-3">
          <div className="text-white font-bold uppercase text-xs tracking-widest mb-3">
            {locale === "vi" ? "Điều hướng" : "Navigation"}
          </div>
          <a href="/" className="block text-sm text-slate-400 hover:text-gov-gold transition-colors duration-200">
            {locale === "vi" ? "Trang chủ" : "Home"}
          </a>
          <a href="/report" className="block text-sm text-slate-400 hover:text-gov-gold transition-colors duration-200">
            {locale === "vi" ? "Gửi phản ánh" : "Submit report"}
          </a>
          <a href="/my-reports" className="block text-sm text-slate-400 hover:text-gov-gold transition-colors duration-200">
            {locale === "vi" ? "Phản ánh của tôi" : "My reports"}
          </a>
          <a href="/assistant" className="block text-sm text-slate-400 hover:text-gov-gold transition-colors duration-200">
            {locale === "vi" ? "Trợ lý AI" : "AI Assistant"}
          </a>
        </div>
        <div className="animate-fade-in-up stagger-2 space-y-3">
          <div className="text-white font-bold uppercase text-xs tracking-widest mb-3">
            {locale === "vi" ? "Liên hệ" : "Contact"}
          </div>
          <div className="text-sm text-slate-400">24 Trần Phú, Hải Châu, Đà Nẵng</div>
          <a href="mailto:gopy@danang.gov.vn" className="block text-sm text-gov-gold font-medium hover:underline">
            gopy@danang.gov.vn
          </a>
          <a href="tel:1022" className="block text-sm">
            <span className="text-slate-400">{locale === "vi" ? "Đường dây nóng" : "Hotline"}: </span>
            <span className="text-gov-gold font-bold hover:underline">1022</span>
          </a>
          <div className="pt-2">
            <a href="tel:1022" className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-lg bg-gov-gold/10 border border-gov-gold/30 text-gov-gold text-sm font-bold hover:bg-gov-gold/20 transition-all">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
              {locale === "vi" ? "Gọi ngay 1022" : "Call 1022 now"}
            </a>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto pt-8 border-t border-slate-800 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} UBND Thành phố Đà Nẵng. {locale === "vi" ? "Bảo lưu mọi quyền." : "All rights reserved."}
      </div>
    </footer>
  );
}
