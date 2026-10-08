import { NextResponse } from "next/server";
import { INVITACION_DIAS, createInvitacion } from "@/server/db/cuentas-repository";
import { checkRateLimit, getCuentaSesion, isSameOriginRequest, normalizeEmail } from "@/server/lib/cuenta-session";
import { sendAdultInvitationEmail } from "@/server/lib/email-service";

export const dynamic = "force-dynamic";

// Suma a otro adulto (el otro papá, una abuela) para que también pueda ver e inscribir
// a las personas a cargo de esta cuenta. El invitado entra con SU email y su propio código.

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Pedido no permitido." }, { status: 403 });

  const cuenta = await getCuentaSesion();
  if (!cuenta) return NextResponse.json({ error: "La sesión venció. Volvé a entrar con tu email." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const email = normalizeEmail(body?.email);
  if (!email) return NextResponse.json({ error: "Revisá el email: no parece válido." }, { status: 400 });
  if (email === cuenta.email) return NextResponse.json({ error: "Ese es tu propio email." }, { status: 400 });

  if (!(await checkRateLimit("invitar", cuenta.cuentaId, 5, 60))) {
    return NextResponse.json({ error: "Mandaste varias invitaciones seguidas. Probá más tarde." }, { status: 429 });
  }

  try {
    const created = await createInvitacion(cuenta.cuentaId, email);
    if (!created) {
      return NextResponse.json({ error: "Primero cargá a los chicos a tu cargo; después podés sumar a otro adulto." }, { status: 400 });
    }

    if (!(process.env.NODE_ENV !== "production" && process.env.INSCRIPCIONES_EMAIL_MODE === "console") && !email.endsWith(".invalid")) {
      // Si el aviso falla, la invitación igual queda hecha: vale con que el invitado entre con su email.
      await sendAdultInvitationEmail(email, INVITACION_DIAS).catch(() => undefined);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("inscripciones/cuenta/invitar", error instanceof Error ? error.name : "error");
    return NextResponse.json({ error: "No pudimos enviar la invitación. Probá de nuevo." }, { status: 500 });
  }
}
