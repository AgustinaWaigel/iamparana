import "server-only";
import { getTursoClient } from "@/server/db/turso";

let schemaPromise: Promise<void> | null = null;

function clientOrThrow() {
  const client = getTursoClient();
  if (!client) throw new Error("Turso no configurado");
  return client;
}

function ensurePresenceSchema() {
  if (schemaPromise) return schemaPromise;
  schemaPromise = clientOrThrow().batch([
    `CREATE TABLE IF NOT EXISTS user_presence (
      user_id INTEGER PRIMARY KEY,
      last_seen TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    `CREATE INDEX IF NOT EXISTS idx_user_presence_last_seen ON user_presence(last_seen)`,
    `CREATE TABLE IF NOT EXISTS visitor_presence (
      visitor_id TEXT PRIMARY KEY,
      last_seen TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE INDEX IF NOT EXISTS idx_visitor_presence_last_seen ON visitor_presence(last_seen)`,
  ], "write").then(() => undefined).catch((error) => {
    schemaPromise = null;
    throw error;
  });
  return schemaPromise;
}

export async function touchUserPresence(userId: number) {
  await ensurePresenceSchema();
  await clientOrThrow().execute({
    sql: `INSERT INTO user_presence (user_id, last_seen) VALUES (?, CURRENT_TIMESTAMP)
          ON CONFLICT(user_id) DO UPDATE SET last_seen = CURRENT_TIMESTAMP`,
    args: [userId],
  });
}

export async function touchVisitorPresence(visitorId: string) {
  await ensurePresenceSchema();
  await clientOrThrow().batch([
    {
      sql: `INSERT INTO visitor_presence (visitor_id, last_seen) VALUES (?, CURRENT_TIMESTAMP)
            ON CONFLICT(visitor_id) DO UPDATE SET last_seen = CURRENT_TIMESTAMP`,
      args: [visitorId],
    },
    `DELETE FROM visitor_presence WHERE last_seen < DATETIME('now', '-1 day')`,
  ], "write");
}

export async function removeVisitorPresence(visitorId: string) {
  await ensurePresenceSchema();
  await clientOrThrow().execute({
    sql: "DELETE FROM visitor_presence WHERE visitor_id = ?",
    args: [visitorId],
  });
}

export async function getOnlinePresence() {
  await ensurePresenceSchema();
  const [usersResult, visitorsResult] = await clientOrThrow().batch([
    `SELECT COALESCE(NULLIF(TRIM(u.display_name), ''), SUBSTR(u.email, 1, INSTR(u.email, '@') - 1), 'Usuario') AS name
     FROM user_presence p
     JOIN users u ON u.id = p.user_id
     WHERE p.last_seen >= DATETIME('now', '-2 minutes') AND u.is_active = 1
     ORDER BY p.last_seen DESC
     LIMIT 30`,
    `SELECT COUNT(*) AS total FROM visitor_presence
     WHERE last_seen >= DATETIME('now', '-2 minutes')`,
  ], "read");

  const users = usersResult.rows.map((row) => ({ name: String(row.name || "Usuario") }));
  const visitors = Number(visitorsResult.rows[0]?.total || 0);
  return { users, visitors, total: users.length + visitors };
}
