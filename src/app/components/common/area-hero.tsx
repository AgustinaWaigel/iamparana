import Link from 'next/link';
import { ClipboardList, Flame, GraduationCap, Megaphone, PartyPopper, type LucideIcon } from 'lucide-react';
import { AREA_ORDER, AREA_THEME, type AreaKey } from './area-theme';

const AREA_ICONS: Record<AreaKey, LucideIcon> = {
  formacion: GraduationCap,
  animacion: PartyPopper,
  espiritualidad: Flame,
  comunicacion: Megaphone,
  logistica: ClipboardList,
};

interface AreaHeroProps {
  area: AreaKey;
  title: string;
  description?: string;
}

/** Portada de las páginas de área: título, bajada y accesos a las otras áreas. */
export function AreaHero({ area, title, description }: AreaHeroProps) {
  const theme = AREA_THEME[area];

  return (
    <div
      className={`relative overflow-hidden ${theme.heroText}`}
      style={{
        backgroundImage: `linear-gradient(100deg, ${theme.heroOverlay}), url("/assets/textures/areasg.webp")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundBlendMode: 'multiply',
      }}
    >
      <div className="mx-auto max-w-7xl px-4 pb-6 pt-16 sm:px-6 sm:pb-8 sm:pt-16 md:pt-20">
        <h1 className="m-0 max-w-4xl text-balance text-left font-display text-[clamp(2.5rem,9vw,5.5rem)] font-extrabold leading-[0.95] tracking-[-0.03em] [overflow-wrap:anywhere] animate-in fade-in slide-in-from-bottom-3 duration-700 ease-out fill-mode-backwards motion-reduce:animate-none">
          {title}
        </h1>

        {description && (
          <p className="m-0 mt-4 max-w-2xl text-left text-base font-medium leading-relaxed sm:mt-5 sm:text-lg md:text-xl animate-in fade-in slide-in-from-bottom-2 delay-100 duration-700 ease-out fill-mode-backwards motion-reduce:animate-none">
            {description}
          </p>
        )}

        {/* role="navigation" en un div: las reglas globales de `nav a` son del encabezado. */}
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
      </div>
    </div>
  );
}
