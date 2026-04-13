import { getNoticiaDetailBySlug, listNoticiaSlugs } from "@/app/db/content-repository";

export async function getAllNoticiasSlugs() {
  return listNoticiaSlugs();
}

export async function getNoticiaBySlug(slug: string) {
  return getNoticiaDetailBySlug(slug);
}
