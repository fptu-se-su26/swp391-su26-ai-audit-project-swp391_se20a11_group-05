import { useI18n } from "@/lib/i18n";
import { touristNews } from "@/lib/mock-data";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { useState, useEffect } from "react";

export function TouristNewsSlider() {
  const { t, locale } = useI18n();
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? touristNews.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === touristNews.length - 1 ? 0 : prev + 1));
  };

  useEffect(() => {
    const timer = setInterval(() => {
      handleNext();
    }, 5000);
    return () => clearInterval(timer);
  }, [currentIndex]);

  const currentNews = touristNews[currentIndex];

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-[#E4EAF2] overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#E4EAF2] bg-[#F8FAFC]">
        <h2 className="text-xl font-bold text-[#0B4FC4] font-sans uppercase">
          {locale === "vi" ? "Tin Du Khách" : "Tourist News"}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={handlePrev}
            className="p-1.5 rounded-full hover:bg-gray-200 transition text-gray-600"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={handleNext}
            className="p-1.5 rounded-full hover:bg-gray-200 transition text-gray-600"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
      
      <div className="relative w-full h-[300px] md:h-[400px]">
        <div className="absolute inset-0">
          <img
            src={currentNews.image}
            alt={currentNews.title[locale as 'vi'|'en']}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
        </div>
        
        <div className="absolute bottom-0 left-0 w-full p-6 text-white">
          <div className="flex items-center gap-2 text-sm text-gray-200 mb-2">
            <Calendar size={16} />
            <span>{currentNews.date}</span>
          </div>
          <h3 className="text-2xl font-bold font-sans drop-shadow-md">
            {currentNews.title[locale as 'vi'|'en']}
          </h3>
        </div>

        {/* Indicators */}
        <div className="absolute bottom-4 right-6 flex gap-2">
          {touristNews.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2 rounded-full transition-all ${
                idx === currentIndex ? "w-6 bg-white" : "w-2 bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
