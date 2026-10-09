// Fechas y categorías de las noticias, para mostrarlas igual en el listado y en cada nota.
// Vive dentro de src/app porque nombra clases de color: Tailwind solo genera las que encuentra ahí.

const ZONA = 'America/Argentina/Buenos_Aires';

/**
 * Las fechas se guardaron de varias formas: "22/8/2026", "2026-08-22" o con hora ("2026-08-23T01:30:00Z").
 * Las que no traen hora se toman como el mediodía de Argentina, para que no se corran de día.
 */
export function parseFechaNoticia(fecha: string): Date | null {
  if (!fecha) return null;
  const partes = fecha.split('/');
  if (partes.length === 3) {
    const [dia, mes, anio] = partes.map(Number);
    return new Date(Date.UTC(anio, mes - 1, dia, 15));
  }
  const soloDia = fecha.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (soloDia) return new Date(Date.UTC(Number(soloDia[1]), Number(soloDia[2]) - 1, Number(soloDia[3]), 15));
  const otra = new Date(fecha);
  return Number.isNaN(otra.getTime()) ? null : otra;
}

/** "22 de agosto de 2026", siempre según la hora de Argentina; si la fecha no se entiende, se muestra como está guardada. */
export function fechaLargaNoticia(fecha: string): string {
  const dia = parseFechaNoticia(fecha);
  return dia ? dia.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: ZONA }) : fecha;
}

// Un color para cada categoría, siempre el mismo para el mismo nombre.
// Son los cinco colores misioneros: rojo, azul, verde, amarillo y blanco.
const COLORES = ['bg-red-600 text-white', 'bg-blue-700 text-white', 'bg-emerald-700 text-white', 'bg-yellow-400 text-brand-deep', 'bg-white text-brand-deep ring-1 ring-inset ring-brand-deep/30'];

// Las categorías de siempre tienen su color fijo, para que no se repitan entre sí.
const FIJOS: Record<string, string> = {
  arquidiocesis: COLORES[0],
  nacional: COLORES[1],
  encuentros: COLORES[2],
  internacional: COLORES[3],
  iglesia: COLORES[4],
};

export function colorDeCategoria(categoria: string): string {
  const clave = categoria.normalize('NFD').replace(/\p{M}+/gu, '').trim().toLowerCase();
  if (FIJOS[clave]) return FIJOS[clave];
  return COLORES[[...clave].reduce((suma, letra) => (suma * 31 + letra.charCodeAt(0)) >>> 0, 7) % COLORES.length];
}

/** "ENCUENTROS" → "Encuentros". */
export function nombreDeCategoria(categoria: string): string {
  const limpia = categoria.trim().toLowerCase();
  return limpia.charAt(0).toUpperCase() + limpia.slice(1);
}
