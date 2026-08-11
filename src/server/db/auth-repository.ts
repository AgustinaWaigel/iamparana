import "server-only";

import { ensureSchemaInitialized, getTursoClient } from "@/server/db/turso";

export type UserRole = "admin" | "miembro" | "equipo" | "redactor" | "coordinador" | "animador";
export type UserArea = "animacion" | "comunicacion" | "formacion" | "logistica" | "espiritualidad";

export type AuthUser = {
  id: number;
  email: string;
  nombre: string;
  role: UserRole;
  isActive: boolean;
  isAnimator: boolean;
  areas: UserArea[];
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
  const role = typeof value === "string" ? value : "miembro";
  if (["admin", "miembro", "equipo", "redactor", "coordinador", "animador"].includes(role)) {
    return role as UserRole;
  }
  return "miembro";
}

function toAreas(value: unknown): UserArea[] {
  const valid = new Set<UserArea>(["animacion", "comunicacion", "formacion", "logistica", "espiritualidad"]);
  return String(value || "").split(",").filter((area): area is UserArea => valid.has(area as UserArea));
}

export async function findUserByEmail(email: string): Promise<(AuthUser & { passwordHash: string }) | null> {
  const client = await clientOrThrow();
  const sql = `SELECT u.id, u.email, u.display_name, u.role, u.is_active, u.is_animator, u.password_hash,
          (SELECT GROUP_CONCAT(area, ',') FROM user_areas WHERE user_id = u.id) AS areas
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
    isAnimator: toNumber(row.is_animator) === 1,
    areas: toAreas(row.areas),
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

  const sql = `SELECT s.id as session_id, u.id, u.email, u.display_name, u.role, u.is_active, u.is_animator,
          (SELECT GROUP_CONCAT(area, ',') FROM user_areas WHERE user_id = u.id) AS areas
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
    isAnimator: toNumber(row.is_animator) === 1,
    areas: toAreas(row.areas),
  };
}

export async function listUsers() {
  const client = await clientOrThrow();
  const sql = `SELECT u.id, u.email, u.display_name, u.role, u.is_active, u.is_animator, u.created_at, u.updated_at,
     (SELECT GROUP_CONCAT(area, ',') FROM user_areas WHERE user_id = u.id) AS areas
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
  role: UserRole = "miembro",
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
  params: { role?: UserRole; isActive?: boolean; passwordHash?: string; displayName?: string; isAnimator?: boolean; areas?: UserArea[] }
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
  if (typeof params.isAnimator === "boolean") {
    sets.push("is_animator = ?");
    args.push(params.isAnimator ? 1 : 0);
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

  if (params.areas) {
    await client.execute({ sql: "DELETE FROM user_areas WHERE user_id = ?", args: [id] });
    for (const area of params.areas) {
      await client.execute({ sql: "INSERT OR IGNORE INTO user_areas (user_id, area) VALUES (?, ?)", args: [id, area] });
    }
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

// ── Password Reset ──────────────────────────────────────────────────────────

export type PasswordReset = {
  id: number;
  userId: number;
  expiresAt: string;
};

export async function createPasswordReset(
  userId: number,
  tokenHash: string,
  expiresAt: string
) {
  const client = await clientOrThrow();
  // Eliminar resets previos del mismo usuario
  await client.execute({
    sql: "DELETE FROM password_resets WHERE user_id = ?",
    args: [userId],
  });
  await client.execute({
    sql: "INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES (?, ?, ?)",
    args: [userId, tokenHash, expiresAt],
  });
}

export async function findPasswordReset(
  tokenHash: string
): Promise<PasswordReset | null> {
  const client = await clientOrThrow();
  const result = await client.execute({
    sql: "SELECT id, user_id, expires_at FROM password_resets WHERE token_hash = ? AND expires_at > CURRENT_TIMESTAMP LIMIT 1",
    args: [tokenHash],
  });
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    id: toNumber(row.id),
    userId: toNumber(row.user_id),
    expiresAt: String(row.expires_at ?? ""),
  };
}

export async function deletePasswordReset(tokenHash: string) {
  const client = await clientOrThrow();
  await client.execute({
    sql: "DELETE FROM password_resets WHERE token_hash = ?",
    args: [tokenHash],
  });
}

export async function deleteExpiredPasswordResets() {
  const client = await clientOrThrow();
  await client.execute(
    "DELETE FROM password_resets WHERE expires_at <= CURRENT_TIMESTAMP"
  );
}
