// Administración de una canción puntual: consulta, edición y borrado por slug.
import { NextResponse } from "next/server";
import {
  deleteCancionAdmin,
  getCancionAdmin,
  CancionInput,
  updateCancionAdmin,
} from "@/server/db/admin-repository";
import { badRequest, requirePermission, isValidSlug, serverError } from "@/app/api/admin/_shared/auth";

type UpdateCancionInput = Omit<CancionInput, "slug">;

function isValidUpdatePayload(value: unknown): value is UpdateCancionInput {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Partial<UpdateCancionInput>;
  return typeof v.title === "string" && typeof v.artist === "string" && typeof v.content === "string";
}

export async function GET(req: Request, context: { params: Promise<{ slug: string }> }) {
  const auth = await requirePermission("content.read");
  if ("errorResponse" in auth) return auth.errorResponse;

  const { slug } = await context.params;
  if (!isValidSlug(slug)) {
    return badRequest("Slug invalido");
  }

  try {
    const item = await getCancionAdmin(slug);
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
    return badRequest("Payload de cancion invalido");
  }

  try {
    await updateCancionAdmin(slug, body);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return serverError("No se pudo actualizar la cancion");
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
    await deleteCancionAdmin(slug);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return serverError("No se pudo borrar la cancion");
  }
}
