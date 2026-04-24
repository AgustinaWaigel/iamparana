import { NextRequest, NextResponse } from "next/server";
import {
  getNoticiaGaleria,
  addNoticiaGaleriaImage,
  NoticiaGaleriaInput,
} from "@/server/db/admin-repository";
import { badRequest, requirePermission, isValidSlug, serverError } from "@/app/api/admin/_shared/auth";

function isValidGaleriaPayload(value: unknown): value is NoticiaGaleriaInput {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Partial<NoticiaGaleriaInput>;
  return (
    typeof v.noticia_slug === "string" &&
    typeof v.image_url === "string" &&
    (typeof v.alt_text === "undefined" || typeof v.alt_text === "string") &&
    (typeof v.caption === "undefined" || typeof v.caption === "string") &&
    (typeof v.order === "undefined" || typeof v.order === "number")
  );
}

/**
 * ELIMINADO: 'context' con 'params'
 * Como esta ruta es estática (/galeria/route.ts), el segundo argumento DEBE ser omitido 
 * o no contener 'params' con propiedades que la ruta no tiene.
 */
export async function GET(req: NextRequest) {
  const auth = await requirePermission("content.read");
  if ("errorResponse" in auth) return auth.errorResponse;

  // Extraemos el slug de la URL (query params)
  // Ejemplo: /api/admin/noticias/galeria?slug=nombre-de-la-noticia
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");

  if (!slug || !isValidSlug(slug)) {
    return badRequest("Slug inválido o ausente en los parámetros de búsqueda");
  }

  try {
    const galeria = await getNoticiaGaleria(slug);
    return NextResponse.json(galeria);
  } catch (error) {
    console.error("Error en GET galeria:", error);
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  const auth = await requirePermission("content.write");
  if ("errorResponse" in auth) return auth.errorResponse;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Body inválido");
  }

  if (!isValidGaleriaPayload(body)) {
    return badRequest("Payload de galería inválido");
  }

  if (!isValidSlug(body.noticia_slug)) {
    return badRequest("Slug de noticia inválido");
  }

  try {
    await addNoticiaGaleriaImage(body);
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Error en POST galeria:", error);
    return serverError("No se pudo agregar imagen a la galería");
  }
}