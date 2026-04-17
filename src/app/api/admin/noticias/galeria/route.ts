import { NextResponse } from "next/server";
import {
  getNoticiaGaleria,
  addNoticiaGaleriaImage,
  NoticiaGaleriaInput,
} from "@/app/db/admin-repository";
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

export async function GET(req: Request, context: { params: Promise<{ slug: string }> }) {
  const auth = await requirePermission("content.read");
  if ("errorResponse" in auth) return auth.errorResponse;

  const { slug } = await context.params;
  if (!isValidSlug(slug)) {
    return badRequest("Slug invalido");
  }

  try {
    const galeria = await getNoticiaGaleria(slug);
    return NextResponse.json(galeria);
  } catch (error) {
    console.error(error);
    return serverError();
  }
}

export async function POST(req: Request) {
  const auth = await requirePermission("content.write");
  if ("errorResponse" in auth) return auth.errorResponse;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Body invalido");
  }

  if (!isValidGaleriaPayload(body)) {
    return badRequest("Payload de galería invalido");
  }

  if (!isValidSlug(body.noticia_slug)) {
    return badRequest("Slug de noticia invalido");
  }

  try {
    await addNoticiaGaleriaImage(body);
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error(error);
    return serverError("No se pudo agregar imagen a la galería");
  }
}
