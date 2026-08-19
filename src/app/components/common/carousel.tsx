"use client";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
  tag?: string;
  link?: string | null;
  buttonText?: string;
}

interface CarouselProps {
  initialItems?: any[];
  isAdmin?: boolean;
}

const INTERVAL = 6500;

export default function Carousel({ initialItems = [], isAdmin = false }: CarouselProps) {
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const items: CarouselItem[] = useMemo(() => initialItems
    .map((item) => ({
      id: item.id,
      imageDesktop: item.imageDesktop || item.imagedesktop || "",
      imageMobile: item.imageMobile || item.imagemobile || item.imageDesktop || item.imagedesktop || "",
      alt: item.alt || "",
      title: typeof item.title === "string" ? item.title.trim() : "",
      description: typeof item.description === "string" ? item.description.trim() : "",
      tag: typeof item.tag === "string" ? item.tag.trim() : "",
      link: typeof item.link === "string" && item.link.trim() !== "" ? item.link.trim() : null,
      buttonText: typeof item.buttonText === "string" ? item.buttonText.trim() : "",
    }))
    .filter((item) => item.imageDesktop !== ""), [initialItems]);

  const startProgress = useCallback(() => {
    setProgress(0);
    if (progressRef.current) clearInterval(progressRef.current);
    const step = 100 / (INTERVAL / 50);
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

  const goNext = useCallback(() => {
    setActive((current) => (current + 1) % items.length);
    startProgress();
  }, [items.length, startProgress]);
  const goPrev = useCallback(() => {
    setActive((current) => (current - 1 + items.length) % items.length);
    startProgress();
  }, [items.length, startProgress]);

  useEffect(() => {
    if (active >= items.length && items.length > 0) setActive(0);
  }, [active, items.length]);

  useEffect(() => {
    if (items.length <= 1) return;
    startProgress();
    intervalRef.current = setInterval(goNext, INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [goNext, items.length, startProgress]);

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
      <div className="aspect-[21/9] bg-stone-900 flex items-center justify-center">
        <span className="text-stone-500 font-semibold text-sm">Sin imágenes cargadas</span>
      </div>
    );
  }

  const displayActive = active < items.length ? active : 0;
  const activeItem = items[displayActive];
  const activeDesktopUrl = getGoogleDriveProxyImageUrl(activeItem.imageDesktop);
  const activeMobileUrl = getGoogleDriveProxyImageUrl(activeItem.imageMobile || activeItem.imageDesktop);

  return (
    <div className="group relative rounded-[20px] h-[120vw] sm:h-[33vw] overflow-hidden bg-stone-900 select-none">
        {isAdmin && (
          <div className="absolute top-4 right-4 z-30">
            <CarouselAdminTools compact />
          </div>
        )}

        {/* Slides — solo imagen + degradado (el texto va en una capa única, abajo) */}
        <div key={activeItem.id ?? displayActive} className="absolute inset-0 z-10 animate-in fade-in duration-700">
          {activeDesktopUrl && (
            <picture className="block h-full w-full">
              {activeMobileUrl && <source media="(max-width: 767px)" srcSet={activeMobileUrl} />}
              <img
                src={activeDesktopUrl}
                alt={activeItem.alt}
                className="h-full w-full object-cover animate-kenburns"
                loading={displayActive === 0 ? "eager" : "lazy"}
                draggable={false}
              />
            </picture>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-brand-deep via-brand-deep/45 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-deep/70 via-transparent to-transparent" />
        </div>

        {/* Texto del slide activo: CAPA ÚNICA con key={active} → la animación
            se redispara en cada cambio y el estado en reposo es visible. */}
        {activeItem && (activeItem.title || activeItem.description || activeItem.link) && (
          <div
            key={displayActive}
            className="absolute inset-x-0 bottom-0 z-20 p-6 sm:p-8 md:p-11 pointer-events-none animate-in fade-in slide-in-from-bottom-3 duration-700"
          >
            <div className="max-w-2xl pointer-events-auto">
              {activeItem.tag && (
                <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white backdrop-blur-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-gold" />
                  {activeItem.tag}
                </span>
              )}
              {activeItem.title && (
                <h1 className="font-display text-[26px] sm:text-[34px] md:text-[40px] font-extrabold text-white leading-[1.04] mb-3 drop-shadow-sm text-balance">
                  {activeItem.title}
                </h1>
              )}
              {activeItem.description && (
                <p className="text-sm md:text-[15px] text-white/80 mb-5 max-w-xl leading-relaxed">
                  {activeItem.description}
                </p>
              )}
              {activeItem.link && (
                <a
                  href={activeItem.link}
                  className="group/btn inline-flex items-center gap-2 rounded-full bg-white text-brand-deep hover:bg-white/90 px-6 py-2.5 text-sm font-black shadow-lg transition-all duration-200 hover:-translate-y-0.5 focus:outline-none"
                >
                  {activeItem.buttonText || "Ver más"}
                  <ChevronRight size={15} className="transition-transform duration-200 group-hover/btn:translate-x-0.5" />
                </a>
              )}
            </div>
          </div>
        )}

        {/* Controles */}
        {items.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Imagen anterior"
              onClick={() => handleManual(goPrev)}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-white/15 text-white backdrop-blur-sm border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-white/30 focus:outline-none"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              aria-label="Imagen siguiente"
              onClick={() => handleManual(goNext)}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-white/15 text-white backdrop-blur-sm border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-white/30 focus:outline-none"
            >
              <ChevronRight size={18} />
            </button>

            {/* Indicadores con barra de progreso */}
            <div className="absolute bottom-5 sm:bottom-7 right-6 sm:right-8 md:right-11 z-20 flex items-center gap-1.5">
              {items.map((_, i) => (
                <button
                  key={`dot-${i}`}
                  type="button"
                  aria-label={`Ir a imagen ${i + 1}`}
                  onClick={() => handleManual(() => goTo(i))}
                  className="relative h-[3px] rounded-full overflow-hidden bg-white/30 focus:outline-none transition-all duration-300"
                  style={{ width: i === displayActive ? 30 : 12 }}
                >
                  {i === displayActive && (
                    <div
                      className="absolute inset-y-0 left-0 bg-brand-gold rounded-full"
                      style={{ width: `${progress}%`, transition: "width 50ms linear" }}
                    />
                  )}
                  {i < displayActive && <div className="absolute inset-0 bg-white/60 rounded-full" />}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
  );
}
