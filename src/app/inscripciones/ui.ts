// Estilos y utilidades compartidas por las pantallas de inscripción.

export const INPUT_CLASS =
  'w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base text-brand-ink outline-none transition-colors placeholder:text-stone-500 hover:border-stone-400 focus:border-brand-brown focus:ring-4 focus:ring-brand-gold/25 disabled:bg-stone-100';
export const LABEL_CLASS = 'mb-1.5 block text-sm font-bold text-brand-ink';
export const HELP_CLASS = 'm-0 mt-1.5 max-w-none text-left text-sm leading-relaxed text-brand-ink/65';
export const PRIMARY_BUTTON =
  'inline-flex items-center justify-center gap-2 rounded-full bg-brand-brown px-6 py-3 text-base font-bold text-white no-underline transition-colors hover:bg-brand-wood focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-brown disabled:cursor-not-allowed disabled:opacity-60';
export const SECONDARY_BUTTON =
  'inline-flex items-center justify-center gap-2 rounded-full border border-brand-brown/20 bg-white px-5 py-2.5 text-sm font-bold text-brand-brown no-underline transition-colors hover:bg-brand-brown hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-brown disabled:opacity-60';
export const TEXT_BUTTON =
  'inline-flex items-center gap-1.5 rounded text-sm font-bold text-brand-brown underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-brown disabled:opacity-60';
export const CARD_CLASS = 'rounded-2xl bg-white shadow-[0_10px_28px_-18px_rgba(58,21,8,0.4)] ring-1 ring-brand-brown/10';
export const ERROR_CLASS = 'm-0 max-w-none rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-left text-sm font-medium text-red-800';
export const NOTICE_CLASS = 'm-0 max-w-none rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-left text-sm font-medium text-emerald-900';

export const ROL_LABEL: Record<string, string> = {
  participante: 'Niño/adolescente',
  area: 'Integrante de un área',
  animador: 'Animador/a',
  acompanante: 'Acompañante',
};

export const AREA_LABEL: Record<string, string> = {
  animacion: 'Animación',
  comunicacion: 'Comunicación',
  formacion: 'Formación',
  logistica: 'Logística',
  espiritualidad: 'Espiritualidad',
};

export const ESTADO_LABEL: Record<string, string> = {
  pendiente: 'Pendiente de autorización',
  confirmada: 'Confirmada',
  lista_espera: 'En lista de espera',
  cancelada: 'Cancelada',
};

export async function postJson<T = Record<string, unknown>>(
  url: string,
  body: unknown,
  method: 'POST' | 'PUT' = 'POST',
): Promise<{ ok: true; data: T } | { ok: false; error: string; status: number }> {
  try {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok) return { ok: true, data: data as T };
    return { ok: false, error: data.error || 'Algo salió mal. Probá de nuevo.', status: response.status };
  } catch {
    return { ok: false, error: 'No hay conexión. Revisá tu internet y probá de nuevo.', status: 0 };
  }
}

/** Fecha de hoy según el dispositivo, como YYYY-MM-DD. */
export function localTodayYmd(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function ageOn(birthYmd: string, onYmd: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthYmd)) return null;
  const [by, bm, bd] = birthYmd.split('-').map(Number);
  const [oy, om, od] = onYmd.split('-').map(Number);
  let age = oy - by;
  if (om < bm || (om === bm && od < bd)) age -= 1;
  return age;
}

export function formatFecha(ymd: string): string {
  const [year, month, day] = ymd.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}
