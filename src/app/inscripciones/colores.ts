// Colores con los que se identifica cada IAM y cada área en las planillas del admin.

/** Color de cada área, igual que en la planilla de pagos de las áreas. */
export const AREA_COLOR: Record<string, string> = {
  animacion: '#38761d',
  comunicacion: '#20124d',
  espiritualidad: '#f3f3f3',
  formacion: '#fbbc04',
  logistica: '#cc0000',
};

export const COLOR_HEX = /^#[0-9a-fA-F]{6}$/;

/** Color de texto (oscuro o blanco) que se lee bien sobre un fondo dado. */
export function textoSobre(fondo: string): string {
  if (!COLOR_HEX.test(fondo)) return '#1c1917';
  const [r, g, b] = [1, 3, 5].map((start) => parseInt(fondo.slice(start, start + 2), 16) / 255).map((value) => (value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4));
  const luminancia = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminancia > 0.4 ? '#1c1917' : '#ffffff';
}

/** Estilo en línea para una celda o banda con el color de una IAM; vacío si no tiene color. */
export function estiloIam(color: string | null | undefined): { backgroundColor?: string; color?: string } {
  return color && COLOR_HEX.test(color) ? { backgroundColor: color, color: textoSobre(color) } : {};
}
