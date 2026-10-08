import "server-only";
import { getTursoClient } from "@/server/db/turso";

// Temario de Formación: un lema por año y una ficha por mes. Lo carga el equipo de Formación
// a principio de cada año. La fila con mes 0 guarda lo general del año.

export interface TemarioItem {
  /** En la fila del año es el lema; en un mes, el tema. */
  tema: string;
  /** Iluminación: las citas bíblicas. */
  cita: string;
  /** Aprendizajes y vida (en la fila del año, de qué se trata). */
  detalle: string;
  materialUrl: string;
  /** Eje del año al que pertenece el mes, por ejemplo "Unidos en Cristo: ...". */
  eje: string;
  objetivo: string;
  virtudes: string;
  sagradaFamilia: string;
  herramientas: string;
  festividades: string;
  eventos: string;
}

export interface TemarioAnio {
  anio: number;
  general: TemarioItem;
  /** Solo los meses que tienen tema, con `mes` de 1 a 12. */
  meses: Array<TemarioItem & { mes: number }>;
}

/** Campo del temario → columna de la tabla. */
const COLUMNAS: Record<keyof TemarioItem, string> = {
  tema: "tema",
  cita: "cita",
  detalle: "detalle",
  materialUrl: "material_url",
  eje: "eje",
  objetivo: "objetivo",
  virtudes: "virtudes",
  sagradaFamilia: "sagrada_familia",
  herramientas: "herramientas",
  festividades: "festividades",
  eventos: "eventos",
};
const CAMPOS = Object.keys(COLUMNAS) as Array<keyof TemarioItem>;

let schemaPromise: Promise<void> | null = null;

function clientOrThrow() {
  const client = getTursoClient();
  if (!client) throw new Error("Turso no configurado");
  return client;
}

async function crearSchema() {
  const client = clientOrThrow();
  await client.execute(
    `CREATE TABLE IF NOT EXISTS temario (
      anio INTEGER NOT NULL,
      mes INTEGER NOT NULL CHECK(mes BETWEEN 0 AND 12),
      tema TEXT NOT NULL DEFAULT '',
      cita TEXT NOT NULL DEFAULT '',
      detalle TEXT NOT NULL DEFAULT '',
      material_url TEXT NOT NULL DEFAULT '',
      updated_by_user_id INTEGER,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (anio, mes)
    )`,
  );
  // Columnas que se sumaron después: se agregan solo si faltan.
  const info = await client.execute("PRAGMA table_info(temario)");
  const existentes = new Set(info.rows.map((row) => String(row.name)));
  const faltan = Object.values(COLUMNAS).filter((columna) => !existentes.has(columna));
  if (faltan.length > 0) {
    await client.batch(faltan.map((columna) => `ALTER TABLE temario ADD COLUMN ${columna} TEXT NOT NULL DEFAULT ''`), "write");
  }
}

function ensureTemarioSchema() {
  if (!schemaPromise) {
    schemaPromise = crearSchema().catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }
  return schemaPromise;
}

export function temarioItemVacio(): TemarioItem {
  return Object.fromEntries(CAMPOS.map((campo) => [campo, ""])) as unknown as TemarioItem;
}

/** Todos los años cargados, del más nuevo al más viejo. */
export async function listTemario(): Promise<TemarioAnio[]> {
  await ensureTemarioSchema();
  const result = await clientOrThrow().execute(
    `SELECT anio, mes, ${Object.values(COLUMNAS).join(", ")} FROM temario ORDER BY anio DESC, mes ASC`,
  );
  const porAnio = new Map<number, TemarioAnio>();
  for (const row of result.rows) {
    const anio = Number(row.anio);
    const mes = Number(row.mes);
    const item = temarioItemVacio();
    for (const campo of CAMPOS) item[campo] = String(row[COLUMNAS[campo]] ?? "");
    let entrada = porAnio.get(anio);
    if (!entrada) {
      entrada = { anio, general: temarioItemVacio(), meses: [] };
      porAnio.set(anio, entrada);
    }
    if (mes === 0) entrada.general = item;
    else if (item.tema) entrada.meses.push({ ...item, mes });
  }
  return [...porAnio.values()];
}

/** Reemplaza el temario completo de un año. Los meses sin tema no se guardan. */
export async function saveTemarioAnio(
  anio: number,
  general: TemarioItem,
  meses: Array<TemarioItem & { mes: number }>,
  userId: number | null,
): Promise<void> {
  await ensureTemarioSchema();
  const columnas = Object.values(COLUMNAS);
  const insertar = (mes: number, item: TemarioItem) => ({
    sql: `INSERT INTO temario (anio, mes, ${columnas.join(", ")}, updated_by_user_id)
          VALUES (?, ?, ${columnas.map(() => "?").join(", ")}, ?)`,
    args: [anio, mes, ...CAMPOS.map((campo) => item[campo]), userId],
  });
  const filas = meses.filter((item) => item.tema);
  const hayGeneral = CAMPOS.some((campo) => general[campo]);
  await clientOrThrow().batch([
    { sql: "DELETE FROM temario WHERE anio = ?", args: [anio] },
    // La fila del año se guarda siempre que haya algo, así el año queda aunque todavía no tenga lema.
    ...(hayGeneral || filas.length > 0 ? [insertar(0, general)] : []),
    ...filas.map((item) => insertar(item.mes, item)),
  ], "write");
}
