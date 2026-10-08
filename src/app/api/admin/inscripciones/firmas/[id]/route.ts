import { NextResponse } from "next/server";
import { recordAuditEvent } from "@/server/db/audit-repository";
import { getFirmaAdmin } from "@/server/db/inscripciones-repository";
import { requirePermission } from "@/server/lib/api-utils";
import { firmaGuardadaToPdf } from "@/server/lib/inscripciones-pdf";

export const dynamic = "force-dynamic";

// PDF de una autorización firmada, para el admin. Queda registrado quién lo bajó.

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { errorResponse, user } = await requirePermission("users.manage");
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;
    const firma = await getFirmaAdmin(id);
    if (!firma) return NextResponse.json({ error: "No encontramos esa autorización." }, { status: 404 });

    await recordAuditEvent({ actor: user, action: "descargar", entityType: "inscripcion_firma", entityId: id }).catch(() => undefined);

    return new NextResponse(new Uint8Array(await firmaGuardadaToPdf(firma)), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${firma.tipo === "evento" ? "autorizacion" : "uso-de-imagen"}.pdf"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("admin/inscripciones/firmas", error instanceof Error ? error.name : "error");
    return NextResponse.json({ error: "No se pudo generar el PDF." }, { status: 500 });
  }
}
