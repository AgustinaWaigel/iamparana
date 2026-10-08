// Monto de la inscripción a un evento. Lo carga el admin por ciudad (según dónde vive
// cada persona), con un monto aparte para las ciudades que no están en la lista.

export interface Montos {
  /** Monto en pesos por ciudad. */
  porCiudad: Record<string, number>;
  /** Monto para quien vive en una ciudad que no está en la lista; null si no se definió. */
  otras: number | null;
}

export const SIN_MONTOS: Montos = { porCiudad: {}, otras: null };

/** true si el evento tiene algún monto cargado. */
export function hayMontos(montos: Montos): boolean {
  return montos.otras !== null || Object.keys(montos.porCiudad).length > 0;
}

/** Monto que le corresponde a alguien según su ciudad; null si el evento no tiene uno para esa ciudad. */
export function montoPara(montos: Montos, ciudad: string | null | undefined): number | null {
  const clave = (ciudad ?? '').trim().toLowerCase();
  const encontrada = Object.entries(montos.porCiudad).find(([nombre]) => nombre.trim().toLowerCase() === clave);
  return encontrada ? encontrada[1] : montos.otras;
}

export function formatMonto(monto: number): string {
  return `$ ${monto.toLocaleString('es-AR')}`;
}
