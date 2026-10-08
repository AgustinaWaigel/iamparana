import "server-only";

import type { InStatement } from "@libsql/client";
import { ensureInscripcionesSchema, inscripcionesClient } from "@/server/db/inscripciones-schema";
import { createRandomId } from "@/server/lib/inscripciones-crypto";

// Cuentas familiares: acceso por código enviado al email, sin contraseña.
// Un usuario del sitio puede vincular su cuenta y entrar con su sesión de siempre.

export const CODE_TTL_MINUTES = 10;
export const CODE_MAX_ATTEMPTS = 5;
export const INVITACION_DIAS = 30;

export interface CuentaSesion {
  cuentaId: string;
  email: string;
  consentimientoAt: string | null;
  /** 'codigo': entró con el código por email. 'usuario': entró con su usuario del sitio. */
  via: "codigo" | "usuario";
}

async function db() {
  await ensureInscripcionesSchema();
  return inscripcionesClient();
}

function mapCuenta(row: Record<string, unknown>, via: CuentaSesion["via"]): CuentaSesion {
  return {
    cuentaId: String(row.id),
    email: String(row.email),
    consentimientoAt: row.consentimiento_at ? String(row.consentimiento_at) : null,
    via,
  };
}

// ── Códigos ──────────────────────────────────────────────────────────────

/** Guarda un código nuevo para el email e invalida los anteriores. */
export async function storeAccessCode(email: string, codigoHash: string): Promise<void> {
  const client = await db();
  await client.batch([
    {
      sql: "UPDATE cuenta_codigos SET usado_at = CURRENT_TIMESTAMP WHERE email = ? AND usado_at IS NULL",
      args: [email],
    },
    {
      sql: `INSERT INTO cuenta_codigos (email, codigo_hash, expires_at)
            VALUES (?, ?, DATETIME('now', '+${CODE_TTL_MINUTES} minutes'))`,
      args: [email, codigoHash],
    },
    // Limpieza: los códigos viejos no sirven para nada.
    "DELETE FROM cuenta_codigos WHERE created_at < DATETIME('now', '-1 day')",
  ], "write");
}

/**
 * Consume un intento sobre el código vigente del email y devuelve su huella para comparar.
 * El intento se descuenta ANTES de comparar, así no se puede probar más de CODE_MAX_ATTEMPTS
 * veces aunque lleguen pedidos en paralelo. Devuelve null si no hay código utilizable.
 */
export async function takeAccessCodeAttempt(email: string): Promise<{ id: number; codigoHash: string } | null> {
  const client = await db();
  const result = await client.execute({
    sql: `UPDATE cuenta_codigos
          SET intentos = intentos + 1
          WHERE id = (
            SELECT id FROM cuenta_codigos
            WHERE email = ? AND usado_at IS NULL AND expires_at > DATETIME('now')
            ORDER BY created_at DESC, id DESC
            LIMIT 1
          ) AND intentos < ?
          RETURNING id, codigo_hash`,
    args: [email, CODE_MAX_ATTEMPTS],
  });

  const row = result.rows[0];
  if (!row) return null;
  return { id: Number(row.id), codigoHash: String(row.codigo_hash) };
}

// ── Invitaciones ─────────────────────────────────────────────────────────

/**
 * Comparte con la cuenta del email invitado a las personas a cargo de quien invitó.
 * Solo tiene efecto si esa cuenta ya existe, es decir, si el invitado ya demostró
 * que el email es suyo. Se usa al invitar y cada vez que el invitado entra.
 */
export function applyInvitationsStatements(email: string): InStatement[] {
  const vigentes = "inv.email = ? AND inv.aceptada_at IS NULL AND inv.expires_at > DATETIME('now')";
  return [
    {
      sql: `INSERT OR IGNORE INTO cuenta_persona (cuenta_id, persona_id, vinculo, es_titular)
            SELECT dest.id, cp.persona_id, 'A mi cargo', 0
            FROM cuenta_invitaciones inv
            JOIN cuentas dest ON dest.email = inv.email
            JOIN cuenta_persona cp ON cp.cuenta_id = inv.cuenta_id AND (cp.es_titular = 0 OR inv.incluye_titular = 1)
            WHERE ${vigentes}`,
      args: [email],
    },
    {
      sql: `UPDATE cuenta_invitaciones AS inv SET aceptada_at = CURRENT_TIMESTAMP
            WHERE ${vigentes} AND EXISTS (SELECT 1 FROM cuentas WHERE email = inv.email)`,
      args: [email],
    },
  ];
}

