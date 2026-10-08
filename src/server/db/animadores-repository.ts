import "server-only";

import { InscripcionError } from "@/server/db/inscripciones-repository";
import { ensureInscripcionesSchema, inscripcionesClient } from "@/server/db/inscripciones-schema";
import type { Rol } from "@/server/lib/inscripciones-validation";

// Animadores con acceso a los inscriptos de su IAM. Cada usuario puede indicar en su
// perfil de qué IAM es animador, pero eso es solo un pedido ("pendiente"): la lista de
// inscriptos se ve recién cuando un administrador lo aprueba.

export type EstadoAnimador = "pendiente" | "aprobado";
const MAX_GRUPOS_POR_USUARIO = 3;

async function db() {
  await ensureInscripcionesSchema();
  return inscripcionesClient();
}

export interface AnimadorDeGrupo {
  grupoId: string;
  userId: number;
  email: string;
  nombre: string | null;
  estado: EstadoAnimador;
  /** true si coordina la IAM: además de ver la lista, gestiona a sus animadores. */
  esCoordinador: boolean;
}

/** Todos los accesos dados y los pedidos pendientes, para el panel del admin. */
export async function listAnimadores(): Promise<AnimadorDeGrupo[]> {
  const client = await db();
  const result = await client.execute(
    `SELECT ga.grupo_id, ga.user_id, ga.estado, ga.rol, u.email, u.display_name
     FROM grupo_animadores ga JOIN users u ON u.id = ga.user_id
     ORDER BY ga.estado DESC, ga.rol DESC, u.email COLLATE NOCASE`,
  );
  return result.rows.map((row) => ({
    grupoId: String(row.grupo_id),
    userId: Number(row.user_id),
    email: String(row.email),
    nombre: row.display_name ? String(row.display_name) : null,
    estado: row.estado === "pendiente" ? "pendiente" : "aprobado",
    esCoordinador: row.rol === "coordinador",
  }));
}

/** El admin nombra (o deja de nombrar) coordinador de una IAM a un animador ya aprobado. */
export async function setCoordinador(grupoId: string, userId: number, coordinador: boolean): Promise<boolean> {
  const client = await db();
  const result = await client.execute({
    sql: "UPDATE grupo_animadores SET rol = ? WHERE grupo_id = ? AND user_id = ? AND estado = 'aprobado'",
    args: [coordinador ? "coordinador" : "animador", grupoId, userId],
  });
  return result.rowsAffected > 0;
}

/** true si el usuario coordina esa IAM (aprobado y nombrado por el admin). */
export async function esCoordinador(userId: number, grupoId: string): Promise<boolean> {
  const client = await db();
  const result = await client.execute({
    sql: "SELECT 1 FROM grupo_animadores WHERE user_id = ? AND grupo_id = ? AND estado = 'aprobado' AND rol = 'coordinador' LIMIT 1",
    args: [userId, grupoId],
  });
  return result.rows.length > 0;
}

/** Animadores y pedidos de una IAM, para quien la coordina. */
export async function listAnimadoresDeGrupo(grupoId: string): Promise<Array<Omit<AnimadorDeGrupo, "grupoId">>> {
  const client = await db();
  const result = await client.execute({
    sql: `SELECT ga.user_id, ga.estado, ga.rol, u.email, u.display_name
          FROM grupo_animadores ga JOIN users u ON u.id = ga.user_id
          WHERE ga.grupo_id = ? ORDER BY ga.rol DESC, u.display_name COLLATE NOCASE, u.email COLLATE NOCASE`,
    args: [grupoId],
  });
  return result.rows.map((row) => ({
    userId: Number(row.user_id),
    email: String(row.email),
    nombre: row.display_name ? String(row.display_name) : null,
    estado: row.estado === "pendiente" ? "pendiente" : "aprobado",
    esCoordinador: row.rol === "coordinador",
  }));
}

