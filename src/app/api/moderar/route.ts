// Ruta de moderación de comentarios: valida permisos y marca aprobaciones.
import { NextResponse } from "next/server";
import { updateComentarioAprobado } from "@/server/db/comments-repository";
import { requirePermission } from "@/app/api/admin/_shared/auth";

type ModerarBody = {
  slug: string;
  index: number;
  aprobado: boolean;
};

function errorResponse(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

function isValidSlug(slug: unknown): slug is string {
  return typeof slug === "string" && /^[a-z0-9-]+$/.test(slug);
}

function isValidIndex(index: unknown): index is number {
  return typeof index === "number" && Number.isInteger(index) && index >= 0;
}

function isValidAprobado(aprobado: unknown): aprobado is boolean {
  return typeof aprobado === "boolean";
}

export async function POST(req: Request) {
  const auth = await requirePermission("comments.moderate");
  if ("errorResponse" in auth) {
    return auth.errorResponse;
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse(400, "Body invalido");
  }

  if (typeof body !== "object" || body === null) {
    return errorResponse(400, "Body invalido");
  }

  const { slug, index, aprobado } = body as Partial<ModerarBody>;

  if (!isValidSlug(slug)) {
    return errorResponse(400, "slug invalido");
  }

  if (!isValidIndex(index)) {
    return errorResponse(400, "index invalido");
  }

  if (!isValidAprobado(aprobado)) {
    return errorResponse(400, "aprobado invalido");
  }

  const result = await updateComentarioAprobado(slug, index, aprobado);
  if (!result.ok) {
    return errorResponse(result.status, result.error);
  }

  return NextResponse.json({ success: true });
}
