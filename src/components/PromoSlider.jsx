import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

/**
 * PromoSlider Component
 * A premium React + Tailwind CSS carousel slider displaying promotional banners
 * with a responsive split layout (60% cover graphic / 40% clean content).
 */
export default function PromoSlider({ bannersProp = null, autoPlayTime = 5000 }) {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const autoPlayRef = useRef(null);

  // Fetch active banners on mount
  useEffect(() => {
    if (bannersProp) {
      setBanners(bannersProp);
      setLoading(false);
      return;
    }

    const fetchBanners = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/promo-banners`);
        const data = await response.json();
        if (data.success && data.banners) {
          setBanners(data.banners);
        }
      } catch (err) {
        console.error('Error fetching promo banners:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, [bannersProp]);

  // Auto play slide management
  const startAutoPlay = () => {
    stopAutoPlay();
    if (banners.length <= 1) return;
    autoPlayRef.current = setInterval(() => {
      handleNext();
    }, autoPlayTime);
  };

  const stopAutoPlay = () => {
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
    }
  };

  useEffect(() => {
    startAutoPlay();
    return () => stopAutoPlay();
  }, [currentIndex, banners]);

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
  };

  const handleNextClick = (e) => {
    e.stopPropagation();
    handleNext();
  };

  if (loading) {
    return (
      <div className="w-full max-w-5xl h-[380px] mx-auto bg-slate-50 flex items-center justify-center rounded-[24px]">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (banners.length === 0) {
    return null;
  }

  return (
    <div 
      className="relative w-full max-w-5xl mx-auto group"
      onMouseEnter={stopAutoPlay}
      onMouseLeave={startAutoPlay}
    >
      {/* Slider viewport */}
      <div className="overflow-hidden rounded-[24px] shadow-[0_10px_30px_rgba(0,0,0,0.08)] border border-slate-100/50 bg-white">
        <div 
          className="flex transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {banners.map((banner, index) => {
            const finalImg = banner.image_url.startsWith('http') 
              ? banner.image_url 
              : `${API_BASE_URL}${banner.image_url}`;

            return (
              <div key={banner.id || index} className="w-full flex-shrink-0 flex flex-col md:flex-row items-stretch min-h-[280px] md:min-h-[380px]">
                {/* Left side: Large cover graphic image (60% width) */}
                <div className="w-full md:w-[60%] min-h-[220px] md:min-h-full relative overflow-hidden">
                  <img
                    src={finalImg}
                    alt={banner.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>

                {/* Right side: White content card (40% width) */}
                <div className="w-full md:w-[40%] flex flex-col justify-center bg-white p-8 md:p-10 text-left border-t md:border-t-0 md:border-l border-slate-100 relative">
                  
                  {/* Category / Redirect Action */}
                  <span className="text-xs md:text-sm font-semibold tracking-wider text-slate-400 uppercase">
                    {banner.redirect_type || "ORGANIC HARVEST"}
                  </span>
                  
                  {/* Title */}
                  <h2 className="text-2xl md:text-[38px] font-extrabold text-slate-800 leading-tight mt-2.5 mb-3.5 tracking-tight">
                    {banner.title}
                  </h2>
                  
                  {/* Description */}
                  {banner.description && (
                    <p className="text-sm md:text-base text-slate-450 leading-relaxed font-medium mb-6">
                      {banner.description}
                    </p>
                  )}
                  
                  {/* Shop Now green button CTA */}
                  <div>
                    <button className="px-6 py-3 bg-[#22C55E] hover:bg-[#16a34a] text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/25 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer active:scale-95">
                      Shop Now
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation controls */}
      {banners.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center shadow-lg border border-slate-100 opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-x-2 group-hover:translate-x-0 cursor-pointer z-20"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={handleNextClick}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center shadow-lg border border-slate-100 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0 cursor-pointer z-20"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {/* Slide Dot Indicators */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                currentIndex === index 
                  ? 'w-6 bg-[#22C55E]' 
                  : 'w-2 bg-slate-300 hover:bg-slate-400'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