/** Un coordinador aprueba un pedido de su IAM. No alcanza a otros coordinadores. */
export async function coordinadorAprobar(grupoId: string, userId: number): Promise<boolean> {
  const client = await db();
  const result = await client.execute({
    sql: "UPDATE grupo_animadores SET estado = 'aprobado' WHERE grupo_id = ? AND user_id = ? AND rol = 'animador' AND estado = 'pendiente'",
    args: [grupoId, userId],
  });
  return result.rowsAffected > 0;
}

/** Un coordinador da de baja a un animador de su IAM (o rechaza su pedido). No alcanza a otros coordinadores. */
export async function coordinadorQuitar(grupoId: string, userId: number): Promise<boolean> {
  const client = await db();
  const result = await client.execute({ sql: "DELETE FROM grupo_animadores WHERE grupo_id = ? AND user_id = ? AND rol = 'animador'", args: [grupoId, userId] });
  return result.rowsAffected > 0;
}

/** Da acceso a un usuario del sitio (por su email) a los inscriptos de una IAM. */
export async function addAnimador(grupoId: string, email: string): Promise<void> {
  const client = await db();
  const [grupo, user] = await client.batch([
    { sql: "SELECT id FROM grupos_iam WHERE id = ? LIMIT 1", args: [grupoId] },
    { sql: "SELECT id FROM users WHERE LOWER(email) = ? AND is_active = 1 LIMIT 1", args: [email.trim().toLowerCase()] },
  ], "read");
  if (!grupo.rows[0]) throw new InscripcionError("No encontramos ese grupo.");
  if (!user.rows[0]) throw new InscripcionError("No hay un usuario activo del sitio con ese email. Primero tiene que registrarse en el sitio.");
  await client.execute({
    sql: `INSERT INTO grupo_animadores (grupo_id, user_id, estado) VALUES (?, ?, 'aprobado')
          ON CONFLICT(grupo_id, user_id) DO UPDATE SET estado = 'aprobado'`,
    args: [grupoId, Number(user.rows[0].id)],
  });
}

/** El admin aprueba el pedido que un usuario hizo desde su perfil. */
export async function aprobarAnimador(grupoId: string, userId: number): Promise<boolean> {
  const client = await db();
  const result = await client.execute({ sql: "UPDATE grupo_animadores SET estado = 'aprobado' WHERE grupo_id = ? AND user_id = ?", args: [grupoId, userId] });
  return result.rowsAffected > 0;
}

/** Un usuario indica desde su perfil que es animador de una IAM. Queda pendiente de aprobación. */
export async function solicitarAnimador(userId: number, grupoId: string): Promise<void> {
  const client = await db();
  const [grupo, propios] = await client.batch([
    { sql: "SELECT id FROM grupos_iam WHERE id = ? AND activo = 1 LIMIT 1", args: [grupoId] },
    { sql: "SELECT COUNT(*) AS n FROM grupo_animadores WHERE user_id = ?", args: [userId] },
  ], "read");
  if (!grupo.rows[0]) throw new InscripcionError("Elegí tu IAM de la lista.");
  if (Number(propios.rows[0]?.n ?? 0) >= MAX_GRUPOS_POR_USUARIO) throw new InscripcionError(`Podés indicar hasta ${MAX_GRUPOS_POR_USUARIO} IAM.`);
  // Si ya lo tenía (pendiente o aprobado), queda como estaba.
  await client.execute({ sql: "INSERT OR IGNORE INTO grupo_animadores (grupo_id, user_id, estado) VALUES (?, ?, 'pendiente')", args: [grupoId, userId] });
}

/** El usuario retira su pedido o deja de ser animador de esa IAM. */
export async function retirarAnimador(userId: number, grupoId: string): Promise<void> {
  const client = await db();
  await client.execute({ sql: "DELETE FROM grupo_animadores WHERE grupo_id = ? AND user_id = ?", args: [grupoId, userId] });
}

