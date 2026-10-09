'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Children, useRef, useState, type ReactNode } from 'react';
import { Paginacion } from '@/app/components/common/paginacion';
import { ArrowRight, ArrowUpRight, FileText, Heart, Link2, Pencil, SearchX, Trash2, FolderOpen, type LucideIcon } from 'lucide-react';
import { SearchBar } from '@/app/components/common/search-bar';
import { getGoogleDriveProxyImageUrl } from '@/lib/drive-utils';
import { AREA_THEME, type AreaKey } from './area-theme';

// Piezas visuales compartidas por las grillas de recursos de cada área.
// La lógica (búsqueda, edición, borrado) sigue viviendo en cada grilla.

export interface ResourceCardData {
  kind: 'document' | 'link' | 'resource-page' | 'text-prayer';
  title: string;
  description: string;
  href: string;
  badge: string;
  thumbnailUrl?: string | null;
}

function isValidImageSource(value?: string | null): boolean {
  if (!value) return false;
  const src = value.trim().toLowerCase();
  if (!src) return false;
  if (src.startsWith('/')) return true;
  return src.startsWith('http://') || src.startsWith('https://');
}

// Rutas que next.config permite optimizar; el resto se sirve con <img>.
function isOptimizableSource(src: string): boolean {
  return src.startsWith('/api/drive-image') || src.startsWith('/assets/') || src.startsWith('/uploads/');
}

function getCardIcon(card: ResourceCardData): LucideIcon {
  if (card.kind === 'text-prayer' || card.badge === 'Oración') return Heart;
  if (card.kind === 'resource-page') return FolderOpen;
  if (card.kind === 'link') return Link2;
  return FileText;
}

interface ResourceToolbarProps {
  heading?: string;
  description?: string;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  placeholder: string;
  resultCount: number;
  /** Años para filtrar, del más nuevo al más viejo. Con menos de dos, el filtro no se muestra. */
  years?: number[];
  selectedYear?: number | null;
  onYearChange?: (year: number | null) => void;
}

const YEAR_CHIP =
  'rounded-full px-4 py-2 text-sm font-bold tabular-nums transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-brown';

export function ResourceToolbar({ heading = 'Recursos', description, searchTerm, onSearchChange, placeholder, resultCount, years = [], selectedYear = null, onYearChange }: ResourceToolbarProps) {
  const conAnios = years.length > 1 && Boolean(onYearChange);
  return (
    <>
    <div className={`flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-8 ${conAnios ? 'mb-4' : 'mb-6 sm:mb-8'}`}>
      <div className="min-w-0">
        <h2 className="m-0 text-left font-display text-[28px] font-extrabold leading-none tracking-tight text-brand-ink sm:text-[34px]">
          {heading}
        </h2>
        {description && (
          <p className="m-0 mt-2 max-w-xl text-left text-base leading-relaxed text-brand-ink/70">{description}</p>
        )}
        <p aria-live="polite" className="m-0 mt-2 max-w-none text-left text-sm font-medium tabular-nums text-brand-ink/60">
          Mostrando {resultCount} {resultCount === 1 ? 'resultado' : 'resultados'}
        </p>
      </div>
      <SearchBar
        value={searchTerm}
        onChange={onSearchChange}
        placeholder={placeholder}
        className="w-full shrink-0 sm:w-80 lg:w-96"
      />
    </div>
    {conAnios && (
      <div role="group" aria-label="Filtrar por año" className="mb-6 flex flex-wrap gap-2 sm:mb-8">
        {[null, ...years].map((year) => {
          const activo = year === selectedYear;
          return (
            <button
              key={year ?? 'todos'}
              type="button"
              aria-pressed={activo}
              onClick={() => onYearChange?.(year)}
              className={`${YEAR_CHIP} ${activo ? 'bg-brand-brown text-white' : 'bg-white text-brand-ink ring-1 ring-brand-brown/15 hover:bg-brand-brown/10'}`}
            >
              {year ?? 'Todos los años'}
            </button>
          );
        })}
      </div>
    )}
    </>
  );
}

/** Cuántos recursos se ven por página en las grillas de las áreas. */
const POR_PAGINA = 12;

