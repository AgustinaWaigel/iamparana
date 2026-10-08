// Grados y años escolares que se pueden elegir al inscribir a un menor.
// Es una lista cerrada para que los totales por grado del admin sean confiables.

export const GRADOS = [
  'Jardín',
  '1° grado',
  '2° grado',
  '3° grado',
  '4° grado',
  '5° grado',
  '6° grado',
  '7° grado',
  '1° año',
  '2° año',
  '3° año',
  '4° año',
  '5° año',
  '6° año',
  'No va a la escuela',
] as const;

export type GrupoGrado = 'jardin' | 'chicos' | 'grandes';

/**
 * Grupo que usa logística para calcular la comida: jardín, los más chicos (de 1° a
 * 4° grado) o los más grandes (de 5° grado en adelante).
 */
export function grupoDeGrado(grado: string | null | undefined): GrupoGrado {
  // También entiende lo que se escribió a mano antes de que fuera una lista.
  if (/^\s*jard[ií]n/i.test(grado ?? '')) return 'jardin';
  return /^\s*[1-4]\s*(?:°|º|er|ro|do|to)?\.?\s*grado/i.test(grado ?? '') ? 'chicos' : 'grandes';
}
