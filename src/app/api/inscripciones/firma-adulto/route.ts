import { NextResponse } from "next/server";
import { listInscripcionesConFirmas, listPersonasDeCuenta } from "@/server/db/inscripciones-repository";
import { checkRateLimit, getCuentaSesion, isSameOriginRequest, normalizeEmail } from "@/server/lib/cuenta-session";
import { getEventoConInscripcion } from "@/server/lib/inscripciones-eventos";
import { pedirFirmaDeAdulto, titularEsMenor } from "@/server/lib/inscripciones-firmar";

export const dynamic = "force-dynamic";

// Un menor que se inscribió solo vuelve a pedirle a un adulto (o a otro) que firme su autorización.

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Pedido no permitido." }, { status: 403 });

  const cuenta = await getCuentaSesion();
  if (!cuenta) return NextResponse.json({ error: "La sesión venció. Volvé a entrar con tu email." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const eventoId = typeof body?.eventoId === "string" ? body.eventoId.trim().slice(0, 200) : "";
  const adultoEmail = normalizeEmail(body?.email);
  if (!eventoId) return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  if (!adultoEmail) return NextResponse.json({ error: "Revisá el email: no parece válido." }, { status: 400 });
  if (adultoEmail === cuenta.email) return NextResponse.json({ error: "Tiene que ser el email del adulto, no el tuyo." }, { status: 400 });

  if (!(await checkRateLimit("firma-adulto", cuenta.cuentaId, 5, 60))) {
    return NextResponse.json({ error: "Mandaste varios avisos seguidos. Probá más tarde." }, { status: 429 });
  }

  try {
    const [evento, personas, inscripciones] = await Promise.all([
      getEventoConInscripcion(eventoId),
      listPersonasDeCuenta(cuenta.cuentaId),
      listInscripcionesConFirmas(cuenta.cuentaId, eventoId),
    ]);
    if (!evento) return NextResponse.json({ error: "No encontramos ese evento." }, { status: 404 });
    // Solo tiene sentido para un menor con algo pendiente de firma: no es una forma general de compartir la cuenta.
    if (!titularEsMenor(personas) || !inscripciones.some((item) => !item.firmaEventoId || item.imagen === null)) {
      return NextResponse.json({ error: "No hay autorizaciones pendientes que tenga que firmar un adulto." }, { status: 400 });
    }

    await pedirFirmaDeAdulto({ cuenta, evento, adultoEmail });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("inscripciones/firma-adulto", error instanceof Error ? error.name : "error");
    return NextResponse.json({ error: "No pudimos enviar el aviso. Probá de nuevo." }, { status: 500 });
  }
}
