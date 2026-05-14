"use client";
import { useState, useEffect, useCallback } from "react";
import { getGoogleDriveProxyImageUrl } from "@/lib/drive-utils";
import CarouselAdminTools from "@/app/components/common/CarouselAdminTools";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface CarouselItem {
  id?: number;
  imageDesktop: string;
  imageMobile?: string;
  alt: string;
  link?: string | null;
  buttonText?: string;
}

interface CarouselProps {
  initialItems?: any[];
  isAdmin?: boolean;
}

export default function Carousel({ initialItems = [], isAdmin = false }: CarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const items: CarouselItem[] = initialItems
    .map((item) => ({
      id: item.id,
      imageDesktop: item.imageDesktop || item.imagedesktop || "",
      imageMobile: item.imageMobile || item.imagemobile || item.imageDesktop || item.imagedesktop || "",
      alt: item.alt || "",
      link: typeof item.link === "string" && item.link.trim() !== "" ? item.link.trim() : null,
      buttonText: typeof item.buttonText === "string" ? item.buttonText.trim() : "",
    }))
    .filter((item) => item.imageDesktop !== "");

  const goTo = useCallback(
    (index: number) => {
      if (isAnimating || index === activeIndex) return;
      setPrevIndex(activeIndex);
      setActiveIndex(index);
      setIsAnimating(true);
      setTimeout(() => {
        setPrevIndex(null);
        setIsAnimating(false);
      }, 700);
    },
    [activeIndex, isAnimating]
  );

  const goNext = useCallback(() => goTo((activeIndex + 1) % items.length), [activeIndex, goTo, items.length]);
  const goPrev = useCallback(() => goTo((activeIndex - 1 + items.length) % items.length), [activeIndex, goTo, items.length]);

  useEffect(() => {
    if (items.length <= 1) return;
    const id = setInterval(goNext, 7000);
    return () => clearInterval(id);
  }, [goNext, items.length]);

  if (items.length === 0) {
    return (
      <div className="aspect-[12/5] bg-stone-900 flex items-center justify-center">
        <span className="text-stone-500 font-semibold">Sin imágenes cargadas</span>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-[4/5] md:aspect-[21/8] overflow-hidden bg-stone-900 shadow-2xl">
      {/* Admin tools */}
      {isAdmin && (
        <div className="absolute top-4 right-4 z-30">
          <CarouselAdminTools compact />
        </div>
      )}

      {/* Slides */}
      {items.map((item, i) => {
        const isActive = i === activeIndex;
        const isPrev = i === prevIndex;
        return (
          <div
            key={item.id || i}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              isActive ? "opacity-100 z-10" : isPrev ? "opacity-0 z-0" : "opacity-0 z-0"
            }`}
          >
            {/* Imagen con Ken Burns */}
            <div
              className={`absolute inset-0 transition-transform duration-[8000ms] ease-linear ${
                isActive ? "scale-110" : "scale-100"
              }`}
            >
              <picture>
                <source media="(max-width: 767px)" srcSet={getGoogleDriveProxyImageUrl(item.imageMobile || item.imageDesktop)} />
                <img
                  src={getGoogleDriveProxyImageUrl(item.imageDesktop)}
                  alt={item.alt}
                  className="w-full h-full object-cover"
                  loading={i === 0 ? "eager" : "lazy"}
                />
              </picture>
            </div>

            {/* Gradiente inferior para el botón / texto */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent z-10" />

            {/* Botón CTA */}
            {item.link && isActive && (
              <div className="absolute bottom-10 md:bottom-12 left-1/2 -translate-x-1/2 z-20 animate-in fade-in slide-in-from-bottom-3 duration-500">
                <a
                  href={item.link}
                  className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-3 text-sm md:text-base font-black tracking-wide text-stone-900 shadow-[0_8px_30px_rgba(0,0,0,0.4)] ring-1 ring-white/30 transition-all duration-300 hover:scale-105 hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)] focus:outline-none"
                >
                  {item.buttonText || "Ver más"}
                  <ChevronRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
                </a>
              </div>
            )}
          </div>
        );
      })}

      {/* Navegación flechas */}
      {items.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Imagen anterior"
            onClick={goPrev}
            className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-20 h-10 w-10 md:h-12 md:w-12 rounded-full bg-black/30 text-white backdrop-blur-sm border border-white/20 flex items-center justify-center transition-all hover:bg-black/50 hover:scale-105 focus:outline-none"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            aria-label="Imagen siguiente"
            onClick={goNext}
            className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-20 h-10 w-10 md:h-12 md:w-12 rounded-full bg-black/30 text-white backdrop-blur-sm border border-white/20 flex items-center justify-center transition-all hover:bg-black/50 hover:scale-105 focus:outline-none"
          >
            <ChevronRight size={22} />
          </button>

          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
            {items.map((_, i) => (
              <button
                key={`dot-${i}`}
                type="button"
                aria-label={`Ir a imagen ${i + 1}`}
                onClick={() => goTo(i)}
                className={`rounded-full transition-all duration-400 focus:outline-none ${
                  i === activeIndex
                    ? "w-7 h-2 bg-white"
                    : "w-2 h-2 bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}