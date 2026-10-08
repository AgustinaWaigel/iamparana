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