/** Invita a otro adulto. Devuelve false si la cuenta no tiene a nadie a cargo para compartir. */
export async function createInvitacion(cuentaId: string, email: string): Promise<boolean> {
  const client = await db();
  const aCargo = await client.execute({
    sql: "SELECT 1 FROM cuenta_persona WHERE cuenta_id = ? AND es_titular = 0 LIMIT 1",
    args: [cuentaId],
  });
  if (!aCargo.rows[0]) return false;

  await client.batch([
    { sql: "DELETE FROM cuenta_invitaciones WHERE cuenta_id = ? AND email = ? AND aceptada_at IS NULL", args: [cuentaId, email] },
    {
      sql: `INSERT INTO cuenta_invitaciones (id, cuenta_id, email, expires_at)
            VALUES (?, ?, ?, DATETIME('now', '+${INVITACION_DIAS} days'))`,
      args: [createRandomId(), cuentaId, email],
    },
    ...applyInvitationsStatements(email),
  ], "write");
  return true;
}

/**
 * Un menor que se inscribió solo le pide a un adulto que firme su autorización. El adulto,
 * al entrar con ese email, pasa a ver a quien lo invitó como una persona a su cargo.
 */
export async function createInvitacionFirma(cuentaId: string, email: string): Promise<void> {
  const client = await db();
  await client.batch([
    { sql: "DELETE FROM cuenta_invitaciones WHERE cuenta_id = ? AND email = ? AND aceptada_at IS NULL", args: [cuentaId, email] },
    {
      sql: `INSERT INTO cuenta_invitaciones (id, cuenta_id, email, expires_at, incluye_titular)
            VALUES (?, ?, ?, DATETIME('now', '+${INVITACION_DIAS} days'), 1)`,
      args: [createRandomId(), cuentaId, email],
    },
    ...applyInvitationsStatements(email),
  ], "write");
}

export interface AdultoConAcceso {
  email: string;
  estado: "activo" | "invitado";
  /** true si lo sumó esta misma cuenta: es quien puede quitarle el acceso. */
  puedeQuitar: boolean;
}

/**
 * Quita el acceso de un adulto que esta cuenta había sumado, o cancela su invitación.
 * Solo borra los vínculos que nacieron de esa invitación: si el otro adulto ya tenía a
 * la persona en su cuenta desde antes, la conserva. Devuelve false si esta cuenta no lo invitó.
 */
export async function removeAdulto(cuentaId: string, email: string): Promise<boolean> {
  const client = await db();
  const invitacion = "SELECT MIN(created_at) FROM cuenta_invitaciones WHERE cuenta_id = ? AND email = ?";
  const [links, invitaciones] = await client.batch([
    {
      sql: `DELETE FROM cuenta_persona
            WHERE cuenta_id = (SELECT id FROM cuentas WHERE email = ?) AND es_titular = 0
              AND persona_id IN (SELECT persona_id FROM cuenta_persona WHERE cuenta_id = ?)
              AND created_at >= (${invitacion})`,
      args: [email, cuentaId, cuentaId, email],
    },
    { sql: "DELETE FROM cuenta_invitaciones WHERE cuenta_id = ? AND email = ?", args: [cuentaId, email] },
  ], "write");
  return links.rowsAffected + invitaciones.rowsAffected > 0;
}

/** Otros adultos que comparten personas con esta cuenta, más las invitaciones pendientes. */
export async function listAdultosConAcceso(cuentaId: string): Promise<AdultoConAcceso[]> {
  const client = await db();
  const [activos, invitados, sumadosPorMi] = await client.batch([
    {
      sql: `SELECT DISTINCT c.email
            FROM cuenta_persona mine
            JOIN cuenta_persona other ON other.persona_id = mine.persona_id AND other.cuenta_id <> mine.cuenta_id
            JOIN cuentas c ON c.id = other.cuenta_id
            WHERE mine.cuenta_id = ?
            ORDER BY c.email`,
      args: [cuentaId],
    },
    {
      sql: `SELECT email FROM cuenta_invitaciones
            WHERE cuenta_id = ? AND aceptada_at IS NULL AND expires_at > DATETIME('now')
            ORDER BY created_at DESC`,
      args: [cuentaId],
    },
    // A quiénes sumó esta cuenta (hayan entrado o no): son los que puede quitar.
    { sql: "SELECT DISTINCT email FROM cuenta_invitaciones WHERE cuenta_id = ?", args: [cuentaId] },
  ], "read");

  const activosEmails = new Set(activos.rows.map((row) => String(row.email)));
  const sumados = new Set(sumadosPorMi.rows.map((row) => String(row.email)));
  return [
    ...[...activosEmails].map((email) => ({ email, estado: "activo" as const, puedeQuitar: sumados.has(email) })),
    ...invitados.rows.map((row) => String(row.email)).filter((email) => !activosEmails.has(email)).map((email) => ({ email, estado: "invitado" as const, puedeQuitar: true })),
  ];
}

