"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

interface CarouselItem {
  imageDesktop: string;
  imageMobile?: string | null;
  alt: string;
  link?: string;
  buttonText?: string;
}

interface CarouselProps {
  initialItems?: CarouselItem[];
}

export default function Carousel({ initialItems = [] }: CarouselProps) {
  const [items, setItems] = useState<CarouselItem[]>(initialItems);
  const [index, setIndex] = useState(0);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const slideRef = useRef<HTMLDivElement>(null);

  // Si no hay items iniciales, fetcha del servidor (fallback)
  useEffect(() => {
    if (initialItems.length === 0) {
      fetch("/api/carousel")
        .then((res) => res.json())
        .then(setItems)
        .catch(console.error);
    }
  }, [initialItems]);

  const moveSlide = useCallback((direction: number) => {
    setIndex((prev) => {
      if (items.length === 0) return 0;
      return (prev + direction + items.length) % items.length;
    });
  }, [items.length]);

  useEffect(() => {
    const interval = setInterval(() => moveSlide(1), 40000);
    return () => clearInterval(interval);
  }, [moveSlide]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 800px)");
    const sync = () => setIsMobileViewport(media.matches);
    sync();

    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);



  useEffect(() => {
    const slide = slideRef.current;
    if (!slide) return;

    let touchStartX = 0;
    let touchEndX = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.changedTouches[0].screenX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      touchEndX = e.changedTouches[0].screenX;
      if (touchEndX < touchStartX - 50) moveSlide(1);
      if (touchEndX > touchStartX + 50) moveSlide(-1);
    };

    slide.addEventListener("touchstart", handleTouchStart);
    slide.addEventListener("touchend", handleTouchEnd);
    return () => {
      slide.removeEventListener("touchstart", handleTouchStart);
      slide.removeEventListener("touchend", handleTouchEnd);
    };
  }, [moveSlide]);

  if (items.length === 0) {
    return <div className="relative mx-auto aspect-[4/5] w-full overflow-hidden shadow-md md:aspect-[12/5]"></div>;
  }

  const getPrimaryImage = (item: CarouselItem) => {
    if (isMobileViewport) {
      return item.imageMobile || item.imageDesktop || "";
    }
    return item.imageDesktop || item.imageMobile || "";
  };

  const getFallbackImage = (item: CarouselItem) => {
    if (isMobileViewport) {
      return item.imageDesktop || "";
    }
    return item.imageMobile || item.imageDesktop || "";
  };

  return (
    <div className="relative mx-auto aspect-[4/5] w-full max-w-full overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.1)] md:aspect-[12/5]">
      <div
        id="carousel-slide"
        ref={slideRef}
        className="flex h-full transition-transform duration-300 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {items.map((item, i) => (
          <div className="relative h-full w-full min-w-full flex-[0_0_100%] overflow-hidden" key={i}>
            <img
              src={getPrimaryImage(item)}
              alt={item.alt}
              loading="lazy"
              className="block h-full w-full object-cover transition-transform duration-700 hover:scale-105"
              onError={(e) => {
                const target = e.currentTarget;
                if (target.dataset.fallbackApplied === "true") return;

                const fallback = getFallbackImage(item);
                if (fallback && fallback !== target.src) {
                  target.dataset.fallbackApplied = "true";
                  target.src = fallback;
                }
              }}
            />
            {/* Overlay gradient para mejor contraste */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            {item.link && (
              item.link.startsWith("/") ? (
                <Link href={item.link} className="absolute bottom-[10%] left-1/2 -translate-x-1/2 rounded-lg bg-gradient-to-r from-brand-brown to-orange-700 px-8 py-4 text-white no-underline font-semibold shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-110 active:scale-95 md:text-base">
                  {item.buttonText}
                </Link>
              ) : (
                <a href={item.link} className="absolute bottom-[10%] left-1/2 -translate-x-1/2 rounded-lg bg-gradient-to-r from-brand-brown to-orange-700 px-8 py-4 text-white no-underline font-semibold shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-110 active:scale-95 md:text-base" target="_blank" rel="noopener noreferrer">
                  {item.buttonText}
                </a>
              )
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-gradient-to-r from-black/70 to-black/50 p-4 text-3xl text-white shadow-lg transition-all duration-300 hover:from-black/90 hover:to-black/70 hover:scale-125 hover:shadow-2xl active:scale-100 backdrop-blur-sm"
        onClick={() => moveSlide(-1)}
        aria-label="Anterior"
      >
        &#10094;
      </button>
      <button
        type="button"
        className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-gradient-to-l from-black/70 to-black/50 p-4 text-3xl text-white shadow-lg transition-all duration-300 hover:from-black/90 hover:to-black/70 hover:scale-125 hover:shadow-2xl active:scale-100 backdrop-blur-sm"
        onClick={() => moveSlide(1)}
        aria-label="Siguiente"
      >
        &#10095;
      </button>

      {/* Indicadores de página con efecto mejorado */}
      <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2 backdrop-blur-sm bg-black/20 rounded-full px-3 py-2">
        {items.map((_, i) => (
          <button
            key={i}
            type="button"
            className={`rounded-full transition-all duration-400 ${
              i === index 
                ? "w-8 h-2.5 bg-white shadow-lg" 
                : "w-2.5 h-2.5 bg-white/60 hover:bg-white/90 hover:scale-125"
            }`}
            onClick={() => setIndex(i)}
            aria-label={`Ir a imagen ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
