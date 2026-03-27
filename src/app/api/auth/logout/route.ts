import { NextResponse } from "next/server";
import { cookies } from "next/headers"; // Usamos el helper oficial de Next.js
import { deleteSessionByTokenHash } from "@/db/auth-repository";
import { AUTH_COOKIE_NAME, hashSessionToken } from "@/lib/auth-security";

export async function POST() {
  try {
    // 1. Obtener el token directamente usando el helper de cookies de Next.js
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    // 2. Si hay token, invalidamos la sesión en Turso
    if (token) {
      const tokenHash = hashSessionToken(token);
      await deleteSessionByTokenHash(tokenHash);
    }

    // 3. Crear la respuesta y limpiar la cookie
    const response = NextResponse.json({ 
      success: true,
      message: "Sesión cerrada correctamente" 
    });

    // 4. Borrar la cookie de forma segura
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Solo HTTPS en producción
      sameSite: "lax",
      path: "/",
      maxAge: 0, // Expira inmediatamente
    });

    return response;
  } catch (error) {
    console.error("❌ Logout error:", error);
    return NextResponse.json(
      { error: "No se pudo cerrar la sesión correctamente" }, 
      { status: 500 }
    );
  }
}