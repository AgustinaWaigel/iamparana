import { NextResponse } from "next/server";
import { openCuentaSession, takeAccessCodeAttempt } from "@/server/db/cuentas-repository";
import { getSessionUser } from "@/server/lib/api-utils";
import {
  CUENTA_SESSION_HOURS,
  checkRateLimit,
  createCuentaToken,
  getClientIp,
  isSameOriginRequest,
  normalizeEmail,
  setCuentaCookie,
} from "@/server/lib/cuenta-session";
import { hashAccessCode, safeEqual } from "@/server/lib/inscripciones-crypto";

export const dynamic = "force-dynamic";

// Un único mensaje para código incorrecto, vencido, agotado o inexistente.
const INVALID = "El código no es correcto o ya venció. Pedí uno nuevo si hace falta.";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Pedido no permitido." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const email = normalizeEmail(body?.email);
  const code = typeof body?.codigo === "string" ? body.codigo.replace(/\s/g, "") : "";
  if (!email || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: INVALID }, { status: 400 });
  }

  const allowed = await checkRateLimit("verificar-ip", getClientIp(request), 20, 10);
  if (!allowed) {
    return NextResponse.json(
      { error: "Demasiados intentos. Esperá unos minutos y probá de nuevo." },
      { status: 429 },
    );
  }

  try {
    const attempt = await takeAccessCodeAttempt(email);
    if (!attempt || !safeEqual(attempt.codigoHash, hashAccessCode(email, code))) {
      return NextResponse.json({ error: INVALID }, { status: 401 });
    }

    // Si hay un usuario del sitio con sesión y confirmó SU email, las cuentas quedan unidas:
    // la próxima vez entra directo. Con otro email no se vincula nada.
    const user = await getSessionUser();
    const linkUserId = user && user.email.trim().toLowerCase() === email ? user.id : undefined;

    const { token, tokenHash } = createCuentaToken();
    await openCuentaSession({ email, codeId: attempt.id, tokenHash, sessionHours: CUENTA_SESSION_HOURS, linkUserId });
    await setCuentaCookie(token);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("inscripciones/acceso/verificar", error instanceof Error ? error.message : "error");
    return NextResponse.json({ error: "No pudimos verificar el código. Probá de nuevo." }, { status: 500 });
  }
}
