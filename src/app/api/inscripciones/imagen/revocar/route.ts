import { NextResponse } from "next/server";
import { revocarImagen } from "@/server/db/inscripciones-repository";
import { checkRateLimit, getCuentaSesion, isSameOriginRequest } from "@/server/lib/cuenta-session";

export const dynamic = "force-dynamic";

// Retira el permiso de uso de imagen de una persona de la cuenta.

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Pedido no permitido." }, { status: 403 });

  const cuenta = await getCuentaSesion();
  if (!cuenta) return NextResponse.json({ error: "La sesión venció. Volvé a entrar con tu email." }, { status: 401 });

  if (!(await checkRateLimit("imagen-revocar", cuenta.cuentaId, 20, 10))) {
    return NextResponse.json({ error: "Demasiados intentos seguidos. Esperá unos minutos." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const personaId = typeof body?.personaId === "string" ? body.personaId.trim().slice(0, 64) : "";
  if (!personaId) return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });

  try {
    const done = await revocarImagen(cuenta.cuentaId, personaId);
    if (!done) return NextResponse.json({ error: "No encontramos un permiso de imagen vigente para esa persona." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("inscripciones/imagen/revocar", error instanceof Error ? error.name : "error");
    return NextResponse.json({ error: "No pudimos retirar el permiso. Probá de nuevo." }, { status: 500 });
  }
}
