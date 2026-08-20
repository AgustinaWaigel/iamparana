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
  const client = clientOrThrow();
  schemaPromise = client.batch([
    `CREATE TABLE IF NOT EXISTS user_presence (
      user_id INTEGER PRIMARY KEY,
      last_seen TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    `CREATE INDEX IF NOT EXISTS idx_user_presence_last_seen ON user_presence(last_seen)`,
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

export async function listOnlineUsers() {
  await ensurePresenceSchema();
  const result = await clientOrThrow().execute(`
    SELECT u.id,
           COALESCE(NULLIF(TRIM(u.display_name), ''), SUBSTR(u.email, 1, INSTR(u.email, '@') - 1), 'Usuario') AS name,
           u.role
    FROM user_presence p
    JOIN users u ON u.id = p.user_id
    WHERE p.last_seen >= DATETIME('now', '-2 minutes') AND u.is_active = 1
    ORDER BY p.last_seen DESC
    LIMIT 30
  `);
  return result.rows.map((row) => ({ id: Number(row.id), name: String(row.name || "Usuario"), role: String(row.role || "miembro") }));
}
