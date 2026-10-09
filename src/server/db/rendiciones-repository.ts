import "server-only";
import { randomBytes } from "node:crypto";
import { getTursoClient } from "@/server/db/turso";

// Cuentas claras: la rendición de cada mes (lo que había en la cuenta, lo que entró y lo que salió),
// que carga el equipo de Logística y ve cualquiera en la página de Logística. Hay una por mes.

export interface Movimiento {
  tipo: "ingreso" | "egreso";
  concepto: string;
  /** En pesos, sin centavos. */
  monto: number;
}

export interface Rendicion {
  id: string;
  /** Mes de la rendición, AAAA-MM. */
  mes: string;
  /**
   * Lo que ya había en la cuenta al empezar el mes, en pesos. Si es null, se toma lo que
   * quedó del mes anterior cargado (o cero, si no hay ninguno).
   */
  saldoInicial: number | null;
  nota: string;
  movimientos: Movimiento[];
}

/** Ya hay una rendición cargada para ese mes. */
export class MesRepetidoError extends Error {}

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
      // Las rendiciones pasaron de ser por evento a ser por mes: se suma lo que había en la cuenta.
      // De la columna `fecha` se usa solo el mes (se guarda el día 1) y `evento` queda con el nombre del mes.
      .then(() => clientOrThrow().execute("ALTER TABLE rendiciones ADD COLUMN saldo_inicial INTEGER").catch(() => undefined))
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

/** Todas las rendiciones, del mes más nuevo al más viejo. */
export async function listRendiciones(): Promise<Rendicion[]> {
  await ensureSchema();
  const result = await clientOrThrow().execute("SELECT id, fecha, nota, movimientos_json, saldo_inicial FROM rendiciones ORDER BY fecha DESC, updated_at DESC");
  return result.rows.map((row) => ({
    id: String(row.id),
    mes: String(row.fecha).slice(0, 7),
    saldoInicial: row.saldo_inicial === null || row.saldo_inicial === undefined ? null : Number(row.saldo_inicial),
    nota: String(row.nota ?? ""),
    movimientos: leerMovimientos(row.movimientos_json),
  }));
}

function nombreDelMes(mes: string): string {
  const [anio, numero] = mes.split("-").map(Number);
  return new Date(Date.UTC(anio, numero - 1, 15)).toLocaleDateString("es-AR", { month: "long", year: "numeric", timeZone: "UTC" });
}

/** Crea la rendición de un mes (sin id) o reemplaza la que ya existe. Devuelve su id. */
export async function saveRendicion(datos: Omit<Rendicion, "id"> & { id?: string }, userId: number | null): Promise<string> {
  await ensureSchema();
  const client = clientOrThrow();
  const id = datos.id || randomBytes(12).toString("hex");
  const fecha = `${datos.mes}-01`;
  // Una sola rendición por mes: si ya hay otra, se edita esa en lugar de cargar una segunda.
  const repetida = await client.execute({ sql: "SELECT 1 FROM rendiciones WHERE SUBSTR(fecha, 1, 7) = ? AND id <> ? LIMIT 1", args: [datos.mes, id] });
  if (repetida.rows.length > 0) throw new MesRepetidoError(`Ya hay una rendición de ${nombreDelMes(datos.mes)}. Elegila y tocá «Editar» para cambiarla.`);
  await client.execute({
    sql: `INSERT INTO rendiciones (id, evento, fecha, nota, movimientos_json, saldo_inicial, updated_by_user_id) VALUES (?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET evento = excluded.evento, fecha = excluded.fecha, nota = excluded.nota,
            movimientos_json = excluded.movimientos_json, saldo_inicial = excluded.saldo_inicial,
            updated_by_user_id = excluded.updated_by_user_id, updated_at = CURRENT_TIMESTAMP`,
    args: [id, nombreDelMes(datos.mes), fecha, datos.nota, JSON.stringify(datos.movimientos), datos.saldoInicial, userId],
  });
  return id;
}

export async function deleteRendicion(id: string): Promise<void> {
  await ensureSchema();
  await clientOrThrow().execute({ sql: "DELETE FROM rendiciones WHERE id = ?", args: [id] });
}
