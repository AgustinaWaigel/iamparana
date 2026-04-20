import "server-only";

import { getTursoClient } from "@/server/db/turso";

export type UserRole = "admin" | "equipo" | "redactor" | "coordinador" | "animador";

export type AuthUser = {
  id: number;
  email: string;
  role: UserRole;
  isActive: boolean;
};

export type SessionUser = AuthUser & {
  sessionId: number;
};

function clientOrThrow() {
  const client = getTursoClient();
  if (!client) {
    throw new Error("Turso no configurado");
  }
  return client;
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
  const client = clientOrThrow();
  const result = await client.execute({
    sql: `SELECT u.id, u.email, u.role, u.is_active, u.password_hash 
          FROM users u
          WHERE u.email = ? LIMIT 1`,
    args: [email],
  });

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: toNumber(row.id),
    email: String(row.email ?? ""),
    role: toRole(row.role),
    isActive: toNumber(row.is_active) === 1,
    passwordHash: String(row.password_hash ?? ""),
  };
}

export async function createSession(userId: number, tokenHash: string, expiresAtIso: string) {
  const client = clientOrThrow();
  await client.execute({
    sql: "INSERT INTO auth_sessions (user_id, token_hash, expires_at) VALUES (?, ?, ?)",
    args: [userId, tokenHash, expiresAtIso],
  });
}

export async function deleteSessionByTokenHash(tokenHash: string) {
  const client = clientOrThrow();
  await client.execute({
    sql: "DELETE FROM auth_sessions WHERE token_hash = ?",
    args: [tokenHash],
  });
}

export async function deleteExpiredSessions() {
  const client = clientOrThrow();
  await client.execute("DELETE FROM auth_sessions WHERE expires_at <= CURRENT_TIMESTAMP");
}

export async function getSessionUserByTokenHash(tokenHash: string): Promise<SessionUser | null> {
  const client = clientOrThrow();
  await deleteExpiredSessions();

  const result = await client.execute({
    sql: `SELECT s.id as session_id, u.id, u.email, u.role, u.is_active
          FROM auth_sessions s
          JOIN users u ON u.id = s.user_id
          WHERE s.token_hash = ? AND s.expires_at > CURRENT_TIMESTAMP
          LIMIT 1`,
    args: [tokenHash],
  });

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    sessionId: toNumber(row.session_id),
    id: toNumber(row.id),
    email: String(row.email ?? ""),
    role: toRole(row.role),
    isActive: toNumber(row.is_active) === 1,
  };
}

export async function listUsers() {
  const client = clientOrThrow();
  const result = await client.execute(
    `SELECT u.id, u.email, u.role, u.is_active, u.created_at, u.updated_at 
     FROM users u
     ORDER BY u.created_at ASC`
  );
  return result.rows;
}

export async function createUser(email: string, passwordHash: string, role: UserRole = "animador") {
  const client = clientOrThrow();
  
  await client.execute({
    sql: "INSERT INTO users (email, password_hash, role, is_active) VALUES (?, ?, ?, 1)",
    args: [email, passwordHash, role],
  });
}

export async function updateUser(id: number, params: { role?: UserRole; isActive?: boolean; passwordHash?: string }) {
  const client = clientOrThrow();
  const sets: string[] = [];
  const args: (string | number)[] = [];

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

  if (sets.length === 0) {
    return;
  }

  sets.push("updated_at = CURRENT_TIMESTAMP");
  args.push(id);

  await client.execute({
    sql: `UPDATE users SET ${sets.join(", ")} WHERE id = ?`,
    args,
  });
}

export async function countUsers() {
  const client = clientOrThrow();
  const result = await client.execute("SELECT COUNT(*) as total FROM users");
  return toNumber(result.rows[0]?.total);
}