/** Las IAM que un usuario indicó en su perfil, con el estado de cada pedido. */
export async function listMisGrupos(userId: number): Promise<Array<{ grupoId: string; nombre: string; ciudad: string | null; estado: EstadoAnimador; esCoordinador: boolean }>> {
  const client = await db();
  const result = await client.execute({
    sql: `SELECT g.id, g.nombre, g.ciudad, ga.estado, ga.rol
          FROM grupo_animadores ga JOIN grupos_iam g ON g.id = ga.grupo_id
          WHERE ga.user_id = ? ORDER BY g.nombre COLLATE NOCASE`,
    args: [userId],
  });
  return result.rows.map((row) => ({
    grupoId: String(row.id),
    nombre: String(row.nombre),
    ciudad: row.ciudad ? String(row.ciudad) : null,
    estado: row.estado === "pendiente" ? "pendiente" : "aprobado",
    esCoordinador: row.rol === "coordinador" && row.estado !== "pendiente",
  }));
}

export async function removeAnimador(grupoId: string, userId: number): Promise<boolean> {
  const client = await db();
  const result = await client.execute({ sql: "DELETE FROM grupo_animadores WHERE grupo_id = ? AND user_id = ?", args: [grupoId, userId] });
  return result.rowsAffected > 0;
}

export interface GrupoDeAnimador {
  id: string;
  nombre: string;
  ciudad: string | null;
  color: string | null;
  /** true si además coordina esta IAM. */
  esCoordinador: boolean;
}

/** IAM a las que un usuario del sitio tiene acceso como animador: solo las aprobadas por el admin. */
export async function listGruposDeAnimador(userId: number): Promise<GrupoDeAnimador[]> {
  const client = await db();
  const result = await client.execute({
    sql: `SELECT g.id, g.nombre, g.ciudad, g.color, ga.rol
          FROM grupo_animadores ga JOIN grupos_iam g ON g.id = ga.grupo_id
          WHERE ga.user_id = ? AND ga.estado = 'aprobado' ORDER BY g.nombre COLLATE NOCASE`,
    args: [userId],
  });
  return result.rows.map((row) => ({
    id: String(row.id),
    nombre: String(row.nombre),
    ciudad: row.ciudad ? String(row.ciudad) : null,
    color: row.color ? String(row.color) : null,
    esCoordinador: row.rol === "coordinador",
  }));
}

/** Lo que ve un animador de cada inscripto de su IAM: lo justo para organizarse. Sin salud, contactos, CUIL ni pagos. */
export interface InscriptoDeGrupo {
  grupoId: string;
  nombre: string;
  apellido: string;
  fechaNacimiento: string | null;
  grado: string | null;
  rol: Rol;
  autorizacionFirmada: boolean;
}

/**
 * Inscriptos activos de un evento que pertenecen a alguna de las IAM indicadas.
 * Quien llama tiene que pasar solo las IAM a las que el usuario tiene acceso.
 */
export async function listInscriptosDeGrupos(eventoId: string, grupoIds: string[]): Promise<InscriptoDeGrupo[]> {
  if (grupoIds.length === 0) return [];
  const client = await db();
  const result = await client.execute({
    sql: `SELECT p.grupo_id, p.nombre, p.apellido, p.fecha_nacimiento, p.grado, i.rol,
                 EXISTS (SELECT 1 FROM firmas f WHERE f.tipo = 'evento' AND f.persona_id = i.persona_id AND f.evento_id = i.evento_id AND f.revocada_at IS NULL) AS firmada
          FROM inscripciones i JOIN personas p ON p.id = i.persona_id
          WHERE i.evento_id = ? AND i.estado != 'cancelada' AND p.grupo_id IN (${grupoIds.map(() => "?").join(", ")})
          ORDER BY p.apellido COLLATE NOCASE, p.nombre COLLATE NOCASE`,
    args: [eventoId, ...grupoIds],
  });
  return result.rows.map((row) => ({
    grupoId: String(row.grupo_id),
    nombre: String(row.nombre),
    apellido: String(row.apellido),
    fechaNacimiento: row.fecha_nacimiento ? String(row.fecha_nacimiento) : null,
    grado: row.grado ? String(row.grado) : null,
    rol: String(row.rol) as Rol,
    autorizacionFirmada: Number(row.firmada) === 1,
  }));
}
