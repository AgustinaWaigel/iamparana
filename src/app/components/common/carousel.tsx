"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { getGoogleDriveProxyImageUrl } from "@/lib/drive-utils";
import CarouselAdminTools from "@/app/components/common/CarouselAdminTools";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface CarouselItem {
  id?: number;
  imageDesktop: string;
  imageMobile?: string;
  alt: string;
  title?: string;
  description?: string;
  link?: string | null;
  buttonText?: string;
}

interface CarouselProps {
  initialItems?: any[];
  isAdmin?: boolean;
}

const INTERVAL = 6500; // ms por slide

export default function Carousel({ initialItems = [], isAdmin = false }: CarouselProps) {
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const items: CarouselItem[] = initialItems
    .map((item) => ({
      id: item.id,
      imageDesktop: item.imageDesktop || item.imagedesktop || "",
      imageMobile:
        item.imageMobile || item.imagemobile || item.imageDesktop || item.imagedesktop || "",
      alt: item.alt || "",
      title: typeof item.title === "string" ? item.title.trim() : "",
      description: typeof item.description === "string" ? item.description.trim() : "",
      link:
        typeof item.link === "string" && item.link.trim() !== "" ? item.link.trim() : null,
      buttonText:
        typeof item.buttonText === "string" ? item.buttonText.trim() : "",
    }))
    .filter((item) => item.imageDesktop !== "");

  const startProgress = useCallback(() => {
    setProgress(0);
    if (progressRef.current) clearInterval(progressRef.current);
    const step = 100 / (INTERVAL / 50); // actualiza cada 50ms
    progressRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(progressRef.current!);
          return 100;
        }
        return p + step;
      });
    }, 50);
  }, []);

  const goTo = useCallback(
    (index: number) => {
      setActive(index);
      startProgress();
    },
    [startProgress]
  );

  const goNext = useCallback(
    () => goTo((active + 1) % items.length),
    [active, goTo, items.length]
  );
  const goPrev = useCallback(
    () => goTo((active - 1 + items.length) % items.length),
    [active, goTo, items.length]
  );

  // Auto-advance
  useEffect(() => {
    if (items.length <= 1) return;
    startProgress();
    intervalRef.current = setInterval(goNext, INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  // Reiniciar timer cuando el usuario navega manualmente
  const handleManual = useCallback(
    (fn: () => void) => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
      fn();
      intervalRef.current = setInterval(goNext, INTERVAL);
    },
    [goNext]
  );

  if (items.length === 0) {
    return (
      <div className="aspect-[21/8] bg-stone-900 flex items-center justify-center">
        <span className="text-stone-500 font-semibold text-sm">Sin imágenes cargadas</span>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-[4/5] md:aspect-[21/8] overflow-hidden bg-stone-900 select-none">
      {/* Admin tools */}
      {isAdmin && (
        <div className="absolute top-4 right-4 z-30">
          <CarouselAdminTools compact />
        </div>
      )}

      {/* ── Slides (crossfade limpio) ── */}
      {items.map((item, i) => {
        const desktopUrl = getGoogleDriveProxyImageUrl(item.imageDesktop);
        const mobileUrl = getGoogleDriveProxyImageUrl(item.imageMobile || item.imageDesktop);

        return (
        <div
          key={item.id ?? i}
          aria-hidden={i !== active}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            i === active ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
        >
          {desktopUrl && (
            <picture>
              {mobileUrl && (
                <source
                  media="(max-width: 767px)"
                  srcSet={mobileUrl}
                />
              )}
              <img
                src={desktopUrl}
                alt={item.alt}
                className="w-full h-full object-cover"
                loading={i === 0 ? "eager" : "lazy"}
                draggable={false}
              />
            </picture>
          )}

          {/* Gradiente inferior */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />

          {/* Contenido: Título, Descripción y CTA a la izquierda */}
          {i === active && (item.title || item.description || item.link) && (
            <div className="absolute inset-0 flex items-center pointer-events-none z-20">
              <div className="w-full md:w-1/2 px-6 md:px-12 flex flex-col justify-center pointer-events-auto">
                {/* Título */}
                {item.title && (
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 animate-in fade-in slide-in-from-left-4 duration-700 drop-shadow-lg">
                    {item.title}
                  </h1>
                )}

                {/* Descripción */}
                {item.description && (
                  <p className="text-lg md:text-xl text-white/90 mb-8 font-medium animate-in fade-in slide-in-from-left-4 duration-700 delay-100 drop-shadow-md max-w-md">
                    {item.description}
                  </p>
                )}

                {/* CTA */}
                {item.link && (
                  <div className="animate-in fade-in slide-in-from-left-4 duration-700 delay-200 w-fit">
                    <a
                      href={item.link}
                      className="group inline-flex items-center gap-2 rounded-full bg-amber-400 hover:bg-amber-300 px-7 py-3 text-sm md:text-base font-black text-stone-900 shadow-[0_6px_28px_rgba(0,0,0,0.35)] transition-all duration-200 hover:shadow-[0_10px_36px_rgba(0,0,0,0.45)] hover:-translate-y-0.5 focus:outline-none"
                    >
                      {item.buttonText || "Descubre Más"}
                      <ChevronRight size={17} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        );
      })}

      {/* ── Controles (solo si hay más de 1 slide) ── */}
      {items.length > 1 && (
        <>
          {/* Flecha izquierda */}
          <button
            type="button"
            aria-label="Imagen anterior"
            onClick={() => handleManual(goPrev)}
            className="absolute left-3 md:left-5 top-1/2 -translate-y-1/2 z-20 h-10 w-10 md:h-11 md:w-11 rounded-full bg-black/25 text-white backdrop-blur-[2px] border border-white/15 flex items-center justify-center transition-all duration-200 hover:bg-black/45 hover:border-white/30 hover:scale-105 focus:outline-none"
          >
            <ChevronLeft size={20} />
          </button>

          {/* Flecha derecha */}
          <button
            type="button"
            aria-label="Imagen siguiente"
            onClick={() => handleManual(goNext)}
            className="absolute right-3 md:right-5 top-1/2 -translate-y-1/2 z-20 h-10 w-10 md:h-11 md:w-11 rounded-full bg-black/25 text-white backdrop-blur-[2px] border border-white/15 flex items-center justify-center transition-all duration-200 hover:bg-black/45 hover:border-white/30 hover:scale-105 focus:outline-none"
          >
            <ChevronRight size={20} />
          </button>

          {/* ── Indicador inferior: número + barra de progreso + dots ── */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2">
            {/* Dots + número */}
            <div className="flex items-center gap-2">
              {items.map((_, i) => (
                <button
                  key={`dot-${i}`}
                  type="button"
                  aria-label={`Ir a imagen ${i + 1}`}
                  onClick={() => handleManual(() => goTo(i))}
                  className={`rounded-full transition-all duration-300 focus:outline-none ${
                    i === active
                      ? "w-6 h-[5px] bg-white"
                      : "w-[5px] h-[5px] bg-white/40 hover:bg-white/65"
                  }`}
                />
              ))}
            </div>

            {/* Barra de progreso del slide activo */}
            <div className="w-28 md:w-36 h-[2px] rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-none"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}