/** Grilla de recursos de un área. Si hay más de una página de tarjetas, las reparte en páginas sola. */
export function ResourceGrid({ children }: { children: ReactNode }) {
  const tarjetas = Children.toArray(children);
  const [pagina, setPagina] = useState(1);
  // Al buscar o filtrar cambia la cantidad de tarjetas: se vuelve a la primera página.
  const [cantidad, setCantidad] = useState(tarjetas.length);
  if (cantidad !== tarjetas.length) {
    setCantidad(tarjetas.length);
    setPagina(1);
  }
  const grilla = useRef<HTMLDivElement>(null);
  const paginas = Math.ceil(tarjetas.length / POR_PAGINA);
  const actual = Math.min(pagina, Math.max(1, paginas));

  const cambiar = (nueva: number) => {
    setPagina(nueva);
    // La página nueva empieza arriba de la grilla, no donde quedó el botón.
    grilla.current?.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };

  return (
    <>
      <div ref={grilla} className="grid scroll-mt-28 grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
        {tarjetas.slice((actual - 1) * POR_PAGINA, actual * POR_PAGINA)}
      </div>
      <Paginacion pagina={actual} paginas={paginas} onCambiar={cambiar} de="recursos" className="mt-8" />
    </>
  );
}

interface ResourceEmptyStateProps {
  area: AreaKey;
  searchTerm: string;
  onClear: () => void;
}

export function ResourceEmptyState({ area, searchTerm, onClear }: ResourceEmptyStateProps) {
  const theme = AREA_THEME[area];
  const isSearching = searchTerm.trim().length > 0;
  const Icon = isSearching ? SearchX : FolderOpen;

  return (
    <div className="flex flex-col items-center rounded-2xl bg-white px-6 py-16 text-center ring-1 ring-brand-brown/10">
      <div className={`flex h-16 w-16 items-center justify-center rounded-full ${theme.tint} ${theme.accentText}`}>
        <Icon size={30} strokeWidth={1.75} aria-hidden />
      </div>
      {isSearching ? (
        <>
          <h3 className="m-0 mt-5 font-display text-xl font-bold text-brand-ink">No encontramos nada</h3>
          <p className="m-0 mt-2 max-w-sm text-base leading-relaxed text-brand-ink/65">
            No hay recursos que coincidan con &quot;{searchTerm}&quot;. Intenta con otras palabras clave.
          </p>
          <button
            type="button"
            onClick={onClear}
            className={`mt-6 rounded-full px-4 py-2 text-sm font-bold underline decoration-2 underline-offset-4 transition-colors hover:bg-brand-brown/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-brown ${theme.accentText}`}
          >
            Limpiar búsqueda
          </button>
        </>
      ) : (
        <>
          <h3 className="m-0 mt-5 font-display text-xl font-bold text-brand-ink">Todavía no hay recursos</h3>
          <p className="m-0 mt-2 max-w-sm text-base leading-relaxed text-brand-ink/65">
            Pronto vamos a sumar materiales en esta sección.
          </p>
        </>
      )}
    </div>
  );
}

interface ResourceCardProps {
  card: ResourceCardData;
  area: AreaKey;
  isAdmin: boolean;
  onEdit: () => void;
  onDelete: () => void;
  /** Solo para oraciones escritas: abre el texto en lugar de navegar. */
  onOpen?: () => void;
  /** Imagen que se muestra cuando el recurso no tiene miniatura propia. */
  fallbackThumbnail?: string;
  /** Posición en la grilla, para escalonar la entrada. */
  index?: number;
}

const ADMIN_BUTTON_CLASS =
  'flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-black/5 transition-transform hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-brown';

