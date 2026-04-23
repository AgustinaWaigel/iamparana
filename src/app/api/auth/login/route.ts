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
  hashSessionToken,
  verifyPassword,
} from "@/server/lib/auth-security";

// Configuración de Rate Limit (Requiere variables de entorno de Upstash)
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "60 s"),
});

const DUMMY_HASH = "$2b$10$Z9M3.8QxG1K7S8R9T0U1V2W3X4Y5Z6A7B8C9D0E1F2G3H4I5J6K7L";

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
    const { success: limitOk } = await ratelimit.limit(ip);
    
    if (!limitOk) {
      return NextResponse.json(
        { error: "Demasiados intentos. Intente nuevamente en un minuto." }, 
        { status: 429 }
      );
    }

    const { email, password } = await req.json();

    if (!email || !password) {
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