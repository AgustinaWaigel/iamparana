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
    // Comentarios de quien no tiene cuenta: solo nombre y texto, y no se ven hasta que un administrador los aprueba.
    `CREATE TABLE IF NOT EXISTS news_guest_comments (
      id INTEGER PRIMARY KEY,
      news_slug TEXT NOT NULL,
      author_name TEXT NOT NULL,
      content TEXT NOT NULL,
      approved INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE INDEX IF NOT EXISTS idx_news_guest_comments_slug ON news_guest_comments(news_slug, approved, created_at)`,
  ], "write").then(() => undefined).catch((error) => {
    schemaReadyPromise = null;
    throw error;
  });

  return schemaReadyPromise;
}

export async function getNewsEngagement(slug: string, userId?: number, incluirPendientes = false) {
  await ensureNewsEngagementSchema();
  const client = clientOrThrow();
  const [likesResult, commentsResult, likedResult, guestResult] = await Promise.all([
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
    client.execute({
      sql: `SELECT id, author_name, content, approved, created_at FROM news_guest_comments
            WHERE news_slug = ? ${incluirPendientes ? "" : "AND approved = 1"}
            ORDER BY created_at DESC`,
      args: [slug],
    }),
  ]);

  return {
    likes: Number(likesResult.rows[0]?.total || 0),
    likedByMe: likedResult.rows.length > 0,
    // Los de usuarios y los de invitados van juntos, del más nuevo al más viejo.
    comments: [
      ...commentsResult.rows.map((row) => ({
        id: Number(row.id),
        content: String(row.content || ""),
        createdAt: String(row.created_at || ""),
        userId: Number(row.user_id) as number | null,
        author: String(row.author || "Usuario"),
        guest: false,
        pending: false,
      })),
      ...guestResult.rows.map((row) => ({
        id: Number(row.id),
        content: String(row.content || ""),
        createdAt: String(row.created_at || ""),
        userId: null as number | null,
        author: String(row.author_name || "Invitado"),
        guest: true,
        pending: Number(row.approved) !== 1,
      })),
    ].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  };
}

// ── Comentarios sin cuenta ───────────────────────────────────────────────

/** Guarda el comentario de un invitado, pendiente de aprobación. Devuelve false si es un repetido reciente. */
export async function createGuestComment(slug: string, authorName: string, content: string): Promise<boolean> {
  await ensureNewsEngagementSchema();
  const client = clientOrThrow();
  const repetido = await client.execute({
    sql: `SELECT 1 FROM news_guest_comments
          WHERE news_slug = ? AND LOWER(TRIM(content)) = LOWER(TRIM(?)) AND created_at >= DATETIME('now', '-1 day') LIMIT 1`,
    args: [slug, content],
  });
  if (repetido.rows.length > 0) return false;
  await client.execute({
    sql: "INSERT INTO news_guest_comments (news_slug, author_name, content) VALUES (?, ?, ?)",
    args: [slug, authorName, content],
  });
  return true;
}

export async function approveGuestComment(commentId: number) {
  await ensureNewsEngagementSchema();
  const result = await clientOrThrow().execute({ sql: "UPDATE news_guest_comments SET approved = 1 WHERE id = ?", args: [commentId] });
  return result.rowsAffected > 0;
}

export async function deleteGuestComment(commentId: number) {
  await ensureNewsEngagementSchema();
  const result = await clientOrThrow().execute({ sql: "DELETE FROM news_guest_comments WHERE id = ?", args: [commentId] });
  return result.rowsAffected > 0;
}

export interface PendingGuestComment {
  id: number;
  slug: string;
  /** Título de la noticia; el slug si la noticia ya no existe. */
  noticia: string;
  author: string;
  content: string;
  createdAt: string;
}

/** Comentarios de invitados que esperan aprobación, del más viejo al más nuevo. */
export async function listPendingGuestComments(): Promise<PendingGuestComment[]> {
  await ensureNewsEngagementSchema();
  const result = await clientOrThrow().execute(
    `SELECT c.id, c.news_slug, c.author_name, c.content, c.created_at, n.title
     FROM news_guest_comments c
     LEFT JOIN noticias n ON n.slug = c.news_slug
     WHERE c.approved = 0
     ORDER BY c.created_at ASC
     LIMIT 200`,
  );
  return result.rows.map((row) => ({
    id: Number(row.id),
    slug: String(row.news_slug),
    noticia: String(row.title || row.news_slug),
    author: String(row.author_name || "Invitado"),
    content: String(row.content || ""),
    createdAt: String(row.created_at || ""),
  }));
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

export async function canCreateNewsComment(slug: string, userId: number, content: string) {
  await ensureNewsEngagementSchema();
  const result = await clientOrThrow().execute({
    sql: `SELECT
            EXISTS(
              SELECT 1 FROM news_comments
              WHERE user_id = ? AND created_at >= DATETIME('now', '-15 seconds')
            ) AS too_fast,
            EXISTS(
              SELECT 1 FROM news_comments
              WHERE news_slug = ? AND user_id = ? AND LOWER(TRIM(content)) = LOWER(TRIM(?))
                AND created_at >= DATETIME('now', '-10 minutes')
            ) AS duplicate_comment`,
    args: [userId, slug, userId, content],
  });
  return {
    tooFast: Number(result.rows[0]?.too_fast || 0) === 1,
    duplicate: Number(result.rows[0]?.duplicate_comment || 0) === 1,
  };
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
