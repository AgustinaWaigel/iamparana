'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowRight, ArrowUpRight, BookOpen, FileText, Heart, Link2, Pencil, SearchX, Trash2, FolderOpen, type LucideIcon } from 'lucide-react';
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
  if (card.kind === 'resource-page') return BookOpen;
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
}

export function ResourceToolbar({ heading = 'Recursos', description, searchTerm, onSearchChange, placeholder, resultCount }: ResourceToolbarProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
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
  );
}

export function ResourceGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">{children}</div>;
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
  // El ::after del enlace cubre toda la tarjeta, así el recurso se abre desde cualquier punto.
  const actionClass = `mt-4 inline-flex items-center gap-1.5 self-start text-sm font-bold no-underline after:absolute after:inset-0 after:rounded-2xl after:content-[''] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset ${theme.accentText} ${theme.focusRing}`;
  const arrowClass = 'transition-transform duration-300 ease-out group-hover:translate-x-1 motion-reduce:transform-none';

  return (
    <article
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-white text-left shadow-[0_10px_28px_-18px_rgba(58,21,8,0.4)] ring-1 ring-brand-brown/10 transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_22px_40px_-20px_rgba(58,21,8,0.5)] animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards motion-reduce:animate-none motion-reduce:transform-none"
    >
      <div className={`relative aspect-[16/9] overflow-hidden ${theme.tint}`}>
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
          <div
            className={`flex h-full w-full items-center justify-center bg-blend-multiply ${theme.tint}`}
            style={{ backgroundImage: 'url("/assets/textures/areasg.webp")', backgroundSize: '460px' }}
          >
            <span className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm transition-transform duration-300 ease-out group-hover:scale-105 motion-reduce:transform-none ${theme.accentText}`}>
              <Icon size={30} strokeWidth={1.75} aria-hidden />
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] ${theme.accentText}`}>
          <Icon size={13} strokeWidth={2.25} aria-hidden />
          {card.badge}
        </span>
        <h3 className="m-0 mt-2 line-clamp-2 w-full text-left font-display text-[19px] font-bold leading-snug text-brand-ink">
          {card.title}
        </h3>
        <p className="m-0 mt-2 line-clamp-3 w-full max-w-none flex-1 text-left text-sm leading-relaxed text-brand-ink/65">
          {card.description}
        </p>

        {card.kind === 'text-prayer' ? (
          <button type="button" onClick={onOpen} className={actionClass}>
            Leer oración
            <ArrowRight size={16} className={arrowClass} aria-hidden />
          </button>
        ) : isInternal ? (
          <Link href={card.href} className={actionClass}>
            {card.kind === 'link' ? 'Abrir enlace' : 'Ver recurso'}
            <ArrowRight size={16} className={arrowClass} aria-hidden />
          </Link>
        ) : (
          <a href={card.href} target="_blank" rel="noopener noreferrer" className={actionClass}>
            {card.kind === 'link' ? 'Abrir enlace' : 'Ver recurso'}
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
