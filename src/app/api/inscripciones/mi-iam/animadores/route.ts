import { NextResponse } from "next/server";
import { coordinadorAprobar, coordinadorQuitar, esCoordinador } from "@/server/db/animadores-repository";
import { recordAuditEvent } from "@/server/db/audit-repository";
import { getSessionUser } from "@/server/lib/api-utils";
import { checkRateLimit, isSameOriginRequest } from "@/server/lib/cuenta-session";

export const dynamic = "force-dynamic";

// Quien coordina una IAM aprueba o da de baja a los animadores de SU grupo.
// No puede tocar a otros coordinadores ni a animadores de otra IAM.

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Pedido no permitido." }, { status: 403 });

  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Iniciá sesión para continuar." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const grupoId = typeof body?.grupoId === "string" ? body.grupoId.trim().slice(0, 64) : "";
  const userId = Number(body?.userId);
  const accion = body?.accion;
  if (!grupoId || !Number.isInteger(userId) || userId <= 0 || (accion !== "aprobar" && accion !== "quitar")) {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  try {
    // El permiso se comprueba en cada pedido: que sea coordinador aprobado de ese grupo en particular.
    if (!(await esCoordinador(user.id, grupoId))) return NextResponse.json({ error: "Solo quien coordina esta IAM puede hacer eso." }, { status: 403 });
    if (!(await checkRateLimit("coordinador-animadores", String(user.id), 40, 10))) {
      return NextResponse.json({ error: "Demasiados cambios seguidos. Esperá unos minutos." }, { status: 429 });
    }

    const done = accion === "aprobar" ? await coordinadorAprobar(grupoId, userId) : await coordinadorQuitar(grupoId, userId);
    if (!done) return NextResponse.json({ error: "No se pudo: esa persona ya no figura, o es coordinador/a del grupo." }, { status: 400 });
    await recordAuditEvent({ actor: user, action: accion === "aprobar" ? "aprobar_acceso" : "quitar_acceso", entityType: "grupo_iam_animador", entityId: grupoId, metadata: { userId, por: "coordinador" } }).catch(() => undefined);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("inscripciones/mi-iam/animadores", error instanceof Error ? error.name : "error");
    return NextResponse.json({ error: "No se pudo guardar." }, { status: 500 });
  }
}
