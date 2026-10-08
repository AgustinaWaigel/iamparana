import "server-only";

import { ensureInscripcionesSchema, inscripcionesClient } from "@/server/db/inscripciones-schema";
import { decryptJson } from "@/server/lib/inscripciones-crypto";
import { todayYmd, type ContactoData, type Rol, type SaludData } from "@/server/lib/inscripciones-validation";

// Lecturas del panel de administración. Devuelven datos de todas las familias, así
// que solo se llaman desde páginas y rutas que ya verificaron que quien pide es admin.

/** Las cuentas de prueba usan un dominio que no existe, para poder reconocerlas y borrarlas. */
export const DOMINIO_PRUEBA = "@prueba.invalid";

export interface InscriptoAdmin {
  inscripcionId: string;
  personaId: string;
  nombre: string;
  apellido: string;
  sexo: string | null;
  fechaNacimiento: string | null;
  telefono: string | null;
  ciudad: string | null;
  grupoNombre: string | null;
  /** Color de su IAM en las planillas (#rrggbb); null si no tiene. */
  grupoColor: string | null;
  /** Área en la que participa en este evento (rol "area"). */
  area: string | null;
  /** Grupo o etapa que anima en este evento (rol "animador"). */
  animaA: string | null;
  rol: Rol;
  estado: string;
  createdAt: string;
  /** Grado al momento de inscribirse. */
  grado: string | null;
  respuestas: Record<string, string>;
  /** Ficha de salud tal como quedó al inscribirse. */
  salud: SaludData | null;
  contactos: ContactoData[];
  firmaEventoId: string | null;
  /** true/false si respondió el uso de imagen este año; null si falta. */
  imagen: boolean | null;
  firmaImagenId: string | null;
  cuentaEmail: string | null;
  esPrueba: boolean;
  /** Monto que se le avisó al inscribirse; null si el evento no tenía uno para su ciudad. */
  monto: number | null;
}

async function db() {
  await ensureInscripcionesSchema();
  return inscripcionesClient();
}

