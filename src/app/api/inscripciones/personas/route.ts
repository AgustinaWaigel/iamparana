import { NextResponse } from "next/server";
import { InscripcionError, savePersona, saveTitularContacto } from "@/server/db/inscripciones-repository";
import { checkRateLimit, getCuentaSesion, isSameOriginRequest } from "@/server/lib/cuenta-session";
import { firstIssue, personaSchema, titularContactoSchema } from "@/server/lib/inscripciones-validation";

export const dynamic = "force-dynamic";

// Alta y edición de una persona de la cuenta familiar.
// La cuenta sale siempre de la sesión: el navegador no puede indicar otra.

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Pedido no permitido." }, { status: 403 });

  const cuenta = await getCuentaSesion();
  if (!cuenta) return NextResponse.json({ error: "La sesión venció. Volvé a entrar con tu email." }, { status: 401 });

  if (!(await checkRateLimit("personas", cuenta.cuentaId, 40, 10))) {
    return NextResponse.json({ error: "Demasiados cambios seguidos. Esperá unos minutos." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);

  try {
    // Adulto responsable que no participa de eventos: solo nombre y teléfono.
    if (body?.soloContacto === true) {
      const parsed = titularContactoSchema.safeParse(body);
      if (!parsed.success) return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });
      const id = await saveTitularContacto(cuenta.cuentaId, parsed.data);
      return NextResponse.json({ ok: true, id });
    }

    const parsed = personaSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });
    const id = await savePersona(cuenta.cuentaId, parsed.data);
    return NextResponse.json({ ok: true, id });
  } catch (error) {
    if (error instanceof InscripcionError) return NextResponse.json({ error: error.message }, { status: 400 });
    // Sin datos personales en el registro.
    console.error("inscripciones/personas", error instanceof Error ? error.name : "error");
    return NextResponse.json({ error: "No pudimos guardar los datos. Probá de nuevo." }, { status: 500 });
  }
}
