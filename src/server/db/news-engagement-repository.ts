import "server-only";

import { getTursoClient } from "@/server/db/turso";

function clientOrThrow() {
  const client = getTursoClient();
  if (!client) throw new Error("Turso no configurado");
  return client;
}

let schemaReadyPromise: Promise<void> | null = null;

function ensureNewsEngagementSchema() {
  if (schemaReadyPromise) return schemaReadyPromise;

  const client = clientOrThrow();
  schemaReadyPromise = client.batch([
    `CREATE TABLE IF NOT EXISTS news_likes (
      id INTEGER PRIMARY KEY,
      news_slug TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(news_slug, user_id),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    `CREATE INDEX IF NOT EXISTS idx_news_likes_slug ON news_likes(news_slug)`,
    `CREATE TABLE IF NOT EXISTS news_comments (
      id INTEGER PRIMARY KEY,
      news_slug TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      approved INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    `CREATE INDEX IF NOT EXISTS idx_news_comments_slug ON news_comments(news_slug, created_at)`,
  ], "write").then(() => undefined).catch((error) => {
    schemaReadyPromise = null;
    throw error;
  });

  return schemaReadyPromise;
}

export async function getNewsEngagement(slug: string, userId?: number) {
  await ensureNewsEngagementSchema();
  const client = clientOrThrow();
  const [likesResult, commentsResult, likedResult] = await Promise.all([
    client.execute({ sql: "SELECT COUNT(*) AS total FROM news_likes WHERE news_slug = ?", args: [slug] }),
    client.execute({
      sql: `SELECT c.id, c.content, c.created_at, c.user_id,
                   COALESCE(u.display_name, u.email) AS author
            FROM news_comments c
            JOIN users u ON u.id = c.user_id
            WHERE c.news_slug = ? AND c.approved = 1
            ORDER BY c.created_at DESC`,
      args: [slug],
    }),
    userId
      ? client.execute({ sql: "SELECT 1 FROM news_likes WHERE news_slug = ? AND user_id = ? LIMIT 1", args: [slug, userId] })
      : Promise.resolve({ rows: [] }),
  ]);

  return {
    likes: Number(likesResult.rows[0]?.total || 0),
    likedByMe: likedResult.rows.length > 0,
    comments: commentsResult.rows.map((row) => ({
      id: Number(row.id),
      content: String(row.content || ""),
      createdAt: String(row.created_at || ""),
      userId: Number(row.user_id),
      author: String(row.author || "Usuario"),
    })),
  };
}

export async function toggleNewsLike(slug: string, userId: number) {
  await ensureNewsEngagementSchema();
  const client = clientOrThrow();
  const existing = await client.execute({
    sql: "SELECT id FROM news_likes WHERE news_slug = ? AND user_id = ? LIMIT 1",
    args: [slug, userId],
  });

  if (existing.rows.length > 0) {
    await client.execute({ sql: "DELETE FROM news_likes WHERE news_slug = ? AND user_id = ?", args: [slug, userId] });
    return false;
  }

  await client.execute({ sql: "INSERT INTO news_likes (news_slug, user_id) VALUES (?, ?)", args: [slug, userId] });
  return true;
}

export async function createNewsComment(slug: string, userId: number, content: string) {
  await ensureNewsEngagementSchema();
  const client = clientOrThrow();
  await client.execute({
    sql: "INSERT INTO news_comments (news_slug, user_id, content) VALUES (?, ?, ?)",
    args: [slug, userId, content],
  });
}

export async function deleteNewsComment(commentId: number, userId: number, canModerate: boolean) {
  await ensureNewsEngagementSchema();
  const client = clientOrThrow();
  const result = await client.execute({
    sql: canModerate
      ? "DELETE FROM news_comments WHERE id = ?"
      : "DELETE FROM news_comments WHERE id = ? AND user_id = ?",
    args: canModerate ? [commentId] : [commentId, userId],
  });

  return result.rowsAffected > 0;
}
