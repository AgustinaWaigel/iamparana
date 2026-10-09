import { NextResponse } from "next/server";
import { ubicacionDe } from "@/app/quienes-somos/ubicaciones";
import { recordAuditEvent } from "@/server/db/audit-repository";
import { listIam, saveIam } from "@/server/db/iam-repository";
import { requirePermission } from "@/server/lib/api-utils";
import { isSameOriginRequest } from "@/server/lib/cuenta-session";
import { iamSchema } from "@/server/lib/iam-validation";

export const dynamic = "force-dynamic";

// Ficha de cada IAM (nombre, dirección, contacto, redes y punto en el mapa). Solo administradores.

export async function GET() {
  const { errorResponse } = await requirePermission("users.manage");
  if (errorResponse) return errorResponse;

  try {
    const iams = await listIam(false);
    // Dónde aparece hoy la que no tiene punto propio, para que el mapa del formulario arranque ahí.
    return NextResponse.json(iams.map((iam) => ({ ...iam, aproximado: ubicacionDe(iam.nombre, iam.ciudad, 0)?.punto ?? null })));
  } catch (error) {
    console.error("admin/iam GET", error instanceof Error ? error.message : "error");
    return NextResponse.json({ error: "No se pudieron cargar las IAM." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { errorResponse, user } = await requirePermission("users.manage");
  if (errorResponse) return errorResponse;
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Pedido no permitido." }, { status: 403 });

  const parsed = iamSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Revisá los datos e intentá de nuevo." }, { status: 400 });

  try {
    const id = await saveIam(parsed.data);
    if (!id) return NextResponse.json({ error: "No encontramos esa IAM." }, { status: 404 });
    await recordAuditEvent({
      actor: user,
      action: parsed.data.id ? "editar" : "crear",
      entityType: "grupo_iam",
      entityId: id,
      metadata: { nombre: parsed.data.nombre, activo: parsed.data.activo },
    }).catch(() => undefined);
    return NextResponse.json({ ok: true, id });
  } catch (error) {
    console.error("admin/iam POST", error instanceof Error ? error.message : "error");
    return NextResponse.json({ error: "No se pudo guardar la IAM." }, { status: 500 });
  }
}
