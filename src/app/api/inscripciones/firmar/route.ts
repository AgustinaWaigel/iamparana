import { NextResponse } from "next/server";
import { InscripcionError } from "@/server/db/inscripciones-repository";
import { checkRateLimit, getCuentaSesion, isSameOriginRequest } from "@/server/lib/cuenta-session";
import { getEventoConInscripcion } from "@/server/lib/inscripciones-eventos";
import { firmarYAvisar } from "@/server/lib/inscripciones-firmar";
import { firmarSchema, firstIssue } from "@/server/lib/inscripciones-validation";

export const dynamic = "force-dynamic";

// Firma de las autorizaciones que hayan quedado pendientes en un evento (por ejemplo,
// las de un menor que se inscribió solo y espera la firma de un adulto).
// El texto que se firma lo arma el servidor: el navegador no puede cambiarlo.

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Pedido no permitido." }, { status: 403 });

  const cuenta = await getCuentaSesion();
  if (!cuenta) return NextResponse.json({ error: "La sesión venció. Volvé a entrar con tu email." }, { status: 401 });

  if (!(await checkRateLimit("firmar", cuenta.cuentaId, 10, 10))) {
    return NextResponse.json({ error: "Demasiados intentos seguidos. Esperá unos minutos." }, { status: 429 });
  }

  const parsed = firmarSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });

  try {
    const evento = await getEventoConInscripcion(parsed.data.eventoId);
    if (!evento || !evento.config.habilitada) return NextResponse.json({ error: "No encontramos ese evento." }, { status: 404 });

    const { emailEnviado } = await firmarYAvisar({
      cuenta,
      evento,
      datos: parsed.data,
      userAgent: request.headers.get("user-agent")?.slice(0, 300) ?? null,
    });
    return NextResponse.json({ ok: true, emailEnviado });
  } catch (error) {
    if (error instanceof InscripcionError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error("inscripciones/firmar", error instanceof Error ? error.name : "error");
    return NextResponse.json({ error: "No pudimos registrar la firma. Probá de nuevo." }, { status: 500 });
  }
}
