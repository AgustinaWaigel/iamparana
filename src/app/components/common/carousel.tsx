"use client";
import { useState, useEffect } from "react";
import { getGoogleDriveImageUrl } from "@/lib/drive-utils";
import CarouselAdminTools from "@/app/components/common/CarouselAdminTools";
import { Settings } from "lucide-react";


// 1. Definimos la interfaz exacta que espera el componente
export interface CarouselItem {
  id?: number;
  imageDesktop: string; 
  imageMobile?: string;
  alt: string;
  link?: string | null;
  buttonText?: string;
}

// 2. Tipamos las Props
interface CarouselProps {
  initialItems?: any[]; // Usamos any temporalmente para desestructurar con seguridad
  isAdmin?: boolean;
}

export default function Carousel({ initialItems = [], isAdmin = false }: CarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  // 3. Mapeo seguro: Si el objeto de la DB tiene nombres distintos, aquí los unificamos
  const items: CarouselItem[] = initialItems.map(item => ({
    id: item.id,
    imageDesktop: item.imageDesktop || item.imagedesktop || "", // Soporte para diferentes cases
    imageMobile: item.imageMobile || item.imagemobile || item.imageDesktop || item.imagedesktop || "",
    alt: item.alt || "",
    link: typeof item.link === "string" && item.link.trim() !== "" ? item.link.trim() : null,
    buttonText: typeof item.buttonText === "string" ? item.buttonText.trim() : ""
  })).filter(item => item.imageDesktop !== ""); // Filtramos los que no tengan imagen para que no rompa

  useEffect(() => {
    if (items.length <= 1) return;

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % items.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [items.length]);

  useEffect(() => {
    if (activeIndex >= items.length) {
      setActiveIndex(0);
    }
  }, [activeIndex, items.length]);

  const goToSlide = (index: number) => {
    if (index < 0 || index >= items.length) return;
    setActiveIndex(index);
  };

  const goNext = () => {
    setActiveIndex((prev) => (prev + 1) % items.length);
  };

  const goPrev = () => {
    setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  if (items.length === 0) {
    return <div className="aspect-[12/5] bg-stone-100 flex items-center justify-center rounded-xl font-bold text-stone-400">SIN CONTENIDO</div>;
  }

  return (
    <div className="relative w-full aspect-[4/5] md:aspect-[12/5] overflow-hidden rounded-xl bg-stone-900 shadow-xl">
      {isAdmin && (
        <div className="absolute top-3 right-3 z-30">
          <CarouselAdminTools compact />
        </div>
      )}

      <div
        className="flex h-full transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${activeIndex * 100}%)` }}
      >
        {items.map((item, i) => (
          <div key={item.id || i} className="min-w-full h-full relative">
            <picture>
              <source media="(max-width: 767px)" srcSet={getGoogleDriveImageUrl(item.imageMobile || item.imageDesktop)} />
              <img
                src={getGoogleDriveImageUrl(item.imageDesktop)}
                alt={item.alt}
                className="w-full h-full object-cover"
                loading={i === 0 ? "eager" : "lazy"}
              />
            </picture>

            {item.link && (
              <div className="absolute left-1/2 -translate-x-1/2 bottom-16 md:bottom-20 z-20">
                <a
                  href={item.link}
                  className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-300 to-orange-400 px-5 py-2.5 text-sm md:text-base font-black tracking-wide text-stone-900 shadow-[0_10px_30px_rgba(0,0,0,0.35)] ring-1 ring-white/40 transition-all duration-300 hover:scale-[1.03] hover:from-amber-200 hover:to-orange-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  {item.buttonText || "Ver más"}
                  <span className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">
                    →
                  </span>
                </a>
              </div>
            )}
          </div>
        ))}
      </div>

      {items.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Imagen anterior"
            onClick={goPrev}
            className="absolute left-3 md:left-5 top-1/2 -translate-y-1/2 z-20 h-11 w-11 md:h-12 md:w-12 rounded-full border border-white/40 bg-white/15 text-white backdrop-blur-md shadow-lg transition-all duration-300 hover:scale-105 hover:bg-white/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <span className="text-2xl leading-none" aria-hidden="true">‹</span>
          </button>

          <button
            type="button"
            aria-label="Imagen siguiente"
            onClick={goNext}
            className="absolute right-3 md:right-5 top-1/2 -translate-y-1/2 z-20 h-11 w-11 md:h-12 md:w-12 rounded-full border border-white/40 bg-white/15 text-white backdrop-blur-md shadow-lg transition-all duration-300 hover:scale-105 hover:bg-white/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <span className="text-2xl leading-none" aria-hidden="true">›</span>
          </button>

          <div className="absolute bottom-3 md:bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 rounded-full border border-white/30 bg-black/35 px-3 py-2 backdrop-blur-md">
            {items.map((_, i) => (
              <button
                key={`dot-${i}`}
                type="button"
                aria-label={`Ir a imagen ${i + 1}`}
                onClick={() => goToSlide(i)}
                className={`h-2.5 rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                  i === activeIndex
                    ? "w-6 bg-white"
                    : "w-2.5 bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
            <span className="ml-1 text-[11px] font-semibold text-white/90 tabular-nums">
              {activeIndex + 1}/{items.length}
            </span>
          </div>
        </>
      )}
    </div>
  );
}