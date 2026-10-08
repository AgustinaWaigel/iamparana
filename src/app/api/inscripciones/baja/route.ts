import { NextResponse } from "next/server";
import { darDeBaja } from "@/server/db/inscripciones-repository";
import { checkRateLimit, getCuentaSesion, isSameOriginRequest } from "@/server/lib/cuenta-session";
import { estadoInscripcion, getEventoConInscripcion } from "@/server/lib/inscripciones-eventos";

export const dynamic = "force-dynamic";

// Da de baja la inscripción de una persona de la cuenta. Si la inscripción ya
// cerró, la baja queda marcada como fuera de término: corresponde pagar igual.
// Eso lo decide el servidor con la fecha de cierre, no lo que diga el navegador.

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Pedido no permitido." }, { status: 403 });

  const cuenta = await getCuentaSesion();
  if (!cuenta) return NextResponse.json({ error: "La sesión venció. Volvé a entrar con tu email." }, { status: 401 });

  if (!(await checkRateLimit("baja", cuenta.cuentaId, 20, 10))) {
    return NextResponse.json({ error: "Demasiados intentos seguidos. Esperá unos minutos." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const eventoId = typeof body?.eventoId === "string" ? body.eventoId.trim().slice(0, 200) : "";
  const personaId = typeof body?.personaId === "string" ? body.personaId.trim().slice(0, 64) : "";
  if (!eventoId || !personaId) return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });

  try {
    const evento = await getEventoConInscripcion(eventoId);
    if (!evento) return NextResponse.json({ error: "No encontramos ese evento." }, { status: 404 });

    const estado = estadoInscripcion(evento, evento.config);
    if (estado === "finalizado") return NextResponse.json({ error: "El evento ya pasó: no se puede dar de baja." }, { status: 409 });

    const done = await darDeBaja({ cuentaId: cuenta.cuentaId, eventoId, personaId, fueraDeTermino: estado === "cerrada" });
    if (!done) return NextResponse.json({ error: "No encontramos una inscripción activa de esa persona en este evento." }, { status: 404 });
    return NextResponse.json({ ok: true, fueraDeTermino: estado === "cerrada" });
  } catch (error) {
    console.error("inscripciones/baja", error instanceof Error ? error.name : "error");
    return NextResponse.json({ error: "No pudimos registrar la baja. Probá de nuevo." }, { status: 500 });
  }
}
