import type { Metadata } from 'next';
import Link from 'next/link';
import { CalendarDays, Home, Newspaper } from 'lucide-react';

// Página para cuando alguien entra a una dirección que no existe.

export const metadata: Metadata = {
  title: 'No encontramos esa página',
  robots: { index: false, follow: false },
};

const BOTON = 'inline-flex items-center gap-2 rounded-full px-6 py-3 text-base font-extrabold no-underline transition-transform duration-300 ease-out hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transform-none';

export default function NotFound() {
  return (
    <div
      className="relative isolate flex min-h-[calc(100svh-5rem)] items-center overflow-hidden text-white"
      style={{ backgroundColor: '#3a1508', backgroundImage: "url('/assets/header/headerbg.webp')", backgroundSize: '520px', backgroundBlendMode: 'soft-light' }}
    >
      <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_75%_20%,rgba(246,196,69,0.22),transparent_55%),linear-gradient(to_bottom,rgba(98,45,13,0.55),rgba(58,21,8,0.92))]" />
      <div className="mx-auto w-full max-w-4xl px-4 py-16 sm:px-6">
        <div aria-hidden className="mb-6 flex items-center gap-3">
          {['#2e9e4f', '#d62828', '#ffffff', '#2563eb', '#f6c445'].map((color, index) => (
            <span key={color} className="bead block h-4 w-4 rounded-full sm:h-5 sm:w-5" style={{ backgroundColor: color, ['--d' as string]: `${150 + index * 90}ms` }} />
          ))}
        </div>
        <p aria-hidden className="hero-rise m-0 max-w-none text-left font-display text-[clamp(5rem,22vw,11rem)] font-extrabold leading-[0.85] tracking-[-0.05em] text-brand-gold">404</p>
        <h1 className="hero-rise m-0 mt-4 text-balance text-left font-display text-[clamp(2rem,6vw,3.5rem)] font-extrabold leading-[1.02] tracking-[-0.03em] text-white" style={{ ['--d' as string]: '120ms' }}>
          Esta página salió de misión y no volvió
        </h1>
        <p className="hero-rise m-0 mt-5 max-w-xl text-left text-lg leading-relaxed text-white/85" style={{ ['--d' as string]: '240ms' }}>
          No encontramos lo que buscabas. Puede que el enlace esté mal escrito o que la página ya no exista.
        </p>
        <div className="hero-rise mt-8 flex flex-wrap gap-3" style={{ ['--d' as string]: '360ms' }}>
          <Link href="/" className={`${BOTON} bg-brand-gold text-brand-deep`}><Home size={18} aria-hidden /> Ir al inicio</Link>
          <Link href="/noticias" className={`${BOTON} border border-white/30 text-white hover:bg-white/10`}><Newspaper size={18} aria-hidden /> Noticias</Link>
          <Link href="/calendario" className={`${BOTON} border border-white/30 text-white hover:bg-white/10`}><CalendarDays size={18} aria-hidden /> Calendario</Link>
        </div>
      </div>
    </div>
  );
}
