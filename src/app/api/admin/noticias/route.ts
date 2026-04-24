import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  createNoticiaAdmin,
  listNoticiasAdmin,
  NoticiaInput,
} from "@/server/db/admin-repository";
import { badRequest, requirePermission, isValidSlug, serverError } from "@/app/api/admin/_shared/auth";

// Forzamos que el listado de noticias en el panel siempre sea fresco
export const dynamic = 'force-dynamic';

function isValidNoticiaPayload(value: unknown): value is NoticiaInput {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Partial<NoticiaInput>;
  return (
    isValidSlug(v.slug) &&
    typeof v.title === "string" &&
    typeof v.date === "string" &&
    typeof v.description === "string" &&
    typeof v.image === "string" &&
    typeof v.content === "string"
  );
}

// GET /api/admin/noticias
export async function GET(req: NextRequest) {
  const auth = await requirePermission("content.read");
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const items = await listNoticiasAdmin();
    return NextResponse.json(items);
  } catch (error) {
    console.error("Error al listar noticias:", error);
    return serverError();
  }
}

// POST /api/admin/noticias
export async function POST(req: NextRequest) {
  const auth = await requirePermission("content.write");
  if ("errorResponse" in auth) return auth.errorResponse;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Body invalido");
  }

  if (!isValidNoticiaPayload(body)) {
    return badRequest("Payload de noticia invalido");
  }

  try {
    const slug = await createNoticiaAdmin(body);

    // REVALIDACIÓN: La clave para que aparezca en el sitio público
    revalidatePath("/");          // Actualiza el home si hay un feed de noticias
    revalidatePath("/noticias");  // Actualiza la lista de noticias
    
    return NextResponse.json({ success: true, slug }, { status: 201 });
  } catch (error) {
    console.error("Error al crear noticia:", error);
    if (error instanceof Error && error.message.includes("UNIQUE constraint failed")) {
      return NextResponse.json(
        { error: "Ya existe una noticia con ese slug (el título ya fue usado)" },
        { status: 409 }
      );
    }
    return serverError("No se pudo crear la noticia");
  }
}