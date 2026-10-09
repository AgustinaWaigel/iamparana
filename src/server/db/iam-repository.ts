import "server-only";

import { ensureInscripcionesSchema, inscripcionesClient } from "@/server/db/inscripciones-schema";
import { createRandomId } from "@/server/lib/inscripciones-crypto";
import type { IamInput } from "@/server/lib/iam-validation";

// Ficha de cada IAM: los mismos grupos de las inscripciones (tabla grupos_iam), más lo que se
// muestra en "Quiénes somos": dirección, contacto, redes y su punto en el mapa.
// Todo lo de acá es público: no guardar datos que no se quieran mostrar en el sitio.

export interface Iam {
  id: string;
  nombre: string;
  ciudad: string | null;
  activo: boolean;
  color: string | null;
  direccion: string | null;
  telefono: string | null;
  instagram: string | null;
  facebook: string | null;
  /** Punto propio en el mapa; null si se ubica de forma aproximada. */
  lat: number | null;
  lng: number | null;
}

async function db() {
  await ensureInscripcionesSchema();
  return inscripcionesClient();
}

const texto = (valor: unknown) => (valor ? String(valor) : null);
const numero = (valor: unknown) => (valor === null || valor === undefined || !Number.isFinite(Number(valor)) ? null : Number(valor));

export async function listIam(soloActivas: boolean): Promise<Iam[]> {
  const client = await db();
  const result = await client.execute(
    `SELECT id, nombre, ciudad, activo, color, direccion, telefono, instagram, facebook, lat, lng
     FROM grupos_iam ${soloActivas ? "WHERE activo = 1" : ""} ORDER BY nombre COLLATE NOCASE`,
  );
  return result.rows.map((row) => ({
    id: String(row.id),
    nombre: String(row.nombre),
    ciudad: texto(row.ciudad),
    activo: Number(row.activo) === 1,
    color: texto(row.color),
    direccion: texto(row.direccion),
    telefono: texto(row.telefono),
    instagram: texto(row.instagram),
    facebook: texto(row.facebook),
    lat: numero(row.lat),
    lng: numero(row.lng),
  }));
}

/** Crea o actualiza una IAM. Devuelve su id, o null si se quiso editar una que no existe. */
export async function saveIam(input: IamInput): Promise<string | null> {
  const client = await db();
  const datos = [input.nombre, input.ciudad, input.activo ? 1 : 0, input.color, input.direccion, input.telefono, input.instagram, input.facebook, input.lat, input.lng];
  if (input.id) {
    const result = await client.execute({
      sql: "UPDATE grupos_iam SET nombre = ?, ciudad = ?, activo = ?, color = ?, direccion = ?, telefono = ?, instagram = ?, facebook = ?, lat = ?, lng = ? WHERE id = ?",
      args: [...datos, input.id],
    });
    return result.rowsAffected === 0 ? null : input.id;
  }
  const id = createRandomId();
  await client.execute({
    sql: "INSERT INTO grupos_iam (nombre, ciudad, activo, color, direccion, telefono, instagram, facebook, lat, lng, id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    args: [...datos, id],
  });
  return id;
}
