import { NextResponse } from "next/server";
import { recordAuditEvent } from "@/server/db/audit-repository";
import { InscripcionError, listGrupos, saveGrupo } from "@/server/db/inscripciones-repository";
import { requirePermission } from "@/server/lib/api-utils";
import { isSameOriginRequest } from "@/server/lib/cuenta-session";
import { firstIssue, grupoSchema } from "@/server/lib/inscripciones-validation";

export const dynamic = "force-dynamic";

// Grupos IAM que las familias eligen al registrarse. Solo administradores.

export async function GET() {
  const { errorResponse } = await requirePermission("users.manage");
  if (errorResponse) return errorResponse;

  try {
    return NextResponse.json(await listGrupos(false));
  } catch (error) {
    console.error("admin/inscripciones/grupos GET", error instanceof Error ? error.message : "error");
    return NextResponse.json({ error: "No se pudieron cargar los grupos." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { errorResponse, user } = await requirePermission("users.manage");
  if (errorResponse) return errorResponse;
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Pedido no permitido." }, { status: 403 });

  const parsed = grupoSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });

  try {
    const id = await saveGrupo(parsed.data);
    await recordAuditEvent({
      actor: user,
      action: parsed.data.id ? "editar" : "crear",
      entityType: "grupo_iam",
      entityId: id,
      metadata: { nombre: parsed.data.nombre, activo: parsed.data.activo },
    }).catch(() => undefined);
    return NextResponse.json({ ok: true, id });
  } catch (error) {
    if (error instanceof InscripcionError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error("admin/inscripciones/grupos POST", error instanceof Error ? error.message : "error");
    return NextResponse.json({ error: "No se pudo guardar el grupo." }, { status: 500 });
  }
}
