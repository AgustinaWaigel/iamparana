import "server-only";

import { getTursoClient } from "@/app/db/turso";

export interface Juego {
  id: number;
  slug: string;
  title: string;
  description: string;
  youtubeId: string | null;
  category: string;
  order: number;
}

export async function getAllJuegos(): Promise<Juego[]> {
  const client = getTursoClient();
  if (!client) return [];

  try {
    const result = await client.execute(
      'SELECT id, slug, title, description, youtubeId, category, "order" FROM juegos ORDER BY "order" ASC'
    );

    return result.rows.map((row: any) => ({
      id: row[0],
      slug: row[1],
      title: row[2],
      description: row[3],
      youtubeId: row[4],
      category: row[5],
      order: row[6],
    }));
  } catch (error) {
    console.error('Error al obtener juegos:', error);
    return [];
  }
}
