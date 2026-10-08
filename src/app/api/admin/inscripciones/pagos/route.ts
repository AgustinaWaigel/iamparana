import { NextResponse } from "next/server";
import { z } from "zod";
import { recordAuditEvent } from "@/server/db/audit-repository";
import { setPagoEstado } from "@/server/db/inscripciones-admin-repository";
import { requirePermission } from "@/server/lib/api-utils";
import { isSameOriginRequest } from "@/server/lib/cuenta-session";

export const dynamic = "force-dynamic";

// Marca el pago de una o varias inscripciones de un evento. Solo administradores;
// queda registrado quién lo marcó.

const schema = z
  .object({
    eventoId: z.string().trim().min(1).max(200),
    inscripcionIds: z.array(z.string().trim().min(1).max(64)).min(1).max(100),
    estado: z.enum(["pendiente", "pagado", "exento"]).optional(),
    /** Con qué se pagó; null lo borra. */
    medio: z.enum(["transferencia", "efectivo"]).nullable().optional(),
  })
  .refine((value) => value.estado !== undefined || value.medio !== undefined);

export async function POST(request: Request) {
  const { errorResponse, user } = await requirePermission("users.manage");
  if (errorResponse) return errorResponse;
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Pedido no permitido." }, { status: 403 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });

  try {
    const cambiadas = await setPagoEstado({ ...parsed.data, userId: user.id });
    if (cambiadas === 0) return NextResponse.json({ error: "No encontramos esas inscripciones en este evento." }, { status: 404 });
    await recordAuditEvent({
      actor: user,
      action: "marcar_pago",
      entityType: "inscripciones_evento",
      entityId: parsed.data.eventoId,
      metadata: { estado: parsed.data.estado ?? null, medio: parsed.data.medio ?? null, inscripciones: cambiadas },
    }).catch(() => undefined);
    return NextResponse.json({ ok: true, cambiadas });
  } catch (error) {
    console.error("admin/inscripciones/pagos", error instanceof Error ? error.name : "error");
    return NextResponse.json({ error: "No se pudo guardar el pago." }, { status: 500 });
  }
}
