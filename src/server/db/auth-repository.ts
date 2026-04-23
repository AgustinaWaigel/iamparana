import "server-only";

import { ensureSchemaInitialized, getTursoClient } from "@/server/db/turso";

export type UserRole = "admin" | "equipo" | "redactor" | "coordinador" | "animador";

export type AuthUser = {
  id: number;
  email: string;
  nombre: string;
  role: UserRole;
  isActive: boolean;
};

export type SessionUser = AuthUser & {
  sessionId: number;
};

async function clientOrThrow() {
  await ensureSchemaInitialized();
  const client = getTursoClient();
  if (!client) {
    throw new Error("Turso no configurado");
  }
  return client;
}

function isMissingDisplayNameColumnError(error: unknown) {
  const message = String(error instanceof Error ? error.message : error || "").toLowerCase();
  return message.includes("no such column") && message.includes("display_name");
}

function withDisplayNameFallback(sql: string) {
  return sql.replace(/u\.display_name/g, "u.email as display_name");
}

function toNumber(value: unknown) {
  return Number(value ?? 0);
}

function toRole(value: unknown): UserRole {
  const role = typeof value === "string" ? value : "animador";
  if (["admin", "equipo", "redactor", "coordinador", "animador"].includes(role)) {
    return role as UserRole;
  }
  return "animador";
}

export async function findUserByEmail(email: string): Promise<(AuthUser & { passwordHash: string }) | null> {
  const client = await clientOrThrow();
  const sql = `SELECT u.id, u.email, u.display_name, u.role, u.is_active, u.password_hash 
          FROM users u
          WHERE u.email = ? LIMIT 1`;

  let result;
  try {
    result = await client.execute({ sql, args: [email] });
  } catch (error) {
    if (!isMissingDisplayNameColumnError(error)) {
      throw error;
    }
    result = await client.execute({
      sql: withDisplayNameFallback(sql),
      args: [email],
    });
  }

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: toNumber(row.id),
    email: String(row.email ?? ""),
    nombre: String(row.display_name ?? row.email ?? "").split("@")[0],
    role: toRole(row.role),
    isActive: toNumber(row.is_active) === 1,
    passwordHash: String(row.password_hash ?? ""),
  };
}

export async function createSession(userId: number, tokenHash: string, expiresAtIso: string) {
  const client = await clientOrThrow();
  await client.execute({
    sql: "INSERT INTO auth_sessions (user_id, token_hash, expires_at) VALUES (?, ?, ?)",
    args: [userId, tokenHash, expiresAtIso],
  });
}

export async function deleteSessionByTokenHash(tokenHash: string) {
  const client = await clientOrThrow();
  await client.execute({
    sql: "DELETE FROM auth_sessions WHERE token_hash = ?",
    args: [tokenHash],
  });
}

export async function deleteExpiredSessions() {
  const client = await clientOrThrow();
  await client.execute("DELETE FROM auth_sessions WHERE expires_at <= CURRENT_TIMESTAMP");
}

export async function getSessionUserByTokenHash(tokenHash: string): Promise<SessionUser | null> {
  const client = await clientOrThrow();
  await deleteExpiredSessions();

  const sql = `SELECT s.id as session_id, u.id, u.email, u.display_name, u.role, u.is_active
          FROM auth_sessions s
          JOIN users u ON u.id = s.user_id
          WHERE s.token_hash = ? AND s.expires_at > CURRENT_TIMESTAMP
          LIMIT 1`;

  let result;
  try {
    result = await client.execute({ sql, args: [tokenHash] });
  } catch (error) {
    if (!isMissingDisplayNameColumnError(error)) {
      throw error;
    }
    result = await client.execute({
      sql: withDisplayNameFallback(sql),
      args: [tokenHash],
    });
  }

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    sessionId: toNumber(row.session_id),
    id: toNumber(row.id),
    email: String(row.email ?? ""),
    nombre: String(row.display_name ?? row.email ?? "").split("@")[0],
    role: toRole(row.role),
    isActive: toNumber(row.is_active) === 1,
  };
}

export async function listUsers() {
  const client = await clientOrThrow();
  const sql = `SELECT u.id, u.email, u.display_name, u.role, u.is_active, u.created_at, u.updated_at 
     FROM users u
     ORDER BY u.created_at ASC`;

  let result;
  try {
    result = await client.execute(sql);
  } catch (error) {
    if (!isMissingDisplayNameColumnError(error)) {
      throw error;
    }
    result = await client.execute(withDisplayNameFallback(sql));
  }

  return result.rows;
}

export async function createUser(
  email: string,
  passwordHash: string,
  role: UserRole = "animador",
  displayName?: string
) {
  const client = await clientOrThrow();

  try {
    await client.execute({
      sql: "INSERT INTO users (email, display_name, password_hash, role, is_active) VALUES (?, ?, ?, ?, 1)",
      args: [email, displayName || null, passwordHash, role],
    });
  } catch (error) {
    if (!isMissingDisplayNameColumnError(error)) {
      throw error;
    }
    await client.execute({
      sql: "INSERT INTO users (email, password_hash, role, is_active) VALUES (?, ?, ?, 1)",
      args: [email, passwordHash, role],
    });
  }
}

export async function updateUser(
  id: number,
  params: { role?: UserRole; isActive?: boolean; passwordHash?: string; displayName?: string }
) {
  const client = await clientOrThrow();
  const sets: string[] = [];
  const args: Array<string | number | null> = [];

  if (params.role) {
    sets.push("role = ?");
    args.push(params.role);
  }
  
  if (typeof params.isActive === "boolean") {
    sets.push("is_active = ?");
    args.push(params.isActive ? 1 : 0);
  }
  if (params.passwordHash) {
    sets.push("password_hash = ?");
    args.push(params.passwordHash);
  }

  if (typeof params.displayName === "string") {
    sets.push("display_name = ?");
    args.push(params.displayName.trim() || null);
  }

  if (sets.length === 0) {
    return;
  }

  sets.push("updated_at = CURRENT_TIMESTAMP");
  args.push(id);

  try {
    await client.execute({
      sql: `UPDATE users SET ${sets.join(", ")} WHERE id = ?`,
      args,
    });
  } catch (error) {
    if (!isMissingDisplayNameColumnError(error)) {
      throw error;
    }

    const fallbackSets = sets.filter((entry) => !entry.startsWith("display_name"));
    if (fallbackSets.length === 0) {
      return;
    }

    const fallbackArgs = args.filter((_, index) => {
      const entry = sets[index];
      return entry ? !entry.startsWith("display_name") : true;
    });

    await client.execute({
      sql: `UPDATE users SET ${fallbackSets.join(", ")} WHERE id = ?`,
      args: fallbackArgs,
    });
  }
}

export async function countUsers() {
  const client = await clientOrThrow();
  const result = await client.execute("SELECT COUNT(*) as total FROM users");
  return toNumber(result.rows[0]?.total);
}

export async function deleteAllSessionsByUserId(userId: number) {
  const client = await clientOrThrow();
  await client.execute({
    sql: "DELETE FROM auth_sessions WHERE user_id = ?",
    args: [userId],
  });
}