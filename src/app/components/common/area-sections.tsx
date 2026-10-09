import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowRight, ArrowUpRight, Download, FileText, FolderOpen, Link2, PlayCircle, type LucideIcon } from 'lucide-react';
import { AREA_THEME, type AreaKey } from './area-theme';

// Bloques de contenido de las subpáginas de área: sección con título y
// tarjetas-enlace. Sin estado, sirven en componentes de servidor y de cliente.

interface AreaSectionProps {
  title: string;
  /** Texto chico junto al título, p. ej. "4 recursos". */
  meta?: string;
  description?: string;
  /** Controles a la derecha del título (acciones de administración). */
  actions?: ReactNode;
  /** Si se pasa, el título lleva una carpeta con el color del área. */
  area?: AreaKey;
  children: ReactNode;
}

export function AreaSection({ title, meta, description, actions, area, children }: AreaSectionProps) {
  return (
    <section className="group/section mt-12 first:mt-0 sm:mt-16">
      <div className="mb-5 flex items-center gap-4 sm:mb-6">
        {area && (
          <span aria-hidden className={`flex h-12 w-12 shrink-0 -rotate-6 items-center justify-center rounded-xl sm:h-14 sm:w-14 ${AREA_THEME[area].solid}`}>
            <FolderOpen className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={1.9} />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="m-0 text-balance text-left font-display text-[clamp(1.6rem,3.6vw,2.25rem)] font-extrabold leading-[1.05] tracking-[-0.02em] text-brand-ink">
            {title}
          </h2>
          {meta && <p className="m-0 mt-1 max-w-none text-left text-sm font-bold tabular-nums text-brand-ink/65">{meta}</p>}
          {description && <p className="m-0 mt-1.5 max-w-2xl text-left text-base leading-relaxed text-brand-ink/75">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
      </div>
      {children}
    </section>
  );
}

export function LinkGrid({ children, columns = 3 }: { children: ReactNode; columns?: 2 | 3 }) {
  return (
    <div className={`grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 ${columns === 3 ? 'lg:grid-cols-3' : ''}`}>{children}</div>
  );
}

export function SectionNote({ children }: { children: ReactNode }) {
  return (
    <p className="col-span-full m-0 max-w-none rounded-2xl border border-dashed border-brand-brown/20 px-5 py-8 text-center text-base text-brand-ink/60">
      {children}
    </p>
  );
}

export type LinkCardKind = 'doc' | 'link' | 'video' | 'download' | 'page';

const KIND_ICON: Record<LinkCardKind, LucideIcon> = {
  doc: FileText,
  link: Link2,
  video: PlayCircle,
  download: Download,
  page: FileText,
};

interface LinkCardProps {
  area: AreaKey;
  title: string;
  href: string;
  kind?: LinkCardKind;
  /** Etiqueta chica bajo el título, p. ej. "Documento". */
  label?: string;
  description?: string | null;
  /** Reemplaza el ícono por defecto del tipo. */
  icon?: LucideIcon;
  /** Controles superpuestos (acciones de administración). */
  overlay?: ReactNode;
}

/** Enlace a un recurso presentado como tarjeta: toda la superficie es clicable. */
export function LinkCard({ area, title, href, kind = 'doc', label, description, icon, overlay }: LinkCardProps) {
  const theme = AREA_THEME[area];
  const Icon = icon ?? KIND_ICON[kind];
  const isInternal = href.startsWith('/') && kind !== 'download';
  const Arrow = kind === 'download' ? Download : isInternal ? ArrowRight : ArrowUpRight;

  // El ::after del enlace cubre toda la tarjeta.
  const linkClass = `no-underline text-brand-ink after:absolute after:inset-0 after:rounded-2xl after:content-[''] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset ${theme.focusRing}`;
  const abrir = kind === 'download' ? 'Descargar' : kind === 'video' ? 'Ver el video' : kind === 'link' ? 'Abrir el enlace' : kind === 'page' ? 'Entrar' : 'Abrir el documento';

  return (
    <article className="group relative flex h-full items-start gap-4 rounded-2xl bg-white p-4 shadow-[0_14px_28px_-22px_rgba(58,21,8,0.7)] transition-transform duration-300 ease-out hover:-translate-y-1 motion-reduce:transform-none sm:p-5">
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 ease-out group-hover:-rotate-6 motion-reduce:transform-none ${theme.solid}`}>
        <Icon size={22} strokeWidth={2} aria-hidden />
      </span>

      <div className="min-w-0 flex-1">
        <h3 className="m-0 text-left font-display text-lg font-extrabold leading-snug [overflow-wrap:anywhere]">
          {isInternal ? (
            <Link href={href} className={linkClass}>{title}</Link>
          ) : kind === 'download' ? (
            <a href={href} download className={linkClass}>{title}</a>
          ) : (
            <a href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
              {title}
              <span className="sr-only"> (se abre en una pestaña nueva)</span>
            </a>
          )}
        </h3>
        {description && (
          <p className="m-0 mt-1 line-clamp-3 max-w-none text-left text-sm leading-relaxed text-brand-ink/75">{description}</p>
        )}
        {/* Qué es y qué pasa al tocarlo, en una sola línea. */}
        <p className={`m-0 mt-2 flex max-w-none flex-wrap items-center gap-x-1.5 text-left text-sm font-bold ${theme.accentText}`}>
          {label && label !== 'Documento' && label !== 'Enlace' && <span className="text-brand-ink/65">{label} ·</span>}
          {abrir}
          <Arrow size={16} aria-hidden className="transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transform-none" />
        </p>
      </div>

      {overlay && <div className="absolute right-2 top-2 z-10">{overlay}</div>}
    </article>
  );
}
