import "server-only";
import { randomBytes } from "node:crypto";
import { getTursoClient } from "@/server/db/turso";

// Cuentas claras: la rendición de cada evento (lo que entró y lo que salió), que carga el
// equipo de Logística y ve cualquiera en la página de Logística.

export interface Movimiento {
  tipo: "ingreso" | "egreso";
  concepto: string;
  /** En pesos, sin centavos. */
  monto: number;
}

export interface Rendicion {
  id: string;
  evento: string;
  /** Fecha del evento, AAAA-MM-DD. */
  fecha: string;
  nota: string;
  movimientos: Movimiento[];
}

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
        `CREATE TABLE IF NOT EXISTS rendiciones (
          id TEXT PRIMARY KEY,
          evento TEXT NOT NULL,
          fecha TEXT NOT NULL,
          nota TEXT NOT NULL DEFAULT '',
          movimientos_json TEXT NOT NULL DEFAULT '[]',
          updated_by_user_id INTEGER,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
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

function leerMovimientos(valor: unknown): Movimiento[] {
  try {
    const lista: unknown = JSON.parse(String(valor ?? "[]"));
    if (!Array.isArray(lista)) return [];
    return lista.flatMap((item) => {
      const monto = Number(item?.monto);
      if ((item?.tipo !== "ingreso" && item?.tipo !== "egreso") || typeof item?.concepto !== "string" || !Number.isFinite(monto)) return [];
      return [{ tipo: item.tipo, concepto: item.concepto, monto }];
    });
  } catch {
    return [];
  }
}

/** Todas las rendiciones, de la más nueva a la más vieja. */
export async function listRendiciones(): Promise<Rendicion[]> {
  await ensureSchema();
  const result = await clientOrThrow().execute("SELECT id, evento, fecha, nota, movimientos_json FROM rendiciones ORDER BY fecha DESC, updated_at DESC");
  return result.rows.map((row) => ({
    id: String(row.id),
    evento: String(row.evento),
    fecha: String(row.fecha),
    nota: String(row.nota ?? ""),
    movimientos: leerMovimientos(row.movimientos_json),
  }));
}

/** Crea la rendición (sin id) o reemplaza la que ya existe. Devuelve su id. */
export async function saveRendicion(datos: Omit<Rendicion, "id"> & { id?: string }, userId: number | null): Promise<string> {
  await ensureSchema();
  const id = datos.id || randomBytes(12).toString("hex");
  await clientOrThrow().execute({
    sql: `INSERT INTO rendiciones (id, evento, fecha, nota, movimientos_json, updated_by_user_id) VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET evento = excluded.evento, fecha = excluded.fecha, nota = excluded.nota,
            movimientos_json = excluded.movimientos_json, updated_by_user_id = excluded.updated_by_user_id, updated_at = CURRENT_TIMESTAMP`,
    args: [id, datos.evento, datos.fecha, datos.nota, JSON.stringify(datos.movimientos), userId],
  });
  return id;
}

export async function deleteRendicion(id: string): Promise<void> {
  await ensureSchema();
  await clientOrThrow().execute({ sql: "DELETE FROM rendiciones WHERE id = ?", args: [id] });
}
