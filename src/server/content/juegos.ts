import "server-only";

import { getTursoClient } from "@/server/db/turso";

export interface Juego {
  id: number;
  slug: string;
  title: string;
  description: string;
  youtubeId: string | null;
  order: number;
  sectionId: number | null;
  sectionTitle: string;
  sectionSlug: string;
  sectionPosition: number;
}

export async function getAllJuegos(): Promise<Juego[]> {
  const client = getTursoClient();
  if (!client) return [];

  try {
    const result = await client.execute(
      `SELECT j.id, j.slug, j.title, j.description, j.youtubeId, j."order",
              j.section_id, COALESCE(s.title, 'General') as section_title, COALESCE(s.slug, 'general') as section_slug,
              COALESCE(s.position, 0) as section_position
       FROM juegos j
       LEFT JOIN juegos_sections s ON s.id = j.section_id
       ORDER BY section_position ASC, j."order" ASC`
    );

    return result.rows.map((row: any) => ({
      id: row[0],
      slug: row[1],
      title: row[2],
      description: row[3],
      youtubeId: row[4],
      order: row[5],
      sectionId: row[6] !== null && row[6] !== undefined ? Number(row[6]) : null,
      sectionTitle: String(row[7] || 'General'),
      sectionSlug: String(row[8] || 'general'),
      sectionPosition: Number(row[9] ?? 0),
    }));
  } catch (error) {
    console.error('Error al obtener juegos:', error);
    return [];
  }
}
