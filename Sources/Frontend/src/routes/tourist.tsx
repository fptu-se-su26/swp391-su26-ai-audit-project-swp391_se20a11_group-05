import { createFileRoute } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { TouristNewsSlider } from "@/components/site/portal/TouristNewsSlider";
import { TouristInfoTabs } from "@/components/site/portal/TouristInfoTabs";
import { TouristExploreCards } from "@/components/site/portal/TouristExploreCards";
import { HeadphonesIcon, ShieldAlert, PhoneCall } from "lucide-react";

export const Route = createFileRoute("/tourist")({
  head: () => ({
    meta: [
      { title: "Du khách - Cổng Thông tin điện tử thành phố Đà Nẵng" },
      {
        name: "description",
        content: "Thông tin du lịch Đà Nẵng - Cổng Thông tin điện tử thành phố Đà Nẵng",
      },
    ],
  }),
  component: TouristPage,
});

function TouristPage() {
  const { locale } = useI18n();

  return (
    <div className="w-full flex flex-col bg-[#F8FAFC] min-h-screen">
      {/* Hero Header */}
      <section
        className="relative w-full h-[250px] md:h-[350px] flex items-center bg-cover bg-center"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1596402184320-417e7178b2cd?auto=format&fit=crop&w=1600&h=600&q=80')`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B4FC4]/90 to-transparent"></div>
        <div className="max-w-[1360px] mx-auto w-full px-4 md:px-8 relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold text-white font-sans drop-shadow-md">
            {locale === "vi" ? "Cổng thông tin Du khách" : "Tourist Information Portal"}
          </h1>
          <p className="text-blue-100 mt-4 max-w-xl text-lg">
            {locale === "vi"
              ? "Khám phá thành phố biển xinh đẹp Đà Nẵng - Điểm đến lý tưởng cho kỳ nghỉ của bạn."
              : "Discover the beautiful coastal city of Da Nang - The perfect destination for your vacation."}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-[1360px] mx-auto w-full px-4 md:px-8 py-8 space-y-10">
        <TouristNewsSlider />
        <TouristInfoTabs />
        <TouristExploreCards />

        {/* Tourist Hotlines */}
        <section className="bg-[#0B4FC4] rounded-2xl p-8 text-white mt-12 mb-12 shadow-md">
          <h2 className="text-2xl font-bold font-sans mb-6 text-center">
            {locale === "vi" ? "Đường dây nóng Hỗ trợ Du khách" : "Tourist Support Hotlines"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center text-center p-4 bg-white/10 rounded-xl">
              <HeadphonesIcon size={32} className="mb-3 text-blue-200" />
              <h3 className="font-bold text-lg mb-1">
                {locale === "vi" ? "Trung tâm Hỗ trợ Du khách" : "Tourist Support Center"}
              </h3>
              <p className="text-2xl font-bold text-yellow-300">0236 3550 111</p>
            </div>
            <div className="flex flex-col items-center text-center p-4 bg-white/10 rounded-xl">
              <ShieldAlert size={32} className="mb-3 text-blue-200" />
              <h3 className="font-bold text-lg mb-1">
                {locale === "vi" ? "Công an Du lịch" : "Tourist Police"}
              </h3>
              <p className="text-2xl font-bold text-yellow-300">0236 3822 300</p>
            </div>
            <div className="flex flex-col items-center text-center p-4 bg-white/10 rounded-xl">
              <PhoneCall size={32} className="mb-3 text-blue-200" />
              <h3 className="font-bold text-lg mb-1">
                {locale === "vi" ? "Cấp cứu Y tế" : "Medical Emergency"}
              </h3>
              <p className="text-2xl font-bold text-yellow-300">115</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
