import { Quote } from 'lucide-react';

interface AreaQuoteProps {
  quote: string;
  author: string;
  /** Clase de color para las comillas y la firma, p. ej. "text-yellow-300". */
  accentClass: string;
}

/** Cita de cierre de un área, sobre la misma banda oscura que la agenda del inicio. */
export function AreaQuote({ quote, author, accentClass }: AreaQuoteProps) {
  return (
    <figure
      className="relative m-0 mt-14 overflow-hidden rounded-3xl px-6 py-10 sm:mt-20 sm:px-12 sm:py-14"
      style={{
        backgroundColor: '#3a1508',
        backgroundImage: "url('/assets/header/headerbg.webp')",
        backgroundSize: '520px',
        backgroundBlendMode: 'soft-light',
      }}
    >
      <div className="absolute inset-0 bg-brand-deep/80" />
      <div className="relative">
        <Quote size={36} className={accentClass} strokeWidth={2.5} aria-hidden />
        <p className="m-0 mt-5 max-w-4xl text-balance text-left font-display text-2xl font-bold leading-[1.2] text-white sm:text-3xl md:text-[40px] md:leading-[1.15]">
          &ldquo;{quote}&rdquo;
        </p>
        <figcaption className={`mt-6 flex items-center gap-3 text-sm font-bold uppercase tracking-[0.16em] ${accentClass}`}>
          <span className="h-px w-8 bg-current" aria-hidden />
          {author}
        </figcaption>
      </div>
    </figure>
  );
}
