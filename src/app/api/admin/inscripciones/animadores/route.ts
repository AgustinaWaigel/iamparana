import { NextResponse } from "next/server";
import { addAnimador, aprobarAnimador, listAnimadores, removeAnimador, setCoordinador } from "@/server/db/animadores-repository";
import { recordAuditEvent } from "@/server/db/audit-repository";
import { InscripcionError } from "@/server/db/inscripciones-repository";
import { requirePermission } from "@/server/lib/api-utils";
import { isSameOriginRequest, normalizeEmail } from "@/server/lib/cuenta-session";

export const dynamic = "force-dynamic";

// Qué usuarios del sitio pueden ver a los inscriptos de cada IAM. Solo administradores.

export async function GET() {
  const { errorResponse } = await requirePermission("users.manage");
  if (errorResponse) return errorResponse;
  try {
    return NextResponse.json(await listAnimadores());
  } catch (error) {
    console.error("admin/inscripciones/animadores GET", error instanceof Error ? error.name : "error");
    return NextResponse.json({ error: "No se pudieron cargar los animadores." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { errorResponse, user } = await requirePermission("users.manage");
  if (errorResponse) return errorResponse;
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Pedido no permitido." }, { status: 403 });

  const body = await request.json().catch(() => null);
  const grupoId = typeof body?.grupoId === "string" ? body.grupoId.trim().slice(0, 64) : "";
  if (!grupoId) return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });

  // Aprobar el pedido que el usuario hizo desde su perfil.
  if (body?.accion === "aprobar") {
    const userId = Number(body?.userId);
    if (!Number.isInteger(userId) || userId <= 0) return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
    try {
      const done = await aprobarAnimador(grupoId, userId);
      if (!done) return NextResponse.json({ error: "Ese pedido ya no existe." }, { status: 404 });
      await recordAuditEvent({ actor: user, action: "aprobar_acceso", entityType: "grupo_iam_animador", entityId: grupoId, metadata: { userId } }).catch(() => undefined);
      return NextResponse.json({ ok: true });
    } catch (error) {
      console.error("admin/inscripciones/animadores aprobar", error instanceof Error ? error.name : "error");
      return NextResponse.json({ error: "No se pudo aprobar." }, { status: 500 });
    }
  }

  // Nombrar (o dejar de nombrar) coordinador de la IAM a un animador ya aprobado.
  if (body?.accion === "coordinador") {
    const userId = Number(body?.userId);
    if (!Number.isInteger(userId) || userId <= 0 || typeof body?.coordinador !== "boolean") return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
    try {
      const done = await setCoordinador(grupoId, userId, body.coordinador);
      if (!done) return NextResponse.json({ error: "Primero tiene que tener el acceso aprobado." }, { status: 400 });
      await recordAuditEvent({ actor: user, action: body.coordinador ? "nombrar_coordinador" : "quitar_coordinador", entityType: "grupo_iam_animador", entityId: grupoId, metadata: { userId } }).catch(() => undefined);
      return NextResponse.json({ ok: true });
    } catch (error) {
      console.error("admin/inscripciones/animadores coordinador", error instanceof Error ? error.name : "error");
      return NextResponse.json({ error: "No se pudo guardar." }, { status: 500 });
    }
  }

  const email = normalizeEmail(body?.email);
  if (!email) return NextResponse.json({ error: "Revisá el email: no parece válido." }, { status: 400 });

  try {
    await addAnimador(grupoId, email);
    await recordAuditEvent({ actor: user, action: "dar_acceso", entityType: "grupo_iam_animador", entityId: grupoId, metadata: { email } }).catch(() => undefined);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof InscripcionError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error("admin/inscripciones/animadores POST", error instanceof Error ? error.name : "error");
    return NextResponse.json({ error: "No se pudo dar el acceso." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { errorResponse, user } = await requirePermission("users.manage");
  if (errorResponse) return errorResponse;
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Pedido no permitido." }, { status: 403 });

  const body = await request.json().catch(() => null);
  const grupoId = typeof body?.grupoId === "string" ? body.grupoId.trim().slice(0, 64) : "";
  const userId = Number(body?.userId);
  if (!grupoId || !Number.isInteger(userId) || userId <= 0) return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });

  try {
    const done = await removeAnimador(grupoId, userId);
    if (!done) return NextResponse.json({ error: "Ese usuario no tenía acceso a este grupo." }, { status: 404 });
    await recordAuditEvent({ actor: user, action: "quitar_acceso", entityType: "grupo_iam_animador", entityId: grupoId, metadata: { userId } }).catch(() => undefined);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("admin/inscripciones/animadores DELETE", error instanceof Error ? error.name : "error");
    return NextResponse.json({ error: "No se pudo quitar el acceso." }, { status: 500 });
  }
}
