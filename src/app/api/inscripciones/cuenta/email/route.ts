import { NextResponse } from "next/server";
import { CODE_TTL_MINUTES, changeCuentaEmail, storeAccessCode, takeAccessCodeAttempt } from "@/server/db/cuentas-repository";
import { checkRateLimit, getCuentaSesion, getCuentaTokenHash, isSameOriginRequest, normalizeEmail } from "@/server/lib/cuenta-session";
import { sendAccessCodeEmail, sendEmailChangedNotice } from "@/server/lib/email-service";
import { createAccessCode, hashAccessCode, safeEqual } from "@/server/lib/inscripciones-crypto";

export const dynamic = "force-dynamic";

// Cambio del email de acceso: se pide un código al email NUEVO y recién al
// confirmarlo se cambia. Hace falta estar dentro de la cuenta.

const INVALID = "El código no es correcto o ya venció. Pedí uno nuevo si hace falta.";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Pedido no permitido." }, { status: 403 });

  const cuenta = await getCuentaSesion();
  if (!cuenta) return NextResponse.json({ error: "La sesión venció. Volvé a entrar con tu email." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const newEmail = normalizeEmail(body?.email);
  if (!newEmail) return NextResponse.json({ error: "Revisá el email: no parece válido." }, { status: 400 });
  if (newEmail === cuenta.email) return NextResponse.json({ error: "Ese ya es tu email de acceso." }, { status: 400 });

  try {
    if (body?.paso === "pedir") {
      const [cuentaOk, emailOk] = await Promise.all([
        checkRateLimit("cambio-email", cuenta.cuentaId, 4, 30),
        checkRateLimit("codigo-email", newEmail, 3, 10),
      ]);
      if (!cuentaOk || !emailOk) {
        return NextResponse.json({ error: "Pediste varios códigos seguidos. Esperá unos minutos." }, { status: 429 });
      }

      const code = createAccessCode();
      await storeAccessCode(newEmail, hashAccessCode(newEmail, code));
      if (process.env.NODE_ENV !== "production" && process.env.INSCRIPCIONES_EMAIL_MODE === "console") {
        console.log(`[inscripciones] código de acceso (modo consola): ${code}`);
      } else {
        await sendAccessCodeEmail(newEmail, code, CODE_TTL_MINUTES);
      }
      // Misma respuesta esté o no ese email en uso por otra cuenta.
      return NextResponse.json({ ok: true, minutos: CODE_TTL_MINUTES });
    }

    if (body?.paso === "confirmar") {
      const code = typeof body?.codigo === "string" ? body.codigo.replace(/\s/g, "") : "";
      if (!/^\d{6}$/.test(code)) return NextResponse.json({ error: INVALID }, { status: 400 });
      if (!(await checkRateLimit("cambio-email-verificar", cuenta.cuentaId, 15, 10))) {
        return NextResponse.json({ error: "Demasiados intentos. Esperá unos minutos." }, { status: 429 });
      }

      const attempt = await takeAccessCodeAttempt(newEmail);
      if (!attempt || !safeEqual(attempt.codigoHash, hashAccessCode(newEmail, code))) {
        return NextResponse.json({ error: INVALID }, { status: 401 });
      }

      const changed = await changeCuentaEmail({
        cuentaId: cuenta.cuentaId,
        newEmail,
        codeId: attempt.id,
        keepTokenHash: await getCuentaTokenHash(),
      });
      if (!changed) {
        // Recién acá, con el email nuevo ya verificado, se informa que no está disponible.
        return NextResponse.json({ error: "Ese email ya tiene otra cuenta familiar. Usá otro o escribinos para unirlas." }, { status: 409 });
      }

      // Aviso al email anterior: si el cambio no lo hizo el dueño, se entera.
      if (!(process.env.NODE_ENV !== "production" && process.env.INSCRIPCIONES_EMAIL_MODE === "console")) {
        await sendEmailChangedNotice(cuenta.email).catch(() => undefined);
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  } catch (error) {
    console.error("inscripciones/cuenta/email", error instanceof Error ? error.message : "error");
    return NextResponse.json({ error: "No pudimos completar el cambio. Probá de nuevo." }, { status: 500 });
  }
}
