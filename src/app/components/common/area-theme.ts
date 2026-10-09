// Sistema visual compartido por las páginas de área (Formación, Animación,
// Espiritualidad, Comunicación y Logística). Cada área conserva su color
// histórico; acá se definen una sola vez para que las cinco se vean iguales.

export type AreaKey = 'formacion' | 'animacion' | 'espiritualidad' | 'comunicacion' | 'logistica';

export interface AreaTheme {
  label: string;
  href: string;
  /** Bajada corta del área; es la misma descripción que usa cada página. */
  summary: string;
  /** Lo que hay adentro del área, en pocas palabras: se muestra en los accesos del inicio. Mantenerlo al día. */
  incluye: string[];
  /** Mosaico de color pleno (accesos del inicio). */
  tile: string;
  /** Capas de color que se multiplican sobre la textura de la portada. */
  heroOverlay: string;
  heroText: string;
  heroTabIdle: string;
  heroTabActive: string;
  heroFocus: string;
  /** Color de acento legible sobre blanco (enlaces, etiquetas). */
  accentText: string;
  /** Fondo suave para miniaturas sin imagen y estados vacíos. */
  tint: string;
  focusRing: string;
}

// El orden replica el del menú "Recursos" del encabezado.
export const AREA_ORDER: AreaKey[] = ['formacion', 'animacion', 'espiritualidad', 'comunicacion', 'logistica'];

export const AREA_THEME: Record<AreaKey, AreaTheme> = {
  formacion: {
    label: 'Formación',
    href: '/formacion',
    summary: 'Materiales, documentos y propuestas de formación para animadores.',
    incluye: ['Temas del año', 'Escuela con Jesús', 'Materiales'],
    tile: 'bg-yellow-400 text-brand-brown hover:bg-yellow-300 focus-visible:outline-brand-brown',
    heroOverlay: 'rgba(250, 204, 21, 0.92), rgba(234, 179, 8, 0.92)',
    heroText: 'text-brand-brown',
    heroTabIdle: 'bg-brand-brown/10 text-brand-brown hover:bg-brand-brown/20',
    heroTabActive: 'bg-brand-brown text-yellow-300',
    heroFocus: 'focus-visible:outline-brand-brown',
    accentText: 'text-amber-800',
    tint: 'bg-amber-100',
    focusRing: 'focus-visible:after:ring-amber-700',
  },
  animacion: {
    label: 'Animación',
    href: '/animacion',
    summary: 'Juegos, canciones, dinámicas y recursos para animar encuentros.',
    incluye: ['Canciones', 'Juegos', 'Música y videos'],
    tile: 'bg-emerald-700 text-white hover:bg-emerald-800 focus-visible:outline-emerald-800',
    heroOverlay: 'rgba(20, 83, 45, 0.92), rgba(21, 128, 61, 0.9)',
    heroText: 'text-white',
    heroTabIdle: 'bg-black/15 text-white hover:bg-black/25',
    heroTabActive: 'bg-white text-emerald-800',
    heroFocus: 'focus-visible:outline-white',
    accentText: 'text-emerald-800',
    tint: 'bg-emerald-100',
    focusRing: 'focus-visible:after:ring-emerald-700',
  },
  espiritualidad: {
    label: 'Espiritualidad',
    href: '/espiritualidad',
    summary: 'Oraciones, guiones litúrgicos y recursos para profundizar en la espiritualidad.',
    incluye: ['Rosario Misionero', 'Oraciones', 'Guiones', 'Fiestas del mes'],
    tile: 'bg-stone-700 text-white hover:bg-stone-800 focus-visible:outline-stone-800',
    heroOverlay: 'rgba(41, 37, 36, 0.92), rgba(87, 83, 78, 0.9)',
    heroText: 'text-white',
    heroTabIdle: 'bg-black/20 text-white hover:bg-black/30',
    heroTabActive: 'bg-white text-stone-800',
    heroFocus: 'focus-visible:outline-white',
    accentText: 'text-stone-700',
    tint: 'bg-stone-200',
    focusRing: 'focus-visible:after:ring-stone-600',
  },
  comunicacion: {
    label: 'Comunicación',
    href: '/comunicacion',
    summary: 'Documentos, enlaces y recursos gráficos para la comunicación.',
    incluye: ['Recursos gráficos', 'Merch', 'Fotos de eventos', 'Mandá tu noticia'],
    tile: 'bg-blue-700 text-white hover:bg-blue-800 focus-visible:outline-blue-800',
    heroOverlay: 'rgba(30, 64, 175, 0.92), rgba(37, 99, 235, 0.9)',
    heroText: 'text-white',
    heroTabIdle: 'bg-black/15 text-white hover:bg-black/25',
    heroTabActive: 'bg-white text-blue-800',
    heroFocus: 'focus-visible:outline-white',
    accentText: 'text-blue-700',
    tint: 'bg-blue-100',
    focusRing: 'focus-visible:after:ring-blue-700',
  },
  logistica: {
    label: 'Logística',
    href: '/logistica',
    summary: 'Resumen de gastos y transparencia en eventos realizados.',
    incluye: ['Cuentas claras', 'Documentos'],
    tile: 'bg-red-700 text-white hover:bg-red-800 focus-visible:outline-red-800',
    heroOverlay: 'rgba(153, 27, 27, 0.92), rgba(220, 38, 38, 0.9)',
    heroText: 'text-white',
    heroTabIdle: 'bg-black/15 text-white hover:bg-black/25',
    heroTabActive: 'bg-white text-red-800',
    heroFocus: 'focus-visible:outline-white',
    accentText: 'text-red-700',
    tint: 'bg-red-100',
    focusRing: 'focus-visible:after:ring-red-700',
  },
};
