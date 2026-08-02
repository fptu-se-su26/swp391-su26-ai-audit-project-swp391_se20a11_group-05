import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import {
  touristFestivals,
  touristDestinations,
  touristAccommodations,
  touristCraftVillages,
} from "@/lib/mock-data";

type TabKey = "festivals" | "destinations" | "accommodations" | "crafts";

export function TouristInfoTabs() {
  const { locale } = useI18n();
  const [activeTab, setActiveTab] = useState<TabKey>("festivals");

  const tabs = [
    { key: "festivals", labelVi: "Lễ hội & Sự kiện", labelEn: "Festivals & Events" },
    { key: "destinations", labelVi: "Địa điểm", labelEn: "Destinations" },
    { key: "accommodations", labelVi: "Nơi ở", labelEn: "Accommodations" },
    { key: "crafts", labelVi: "Làng nghề", labelEn: "Craft Villages" },
  ];

  const getData = (tab: TabKey) => {
    switch (tab) {
      case "festivals":
        return touristFestivals;
      case "destinations":
        return touristDestinations;
      case "accommodations":
        return touristAccommodations;
      case "crafts":
        return touristCraftVillages;
      default:
        return [];
    }
  };

  const activeData = getData(activeTab);

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-[#E4EAF2] p-6">
      <h2 className="text-xl font-bold text-[#0B4FC4] font-sans uppercase text-center mb-6">
        {locale === "vi" ? "Thông tin du lịch" : "Tourist Information"}
      </h2>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-2 md:gap-4 justify-center mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as TabKey)}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition font-sans ${
              activeTab === tab.key
                ? "bg-[#0B4FC4] text-white shadow-md"
                : "bg-[#F5F9FF] text-[#0B4FC4] hover:bg-blue-100"
            }`}
          >
            {locale === "vi" ? tab.labelVi : tab.labelEn}
          </button>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
        {activeData.map((item) => (
          <div
            key={item.id}
            className="group rounded-xl overflow-hidden shadow-sm border border-[#E4EAF2] hover:shadow-md transition cursor-pointer"
          >
            <div className="h-48 overflow-hidden relative">
              <img
                src={item.image}
                alt={item.title[locale as "vi" | "en"]}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
              />
            </div>
            <div className="p-4">
              <h3 className="text-lg font-bold text-[#123E8A] font-sans mb-2">
                {item.title[locale as "vi" | "en"]}
              </h3>
              <p className="text-sm text-[#667085] line-clamp-2">
                {item.desc[locale as "vi" | "en"]}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
