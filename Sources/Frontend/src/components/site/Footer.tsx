import { useI18n } from "@/lib/i18n";

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 px-6 md:px-8 mt-20 border-t-4 border-gov-gold">
      <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-10">
        <div>
          <div className="text-lg font-bold text-white mb-4 uppercase tracking-tight font-heading">
            Cổng Thông Tin Phản Ánh Đà Nẵng
          </div>
          <p className="text-sm leading-relaxed">{t("footer.org")}</p>
        </div>
        <div className="space-y-2">
          <div className="text-white font-bold uppercase text-xs tracking-widest mb-3">Điều hướng</div>
          <div className="text-sm">Về chúng tôi</div>
          <div className="text-sm">Quy trình xử lý</div>
          <div className="text-sm">Chính sách bảo mật</div>
        </div>
        <div className="space-y-2">
          <div className="text-white font-bold uppercase text-xs tracking-widest mb-3">Liên hệ</div>
          <div className="text-sm">24 Trần Phú, Hải Châu, Đà Nẵng</div>
          <div className="text-sm text-gov-gold font-medium">gopy@danang.gov.vn</div>
          <div className="text-sm">Đường dây nóng: <span className="text-gov-gold font-bold">1022</span></div>
        </div>
      </div>
    </footer>
  );
}
