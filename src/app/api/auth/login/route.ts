// Ruta de login: valida credenciales y crea la sesión de acceso al panel.
import { NextResponse } from "next/server";
import { createSession, findUserByEmail } from "@/server/db/auth-repository";
import {
  AUTH_COOKIE_NAME,
  createSessionToken,
  getSessionExpiresAtIso,
  hashSessionToken,
  verifyPassword,
} from "@/server/lib/auth-security";

// Usamos el entorno para configurar la seguridad de la cookie
const isProduction = process.env.NODE_ENV === "production";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    // 1. Validación estricta de entrada
    if (!email || !password || typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json({ error: "Email y contraseña son requeridos" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await findUserByEmail(normalizedEmail);

    // 2. Prevención de enumeración de usuarios y ataques de tiempo
    // Si el usuario no existe o no está activo, igual verificamos una contraseña falsa
    // para que un atacante no sepa si falló el email o el password por el tiempo de respuesta.
    const isValidPassword = user 
      ? verifyPassword(password, user.passwordHash) 
      : false;

    if (!user || !user.isActive || !isValidPassword) {
      return NextResponse.json(
        { error: "Credenciales inválidas o cuenta desactivada" }, 
        { status: 401 }
      );
    }

    // 3. Generación de Sesión
    const token = createSessionToken();
    const tokenHash = hashSessionToken(token);
    const expiresAtIso = getSessionExpiresAtIso();

    await createSession(user.id, tokenHash, expiresAtIso);

    // 4. Construcción de la respuesta
    const response = NextResponse.json({
      success: true,
      user: { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
    });

    // 5. Configuración de Cookie Segura
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true, // Crucial: evita que JS acceda al token (previene XSS)
      path: "/",
      secure: isProduction, // Solo enviar por HTTPS en producción
      sameSite: "lax", // Balance entre seguridad y usabilidad
      expires: new Date(expiresAtIso),
    });

    return response;

  } catch (error) {
    // No revelamos detalles del error al cliente por seguridad
    console.error("❌ Login Error:", error);
    return NextResponse.json(
      { error: "Ocurrió un error inesperado en el servidor" }, 
      { status: 500 }
    );
  }
}