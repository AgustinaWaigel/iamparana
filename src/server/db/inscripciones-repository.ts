import "server-only";

import type { InStatement } from "@libsql/client";
import { grupoDeGrado } from "@/app/inscripciones/grados";
import { SIN_MONTOS, montoPara, type Montos } from "@/app/inscripciones/montos";
import { ensureInscripcionesSchema, inscripcionesClient } from "@/server/db/inscripciones-schema";
import { blindIndex, createRandomId, decryptJson, decryptText, encryptJson, encryptText } from "@/server/lib/inscripciones-crypto";
import {
  EDAD_ADULTO,
  EDAD_CUENTA_PROPIA,
  ROLES,
  ageOn,
  normalizeCuil,
  preguntaAplica,
  todayYmd,
  type ContactoData,
  type EventoConfigInput,
  type InscribirInput,
  type PersonaInput,
  type Pregunta,
  type Rol,
  type SaludData,
  type TitularContactoInput,
} from "@/server/lib/inscripciones-validation";

// Datos del módulo de inscripciones. Regla de oro: toda función que lee o escribe
// datos de personas recibe la cuenta y verifica que la persona le pertenezca.

/** Error con un mensaje pensado para mostrarle a la familia o al admin. */
export class InscripcionError extends Error {}

async function db() {
  await ensureInscripcionesSchema();
  return inscripcionesClient();
}

// ── Grupos IAM ───────────────────────────────────────────────────────────

export interface GrupoIam {
  id: string;
  nombre: string;
  ciudad: string | null;
  activo: boolean;
  /** Color de la IAM en las planillas del admin (#rrggbb); null si no tiene. */
  color: string | null;
}

export async function listGrupos(soloActivos: boolean): Promise<GrupoIam[]> {
  const client = await db();
  const result = await client.execute(
    `SELECT id, nombre, ciudad, activo, color FROM grupos_iam ${soloActivos ? "WHERE activo = 1" : ""} ORDER BY nombre COLLATE NOCASE`,
  );
  return result.rows.map((row) => ({
    id: String(row.id),
    nombre: String(row.nombre),
    ciudad: row.ciudad ? String(row.ciudad) : null,
    activo: Number(row.activo) === 1,
    color: row.color ? String(row.color) : null,
  }));
}

export async function saveGrupo(input: { id?: string; nombre: string; ciudad: string | null; activo: boolean; color: string | null }): Promise<string> {
  const client = await db();
  if (input.id) {
    const result = await client.execute({
      sql: "UPDATE grupos_iam SET nombre = ?, ciudad = ?, activo = ?, color = ? WHERE id = ?",
      args: [input.nombre, input.ciudad, input.activo ? 1 : 0, input.color, input.id],
    });
    if (result.rowsAffected === 0) throw new InscripcionError("No encontramos ese grupo.");
    return input.id;
  }
  const id = createRandomId();
  await client.execute({
    sql: "INSERT INTO grupos_iam (id, nombre, ciudad, activo, color) VALUES (?, ?, ?, ?, ?)",
    args: [id, input.nombre, input.ciudad, input.activo ? 1 : 0, input.color],
  });
  return id;
}

// ── Configuración por evento ─────────────────────────────────────────────

export interface EventoConfig {
  eventoId: string;
  habilitada: boolean;
  abreAt: string | null;
  cierraAt: string | null;
  edadMin: number | null;
  edadMax: number | null;
  roles: Rol[];
  pideSalud: boolean;
  preguntas: Pregunta[];
  autorizacionTexto: string;
  montos: Montos;
}

