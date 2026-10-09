import "server-only";
import { getTursoClient } from "@/server/db/turso";

// Información práctica de un evento con inscripción: dónde es, a qué hora, qué llevar y cómo
// pagar. Se muestra en la página del evento. Va en una tabla aparte de la configuración de la
// inscripción para que editar una cosa no pueda romper la otra.

export interface EventoInfo {
  lugar: string;
  direccion: string;
  /** Enlace a Google Maps; si falta, el mapa se busca por la dirección. */
  mapaUrl: string;
  llegada: string;
  salida: string;
  queLlevar: string[];
  pago: {
    alias: string;
    cbu: string;
    titular: string;
    /** A quién se le manda el comprobante. */
    comprobante: string;
    nota: string;
  };
}

export const EVENTO_INFO_VACIA: EventoInfo = {
  lugar: "",
  direccion: "",
  mapaUrl: "",
  llegada: "",
  salida: "",
  queLlevar: [],
  pago: { alias: "", cbu: "", titular: "", comprobante: "", nota: "" },
};

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
        `CREATE TABLE IF NOT EXISTS evento_info (
          evento_id TEXT PRIMARY KEY,
          datos_json TEXT NOT NULL,
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

/** La información cargada para el evento; vacía si todavía no se cargó nada. */
export async function getEventoInfo(eventoId: string): Promise<EventoInfo> {
  await ensureSchema();
  const result = await clientOrThrow().execute({ sql: "SELECT datos_json FROM evento_info WHERE evento_id = ?", args: [eventoId] });
  const row = result.rows[0];
  if (!row) return EVENTO_INFO_VACIA;
  try {
    const datos = JSON.parse(String(row.datos_json)) as Partial<EventoInfo>;
    return {
      ...EVENTO_INFO_VACIA,
      ...datos,
      queLlevar: Array.isArray(datos.queLlevar) ? datos.queLlevar.map(String) : [],
      pago: { ...EVENTO_INFO_VACIA.pago, ...(datos.pago ?? {}) },
    };
  } catch {
    return EVENTO_INFO_VACIA;
  }
}

export async function saveEventoInfo(eventoId: string, info: EventoInfo): Promise<void> {
  await ensureSchema();
  await clientOrThrow().execute({
    sql: `INSERT INTO evento_info (evento_id, datos_json) VALUES (?, ?)
          ON CONFLICT(evento_id) DO UPDATE SET datos_json = excluded.datos_json, updated_at = CURRENT_TIMESTAMP`,
    args: [eventoId, JSON.stringify(info)],
  });
}
