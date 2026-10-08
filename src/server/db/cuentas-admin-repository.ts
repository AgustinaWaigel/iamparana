import "server-only";

import { applyInvitationsStatements } from "@/server/db/cuentas-repository";
import { ensureInscripcionesSchema, inscripcionesClient } from "@/server/db/inscripciones-schema";

// Recuperación de cuentas familiares desde el panel del admin: buscar una cuenta, cambiarle
// el email, y dar o quitar el acceso de otros adultos. Solo se llama desde rutas que ya
// verificaron que quien pide es admin.

async function db() {
  await ensureInscripcionesSchema();
  return inscripcionesClient();
}

export interface CuentaResumen {
  id: string;
  email: string;
  ultimoIngreso: string | null;
  /** Adulto que responde por la cuenta, si cargó sus datos. */
  responsable: string | null;
  personas: number;
}

/** Busca cuentas por email o por nombre o apellido de alguna de sus personas. */
export async function buscarCuentas(texto: string): Promise<CuentaResumen[]> {
  const client = await db();
  const like = `%${texto.trim().toLowerCase().replace(/[%_]/g, "")}%`;
  const result = await client.execute({
    sql: `SELECT c.id, c.email, c.last_login_at,
                 (SELECT p.nombre || ' ' || p.apellido FROM cuenta_persona cp JOIN personas p ON p.id = cp.persona_id WHERE cp.cuenta_id = c.id AND cp.es_titular = 1 LIMIT 1) AS responsable,
                 (SELECT COUNT(*) FROM cuenta_persona cp WHERE cp.cuenta_id = c.id) AS personas
          FROM cuentas c
          WHERE LOWER(c.email) LIKE ?
             OR EXISTS (SELECT 1 FROM cuenta_persona cp JOIN personas p ON p.id = cp.persona_id
                        WHERE cp.cuenta_id = c.id AND (LOWER(p.apellido) LIKE ? OR LOWER(p.nombre) LIKE ? OR LOWER(p.nombre || ' ' || p.apellido) LIKE ?))
          ORDER BY c.email COLLATE NOCASE
          LIMIT 25`,
    args: [like, like, like, like],
  });
  return result.rows.map((row) => ({
    id: String(row.id),
    email: String(row.email),
    ultimoIngreso: row.last_login_at ? String(row.last_login_at) : null,
    responsable: row.responsable ? String(row.responsable) : null,
    personas: Number(row.personas),
  }));
}

export interface CuentaDetalle {
  id: string;
  email: string;
  ultimoIngreso: string | null;
  personas: Array<{ id: string; nombre: string; apellido: string; esTitular: boolean; vinculo: string | null; otrasCuentas: number }>;
  /** Otras cuentas que comparten alguna persona con esta. */
  adultos: Array<{ cuentaId: string; email: string; compartidas: number }>;
  /** Invitaciones enviadas que todavía no se usaron. */
  invitaciones: string[];
}

export async function getCuentaDetalle(cuentaId: string): Promise<CuentaDetalle | null> {
  const client = await db();
  const [cuenta, personas, adultos, invitaciones] = await client.batch([
    { sql: "SELECT id, email, last_login_at FROM cuentas WHERE id = ? LIMIT 1", args: [cuentaId] },
    {
      sql: `SELECT p.id, p.nombre, p.apellido, cp.es_titular, cp.vinculo,
                   (SELECT COUNT(*) FROM cuenta_persona otra WHERE otra.persona_id = p.id AND otra.cuenta_id <> cp.cuenta_id) AS otras
            FROM cuenta_persona cp JOIN personas p ON p.id = cp.persona_id
            WHERE cp.cuenta_id = ? ORDER BY cp.es_titular DESC, p.apellido COLLATE NOCASE, p.nombre COLLATE NOCASE`,
      args: [cuentaId],
    },
    {
      sql: `SELECT c.id, c.email, COUNT(*) AS compartidas
            FROM cuenta_persona mine
            JOIN cuenta_persona other ON other.persona_id = mine.persona_id AND other.cuenta_id <> mine.cuenta_id
            JOIN cuentas c ON c.id = other.cuenta_id
            WHERE mine.cuenta_id = ? GROUP BY c.id, c.email ORDER BY c.email`,
      args: [cuentaId],
    },
    { sql: "SELECT email FROM cuenta_invitaciones WHERE cuenta_id = ? AND aceptada_at IS NULL AND expires_at > DATETIME('now') ORDER BY created_at DESC", args: [cuentaId] },
  ], "read");

  const row = cuenta.rows[0];
  if (!row) return null;
  return {
    id: String(row.id),
    email: String(row.email),
    ultimoIngreso: row.last_login_at ? String(row.last_login_at) : null,
    personas: personas.rows.map((p) => ({
      id: String(p.id),
      nombre: String(p.nombre),
      apellido: String(p.apellido),
      esTitular: Number(p.es_titular) === 1,
      vinculo: p.vinculo ? String(p.vinculo) : null,
      otrasCuentas: Number(p.otras),
    })),
    adultos: adultos.rows.map((a) => ({ cuentaId: String(a.id), email: String(a.email), compartidas: Number(a.compartidas) })),
    invitaciones: invitaciones.rows.map((i) => String(i.email)),
  };
}