function parseJson<T>(value: unknown, fallback: T): T {
  try {
    return typeof value === "string" ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function mapConfig(row: Record<string, unknown>): EventoConfig {
  const roles = parseJson<string[]>(row.roles_json, []).filter((rol): rol is Rol => (ROLES as readonly string[]).includes(rol));
  return {
    eventoId: String(row.evento_id),
    habilitada: Number(row.habilitada) === 1,
    abreAt: row.abre_at ? String(row.abre_at) : null,
    cierraAt: row.cierra_at ? String(row.cierra_at) : null,
    edadMin: row.edad_min === null || row.edad_min === undefined ? null : Number(row.edad_min),
    edadMax: row.edad_max === null || row.edad_max === undefined ? null : Number(row.edad_max),
    roles: roles.length > 0 ? roles : ["participante"],
    pideSalud: Number(row.pide_salud) === 1,
    preguntas: parseJson<Pregunta[]>(row.preguntas_json, []),
    autorizacionTexto: row.autorizacion_texto ? String(row.autorizacion_texto) : "",
    montos: { ...SIN_MONTOS, ...parseJson<Partial<Montos>>(row.montos_json, {}) },
  };
}

const CONFIG_COLUMNS =
  "evento_id, habilitada, abre_at, cierra_at, edad_min, edad_max, roles_json, pide_salud, preguntas_json, autorizacion_texto, montos_json";

export async function listEventoConfigs(): Promise<EventoConfig[]> {
  const client = await db();
  const result = await client.execute(`SELECT ${CONFIG_COLUMNS} FROM agenda_inscripcion`);
  return result.rows.map((row) => mapConfig(row as Record<string, unknown>));
}

export async function getEventoConfig(eventoId: string): Promise<EventoConfig | null> {
  const client = await db();
  const result = await client.execute({
    sql: `SELECT ${CONFIG_COLUMNS} FROM agenda_inscripcion WHERE evento_id = ? LIMIT 1`,
    args: [eventoId],
  });
  return result.rows[0] ? mapConfig(result.rows[0] as Record<string, unknown>) : null;
}

export async function saveEventoConfig(input: EventoConfigInput): Promise<void> {
  const client = await db();
  await client.execute({
    sql: `INSERT INTO agenda_inscripcion
            (evento_id, habilitada, abre_at, cierra_at, edad_min, edad_max, roles_json, pide_salud, preguntas_json, autorizacion_texto, montos_json, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(evento_id) DO UPDATE SET
            habilitada = excluded.habilitada, abre_at = excluded.abre_at, cierra_at = excluded.cierra_at,
            edad_min = excluded.edad_min,
            edad_max = excluded.edad_max, roles_json = excluded.roles_json, pide_salud = excluded.pide_salud,
            preguntas_json = excluded.preguntas_json, autorizacion_texto = excluded.autorizacion_texto,
            montos_json = excluded.montos_json,
            updated_at = CURRENT_TIMESTAMP`,
    args: [
      input.eventoId,
      input.habilitada ? 1 : 0,
      input.abreAt,
      input.cierraAt,
      input.edadMin,
      input.edadMax,
      JSON.stringify(input.roles),
      input.pideSalud ? 1 : 0,
      JSON.stringify(input.preguntas),
      input.autorizacionTexto,
      JSON.stringify(input.montos),
    ],
  });
}

// ── Familia ──────────────────────────────────────────────────────────────

export interface PersonaView {
  id: string;
  nombre: string;
  apellido: string;
  sexo: string | null;
  /** Solo los últimos dígitos: el CUIL completo no vuelve al navegador. */
  cuilFinal: string | null;
  /** null en el adulto responsable que solo dejó nombre y teléfono. */
  fechaNacimiento: string | null;
  /** true si es el adulto responsable que no participa de eventos (sin ficha completa). */
  soloContacto: boolean;
  telefono: string | null;
  ciudad: string | null;
  grupoId: string | null;
  grupoNombre: string | null;
  grado: string | null;
  gradoAnio: number | null;
  area: string | null;
  animaA: string | null;
  vinculo: string | null;
  esTitular: boolean;
  salud: SaludData | null;
  saludConfirmadoAt: string | null;
  contacto: ContactoData | null;
}

/** Personas de una cuenta. Es la única puerta de lectura de datos personales para las familias. */
export async function listPersonasDeCuenta(cuentaId: string): Promise<PersonaView[]> {
  const client = await db();
  const [personas, contactos] = await client.batch([
    {
      sql: `SELECT p.id, p.nombre, p.apellido, p.sexo, p.cuil_cifrado, p.fecha_nacimiento, p.telefono, p.ciudad,
                   p.grupo_id, g.nombre AS grupo_nombre, p.grado, p.grado_anio, p.area, p.anima_a,
                   cp.vinculo, cp.es_titular, s.datos_cifrado, s.confirmado_at
            FROM cuenta_persona cp
            JOIN personas p ON p.id = cp.persona_id
            LEFT JOIN grupos_iam g ON g.id = p.grupo_id
            LEFT JOIN personas_salud s ON s.persona_id = p.id
            WHERE cp.cuenta_id = ?
            ORDER BY cp.es_titular DESC, p.fecha_nacimiento ASC`,
      args: [cuentaId],
    },
    {
      sql: `SELECT c.persona_id, c.nombre, c.telefono, c.vinculo
            FROM contactos_emergencia c
            JOIN cuenta_persona cp ON cp.persona_id = c.persona_id
            WHERE cp.cuenta_id = ?
            ORDER BY c.created_at ASC`,
      args: [cuentaId],
    },
  ], "read");

  const contactoByPersona = new Map<string, ContactoData>();
  for (const row of contactos.rows) {
    const personaId = String(row.persona_id);
    if (!contactoByPersona.has(personaId)) {
      contactoByPersona.set(personaId, {
        nombre: String(row.nombre),
        telefono: String(row.telefono),
        vinculo: row.vinculo ? String(row.vinculo) : "",
      });
    }
  }

  return personas.rows.map((row) => {
    const id = String(row.id);
    const cuil = row.cuil_cifrado ? decryptText(String(row.cuil_cifrado)) : null;
    return {
      id,
      nombre: String(row.nombre),
      apellido: String(row.apellido),
      sexo: row.sexo ? String(row.sexo) : null,
      cuilFinal: cuil ? cuil.slice(-3) : null,
      // La columna no admite NULL: el adulto que solo dejó nombre y teléfono la tiene vacía.
      fechaNacimiento: row.fecha_nacimiento ? String(row.fecha_nacimiento) : null,
      soloContacto: !row.fecha_nacimiento,
      telefono: row.telefono ? String(row.telefono) : null,
      ciudad: row.ciudad ? String(row.ciudad) : null,
      grupoId: row.grupo_id ? String(row.grupo_id) : null,
      grupoNombre: row.grupo_nombre ? String(row.grupo_nombre) : null,
      grado: row.grado ? String(row.grado) : null,
      gradoAnio: row.grado_anio === null || row.grado_anio === undefined ? null : Number(row.grado_anio),
      area: row.area ? String(row.area) : null,
      animaA: row.anima_a ? String(row.anima_a) : null,
      vinculo: row.vinculo ? String(row.vinculo) : null,
      esTitular: Number(row.es_titular) === 1,
      salud: row.datos_cifrado ? decryptJson<SaludData>(String(row.datos_cifrado)) : null,
      saludConfirmadoAt: row.confirmado_at ? String(row.confirmado_at) : null,
      contacto: contactoByPersona.get(id) ?? null,
    };
  });
}

/**
 * Crea o actualiza una persona de la cuenta.
 * - La primera persona de una cuenta es su titular y tiene que ser mayor de edad.
 * - Al editar, se verifica que la persona pertenezca a la cuenta.
 */
export async function savePersona(cuentaId: string, input: PersonaInput): Promise<string> {
  const client = await db();
  const today = todayYmd();

  if (input.fechaNacimiento > today) throw new InscripcionError("La fecha de nacimiento no puede ser futura.");

  const [linksResult, cuentaResult, grupoResult] = await client.batch([
    {
      sql: `SELECT cp.persona_id, cp.es_titular, p.cuil_indice IS NOT NULL AS tiene_cuil
            FROM cuenta_persona cp JOIN personas p ON p.id = cp.persona_id
            WHERE cp.cuenta_id = ?`,
      args: [cuentaId],
    },
    { sql: "SELECT consentimiento_at FROM cuentas WHERE id = ? LIMIT 1", args: [cuentaId] },
    { sql: "SELECT id FROM grupos_iam WHERE id = ? AND activo = 1 LIMIT 1", args: [input.grupoId] },
  ], "read");

  if (!cuentaResult.rows[0]) throw new InscripcionError("La sesión venció. Volvé a entrar.");

  const links = linksResult.rows.map((row) => ({
    personaId: String(row.persona_id),
    esTitular: Number(row.es_titular) === 1,
    tieneCuil: Number(row.tiene_cuil) === 1,
  }));
  const existing = input.id ? links.find((link) => link.personaId === input.id) : undefined;
  // Un id que no es de esta cuenta se trata igual que uno inexistente.
  if (input.id && !existing) throw new InscripcionError("No encontramos a esa persona en tu cuenta.");

  const hasTitular = links.some((link) => link.esTitular);
  const esTitular = existing ? existing.esTitular : !hasTitular;
  const edad = ageOn(input.fechaNacimiento, today);

  // Los menores siempre son de una IAM. Un adulto puede no pertenecer a ninguna (p. ej. quien solo integra un área).
  const grupoId = input.grupoId || null;
  if (grupoId ? !grupoResult.rows[0] : edad < EDAD_ADULTO) throw new InscripcionError("Elegí la IAM de la lista.");

  if (esTitular && edad < EDAD_CUENTA_PROPIA) {
    throw new InscripcionError(`Primero tiene que cargarse quien es responsable de la cuenta (${EDAD_CUENTA_PROPIA} años o más).`);
  }
  if (!esTitular && !input.vinculo) {
    throw new InscripcionError("Indicá qué relación tiene esta persona con vos.");
  }
  // El teléfono se pide solo a quien responde por la cuenta: es el contacto de emergencia de quienes inscribe.
  if (esTitular && !input.telefono) throw new InscripcionError("El teléfono es obligatorio.");
  if (!cuentaResult.rows[0].consentimiento_at && !input.consentimiento) {
    throw new InscripcionError("Para guardar los datos necesitamos tu consentimiento.");
  }

  const cuil = input.cuil ? normalizeCuil(input.cuil) : null;
  if (input.cuil && !cuil) throw new InscripcionError("El CUIL no es válido. Revisá los 11 números.");
  // Obligatorio al crear, y también al completar los datos de un adulto que solo había dejado nombre y teléfono.
  if (!existing?.tieneCuil && !cuil) throw new InscripcionError("El CUIL es obligatorio.");

  const personaId = existing ? existing.personaId : createRandomId();
  const statements: InStatement[] = [];

  if (existing) {
    statements.push({
      sql: `UPDATE personas SET nombre = ?, apellido = ?, sexo = ?, fecha_nacimiento = ?, telefono = ?, ciudad = ?,
                   grupo_id = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
      args: [input.nombre, input.apellido, input.sexo, input.fechaNacimiento, input.telefono, input.ciudad,
        grupoId, personaId],
    });
    if (cuil) {
      statements.push({
        sql: "UPDATE personas SET cuil_cifrado = ?, cuil_indice = ? WHERE id = ?",
        args: [encryptText(cuil), blindIndex(cuil), personaId],
      });
    }
    statements.push({
      sql: "UPDATE cuenta_persona SET vinculo = ? WHERE cuenta_id = ? AND persona_id = ?",
      args: [esTitular ? null : input.vinculo, cuentaId, personaId],
    });
  } else {
    statements.push({
      sql: `INSERT INTO personas (id, nombre, apellido, sexo, cuil_cifrado, cuil_indice, fecha_nacimiento, telefono, ciudad,
                                  grupo_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [personaId, input.nombre, input.apellido, input.sexo, encryptText(cuil!), blindIndex(cuil!), input.fechaNacimiento,
        input.telefono, input.ciudad, grupoId],
    });
    statements.push({
      sql: "INSERT INTO cuenta_persona (cuenta_id, persona_id, vinculo, es_titular) VALUES (?, ?, ?, ?)",
      args: [cuentaId, personaId, esTitular ? null : input.vinculo, esTitular ? 1 : 0],
    });
  }

  statements.push({
    sql: `INSERT INTO personas_salud (persona_id, datos_cifrado) VALUES (?, ?)
          ON CONFLICT(persona_id) DO UPDATE SET datos_cifrado = excluded.datos_cifrado,
            confirmado_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP`,
    args: [personaId, encryptJson(input.salud)],
  });
  if (input.consentimiento) {
    statements.push({
      sql: "UPDATE cuentas SET consentimiento_at = COALESCE(consentimiento_at, CURRENT_TIMESTAMP) WHERE id = ?",
      args: [cuentaId],
    });
  }

  try {
    await client.batch(statements, "write");
  } catch (error) {
    // El CUIL ya está en otra cuenta. No se vincula solo: saber un CUIL no da acceso a los datos de nadie.
    if (error instanceof Error && /UNIQUE/i.test(error.message) && /cuil_indice/i.test(error.message)) {
      throw new InscripcionError("Ese CUIL ya está registrado en otra cuenta. Si es alguien a tu cargo, escribinos para vincularlo.");
    }
    throw error;
  }

  return personaId;
}

/**
 * Guarda al adulto responsable que no participa de los eventos: solo nombre y teléfono.
 * Si antes había cargado la ficha completa, se borra lo que ya no hace falta guardar.
 */
export async function saveTitularContacto(cuentaId: string, input: TitularContactoInput): Promise<string> {
  const client = await db();

  const [titularResult, cuentaResult, inscripcionesResult] = await client.batch([
    { sql: "SELECT persona_id FROM cuenta_persona WHERE cuenta_id = ? AND es_titular = 1 LIMIT 1", args: [cuentaId] },
    { sql: "SELECT consentimiento_at FROM cuentas WHERE id = ? LIMIT 1", args: [cuentaId] },
    {
      sql: `SELECT COUNT(*) AS total
            FROM inscripciones i JOIN cuenta_persona cp ON cp.persona_id = i.persona_id
            WHERE cp.cuenta_id = ? AND cp.es_titular = 1 AND i.estado != 'cancelada'`,
      args: [cuentaId],
    },
  ], "read");

  if (!cuentaResult.rows[0]) throw new InscripcionError("La sesión venció. Volvé a entrar.");
  if (!cuentaResult.rows[0].consentimiento_at && !input.consentimiento) {
    throw new InscripcionError("Para guardar los datos necesitamos tu consentimiento.");
  }

  const titularId = titularResult.rows[0] ? String(titularResult.rows[0].persona_id) : null;
  // Solo se puede editar así al propio titular de la cuenta.
  if (input.id ? input.id !== titularId : titularId !== null) {
    throw new InscripcionError("No encontramos a esa persona en tu cuenta.");
  }
  if (Number(inscripcionesResult.rows[0]?.total ?? 0) > 0) {
    throw new InscripcionError("Estás inscripto/a en un evento, así que tus datos completos tienen que quedar cargados.");
  }

  const personaId = titularId ?? createRandomId();
  const statements: InStatement[] = titularId
    ? [
        {
          sql: `UPDATE personas SET nombre = ?, apellido = ?, telefono = ?, sexo = NULL, cuil_cifrado = NULL, cuil_indice = NULL,
                       fecha_nacimiento = '', ciudad = NULL, grupo_id = NULL, grado = NULL, grado_anio = NULL, area = NULL,
                       anima_a = NULL, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?`,
          args: [input.nombre, input.apellido, input.telefono, personaId],
        },
        { sql: "DELETE FROM personas_salud WHERE persona_id = ?", args: [personaId] },
        { sql: "DELETE FROM contactos_emergencia WHERE persona_id = ?", args: [personaId] },
      ]
    : [
        {
          sql: "INSERT INTO personas (id, nombre, apellido, fecha_nacimiento, telefono) VALUES (?, ?, ?, '', ?)",
          args: [personaId, input.nombre, input.apellido, input.telefono],
        },
        { sql: "INSERT INTO cuenta_persona (cuenta_id, persona_id, vinculo, es_titular) VALUES (?, ?, NULL, 1)", args: [cuentaId, personaId] },
      ];
  if (input.consentimiento) {
    statements.push({
      sql: "UPDATE cuentas SET consentimiento_at = COALESCE(consentimiento_at, CURRENT_TIMESTAMP) WHERE id = ?",
      args: [cuentaId],
    });
  }

  await client.batch(statements, "write");
  return personaId;
}

// ── Inscripciones ────────────────────────────────────────────────────────

export interface InscripcionView {
  id: string;
  personaId: string;
  eventoId: string;
  rol: Rol;
  estado: "pendiente" | "confirmada" | "lista_espera" | "cancelada";
  createdAt: string;
}

export async function listInscripcionesDeCuenta(cuentaId: string, eventoId?: string): Promise<InscripcionView[]> {
  const client = await db();
  const result = await client.execute({
    sql: `SELECT i.id, i.persona_id, i.evento_id, i.rol, i.estado, i.created_at
          FROM inscripciones i
          JOIN cuenta_persona cp ON cp.persona_id = i.persona_id
          WHERE cp.cuenta_id = ? ${eventoId ? "AND i.evento_id = ?" : ""}
          ORDER BY i.created_at DESC`,
    args: eventoId ? [cuentaId, eventoId] : [cuentaId],
  });
  return result.rows.map((row) => ({
    id: String(row.id),
    personaId: String(row.persona_id),
    eventoId: String(row.evento_id),
    rol: String(row.rol) as Rol,
    estado: String(row.estado) as InscripcionView["estado"],
    createdAt: String(row.created_at),
  }));
}

export type InscribirItem = InscribirInput["personas"][number];

/**
 * Inscribe a personas de la cuenta en un evento. Valida pertenencia, rol, edad y
 * preguntas obligatorias. No hay cupo: entran todos los que se inscriben.
 * Lo que puede cambiar de un evento a otro (salud, grado, contacto extra) llega con la
 * inscripción y queda guardado en la persona para precargar la próxima.
 */
export async function inscribirPersonas(input: {
  cuentaId: string;
  eventoId: string;
  eventoFecha: string;
  config: EventoConfig;
  items: InscribirItem[];
}): Promise<InscripcionView[]> {
  const { cuentaId, eventoId, eventoFecha, config, items } = input;
  const client = await db();

  const personas = await listPersonasDeCuenta(cuentaId);
  const personaById = new Map(personas.map((persona) => [persona.id, persona]));
  // Quien inscribe tiene que estar identificado: es quien después firma las autorizaciones.
  if (!personas.some((persona) => persona.esTitular)) {
    throw new InscripcionError("Antes de inscribir a alguien, cargá tus datos como adulto responsable.");
  }
  const yaInscriptas = new Map((await listInscripcionesDeCuenta(cuentaId, eventoId)).map((item) => [item.personaId, item]));

  if (new Set(items.map((item) => item.personaId)).size !== items.length) {
    throw new InscripcionError("Hay una persona repetida en la inscripción.");
  }

  const titular = personas.find((persona) => persona.esTitular)!;
  const anio = Number(todayYmd().slice(0, 4));
  const statements: InStatement[] = [];
  for (const item of items) {
    const persona = personaById.get(item.personaId);
    if (!persona) throw new InscripcionError("No encontramos a esa persona en tu cuenta.");
    const quien = persona.nombre;

    // El adulto que solo dejó nombre y teléfono no puede anotarse hasta completar su ficha.
    if (!persona.fechaNacimiento) throw new InscripcionError("Para anotarte vos, primero completá tus datos con «Editar datos».");

    if (!config.roles.includes(item.rol)) throw new InscripcionError(`${quien}: ese rol no está disponible en este evento.`);
    // Cómo participa se decide en cada evento: la misma persona puede ir una vez por un área y otra como acompañante.
    if (item.rol === "area" && !item.area) throw new InscripcionError(`${quien}: indicá en qué área participa.`);
    const area = item.rol === "area" ? item.area : null;
    const animaA = item.rol === "animador" ? item.animaA : null;

    const edad = ageOn(persona.fechaNacimiento, eventoFecha);
    if (item.rol === "participante") {
      if (config.edadMin !== null && edad < config.edadMin) {
        throw new InscripcionError(`${quien} va a tener ${edad} años en el evento y la edad mínima es ${config.edadMin}.`);
      }
      if (config.edadMax !== null && edad > config.edadMax) {
        throw new InscripcionError(`${quien} va a tener ${edad} años en el evento y la edad máxima es ${config.edadMax}.`);
      }
    }

    let salud: SaludData | null = persona.salud;
    if (config.pideSalud) {
      if (!item.salud) throw new InscripcionError(`Falta responder las preguntas de salud de ${quien}.`);
      salud = {
        grupoSanguineo: persona.salud?.grupoSanguineo ?? "",
        ...item.salud,
      };
      statements.push({
        sql: `INSERT INTO personas_salud (persona_id, datos_cifrado) VALUES (?, ?)
              ON CONFLICT(persona_id) DO UPDATE SET datos_cifrado = excluded.datos_cifrado,
                confirmado_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP`,
        args: [persona.id, encryptJson(salud)],
      });
    }

    const grado = edad < EDAD_ADULTO ? item.grado : null;
    if (edad < EDAD_ADULTO) {
      if (!persona.grupoId) throw new InscripcionError(`Falta indicar de qué IAM es ${quien}. Completalo en «Editar datos».`);
      if (!grado) throw new InscripcionError(`Falta el grado o año escolar de ${quien}.`);
      statements.push({
        sql: "UPDATE personas SET grado = ?, grado_anio = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        args: [grado, anio, persona.id],
      });
    }

    // Contacto de emergencia: el adulto que inscribe y, si la agregó, otra persona.
    const contactos: ContactoData[] = [];
    if (!persona.esTitular && titular.telefono) {
      contactos.push({ nombre: `${titular.nombre} ${titular.apellido}`, telefono: titular.telefono, vinculo: "Adulto responsable" });
    }
    if (item.otroContacto) contactos.push(item.otroContacto);
    if (contactos.length === 0) {
      throw new InscripcionError(
        persona.esTitular ? "Para anotarte vos, indicá a quién avisar en una emergencia." : `Falta un contacto de emergencia para ${quien}.`,
      );
    }
    statements.push({ sql: "DELETE FROM contactos_emergencia WHERE persona_id = ?", args: [persona.id] });
    if (item.otroContacto) {
      statements.push({
        sql: "INSERT INTO contactos_emergencia (id, persona_id, nombre, telefono, vinculo) VALUES (?, ?, ?, ?, ?)",
        args: [createRandomId(), persona.id, item.otroContacto.nombre, item.otroContacto.telefono, item.otroContacto.vinculo],
      });
    }

    const respuestas: Record<string, string> = {};
    for (const pregunta of config.preguntas) {
      // Hay preguntas que son solo para algunos (p. ej. el nivel, solo para animadores).
      if (!preguntaAplica(pregunta, item.rol)) continue;
      const valor = (item.respuestas[pregunta.id] || "").trim();
      if (pregunta.obligatoria && !valor) throw new InscripcionError(`${quien}: falta responder "${pregunta.texto}".`);
      if (valor && pregunta.tipo === "si_no" && valor !== "si" && valor !== "no") throw new InscripcionError("Respuesta inválida.");
      if (valor && pregunta.tipo === "opciones" && !pregunta.opciones.includes(valor)) throw new InscripcionError("Respuesta inválida.");
      if (valor) respuestas[pregunta.id] = valor;
    }
    // Solo se guarda si la persona declaró una dieta especial.
    if (salud?.dieta?.tiene) respuestas.lleva_comida = item.llevaComida ? "si" : "no";
    if (area) respuestas.rol_area = area;
    if (animaA) respuestas.rol_anima_a = animaA;
    // Queda en la persona solo como "lo último que eligió", para proponerlo la próxima vez.
    if (area || animaA) {
      statements.push({
        sql: "UPDATE personas SET area = COALESCE(?, area), anima_a = COALESCE(?, anima_a), updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        args: [area, animaA, persona.id],
      });
    }

    // Copia de los datos tal como quedaron al inscribirse.
    const snapshot = encryptJson({ persona: { ...persona, grado, salud: undefined, contacto: undefined }, salud, contactos });
    const previa = yaInscriptas.get(item.personaId);

    if (previa && previa.estado !== "cancelada") {
      // Ya estaba inscripta: se actualizan sus respuestas y conserva su lugar.
      statements.push({
        sql: `UPDATE inscripciones SET rol = ?, respuestas_json = ?, datos_snapshot_cifrado = ?, updated_at = CURRENT_TIMESTAMP
              WHERE id = ?`,
        args: [item.rol, JSON.stringify(respuestas), snapshot, previa.id],
      });
      continue;
    }
    if (previa) statements.push({ sql: "DELETE FROM inscripciones WHERE id = ?", args: [previa.id] });

    // Quien se dio de baja y vuelve a anotarse ya tiene la autorización de este evento firmada: entra confirmado.
    statements.push({
      sql: `INSERT INTO inscripciones (id, persona_id, evento_id, rol, estado, respuestas_json, creada_por_cuenta_id, datos_snapshot_cifrado, monto)
            VALUES (?, ?, ?, ?,
                    CASE WHEN EXISTS (SELECT 1 FROM firmas f WHERE f.tipo = 'evento' AND f.persona_id = ? AND f.evento_id = ? AND f.revocada_at IS NULL)
                         THEN 'confirmada' ELSE 'pendiente' END,
                    ?, ?, ?, ?)`,
      // El monto queda fijado al inscribirse: si después el admin cambia los montos, no cambia lo que ya se avisó.
      // Los de jardín no pagan.
      args: [createRandomId(), item.personaId, eventoId, item.rol, item.personaId, eventoId, JSON.stringify(respuestas), cuentaId, snapshot,
        grado && grupoDeGrado(grado) === "jardin" ? 0 : montoPara(config.montos, persona.ciudad)],
    });
  }

  await client.batch(statements, "write");

  return (await listInscripcionesDeCuenta(cuentaId, eventoId)).filter((item) => personaById.has(item.personaId));
}

// ── Autorizaciones y firmas ──────────────────────────────────────────────

export interface InscripcionConFirmas extends InscripcionView {
  nombre: string;
  apellido: string;
  /** Firma de la autorización de este evento; null si falta firmar. */
  firmaEventoId: string | null;
  /** Permiso de imagen vigente: true/false si ya respondió este año, null si falta responder. */
  imagen: boolean | null;
  /** Firma del permiso de imagen vigente, si existe. */
  firmaImagenId: string | null;
  /** Lo que respondió al inscribirse (preguntas del evento y cómo participa), para precargarlo al modificar. */
  respuestas: Record<string, string>;
  /** Monto que se le avisó al inscribirse; null si el evento no tenía uno para su ciudad. */
  monto: number | null;
}

/** Inscripciones activas de la cuenta con el estado de sus autorizaciones. */
export async function listInscripcionesConFirmas(cuentaId: string, eventoId?: string): Promise<InscripcionConFirmas[]> {
  const client = await db();
  const today = todayYmd();
  const imagenVigente = "f.tipo = 'imagen' AND f.persona_id = i.persona_id AND f.vigente_hasta >= ? ORDER BY f.created_at DESC, f.rowid DESC LIMIT 1";
  const result = await client.execute({
    sql: `SELECT i.id, i.persona_id, i.evento_id, i.rol, i.estado, i.created_at, i.respuestas_json, i.monto, p.nombre, p.apellido,
                 (SELECT f.id FROM firmas f
                   WHERE f.tipo = 'evento' AND f.persona_id = i.persona_id AND f.evento_id = i.evento_id AND f.revocada_at IS NULL
                   ORDER BY f.created_at DESC, f.rowid DESC LIMIT 1) AS firma_evento_id,
                 (SELECT CASE WHEN f.revocada_at IS NOT NULL THEN 0 ELSE f.acepta END FROM firmas f WHERE ${imagenVigente}) AS imagen,
                 (SELECT f.id FROM firmas f WHERE ${imagenVigente}) AS firma_imagen_id
          FROM inscripciones i
          JOIN cuenta_persona cp ON cp.persona_id = i.persona_id
          JOIN personas p ON p.id = i.persona_id
          WHERE cp.cuenta_id = ? AND i.estado != 'cancelada' ${eventoId ? "AND i.evento_id = ?" : ""}
          ORDER BY i.created_at DESC`,
    args: eventoId ? [today, today, cuentaId, eventoId] : [today, today, cuentaId],
  });
  return result.rows.map((row) => ({
    id: String(row.id),
    personaId: String(row.persona_id),
    eventoId: String(row.evento_id),
    rol: String(row.rol) as Rol,
    estado: String(row.estado) as InscripcionView["estado"],
    createdAt: String(row.created_at),
    nombre: String(row.nombre),
    apellido: String(row.apellido),
    firmaEventoId: row.firma_evento_id ? String(row.firma_evento_id) : null,
    imagen: row.imagen === null || row.imagen === undefined ? null : Number(row.imagen) === 1,
    firmaImagenId: row.firma_imagen_id ? String(row.firma_imagen_id) : null,
    respuestas: parseJson<Record<string, string>>(row.respuestas_json, {}),
    monto: row.monto === null || row.monto === undefined ? null : Number(row.monto),
  }));
}

/**
 * Da de baja la inscripción de una persona de la cuenta en un evento. Devuelve false si
 * no había una inscripción activa (o la persona no es de esta cuenta).
 */
export async function darDeBaja(input: { cuentaId: string; eventoId: string; personaId: string; fueraDeTermino: boolean }): Promise<boolean> {
  const client = await db();
  const result = await client.execute({
    sql: `UPDATE inscripciones
          SET estado = 'cancelada', baja_at = CURRENT_TIMESTAMP, baja_fuera_de_termino = ?, updated_at = CURRENT_TIMESTAMP
          WHERE evento_id = ? AND persona_id = ? AND estado != 'cancelada'
            AND EXISTS (SELECT 1 FROM cuenta_persona cp WHERE cp.cuenta_id = ? AND cp.persona_id = inscripciones.persona_id)`,
    args: [input.fueraDeTermino ? 1 : 0, input.eventoId, input.personaId, input.cuentaId],
  });
  return result.rowsAffected > 0;
}

/**
 * Registra la firma del adulto para todas las autorizaciones pendientes de la cuenta en un
 * evento, y su decisión de uso de imagen para quienes todavía no la tienen este año.
 * Devuelve los ids de las firmas creadas.
 */
export async function firmarAutorizaciones(input: {
  cuentaId: string;
  eventoId: string;
  textoEvento: string;
  textoEventoHash: string;
  textoImagen: string;
  textoImagenHash: string;
  imagenVigenteHasta: string;
  firmanteNombre: string;
  firmanteDni: string;
  firmaPng: string;
  imagen: Record<string, boolean>;
  userAgent: string | null;
  /** Si se indica, se firma solo por estas personas (las que se acaban de inscribir). */
  soloPersonas?: string[];
}): Promise<string[]> {
  const client = await db();
  // Solo entran personas de esta cuenta: la lista sale de sus propias inscripciones.
  const todas = await listInscripcionesConFirmas(input.cuentaId, input.eventoId);
  const inscripciones = input.soloPersonas ? todas.filter((item) => input.soloPersonas!.includes(item.personaId)) : todas;
  const sinFirma = inscripciones.filter((item) => !item.firmaEventoId);
  const sinImagen = inscripciones.filter((item) => item.imagen === null);
  if (sinFirma.length === 0 && sinImagen.length === 0) throw new InscripcionError("No hay autorizaciones pendientes para firmar.");

  for (const item of sinImagen) {
    if (typeof input.imagen[item.personaId] !== "boolean") {
      throw new InscripcionError(`Indicá si autorizás el uso de imagen de ${item.nombre}.`);
    }
  }

  const dni = encryptText(input.firmanteDni);
  const firma = encryptText(input.firmaPng);
  const ids: string[] = [];
  const statements: InStatement[] = [];
  const insert = `INSERT INTO firmas (id, tipo, persona_id, evento_id, cuenta_id, acepta, firmante_nombre, firmante_dni_cifrado,
                                      texto_hash, texto, firma_imagen, user_agent, vigente_hasta)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  for (const item of sinFirma) {
    const id = createRandomId();
    ids.push(id);
    statements.push(
      {
        sql: insert,
        args: [id, "evento", item.personaId, input.eventoId, input.cuentaId, 1, input.firmanteNombre, dni,
          input.textoEventoHash, input.textoEvento, firma, input.userAgent, null],
      },
      { sql: "UPDATE inscripciones SET estado = 'confirmada', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND estado = 'pendiente'", args: [item.id] },
    );
  }
  for (const item of sinImagen) {
    const id = createRandomId();
    ids.push(id);
    statements.push({
      sql: insert,
      args: [id, "imagen", item.personaId, null, input.cuentaId, input.imagen[item.personaId] ? 1 : 0, input.firmanteNombre, dni,
        input.textoImagenHash, input.textoImagen, firma, input.userAgent, input.imagenVigenteHasta],
    });
  }

  await client.batch(statements, "write");
  return ids;
}

export interface FirmaGuardada {
  id: string;
  tipo: "evento" | "imagen";
  acepta: boolean;
  texto: string;
  textoHash: string;
  personaNombre: string;
  personaCuil: string | null;
  firmanteNombre: string;
  firmanteDni: string;
  firmanteEmail: string | null;
  firmaPng: string | null;
  userAgent: string | null;
  createdAt: string;
  revocadaAt: string | null;
}

/** Una firma con todo lo necesario para su PDF. Solo si la persona pertenece a la cuenta que pregunta. */
export function getFirmaDeCuenta(cuentaId: string, firmaId: string): Promise<FirmaGuardada | null> {
  return loadFirma(firmaId, cuentaId);
}

/** La misma firma, sin filtrar por cuenta. Solo para rutas que ya verificaron que quien pide es admin. */
export function getFirmaAdmin(firmaId: string): Promise<FirmaGuardada | null> {
  return loadFirma(firmaId, null);
}

async function loadFirma(firmaId: string, cuentaId: string | null): Promise<FirmaGuardada | null> {
  const client = await db();
  const result = await client.execute({
    sql: `SELECT f.id, f.tipo, f.acepta, f.texto, f.texto_hash, f.firmante_nombre, f.firmante_dni_cifrado, f.firma_imagen,
                 f.user_agent, f.created_at, f.revocada_at, p.nombre, p.apellido, p.cuil_cifrado, c.email AS firmante_email
          FROM firmas f
          ${cuentaId === null ? "" : "JOIN cuenta_persona cp ON cp.persona_id = f.persona_id AND cp.cuenta_id = ?"}
          JOIN personas p ON p.id = f.persona_id
          LEFT JOIN cuentas c ON c.id = f.cuenta_id
          WHERE f.id = ? LIMIT 1`,
    args: cuentaId === null ? [firmaId] : [cuentaId, firmaId],
  });
  const row = result.rows[0];
  if (!row) return null;
  return {
    id: String(row.id),
    tipo: String(row.tipo) as "evento" | "imagen",
    acepta: Number(row.acepta) === 1,
    texto: row.texto ? String(row.texto) : "",
    textoHash: String(row.texto_hash),
    personaNombre: `${String(row.nombre)} ${String(row.apellido)}`,
    personaCuil: row.cuil_cifrado ? decryptText(String(row.cuil_cifrado)) : null,
    firmanteNombre: String(row.firmante_nombre),
    firmanteDni: decryptText(String(row.firmante_dni_cifrado)),
    firmanteEmail: row.firmante_email ? String(row.firmante_email) : null,
    firmaPng: row.firma_imagen ? decryptText(String(row.firma_imagen)) : null,
    userAgent: row.user_agent ? String(row.user_agent) : null,
    createdAt: String(row.created_at),
    revocadaAt: row.revocada_at ? String(row.revocada_at) : null,
  };
}

/** Retira el permiso de imagen vigente de una persona de la cuenta. */
export async function revocarImagen(cuentaId: string, personaId: string): Promise<boolean> {
  const client = await db();
  const result = await client.execute({
    sql: `UPDATE firmas SET revocada_at = CURRENT_TIMESTAMP
          WHERE tipo = 'imagen' AND acepta = 1 AND revocada_at IS NULL AND persona_id = ?
            AND EXISTS (SELECT 1 FROM cuenta_persona cp WHERE cp.cuenta_id = ? AND cp.persona_id = firmas.persona_id)`,
    args: [personaId, cuentaId],
  });
  return result.rowsAffected > 0;
}

/** Permiso de imagen vigente de cada persona de la cuenta: true/false si ya respondió este año. */
export async function getImagenVigente(cuentaId: string): Promise<Map<string, boolean>> {
  const client = await db();
  const result = await client.execute({
    sql: `SELECT cp.persona_id,
                 (SELECT CASE WHEN f.revocada_at IS NOT NULL THEN 0 ELSE f.acepta END FROM firmas f
                   WHERE f.tipo = 'imagen' AND f.persona_id = cp.persona_id AND f.vigente_hasta >= ?
                   ORDER BY f.created_at DESC, f.rowid DESC LIMIT 1) AS imagen
          FROM cuenta_persona cp WHERE cp.cuenta_id = ?`,
    args: [todayYmd(), cuentaId],
  });
  const map = new Map<string, boolean>();
  for (const row of result.rows) {
    if (row.imagen !== null && row.imagen !== undefined) map.set(String(row.persona_id), Number(row.imagen) === 1);
  }
  return map;
}

/**
 * Personas de la cuenta que ya tienen firmada la autorización de un evento, estén o no
 * inscriptas en este momento: quien se dio de baja y vuelve a anotarse no firma de nuevo.
 */
export async function listPersonasConFirmaEvento(cuentaId: string, eventoId: string): Promise<string[]> {
  const client = await db();
  const result = await client.execute({
    sql: `SELECT DISTINCT f.persona_id
          FROM firmas f JOIN cuenta_persona cp ON cp.persona_id = f.persona_id
          WHERE cp.cuenta_id = ? AND f.tipo = 'evento' AND f.evento_id = ? AND f.revocada_at IS NULL`,
    args: [cuentaId, eventoId],
  });
  return result.rows.map((row) => String(row.persona_id));
}
