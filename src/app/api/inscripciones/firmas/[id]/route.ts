import { NextResponse } from "next/server";
import { getFirmaDeCuenta } from "@/server/db/inscripciones-repository";
import { checkRateLimit, getCuentaSesion } from "@/server/lib/cuenta-session";
import { firmaGuardadaToPdf } from "@/server/lib/inscripciones-pdf";

export const dynamic = "force-dynamic";

// Descarga del PDF de una autorización firmada. Solo para la cuenta a la que
// pertenece la persona: un id ajeno responde igual que uno inexistente.

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const cuenta = await getCuentaSesion();
  if (!cuenta) return NextResponse.json({ error: "La sesión venció. Volvé a entrar con tu email." }, { status: 401 });

  if (!(await checkRateLimit("firma-pdf", cuenta.cuentaId, 40, 10))) {
    return NextResponse.json({ error: "Demasiadas descargas seguidas. Esperá unos minutos." }, { status: 429 });
  }

  try {
    const { id } = await params;
    const firma = await getFirmaDeCuenta(cuenta.cuentaId, id);
    if (!firma) return NextResponse.json({ error: "No encontramos esa autorización." }, { status: 404 });

    return new NextResponse(new Uint8Array(await firmaGuardadaToPdf(firma)), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${firma.tipo === "evento" ? "autorizacion" : "uso-de-imagen"}.pdf"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("inscripciones/firmas", error instanceof Error ? error.name : "error");
    return NextResponse.json({ error: "No pudimos generar el PDF. Probá de nuevo." }, { status: 500 });
  }
}
