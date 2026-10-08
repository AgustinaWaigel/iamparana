import { NextResponse } from "next/server";
import { abrirSesion, verificar2fa } from "@/server/lib/auth-2fa";
import { checkRateLimit, getClientIp, isSameOriginRequest } from "@/server/lib/cuenta-session";

export const dynamic = "force-dynamic";

// Segundo paso del ingreso de un administrador: el código que le llegó por email.

const INVALIDO = "El código no es correcto o ya venció. Volvé a iniciar sesión para recibir otro.";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Pedido no permitido." }, { status: 403 });

  if (!(await checkRateLimit("admin-2fa", getClientIp(request), 10, 10))) {
    return NextResponse.json({ error: "Demasiados intentos. Esperá unos minutos." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const code = typeof body?.codigo === "string" ? body.codigo.replace(/\s/g, "") : "";
  if (!/^\d{6}$/.test(code)) return NextResponse.json({ error: INVALIDO }, { status: 400 });

  try {
    const userId = await verificar2fa(code);
    if (!userId) return NextResponse.json({ error: INVALIDO }, { status: 401 });
    await abrirSesion(userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("auth/login/verificar", error instanceof Error ? error.name : "error");
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}
