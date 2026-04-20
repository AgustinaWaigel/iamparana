// Administración de noticias: crea y lista publicaciones para el panel editorial.
import { NextResponse } from "next/server";
import {
  createNoticiaAdmin,
  listNoticiasAdmin,
  NoticiaInput,
} from "@/server/db/admin-repository";
import { badRequest, requirePermission, isValidSlug, serverError } from "@/app/api/admin/_shared/auth";

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

export async function GET(req: Request) {
  const auth = await requirePermission("content.read");
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const items = await listNoticiasAdmin();
    return NextResponse.json(items);
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

  if (!isValidNoticiaPayload(body)) {
    return badRequest("Payload de noticia invalido");
  }

  try {
    const slug = await createNoticiaAdmin(body);
    return NextResponse.json({ success: true, slug }, { status: 201 });
  } catch (error) {
    console.error(error);
    if (error instanceof Error && error.message.includes("UNIQUE constraint failed")) {
      return NextResponse.json(
        { error: "Ya existe una noticia con ese slug" },
        { status: 409 }
      );
    }
    return serverError("No se pudo crear la noticia");
  }
}
