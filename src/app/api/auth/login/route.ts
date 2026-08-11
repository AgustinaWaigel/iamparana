import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { 
  createSession, 
  findUserByEmail, 
  deleteAllSessionsByUserId 
} from "@/server/db/auth-repository";
import {
  AUTH_COOKIE_NAME,
  createSessionToken,
  getSessionExpiresAtIso,
  hashPassword,
  hashSessionToken,
  verifyPassword,
} from "@/server/lib/auth-security";

// Configuración de Rate Limit (Requiere variables de entorno de Upstash)
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "60 s"),
});

// Mantiene un coste comparable aunque el email no exista, sin revelar cuentas por tiempo.
const DUMMY_HASH = hashPassword("not-a-real-password");
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
    let limitOk = true;
    try {
      const { success } = await ratelimit.limit(ip);
      limitOk = success;
    } catch (rlErr) {
      console.warn("⚠️ Rate limit check failed:", rlErr);
      // Si falla la comprobación de rate limit por problemas de red/DNS,
      // permitimos la solicitud en lugar de devolver 500 para no romper la UX.
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Servicio temporalmente no disponible' }, { status: 503 });
      }
      limitOk = true;
    }

    if (!limitOk) {
      return NextResponse.json(
        { error: "Demasiados intentos. Intente nuevamente en un minuto." }, 
        { status: 429 }
      );
    }

    const body = await req.json();
    const email = typeof body?.email === 'string' ? body.email : '';
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!email || !password || !EMAIL_PATTERN.test(email.trim())) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await findUserByEmail(normalizedEmail);

    // Verificación constante de tiempo
    const passwordToVerify = user ? user.passwordHash : DUMMY_HASH;
    const isValidPassword = await verifyPassword(password, passwordToVerify);

    if (!user || !user.isActive || !isValidPassword) {
      return NextResponse.json(
        { error: "Credenciales inválidas" }, 
        { status: 401 }
      );
    }

    // 1. Limpieza de sesiones previas (Seguridad de Sesión)
    await deleteAllSessionsByUserId(user.id);
    
    // 2. Crear nueva sesión
    const token = createSessionToken();
    const tokenHash = hashSessionToken(token);
    const expiresAtIso = getSessionExpiresAtIso();

    await createSession(user.id, tokenHash, expiresAtIso);

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, role: user.role, nombre: user.nombre },
    });

    // 3. Setear Cookie HttpOnly y Strict
    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict", 
      path: "/",
      expires: new Date(expiresAtIso),
    });

    return response;

  } catch (error) {
    console.error("❌ Login Error:", error);
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}
