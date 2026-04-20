import { getNoticiaDetailBySlug, listNoticiaSlugs } from "@/server/db/content-repository";

export async function getAllNoticiasSlugs() {
  return listNoticiaSlugs();
}

export async function getNoticiaBySlug(slug: string) {
  return getNoticiaDetailBySlug(slug);
}
