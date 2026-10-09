import { NextResponse } from "next/server";
import { listPendingGuestComments } from "@/server/db/news-engagement-repository";
import { requirePermission } from "@/server/lib/api-utils";

export const dynamic = "force-dynamic";

// Comentarios de invitados que esperan aprobación. Solo administradores.
// Aprobar y borrar se hacen con la ruta de cada noticia (/api/noticias/[slug]/engagement).

export async function GET() {
  const { errorResponse } = await requirePermission("users.manage");
  if (errorResponse) return errorResponse;

  try {
    return NextResponse.json({ comentarios: await listPendingGuestComments() });
  } catch (error) {
    console.error("admin/comentarios GET", error instanceof Error ? error.message : "error");
    return NextResponse.json({ error: "No se pudieron cargar los comentarios." }, { status: 500 });
  }
}
