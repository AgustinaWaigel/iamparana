import "server-only";

import fs from "fs";
import path from "path";
import { getTursoClient } from "@/app/db/turso";
import { isTursoWriteEnabled } from "@/app/lib/feature-flags";

export type UpdateComentarioResult =
  | { ok: true }
  | { ok: false; status: number; error: string };

function findCommentsFile(slug: string) {
  const candidates = [
    path.join(process.cwd(), "comments", `${slug}.json`),
    path.join(process.cwd(), "data", "comentarios", `${slug}.json`),
  ];

  return candidates.find((candidate) => fs.existsSync(candidate));
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function updateInDb(slug: string, index: number, aprobado: boolean): Promise<UpdateComentarioResult> {
  const client = getTursoClient();
  if (!client) {
    return { ok: false, status: 500, error: "Turso no configurado" };
  }

  const rowIdResult = await client.execute({
    sql: "SELECT id FROM comentarios WHERE slug = ? ORDER BY id ASC LIMIT 1 OFFSET ?",
    args: [slug, index],
  });

  if (rowIdResult.rows.length === 0) {
    return { ok: false, status: 404, error: "Comentario no encontrado" };
  }

  const rowId = rowIdResult.rows[0].id;
  await client.execute({
    sql: "UPDATE comentarios SET aprobado = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    args: [aprobado ? 1 : 0, rowId],
  });

  return { ok: true };
}

function updateInFs(slug: string, index: number, aprobado: boolean): UpdateComentarioResult {
  const filePath = findCommentsFile(slug);
  if (!filePath) {
    return { ok: false, status: 404, error: "Archivo no encontrado" };
  }

  let comentarios: unknown;
  try {
    comentarios = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return { ok: false, status: 500, error: "Error leyendo comentarios" };
  }

  if (!Array.isArray(comentarios)) {
    return { ok: false, status: 500, error: "Formato de comentarios inválido" };
  }

  if (index >= comentarios.length) {
    return { ok: false, status: 404, error: "Comentario no encontrado" };
  }

  if (!isObject(comentarios[index])) {
    return { ok: false, status: 500, error: "Comentario inválido" };
  }

  comentarios[index].aprobado = aprobado;

  try {
    fs.writeFileSync(filePath, JSON.stringify(comentarios, null, 2));
  } catch {
    return { ok: false, status: 500, error: "Error guardando comentarios" };
  }

  return { ok: true };
}

export async function updateComentarioAprobado(
  slug: string,
  index: number,
  aprobado: boolean
): Promise<UpdateComentarioResult> {
  if (isTursoWriteEnabled) {
    try {
      return await updateInDb(slug, index, aprobado);
    } catch (error) {
      console.error("Error actualizando comentario en Turso", error);
      return { ok: false, status: 500, error: "Error guardando comentario" };
    }
  }

  return updateInFs(slug, index, aprobado);
}
