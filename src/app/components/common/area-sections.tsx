import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowRight, ArrowUpRight, Download, FileText, Link2, PlayCircle, type LucideIcon } from 'lucide-react';
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
  children: ReactNode;
}

export function AreaSection({ title, meta, description, actions, children }: AreaSectionProps) {
  return (
    <section className="group/section mt-12 first:mt-0 sm:mt-16">
      <div className="mb-5 flex items-end justify-between gap-4 border-b border-brand-brown/15 pb-3">
        <div className="min-w-0">
          <h2 className="m-0 text-left font-display text-2xl font-extrabold leading-tight tracking-tight text-brand-ink sm:text-[28px]">
            {title}
          </h2>
          {description && <p className="m-0 mt-1.5 max-w-2xl text-left text-base leading-relaxed text-brand-ink/70">{description}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {meta && <span className="text-sm font-semibold tabular-nums text-brand-ink/60">{meta}</span>}
          {actions}
        </div>
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

  return (
    <article className={`group relative flex h-full gap-4 rounded-2xl bg-white p-4 ${description || label ? "items-start" : "items-center"} shadow-[0_10px_28px_-20px_rgba(58,21,8,0.4)] ring-1 ring-brand-brown/10 transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_18px_34px_-20px_rgba(58,21,8,0.5)] motion-reduce:transform-none sm:p-5`}>
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${theme.tint} ${theme.accentText}`}>
        <Icon size={20} strokeWidth={2} aria-hidden />
      </span>

      <div className="min-w-0 flex-1">
        <h3 className="m-0 text-left text-base font-bold leading-snug [overflow-wrap:anywhere]">
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
        {label && (
          <p className={`m-0 mt-1 max-w-none text-left text-[11px] font-bold uppercase tracking-[0.12em] ${theme.accentText}`}>{label}</p>
        )}
        {description && (
          <p className="m-0 mt-2 line-clamp-3 max-w-none text-left text-sm leading-relaxed text-brand-ink/65">{description}</p>
        )}
      </div>

      <Arrow
        size={18}
        aria-hidden
        className={`shrink-0 transition-transform duration-300 ease-out group-hover:translate-x-0.5 motion-reduce:transform-none ${theme.accentText}`}
      />

      {overlay && <div className="absolute right-2 top-2 z-10">{overlay}</div>}
    </article>
  );
}