// ── Sesiones ─────────────────────────────────────────────────────────────

/**
 * Cierra el acceso después de un código correcto: marca el código como usado, crea la
 * cuenta si es la primera vez, abre la sesión y aplica invitaciones pendientes.
 * Si viene linkUserId, vincula la cuenta con ese usuario del sitio. Todo en una transacción.
 */
export async function openCuentaSession(input: {
  email: string;
  codeId: number;
  tokenHash: string;
  sessionHours: number;
  linkUserId?: number;
}): Promise<void> {
  const client = await db();
  const hours = Math.max(1, Math.floor(input.sessionHours));

  const statements: InStatement[] = [
    { sql: "UPDATE cuenta_codigos SET usado_at = CURRENT_TIMESTAMP WHERE id = ?", args: [input.codeId] },
    {
      sql: `INSERT INTO cuentas (id, email, last_login_at) VALUES (?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(email) DO UPDATE SET last_login_at = CURRENT_TIMESTAMP`,
      args: [createRandomId(), input.email],
    },
    {
      sql: `INSERT INTO cuenta_sesiones (token_hash, cuenta_id, expires_at)
            SELECT ?, id, DATETIME('now', '+${hours} hours') FROM cuentas WHERE email = ?`,
      args: [input.tokenHash, input.email],
    },
    "DELETE FROM cuenta_sesiones WHERE expires_at <= DATETIME('now')",
    ...applyInvitationsStatements(input.email),
  ];

  if (input.linkUserId !== undefined) {
    // Solo si la cuenta no tiene usuario y el usuario no tiene otra cuenta.
    statements.push({
      sql: `UPDATE cuentas SET user_id = ?
            WHERE email = ? AND user_id IS NULL AND NOT EXISTS (SELECT 1 FROM cuentas WHERE user_id = ?)`,
      args: [input.linkUserId, input.email, input.linkUserId],
    });
  }

  await client.batch(statements, "write");
}

export async function getCuentaSesionByTokenHash(tokenHash: string): Promise<CuentaSesion | null> {
  const client = await db();
  const result = await client.execute({
    sql: `SELECT c.id, c.email, c.consentimiento_at
          FROM cuenta_sesiones s
          JOIN cuentas c ON c.id = s.cuenta_id
          WHERE s.token_hash = ? AND s.expires_at > DATETIME('now')
          LIMIT 1`,
    args: [tokenHash],
  });
  return result.rows[0] ? mapCuenta(result.rows[0] as Record<string, unknown>, "codigo") : null;
}

/** Cuenta familiar vinculada a un usuario del sitio (ya confirmó su email alguna vez). */
export async function getCuentaSesionByUserId(userId: number): Promise<CuentaSesion | null> {
  const client = await db();
  const result = await client.execute({
    sql: "SELECT id, email, consentimiento_at FROM cuentas WHERE user_id = ? LIMIT 1",
    args: [userId],
  });
  return result.rows[0] ? mapCuenta(result.rows[0] as Record<string, unknown>, "usuario") : null;
}

export async function deleteCuentaSession(tokenHash: string): Promise<void> {
  const client = await db();
  await client.execute({
    sql: "DELETE FROM cuenta_sesiones WHERE token_hash = ?",
    args: [tokenHash],
  });
}

// ── Cambio de email ──────────────────────────────────────────────────────

/**
 * Cambia el email de acceso de una cuenta, después de verificar un código enviado al nuevo.
 * Cierra las demás sesiones abiertas. Devuelve false si el email nuevo ya es de otra cuenta.
 */
export async function changeCuentaEmail(input: {
  cuentaId: string;
  newEmail: string;
  codeId: number;
  keepTokenHash: string | null;
}): Promise<boolean> {
  const client = await db();
  try {
    await client.batch([
      { sql: "UPDATE cuenta_codigos SET usado_at = CURRENT_TIMESTAMP WHERE id = ?", args: [input.codeId] },
      { sql: "UPDATE cuentas SET email = ? WHERE id = ?", args: [input.newEmail, input.cuentaId] },
      {
        sql: "DELETE FROM cuenta_sesiones WHERE cuenta_id = ? AND token_hash <> ?",
        args: [input.cuentaId, input.keepTokenHash ?? ""],
      },
      ...applyInvitationsStatements(input.newEmail),
    ], "write");
    return true;
  } catch (error) {
    if (error instanceof Error && /UNIQUE/i.test(error.message)) return false;
    throw error;
  }
}