function parseJson<T>(value: unknown, fallback: T): T {
  try {
    return typeof value === "string" ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

type Snapshot = {
  persona?: { grado?: string | null };
  salud?: SaludData | null;
  contactos?: ContactoData[];
  /** Formato anterior: un solo contacto. */
  contacto?: ContactoData | null;
};

/** Inscriptos activos de un evento, ordenados por apellido. */
export async function listInscriptosEvento(eventoId: string): Promise<InscriptoAdmin[]> {
  const client = await db();
  const today = todayYmd();
  const imagenVigente = "f.tipo = 'imagen' AND f.persona_id = i.persona_id AND f.vigente_hasta >= ? ORDER BY f.created_at DESC, f.rowid DESC LIMIT 1";
  const result = await client.execute({
    sql: `SELECT i.id, i.persona_id, i.rol, i.estado, i.created_at, i.respuestas_json, i.datos_snapshot_cifrado, i.monto,
                 p.nombre, p.apellido, p.sexo, p.fecha_nacimiento, p.telefono, p.ciudad, p.area, p.anima_a, p.grado,
                 -- Hay grupos con el mismo nombre en ciudades distintas: la ciudad los distingue.
                 CASE WHEN g.ciudad IS NULL OR g.ciudad = '' THEN g.nombre ELSE g.nombre || ' (' || g.ciudad || ')' END AS grupo_nombre,
                 g.color AS grupo_color, c.email AS cuenta_email,
                 (SELECT f.id FROM firmas f
                   WHERE f.tipo = 'evento' AND f.persona_id = i.persona_id AND f.evento_id = i.evento_id AND f.revocada_at IS NULL
                   ORDER BY f.created_at DESC, f.rowid DESC LIMIT 1) AS firma_evento_id,
                 (SELECT CASE WHEN f.revocada_at IS NOT NULL THEN 0 ELSE f.acepta END FROM firmas f WHERE ${imagenVigente}) AS imagen,
                 (SELECT f.id FROM firmas f WHERE ${imagenVigente}) AS firma_imagen_id
          FROM inscripciones i
          JOIN personas p ON p.id = i.persona_id
          LEFT JOIN grupos_iam g ON g.id = p.grupo_id
          LEFT JOIN cuentas c ON c.id = i.creada_por_cuenta_id
          WHERE i.evento_id = ? AND i.estado != 'cancelada'
          ORDER BY p.apellido COLLATE NOCASE, p.nombre COLLATE NOCASE`,
    args: [today, today, eventoId],
  });

  return result.rows.map((row) => {
    let snapshot: Snapshot = {};
    try {
      if (row.datos_snapshot_cifrado) snapshot = decryptJson<Snapshot>(String(row.datos_snapshot_cifrado));
    } catch {
      // Una copia que no se puede leer no debe tirar abajo todo el listado.
    }
    const cuentaEmail = row.cuenta_email ? String(row.cuenta_email) : null;
    const respuestas = parseJson<Record<string, string>>(row.respuestas_json, {});
    return {
      inscripcionId: String(row.id),
      personaId: String(row.persona_id),
      nombre: String(row.nombre),
      apellido: String(row.apellido),
      sexo: row.sexo ? String(row.sexo) : null,
      fechaNacimiento: row.fecha_nacimiento ? String(row.fecha_nacimiento) : null,
      telefono: row.telefono ? String(row.telefono) : null,
      ciudad: row.ciudad ? String(row.ciudad) : null,
      grupoNombre: row.grupo_nombre ? String(row.grupo_nombre) : null,
      grupoColor: row.grupo_color ? String(row.grupo_color) : null,
      area: respuestas.rol_area ?? null,
      animaA: respuestas.rol_anima_a ?? null,
      rol: String(row.rol) as Rol,
      estado: String(row.estado),
      createdAt: String(row.created_at),
      grado: snapshot.persona?.grado ?? (row.grado ? String(row.grado) : null),
      respuestas,
      salud: snapshot.salud ?? null,
      contactos: snapshot.contactos ?? (snapshot.contacto ? [snapshot.contacto] : []),
      firmaEventoId: row.firma_evento_id ? String(row.firma_evento_id) : null,
      imagen: row.imagen === null || row.imagen === undefined ? null : Number(row.imagen) === 1,
      firmaImagenId: row.firma_imagen_id ? String(row.firma_imagen_id) : null,
      cuentaEmail,
      esPrueba: Boolean(cuentaEmail?.endsWith(DOMINIO_PRUEBA)),
      monto: row.monto === null || row.monto === undefined ? null : Number(row.monto),
    };
  });
}

/** Cantidad de inscriptos activos y de pendientes de firma por evento. */
export async function countInscriptosPorEvento(): Promise<Map<string, { total: number; pendientes: number }>> {
  const client = await db();
  const result = await client.execute(
    `SELECT evento_id, COUNT(*) AS total, SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) AS pendientes
     FROM inscripciones WHERE estado != 'cancelada' GROUP BY evento_id`,
  );
  return new Map(result.rows.map((row) => [String(row.evento_id), { total: Number(row.total), pendientes: Number(row.pendientes ?? 0) }]));
}

export interface BajaAdmin {
  inscripcionId: string;
  nombre: string;
  apellido: string;
  rol: Rol;
  grupoNombre: string | null;
  /** Fecha y hora de la baja (UTC). null en bajas anteriores a que se registrara. */
  bajaAt: string | null;
  /** true si se dio de baja después del cierre de la inscripción: corresponde pagar igual. */
  fueraDeTermino: boolean;
  monto: number | null;
}

/** Inscripciones dadas de baja en un evento, de la más reciente a la más vieja. */
export async function listBajasEvento(eventoId: string): Promise<BajaAdmin[]> {
  const client = await db();
  const result = await client.execute({
    sql: `SELECT i.id, i.rol, i.baja_at, i.baja_fuera_de_termino, i.monto, p.nombre, p.apellido,
                 CASE WHEN g.ciudad IS NULL OR g.ciudad = '' THEN g.nombre ELSE g.nombre || ' (' || g.ciudad || ')' END AS grupo_nombre
          FROM inscripciones i
          JOIN personas p ON p.id = i.persona_id
          LEFT JOIN grupos_iam g ON g.id = p.grupo_id
          WHERE i.evento_id = ? AND i.estado = 'cancelada'
          ORDER BY i.baja_at DESC, p.apellido COLLATE NOCASE`,
    args: [eventoId],
  });
  return result.rows.map((row) => ({
    inscripcionId: String(row.id),
    nombre: String(row.nombre),
    apellido: String(row.apellido),
    rol: String(row.rol) as Rol,
    grupoNombre: row.grupo_nombre ? String(row.grupo_nombre) : null,
    bajaAt: row.baja_at ? String(row.baja_at) : null,
    fueraDeTermino: Number(row.baja_fuera_de_termino) === 1,
    monto: row.monto === null || row.monto === undefined ? null : Number(row.monto),
  }));
}

export type PagoEstado = "pendiente" | "pagado" | "exento";
export type PagoMedio = "transferencia" | "efectivo";

export interface PagoAdmin {
  inscripcionId: string;
  nombre: string;
  apellido: string;
  rol: Rol;
  /** Área en la que participa en este evento (rol "area"). */
  area: string | null;
  grupoNombre: string | null;
  grupoColor: string | null;
  /** Grado escolar, si es menor: los de jardín no pagan. */
  grado: string | null;
  ciudad: string | null;
  monto: number | null;
  pagoEstado: PagoEstado;
  /** Con qué pagó; null si no pagó o no se anotó. */
  pagoMedio: PagoMedio | null;
  /** true si se dio de baja después del cierre: no va al evento, pero paga igual. */
  esBaja: boolean;
  /** Cuenta que hizo la inscripción y el adulto que responde por ella. */
  cuentaId: string | null;
  cuentaEmail: string | null;
  responsable: string | null;
  responsableTelefono: string | null;
}

/** Todo lo que corresponde cobrar en un evento: inscriptos activos y bajas posteriores al cierre. */
export async function listPagosEvento(eventoId: string): Promise<PagoAdmin[]> {
  const client = await db();
  const titular = "FROM cuenta_persona cp2 JOIN personas p2 ON p2.id = cp2.persona_id WHERE cp2.cuenta_id = i.creada_por_cuenta_id AND cp2.es_titular = 1 LIMIT 1";
  const result = await client.execute({
    sql: `SELECT i.id, i.rol, i.estado, i.monto, i.pago_estado, i.pago_medio, i.respuestas_json, i.creada_por_cuenta_id, p.nombre, p.apellido, p.grado, p.ciudad,
                 CASE WHEN g.ciudad IS NULL OR g.ciudad = '' THEN g.nombre ELSE g.nombre || ' (' || g.ciudad || ')' END AS grupo_nombre,
                 g.color AS grupo_color, c.email AS cuenta_email,
                 (SELECT p2.nombre || ' ' || p2.apellido ${titular}) AS responsable,
                 (SELECT p2.telefono ${titular}) AS responsable_telefono
          FROM inscripciones i
          JOIN personas p ON p.id = i.persona_id
          LEFT JOIN grupos_iam g ON g.id = p.grupo_id
          LEFT JOIN cuentas c ON c.id = i.creada_por_cuenta_id
          WHERE i.evento_id = ? AND (i.estado != 'cancelada' OR i.baja_fuera_de_termino = 1)
          ORDER BY p.apellido COLLATE NOCASE, p.nombre COLLATE NOCASE`,
    args: [eventoId],
  });
  return result.rows.map((row) => ({
    inscripcionId: String(row.id),
    nombre: String(row.nombre),
    apellido: String(row.apellido),
    rol: String(row.rol) as Rol,
    area: parseJson<Record<string, string>>(row.respuestas_json, {}).rol_area ?? null,
    grupoNombre: row.grupo_nombre ? String(row.grupo_nombre) : null,
    grupoColor: row.grupo_color ? String(row.grupo_color) : null,
    grado: row.grado ? String(row.grado) : null,
    monto: row.monto === null || row.monto === undefined ? null : Number(row.monto),
    ciudad: row.ciudad ? String(row.ciudad) : null,
    pagoEstado: (["pagado", "exento"].includes(String(row.pago_estado)) ? String(row.pago_estado) : "pendiente") as PagoEstado,
    pagoMedio: row.pago_medio === "transferencia" || row.pago_medio === "efectivo" ? row.pago_medio : null,
    esBaja: String(row.estado) === "cancelada",
    cuentaId: row.creada_por_cuenta_id ? String(row.creada_por_cuenta_id) : null,
    cuentaEmail: row.cuenta_email ? String(row.cuenta_email) : null,
    responsable: row.responsable ? String(row.responsable) : null,
    responsableTelefono: row.responsable_telefono ? String(row.responsable_telefono) : null,
  }));
}

/**
 * Marca el pago de varias inscripciones de un evento. Devuelve cuántas cambió.
 * Elegir un medio de pago marca el pago como hecho; si deja de estar pagado, el medio se borra.
 */
export async function setPagoEstado(input: { eventoId: string; inscripcionIds: string[]; estado?: PagoEstado; medio?: PagoMedio | null; userId: number }): Promise<number> {
  const client = await db();
  const estado = input.estado ?? (input.medio ? "pagado" : null);
  const result = await client.execute({
    sql: `UPDATE inscripciones
          SET pago_estado = COALESCE(?, pago_estado),
              pago_medio = CASE WHEN COALESCE(?, pago_estado) != 'pagado' THEN NULL WHEN ? = 1 THEN ? ELSE pago_medio END,
              pago_marcado_por = ?, pago_marcado_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
          WHERE evento_id = ? AND id IN (${input.inscripcionIds.map(() => "?").join(", ")})`,
    args: [estado, estado, input.medio === undefined ? 0 : 1, input.medio ?? null, input.userId, input.eventoId, ...input.inscripcionIds],
  });
  return result.rowsAffected;
}
