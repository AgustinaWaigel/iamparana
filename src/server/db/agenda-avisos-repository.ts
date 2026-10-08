import "server-only";
import { getTursoClient } from "@/server/db/turso";

// Eventos de la agenda que tienen activadas las notificaciones. La agenda puede venir de
// Google Calendar o de la base local, así que la marca se guarda aparte, por id de evento.
// Solo los eventos marcados avisan al celular (7 días antes, el día anterior y el mismo día).

let schemaPromise: Promise<void> | null = null;

function clientOrThrow() {
  const client = getTursoClient();
  if (!client) throw new Error("Turso no configurado");
  return client;
}

function ensureSchema() {
  if (!schemaPromise) {
    schemaPromise = clientOrThrow()
      .execute(
        `CREATE TABLE IF NOT EXISTS agenda_avisos (
          evento_id TEXT PRIMARY KEY,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`,
      )
      .then(() => undefined)
      .catch((error) => {
        schemaPromise = null;
        throw error;
      });
  }
  return schemaPromise;
}

/** Ids de los eventos con notificaciones activadas. */
export async function listAgendaAvisos(): Promise<Set<string>> {
  await ensureSchema();
  const result = await clientOrThrow().execute("SELECT evento_id FROM agenda_avisos");
  return new Set(result.rows.map((row) => String(row.evento_id)));
}

export async function setAgendaAviso(eventoId: string | number, activo: boolean): Promise<void> {
  await ensureSchema();
  await clientOrThrow().execute(
    activo
      ? { sql: "INSERT OR IGNORE INTO agenda_avisos (evento_id) VALUES (?)", args: [String(eventoId)] }
      : { sql: "DELETE FROM agenda_avisos WHERE evento_id = ?", args: [String(eventoId)] },
  );
}
