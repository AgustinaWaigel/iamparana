import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { recordAuditEvent } from "@/server/db/audit-repository";
import { getEventoConfig, saveEventoConfig } from "@/server/db/inscripciones-repository";
import { requirePermission } from "@/server/lib/api-utils";
import { isSameOriginRequest } from "@/server/lib/cuenta-session";
import { eventoConfigSchema, firstIssue } from "@/server/lib/inscripciones-validation";

export const dynamic = "force-dynamic";

// Configuración de inscripción de un evento de la agenda. Solo administradores.

export async function GET(request: NextRequest) {
  const { errorResponse } = await requirePermission("users.manage");
  if (errorResponse) return errorResponse;

  const eventoId = request.nextUrl.searchParams.get("eventoId")?.trim();
  if (!eventoId) return NextResponse.json({ error: "Falta el evento." }, { status: 400 });

  try {
    // null = el evento todavía no tiene inscripción configurada.
    return NextResponse.json({ config: await getEventoConfig(eventoId) });
  } catch (error) {
    console.error("admin/inscripciones/eventos GET", error instanceof Error ? error.message : "error");
    return NextResponse.json({ error: "No se pudo cargar la configuración." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const { errorResponse, user } = await requirePermission("users.manage");
  if (errorResponse) return errorResponse;
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Pedido no permitido." }, { status: 403 });

  const parsed = eventoConfigSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });

  try {
    await saveEventoConfig(parsed.data);
    await recordAuditEvent({
      actor: user,
      action: "configurar",
      entityType: "inscripcion_evento",
      entityId: parsed.data.eventoId,
      metadata: { habilitada: parsed.data.habilitada, roles: parsed.data.roles },
    }).catch(() => undefined);
    revalidatePath("/inscripciones");
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("admin/inscripciones/eventos PUT", error instanceof Error ? error.message : "error");
    return NextResponse.json({ error: "No se pudo guardar la configuración." }, { status: 500 });
  }
}
