import { NextResponse } from "next/server";
import { requirePermission, serverError } from "@/app/api/admin/_shared/auth";
import { recordAuditEvent } from "@/server/db/audit-repository";
import { isSameOriginRequest } from "@/server/lib/cuenta-session";
import { crearRespaldo, listarRespaldos } from "@/server/lib/respaldo";

// Copias de seguridad: ver las que hay y hacer una en el momento. Solo administradores.

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  const auth = await requirePermission("users.manage");
  if ("errorResponse" in auth) return auth.errorResponse;
  try {
    // Solo nombre, fecha y tamaño: el contenido nunca pasa por el navegador.
    const respaldos = await listarRespaldos();
    return NextResponse.json({ respaldos: respaldos.map(({ nombre, creado, peso }) => ({ nombre, creado, peso })) });
  } catch (error) {
    console.error("admin/respaldos GET", error instanceof Error ? error.message : "error");
    return serverError("No se pudo consultar Google Drive.");
  }
}

export async function POST(request: Request) {
  const auth = await requirePermission("users.manage");
  if ("errorResponse" in auth) return auth.errorResponse;
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Pedido no permitido." }, { status: 403 });
  try {
    const respaldo = await crearRespaldo();
    await recordAuditEvent({ actor: auth.user, action: "create", entityType: "respaldo", area: "administracion", metadata: { tablas: respaldo.tablas, filas: respaldo.filas } });
    return NextResponse.json({ ok: true, ...respaldo });
  } catch (error) {
    console.error("admin/respaldos POST", error instanceof Error ? error.message : "error");
    return serverError("No se pudo hacer la copia.");
  }
}