/**
 * Cambia el email con el que se entra a una cuenta (para quien perdió el acceso al anterior).
 * Cierra sus sesiones y la desvincula del usuario del sitio que tuviera el email viejo.
 * Devuelve el email anterior, o null si el nuevo ya es de otra cuenta o la cuenta no existe.
 */
export async function adminCambiarEmail(cuentaId: string, nuevoEmail: string): Promise<string | null> {
  const client = await db();
  const actual = await client.execute({ sql: "SELECT email FROM cuentas WHERE id = ? LIMIT 1", args: [cuentaId] });
  if (!actual.rows[0]) return null;
  const anterior = String(actual.rows[0].email);
  try {
    await client.batch([
      { sql: "UPDATE cuentas SET email = ?, user_id = NULL WHERE id = ?", args: [nuevoEmail, cuentaId] },
      { sql: "DELETE FROM cuenta_sesiones WHERE cuenta_id = ?", args: [cuentaId] },
      { sql: "DELETE FROM cuenta_codigos WHERE email IN (?, ?)", args: [anterior, nuevoEmail] },
      ...applyInvitationsStatements(nuevoEmail),
    ], "write");
    return anterior;
  } catch (error) {
    if (error instanceof Error && /UNIQUE/i.test(error.message)) return null;
    throw error;
  }
}

/** Quita a otra cuenta el acceso a las personas de esta (no toca a la persona titular de la otra). */
export async function adminQuitarAcceso(cuentaId: string, otraCuentaId: string): Promise<number> {
  const client = await db();
  const [links] = await client.batch([
    {
      sql: `DELETE FROM cuenta_persona
            WHERE cuenta_id = ? AND es_titular = 0 AND persona_id IN (SELECT persona_id FROM cuenta_persona WHERE cuenta_id = ?)`,
      args: [otraCuentaId, cuentaId],
    },
    { sql: "DELETE FROM cuenta_invitaciones WHERE cuenta_id = ? AND email = (SELECT email FROM cuentas WHERE id = ?)", args: [cuentaId, otraCuentaId] },
    { sql: "DELETE FROM cuenta_sesiones WHERE cuenta_id = ?", args: [otraCuentaId] },
  ], "write");
  return links.rowsAffected;
}

/** Cancela una invitación que todavía no se usó. */
export async function adminCancelarInvitacion(cuentaId: string, email: string): Promise<number> {
  const client = await db();
  const result = await client.execute({ sql: "DELETE FROM cuenta_invitaciones WHERE cuenta_id = ? AND email = ? AND aceptada_at IS NULL", args: [cuentaId, email] });
  return result.rowsAffected;
}

/**
 * Saca a una persona de una cuenta. Solo si no es su titular y si otra cuenta también la tiene:
 * nadie queda sin un adulto que responda por él.
 */
export async function adminDesvincularPersona(cuentaId: string, personaId: string): Promise<boolean> {
  const client = await db();
  const result = await client.execute({
    sql: `DELETE FROM cuenta_persona
          WHERE cuenta_id = ? AND persona_id = ? AND es_titular = 0
            AND EXISTS (SELECT 1 FROM cuenta_persona otra WHERE otra.persona_id = cuenta_persona.persona_id AND otra.cuenta_id <> cuenta_persona.cuenta_id)`,
    args: [cuentaId, personaId],
  });
  return result.rowsAffected > 0;
}
