import { getCancionDetailBySlug, listCancionesBasic } from "@/db/content-repository";

export async function getAllCanciones() {
  return listCancionesBasic();
}

export async function getCancionBySlug(slug: string) {
  return getCancionDetailBySlug(slug);
}


