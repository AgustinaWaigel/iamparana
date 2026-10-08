import Link from 'next/link';
import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { AREA_ICONS } from './area-icons';
import { AREA_ORDER, AREA_THEME, type AreaKey } from './area-theme';

export interface AreaCrumb {
  label: string;
  href: string;
}

interface AreaHeroProps {
  area: AreaKey;
  title: string;
  description?: string;
  /**
   * Páginas intermedias entre el área y la página actual. Si se pasa (aunque sea
   * vacío) la portada es de subpágina: muestra la ruta en lugar de las áreas.
   */
  crumbs?: AreaCrumb[];
  /** Textura propia de la página; por defecto, la de las áreas. */
  textureUrl?: string | null;
}

/** Portada de las páginas de área y de todas sus subpáginas. */
export function AreaHero({ area, title, description, crumbs, textureUrl }: AreaHeroProps) {
  const theme = AREA_THEME[area];
  const isSubpage = crumbs !== undefined;
  const trail: AreaCrumb[] = [{ label: 'Inicio', href: '/' }, { label: theme.label, href: theme.href }, ...(crumbs ?? [])];
  const linkFocus = `rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${theme.heroFocus}`;

  // Los títulos de subpágina vienen de la base y pueden ser largos: escala más contenida.
  const titleSize = isSubpage || title.length > 22
    ? 'text-[clamp(2rem,6.5vw,3.75rem)] leading-[1.02]'
    : 'text-[clamp(2.5rem,9vw,5.5rem)] leading-[0.95]';

  return (
    <div
      className={`relative overflow-hidden ${theme.heroText}`}
      style={{
        // La textura de las áreas es tenue y se multiplica entera; una textura propia
        // puede ser muy marcada, así que va en una capa aparte y atenuada.
        backgroundImage: textureUrl
          ? `linear-gradient(100deg, ${theme.heroOverlay})`
          : `linear-gradient(100deg, ${theme.heroOverlay}), url("/assets/textures/areasg.webp")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundBlendMode: 'multiply',
      }}
    >
      {textureUrl && (
        <div
          aria-hidden
          className="absolute inset-0 opacity-20 mix-blend-multiply"
          style={{ backgroundImage: `url("${textureUrl}")`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
      )}
      <div className={`relative mx-auto max-w-7xl px-4 pt-16 sm:px-6 md:pt-20 ${isSubpage ? 'pb-10 sm:pb-12' : 'pb-6 sm:pb-8'}`}>
        {isSubpage && (
          // role="navigation" en un div: las reglas globales de `nav a` son del encabezado.
          <div role="navigation" aria-label="Ruta de navegación" className="mb-4">
            <ol className="m-0 flex list-none flex-wrap items-center gap-x-1.5 gap-y-1 p-0 text-sm font-bold">
              {trail.map((crumb, index) => (
                <li key={crumb.href} className="flex items-center gap-1.5">
                  {index > 0 && <ChevronRight size={14} className="opacity-60" aria-hidden />}
                  <Link href={crumb.href} className={`no-underline opacity-80 transition-opacity hover:underline hover:opacity-100 ${linkFocus}`}>
                    {crumb.label}
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        )}

        <h1 className={`m-0 max-w-4xl text-balance text-left font-display font-extrabold tracking-[-0.03em] [overflow-wrap:anywhere] animate-in fade-in slide-in-from-bottom-3 duration-700 ease-out fill-mode-backwards motion-reduce:animate-none ${titleSize}`}>
          {title}
        </h1>

        {description && (
          <p className="m-0 mt-4 max-w-2xl text-left text-base font-medium leading-relaxed sm:mt-5 sm:text-lg md:text-xl animate-in fade-in slide-in-from-bottom-2 delay-100 duration-700 ease-out fill-mode-backwards motion-reduce:animate-none">
            {description}
          </p>
        )}

        {!isSubpage && (
          <div role="navigation" aria-label="Áreas de IAM" className="mt-8 flex flex-wrap gap-2 sm:mt-10">
            {AREA_ORDER.map((key) => {
              const item = AREA_THEME[key];
              const Icon = AREA_ICONS[key];
              const isCurrent = key === area;

              return (
                <Link
                  key={key}
                  href={item.href}
                  aria-current={isCurrent ? 'page' : undefined}
                  className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-bold no-underline transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${theme.heroFocus} ${isCurrent ? theme.heroTabActive : theme.heroTabIdle}`}
                >
                  <Icon size={16} strokeWidth={2.25} aria-hidden />
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/** Fondo y ancho de contenido comunes a toda página de área. */
export function AreaPage({ hero, children, narrow = false }: { hero: ReactNode; children: ReactNode; narrow?: boolean }) {
  return (
    <div className="min-h-screen bg-brand-paper">
      {hero}
      <div className={`mx-auto px-4 pb-16 pt-8 sm:px-6 sm:pb-20 sm:pt-12 ${narrow ? 'max-w-3xl' : 'max-w-7xl'}`}>{children}</div>
    </div>
  );
}
