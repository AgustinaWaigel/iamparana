import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, Download } from 'lucide-react';
import { AREA_THEME, type AreaKey } from '@/app/components/common/area-theme';

export interface MediaItem {
  src: string;
  alt: string;
  href: string;
  /** Texto del botón, p. ej. "Descargar" o "Ver Fano". */
  action: string;
  /** true: descarga el archivo; false: abre el enlace en otra pestaña. */
  download?: boolean;
}

/** Grilla de imágenes con una acción cada una (logos, carpetas de dibujos). */
export function MediaGallery({ items }: { items: MediaItem[] }) {
  return (
    <ul className="m-0 grid list-none grid-cols-2 gap-4 p-0 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => (
        <li
          key={item.src}
          className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_10px_28px_-18px_rgba(58,21,8,0.4)] ring-1 ring-brand-brown/10 transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_22px_40px_-20px_rgba(58,21,8,0.5)] motion-reduce:transform-none"
        >
          <div className="flex aspect-square items-center justify-center bg-white p-4">
            <Image
              src={item.src}
              alt={item.alt}
              width={800}
              height={800}
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="h-full w-full object-contain"
            />
          </div>
          <div className="mt-auto border-t border-brand-brown/10 p-3">
            <a
              href={item.href}
              {...(item.download ? { download: true } : { target: '_blank', rel: 'noopener noreferrer' })}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-yellow-300 px-4 py-2.5 text-center text-sm font-bold text-brand-ink no-underline transition-colors hover:bg-yellow-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-brown"
            >
              {item.download ? <Download size={16} aria-hidden /> : <ArrowUpRight size={16} aria-hidden />}
              {item.action}
              {!item.download && <span className="sr-only">(se abre en una pestaña nueva)</span>}
            </a>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Aviso legal al pie de las galerías. */
export function MediaNotice({ children }: { children: React.ReactNode }) {
  return (
    <p className="m-0 mt-12 max-w-3xl border-l-2 border-brand-brown/20 pl-4 text-left text-sm italic leading-relaxed text-brand-ink/70">
      {children}
    </p>
  );
}

/** Enlace de regreso a la página principal del área. */
export function BackToArea({ area }: { area: AreaKey }) {
  const theme = AREA_THEME[area];
  return (
    <div className="mt-10">
      <Link
        href={theme.href}
        className="inline-flex items-center gap-2 rounded-full border border-brand-brown/20 px-4 py-2 text-sm font-bold text-brand-brown no-underline transition-colors hover:bg-brand-brown hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-brown"
      >
        <ArrowLeft size={15} aria-hidden />
        Volver a {theme.label}
      </Link>
    </div>
  );
}
