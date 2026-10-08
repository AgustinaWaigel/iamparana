import { NextResponse } from "next/server";
import { CODE_TTL_MINUTES, storeAccessCode } from "@/server/db/cuentas-repository";
import { checkRateLimit, getClientIp, isSameOriginRequest, normalizeEmail } from "@/server/lib/cuenta-session";
import { sendAccessCodeEmail } from "@/server/lib/email-service";
import { createAccessCode, hashAccessCode } from "@/server/lib/inscripciones-crypto";

export const dynamic = "force-dynamic";

// La respuesta es la misma exista o no una cuenta con ese email:
// no se puede usar para averiguar quién está registrado.
const OK_RESPONSE = { ok: true, minutos: CODE_TTL_MINUTES };

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Pedido no permitido." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const email = normalizeEmail(body?.email);
  if (!email) {
    return NextResponse.json({ error: "Revisá el email: no parece válido." }, { status: 400 });
  }

  // Por IP frena a quien prueba muchos emails; por email frena el envío repetido a una casilla.
  const [ipOk, emailOk] = await Promise.all([
    checkRateLimit("codigo-ip", getClientIp(request), 6, 10),
    checkRateLimit("codigo-email", email, 3, 10),
  ]);
  if (!ipOk || !emailOk) {
    return NextResponse.json(
      { error: "Pediste varios códigos seguidos. Esperá unos minutos y probá de nuevo." },
      { status: 429 },
    );
  }

  try {
    const code = createAccessCode();
    await storeAccessCode(email, hashAccessCode(email, code));

    // Solo para desarrollo local: muestra el código en la consola en lugar de mandar el email.
    if (process.env.NODE_ENV !== "production" && process.env.INSCRIPCIONES_EMAIL_MODE === "console") {
      console.log(`[inscripciones] código de acceso (modo consola): ${code}`);
    } else {
      await sendAccessCodeEmail(email, code, CODE_TTL_MINUTES);
    }

    return NextResponse.json(OK_RESPONSE);
  } catch (error) {
    // Sin el email ni el código en el registro.
    console.error("inscripciones/acceso/codigo", error instanceof Error ? error.message : "error");
    return NextResponse.json(
      { error: "No pudimos enviar el código. Probá de nuevo en un momento." },
      { status: 500 },
    );
  }
}
