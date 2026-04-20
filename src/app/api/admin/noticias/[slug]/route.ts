// Administración de una noticia concreta: lectura, actualización y borrado por slug.
import { NextResponse } from "next/server";
import {
  deleteNoticiaAdmin,
  getNoticiaAdmin,
  NoticiaInput,
  updateNoticiaAdmin,
} from "@/server/db/admin-repository";
import { badRequest, requirePermission, isValidSlug, serverError } from "@/app/api/admin/_shared/auth";

type UpdateNoticiaInput = Omit<NoticiaInput, "slug">;

function isValidUpdatePayload(value: unknown): value is UpdateNoticiaInput {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Partial<UpdateNoticiaInput>;
  return (
    typeof v.title === "string" &&
    typeof v.date === "string" &&
    typeof v.description === "string" &&
    typeof v.image === "string" &&
    typeof v.content === "string"
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
    const item = await getNoticiaAdmin(slug);
    if (!item) {
      return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    }
    return NextResponse.json(item);
  } catch (error) {
    console.error(error);
    return serverError();
  }
}

export async function PUT(req: Request, context: { params: Promise<{ slug: string }> }) {
  const auth = await requirePermission("content.write");
  if ("errorResponse" in auth) return auth.errorResponse;

  const { slug } = await context.params;
  if (!isValidSlug(slug)) {
    return badRequest("Slug invalido");
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Body invalido");
  }

  if (!isValidUpdatePayload(body)) {
    return badRequest("Payload de noticia invalido");
  }

  try {
    await updateNoticiaAdmin(slug, body);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return serverError("No se pudo actualizar la noticia");
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ slug: string }> }) {
  const auth = await requirePermission("content.delete");
  if ("errorResponse" in auth) return auth.errorResponse;

  const { slug } = await context.params;
  if (!isValidSlug(slug)) {
    return badRequest("Slug invalido");
  }

  try {
    await deleteNoticiaAdmin(slug);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return serverError("No se pudo borrar la noticia");
  }
}
