import { useI18n } from "@/lib/i18n";
import { Coffee, Map, Bus } from "lucide-react";

export function TouristExploreCards() {
  const { locale } = useI18n();

  const exploreItems = [
    {
      id: "food",
      title: { vi: "Ăn gì", en: "What to eat" },
      icon: Coffee,
      bg: "bg-[#FFEDD5]",
      text: "text-[#C2410C]",
      desc: { vi: "Đặc sản ẩm thực Đà Nẵng", en: "Da Nang local cuisine" },
      image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=400",
    },
    {
      id: "places",
      title: { vi: "Chơi gì", en: "What to do" },
      icon: Map,
      bg: "bg-[#E0F2FE]",
      text: "text-[#0369A1]",
      desc: { vi: "Điểm tham quan nổi bật", en: "Top tourist attractions" },
      image: "https://images.unsplash.com/photo-1557409518-691ebcd96038?auto=format&fit=crop&q=80&w=400",
    },
    {
      id: "transport",
      title: { vi: "Đi lại", en: "Transport" },
      icon: Bus,
      bg: "bg-[#DCFCE7]",
      text: "text-[#15803D]",
      desc: { vi: "Phương tiện di chuyển", en: "Transportation options" },
      image: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&q=80&w=400",
    },
  ];

  return (
    <section className="mt-8">
      <h2 className="text-xl font-bold text-[#0B4FC4] font-sans uppercase mb-6 text-center">
        {locale === "vi" ? "Khám phá" : "Explore"}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {exploreItems.map((item) => (
          <div
            key={item.id}
            className="group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition cursor-pointer h-64"
          >
            <div className="absolute inset-0">
              <img
                src={item.image}
                alt={item.title[locale as "vi" | "en"]}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
              />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition"></div>
            </div>
            <div className="absolute inset-0 p-6 flex flex-col justify-end text-white">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${item.bg} ${item.text}`}>
                <item.icon size={24} />
              </div>
              <h3 className="text-2xl font-bold font-sans mb-1 shadow-sm">
                {item.title[locale as "vi" | "en"]}
              </h3>
              <p className="text-sm text-gray-200">
                {item.desc[locale as "vi" | "en"]}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
