import "server-only";

import { getTursoClient } from "@/server/db/turso";

export type SpiritualPrayer = {
  id: number;
  title: string;
  description: string | null;
  content: string;
  thumbnail_url: string | null;
  created_at: string;
};

function clientOrThrow() {
  const client = getTursoClient();
  if (!client) throw new Error("Base de datos no configurada");
  return client;
}

export async function listSpiritualPrayers(): Promise<SpiritualPrayer[]> {
  const result = await clientOrThrow().execute(
    "SELECT id, title, description, content, thumbnail_url, created_at FROM spiritual_prayers ORDER BY created_at DESC, id DESC"
  );
  return result.rows as unknown as SpiritualPrayer[];
}

export async function getSpiritualPrayer(id: number): Promise<SpiritualPrayer | null> {
  const result = await clientOrThrow().execute({
    sql: "SELECT id, title, description, content, thumbnail_url, created_at FROM spiritual_prayers WHERE id = ? LIMIT 1",
    args: [id],
  });
  return (result.rows[0] as unknown as SpiritualPrayer) ?? null;
}

export async function createSpiritualPrayer(data: { title: string; description?: string | null; content: string; thumbnailUrl?: string | null; createdByUserId: number }) {
  const result = await clientOrThrow().execute({
    sql: "INSERT INTO spiritual_prayers (title, description, content, thumbnail_url, created_by_user_id) VALUES (?, ?, ?, ?, ?)",
    args: [data.title, data.description ?? null, data.content, data.thumbnailUrl ?? null, data.createdByUserId],
  });
  return Number(result.lastInsertRowid);
}

export async function updateSpiritualPrayer(id: number, data: { title: string; description?: string | null; content: string; thumbnailUrl?: string | null }) {
  await clientOrThrow().execute({
    sql: "UPDATE spiritual_prayers SET title = ?, description = ?, content = ?, thumbnail_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    args: [data.title, data.description ?? null, data.content, data.thumbnailUrl ?? null, id],
  });
}

export async function deleteSpiritualPrayer(id: number) {
  await clientOrThrow().execute({ sql: "DELETE FROM spiritual_prayers WHERE id = ?", args: [id] });
}
