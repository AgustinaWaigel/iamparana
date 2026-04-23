// Ruta de sesión actual: permite al frontend saber quién está logueado.
import { NextResponse } from "next/server";
import { getSessionUserByTokenHash } from "@/server/db/auth-repository";
import { AUTH_COOKIE_NAME, hashSessionToken } from "@/server/lib/auth-security";

function getCookieValue(cookieHeader: string, name: string) {
  const parts = cookieHeader.split(";").map((value) => value.trim());
  const match = parts.find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

export async function GET(req: Request) {
  try {
    const cookieHeader = req.headers.get("cookie") ?? "";
    const token = getCookieValue(cookieHeader, AUTH_COOKIE_NAME);
    if (!token) {
      return NextResponse.json(null, { status: 401 });
    }

    const sessionUser = await getSessionUserByTokenHash(hashSessionToken(token));
    if (!sessionUser || !sessionUser.isActive) {
      return NextResponse.json(null, { status: 401 });
    }

    return NextResponse.json({
      id: sessionUser.id,
      email: sessionUser.email,
      nombre: sessionUser.nombre || "Usuario",
      role: sessionUser.role,
      isActive: sessionUser.isActive,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
