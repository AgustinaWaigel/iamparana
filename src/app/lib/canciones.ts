import { getCancionDetailBySlug, listCancionesBasic } from "@/app/db/content-repository";

/**
 * Obtiene la lista resumida de todas las canciones desde Turso.
 * Ideal para el listado del cancionero.
 */
export async function getAllCanciones() {
  try {
    const canciones = await listCancionesBasic();
    return canciones || [];
  } catch (error) {
    console.error("Error al obtener canciones de Turso:", error);
    return [];
  }
}

/**
 * Obtiene el detalle de una canción (incluyendo letra/acordes) por su slug.
 */
export async function getCancionBySlug(slug: string) {
  try {
    if (!slug) return null;
    const cancion = await getCancionDetailBySlug(slug);
    return cancion || null;
  } catch (error) {
    console.error(`Error al obtener la canción ${slug} de Turso:`, error);
    return null;
  }
}
