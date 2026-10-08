import { NextResponse } from "next/server";
import { removeAdulto } from "@/server/db/cuentas-repository";
import { checkRateLimit, getCuentaSesion, isSameOriginRequest, normalizeEmail } from "@/server/lib/cuenta-session";

export const dynamic = "force-dynamic";

// Quita el acceso de un adulto al que esta cuenta había sumado (o cancela su invitación).
// Solo vale para adultos que invitó esta misma cuenta.

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Pedido no permitido." }, { status: 403 });

  const cuenta = await getCuentaSesion();
  if (!cuenta) return NextResponse.json({ error: "La sesión venció. Volvé a entrar con tu email." }, { status: 401 });

  if (!(await checkRateLimit("quitar-adulto", cuenta.cuentaId, 10, 10))) {
    return NextResponse.json({ error: "Demasiados intentos seguidos. Esperá unos minutos." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const email = normalizeEmail(body?.email);
  if (!email) return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });

  try {
    const done = await removeAdulto(cuenta.cuentaId, email);
    if (!done) return NextResponse.json({ error: "Solo podés quitar a un adulto que hayas sumado vos." }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("inscripciones/cuenta/quitar-adulto", error instanceof Error ? error.name : "error");
    return NextResponse.json({ error: "No pudimos quitar el acceso. Probá de nuevo." }, { status: 500 });
  }
}