export function ResourceCard({ card, area, isAdmin, onEdit, onDelete, onOpen, fallbackThumbnail, index = 0 }: ResourceCardProps) {
  const theme = AREA_THEME[area];
  const Icon = getCardIcon(card);

  const normalizedThumbnailUrl = getGoogleDriveProxyImageUrl(card.thumbnailUrl);
  const thumbnailUrl = isValidImageSource(normalizedThumbnailUrl) ? normalizedThumbnailUrl : fallbackThumbnail || null;

  const isInternal = card.href.startsWith('/');
  // Las páginas de recursos son carpetas con más cosas adentro: se dice distinto que un archivo suelto.
  const esPagina = card.kind === 'resource-page';
  const accion = card.kind === 'text-prayer' ? 'Leer la oración' : esPagina ? 'Entrar' : card.kind === 'link' ? 'Abrir el enlace' : 'Ver el recurso';
  // El ::after del botón cubre toda la tarjeta, así el recurso se abre desde cualquier punto.
  const actionClass = `mt-5 inline-flex items-center gap-2 self-start rounded-full bg-brand-deep px-4 py-2.5 text-sm font-extrabold text-white no-underline after:absolute after:inset-0 after:rounded-2xl after:content-[''] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset ${theme.focusRing}`;
  const arrowClass = 'transition-transform duration-300 ease-out group-hover:translate-x-1 motion-reduce:transform-none';

  return (
    <article
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-white text-left shadow-[0_14px_28px_-22px_rgba(58,21,8,0.7)] transition-transform duration-300 ease-out hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards motion-reduce:animate-none motion-reduce:transform-none"
    >
      <div className={`relative aspect-[16/10] overflow-hidden ${theme.tint}`}>
        {thumbnailUrl ? (
          isOptimizableSource(thumbnailUrl) ? (
            <Image
              src={thumbnailUrl}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04] motion-reduce:transform-none"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumbnailUrl}
              alt=""
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04] motion-reduce:transform-none"
            />
          )
        ) : (
          // Sin miniatura: el color del área con el ícono del tipo de recurso, grande y apenas torcido.
          <div className={`relative flex h-full w-full items-center justify-center overflow-hidden ${theme.solid}`}>
            <Icon aria-hidden strokeWidth={1.4} className="absolute -bottom-6 -right-5 h-[70%] w-[70%] -rotate-12 opacity-20 transition-transform duration-500 ease-out group-hover:rotate-0 group-hover:scale-110 motion-reduce:transform-none" />
            <Icon aria-hidden strokeWidth={1.5} className="relative h-[34%] w-[34%] transition-transform duration-500 ease-out group-hover:-rotate-6 group-hover:scale-110 motion-reduce:transform-none" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <span className={`inline-flex items-center gap-1.5 self-start rounded-full px-3 py-1 text-xs font-extrabold ${theme.solid}`}>
          <Icon size={13} strokeWidth={2.5} aria-hidden />
          {card.badge}
        </span>
        <h3 className="m-0 mt-3 line-clamp-3 w-full text-left font-display text-xl font-extrabold leading-snug text-brand-ink">
          {card.title}
        </h3>
        {card.description && (
          <p className="m-0 mt-2 line-clamp-3 w-full max-w-none text-left text-sm leading-relaxed text-brand-ink/75">
            {card.description}
          </p>
        )}
        <span aria-hidden className="flex-1" />

        {card.kind === 'text-prayer' ? (
          <button type="button" onClick={onOpen} className={actionClass}>
            {accion}
            <ArrowRight size={16} className={arrowClass} aria-hidden />
          </button>
        ) : isInternal ? (
          <Link href={card.href} className={actionClass}>
            {accion}
            <ArrowRight size={16} className={arrowClass} aria-hidden />
          </Link>
        ) : (
          <a href={card.href} target="_blank" rel="noopener noreferrer" className={actionClass}>
            {accion}
            <ArrowUpRight size={16} className={arrowClass} aria-hidden />
            <span className="sr-only">(se abre en una pestaña nueva)</span>
          </a>
        )}
      </div>

      {isAdmin && (
        <div className="absolute right-3 top-3 z-10 flex gap-2">
          <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(); }} aria-label={`Editar ${card.title}`} className={`${ADMIN_BUTTON_CLASS} text-brand-brown`}>
            <Pencil size={15} />
          </button>
          <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }} aria-label={`Eliminar ${card.title}`} className={`${ADMIN_BUTTON_CLASS} text-red-600`}>
            <Trash2 size={15} />
          </button>
        </div>
      )}
    </article>
  );
}
