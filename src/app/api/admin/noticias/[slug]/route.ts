import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
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

// Tipo para el contexto de Next.js 15
type Context = {
  params: Promise<{ slug: string }>;
};

// GET /api/admin/noticias/[slug]
export async function GET(req: NextRequest, context: Context) {
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
    console.error("Error en GET noticia:", error);
    return serverError();
  }
}

// PUT /api/admin/noticias/[slug]
export async function PUT(req: NextRequest, context: Context) {
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

    // REVALIDACIÓN: Actualiza la lista de noticias y la noticia individual
    revalidatePath("/noticias");
    revalidatePath(`/noticias/${slug}`);
    revalidatePath("/"); // Por si la noticia aparece en el home

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en PUT noticia:", error);
    return serverError("No se pudo actualizar la noticia");
  }
}

// DELETE /api/admin/noticias/[slug]
export async function DELETE(req: NextRequest, context: Context) {
  const auth = await requirePermission("content.delete");
  if ("errorResponse" in auth) return auth.errorResponse;

  const { slug } = await context.params;
  if (!isValidSlug(slug)) {
    return badRequest("Slug invalido");
  }

  try {
    await deleteNoticiaAdmin(slug);

    // REVALIDACIÓN: Limpia la lista después de borrar
    revalidatePath("/noticias");
    revalidatePath("/");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en DELETE noticia:", error);
    return serverError("No se pudo borrar la noticia");
  }
}