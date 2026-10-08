// Búsqueda de texto tolerante: no distingue mayúsculas, tildes ni eñes ("oracion" encuentra "Oración"),
// ignora espacios de más y acepta las palabras en cualquier orden.

/** Texto en minúsculas, sin tildes ni signos, con espacios simples. */
export function normalizarBusqueda(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** ¿Todas las palabras de la búsqueda aparecen en alguno de los campos? Una búsqueda vacía coincide con todo. */
export function coincideBusqueda(busqueda: string, ...campos: Array<string | number | null | undefined>): boolean {
  const palabras = normalizarBusqueda(busqueda).split(' ').filter(Boolean);
  if (palabras.length === 0) return true;
  const texto = normalizarBusqueda(campos.filter((campo) => campo !== null && campo !== undefined).join(' '));
  return palabras.every((palabra) => texto.includes(palabra));
}

/**
 * Año al que pertenece un recurso: el que figura en el título ("Temario 2025") o, si no tiene,
 * el año en que se subió.
 */
export function anioDeRecurso(titulo: string, creado: string): number | null {
  const enTitulo = titulo.match(/\b(?:19|20)\d{2}\b/g);
  if (enTitulo) return Number(enTitulo[enTitulo.length - 1]);
  const subido = Number(String(creado).slice(0, 4));
  return subido >= 1990 && subido <= 2100 ? subido : null;
}
